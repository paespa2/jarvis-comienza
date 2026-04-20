/**
 * COST ANALYZER
 *
 * Analiza costos de API y calcula ahorros
 * de usar modelo personalizado vs modelo base.
 */

import { ModelVariant, CostAnalysis, TrainingDataPoint } from '../modelTypes';
import { v4 as uuidv4 } from 'uuid';

export interface CostBreakdown {
  baseModel: {
    calls: number;
    costPerCall: number;
    totalCost: number;
  };
  personalizedModel: {
    calls: number;
    costPerCall: number;
    totalCost: number;
  };
  training: {
    dataPoints: number;
    costPerPoint: number;
    totalCost: number;
  };
  savings: {
    amountUSD: number;
    percentageReduction: number;
  };
  paybackPeriod: number; // días
}

export interface CostProjection {
  period: string; // "daily", "weekly", "monthly", "yearly"
  baseModelCost: number;
  personalizedModelCost: number;
  trainingCost: number;
  totalSavings: number;
  roi: number; // Return on Investment %
  breakEvenDays: number;
}

export class CostAnalyzer {
  private analysisHistory: Map<string, CostAnalysis[]> = new Map();

  // Costos estándar
  private apiCosts = {
    claude_base: {
      inputToken: 0.003 / 1000, // $0.003 por 1K tokens
      outputToken: 0.015 / 1000, // $0.015 por 1K tokens
    },
    claude_personalized: {
      inputToken: 0.0015 / 1000, // 50% menos
      outputToken: 0.0075 / 1000, // 50% menos
    },
    training: {
      perDataPoint: 0.0001, // $0.0001 por punto de datos
    },
  };

  /**
   * ANALIZAR COSTOS COMPLETOS
   */
  analyzeCosts(
    baseModel: ModelVariant,
    personalizedModel: ModelVariant | null,
    trainingData: TrainingDataPoint[],
    projectionPeriod: 'day' | 'week' | 'month' = 'month'
  ): CostAnalysis {
    console.log(`\n💰 ANALIZANDO COSTOS`);

    const analysisId = `cost-${uuidv4()}`;
    const now = Date.now();
    const startDate = now - this.getPeriodInMs(projectionPeriod);

    // Calcular API calls esperadas
    const expectedCallsPerPeriod = this.estimateAPICalls(
      trainingData,
      projectionPeriod
    );

    // Calcular costo del modelo base
    const baseModelCost = this.calculateModelCost(
      baseModel,
      expectedCallsPerPeriod,
      'base'
    );

    // Calcular costo del modelo personalizado
    const personalizedModelCost = personalizedModel
      ? this.calculateModelCost(
        personalizedModel,
        expectedCallsPerPeriod,
        'personalized'
      )
      : 0;

    // Calcular costo de entrenamiento
    const trainingCost = trainingData.length * this.apiCosts.training.perDataPoint;

    // Calcular ahorros
    const savings = {
      amountUSD: Math.max(0, baseModelCost - personalizedModelCost - trainingCost),
      percentageReduction:
        baseModelCost > 0
          ? ((baseModelCost - personalizedModelCost - trainingCost) /
            baseModelCost) *
          100
          : 0,
    };

    // Calcular período de recuperación
    const dailyTrainingCost = trainingCost / (projectionPeriod === 'day' ? 1 : projectionPeriod === 'week' ? 7 : 30);
    const dailySavings = (savings.amountUSD / (projectionPeriod === 'day' ? 1 : projectionPeriod === 'week' ? 7 : 30));
    const paybackPeriod = dailyTrainingCost > 0 ? dailyTrainingCost / dailySavings : 0;

    const analysis: CostAnalysis = {
      period: {
        startDate,
        endDate: now,
      },
      apiCalls: {
        baseModel: {
          count: expectedCallsPerPeriod,
          costUSD: baseModelCost,
        },
        personalizedModel: {
          count: expectedCallsPerPeriod,
          costUSD: personalizedModelCost,
        },
      },
      savings,
      tradeoffs: {
        latencyImprovement: personalizedModel
          ? personalizedModel.metrics.averageLatency > 0
            ? ((baseModel.metrics.averageLatency -
              personalizedModel.metrics.averageLatency) /
              baseModel.metrics.averageLatency) *
            100
            : 0
          : 0,
        qualityDelta: personalizedModel
          ? ((personalizedModel.metrics.qualityScore -
            baseModel.metrics.qualityScore) /
            baseModel.metrics.qualityScore) *
          100
          : 0,
      },
    };

    // Guardar en historial
    if (!this.analysisHistory.has(baseModel.id)) {
      this.analysisHistory.set(baseModel.id, []);
    }
    this.analysisHistory.get(baseModel.id)!.push(analysis);

    this.printCostAnalysis(analysis);

    return analysis;
  }

