/**
 * ENTITY TRACKER
 *
 * Rastreo de entidades a lo largo de la conversación
 * - Mantiene registro de targets, tools, vulns
 * - Proporciona contexto actualizado
 * - Detecta cuando cambian los targets
 */

import { namedEntityRecognition, NamedEntity } from './NamedEntityRecognition';

export interface TrackedEntity {
  type: string;
  value: string;
  firstMentioned: number;
  lastMentioned: number;
  frequency: number;
  confidence: number;
  context: string[];
}

export interface EntityTrackingSession {
  sessionId: string;
  targets: Map<string, TrackedEntity>;
  tools: Map<string, TrackedEntity>;
  vulnerabilities: Map<string, TrackedEntity>;
  technologies: Map<string, TrackedEntity>;
  allEntities: Map<string, TrackedEntity>;
  startTime: number;
}

export class EntityTracker {
  private sessions: Map<string, EntityTrackingSession> = new Map();
  private targetHistory: Map<string, string[]> = new Map(); // sessionId -> [targets]

  constructor() {
    console.log('\n🎯 [EntityTracker] Inicializando...');
  }

  /**
   * Crear sesión de rastreo
   */
  createSession(sessionId: string): EntityTrackingSession {
    const session: EntityTrackingSession = {
      sessionId,
      targets: new Map(),
      tools: new Map(),
      vulnerabilities: new Map(),
      technologies: new Map(),
      allEntities: new Map(),
      startTime: Date.now()
    };

    this.sessions.set(sessionId, session);
    this.targetHistory.set(sessionId, []);

    console.log(`✅ [EntityTracker] Sesión creada: ${sessionId}`);

    return session;
  }

