/**
 * FIREBASE SERVER SERVICE
 *
 * Servicio de Firebase para el backend de Jarvis (Node.js).
 * Usa la API REST de Firestore directamente — sin SDK del cliente browser.
 *
 * Guarda el knowledge graph de aprendizajes de Jarvis:
 * - Hallazgos de HackerOne como KnowledgeNodes
 * - Links bidireccionales entre conceptos relacionados
 * - Historial de aprendizajes con metadata
 *
 * Colecciones:
 *   jarvis/knowledge_nodes/{nodeId}   - Nodos del grafo
 *   jarvis/learnings/{learningId}     - Aprendizajes de casos HackerOne
 *   jarvis/metrics/{date}             - Métricas diarias
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIG FIREBASE
// ============================================

interface FirebaseConfig {
  projectId: string;
  firestoreDatabaseId: string;
  apiKey: string;
}

function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return {
      projectId: raw.projectId,
      firestoreDatabaseId: raw.firestoreDatabaseId,
      apiKey: raw.apiKey,
    };
  } catch {
    return null;
  }
}

const FIREBASE_CONFIG = loadFirebaseConfig();

// ============================================
// TIPOS
// ============================================

export interface KnowledgeGraphNode {
  id: string;
  title: string;
  content: string;
  category: 'security' | 'hackerone' | 'recon' | 'code' | 'general';
  tags: string[];
  links: string[];        // IDs de nodos relacionados
  cvssScore?: number;
  severity?: string;
  bountyEstimate?: number;
  source: 'hackerone' | 'learning' | 'manual';
  createdAt: number;
  updatedAt: number;
}

export interface HackerOneLearningRecord {
  id: string;
  vulnerabilityType: string;
  severity: string;
  cvssScore: number;
  programsFound: number;
  topProgram?: string;
  estimatedBounty: number;
  acceptanceProbability: number;
  payloadsGenerated: number;
  reconStepsGenerated: number;
  knowledgeNodeId: string;   // Link al nodo en el grafo
  learnedAt: number;
  constitutionallyValid: boolean;
}

// ============================================
// HELPERS FIRESTORE REST API
// ============================================

function firestoreUrl(collection: string, docId?: string): string {
  if (!FIREBASE_CONFIG) return '';
  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.firestoreDatabaseId}/documents`;
  return docId ? `${base}/${collection}/${docId}?key=${FIREBASE_CONFIG.apiKey}` : `${base}/${collection}?key=${FIREBASE_CONFIG.apiKey}`;
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => typeof v === 'string' ? { stringValue: v } : { doubleValue: v }),
        },
      };
    }
  }
  return fields;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.doubleValue !== undefined) obj[key] = val.doubleValue;
    else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue);
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.arrayValue) {
      obj[key] = (val.arrayValue.values || []).map((v: any) =>
        v.stringValue ?? v.doubleValue ?? v.integerValue ?? null
      );
    }
  }
  return obj;
}

// ============================================
// FIREBASE SERVER SERVICE
// ============================================

export const firebaseServerService = {
  isConfigured(): boolean {
    return FIREBASE_CONFIG !== null;
  },

  // -----------------------------------------------
  // GUARDAR NODO EN EL GRAFO DE CONOCIMIENTO
  // -----------------------------------------------

  async saveKnowledgeNode(node: Omit<KnowledgeGraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    if (!FIREBASE_CONFIG) {
      console.warn('[Firebase] No configurado - guardando solo localmente');
      return null;
    }

    const nodeId = node.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = Date.now();

    const nodeData = {
      ...node,
      id: nodeId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const url = firestoreUrl('jarvis/knowledge_graph/nodes', nodeId);
      await axios.patch(url, {
        fields: toFirestoreFields(nodeData as any),
      }, { timeout: 5000 });

      console.log(`🔥 Firebase: KnowledgeNode guardado → ${nodeId}`);
      return nodeId;
    } catch (error: any) {
      console.warn(`[Firebase] Error guardando nodo: ${error.message}`);
      return null;
    }
  },

  // -----------------------------------------------
  // CREAR LINK BIDIRECCIONAL ENTRE NODOS
  // -----------------------------------------------

  async linkNodes(nodeIdA: string, nodeIdB: string): Promise<void> {
    if (!FIREBASE_CONFIG) return;

    try {
      // Obtener ambos nodos y agregar el link
      for (const [fromId, toId] of [[nodeIdA, nodeIdB], [nodeIdB, nodeIdA]]) {
        const url = firestoreUrl('jarvis/knowledge_graph/nodes', fromId);
        const response = await axios.get(url, { timeout: 5000 });
        const existingLinks: string[] = fromFirestoreFields(response.data.fields || {}).links || [];

        if (!existingLinks.includes(toId)) {
          existingLinks.push(toId);
          await axios.patch(url, {
            fields: toFirestoreFields({ links: existingLinks, updatedAt: Date.now() }),
          }, { timeout: 5000 });
        }
      }
      console.log(`🔗 Firebase: Nodos enlazados: ${nodeIdA} ↔ ${nodeIdB}`);
    } catch (error: any) {
      console.warn(`[Firebase] Error enlazando nodos: ${error.message}`);
    }
  },

  // -----------------------------------------------
  // GUARDAR APRENDIZAJE DE HACKERONE
  // -----------------------------------------------

  async saveHackerOneLearning(record: Omit<HackerOneLearningRecord, 'id' | 'learnedAt'>): Promise<string | null> {
    if (!FIREBASE_CONFIG) return null;

    const learningId = `h1-${record.vulnerabilityType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const data = { ...record, id: learningId, learnedAt: Date.now() };

    try {
      const url = firestoreUrl('jarvis/knowledge_graph/h1_learnings', learningId);
      await axios.patch(url, {
        fields: toFirestoreFields(data as any),
      }, { timeout: 5000 });

      console.log(`🔥 Firebase: HackerOne learning guardado → ${learningId}`);
      return learningId;
    } catch (error: any) {
      console.warn(`[Firebase] Error guardando learning: ${error.message}`);
      return null;
    }
  },

  // -----------------------------------------------
  // OBTENER TODOS LOS NODOS DEL GRAFO
  // -----------------------------------------------

  async getKnowledgeGraph(): Promise<KnowledgeGraphNode[]> {
    if (!FIREBASE_CONFIG) return [];

    try {
      const url = firestoreUrl('jarvis/knowledge_graph/nodes');
      const response = await axios.get(url, { timeout: 8000 });

      const docs = response.data.documents || [];
      return docs.map((doc: any) => fromFirestoreFields(doc.fields || {})) as KnowledgeGraphNode[];
    } catch (error: any) {
      console.warn(`[Firebase] Error obteniendo grafo: ${error.message}`);
      return [];
    }
  },

  // -----------------------------------------------
  // OBTENER APRENDIZAJES DE HACKERONE
  // -----------------------------------------------

  async getHackerOneLearnings(limit = 10): Promise<HackerOneLearningRecord[]> {
    if (!FIREBASE_CONFIG) return [];

    try {
      const url = firestoreUrl('jarvis/knowledge_graph/h1_learnings');
      const response = await axios.get(`${url}&pageSize=${limit}`, { timeout: 8000 });

      const docs = response.data.documents || [];
      return docs
        .map((doc: any) => fromFirestoreFields(doc.fields || {})) as HackerOneLearningRecord[];
    } catch (error: any) {
      console.warn(`[Firebase] Error obteniendo learnings: ${error.message}`);
      return [];
    }
  },

  // -----------------------------------------------
  // GUARDAR MÉTRICAS DIARIAS
  // -----------------------------------------------

  async saveDailyMetrics(metrics: Record<string, any>): Promise<void> {
    if (!FIREBASE_CONFIG) return;

    const today = new Date().toISOString().split('T')[0];
    try {
      const url = firestoreUrl('jarvis/knowledge_graph/daily_metrics', today);
      await axios.patch(url, {
        fields: toFirestoreFields({ ...metrics, date: today, updatedAt: Date.now() }),
      }, { timeout: 5000 });
    } catch (error: any) {
      console.warn(`[Firebase] Error guardando métricas: ${error.message}`);
    }
  },
};
