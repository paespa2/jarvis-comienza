/**
 * DATASET BUILDER
 *
 * Recopila datos de entrenamiento de ejecuciones exitosas de Jarvis.
 * Estos datos se usan para fine-tuning del modelo personalizado.
 */

import { TrainingDataPoint } from '../modelTypes';
import { v4 as uuidv4 } from 'uuid';

export class DatasetBuilder {
  private trainingData: Map<string, TrainingDataPoint> = new Map();
  private dataByCategory: Map<string, TrainingDataPoint[]> = new Map();
  private minQualityThreshold = 75; // Solo guardar datos con quality >= 75

  /**
   * REGISTRAR INTERACCIÓN EXITOSA
   *
   * Cuando Jarvis ejecuta exitosamente, capturar para entrenamiento.
   */
  captureSuccessfulInteraction(
    userQuery: string,
    context: any,
    agentUsed: string,
    toolsUsed: string[],
    response: string,
    executionTime: number,
    iterationsUsed: number,
    artifacts?: any[]
  ): TrainingDataPoint | null {
    // Calcular quality score
    const qualityScore = this.calculateQualityScore(
      response,
      executionTime,
      iterationsUsed,
      artifacts
    );

    // Solo guardar si supera threshold
    if (qualityScore < this.minQualityThreshold) {
      console.log(
        `⚠️  Interacción no capturada (quality ${qualityScore} < ${this.minQualityThreshold})`
      );
      return null;
    }

    // Inferir categoría y complejidad
    const taskCategory = this.inferCategory(userQuery);
    const complexity = this.inferComplexity(
      executionTime,
      iterationsUsed,
      userQuery
    );

    const dataPoint: TrainingDataPoint = {
      id: `td-${uuidv4()}`,
      timestamp: Date.now(),
      userQuery,
      context,
      agentUsed,
      toolsUsed,
      executionTime,
      iterationsUsed,
      response,
      artifacts,
      qualityScore,
      successfulOutcome: true,
      taskCategory,
      complexity,
    };

    this.trainingData.set(dataPoint.id, dataPoint);

    // Indexar por categoría
    if (!this.dataByCategory.has(taskCategory)) {
      this.dataByCategory.set(taskCategory, []);
    }
    this.dataByCategory.get(taskCategory)!.push(dataPoint);

    console.log(
      `✅ Datos capturados: ${taskCategory} (quality: ${qualityScore})`
    );

    return dataPoint;
  }

