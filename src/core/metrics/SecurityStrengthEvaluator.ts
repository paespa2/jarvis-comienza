/**
 * SECURITY STRENGTH EVALUATOR
 *
 * Measures Jarvis security strength progression from 65% to 85%+
 * Phase 4: Measurement & Strength Scoring
 */

import { enhancedSecurityKnowledgeBase } from '../knowledge/EnhancedSecurityKnowledgeBase';

export interface StrengthComponent {
  name: string;
  value: number; // 0-1
  weight: number; // 0-1 (contribution to total)
  description: string;
  subMetrics?: Record<string, number>;
}

export interface StrengthSnapshot {
  timestamp: number;
  overallStrength: number;
  components: StrengthComponent[];
  phase: number;
  datasetMetrics: {
    techniquesKnown: number;
    vulnerabilitiesKnown: number;
    promptsProcessed: number;
    cvesCovered: number;
  };
  baseline: boolean; // true if this is baseline measurement
  notes: string;
}

export class SecurityStrengthEvaluator {
  private snapshots: StrengthSnapshot[] = [];
  private baselineStrength: number = 0.65; // Initial 65%
  private currentStrength: number = 0.65;

  constructor() {
    console.log('\n📊 [SecurityStrengthEvaluator] Inicializando...');
  }

  /**
   * Medir fortaleza actual
   */
  measureStrength(phase: number = 0, isBaseline: boolean = false): StrengthSnapshot {
    console.log(`\n📊 Measuring security strength (Phase ${phase})...`);

    const kbStats = enhancedSecurityKnowledgeBase.getStats();

    // Calcular componentes
    const components: StrengthComponent[] = [
      this.measureKnowledgeBreadth(kbStats),
      this.measureExploitationCapability(kbStats),
      this.measureTechniqueMastery(kbStats),
      this.measurePatternRecognition(kbStats)
    ];

    // Calcular fortaleza general
    let totalStrength = 0;
    let totalWeight = 0;

    components.forEach(comp => {
      totalStrength += comp.value * comp.weight;
      totalWeight += comp.weight;
    });

    this.currentStrength = totalStrength / totalWeight;

    const snapshot: StrengthSnapshot = {
      timestamp: Date.now(),
      overallStrength: this.currentStrength,
      components,
      phase,
      datasetMetrics: {
        techniquesKnown: kbStats.totalTechniques,
        vulnerabilitiesKnown: kbStats.totalVulnerabilities,
        promptsProcessed: kbStats.totalPrompts,
        cvesCovered: kbStats.totalInstructions
      },
      baseline: isBaseline,
      notes: this.generatePhaseNotes(phase, this.currentStrength)
    };

    this.snapshots.push(snapshot);

    this.printStrengthReport(snapshot);

    return snapshot;
  }

  /**
   * Medir Knowledge Breadth (30% de la fortaleza)
   */
  private measureKnowledgeBreadth(kbStats: any): StrengthComponent {
    // Knowledge breadth se basa en CVEs y prompts conocidos
    // Baseline: 0 CVEs, Target: 2000+ CVEs = 30% contribution
    const maxCVEs = 2000;
    const cveRatio = Math.min(kbStats.totalInstructions / maxCVEs, 1.0);

    const maxPrompts = 600000;
    const promptRatio = Math.min(kbStats.totalPrompts / maxPrompts, 1.0);

    const breadthValue = (cveRatio * 0.6 + promptRatio * 0.4) * 1.0; // 0-1 scale

    return {
      name: 'Knowledge Breadth',
      value: breadthValue,
      weight: 0.3,
      description: 'CVEs, prompts, and security knowledge coverage',
      subMetrics: {
        cvesCovered: cveRatio,
        promptsCovered: promptRatio
      }
    };
  }

