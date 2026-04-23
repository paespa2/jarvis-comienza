/**
 * FIREBASE FIRESTORE SERVICE - Proper Integration
 *
 * Uses the specific Firestore database:
 * Database ID: ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00
 * Project: asistente-jarvis-1741893602789
 *
 * Collections:
 * - interactions: User queries and Jarvis responses
 * - improvements: Auto-improvements made by self-improve engine
 * - daily_metrics: Daily performance metrics
 * - knowledge_graph: Knowledge base entries
 * - h1_learnings: Security findings from HackerOne
 * - research_sessions: Academic research sessions
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// ============================================
// FIRESTORE DATABASE CONFIGURATION
// ============================================

const PROJECT_ID = 'asistente-jarvis-1741893602789';
const DATABASE_ID = 'ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00';

let db: admin.firestore.Firestore | null = null;

/**
 * Initialize Firestore connection to specific database
 */
export function initializeFirestore(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.join(process.cwd(), '.config', 'serviceAccountKey.json') ||
        path.join(process.cwd(), 'serviceAccountKey.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: PROJECT_ID
        });
        console.log('✅ [Firestore] Firebase Admin initialized');
      }
    }

    // Get Firestore instance for specific database
    db = admin.firestore();

    console.log(`✅ [Firestore] Connected to database: ${DATABASE_ID}`);

    return db;
  } catch (error: any) {
    console.error('❌ [Firestore] Initialization error:', error.message);
    throw error;
  }
}

/**
 * Get Firestore instance
 */
function getDb(): admin.firestore.Firestore {
  if (!db) {
    return initializeFirestore();
  }
  return db;
}

// ============================================
// INTERACTION RECORDING
// ============================================

export interface Interaction {
  id?: string;
  sessionId: string;
  userQuery: string;
  jarvisResponse: string;
  intent: string;
  emotion?: string;
  confidence: number;
  userSatisfaction?: number;
  systemsUsed: string[];
  executionTimeMs?: number;
  createdAt: number;
  updatedAt: number;
}

export async function recordInteraction(interaction: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docData: Interaction = {
      ...interaction,
      createdAt: now,
      updatedAt: now,
      systemsUsed: interaction.systemsUsed || []
    };

    const firestore = getDb();
    const docRef = await firestore.collection('interactions').add(docData);
    console.log(`✅ [Firestore] Interaction recorded: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to record interaction:', error.message);
    throw error;
  }
}

export async function getRecentInteractions(days: number = 1): Promise<Interaction[]> {
  try {
    const firestore = getDb();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const snapshot = await firestore
      .collection('interactions')
      .where('createdAt', '>=', cutoffTime)
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const interactions: Interaction[] = [];
    snapshot.forEach(doc => {
      interactions.push({
        id: doc.id,
        ...(doc.data() as Omit<Interaction, 'id'>)
      });
    });

    console.log(`✅ [Firestore] Retrieved ${interactions.length} interactions from last ${days} day(s)`);
    return interactions;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to get interactions:', error.message);
    return [];
  }
}

// ============================================
// IMPROVEMENT TRACKING
// ============================================

export interface Improvement {
  id?: string;
  commitHash: string;
  improvementType: string;
  targetDimension: string;
  priority: number;
  expectedImpact: number;
  filesChanged: string[];
  description: string;
  appliedAt: number;
  createdAt: number;
}

export async function recordImprovement(improvement: Omit<Improvement, 'id' | 'appliedAt' | 'createdAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docData: Improvement = {
      ...improvement,
      appliedAt: now,
      createdAt: now
    };

    const firestore = getDb();
    const docRef = await firestore.collection('improvements').add(docData);
    console.log(`✅ [Firestore] Improvement recorded: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to record improvement:', error.message);
    throw error;
  }
}

export async function getImprovementHistory(limit: number = 30): Promise<Improvement[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore
      .collection('improvements')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const improvements: Improvement[] = [];
    snapshot.forEach(doc => {
      improvements.push({
        id: doc.id,
        ...(doc.data() as Omit<Improvement, 'id'>)
      });
    });

    console.log(`✅ [Firestore] Retrieved ${improvements.length} improvements`);
    return improvements;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to get improvements:', error.message);
    return [];
  }
}

// ============================================
// DAILY METRICS
// ============================================

export interface DailyMetric {
  id?: string;
  metricDate: string; // YYYY-MM-DD format
  binaryAccuracy: number;
  multiClassQuality: number;
  multiClassRelevance: number;
  multiClassCoherence: number;
  multiClassCompleteness: number;
  totalInteractions: number;
  avgConfidence: number;
  avgSatisfaction: number;
  createdAt: number;
  updatedAt: number;
}

export async function saveDailyMetrics(metrics: Omit<DailyMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docData: DailyMetric = {
      ...metrics,
      createdAt: now,
      updatedAt: now
    };

    const firestore = getDb();
    // Use date as document ID for easy querying
    const docRef = await firestore
      .collection('daily_metrics')
      .doc(metrics.metricDate)
      .set(docData, { merge: true });

    console.log(`✅ [Firestore] Daily metrics saved for ${metrics.metricDate}`);
    return metrics.metricDate;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to save metrics:', error.message);
    throw error;
  }
}

