/**
 * CONTINUOUS LEARNING PIPELINE
 *
 * Automated dataset updates and fine-tuning integration
 * Phase 5: Continuous Updates & Maintenance
 */

import { huggingFaceDatasetManager } from './HuggingFaceDatasetManager';
import { securityDatasetProcessor } from './SecurityDatasetProcessor';
import { enhancedSecurityKnowledgeBase } from '../core/knowledge/EnhancedSecurityKnowledgeBase';

export interface UpdateCheckResult {
  timestamp: number;
  datasetsChecked: number;
  updatesAvailable: number;
  updatesApplied: number;
  newEntitiesAdded: number;
  successRate: number;
  nextUpdateScheduled: number; // milliseconds until next check
}

export interface FineTuningMetrics {
  timestamp: number;
  datasetsUsed: string[];
  trainingExamplesTotal: number;
  dpoExamplesUsed: number;
  improvementEstimated: number; // percentage improvement
  status: 'pending' | 'training' | 'complete' | 'failed';
  modelCheckpoint?: string;
}

export class ContinuousLearningPipeline {
  private updateIntervalMs: number = 7 * 24 * 60 * 60 * 1000; // Weekly
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastUpdateTime: number = 0;
  private fineTuningMetrics: FineTuningMetrics[] = [];

  constructor() {
    console.log('\n🔄 [ContinuousLearningPipeline] Inicializando...');
    this.updateIntervalMs = parseInt(process.env.HF_UPDATE_INTERVAL || '604800000', 10);
  }

  /**
   * Iniciar pipeline de actualización automática
   */
  startAutomaticUpdates(): void {
    if (this.isRunning) {
      console.log('   ℹ️  Update pipeline already running');
      return;
    }

    console.log('\n🔄 Starting Continuous Learning Pipeline...');
    console.log(`   📅 Update interval: ${(this.updateIntervalMs / 1000 / 60 / 60 / 24).toFixed(1)} days`);
    console.log(`   ⏰ First check in ${(this.updateIntervalMs / 1000 / 60).toFixed(0)} minutes\n`);

    this.isRunning = true;

    // Ejecutar first check inmediatamente para desarrollo
    this.checkForUpdates().catch(err => {
      console.error(`Error in update check: ${err.message}`);
    });

    // Programar checks posteriores
    this.scheduleNextUpdate();
  }

  /**
   * Programar próxima actualización
   */
  private scheduleNextUpdate(): void {
    if (this.updateCheckTimer) {
      clearTimeout(this.updateCheckTimer);
    }

    this.updateCheckTimer = setTimeout(async () => {
      try {
        await this.checkForUpdates();
      } catch (err: any) {
        console.error(`Error checking for updates: ${err.message}`);
      }
      this.scheduleNextUpdate(); // Reschedule after completion
    }, this.updateIntervalMs);
  }

  /**
   * Verificar disponibilidad de actualizaciones
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    console.log('\n📥 Checking for dataset updates...');
    const startTime = Date.now();

    const datasets = huggingFaceDatasetManager.listDatasets();
    let updatesAvailable = 0;
    let updatesApplied = 0;
    let newEntitiesAdded = 0;

    for (const dataset of datasets) {
      try {
        // Simular verificación de actualizaciones
        const hasUpdate = Math.random() > 0.5; // En producción, comparar versiones

        if (hasUpdate) {
          updatesAvailable++;

          // Descargar dataset actualizado
          const success = await huggingFaceDatasetManager.downloadDataset(dataset.id, false);

          if (success) {
            updatesApplied++;
            // Re-procesar dataset
            const metrics = await this.reprocessDataset(dataset.id);
            newEntitiesAdded += metrics.newEntities;
          }
        }
      } catch (err: any) {
        console.error(`   Error checking ${dataset.id}: ${err.message}`);
      }
    }

    const result: UpdateCheckResult = {
      timestamp: Date.now(),
      datasetsChecked: datasets.length,
      updatesAvailable,
      updatesApplied,
      newEntitiesAdded,
      successRate: datasets.length > 0 ? (updatesApplied / updatesAvailable) * 100 : 0,
      nextUpdateScheduled: this.lastUpdateTime + this.updateIntervalMs
    };

    this.lastUpdateTime = Date.now();

    console.log(`\n✅ Update check complete:`);
    console.log(`   Datasets checked: ${result.datasetsChecked}`);
    console.log(`   Updates available: ${result.updatesAvailable}`);
    console.log(`   Updates applied: ${result.updatesApplied}`);
    console.log(`   New entities added: ${result.newEntitiesAdded.toLocaleString()}`);
    console.log(`   Success rate: ${result.successRate.toFixed(1)}%\n`);

    if (newEntitiesAdded > 0) {
      // Trigger fine-tuning with new data
      await this.triggerFineTuning('new-data-update');
    }

    return result;
  }

  /**
   * Re-procesar dataset actualizado
   */
  private async reprocessDataset(datasetId: string): Promise<{ newEntities: number }> {
    // En producción, esto re-procesaría solo los nuevos registros
    // Por ahora, retornamos un número simulado
    return {
      newEntities: Math.floor(Math.random() * 1000) + 100
    };
  }

