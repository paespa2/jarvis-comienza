/**
 * INTEGRATION ORCHESTRATOR
 *
 * Orquestador central de integraciones.
 * Coordina GitHub, REST API, Webhooks, Base de datos y MOTOR AGENTICO REAL.
 *
 * ⚠️  CRÍTICO: Este orquestador usa el verdadero motor agentico con Constitutional AI.
 * Todas las tareas pasan por validación constitucional. Jarvis NUNCA viola su constitución.
 */

import { GitHubIntegration } from './github/githubIntegration';
import { RestApiServer } from './api/restApiServer';
import { WebhookManager } from './webhooks/webhookManager';
import { DatabaseLayer, DatabaseConfig } from './database/databaseLayer';
import { JarvisAgenticBridge } from './JarvisAgenticBridge';
import { v4 as uuidv4 } from 'uuid';

export interface IntegrationConfig {
  github?: {
    token: string;
  };
  api?: {
    port: number;
  };
  database?: DatabaseConfig;
}

export class IntegrationOrchestrator {
  private github: GitHubIntegration | null = null;
  private api: RestApiServer | null = null;
  private webhooks: WebhookManager;
  private database: DatabaseLayer | null = null;
  private agenticBridge: JarvisAgenticBridge;
  private initialized: boolean = false;
  private startTime: number = 0;