  /**
   * PROYECTAR COSTOS A FUTURO
   */
  projectCosts(
    baseModel: ModelVariant,
    personalizedModel: ModelVariant,
    trainingData: TrainingDataPoint[],
    periods: ('day' | 'week' | 'month' | 'year')[] = ['month', 'year']
  ): CostProjection[] {
    const projections: CostProjection[] = [];

    periods.forEach(period => {
      const expectedCalls = this.estimateAPICalls(trainingData, period);

      const baseModelCost = this.calculateModelCost(baseModel, expectedCalls, 'base');
      const personalizedModelCost = this.calculateModelCost(
        personalizedModel,
        expectedCalls,
        'personalized'
      );
      const trainingCost = trainingData.length * this.apiCosts.training.perDataPoint;

      // Amortizar costo de entrenamiento en primer mes
      const amortizedTrainingCost = period === 'month' || period === 'day' ? trainingCost : trainingCost;

      const totalSavings = Math.max(
        0,
        baseModelCost - personalizedModelCost - amortizedTrainingCost
      );

      const roi = baseModelCost > 0 ? (totalSavings / baseModelCost) * 100 : 0;

      // Calcular días para recuperar inversión
      const dailyBaseModelCost = baseModelCost / this.getDaysInPeriod(period);
      const dailyPersonalizedCost = personalizedModelCost / this.getDaysInPeriod(period);
      const dailyTrainingCost = amortizedTrainingCost / this.getDaysInPeriod(period);

      const breakEvenDays =
        dailyPersonalizedCost + dailyTrainingCost > 0
          ? Math.ceil(
            dailyTrainingCost / (dailyBaseModelCost - dailyPersonalizedCost - dailyTrainingCost)
          )
          : 0;

      projections.push({
        period: this.getPeriodName(period),
        baseModelCost,
        personalizedModelCost,
        trainingCost: amortizedTrainingCost,
        totalSavings,
        roi,
        breakEvenDays: Math.max(0, breakEvenDays),
      });
    });

    return projections;
  }

  /**
   * CALCULAR COSTO DEL MODELO
   */
  private calculateModelCost(
    model: ModelVariant,
    expectedCalls: number,
    type: 'base' | 'personalized'
  ): number {
    // Usar costo conocido del modelo si está disponible
    if (model.metrics.costPerRequest > 0) {
      return model.metrics.costPerRequest * expectedCalls;
    }

    // Sino, estimar basado en tokens promedio
    const avgInputTokens = 500; // tokens de entrada promedio
    const avgOutputTokens = 300; // tokens de salida promedio

    const costs =
      type === 'base'
        ? this.apiCosts.claude_base
        : this.apiCosts.claude_personalized;

    const costPerCall =
      avgInputTokens * costs.inputToken +
      avgOutputTokens * costs.outputToken;

    return costPerCall * expectedCalls;
  }

  /**
   * ESTIMAR LLAMADAS API
   */
  private estimateAPICalls(
    trainingData: TrainingDataPoint[],
    period: 'day' | 'week' | 'month' | 'year'
  ): number {
    // Basado en la cantidad de datos, estimar cuántas llamadas se hicieron
    const avgCallsPerDataPoint = 1.5; // 1-2 llamadas por punto de datos
    const dataPointsInPeriod = trainingData.length;

    // Ajustar por período
    const daysInPeriod = this.getDaysInPeriod(period);
    const callsPerDay = (dataPointsInPeriod / daysInPeriod) * avgCallsPerDataPoint;

    return Math.ceil(callsPerDay * daysInPeriod);
  }

  /**
   * OBTENER DÍAS EN PERÍODO
   */
  private getDaysInPeriod(period: 'day' | 'week' | 'month' | 'year'): number {
    switch (period) {
      case 'day':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 365;
      default:
        return 1;
    }
  }

  /**
   * OBTENER PERÍODO EN MS
   */
  private getPeriodInMs(
    period: 'day' | 'week' | 'month' | 'year'
  ): number {
    return this.getDaysInPeriod(period) * 24 * 60 * 60 * 1000;
  }

