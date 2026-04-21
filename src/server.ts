/**
 * JARVIS SERVER - FASE 1 + FASE 2
 *
 * Servidor Express que expone Jarvis IA como servicio HTTP
 * INTEGRACIÓN COMPLETA:
 * - Persistencia autónoma (Fase 1)
 * - Reasoning autónomo (Fase 2)
 * - Task queue processing
 * - Proper timeout handling
 * - Evolution tracking
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { IntegrationOrchestrator } from './integrations/IntegrationOrchestrator';
import { v4 as uuidv4 } from 'uuid';

// ✅ FASE 1: Persistencia
import {
  initializePersistence,
  PersistentMemoryManager
} from './persistence/ServerIntegration';

// ✅ FASE 2: Autonomous Reasoning
import {
  JarvisAutonomousReasoner,
  JarvisReasoningEvolution
} from './reasoning';

// ✅ FASE 3B: Q&A System (Offline Knowledge)
import { knowledgeQAEngine } from './qa/KnowledgeQAEngine';
import { codeGenerationEngine } from './qa/CodeGenerationEngine';
import { securityKnowledgeBase } from './qa/SecurityKnowledgeBase';

// ✅ FASE 3B: Learning System (Autonomous Growth)
import { learningSystem } from './learning/LearningSystem';
import { obsidianMemory } from './learning/ObsidianMemoryManager';
import { coreTeachings } from './learning/CoreTeachings';

// ✅ FASE 3C: HackerOne Specialization
import { hackerOneAssistant } from './qa/HackerOneAssistant';
import { reconEngine } from './qa/ReconEngine';

// ✅ MODELO NATIVO AUTÓNOMO + AUTOPROGRAMACIÓN
import { jarvisNativeModel } from './core/nativeModel/JarvisNativeModel';
import { selfProgrammingEngine } from './core/selfProgramming/SelfProgrammingEngine';

// ✅ FIREBASE KNOWLEDGE GRAPH + HACKERONE LEARNING
import { firebaseServerService } from './services/firebaseServerService';
import { getHackerOneLearningService } from './services/hackerOneLearningService';

// ============================================
// TIPOS
// ============================================

interface JarvisRequest {
  id: string;
  query: string;
  context?: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

// ============================================
// VARIABLES GLOBALES
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const TASK_TIMEOUT = parseInt(process.env.TASK_TIMEOUT || '30000', 10);

let orchestrator: IntegrationOrchestrator;
let memoryManager: PersistentMemoryManager;
let reasoner: JarvisAutonomousReasoner;
let evolution: JarvisReasoningEvolution;

const requests: Map<string, JarvisRequest> = new Map();
const processingTasks: Set<string> = new Set();

// Task processing stats
const stats = {
  totalTasksCreated: 0,
  completedTasks: 0,
  failedTasks: 0,
  averageExecutionTime: 0,
};

// ✅ FASE 2: Reasoning metrics
const reasoningMetrics = {
  totalQueries: 0,
  averageReasoningTime: 0,
  successfulReasonings: 0,
  failedReasonings: 0,
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * INICIALIZAR JARVIS (CON FASE 1 + FASE 2)
 */
async function initializeJarvis() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 INICIALIZANDO JARVIS IA SERVER`);
  console.log(`${'='.repeat(70)}\n`);

  orchestrator = new IntegrationOrchestrator();

  // Inicializar integraciones existentes
  await orchestrator.initialize({
    api: {
      port: PORT,
    },
    database: {
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './jarvis.db',
    },
    ...(process.env.GITHUB_TOKEN && {
      github: {
        token: process.env.GITHUB_TOKEN,
      },
    }),
  });

  // ✅ FASE 1: Inicializar persistencia
  console.log(`\n📦 Initializing Persistent Storage (Phase 1)...`);
  memoryManager = await initializePersistence();
  console.log(`✅ Persistent storage ready\n`);

  // ✅ FASE 2: Inicializar reasoning autónomo
  console.log(`🧠 Initializing Autonomous Reasoning (Phase 2)...`);
  reasoner = new JarvisAutonomousReasoner(memoryManager);
  evolution = new JarvisReasoningEvolution(memoryManager, reasoner);
  console.log(`✅ Autonomous reasoning engine initialized\n`);

  // ✅ FASE 3B: Inicializar sistemas de Q&A y Learning
  console.log(`📚 Initializing Q&A & Learning Systems (Phase 3b)...`);
  console.log(`   ✅ Security Knowledge Base loaded: ${securityKnowledgeBase.getStats().cves} CVEs`);
  console.log(`   ✅ Knowledge Q&A Engine ready`);
  console.log(`   ✅ Code Generation Engine ready`);
  console.log(`   ✅ Core Teachings loaded: 100 enseñanzas`);
  console.log(`   ✅ Learning System initialized`);
  console.log(`   ✅ Obsidian Memory vault ready\n`);

  console.log(`\n✅ Jarvis inicializado correctamente`);
  console.log(`📍 Escuchando en http://${HOST}:${PORT}`);
  console.log(`${'='.repeat(70)}\n`);
}

