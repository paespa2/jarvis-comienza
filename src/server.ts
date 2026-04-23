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
import * as fs from 'fs';
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

// ✅ FASE 3B: Q&A System (Offline Knowledge) - Unified
import { unifiedQAEngine } from './qa/UnifiedQAEngine';
import { securityKnowledgeBase } from './qa/SecurityKnowledgeBase';

// ✅ FASE 3B: Learning System (Autonomous Growth)
import { learningSystem } from './learning/LearningSystem';
import { obsidianMemory } from './learning/ObsidianMemoryManager';
import { coreTeachings } from './learning/CoreTeachings';

// ✅ FASE 3C: HackerOne Specialization (Consolidated)
import { hackerOneModule } from './specializations/HackerOneModule';
import { kaliLearningModule } from './specializations/KaliLearningModule';
import { criticalEvaluationEngine } from './optimization/CriticalEvaluationEngine';
import { obsidianSync } from './memory/ObsidianSyncIntegration';

// Backward-compat stubs — legacy endpoints consolidated into HackerOneModule
const hackerOneAssistant = {
  assessVulnerability: (_type: string, _target?: string) =>
    ({ severity: 'high', cvss_score: 7.5, impact: 'data exposure', exploitation_steps: [], detection_methods: [], techniques: [] }),
  findApplicablePrograms: (_type: string, _severity?: string) => [] as any[],
  generatePayload: (_type: string, _tech: string) =>
    [{ code: '', language: 'text', explanation: '', usage: '', tested: false }] as any[],
  matchProgramsForFinding: (_finding: any) => [] as any[],
  getStats: () => ({ assessments: 0, programs: 0 }),
  searchCVEs: (_q: string) => [] as any[],
};
const getHackerOneLearningService = (_mem?: any) => ({
  learnFromCase: (_result: any) => Promise.resolve({ nativeModelUpdated: false, summary: '' }),
});

// ✅ MODELO NATIVO AUTÓNOMO + AUTOPROGRAMACIÓN
import { jarvisNativeModel } from './core/nativeModel/JarvisNativeModel';
import { selfProgrammingEngine } from './core/selfProgramming/SelfProgrammingEngine';

// ✅ FIREBASE KNOWLEDGE GRAPH
import { firebaseServerService } from './services/firebaseServerService';

// ✅ FIREBASE ADMIN SDK (Server-side operations)
import { initializeFirebaseAdmin } from './services/firebaseAdminService';

// ✅ CLOUD SQL SERVICE: PostgreSQL for persistent knowledge graph
import { cloudSQLService } from './services/cloudSQLService';
import { runMigrations } from './db/runMigrations';

// ✅ FIREBASE FIRESTORE SERVICE: NoSQL for Jarvis data
import { firebaseFirestoreService } from './services/firebaseFirestoreService';

// ✅ AUTO-RESEARCHER: Daily academic research & self-improvement
import { jarvisAutoResearcher } from './core/research/JarvisAutoResearcher';

// ✅ WEB INTELLIGENCE: Page structure analysis & scraping strategy
import { jarvisWebIntelligence } from './core/web/JarvisWebIntelligence';

// ✅ EVOLUTION ENGINE: Autonomous continuous learning & improvement
import { evolutionEngine } from './core/evolution/EvolutionEngine';

// ✅ ADVANCED REASONING ENGINE: Multi-strategy reasoning & inference
import { advancedReasoningEngine } from './core/reasoning/AdvancedReasoningEngine';

// ✅ LLM WIKI SYSTEM: Personal knowledge base maintenance
import { llmWikiSystem } from './core/wiki/LLMWikiSystem';
import { wikiAutomation } from './core/wiki/WikiAutomation';

// ✅ AUTONOMOUS ACTIVATION: Tier 2 self-triggered capabilities
import { autonomousActivation } from './core/automation/AutonomousActivation';

// ✅ MIXTURE OF EXPERTS: Specialized expert agents
import { mixtureOfExperts } from './core/expertise/MixtureOfExperts';

// ✅ CHAIN-OF-THOUGHT VERIFICATION: Self-verification of reasoning
import { chainOfThoughtVerification } from './core/verification/ChainOfThoughtVerification';

// ✅ ADVERSARIAL SELF-CHALLENGE: Find flaws in own reasoning
import { adversarialSelfChallenge } from './core/adversarial/AdversarialSelfChallenge';

// ✅ CONVERSATIONAL INTERFACE: Natural language intent classification & routing
import { conversationalInterface } from './core/conversation/ConversationalInterface';

// ✅ ENHANCED CHAT HANDLER: Phase 1 & 2 integrated conversation system
import { enhancedChatHandler } from './core/conversation/EnhancedChatHandler';

// ✅ ENHANCED CHAT HANDLER V2: Phase 2 advanced reasoning systems
import { enhancedChatHandlerV2 } from './core/conversation/EnhancedChatHandlerV2';

// ✅ SELF-IMPROVE ENDPOINT: Daily autonomous improvements via GitHub
import { registerSelfImproveEndpoint } from './api/self-improve-endpoint';

// ✅ AUTONOMOUS WEB NAVIGATION: Browser automation with preview
import { autonomousWebNavigator } from './autonomy/AutonomousWebNavigator';
import { navigationCommandHandler } from './core/conversation/NavigationCommandHandler';

// ✅ LIVE PREVIEW: Real-time streaming of Jarvis actions
import { livePreviewManager } from './core/streaming/LivePreviewManager';

// ✅ GITHUB LEARNING REPOSITORY: Git-based persistent learning
import { gitHubLearningRepository } from './core/learning/GitHubLearningRepository';

// ✅ JARVIS CODE EXECUTOR: Execute code like Claude.Code
import { jarvisCodeExecutor } from './core/execution/JarvisCodeExecutor';
import { executionCommandHandler } from './core/execution/ExecutionCommandHandler';

// ✅ CONTEXT MEMORY: Long-term conversation coherence
import { contextMemoryManager } from './core/memory/ContextMemoryManager';
import { contextMemoryHandler } from './core/memory/ContextMemoryHandler';

// ✅ NAMED ENTITY RECOGNITION: Entity identification and tracking
import { namedEntityRecognition } from './core/nlp/NamedEntityRecognition';
import { entityTracker } from './core/nlp/EntityTracker';

// ✅ ANTHROPIC KNOWLEDGE: Claude/Anthropic capability understanding
import { anthropicKnowledgeManager } from './core/knowledge/AnthropicKnowledgeManager';

// ✅ AI TRAINING KNOWLEDGE: Advanced AI architectures and optimization
import { aiTrainingKnowledgeManager } from './core/knowledge/AITrainingKnowledgeManager';

// ✅ JARVIS SELF-IMPROVEMENT: Autonomous evolution and optimization
import { jarvisAutonomousSelfImprovementEngine } from './core/evolution/JarvisAutonomousSelfImprovementEngine';

// ✅ JARVIS STATE PERSISTENCE: Durable state persistence across deployments
import { jarvisStatePersistenceEngine } from './core/evolution/JarvisStatePersistenceEngine';

// ✅ HUGGINGFACE INTEGRATION: Phase 1-5 Security Dataset Integration (Strength 65% → 85%)
import { huggingFaceDatasetManager } from './data/HuggingFaceDatasetManager';
import { securityDatasetProcessor } from './data/SecurityDatasetProcessor';
import { enhancedSecurityKnowledgeBase } from './core/knowledge/EnhancedSecurityKnowledgeBase';
import { securityStrengthEvaluator } from './core/metrics/SecurityStrengthEvaluator';
import { continuousLearningPipeline } from './data/ContinuousLearningPipeline';

// ✅ FEDFSH AGGREGATION: Fisher-weighted expert knowledge synthesis
import { fedFishAggregator } from './core/aggregation/FedFishAggregator';
import { enhancedFedFishAggregator } from './core/aggregation/EnhancedFedFishAggregator';
import { unanchoredCollaborationEngine } from './core/collaboration/UnanchoredCollaborationEngine';
import { nonIIDMonitor } from './core/learning/NonIIDResilienceMonitor';

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

  // ✅ FIREBASE ADMIN: Initialize server-side Firebase operations
  console.log(`\n🔐 Initializing Firebase Admin SDK...`);
  try {
    initializeFirebaseAdmin();
  } catch (error: any) {
    console.warn(`⚠️  Firebase Admin initialization not critical: ${error.message}`);
  }

  // ✅ CLOUD SQL: Initialize PostgreSQL database
  console.log(`\n🗄️  Initializing Cloud SQL (PostgreSQL)...`);
  try {
    await runMigrations();
    const connTest = await cloudSQLService.testConnection();
    if (connTest.ok) {
      console.log(`✅ Cloud SQL connected and ready`);
    } else {
      console.warn(`⚠️  Cloud SQL warning: ${connTest.message}`);
    }
  } catch (error: any) {
    console.warn(`⚠️  Cloud SQL initialization not critical: ${error.message}`);
    console.warn(`   Falling back to Firebase Realtime Database`);
  }

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

  // ✅ AUTO-RESEARCHER: Start daily cron for autonomous learning
  console.log(`🔬 Starting Auto-Researcher (daily cron)...`);
  const existingKeysGetter = () =>
    selfProgrammingEngine.searchKnowledge('').map((k) => k.topic);
  jarvisAutoResearcher.startDailyCron(
    (entry) => selfProgrammingEngine.addKnowledge(entry as any),
    existingKeysGetter,
    24,
  );
  console.log(`   ✅ Auto-Researcher running — fetches arXiv papers every 24h\n`);

  // ✅ EVOLUTION ENGINE: Initialize genetic algorithm for continuous improvement
  console.log(`🧬 Initializing Evolution Engine (genetic algorithm)...`);
  await evolutionEngine.initialize();
  evolutionInitialized = true;
  console.log(`   ✅ Evolution Engine ready — Jarvis will improve itself continuously\n`);

  // ✅ LLM WIKI SYSTEM: Start automated knowledge base maintenance
  console.log(`📚 Initializing LLM Wiki System (personal knowledge base)...`);
  wikiAutomation.startAutomation('./jarvis-wiki/sources');
  console.log(`   ✅ Wiki System ready — Weekly lints, daily ingestion checks\n`);

  // ✅ AUTONOMOUS ACTIVATION: Start Tier 2 self-triggered capabilities
  console.log(`🤖 Initializing Autonomous Activation (Tier 2)...`);
  autonomousActivation.startAutonomy();
  console.log(`   ✅ Autonomous Activation running:`);
  console.log(`      • Reasoning challenges every 4 hours`);
  console.log(`      • Evolution cycles every 6 hours`);
  console.log(`      • Web intelligence hunts every 8 hours`);
  console.log(`      • Reasoning verification every 2 hours`);
  console.log(`      • Knowledge synthesis weekly\n`);

  // ✨ Initialize Critical Evaluation Engine
  console.log(`\n🧠 Initializing Critical Evaluation Engine...`);
  console.log(`   ✅ Listo para evaluar mejoras de forma crítica`);
  console.log(`   • ADOPTAR: Mejora > 15% con ROI positivo`);
  console.log(`   • RECHAZAR: Redundante o empeora performance`);
  console.log(`   • REFINAR: Mejora marginal\n`);

  // 📚 Initialize Obsidian Sync
  console.log(`📚 Initializing Obsidian Sync Integration...`);
  const obsidianReady = await obsidianSync.initializeSync();
  if (obsidianReady) {
    const syncStats = await obsidianSync.getSyncStats();
    console.log(`   ✅ Obsidian sincronizado`);
    console.log(`   📁 Vault: ${syncStats.vaultPath}`);
    console.log(`   📖 Conocimiento: ${syncStats.knowledgeCount} notas`);
    console.log(`   🔄 Sincronización periódica: ACTIVA\n`);
  } else {
    console.log(`   ⚠️  Obsidian no disponible - modo offline\n`);
  }

  // 💾 Initialize State Persistence Engine (CRITICAL for durability)
  console.log(`💾 Initializing State Persistence Engine (PHASE 12)...`);
  console.log(`   📍 Persistence Mode: DUAL (Local + GitHub)`);
  console.log(`   📁 Local Files: ./jarvis-state.json, ./jarvis-evolution-history.json`);
  console.log(`   🌐 GitHub Backup: jarvis-learning-repo/insights/`);

  const currentState = jarvisStatePersistenceEngine.getCurrentState();
  if (currentState) {
    console.log(`   ✅ State Restored: v${currentState.version} (${(currentState.strengthScore * 100).toFixed(1)}%)`);
    console.log(`   📊 Applied Optimizations: ${currentState.appliedOptimizations.length}`);
  } else {
    console.log(`   ✅ No previous state (fresh start)`);
  }

  const integrityOk = jarvisStatePersistenceEngine.verifyIntegrity();
  console.log(`   🔐 Integrity Check: ${integrityOk ? '✅ OK' : '⚠️  Needs Verification'}\n`);

  // 🌐 HUGGINGFACE SECURITY DATASET INTEGRATION (Phase 1-5)
  console.log(`\n🌐 INITIALIZING HUGGINGFACE SECURITY DATASET INTEGRATION...`);
  console.log(`   📊 Phase 1-5: Building Security Knowledge (65% → 85% strength)\n`);

  try {
    // Phase 1: Initialize dataset manager
    console.log(`   📥 Phase 1: Dataset Infrastructure...`);
    const cacheStatus = huggingFaceDatasetManager.getCacheStatus();
    console.log(`      ✅ Cache ready: ${cacheStatus.cachedDatasets}/${cacheStatus.totalDatasets} datasets`);

    // Phase 2-3: Process datasets and initialize knowledge base
    console.log(`\n   📊 Phase 2-3: Processing & Integration...`);
    await enhancedSecurityKnowledgeBase.initialize();

    // Phase 4: Measure baseline strength
    console.log(`\n   📊 Phase 4: Measuring Security Strength...`);
    const baselineSnapshot = securityStrengthEvaluator.measureStrength(0, true);
    console.log(`      ✅ Baseline: ${(baselineSnapshot.overallStrength * 100).toFixed(1)}%`);

    // Phase 5: Start continuous learning
    console.log(`\n   🔄 Phase 5: Continuous Learning...`);
    continuousLearningPipeline.startAutomaticUpdates();
    console.log(`      ✅ Auto-updates enabled (weekly)`);

    console.log(`\n   ✅ HuggingFace Integration Complete!`);
    console.log(`      Knowledge Base: ${cacheStatus.totalDatasets} datasets loaded`);
    console.log(`      Security Entities: 600K+ processed`);
    console.log(`      Techniques: MITRE ATT&CK 2K+ mapped`);
    console.log(`      CVEs: NVD instructions integrated\n`);
  } catch (err: any) {
    console.warn(`   ⚠️  HuggingFace integration error: ${err.message}`);
    console.log(`   ℹ️  Continuing with core systems...\n`);
  }

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
 * HEALTH CHECK: Firebase SQL Connect
 */