  /**
   * CALCULAR QUALITY SCORE
   *
   * Métrica de 0-100 que mide qué tan buena fue la interacción.
   */
  private calculateQualityScore(
    response: string,
    executionTime: number,
    iterationsUsed: number,
    artifacts?: any[]
  ): number {
    let score = 50; // baseline

    // Response length (más largo = más completo)
    const responseLength = response.length;
    if (responseLength > 500) score += 20;
    else if (responseLength > 200) score += 15;
    else if (responseLength > 100) score += 10;

    // Execution efficiency
    if (executionTime < 1000) score += 15;
    else if (executionTime < 3000) score += 10;
    else if (executionTime < 5000) score += 5;

    // Iterations efficiency (menos iteraciones = mejor)
    if (iterationsUsed <= 2) score += 10;
    else if (iterationsUsed <= 4) score += 5;

    // Artifacts (generar artefactos es bueno)
    if (artifacts && artifacts.length > 0) score += 10;

    // Respuesta contiene acciones concretas
    if (
      response.includes('✅') ||
      response.includes('completed') ||
      response.includes('success')
    ) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * INFERIR CATEGORÍA DE TAREA
   */
  private inferCategory(query: string): string {
    const queryLower = query.toLowerCase();

    if (
      queryLower.includes('security') ||
      queryLower.includes('vulnerability') ||
      queryLower.includes('penetration')
    ) {
      return 'security';
    } else if (
      queryLower.includes('code') ||
      queryLower.includes('develop') ||
      queryLower.includes('architecture')
    ) {
      return 'development';
    } else if (
      queryLower.includes('test') ||
      queryLower.includes('validate') ||
      queryLower.includes('qa')
    ) {
      return 'testing';
    } else if (
      queryLower.includes('deploy') ||
      queryLower.includes('infrastructure') ||
      queryLower.includes('devops')
    ) {
      return 'deployment';
    } else if (
      queryLower.includes('document') ||
      queryLower.includes('write') ||
      queryLower.includes('explain')
    ) {
      return 'documentation';
    } else if (
      queryLower.includes('research') ||
      queryLower.includes('analyze') ||
      queryLower.includes('investigate')
    ) {
      return 'research';
    }

    return 'general';
  }

  /**
   * INFERIR COMPLEJIDAD
   */
  private inferComplexity(
    executionTime: number,
    iterationsUsed: number,
    query: string
  ): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;

    // Tiempo de ejecución
    if (executionTime > 5000) complexityScore += 2;
    if (executionTime > 10000) complexityScore += 2;

    // Iteraciones
    if (iterationsUsed > 3) complexityScore += 2;
    if (iterationsUsed > 6) complexityScore += 2;

    // Longitud de query (más largo = más complejo)
    if (query.length > 200) complexityScore += 1;
    if (query.length > 500) complexityScore += 1;

    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * OBTENER TODOS LOS DATOS DE ENTRENAMIENTO
   */
  getAllTrainingData(): TrainingDataPoint[] {
    return Array.from(this.trainingData.values());
  }

  /**
   * OBTENER DATOS POR CATEGORÍA
   */
  getDataByCategory(category: string): TrainingDataPoint[] {
    return this.dataByCategory.get(category) || [];
  }

  /**
   * OBTENER DATOS BALANCEADOS
   *
   * Para training, queremos distribución equilibrada de categorías
   */
  getBalancedDataset(samplesPerCategory: number = 100): TrainingDataPoint[] {
    const balanced: TrainingDataPoint[] = [];

    this.dataByCategory.forEach((data, category) => {
      // Tomar los mejores N samples de cada categoría
      const sorted = [...data].sort((a, b) => b.qualityScore - a.qualityScore);
      balanced.push(...sorted.slice(0, samplesPerCategory));
    });

    return balanced;
  }

  /**
   * OBTENER DATOS DE ALTA CALIDAD
   *
   * Solo datos que superan threshold significativamente
   */
  getHighQualityData(threshold: number = 85): TrainingDataPoint[] {
    return Array.from(this.trainingData.values()).filter(
      d => d.qualityScore >= threshold
    );
  }

  /**
   * ESTADÍSTICAS DEL DATASET
   */
  getStatistics() {
    const allData = this.getAllTrainingData();
    const avgQuality = allData.length > 0
      ? allData.reduce((sum, d) => sum + d.qualityScore, 0) / allData.length
      : 0;

    const avgLatency = allData.length > 0
      ? allData.reduce((sum, d) => sum + d.executionTime, 0) / allData.length
      : 0;

    return {
      totalDataPoints: this.trainingData.size,
      byCategory: Object.fromEntries(
        Array.from(this.dataByCategory.entries()).map(([cat, data]) => [
          cat,
          data.length,
        ])
      ),
      averageQuality: avgQuality,
      averageLatency: avgLatency,
      dataDistribution: {
        simple: allData.filter(d => d.complexity === 'simple').length,
        moderate: allData.filter(d => d.complexity === 'moderate').length,
        complex: allData.filter(d => d.complexity === 'complex').length,
      },
      readyForTraining: allData.filter(d => d.qualityScore >= 80).length,
    };
  }

  /**
   * MARCAR DATOS COMO USADOS PARA TRAINING
   */
  markAsUsedForTraining(dataIds: string[], generationId: string): void {
    dataIds.forEach(id => {
      const data = this.trainingData.get(id);
      if (data) {
        if (!data.trainingGenerations) {
          data.trainingGenerations = [];
        }
        data.trainingGenerations.push(generationId);
        data.wasUsedForTraining = true;
      }
    });
  }

  /**
   * MEMORIA TOTAL
   */
  getMemoryUsage(): number {
    return (JSON.stringify(Array.from(this.trainingData.values())).length / 1024).toFixed(2) as any;
  }
}
