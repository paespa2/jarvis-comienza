/**
 * CRITICAL EVALUATION ENGINE
 *
 * Jarvis evalúa críticamente si una mejora es útil o redundante.
 * NO adopta cambios sin justificación matemática clara.
 *
 * ✨ FASE 3d: Optimización Determinística con Evaluación Crítica
 */

export interface ImprovementProposal {
  id: string;
  name: string;
  category: 'prompt-optimization' | 'parameter-adjustment' | 'new-capability' | 'process-change';
  description: string;
  affectedMetrics: string[];
  estimatedROI: number; // -1 to 1
  implementationCost: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface EvaluationMetrics {
  accuracy: number;     // 0-1
  speed: number;        // 0-1 (faster = higher)
  efficiency: number;   // cost efficiency, 0-1
  reliability: number;  // consistency, 0-1
  confidence: number;   // 0-1
  versatility: number;  // 0-1
  timestamp: number;
}

export interface ImprovementResult {
  proposal: ImprovementProposal;
  baselineMetrics: EvaluationMetrics;
  improvedMetrics: EvaluationMetrics;
  improvement: {
    accuracy: number;
    speed: number;
    efficiency: number;
    reliability: number;
    confidence: number;
    versatility: number;
    overallScore: number; // -1 to 1
  };
  roi: number; // return on investment (-1 to 1)
  verdict: 'ADOPT' | 'REJECT' | 'NEEDS_REFINEMENT';
  reasoning: string;
  confidence: number; // confidence in verdict
}

export class CriticalEvaluationEngine {
  private metricsHistory: Map<string, EvaluationMetrics[]> = new Map();
  private adoptedImprovements: string[] = [];
  private rejectedImprovements: string[] = [];
  private refinementNeeded: string[] = [];

  // Thresholds para decidir si adoptar
  private readonly ADOPTION_THRESHOLD = 0.15; // 15% improvement mínimo
  private readonly ROI_THRESHOLD = 0.10;       // 10% ROI mínimo
  private readonly REDUNDANCY_THRESHOLD = 0.05; // 5% de diferencia = redundante

  constructor() {
    console.log('\n🧠 [CriticalEvaluationEngine] Inicializando...');
  }

  /**
   * Evaluar una mejora propuesta
   */
  async evaluateImprovement(
    proposal: ImprovementProposal,
    testFn: () => Promise<EvaluationMetrics>,
    baselineMetrics: EvaluationMetrics
  ): Promise<ImprovementResult> {
    console.log(`\n🔍 [CriticalEvaluation] Evaluando: ${proposal.name}`);

    // Ejecutar test
    const improvedMetrics = await testFn();

    // Calcular mejoras
    const improvement = this.calculateImprovement(baselineMetrics, improvedMetrics);
    const roi = this.calculateROI(improvement, proposal.implementationCost);

    // Tomar decisión
    const verdict = this.makeDecision(improvement, roi, proposal);
    const reasoning = this.generateReasoning(proposal, improvement, roi, verdict);

    const result: ImprovementResult = {
      proposal,
      baselineMetrics,
      improvedMetrics,
      improvement,
      roi,
      verdict,
      reasoning,
      confidence: this.calculateConfidence(improvement, roi)
    };

    // Registrar resultado
    this.recordDecision(proposal.id, verdict);

    return result;
  }

  /**
   * Calcular mejoras entre métricas
   */
  private calculateImprovement(
    baseline: EvaluationMetrics,
    improved: EvaluationMetrics
  ): { accuracy: number; speed: number; efficiency: number; reliability: number; confidence: number; versatility: number; overallScore: number } {
    return {
      accuracy: (improved.accuracy - baseline.accuracy) / (baseline.accuracy || 1),
      speed: (improved.speed - baseline.speed) / (baseline.speed || 1),
      efficiency: (improved.efficiency - baseline.efficiency) / (baseline.efficiency || 1),
      reliability: (improved.reliability - baseline.reliability) / (baseline.reliability || 1),
      confidence: (improved.confidence - baseline.confidence) / (baseline.confidence || 1),
      versatility: (improved.versatility - baseline.versatility) / (baseline.versatility || 1),
      overallScore: this.calculateOverallScore(baseline, improved)
    };
  }

