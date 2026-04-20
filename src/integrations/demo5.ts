/**
 * DEMO FASE 5: INTEGRACIONES Y APIS
 *
 * Demostración completa del sistema de integraciones
 * GitHub, REST API, Webhooks y Base de datos.
 */

import { IntegrationOrchestrator } from './IntegrationOrchestrator';
import { GitHubIntegration } from './github/githubIntegration';
import { WebhookManager } from './webhooks/webhookManager';
import { DatabaseLayer } from './database/databaseLayer';
import { RestApiServer } from './api/restApiServer';

/**
 * DEMO 1: GitHub Integration
 */
async function demo1_GitHubIntegration() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 1: GITHUB INTEGRATION`);
  console.log(`${'='.repeat(70)}\n`);

  const github = new GitHubIntegration(
    'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  );

  // Analizar repositorio
  const analysis = await github.analyzeRepository(
    'anthropics',
    'anthropic-sdk-python'
  );

  console.log(`\n📊 ANÁLISIS COMPLETADO`);
  console.log(`   Issues críticos: ${analysis.issuesFound.critical}`);
  console.log(`   Vulnerabilidades: ${analysis.securityVulnerabilities.length}`);
  console.log(`   Recomendaciones: ${analysis.recommendations.length}`);

  // Crear issues automáticamente
  console.log(`\n📝 CREANDO ISSUES AUTOMÁTICOS`);
  for (const vuln of analysis.securityVulnerabilities.slice(0, 2)) {
    await github.createIssue(
      'anthropics',
      'anthropic-sdk-python',
      `Security: ${vuln}`,
      `Vulnerability found by Jarvis: ${vuln}`,
      ['security', 'critical']
    );
  }

  // Estadísticas
  const stats = github.getStatistics();
  console.log(`\n✅ GitHub Statistics:`);
  console.log(`   Análisis: ${stats.analysisPerformed}`);
  console.log(`   Issues creados: ${stats.issuesCreated}`);
  console.log(`   PRs analizados: ${stats.prsAnalyzed}`);
}

/**
 * DEMO 2: Webhook Manager
 */
async function demo2_WebhookManager() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 2: WEBHOOK MANAGER`);
  console.log(`${'='.repeat(70)}\n`);

  const webhooks = new WebhookManager();

  // Registrar webhooks
  console.log(`🪝 Registrando webhooks...\n`);

  const webhook1 = webhooks.registerWebhook(
    'https://example.com/webhook/evolution',
    ['genome_evolution', 'model_deployment'],
    { retries: 5 }
  );

  const webhook2 = webhooks.registerWebhook(
    'https://example.com/webhook/tasks',
    ['task_completed', 'task_failed'],
    { retries: 3 }
  );

  // Disparar eventos
  console.log(`\n📤 Disparando eventos...\n`);

  await webhooks.simulateTaskCompletedEvent(
    'task-123',
    'Analyze code security',
    1200
  );

  await webhooks.simulateMemoryConsolidationEvent(50, 3);

  await webhooks.simulateGenomeEvolutionEvent();

  // Estadísticas
  const webhookStats = webhooks.getStatistics();
  console.log(`\n✅ Webhook Statistics:`);
  console.log(`   Webhooks activos: ${webhookStats.activeWebhooks}`);
  console.log(`   Entregas exitosas: ${webhookStats.successfulDeliveries}`);
  console.log(`   Entregas fallidas: ${webhookStats.failedDeliveries}`);
  console.log(`   Tasa de éxito: ${webhookStats.successRate.toFixed(1)}%`);
}

/**
 * DEMO 3: Database Layer
 */
async function demo3_DatabaseLayer() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 3: DATABASE LAYER`);
  console.log(`${'='.repeat(70)}\n`);

  const db = new DatabaseLayer({
    type: 'sqlite',
    database: 'jarvis.db',
  });

  // Conectar
  console.log(`🗄️  Conectando a base de datos...\n`);
  await db.connect();

  // Guardar datos
  console.log(`💾 Guardando datos...\n`);

  for (let i = 0; i < 5; i++) {
    await db.saveTrainingDataPoint('dataset-1', {
      userQuery: `Query ${i}`,
      qualityScore: 80 + Math.random() * 15,
      taskCategory: 'security',
      complexity: 'moderate',
      executionTime: 1200 + Math.random() * 500,
    });
  }

  // Guardar tareas
  await db.saveTask({
    id: 'task-001',
    query: 'Analyze security',
    status: 'completed',
    result: { success: true },
    executionTime: 1200,
    createdAt: Date.now(),
    completedAt: Date.now(),
  });

  // Estadísticas
  const dbStats = await db.getStatistics();
  console.log(`\n✅ Database Statistics:`);
  console.log(`   Puntos de entrenamiento: ${dbStats.trainingDataPoints}`);
  console.log(`   Modelos guardados: ${dbStats.storedModels}`);
  console.log(`   Tareas totales: ${dbStats.totalTasks}`);
  console.log(`   Tareas completadas: ${dbStats.completedTasks}`);

  // Desconectar
  await db.disconnect();
}

/**
 * DEMO 4: REST API Server
 */
async function demo4_RestApiServer() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 4: REST API SERVER`);
  console.log(`${'='.repeat(70)}\n`);

  const api = new RestApiServer(3000);

  // Iniciar servidor
  api.start();

  // Crear tareas
  console.log(`\n📋 Creando tareas a través de API...\n`);

  const task1 = await api.createTask(
    'Analyze code security',
    { filePath: '/auth.ts' },
    5000
  );

  const task2 = await api.createTask(
    'Write documentation',
    { module: 'auth' },
    3000
  );

  // Esperar procesamiento
  console.log(`\n⏳ Esperando procesamiento de tareas...`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Obtener métricas
  const metrics = api.getMetrics();
  console.log(`\n✅ API Metrics:`);
  console.log(`   Tasks procesadas: ${metrics.data?.tasksProcessed}`);
  console.log(`   Tasa de éxito: ${(metrics.data?.successRate * 100).toFixed(1)}%`);
  console.log(`   Tiempo promedio: ${metrics.data?.averageExecutionTime.toFixed(0)}ms`);

  // Detener servidor
  api.stop();
}