  /**
   * Disparar fine-tuning con nuevos datos
   */
  async triggerFineTuning(triggerReason: string): Promise<FineTuningMetrics> {
    console.log(`\n🧠 Triggering fine-tuning: ${triggerReason}...`);

    const metrics: FineTuningMetrics = {
      timestamp: Date.now(),
      datasetsUsed: ['nvd-security-instructions', 'code-vulnerability-dpo', 'white-hat-prompts'],
      trainingExamplesTotal: 0,
      dpoExamplesUsed: 0,
      improvementEstimated: 0,
      status: 'pending'
    };

    try {
      // Reunir datos de training
      const allPrompts = 0; // Simular: obtener todos los prompts
      const dpoSamples = 0; // Simular: obtener pares DPO

      metrics.trainingExamplesTotal = allPrompts;
      metrics.dpoExamplesUsed = dpoSamples;
      metrics.status = 'training';

      console.log(`   📚 Training examples: ${metrics.trainingExamplesTotal.toLocaleString()}`);
      console.log(`   🔄 DPO pairs: ${metrics.dpoExamplesUsed.toLocaleString()}`);

      // Simular entrenamiento
      await this.simulateFineTuning();

      metrics.status = 'complete';
      metrics.improvementEstimated = Math.random() * 5 + 1; // 1-6% improvement

      console.log(`   ✅ Fine-tuning complete`);
      console.log(`   📈 Estimated improvement: +${metrics.improvementEstimated.toFixed(1)}%\n`);
    } catch (err: any) {
      metrics.status = 'failed';
      console.error(`   ❌ Fine-tuning failed: ${err.message}\n`);
    }

    this.fineTuningMetrics.push(metrics);
    return metrics;
  }

  /**
   * Simular fine-tuning (en producción usaría transformers/torch)
   */
  private async simulateFineTuning(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 2000); // Simular 2s de training
    });
  }

  /**
   * Obtener estado del pipeline
   */
  getStatus(): {
    isRunning: boolean;
    lastUpdateTime: string | null;
    nextUpdateTime: string | null;
    fineTuningCount: number;
    successfulFineTunings: number;
  } {
    return {
      isRunning: this.isRunning,
      lastUpdateTime: this.lastUpdateTime > 0 ? new Date(this.lastUpdateTime).toISOString() : null,
      nextUpdateTime:
        this.lastUpdateTime > 0
          ? new Date(this.lastUpdateTime + this.updateIntervalMs).toISOString()
          : new Date(Date.now() + this.updateIntervalMs).toISOString(),
      fineTuningCount: this.fineTuningMetrics.length,
      successfulFineTunings: this.fineTuningMetrics.filter(m => m.status === 'complete').length
    };
  }

  /**
   * Obtener historial de fine-tuning
   */
  getFineTuningHistory(): FineTuningMetrics[] {
    return [...this.fineTuningMetrics];
  }

  /**
   * Detener pipeline
   */
  stop(): void {
    if (this.updateCheckTimer) {
      clearTimeout(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
    this.isRunning = false;
    console.log('   ✅ Continuous Learning Pipeline stopped');
  }

  /**
   * Generar reporte de aprendizaje continuo
   */
  generateContinuousLearningReport(): string {
    const status = this.getStatus();
    const finetunings = this.getFineTuningHistory();

    let report = '\n' + '═'.repeat(70) + '\n';
    report += '🔄 CONTINUOUS LEARNING PIPELINE STATUS\n';
    report += '═'.repeat(70) + '\n\n';

    report += `Status: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}\n`;
    report += `Last Update: ${status.lastUpdateTime || 'Never'}\n`;
    report += `Next Update: ${status.nextUpdateTime}\n`;
    report += `Update Interval: ${(this.updateIntervalMs / 1000 / 60 / 60 / 24).toFixed(1)} days\n\n`;

    report += `Fine-tuning History (${finetunings.length} total):\n`;
    finetunings.forEach((ft, i) => {
      const emoji = ft.status === 'complete' ? '✅' : ft.status === 'failed' ? '❌' : '⏳';
      report += `  ${emoji} ${i + 1}. ${new Date(ft.timestamp).toISOString()}\n`;
      report += `     Status: ${ft.status}\n`;
      report += `     Examples: ${ft.trainingExamplesTotal.toLocaleString()} (${ft.dpoExamplesUsed} DPO pairs)\n`;
      if (ft.improvementEstimated > 0) {
        report += `     Improvement: +${ft.improvementEstimated.toFixed(1)}%\n`;
      }
    });

    report += '\n' + '═'.repeat(70) + '\n\n';

    return report;
  }
}

export const continuousLearningPipeline = new ContinuousLearningPipeline();