  /**
   * Calcular score general
   */
  private calculateOverallScore(baseline: EvaluationMetrics, improved: EvaluationMetrics): number {
    const weights = {
      accuracy: 0.30,
      speed: 0.15,
      efficiency: 0.20,
      reliability: 0.20,
      confidence: 0.10,
      versatility: 0.05
    };

    const improvements = {
      accuracy: (improved.accuracy - baseline.accuracy) / Math.max(baseline.accuracy, 0.1),
      speed: (improved.speed - baseline.speed) / Math.max(baseline.speed, 0.1),
      efficiency: (improved.efficiency - baseline.efficiency) / Math.max(baseline.efficiency, 0.1),
      reliability: (improved.reliability - baseline.reliability) / Math.max(baseline.reliability, 0.1),
      confidence: (improved.confidence - baseline.confidence) / Math.max(baseline.confidence, 0.1),
      versatility: (improved.versatility - baseline.versatility) / Math.max(baseline.versatility, 0.1)
    };

    let score = 0;
    for (const [metric, weight] of Object.entries(weights)) {
      score += improvements[metric as keyof typeof improvements] * weight;
    }

    return Math.min(1, Math.max(-1, score));
  }

  /**
   * Calcular ROI (return on investment)
   */
  private calculateROI(
    improvement: Record<string, number>,
    cost: 'low' | 'medium' | 'high'
  ): number {
    const costMultiplier = {
      low: 1.0,
      medium: 0.75,
      high: 0.5
    };

    const overallImprovement = improvement.overallScore;
    const roi = overallImprovement * costMultiplier[cost];

    return Math.min(1, Math.max(-1, roi));
  }

  /**
   * Tomar decisión sobre adoptar mejora
   */
  private makeDecision(
    improvement: Record<string, number>,
    roi: number,
    proposal: ImprovementProposal
  ): 'ADOPT' | 'REJECT' | 'NEEDS_REFINEMENT' {
    const overallScore = improvement.overallScore;

    // Verificar redundancia
    if (Math.abs(overallScore) < this.REDUNDANCY_THRESHOLD) {
      console.log(`   ℹ️  Mejora redundante: diferencia < ${this.REDUNDANCY_THRESHOLD * 100}%`);
      return 'REJECT';
    }

    // Mejora negativa = RECHAZAR
    if (overallScore < 0) {
      console.log(`   ❌ Mejora negativa: ${(overallScore * 100).toFixed(2)}%`);
      return 'REJECT';
    }

    // Mejora buena con buen ROI = ADOPTAR
    if (overallScore >= this.ADOPTION_THRESHOLD && roi >= this.ROI_THRESHOLD) {
      console.log(`   ✅ Mejora valiosa: +${(overallScore * 100).toFixed(2)}%, ROI: ${(roi * 100).toFixed(2)}%`);
      return 'ADOPT';
    }

    // Mejora marginal = NECESITA REFINAMIENTO
    if (overallScore >= 0.05 && overallScore < this.ADOPTION_THRESHOLD) {
      console.log(`   🔄 Mejora marginal: +${(overallScore * 100).toFixed(2)}% - necesita refinamiento`);
      return 'NEEDS_REFINEMENT';
    }

    return 'REJECT';
  }

