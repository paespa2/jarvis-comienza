/**
 * FINE-TUNER
 *
 * Implementa el pipeline de fine-tuning automático
 * para crear modelos personalizados basados en datos de entrenamiento.
 */

import {
  TrainingDataPoint,
  ModelVariant,
  TrainingSession,
} from '../modelTypes';
import { v4 as uuidv4 } from 'uuid';

export interface FineTuningConfig {
  sourceModel: string; // e.g., "claude-3.5-sonnet"
  epochs: number; // Número de pasadas por el dataset
  batchSize: number; // Ejemplos por batch
  learningRate: number; // Tasa de aprendizaje
  validationSplit: number; // Proporción para validación (0-1)
  earlyStopping: boolean; // Detener si no mejora
  earlyStoppingPatience: number; // Epochs sin mejora antes de detener
}

export interface TrainingProgress {
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  validationLoss: number;
  validationAccuracy: number;
  bestValidationAccuracy: number;
  trainingTime: number; // en ms
  estimatedTimeRemaining: number; // en ms
}

export interface TrainingResult {
  success: boolean;
  modelVariantId: string;
  finalLoss: number;
  finalAccuracy: number;
  validationAccuracy: number;
  improvementOverBase: number; // %
  totalTrainingTime: number; // en ms
  epochsTrained: number;
  stoppedEarly: boolean;
  stopReason?: string;
}

export class FineTuner {
  private trainingSessions: Map<string, TrainingSession> = new Map();
  private defaultConfig: FineTuningConfig = {
    sourceModel: 'claude-3.5-sonnet',
    epochs: 3,
    batchSize: 32,
    learningRate: 0.0001,
    validationSplit: 0.2,
    earlyStopping: true,
    earlyStoppingPatience: 2,
  };

