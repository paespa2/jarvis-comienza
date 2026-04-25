/**
 * JARVIS — Núcleo Principal
 *
 * Punto de entrada único. Todo empieza aquí.
 * Constitución cargada desde CONSTITUCIÓN.md
 * Conocimiento persistido en Obsidian vault (.vault/)
 * IA: Claude → Groq → Gemini (solo cloud, sin modelos locales)
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

// ── Servicios core ──────────────────────────────────────────────────────────
import { jarvisAIClient, AIMessage } from './src/services/JarvisAIClient';
import { obsidianVault } from './src/services/ObsidianVault';

// ── Configuración ───────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8080;
const WORKSPACE = path.join(process.cwd(), 'jarvis_workspace');

// Conversaciones activas en memoria (por session_id)
const sessions = new Map<string, AIMessage[]>();

async function start() {
  // Crear workspace
  await fs.promises.mkdir(WORKSPACE, { recursive: true });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // ── Multer para uploads ─────────────────────────────────────────────────
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, WORKSPACE),
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
  });

  // ── Proxies remotos opcionales ──────────────────────────────────────────
  const OPENCLAW_URL = process.env.OPENCLAW_URL || process.env.VITE_OPENCLAW_URL;
  const PAPERCLIP_URL = process.env.PAPERCLIP_URL || process.env.VITE_PAPERCLIP_URL;

  if (OPENCLAW_URL) {
    app.use(
      '/openclaw-proxy',
      createProxyMiddleware({
        target: OPENCLAW_URL,
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/openclaw-proxy': '' },
        on: {
          proxyReq: (proxyReq) => {
            if (process.env.OPENCLAW_GATEWAY_TOKEN)
              proxyReq.setHeader('Authorization', `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`);
          },
        },
      })
    );
  }

  if (PAPERCLIP_URL) {
    app.use(
      '/paperclip-proxy',
      createProxyMiddleware({
        target: PAPERCLIP_URL,
        changeOrigin: true,
        pathRewrite: { '^/paperclip-proxy': '' },
      })
    );
  }

  // ── Health ──────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.send('OK'));

  // ── Estado de proveedores de IA ─────────────────────────────────────────
  app.get('/api/status', (_req, res) => {
    const aiStatus = jarvisAIClient.getStatus();
    res.json({
      jarvis: 'online',
      ai: aiStatus,
      vault: obsidianVault.getStats().then ? null : obsidianVault.getStats(),
      constitution: fs.existsSync(path.join(process.cwd(), 'CONSTITUCIÓN.md')),
    });
  });

  app.get('/api/env-health', (_req, res) => {
    res.json({
      claude: !!process.env.ANTHROPIC_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      openclaw: !!process.env.OPENCLAW_GATEWAY_TOKEN,
      paperclip: !!process.env.PAPERCLIP_AGENT_API_KEY,
    });
  });

  // ── Chat principal ──────────────────────────────────────────────────────
  app.post('/api/chat', async (req, res) => {
    const { message, session_id = 'default' } = req.body as {
      message: string;
      session_id?: string;
    };

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message requerido' });
    }

    // Obtener o crear historial de conversación
    if (!sessions.has(session_id)) {
      sessions.set(session_id, []);
    }
    const history = sessions.get(session_id)!;

    try {
      const response = await jarvisAIClient.chat(message, history);

      // Actualizar historial (máximo 20 turnos para no saturar contexto)
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: response.content });
      if (history.length > 40) history.splice(0, 2);

      res.json({
        response: response.content,
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime,
        session_id,
      });
    } catch (e: any) {
      console.error('[Jarvis] Chat error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Vault — buscar notas ────────────────────────────────────────────────
  app.get('/api/vault/search', async (req, res) => {
    const { q = '', tag } = req.query as { q?: string; tag?: string };
    const result = await obsidianVault.search(q, tag);
    res.json(result);
  });

  // ── Vault — listar por tipo ─────────────────────────────────────────────
  app.get('/api/vault/:type', async (req, res) => {
    const validTypes = ['case', 'skill', 'finding', 'technique', 'learning', 'memory'];
    const type = req.params.type as any;
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    const notes = await obsidianVault.getByType(type);
    res.json(notes);
  });

  // ── Vault — guardar nota manualmente ───────────────────────────────────
  app.post('/api/vault/save', async (req, res) => {
    const { title, content, type = 'memory', tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title y content son requeridos' });
    }
    const note = await obsidianVault.saveNote(title, content, type, tags);
    res.json(note);
  });

  // ── Vault — exportar todo ───────────────────────────────────────────────
  app.get('/api/vault', async (_req, res) => {
    const notes = await obsidianVault.export();
    const stats = await obsidianVault.getStats();
    res.json({ stats, notes });
  });

  // ── Grabar aprendizaje desde un mensaje ────────────────────────────────
  app.post('/api/learn', async (req, res) => {
    const { topic, insight, evidence } = req.body;
    if (!topic || !insight) {
      return res.status(400).json({ error: 'topic e insight son requeridos' });
    }
    await jarvisAIClient.recordLearning(topic, insight, evidence || '');
    res.json({ ok: true });
  });

  // ── Upload de archivos al workspace ────────────────────────────────────
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
    res.json({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });
  });

  // ── Estadísticas del vault ──────────────────────────────────────────────
  app.get('/api/stats', async (_req, res) => {
    const vaultStats = await obsidianVault.getStats();
    const aiStatus = jarvisAIClient.getStatus();
    res.json({ vault: vaultStats, ai: aiStatus });
  });

  // ── Limpiar sesión ──────────────────────────────────────────────────────
  app.delete('/api/session/:id', (req, res) => {
    sessions.delete(req.params.id);
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║         JARVIS — Online              ║`);
    console.log(`╠══════════════════════════════════════╣`);
    console.log(`║  Puerto  : ${PORT}                      `.padEnd(42) + `║`);
    const aiStatus = jarvisAIClient.getStatus();
    console.log(`║  Claude  : ${aiStatus.claude ? '✅' : '❌'}                        ║`);
    console.log(`║  Groq    : ${aiStatus.groq ? '✅' : '❌'}                        ║`);
    console.log(`║  Gemini  : ${aiStatus.gemini ? '✅' : '❌'}                        ║`);
    console.log(`║  Proveedor activo: ${aiStatus.activeProvider.padEnd(17)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);
  });
}

start().catch((e) => {
  console.error('[Jarvis] Error fatal al iniciar:', e);
  process.exit(1);
});
