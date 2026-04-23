/**
 * JARVIS MULTI-CLASS EVALUATION ENGINE
 *
 * Extends auto-evaluation to multiple dimensions using multi-class classification.
 * Instead of just binary (success/fail), evaluates across multiple quality aspects:
 * - Response clarity (poor, fair, good, excellent)
 * - Relevance (irrelevant, somewhat-relevant, relevant, highly-relevant)
 * - Coherence (incoherent, poor, good, excellent)
 * - Completeness (incomplete, partial, complete, comprehensive)
 * - Emotional appropriateness (inappropriate, neutral, appropriate, excellent)
 *
 * Uses OvR (One-vs-Rest) and multinomial approaches for multi-dimensional assessment.
 */

export enum ResponseQuality {
  POOR = 0,
  FAIR = 1,
  GOOD = 2,
  EXCELLENT = 3
}

export enum RelevanceScore {
  IRRELEVANT = 0,
  SOMEWHAT_RELEVANT = 1,
  RELEVANT = 2,
  HIGHLY_RELEVANT = 3
}

export enum CoherenceLevel {
  INCOHERENT = 0,
  POOR = 1,
  GOOD = 2,
  EXCELLENT = 3
}

export enum CompletenessLevel {
  INCOMPLETE = 0,
  PARTIAL = 1,
  COMPLETE = 2,
  COMPREHENSIVE = 3
}

export enum EmotionalAppropriate {
  INAPPROPRIATE = 0,
  NEUTRAL = 1,
  APPROPRIATE = 2,
  EXCELLENT = 3
}

export interface MultiClassPrediction {
  timestamp: number;
  userQuery: string;
  jarvisResponse: string;
  intent: string;
  emotion: string;

  // Predicted classes (what Jarvis predicted)
  predictedQuality: ResponseQuality;
  predictedRelevance: RelevanceScore;
  predictedCoherence: CoherenceLevel;
  predictedCompleteness: CompletenessLevel;
  predictedEmotional: EmotionalAppropriate;

  // Actual classes (ground truth from evaluation)
  actualQuality: ResponseQuality;
  actualRelevance: RelevanceScore;
  actualCoherence: CoherenceLevel;
  actualCompleteness: CompletenessLevel;
  actualEmotional: EmotionalAppropriate;

  // Confidence in each dimension (0-1)
  confidenceScores: {
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
    emotional: number;
  };
}

export interface MultiClassConfusionMatrix {
  dimension: string; // "quality", "relevance", "coherence", etc.
  matrix: number[][]; // 4x4 matrix for 4-class classification
  accuracy: number;
  precision: number[];
  recall: number[];
  f1Scores: number[];
}

export interface MultiDimensionalDiagnosis {
  timestamp: number;
  totalEvaluations: number;

  // Per-dimension analysis
  qualityAnalysis: MultiClassConfusionMatrix;
  relevanceAnalysis: MultiClassConfusionMatrix;
  coherenceAnalysis: MultiClassConfusionMatrix;
  completenessAnalysis: MultiClassConfusionMatrix;
  emotionalAnalysis: MultiClassConfusionMatrix;

  // Overall metrics
  overallAccuracy: number;
  dimensionHealthScores: {
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
    emotional: number;
  };

  // Strengths and weaknesses
  strengthDimensions: string[];
  weakDimensions: string[];
  focusAreas: Array<{ dimension: string; currentScore: number; target: number; recommendations: string[] }>;

  // Overall health
  overallHealthScore: number;
  readyForProduction: boolean;
}

export class JarvisMultiClassEvaluationEngine {
  private predictions: MultiClassPrediction[] = [];
  private dimensionPerformance: Map<string, number[][]> = new Map(); // Confusion matrices per dimension

  constructor() {
    console.log("🎯 [JarvisMultiClassEvaluationEngine] Initialized for multi-dimensional evaluation");
    this.initializeDimensions();
  }

  /**
   * Initialize dimension tracking
   */
  private initializeDimensions(): void {
    const dimensions = ['quality', 'relevance', 'coherence', 'completeness', 'emotional'];
    for (const dim of dimensions) {
      this.dimensionPerformance.set(dim, this.createEmptyConfusionMatrix(4));
    }
  }

  /**
   * Create empty 4x4 confusion matrix
   */
  private createEmptyConfusionMatrix(classes: number): number[][] {
    return Array(classes)
      .fill(null)
      .map(() => Array(classes).fill(0));
  }

