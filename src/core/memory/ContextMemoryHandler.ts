/**
 * CONTEXT MEMORY HANDLER
 *
 * Integra Context Memory en el flujo de conversación
 * - Mantiene sesiones de contexto para cada usuario
 * - Proporciona contexto a sistemas de reasoning
 * - Detecta cambios de objetivo/target
 */

import { contextMemoryManager, ConversationContext } from './ContextMemoryManager';

export class ContextMemoryHandler {
  private userSessions: Map<string, string> = new Map(); // userId -> sessionId

  constructor() {
    console.log('\n💬 [ContextMemoryHandler] Inicializando...');
  }

  /**
   * Obtener o crear sesión para usuario
   */
  getOrCreateSession(userId?: string): string {
    if (userId && this.userSessions.has(userId)) {
      return this.userSessions.get(userId)!;
    }

    const context = contextMemoryManager.createSession(userId);
    if (userId) {
      this.userSessions.set(userId, context.sessionId);
    }

    return context.sessionId;
  }

  /**
   * Procesar mensaje de usuario
   */
  processUserMessage(sessionId: string, message: string, intent?: string): any {
    const msg = contextMemoryManager.addMessage(sessionId, 'user', message, intent);

    if (!msg) {
      return { error: 'Sesión no encontrada' };
    }

    // Obtener contexto para reasoning
    const context = contextMemoryManager.getContextForReasoning(sessionId);
    const summary = contextMemoryManager.getContextSummary(sessionId);

    return {
      message: msg,
      context,
      summary,
      shouldUpdateObjective: msg.entities.some(e => e.type === 'objective'),
      shouldUpdateTarget: msg.entities.some(e => e.type === 'target')
    };
  }

  /**
   * Procesar respuesta de Jarvis
   */
  processJarvisResponse(sessionId: string, response: string, intent?: string): any {
    const msg = contextMemoryManager.addMessage(sessionId, 'jarvis', response, intent);

    if (!msg) {
      return { error: 'Sesión no encontrada' };
    }

    return { message: msg };
  }

  /**
   * Obtener prompts contextuales para mejorar reasoning
   */
  getContextualPrompts(sessionId: string): string {
    const context = contextMemoryManager.getContextForReasoning(sessionId);
    if (!context) return '';

    let prompt = '';

    if (context.currentObjective) {
      prompt += `\n📌 Objetivo actual: ${context.currentObjective}`;
    }

    if (context.currentTarget) {
      prompt += `\n🔗 Target: ${context.currentTarget}`;
    }

    if (context.tools.length > 0) {
      prompt += `\n🔧 Herramientas disponibles: ${context.tools.join(', ')}`;
    }

    if (context.recentContext.length > 0) {
      prompt += '\n\n📝 Contexto reciente:';
      for (const msg of context.recentContext.slice(-3)) {
        prompt += `\n  [${msg.role}]: ${msg.content.substring(0, 100)}...`;
      }
    }

    return prompt;
  }

  /**
   * Detectar cambios de contexto
   */
  detectContextChanges(sessionId: string): any {
    const context = contextMemoryManager.getContextForReasoning(sessionId);
    if (!context) return null;

    const changes = {
      newObjective: false,
      newTarget: false,
      newTools: false,
      objectiveChanged: false
    };

    // Comparar con mensajes anteriores
    const history = contextMemoryManager.getConversationHistory(sessionId, 10);
    const oldObjectives = new Set<string>();
    const oldTargets = new Set<string>();

    for (const msg of history.slice(0, -1)) {
      if (msg.entities) {
        for (const entity of msg.entities) {
          if (entity.type === 'objective') oldObjectives.add(entity.value);
          if (entity.type === 'target') oldTargets.add(entity.value);
        }
      }
    }

    // Detectar cambios
    if (context.currentObjective && !oldObjectives.has(context.currentObjective)) {
      changes.newObjective = true;
    }

    if (context.currentTarget && !oldTargets.has(context.currentTarget)) {
      changes.newTarget = true;
    }

    return changes;
  }

  /**
   * Obtener recomendaciones basadas en contexto
   */
  getContextBasedRecommendations(sessionId: string): string[] {
    const summary = contextMemoryManager.getContextSummary(sessionId);
    if (!summary) return [];

    const recommendations: string[] = [];

    // Recomendar acciones basadas en objetivo
    if (summary.mainObjective) {
      if (summary.mainObjective.includes('exploit') || summary.mainObjective.includes('exploit')) {
        recommendations.push('Considerar Metasploit para automatizar exploitation');
      }
      if (summary.mainObjective.includes('scan') || summary.mainObjective.includes('escanear')) {
        recommendations.push('Usar nmap para reconocimiento de puertos');
      }
      if (summary.mainObjective.includes('sql')) {
        recommendations.push('Usar sqlmap para tests SQL injection');
      }
    }

    // Recomendar herramientas no usadas
    if (summary.usedTools.length === 0) {
      recommendations.push('Considerar usar herramientas de seguridad como nmap, burp-suite');
    }

    // Recomendar guardado de progreso
    if (summary.messageCount > 20) {
      recommendations.push('Considerar guardar sesión de contexto para referencia futura');
    }

    return recommendations;
  }

  /**
   * Obtener historial para contexto de chat
   */
  getChatHistory(sessionId: string, limit = 10): Array<{ role: string; content: string }> {
    const history = contextMemoryManager.getConversationHistory(sessionId, limit);
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Guardar sesión
   */
  async saveSession(sessionId: string): Promise<boolean> {
    return contextMemoryManager.saveSession(sessionId);
  }

  /**
   * Finalizar sesión
   */
  endSession(sessionId: string): any {
    // Guardar antes de finalizar
    contextMemoryManager.saveSession(sessionId);

    return contextMemoryManager.endSession(sessionId);
  }

  /**
   * Generar resumen de conversación
   */
  generateConversationSummary(sessionId: string): string {
    const summary = contextMemoryManager.getContextSummary(sessionId);
    if (!summary) return 'Sesión no encontrada';

    let text = `
📋 RESUMEN DE CONVERSACIÓN

🎯 Objetivo Principal: ${summary.mainObjective || 'No definido'}

Objetivos Relacionados:
${summary.relatedObjectives.length > 0 ? summary.relatedObjectives.map((o: string) => `  • ${o}`).join('\n') : '  Ninguno'}

🔧 Herramientas Usadas:
${summary.usedTools.length > 0 ? summary.usedTools.map((t: string) => `  • ${t}`).join('\n') : '  Ninguna'}

🔗 Targets:
${summary.keyEntities.targets.length > 0 ? summary.keyEntities.targets.map((t: string) => `  • ${t}`).join('\n') : '  Ninguno'}

📊 Estadísticas
  • Mensajes: ${summary.messageCount}
  • Duración: ${(summary.conversationDuration / 1000).toFixed(1)}s
  • Coherencia: ${(summary.coherenceScore * 100).toFixed(0)}%
`;

    return text;
  }

  /**
   * Obtener todas las sesiones activas
   */
  getActiveSessions(): any {
    const stats = contextMemoryManager.getMemoryStats();
    return stats;
  }

  /**
   * Generar reporte completo
   */
  generateFullReport(): string {
    let report = contextMemoryManager.generateMemoryReport();

    // Agregar info de usuario
    report += `\n\n👥 Mapeo de Usuarios a Sesiones
${Array.from(this.userSessions.entries()).map(([userId, sessionId]) => `  • ${userId}: ${sessionId}`).join('\n')}`;

    return report;
  }
}

export const contextMemoryHandler = new ContextMemoryHandler();