  /**
   * Generar explicación de la decisión
   */
  private generateReasoning(
    proposal: ImprovementProposal,
    improvement: Record<string, number>,
    roi: number,
    verdict: string
  ): string {
    const parts: string[] = [];

    parts.push(`${proposal.name}:`);
    parts.push(`• Accuracy: ${(improvement.accuracy * 100).toFixed(1)}%`);
    parts.push(`• Speed: ${(improvement.speed * 100).toFixed(1)}%`);
    parts.push(`• Efficiency: ${(improvement.efficiency * 100).toFixed(1)}%`);
    parts.push(`• Reliability: ${(improvement.reliability * 100).toFixed(1)}%`);
    parts.push(`• Overall Score: ${(improvement.overallScore * 100).toFixed(1)}%`);
    parts.push(`• ROI: ${(roi * 100).toFixed(1)}%`);

    if (verdict === 'REJECT') {
      if (Math.abs(improvement.overallScore) < this.REDUNDANCY_THRESHOLD) {
        parts.push(`⚠️  RAZÓN: Cambio redundante (< ${this.REDUNDANCY_THRESHOLD * 100}% diferencia)`);
      } else if (improvement.overallScore < 0) {
        parts.push(`⚠️  RAZÓN: Empeora performance actual`);
      } else {
        parts.push(`⚠️  RAZÓN: ROI insuficiente (< ${this.ROI_THRESHOLD * 100}%)`);
      }
    } else if (verdict === 'ADOPT') {
      parts.push(`✅ RAZÓN: Mejora significativa con ROI positivo`);
    } else {
      parts.push(`🔄 RAZÓN: Mejora marginal - considerar refinamiento`);
    }

    return parts.join('\n');
  }

  /**
   * Calcular confianza en la decisión
   */
  private calculateConfidence(
    improvement: Record<string, number>,
    roi: number
  ): number {
    // Mayor abs(improvement) = mayor confianza
    const improvementConfidence = Math.abs(improvement.overallScore);
    // Mayor abs(ROI) = mayor confianza
    const roiConfidence = Math.abs(roi);

    return (improvementConfidence + roiConfidence) / 2;
  }

  /**
   * Registrar decisión para auditoría
   */
  private recordDecision(proposalId: string, verdict: string): void {
    if (verdict === 'ADOPT') {
      this.adoptedImprovements.push(proposalId);
    } else if (verdict === 'REJECT') {
      this.rejectedImprovements.push(proposalId);
    } else {
      this.refinementNeeded.push(proposalId);
    }
  }

  /**
   * Obtener estadísticas de evaluaciones
   */
  getEvaluationStats(): {
    adopted: number;
    rejected: number;
    refinementNeeded: number;
    adoptionRate: number;
    averageROI: number;
  } {
    const total = this.adoptedImprovements.length + this.rejectedImprovements.length + this.refinementNeeded.length;
    const adoptionRate = total > 0 ? (this.adoptedImprovements.length / total) * 100 : 0;

    return {
      adopted: this.adoptedImprovements.length,
      rejected: this.rejectedImprovements.length,
      refinementNeeded: this.refinementNeeded.length,
      adoptionRate,
      averageROI: 0 // Se calcula con histórico
    };
  }

  /**
   * Reportar auditoría de decisiones
   */
  generateAuditReport(): string {
    const stats = this.getEvaluationStats();

    const report = `
📊 AUDIT REPORT - CRITICAL EVALUATION ENGINE

✅ Adoptadas: ${stats.adopted} mejoras
❌ Rechazadas: ${stats.rejected} cambios redundantes
🔄 Refinamiento: ${stats.refinementNeeded} mejoras marginales

📈 Adoption Rate: ${stats.adoptionRate.toFixed(1)}%
⚖️  Decisiones Críticas: ${stats.adopted + stats.rejected + stats.refinementNeeded} evaluadas

🎯 Política:
• ADOPTAR: Mejora > ${(this.ADOPTION_THRESHOLD * 100).toFixed(0)}% con ROI positivo
• RECHAZAR: Redundante (< ${(this.REDUNDANCY_THRESHOLD * 100).toFixed(0)}% cambio) o negativa
• REFINAR: Mejora marginal (${(this.REDUNDANCY_THRESHOLD * 100).toFixed(0)}-${(this.ADOPTION_THRESHOLD * 100).toFixed(0)}%)

Beneficio: Evita adoptar mejoras innecesarias que complican sin beneficio
`;

    return report;
  }
}

// Exportar instancia singleton
export const criticalEvaluationEngine = new CriticalEvaluationEngine();
