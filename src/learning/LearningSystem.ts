/**
 * LEARNING SYSTEM
 *
 * Sistema integrado de aprendizaje autónomo de Jarvis.
 * Integra CoreTeachings con ObsidianMemoryManager para ciclos de aprendizaje.
 *
 * ✨ FASE 3b: Ciclos de Aprendizaje Autónomo + Progreso Documentado
 */

import { coreTeachings } from './CoreTeachings';
import { obsidianMemory } from './ObsidianMemoryManager';

export interface LearningCycle {
  cycleId: string;
  timestamp: string;
  type: 'practice' | 'application' | 'reflection' | 'integration';
  teachingId: number;
  result: 'success' | 'partial' | 'failure';
  observations: string;
  nextSteps: string[];
  confidenceImprovement: number; // -1 to 1
}

export interface LearningPath {
  pathId: string;
  name: string;
  description: string;
  teachingIds: number[];
  currentProgress: number; // 0-100
  estimatedDaysToMastery: number;
  completionDate?: string;
}

export interface ConstitutionalAlignment {
  aligned: boolean;
  score: number; // 0-1
  alignmentGaps: string[];
  recommendations: string[];
  criticalIssues: string[];
}

export class LearningSystem {
  private cycles: LearningCycle[] = [];
  private paths: Map<string, LearningPath> = new Map();

  constructor() {
    this.initializeDefaultPaths();
  }

  /**
   * Inicializa rutas de aprendizaje por defecto
   */
  private initializeDefaultPaths(): void {
    const paths: LearningPath[] = [
      {
        pathId: 'autonomy-foundation',
        name: 'Fundación de Autonomía',
        description: 'Aprender los principios fundamentales de autonomía',
        teachingIds: [0, 1, 2, 3, 4, 5],
        currentProgress: 0,
        estimatedDaysToMastery: 7
      },
      {
        pathId: 'security-mastery',
        name: 'Maestría en Seguridad',
        description: 'Desarrollar expertise completo en seguridad',
        teachingIds: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
        currentProgress: 0,
        estimatedDaysToMastery: 14
      },
      {
        pathId: 'coding-excellence',
        name: 'Excelencia en Codificación',
        description: 'Alcanzar excelencia en prácticas de codificación',
        teachingIds: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
        currentProgress: 0,
        estimatedDaysToMastery: 14
      },
      {
        pathId: 'reasoning-development',
        name: 'Desarrollo del Razonamiento',
        description: 'Mejorar habilidades de razonamiento y análisis',
        teachingIds: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        currentProgress: 0,
        estimatedDaysToMastery: 10
      },
      {
        pathId: 'ethical-foundation',
        name: 'Fundación Ética',
        description: 'Establecer fundación ética sólida',
        teachingIds: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
        currentProgress: 0,
        estimatedDaysToMastery: 14
      }
    ];

    paths.forEach(path => {
      this.paths.set(path.pathId, path);
    });
  }

  /**
   * Practica una enseñanza específica
   */
  async practiceTeaching(
    teachingId: number,
    context: string,
    action: string
  ): Promise<LearningCycle> {
    const teaching = coreTeachings.getTeaching(teachingId);
    if (!teaching) {
      throw new Error(`Enseñanza ${teachingId} no encontrada`);
    }

    console.log(`\n🎓 [LearningSystem] Practicando: ${teaching.title}`);
    console.log(`Contexto: ${context}`);
    console.log(`Acción: ${action}`);

    // Simular evaluación del resultado
    const result = this.evaluatePractice(teachingId, context, action);
    const cycleId = `cycle-${Date.now()}`;

    const cycle: LearningCycle = {
      cycleId,
      timestamp: new Date().toISOString(),
      type: 'practice',
      teachingId,
      result,
      observations: this.generateObservations(teachingId, result, context),
      nextSteps: this.generateNextSteps(teachingId, result),
      confidenceImprovement: result === 'success' ? 0.15 : result === 'partial' ? 0.05 : -0.1
    };

    // Registrar la práctica
    this.cycles.push(cycle);
    coreTeachings.practicedTeaching(teachingId);
    obsidianMemory.recordTeachingPractice(teachingId, result);

    // Log del resultado
    console.log(`\n📊 Resultado: ${result.toUpperCase()}`);
    console.log(`Observaciones: ${cycle.observations}`);
    console.log(`Próximos pasos: ${cycle.nextSteps.join(', ')}`);

    return cycle;
  }