// ============================================
// PROCESAMIENTO DE TAREAS
// ============================================

/**
 * PROCESAR TAREA CON REASONING + PERSISTENCIA
 */
async function processTaskWithTimeout(
  taskId: string,
  query: string,
  context?: any
): Promise<void> {
  const task = requests.get(taskId);
  if (!task) return;

  try {
    task.status = 'processing';
    task.startedAt = Date.now();
    const taskStartTime = Date.now();

    console.log(`\n${'='.repeat(70)}`);
    console.log(`⏱️  Task ${taskId}`);
    console.log(`📝 Query: "${query.substring(0, 50)}..."`);
    console.log(`${'='.repeat(70)}\n`);

    // ✅ FASE 2: STAGE 1 - AUTONOMOUS REASONING
    console.log(`🧠 STAGE 1: Autonomous Reasoning...`);
    const reasoningStartTime = Date.now();

    const reasoningOutput = await reasoner.reason(query, context);

    const reasoningTime = Date.now() - reasoningStartTime;
    console.log(`\n   ✅ Reasoning completed: ${reasoningTime}ms`);
    console.log(`   📊 Confidence: ${(reasoningOutput.confidence * 100).toFixed(1)}%`);
    console.log(`   📋 Plan steps: ${reasoningOutput.plan.length}`);

    // ✅ STAGE 2 - EXECUTE PLAN
    console.log(`\n⚙️  STAGE 2: Executing Plan...`);
    let result: any = null;

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`⚠️  Task timeout después de ${TASK_TIMEOUT}ms`);
        resolve({
          success: false,
          output: `Task execution exceeded ${TASK_TIMEOUT}ms limit`,
          error: `Timeout after ${TASK_TIMEOUT}ms`,
        });
      }, TASK_TIMEOUT);
    });

    result = await Promise.race([
      orchestrator.executeTask(query, context),
      timeoutPromise,
    ]) || {
      success: false,
      output: 'Unknown error during execution',
      error: 'No response from executor',
    };

    console.log(`\n   ${result.success ? '✅' : '❌'} Execution completed`);

    // ✅ FASE 2: STAGE 3 - RECORD EVOLUTION
    console.log(`\n📚 STAGE 3: Recording Evolution...`);
    const totalTime = Date.now() - taskStartTime;

    await evolution.recordExecution({
      query,
      reasoning: reasoningOutput,
      result,
      success: result.success || false,
      duration: totalTime
    });

    // Update metrics
    reasoningMetrics.totalQueries++;
    reasoningMetrics.averageReasoningTime =
      (reasoningMetrics.averageReasoningTime * (reasoningMetrics.totalQueries - 1) +
        reasoningTime) /
      reasoningMetrics.totalQueries;

    if (result.success) {
      reasoningMetrics.successfulReasonings++;
    } else {
      reasoningMetrics.failedReasonings++;
    }

    // ✅ FASE 2: STAGE 4 - CONSOLIDATE MEMORY
    console.log(`\n💾 STAGE 4: Consolidating Memory...`);
    await memoryManager.consolidateExperience({
      query,
      agents: result.agentsUsed || ['GeneralAgent'],
      actions: reasoningOutput.plan.map(p => p.action),
      result,
      executionTime: totalTime,
      success: result.success || false
    });

    console.log(`\n   ✅ Memory consolidated`);

    // ✅ FASE 3B: AUTO-DOCUMENT IN OBSIDIAN MEMORY
    console.log(`\n📚 STAGE 5: Documenting in Obsidian Memory...`);
    if (result.success) {
      obsidianMemory.registerSuccess(
        `Tarea completada: ${query}`,
        result.output || 'Ejecución exitosa',
        'execution_time',
        `${totalTime}ms`,
        []
      );
    } else {
      obsidianMemory.registerError(
        `Tarea fallida: ${query}`,
        result.output || 'Error durante ejecución',
        result.error || 'Error desconocido',
        'Revisar logs',
        'Mejorar manejo de errores',
        []
      );
    }
    console.log(`\n   ✅ Action documented in Obsidian`);
    console.log(`   ✅ Memory vault updated`);

    // ✅ MODELO NATIVO: Aprender del resultado de la tarea
    const domain = jarvisNativeModel.detectDomain(query);
    jarvisNativeModel.learn(
      query,
      result.output || result.error || '',
      result.success || false,
      domain
    );

    // ✅ SELF-PROGRAMMING: Registrar métricas para auto-optimización
    selfProgrammingEngine.learnFromExecution({
      query,
      success: result.success || false,
      executionTime: totalTime,
      iterations: result.iterations || 1,
    });

    task.status = 'completed';
    task.result = {
      ...result,
      reasoning: {
        confidence: reasoningOutput.confidence,
        planSteps: reasoningOutput.plan.length,
        stages: reasoningOutput.reasoning.length
      },
      metrics: {
        reasoningTime,
        totalTime,
      },
      nativeModel: {
        domain,
        version: jarvisNativeModel.getStats().version,
      },
    };
    task.completedAt = Date.now();
    task.duration = task.completedAt - (task.startedAt || Date.now());

    stats.completedTasks++;
    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.completedTasks - 1) + task.duration) /
      stats.completedTasks;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Task completed: ${task.duration}ms`);
    console.log(`   Reasoning: ${reasoningTime}ms`);
    console.log(`   Execution: ${task.duration - reasoningTime}ms`);
    console.log(`${'='.repeat(70)}\n`);

  } catch (error: any) {
    task.status = 'failed';
    task.error = error.message || 'Error desconocido';
    task.completedAt = Date.now();
    task.duration = task.completedAt - (task.startedAt || Date.now());

    reasoningMetrics.failedReasonings++;
    stats.failedTasks++;

    console.error(`\n❌ Task failed: ${task.error}\n`);
  } finally {
    processingTasks.delete(taskId);
  }
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * HEALTH CHECK
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '2.0.0',
    features: ['Phase1-Persistence', 'Phase2-AutonomousReasoning'],
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * API STATUS
 */
app.get('/api/status', (req: Request, res: Response) => {
  const status = orchestrator.getSystemStatus();
  res.json({
    success: true,
    data: status,
    timestamp: Date.now(),
  });
});

/**
 * CREAR TAREA
 */
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { query, context, priority } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query es requerido',
      });
    }

    const requestId = `task-${uuidv4()}`;

    const jarvisRequest: JarvisRequest = {
      id: requestId,
      query,
      context,
      timestamp: Date.now(),
      status: 'pending',
    };

    requests.set(requestId, jarvisRequest);
    stats.totalTasksCreated++;

    // Procesar asincronicamente en background
    if (!processingTasks.has(requestId)) {
      processingTasks.add(requestId);
      processTaskWithTimeout(requestId, query, context).catch(err => {
        console.error(`Unhandled error in task ${requestId}:`, err);
      });
    }

    res.json({
      success: true,
      data: {
        id: jarvisRequest.id,
        query: jarvisRequest.query,
        timestamp: jarvisRequest.timestamp,
        status: jarvisRequest.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * OBTENER TAREA
 */
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = requests.get(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Tarea no encontrada',
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

/**
 * LISTAR TAREAS
 */
app.get('/api/tasks', (req: Request, res: Response) => {
  const status = req.query.status as string;
  let tasks = Array.from(requests.values());

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  res.json({
    success: true,
    data: {
      total: tasks.length,
      tasks,
    },
  });
});

/**
 * ✅ FASE 1: PERSISTENCE METRICS
 */
app.get('/api/persistence/stats', async (req: Request, res: Response) => {
  try {
    const stats = await memoryManager.getStatistics();
    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ✅ FASE 2: REASONING METRICS
 */
app.get('/api/reasoning/metrics', async (req: Request, res: Response) => {
  try {
    const evolutionMetrics = await evolution.getMetrics();

    res.json({
      success: true,
      data: {
        reasoning: reasoningMetrics,
        evolution: evolutionMetrics
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ✅ FASE 2: TEST AUTONOMOUS REASONING
 */
app.post('/api/test/reason', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query requerida',
      });
    }

    console.log(`\n🧪 TEST: Autonomous reasoning for "${query}"`);
    const output = await reasoner.reason(query);

    res.json({
      success: true,
      data: output,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ✅ FASE 2: TEST INFERENCE ENGINE
 */
app.post('/api/test/inference', async (req: Request, res: Response) => {
  try {
    const { facts, rules, goal } = req.body;

    const engine = reasoner.getInferenceEngine();

    for (const fact of facts || []) {
      engine.addFact(fact);
    }

    for (const rule of rules || []) {
      engine.addRule(rule);
    }

    const result = await engine.backwardChain(goal || 'test=true');

    res.json({
      success: true,
      data: {
        goal,
        result,
        statistics: engine.getStatistics()
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// ✅ FASE 3B: Q&A SYSTEM ENDPOINTS
// ============================================

/**
 * Q&A: RESPONDER PREGUNTA
 */
app.post('/api/qa/ask', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query es requerida',
      });
    }

    console.log(`\n📚 [Q&A] Respondiendo: "${query}"`);
    const startTime = Date.now();

    const answer = await knowledgeQAEngine.answer(query);
    const responseTime = Date.now() - startTime;

    // Registrar en memoria
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Q&A: ${query.substring(0, 50)}`,
      description: `Respondida con confianza ${(answer.confidence * 100).toFixed(0)}%`,
      tags: ['qa', 'knowledge'],
      metadata: {
        responseTime,
        confidence: answer.confidence,
        sources: answer.sources.length
      }
    });

    res.json({
      success: true,
      data: {
        ...answer,
        responseTime
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Q&A: GENERAR CÓDIGO
 */
app.post('/api/qa/generate-code', async (req: Request, res: Response) => {
  try {
    const { query, type = 'poc' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query es requerida',
      });
    }

    console.log(`\n💻 [CodeGen] Generando: "${query}"`);
    const startTime = Date.now();

    const code = await codeGenerationEngine.generate(query, type);
    const responseTime = Date.now() - startTime;

    // Registrar en memoria
    obsidianMemory.registerImprovement(
      `Código Generado: ${code.language.toUpperCase()}`,
      query,
      'medio',
      code.code,
      [40, 50] // Relacionado a enseñanzas de seguridad
    );

    res.json({
      success: true,
      data: {
        ...code,
        responseTime
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Q&A: ESTADÍSTICAS DE CONOCIMIENTO
 */
app.get('/api/qa/knowledge-stats', (req: Request, res: Response) => {
  try {
    const stats = securityKnowledgeBase.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// ✅ FASE 3B: LEARNING SYSTEM ENDPOINTS
// ============================================

/**
 * LEARNING: PRÓXIMA ENSEÑANZA
 */
app.get('/api/learning/next-teaching', (req: Request, res: Response) => {
  try {
    const nextId = learningSystem.getNextTeachingToPractice();
    const teaching = coreTeachings.getTeaching(nextId);

    res.json({
      success: true,
      data: {
        nextTeaching: teaching,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * LEARNING: PRACTICAR ENSEÑANZA
 */
app.post('/api/learning/practice', async (req: Request, res: Response) => {
  try {
    const { teachingId, context, action } = req.body;

    if (teachingId === undefined || !context || !action) {
      return res.status(400).json({
        success: false,
        error: 'teachingId, context, y action son requeridos',
      });
    }

    console.log(`\n🎓 [Learning] Practicando enseñanza ${teachingId}`);
    const cycle = await learningSystem.practiceTeaching(teachingId, context, action);

    res.json({
      success: true,
      data: cycle,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * LEARNING: REPORTE DE PROGRESO
 */
app.get('/api/learning/progress', (req: Request, res: Response) => {
  try {
    const report = learningSystem.generateProgressReport();
    const stats = coreTeachings.getLearningStats();

    res.json({
      success: true,
      data: {
        stats,
        report,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * LEARNING: RUTAS DE APRENDIZAJE
 */
app.get('/api/learning/paths', (req: Request, res: Response) => {
  try {
    const paths = learningSystem.getAllLearningPaths();

    res.json({
      success: true,
      data: {
        paths,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * LEARNING: ESTADÍSTICAS COMPLETAS
 */
app.get('/api/learning/stats', (req: Request, res: Response) => {
  try {
    const data = learningSystem.exportLearningData();

    res.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// ✅ FASE 3B: MEMORY SYSTEM ENDPOINTS
// ============================================

/**
 * MEMORY: REGISTRAR ACCIÓN
 */
app.post('/api/memory/action', (req: Request, res: Response) => {
  try {
    const { type, title, description, tags, relatedTeachings } = req.body;

    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: type || 'action',
      title,
      description,
      tags: tags || [],
      relatedTeachings,
    });

    res.json({
      success: true,
      data: {
        registered: true,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * MEMORY: ESTADO DE MEMORIA
 */
app.get('/api/memory/status', (req: Request, res: Response) => {
  try {
    const status = obsidianMemory.getMemoryStatus();

    res.json({
      success: true,
      data: status,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * MEMORY: REPORTE DE EVOLUCIÓN
 */
app.get('/api/memory/evolution', (req: Request, res: Response) => {
  try {
    const report = obsidianMemory.generateEvolutionReport();
    const metrics = obsidianMemory.calculateMetrics();

    res.json({
      success: true,
      data: {
        metrics,
        report,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * MÉTRICAS COMPLETAS
 */
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const allRequests = Array.from(requests.values());
    const completed = allRequests.filter(r => r.status === 'completed');
    const failed = allRequests.filter(r => r.status === 'failed');
    const processing = allRequests.filter(r => r.status === 'processing');

    const successRate =
      stats.totalTasksCreated > 0
        ? ((stats.completedTasks / stats.totalTasksCreated) * 100).toFixed(1)
        : 0;

    const persistenceStats = await memoryManager.getStatistics();
    const evolutionMetrics = await evolution.getMetrics();
    const systemStatus = orchestrator.getSystemStatus();
    const learningStats = coreTeachings.getLearningStats();
    const memoryMetrics = obsidianMemory.calculateMetrics();

    res.json({
      success: true,
      data: {
        system: systemStatus,
        tasks: {
          totalCreated: stats.totalTasksCreated,
          completed: stats.completedTasks,
          failed: stats.failedTasks,
          processing: processing.length,
          pending: allRequests.filter(r => r.status === 'pending').length,
          successRate: `${successRate}%`,
          averageExecutionTime: `${stats.averageExecutionTime.toFixed(0)}ms`,
        },
        reasoning: reasoningMetrics,
        persistence: persistenceStats,
        evolution: evolutionMetrics,
        learning: {
          ...learningStats,
          memory: memoryMetrics,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DOCUMENTACIÓN
 */
// ============================================
// FASE 3C: HACKERONE SPECIALIZATION ENDPOINTS
// ============================================

/**
 * POST /api/security/assess
 * Assess a vulnerability and get detailed analysis
 */
app.post('/api/security/assess', (req: Request, res: Response) => {
  try {
    const { vulnerability_type, target_software } = req.body;

    if (!vulnerability_type) {
      return res.status(400).json({
        success: false,
        error: 'vulnerability_type es requerido'
      });
    }

    console.log(`🔐 /api/security/assess - Processing: ${vulnerability_type}`);
    const assessment = hackerOneAssistant.assessVulnerability(vulnerability_type, target_software);
    console.log(`✅ Assessment result:`, JSON.stringify(assessment).substring(0, 200));

    const programs = hackerOneAssistant.findApplicablePrograms(vulnerability_type);
    console.log(`✅ Found ${programs.length} applicable programs`);

    // Auto-documentar en Obsidian
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Assessed: ${vulnerability_type}`,
      description: `Evaluated ${vulnerability_type} with CVSS ${assessment.cvss_score || 'N/A'}. Found ${programs.length} applicable programs.`,
      tags: ['security', 'hackerone', 'assessment']
    });

    // ✅ AUTO-LEARNING: guardar en Obsidian + Firebase automáticamente
    const learningService = getHackerOneLearningService(obsidianMemory);
    learningService.learnFromCase({
      type: 'assessment',
      vulnerabilityType: vulnerability_type,
      severity: assessment.severity,
      cvssScore: assessment.cvss_score,
      programsFound: programs.length,
      topProgram: programs[0]?.program_name,
      estimatedBounty: programs[0]?.average_payout,
      acceptanceProbability: programs[0]?.acceptance_probability,
    }).catch((err: Error) => console.warn('[Learning] Error auto-aprendizaje assess:', err.message));

    res.json({
      success: true,
      data: {
        assessment,
        applicable_programs: programs.slice(0, 5)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/security/payload
 * Generate payload variations for exploitation
 */
app.post('/api/security/payload', (req: Request, res: Response) => {
  try {
    const { vulnerability_type, target_tech } = req.body;

    if (!vulnerability_type) {
      return res.status(400).json({
        success: false,
        error: 'vulnerability_type es requerido'
      });
    }

    const payloads = hackerOneAssistant.generatePayload(vulnerability_type, target_tech);

    // Auto-documentar
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Generated payloads for: ${vulnerability_type}`,
      description: `Created ${payloads.length} payload variations for ${target_tech || 'generic'} target`,
      tags: ['security', 'payloads', 'exploitation']
    });

    res.json({
      success: true,
      data: {
        vulnerability_type,
        target_tech: target_tech || 'generic',
        variations: payloads.slice(0, 10),
        total_variations: payloads.length
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/security/recon
 * Generate reconnaissance plan and OSINT queries
 */
app.post('/api/security/recon', (req: Request, res: Response) => {
  try {
    const { target, scope = 'osint' } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'target es requerido'
      });
    }

    const osintQueries = reconEngine.generateOSINTQueries(target);
    const scripts = reconEngine.generateEnumerationScripts(target, scope as 'dns' | 'web' | 'network');
    const plan = reconEngine.generateVulnerabilityAssessmentPlan(target);
    const checklist = codeGenerationEngine.generateAssessmentChecklist(target);

    // Auto-documentar
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Recon plan for: ${target}`,
      description: `Generated comprehensive reconnaissance plan with ${osintQueries.length} OSINT queries and ${scripts.length} enumeration scripts`,
      tags: ['security', 'reconnaissance', 'osint']
    });

    res.json({
      success: true,
      data: {
        target,
        scope,
        osint_queries: osintQueries.slice(0, 5),
        enumeration_scripts: scripts.slice(0, 3),
        assessment_plan: plan,
        checklist: checklist.code.split('\n').slice(0, 10)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hackerone/assess
 * Assess a security finding and match with HackerOne programs
 */
app.post('/api/hackerone/assess', (req: Request, res: Response) => {
  try {
    const { finding } = req.body;

    if (!finding || !finding.type) {
      return res.status(400).json({
        success: false,
        error: 'finding con type es requerido'
      });
    }

    const matches = hackerOneAssistant.matchProgramsForFinding(finding);

    // Auto-documentar finding
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Finding: ${finding.type}`,
      description: `${finding.severity} - ${finding.description}. Matched ${matches.length} programs.`,
      tags: ['security', 'finding', 'hackerone']
    });

    // ✅ AUTO-LEARNING: guardar en Obsidian + Firebase automáticamente
    const learningService = getHackerOneLearningService(obsidianMemory);
    const avgBounty = matches.length > 0
      ? Math.round(matches.reduce((sum: number, m: any) => sum + m.average_payout, 0) / matches.length)
      : 0;
    learningService.learnFromCase({
      type: 'full_case',
      vulnerabilityType: finding.type,
      severity: finding.severity,
      programsFound: matches.length,
      topProgram: matches[0]?.program_name,
      estimatedBounty: avgBounty,
      acceptanceProbability: matches[0]?.acceptance_probability,
      notes: finding.description,
    }).catch((err: Error) => console.warn('[Learning] Error auto-aprendizaje h1 assess:', err.message));

    res.json({
      success: true,
      data: {
        finding,
        matched_programs: matches.slice(0, 5),
        recommendations: {
          top_programs: matches.slice(0, 3).map((m: any) => m.program_name),
          average_bounty: avgBounty,
          acceptance_probability: matches.length > 0
            ? (matches[0].acceptance_probability * 100).toFixed(1) + '%'
            : 'No matches'
        }
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hackerone/programs
 * List HackerOne programs filtered by vulnerability type
 */
app.get('/api/hackerone/programs', (req: Request, res: Response) => {
  try {
    const { vulnerability, severity, min_bounty, max_bounty } = req.query;

    let programs: any[] = [];

    if (vulnerability) {
      programs = hackerOneAssistant.findApplicablePrograms(
        vulnerability as string,
        severity as 'low' | 'medium' | 'high' | 'critical'
      );
    } else {
      programs = hackerOneAssistant['hackerOnePrograms'] || [];
    }

    // Filter by bounty if specified
    if (min_bounty || max_bounty) {
      const minBounty = min_bounty ? parseInt(min_bounty as string) : 0;
      const maxBounty = max_bounty ? parseInt(max_bounty as string) : Infinity;

      // Note: This would use a method from HackerOneAssistant if we expose it
      // For now, filter manually
      programs = programs.filter((p: any) =>
        (p.bounty_range?.[0] || 0) >= minBounty &&
        (p.bounty_range?.[1] || Infinity) <= maxBounty
      );
    }

    res.json({
      success: true,
      data: {
        filters: { vulnerability, severity, min_bounty, max_bounty },
        programs: programs.slice(0, 10),
        total_programs: programs.length
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/security/cves
 * Search CVE database
 */
app.get('/api/security/cves', (req: Request, res: Response) => {
  try {
    const { search, severity } = req.query;

    let cves: any[] = [];

    if (search) {
      cves = hackerOneAssistant.searchCVEs(search as string);
    } else if (severity) {
      // Filter CVEs by severity from the HackerOne Assistant
      const allCVEs = (hackerOneAssistant as any).cveDatabase || [];
      cves = allCVEs.filter((cve: any) => cve.severity === severity);
    }

    // Auto-documentar búsqueda
    if (search || severity) {
      obsidianMemory.registerAction({
        timestamp: new Date().toISOString(),
        type: 'action',
        title: `CVE Search: ${search || severity}`,
        description: `Found ${cves.length} CVE results`,
        tags: ['security', 'cve', 'search']
      });
    }

    res.json({
      success: true,
      data: {
        query: { search, severity },
        cves: cves.slice(0, 10),
        total_results: cves.length,
        stats: hackerOneAssistant.getStats?.()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// API DOCUMENTATION
// ============================================

app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Jarvis IA API v3.0',
      version: '3.0.0',
      features: ['Phase1-Persistence', 'Phase2-AutonomousReasoning', 'Phase3b-QA-Learning-Memory'],
      endpoints: {
        // HEALTH & STATUS
        health: {
          method: 'GET',
          path: '/health',
          description: 'Health check',
        },
        status: {
          method: 'GET',
          path: '/api/status',
          description: 'System status',
        },

        // PHASE 1: PERSISTENCE
        persistenceStats: {
          method: 'GET',
          path: '/api/persistence/stats',
          description: 'Persistence storage statistics',
        },

        // PHASE 2: AUTONOMOUS REASONING
        reasoningMetrics: {
          method: 'GET',
          path: '/api/reasoning/metrics',
          description: 'Autonomous reasoning metrics',
        },
        testReason: {
          method: 'POST',
          path: '/api/test/reason',
          description: 'Test autonomous reasoning',
          body: { query: 'string' },
        },
        testInference: {
          method: 'POST',
          path: '/api/test/inference',
          description: 'Test inference engine',
          body: { facts: 'array', rules: 'array', goal: 'string' },
        },

        // PHASE 3B: TASKS
        createTask: {
          method: 'POST',
          path: '/api/tasks',
          description: 'Create new task',
          body: { query: 'string', context: 'object?' },
        },
        getTask: {
          method: 'GET',
          path: '/api/tasks/:id',
          description: 'Get task by ID',
        },
        listTasks: {
          method: 'GET',
          path: '/api/tasks',
          description: 'List all tasks',
        },

        // PHASE 3B: Q&A SYSTEM
        qaAsk: {
          method: 'POST',
          path: '/api/qa/ask',
          description: 'Answer a security question',
          body: { query: 'string' },
          response: { answer: 'string', confidence: 'number', sources: 'array', relatedTopics: 'array' },
        },
        qaGenerateCode: {
          method: 'POST',
          path: '/api/qa/generate-code',
          description: 'Generate security code/payload',
          body: { query: 'string', type: 'poc|exploit|script|test|payload' },
          response: { code: 'string', language: 'string', explanation: 'string', usage: 'string' },
        },
        qaKnowledgeStats: {
          method: 'GET',
          path: '/api/qa/knowledge-stats',
          description: 'Get knowledge base statistics',
          response: { cves: 'number', vulnerabilities: 'number', programs: 'number' },
        },

        // PHASE 3B: LEARNING SYSTEM
        learningNextTeaching: {
          method: 'GET',
          path: '/api/learning/next-teaching',
          description: 'Get next teaching to practice',
          response: { nextTeaching: 'TeachingEntry' },
        },
        learningPractice: {
          method: 'POST',
          path: '/api/learning/practice',
          description: 'Practice a teaching',
          body: { teachingId: 'number', context: 'string', action: 'string' },
          response: { type: 'string', result: 'success|partial|failure', confidenceImprovement: 'number' },
        },
        learningProgress: {
          method: 'GET',
          path: '/api/learning/progress',
          description: 'Get learning progress report',
          response: { stats: 'object', report: 'string' },
        },
        learningPaths: {
          method: 'GET',
          path: '/api/learning/paths',
          description: 'Get learning paths',
          response: { paths: 'array' },
        },
        learningStats: {
          method: 'GET',
          path: '/api/learning/stats',
          description: 'Get complete learning statistics',
          response: { teachingStats: 'object', learningCycles: 'array', constitutionalAlignment: 'object' },
        },

        // PHASE 3B: MEMORY SYSTEM
        memoryAction: {
          method: 'POST',
          path: '/api/memory/action',
          description: 'Register an action in memory',
          body: { type: 'string', title: 'string', description: 'string', tags: 'array' },
        },
        memoryStatus: {
          method: 'GET',
          path: '/api/memory/status',
          description: 'Get memory status',
          response: { vaultPath: 'string', metrics: 'object', isInitialized: 'boolean' },
        },
        memoryEvolution: {
          method: 'GET',
          path: '/api/memory/evolution',
          description: 'Get evolution report',
          response: { metrics: 'object', report: 'string' },
        },

        // PHASE 3C: HACKERONE SPECIALIZATION
        securityAssess: {
          method: 'POST',
          path: '/api/security/assess',
          description: 'Assess vulnerability with HackerOne programs',
          body: { vulnerability_type: 'string', target_software: 'string?' },
          response: { assessment: 'object', applicable_programs: 'array' },
        },
        securityPayload: {
          method: 'POST',
          path: '/api/security/payload',
          description: 'Generate payload variations for exploitation',
          body: { vulnerability_type: 'string', target_tech: 'string?' },
          response: { variations: 'array', total_variations: 'number' },
        },
        securityRecon: {
          method: 'POST',
          path: '/api/security/recon',
          description: 'Generate reconnaissance plan and scripts',
          body: { target: 'string', scope: 'osint|enumeration|full' },
          response: { osint_queries: 'array', enumeration_scripts: 'array', assessment_plan: 'object' },
        },
        hackeroneAssess: {
          method: 'POST',
          path: '/api/hackerone/assess',
          description: 'Assess security finding and match with programs',
          body: { finding: { type: 'string', severity: 'string', description: 'string', confidence: 'number' } },
          response: { matched_programs: 'array', recommendations: 'object' },
        },
        hackeronePrograms: {
          method: 'GET',
          path: '/api/hackerone/programs',
          description: 'List HackerOne programs by vulnerability type',
          query: { vulnerability: 'string?', severity: 'string?', min_bounty: 'number?', max_bounty: 'number?' },
          response: { programs: 'array', total_programs: 'number' },
        },
        securityCVEs: {
          method: 'GET',
          path: '/api/security/cves',
          description: 'Search CVE database',
          query: { search: 'string?', severity: 'string?' },
          response: { cves: 'array', total_results: 'number', stats: 'object' },
        },

        // METRICS
        metrics: {
          method: 'GET',
          path: '/api/metrics',
          description: 'Get all system metrics',
          response: { system: 'object', tasks: 'object', learning: 'object', memory: 'object' },
        },
      },
    },
  });
});

// ============================================
// MODELO NATIVO & AUTOPROGRAMACIÓN
// ============================================

/**
 * GET /api/native-model/stats
 * Estado y estadísticas del modelo nativo de Jarvis
 */
app.get('/api/native-model/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: jarvisNativeModel.getStats(),
    timestamp: Date.now(),
  });
});

/**
 * POST /api/native-model/generate
 * Generar respuesta usando solo el modelo nativo (sin APIs externas)
 */
app.post('/api/native-model/generate', (req: Request, res: Response) => {
  try {
    const { query, mode = 'synthesize', context, iteration } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'query es requerido' });
    }

    const output = jarvisNativeModel.generate({
      query,
      context,
      iteration: iteration || 1,
      mode: mode as any,
    });

    res.json({
      success: true,
      data: output,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/self-programming/report
 * Reporte completo del motor de autoprogramación
 */
app.get('/api/self-programming/report', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: selfProgrammingEngine.getReport(),
    timestamp: Date.now(),
  });
});

/**
 * POST /api/self-programming/modify
 * Modificar un parámetro de comportamiento de Jarvis
 */
app.post('/api/self-programming/modify', (req: Request, res: Response) => {
  try {
    const { parameter, value, reason } = req.body;

    if (!parameter || value === undefined || !reason) {
      return res.status(400).json({
        success: false,
        error: 'parameter, value y reason son requeridos',
      });
    }

    const result = selfProgrammingEngine.modifyParameter(parameter, value, reason);

    res.json({
      success: result.success,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/self-programming/add-knowledge
 * Agregar conocimiento al sistema de Jarvis
 */
app.post('/api/self-programming/add-knowledge', (req: Request, res: Response) => {
  try {
    const { category, topic, content, confidence } = req.body;

    if (!category || !topic || !content) {
      return res.status(400).json({
        success: false,
        error: 'category, topic y content son requeridos',
      });
    }

    const entry = selfProgrammingEngine.addKnowledge({
      category,
      topic,
      content,
      confidence: confidence || 0.7,
    });

    res.json({
      success: true,
      data: entry,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/self-programming/add-pattern
 * Agregar nuevo patrón de razonamiento
 */
app.post('/api/self-programming/add-pattern', (req: Request, res: Response) => {
  try {
    const { name, trigger, steps } = req.body;

    if (!name || !trigger || !steps) {
      return res.status(400).json({
        success: false,
        error: 'name, trigger y steps son requeridos',
      });
    }

    const pattern = selfProgrammingEngine.addReasoningPattern({ name, trigger, steps });

    res.json({
      success: true,
      data: pattern,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/self-programming/analyze
 * Ejecutar análisis y auto-optimización completa
 */
app.post('/api/self-programming/analyze', async (req: Request, res: Response) => {
  try {
    const result = await selfProgrammingEngine.analyzeAndOptimize();
    res.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/self-programming/revert
 * Revertir última auto-modificación
 */
app.post('/api/self-programming/revert', (req: Request, res: Response) => {
  const result = selfProgrammingEngine.revertLastModification();
  res.json({
    success: result.success,
    data: result,
    timestamp: Date.now(),
  });
});

/**
 * GET /api/self-programming/parameters
 * Parámetros actuales de comportamiento
 */
app.get('/api/self-programming/parameters', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: selfProgrammingEngine.getParameters(),
    timestamp: Date.now(),
  });
});

// ============================================
// FIREBASE KNOWLEDGE GRAPH ENDPOINTS
// ============================================

/**
 * GET /api/knowledge-graph
 * Obtener todos los nodos del grafo de conocimiento desde Firebase
 */
app.get('/api/knowledge-graph', async (req: Request, res: Response) => {
  try {
    const nodes = await firebaseServerService.getKnowledgeGraph();
    res.json({
      success: true,
      data: {
        nodes,
        total: nodes.length,
        configured: firebaseServerService.isConfigured(),
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hackerone/learnings
 * Obtener aprendizajes recientes de HackerOne desde Firebase
 */
app.get('/api/hackerone/learnings', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '20', 10);
    const learnings = await firebaseServerService.getHackerOneLearnings(limit);
    res.json({
      success: true,
      data: {
        learnings,
        total: learnings.length,
        configured: firebaseServerService.isConfigured(),
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 404
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
  });
});

/**
 * ERROR HANDLER
 */
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
  try {
    await initializeJarvis();

    app.listen(PORT, HOST, () => {
      console.log(`✅ Servidor iniciado en http://${HOST}:${PORT}`);
      console.log(`📚 Documentación: http://${HOST}:${PORT}/api/docs`);
      console.log(`💓 Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, deteniendo servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, deteniendo servidor...');
  process.exit(0);
});

startServer();
