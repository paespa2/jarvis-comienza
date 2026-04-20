/**
 * MODEL OPTIMIZER
 *
 * Analiza datos de entrenamiento y propone optimizaciones
 * antes del fine-tuning del modelo personalizado.
 */

import { TrainingDataPoint } from '../modelTypes';

export interface OptimizationTarget {
  metric: 'latency' | 'quality' | 'cost' | 'accuracy';
  currentValue: number;
  targetValue: number;
  importance: number; // 1-10
  description: string;
}

export interface OptimizationStrategy {
  id: string;
  targets: OptimizationTarget[];
  recommendedApproach: string;
  expectedImprovement: number; // %
  difficulty: 'easy' | 'moderate' | 'hard';
  estimatedTimeToImplement: number; // hours
  priority: number; // 1-10
}

export interface DatasetAnalysis {
  totalDataPoints: number;
  byCategory: Map<string, number>;
  averageQuality: number;
  qualityDistribution: {
    excellent: number; // >= 90
    good: number; // 80-89
    acceptable: number; // 70-79
    poor: number; // < 70
  };
  byComplexity: {
    simple: number;
    moderate: number;
    complex: number;
  };
  averageLatency: number;
  latencyBottlenecks: string[]; // Categorías más lentas
  commonPatterns: string[];
  gaps: string[]; // Categorías con pocos datos
}

export class ModelOptimizer {
  private analysisCache: Map<string, DatasetAnalysis> = new Map();

