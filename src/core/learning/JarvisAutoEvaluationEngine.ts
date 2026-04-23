/**
 * JARVIS AUTO-EVALUATION ENGINE
 *
 * Uses binary classification metrics to evaluate Jarvis's own performance.
 * Implements confusion matrix, precision, recall, F1 score, and AUC analysis.
 *
 * Allows Jarvis to understand itself and identify improvement opportunities.
 */

export interface PredictionResult {
  timestamp: number;
  userQuery: string;
  jarvisResponse: string;
  predictedClass: 0 | 1; // 0 = failed, 1 = successful
  actualClass: 0 | 1; // Ground truth from user feedback/satisfaction
  confidence: number; // 0-1 probability
  intent: string;
  emotion: string;
}

export interface ConfusionMatrix {
  trueNegatives: number; // ŷ=0, y=0 (correctly predicted failure)
  falsePositives: number; // ŷ=1, y=0 (predicted success but failed)
  falseNegatives: number; // ŷ=0, y=1 (predicted failure but succeeded)
  truePositives: number; // ŷ=1, y=1 (correctly predicted success)
}

export interface BinaryClassificationMetrics {
  accuracy: number; // (TP + TN) / Total
  precision: number; // TP / (TP + FP) - of predicted successes, how many were right?
  recall: number; // TP / (TP + FN) - of actual successes, how many did we find?
  f1Score: number; // 2 * (precision * recall) / (precision + recall)
  truePositiveRate: number; // recall (sensitivity)
  falsePositiveRate: number; // FP / (FP + TN)
  auc: number; // Area Under the ROC Curve (0-1)
}

export interface JarvisSelfDiagnosis {
  timestamp: number;
  totalPredictions: number;
  confusionMatrix: ConfusionMatrix;
  metrics: BinaryClassificationMetrics;
  strongAreas: Array<{ intent: string; successRate: number }>;
  weakAreas: Array<{ intent: string; successRate: number; recommendations: string[] }>;
  overallHealthScore: number; // 0-1
  actionItems: string[];
}

export class JarvisAutoEvaluationEngine {
  private predictions: PredictionResult[] = [];
  private intentPerformance: Map<string, { successes: number; total: number }> = new Map();
  private emotionPerformance: Map<string, { successes: number; total: number }> = new Map();

  constructor() {
    console.log("🔍 [JarvisAutoEvaluationEngine] Initialized");
  }

  /**
   * Record a prediction with its actual outcome
   */
  recordPrediction(result: PredictionResult): void {
    this.predictions.push(result);

    // Track by intent
    if (!this.intentPerformance.has(result.intent)) {
      this.intentPerformance.set(result.intent, { successes: 0, total: 0 });
    }
    const intentStats = this.intentPerformance.get(result.intent)!;
    intentStats.total++;
    if (result.actualClass === 1) intentStats.successes++;

    // Track by emotion
    if (!this.emotionPerformance.has(result.emotion)) {
      this.emotionPerformance.set(result.emotion, { successes: 0, total: 0 });
    }
    const emotionStats = this.emotionPerformance.get(result.emotion)!;
    emotionStats.total++;
    if (result.actualClass === 1) emotionStats.successes++;

    // Keep only recent predictions in memory (last 1000)
    if (this.predictions.length > 1000) {
      this.predictions = this.predictions.slice(-1000);
    }
  }

  /**
   * Calculate confusion matrix from predictions
   */
  private calculateConfusionMatrix(predictions: PredictionResult[] = this.predictions): ConfusionMatrix {
    const matrix: ConfusionMatrix = {
      trueNegatives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      truePositives: 0
    };

    for (const pred of predictions) {
      if (pred.predictedClass === 0 && pred.actualClass === 0) {
        matrix.trueNegatives++;
      } else if (pred.predictedClass === 1 && pred.actualClass === 0) {
        matrix.falsePositives++;
      } else if (pred.predictedClass === 0 && pred.actualClass === 1) {
        matrix.falseNegatives++;
      } else if (pred.predictedClass === 1 && pred.actualClass === 1) {
        matrix.truePositives++;
      }
    }

    return matrix;
  }

  /**
   * Calculate binary classification metrics
   */
  private calculateMetrics(confusionMatrix: ConfusionMatrix): BinaryClassificationMetrics {
    const { trueNegatives: tn, falsePositives: fp, falseNegatives: fn, truePositives: tp } = confusionMatrix;
    const total = tn + fp + fn + tp;

    // Accuracy
    const accuracy = total > 0 ? (tp + tn) / total : 0;

    // Precision: of predicted positives, how many were correct?
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;

    // Recall (TPR): of actual positives, how many did we identify?
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    // F1 Score: harmonic mean of precision and recall
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // True Positive Rate (same as recall)
    const tpr = recall;

    // False Positive Rate: of actual negatives, how many did we incorrectly classify?
    const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;

    // AUC (Area Under Curve) - simplified calculation
    // In reality, this requires ROC curve, but we approximate based on TPR and FPR
    const auc = 0.5 + (tpr - fpr) / 2; // Rough approximation

    return {
      accuracy: Math.min(accuracy, 1),
      precision: Math.min(precision, 1),
      recall: Math.min(recall, 1),
      f1Score: Math.min(f1Score, 1),
      truePositiveRate: Math.min(tpr, 1),
      falsePositiveRate: Math.min(fpr, 1),
      auc: Math.min(Math.max(auc, 0), 1)
    };
  }