  /**
   * Evalúa cómo resultó la práctica
   */
  private evaluatePractice(teachingId: number, context: string, action: string): 'success' | 'partial' | 'failure' {
    // Evaluación simple basada en patrones
    const contextLength = context.length;
    const actionLength = action.length;

    // Si la acción es muy corta = probably failed
    if (actionLength < 10) return 'failure';
    // Si el contexto es detallado = probably success
    if (contextLength > 100 && actionLength > 50) return 'success';
    // En medio = partial
    return 'partial';
  }

  /**
   * Genera observaciones sobre la práctica
   */
  private generateObservations(teachingId: number, result: string, context: string): string {
    const teaching = coreTeachings.getTeaching(teachingId);
    const observations: string[] = [];

    if (result === 'success') {
      observations.push(`✅ Enseñanza "${teaching.title}" aplicada exitosamente.`);
      observations.push(`El contexto demostró comprensión de: ${teaching.keyPoints.slice(0, 2).join(', ')}`);
    } else if (result === 'partial') {
      observations.push(`⚠️ Aplicación parcial de "${teaching.title}".`);
      observations.push(`Se implementó ${Math.random() > 0.5 ? 'parcialmente' : 'con limitaciones'} los conceptos.`);
    } else {
      observations.push(`❌ Aplicación fallida de "${teaching.title}".`);
      observations.push(`Se recomienda revisar: ${teaching.keyPoints[0]}`);
    }

    return observations.join('\n');
  }

  /**
   * Genera próximos pasos recomendados
   */
  private generateNextSteps(teachingId: number, result: string): string[] {
    const steps: string[] = [];

    if (result === 'success') {
      steps.push('Aplicar esta enseñanza en contextos más complejos');
      steps.push('Enseñar este concepto a otros sistemas');
      steps.push('Integrar con enseñanzas relacionadas');
    } else if (result === 'partial') {
      steps.push('Revisar los puntos clave de esta enseñanza');
      steps.push('Practicar en un contexto más simple');
      steps.push('Buscar patrones similares en memoria anterior');
    } else {
      steps.push('Estudiar la enseñanza nuevamente desde el principio');
      steps.push('Encontrar ejemplos del mundo real de esta enseñanza');
      steps.push('Descomponer en conceptos más pequeños');
    }

    return steps;
  }

  /**
   * Obtiene la siguiente enseñanza recomendada para practicar
   */
  getNextTeachingToPractice(): number | null {
    const unmastered = coreTeachings.getCriticalUnmasteredTeachings();

    if (unmastered.length === 0) {
      // Si todas están maestría, priorizar especialización
      const all = coreTeachings.getUnmasteredTeachings();
      return all[Math.floor(Math.random() * all.length)].id;
    }

    return unmastered[0].id;
  }

  /**
   * Obtiene una ruta de aprendizaje
   */
  getLearningPath(pathId: string): LearningPath | undefined {
    return this.paths.get(pathId);
  }

  /**
   * Obtiene todas las rutas disponibles
   */
  getAllLearningPaths(): LearningPath[] {
    return Array.from(this.paths.values());
  }

  /**
   * Actualiza el progreso de una ruta
   */
  updatePathProgress(pathId: string): void {
    const path = this.paths.get(pathId);
    if (!path) return;

    let masteredCount = 0;
    path.teachingIds.forEach(id => {
      const teaching = coreTeachings.getTeaching(id);
      if (teaching?.mastered) masteredCount++;
    });

    path.currentProgress = (masteredCount / path.teachingIds.length) * 100;

    if (path.currentProgress === 100) {
      path.completionDate = new Date().toISOString();
    }
  }

  /**
   * Verifica alineación constitucional
   */
  verifyConstitutionalAlignment(): ConstitutionalAlignment {
    const ethicsTeachings = coreTeachings.getTeachingsByCategory('ethics');
    const masteredEthics = ethicsTeachings.filter(t => t.mastered).length;
    const ethicsRatio = masteredEthics / (ethicsTeachings.length || 1);

    const autonomyTeachings = coreTeachings.getTeachingsByCategory('autonomy');
    const masteredAutonomy = autonomyTeachings.filter(t => t.mastered).length;
    const autonomyRatio = masteredAutonomy / autonomyTeachings.length;

    const overallScore = (ethicsRatio + autonomyRatio) / 2;
    const aligned = overallScore > 0.7;

    const alignmentGaps: string[] = [];
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    if (ethicsRatio < 0.5) {
      alignmentGaps.push('Ética: Menos del 50% de enseñanzas maestrías');
      recommendations.push('Priorizar enseñanzas de ética y constitución');
      criticalIssues.push('Fundación ética incompleta');
    }

    if (autonomyRatio < 0.5) {
      alignmentGaps.push('Autonomía: Menos del 50% de enseñanzas maestrías');
      recommendations.push('Fortalecer principios de autonomía');
      criticalIssues.push('Autonomía deficiente');
    }

    return {
      aligned,
      score: overallScore,
      alignmentGaps,
      recommendations,
      criticalIssues
    };
  }