  /**
   * ANALIZAR DATASET COMPLETO
   */
  analyzeDataset(trainingData: TrainingDataPoint[]): DatasetAnalysis {
    if (trainingData.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Verificar si ya está en caché
    const cacheKey = `analysis-${trainingData.length}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    console.log(`\n📊 ANALIZANDO DATASET (${trainingData.length} puntos)`);

    // Análisis por categoría
    const byCategory = new Map<string, number>();
    trainingData.forEach(dp => {
      byCategory.set(
        dp.taskCategory,
        (byCategory.get(dp.taskCategory) || 0) + 1
      );
    });

    // Análisis de calidad
    const avgQuality =
      trainingData.reduce((sum, dp) => sum + dp.qualityScore, 0) /
      trainingData.length;

    const qualityDistribution = {
      excellent: trainingData.filter(dp => dp.qualityScore >= 90).length,
      good: trainingData.filter(
        dp => dp.qualityScore >= 80 && dp.qualityScore < 90
      ).length,
      acceptable: trainingData.filter(
        dp => dp.qualityScore >= 70 && dp.qualityScore < 80
      ).length,
      poor: trainingData.filter(dp => dp.qualityScore < 70).length,
    };

    // Análisis por complejidad
    const byComplexity = {
      simple: trainingData.filter(dp => dp.complexity === 'simple').length,
      moderate: trainingData.filter(dp => dp.complexity === 'moderate').length,
      complex: trainingData.filter(dp => dp.complexity === 'complex').length,
    };

    // Latencia promedio
    const avgLatency =
      trainingData.reduce((sum, dp) => sum + dp.executionTime, 0) /
      trainingData.length;

    // Identificar cuellos de botella en latencia
    const latencyByCategory = new Map<string, number[]>();
    trainingData.forEach(dp => {
      if (!latencyByCategory.has(dp.taskCategory)) {
        latencyByCategory.set(dp.taskCategory, []);
      }
      latencyByCategory.get(dp.taskCategory)!.push(dp.executionTime);
    });

    const latencyBottlenecks: string[] = [];
    latencyByCategory.forEach((latencies, category) => {
      const avgCatLatency =
        latencies.reduce((a, b) => a + b, 0) / latencies.length;
      if (avgCatLatency > avgLatency * 1.5) {
        latencyBottlenecks.push(
          `${category} (${avgCatLatency.toFixed(0)}ms vs avg ${avgLatency.toFixed(0)}ms)`
        );
      }
    });

    // Patrones comunes
    const commonPatterns = this.extractCommonPatterns(trainingData);

    // Identificar brechas (categorías con pocos datos)
    const gaps: string[] = [];
    byCategory.forEach((count, category) => {
      if (count < 5) {
        gaps.push(`${category} (solo ${count} ejemplos)`);
      }
    });

    const analysis: DatasetAnalysis = {
      totalDataPoints: trainingData.length,
      byCategory,
      averageQuality: avgQuality,
      qualityDistribution,
      byComplexity,
      averageLatency: avgLatency,
      latencyBottlenecks,
      commonPatterns,
      gaps,
    };

    this.analysisCache.set(cacheKey, analysis);
    this.printAnalysis(analysis);

    return analysis;
  }

  /**
   * EXTRAER PATRONES COMUNES
   */
  private extractCommonPatterns(trainingData: TrainingDataPoint[]): string[] {
    const patterns: string[] = [];

    // Patrón: Tareas exitosas con latencia baja
    const fastSuccesses = trainingData.filter(
      dp => dp.executionTime < 1000 && dp.qualityScore > 80
    ).length;
    if (fastSuccesses > trainingData.length * 0.3) {
      patterns.push(
        `✅ ${((fastSuccesses / trainingData.length) * 100).toFixed(0)}% tareas rápidas y de calidad`
      );
    }

    // Patrón: Tareas que requieren múltiples iteraciones
    const highIterations = trainingData.filter(
      dp => dp.iterationsUsed > 4
    ).length;
    if (highIterations > 0) {
      patterns.push(
        `🔄 ${((highIterations / trainingData.length) * 100).toFixed(0)}% tareas complejas (iteraciones > 4)`
      );
    }

    // Patrón: Agentes más utilizados
    const agentUsage = new Map<string, number>();
    trainingData.forEach(dp => {
      agentUsage.set(dp.agentUsed, (agentUsage.get(dp.agentUsed) || 0) + 1);
    });

    const topAgents = Array.from(agentUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([agent, count]) => `${agent} (${count}x)`);

    if (topAgents.length > 0) {
      patterns.push(`👨‍💼 Agentes principales: ${topAgents.join(', ')}`);
    }

    // Patrón: Herramientas más frecuentes
    const toolUsage = new Map<string, number>();
    trainingData.forEach(dp => {
      dp.toolsUsed.forEach(tool => {
        toolUsage.set(tool, (toolUsage.get(tool) || 0) + 1);
      });
    });

    const topTools = Array.from(toolUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tool, count]) => `${tool} (${count}x)`);

    if (topTools.length > 0) {
      patterns.push(`🔧 Herramientas principales: ${topTools.join(', ')}`);
    }

    return patterns;
  }

  /**
   * GENERAR ESTRATEGIA DE OPTIMIZACIÓN
   */
  generateOptimizationStrategy(
    analysis: DatasetAnalysis
  ): OptimizationStrategy {
    const targets: OptimizationTarget[] = [];

    // Objetivo 1: Mejorar Latencia si es muy alta
    if (analysis.averageLatency > 3000) {
      targets.push({
        metric: 'latency',
        currentValue: analysis.averageLatency,
        targetValue: analysis.averageLatency * 0.75, // Reducir 25%
        importance: 8,
        description: `Reducir latencia de ${analysis.averageLatency.toFixed(0)}ms a ${(analysis.averageLatency * 0.75).toFixed(0)}ms`,
      });
    }

    // Objetivo 2: Mejorar Calidad
    if (analysis.averageQuality < 85) {
      targets.push({
        metric: 'quality',
        currentValue: analysis.averageQuality,
        targetValue: 90,
        importance: 10,
        description: `Mejorar calidad de ${analysis.averageQuality.toFixed(1)} a 90`,
      });
    }

    // Objetivo 3: Cubrir brechas de datos
    if (analysis.gaps.length > 0) {
      targets.push({
        metric: 'accuracy',
        currentValue: (
          (trainingData.length - analysis.gaps.length) / trainingData.length
        ).valueOf(),
        targetValue: 1.0,
        importance: 7,
        description: `Cubrir ${analysis.gaps.length} categorías con pocos datos`,
      });
    }

    // Objetivo 4: Reducir costos
    targets.push({
      metric: 'cost',
      currentValue: 100, // baseline
      targetValue: 85,
      importance: 5,
      description: 'Optimizar para reducir costo de inferencia en 15%',
    });

    // Determinar estrategia recomendada
    let recommendedApproach = '';
    let expectedImprovement = 0;
    let difficulty: 'easy' | 'moderate' | 'hard' = 'moderate';

    if (analysis.latencyBottlenecks.length > 0) {
      recommendedApproach = `Enfocarse en categorías lentes: ${analysis.latencyBottlenecks.slice(0, 2).join(', ')}. Usar destilación o cuantización para reducir tamaño del modelo.`;
      expectedImprovement = 20;
      difficulty = 'moderate';
    } else if (analysis.averageQuality < 80) {
      recommendedApproach =
        'Mejorar calidad con fine-tuning en datos de alta calidad. Enfatizar ejemplos con qualityScore > 85.';
      expectedImprovement = 15;
      difficulty = 'moderate';
    } else {
      recommendedApproach =
        'Mantener rendimiento actual con pequeños ajustes en el modelo base.';
      expectedImprovement = 5;
      difficulty = 'easy';
    }

    return {
      id: `opt-${Date.now()}`,
      targets,
      recommendedApproach,
      expectedImprovement,
      difficulty,
      estimatedTimeToImplement: difficulty === 'easy' ? 2 : difficulty === 'moderate' ? 6 : 12,
      priority: targets.reduce((sum, t) => sum + t.importance, 0) / Math.max(targets.length, 1),
    };
  }

  /**
   * COMPARAR DOS DATASETS
   */
  compareDatasets(
    dataset1: TrainingDataPoint[],
    dataset2: TrainingDataPoint[]
  ): {
    improvement: number; // %
    differences: string[];
  } {
    const analysis1 = this.analyzeDataset(dataset1);
    const analysis2 = this.analyzeDataset(dataset2);

    const qualityImprovement = analysis2.averageQuality - analysis1.averageQuality;
    const latencyImprovement = ((analysis1.averageLatency - analysis2.averageLatency) / analysis1.averageLatency) * 100;

    const differences: string[] = [];

    if (qualityImprovement > 0) {
      differences.push(`✅ Calidad mejorada: +${qualityImprovement.toFixed(2)} puntos`);
    }

    if (latencyImprovement > 0) {
      differences.push(`⚡ Latencia mejorada: -${latencyImprovement.toFixed(1)}%`);
    }

    if (dataset2.length > dataset1.length) {
      differences.push(
        `📈 Dataset expandido: ${dataset1.length} → ${dataset2.length} puntos`
      );
    }

    const avgImprovement = (qualityImprovement * 0.6 + latencyImprovement * 0.4);

    return {
      improvement: avgImprovement,
      differences,
    };
  }

  /**
   * IMPRIMIR ANÁLISIS
   */
  private printAnalysis(analysis: DatasetAnalysis): void {
    console.log(`   📊 Dataset Analysis:`);
    console.log(
      `      Total Points: ${analysis.totalDataPoints} (${Array.from(analysis.byCategory.values()).reduce((a, b) => a + b, 0)} categorías)`
    );
    console.log(
      `      Avg Quality: ${analysis.averageQuality.toFixed(1)}/100`
    );
    console.log(
      `      Quality Distribution: 🟢 ${analysis.qualityDistribution.excellent} | 🟡 ${analysis.qualityDistribution.good} | 🟠 ${analysis.qualityDistribution.acceptable} | 🔴 ${analysis.qualityDistribution.poor}`
    );
    console.log(
      `      Avg Latency: ${analysis.averageLatency.toFixed(0)}ms`
    );

    if (analysis.latencyBottlenecks.length > 0) {
      console.log(`      ⚠️  Latency bottlenecks: ${analysis.latencyBottlenecks.join(', ')}`);
    }

    if (analysis.gaps.length > 0) {
      console.log(`      📉 Data gaps: ${analysis.gaps.join(', ')}`);
    }

    console.log(`      📝 Patterns: ${analysis.commonPatterns.join(' | ')}`);
  }

  /**
   * RETORNAR ANÁLISIS VACÍO
   */
  private getEmptyAnalysis(): DatasetAnalysis {
    return {
      totalDataPoints: 0,
      byCategory: new Map(),
      averageQuality: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        acceptable: 0,
        poor: 0,
      },
      byComplexity: {
        simple: 0,
        moderate: 0,
        complex: 0,
      },
      averageLatency: 0,
      latencyBottlenecks: [],
      commonPatterns: [],
      gaps: [],
    };
  }

  /**
   * LIMPIAR CACHÉ
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}
