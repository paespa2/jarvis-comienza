/**
 * LIVE PREVIEW MANAGER
 *
 * Sistema de streaming en tiempo real de lo que está haciendo Jarvis
 * WebSocket para visualizar navegación, ejecución, análisis en vivo
 *
 * ✨ FASE 4b: Visualización en Tiempo Real
 */

import { EventEmitter } from 'events';

export interface StreamEvent {
  id: string;
  type: 'action' | 'screenshot' | 'analysis' | 'decision' | 'learning' | 'error' | 'status';
  title: string;
  description: string;
  data?: any;
  timestamp: number;
  severity?: 'info' | 'warning' | 'error' | 'success';
  context?: {
    sessionId?: string;
    system?: string;
    duration?: number;
  };
}

export interface LiveSession {
  id: string;
  type: 'navigation' | 'execution' | 'reasoning' | 'learning';
  startTime: number;
  endTime?: number;
  events: StreamEvent[];
  subscribers: Set<(event: StreamEvent) => void>;
  status: 'active' | 'paused' | 'completed';
  metadata: Record<string, any>;
}

export class LivePreviewManager extends EventEmitter {
  private sessions: Map<string, LiveSession> = new Map();
  private globalSubscribers: Set<(event: StreamEvent) => void> = new Set();
  private eventHistory: StreamEvent[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    console.log('\n📡 [LivePreviewManager] Inicializando...');
  }

  /**
   * Crear nueva sesión de streaming
   */
  createSession(
    type: 'navigation' | 'execution' | 'reasoning' | 'learning',
    metadata?: Record<string, any>
  ): LiveSession {
    const session: LiveSession = {
      id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      startTime: Date.now(),
      events: [],
      subscribers: new Set(),
      status: 'active',
      metadata: metadata || {}
    };

    this.sessions.set(session.id, session);
    console.log(`\n🎬 [LivePreview] Sesión creada: ${session.id} (${type})`);

    // Emitir evento de inicio de sesión
    this.broadcastEvent({
      id: `evt-${Date.now()}`,
      type: 'status',
      title: `Sesión de ${type} iniciada`,
      description: `ID: ${session.id}`,
      timestamp: Date.now(),
      severity: 'info',
      context: {
        sessionId: session.id,
        system: 'LivePreview'
      }
    });

    return session;
  }

