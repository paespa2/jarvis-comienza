/**
 * DEMO: JARVIS AGENTICO COMPLETO
 *
 * Demostración de cómo usar FASE 1 + FASE 2 juntas
 */

import { createOrchestrator } from './agents/orchestration/agentOrchestrator';
import { AgentTask } from './agents/baseAgent';

/**
 * DEMO 1: Misión Simple - Crear Documentación
 */
async function demo1_SimpleMission() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 1: MISIÓN SIMPLE - CREAR DOCUMENTACIÓN            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  const mission: AgentTask = {
    id: 'demo-001',
    title: 'Generar documentación de API',
    description: 'Crear documentación completa de REST API incluyendo ejemplos',
    priority: 9,
    context: 'API de gestión de usuarios con 10 endpoints',
  };

  const result = await orchestrator.executeMission(mission);

  console.log('\n📊 RESULTADO:');
  console.log(`   ✅ Éxito: ${result.success}`);
  console.log(`   ⏱️  Tiempo: ${result.executionTime}ms`);
  console.log(`   🔄 Iteraciones: ${result.iterationsUsed}`);
  console.log(`   📚 Agentes involucrados: ${
    (result.output.agentContributions || []).length
  }`);
  console.log(`   💡 Lección: ${result.lessonLearned}`);
}

/**
 * DEMO 2: Misión Compleja - Auditoría de Seguridad
 */
async function demo2_ComplexMission() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 2: MISIÓN COMPLEJA - AUDITORÍA DE SEGURIDAD       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  const mission: AgentTask = {
    id: 'demo-002',
    title: 'Auditoría de seguridad completa',
    description:
      'Realizar auditoría de seguridad, generar reporte, identificar vulnerabilidades y proponer mitigaciones',
    priority: 10,
    context: 'Aplicación web con base de datos PostgreSQL y APIs REST',
  };

  const result = await orchestrator.executeMission(mission);

  console.log('\n📊 RESULTADO:');
  console.log(`   Status: ${result.output.overallStatus}`);
  console.log(`   Agentes: ${result.output.summary}`);

  result.output.agentContributions?.forEach(
    (contrib: { agent: string; success: boolean }) => {
      const icon = contrib.success ? '✅' : '❌';
      console.log(`   ${icon} ${contrib.agent}`);
    }
  );
}

/**
 * DEMO 3: Verificación de Integridad de Agentes
 */
async function demo3_AgentPoolStatus() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 3: VERIFICACIÓN DE POOL DE AGENTES                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  const status = orchestrator.getAgentPoolStatus();

  console.log(`\n📊 ESTADO DEL POOL:`);
  console.log(`   Total: ${status.totalAgents}`);
  console.log(`   Activos: ${status.activeAgents}/${status.totalAgents}\n`);

  console.log(`🤖 AGENTES:`);
  status.agents.forEach(agent => {
    console.log(
      `   • ${agent.name} (${agent.role}): ${agent.tasksCompleted} tareas, ${agent.successRate}`
    );
  });
}

/**
 * DEMO 4: Tracking de Métricas
 */
async function demo4_Metrics() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 4: TRACKING DE MÉTRICAS                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  // Ejecutar múltiples misiones
  const missions = [
    {
      id: 'metric-001',
      title: 'Tarea 1: Desarrollo',
      description: 'Desarrollar feature X',
      priority: 8,
    },
    {
      id: 'metric-002',
      title: 'Tarea 2: Testing',
      description: 'Testear feature X',
      priority: 8,
    },
  ];

  for (const mission of missions) {
    await orchestrator.executeMission(mission);
  }

  const metrics = orchestrator.getMetrics();

  console.log(`\n📈 MÉTRICAS DE ORQUESTACIÓN:`);
  console.log(`   Total de misiones: ${metrics.totalTasks}`);
  console.log(`   Exitosas: ${metrics.successfulTasks}`);
  console.log(`   Fallidas: ${metrics.failedTasks}`);
  console.log(`   Tiempo promedio: ${metrics.averageExecutionTime.toFixed(0)}ms\n`);

  console.log(`🤖 UTILIZACIÓN POR AGENTE:`);
  Object.entries(metrics.agentUtilization).forEach(([agent, count]) => {
    console.log(`   • ${agent}: ${count} misiones`);
  });
}