  /**
   * Medir Exploitation Capability (30% de la fortaleza)
   */
  private measureExploitationCapability(kbStats: any): StrengthComponent {
    // Exploitation capability basado en vulnerabilities y instructions
    // Baseline: < 100 conocidas, Target: 5000+
    const maxVulnerabilities = 5000;
    const vulnRatio = Math.min(kbStats.totalVulnerabilities / maxVulnerabilities, 1.0);

    const cveInstructions = kbStats.totalInstructions;
    const maxInstructions = 2000;
    const instructionRatio = Math.min(cveInstructions / maxInstructions, 1.0);

    const exploitValue = (vulnRatio * 0.6 + instructionRatio * 0.4) * 1.0; // 0-1 scale

    return {
      name: 'Exploitation Capability',
      value: exploitValue,
      weight: 0.3,
      description: 'Ability to understand and exploit vulnerabilities',
      subMetrics: {
        vulnerabilitiesKnown: vulnRatio,
        instructionsCovered: instructionRatio
      }
    };
  }

  /**
   * Medir Technique Mastery (20% de la fortaleza)
   */
  private measureTechniqueMastery(kbStats: any): StrengthComponent {
    // Technique mastery based on MITRE ATT&CK techniques known
    // Baseline: 0, Target: 2000+ techniques
    const maxTechniques = 2000;
    const techniqueRatio = Math.min(kbStats.totalTechniques / maxTechniques, 1.0);

    return {
      name: 'Technique Mastery',
      value: techniqueRatio * 1.0, // 0-1 scale
      weight: 0.2,
      description: 'Understanding of MITRE ATT&CK techniques and tactics',
      subMetrics: {
        techniquesKnown: techniqueRatio
      }
    };
  }

  /**
   * Medir Pattern Recognition (20% de la fortaleza)
   */
  private measurePatternRecognition(kbStats: any): StrengthComponent {
    // Pattern recognition based on knowledge graph size
    // More relationships = better pattern recognition
    const maxGraphSize = 50000;
    const graphRatio = Math.min(kbStats.knowledgeGraphSize / maxGraphSize, 1.0);

    return {
      name: 'Pattern Recognition',
      value: graphRatio * 1.0, // 0-1 scale
      weight: 0.2,
      description: 'Ability to recognize security patterns and relationships',
      subMetrics: {
        knowledgeGraphSize: graphRatio
      }
    };
  }

  /**
   * Generar notas según la fase
   */
  private generatePhaseNotes(phase: number, strength: number): string {
    const percentStr = (strength * 100).toFixed(1);

    switch (phase) {
      case 0:
        return `BASELINE MEASUREMENT: ${percentStr}% - Jarvis without HF datasets`;
      case 1:
        return `PHASE 1 COMPLETE: ${percentStr}% - Datasets downloaded and cached`;
      case 2:
        return `PHASE 2 COMPLETE: ${percentStr}% - 600K+ security entities processed`;
      case 3:
        return `PHASE 3 COMPLETE: ${percentStr}% - Full integration into NER, KB, Evolution`;
      case 4:
        return `PHASE 4 COMPLETE: ${percentStr}% - Final measurement and validation`;
      default:
        return `Phase ${phase}: ${percentStr}% strength`;
    }
  }

  /**
   * Imprimir reporte de fortaleza
   */
  private printStrengthReport(snapshot: StrengthSnapshot): void {
    const percent = (snapshot.overallStrength * 100).toFixed(1);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📊 SECURITY STRENGTH REPORT - Phase ${snapshot.phase}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`\n🎯 Overall Strength: ${percent}%`);

    if (snapshot.baseline) {
      console.log(`   [BASELINE MEASUREMENT]`);
    }

    console.log(`\n📈 Component Breakdown:`);
    snapshot.components.forEach(comp => {
      const compPercent = (comp.value * 100).toFixed(1);
      const weightPercent = (comp.weight * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(comp.value * 20)) + '░'.repeat(20 - Math.floor(comp.value * 20));
      console.log(`   ${comp.name.padEnd(25)} [${bar}] ${compPercent}% (weight: ${weightPercent}%)`);

      if (comp.subMetrics) {
        Object.entries(comp.subMetrics).forEach(([metric, value]) => {
          console.log(`      • ${metric}: ${((value as number) * 100).toFixed(1)}%`);
        });
      }
    });