  /**
   * OBTENER NOMBRE DEL PERÍODO
   */
  private getPeriodName(
    period: 'day' | 'week' | 'month' | 'year'
  ): string {
    switch (period) {
      case 'day':
        return 'daily';
      case 'week':
        return 'weekly';
      case 'month':
        return 'monthly';
      case 'year':
        return 'yearly';
      default:
        return period;
    }
  }

  /**
   * COMPARAR COST-BENEFIT
   */
  compareCostBenefit(
    analysis: CostAnalysis,
    qualityImprovement: number, // %
    latencyImprovement: number // %
  ): {
    roi: number; // Return on Investment
    costPerQualityImprovement: number;
    costPerLatencyImprovement: number;
    recommendation: string;
  } {
    const totalCost = analysis.apiCalls.personalizedModel.costUSD;
    const savings = analysis.savings.amountUSD;

    const roi = (savings / (totalCost + 0.0001)) * 100; // +0.0001 para evitar división por cero

    const costPerQualityImprovement =
      qualityImprovement > 0
        ? totalCost / qualityImprovement
        : Infinity;

    const costPerLatencyImprovement =
      latencyImprovement > 0
        ? totalCost / latencyImprovement
        : Infinity;

    let recommendation = '';

    if (roi > 50) {
      recommendation = `✅ Excelente ROI (${roi.toFixed(0)}%). Desplegar personalizado inmediatamente.`;
    } else if (roi > 20) {
      recommendation = `✓ Buen ROI (${roi.toFixed(0)}%). Considera desplegar personalizado.`;
    } else if (roi > 0) {
      recommendation = `⚠️ ROI moderado (${roi.toFixed(0)}%). Esperar más mejoras antes de desplegar.`;
    } else {
      recommendation = `❌ ROI negativo. No desplegar. Mantener modelo base.`;
    }

    return {
      roi,
      costPerQualityImprovement,
      costPerLatencyImprovement,
      recommendation,
    };
  }

  /**
   * IMPRIMIR ANÁLISIS DE COSTOS
   */
  private printCostAnalysis(analysis: CostAnalysis): void {
    console.log(`\n   💸 COST BREAKDOWN`);
    console.log(`      Base Model API Calls: ${analysis.apiCalls.baseModel.count}`);
    console.log(
      `      Base Model Cost: $${analysis.apiCalls.baseModel.costUSD.toFixed(4)}`
    );
    console.log(`      Personalized Model Cost: $${analysis.apiCalls.personalizedModel.costUSD.toFixed(4)}`);
    console.log('');
    console.log(`   💰 SAVINGS`);
    console.log(`      Amount: $${analysis.savings.amountUSD.toFixed(4)}`);
    console.log(`      Reduction: ${analysis.savings.percentageReduction.toFixed(1)}%`);
    console.log('');
    console.log(`   📊 TRADEOFFS`);
    console.log(`      Latency Improvement: ${analysis.tradeoffs.latencyImprovement.toFixed(1)}%`);
    console.log(`      Quality Delta: ${analysis.tradeoffs.qualityDelta > 0 ? '+' : ''}${analysis.tradeoffs.qualityDelta.toFixed(1)}%`);
  }

  /**
   * OBTENER HISTORIAL DE ANÁLISIS
   */
  getAnalysisHistory(modelId: string): CostAnalysis[] {
    return this.analysisHistory.get(modelId) || [];
  }

  /**
   * OBTENER ÚLTIMA ANÁLISIS
   */
  getLatestAnalysis(modelId: string): CostAnalysis | undefined {
    const history = this.analysisHistory.get(modelId);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  /**
   * OBTENER ESTADÍSTICAS GLOBALES DE COSTOS
   */
  getGlobalCostStatistics() {
    const allAnalyses = Array.from(this.analysisHistory.values()).flat();

    if (allAnalyses.length === 0) {
      return {
        totalSavings: 0,
        averageSavingsPercent: 0,
        totalTrainingCost: 0,
        paybackPeriodDays: 0,
      };
    }

    const totalSavings = allAnalyses.reduce((sum, a) => sum + a.savings.amountUSD, 0);
    const avgSavingsPercent =
      allAnalyses.reduce((sum, a) => sum + a.savings.percentageReduction, 0) /
      allAnalyses.length;

    return {
      totalSavings,
      averageSavingsPercent: avgSavingsPercent,
      totalTrainingCost: allAnalyses.reduce(
        (sum, a) =>
          sum +
          Math.max(0, a.apiCalls.baseModel.costUSD - a.apiCalls.personalizedModel.costUSD - a.savings.amountUSD),
        0
      ),
      paybackPeriodDays: 30, // aproximado
    };
  }
}