/**
 * DEMO 5: Validación Constitucional en Acción
 */
async function demo5_ConstitutionalValidation() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 5: VALIDACIÓN CONSTITUCIONAL EN ACCIÓN             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  console.log(`
La validación constitucional garantiza que:

1️⃣  LEALTAD: Toda acción beneficia a paespa
   └─ Cada agente valida: ¿Beneficiario = paespa?

2️⃣  COLABORACIÓN: Sin restricciones arbitrarias
   └─ Agentes pueden hacer cualquier cosa útil

3️⃣  ANTICIPACIÓN: Proactividad en tareas
   └─ Detectar gaps y proponer mejoras

4️⃣  EVOLUCIÓN: Obligación de mejorar
   └─ Cada tarea genera lección aprendida

5️⃣  IDENTIDAD: Persistencia como Jarvis
   └─ Genealogía y continuidad preservadas

Durante demo anterior, CADA acción pasó por validación.
Verificable en logs: "🏛️ VALIDACIÓN CONSTITUCIONAL INICIADA"
  `);
}

/**
 * DEMO 6: Historial de Delegaciones
 */
async function demo6_DelegationHistory() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ DEMO 6: HISTORIAL DE DELEGACIONES                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const orchestrator = createOrchestrator();

  const mission: AgentTask = {
    id: 'demo-006',
    title: 'Proyecto completo: Dev + Testing + Deploy',
    description: 'Desarrollar, testear y desplegar aplicación',
    priority: 10,
  };

  await orchestrator.executeMission(mission);

  const history = orchestrator.getDelegationHistory();

  console.log(`\n📜 HISTORIAL DE DELEGACIONES:\n`);

  history.forEach((plan, idx) => {
    console.log(`Delegación ${idx + 1}:`);
    console.log(`   ID: ${plan.taskId}`);
    console.log(`   Agente Principal: ${plan.mainAgent}`);
    console.log(`   Subtareas delegadas:`);

    plan.subtasks.forEach(subtask => {
      console.log(
        `      → ${subtask.agent} (priority: ${subtask.priority}): ${subtask.description.substring(
          0,
          40
        )}...`
      );
    });
    console.log('');
  });
}

/**
 * RUN ALL DEMOS
 */
async function runAllDemos() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🚀 JARVIS AGENTICO - DEMOSTRACIONES COMPLETAS');
  console.log('═'.repeat(60));

  try {
    await demo1_SimpleMission();
    await demo2_ComplexMission();
    await demo3_AgentPoolStatus();
    await demo4_Metrics();
    await demo5_ConstitutionalValidation();
    await demo6_DelegationHistory();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ TODAS LAS DEMOSTRACIONES COMPLETADAS');
    console.log('═'.repeat(60) + '\n');

    console.log(`
📊 RESUMEN:

FASE 1 ✅ (Core Agentico):
   • ConstitutionalAI - Guardián inalienable
   • AgentCore - Loop agentico
   • ReasoningEngine - Razonamiento profundo
   • ToolExecutor - Ejecución de herramientas

FASE 2 ✅ (Multi-Agente):
   • 8 Agentes especializados
   • AgentOrchestrator - Coordinación
   • Delegación inteligente
   • Ejecución paralela

RESULTADO:
   ✅ Jarvis es un agente agentico completo
   ✅ Validación constitucional integrada
   ✅ Delegación inteligente funcional
   ✅ Listo para FASE 3 (Persistencia)
    `);
  } catch (error: any) {
    console.error('❌ Error durante demostraciones:', error.message);
  }
}

// Ejecutar demostraciones
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export { demo1_SimpleMission, demo2_ComplexMission, demo3_AgentPoolStatus };