  /**
   * Record a multi-class prediction
   */
  recordPrediction(prediction: MultiClassPrediction): void {
    this.predictions.push(prediction);

    // Update confusion matrices
    const predictionArray = [
      { name: 'quality', predicted: prediction.predictedQuality, actual: prediction.actualQuality },
      { name: 'relevance', predicted: prediction.predictedRelevance, actual: prediction.actualRelevance },
      { name: 'coherence', predicted: prediction.predictedCoherence, actual: prediction.actualCoherence },
      { name: 'completeness', predicted: prediction.predictedCompleteness, actual: prediction.actualCompleteness },
      { name: 'emotional', predicted: prediction.predictedEmotional, actual: prediction.actualEmotional }
    ];

    for (const pred of predictionArray) {
      const matrix = this.dimensionPerformance.get(pred.name)!;
      matrix[pred.actual][pred.predicted]++;
    }

    // Prune old predictions
    if (this.predictions.length > 500) {
      this.predictions = this.predictions.slice(-500);
    }
  }

  /**
   * Calculate metrics for a confusion matrix
   */
  private calculateMatrixMetrics(matrix: number[][]): {
    accuracy: number;
    precision: number[];
    recall: number[];
    f1Scores: number[];
  } {
    const numClasses = matrix.length;
    const precision: number[] = [];
    const recall: number[] = [];
    const f1Scores: number[] = [];

    let totalCorrect = 0;
    let total = 0;

    // Calculate per-class metrics
    for (let i = 0; i < numClasses; i++) {
      // True positives
      const tp = matrix[i][i];

      // False positives (predicted as i, but were something else)
      let fp = 0;
      for (let j = 0; j < numClasses; j++) {
        if (j !== i) {
          fp += matrix[j][i];
        }
      }

      // False negatives (actually i, but predicted as something else)
      let fn = 0;
      for (let j = 0; j < numClasses; j++) {
        if (j !== i) {
          fn += matrix[i][j];
        }
      }

      // Calculate metrics
      const classRecall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const classPrecision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const classF1 = classRecall + classPrecision > 0 ? (2 * classRecall * classPrecision) / (classRecall + classPrecision) : 0;

      recall.push(classRecall);
      precision.push(classPrecision);
      f1Scores.push(classF1);

      totalCorrect += tp;
    }

    // Calculate total
    for (const row of matrix) {
      total += row.reduce((a, b) => a + b, 0);
    }

    const accuracy = total > 0 ? totalCorrect / total : 0;

    return { accuracy, precision, recall, f1Scores };
  }

  /**
   * Perform comprehensive multi-dimensional diagnosis
   */
  performMultiDimensionalDiagnosis(): MultiDimensionalDiagnosis {
    const analyses: MultiClassConfusionMatrix[] = [];
    const dimensionNames = ['quality', 'relevance', 'coherence', 'completeness', 'emotional'];
    const healthScores: Record<string, number> = {};

    for (const dim of dimensionNames) {
      const matrix = this.dimensionPerformance.get(dim)!;
      const metrics = this.calculateMatrixMetrics(matrix);
      const avgRecall = metrics.recall.reduce((a, b) => a + b, 0) / metrics.recall.length;

      analyses.push({
        dimension: dim,
        matrix,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Scores: metrics.f1Scores
      });

      healthScores[dim] = metrics.accuracy;
    }

    // Identify strong and weak dimensions
    const sortedByScore = dimensionNames.sort((a, b) => healthScores[b] - healthScores[a]);
    const strengthDimensions = sortedByScore.slice(0, 2);
    const weakDimensions = sortedByScore.slice(-2);

    // Calculate overall metrics
    const overallAccuracy = Object.values(healthScores).reduce((a, b) => a + b, 0) / dimensionNames.length;

    // Generate focus areas
    const focusAreas = weakDimensions.map(dim => ({
      dimension: dim,
      currentScore: healthScores[dim],
      target: 0.85,
      recommendations: this.generateDimensionRecommendations(dim, healthScores[dim])
    }));

    // Overall health
    const overallHealthScore = Math.min(overallAccuracy, 1);
    const readyForProduction = overallHealthScore >= 0.8 && healthScores['quality'] >= 0.8;

    return {
      timestamp: Date.now(),
      totalEvaluations: this.predictions.length,
      qualityAnalysis: analyses[0],
      relevanceAnalysis: analyses[1],
      coherenceAnalysis: analyses[2],
      completenessAnalysis: analyses[3],
      emotionalAnalysis: analyses[4],
      overallAccuracy,
      dimensionHealthScores: healthScores as any,
      strengthDimensions,
      weakDimensions,
      focusAreas,
      overallHealthScore,
      readyForProduction
    };
  }

