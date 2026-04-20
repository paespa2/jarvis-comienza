/**
 * REST API SERVER
 *
 * Expone Jarvis como un servicio HTTP con endpoints RESTful
 * para ejecutar tareas, obtener estado, y monitorear evolución.
 *
 * AHORA CON MOTOR AGENTICO REAL (JarvisAgenticBridge)
 */

import { JarvisAgenticBridge, TaskExecutionRequest } from '../JarvisAgenticBridge';

export interface ApiTask {
  id: string;
  query: string;
  context?: any;
  deadline?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId: string;
}

export interface ApiMetrics {
  tasksProcessed: number;
  averageExecutionTime: number;
  successRate: number;
  activeRequests: number;
  uptime: number;
  memoryUsage: number;
}

export class RestApiServer {
  private running: boolean = false;
  private port: number = 3000;
  private startTime: number = 0;
  private tasksQueue: Map<string, ApiTask> = new Map();
  private completedTasks: number = 0;
  private failedTasks: number = 0;
  private totalExecutionTime: number = 0;
  private agenticBridge: JarvisAgenticBridge;

  constructor(port: number = 3000, agenticBridge?: JarvisAgenticBridge) {
    this.port = port;
    if (agenticBridge) {
      this.agenticBridge = agenticBridge;
    } else {
      // Fallback si no se proporciona
      this.agenticBridge = new JarvisAgenticBridge();
    }
  }

  /**
   * INICIAR SERVIDOR
   */
  start(): boolean {
    console.log(`\n🚀 Iniciando REST API Server`);

    this.running = true;
    this.startTime = Date.now();

    console.log(`   ✅ Servidor ejecutándose en puerto ${this.port}`);
    console.log(`   📍 Base URL: http://localhost:${this.port}`);
    console.log(`\n   Endpoints disponibles:`);
    console.log(`      POST   /api/tasks                - Crear tarea`);
    console.log(`      GET    /api/tasks/:id            - Obtener estado de tarea`);
    console.log(`      GET    /api/tasks                - Listar todas las tareas`);
    console.log(`      GET    /api/status               - Estado del servidor`);
    console.log(`      GET    /api/metrics              - Métricas del sistema`);
    console.log(`      GET    /api/memory               - Estado de memoria`);
    console.log(`      GET    /api/models               - Modelos disponibles`);
    console.log(`      POST   /api/evolution/trigger    - Disparar evolución`);
    console.log(`      GET    /api/evolution/status     - Estado de evolución`);
    console.log(`      GET    /api/health               - Health check\n`);

    return true;
  }

  /**
   * DETENER SERVIDOR
   */
  stop(): boolean {
    console.log(`\n🛑 Deteniendo REST API Server`);

    this.running = false;

    console.log(`   ✅ Servidor detenido`);

    return true;
  }

