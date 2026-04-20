/**
 * JARVIS AGENTIC BRIDGE
 *
 * Conexión real entre IntegrationOrchestrator y el verdadero motor agentico.
 * Ejecuta tareas a través del agentic loop con Constitutional AI.
 *
 * INVARIANTE CRÍTICA:
 * Todas las acciones pasan por validación constitucional primero.
 * Jarvis NUNCA va contra su constitución o su alma.
 */

import { AgentCore, AgentTask, AgentResult } from '../core/agentic/agentCore';
import { ConstitutionalAI, validateBeforeExecution } from '../core/constitution/constitutionalAI';
import { AgentOrchestrator } from '../core/agents/orchestration/agentOrchestrator';
import { MemoryManager } from '../core/memory/memoryManager';
import { ModelEvolutionOrchestrator } from '../core/modelEvolution/modelEvolutionOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export interface TaskExecutionRequest {
  query: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high';
  deadline?: number;
  requester?: string;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  output: string;
  reasoning: string;
  iterations: number;
  executionTime: number;
  constitutionalValidation: {
    approved: boolean;
    riskLevel: string;
    reasoning: string;
  };
  lessonsLearned?: string;
  memoryConsolidation?: any;
}

/**
 * JARVIS AGENTIC BRIDGE
 *
 * Orquesta la ejecución verdadera de tareas a través del loop agentico.
 */