  /**
   * Procesar mensaje y rastrear entidades
   */
  processMessage(sessionId: string, message: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️  Sesión no encontrada: ${sessionId}`);
      return null;
    }

    // Reconocer entidades
    const nerResult = namedEntityRecognition.recognizeEntities(message);

    // Actualizar rastreo
    for (const entity of nerResult.entities) {
      const key = `${entity.type}:${entity.value}`;
      let tracked = session.allEntities.get(key);

      if (!tracked) {
        tracked = {
          type: entity.type,
          value: entity.value,
          firstMentioned: Date.now(),
          lastMentioned: Date.now(),
          frequency: 1,
          confidence: entity.confidence,
          context: [entity.context || '']
        };
      } else {
        tracked.lastMentioned = Date.now();
        tracked.frequency++;
        if (entity.context) {
          tracked.context.push(entity.context);
        }
      }

      session.allEntities.set(key, tracked);

      // Categorizar
      if (entity.type === 'domain' || entity.type === 'ip-address' || entity.type === 'url') {
        session.targets.set(entity.value, tracked);
      } else if (entity.type === 'tool') {
        session.tools.set(entity.value, tracked);
      } else if (entity.type === 'vulnerability') {
        session.vulnerabilities.set(entity.value, tracked);
      } else if (entity.type === 'technology') {
        session.technologies.set(entity.value, tracked);
      }
    }

    // Rastrear cambios de target
    const currentTargets = Array.from(session.targets.keys());
    const history = this.targetHistory.get(sessionId) || [];

    if (currentTargets.length > 0) {
      const lastTargets = history[history.length - 1]?.split(',') || [];
      const newTargets = currentTargets.filter(t => !lastTargets.includes(t));

      if (newTargets.length > 0) {
        console.log(`🎯 Nuevos targets detectados: ${newTargets.join(', ')}`);
      }

      history.push(currentTargets.join(','));
      this.targetHistory.set(sessionId, history);
    }

    return {
      newEntities: nerResult.entities.length,
      totalTargets: session.targets.size,
      totalTools: session.tools.size,
      totalVulnerabilities: session.vulnerabilities.size,
      nerResult
    };
  }

  /**
   * Obtener entidades activas de la sesión
   */
  getActiveEntities(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Ordenar por frecuencia y recencia
    const sorted = (map: Map<string, TrackedEntity>) => {
      return Array.from(map.values())
        .sort((a, b) => b.frequency - a.frequency || b.lastMentioned - a.lastMentioned)
        .slice(0, 10);
    };

    return {
      targets: sorted(session.targets),
      tools: sorted(session.tools),
      vulnerabilities: sorted(session.vulnerabilities),
      technologies: sorted(session.technologies)
    };
  }

  /**
   * Obtener target principal actual
   */
  getPrimaryTarget(sessionId: string): TrackedEntity | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.targets.size === 0) return null;

    // Target más mencionado recientemente
    const sorted = Array.from(session.targets.values())
      .sort((a, b) => b.lastMentioned - a.lastMentioned || b.frequency - a.frequency);

    return sorted[0] || null;
  }

  /**
   * Obtener herramientas recomendadas para vulnerabilidades
   */
  getRecommendedTools(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session || session.vulnerabilities.size === 0) return [];

    const vulnToTools: Record<string, string[]> = {
      'sql-injection': ['sqlmap', 'burp-suite'],
      'xss': ['burp-suite', 'w3af', 'xsstrike'],
      'rce': ['metasploit', 'burp-suite'],
      'idor': ['burp-suite', 'w3af'],
      'command-injection': ['burp-suite', 'commix'],
      'path-traversal': ['burp-suite', 'nikto'],
      'lfi': ['burp-suite', 'nikto'],
      'rfi': ['burp-suite', 'nikto']
    };

    const recommendedTools = new Set<string>();

    for (const vuln of session.vulnerabilities.values()) {
      const tools = vulnToTools[vuln.value] || [];
      for (const tool of tools) {
        recommendedTools.add(tool);
      }
    }

    return Array.from(recommendedTools);
  }

  /**
   * Detectar cambio de objetivo
   */
  hasTargetChanged(sessionId: string): boolean {
    const history = this.targetHistory.get(sessionId) || [];
    if (history.length < 2) return false;

    const previous = history[history.length - 2];
    const current = history[history.length - 1];

    return previous !== current;
  }

  /**
   * Generar reporte de rastreo
   */
  generateTrackingReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return 'Sesión no encontrada';

    const active = this.getActiveEntities(sessionId);
    const primaryTarget = this.getPrimaryTarget(sessionId);
    const recommendedTools = this.getRecommendedTools(sessionId);
    const duration = Date.now() - session.startTime;

    const report = `
🎯 ENTITY TRACKING REPORT

📊 Resumen
  • Duración: ${(duration / 1000).toFixed(1)}s
  • Entidades totales: ${session.allEntities.size}
  • Targets: ${session.targets.size}
  • Herramientas: ${session.tools.size}
  • Vulnerabilidades: ${session.vulnerabilities.size}

🎯 Target Principal
${primaryTarget ? `  • ${primaryTarget.value} (mencionado ${primaryTarget.frequency}x)` : '  • Ninguno definido'}

🔧 Herramientas Mencionadas
${active.tools.length > 0 ? active.tools.map((t, i) => `  ${i + 1}. ${t.value} (${t.frequency}x)`).join('\n') : '  Ninguna'}

⚠️  Vulnerabilidades
${active.vulnerabilities.length > 0 ? active.vulnerabilities.map((v, i) => `  ${i + 1}. ${v.value}`).join('\n') : '  Ninguna'}

💡 Herramientas Recomendadas
${recommendedTools.length > 0 ? recommendedTools.map((t, i) => `  ${i + 1}. ${t}`).join('\n') : '  No hay recomendaciones'}

🌐 Tecnologías Detectadas
${active.technologies.length > 0 ? active.technologies.map((t, i) => `  ${i + 1}. ${t.value}`).join('\n') : '  Ninguna'}

✨ Beneficio
Jarvis rastrea automáticamente qué está atacando y qué herramientas necesita.
`;

    return report;
  }

  /**
   * Exportar datos de rastreo
   */
  exportTrackingData(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      duration: Date.now() - session.startTime,
      targets: Array.from(session.targets.entries()).map(([k, v]) => ({
        value: k,
        frequency: v.frequency,
        confidence: v.confidence
      })),
      tools: Array.from(session.tools.entries()).map(([k, v]) => ({
        value: k,
        frequency: v.frequency
      })),
      vulnerabilities: Array.from(session.vulnerabilities.entries()).map(([k, v]) => ({
        value: k,
        frequency: v.frequency
      })),
      technologies: Array.from(session.technologies.entries()).map(([k, v]) => ({
        value: k,
        frequency: v.frequency
      }))
    };
  }
}

export const entityTracker = new EntityTracker();