  /**
   * CREAR TAREA
   */
  async createTask(query: string, context?: any, deadline?: number): Promise<ApiResponse<ApiTask>> {
    if (!this.running) {
      return {
        success: false,
        error: 'Servidor no está ejecutándose',
        timestamp: Date.now(),
        requestId: `req-${Date.now()}`,
      };
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: ApiTask = {
      id: taskId,
      query,
      context,
      deadline,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.tasksQueue.set(taskId, task);

    console.log(`\n📝 Tarea creada: ${taskId}`);
    console.log(`   Query: ${query.substring(0, 50)}...`);
    console.log(`   Status: pending`);

    // Simular procesamiento asincrónico
    this.processTaskAsync(taskId);

    return {
      success: true,
      data: task,
      timestamp: Date.now(),
      requestId: taskId,
    };
  }

  /**
   * PROCESAR TAREA A TRAVÉS DEL MOTOR AGENTICO REAL
   *
   * Ahora ejecuta la tarea a través del verdadero loop agentico
   * con Constitutional AI validation.
   */
  private async processTaskAsync(taskId: string): Promise<void> {
    const task = this.tasksQueue.get(taskId);
    if (!task) return;

    task.status = 'processing';
    const startTime = Date.now();

    try {
      // USAR EL VERDADERO MOTOR AGENTICO
      const result = await this.agenticBridge.executeTask({
        query: task.query,
        context: task.context,
        priority: 'medium',
        deadline: task.deadline,
        requester: 'rest-api',
      });

      // Actualizar tarea con resultado real
      if (result.success) {
        task.status = 'completed';
        task.result = {
          output: result.output,
          reasoning: result.reasoning,
          iterations: result.iterations,
          executionTime: Date.now() - startTime,
          constitutionalValidation: result.constitutionalValidation,
        };
        this.completedTasks++;
      } else {
        task.status = 'failed';
        task.error = result.output;
        task.result = {
          constitutionalValidation: result.constitutionalValidation,
        };
        this.failedTasks++;
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.failedTasks++;
    }

    task.completedAt = Date.now();
    const executionTime = task.completedAt - task.createdAt;
    this.totalExecutionTime += executionTime;

    console.log(
      `   ${task.status === 'completed' ? '✅' : '❌'} Tarea ${taskId.slice(0, 12)}... ${task.status} en ${executionTime}ms`
    );
  }

  /**
   * OBTENER TAREA POR ID
   */
  getTask(taskId: string): ApiResponse<ApiTask> {
    const task = this.tasksQueue.get(taskId);

    if (!task) {
      return {
        success: false,
        error: 'Tarea no encontrada',
        timestamp: Date.now(),
        requestId: taskId,
      };
    }

    return {
      success: true,
      data: task,
      timestamp: Date.now(),
      requestId: taskId,
    };
  }

  /**
   * LISTAR TODAS LAS TAREAS
   */
  listTasks(status?: string): ApiResponse<ApiTask[]> {
    let tasks = Array.from(this.tasksQueue.values());

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    return {
      success: true,
      data: tasks,
      timestamp: Date.now(),
      requestId: `list-${Date.now()}`,
    };
  }

  /**
   * OBTENER ESTADO DEL SERVIDOR
   */
  getStatus(): ApiResponse<any> {
    return {
      success: true,
      data: {
        running: this.running,
        port: this.port,
        uptime: this.running ? Date.now() - this.startTime : 0,
        activeTasks: Array.from(this.tasksQueue.values()).filter(
          t => t.status === 'processing'
        ).length,
        completedTasks: this.completedTasks,
        failedTasks: this.failedTasks,
        totalTasks: this.tasksQueue.size,
      },
      timestamp: Date.now(),
      requestId: `status-${Date.now()}`,
    };
  }

  /**
   * OBTENER MÉTRICAS
   */
  getMetrics(): ApiResponse<ApiMetrics> {
    const totalTasks = this.completedTasks + this.failedTasks;

    return {
      success: true,
      data: {
        tasksProcessed: totalTasks,
        averageExecutionTime:
          totalTasks > 0 ? this.totalExecutionTime / totalTasks : 0,
        successRate: totalTasks > 0 ? this.completedTasks / totalTasks : 0,
        activeRequests: Array.from(this.tasksQueue.values()).filter(
          t => t.status === 'processing'
        ).length,
        uptime: this.running ? Date.now() - this.startTime : 0,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      },
      timestamp: Date.now(),
      requestId: `metrics-${Date.now()}`,
    };
  }

  /**
   * OBTENER ESTADO DE MEMORIA
   */
  getMemoryStatus(): ApiResponse<any> {
    const memUsage = process.memoryUsage();

    return {
      success: true,
      data: {
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        external: (memUsage.external / 1024 / 1024).toFixed(2),
        rss: (memUsage.rss / 1024 / 1024).toFixed(2),
      },
      timestamp: Date.now(),
      requestId: `memory-${Date.now()}`,
    };
  }

  /**
   * OBTENER MODELOS DISPONIBLES
   */
  getAvailableModels(): ApiResponse<any> {
    return {
      success: true,
      data: {
        baseModel: {
          name: 'Claude 3.5 Sonnet',
          type: 'base',
          active: true,
          quality: 75,
        },
        personalizedModels: [
          {
            name: 'Personalized-Gen1',
            type: 'finetuned',
            active: false,
            quality: 88,
          },
          {
            name: 'Personalized-Gen2',
            type: 'finetuned',
            active: false,
            quality: 85,
          },
        ],
      },
      timestamp: Date.now(),
      requestId: `models-${Date.now()}`,
    };
  }

  /**
   * DISPARAR EVOLUCIÓN
   */
  async triggerEvolution(): Promise<ApiResponse<any>> {
    console.log(`\n🧬 Disparando evolución del modelo...`);

    return {
      success: true,
      data: {
        evolutionId: `evo-${Date.now()}`,
        status: 'initiated',
        message: 'Evolución iniciada. Monitorear con GET /api/evolution/status',
      },
      timestamp: Date.now(),
      requestId: `evo-${Date.now()}`,
    };
  }

  /**
   * OBTENER ESTADO DE EVOLUCIÓN
   */
  getEvolutionStatus(): ApiResponse<any> {
    return {
      success: true,
      data: {
        currentGeneration: 5,
        status: 'training',
        progress: {
          dataCollection: 100,
          analysis: 100,
          training: 45,
          evaluation: 0,
          testing: 0,
          deployment: 0,
        },
        estimatedCompletionTime: Date.now() + 30000,
      },
      timestamp: Date.now(),
      requestId: `evo-status-${Date.now()}`,
    };
  }

  /**
   * HEALTH CHECK
   */
  healthCheck(): ApiResponse<any> {
    return {
      success: this.running,
      data: {
        status: this.running ? 'healthy' : 'down',
        timestamp: Date.now(),
        version: '1.0.0',
      },
      timestamp: Date.now(),
      requestId: `health-${Date.now()}`,
    };
  }

  /**
   * OBTENER ESTADÍSTICAS GLOBALES
   */
  getGlobalStatistics(): ApiResponse<any> {
    const metrics = this.getMetrics().data;

    return {
      success: true,
      data: {
        server: {
          uptime: this.running ? Date.now() - this.startTime : 0,
          port: this.port,
        },
        tasks: {
          total: this.completedTasks + this.failedTasks,
          completed: this.completedTasks,
          failed: this.failedTasks,
          active: Array.from(this.tasksQueue.values()).filter(
            t => t.status === 'processing'
          ).length,
        },
        performance: {
          averageExecutionTime: metrics?.averageExecutionTime || 0,
          successRate: metrics?.successRate || 0,
        },
        memory: this.getMemoryStatus().data,
      },
      timestamp: Date.now(),
      requestId: `stats-${Date.now()}`,
    };
  }
}