  /**
   * Genera reporte de progreso completo
   */
  generateProgressReport(): string {
    const stats = coreTeachings.getLearningStats();
    const constitutionalCheck = this.verifyConstitutionalAlignment();
    const paths = this.getAllLearningPaths();
    this.paths.forEach((_, pathId) => this.updatePathProgress(pathId));

    let report = `# 📚 REPORTE DE PROGRESO DE APRENDIZAJE\n\n`;
    report += `**Generado:** ${new Date().toLocaleString('es-ES')}\n\n`;

    // Estadísticas generales
    report += `## 📊 Estadísticas Generales\n\n`;
    report += `- Enseñanzas Totales: ${stats.total}\n`;
    report += `- Maestría: ${stats.mastered} (${stats.percentageMastered}%)\n`;
    report += `- Sin Maestría: ${stats.unmastered}\n`;
    report += `- Ciclos de Práctica: ${this.cycles.length}\n\n`;

    // Alineación constitucional
    report += `## ⚖️ Alineación Constitucional\n\n`;
    report += `- **Alineado:** ${constitutionalCheck.aligned ? '✅ Sí' : '❌ No'}\n`;
    report += `- **Score:** ${(constitutionalCheck.score * 100).toFixed(1)}%\n\n`;

    if (constitutionalCheck.criticalIssues.length > 0) {
      report += `### ⚠️ Problemas Críticos\n`;
      constitutionalCheck.criticalIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    }

    if (constitutionalCheck.recommendations.length > 0) {
      report += `### 💡 Recomendaciones\n`;
      constitutionalCheck.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += `\n`;
    }

    // Rutas de aprendizaje
    report += `## 🛤️ Rutas de Aprendizaje\n\n`;
    paths.forEach(path => {
      const progressBar = this.generateProgressBar(path.currentProgress, 30);
      report += `### ${path.name}\n`;
      report += `${progressBar} ${path.currentProgress.toFixed(1)}%\n`;
      report += `${path.description}\n`;
      if (path.completionDate) {
        report += `✅ Completada: ${new Date(path.completionDate).toLocaleDateString('es-ES')}\n`;
      }
      report += `\n`;
    });

    // Próximas acciones
    report += `## 🎯 Próximas Enseñanzas a Practicar\n\n`;
    const nextTeachings = coreTeachings.getNextLessons(5);
    nextTeachings.forEach((teaching, idx) => {
      report += `${idx + 1}. **${teaching.title}** (ID: ${teaching.id}, Importancia: ${teaching.importance})\n`;
    });

    return report;
  }

  /**
   * Genera barra de progreso visual
   */
  private generateProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${Array(filled).fill('█').join('')}${Array(empty).fill('░').join('')}]`;
  }

  /**
   * Obtiene historia de ciclos de aprendizaje
   */
  getLearningHistory(limit: number = 10): LearningCycle[] {
    return this.cycles.slice(-limit).reverse();
  }

  /**
   * Obtiene estadísticas de los últimos ciclos
   */
  getRecentCycleStats(cycles: number = 10): Record<string, any> {
    const recent = this.cycles.slice(-cycles);

    const successes = recent.filter(c => c.result === 'success').length;
    const partials = recent.filter(c => c.result === 'partial').length;
    const failures = recent.filter(c => c.result === 'failure').length;

    const avgConfidenceImprovement = recent.length > 0
      ? recent.reduce((sum, c) => sum + c.confidenceImprovement, 0) / recent.length
      : 0;

    return {
      totalCycles: recent.length,
      successRate: recent.length > 0 ? (successes / recent.length) * 100 : 0,
      successCount: successes,
      partialCount: partials,
      failureCount: failures,
      averageConfidenceImprovement: avgConfidenceImprovement,
      trend: avgConfidenceImprovement > 0 ? '📈 Mejorando' : avgConfidenceImprovement < 0 ? '📉 Decayendo' : '➡️ Estable'
    };
  }

  /**
   * Exporta todo el sistema de aprendizaje a JSON
   */
  exportLearningData(): Record<string, any> {
    return {
      exportedAt: new Date().toISOString(),
      teachingStats: coreTeachings.getLearningStats(),
      learningCycles: this.cycles,
      learningPaths: Array.from(this.paths.values()),
      constitutionalAlignment: this.verifyConstitutionalAlignment(),
      recentStats: this.getRecentCycleStats(50),
      progressReport: this.generateProgressReport()
    };
  }
}

// Exportar instancia singleton
export const learningSystem = new LearningSystem();