  /**
   * Generate recommendations for a dimension
   */
  private generateDimensionRecommendations(dimension: string, currentScore: number): string[] {
    const recommendations: string[] = [];

    if (currentScore < 0.5) {
      recommendations.push(`CRITICAL: ${dimension} performance is very low (${(currentScore * 100).toFixed(0)}%)`);
      recommendations.push(`Focus on improving ${dimension} in all interactions`);
      recommendations.push(`Review failed ${dimension} classifications for patterns`);
    } else if (currentScore < 0.7) {
      recommendations.push(`${dimension} needs improvement (${(currentScore * 100).toFixed(0)}%)`);
      recommendations.push(`Target: increase ${dimension} to 0.85 or higher`);
    } else if (currentScore < 0.85) {
      recommendations.push(`${dimension} is on track (${(currentScore * 100).toFixed(0)}%)`);
      recommendations.push(`Continue refining ${dimension} quality`);
    } else {
      recommendations.push(`✅ ${dimension} is performing well (${(currentScore * 100).toFixed(0)}%)`);
    }

    return recommendations;
  }

  /**
   * Print detailed multi-dimensional diagnosis report
   */
  printMultiDimensionalReport(): void {
    const diagnosis = this.performMultiDimensionalDiagnosis();

    console.log("\n" + "=".repeat(80));
    console.log("🎯 JARVIS MULTI-DIMENSIONAL EVALUATION REPORT");
    console.log("=".repeat(80));

    console.log(`\n📊 DIMENSIONAL HEALTH SCORES:`);
    for (const [dim, score] of Object.entries(diagnosis.dimensionHealthScores)) {
      const bars = '█'.repeat(Math.round(score * 20));
      const empty = '░'.repeat(20 - Math.round(score * 20));
      console.log(`   ${dim.padEnd(15)} ${bars}${empty} ${(score * 100).toFixed(0)}%`);
    }

    console.log(`\n✅ STRENGTHS: ${diagnosis.strengthDimensions.join(", ")}`);
    console.log(`❌ AREAS TO IMPROVE: ${diagnosis.weakDimensions.join(", ")}`);

    console.log(`\n🎯 FOCUS AREAS:`);
    for (const focus of diagnosis.focusAreas) {
      console.log(`\n   ${focus.dimension} (${(focus.currentScore * 100).toFixed(0)}% → target ${(focus.target * 100).toFixed(0)}%)`);
      for (const rec of focus.recommendations) {
        console.log(`      • ${rec}`);
      }
    }

    console.log(`\n💪 OVERALL HEALTH: ${(diagnosis.overallHealthScore * 100).toFixed(0)}/100`);
    console.log(`${diagnosis.readyForProduction ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS IMPROVEMENT BEFORE PRODUCTION'}`);

    console.log("\n" + "=".repeat(80) + "\n");
  }

  /**
   * Get summary for use in responses
   */
  getMultiDimensionalSummary(): string {
    const diagnosis = this.performMultiDimensionalDiagnosis();

    let summary = `Multi-Dimensional Performance Analysis:\n`;
    summary += `• Quality: ${(diagnosis.dimensionHealthScores.quality * 100).toFixed(0)}%\n`;
    summary += `• Relevance: ${(diagnosis.dimensionHealthScores.relevance * 100).toFixed(0)}%\n`;
    summary += `• Coherence: ${(diagnosis.dimensionHealthScores.coherence * 100).toFixed(0)}%\n`;
    summary += `• Completeness: ${(diagnosis.dimensionHealthScores.completeness * 100).toFixed(0)}%\n`;
    summary += `• Emotional Appropriateness: ${(diagnosis.dimensionHealthScores.emotional * 100).toFixed(0)}%\n`;
    summary += `• Overall: ${(diagnosis.overallHealthScore * 100).toFixed(0)}/100\n`;

    if (diagnosis.strengthDimensions.length > 0) {
      summary += `\nStrengths: ${diagnosis.strengthDimensions.join(", ")}\n`;
    }

    if (diagnosis.weakDimensions.length > 0) {
      summary += `Focus areas: ${diagnosis.weakDimensions.join(", ")}\n`;
    }

    return summary;
  }

  /**
   * Export all analysis data
   */
  exportAnalysis() {
    return {
      predictions: this.predictions,
      diagnosis: this.performMultiDimensionalDiagnosis()
    };
  }
}

// Export singleton
export const jarvisMultiClassEvaluationEngine = new JarvisMultiClassEvaluationEngine();
