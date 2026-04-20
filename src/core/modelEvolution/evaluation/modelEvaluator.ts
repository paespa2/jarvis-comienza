/**
 * MODEL EVALUATOR
 *
 * Evalúa la calidad de modelos y compara mejoras
 * contra línea base y generaciones anteriores.
 */

import {
  ModelVariant,
  ModelEvaluationResult,
  TrainingDataPoint,
} from '../modelTypes';
import { v4 as uuidv4 } from 'uuid';

export interface EvaluationMetrics {
  latency: number; // ms
  qualityScore: number; // 0-100
  costPerRequest: number; // USD
  accuracy: number; // 0-1
  robustness: number; // 0-1
  throughput: number; // requests/second
}

export interface EvaluationReport {
  evaluationId: string;
  modelId: string;
  timestamp: number;
  metrics: EvaluationMetrics;
  comparisonWithBase?: {
    latencyImprovement: number; // %
    qualityImprovement: number; // %
    costImprovement: number; // %
    overallImprovement: number; // % (weighted average)
  };
  comparisonWithPrevious?: {
    modelName: string;
    latencyImprovement: number; // %
    qualityImprovement: number; // %
    overallImprovement: number; // %
  };
  recommendations: string[];
  readyForProduction: boolean;
  confidenceScore: number; // 0-1
}

export class ModelEvaluator {
  private evaluationHistory: Map<string, EvaluationReport[]> = new Map();

  // Métricas base para comparación
  private baselineMetrics: EvaluationMetrics = {
    latency: 500,
    qualityScore: 75,
    costPerRequest: 0.003,
    accuracy: 0.75,
    robustness: 0.85,
    throughput: 2,
  };

  /**
   * EVALUAR MODELO
   */
  evaluateModel(
    model: ModelVariant,
    testDataset: TrainingDataPoint[],
    previousGeneration?: ModelVariant
  ): EvaluationReport {
    console.log(`\n📊 EVALUANDO MODELO: ${model.name}`);

    const evaluationId = `eval-${uuidv4()}`;
    const timestamp = Date.now();

    // Calcular métricas
    const metrics = this.calculateMetrics(model, testDataset);

    // Comparación con baseline
    const comparisonWithBase = this.compareWithBaseline(metrics);

    // Comparación con generación anterior
    let comparisonWithPrevious = undefined;
    if (previousGeneration) {
      comparisonWithPrevious = this.compareWithPrevious(
        metrics,
        previousGeneration.metrics,
        previousGeneration.name
      );
    }

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(
      metrics,
      comparisonWithBase,
      testDataset
    );

    // Determinar si está listo para producción
    const readyForProduction = this.isReadyForProduction(
      metrics,
      comparisonWithBase
    );

    // Calcular confianza
    const confidenceScore = this.calculateConfidence(metrics, testDataset.length);

    const report: EvaluationReport = {
      evaluationId,
      modelId: model.id,
      timestamp,
      metrics,
      comparisonWithBase,
      comparisonWithPrevious,
      recommendations,
      readyForProduction,
      confidenceScore,
    };

    // Guardar en historial
    if (!this.evaluationHistory.has(model.id)) {
      this.evaluationHistory.set(model.id, []);
    }
    this.evaluationHistory.get(model.id)!.push(report);

    this.printEvaluationReport(report);

    return report;
  }

  /**
   * CALCULAR MÉTRICAS
   */
  private calculateMetrics(
    model: ModelVariant,
    testDataset: TrainingDataPoint[]
  ): EvaluationMetrics {
    // Latencia: se extrae del modelo o se calcula
    const latency = model.metrics.averageLatency || 450;

    // Quality score: promedio del dataset de prueba
    const qualityScore = testDataset.length > 0
      ? (testDataset.reduce((sum, dp) => sum + dp.qualityScore, 0) / testDataset.length)
      : 75;

    // Costo por request: se extrae del modelo
    const costPerRequest = model.metrics.costPerRequest || 0.0025;

    // Accuracy: basado en calidad y éxitos
    const accuracy = Math.min(1, (qualityScore / 100) * 0.95 + 0.05);

    // Robustness: basado en success rate
    const robustness = Math.min(1, model.metrics.successRate * 0.9 + 0.1);

    // Throughput: simulado basado en latencia
    const throughput = Math.max(0.5, 1000 / latency);

    return {
      latency,
      qualityScore: Math.min(100, qualityScore),
      costPerRequest,
      accuracy,
      robustness,
      throughput,
    };
  }

