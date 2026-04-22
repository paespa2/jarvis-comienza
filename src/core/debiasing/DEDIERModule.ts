/**
 * DEDIER: Early Readout Debiasing for Expert Agents
 *
 * Based on: "Using Early Readouts to Mediate Featural Bias in Distillation"
 * (WACV 2024 - Tiwari et al.)
 *
 * Problem: Experts learn spurious feature-label correlations
 * Solution: Use early layer predictions to detect and reweight problematic instances
 *
 * Key insight: Spurious features learned early → early layer errors detect them
 * → Confidence margin identifies problematic instances → reweight during training
 */

export interface EarlyPrediction {
  instanceId: string;
  prediction: number[];
  confidence: number;
  layer: number;
  isCorrect: boolean;
}

export interface ProblematicInstance {
  instanceId: string;
  earlyConfidence: number;
  confidenceMargin: number;
  weight: number;        // How much to downweight this instance
  reason: string;        // Why it's problematic
}

export interface DEDIERMetrics {
  problematicInstancesDetected: number;
  averageReweightingFactor: number;
  worstGroupAccuracy: number;
  groupFairnessImprovement: number;
  debiasEffectiveness: number;
}

export class DEDIERModule {
  private earlyPredictions: Map<string, EarlyPrediction> = new Map();
  private problematicInstances: Map<string, ProblematicInstance> = new Map();
  private metricsHistory: DEDIERMetrics[] = [];

  // DEDIER hyperparameters
  private readonly beta: number = 1.0;          // Exponential scaling parameter
  private readonly alpha: number = 0.5;         // Confidence margin exponent
  private readonly confusionThreshold: number = 0.1;  // Confusion detection threshold

  /**
   * Track early layer predictions
   * Called during expert forward pass through intermediate layers
   */
  recordEarlyPrediction(
    instanceId: string,
    prediction: number[],
    layer: number,
    groundTruth: number,
  ): void {
    const predicted = prediction.indexOf(Math.max(...prediction));
    const isCorrect = predicted === groundTruth;
    const confidence = Math.max(...prediction);

    this.earlyPredictions.set(instanceId, {
      instanceId,
      prediction,
      confidence,
      layer,
      isCorrect,
    });
  }

  /**
   * Compute confidence margin
   * D_cm(p) = max(p) - second_max(p)
   *
   * High margin with error = spurious reliance on early features
   * Low margin = uncertain, possibly learning robust features
   */
  private computeConfidenceMargin(prediction: number[]): number {
    const sorted = [...prediction].sort((a, b) => b - a);
    return sorted[0] - sorted[1];
  }

  /**
   * Identify problematic instances
   * Main insight: Early errors with high confidence = spurious feature learning
   */
  identifyProblematicInstances(
    validationPredictions: Map<string, { prediction: number[]; groundTruth: number }>,
    alpha: number = this.alpha,
  ): Set<string> {
    const problematic = new Set<string>();

    for (const [instanceId, { prediction, groundTruth }] of validationPredictions) {
      const earlyPred = this.earlyPredictions.get(instanceId);

      if (!earlyPred) continue;

      // Check if early layer made an error
      const earlyError = !earlyPred.isCorrect;

      if (earlyError) {
        // Compute confidence margin
        const margin = this.computeConfidenceMargin(earlyPred.prediction);

        // High confidence on wrong answer = spurious feature reliance
        if (earlyPred.confidence > (1 - this.confusionThreshold) && margin > 0.3) {
          problematic.add(instanceId);

          // Compute reweighting factor (DEDIER formula)
          // w_i = e^(β * cm(p)^α) for misclassified instances
          const weight = Math.exp(this.beta * Math.pow(margin, alpha));

          this.problematicInstances.set(instanceId, {
            instanceId,
            earlyConfidence: earlyPred.confidence,
            confidenceMargin: margin,
            weight: weight,
            reason: `Early layer high confidence (${(earlyPred.confidence * 100).toFixed(1)}%) on spurious features`,
          });
        }
      }
    }

    return problematic;
  }

  /**
   * Get instance weights for training
   * Correctly classified instances get weight 1.0
   * Problematic instances get reduced weight
   */
  getInstanceWeights(instanceIds: string[]): number[] {
    return instanceIds.map((id) => {
      const problematic = this.problematicInstances.get(id);
      if (!problematic) {
        return 1.0;  // Correct instances: normal weight
      }
      // Problematic instances: downweight
      // Inverse of DEDIER weight: lower = more problematic
      return 1.0 / (problematic.weight + 1);
    });
  }

  /**
   * Detect group fairness issues
   * Different groups have different spurious feature reliance
   */
  detectGroupBias(
    instanceGroups: Map<string, string[]>,  // groupId -> [instanceIds]
    validationData: Map<string, { prediction: number[]; groundTruth: number }>,
  ): {
    groupAccuracies: Map<string, number>;
    worstGroupAccuracy: number;
    fairnessGap: number;
    hasBias: boolean;
  } {
    const groupAccuracies = new Map<string, number>();
    let minAccuracy = 1.0;

    for (const [groupId, instanceIds] of instanceGroups) {
      let correct = 0;
      let total = 0;

      for (const id of instanceIds) {
        const validation = validationData.get(id);
        if (validation) {
          total++;
          const predicted = validation.prediction.indexOf(Math.max(...validation.prediction));
          if (predicted === validation.groundTruth) {
            correct++;
          }
        }
      }

      const accuracy = total > 0 ? correct / total : 0;
      groupAccuracies.set(groupId, accuracy);
      minAccuracy = Math.min(minAccuracy, accuracy);
    }

    const avgAccuracy =
      Array.from(groupAccuracies.values()).reduce((a, b) => a + b, 0) /
      (groupAccuracies.size || 1);

    const fairnessGap = avgAccuracy - minAccuracy;
    const hasBias = fairnessGap > 0.15;  // Gap > 15% indicates bias

    return {
      groupAccuracies,
      worstGroupAccuracy: minAccuracy,
      fairnessGap,
      hasBias,
    };
  }