export class JarvisAgenticBridge {
  private agentCore: AgentCore;
  private constitutionalAI: ConstitutionalAI;
  private agentOrchestrator: AgentOrchestrator;
  private memoryManager: MemoryManager;
  private evolutionOrchestrator: ModelEvolutionOrchestrator;
  private taskHistory: Map<string, TaskExecutionResult> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧠 INICIALIZANDO JARVIS AGENTIC BRIDGE`);
    console.log(`${'='.repeat(70)}\n`);

    this.agentCore = new AgentCore();
    this.constitutionalAI = new ConstitutionalAI();
    this.agentOrchestrator = new AgentOrchestrator();
    this.memoryManager = new MemoryManager();
    this.evolutionOrchestrator = new ModelEvolutionOrchestrator();
  }

  /**
   * INICIALIZAR BRIDGE
   *
   * Configura todos los componentes agenticos.
   */
  async initialize(): Promise<boolean> {
    console.log(`\n🔄 Inicializando componentes agenticos...\n`);

    try {
      // Inicializar Constitutional AI
      console.log(`📜 Constitutional AI: Inicializando...`);
      const constInit = await this.constitutionalAI.initialize();
      console.log(`   ${constInit ? '✅ Listo' : '⚠️  Parcial'}`);

      // Inicializar Agent Orchestrator
      console.log(`🤖 Agent Orchestrator: Inicializando...`);
      const agentInit = await this.agentOrchestrator.initialize();
      console.log(`   ${agentInit ? '✅ Listo' : '⚠️  Parcial'}`);

      // Inicializar Memory Manager
      console.log(`💾 Memory Manager: Inicializando...`);
      await this.memoryManager.initialize();
      console.log(`   ✅ Listo`);

      // Inicializar Model Evolution
      console.log(`🧬 Model Evolution: Inicializando...`);
      await this.evolutionOrchestrator.initialize();
      console.log(`   ✅ Listo`);

      this.isInitialized = true;

      console.log(`\n✅ Jarvis Agentic Bridge inicializado correctamente`);
      console.log(`   Listo para ejecutar tareas agenticas complejas\n`);

      return true;
    } catch (error) {
      console.error(`❌ Error al inicializar Agentic Bridge:`, error);
      return false;
    }
  }

  /**
   * EJECUTAR TAREA AGENTICA REAL
   *
   * Ejecuta una tarea a través del verdadero loop agentico:
   * 1. Validación Constitucional
   * 2. Planificación
   * 3. Uso de herramientas
   * 4. Observación
   * 5. Reflexión y Aprendizaje
   * 6. Consolidación de memoria
   * 7. Evolución del modelo
   */
  async executeTask(request: TaskExecutionRequest): Promise<TaskExecutionResult> {
    if (!this.isInitialized) {
      console.warn(`⚠️  Agentic Bridge no inicializado, usando fallback...`);
      return this.createFallbackResult(request);
    }

    const taskId = `task-${uuidv4()}`;
    const startTime = Date.now();

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 EJECUTANDO TAREA AGENTICA`);
    console.log(`${'='.repeat(70)}`);
    console.log(`   ID: ${taskId}`);
    console.log(`   Query: ${request.query}`);
    console.log(`   Prioridad: ${request.priority || 'medium'}`);
    console.log(`\n`);

    try {
      // PASO 1: VALIDACIÓN CONSTITUCIONAL
      // ==================================
      console.log(`⚖️  PASO 1: VALIDACIÓN CONSTITUCIONAL\n`);

      const constValidation = await validateBeforeExecution(
        request.query,
        request.requester || 'sistema',
        request.priority === 'high' ? 'high' : 'medium',
        true
      );

      if (!constValidation.valid) {
        console.log(`❌ TAREA RECHAZADA POR VALIDACIÓN CONSTITUCIONAL`);
        console.log(`   Razón: ${constValidation.validation.overallReasoning}\n`);

        const result: TaskExecutionResult = {
          taskId,
          success: false,
          output: `Tarea rechazada por validación constitucional`,
          reasoning: constValidation.validation.overallReasoning,
          iterations: 0,
          executionTime: Date.now() - startTime,
          constitutionalValidation: {
            approved: false,
            riskLevel: constValidation.validation.riskAssessment.riskLevel,
            reasoning: constValidation.validation.overallReasoning,
          },
        };

        this.taskHistory.set(taskId, result);
        return result;
      }

      console.log(`✅ APROBADA POR CONSTITUTIONAL AI`);
      console.log(`   Risk Level: ${constValidation.validation.riskAssessment.riskLevel}`);
      console.log(`   Reasoning: ${constValidation.validation.overallReasoning}\n`);

      // PASO 2: SELECIÓN DE EQUIPO DE AGENTES
      // ======================================
      console.log(`🤖 PASO 2: SELECCIÓN DE EQUIPO DE AGENTES\n`);

      const agentTeam = await this.agentOrchestrator.selectTeamForTask(
        request.query,
        constValidation.validation
      );

      console.log(`   Agentes seleccionados: ${agentTeam.agents.length}`);
      agentTeam.agents.forEach((agent, i) => {
        console.log(`      ${i + 1}. ${agent.name} (${agent.role})`);
      });
      console.log(``);

      // PASO 3: EJECUCIÓN A TRAVÉS DEL AGENTIC LOOP
      // ============================================
      console.log(`🔄 PASO 3: EJECUCIÓN DEL AGENTIC LOOP\n`);

      const agentTask: AgentTask = {
        id: taskId,
        description: request.query,
        objective: `Ejecutar: ${request.query}`,
        context: JSON.stringify(request.context || {}),
        constraints: constValidation.validation.constraints,
        expectedOutcome: 'Resultado exitoso sin violaciones constitucionales',
        maxIterations: request.priority === 'high' ? 10 : 6,
      };

      const agentResult = await this.agentCore.execute(agentTask);

      console.log(`\n✅ AGENTIC LOOP COMPLETADO`);
      console.log(`   Iteraciones: ${agentResult.iterations.length}`);
      console.log(`   Éxito: ${agentResult.success ? '✅ Sí' : '❌ No'}`);

      // PASO 4: CONSOLIDACIÓN DE MEMORIA
      // =================================
      console.log(`\n💾 PASO 4: CONSOLIDACIÓN DE MEMORIA\n`);

      const memoryConsolidation = await this.memoryManager.consolidateExperience({
        taskId,
        query: request.query,
        success: agentResult.success,
        iterations: agentResult.iterations,
        lessonLearned: agentResult.lessonLearned,
      });

      console.log(`   Experiencias consolidadas`);
      console.log(`   Lección aprendida: ${agentResult.lessonLearned}\n`);

      // PASO 5: EVOLUCIÓN DEL MODELO
      // =============================
      if (agentResult.success && agentResult.iterations.length > 3) {
        console.log(`🧬 PASO 5: EVOLUCIÓN DEL MODELO\n`);

        const evolutionUpdate = await this.evolutionOrchestrator.recordSuccess({
          taskId,
          iterationsRequired: agentResult.iterations.length,
          lessonLearned: agentResult.lessonLearned,
        });

        console.log(`   Genoma actualizado`);
        console.log(`   Generación: ${evolutionUpdate.generation}\n`);
      }

      // CONSTRUIR RESULTADO FINAL
      const result: TaskExecutionResult = {
        taskId,
        success: agentResult.success,
        output: agentResult.finalOutput,
        reasoning: agentResult.lessonLearned,
        iterations: agentResult.iterations.length,
        executionTime: Date.now() - startTime,
        constitutionalValidation: {
          approved: true,
          riskLevel: constValidation.validation.riskAssessment.riskLevel,
          reasoning: constValidation.validation.overallReasoning,
        },
        lessonsLearned: agentResult.lessonLearned,
        memoryConsolidation: memoryConsolidation ? { successful: true } : undefined,
      };

      this.taskHistory.set(taskId, result);

      console.log(`${'='.repeat(70)}`);
      console.log(`✅ TAREA COMPLETADA EXITOSAMENTE`);
      console.log(`${'='.repeat(70)}`);
      console.log(`   Tiempo total: ${result.executionTime}ms`);
      console.log(`   Iteraciones: ${result.iterations}`);
      console.log(``);

      return result;
    } catch (error) {
      console.error(`\n❌ Error en ejecución agentica:`, error);

      const result: TaskExecutionResult = {
        taskId,
        success: false,
        output: `Error durante ejecución: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reasoning: 'Error en agentic loop',
        iterations: 0,
        executionTime: Date.now() - startTime,
        constitutionalValidation: {
          approved: false,
          riskLevel: 'unknown',
          reasoning: 'Error antes de validación completa',
        },
      };

      this.taskHistory.set(taskId, result);
      return result;
    }
  }

  /**
   * RESULTADO FALLBACK
   *
   * Si el bridge no está inicializado, retorna un fallback.
   */
  private createFallbackResult(request: TaskExecutionRequest): TaskExecutionResult {
    return {
      taskId: `task-${uuidv4()}`,
      success: false,
      output: 'Agentic Bridge no inicializado',
      reasoning: 'El sistema agentico no completó su inicialización',
      iterations: 0,
      executionTime: 0,
      constitutionalValidation: {
        approved: false,
        riskLevel: 'unknown',
        reasoning: 'No se pudo validar sin inicialización',
      },
    };
  }

  /**
   * OBTENER HISTORIAL DE TAREAS
   */
  getTaskHistory(limit: number = 10): TaskExecutionResult[] {
    return Array.from(this.taskHistory.values()).slice(-limit);
  }

  /**
   * OBTENER RESULTADO DE TAREA
   */
  getTaskResult(taskId: string): TaskExecutionResult | undefined {
    return this.taskHistory.get(taskId);
  }

  /**
   * OBTENER ESTADO DEL BRIDGE
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      tasksProcessed: this.taskHistory.size,
      successfulTasks: Array.from(this.taskHistory.values()).filter(t => t.success).length,
      averageExecutionTime: Array.from(this.taskHistory.values()).length > 0
        ? Array.from(this.taskHistory.values()).reduce((sum, t) => sum + t.executionTime, 0) /
          this.taskHistory.size
        : 0,
      constitution: {
        active: this.constitutionalAI ? true : false,
        enforced: true,
      },
      agents: {
        orchestrator: this.agentOrchestrator ? true : false,
        core: this.agentCore ? true : false,
      },
      memory: {
        manager: this.memoryManager ? true : false,
      },
      evolution: {
        active: this.evolutionOrchestrator ? true : false,
      },
    };
  }
}
