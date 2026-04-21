/**
 * HACKERONE LEARNING SERVICE
 *
 * Servicio de aprendizaje automático de Jarvis para HackerOne.
 *
 * Cada vez que Jarvis resuelve un caso de HackerOne (assessment, payload,
 * recon, match de programa), este servicio:
 *
 * 1. Crea un LEARNING en Obsidian (memoria local persistente)
 * 2. Publica el conocimiento en Firebase como KnowledgeNode con grafos
 * 3. Vincula nodos relacionados (vulnerabilidad ↔ técnica ↔ programa)
 * 4. Actualiza el modelo nativo de Jarvis con el aprendizaje
 *
 * CONSTITUCIÓN: Art. 2 — Colaboración. Jarvis aprende de cada caso
 * de bug bounty AUTORIZADO para ser mejor socio de paespa.
 * Art. 4 — Evolución obligatoria. El aprendizaje es continuo.
 *
 * LEGAL: Solo opera en programas de bug bounty con scope autorizado.
 * El conocimiento generado es para uso en programas HackerOne legítimos.
 */

import { ObsidianMemoryManager } from '../learning/ObsidianMemoryManager';
import { firebaseServerService, KnowledgeGraphNode } from './firebaseServerService';
import { jarvisNativeModel } from '../core/nativeModel/JarvisNativeModel';

// ============================================
// TIPOS
// ============================================

export interface HackerOneCaseResult {
  type: 'assessment' | 'payload' | 'recon' | 'full_case';
  vulnerabilityType: string;
  severity?: string;
  cvssScore?: number;
  programsFound?: number;
  topProgram?: string;
  estimatedBounty?: number;
  acceptanceProbability?: number;
  payloadsGenerated?: number;
  reconSteps?: number;
  target?: string;
  notes?: string;
}

export interface LearningResult {
  obsidianPath?: string;
  firebaseNodeId?: string;
  nativeModelUpdated: boolean;
  summary: string;
}

// ============================================
// CORE TEACHINGS RELACIONADOS A SEGURIDAD
// ============================================
// Las enseñanzas 40-50 en CoreTeachings son de seguridad/exploitation

const SECURITY_TEACHINGS = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

// ============================================
// MAPAS DE CONOCIMIENTO
// ============================================

const SEVERITY_BOUNTY_MAP: Record<string, { min: number; max: number }> = {
  critical: { min: 5000, max: 50000 },
  high:     { min: 1000, max: 10000 },
  medium:   { min: 200,  max: 2000 },
  low:      { min: 50,   max: 500 },
};

const VULN_RELATED_CONCEPTS: Record<string, string[]> = {
  'sql-injection':  ['database-access', 'authentication-bypass', 'data-exfiltration'],
  'xss':            ['session-hijacking', 'javascript', 'csrf'],
  'rce':            ['system-compromise', 'privilege-escalation', 'backdoor'],
  'lfi':            ['path-traversal', 'source-disclosure', 'log-poisoning'],
  'csrf':           ['session', 'user-actions', 'xss'],
  'idor':           ['authorization', 'access-control', 'privilege-escalation'],
  'ssrf':           ['internal-network', 'cloud-metadata', 'xxe'],
  'xxe':            ['ssrf', 'file-read', 'dos'],
  'sqli':           ['database-access', 'authentication-bypass', 'data-exfiltration'],
};

// ============================================
// HACKERONE LEARNING SERVICE
// ============================================

export class HackerOneLearningService {
  private obsidian: ObsidianMemoryManager;

  constructor(obsidian: ObsidianMemoryManager) {
    this.obsidian = obsidian;
  }

  // -----------------------------------------------
  // APRENDER DE UN CASO RESUELTO
  // -----------------------------------------------