  /**
   * Identify strong areas (intents/emotions where Jarvis performs well)
   */
  private identifyStrongAreas(): Array<{ intent: string; successRate: number }> {
    const areas: Array<{ intent: string; successRate: number }> = [];

    for (const [intent, stats] of this.intentPerformance.entries()) {
      if (stats.total >= 3) {
        const successRate = stats.successes / stats.total;
        if (successRate >= 0.75) {
          areas.push({ intent, successRate });
        }
      }
    }

    return areas.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Identify weak areas needing improvement
   */
  private identifyWeakAreas(): Array<{ intent: string; successRate: number; recommendations: string[] }> {
    const areas: Array<{ intent: string; successRate: number; recommendations: string[] }> = [];

    for (const [intent, stats] of this.intentPerformance.entries()) {
      if (stats.total >= 3) {
        const successRate = stats.successes / stats.total;
        if (successRate < 0.7) {
          const recommendations = this.generateRecommendations(intent, successRate, stats.total);
          areas.push({ intent, successRate, recommendations });
        }
      }
    }

    return areas.sort((a, b) => a.successRate - b.successRate);
  }

  /**
   * Generate specific improvement recommendations
   */
  private generateRecommendations(intent: string, successRate: number, totalAttempts: number): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.3) {
      recommendations.push(`CRITICAL: ${intent} has very low success (${(successRate * 100).toFixed(0)}%)`);
      recommendations.push(`Gather more training data for ${intent} scenarios`);
      recommendations.push(`Review failed responses to identify systematic errors`);
    } else if (successRate < 0.5) {
      recommendations.push(`${intent} needs significant improvement (${(successRate * 100).toFixed(0)}%)`);
      recommendations.push(`Analyze patterns in failed ${intent} responses`);
      recommendations.push(`Consider different response strategies`);
    } else if (successRate < 0.7) {
      recommendations.push(`${intent} is below target (${(successRate * 100).toFixed(0)}%)`);
      recommendations.push(`Collect feedback on borderline ${intent} responses`);
    }

    if (totalAttempts < 10) {
      recommendations.push(`Need more ${intent} examples for reliable evaluation`);
    }

