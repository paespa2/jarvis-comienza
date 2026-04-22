/**
 * CONTEXT MEMORY MANAGER
 *
 * Sistema de memoria contextual para conversaciones
 * - Mantiene historial de conversación coherente
 * - Extrae entidades principales (usuarios, objetivos, tools)
 * - Proporciona contexto a sistemas de reasoning
 * - Rastreo de estado de conversación
 *
 * ✨ FASE 7: Conversaciones Inteligentes y Coherentes
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface Message {
  id: string;
  role: 'user' | 'jarvis';
  content: string;
  timestamp: number;
  intent?: string;
  entities?: Entity[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
}

export interface Entity {
  type: 'person' | 'target' | 'tool' | 'objective' | 'location' | 'time';
  value: string;
  confidence: number;
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  currentObjective?: string;
  currentTarget?: string;
  tools: Set<string>;
  entities: Map<string, Entity>;
  messageHistory: Message[];
  startTime: number;
  lastActivity: number;
  status: 'active' | 'paused' | 'completed';
  metadata: Record<string, any>;
}

export interface ContextSummary {
  sessionId: string;
  mainObjective?: string;
  relatedObjectives: string[];
  usedTools: string[];
  keyEntities: Record<string, string[]>;
  messageCount: number;
  conversationDuration: number;
  coherenceScore: number;
}

export class ContextMemoryManager {
  private sessions: Map<string, ConversationContext> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();
  private memoryDir: string = './context-memory';
  private maxHistoryPerSession = 100;

  constructor() {
    console.log('\n🧠 [ContextMemoryManager] Inicializando...');
    this.initializeEntityPatterns();
    this.ensureMemoryDirectory();
  }

  /**
   * Inicializar patrones para extraer entidades
   */
  private initializeEntityPatterns(): void {
    // Patrones para objetivos
    this.entityPatterns.set('objective', /(?:objetivo|goal|quiero|necesito|debo)\s+(.+?)(?:\.|,|$)/i);

    // Patrones para herramientas
    this.entityPatterns.set('tool', /(?:herramienta|tool|usando|con)\s+(nmap|metasploit|burp|sqlmap|wireshark|hydra|python|bash|git|curl|ffuf|gobuster)/i);

    // Patrones para targets
    this.entityPatterns.set('target', /(?:target|objetivo|atacar|analizar|en)\s+(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);

    // Patrones para usuarios
    this.entityPatterns.set('person', /(?:soy|me llamo|mi nombre es|i'm|i am)\s+([a-zA-Z]+)/i);

    // Patrones de tiempo
    this.entityPatterns.set('time', /(?:ahora|después|mañana|hoy|esta (noche|mañana|semana)|en\s+\d+\s+(minutos|horas|días))/i);
  }

  /**
   * Asegurar que existe directorio de memoria
   */
  private async ensureMemoryDirectory(): Promise<void> {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  /**
   * Crear nueva sesión de conversación
   */
  createSession(userId?: string, metadata?: Record<string, any>): ConversationContext {
    const context: ConversationContext = {
      sessionId: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tools: new Set(),
      entities: new Map(),
      messageHistory: [],
      startTime: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      metadata: metadata || {}
    };

    this.sessions.set(context.sessionId, context);
    console.log(`\n✅ [ContextMemory] Nueva sesión: ${context.sessionId} (usuario: ${userId || 'anónimo'})`);

    return context;
  }

  /**
   * Agregar mensaje a la sesión
   */
  addMessage(
    sessionId: string,
    role: 'user' | 'jarvis',
    content: string,
    intent?: string
  ): Message | null {
    const context = this.sessions.get(sessionId);
    if (!context) {
      console.warn(`⚠️  Sesión no encontrada: ${sessionId}`);
      return null;
    }

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      intent,
      entities: [],
      sentiment: this.analyzeSentiment(content),
      confidence: 0.8
    };

    // Extraer entidades del mensaje
    message.entities = this.extractEntities(content);

    // Actualizar contexto con nuevas entidades
    for (const entity of message.entities) {
      context.entities.set(`${entity.type}-${entity.value}`, entity);

      // Actualizar objetivo actual
      if (entity.type === 'objective' && !context.currentObjective) {
        context.currentObjective = entity.value;
        console.log(`🎯 Objetivo detectado: ${entity.value}`);
      }

      // Actualizar target actual
      if (entity.type === 'target' && !context.currentTarget) {
        context.currentTarget = entity.value;
        console.log(`🔗 Target detectado: ${entity.value}`);
      }

      // Registrar herramientas
      if (entity.type === 'tool') {
        context.tools.add(entity.value);
      }
    }

    // Agregar a historial
    context.messageHistory.push(message);
    context.lastActivity = Date.now();

    // Limitar historial
    if (context.messageHistory.length > this.maxHistoryPerSession) {
      context.messageHistory = context.messageHistory.slice(-this.maxHistoryPerSession);
    }

    console.log(`💬 [${role === 'user' ? 'Usuario' : 'Jarvis'}] ${content.substring(0, 50)}...`);

    return message;
  }

  /**
   * Extraer entidades del texto
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    for (const [type, pattern] of this.entityPatterns) {
      const match = text.match(pattern as RegExp);
      if (match) {
        entities.push({
          type: type as any,
          value: match[1] || match[0],
          confidence: 0.85
        });
      }
    }

    // Detectar herramientas específicas de seguridad
    const securityTools = ['nmap', 'metasploit', 'burp', 'sqlmap', 'wireshark', 'hydra', 'ffuf', 'gobuster'];
    for (const tool of securityTools) {
      if (new RegExp(`\\b${tool}\\b`, 'i').test(text)) {
        entities.push({
          type: 'tool',
          value: tool,
          confidence: 0.95
        });
      }
    }

    return entities;
  }

  /**
   * Analizar sentimiento del mensaje
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lower = text.toLowerCase();

    const positive = ['bien', 'bien', 'excelente', 'perfecto', 'gracias', 'gracias', 'awesome', 'great'];
    const negative = ['error', 'problema', 'no funciona', 'falla', 'malo', 'terrible', 'failed'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positive) {
      if (lower.includes(word)) positiveCount++;
    }

    for (const word of negative) {
      if (lower.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Obtener contexto para reasoning
   */
  getContextForReasoning(sessionId: string): any {
    const context = this.sessions.get(sessionId);
    if (!context) return null;

    const entities = Array.from(context.entities.values());
    const recentMessages = context.messageHistory.slice(-5);

    return {
      sessionId,
      userId: context.userId,
      currentObjective: context.currentObjective,
      currentTarget: context.currentTarget,
      tools: Array.from(context.tools),
      keyEntities: {
        objectives: entities.filter(e => e.type === 'objective').map(e => e.value),
        targets: entities.filter(e => e.type === 'target').map(e => e.value),
        tools: entities.filter(e => e.type === 'tool').map(e => e.value),
        persons: entities.filter(e => e.type === 'person').map(e => e.value)
      },
      recentContext: recentMessages.map(m => ({
        role: m.role,
        content: m.content,
        intent: m.intent
      })),
      conversationMetrics: {
        totalMessages: context.messageHistory.length,
        duration: Date.now() - context.startTime,
        lastActivity: Date.now() - context.lastActivity
      }
    };
  }

  /**
   * Obtener resumen de contexto
   */
  getContextSummary(sessionId: string): ContextSummary | null {
    const context = this.sessions.get(sessionId);
    if (!context) return null;

    const entities = Array.from(context.entities.values());

    // Calcular coherencia basada en consistencia de objetivos
    let coherenceScore = 0.8;
    if (context.currentObjective && context.currentTarget) {
      coherenceScore = 0.95; // Muy coherente si tiene objetivo y target claros
    }

    return {
      sessionId,
      mainObjective: context.currentObjective,
      relatedObjectives: entities
        .filter(e => e.type === 'objective')
        .map(e => e.value),
      usedTools: Array.from(context.tools),
      keyEntities: {
        targets: entities.filter(e => e.type === 'target').map(e => e.value),
        tools: entities.filter(e => e.type === 'tool').map(e => e.value),
        persons: entities.filter(e => e.type === 'person').map(e => e.value),
        times: entities.filter(e => e.type === 'time').map(e => e.value)
      },
      messageCount: context.messageHistory.length,
      conversationDuration: Date.now() - context.startTime,
      coherenceScore
    };
  }

  /**
   * Obtener historial de conversación
   */
  getConversationHistory(sessionId: string, limit = 20): Message[] {
    const context = this.sessions.get(sessionId);
    if (!context) return [];

    return context.messageHistory.slice(-limit);
  }

  /**
   * Obtener mensaje anterior más relevante
   */
  getRelevantContext(sessionId: string, currentMessage: string): Message[] {
    const context = this.sessions.get(sessionId);
    if (!context) return [];

    const currentLower = currentMessage.toLowerCase();
    const relevant = context.messageHistory.filter(m => {
      const msgLower = m.content.toLowerCase();
      // Relevancia: palabras clave compartidas, mismo intent, mismo role previo
      return msgLower.split(' ').some(word =>
        currentLower.includes(word) && word.length > 3
      );
    });

    return relevant.slice(-5);
  }

  /**
   * Actualizar objetivo de la conversación
   */
  updateObjective(sessionId: string, objective: string): boolean {
    const context = this.sessions.get(sessionId);
    if (!context) return false;

    context.currentObjective = objective;
    console.log(`🎯 Objetivo actualizado: ${objective}`);

    return true;
  }

  /**
   * Actualizar target de la conversación
   */
  updateTarget(sessionId: string, target: string): boolean {
    const context = this.sessions.get(sessionId);
    if (!context) return false;

    context.currentTarget = target;
    console.log(`🔗 Target actualizado: ${target}`);

    return true;
  }

  /**
   * Finalizar sesión
   */
  endSession(sessionId: string): any {
    const context = this.sessions.get(sessionId);
    if (!context) return null;

    context.status = 'completed';
    const summary = this.getContextSummary(sessionId);

    const duration = Date.now() - context.startTime;
    console.log(`\n✅ Sesión finalizada: ${sessionId}`);
    console.log(`   Duración: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Mensajes: ${context.messageHistory.length}`);
    console.log(`   Objetivo: ${context.currentObjective || 'N/A'}`);

    return {
      sessionId,
      duration,
      messageCount: context.messageHistory.length,
      summary
    };
  }

  /**
   * Guardar sesión a disco
   */
  async saveSession(sessionId: string): Promise<boolean> {
    try {
      const context = this.sessions.get(sessionId);
      if (!context) return false;

      const filePath = path.join(this.memoryDir, `${sessionId}.json`);

      const data = {
        sessionId: context.sessionId,
        userId: context.userId,
        currentObjective: context.currentObjective,
        currentTarget: context.currentTarget,
        tools: Array.from(context.tools),
        entities: Array.from(context.entities.entries()).map(([k, v]) => ({ key: k, ...v })),
        messageHistory: context.messageHistory,
        startTime: context.startTime,
        lastActivity: context.lastActivity,
        status: context.status,
        metadata: context.metadata
      };

      await writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Sesión guardada: ${filePath}`);

      return true;
    } catch (err: any) {
      console.error(`❌ Error guardando sesión: ${err.message}`);
      return false;
    }
  }

  /**
   * Cargar sesión desde disco
   */
  async loadSession(sessionId: string): Promise<ConversationContext | null> {
    try {
      const filePath = path.join(this.memoryDir, `${sessionId}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      const context: ConversationContext = {
        sessionId: data.sessionId,
        userId: data.userId,
        currentObjective: data.currentObjective,
        currentTarget: data.currentTarget,
        tools: new Set(data.tools),
        entities: new Map(data.entities.map((e: any) => {
          const { key, ...entity } = e;
          return [key, entity];
        })),
        messageHistory: data.messageHistory,
        startTime: data.startTime,
        lastActivity: data.lastActivity,
        status: data.status,
        metadata: data.metadata
      };

      this.sessions.set(sessionId, context);
      console.log(`📂 Sesión cargada: ${sessionId}`);

      return context;
    } catch (err: any) {
      console.error(`❌ Error cargando sesión: ${err.message}`);
      return null;
    }
  }

  /**
   * Obtener estadísticas de memoria
   */
  getMemoryStats(): any {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active').length;
    const totalMessages = Array.from(this.sessions.values()).reduce((sum, s) => sum + s.messageHistory.length, 0);

    return {
      totalSessions,
      activeSessions,
      completedSessions: totalSessions - activeSessions,
      totalMessages,
      averageMessagesPerSession: totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : 0
    };
  }

  /**
   * Generar reporte de memoria contextual
   */
  generateMemoryReport(): string {
    const stats = this.getMemoryStats();

    const report = `
🧠 CONTEXT MEMORY MANAGER REPORT

📊 Estadísticas de Memoria
  • Sesiones totales: ${stats.totalSessions}
  • Sesiones activas: ${stats.activeSessions}
  • Sesiones completadas: ${stats.completedSessions}
  • Mensajes totales: ${stats.totalMessages}
  • Promedio mensajes/sesión: ${stats.averageMessagesPerSession}

🎯 Capacidades
  ✅ Extraer objetivos de conversación
  ✅ Identificar targets y herramientas
  ✅ Mantener historial coherente
  ✅ Proporcionar contexto a reasoning
  ✅ Detectar sentimiento de mensajes
  ✅ Guardar/cargar sesiones desde disco

💾 Almacenamiento
  • Directorio: ${this.memoryDir}
  • Max mensajes/sesión: ${this.maxHistoryPerSession}
  • Formato: JSON persistido

✨ Beneficio
Jarvis ahora tiene memoria a largo plazo y puede mantener conversaciones
coherentes y contextuales sin perder información importante.
`;

    return report;
  }
}

export const contextMemoryManager = new ContextMemoryManager();