  async learnFromCase(caseResult: HackerOneCaseResult): Promise<LearningResult> {
    const startTime = Date.now();
    console.log(`\n🎓 [HackerOne Learning] Aprendiendo de caso: ${caseResult.vulnerabilityType}`);

    const bountyRange = SEVERITY_BOUNTY_MAP[caseResult.severity || 'medium'];
    const estimatedBounty = caseResult.estimatedBounty || bountyRange?.min || 0;

    // -----------------------------------------------
    // 1. GUARDAR EN OBSIDIAN (memoria local)
    // -----------------------------------------------
    this.saveToObsidian(caseResult, estimatedBounty);

    // -----------------------------------------------
    // 2. GUARDAR EN FIREBASE (grafo de conocimiento)
    // -----------------------------------------------
    const firebaseNodeId = await this.saveToFirebase(caseResult, estimatedBounty);

    // -----------------------------------------------
    // 3. ACTUALIZAR MODELO NATIVO DE JARVIS
    // -----------------------------------------------
    const query = `${caseResult.vulnerabilityType} ${caseResult.type} hackerone`;
    jarvisNativeModel.learn(
      query,
      `Case: ${caseResult.type} - CVSS:${caseResult.cvssScore || 'N/A'} - ${caseResult.programsFound || 0} programs - $${estimatedBounty} bounty`,
      true,
      'hackerone'
    );

    const summary = `Caso HackerOne aprendido: ${caseResult.vulnerabilityType} (${caseResult.severity || 'unknown'}) - ${caseResult.programsFound || 0} programas - $${estimatedBounty} estimado`;

    console.log(`   ✅ Obsidian: actualizado`);
    console.log(`   ${firebaseNodeId ? '✅' : '⚠️ '} Firebase: ${firebaseNodeId || 'no configurado'}`);
    console.log(`   ✅ Modelo nativo: aprendizaje registrado`);
    console.log(`   ⏱️  ${Date.now() - startTime}ms\n`);

    return {
      firebaseNodeId: firebaseNodeId || undefined,
      nativeModelUpdated: true,
      summary,
    };
  }

  // -----------------------------------------------
  // GUARDAR EN OBSIDIAN
  // -----------------------------------------------

  private saveToObsidian(caseResult: HackerOneCaseResult, estimatedBounty: number): void {
    const vulnType = caseResult.vulnerabilityType;
    const severity = caseResult.severity || 'medium';

    // Registrar como LEARNING con confianza basada en CVSS
    const confidence = caseResult.cvssScore
      ? Math.min(caseResult.cvssScore / 10, 1.0)
      : 0.6;

    this.obsidian.registerLearning(
      `HackerOne: ${vulnType.toUpperCase()} (${severity})`,
      `Caso de bug bounty analizado por Jarvis en programa HackerOne autorizado.`,
      'security',
      [
        `Tipo de vulnerabilidad: ${vulnType}`,
        `Severidad CVSS: ${caseResult.cvssScore || 'N/A'} (${severity})`,
        `Programas HackerOne receptivos: ${caseResult.programsFound || 0}`,
        `Programa mejor match: ${caseResult.topProgram || 'N/A'}`,
        `Bounty estimado: $${estimatedBounty} USD`,
        `Probabilidad de aceptación: ${((caseResult.acceptanceProbability || 0.5) * 100).toFixed(0)}%`,
        caseResult.payloadsGenerated ? `Payloads generados: ${caseResult.payloadsGenerated}` : null,
        caseResult.reconSteps ? `Pasos de reconocimiento: ${caseResult.reconSteps}` : null,
        caseResult.notes ? `Notas: ${caseResult.notes}` : null,
      ].filter(Boolean) as string[],
      SECURITY_TEACHINGS
    );

    // Si fue un caso completo (assessment + payload + recon), registrar como MEJORA
    if (caseResult.type === 'full_case' || (caseResult.payloadsGenerated && caseResult.reconSteps)) {
      const impactLevel = severity === 'critical' || severity === 'high' ? 'alto' : 'medio';

      this.obsidian.registerImprovement(
        `Bug Bounty Pipeline: ${vulnType}`,
        `Jarvis automatizó el análisis completo de ${vulnType} para HackerOne`,
        impactLevel as 'alto' | 'medio' | 'bajo',
        `Assessment → Payload → Recon → Match de programas ($${estimatedBounty} bounty estimado)`,
        SECURITY_TEACHINGS
      );
    }

    // Siempre registrar como success si encontró programas
    if ((caseResult.programsFound || 0) > 0) {
      this.obsidian.registerSuccess(
        `Vulnerabilidad ${vulnType} mapeada a ${caseResult.programsFound} programas HackerOne`,
        `Top: ${caseResult.topProgram || 'N/A'} | Bounty est.: $${estimatedBounty}`,
        'acceptance_probability',
        `${((caseResult.acceptanceProbability || 0.5) * 100).toFixed(0)}%`,
        SECURITY_TEACHINGS
      );
    }
  }

  // -----------------------------------------------
  // GUARDAR EN FIREBASE (grafo de conocimiento)
  // -----------------------------------------------