  /**
   * COMPARAR CON BASELINE
   */
  private compareWithBaseline(metrics: EvaluationMetrics): {
    latencyImprovement: number;
    qualityImprovement: number;
    costImprovement: number;
    overallImprovement: number;
  } {
    const latencyImprovement =
      ((this.baselineMetrics.latency - metrics.latency) /
        this.baselineMetrics.latency) *
      100;

    const qualityImprovement =
      ((metrics.qualityScore - this.baselineMetrics.qualityScore) /
        this.baselineMetrics.qualityScore) *
      100;

    const costImprovement =
      ((this.baselineMetrics.costPerRequest - metrics.costPerRequest) /
        this.baselineMetrics.costPerRequest) *
      100;

    // Promedio ponderado: 40% latencia, 40% quality, 20% costo
    const overallImprovement =
      latencyImprovement * 0.4 +
      qualityImprovement * 0.4 +
      costImprovement * 0.2;

    return {
      latencyImprovement: Math.round(latencyImprovement),
      qualityImprovement: Math.round(qualityImprovement),
      costImprovement: Math.round(costImprovement),
      overallImprovement: Math.round(overallImprovement),
    };
  }

  /**
   * COMPARAR CON GENERACIÓN ANTERIOR
   */
  private compareWithPrevious(
    currentMetrics: EvaluationMetrics,
    previousMetrics: any,
    previousName: string
  ): {
    modelName: string;
    latencyImprovement: number;
    qualityImprovement: number;
    overallImprovement: number;
  } {
    const previousLatency = previousMetrics.averageLatency || 500;
    const previousQuality = previousMetrics.qualityScore || 75;

    const latencyImprovement =
      ((previousLatency - currentMetrics.latency) / previousLatency) * 100;

    const qualityImprovement =
      ((currentMetrics.qualityScore - previousQuality) / previousQuality) * 100;

    const overallImprovement =
      (latencyImprovement * 0.5 + qualityImprovement * 0.5);

    return {
      modelName: previousName,
      latencyImprovement: Math.round(latencyImprovement),
      qualityImprovement: Math.round(qualityImprovement),
      overallImprovement: Math.round(overallImprovement),
    };
  }