    return recommendations;
  }

  /**
   * Calculate overall health score (0-1)
   */
  private calculateHealthScore(metrics: BinaryClassificationMetrics): number {
    // Weight different metrics
    const weights = {
      accuracy: 0.2,
      precision: 0.3,
      recall: 0.25,
      f1Score: 0.25
    };

    const score =
      metrics.accuracy * weights.accuracy +
      metrics.precision * weights.precision +
      metrics.recall * weights.recall +
      metrics.f1Score * weights.f1Score;

    return Math.min(score, 1);
  }

  /**
   * Perform comprehensive self-diagnosis
   */
  performSelfDiagnosis(): JarvisSelfDiagnosis {
    const confusionMatrix = this.calculateConfusionMatrix();
    const metrics = this.calculateMetrics(confusionMatrix);
    const strongAreas = this.identifyStrongAreas();
    const weakAreas = this.identifyWeakAreas();
    const healthScore = this.calculateHealthScore(metrics);

    // Generate action items
    const actionItems: string[] = [];

    if (metrics.f1Score < 0.7) {
      actionItems.push("⚠️ F1 Score below target - focus on balanced precision/recall");
    }
    if (metrics.precision < 0.6) {
      actionItems.push("❌ Precision is low - reduce false positives (over-confident predictions)");
    }
    if (metrics.recall < 0.6) {
      actionItems.push("❌ Recall is low - improve detection of successful patterns");
    }
    if (weakAreas.length > 0) {
      actionItems.push(`🔧 Address ${weakAreas.length} weak intent areas`);
    }
    if (healthScore > 0.85) {
      actionItems.push("✅ Overall performance is strong - maintain current strategies");
    }

    return {
      timestamp: Date.now(),
      totalPredictions: this.predictions.length,
      confusionMatrix,
      metrics,
      strongAreas,
      weakAreas,
      overallHealthScore: healthScore,
      actionItems
    };
  }

  /**
   * Print detailed self-diagnosis report
   */
  printSelfDiagnosisReport(): void {
    const diagnosis = this.performSelfDiagnosis();

    console.log("\n" + "=".repeat(70));
    console.log("🔍 JARVIS SELF-DIAGNOSIS REPORT");
    console.log("=".repeat(70));

    console.log(`\n📊 CONFUSION MATRIX:`);
    console.log(`   True Negatives (correct failures): ${diagnosis.confusionMatrix.trueNegatives}`);
    console.log(`   False Positives (wrong successes): ${diagnosis.confusionMatrix.falsePositives}`);
    console.log(`   False Negatives (missed successes): ${diagnosis.confusionMatrix.falseNegatives}`);
    console.log(`   True Positives (correct successes): ${diagnosis.confusionMatrix.truePositives}`);

    console.log(`\n📈 PERFORMANCE METRICS:`);
    console.log(`   Accuracy:  ${(diagnosis.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`   Precision: ${(diagnosis.metrics.precision * 100).toFixed(1)}%`);
    console.log(`   Recall:    ${(diagnosis.metrics.recall * 100).toFixed(1)}%`);
    console.log(`   F1 Score:  ${diagnosis.metrics.f1Score.toFixed(3)}`);
    console.log(`   AUC:       ${diagnosis.metrics.auc.toFixed(3)}`);

    console.log(`\n✅ STRONG AREAS (${diagnosis.strongAreas.length}):`);
    for (const area of diagnosis.strongAreas) {
      console.log(`   • ${area.intent}: ${(area.successRate * 100).toFixed(0)}% success rate`);
    }

    if (diagnosis.weakAreas.length > 0) {
      console.log(`\n❌ WEAK AREAS (${diagnosis.weakAreas.length}):`);
      for (const area of diagnosis.weakAreas) {
        console.log(`   • ${area.intent}: ${(area.successRate * 100).toFixed(0)}% success rate`);
        for (const rec of area.recommendations) {
          console.log(`     → ${rec}`);
        }
      }
    }

    console.log(`\n💪 OVERALL HEALTH SCORE: ${(diagnosis.overallHealthScore * 100).toFixed(1)}/100`);

    console.log(`\n🎯 ACTION ITEMS:`);
    for (const item of diagnosis.actionItems) {
      console.log(`   ${item}`);
    }

    console.log("\n" + "=".repeat(70) + "\n");
  }

  /**
   * Get diagnosis summary for use in responses
   */
  getDiagnosisSummary(): string {
    const diagnosis = this.performSelfDiagnosis();

    let summary = `Performance Analysis:\n`;
    summary += `• Accuracy: ${(diagnosis.metrics.accuracy * 100).toFixed(0)}%\n`;
    summary += `• Precision: ${(diagnosis.metrics.precision * 100).toFixed(0)}%\n`;
    summary += `• Recall: ${(diagnosis.metrics.recall * 100).toFixed(0)}%\n`;
    summary += `• F1 Score: ${diagnosis.metrics.f1Score.toFixed(2)}\n`;
    summary += `• Health Score: ${(diagnosis.overallHealthScore * 100).toFixed(0)}/100\n`;

    if (diagnosis.strongAreas.length > 0) {
      summary += `\nStrengths: ${diagnosis.strongAreas.map(a => a.intent).join(", ")}\n`;
    }

    if (diagnosis.weakAreas.length > 0) {
      summary += `Areas for improvement: ${diagnosis.weakAreas.map(a => a.intent).join(", ")}\n`;
    }

    return summary;
  }

  /**
   * Get analysis for specific intent
   */
  analyzeIntent(intent: string): {
    successRate: number;
    totalAttempts: number;
    analysis: string;
  } {
    const stats = this.intentPerformance.get(intent);
    if (!stats) {
      return {
        successRate: 0,
        totalAttempts: 0,
        analysis: `No data available for intent: ${intent}`
      };
    }

    const successRate = stats.successes / stats.total;
    let analysis = `Intent: ${intent}\n`;
    analysis += `Success Rate: ${(successRate * 100).toFixed(0)}%\n`;
    analysis += `Total Attempts: ${stats.total}\n`;

    if (successRate >= 0.8) {
      analysis += `Status: Excellent - maintain current approach`;
    } else if (successRate >= 0.6) {
      analysis += `Status: Good - minor improvements needed`;
    } else if (successRate >= 0.4) {
      analysis += `Status: Fair - significant improvements needed`;
    } else {
      analysis += `Status: Poor - requires major strategy change`;
    }

    return {
      successRate,
      totalAttempts: stats.total,
      analysis
    };
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    predictions: PredictionResult[];
    metrics: BinaryClassificationMetrics;
    diagnosis: JarvisSelfDiagnosis;
  } {
    const diagnosis = this.performSelfDiagnosis();
    return {
      predictions: this.predictions,
      metrics: diagnosis.metrics,
      diagnosis
    };
  }

  /**
   * Clear old predictions (keep only last N)
   */
  pruneOldPredictions(keepLast: number = 500): void {
    if (this.predictions.length > keepLast) {
      this.predictions = this.predictions.slice(-keepLast);
    }
  }
}

// Export singleton
export const jarvisAutoEvaluationEngine = new JarvisAutoEvaluationEngine();