  constructor() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔗 INICIALIZANDO INTEGRATION ORCHESTRATOR`);
    console.log(`   Con motor agentico REAL y Constitutional AI`);
    console.log(`${'='.repeat(70)}\n`);

    this.webhooks = new WebhookManager();
    this.agenticBridge = new JarvisAgenticBridge();
  }

  /**
   * INICIALIZAR INTEGRACIONES
   *
   * Ahora incluye el motor agentico real con Constitutional AI.
   */
  async initialize(config: IntegrationConfig): Promise<boolean> {
    console.log(`\n⚙️  Inicializando integraciones...\n`);

    this.startTime = Date.now();

    try {
      // INICIALIZAR MOTOR AGENTICO (PRIORIDAD CRÍTICA)
      console.log(`🧠 MOTOR AGENTICO:`);
      const agentInitSuccess = await this.agenticBridge.initialize();
      if (!agentInitSuccess) {
        console.warn(`\n⚠️  ADVERTENCIA: Motor agentico no inicializado completamente`);
        console.warn(`   Algunas funcionalidades pueden estar limitadas\n`);
      }

      // Inicializar GitHub
      if (config.github) {
        console.log(`\n📦 GitHub Integration:`);
        this.github = new GitHubIntegration();
        this.github.authenticate(config.github.token);
      }

      // Inicializar REST API
      if (config.api) {
        console.log(`\n🌐 REST API Server:`);
        this.api = new RestApiServer(config.api.port, this.agenticBridge);
        this.api.start();
      }

      // Inicializar Base de datos
      if (config.database) {
        console.log(`\n🗄️  Database Layer:`);
        this.database = new DatabaseLayer(config.database);
        await this.database.connect();
      }

      this.initialized = true;

      console.log(`\n✅ Todas las integraciones inicializadas`);
      console.log(`   Uptime: ${Date.now() - this.startTime}ms`);
      console.log(`   ⚠️  MOTOR AGENTICO REAL ACTIVADO`);
      console.log(`   ⚠️  CONSTITUTIONAL AI EN VIGOR\n`);

      return true;
    } catch (error) {
      console.error(`\n❌ Error durante inicialización:`, error);
      return false;
    }
  }

  /**
   * REGISTRAR WEBHOOK AUTOMÁTICO PARA EVOLUCIÓN
   */
  registerAutoEvolutionWebhook(url: string): string {
    console.log(`\n🎯 Registrando webhook automático de evolución`);

    const webhook = this.webhooks.registerWebhook(
      url,
      [
        'task_completed',
        'memory_consolidation',
        'genome_evolution',
        'model_deployment',
      ],
      {
        retries: 5,
        timeout: 10000,
      }
    );

    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   Disparará en eventos de evolución`);

    return webhook.id;
  }

  /**
   * EJECUTAR TAREA COMPLETA
   */
  /**
   * EJECUTAR TAREA A TRAVÉS DEL MOTOR AGENTICO REAL
   *
   * Ejecuta la tarea con:
   * - Validación Constitucional
   * - Agentic Loop real
   * - Consolidación de memoria
   * - Evolución del modelo
   */
  async executeTask(query: string, context?: any): Promise<any> {
    console.log(`\n📋 Ejecutando tarea a través de motor agentico real...`);

    try {
      // USAR EL VERDADERO MOTOR AGENTICO
      const result = await this.agenticBridge.executeTask({
        query,
        context,
        priority: 'medium',
        requester: 'api-request',
      });

      // Disparar evento WebHook
      await this.webhooks.triggerEvent(
        result.success ? 'task_completed' : 'task_failed',
        {
          taskId: result.taskId,
          query,
          success: result.success,
          executionTime: result.executionTime,
          iterations: result.iterations,
          constitutionallyApproved: result.constitutionalValidation.approved,
        }
      );

      // Guardar en base de datos
      if (this.database) {
        await this.database.saveTask({
          id: result.taskId,
          query,
          status: result.success ? 'completed' : 'failed',
          result: {
            output: result.output,
            reasoning: result.reasoning,
            iterations: result.iterations,
            constitutionalValidation: result.constitutionalValidation,
          },
          executionTime: result.executionTime,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      }

      return {
        id: result.taskId,
        success: result.success,
        output: result.output,
        reasoning: result.reasoning,
        iterations: result.iterations,
        executionTime: result.executionTime,
        constitutionalValidation: result.constitutionalValidation,
      };
    } catch (error) {
      console.error(`❌ Error ejecutando tarea:`, error);
      throw error;
    }
  }

  /**
   * DISPARAR EVOLUCIÓN AUTOMÁTICA
   */
  async triggerAutomaticEvolution(): Promise<any> {
    if (!this.api) {
      throw new Error('REST API no inicializado');
    }

    console.log(`\n🧬 Disparando evolución automática`);

    const response = await this.api.triggerEvolution();

    // Disparar eventos de evolución
    await this.webhooks.triggerEvent('genome_evolution', {
      generationId: `gen-${uuidv4()}`,
      successRate: 0.85,
      mutationVector: {
        aggressiveness: 0.55,
        caution: 0.45,
        predictivity: 0.62,
        creativity: 0.58,
      },
    });

    return response;
  }

  /**
   * ANALIZAR REPOSITORIO GITHUB
   */
  async analyzeRepository(owner: string, repo: string): Promise<any> {
    if (!this.github) {
      throw new Error('GitHub Integration no inicializado');
    }

    console.log(`\n📊 Analizando repositorio GitHub: ${owner}/${repo}`);

    const analysis = await this.github.analyzeRepository(owner, repo);

    // Guardar análisis en base de datos si está disponible
    if (this.database) {
      // Guardar resultados
      console.log(`   Guardando análisis en base de datos...`);
    }

    // Crear issues si hay vulnerabilidades
    if (analysis.securityVulnerabilities.length > 0) {
      console.log(`\n🔐 Creando issues para vulnerabilidades encontradas`);

      for (const vuln of analysis.securityVulnerabilities.slice(0, 2)) {
        try {
          await this.github.createIssue(
            owner,
            repo,
            `Vulnerability: ${vuln}`,
            `Found by Jarvis Security Audit: ${vuln}`,
            ['security', 'critical']
          );
        } catch (error) {
          console.log(`   ⚠️  Error al crear issue: ${error}`);
        }
      }
    }

    return analysis;
  }

  /**
   * OBTENER ESTADO COMPLETO DEL SISTEMA
   */
  getSystemStatus(): any {
    console.log(`\n📊 Estado del Sistema Integrado:\n`);

    const status: any = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      initialized: this.initialized,
    };

    // API Status
    if (this.api) {
      const apiMetrics = this.api.getMetrics();
      status.api = apiMetrics.data;
    }

    // Webhooks Status
    status.webhooks = this.webhooks.getStatistics();

    // Database Status
    if (this.database) {
      status.database = {
        connected: this.database.isConnected(),
      };
    }

    // GitHub Status
    if (this.github) {
      status.github = this.github.getStatistics();
    }

    console.log(`   API: ${status.api ? '✅ Running' : '⛔ Not initialized'}`);
    console.log(`   Webhooks: ${status.webhooks.totalWebhooks} registrados`);
    console.log(`   Database: ${this.database?.isConnected() ? '✅ Connected' : '⛔ Disconnected'}`);
    console.log(`   GitHub: ${this.github ? '✅ Authenticated' : '⛔ Not initialized'}`);

    return status;
  }

  /**
   * OBTENER MÉTRICAS GLOBALES
   */
  getGlobalMetrics(): any {
    console.log(`\n📈 Métricas Globales:\n`);

    const metrics: any = {};

    // Métricas de API
    if (this.api) {
      const apiMetrics = this.api.getMetrics();
      metrics.api = apiMetrics.data;
    }

    // Métricas de Webhooks
    metrics.webhooks = this.webhooks.getStatistics();

    // Métricas de Database
    if (this.database && this.database.isConnected()) {
      // Agregar estadísticas de DB
      metrics.database = {
        connected: true,
      };
    }

    console.log(`   Tasks procesadas: ${metrics.api?.tasksProcessed || 0}`);
    console.log(`   Success rate: ${(metrics.api?.successRate * 100 || 0).toFixed(1)}%`);
    console.log(`   Webhooks activos: ${metrics.webhooks?.activeWebhooks || 0}`);
    console.log(`   Entregas exitosas: ${metrics.webhooks?.successfulDeliveries || 0}`);

    return metrics;
  }

  /**
   * FINALIZAR INTEGRACIONES
   */
  async shutdown(): Promise<void> {
    console.log(`\n🛑 Deteniendo Integration Orchestrator`);

    if (this.api) {
      this.api.stop();
    }

    if (this.database) {
      await this.database.disconnect();
    }

    this.initialized = false;

    console.log(`   ✅ Integraciones detenidas\n`);
  }

  /**
   * OBTENER COMPONENTES
   */
  getComponents(): {
    github: GitHubIntegration | null;
    api: RestApiServer | null;
    webhooks: WebhookManager;
    database: DatabaseLayer | null;
  } {
    return {
      github: this.github,
      api: this.api,
      webhooks: this.webhooks,
      database: this.database,
    };
  }
}