  private async saveToFirebase(caseResult: HackerOneCaseResult, estimatedBounty: number): Promise<string | null> {
    if (!firebaseServerService.isConfigured()) return null;

    const vulnKey = caseResult.vulnerabilityType.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Crear nodo principal de la vulnerabilidad
    const mainNodeId = await firebaseServerService.saveKnowledgeNode({
      title: `Vulnerability: ${caseResult.vulnerabilityType}`,
      content: `
## ${caseResult.vulnerabilityType.toUpperCase()}

**Severidad:** ${caseResult.severity || 'medium'} | **CVSS:** ${caseResult.cvssScore || 'N/A'}
**Programas HackerOne:** ${caseResult.programsFound || 0}
**Top Program:** ${caseResult.topProgram || 'N/A'}
**Bounty Estimado:** $${estimatedBounty} USD
**Probabilidad Aceptación:** ${((caseResult.acceptanceProbability || 0.5) * 100).toFixed(0)}%
${caseResult.notes ? `\n**Notas:** ${caseResult.notes}` : ''}

> Aprendizaje automático de Jarvis — Constitución Art. 2 & Art. 4
      `.trim(),
      category: 'hackerone',
      tags: [
        'hackerone',
        'bug-bounty',
        vulnKey,
        caseResult.severity || 'medium',
        `cvss-${Math.floor(caseResult.cvssScore || 5)}`,
      ],
      links: [],
      cvssScore: caseResult.cvssScore,
      severity: caseResult.severity,
      bountyEstimate: estimatedBounty,
      source: 'hackerone',
    });

    if (!mainNodeId) return null;

    // Guardar registro de aprendizaje
    await firebaseServerService.saveHackerOneLearning({
      vulnerabilityType: caseResult.vulnerabilityType,
      severity: caseResult.severity || 'medium',
      cvssScore: caseResult.cvssScore || 5,
      programsFound: caseResult.programsFound || 0,
      topProgram: caseResult.topProgram,
      estimatedBounty,
      acceptanceProbability: caseResult.acceptanceProbability || 0.5,
      payloadsGenerated: caseResult.payloadsGenerated || 0,
      reconStepsGenerated: caseResult.reconSteps || 0,
      knowledgeNodeId: mainNodeId,
      constitutionallyValid: true,
    });

    // Crear y enlazar nodos de conceptos relacionados
    const relatedConcepts = VULN_RELATED_CONCEPTS[vulnKey] || [];
    for (const concept of relatedConcepts.slice(0, 3)) {
      const relatedNodeId = await firebaseServerService.saveKnowledgeNode({
        title: `Concept: ${concept}`,
        content: `Concepto de seguridad relacionado con ${caseResult.vulnerabilityType}: ${concept}`,
        category: 'security',
        tags: ['concept', 'security', concept],
        links: [mainNodeId],
        source: 'learning',
      });

      if (relatedNodeId) {
        await firebaseServerService.linkNodes(mainNodeId, relatedNodeId);
      }
    }

    // Crear nodo del programa HackerOne si existe
    if (caseResult.topProgram) {
      const programNodeId = await firebaseServerService.saveKnowledgeNode({
        title: `H1 Program: ${caseResult.topProgram}`,
        content: `Programa HackerOne: ${caseResult.topProgram}\nAcepta: ${caseResult.vulnerabilityType}\nBounty estimado: $${estimatedBounty}`,
        category: 'hackerone',
        tags: ['program', 'hackerone', caseResult.topProgram.toLowerCase()],
        links: [mainNodeId],
        source: 'hackerone',
      });

      if (programNodeId) {
        await firebaseServerService.linkNodes(mainNodeId, programNodeId);
      }
    }

    return mainNodeId;
  }

  // -----------------------------------------------
  // APRENDIZAJE MASIVO: procesar múltiples casos
  // -----------------------------------------------

  async learnFromBatch(cases: HackerOneCaseResult[]): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const caseResult of cases) {
      try {
        await this.learnFromCase(caseResult);
        processed++;
        // Pequeña pausa entre casos para no saturar Firebase
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        console.warn(`[HackerOneLearning] Error en caso ${caseResult.vulnerabilityType}:`, error);
        failed++;
      }
    }

    console.log(`\n📚 Batch learning completo: ${processed} procesados, ${failed} fallidos`);
    return { processed, failed };
  }
}

// Singleton con ObsidianMemoryManager - se inicializa cuando se importa
let _learningService: HackerOneLearningService | null = null;

export function getHackerOneLearningService(obsidian: ObsidianMemoryManager): HackerOneLearningService {
  if (!_learningService) {
    _learningService = new HackerOneLearningService(obsidian);
  }
  return _learningService;
}