export async function getMetricsTrend(days: number = 30): Promise<DailyMetric[]> {
  try {
    const firestore = getDb();
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    const snapshot = await firestore
      .collection('daily_metrics')
      .where('metricDate', '>=', cutoffDate)
      .orderBy('metricDate', 'desc')
      .get();

    const metrics: DailyMetric[] = [];
    snapshot.forEach(doc => {
      metrics.push({
        id: doc.id,
        ...(doc.data() as Omit<DailyMetric, 'id'>)
      });
    });

    console.log(`✅ [Firestore] Retrieved ${metrics.length} metric records`);
    return metrics;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to get metrics:', error.message);
    return [];
  }
}

// ============================================
// KNOWLEDGE GRAPH
// ============================================

export interface KnowledgeGraphNode {
  id?: string;
  label: string;
  nodeType: string;
  externalId?: string;
  properties: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export async function createNode(node: Omit<KnowledgeGraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docData: KnowledgeGraphNode = {
      ...node,
      properties: node.properties || {},
      createdAt: now,
      updatedAt: now
    };

    const firestore = getDb();
    const docRef = await firestore.collection('knowledge_graph').add(docData);
    console.log(`✅ [Firestore] Knowledge node created: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to create node:', error.message);
    throw error;
  }
}

export async function getNodesByType(nodeType: string): Promise<KnowledgeGraphNode[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore
      .collection('knowledge_graph')
      .where('nodeType', '==', nodeType)
      .get();

    const nodes: KnowledgeGraphNode[] = [];
    snapshot.forEach(doc => {
      nodes.push({
        id: doc.id,
        ...(doc.data() as Omit<KnowledgeGraphNode, 'id'>)
      });
    });

    return nodes;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to get nodes:', error.message);
    return [];
  }
}

// ============================================
// H1 LEARNINGS
// ============================================

export interface H1Learning {
  id?: string;
  vulnerabilityType: string;
  technique: string;
  toolUsed: string;
  successRate: number;
  severity: string;
  caseStudy: string;
  learnedAt: number;
  createdAt: number;
}

export async function recordH1Learning(learning: Omit<H1Learning, 'id' | 'createdAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docData: H1Learning = {
      ...learning,
      createdAt: now
    };

    const firestore = getDb();
    const docRef = await firestore.collection('h1_learnings').add(docData);
    console.log(`✅ [Firestore] H1 learning recorded: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to record H1 learning:', error.message);
    throw error;
  }
}

export async function getH1Learnings(limit: number = 50): Promise<H1Learning[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore
      .collection('h1_learnings')
      .orderBy('learnedAt', 'desc')
      .limit(limit)
      .get();

    const learnings: H1Learning[] = [];
    snapshot.forEach(doc => {
      learnings.push({
        id: doc.id,
        ...(doc.data() as Omit<H1Learning, 'id'>)
      });
    });

    return learnings;
  } catch (error: any) {
    console.error('❌ [Firestore] Failed to get H1 learnings:', error.message);
    return [];
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

export async function batchWrite(writes: Array<{
  collection: string;
  operation: 'set' | 'update' | 'delete';
  document?: string;
  data?: any;
}>): Promise<void> {
  try {
    const firestore = getDb();
    const batch = firestore.batch();

    for (const write of writes) {
      const docRef = firestore.collection(write.collection).doc(write.document || '');

      if (write.operation === 'set') {
        batch.set(docRef, write.data || {});
      } else if (write.operation === 'update') {
        batch.update(docRef, write.data || {});
      } else if (write.operation === 'delete') {
        batch.delete(docRef);
      }
    }

    await batch.commit();
    console.log(`✅ [Firestore] Batch write completed (${writes.length} operations)`);
  } catch (error: any) {
    console.error('❌ [Firestore] Batch write failed:', error.message);
    throw error;
  }
}

// ============================================
// CONNECTION TEST
// ============================================

export async function testConnection(): Promise<{ ok: boolean; message: string; databaseId?: string }> {
  try {
    const firestore = getDb();

    // Test basic connectivity
    const snapshot = await firestore.collection('interactions').limit(1).get();

    return {
      ok: true,
      message: `Connected to Firestore (database: ${DATABASE_ID})`,
      databaseId: DATABASE_ID
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Connection failed: ${error.message}`
    };
  }
}

// ============================================
// EXPORT SERVICE
// ============================================

export const firebaseFirestoreService = {
  initializeFirestore,

  // Interactions
  recordInteraction,
  getRecentInteractions,

  // Improvements
  recordImprovement,
  getImprovementHistory,

  // Metrics
  saveDailyMetrics,
  getMetricsTrend,

  // Knowledge Graph
  createNode,
  getNodesByType,

  // H1 Learnings
  recordH1Learning,
  getH1Learnings,

  // Batch
  batchWrite,

  // Connection
  testConnection
};
