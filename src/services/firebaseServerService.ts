/**
 * FIREBASE SERVER SERVICE — Realtime Database (RTDB)
 *
 * Migrado de Firestore REST → Firebase Realtime Database REST.
 * La API key browser SÍ funciona con RTDB desde backend Node.js.
 *
 * Estructura en RTDB:
 *   jarvis/
 *     knowledge_graph/     - Nodos de conocimiento de Jarvis
 *     h1_learnings/        - Aprendizajes de casos HackerOne
 *     daily_metrics/       - Métricas diarias
 *     research_sessions/   - Sesiones de auto-investigación
 *
 * REST API RTDB:
 *   GET    {databaseURL}/{path}.json          - Leer
 *   PUT    {databaseURL}/{path}.json          - Escribir/reemplazar
 *   POST   {databaseURL}/{path}.json          - Append (genera key)
 *   PATCH  {databaseURL}/{path}.json          - Actualizar campos
 *   DELETE {databaseURL}/{path}.json          - Borrar
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIG FIREBASE RTDB
// ============================================

interface FirebaseConfig {
  projectId: string;
  databaseURL: string;
  apiKey: string;
}

function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Support both databaseURL (RTDB) and legacy Firestore config
    const databaseURL = raw.databaseURL || `https://${raw.projectId}-default-rtdb.firebaseio.com`;

    if (!raw.projectId || !raw.apiKey) return null;

    return {
      projectId: raw.projectId,
      databaseURL: databaseURL.replace(/\/$/, ''), // strip trailing slash
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
  links: string[];
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
  knowledgeNodeId: string;
  learnedAt: number;
  constitutionallyValid: boolean;
}

// ============================================
// HELPERS RTDB REST API
// ============================================

function rtdbUrl(path: string): string {
  if (!FIREBASE_CONFIG) return '';
  // RTDB REST: {databaseURL}/{path}.json
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${FIREBASE_CONFIG.databaseURL}/${cleanPath}.json`;
}

async function rtdbGet(path: string): Promise<any> {
  const url = rtdbUrl(path);
  const response = await axios.get(url, {
    timeout: 8000,
    validateStatus: (s) => s < 500,
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`RTDB_AUTH_ERROR:${response.status}`);
  }
  return response.data;
}

async function rtdbPut(path: string, data: any): Promise<void> {
  const url = rtdbUrl(path);
  const response = await axios.put(url, data, {
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: (s) => s < 500,
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`RTDB_AUTH_ERROR:${response.status}`);
  }
}

async function rtdbPatch(path: string, data: any): Promise<void> {
  const url = rtdbUrl(path);
  const response = await axios.patch(url, data, {
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: (s) => s < 500,
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`RTDB_AUTH_ERROR:${response.status}`);
  }
}

// ============================================
// FIREBASE SERVER SERVICE
// ============================================

// Cooldown to avoid spamming auth errors in logs
let _authErrorLogged = false;
let _disabledUntil = 0;

function isDisabled(): boolean {
  return Date.now() < _disabledUntil;
}

function handleAuthError(err: Error, operation: string): void {
  if (!_authErrorLogged) {
    if (err.message.startsWith('RTDB_AUTH_ERROR')) {
      console.warn(`[Firebase RTDB] ⚠️  Permiso denegado en "${operation}".`);
      console.warn(`[Firebase RTDB]    Las reglas de la base de datos no permiten acceso sin autenticación.`);
      console.warn(`[Firebase RTDB]    Ve a Firebase Console → Realtime Database → Reglas y establece:`);
      console.warn(`[Firebase RTDB]    { "rules": { ".read": true, ".write": true } }  (solo para desarrollo)`);
      console.warn(`[Firebase RTDB]    O agrega un Secret de servicio para autenticación de backend.`);
      console.warn(`[Firebase RTDB]    Reintentos silenciados por 1h.`);
    } else {
      console.warn(`[Firebase RTDB] Error en "${operation}": ${err.message}`);
    }
    _authErrorLogged = true;
    _disabledUntil = Date.now() + 60 * 60 * 1000;
  }
}

export const firebaseServerService = {

  isConfigured(): boolean {
    return FIREBASE_CONFIG !== null;
  },

  getDatabaseURL(): string {
    return FIREBASE_CONFIG?.databaseURL || '';
  },

  // -----------------------------------------------
  // GUARDAR NODO EN EL GRAFO DE CONOCIMIENTO
  // -----------------------------------------------

  async saveKnowledgeNode(node: Omit<KnowledgeGraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    if (!FIREBASE_CONFIG || isDisabled()) return null;

    const nodeId = node.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 60);
    const now = Date.now();
    const nodeData: KnowledgeGraphNode = { ...node, id: nodeId, createdAt: now, updatedAt: now };

    try {
      await rtdbPut(`jarvis/knowledge_graph/${nodeId}`, nodeData);
      return nodeId;
    } catch (err: any) {
      handleAuthError(err, 'saveKnowledgeNode');
      return null;
    }
  },

  // -----------------------------------------------
  // ENLAZAR DOS NODOS (actualizar links)
  // -----------------------------------------------

  async linkNodes(nodeId1: string, nodeId2: string): Promise<void> {
    if (!FIREBASE_CONFIG || isDisabled()) return;
    try {
      // PATCH to add link without overwriting existing data
      await rtdbPatch(`jarvis/knowledge_graph/${nodeId1}`, { [`link_${nodeId2}`]: true });
      await rtdbPatch(`jarvis/knowledge_graph/${nodeId2}`, { [`link_${nodeId1}`]: true });
    } catch (err: any) {
      handleAuthError(err, 'linkNodes');
    }
  },

  // -----------------------------------------------
  // GUARDAR APRENDIZAJE DE HACKERONE
  // -----------------------------------------------

  async saveHackerOneLearning(learning: Omit<HackerOneLearningRecord, 'id' | 'learnedAt'>): Promise<string | null> {
    if (!FIREBASE_CONFIG || isDisabled()) return null;

    const learningId = `learning-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: HackerOneLearningRecord = {
      ...learning,
      id: learningId,
      learnedAt: Date.now(),
    };

    try {
      await rtdbPut(`jarvis/h1_learnings/${learningId}`, record);
      console.log(`[Firebase RTDB] ✅ HackerOne learning guardado: ${learningId}`);
      return learningId;
    } catch (err: any) {
      handleAuthError(err, 'saveHackerOneLearning');
      return null;
    }
  },

  // -----------------------------------------------
  // OBTENER GRAFO DE CONOCIMIENTO
  // -----------------------------------------------

  async getKnowledgeGraph(): Promise<KnowledgeGraphNode[]> {
    if (!FIREBASE_CONFIG || isDisabled()) return [];

    try {
      const data = await rtdbGet('jarvis/knowledge_graph');
      if (!data) return [];
      return Object.values(data) as KnowledgeGraphNode[];
    } catch (err: any) {
      handleAuthError(err, 'getKnowledgeGraph');
      return [];
    }
  },

  // -----------------------------------------------
  // OBTENER APRENDIZAJES DE HACKERONE
  // -----------------------------------------------

  async getHackerOneLearnings(limit = 10): Promise<HackerOneLearningRecord[]> {
    if (!FIREBASE_CONFIG || isDisabled()) return [];

    try {
      const data = await rtdbGet('jarvis/h1_learnings');
      if (!data) return [];
      const records = Object.values(data) as HackerOneLearningRecord[];
      return records.sort((a, b) => b.learnedAt - a.learnedAt).slice(0, limit);
    } catch (err: any) {
      handleAuthError(err, 'getHackerOneLearnings');
      return [];
    }
  },

  // -----------------------------------------------
  // GUARDAR MÉTRICAS DIARIAS
  // -----------------------------------------------

  async saveDailyMetrics(metrics: Record<string, any>): Promise<void> {
    if (!FIREBASE_CONFIG || isDisabled()) return;

    const today = new Date().toISOString().split('T')[0];
    try {
      await rtdbPatch(`jarvis/daily_metrics/${today}`, { ...metrics, date: today, updatedAt: Date.now() });
    } catch (err: any) {
      handleAuthError(err, 'saveDailyMetrics');
    }
  },

  // -----------------------------------------------
  // GUARDAR SESIÓN DE INVESTIGACIÓN (AutoResearcher)
  // -----------------------------------------------

  async saveResearchSession(session: { timestamp: string; papersFound: number; knowledgeAdded: number; topics: string[]; summary: string }): Promise<void> {
    if (!FIREBASE_CONFIG || isDisabled()) return;

    const sessionId = `session-${Date.now()}`;
    try {
      await rtdbPut(`jarvis/research_sessions/${sessionId}`, session);
    } catch (err: any) {
      handleAuthError(err, 'saveResearchSession');
    }
  },

  // -----------------------------------------------
  // TEST DE CONEXIÓN
  // -----------------------------------------------

  async testConnection(): Promise<{ ok: boolean; message: string; databaseURL?: string }> {
    if (!FIREBASE_CONFIG) {
      return { ok: false, message: 'firebase-applet-config.json no encontrado o incompleto' };
    }

    try {
      // Write a test value
      await rtdbPut('jarvis/connection_test', {
        timestamp: Date.now(),
        message: 'Jarvis RTDB connection OK',
        testedAt: new Date().toISOString(),
      });

      // Read it back
      const result = await rtdbGet('jarvis/connection_test');
      if (result?.message) {
        console.log(`[Firebase RTDB] ✅ Conexión exitosa a: ${FIREBASE_CONFIG.databaseURL}`);
        // Reset cooldown on success
        _authErrorLogged = false;
        _disabledUntil = 0;
        return { ok: true, message: 'Conexión exitosa', databaseURL: FIREBASE_CONFIG.databaseURL };
      }
      return { ok: false, message: 'Escribió pero no pudo leer de vuelta' };
    } catch (err: any) {
      const msg = err.message.startsWith('RTDB_AUTH_ERROR')
        ? 'Permiso denegado — abre las reglas de RTDB en Firebase Console'
        : err.message;
      return { ok: false, message: msg, databaseURL: FIREBASE_CONFIG.databaseURL };
    }
  },
};