  /**
   * Registrar evento en sesión
   */
  recordEvent(sessionId: string, event: Omit<StreamEvent, 'id' | 'timestamp'>): StreamEvent {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️  Sesión no encontrada: ${sessionId}`);
      return { ...event, id: '', timestamp: 0 };
    }

    const streamEvent: StreamEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      context: {
        ...(event.context || {}),
        sessionId
      }
    };

    session.events.push(streamEvent);

    // Guardar en historial global
    this.eventHistory.push(streamEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Broadcast a subscribers
    this.broadcastEvent(streamEvent);

    // Log en consola
    this.logEventToConsole(streamEvent);

    return streamEvent;
  }

  /**
   * Broadcast evento a todos los subscribers
   */
  private broadcastEvent(event: StreamEvent): void {
    // Subscribers globales
    for (const subscriber of this.globalSubscribers) {
      try {
        subscriber(event);
      } catch (err) {
        console.error('Error en subscriber global:', err);
      }
    }

    // Subscribers de sesión específica
    if (event.context?.sessionId) {
      const session = this.sessions.get(event.context.sessionId);
      if (session) {
        for (const subscriber of session.subscribers) {
          try {
            subscriber(event);
          } catch (err) {
            console.error('Error en subscriber de sesión:', err);
          }
        }
      }
    }

    // Emitir evento para Node.js EventEmitter
    this.emit('event', event);
  }

  /**
   * Log visual en consola
   */
  private logEventToConsole(event: StreamEvent): void {
    const icon = this.getEventIcon(event.type, event.severity);
    const timestamp = new Date(event.timestamp).toLocaleTimeString();

    console.log(
      `${icon} [${timestamp}] ${event.title}: ${event.description}`
    );

    if (event.data) {
      console.log(`   → Datos:`, event.data);
    }
  }

  /**
   * Obtener icono según tipo de evento
   */
  private getEventIcon(type: string, severity?: string): string {
    if (severity === 'error') return '❌';
    if (severity === 'warning') return '⚠️';
    if (severity === 'success') return '✅';

    switch (type) {
      case 'action': return '🎯';
      case 'screenshot': return '📸';
      case 'analysis': return '🔬';
      case 'decision': return '💡';
      case 'learning': return '🧠';
      case 'status': return '📡';
      default: return '•';
    }
  }

  /**
   * Suscribirse a eventos de sesión
   */
  subscribeToSession(
    sessionId: string,
    callback: (event: StreamEvent) => void
  ): () => void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Sesión no encontrada: ${sessionId}`);
      return () => {};
    }

    session.subscribers.add(callback);

    // Retornar función para unsubscribe
    return () => {
      session.subscribers.delete(callback);
    };
  }

  /**
   * Suscribirse a todos los eventos globalmente
   */
  subscribeGlobal(callback: (event: StreamEvent) => void): () => void {
    this.globalSubscribers.add(callback);

    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Registrar screenshot con metadata
   */
  recordScreenshot(
    sessionId: string,
    screenshotPath: string,
    pageInfo?: { url?: string; title?: string; description?: string }
  ): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'screenshot',
      title: pageInfo?.title || 'Screenshot capturado',
      description: pageInfo?.description || screenshotPath,
      data: {
        path: screenshotPath,
        url: pageInfo?.url,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });
  }

  /**
   * Registrar acción realizada
   */
  recordAction(
    sessionId: string,
    action: string,
    details?: Record<string, any>
  ): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'action',
      title: action,
      description: details?.description || action,
      data: details,
      severity: 'info'
    });
  }

  /**
   * Registrar análisis realizado
   */
  recordAnalysis(
    sessionId: string,
    analysisTitle: string,
    results?: Record<string, any>
  ): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'analysis',
      title: analysisTitle,
      description: `Análisis completado`,
      data: results,
      severity: 'info'
    });
  }

  /**
   * Registrar decisión tomada
   */
  recordDecision(
    sessionId: string,
    decision: string,
    reasoning?: string
  ): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'decision',
      title: decision,
      description: reasoning || decision,
      severity: 'info'
    });
  }

  /**
   * Registrar aprendizaje adquirido
   */
  recordLearning(
    sessionId: string,
    topic: string,
    insights: Record<string, any>
  ): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'learning',
      title: `Aprendizaje: ${topic}`,
      description: `Adquirió conocimiento sobre ${topic}`,
      data: insights,
      severity: 'success'
    });
  }

  /**
   * Registrar error
   */
  recordError(sessionId: string, error: string, details?: Record<string, any>): StreamEvent {
    return this.recordEvent(sessionId, {
      type: 'error',
      title: 'Error',
      description: error,
      data: details,
      severity: 'error'
    });
  }

  /**
   * Finalizar sesión
   */
  endSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.endTime = Date.now();
    session.status = 'completed';

    const duration = session.endTime - session.startTime;
    console.log(`\n✅ Sesión completada: ${sessionId} (${duration}ms)`);

    this.recordEvent(sessionId, {
      type: 'status',
      title: 'Sesión finalizada',
      description: `Duración: ${duration}ms, Eventos: ${session.events.length}`,
      severity: 'info'
    });

    return {
      id: session.id,
      type: session.type,
      duration,
      eventCount: session.events.length,
      status: 'completed'
    };
  }

  /**
   * Obtener sesión
   */
  getSession(sessionId: string): LiveSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Obtener eventos de sesión
   */
  getSessionEvents(sessionId: string): StreamEvent[] {
    const session = this.sessions.get(sessionId);
    return session?.events || [];
  }

  /**
   * Obtener todas las sesiones activas
   */
  getActiveSessions(): LiveSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Obtener historial de eventos
   */
  getEventHistory(limit = 100): StreamEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Obtener resumen de sesión
   */
  getSessionSummary(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const eventsByType = session.events.reduce((acc, evt) => {
      acc[evt.type] = (acc[evt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      id: session.id,
      type: session.type,
      status: session.status,
      duration: (session.endTime || Date.now()) - session.startTime,
      eventCount: session.events.length,
      eventsByType,
      timeline: session.events.map(e => ({
        type: e.type,
        title: e.title,
        time: new Date(e.timestamp).toLocaleTimeString(),
        severity: e.severity
      })),
      startTime: new Date(session.startTime).toISOString(),
      endTime: session.endTime ? new Date(session.endTime).toISOString() : null
    };
  }

  /**
   * Generar reporte de sesión
   */
  generateSessionReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '❌ Sesión no encontrada';

    const summary = this.getSessionSummary(sessionId);

    const report = `
🎬 LIVE PREVIEW REPORT - ${session.type.toUpperCase()}

📊 Información General
  • ID: ${session.id}
  • Estado: ${session.status.toUpperCase()}
  • Duración: ${summary.duration}ms
  • Eventos registrados: ${summary.eventCount}

📈 Eventos por tipo
${Object.entries(summary.eventsByType).map(([type, count]) => `  • ${type}: ${count}`).join('\n')}

⏱️  Timeline
${summary.timeline.slice(-20).map((e: any) => `  ${e.time} | [${e.type.toUpperCase()}] ${e.title}`).join('\n')}

✨ Metadata
${Object.entries(session.metadata).map(([k, v]) => `  • ${k}: ${JSON.stringify(v)}`).join('\n')}
`;

    return report;
  }
}

export const livePreviewManager = new LivePreviewManager();