  /**
   * INICIAR SESIÓN DE FINE-TUNING
   */
  startTrainingSession(
    trainingData: TrainingDataPoint[],
    targetModelId: string,
    config: Partial<FineTuningConfig> = {}
  ): TrainingSession {
    const finalConfig = { ...this.defaultConfig, ...config };
    const sessionId = `session-${uuidv4()}`;
    const startTime = Date.now();

    console.log(`\n🚀 INICIANDO FINE-TUNING SESSION`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Target Model: ${targetModelId}`);
    console.log(`   Training Data Points: ${trainingData.length}`);
    console.log(`   Config:`);
    console.log(`      - Epochs: ${finalConfig.epochs}`);
    console.log(`      - Batch Size: ${finalConfig.batchSize}`);
    console.log(`      - Learning Rate: ${finalConfig.learningRate}`);
    console.log(`      - Validation Split: ${(finalConfig.validationSplit * 100).toFixed(0)}%`);
    console.log('');

    // Dividir datos en training y validation
    const shuffled = this.shuffleArray([...trainingData]);
    const validationSize = Math.floor(
      trainingData.length * finalConfig.validationSplit
    );
    const trainingSet = shuffled.slice(validationSize);
    const validationSet = shuffled.slice(0, validationSize);

    // Categorizar datos
    const categories = new Map<string, number>();
    trainingSet.forEach(dp => {
      categories.set(
        dp.taskCategory,
        (categories.get(dp.taskCategory) || 0) + 1
      );
    });

    const session: TrainingSession = {
      id: sessionId,
      startTime,
      sourceModel: finalConfig.sourceModel,
      targetModelId,
      trainingData: {
        totalPoints: trainingData.length,
        successfulPoints: trainingSet.filter(dp => dp.qualityScore >= 80)
          .length,
        categories,
      },
      config: {
        epochs: finalConfig.epochs,
        batchSize: finalConfig.batchSize,
        learningRate: finalConfig.learningRate,
      },
      progress: {
        currentEpoch: 0,
        currentLoss: 0,
        validationAccuracy: 0,
        validationLoss: 0,
        bestValidationAccuracy: 0,
        trainingTime: 0,
        estimatedTimeRemaining: 0,
      },
      status: 'running',
    };

    this.trainingSessions.set(sessionId, session);

    return session;
  }

  /**
   * SIMULAR FINE-TUNING
   *
   * En un sistema real, esto haría llamadas a API de fine-tuning.
   * Aquí simulamos el proceso con métricas realistas.
   */
  async trainModel(
    session: TrainingSession,
    trainingData: TrainingDataPoint[],
    baselineAccuracy: number = 0.75
  ): Promise<TrainingResult> {
    const sessionId = session.id;
    const config = session.config;

    console.log(`\n📚 ENTRENANDO MODELO - Session ${sessionId.slice(0, 8)}...`);

    const startTime = Date.now();
    let bestValidationAccuracy = 0;
    let epochsWithoutImprovement = 0;
    let finalEpoch = config.epochs;

    for (let epoch = 1; epoch <= config.epochs; epoch++) {
      // Simular pérdida durante el entrenamiento
      const trainingLoss = this.calculateTrainingLoss(
        epoch,
        config.epochs,
        trainingData.length
      );

      // Simular validación
      const validationResult = this.validateModel(
        epoch,
        baselineAccuracy,
        trainingData
      );

      // Actualizar progreso
      session.progress.currentEpoch = epoch;
      session.progress.currentLoss = trainingLoss;
      session.progress.validationLoss = validationResult.loss;
      session.progress.validationAccuracy = validationResult.accuracy;
      session.progress.trainingTime = Date.now() - startTime;
      session.progress.estimatedTimeRemaining = this.estimateTimeRemaining(
        epoch,
        config.epochs,
        session.progress.trainingTime
      );

      // Rastrear mejor accuracy
      if (validationResult.accuracy > bestValidationAccuracy) {
        bestValidationAccuracy = validationResult.accuracy;
        session.progress.bestValidationAccuracy = bestValidationAccuracy;
        epochsWithoutImprovement = 0;
      } else {
        epochsWithoutImprovement++;
      }

      // Early stopping
      if (epochsWithoutImprovement >= 2 && epoch > 1) {
        finalEpoch = epoch;
        console.log(
          `   ⏹️  Early stopping en epoch ${epoch} (sin mejora por 2 epochs)`
        );
        break;
      }

      // Mostrar progreso
      this.printEpochProgress(epoch, config.epochs, trainingLoss, validationResult);

      // Simular delay entre epochs
      await this.sleep(100);
    }

    const totalTrainingTime = Date.now() - startTime;
    const finalAccuracy = session.progress.validationAccuracy;
    const improvementOverBase = ((finalAccuracy - baselineAccuracy) / baselineAccuracy) * 100;

    const result: TrainingResult = {
      success: finalAccuracy > baselineAccuracy,
      modelVariantId: `model-${uuidv4()}`,
      finalLoss: session.progress.currentLoss,
      finalAccuracy,
      validationAccuracy: session.progress.validationAccuracy,
      improvementOverBase: Math.max(0, improvementOverBase),
      totalTrainingTime,
      epochsTrained: finalEpoch,
      stoppedEarly: finalEpoch < config.epochs,
      stopReason: finalEpoch < config.epochs ? 'Early stopping triggered' : undefined,
    };

    // Marcar sesión como completada
    session.endTime = Date.now();
    session.status = 'completed';
    session.result = {
      finalLoss: result.finalLoss,
      finalAccuracy: result.finalAccuracy,
      improvements: {
        modelId: result.modelVariantId,
        evaluationTime: Date.now(),
        metrics: {
          latency: 250, // ms simulado
          qualityScore: result.finalAccuracy * 100,
          costPerRequest: 0.002,
          accuracy: result.finalAccuracy,
          robustness: 0.92,
        },
        improvements: {
          vs_baseModel: improvementOverBase,
          vs_previousGeneration: improvementOverBase * 0.8,
        },
        recommendations: this.generateRecommendations(result),
      },
    };

    console.log(`\n✅ ENTRENAMIENTO COMPLETADO`);
    console.log(`   Accuracy Final: ${(result.finalAccuracy * 100).toFixed(2)}%`);
    console.log(`   Mejora sobre base: +${result.improvementOverBase.toFixed(2)}%`);
    console.log(`   Tiempo total: ${(totalTrainingTime / 1000).toFixed(1)}s`);
    console.log(`   Epochs completados: ${result.epochsTrained}/${config.epochs}`);
    console.log('');

    return result;
  }

  /**
   * CALCULAR PÉRDIDA DE ENTRENAMIENTO
   */
  private calculateTrainingLoss(
    epoch: number,
    totalEpochs: number,
    dataSize: number
  ): number {
    // Simular convergencia: pérdida disminuye logarítmicamente
    const maxLoss = 0.5;
    const minLoss = 0.1;
    const progress = epoch / totalEpochs;
    const baseLoss = maxLoss - (maxLoss - minLoss) * Math.log1p(progress * 10) / Math.log1p(10);

    // Agregar pequeño ruido
    const noise = (Math.random() - 0.5) * 0.02;

    return Math.max(minLoss, baseLoss + noise);
  }

  /**
   * VALIDAR MODELO
   */
  private validateModel(
    epoch: number,
    baselineAccuracy: number,
    trainingData: TrainingDataPoint[]
  ): { accuracy: number; loss: number } {
    // Simular mejora de accuracy basada en epoch
    const improvementFactor = 0.15; // Mejora máxima 15% sobre baseline
    const epochProgress = Math.min(1, epoch / 3);
    const accuracy = baselineAccuracy + improvementFactor * epochProgress * (0.5 + Math.random() * 0.5);

    // Calcular pérdida inversamente proporcional a accuracy
    const loss = -Math.log(Math.max(0.01, accuracy));

    return {
      accuracy: Math.min(0.98, accuracy),
      loss,
    };
  }

  /**
   * ESTIMAR TIEMPO RESTANTE
   */
  private estimateTimeRemaining(
    currentEpoch: number,
    totalEpochs: number,
    elapsedTime: number
  ): number {
    if (currentEpoch === 0) return 0;

    const avgTimePerEpoch = elapsedTime / currentEpoch;
    const remainingEpochs = totalEpochs - currentEpoch;

    return remainingEpochs * avgTimePerEpoch;
  }

  /**
   * GENERAR RECOMENDACIONES
   */
  private generateRecommendations(result: TrainingResult): string[] {
    const recommendations: string[] = [];

    if (result.improvementOverBase > 10) {
      recommendations.push(
        '✅ Modelo personalizado muestra mejora significativa - listo para despliegue'
      );
    } else if (result.improvementOverBase > 3) {
      recommendations.push(
        '✓ Modelo personalizado muestra mejora moderada - considera usar en producción'
      );
    } else if (result.improvementOverBase < 0) {
      recommendations.push(
        '⚠️ Modelo personalizado no mejoró - usar modelo base'
      );
    }

    if (result.stoppedEarly) {
      recommendations.push('💡 Considerar ajustar learning rate o datos de entrenamiento');
    }

    if (result.finalAccuracy < 0.8) {
      recommendations.push(
        '📈 Agregar más datos de entrenamiento para mejorar accuracy'
      );
    }

    if (result.totalTrainingTime > 5000) {
      recommendations.push('⚡ Considerar usar quantization para acelerar inferencia');
    }

    return recommendations;
  }

  /**
   * IMPRIMIR PROGRESO DE EPOCH
   */
  private printEpochProgress(
    epoch: number,
    totalEpochs: number,
    trainingLoss: number,
    validationResult: { accuracy: number; loss: number }
  ): void {
    const percentage = ((epoch / totalEpochs) * 100).toFixed(0);
    const barLength = 20;
    const filledLength = Math.round((epoch / totalEpochs) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    console.log(
      `   [${bar}] ${percentage}% | Epoch ${epoch} | Train Loss: ${trainingLoss.toFixed(4)} | Val Acc: ${(validationResult.accuracy * 100).toFixed(2)}%`
    );
  }

  /**
   * MEZCLAR ARRAY
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * DORMIR
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * OBTENER SESIÓN
   */
  getSession(sessionId: string): TrainingSession | undefined {
    return this.trainingSessions.get(sessionId);
  }

  /**
   * OBTENER TODAS LAS SESIONES
   */
  getAllSessions(): TrainingSession[] {
    return Array.from(this.trainingSessions.values());
  }

  /**
   * OBTENER ESTADÍSTICAS DE ENTRENAMIENTO
   */
  getTrainingStatistics() {
    const sessions = this.getAllSessions();

    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      runningSession: sessions.find(s => s.status === 'running'),
      averageImprovement: sessions
        .filter(s => s.status === 'completed' && s.result)
        .reduce((sum, s) => sum + (s.result?.improvements.improvements.vs_baseModel || 0), 0) /
        Math.max(1, sessions.filter(s => s.status === 'completed').length),
      totalTrainingTime: sessions.reduce((sum, s) => sum + ((s.endTime || Date.now()) - s.startTime), 0),
    };
  }
}