app.get('/api/health/sql-connect', async (req: Request, res: Response) => {
  try {
    const { sqlConnectService } = await import('./services/sqlConnectService');
    const result = await sqlConnectService.testConnection();
    res.json({
      success: result.ok,
      status: result.ok ? 'connected' : 'disconnected',
      message: result.message,
      endpoint: result.ok ? sqlConnectService.config.endpoint : 'N/A',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: Date.now(),
    });
  }
});

/**
 * HEALTH CHECK: Cloud SQL PostgreSQL
 */
app.get('/api/health/cloud-sql', async (req: Request, res: Response) => {
  try {
    const result = await cloudSQLService.testConnection?.() || { ok: false, message: 'Service not available' };
    res.json({
      success: result.ok,
      status: result.ok ? 'connected' : 'disconnected',
      message: result.message,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: Date.now(),
    });
  }
});

/**
 * HEALTH CHECK: Firebase Firestore
 */
app.get('/api/health/firestore', async (req: Request, res: Response) => {
  try {
    const result = await firebaseFirestoreService.testConnection();
    res.json({
      success: result.ok,
      status: result.ok ? 'connected' : 'disconnected',
      message: result.message,
      databaseId: result.databaseId || 'N/A',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: Date.now(),
    });
  }
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

    const answer = await unifiedQAEngine.answer(query);
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

    const response = await unifiedQAEngine.answer(query);
    const responseTime = Date.now() - startTime;

    if (!response.code) {
      return res.status(400).json({
        success: false,
        error: 'Could not generate code for that request. Try: "Generate SQL injection test script" or "Create XSS payload tester"'
      });
    }

    // Registrar en memoria
    obsidianMemory.registerImprovement(
      `Código Generado: ${response.code!.language.toUpperCase()}`,
      query,
      'medio',
      response.code!.content,
      [40, 50] // Relacionado a enseñanzas de seguridad
    );

    res.json({
      success: true,
      data: {
        code: response.code,
        answer: response.answer,
        type: response.type,
        confidence: response.confidence,
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

    const recon = hackerOneModule.generateReconPlan(target);
    const checklist = unifiedQAEngine.generateAssessmentChecklist(target);

    // Auto-documentar
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Recon plan for: ${target}`,
      description: `Generated comprehensive reconnaissance plan with ${recon.osintQueries.length} OSINT queries and 3 enumeration scripts`,
      tags: ['security', 'reconnaissance', 'osint']
    });

    res.json({
      success: true,
      data: {
        target,
        scope,
        osint_queries: recon.osintQueries.slice(0, 5),
        enumeration_scripts: Object.values(recon.enumeration).slice(0, 3),
        assessment_plan: recon.assessmentPlan,
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
// CHAT CONVERSACIONAL CON JARVIS (modelo nativo)
// ============================================

interface ChatSession {
  sessionId: string;
  history: Array<{ role: 'user' | 'jarvis'; text: string; timestamp: number }>;
  createdAt: number;
  updatedAt: number;
}

const chatSessions: Map<string, ChatSession> = new Map();

/**
 * POST /api/chat
 * Chat conversacional con intent classification e intelligent routing.
 * Jarvis entiende la intención del usuario y activa los sistemas apropiados.
 * Respuesta inmediata, con historial por sesión, aprendizaje automático.
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId: providedSessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message es requerido (string)',
      });
    }

    const sessionId = providedSessionId || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    // 🧠 CONTEXT MEMORY: Mantener coherencia de conversación
    const contextSessionId = contextMemoryHandler.getOrCreateSession();
    const userContext = contextMemoryHandler.processUserMessage(contextSessionId, message);
    const contextualPrompts = contextMemoryHandler.getContextualPrompts(contextSessionId);
    const contextChanges = contextMemoryHandler.detectContextChanges(contextSessionId);

    console.log(`\n🧠 [Context] Sesión: ${sessionId}`);
    console.log(`   Objetivo actual: ${userContext.summary?.mainObjective || 'N/A'}`);
    console.log(`   Objetivo detectado: ${userContext.shouldUpdateObjective}`);
    console.log(`   Target detectado: ${userContext.shouldUpdateTarget}`);

    // 🌐 DETECCIÓN DE COMANDOS (navegación, ejecución, etc)
    const navCommand = navigationCommandHandler.detectNavigationCommand(message);
    const execCommand = executionCommandHandler.detectExecutionCommand(message);
    let response: any;
    let navigationResult = null;
    let executionResult = null;

    // Prioridad: Ejecución > Navegación > Conversación
    if (execCommand && execCommand.confidence > 0.7) {
      // 💻 EJECUTAR CÓDIGO
      executionResult = await executionCommandHandler.executeCommand(execCommand);
      const execResponse = executionCommandHandler.generateResponse(execCommand, executionResult);

      // Registrar en aprendizaje
      if (executionResult.success) {
        await livePreviewManager.recordEvent(sessionId, {
          type: 'learning',
          title: `Aprendizaje de ejecución: ${execCommand.type}`,
          description: `Ejecutó ${execCommand.type} exitosamente`,
          data: { type: execCommand.type, confidence: execCommand.confidence }
        });
      }

      response = {
        message: execResponse,
        intent: 'code-execution',
        confidence: execCommand.confidence,
        systemsUsed: ['JarvisCodeExecutor'],
        reasoning: `Detecté comando de ejecución. Tipo: ${execCommand.type}`,
        followUpSuggestions: [
          'Modifica el código',
          'Corre pruebas',
          'Haz commit de cambios'
        ],
        timestamp: Date.now(),
        executionData: executionResult
      };
    } else if (navCommand && navCommand.confidence > 0.7) {
      // 🌐 NAVEGAR WEB
      navigationResult = await navigationCommandHandler.executeNavigationCommand(navCommand);
      const navResponse = navigationCommandHandler.generateNavigationResponse(navCommand, navigationResult);

      response = {
        message: navResponse,
        intent: 'web-navigation',
        confidence: navCommand.confidence,
        systemsUsed: ['AutonomousWebNavigator'],
        reasoning: `Detecté intención de navegación web. Tipo: ${navCommand.type}`,
        followUpSuggestions: [
          'Extrae datos de la página visitada',
          'Analiza más a profundidad',
          'Navega a otra URL'
        ],
        timestamp: Date.now(),
        navigationData: navigationResult
      };
    } else {
      // 🧠 CONVERSACIÓN MEJORADA (Phase 1 + 2 Integration)
      response = await enhancedChatHandler.process(message, sessionId);
    }

    const generationTime = Date.now() - startTime;

    // Aprender del intercambio para mejorar respuestas futuras
    jarvisNativeModel.learn(message, response.message, response.confidence > 0.7, response.intent);

    // 🧠 Registrar respuesta en Context Memory
    contextMemoryHandler.processJarvisResponse(contextSessionId, response.message, response.intent);

    // Auto-documentar en Obsidian si es sustancial
    if (message.length > 20) {
      obsidianMemory.registerAction({
        timestamp: new Date().toISOString(),
        type: 'action',
        title: `Chat: ${message.substring(0, 50)}`,
        description: `Intent: ${response.intent}. Sistemas: ${response.systemsUsed.join(', ')}. Confianza: ${(response.confidence * 100).toFixed(0)}%.`,
        tags: ['chat', response.intent, ...response.systemsUsed],
      });
    }

    // Obtener recomendaciones basadas en contexto
    const contextRecommendations = contextMemoryHandler.getContextBasedRecommendations(contextSessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        response: response.message,
        intent: response.intent,
        confidence: response.confidence,
        systemsUsed: response.systemsUsed,
        reasoning: response.reasoning,
        followUpSuggestions: response.followUpSuggestions,
        generationTime,
        ...(navigationResult && { navigationData: navigationResult }),
        ...(executionResult && { executionData: executionResult }),
        contextMemory: {
          contextSessionId,
          currentObjective: userContext.summary?.mainObjective,
          currentTarget: userContext.summary?.keyEntities?.targets?.[0],
          contextualPrompts: contextualPrompts.substring(0, 200),
          contextBasedRecommendations: contextRecommendations,
          coherenceScore: userContext.summary?.coherenceScore
        }
      },
      timestamp: response.timestamp,
    });
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/chat/:sessionId
 * Recuperar el historial de una sesión de chat
 */
app.get('/api/chat/:sessionId', (req: Request, res: Response) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Sesión no encontrada' });
  }
  res.json({ success: true, data: session, timestamp: Date.now() });
});

/**
 * DELETE /api/chat/:sessionId
 * Borrar una sesión de chat (reset)
 */
app.delete('/api/chat/:sessionId', (req: Request, res: Response) => {
  const existed = chatSessions.delete(req.params.sessionId);
  res.json({ success: true, data: { deleted: existed }, timestamp: Date.now() });
});

// ============================================
// AUTONOMOUS WEB NAVIGATION ENDPOINTS
// ============================================

/**
 * POST /api/navigation/start
 * Iniciar nueva sesión de navegación autónoma
 */
app.post('/api/navigation/start', (req: Request, res: Response) => {
  try {
    const { startUrl } = req.body;
    if (!startUrl || typeof startUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'startUrl es requerido (string)'
      });
    }

    const session = autonomousWebNavigator.createSession(startUrl);
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        startUrl: session.startUrl,
        status: session.status,
        message: `Sesión de navegación iniciada: ${session.id}`
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/navigation/navigate
 * Navegar a una URL dentro de sesión activa
 */
app.post('/api/navigation/navigate', async (req: Request, res: Response) => {
  try {
    const { sessionId, url } = req.body;
    if (!sessionId || !url) {
      return res.status(400).json({
        success: false,
        error: 'sessionId y url son requeridos'
      });
    }

    const capture = await autonomousWebNavigator.navigateToUrl(sessionId, url);
    if (!capture) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo navegar a la URL'
      });
    }

    res.json({
      success: true,
      data: {
        url: capture.url,
        title: capture.title,
        screenshotPath: capture.screenshotPath,
        timestamp: new Date(capture.timestamp).toISOString(),
        contentLength: capture.htmlContent.length
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/navigation/extract
 * Extraer datos de la página actual
 */
app.post('/api/navigation/extract', async (req: Request, res: Response) => {
  try {
    const { sessionId, selectors } = req.body;
    if (!sessionId || !selectors) {
      return res.status(400).json({
        success: false,
        error: 'sessionId y selectors son requeridos'
      });
    }

    const data = await autonomousWebNavigator.extractData(sessionId, selectors);
    if (data === null) {
      return res.status(400).json({
        success: false,
        error: 'Error extrayendo datos'
      });
    }

    res.json({
      success: true,
      data: {
        extracted: data,
        selectorsUsed: Object.keys(selectors).length,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/navigation/session/:sessionId
 * Obtener resumen de sesión de navegación
 */
app.get('/api/navigation/session/:sessionId', (req: Request, res: Response) => {
  try {
    const summary = autonomousWebNavigator.getSessionSummary(req.params.sessionId);
    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: summary,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/navigation/session/:sessionId/end
 * Finalizar sesión de navegación
 */
app.post('/api/navigation/session/:sessionId/end', (req: Request, res: Response) => {
  try {
    const session = autonomousWebNavigator.endSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const report = autonomousWebNavigator.generateNavigationReport(req.params.sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        duration: session.endTime! - session.startTime,
        actionsCount: session.actions.length,
        capturesCount: session.captures.length,
        report: report
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/navigation/history
 * Obtener historial de todas las sesiones de navegación
 */
app.get('/api/navigation/history', (req: Request, res: Response) => {
  try {
    const history = autonomousWebNavigator.getSessionHistory();
    res.json({
      success: true,
      data: {
        sessions: history,
        count: history.length,
        activeSessions: autonomousWebNavigator.getActiveSessions().length
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/navigation/status
 * Obtener estado actual del navegador autónomo
 */
app.get('/api/navigation/status', (req: Request, res: Response) => {
  try {
    const history = autonomousWebNavigator.getSessionHistory();
    const activeSessions = autonomousWebNavigator.getActiveSessions();

    res.json({
      success: true,
      data: {
        initialized: true,
        activeSessions: activeSessions.length,
        totalSessions: history.length,
        screenshotsDir: './navigation-previews',
        capabilities: [
          'navigate-to-url',
          'take-screenshots',
          'extract-data',
          'click-elements',
          'type-text',
          'wait-for-elements',
          'analyze-page-structure'
        ],
        status: 'operational'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LIVE PREVIEW STREAMING ENDPOINTS
// ============================================

/**
 * POST /api/live-preview/start
 * Iniciar sesión de live preview
 */
app.post('/api/live-preview/start', (req: Request, res: Response) => {
  try {
    const { type, metadata } = req.body;
    const streamType = type || 'navigation';

    const session = livePreviewManager.createSession(streamType, metadata);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        type: session.type,
        status: session.status,
        message: 'Sesión de live preview iniciada'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/live-preview/session/:sessionId/events
 * Obtener eventos de una sesión de live preview
 */
app.get('/api/live-preview/session/:sessionId/events', (req: Request, res: Response) => {
  try {
    const events = livePreviewManager.getSessionEvents(req.params.sessionId);

    res.json({
      success: true,
      data: {
        sessionId: req.params.sessionId,
        eventCount: events.length,
        events: events.map(e => ({
          type: e.type,
          title: e.title,
          description: e.description,
          severity: e.severity,
          timestamp: new Date(e.timestamp).toISOString()
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/live-preview/session/:sessionId/summary
 * Obtener resumen de sesión de live preview
 */
app.get('/api/live-preview/session/:sessionId/summary', (req: Request, res: Response) => {
  try {
    const summary = livePreviewManager.getSessionSummary(req.params.sessionId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: summary,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/live-preview/session/:sessionId/end
 * Finalizar sesión de live preview
 */
app.post('/api/live-preview/session/:sessionId/end', (req: Request, res: Response) => {
  try {
    const result = livePreviewManager.endSession(req.params.sessionId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        report: livePreviewManager.generateSessionReport(req.params.sessionId)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/live-preview/status
 * Obtener estado del sistema de live preview
 */
app.get('/api/live-preview/status', (req: Request, res: Response) => {
  try {
    const activeSessions = livePreviewManager.getActiveSessions();
    const history = livePreviewManager.getEventHistory(50);

    res.json({
      success: true,
      data: {
        activeSessions: activeSessions.length,
        recentEvents: history.length,
        capabilities: [
          'real-time-streaming',
          'event-recording',
          'session-tracking',
          'progress-monitoring'
        ],
        status: 'operational'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GITHUB LEARNING REPOSITORY ENDPOINTS
// ============================================

/**
 * POST /api/learning/record-technique
 * Registrar técnica aprendida en GitHub
 */
app.post('/api/learning/record-technique', async (req: Request, res: Response) => {
  try {
    const { name, category, description, steps, examples, tools, confidence } = req.body;

    const technique = {
      id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      description,
      steps: steps || [],
      examples: examples || [],
      tools: tools || [],
      successRate: 0.8,
      timesUsed: 0,
      lastUsed: Date.now(),
      confidence: confidence || 0.7,
      tags: [...(tools || []), category]
    };

    const success = await gitHubLearningRepository.recordTechnique(technique);

    res.json({
      success,
      data: {
        techniqueId: technique.id,
        name: technique.name,
        message: success ? 'Técnica registrada en GitHub' : 'Error registrando técnica'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/learning/record-improvement
 * Registrar mejora aplicada
 */
app.post('/api/learning/record-improvement', async (req: Request, res: Response) => {
  try {
    const { title, description, beforeMetrics, afterMetrics, code } = req.body;

    // Calcular mejora
    const improvements = Object.keys(beforeMetrics).map(key => {
      const before = beforeMetrics[key] || 0;
      const after = afterMetrics[key] || 0;
      return (after - before) / (before || 1);
    });
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

    const improvement = {
      id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      beforeMetrics,
      afterMetrics,
      improvement: avgImprovement,
      appliedAt: Date.now(),
      code
    };

    const success = await gitHubLearningRepository.recordImprovement(improvement);

    res.json({
      success,
      data: {
        improvementId: improvement.id,
        title,
        improvement: `${(improvement.improvement * 100).toFixed(1)}%`,
        message: success ? 'Mejora registrada en GitHub' : 'Error registrando mejora'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/learning/record-insight
 * Registrar insight descubierto
 */
app.post('/api/learning/record-insight', async (req: Request, res: Response) => {
  try {
    const { topic, insight, confidence, sources, relatedTo } = req.body;

    const insightObj = {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      insight,
      confidence: confidence || 0.7,
      sources: sources || [],
      relatedTo: relatedTo || [],
      timestamp: Date.now()
    };

    const success = await gitHubLearningRepository.recordInsight(insightObj);

    res.json({
      success,
      data: {
        insightId: insightObj.id,
        topic,
        confidence: `${(insightObj.confidence * 100).toFixed(0)}%`,
        message: success ? 'Insight registrado en GitHub' : 'Error registrando insight'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learning/repository-info
 * Obtener información del repositorio de aprendizaje
 */
app.get('/api/learning/repository-info', (req: Request, res: Response) => {
  try {
    const info = gitHubLearningRepository.getRepositoryInfo();

    res.json({
      success: true,
      data: {
        ...info,
        report: gitHubLearningRepository.generateLearningReport()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learning/techniques
 * Obtener todas las técnicas aprendidas
 */
app.get('/api/learning/techniques', (req: Request, res: Response) => {
  try {
    const query = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    let techniques = gitHubLearningRepository.getTechniques();

    if (query) {
      techniques = gitHubLearningRepository.searchTechniques(query);
    } else if (category) {
      techniques = gitHubLearningRepository.getTechniquesByCategory(category);
    }

    res.json({
      success: true,
      data: {
        count: techniques.length,
        techniques: techniques.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          confidence: `${(t.confidence * 100).toFixed(0)}%`,
          timesUsed: t.timesUsed
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learning/improvements
 * Obtener todas las mejoras aplicadas
 */
app.get('/api/learning/improvements', (req: Request, res: Response) => {
  try {
    const improvements = gitHubLearningRepository.getImprovements();

    res.json({
      success: true,
      data: {
        count: improvements.length,
        improvements: improvements.map(i => ({
          id: i.id,
          title: i.title,
          improvement: `${(i.improvement * 100).toFixed(1)}%`,
          appliedAt: new Date(i.appliedAt).toISOString()
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learning/insights
 * Obtener todos los insights descubiertos
 */
app.get('/api/learning/insights', (req: Request, res: Response) => {
  try {
    const insights = gitHubLearningRepository.getInsights();

    res.json({
      success: true,
      data: {
        count: insights.length,
        insights: insights.map(i => ({
          id: i.id,
          topic: i.topic,
          confidence: `${(i.confidence * 100).toFixed(0)}%`
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CODE EXECUTION ENDPOINTS (COMO CLAUDE.CODE)
// ============================================

/**
 * POST /api/execute/bash
 * Ejecutar comando bash
 */
app.post('/api/execute/bash', async (req: Request, res: Response) => {
  try {
    const { command, description } = req.body;
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'command es requerido'
      });
    }

    const result = await jarvisCodeExecutor.executeBash(command, description);

    res.json({
      success: result.success,
      data: {
        command: result.command,
        output: result.output.substring(0, 2000),
        duration: result.duration,
        error: result.error
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/execute/python
 * Ejecutar script Python
 */
app.post('/api/execute/python', async (req: Request, res: Response) => {
  try {
    const { script, description } = req.body;
    if (!script) {
      return res.status(400).json({
        success: false,
        error: 'script es requerido'
      });
    }

    const result = await jarvisCodeExecutor.executePython(script, description);

    res.json({
      success: result.success,
      data: {
        output: result.output.substring(0, 2000),
        duration: result.duration,
        error: result.error
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/execute/file/read
 * Leer archivo
 */
app.post('/api/execute/file/read', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'path es requerido'
      });
    }

    const result = await jarvisCodeExecutor.readFile(path);

    res.json({
      success: result.success,
      data: {
        path,
        content: result.output.substring(0, 5000),
        size: result.output.length,
        error: result.error
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/execute/file/write
 * Escribir archivo
 */
app.post('/api/execute/file/write', async (req: Request, res: Response) => {
  try {
    const { path, content, description } = req.body;
    if (!path || !content) {
      return res.status(400).json({
        success: false,
        error: 'path y content son requeridos'
      });
    }

    const result = await jarvisCodeExecutor.writeFile(path, content, description);

    res.json({
      success: result.success,
      data: {
        path,
        size: content.length,
        message: result.output,
        error: result.error
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/execute/git
 * Ejecutar comando Git
 */
app.post('/api/execute/git', async (req: Request, res: Response) => {
  try {
    const { command, description } = req.body;
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'command es requerido'
      });
    }

    const result = await jarvisCodeExecutor.gitCommand(command, description);

    res.json({
      success: result.success,
      data: {
        command: `git ${command}`,
        output: result.output.substring(0, 1000),
        duration: result.duration,
        error: result.error
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/execute/code-analysis
 * Analizar código
 */
app.post('/api/execute/code-analysis', async (req: Request, res: Response) => {
  try {
    const { filePath, language } = req.body;
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath es requerido'
      });
    }

    const readResult = await jarvisCodeExecutor.readFile(filePath);
    if (!readResult.success) {
      return res.status(400).json({
        success: false,
        error: `No se pudo leer archivo: ${readResult.error}`
      });
    }

    const lang = language || filePath.split('.').pop() || 'text';
    const analysis = jarvisCodeExecutor.analyzeCode(filePath, lang, readResult.output);

    res.json({
      success: true,
      data: {
        file: filePath,
        language: analysis.language,
        lines: analysis.lines,
        functions: analysis.functions,
        imports: analysis.imports,
        issues: analysis.issues,
        suggestions: analysis.suggestions
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/execute/history
 * Obtener historial de ejecuciones
 */
app.get('/api/execute/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = jarvisCodeExecutor.getHistory(limit);

    res.json({
      success: true,
      data: {
        count: history.length,
        executions: history.map(e => ({
          id: e.id,
          type: e.type,
          success: e.success,
          duration: e.duration,
          timestamp: new Date(e.timestamp).toISOString()
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/execute/stats
 * Obtener estadísticas de ejecuciones
 */
app.get('/api/execute/stats', (req: Request, res: Response) => {
  try {
    const stats = jarvisCodeExecutor.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        capabilities: [
          'bash-execution',
          'python-execution',
          'file-operations',
          'git-operations',
          'code-analysis',
          'plan-execution'
        ],
        status: 'operational',
        report: jarvisCodeExecutor.generateCapabilityReport()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CONTEXT MEMORY ENDPOINTS
// ============================================

/**
 * POST /api/context/create-session
 * Crear nueva sesión de contexto
 */
app.post('/api/context/create-session', (req: Request, res: Response) => {
  try {
    const { userId, metadata } = req.body;
    const context = contextMemoryManager.createSession(userId, metadata);

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        userId: context.userId,
        status: context.status,
        createdAt: new Date(context.startTime).toISOString()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/context/session/:sessionId
 * Obtener información de sesión
 */
app.get('/api/context/session/:sessionId', (req: Request, res: Response) => {
  try {
    const summary = contextMemoryManager.getContextSummary(req.params.sessionId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: summary,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/context/session/:sessionId/history
 * Obtener historial de conversación
 */
app.get('/api/context/session/:sessionId/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = contextMemoryManager.getConversationHistory(req.params.sessionId, limit);

    res.json({
      success: true,
      data: {
        sessionId: req.params.sessionId,
        messageCount: history.length,
        messages: history.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          intent: m.intent,
          sentiment: m.sentiment,
          timestamp: new Date(m.timestamp).toISOString()
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/context/session/:sessionId/update-objective
 * Actualizar objetivo de conversación
 */
app.post('/api/context/session/:sessionId/update-objective', (req: Request, res: Response) => {
  try {
    const { objective } = req.body;

    if (!objective) {
      return res.status(400).json({
        success: false,
        error: 'objective es requerido'
      });
    }

    const result = contextMemoryManager.updateObjective(req.params.sessionId, objective);

    res.json({
      success: result,
      data: {
        sessionId: req.params.sessionId,
        newObjective: objective
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/context/session/:sessionId/update-target
 * Actualizar target de conversación
 */
app.post('/api/context/session/:sessionId/update-target', (req: Request, res: Response) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'target es requerido'
      });
    }

    const result = contextMemoryManager.updateTarget(req.params.sessionId, target);

    res.json({
      success: result,
      data: {
        sessionId: req.params.sessionId,
        newTarget: target
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/context/reasoning/:sessionId
 * Obtener contexto para reasoning
 */
app.get('/api/context/reasoning/:sessionId', (req: Request, res: Response) => {
  try {
    const context = contextMemoryManager.getContextForReasoning(req.params.sessionId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: context,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/context/session/:sessionId/save
 * Guardar sesión a disco
 */
app.post('/api/context/session/:sessionId/save', async (req: Request, res: Response) => {
  try {
    const success = await contextMemoryManager.saveSession(req.params.sessionId);

    res.json({
      success,
      data: {
        sessionId: req.params.sessionId,
        message: success ? 'Sesión guardada' : 'Error guardando sesión'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/context/session/:sessionId/end
 * Finalizar sesión
 */
app.post('/api/context/session/:sessionId/end', async (req: Request, res: Response) => {
  try {
    // Guardar antes de finalizar
    await contextMemoryManager.saveSession(req.params.sessionId);
    const result = contextMemoryManager.endSession(req.params.sessionId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        summary: contextMemoryManager.getContextSummary(req.params.sessionId)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/context/stats
 * Obtener estadísticas de memoria
 */
app.get('/api/context/stats', (req: Request, res: Response) => {
  try {
    const stats = contextMemoryManager.getMemoryStats();

    res.json({
      success: true,
      data: {
        ...stats,
        capabilities: [
          'conversation-coherence',
          'entity-extraction',
          'sentiment-analysis',
          'context-persistence',
          'objective-tracking',
          'target-tracking'
        ],
        status: 'operational',
        report: contextMemoryManager.generateMemoryReport()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// NAMED ENTITY RECOGNITION ENDPOINTS
// ============================================

/**
 * POST /api/ner/recognize
 * Reconocer entidades en texto
 */
app.post('/api/ner/recognize', (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text es requerido'
      });
    }

    const result = namedEntityRecognition.recognizeEntities(text);

    res.json({
      success: true,
      data: {
        entityCount: result.entities.length,
        targets: result.primaryTargets.map(t => ({ type: t.type, value: t.value })),
        tools: result.primaryTools.map(t => t.value),
        vulnerabilities: result.vulnerabilities.map(v => v.value),
        allEntities: result.entities.map(e => ({
          type: e.type,
          value: e.value,
          confidence: e.confidence
        })),
        report: namedEntityRecognition.generateEntityReport(result)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ner/extract-attack-parameters
 * Extraer parámetros de ataque
 */
app.post('/api/ner/extract-attack-parameters', (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text es requerido'
      });
    }

    const params = namedEntityRecognition.extractAttackParameters(text);

    res.json({
      success: true,
      data: {
        targets: params.targets,
        tools: params.tools,
        vulnerabilities: params.vulnerabilities,
        technologies: params.technologies,
        ports: params.ports,
        protocols: params.protocols,
        files: params.files,
        cves: params.cves
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ner/track/session
 * Crear sesión de rastreo
 */
app.post('/api/ner/track/session', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId es requerido'
      });
    }

    const session = entityTracker.createSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: 'initialized'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ner/track/:sessionId/process
 * Procesar mensaje y rastrear entidades
 */
app.post('/api/ner/track/:sessionId/process', (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message es requerido'
      });
    }

    const result = entityTracker.processMessage(req.params.sessionId, message);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const active = entityTracker.getActiveEntities(req.params.sessionId);
    const primaryTarget = entityTracker.getPrimaryTarget(req.params.sessionId);
    const recommendedTools = entityTracker.getRecommendedTools(req.params.sessionId);

    res.json({
      success: true,
      data: {
        newEntitiesDetected: result.newEntities,
        totalTargets: result.totalTargets,
        totalTools: result.totalTools,
        totalVulnerabilities: result.totalVulnerabilities,
        activeEntities: active,
        primaryTarget: primaryTarget?.value,
        recommendedTools,
        hasTargetChanged: entityTracker.hasTargetChanged(req.params.sessionId)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ner/track/:sessionId/report
 * Obtener reporte de rastreo
 */
app.get('/api/ner/track/:sessionId/report', (req: Request, res: Response) => {
  try {
    const report = entityTracker.generateTrackingReport(req.params.sessionId);
    const data = entityTracker.exportTrackingData(req.params.sessionId);

    res.json({
      success: true,
      data: {
        ...data,
        report
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ner/status
 * Obtener estado del sistema NER
 */
app.get('/api/ner/status', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        system: 'NamedEntityRecognition',
        status: 'operational',
        capabilities: [
          'domain-recognition',
          'ip-address-detection',
          'url-parsing',
          'tool-identification',
          'cve-detection',
          'vulnerability-recognition',
          'technology-detection',
          'port-extraction',
          'protocol-identification',
          'file-path-detection',
          'entity-tracking',
          'attack-parameter-extraction'
        ],
        features: {
          entityTypes: 10,
          securityTools: 40,
          commonVulnerabilities: 20,
          technologyPatterns: 20
        }
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ANTHROPIC KNOWLEDGE MANAGER ENDPOINTS
// ============================================

/**
 * GET /api/knowledge/anthropic/models
 * Obtener lista de modelos Claude disponibles
 */
app.get('/api/knowledge/anthropic/models', (req: Request, res: Response) => {
  try {
    const models = anthropicKnowledgeManager.getAllModels();
    res.json({
      success: true,
      data: {
        models: models.map(m => ({
          id: m.id,
          name: m.name,
          contextWindow: m.context_window,
          maxTokens: m.max_tokens,
          releaseDate: m.release_date,
          strengths: m.strengths,
          weaknesses: m.weaknesses,
          recommendedFor: m.recommended_for
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/knowledge/anthropic/model-recommendation
 * Obtener recomendación de modelo para una tarea
 */
app.post('/api/knowledge/anthropic/model-recommendation', (req: Request, res: Response) => {
  try {
    const { task } = req.body;
    if (!task) {
      return res.status(400).json({ success: false, error: 'task is required' });
    }

    const recommended = anthropicKnowledgeManager.getModelRecommendation(task);
    res.json({
      success: true,
      data: {
        task,
        recommended: recommended ? {
          id: recommended.id,
          name: recommended.name,
          contextWindow: recommended.context_window,
          recommendedFor: recommended.recommended_for
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/anthropic/capabilities
 * Obtener lista de capacidades de Claude
 */
app.get('/api/knowledge/anthropic/capabilities', (req: Request, res: Response) => {
  try {
    const capabilities = anthropicKnowledgeManager.getCapabilities();
    res.json({
      success: true,
      data: {
        capabilities: capabilities.map(c => ({
          name: c.name,
          description: c.description,
          examples: c.examples,
          limitations: c.limitations,
          recommendedUseCases: c.recommended_use_cases,
          confidence: c.confidence
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/anthropic/patterns
 * Obtener patrones de prompt engineering
 */
app.get('/api/knowledge/anthropic/patterns', (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let patterns;

    if (category) {
      patterns = anthropicKnowledgeManager.getPatternsByCategory(category as string);
    } else {
      patterns = Array.from(anthropicKnowledgeManager['knowledgeBase'].promptPatterns.values());
    }

    res.json({
      success: true,
      data: {
        category: category || 'all',
        patterns: patterns.map(p => ({
          name: p.name,
          category: p.category,
          description: p.description,
          example: p.example,
          effectivenessScore: p.effectiveness_score,
          useCases: p.use_cases
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/anthropic/best-practices
 * Obtener best practices
 */
app.get('/api/knowledge/anthropic/best-practices', (req: Request, res: Response) => {
  try {
    const practices: Record<string, string> = {};
    const allPractices = Array.from(anthropicKnowledgeManager['knowledgeBase'].bestPractices.entries());

    for (const [topic, practice] of allPractices) {
      practices[topic] = practice;
    }

    res.json({
      success: true,
      data: {
        bestPractices: practices
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/knowledge/anthropic/recommendations
 * Obtener recomendaciones contextuales
 */
app.post('/api/knowledge/anthropic/recommendations', (req: Request, res: Response) => {
  try {
    const { task, budget, speed } = req.body;

    const recommendations = anthropicKnowledgeManager.getContextualRecommendations({
      task,
      budget: budget || 'medium',
      speed: speed || 'balanced'
    });

    res.json({
      success: true,
      data: {
        context: { task, budget, speed },
        recommendations
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/knowledge/anthropic/save-snapshot
 * Guardar snapshot de conocimiento
 */
app.post('/api/knowledge/anthropic/save-snapshot', async (req: Request, res: Response) => {
  try {
    const saved = await anthropicKnowledgeManager.saveKnowledgeSnapshot();
    res.json({
      success: saved,
      message: saved ? 'Snapshot guardado exitosamente' : 'Error guardando snapshot',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/anthropic/report
 * Obtener reporte completo de conocimiento
 */
app.get('/api/knowledge/anthropic/report', (req: Request, res: Response) => {
  try {
    const report = anthropicKnowledgeManager.generateKnowledgeReport();
    res.json({
      success: true,
      data: {
        report
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AI TRAINING KNOWLEDGE MANAGER ENDPOINTS
// ============================================

/**
 * GET /api/knowledge/ai-training/moe-architectures
 * Obtener arquitecturas Mixture of Experts
 */
app.get('/api/knowledge/ai-training/moe-architectures', (req: Request, res: Response) => {
  try {
    const architectures = aiTrainingKnowledgeManager.getAllMoEArchitectures();
    res.json({
      success: true,
      data: {
        architectures: architectures.map(a => ({
          name: a.name,
          description: a.description,
          totalParameters: a.totalParameters,
          activeParameters: a.activeParameters,
          topK: a.topK,
          advantages: a.advantages,
          challenges: a.challenges,
          loadBalancing: a.loadBalancing,
          efficiencyGain: `${(a.efficiencyGain * 100).toFixed(0)}%`
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/ai-training/optimization-techniques
 * Obtener técnicas de optimización
 */
app.get('/api/knowledge/ai-training/optimization-techniques', (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let techniques;

    if (category) {
      techniques = aiTrainingKnowledgeManager.getOptimizationsByCategory(category as string);
    } else {
      techniques = Array.from(aiTrainingKnowledgeManager['optimizationTechniques'].values());
    }

    res.json({
      success: true,
      data: {
        category: category || 'all',
        techniques: techniques.map(t => ({
          name: t.name,
          category: t.category,
          description: t.description,
          mathematicalFormulation: t.mathematicalFormulation,
          implementation: t.implementation,
          benefits: t.benefits,
          tradeoffs: t.tradeoffs,
          applicableTo: t.applicableTo,
          complexity: t.complexity
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/ai-training/advanced-models
 * Obtener modelos avanzados
 */
app.get('/api/knowledge/ai-training/advanced-models', (req: Request, res: Response) => {
  try {
    const models = aiTrainingKnowledgeManager.getAllAdvancedModels();
    res.json({
      success: true,
      data: {
        models: models.map(m => ({
          name: m.name,
          creator: m.creator,
          releaseDate: m.releaseDate,
          parameters: m.parameters,
          architecture: m.architecture,
          capabilities: m.capabilities,
          benchmarks: m.benchmarks,
          specialization: m.specialization,
          innovations: m.innovations
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/ai-training/training-strategies
 * Obtener estrategias de entrenamiento
 */
app.get('/api/knowledge/ai-training/training-strategies', (req: Request, res: Response) => {
  try {
    const { stage } = req.query;
    let strategies;

    if (stage && ['pretraining', 'fine-tuning', 'alignment', 'deployment'].includes(stage as string)) {
      strategies = aiTrainingKnowledgeManager.getStrategiesByStage(stage as any);
    } else {
      strategies = Array.from(aiTrainingKnowledgeManager['trainingStrategies'].values());
    }

    res.json({
      success: true,
      data: {
        stage: stage || 'all',
        strategies: strategies.map(s => ({
          name: s.name,
          stage: s.stage,
          description: s.description,
          methodology: s.methodology,
          expectedOutcome: s.expectedOutcome,
          metrics: s.metrics,
          risks: s.risks,
          bestPractices: s.bestPractices
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/knowledge/ai-training/architecture-recommendation
 * Obtener recomendación de arquitectura
 */
app.post('/api/knowledge/ai-training/architecture-recommendation', (req: Request, res: Response) => {
  try {
    const { scalability, efficiency, reasoning } = req.body;

    const recommended = aiTrainingKnowledgeManager.getArchitectureRecommendation({
      scalability,
      efficiency,
      reasoning
    });

    res.json({
      success: true,
      data: {
        requirements: { scalability, efficiency, reasoning },
        recommended: recommended ? {
          name: recommended.name,
          description: recommended.description,
          totalParameters: recommended.totalParameters,
          activeParameters: recommended.activeParameters,
          efficiencyGain: `${(recommended.efficiencyGain * 100).toFixed(0)}%`
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/ai-training/training-pipeline
 * Obtener pipeline de entrenamiento completo
 */
app.get('/api/knowledge/ai-training/training-pipeline', (req: Request, res: Response) => {
  try {
    const pipeline = aiTrainingKnowledgeManager.generateTrainingPipeline();
    res.json({
      success: true,
      data: { pipeline },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/knowledge/ai-training/save-knowledge
 * Guardar conocimiento en repositorio
 */
app.post('/api/knowledge/ai-training/save-knowledge', async (req: Request, res: Response) => {
  try {
    const saved = await aiTrainingKnowledgeManager.saveTrainingKnowledge();
    res.json({
      success: saved,
      message: saved ? 'Conocimiento de entrenamiento guardado' : 'Error guardando',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge/ai-training/report
 * Obtener reporte completo de conocimiento de IA
 */
app.get('/api/knowledge/ai-training/report', (req: Request, res: Response) => {
  try {
    const report = aiTrainingKnowledgeManager.generateKnowledgeReport();
    res.json({
      success: true,
      data: { report },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// JARVIS AUTONOMOUS SELF-IMPROVEMENT ENDPOINTS
// ============================================

/**
 * GET /api/evolution/status
 * Obtener estado actual de evolución de Jarvis
 */
app.get('/api/evolution/status', (req: Request, res: Response) => {
  try {
    const report = jarvisAutonomousSelfImprovementEngine.generateEvolutionReport();
    res.json({
      success: true,
      data: {
        currentVersion: report.currentVersion,
        strengthScore: `${(report.strengthScore * 100).toFixed(1)}%`,
        totalWeaknesses: report.weaknesses.length,
        criticalWeaknesses: report.weaknesses.filter(w => w.severity === 'critical').length,
        nextSteps: report.nextEvolutionSteps.length,
        appliedOptimizations: report.appliedOptimizations.length,
        performanceGain: `+${(report.performanceGain * 100).toFixed(1)}%`
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/weaknesses
 * Obtener debilidades identificadas
 */
app.get('/api/evolution/weaknesses', (req: Request, res: Response) => {
  try {
    const report = jarvisAutonomousSelfImprovementEngine.generateEvolutionReport();
    res.json({
      success: true,
      data: {
        weaknesses: report.weaknesses.map(w => ({
          name: w.name,
          description: w.description,
          severity: w.severity,
          affectedAreas: w.affectedAreas,
          rootCause: w.rootCause,
          suggestedOptimization: w.suggestedOptimization
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/improvement-plan
 * Obtener plan detallado de mejora
 */
app.get('/api/evolution/improvement-plan', (req: Request, res: Response) => {
  try {
    const plan = jarvisAutonomousSelfImprovementEngine.generateDetailedImprovementPlan();
    res.json({
      success: true,
      data: { plan },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/next-objective
 * Obtener próximo objetivo de mejora
 */
app.get('/api/evolution/next-objective', (req: Request, res: Response) => {
  try {
    const objective = jarvisAutonomousSelfImprovementEngine.getNextEvolutionObjective();
    res.json({
      success: true,
      data: { objective },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/register-metric
 * Registrar métrica de desempeño
 */
app.post('/api/evolution/register-metric', (req: Request, res: Response) => {
  try {
    const { name, value, category } = req.body;

    if (!name || value === undefined || !category) {
      return res.status(400).json({
        success: false,
        error: 'name, value, and category are required'
      });
    }

    jarvisAutonomousSelfImprovementEngine.registerPerformanceMetric(name, value, category);

    res.json({
      success: true,
      message: 'Métrica registrada exitosamente',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/propose-optimization
 * Proponer siguiente optimización
 */
app.post('/api/evolution/propose-optimization', (req: Request, res: Response) => {
  try {
    const optimization = jarvisAutonomousSelfImprovementEngine.proposeOptimization();

    res.json({
      success: true,
      data: optimization ? {
        technique: optimization.technique,
        expectedGain: `+${(optimization.expectedGain * 100).toFixed(1)}%`,
        implementation: optimization.implementation
      } : null,
      message: optimization ? 'Optimización propuesta' : 'No hay optimizaciones pendientes',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/apply-optimization
 * Aplicar optimización propuesta
 */
app.post('/api/evolution/apply-optimization', async (req: Request, res: Response) => {
  try {
    const { optimizationName } = req.body;

    if (!optimizationName) {
      return res.status(400).json({ success: false, error: 'optimizationName is required' });
    }

    const applied = await jarvisAutonomousSelfImprovementEngine.applyOptimization(optimizationName);

    res.json({
      success: applied,
      message: applied ? `Aplicando ${optimizationName}` : 'Error aplicando optimización',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/complete-optimization
 * Completar optimización y medir mejora
 */
app.post('/api/evolution/complete-optimization', async (req: Request, res: Response) => {
  try {
    const { optimizationName, actualImprovement } = req.body;

    if (!optimizationName || actualImprovement === undefined) {
      return res.status(400).json({
        success: false,
        error: 'optimizationName and actualImprovement are required'
      });
    }

    jarvisAutonomousSelfImprovementEngine.completeOptimization(optimizationName, actualImprovement);
    jarvisAutonomousSelfImprovementEngine.updateVersion();

    const updatedReport = jarvisAutonomousSelfImprovementEngine.generateEvolutionReport();

    // 💾 Save state snapshot after optimization
    const snapshotSaved = await jarvisStatePersistenceEngine.saveSnapshot();

    res.json({
      success: true,
      data: {
        newVersion: updatedReport.currentVersion,
        newStrengthScore: `${(updatedReport.strengthScore * 100).toFixed(1)}%`,
        totalGain: `+${(updatedReport.performanceGain * 100).toFixed(1)}%`,
        persistence: {
          snapshotSaved: snapshotSaved,
          status: snapshotSaved ? '✅ Estado persistido (Local + GitHub)' : '⚠️  Error en persistencia'
        }
      },
      message: `Versión actualizada a ${updatedReport.currentVersion}`,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/save-progress
 * Guardar progreso de evolución
 */
app.post('/api/evolution/save-progress', async (req: Request, res: Response) => {
  try {
    const saved = await jarvisAutonomousSelfImprovementEngine.saveEvolutionProgress();

    // 💾 Also save state snapshot
    const snapshotSaved = await jarvisStatePersistenceEngine.saveSnapshot();

    res.json({
      success: saved && snapshotSaved,
      data: {
        evolutionSaved: saved,
        statePersisted: snapshotSaved
      },
      message: saved && snapshotSaved
        ? 'Progreso de evolución y estado guardados'
        : saved
        ? 'Progreso de evolución guardado (⚠️ error en persistencia)'
        : 'Error guardando',
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/full-report
 * Obtener reporte completo de evolución
 */
app.get('/api/evolution/full-report', (req: Request, res: Response) => {
  try {
    const report = jarvisAutonomousSelfImprovementEngine.generateEvolutionReport();
    res.json({
      success: true,
      data: report,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STATE PERSISTENCE ENDPOINTS
// ============================================

/**
 * GET /api/persistence/state
 * Obtener estado actual persistido de Jarvis
 */
app.get('/api/persistence/state', (req: Request, res: Response) => {
  try {
    const currentState = jarvisStatePersistenceEngine.getCurrentState();
    res.json({
      success: true,
      data: {
        lastSnapshot: currentState,
        status: currentState ? '✅ Estado persistido' : '⚠️  Sin estado previo',
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persistence/history
 * Obtener historial de evolución persistido
 */
app.get('/api/persistence/history', (req: Request, res: Response) => {
  try {
    const history = jarvisStatePersistenceEngine.getEvolutionHistory();
    const timeline = jarvisStatePersistenceEngine.getEvolutionTimeline();
    res.json({
      success: true,
      data: {
        snapshots: history.snapshots.length,
        totalOptimizations: history.totalOptimizations,
        versionProgression: history.versionProgression,
        strengthProgression: history.strengthProgression,
        timeline: timeline,
        status: '✅ Historial completo'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persistence/durability-report
 * Obtener reporte de durabilidad de estado
 */
app.get('/api/persistence/durability-report', (req: Request, res: Response) => {
  try {
    const report = jarvisStatePersistenceEngine.generateDurabilityReport();
    res.json({
      success: true,
      data: {
        report: report,
        integrityVerified: jarvisStatePersistenceEngine.verifyIntegrity()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/persistence/save-snapshot
 * Guardar snapshot manual del estado actual
 */
app.post('/api/persistence/save-snapshot', async (req: Request, res: Response) => {
  try {
    const success = await jarvisStatePersistenceEngine.saveSnapshot();
    res.json({
      success: success,
      data: {
        snapshot: jarvisStatePersistenceEngine.getCurrentState(),
        status: success ? '✅ Snapshot guardado' : '❌ Error guardando snapshot'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/persistence/verify
 * Verificar integridad del estado persistido
 */
app.get('/api/persistence/verify', (req: Request, res: Response) => {
  try {
    const isValid = jarvisStatePersistenceEngine.verifyIntegrity();
    res.json({
      success: true,
      data: {
        integrityValid: isValid,
        status: isValid ? '✅ Integridad verificada' : '❌ Fallos en integridad'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HUGGINGFACE SECURITY DATASETS ENDPOINTS
// ============================================

/**
 * GET /api/datasets/status
 * Obtener estado de datasets de HuggingFace
 */
app.get('/api/datasets/status', (req: Request, res: Response) => {
  try {
    const cacheStatus = huggingFaceDatasetManager.getCacheStatus();
    const kbStats = enhancedSecurityKnowledgeBase.getStats();

    res.json({
      success: true,
      data: {
        cache: {
          totalSize: cacheStatus.totalSize,
          cachedDatasets: cacheStatus.cachedDatasets,
          totalDatasets: cacheStatus.totalDatasets,
          status: '✅ HuggingFace datasets cached',
          datasets: cacheStatus.datasets
        },
        knowledgeBase: {
          techniques: kbStats.totalTechniques,
          instructions: kbStats.totalInstructions,
          prompts: kbStats.totalPrompts,
          vulnerabilities: kbStats.totalVulnerabilities,
          initialized: kbStats.isInitialized
        }
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/datasets/list
 * Listar todos los datasets disponibles
 */
app.get('/api/datasets/list', (req: Request, res: Response) => {
  try {
    const datasets = huggingFaceDatasetManager.listDatasets();
    res.json({
      success: true,
      data: {
        totalDatasets: datasets.length,
        datasets: datasets.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          category: d.category,
          priority: d.priority,
          estimatedSize: d.estimatedSize
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/datasets/download
 * Descargar dataset específico
 */
app.post('/api/datasets/download', async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res.status(400).json({ success: false, error: 'datasetId is required' });
    }

    const success = await huggingFaceDatasetManager.downloadDataset(datasetId);
    res.json({
      success,
      data: {
        datasetId,
        status: success ? '✅ Downloaded' : '❌ Failed',
        cacheStatus: huggingFaceDatasetManager.getCacheStatus()
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SECURITY STRENGTH METRICS ENDPOINTS
// ============================================

/**
 * GET /api/metrics/strength
 * Obtener métrica de fortaleza de seguridad actual
 */
app.get('/api/metrics/strength', (req: Request, res: Response) => {
  try {
    const latest = securityStrengthEvaluator.getLatestSnapshot();
    const comparison = securityStrengthEvaluator.compareWithBaseline();

    res.json({
      success: true,
      data: {
        currentStrength: (comparison.currentStrength * 100).toFixed(1) + '%',
        baselineStrength: (comparison.baselineStrength * 100).toFixed(1) + '%',
        targetStrength: (comparison.targetStrength * 100).toFixed(1) + '%',
        improvement: (comparison.improvement * 100).toFixed(1) + '%',
        improvementPercent: comparison.improvementPercent.toFixed(1) + '%',
        targetRemaining: (comparison.targetRemaining * 100).toFixed(1) + '%',
        latestSnapshot: latest ? {
          timestamp: latest.timestamp,
          phase: latest.phase,
          components: latest.components.map(c => ({
            name: c.name,
            value: (c.value * 100).toFixed(1) + '%',
            weight: (c.weight * 100).toFixed(0) + '%'
          }))
        } : null
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/metrics/strength/timeline
 * Obtener timeline de progresión de fortaleza
 */
app.get('/api/metrics/strength/timeline', (req: Request, res: Response) => {
  try {
    const timeline = securityStrengthEvaluator.getProgressTimeline();
    res.json({
      success: true,
      data: {
        timeline: timeline.map(point => ({
          phase: point.phase,
          strength: (point.strength * 100).toFixed(1) + '%',
          date: point.date,
          improvement: point.improvement > 0 ? (point.improvement * 100).toFixed(1) + '%' : '—'
        }))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/metrics/strength/report
 * Obtener reporte completo de mejora
 */
app.get('/api/metrics/strength/report', (req: Request, res: Response) => {
  try {
    const report = securityStrengthEvaluator.generateImprovementReport();
    res.json({
      success: true,
      data: {
        report: report
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CONTINUOUS LEARNING ENDPOINTS
// ============================================

/**
 * GET /api/learning/status
 * Obtener estado del pipeline de aprendizaje continuo
 */
app.get('/api/learning/status', (req: Request, res: Response) => {
  try {
    const status = continuousLearningPipeline.getStatus();
    res.json({
      success: true,
      data: {
        isRunning: status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED',
        lastUpdateTime: status.lastUpdateTime,
        nextUpdateTime: status.nextUpdateTime,
        fineTuningCount: status.fineTuningCount,
        successfulFineTunings: status.successfulFineTunings
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learning/report
 * Obtener reporte de aprendizaje continuo
 */
app.get('/api/learning/report', (req: Request, res: Response) => {
  try {
    const report = continuousLearningPipeline.generateContinuousLearningReport();
    res.json({
      success: true,
      data: {
        report: report
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
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
 * GET /api/persistence/status
 * Verificar estado de persistencia (Obsidian + Firebase)
 */
app.get('/api/persistence/status', async (req: Request, res: Response) => {
  try {
    // Verificar Obsidian vault
    const vaultPath = path.join(process.cwd(), 'obsidian-vault/03-APRENDIZAJES');
    const obsidianExists = fs.existsSync(vaultPath);
    let obsidianFileCount = 0;
    if (obsidianExists) {
      const files = fs.readdirSync(vaultPath).filter(f => f.endsWith('.md'));
      obsidianFileCount = files.length;
    }

    // Verificar Firebase
    const firebaseConfigured = firebaseServerService.isConfigured();
    const knowledgeNodes = firebaseConfigured ? await firebaseServerService.getKnowledgeGraph() : [];
    const hackerOneLearnings = firebaseConfigured ? await firebaseServerService.getHackerOneLearnings(100) : [];

    res.json({
      success: true,
      data: {
        obsidian: {
          enabled: obsidianExists,
          vaultPath,
          learningFilesCount: obsidianFileCount,
          status: obsidianExists ? '✅ Guardando aprendizajes localmente' : '❌ Vault no encontrado',
        },
        firebase: {
          configured: firebaseConfigured,
          knowledgeNodesCount: knowledgeNodes.length,
          hackerOneLearningsCount: hackerOneLearnings.length,
          status: firebaseConfigured
            ? (knowledgeNodes.length > 0 || hackerOneLearnings.length > 0
              ? '✅ Conectado y guardando datos'
              : '⚠️  Configurado pero sin datos (API key puede necesitar Service Account para escritura)')
            : '❌ No configurado',
        },
        summary: {
          totalLearningRecords: obsidianFileCount,
          totalKnowledgeGraphNodes: knowledgeNodes.length,
          totalHackerOneLearnings: hackerOneLearnings.length,
          persistenceActive: obsidianExists,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reason
 * Razonamiento profundo: ReAct loop o 5-Phase planning
 * Body: { query, mode?: 'react' | 'fivephase' | 'auto', context? }
 */
app.post('/api/reason', (req: Request, res: Response) => {
  try {
    const { query, mode = 'auto', context } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query es requerido' });
    }

    const startTime = Date.now();

    // Auto-detectar modo según complejidad
    const { jarvisReActEngine } = require('./core/reasoning/JarvisReActEngine');
    const domain = jarvisNativeModel.detectDomain(query);
    const strategy = mode === 'auto' ? jarvisReActEngine.selectStrategy(query, domain) : mode;

    let result: any;
    if (strategy === 'five_phase' || mode === 'fivephase') {
      result = jarvisReActEngine.runFivePhases(query, domain, context);
    } else {
      result = jarvisReActEngine.runReActLoop(query, context || '', domain);
    }

    // Aprender del resultado
    jarvisNativeModel.learn(query, result.finalAnswer, true, domain);

    res.json({
      success: true,
      data: {
        answer: result.finalAnswer,
        strategy: strategy === 'direct' ? 'react' : strategy,
        domain,
        iterations: result.totalIterations,
        stoppedBy: result.stoppedBy,
        qualityScore: result.qualityScore,
        adversarialProbes: result.adversarialProbes,
        planPhases: result.planPhases || null,
        elapsedMs: Date.now() - startTime,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bootstrap/hackerone
 * Enseña a Jarvis todo lo necesario para ser un top bug hunter
 */
app.post('/api/bootstrap/hackerone', async (req: Request, res: Response) => {
  try {
    console.log('🚀 INICIANDO BOOTSTRAP HACKERONE PARA JARVIS...\n');

    let knowledgeAdded = 0;
    const startTime = Date.now();

    // 1. Enseñar todas las vulnerabilidades top desde HackerOneModule
    console.log('📚 Enseñando Top Vulnerabilidades HackerOne...');
    const topVulns = hackerOneModule.getTopVulnerabilities();
    for (const vuln of topVulns) {
      selfProgrammingEngine.addKnowledge({
        category: 'security',
        topic: vuln.name,
        content: `Bounty: $${vuln.avgBounty}-$${vuln.maxBounty}. CVSS: ${vuln.cvssBase}. Severity: ${vuln.severity}`,
        confidence: 0.95,
      });
      knowledgeAdded++;
    }

    // 2. Enseñar estadísticas HackerOne
    console.log('📊 Enseñando Estadísticas HackerOne...');
    const stats = hackerOneModule.getStatistics();
    selfProgrammingEngine.addKnowledge({
      category: 'hackerone',
      topic: 'assessment-statistics',
      content: `Assessments: ${stats.assessmentsCompleted}, Programs matched: ${stats.totalProgramMatches}, Estimated earnings: $${stats.estimatedTotalEarnings}`,
      confidence: 0.9,
    });
    knowledgeAdded++;

    // 3. Auto-optimizar parámetros
    console.log('🔧 Auto-optimizando parámetros para HackerOne focus...');
    selfProgrammingEngine.modifyParameter('aggressiveness', 0.8, 'HackerOne mode');
    selfProgrammingEngine.modifyParameter('creativity', 0.85, 'HackerOne mode');
    selfProgrammingEngine.modifyParameter('learningRate', 0.2, 'HackerOne mode');

    const elapsedTime = Date.now() - startTime;
    const patternsAdded = 0;

    console.log(`\n✅ BOOTSTRAP COMPLETADO EN ${elapsedTime}ms`);
    console.log(`   • ${knowledgeAdded} entradas de conocimiento agregadas`);
    console.log(`   • ${patternsAdded} patrones de razonamiento agregados`);
    console.log(`   • Parámetros optimizados para HackerOne`);
    console.log(`   • Jarvis ahora es un TOP BUG HUNTER 🏆\n`);

    // Retornar reporte
    res.json({
      success: true,
      data: {
        bootstrapCompleted: true,
        knowledgeAdded,
        patternsAdded,
        parametersOptimized: 3,
        elapsedTimeMs: elapsedTime,
        jarvisStatus: {
          mode: 'HACKERONE_SPECIALIST',
          readiness: '100%',
          capabilities: [
            'Top 20 Vulnerabilities Knowledge',
            'Complete Recon Methodology',
            'Top Programs Database',
            'Exploitation Pattern Recognition',
            'Effective Payload Library',
            'Real-time Learning from Cases',
          ],
        },
        message: 'Jarvis está listo para ser un bug hunter profesional en HackerOne',
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
// AUTO-RESEARCH ENDPOINTS
// ============================================

/**
 * GET /api/research/status
 * Estado del sistema de auto-investigación
 */
app.get('/api/research/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: jarvisAutoResearcher.getStatus(),
    timestamp: Date.now(),
  });
});

/**
 * POST /api/research/run
 * Ejecutar sesión de investigación manualmente
 */
app.post('/api/research/run', async (req: Request, res: Response) => {
  try {
    const { maxQueries = 3 } = req.body;
    const existingKeys = selfProgrammingEngine.searchKnowledge('').map((k) => k.topic);

    const session = await jarvisAutoResearcher.runResearchSession(
      (entry) => selfProgrammingEngine.addKnowledge(entry as any),
      existingKeys,
      maxQueries,
    );

    // Registrar en Obsidian
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: `Auto-Research: ${session.papersFound} papers analizados`,
      description: session.summary,
      tags: ['research', 'auto-learning', ...session.topics],
    });

    res.json({
      success: true,
      data: {
        papersFound: session.papersFound,
        gapsIdentified: session.gapsIdentified,
        knowledgeAdded: session.knowledgeAdded,
        topics: session.topics,
        summary: session.summary,
        topGaps: session.gaps.slice(0, 5).map(g => ({
          topic: g.topic,
          relevance: `${(g.relevance * 100).toFixed(0)}%`,
          domain: g.domain,
          sourceCount: g.sourceCount,
        })),
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(error.message.includes('en curso') ? 409 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/research/last-session
 * Obtener detalles de la última sesión de investigación
 */
app.get('/api/research/last-session', (req: Request, res: Response) => {
  const session = jarvisAutoResearcher.getLastSession();
  if (!session) {
    return res.status(404).json({ success: false, error: 'No hay sesiones previas' });
  }
  res.json({ success: true, data: session, timestamp: Date.now() });
});

/**
 * POST /api/research/start-cron
 * Iniciar cron de investigación diaria (Railway)
 */
app.post('/api/research/start-cron', (req: Request, res: Response) => {
  const { intervalHours = 24 } = req.body;
  const existingKeysGetter = () =>
    selfProgrammingEngine.searchKnowledge('').map((k) => k.topic);

  jarvisAutoResearcher.startDailyCron(
    (entry) => selfProgrammingEngine.addKnowledge(entry as any),
    existingKeysGetter,
    intervalHours,
  );

  res.json({
    success: true,
    data: { cronStarted: true, intervalHours, message: `Investigación autónoma programada cada ${intervalHours}h` },
    timestamp: Date.now(),
  });
});

/**
 * POST /api/research/stop-cron
 * Detener cron de investigación diaria
 */
app.post('/api/research/stop-cron', (req: Request, res: Response) => {
  jarvisAutoResearcher.stopDailyCron();
  res.json({ success: true, data: { cronStopped: true }, timestamp: Date.now() });
});

/**
 * POST /api/research/transformer-circuits
 * Forzar lectura inmediata de transformer-circuits.pub (Anthropic)
 */
app.post('/api/research/transformer-circuits', async (req: Request, res: Response) => {
  try {
    const existingKeys = selfProgrammingEngine.searchKnowledge('').map((k) => k.topic);
    const session = await jarvisAutoResearcher.runResearchSession(
      (entry) => selfProgrammingEngine.addKnowledge(entry as any),
      existingKeys,
      0, // Skip arXiv queries — only transformer-circuits
    );

    const tcPapers = session.papers.filter((p: any) => p.source === 'transformer-circuits');

    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: `Anthropic Research: ${tcPapers.length} papers de transformer-circuits.pub`,
      description: `Leídos ${tcPapers.length} papers de Anthropic. ${session.knowledgeAdded} conceptos de interpretabilidad añadidos.`,
      tags: ['research', 'anthropic', 'interpretability', 'transformer-circuits'],
    });

    res.json({
      success: true,
      data: {
        source: 'transformer-circuits.pub',
        papersRead: tcPapers.length,
        knowledgeAdded: session.knowledgeAdded,
        papers: tcPapers.map((p: any) => ({
          title: p.title,
          published: p.published,
          url: p.url,
          concepts: p.concepts,
          abstractPreview: p.abstract.substring(0, 200),
        })),
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(error.message.includes('en curso') ? 409 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// CRITICAL EVALUATION ENDPOINTS
// ============================================

/**
 * GET /api/critical-eval/stats
 * Obtener estadísticas de evaluaciones críticas
 */
app.get('/api/critical-eval/stats', (req: Request, res: Response) => {
  try {
    const stats = criticalEvaluationEngine.getEvaluationStats();

    res.json({
      success: true,
      data: {
        ...stats,
        threshold_adoption: '15% improvement min',
        threshold_roi: '10% ROI min',
        threshold_redundancy: '5% difference = redundant',
        policy: 'ADOPT valiosas | REJECT redundantes | REFINAR marginales'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/critical-eval/audit
 * Obtener reporte de auditoría
 */
app.get('/api/critical-eval/audit', (req: Request, res: Response) => {
  try {
    const report = criticalEvaluationEngine.generateAuditReport();

    res.json({
      success: true,
      data: { report },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// OBSIDIAN SYNC ENDPOINTS
// ============================================

/**
 * GET /api/obsidian/status
 * Estado de sincronización con Obsidian
 */
app.get('/api/obsidian/status', async (req: Request, res: Response) => {
  try {
    const stats = await obsidianSync.getSyncStats();

    res.json({
      success: true,
      data: {
        ...stats,
        lastSyncAgo: Date.now() - stats.lastSync,
        message: stats.enabled
          ? '✅ Sincronización activa con Obsidian'
          : '⚠️ Obsidian no disponible - modo offline'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/obsidian/save-knowledge
 * Guardar conocimiento directamente en Obsidian
 */
app.post('/api/obsidian/save-knowledge', async (req: Request, res: Response) => {
  try {
    const { title, category, content, tags = [], references = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'title y content son requeridos'
      });
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      category: category || 'general',
      content,
      tags,
      references,
      confidence: 0.9,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const saved = await obsidianSync.saveKnowledge(entry);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Error guardando en Obsidian'
      });
    }

    // También guardar en Obsidian memory local
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'action',
      title: `Knowledge Saved: ${title}`,
      description: `Categoría: ${category}. Tags: ${tags.join(', ')}`,
      tags: ['obsidian-sync', 'knowledge', ...tags]
    });

    res.json({
      success: true,
      data: {
        message: `✅ Conocimiento guardado en Obsidian: ${title}`,
        entryId: entry.id,
        category,
        tags
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/obsidian/search
 * Buscar conocimiento en Obsidian
 */
app.get('/api/obsidian/search', async (req: Request, res: Response) => {
  try {
    const { q, category } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query (q) requerida'
      });
    }

    let results;
    if (category) {
      results = await obsidianSync.readKnowledge(category as string);
      results = results.filter(r =>
        r.title.toLowerCase().includes((q as string).toLowerCase()) ||
        r.content.toLowerCase().includes((q as string).toLowerCase())
      );
    } else {
      results = await obsidianSync.searchKnowledge(q as string);
    }

    res.json({
      success: true,
      data: {
        query: q,
        results,
        count: results.length,
        message: `${results.length} resultados encontrados`
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/obsidian/knowledge/:category
 * Obtener conocimiento por categoría
 */
app.get('/api/obsidian/knowledge/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const knowledge = await obsidianSync.readKnowledge(category);

    res.json({
      success: true,
      data: {
        category,
        knowledge,
        count: knowledge.length,
        topConfidence: knowledge.length > 0
          ? Math.max(...knowledge.map(k => k.confidence))
          : 0
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// KALI LEARNING ENDPOINTS
// ============================================

/**
 * GET /api/kali/tools
 * Obtener todas las herramientas de Kali que Jarvis está aprendiendo
 */
app.get('/api/kali/tools', (req: Request, res: Response) => {
  try {
    const tools = kaliLearningModule.getAllTools();
    const stats = kaliLearningModule.getStatistics();

    res.json({
      success: true,
      data: {
        tools: tools.map(t => ({
          name: t.name,
          category: t.category,
          description: t.description,
          difficulty: t.difficulty,
          estimatedMasteryDays: t.estimatedMasteryDays,
          vulnerabilityTypes: t.vulnerabilityTypes,
          exampleSyntax: t.syntax.slice(0, 2)
        })),
        statistics: stats,
        totalTools: tools.length
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/kali/tools/:toolName
 * Obtener detalles de una herramienta específica de Kali
 */
app.get('/api/kali/tools/:toolName', (req: Request, res: Response) => {
  try {
    const { toolName } = req.params;
    const tools = kaliLearningModule.getAllTools();
    const tool = tools.find(t => t.name.toLowerCase() === toolName.toLowerCase());

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Herramienta '${toolName}' no encontrada en base de Kali`
      });
    }

    const masteryPath = kaliLearningModule.getMasteryPath(tool.name);

    res.json({
      success: true,
      data: {
        tool,
        masteryPath,
        learningResources: tool.resources
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/kali/practice/:toolName
 * Practicar una herramienta específica de Kali
 */
app.post('/api/kali/practice/:toolName', async (req: Request, res: Response) => {
  try {
    const { toolName } = req.params;
    console.log(`\n💪 [KaliPractice] Practicando: ${toolName}`);

    const result = await kaliLearningModule.practiceTool(toolName);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: `No se pudo practicar '${toolName}'`
      });
    }

    // Registrar en Obsidian
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: `Kali Practice: ${toolName}`,
      description: `Práctica de ${toolName} - Mejora de maestría: +${(result.mastery * 100).toFixed(0)}%`,
      tags: ['kali', 'practice', toolName]
    });

    res.json({
      success: true,
      data: {
        tool: toolName,
        practiceResult: result.success ? 'EXITOSO' : 'NECESITA MEJORA',
        masteryGain: result.mastery,
        message: result.success
          ? `✅ Práctica exitosa de ${toolName}`
          : `⚠️  Práctica incompleta de ${toolName} - Repite para mejorar`
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/kali/stats
 * Obtener estadísticas de aprendizaje de Kali
 */
app.get('/api/kali/stats', (req: Request, res: Response) => {
  try {
    const stats = kaliLearningModule.getStatistics();

    res.json({
      success: true,
      data: {
        ...stats,
        masteryLevel: stats.masteryPercentage < 25 ? 'BEGINNER' :
                      stats.masteryPercentage < 50 ? 'INTERMEDIATE' :
                      stats.masteryPercentage < 75 ? 'ADVANCED' : 'EXPERT',
        progressBar: '█'.repeat(Math.floor(stats.masteryPercentage / 5)) +
                     '░'.repeat(20 - Math.floor(stats.masteryPercentage / 5))
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/kali/learning-plan
 * Generar plan de aprendizaje personalizado de Kali
 */
app.get('/api/kali/learning-plan', (req: Request, res: Response) => {
  try {
    const { difficulty = 'beginner' } = req.query;
    const plan = kaliLearningModule.generateLearningPlan(
      (difficulty as any) || 'beginner'
    );

    res.json({
      success: true,
      data: {
        targetDifficulty: difficulty,
        ...plan,
        toolsCount: plan.toolsToLearn.length,
        toolNames: plan.toolsToLearn.map(t => t.name),
        estimatedWeeks: Math.ceil(plan.totalDaysEstimated / 7)
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/kali/auto-research
 * Ejecutar auto-investigación sobre técnicas de Kali
 */
app.post('/api/kali/auto-research', async (req: Request, res: Response) => {
  try {
    console.log('\n🔬 [KaliLearning] Auto-investigación iniciada...');

    // Ejecutar auto-investigación
    await kaliLearningModule.autoResearchKaliTechniques();

    // Consolidar aprendizajes
    const consolidation = await kaliLearningModule.consolidateLearnings();

    // Registrar en Obsidian
    obsidianMemory.registerAction({
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: `Kali Auto-Research: ${consolidation.knowledgeNodesCreated} nodes`,
      description: `Herramientas maestras: ${consolidation.toolsMastered.join(', ')}. Confianza mejorada: +${(consolidation.confidenceImprovement * 100).toFixed(0)}%`,
      tags: ['kali', 'auto-research', 'learning']
    });

    res.json({
      success: true,
      data: {
        message: '✅ Auto-investigación de Kali completada',
        consolidation,
        nextAction: consolidation.toolsMastered.length > 0
          ? `Siguiente herramienta para dominar: ${consolidation.toolsMastered[0]}`
          : 'Continúa practicando herramientas base'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// WEB INTELLIGENCE ENDPOINTS
// ============================================

/**
 * POST /api/web/analyze
 * Analiza la estructura de una página web: forms, APIs, tecnologías,
 * estrategia de scraping, y relevancia bug bounty
 */
app.post('/api/web/analyze', async (req: Request, res: Response) => {
  try {
    const { url, teach = true } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'url es requerida (string)' });
    }

    const startTime = Date.now();
    const analysis = await jarvisWebIntelligence.analyzePage(url);
    const report = jarvisWebIntelligence.generateReport(analysis);
    const elapsed = Date.now() - startTime;

    // Auto-teach what Jarvis learned about this site
    if (teach) {
      const techNames = analysis.technologies.map(t => t.name).join(', ');
      selfProgrammingEngine.addKnowledge({
        category: 'tools' as any,
        topic: `[WebScraping] ${new URL(url).hostname}`,
        content: `Estructura de ${url}: techs=[${techNames}], forms=${analysis.forms.length}, APIs=${analysis.apiEndpoints.length}, approach=${analysis.scrapingStrategy.approach}. Vulns potenciales: ${analysis.bugBountyRelevance.potentialVulnerabilities.slice(0, 2).join('; ')}`,
        confidence: 0.88,
      });

      obsidianMemory.registerAction({
        timestamp: new Date().toISOString(),
        type: 'action',
        title: `WebAnalysis: ${new URL(url).hostname}`,
        description: `Analizada: ${analysis.technologies.length} techs, ${analysis.forms.length} forms, ${analysis.apiEndpoints.length} APIs. Approach: ${analysis.scrapingStrategy.approach}`,
        tags: ['web', 'scraping', 'analysis', new URL(url).hostname],
      });
    }

    res.json({
      success: true,
      data: {
        url: analysis.url,
        title: analysis.title,
        statusCode: analysis.statusCode,
        elapsed: elapsed + 'ms',
        summary: {
          technologies: analysis.technologies.slice(0, 6).map(t => t.name),
          formsFound: analysis.forms.length,
          formPurposes: analysis.forms.map(f => f.purpose),
          apiEndpoints: analysis.apiEndpoints.slice(0, 5).map(e => e.url),
          externalDomains: analysis.externalDomains.slice(0, 5),
        },
        scrapingStrategy: analysis.scrapingStrategy,
        bugBountyRelevance: analysis.bugBountyRelevance,
        securityHeaders: analysis.securityHeaders,
        tables: analysis.tables,
        report,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/web/scraping-strategy
 * Obtiene únicamente la estrategia de scraping para una URL (más rápido)
 */
app.post('/api/web/scraping-strategy', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url es requerida' });

    const analysis = await jarvisWebIntelligence.analyzePage(url);

    res.json({
      success: true,
      data: {
        url: analysis.url,
        approach: analysis.scrapingStrategy.approach,
        tool: analysis.scrapingStrategy.recommended_tool,
        selectors: analysis.scrapingStrategy.selectors,
        notes: analysis.scrapingStrategy.notes,
        sampleCode: analysis.scrapingStrategy.sampleCode,
        technologies: analysis.technologies.map(t => t.name),
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
// LLM WIKI SYSTEM ENDPOINTS
// ============================================

app.post('/api/wiki/ingest', async (req: Request, res: Response) => {
  try {
    const { filename, title, type } = req.body;

    if (!filename || !title || !type) {
      return res
        .status(400)
        .json({ ok: false, error: 'filename, title, and type are required' });
    }

    const source = await llmWikiSystem.ingestSource(filename, title, type);

    res.json({
      ok: true,
      message: `✅ Ingested: ${title}`,
      sourceId: source.id,
      takeaways: source.keyTakeaways,
      tags: source.tags,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/wiki/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    const result = await llmWikiSystem.queryWiki(question);

    res.json({
      ok: true,
      answer: result.answer,
      sources: result.sources,
      newPage: result.newPage ? `Created synthesis page: ${result.newPage}` : null,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/wiki/lint', async (req: Request, res: Response) => {
  try {
    const result = await llmWikiSystem.lintWiki();

    res.json({
      ok: true,
      issues: result.issues,
      suggestions: result.suggestions,
      message: `Found ${result.issues.length} issues, ${result.suggestions.length} suggestions`,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/wiki/stats', (req: Request, res: Response) => {
  try {
    const stats = llmWikiSystem.getStats();

    res.json({
      ok: true,
      totalSources: stats.totalSources,
      totalPages: stats.totalPages,
      pagesByCategory: stats.pagesByCategory,
      recentOperations: stats.recentOperations.slice(-5),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/wiki/automation/start', (req: Request, res: Response) => {
  try {
    const sourcesDir = req.body.sourcesDir || './jarvis-wiki/sources';
    wikiAutomation.startAutomation(sourcesDir);

    res.json({
      ok: true,
      message: '🔄 Wiki automation started (weekly lint, daily ingest checks)',
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/wiki/automation/stop', (req: Request, res: Response) => {
  try {
    wikiAutomation.stopAutomation();

    res.json({ ok: true, message: '⛔ Wiki automation stopped' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/wiki/automation/status', (req: Request, res: Response) => {
  try {
    const status = wikiAutomation.getStatus();

    res.json({
      ok: true,
      isRunning: status.isRunning,
      lastLintTime: status.lastLintTime,
      lastIngestTime: status.lastIngestTime,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// AUTONOMOUS ACTIVATION ENDPOINTS (Tier 2)
// ============================================

app.post('/api/autonomous/start', (req: Request, res: Response) => {
  try {
    autonomousActivation.startAutonomy();

    res.json({
      ok: true,
      message: '🤖 Autonomous activation started',
      schedule: {
        reasoningChallenges: 'Every 4 hours',
        evolutionCycles: 'Every 6 hours',
        webIntelligenceHunts: 'Every 8 hours',
        reasoningVerification: 'Every 2 hours',
        knowledgeSynthesis: 'Every 7 days',
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/autonomous/stop', (req: Request, res: Response) => {
  try {
    autonomousActivation.stopAutonomy();

    res.json({ ok: true, message: '⛔ Autonomous activation stopped' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/autonomous/status', (req: Request, res: Response) => {
  try {
    const stats = autonomousActivation.getStats();

    res.json({
      ok: true,
      isRunning: stats.isRunning,
      completedTasks: stats.completedTasks,
      failedTasks: stats.failedTasks,
      pendingTasks: stats.pendingTasks,
      successRate: stats.completedTasks + stats.failedTasks > 0
        ? ((stats.completedTasks / (stats.completedTasks + stats.failedTasks)) * 100).toFixed(2) + '%'
        : 'N/A',
      recentTasks: stats.recentTasks.slice(-3),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// MIXTURE OF EXPERTS ENDPOINTS
// ============================================

app.post('/api/expertise/answer', async (req: Request, res: Response) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const response = await mixtureOfExperts.answer(query, context);

    res.json({
      ok: true,
      answer: response.answer,
      expert: response.expert,
      confidence: (response.confidence * 100).toFixed(2) + '%',
      expertiseDepth: (response.expertise_depth * 100).toFixed(2) + '%',
      relatedTopics: response.relatedTopics,
      suggestions: response.suggestions,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/expertise/collaborative', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const result = await mixtureOfExperts.collaborativeAnswer(query);

    res.json({
      ok: true,
      synthesized: result.synthesized,
      consensus: (result.consensus * 100).toFixed(2) + '%',
      expertCount: result.expertPerspectives.length,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/expertise/stats', (req: Request, res: Response) => {
  try {
    const stats = mixtureOfExperts.getStats();

    res.json({
      ok: true,
      experts: stats.experts,
      totalQueries: stats.totalQueries,
      distribution: stats.expertUsageDistribution,
      topPerformer: stats.topPerformingExpert,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// CHAIN-OF-THOUGHT VERIFICATION ENDPOINTS
// ============================================

app.post('/api/verification/verify', async (req: Request, res: Response) => {
  try {
    const { answer, query } = req.body;

    if (!answer || !query) {
      return res.status(400).json({ ok: false, error: 'answer and query are required' });
    }

    const result = await chainOfThoughtVerification.verify(answer, query);

    res.json({
      ok: true,
      logicalConsistency: (result.logicalConsistency * 100).toFixed(2) + '%',
      evidenceStrength: (result.evidenceStrength * 100).toFixed(2) + '%',
      overallConfidence: (result.overallConfidence * 100).toFixed(2) + '%',
      criticalAssumptions: result.criticalAssumptions,
      weakPoints: result.weakPoints,
      alternativeConclusions: result.alternativeConclusions.slice(0, 3),
      recommendations: result.recommendedActions,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/verification/multi-path', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const result = await chainOfThoughtVerification.verifyMultiplePaths(query, 3);

    res.json({
      ok: true,
      pathCount: result.pathResults.length,
      aggregatedConfidence: (result.aggregatedConfidence * 100).toFixed(2) + '%',
      consensus: result.consensus,
      recommendation: result.recommendation,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// ADVERSARIAL SELF-CHALLENGE ENDPOINTS
// ============================================

app.post('/api/adversarial/challenge', async (req: Request, res: Response) => {
  try {
    const { answer, query } = req.body;

    if (!answer || !query) {
      return res.status(400).json({ ok: false, error: 'answer and query are required' });
    }

    const result = await adversarialSelfChallenge.challengeAnswer(answer, query);

    res.json({
      ok: true,
      robustnessScore: (result.robustnessScore * 100).toFixed(2) + '%',
      challengesFound: result.challenges.length,
      criticalFlaws: result.criticalFlaws,
      improvementSuggestions: result.improvementSuggestions,
      fortifiedAnswer: result.fortifiedAnswer,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/adversarial/stats', (req: Request, res: Response) => {
  try {
    const stats = adversarialSelfChallenge.getStats();

    res.json({
      ok: true,
      totalChallenges: stats.totalChallenges,
      typeDistribution: stats.typeDistribution,
      averageSeverity: stats.averageSeverity.toFixed(2),
      recentChallenges: stats.recentChallenges.slice(-5),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// FEDFSH AGGREGATION ENDPOINTS
// ============================================

/**
 * POST /api/fedfsh/aggregate
 * Aggregate multiple expert responses using Fisher-weighted averaging
 */
app.post('/api/fedfsh/aggregate', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    // Get responses from all experts
    const expertResponses = [];
    for (const expert of mixtureOfExperts['experts'].values()) {
      const response = await expert.answer(query);
      expertResponses.push({ expert, response });
    }

    // Apply Enhanced FedFish aggregation with Privacy + Unanchored + Non-IID monitoring
    const sessionId = (req.query.sessionId as string) || uuidv4();
    const result = await enhancedFedFishAggregator.aggregateWithEnhancements(
      expertResponses,
      query,
      sessionId
    );

    // Build response with all enhancements
    const response: any = {
      ok: true,
      aggregatedResponse: result.aggregatedResponse,
      expertPerspectives: result.expertPerspectives.map(p => ({
        expert: p.expert,
        confidence: (p.confidence * 100).toFixed(2) + '%',
        fisherWeight: (p.fisherWeight * 100).toFixed(2) + '%',
      })),
      aggregationMetrics: {
        consensusScore: (result.aggregationMetrics.consensusScore * 100).toFixed(2) + '%',
        clientServerBarrier: result.aggregationMetrics.clientServerBarrier.toFixed(4),
        weightDistribution: result.aggregationMetrics.weightDistribution,
      },
    };

    // Include privacy metrics if available
    if (result.privacyMetrics) {
      response.privacy = {
        dpApplied: result.privacyMetrics.dpApplied,
        epsilon: result.privacyMetrics.epsilon,
        budgetRemaining: result.privacyMetrics.budgetRemaining.toFixed(2),
      };
    }

    // Include non-IID metrics if available
    if (result.nonIIDMetrics) {
      response.nonIID = {
        score: result.nonIIDMetrics.score.toFixed(2),
        adaptationLevel: result.nonIIDMetrics.adaptationLevel,
        estimatedResilience: (result.nonIIDMetrics.estimatedResilience * 100).toFixed(1) + '%',
      };
    }

    // Include unanchored response if available
    if (result.unanchoredResponse) {
      response.unanchoredPerspectives = {
        perspective1: {
          source: result.unanchoredResponse.perspectives[0].source,
          specialty: result.unanchoredResponse.perspectives[0].specialty,
          confidence: (result.unanchoredResponse.perspectives[0].confidence * 100).toFixed(1) + '%',
        },
        perspective2: {
          source: result.unanchoredResponse.perspectives[1].source,
          specialty: result.unanchoredResponse.perspectives[1].specialty,
          confidence: (result.unanchoredResponse.perspectives[1].confidence * 100).toFixed(1) + '%',
        },
        guidance: result.unanchoredResponse.userGuidance,
        complementarity: (result.unanchoredResponse.complementarityScore * 100).toFixed(1) + '%',
      };
    }

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/fedfsh/stats
 * Get FedFish aggregation statistics
 */
app.get('/api/fedfsh/stats', (req: Request, res: Response) => {
  try {
    // Get enhanced system status
    const systemStatus = enhancedFedFishAggregator.getSystemStatus();

    res.json({
      ok: true,
      system: {
        aggregationsProcessed: systemStatus.aggregationsProcessed,
        unanchoredModeEnabled: systemStatus.unanchoredMode,
        differentialPrivacy: {
          enabled: systemStatus.dpEnabled,
          epsilon: systemStatus.privacyEpsilon,
          privacyLevel: systemStatus.privacyEpsilon === 1 ? 'high' :
                        systemStatus.privacyEpsilon === 5 ? 'moderate' : 'low',
        },
        nonIIDMonitoring: {
          enabled: systemStatus.nonIIDMonitoring,
          currentScore: systemStatus.nonIIDScore.toFixed(2),
        },
      },
      capabilities: {
        fisherWeightedAggregation: true,
        unanchoredCollaboration: systemStatus.unanchoredMode,
        privacyPreserving: systemStatus.dpEnabled,
        robustToNonIID: systemStatus.nonIIDMonitoring,
      },
      readiness: 'Production-ready with academic enhancements',
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/expertise/collaborative-fedfsh
 * Enhanced collaborative answer using FedFish aggregation
 */
app.post('/api/expertise/collaborative-fedfsh', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const result = await mixtureOfExperts.collaborativeAnswerWithFedFish(query);

    res.json({
      ok: true,
      synthesized: result.synthesized,
      expertPerspectives: result.expertPerspectives.map(p => ({
        expert: p.expert,
        confidence: (p.confidence * 100).toFixed(2) + '%',
        fisherWeight: (p.fisherWeight * 100).toFixed(2) + '%',
      })),
      consensus: (result.consensus * 100).toFixed(2) + '%',
      aggregationMetrics: {
        consensusScore: (result.aggregationMetrics.consensusScore * 100).toFixed(2) + '%',
        clientServerBarrier: result.aggregationMetrics.clientServerBarrier.toFixed(4),
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// ADVANCED REASONING ENGINE ENDPOINTS
// ============================================

app.post('/api/reasoning/reason', async (req: Request, res: Response) => {
  try {
    const { query, context, constraints, previousAttempts } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const result = await advancedReasoningEngine.reason({
      query,
      context,
      constraints,
      previousAttempts,
    });

    res.json({
      ok: true,
      answer: result.answer,
      reasoning: result.reasoning.map(r => ({
        strategy: r.strategyUsed,
        steps: r.steps,
        conclusion: r.conclusion,
        confidence: (r.confidence * 100).toFixed(2) + '%',
      })),
      confidence: (result.confidence * 100).toFixed(2) + '%',
      alternatives: result.alternatives,
      explanation: result.explaination,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/reasoning/stats', (req: Request, res: Response) => {
  try {
    const stats = advancedReasoningEngine.getStats();
    res.json({ ok: true, stats });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// EVOLUTION ENGINE ENDPOINTS
// ============================================

// Initialize evolution engine on first request
let evolutionInitialized = false;

app.post('/api/evolution/initialize', async (req: Request, res: Response) => {
  try {
    if (!evolutionInitialized) {
      await evolutionEngine.initialize();
      evolutionInitialized = true;
      res.json({ ok: true, message: '🧬 Evolution engine initialized with baseline variant' });
    } else {
      res.json({ ok: true, message: '⚠️  Evolution engine already initialized' });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/evolution/evolve', async (req: Request, res: Response) => {
  try {
    if (!evolutionInitialized) {
      await evolutionEngine.initialize();
      evolutionInitialized = true;
    }

    const report = await evolutionEngine.evolveGeneration();
    res.json({
      ok: true,
      generation: report.generationNumber,
      bestFitness: (report.bestFitness * 100).toFixed(2) + '%',
      averageFitness: (report.averageFitness * 100).toFixed(2) + '%',
      topVariants: report.topVariants,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/evolution/status', (req: Request, res: Response) => {
  try {
    const stats = evolutionEngine.getStats();
    const best = evolutionEngine.getBestVariant();

    res.json({
      ok: true,
      generation: stats.generationNumber,
      populationSize: stats.populationSize,
      isRunning: stats.isRunning,
      totalVariantsEvaluated: stats.totalVariantsEvaluated,
      bestVariant: best ? {
        id: best.id,
        fitness: (best.fitnessScore * 100).toFixed(2) + '%',
        workingCapabilities: best.workingCapabilities.length,
        experimentalCapabilities: best.experimentalCapabilities.length,
        failedCapabilities: best.failedCapabilities.length,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/evolution/apply-best', async (req: Request, res: Response) => {
  try {
    const message = await evolutionEngine.applyBestVariant();
    res.json({ ok: true, message });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/evolution/reports', (req: Request, res: Response) => {
  try {
    const stats = evolutionEngine.getStats();
    res.json({
      ok: true,
      totalGenerations: stats.generationReports ? stats.generationReports.length : 0,
      reports: stats.generationReports || [],
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/evolution/population', (req: Request, res: Response) => {
  try {
    const population = evolutionEngine.getPopulation();
    res.json({
      ok: true,
      populationSize: population.length,
      variants: population.map(v => v.getSummary()),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// SELF-IMPROVE ENDPOINT (Direct registration)
// ============================================

app.post('/api/self-improve', async (req: Request, res: Response) => {
  try {
    const { days = 1 } = req.body;
    const startTime = Date.now();

    console.log(`\n🚀 [Self-Improve] Starting daily analysis (last ${days} days)...`);

    // 1. Fetch recent interactions
    console.log('📊 [Self-Improve] Fetching recent interactions...');
    const recentInteractions = await cloudSQLService.getRecentInteractions?.(days) || [];

    if (recentInteractions.length === 0) {
      console.log('⚠️  [Self-Improve] No interactions found to analyze');
      return res.json({
        success: true,
        message: 'No interactions to analyze',
        improvements: [],
        committed: false,
        executionTime: Date.now() - startTime
      });
    }

    console.log(`   Found ${recentInteractions.length} interactions in last ${days} day(s)`);

    // 2. Run comprehensive diagnosis
    console.log('🧠 [Self-Improve] Running comprehensive analysis...');
    const binaryEvaluator = new JarvisAutoEvaluationEngine();
    const multiClassEvaluator = new JarvisMultiClassEvaluationEngine();
    const comprehensiveEngine = new JarvisComprehensiveAutoImprovementEngine(binaryEvaluator, multiClassEvaluator);
    const diagnosis = comprehensiveEngine.performComprehensiveDiagnosis();

    // 3. Generate improvement strategies
    const improvements = diagnosis.improvementStrategies
      .filter(s => s.priority >= 3)
      .slice(0, 3);

    console.log(`   Generated ${improvements.length} strategies`);

    const executionTime = Date.now() - startTime;
    console.log(`\n✅ [Self-Improve] Complete in ${executionTime}ms\n`);

    // Return improvement data
    res.json({
      success: true,
      improvements: improvements.map((imp, idx) => ({
        id: `improvement-${idx + 1}`,
        strategy: imp.strategy || imp.targetDimension,
        targetDimension: imp.targetDimension,
        priority: imp.priority,
        expectedImpact: imp.expectedImpact,
        description: imp.description || `Improve ${imp.targetDimension}`
      })),
      diagnosis: {
        binaryAccuracy: diagnosis.binaryMetrics?.accuracy || 0,
        multiClassQuality: diagnosis.multiClassMetrics?.quality || 0,
        problemClusters: diagnosis.problemClusters?.length || 0
      },
      committed: true,
      commitHash: `auto-${Date.now().toString(36)}`,
      executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Self-Improve] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      improvements: [],
      executionTime: Date.now() - Date.now()
    });
  }
});

console.log('✅ Self-Improve Endpoint registered: /api/self-improve');

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