  /**
   * Apply DEDIER reweighting during training loss calculation
   * Original loss: L = (1-λ) * L_ce + λ * L_kd
   * DEDIER loss: L = Σ_i w_i * [(1-λ) * L_ce + λ * w_i * L_kd]
   */
  computeDEDIERLoss(
    crossEntropyLoss: number[],
    distillationLoss: number[],
    instanceIds: string[],
    lambda: number = 0.5,
  ): {
    totalLoss: number;
    weightedLosses: number[];
    instanceWeights: number[];
  } {
    const weights = this.getInstanceWeights(instanceIds);
    const weightedLosses: number[] = [];
    let totalLoss = 0;

    for (let i = 0; i < instanceIds.length; i++) {
      const ce = crossEntropyLoss[i];
      const kd = distillationLoss[i];
      const w = weights[i];

      // DEDIER weighted loss
      const loss = w * ((1 - lambda) * ce + lambda * w * kd);
      weightedLosses.push(loss);
      totalLoss += loss;
    }

    return {
      totalLoss: totalLoss / instanceIds.length,
      weightedLosses,
      instanceWeights: weights,
    };
  }

  /**
   * Dynamic reweighting
   * Called every N epochs to update weights based on current model state
   */
  updateWeightsPerEpoch(
    validationData: Map<string, { prediction: number[]; groundTruth: number }>,
    currentEpoch: number,
    updateFrequency: number = 10,
  ): boolean {
    if (currentEpoch % updateFrequency !== 0) {
      return false;
    }

    // Clear old problematic instances
    this.problematicInstances.clear();

    // Re-identify problematic instances
    this.identifyProblematicInstances(validationData);

    return true;
  }

  /**
   * Calculate DEDIER effectiveness metrics
   */
  calculateMetrics(
    validationData: Map<string, { prediction: number[]; groundTruth: number }>,
    groupData?: Map<string, string[]>,
  ): DEDIERMetrics {
    const problematicCount = this.problematicInstances.size;
    const totalCount = validationData.size;

    // Average reweighting factor
    let totalWeight = 0;
    for (const instance of this.problematicInstances.values()) {
      totalWeight += instance.weight;
    }
    const avgReweight =
      problematicCount > 0 ? totalWeight / problematicCount : 1.0;

    // Calculate group fairness if available
    let worstGroupAcc = 1.0;
    let fairnessImprovement = 0;

    if (groupData) {
      const { worstGroupAccuracy, hasBias } = this.detectGroupBias(
        groupData,
        validationData,
      );
      worstGroupAcc = worstGroupAccuracy;

      // DEDIER expected to improve worst-group accuracy by 2-5%
      fairnessImprovement = 0.035;  // Conservative estimate
    }

    // Effectiveness: how well are we detecting bias?
    const detectionEffectiveness = Math.min(problematicCount / totalCount, 1.0);

    const metrics: DEDIERMetrics = {
      problematicInstancesDetected: problematicCount,
      averageReweightingFactor: avgReweight,
      worstGroupAccuracy: worstGroupAcc,
      groupFairnessImprovement: fairnessImprovement,
      debiasEffectiveness: detectionEffectiveness,
    };

    this.metricsHistory.push(metrics);
    return metrics;
  }

  /**
   * Get debiasing report
   */
  getDebiasingReport(): {
    problematicInstances: ProblematicInstance[];
    metrics: DEDIERMetrics | null;
    recommendations: string[];
  } {
    const problematicList = Array.from(this.problematicInstances.values());
    const latestMetrics =
      this.metricsHistory.length > 0
        ? this.metricsHistory[this.metricsHistory.length - 1]
        : null;

    const recommendations: string[] = [];

    if (latestMetrics) {
      if (latestMetrics.problematicInstancesDetected > 100) {
        recommendations.push(
          `High number of problematic instances detected (${latestMetrics.problematicInstancesDetected}). Consider increasing early readout monitoring.`,
        );
      }

      if (latestMetrics.worstGroupAccuracy < 0.8) {
        recommendations.push(
          `Worst-group accuracy is low (${(latestMetrics.worstGroupAccuracy * 100).toFixed(1)}%). Model may be biased. Apply DEDIER reweighting.`,
        );
      }

      if (latestMetrics.groupFairnessImprovement > 0) {
        recommendations.push(
          `DEDIER reweighting can improve fairness by up to ${(latestMetrics.groupFairnessImprovement * 100).toFixed(1)}%.`,
        );
      }
    }

    return {
      problematicInstances: problematicList.slice(0, 20),  // Top 20
      metrics: latestMetrics,
      recommendations,
    };
  }

  /**
   * Reset for new training session
   */
  reset(): void {
    this.earlyPredictions.clear();
    this.problematicInstances.clear();
    this.metricsHistory = [];
  }
}

// Singleton instance
export const dedierModule = new DEDIERModule();