/**
 * DEMO 5: Integration Orchestrator
 */
async function demo5_IntegrationOrchestrator() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 5: INTEGRATION ORCHESTRATOR`);
  console.log(`${'='.repeat(70)}\n`);

  const orchestrator = new IntegrationOrchestrator();

  // Inicializar todas las integraciones
  console.log(`⚙️  Inicializando integraciones...\n`);

  await orchestrator.initialize({
    github: {
      token: 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    },
    api: {
      port: 3000,
    },
    database: {
      type: 'sqlite',
      database: 'jarvis.db',
    },
  });

  // Registrar webhook de evolución
  console.log(`\n🎯 Registrando webhook automático de evolución\n`);

  const webhookId = orchestrator.registerAutoEvolutionWebhook(
    'https://myserver.com/webhook/evolution'
  );

  // Ejecutar tarea
  console.log(`\n📋 Ejecutando tarea completa\n`);

  const task = await orchestrator.executeTask(
    'Analyze security of auth module',
    { module: 'auth' }
  );

  console.log(`   Task creada: ${task?.id}`);

  // Esperar un poco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Disparar evolución
  console.log(`\n🧬 Disparando evolución automática\n`);

  await orchestrator.triggerAutomaticEvolution();

  // Obtener estado
  console.log(`\n📊 Estado del sistema integrado\n`);

  const status = orchestrator.getSystemStatus();

  console.log(`   API: ${status.api ? '✅' : '⛔'}`);
  console.log(`   Webhooks: ${status.webhooks.totalWebhooks} registrados`);
  console.log(`   Database: ${status.database ? '✅' : '⛔'}`);

  // Obtener métricas
  const metrics = orchestrator.getGlobalMetrics();
  console.log(`\n✅ MÉTRICAS GLOBALES:`);
  console.log(`   Tasks procesadas: ${metrics.api?.tasksProcessed || 0}`);
  console.log(`   Success rate: ${(metrics.api?.successRate * 100 || 0).toFixed(1)}%`);
  console.log(`   Webhooks activos: ${metrics.webhooks?.activeWebhooks || 0}`);

  // Finalizar
  await orchestrator.shutdown();
}

/**
 * EJECUTAR TODOS LOS DEMOS
 */
async function runAllDemos() {
  console.log(`\n`);
  console.log(`${'█'.repeat(70)}`);
  console.log(`█ JARVIS INTEGRATION DEMOS (FASE 5)`);
  console.log(`█ Sistema integrado con GitHub, APIs y Webhooks`);
  console.log(`${'█'.repeat(70)}`);

  try {
    // Demo 1
    await demo1_GitHubIntegration();

    // Demo 2
    await demo2_WebhookManager();

    // Demo 3
    await demo3_DatabaseLayer();

    // Demo 4
    await demo4_RestApiServer();

    // Demo 5
    await demo5_IntegrationOrchestrator();

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎉 TODOS LOS DEMOS DE FASE 5 COMPLETADOS EXITOSAMENTE`);
    console.log(`${'='.repeat(70)}\n`);

    console.log(`
✅ JARVIS FASE 5 DEMOSTRADO:
   ✓ GitHub Integration funcionando
   ✓ Webhook Manager con eventos automáticos
   ✓ Database Layer persistiendo datos
   ✓ REST API Server escuchando
   ✓ Integration Orchestrator orquestando todo

🚀 Jarvis ahora es:
   • Completamente Agentico (FASE 1)
   • Multi-agente (FASE 2)
   • Con memoria persistente (FASE 3)
   • Con meta-learning automático (FASE 4)
   • Completamente integrado con APIs (FASE 5)

📊 Sistema completo en 5 fases:
   1. Constitutional AI (core)
   2. 8 Agentes especializados
   3. Triple Memory + Consolidación
   4. Meta-Learning + Fine-tuning
   5. GitHub + REST API + Webhooks + Database

🎯 Listo para:
   • Análisis automático de repositorios
   • Evolución automática disparada por webhooks
   • Persistencia de todo en base de datos
   • API REST para integración con otros sistemas
   • Monitoreo en tiempo real
    `);
  } catch (error) {
    console.error(`\n❌ Error en demos:`, error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export { runAllDemos };
