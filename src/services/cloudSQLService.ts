/**
 * CLOUD SQL SERVICE - PostgreSQL
 *
 * Reemplaza Firebase Realtime Database con Google Cloud SQL (PostgreSQL)
 * Proporciona persistencia permanente del conocimiento, interacciones y mejoras
 *
 * Instancia: asistente-jarvis-1741893602789-instance
 * Base de datos: asistente-jarvis-1741893602789-database
 *
 * Métodos reemplazan los de firebaseServerService pero con SQL
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIG CLOUD SQL
// ============================================

interface CloudSQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
  instanceConnectionName?: string; // For Cloud SQL Auth proxy
}

function loadCloudSQLConfig(): CloudSQLConfig {
  // Try environment variables first
  if (process.env.CLOUD_SQL_HOST && process.env.CLOUD_SQL_USER) {
    return {
      host: process.env.CLOUD_SQL_HOST,
      port: parseInt(process.env.CLOUD_SQL_PORT || '5432'),
      user: process.env.CLOUD_SQL_USER,
      password: process.env.CLOUD_SQL_PASSWORD || '',
      database: process.env.CLOUD_SQL_DATABASE || 'asistente-jarvis-1741893602789-database',
      ssl: process.env.CLOUD_SQL_SSL === 'true'
    };
  }

  // Fallback to defaults for local development
  return {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'asistente-jarvis-1741893602789-database',
    ssl: false
  };
}

// ============================================
// CONNECTION POOL
// ============================================

let pool: Pool | null = null;

function initializePool(): Pool {
  if (pool) return pool;

  const config = loadCloudSQLConfig();

  pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('[Cloud SQL] Unexpected error on idle client', err);
  });

  return pool;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function query(sql: string, params: any[] = []): Promise<QueryResult> {
  const pool = initializePool();
  try {
    return await pool.query(sql, params);
  } catch (err: any) {
    console.error('[Cloud SQL] Query error:', err.message);
    console.error('[Cloud SQL] SQL:', sql);
    console.error('[Cloud SQL] Params:', params);
    throw err;
  }
}

// ============================================
// KNOWLEDGE GRAPH METHODS
// ============================================

interface NodeTypeRecord {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

interface NodeRecord {
  id: number;
  node_type_id: number;
  external_id?: string;
  label: string;
  created_at: Date;
}

async function createNodeType(name: string, description?: string): Promise<number> {
  const result = await query(
    'INSERT INTO node_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING id',
    [name, description]
  );
  return result.rows[0].id;
}

async function createNode(nodeTypeName: string, label: string, externalId?: string): Promise<number> {
  const typeId = await createNodeType(nodeTypeName);

  const result = await query(
    'INSERT INTO nodes (node_type_id, label, external_id) VALUES ($1, $2, $3) RETURNING id',
    [typeId, label, externalId]
  );
  return result.rows[0].id;
}

async function addNodeProperty(nodeId: number, key: string, value: string): Promise<void> {
  await query(
    'INSERT INTO node_properties (node_id, property_key, property_value) VALUES ($1, $2, $3)',
    [nodeId, key, value]
  );
}

async function getNodesByType(nodeTypeName: string): Promise<NodeRecord[]> {
  const result = await query(
    `SELECT n.* FROM nodes n
     INNER JOIN node_types nt ON n.node_type_id = nt.id
     WHERE nt.name = $1`,
    [nodeTypeName]
  );
  return result.rows;
}

async function getKnowledgeGraph(): Promise<any> {
  const nodesResult = await query('SELECT * FROM nodes');
  const edgesResult = await query('SELECT * FROM edges');
  const propertiesResult = await query('SELECT * FROM node_properties');

  return {
    nodes: nodesResult.rows,
    edges: edgesResult.rows,
    properties: propertiesResult.rows
  };
}

// ============================================
// INTERACTION METHODS
// ============================================

interface Interaction {
  sessionId: string;
  userQuery: string;
  jarvisResponse: string;
  intent?: string;
  emotion?: string;
  confidence?: number;
  userSatisfaction?: number;
  systemsUsed?: string[];
}

async function recordInteraction(interaction: Interaction): Promise<number> {
  const result = await query(
    `INSERT INTO interactions
    (session_id, user_query, jarvis_response, intent, emotion, confidence, user_satisfaction, systems_used)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      interaction.sessionId,
      interaction.userQuery,
      interaction.jarvisResponse,
      interaction.intent,
      interaction.emotion,
      interaction.confidence,
      interaction.userSatisfaction,
      JSON.stringify(interaction.systemsUsed || [])
    ]
  );
  return result.rows[0].id;
}

async function getInteractionsBySession(sessionId: string, limit: number = 50): Promise<any[]> {
  const result = await query(
    'SELECT * FROM interactions WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2',
    [sessionId, limit]
  );
  return result.rows;
}

async function getRecentInteractions(days: number = 1): Promise<any[]> {
  const result = await query(
    `SELECT * FROM interactions
     WHERE created_at >= NOW() - INTERVAL '1 day' * $1
     ORDER BY created_at DESC`,
    [days]
  );
  return result.rows;
}

// ============================================
// IMPROVEMENT METHODS
// ============================================

async function recordImprovement(improvement: any): Promise<void> {
  await query(
    `INSERT INTO improvements
    (commit_hash, improvement_type, target_dimension, priority, expected_impact, files_changed, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      improvement.commitHash,
      improvement.type,
      improvement.targetDimension,
      improvement.priority,
      improvement.expectedImpact,
      JSON.stringify(improvement.files),
      improvement.action
    ]
  );
}

async function getImprovementHistory(limit: number = 30): Promise<any[]> {
  const result = await query(
    'SELECT * FROM improvements ORDER BY applied_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

// ============================================
// METRICS METHODS
// ============================================

interface DailyMetrics {
  metricDate: Date;
  binaryAccuracy?: number;
  multiClassQuality?: number;
  multiClassRelevance?: number;
  multiClassCoherence?: number;
  multiClassCompleteness?: number;
  responseVariation?: number;
  contextRetention?: number;
  totalInteractions?: number;
  avgConfidence?: number;
  avgSatisfaction?: number;
}

async function saveDailyMetrics(metrics: DailyMetrics): Promise<void> {
  await query(
    `INSERT INTO daily_metrics
    (metric_date, binary_accuracy, multi_class_quality, multi_class_relevance, multi_class_coherence,
     multi_class_completeness, response_variation, context_retention, total_interactions, avg_confidence, avg_satisfaction)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (metric_date) DO UPDATE SET
      binary_accuracy = $2,
      multi_class_quality = $3,
      multi_class_relevance = $4,
      multi_class_coherence = $5,
      multi_class_completeness = $6,
      response_variation = $7,
      context_retention = $8,
      total_interactions = $9,
      avg_confidence = $10,
      avg_satisfaction = $11`,
    [
      metrics.metricDate,
      metrics.binaryAccuracy,
      metrics.multiClassQuality,
      metrics.multiClassRelevance,
      metrics.multiClassCoherence,
      metrics.multiClassCompleteness,
      metrics.responseVariation,
      metrics.contextRetention,
      metrics.totalInteractions,
      metrics.avgConfidence,
      metrics.avgSatisfaction
    ]
  );
}

async function getMetricsTrend(days: number = 30): Promise<any[]> {
  const result = await query(
    `SELECT * FROM daily_metrics
     WHERE metric_date >= NOW()::date - INTERVAL '1 day' * $1
     ORDER BY metric_date DESC`,
    [days]
  );
  return result.rows;
}

// ============================================
// LEARNING METHODS
// ============================================

async function recordH1Learning(learning: any): Promise<void> {
  await query(
    `INSERT INTO h1_learnings
    (vulnerability_type, technique, tool_used, success_rate, severity, case_study)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      learning.vulnerabilityType,
      learning.technique,
      learning.toolUsed,
      learning.successRate,
      learning.severity,
      JSON.stringify(learning.caseStudy)
    ]
  );
}

async function getH1Learnings(limit: number = 50): Promise<any[]> {
  const result = await query(
    'SELECT * FROM h1_learnings ORDER BY learned_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

// ============================================
// CONNECTION TESTING
// ============================================

async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await query('SELECT NOW() as current_time');
    if (result.rows.length > 0) {
      console.log('[Cloud SQL] ✅ Connection successful');
      return {
        ok: true,
        message: `Connected to PostgreSQL: ${result.rows[0].current_time}`
      };
    }
    return {
      ok: false,
      message: 'Query executed but no results'
    };
  } catch (err: any) {
    console.error('[Cloud SQL] ❌ Connection failed:', err.message);
    return {
      ok: false,
      message: err.message
    };
  }
}

async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================
// EXPORT SERVICE
// ============================================

export const cloudSQLService = {
  // Connection
  testConnection,
  closePool,
  initializePool,

  // Node/Graph operations
  createNodeType,
  createNode,
  addNodeProperty,
  getNodesByType,
  getKnowledgeGraph,

  // Interactions
  recordInteraction,
  getInteractionsBySession,
  getRecentInteractions,

  // Improvements
  recordImprovement,
  getImprovementHistory,

  // Metrics
  saveDailyMetrics,
  getMetricsTrend,

  // Learning
  recordH1Learning,
  getH1Learnings,

  // Raw query access for advanced operations
  query
};
