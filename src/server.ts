/**
 * JARVIS SERVER
 *
 * Servidor Express que expone Jarvis IA como servicio HTTP
 * Desplegable en Railway, Vercel, Heroku, etc.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { IntegrationOrchestrator } from './integrations/IntegrationOrchestrator';
import { v4 as uuidv4 } from 'uuid';

// Tipos
interface JarvisRequest {
  id: string;
  query: string;
  context?: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Variables globales
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

let orchestrator: IntegrationOrchestrator;
const requests: Map<string, JarvisRequest> = new Map();

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * INICIALIZAR JARVIS
 */
async function initializeJarvis() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 INICIALIZANDO JARVIS IA SERVER`);
  console.log(`${'='.repeat(70)}\n`);

  orchestrator = new IntegrationOrchestrator();

  // Inicializar integraciones
  await orchestrator.initialize({
    api: {
      port: PORT,
    },
    database: {
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './jarvis.db',
    },
    // GitHub opcional si existe token
    ...(process.env.GITHUB_TOKEN && {
      github: {
        token: process.env.GITHUB_TOKEN,
      },
    }),
  });

  console.log(`\n✅ Jarvis inicializado correctamente`);
  console.log(`📍 Escuchando en http://${HOST}:${PORT}`);
  console.log(`${'='.repeat(70)}\n`);
}

/**
 * =====================================
 * HEALTH CHECK
 * =====================================
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * =====================================
 * API STATUS
 * =====================================
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
 * =====================================
 * CREAR TAREA
 * =====================================
 */
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { query, context } = req.body;

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

    // Procesar asincronicamente
    (async () => {
      try {
        jarvisRequest.status = 'processing';

        // Ejecutar tarea
        const result = await orchestrator.executeTask(query, context);

        jarvisRequest.status = 'completed';
        jarvisRequest.result = result;
      } catch (error: any) {
        jarvisRequest.status = 'failed';
        jarvisRequest.error = error.message;
      }
    })();

    res.json({
      success: true,
      data: jarvisRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * =====================================
 * OBTENER TAREA
 * =====================================
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
 * =====================================
 * LISTAR TAREAS
 * =====================================
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
 * =====================================
 * MÉTRICAS
 * =====================================
 */
app.get('/api/metrics', (req: Request, res: Response) => {
  const metrics = orchestrator.getGlobalMetrics();

  res.json({
    success: true,
    data: {
      ...metrics,
      requestsProcessed: requests.size,
      completedRequests: Array.from(requests.values()).filter(
        r => r.status === 'completed'
      ).length,
      failedRequests: Array.from(requests.values()).filter(
        r => r.status === 'failed'
      ).length,
    },
  });
});

/**
 * =====================================
 * EVOLUCIÓN
 * =====================================
 */
app.post('/api/evolution/trigger', async (req: Request, res: Response) => {
  try {
    const response = await orchestrator.triggerAutomaticEvolution();

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/evolution/status', (req: Request, res: Response) => {
  const status = orchestrator.getSystemStatus();

  res.json({
    success: true,
    data: {
      status: 'active',
      ...status,
    },
  });
});

/**
 * =====================================
 * GITHUB (si está disponible)
 * =====================================
 */
app.post('/api/github/analyze', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: 'Owner y repo son requeridos',
      });
    }

    const analysis = await orchestrator.analyzeRepository(owner, repo);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * =====================================
 * DOCUMENTACIÓN
 * =====================================
 */
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Jarvis IA API',
      version: '1.0.0',
      endpoints: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'Health check',
        },
        status: {
          method: 'GET',
          path: '/api/status',
          description: 'Estado del sistema',
        },
        createTask: {
          method: 'POST',
          path: '/api/tasks',
          description: 'Crear tarea',
          body: { query: 'string', context: 'object?' },
        },
        getTask: {
          method: 'GET',
          path: '/api/tasks/:id',
          description: 'Obtener tarea por ID',
        },
        listTasks: {
          method: 'GET',
          path: '/api/tasks',
          description: 'Listar tareas',
          query: { status: 'pending|processing|completed|failed?' },
        },
        metrics: {
          method: 'GET',
          path: '/api/metrics',
          description: 'Obtener métricas globales',
        },
        triggerEvolution: {
          method: 'POST',
          path: '/api/evolution/trigger',
          description: 'Disparar evolución de modelo',
        },
        evolutionStatus: {
          method: 'GET',
          path: '/api/evolution/status',
          description: 'Obtener estado de evolución',
        },
        analyzeRepo: {
          method: 'POST',
          path: '/api/github/analyze',
          description: 'Analizar repositorio GitHub',
          body: { owner: 'string', repo: 'string' },
        },
        docs: {
          method: 'GET',
          path: '/api/docs',
          description: 'Esta documentación',
        },
      },
    },
  });
});

/**
 * =====================================
 * ROOT
 * =====================================
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 Jarvis IA - Sistema de IA Completamente Agentico',
    status: 'running',
    documentation: '/api/docs',
    api_version: '1.0.0',
  });
});

/**
 * =====================================
 * 404
 * =====================================
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
  });
});

/**
 * =====================================
 * ERROR HANDLER
 * =====================================
 */
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

/**
 * =====================================
 * INICIAR SERVIDOR
 * =====================================
 */
async function startServer() {
  try {
    // Inicializar Jarvis
    await initializeJarvis();

    // Iniciar servidor
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

// Iniciar
startServer();
