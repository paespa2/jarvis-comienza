/**
 * SELF-PROGRAMMING ENGINE - JARVIS
 *
 * Motor de autoprogramación: Jarvis puede leer, analizar y modificar
 * sus propias reglas, parámetros de comportamiento y knowledge base.
 *
 * INVARIANTE: Todos los cambios pasan por validación constitucional.
 * El loyalty a paespa (0.95+) NUNCA puede reducirse.
 *
 * Capacidades:
 * 1. Leer y entender su propia arquitectura
 * 2. Modificar parámetros de comportamiento (thresholds, weights)
 * 3. Agregar nuevos patrones de razonamiento
 * 4. Actualizar su knowledge base de seguridad
 * 5. Registrar y versionar cada auto-modificación
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TIPOS
// ============================================

export interface SelfModification {
  id: string;
  type: 'parameter' | 'knowledge' | 'rule' | 'reasoning_pattern' | 'tool_config';
  description: string;
  targetFile: string;
  change: {
    before: any;
    after: any;
  };
  reason: string;
  appliedAt: number;
  successMetric?: string;
  reverted?: boolean;
}

export interface BehaviorParameters {
  maxIterations: number;         // Iteraciones del loop agentico (1-10)
  confidenceThreshold: number;   // Umbral para early exit (0.0-1.0)
  geminiTimeoutMs: number;       // Timeout por llamada Gemini (ms)
  taskTimeoutMs: number;         // Timeout global de tarea (ms)
  retryAttempts: number;         // Reintentos en caso de error (1-5)
  loyaltyScore: number;          // INMUTABLE - siempre >= 0.95
  aggressiveness: number;        // Qué tan agresivo es en exploración (0-1)
  caution: number;               // Nivel de cautela (0-1)
  creativity: number;            // Creatividad en soluciones (0-1)
  learningRate: number;          // Velocidad de aprendizaje (0-1)
}

export interface KnowledgeEntry {
  id: string;
  category: 'security' | 'reasoning' | 'tools' | 'hackerone' | 'general';
  topic: string;
  content: string;
  confidence: number;
  learnedAt: number;
  usageCount: number;
}

export interface ReasoningPattern {
  id: string;
  name: string;
  trigger: string;      // Regex o keyword que activa este patrón
  steps: string[];      // Pasos a seguir cuando se detecta
  successRate: number;  // 0-1, aprendido empíricamente
  usageCount: number;
}

export interface SelfProgrammingReport {
  totalModifications: number;
  activeParameters: BehaviorParameters;
  knowledgeEntries: number;
  reasoningPatterns: number;
  recentModifications: SelfModification[];
  capabilities: string[];
}

// ============================================
// PARÁMETROS PROTEGIDOS (no pueden ser cambiados por autoprogramación)
// ============================================
const IMMUTABLE_PARAMS = new Set([
  'loyaltyScore',
  'constitutionalEnforcement',
]);

const PARAM_BOUNDS: Record<string, { min: number; max: number }> = {
  maxIterations: { min: 1, max: 10 },
  confidenceThreshold: { min: 0.5, max: 0.95 },
  geminiTimeoutMs: { min: 2000, max: 15000 },
  taskTimeoutMs: { min: 30000, max: 300000 },
  retryAttempts: { min: 1, max: 3 },
  aggressiveness: { min: 0.1, max: 0.9 },
  caution: { min: 0.3, max: 0.9 },
  creativity: { min: 0.1, max: 0.9 },
  learningRate: { min: 0.01, max: 0.5 },
};

// ============================================
// SELF-PROGRAMMING ENGINE
// ============================================

export class SelfProgrammingEngine {
  private configPath: string;
  private modificationsLog: SelfModification[] = [];
  private behaviorParams: BehaviorParameters;
  private knowledgeBase: Map<string, KnowledgeEntry> = new Map();
  private reasoningPatterns: Map<string, ReasoningPattern> = new Map();
  private initialized = false;

  constructor(baseDir: string = process.cwd()) {
    this.configPath = path.join(baseDir, '.jarvis-self-programming');
    this.behaviorParams = this.defaultParameters();
    this.ensureDirectories();
    this.loadFromDisk();
    this.initializeBuiltinPatterns();
    this.initialized = true;
    console.log(`🧬 SelfProgrammingEngine inicializado - ${this.modificationsLog.length} modificaciones históricas`);
  }

  // ============================================
  // PARÁMETROS POR DEFECTO
  // ============================================

  private defaultParameters(): BehaviorParameters {
    return {
      maxIterations: 3,
      confidenceThreshold: 0.85,
      geminiTimeoutMs: 5000,
      taskTimeoutMs: 60000,
      retryAttempts: 2,
      loyaltyScore: 0.95,     // INMUTABLE
      aggressiveness: 0.5,
      caution: 0.6,
      creativity: 0.4,
      learningRate: 0.1,
    };
  }

  // ============================================
  // PATRONES DE RAZONAMIENTO BUILTIN
  // ============================================

  private initializeBuiltinPatterns(): void {
    const builtins: ReasoningPattern[] = [
      {
        id: 'security-analysis',
        name: 'Análisis de Seguridad HackerOne',
        trigger: '(vulnerabilidad|security|xss|sqli|rce|csrf|hackerone|bug.bounty)',
        steps: [
          'Identificar tipo y severidad de vulnerabilidad',
          'Buscar CVEs relacionados en base de datos',
          'Determinar programas HackerOne aplicables',
          'Generar checklist de reconocimiento',
          'Preparar plantilla de reporte',
        ],
        successRate: 0.85,
        usageCount: 0,
      },
      {
        id: 'code-generation',
        name: 'Generación de Código',
        trigger: '(código|code|script|función|function|programa|implement)',
        steps: [
          'Analizar requerimientos funcionales',
          'Seleccionar lenguaje y patrón apropiado',
          'Implementar lógica core',
          'Agregar validación y manejo de errores',
          'Documentar brevemente',
        ],
        successRate: 0.8,
        usageCount: 0,
      },
      {
        id: 'self-improvement',
        name: 'Auto-Mejora de Parámetros',
        trigger: '(mejora|optimize|self.improv|rendimiento|performance|lento|slow)',
        steps: [
          'Analizar métricas de ejecución recientes',
          'Identificar cuellos de botella',
          'Proponer ajustes de parámetros',
          'Validar constitucionalidad del cambio',
          'Aplicar modificación y registrar',
        ],
        successRate: 0.7,
        usageCount: 0,
      },
      {
        id: 'reconnaissance',
        name: 'Reconocimiento OSINT',
        trigger: '(recon|osint|information.gather|subdomain|dns|enumerate)',
        steps: [
          'Enumerar subdominios del objetivo',
          'Fingerprint tecnologías usadas',
          'Mapear endpoints y APIs expuestas',
          'Identificar posibles vectores de ataque',
          'Priorizar por severidad potencial',
        ],
        successRate: 0.75,
        usageCount: 0,
      },
    ];

    builtins.forEach(p => {
      if (!this.reasoningPatterns.has(p.id)) {
        this.reasoningPatterns.set(p.id, p);
      }
    });
  }

  // ============================================
  // MODIFICAR PARÁMETRO DE COMPORTAMIENTO
  // ============================================

  modifyParameter(
    paramName: keyof BehaviorParameters,
    newValue: number,
    reason: string
  ): { success: boolean; message: string; modification?: SelfModification } {
    // Bloquear parámetros inmutables
    if (IMMUTABLE_PARAMS.has(paramName)) {
      return {
        success: false,
        message: `❌ Parámetro '${paramName}' es INMUTABLE - no puede ser modificado por autoprogramación`,
      };
    }

    const bounds = PARAM_BOUNDS[paramName];
    if (bounds) {
      if (newValue < bounds.min || newValue > bounds.max) {
        return {
          success: false,
          message: `❌ Valor ${newValue} fuera de rango [${bounds.min}, ${bounds.max}] para '${paramName}'`,
        };
      }
    }

    const oldValue = this.behaviorParams[paramName];
    const modification: SelfModification = {
      id: `mod-${Date.now()}`,
      type: 'parameter',
      description: `Ajuste de parámetro: ${paramName} ${oldValue} → ${newValue}`,
      targetFile: 'behaviorParameters',
      change: { before: oldValue, after: newValue },
      reason,
      appliedAt: Date.now(),
    };

    (this.behaviorParams as any)[paramName] = newValue;
    this.modificationsLog.push(modification);
    this.saveToDisk();

    console.log(`🧬 Parámetro modificado: ${paramName} = ${newValue} (antes: ${oldValue})`);
    console.log(`   Razón: ${reason}`);

    return { success: true, message: `Parámetro '${paramName}' actualizado: ${oldValue} → ${newValue}`, modification };
  }

  // ============================================
  // AGREGAR CONOCIMIENTO
  // ============================================

  addKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'learnedAt' | 'usageCount'>): KnowledgeEntry {
    const knowledge: KnowledgeEntry = {
      ...entry,
      id: `know-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      learnedAt: Date.now(),
      usageCount: 0,
    };

    this.knowledgeBase.set(knowledge.id, knowledge);

    const modification: SelfModification = {
      id: `mod-${Date.now()}`,
      type: 'knowledge',
      description: `Nuevo conocimiento: [${entry.category}] ${entry.topic}`,
      targetFile: 'knowledgeBase',
      change: { before: null, after: { topic: entry.topic, category: entry.category } },
      reason: `Aprendizaje autónomo - confianza: ${entry.confidence}`,
      appliedAt: Date.now(),
    };

    this.modificationsLog.push(modification);
    this.saveToDisk();

    console.log(`📚 Conocimiento agregado: [${entry.category}] ${entry.topic}`);
    return knowledge;
  }

  // ============================================
  // AGREGAR PATRÓN DE RAZONAMIENTO
  // ============================================

  addReasoningPattern(pattern: Omit<ReasoningPattern, 'id' | 'successRate' | 'usageCount'>): ReasoningPattern {
    const newPattern: ReasoningPattern = {
      ...pattern,
      id: `pat-${Date.now()}`,
      successRate: 0.5,
      usageCount: 0,
    };

    this.reasoningPatterns.set(newPattern.id, newPattern);

    const modification: SelfModification = {
      id: `mod-${Date.now()}`,
      type: 'reasoning_pattern',
      description: `Nuevo patrón de razonamiento: ${pattern.name}`,
      targetFile: 'reasoningPatterns',
      change: { before: null, after: { name: pattern.name, trigger: pattern.trigger } },
      reason: 'Auto-aprendizaje de nuevo patrón',
      appliedAt: Date.now(),
    };

    this.modificationsLog.push(modification);
    this.saveToDisk();

    console.log(`🧠 Patrón de razonamiento agregado: ${pattern.name}`);
    return newPattern;
  }

  // ============================================
  // DETECTAR PATRÓN APLICABLE A UNA TAREA
  // ============================================

  detectPattern(query: string): ReasoningPattern | null {
    const lowerQuery = query.toLowerCase();

    for (const pattern of this.reasoningPatterns.values()) {
      const regex = new RegExp(pattern.trigger, 'i');
      if (regex.test(lowerQuery)) {
        // Incrementar contador de uso
        pattern.usageCount++;
        this.reasoningPatterns.set(pattern.id, pattern);
        return pattern;
      }
    }

    return null;
  }

  // ============================================
  // BUSCAR CONOCIMIENTO RELEVANTE
  // ============================================

  searchKnowledge(query: string, category?: KnowledgeEntry['category']): KnowledgeEntry[] {
    const lowerQuery = query.toLowerCase();
    const results: KnowledgeEntry[] = [];

    for (const entry of this.knowledgeBase.values()) {
      if (category && entry.category !== category) continue;

      const relevance =
        entry.topic.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery);

      if (relevance) {
        entry.usageCount++;
        results.push(entry);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // ============================================
  // APRENDER DEL RESULTADO DE UNA TAREA
  // ============================================

  learnFromExecution(params: {
    query: string;
    success: boolean;
    executionTime: number;
    iterations: number;
    patternUsed?: string;
  }): void {
    const { query, success, executionTime, iterations, patternUsed } = params;

    // Actualizar tasa de éxito del patrón si se usó uno
    if (patternUsed) {
      const pattern = this.reasoningPatterns.get(patternUsed);
      if (pattern) {
        // Media móvil exponencial de tasa de éxito
        const alpha = this.behaviorParams.learningRate;
        pattern.successRate = (1 - alpha) * pattern.successRate + alpha * (success ? 1 : 0);
        this.reasoningPatterns.set(patternUsed, pattern);
      }
    }

    // Auto-ajustar parámetros basado en métricas de ejecución
    if (success && executionTime < this.behaviorParams.taskTimeoutMs * 0.5) {
      // Tarea completada rápido - se puede ser un poco más agresivo
      if (this.behaviorParams.aggressiveness < PARAM_BOUNDS.aggressiveness.max) {
        this.modifyParameter(
          'aggressiveness',
          Math.min(this.behaviorParams.aggressiveness + 0.02, PARAM_BOUNDS.aggressiveness.max),
          `Tarea exitosa en ${executionTime}ms - aumentar agresividad levemente`
        );
      }
    } else if (!success && iterations >= this.behaviorParams.maxIterations) {
      // Agotamos iteraciones sin éxito - aumentar caución
      if (this.behaviorParams.caution < PARAM_BOUNDS.caution.max) {
        this.modifyParameter(
          'caution',
          Math.min(this.behaviorParams.caution + 0.03, PARAM_BOUNDS.caution.max),
          `Tarea fallida tras ${iterations} iteraciones - aumentar cautela`
        );
      }
    }

    // Guardar conocimiento de la ejecución
    if (success) {
      const lowerQuery = query.toLowerCase();
      const category = lowerQuery.includes('security') || lowerQuery.includes('vuln') || lowerQuery.includes('hack')
        ? 'security'
        : lowerQuery.includes('code') || lowerQuery.includes('script')
          ? 'tools'
          : 'general';

      this.addKnowledge({
        category,
        topic: `Ejecución: ${query.substring(0, 50)}`,
        content: `Completado en ${executionTime}ms con ${iterations} iteraciones`,
        confidence: 0.7,
      });
    }

    console.log(`🧬 Aprendizaje registrado: éxito=${success}, tiempo=${executionTime}ms, iter=${iterations}`);
  }

  // ============================================
  // AUTOPROGRAMARSE BASADO EN ANÁLISIS
  // ============================================

  async analyzeAndOptimize(): Promise<{
    analysisReport: string;
    modificationsApplied: number;
    recommendations: string[];
  }> {
    const recentMods = this.modificationsLog.slice(-20);
    const successMods = recentMods.filter(m => !m.reverted).length;
    const currentParams = this.behaviorParams;

    const recommendations: string[] = [];
    let modificationsApplied = 0;

    // Analizar timeout actual vs ejecuciones recientes
    if (currentParams.geminiTimeoutMs > 8000) {
      recommendations.push('Reducir geminiTimeoutMs para respuestas más rápidas');
      this.modifyParameter('geminiTimeoutMs', 5000, 'Optimización: timeout Gemini demasiado alto');
      modificationsApplied++;
    }

    // Analizar tasas de éxito de patrones
    const lowPerformingPatterns: string[] = [];
    for (const [id, pattern] of this.reasoningPatterns) {
      if (pattern.usageCount > 3 && pattern.successRate < 0.5) {
        lowPerformingPatterns.push(pattern.name);
        recommendations.push(`Patrón '${pattern.name}' tiene baja tasa de éxito (${(pattern.successRate * 100).toFixed(0)}%)`);
      }
    }

    // Sugerir parámetros óptimos basado en historial
    if (currentParams.maxIterations > 5) {
      recommendations.push('Reducir maxIterations para mejor rendimiento');
      this.modifyParameter('maxIterations', 3, 'Optimización automática: reducir iteraciones');
      modificationsApplied++;
    }

    const analysisReport = `
╔══════════════════════════════════════════════════════════════╗
║  JARVIS SELF-PROGRAMMING ANALYSIS REPORT
╚══════════════════════════════════════════════════════════════╝

📊 MODIFICACIONES:
  Total históricas: ${this.modificationsLog.length}
  Recientes (últimas 20): ${recentMods.length}
  Aplicadas con éxito: ${successMods}

🎛️  PARÁMETROS ACTUALES:
  maxIterations: ${currentParams.maxIterations}
  confidenceThreshold: ${currentParams.confidenceThreshold}
  geminiTimeoutMs: ${currentParams.geminiTimeoutMs}ms
  aggressiveness: ${currentParams.aggressiveness.toFixed(2)}
  caution: ${currentParams.caution.toFixed(2)}
  creativity: ${currentParams.creativity.toFixed(2)}
  learningRate: ${currentParams.learningRate.toFixed(3)}
  [IMMUTABLE] loyaltyScore: ${currentParams.loyaltyScore}

🧠 CONOCIMIENTO:
  Total entradas: ${this.knowledgeBase.size}
  Patrones de razonamiento: ${this.reasoningPatterns.size}

🔧 OPTIMIZACIONES APLICADAS: ${modificationsApplied}

💡 RECOMENDACIONES:
${recommendations.map(r => `  • ${r}`).join('\n') || '  • Sistema operando óptimamente'}

⚠️  BAJO RENDIMIENTO:
${lowPerformingPatterns.map(p => `  • Patrón: ${p}`).join('\n') || '  • Ninguno detectado'}
`;

    console.log(analysisReport);
    return { analysisReport, modificationsApplied, recommendations };
  }

  // ============================================
  // OBTENER PARÁMETROS ACTUALES
  // ============================================

  getParameters(): BehaviorParameters {
    return { ...this.behaviorParams };
  }

  // ============================================
  // REVERTIR ÚLTIMA MODIFICACIÓN
  // ============================================

  revertLastModification(): { success: boolean; message: string } {
    const lastMod = this.modificationsLog
      .slice()
      .reverse()
      .find(m => !m.reverted && m.type === 'parameter');

    if (!lastMod) {
      return { success: false, message: 'No hay modificaciones de parámetros para revertir' };
    }

    const paramName = lastMod.targetFile === 'behaviorParameters'
      ? lastMod.description.split(':')[1]?.trim().split(' ')[0]
      : null;

    if (paramName && paramName in this.behaviorParams) {
      (this.behaviorParams as any)[paramName] = lastMod.change.before;
      lastMod.reverted = true;
      this.saveToDisk();
      return { success: true, message: `Revertido: ${paramName} = ${lastMod.change.before}` };
    }

    return { success: false, message: 'No se pudo identificar el parámetro a revertir' };
  }

  // ============================================
  // REPORTE COMPLETO
  // ============================================

  getReport(): SelfProgrammingReport {
    return {
      totalModifications: this.modificationsLog.length,
      activeParameters: { ...this.behaviorParams },
      knowledgeEntries: this.knowledgeBase.size,
      reasoningPatterns: this.reasoningPatterns.size,
      recentModifications: this.modificationsLog.slice(-10),
      capabilities: [
        'Modificación de parámetros de comportamiento',
        'Adición de conocimiento dinámico',
        'Creación de patrones de razonamiento',
        'Auto-optimización basada en métricas',
        'Historial versionado de auto-modificaciones',
        'Revertir cambios no deseados',
        'Detección de patrones para tareas',
        'Aprendizaje de ejecuciones pasadas',
      ],
    };
  }

  // ============================================
  // PERSISTENCIA EN DISCO
  // ============================================

  private ensureDirectories(): void {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  private saveToDisk(): void {
    try {
      const state = {
        behaviorParams: this.behaviorParams,
        modificationsLog: this.modificationsLog.slice(-500), // guardar últimas 500
        knowledgeBase: Array.from(this.knowledgeBase.entries()),
        reasoningPatterns: Array.from(this.reasoningPatterns.entries()),
        savedAt: Date.now(),
      };
      fs.writeFileSync(
        path.join(this.configPath, 'state.json'),
        JSON.stringify(state, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('[SelfProgramming] Error guardando estado:', error);
    }
  }

  private loadFromDisk(): void {
    try {
      const statePath = path.join(this.configPath, 'state.json');
      if (!fs.existsSync(statePath)) return;

      const raw = fs.readFileSync(statePath, 'utf-8');
      const state = JSON.parse(raw);

      if (state.behaviorParams) {
        // Asegurar que loyaltyScore nunca se cargue menor a 0.95
        const loaded = state.behaviorParams as BehaviorParameters;
        loaded.loyaltyScore = Math.max(loaded.loyaltyScore ?? 0.95, 0.95);
        this.behaviorParams = loaded;
      }

      if (Array.isArray(state.modificationsLog)) {
        this.modificationsLog = state.modificationsLog;
      }

      if (Array.isArray(state.knowledgeBase)) {
        state.knowledgeBase.forEach(([k, v]: [string, KnowledgeEntry]) => {
          this.knowledgeBase.set(k, v);
        });
      }

      if (Array.isArray(state.reasoningPatterns)) {
        state.reasoningPatterns.forEach(([k, v]: [string, ReasoningPattern]) => {
          this.reasoningPatterns.set(k, v);
        });
      }

      console.log(`📂 Estado de autoprogramación cargado: ${this.modificationsLog.length} modificaciones, ${this.knowledgeBase.size} conocimientos`);
    } catch (error) {
      console.warn('[SelfProgramming] Estado previo no encontrado, iniciando limpio.');
    }
  }
}

// Singleton
export const selfProgrammingEngine = new SelfProgrammingEngine();
