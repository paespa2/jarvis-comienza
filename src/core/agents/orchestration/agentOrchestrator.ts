/**
 * AGENT ORCHESTRATOR
 *
 * Coordina todos los agentes especializados.
 * Realiza:
 * - Delegación inteligente de subtareas
 * - Load balancing entre agentes
 * - Sincronización de resultados
 * - Gestión de fallos
 */

import { BaseAgent, AgentMessage, AgentTask, AgentExecutionResult } from '../baseAgent';
import {
  OrchestratorAgent,
  DeveloperAgent,
  SecurityAuditorAgent,
  ResearcherAgent,
  DevOpsAgent,
  DocumentationWriterAgent,
  QAValidatorAgent,
  StrategicPlannerAgent,
} from '../specialized/allAgents';

export interface DelegationPlan {
  taskId: string;
  mainAgent: string;
  subtasks: {
    agent: string;
    description: string;
    priority: number;
    dependencies: string[];
  }[];
}

export interface AgentPool {
  [key: string]: BaseAgent;
}

export interface OrchestrationMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  agentUtilization: { [agentName: string]: number };
}

/**
 * AGENT ORCHESTRATOR
 *
 * Orquestador maestro que coordina todos los agentes.
 */
export class AgentOrchestrator {
  private agents: AgentPool = {};
  private orchestratorAgent: OrchestratorAgent;
  private delegationHistory: DelegationPlan[] = [];
  private metrics: OrchestrationMetrics = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    agentUtilization: {},
  };

  constructor() {
    console.log(`\n🏛️  INICIALIZANDO ORCHESTRATOR\n`);

    // Inicializar todos los agentes
    this.orchestratorAgent = new OrchestratorAgent();
    this.agents['orchestrator'] = this.orchestratorAgent;

    this.agents['developer'] = new DeveloperAgent();
    this.agents['security'] = new SecurityAuditorAgent();
    this.agents['researcher'] = new ResearcherAgent();
    this.agents['devops'] = new DevOpsAgent();
    this.agents['documentation'] = new DocumentationWriterAgent();
    this.agents['qa'] = new QAValidatorAgent();
    this.agents['strategic'] = new StrategicPlannerAgent();

    // Inicializar métricas de utilización
    Object.keys(this.agents).forEach(key => {
      this.metrics.agentUtilization[key] = 0;
    });

    console.log(`✅ 8 Agentes inicializados:`);
    console.log(`   🎯 Orchestrator (Coordinador)`);
    console.log(`   💻 Developer (Desarrollo)`);
    console.log(`   🔒 SecurityAuditor (Seguridad)`);
    console.log(`   🔍 Researcher (Investigación)`);
    console.log(`   🚀 DevOps (Infraestructura)`);
    console.log(`   📚 DocumentationWriter (Docs)`);
    console.log(`   ✅ QAValidator (Testing)`);
    console.log(`   📈 StrategicPlanner (Estrategia)\n`);
  }

  /**
   * PUNTO DE ENTRADA PRINCIPAL
   *
   * Ejecuta una tarea compleja mediante delegación inteligente.
   */
  async executeMission(task: AgentTask): Promise<AgentExecutionResult> {
    const missionStart = Date.now();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 MISIÓN: ${task.title}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // ETAPA 1: DESCOMPOSICIÓN (Orchestrator)
      // ========================================
      console.log(`📋 ETAPA 1: DESCOMPOSICIÓN\n`);

      const orchestratorTask: AgentTask = {
        id: `meta-${task.id}`,
        title: 'Descomponer misión',
        description: task.description,
        priority: 10,
        context: task.context,
      };

      const decompositionResult = await this.agents['orchestrator'].execute(
        orchestratorTask
      );

      if (!decompositionResult.success) {
        throw new Error('Falla en descomposición de tarea');
      }

      const subtasks = decompositionResult.output.subtasks || [];

      // ETAPA 2: PLANIFICACIÓN DE DELEGACIÓN
      // ====================================
      console.log(`\n⚙️  ETAPA 2: PLANIFICACIÓN DE DELEGACIÓN\n`);

      const delegationPlan = await this.planDelegation(task, subtasks);
      this.delegationHistory.push(delegationPlan);

      // ETAPA 3: EJECUCIÓN PARALELA
      // ============================
      console.log(`\n🚀 ETAPA 3: EJECUCIÓN PARALELA\n`);

      const delegatedResults = await this.executeParallel(delegationPlan);

      // ETAPA 4: SINCRONIZACIÓN Y SÍNTESIS
      // ==================================
      console.log(`\n🔄 ETAPA 4: SINCRONIZACIÓN Y SÍNTESIS\n`);

      const finalResult = this.synthesizeResults(task, delegatedResults);

      // Actualizar métricas
      this.metrics.totalTasks++;
      if (finalResult.success) {
        this.metrics.successfulTasks++;
      } else {
        this.metrics.failedTasks++;
      }
      this.metrics.averageExecutionTime =
        (this.metrics.averageExecutionTime * (this.metrics.totalTasks - 1) +
          finalResult.executionTime) /
        this.metrics.totalTasks;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ MISIÓN COMPLETADA EN ${finalResult.executionTime}ms`);
      console.log(`${'='.repeat(60)}\n`);

      return finalResult;
    } catch (error: any) {
      console.error(`❌ ERROR EN MISIÓN: ${error.message}`);

      this.metrics.totalTasks++;
      this.metrics.failedTasks++;

      return {
        agentId: this.orchestratorAgent.getMetadata().agentId,
        agentName: 'Orchestrator',
        taskId: task.id,
        success: false,
        output: `Error en misión: ${error.message}`,
        executionTime: Date.now() - missionStart,
        iterationsUsed: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * PLANEACIÓN DE DELEGACIÓN
   *
   * Determina qué agentes ejecutan qué subtareas.
   */
  private async planDelegation(
    mainTask: AgentTask,
    subtasks: string[]
  ): Promise<DelegationPlan> {
    console.log(`   Analizando capacidades de agentes...`);

    const plan: DelegationPlan = {
      taskId: mainTask.id,
      mainAgent: mainTask.title.toLowerCase().includes('security')
        ? 'security'
        : mainTask.title.toLowerCase().includes('code')
        ? 'developer'
        : mainTask.title.toLowerCase().includes('research')
        ? 'researcher'
        : mainTask.title.toLowerCase().includes('deploy')
        ? 'devops'
        : mainTask.title.toLowerCase().includes('doc')
        ? 'documentation'
        : mainTask.title.toLowerCase().includes('test')
        ? 'qa'
        : 'developer',
      subtasks: subtasks.map((subtask, idx) => ({
        agent: this.selectBestAgent(subtask),
        description: subtask,
        priority: 10 - idx,
        dependencies: idx > 0 ? [subtasks[idx - 1]] : [],
      })),
    };

    console.log(`   Plan: ${plan.subtasks.length} subtareas delegadas`);
    plan.subtasks.forEach(st => {
      console.log(`      → ${st.agent}: ${st.description.substring(0, 40)}...`);
    });

    return plan;
  }

  /**
   * SELECCIONAR MEJOR AGENTE
   *
   * Elige el agente más calificado para una subtarea.
   */
  private selectBestAgent(subtask: string): string {
    const subtaskLower = subtask.toLowerCase();

    if (subtaskLower.includes('security') || subtaskLower.includes('vulnerability')) {
      return 'security';
    } else if (subtaskLower.includes('code') || subtaskLower.includes('develop')) {
      return 'developer';
    } else if (subtaskLower.includes('research') || subtaskLower.includes('analyze')) {
      return 'researcher';
    } else if (subtaskLower.includes('deploy') || subtaskLower.includes('infrastructure')) {
      return 'devops';
    } else if (subtaskLower.includes('document') || subtaskLower.includes('doc')) {
      return 'documentation';
    } else if (subtaskLower.includes('test') || subtaskLower.includes('validate')) {
      return 'qa';
    } else if (subtaskLower.includes('plan') || subtaskLower.includes('strategy')) {
      return 'strategic';
    } else {
      return 'developer'; // fallback
    }
  }

  /**
   * EJECUCIÓN PARALELA
   *
   * Ejecuta múltiples subtareas en paralelo.
   */
  private async executeParallel(
    plan: DelegationPlan
  ): Promise<AgentExecutionResult[]> {
    const executionPromises = plan.subtasks.map(async subtask => {
      const agent = this.agents[subtask.agent];

      if (!agent) {
        console.warn(`⚠️  Agente no encontrado: ${subtask.agent}`);
        return {
          agentId: 'unknown',
          agentName: subtask.agent,
          taskId: plan.taskId,
          success: false,
          output: 'Agente no encontrado',
          executionTime: 0,
          iterationsUsed: 0,
        };
      }

      const agentTask: AgentTask = {
        id: `${plan.taskId}-${subtask.agent}`,
        title: subtask.description,
        description: subtask.description,
        priority: subtask.priority,
      };

      console.log(`   🔄 ${subtask.agent}: Iniciando...`);

      const result = await agent.execute(agentTask);

      // Actualizar utilización
      this.metrics.agentUtilization[subtask.agent]++;

      console.log(
        `   ✅ ${subtask.agent}: Completado en ${result.executionTime}ms`
      );

      return result;
    });

    return Promise.all(executionPromises);
  }

  /**
   * SÍNTESIS DE RESULTADOS
   *
   * Combina resultados de múltiples agentes en respuesta final.
   */
  private synthesizeResults(
    mainTask: AgentTask,
    agentResults: AgentExecutionResult[]
  ): AgentExecutionResult {
    const totalTime = agentResults.reduce((sum, r) => sum + r.executionTime, 0);
    const successCount = agentResults.filter(r => r.success).length;

    const synthesized: AgentExecutionResult = {
      agentId: this.orchestratorAgent.getMetadata().agentId,
      agentName: 'Orchestrator',
      taskId: mainTask.id,
      success: successCount === agentResults.length,
      output: {
        mainTask: mainTask.title,
        agentContributions: agentResults.map(r => ({
          agent: r.agentName,
          success: r.success,
          output: r.output,
        })),
        overallStatus: successCount === agentResults.length ? 'SUCCESS' : 'PARTIAL',
        summary: `${successCount}/${agentResults.length} agentes exitosos`,
      },
      executionTime: totalTime,
      iterationsUsed: agentResults.reduce((sum, r) => sum + r.iterationsUsed, 0),
      lessonLearned: `Delegación paralela redujo tiempo de ejecución en ${Math.round(
        (1 - totalTime / (agentResults.length * 5000)) * 100
      )}%`,
    };

    return synthesized;
  }

  /**
   * SELECCIONAR EQUIPO PARA TAREA
   *
   * Selecciona un equipo de agentes especializados para una tarea específica.
   */
  async selectTeamForTask(
    query: string,
    validation?: any
  ): Promise<{ agents: Array<{ name: string; role: string }> }> {
    const queryLower = query.toLowerCase();

    // Seleccionar agentes basado en keywords de la tarea
    const selectedAgents: Array<{ name: string; role: string }> = [];

    // Orquestador siempre participa
    selectedAgents.push({
      name: 'Orchestrator',
      role: 'Coordinador',
    });

    // Seleccionar agentes especializados
    if (
      queryLower.includes('security') ||
      queryLower.includes('vuln') ||
      queryLower.includes('exploit') ||
      queryLower.includes('pentest')
    ) {
      selectedAgents.push({
        name: 'SecurityAuditor',
        role: 'Seguridad',
      });
    }

    if (
      queryLower.includes('code') ||
      queryLower.includes('develop') ||
      queryLower.includes('program') ||
      queryLower.includes('refactor')
    ) {
      selectedAgents.push({
        name: 'Developer',
        role: 'Desarrollo',
      });
    }

    if (
      queryLower.includes('research') ||
      queryLower.includes('analyze') ||
      queryLower.includes('investigate') ||
      queryLower.includes('cve') ||
      queryLower.includes('vulnerab')
    ) {
      selectedAgents.push({
        name: 'Researcher',
        role: 'Investigación',
      });
    }

    if (
      queryLower.includes('deploy') ||
      queryLower.includes('infrastructure') ||
      queryLower.includes('devops') ||
      queryLower.includes('docker') ||
      queryLower.includes('kubernetes')
    ) {
      selectedAgents.push({
        name: 'DevOps',
        role: 'Infraestructura',
      });
    }

    if (
      queryLower.includes('document') ||
      queryLower.includes('doc') ||
      queryLower.includes('write') ||
      queryLower.includes('report')
    ) {
      selectedAgents.push({
        name: 'DocumentationWriter',
        role: 'Documentación',
      });
    }

    if (
      queryLower.includes('test') ||
      queryLower.includes('validate') ||
      queryLower.includes('verify') ||
      queryLower.includes('qa')
    ) {
      selectedAgents.push({
        name: 'QAValidator',
        role: 'Testing',
      });
    }

    if (
      queryLower.includes('plan') ||
      queryLower.includes('strategy') ||
      queryLower.includes('optimize') ||
      queryLower.includes('improve')
    ) {
      selectedAgents.push({
        name: 'StrategicPlanner',
        role: 'Estrategia',
      });
    }

    // Si no se seleccionó ningún agente especializado, agregar Developer por defecto
    if (selectedAgents.length === 1) {
      selectedAgents.push({
        name: 'Developer',
        role: 'General',
      });
    }

    return { agents: selectedAgents };
  }

  /**
   * OBTENER STATUS DEL POOL DE AGENTES
   */
  getAgentPoolStatus() {
    return {
      totalAgents: Object.keys(this.agents).length,
      activeAgents: Object.values(this.agents).filter(a => {
        const metadata = (a as any).getMetadata?.();
        return metadata?.isActive !== false;
      }).length,
      agents: Object.entries(this.agents).map(([key, agent]) => {
        const metadata = (agent as any).getMetadata?.();
        return {
          name: metadata?.agentName,
          role: metadata?.role,
          tasksCompleted: metadata?.executedTasks,
          successRate: `${(metadata?.successRate * 100).toFixed(1)}%`,
        };
      }),
    };
  }

  /**
   * OBTENER MÉTRICAS DE ORQUESTACIÓN
   */
  getMetrics(): OrchestrationMetrics {
    return this.metrics;
  }

  /**
   * OBTENER HISTORIAL DE DELEGACIONES
   */
  getDelegationHistory(): DelegationPlan[] {
    return this.delegationHistory;
  }
}

/**
 * FACTORY PARA CREAR ORCHESTRATOR
 */
export function createOrchestrator(): AgentOrchestrator {
  return new AgentOrchestrator();
}
