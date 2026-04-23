/**
 * FIREBASE SQL CONNECT SERVICE
 *
 * Connects to Firebase SQL Connect (GraphQL API)
 * Replaces direct PostgreSQL connection with Firebase-managed GraphQL
 *
 * Service: asistente-jarvis-1741893602789-service
 * Location: us-east4
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIG FIREBASE SQL CONNECT
// ============================================

interface SQLConnectConfig {
  projectId: string;
  serviceId: string;
  location: string;
  apiKey: string;
  endpoint: string;
}

function loadSQLConnectConfig(): SQLConnectConfig {
  // Try environment variables
  if (process.env.FIREBASE_SQL_CONNECT_ENDPOINT && process.env.FIREBASE_API_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || 'asistente-jarvis-1741893602789',
      serviceId: process.env.FIREBASE_SERVICE_ID || 'asistente-jarvis-1741893602789-service',
      location: process.env.FIREBASE_LOCATION || 'us-east4',
      apiKey: process.env.FIREBASE_API_KEY,
      endpoint: process.env.FIREBASE_SQL_CONNECT_ENDPOINT
    };
  }

  // Construct endpoint from project info
  const projectId = 'asistente-jarvis-1741893602789';
  const serviceId = 'asistente-jarvis-1741893602789-service';
  const location = 'us-east4';

  return {
    projectId,
    serviceId,
    location,
    apiKey: process.env.FIREBASE_API_KEY || '',
    endpoint: `https://${location}-${projectId}.firebaseapp.com/graphql/${serviceId}`
  };
}

// ============================================
// GRAPHQL CLIENT
// ============================================

class SQLConnectClient {
  private client: AxiosInstance;
  private endpoint: string;
  private apiKey: string;

  constructor(config: SQLConnectConfig) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 30000
    });
  }

  async executeQuery<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.post('/graphql', {
        query,
        variables: variables || {}
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data as T;
    } catch (err: any) {
      console.error('[SQL Connect] Query error:', err.message);
      console.error('[SQL Connect] Query:', query);
      console.error('[SQL Connect] Variables:', variables);
      throw err;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.post('/graphql', {
        query: '{ __typename }'
      });
      return !response.data.errors;
    } catch (err) {
      console.error('[SQL Connect] Connection test failed:', err);
      return false;
    }
  }
}

// ============================================
// INITIALIZE CLIENT
// ============================================

const config = loadSQLConnectConfig();
let client: SQLConnectClient | null = null;

function initializeClient(): SQLConnectClient {
  if (client) return client;

  if (!config.apiKey) {
    console.warn('[SQL Connect] API Key not configured. Set FIREBASE_API_KEY.');
  }

  client = new SQLConnectClient(config);
  return client;
}

// ============================================
// GRAPHQL QUERIES
// ============================================

const QUERIES = {
  CreateNode: `
    mutation CreateNode(
      $nodeTypeName: String!
      $label: String!
      $externalId: String
    ) {
      nodeInsert(input: {
        nodeTypeName: $nodeTypeName
        label: $label
        externalId: $externalId
      }) {
        id
        label
        createdAt
      }
    }
  `,

  GetNodesByType: `
    query GetNodesByType($nodeTypeName: String!) {
      nodeList(where: { nodeType: { name: { equals: $nodeTypeName } } }) {
        id
        label
        externalId
        createdAt
      }
    }
  `,

  RecordInteraction: `
    mutation RecordInteraction(
      $sessionId: String!
      $userQuery: String!
      $jarvisResponse: String!
      $intent: String
      $emotion: String
      $confidence: Float
      $userSatisfaction: Float
      $systemsUsed: String
    ) {
      interactionInsert(input: {
        sessionId: $sessionId
        userQuery: $userQuery
        jarvisResponse: $jarvisResponse
        intent: $intent
        emotion: $emotion
        confidence: $confidence
        userSatisfaction: $userSatisfaction
        systemsUsed: $systemsUsed
      }) {
        id
        sessionId
        createdAt
      }
    }
  `,

  GetRecentInteractions: `
    query GetRecentInteractions($days: Int!) {
      interactionList(
        where: {
          createdAt: { greaterThanOrEquals: "now - interval '$days days'" }
        }
        orderBy: [{ createdAt: DESC }]
        limit: 1000
      ) {
        id
        sessionId
        userQuery
        jarvisResponse
        intent
        emotion
        confidence
        userSatisfaction
        createdAt
      }
    }
  `,

  SaveDailyMetrics: `
    mutation SaveDailyMetrics(
      $metricDate: Date!
      $binaryAccuracy: Float
      $multiClassQuality: Float
      $multiClassRelevance: Float
      $multiClassCoherence: Float
      $multiClassCompleteness: Float
      $totalInteractions: Int
      $avgConfidence: Float
      $avgSatisfaction: Float
    ) {
      dailyMetricUpsert(input: {
        metricDate: $metricDate
        binaryAccuracy: $binaryAccuracy
        multiClassQuality: $multiClassQuality
        multiClassRelevance: $multiClassRelevance
        multiClassCoherence: $multiClassCoherence
        multiClassCompleteness: $multiClassCompleteness
        totalInteractions: $totalInteractions
        avgConfidence: $avgConfidence
        avgSatisfaction: $avgSatisfaction
      }) {
        id
        metricDate
        createdAt
      }
    }
  `,

  GetMetricsTrend: `
    query GetMetricsTrend($days: Int!) {
      dailyMetricList(
        where: {
          metricDate: { greaterThanOrEquals: "today - interval '$days days'" }
        }
        orderBy: [{ metricDate: DESC }]
      ) {
        id
        metricDate
        binaryAccuracy
        multiClassQuality
        multiClassRelevance
        multiClassCoherence
        multiClassCompleteness
        totalInteractions
      }
    }
  `,

  RecordImprovement: `
    mutation RecordImprovement(
      $commitHash: String!
      $improvementType: String
      $targetDimension: String
      $priority: Int
      $expectedImpact: Float
      $filesChanged: String
      $description: String
    ) {
      improvementInsert(input: {
        commitHash: $commitHash
        improvementType: $improvementType
        targetDimension: $targetDimension
        priority: $priority
        expectedImpact: $expectedImpact
        filesChanged: $filesChanged
        description: $description
      }) {
        id
        commitHash
        appliedAt
      }
    }
  `,

  GetImprovementHistory: `
    query GetImprovementHistory($limit: Int!) {
      improvementList(
        orderBy: [{ appliedAt: DESC }]
        limit: $limit
      ) {
        id
        commitHash
        improvementType
        targetDimension
        priority
        expectedImpact
        appliedAt
        description
      }
    }
  `
};

// ============================================
// SERVICE METHODS
// ============================================

async function recordInteraction(interaction: any): Promise<string> {
  const c = initializeClient();
  const result = await c.executeQuery<any>(
    QUERIES.RecordInteraction,
    {
      sessionId: interaction.sessionId,
      userQuery: interaction.userQuery,
      jarvisResponse: interaction.jarvisResponse,
      intent: interaction.intent,
      emotion: interaction.emotion,
      confidence: interaction.confidence,
      userSatisfaction: interaction.userSatisfaction,
      systemsUsed: JSON.stringify(interaction.systemsUsed || [])
    }
  );
  return result.interactionInsert.id;
}

async function getRecentInteractions(days: number = 1): Promise<any[]> {
  const c = initializeClient();
  const result = await c.executeQuery<any>(
    QUERIES.GetRecentInteractions,
    { days }
  );
  return result.interactionList || [];
}

async function saveDailyMetrics(metrics: any): Promise<void> {
  const c = initializeClient();
  await c.executeQuery(
    QUERIES.SaveDailyMetrics,
    {
      metricDate: metrics.metricDate.toISOString().split('T')[0],
      binaryAccuracy: metrics.binaryAccuracy,
      multiClassQuality: metrics.multiClassQuality,
      multiClassRelevance: metrics.multiClassRelevance,
      multiClassCoherence: metrics.multiClassCoherence,
      multiClassCompleteness: metrics.multiClassCompleteness,
      totalInteractions: metrics.totalInteractions,
      avgConfidence: metrics.avgConfidence,
      avgSatisfaction: metrics.avgSatisfaction
    }
  );
}

async function getMetricsTrend(days: number = 30): Promise<any[]> {
  const c = initializeClient();
  const result = await c.executeQuery<any>(
    QUERIES.GetMetricsTrend,
    { days }
  );
  return result.dailyMetricList || [];
}

async function recordImprovement(improvement: any): Promise<void> {
  const c = initializeClient();
  await c.executeQuery(
    QUERIES.RecordImprovement,
    {
      commitHash: improvement.commitHash,
      improvementType: improvement.type,
      targetDimension: improvement.targetDimension,
      priority: improvement.priority,
      expectedImpact: improvement.expectedImpact,
      filesChanged: JSON.stringify(improvement.files || []),
      description: improvement.action
    }
  );
}

async function getImprovementHistory(limit: number = 30): Promise<any[]> {
  const c = initializeClient();
  const result = await c.executeQuery<any>(
    QUERIES.GetImprovementHistory,
    { limit }
  );
  return result.improvementList || [];
}

async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const c = initializeClient();
    const isConnected = await c.testConnection();
    if (isConnected) {
      console.log('[SQL Connect] ✅ Connection successful');
      return {
        ok: true,
        message: `Connected to Firebase SQL Connect (${config.location})`
      };
    }
    return {
      ok: false,
      message: 'Failed to verify GraphQL connection'
    };
  } catch (err: any) {
    console.error('[SQL Connect] Connection failed:', err.message);
    return {
      ok: false,
      message: err.message
    };
  }
}

// ============================================
// EXPORT SERVICE
// ============================================

export const sqlConnectService = {
  testConnection,
  recordInteraction,
  getRecentInteractions,
  saveDailyMetrics,
  getMetricsTrend,
  recordImprovement,
  getImprovementHistory,
  initializeClient,
  config
};