  /**
   * GENERAR RECOMENDACIONES
   */
  private generateRecommendations(
    metrics: EvaluationMetrics,
    comparison: any,
    testDataset: TrainingDataPoint[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en latencia
    if (metrics.latency > 1000) {
      recommendations.push(
        '⚡ Latencia alta detectada - considera usar quantization o destilación'
      );
    } else if (metrics.latency < 200) {
      recommendations.push('🚀 Excelente latencia - modelo muy eficiente');
    }

    // Recomendaciones basadas en quality
    if (metrics.qualityScore < 70) {
      recommendations.push(
        '📈 Quality score bajo - necesita más entrenamiento o mejores datos'
      );
    } else if (metrics.qualityScore > 90) {
      recommendations.push('🎯 Excelente calidad - listo para producción');
    }

    // Recomendaciones basadas en costo
    if (metrics.costPerRequest > 0.003) {
      recommendations.push('💰 Costo elevado - optimizar para mejor relación precio/rendimiento');
    }

    // Recomendaciones basadas en comparación
    if (comparison.overallImprovement > 15) {
      recommendations.push('✅ Mejora significativa sobre baseline - desplegar');
    } else if (comparison.overallImprovement < 0) {
      recommendations.push('⚠️ No mejoró vs baseline - revisar entrenamiento');
    }

    // Recomendaciones basadas en dataset
    if (testDataset.length < 50) {
      recommendations.push(
        '📊 Dataset de prueba pequeño - aumentar para mayor confianza'
      );
    }

    // Recomendaciones de robustness
    if (metrics.robustness < 0.8) {
      recommendations.push(
        '🛡️ Robustness baja - entrenar con más casos edge'
      );
    }

    return recommendations;
  }

  /**
   * ¿ESTÁ LISTO PARA PRODUCCIÓN?
   */
  private isReadyForProduction(
    metrics: EvaluationMetrics,
    comparison: any
  ): boolean {
    // Criterios para producción:
    // 1. Quality score >= 80
    // 2. Latencia <= 1000ms
    // 3. Robustness >= 0.85
    // 4. Mejora >= 5% vs baseline O quality >= 85

    const qualityOk = metrics.qualityScore >= 80;
    const latencyOk = metrics.latency <= 1000;
    const robustnessOk = metrics.robustness >= 0.85;
    const improvementOk = comparison.overallImprovement >= 5 || metrics.qualityScore >= 85;

    return qualityOk && latencyOk && robustnessOk && improvementOk;
  }

  /**
   * CALCULAR SCORE DE CONFIANZA
   */
  private calculateConfidence(metrics: EvaluationMetrics, datasetSize: number): number {
    // Basado en:
    // - Quality score (0.4 peso)
    // - Dataset size (0.3 peso)
    // - Robustness (0.3 peso)

    const qualityConfidence = Math.min(1, metrics.qualityScore / 100);
    const datasetConfidence = Math.min(1, datasetSize / 200); // Confianza máxima con 200+ ejemplos
    const robustnessConfidence = metrics.robustness;

    return (
      qualityConfidence * 0.4 +
      datasetConfidence * 0.3 +
      robustnessConfidence * 0.3
    );
  }

  /**
   * IMPRIMIR REPORTE DE EVALUACIÓN
   */
  private printEvaluationReport(report: EvaluationReport): void {
    console.log(`\n   📋 EVALUATION RESULTS`);
    console.log(`      Evaluation ID: ${report.evaluationId.slice(0, 12)}...`);
    console.log(`      Quality Score: ${report.metrics.qualityScore.toFixed(1)}/100`);
    console.log(`      Latency: ${report.metrics.latency.toFixed(0)}ms`);
    console.log(`      Accuracy: ${(report.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`      Robustness: ${(report.metrics.robustness * 100).toFixed(1)}%`);
    console.log(`      Cost/Request: $${report.metrics.costPerRequest.toFixed(4)}`);

    if (report.comparisonWithBase) {
      console.log(`\n   📊 VS BASELINE`);
      console.log(
        `      Overall: ${report.comparisonWithBase.overallImprovement > 0 ? '+' : ''}${report.comparisonWithBase.overallImprovement}%`
      );
      console.log(
        `      Quality: ${report.comparisonWithBase.qualityImprovement > 0 ? '+' : ''}${report.comparisonWithBase.qualityImprovement}%`
      );
      console.log(
        `      Latency: ${report.comparisonWithBase.latencyImprovement > 0 ? '+' : ''}${report.comparisonWithBase.latencyImprovement}%`
      );
    }

    console.log(
      `\n   ${report.readyForProduction ? '✅' : '⚠️'} Production Ready: ${report.readyForProduction}`
    );
    console.log(`   🎯 Confidence: ${(report.confidenceScore * 100).toFixed(0)}%`);

    if (report.recommendations.length > 0) {
      console.log(`\n   💡 Recommendations:`);
      report.recommendations.forEach(rec => console.log(`      - ${rec}`));
    }
  }

  /**
   * OBTENER HISTORIAL DE EVALUACIONES
   */
  getEvaluationHistory(modelId: string): EvaluationReport[] {
    return this.evaluationHistory.get(modelId) || [];
  }

  /**
   * OBTENER ÚLTIMA EVALUACIÓN
   */
  getLatestEvaluation(modelId: string): EvaluationReport | undefined {
    const history = this.evaluationHistory.get(modelId);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  /**
   * COMPARAR MÚLTIPLES MODELOS
   */
  compareModels(
    models: ModelVariant[],
    testDataset: TrainingDataPoint[]
  ): {
    bestModel: ModelVariant;
    rankings: Array<{ model: ModelVariant; score: number }>;
    differences: string[];
  } {
    const results = models.map(model => ({
      model,
      report: this.evaluateModel(model, testDataset),
    }));

    // Calcular score overall para cada modelo
    const rankings = results
      .map(({ model, report }) => ({
        model,
        score:
          (report.metrics.qualityScore / 100) * 0.4 +
          Math.min(1, 500 / report.metrics.latency) * 0.3 +
          report.metrics.robustness * 0.3,
      }))
      .sort((a, b) => b.score - a.score);

    const bestModel = rankings[0].model;

    const differences = results
      .slice(0, Math.min(2, results.length))
      .map((_, i) => {
        if (i === 0) return '';
        const r1 = results[0].report;
        const r2 = results[i].report;
        return `${results[i].model.name}: ${((r1.metrics.qualityScore - r2.metrics.qualityScore) / r2.metrics.qualityScore * 100).toFixed(1)}% quality difference`;
      })
      .filter(d => d);

    return {
      bestModel,
      rankings,
      differences,
    };
  }

  /**
   * OBTENER ESTADÍSTICAS GLOBALES
   */
  getGlobalStatistics() {
    const allReports = Array.from(this.evaluationHistory.values()).flat();

    if (allReports.length === 0) {
      return {
        totalEvaluations: 0,
        modelsEvaluated: 0,
        averageQuality: 0,
        averageLatency: 0,
        productionReadyModels: 0,
      };
    }

    return {
      totalEvaluations: allReports.length,
      modelsEvaluated: this.evaluationHistory.size,
      averageQuality:
        allReports.reduce((sum, r) => sum + r.metrics.qualityScore, 0) /
        allReports.length,
      averageLatency:
        allReports.reduce((sum, r) => sum + r.metrics.latency, 0) /
        allReports.length,
      productionReadyModels: allReports.filter(r => r.readyForProduction)
        .length,
    };
  }
}