    console.log(`\n📊 Dataset Metrics:`);
    console.log(`   • Techniques Known: ${snapshot.datasetMetrics.techniquesKnown.toLocaleString()}`);
    console.log(`   • Vulnerabilities Known: ${snapshot.datasetMetrics.vulnerabilitiesKnown.toLocaleString()}`);
    console.log(`   • Prompts Processed: ${snapshot.datasetMetrics.promptsProcessed.toLocaleString()}`);
    console.log(`   • CVEs Covered: ${snapshot.datasetMetrics.cvesCovered.toLocaleString()}`);

    console.log(`\n💡 ${snapshot.notes}`);
    console.log(`${'═'.repeat(70)}\n`);
  }

  /**
   * Obtener progresión histórica
   */
  getProgressTimeline(): Array<{
    phase: number;
    strength: number;
    date: string;
    improvement: number;
  }> {
    return this.snapshots.map((snap, index) => ({
      phase: snap.phase,
      strength: snap.overallStrength,
      date: new Date(snap.timestamp).toISOString(),
      improvement: index === 0 ? 0 : snap.overallStrength - this.snapshots[index - 1].overallStrength
    }));
  }

  /**
   * Comparar con baseline
   */
  compareWithBaseline(): {
    baselineStrength: number;
    currentStrength: number;
    improvement: number;
    improvementPercent: number;
    targetStrength: number;
    targetRemaining: number;
  } {
    const baseline = this.snapshots.find(s => s.baseline)?.overallStrength || 0.65;
    const targetStrength = 0.85;
    const improvement = this.currentStrength - baseline;
    const improvementPercent = (improvement / (targetStrength - baseline)) * 100;

    return {
      baselineStrength: baseline,
      currentStrength: this.currentStrength,
      improvement,
      improvementPercent: Math.min(improvementPercent, 100),
      targetStrength,
      targetRemaining: Math.max(0, targetStrength - this.currentStrength)
    };
  }

  /**
   * Obtener snapshot más reciente
   */
  getLatestSnapshot(): StrengthSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  /**
   * Obtener todos los snapshots
   */
  getAllSnapshots(): StrengthSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Generar reporte de mejora
   */
  generateImprovementReport(): string {
    const timeline = this.getProgressTimeline();
    const comparison = this.compareWithBaseline();

    let report = '\n' + '═'.repeat(70) + '\n';
    report += '🎯 JARVIS SECURITY STRENGTH IMPROVEMENT REPORT\n';
    report += '═'.repeat(70) + '\n\n';

    report += `Baseline Strength: ${(comparison.baselineStrength * 100).toFixed(1)}%\n`;
    report += `Current Strength:  ${(comparison.currentStrength * 100).toFixed(1)}%\n`;
    report += `Target Strength:   ${(comparison.targetStrength * 100).toFixed(1)}%\n`;
    report += `Improvement:       +${(comparison.improvement * 100).toFixed(1)}% (${comparison.improvementPercent.toFixed(1)}% toward target)\n`;
    report += `Remaining:         ${(comparison.targetRemaining * 100).toFixed(1)}%\n\n`;

    report += 'Progress Timeline:\n';
    timeline.forEach(point => {
      const percent = (point.strength * 100).toFixed(1);
      const improvementStr = point.improvement > 0 ? `+${(point.improvement * 100).toFixed(1)}%` : '—';
      report += `  Phase ${point.phase}: ${percent}% (${improvementStr})\n`;
    });

    report += '═'.repeat(70) + '\n\n';

    return report;
  }
}

export const securityStrengthEvaluator = new SecurityStrengthEvaluator();
