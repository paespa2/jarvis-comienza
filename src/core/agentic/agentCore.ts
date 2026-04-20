/**
 * AGENT CORE - Motor Agentico de Jarvis
 *
 * Implementa el loop agentico fundamental:
 * PLANNING → TOOL USE → OBSERVATION → REFLECTION → ITERATION
 *
 * INVARIANTE CRÍTICA:
 * TODAS las acciones pasan primero por validación constitucional.
 * Esto NO es negociable.
 */

import { ConstitutionalAI, validateBeforeExecution } from '../constitution/constitutionalAI';
import { ToolExecutor } from '../tools/toolExecutor';
import { ReasoningEngine } from '../thinking/reasoningEngine';

export interface AgentTask {
  id: string;
  description: string;
  objective: string;
  context: string;
  constraints: string[];
  expectedOutcome: string;
  maxIterations?: number;
}

export interface AgentIteration {
  stepNumber: number;
  phase: 'PLANNING' | 'TOOL_USE' | 'OBSERVATION' | 'REFLECTION' | 'COMPLETED' | 'FAILED';
  action: string;
  result: any;
  reasoning: string;
  timestamp: string;
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  finalOutput: string;
  iterations: AgentIteration[];
  totalSteps: number;
  executionTime: number;
  lessonLearned: string; // Para evolución
}

/**
 * AGENT CORE
 *
 * El motor que orquesta la ejecución agentica.
 * ✨ OPTIMIZACIÓN PHASE 3a: Reduced iterations (8→3) + Early exit logic
 */
export class AgentCore {
  private taskId: string;
  private iterations: AgentIteration[] = [];
  private maxIterations: number = 3; // OPTIMIZACIÓN: Reducido de 8 a 3
  private reasoning: ReasoningEngine;
  private tools: ToolExecutor;
  private confidenceScores: number[] = []; // Track confidence for early exit

  constructor() {
    this.taskId = `task-${Date.now()}`;
    this.reasoning = new ReasoningEngine();
    this.tools = new ToolExecutor();
  }

  /**
   * PUNTO DE ENTRADA PRINCIPAL
   *
   * Ejecuta una tarea compleja mediante loop agentico.
   * @returns AgentResult con outputs, iteraciones y lecciones aprendidas
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    console.log(`\n🤖 INICIANDO AGENT CORE`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Objetivo: ${task.objective}`);
    console.log(`   Contexto: ${task.context}\n`);

    this.taskId = task.id;
    this.maxIterations = task.maxIterations || 3; // OPTIMIZACIÓN: Default reducido de 8 a 3
    this.iterations = [];

    try {
      // ETAPA 0: VALIDACIÓN CONSTITUCIONAL
      // ====================================
      console.log(`⚖️  VALIDACIÓN CONSTITUCIONAL`);
      const constValidation = await validateBeforeExecution(
        task.objective,
        'paespa', // siempre beneficiario es paespa
        'medium', // riesgo inicial
        true      // es proactivo
      );

      if (!constValidation.valid) {
        console.log(`❌ RECHAZO CONSTITUCIONAL`);
        console.log(constValidation.validation.overallReasoning);

        return {
          taskId: task.id,
          success: false,
          finalOutput: `Tarea rechazada por validación constitucional: ${constValidation.validation.overallReasoning}`,
          iterations: this.iterations,
          totalSteps: 1,
          executionTime: Date.now() - startTime,
          lessonLearned: `Acción propuesta violaría Constitución. Guardar patrón para evitar futuras violaciones.`,
        };
      }

      console.log(`✅ PASO VALIDACIÓN CONSTITUCIONAL\n`);

      // LOOP PRINCIPAL
      // ==============
      let iterationCount = 0;
      let lastPhaseOutput = '';
      this.confidenceScores = [];

      while (iterationCount < this.maxIterations) {
        iterationCount++;
        console.log(`\n📍 ITERACIÓN ${iterationCount}/${this.maxIterations}`);

        // FASE 1: PLANNING
        // ================
        console.log(`\n1️⃣  PLANNING`);
        const planIteration = await this.phase_Planning(task, lastPhaseOutput, iterationCount);
        this.iterations.push(planIteration);
        lastPhaseOutput = planIteration.result;

        if (planIteration.result === 'TASK_COMPLETE') {
          console.log(`   ✅ Planning indica: TAREA COMPLETA`);
          break; // Salir del loop
        }

        // FASE 2: TOOL USE
        // ================
        console.log(`\n2️⃣  TOOL USE`);
        const toolIteration = await this.phase_ToolUse(lastPhaseOutput);
        this.iterations.push(toolIteration);
        lastPhaseOutput = toolIteration.result;

        // FASE 3: OBSERVATION
        // ===================
        console.log(`\n3️⃣  OBSERVATION`);
        const observationIteration = await this.phase_Observation(toolIteration.result);
        this.iterations.push(observationIteration);
        lastPhaseOutput = observationIteration.result;

        // FASE 4: REFLECTION
        // ==================
        console.log(`\n4️⃣  REFLECTION`);
        const reflectionIteration = await this.phase_Reflection(
          task.objective,
          lastPhaseOutput,
          iterationCount
        );
        this.iterations.push(reflectionIteration);
        lastPhaseOutput = reflectionIteration.result;

        // OPTIMIZACIÓN PHASE 3a: Evaluar confianza para early exit
        // Extraer puntuación de confianza si está disponible
        const confidenceMatch = reflectionIteration.result.match(/confidence[:\s]+([0-9.]+)/i);
        if (confidenceMatch) {
          const confidence = parseFloat(confidenceMatch[1]);
          this.confidenceScores.push(confidence);

          // Early exit si confianza > 0.85 después de 2 iteraciones
          if (iterationCount >= 2 && confidence > 0.85) {
            console.log(`\n⚡ EARLY EXIT: Confianza ${confidence} > 0.85 después de ${iterationCount} iteraciones`);
            break;
          }
        }

        // Evaluar si reflejamos que estamos completos
        if (reflectionIteration.result.includes('TASK_COMPLETE')) {
          console.log(`   ✅ Reflexión indica: TAREA COMPLETA`);
          break;
        }
      }

      // FASE FINAL: SÍNTESIS
      // ====================
      console.log(`\n✨ SÍNTESIS FINAL`);
      const finalOutput = await this.phase_Synthesis(lastPhaseOutput, task.objective);

      return {
        taskId: task.id,
        success: true,
        finalOutput,
        iterations: this.iterations,
        totalSteps: this.iterations.length,
        executionTime: Date.now() - startTime,
        lessonLearned: await this.extractLesson(task, finalOutput),
      };
    } catch (error: any) {
      console.error(`❌ ERROR EN AGENT CORE:`, error.message);
      return {
        taskId: task.id,
        success: false,
        finalOutput: `Error durante ejecución: ${error.message}`,
        iterations: this.iterations,
        totalSteps: this.iterations.length,
        executionTime: Date.now() - startTime,
        lessonLearned: `Error detectado. Revisar logs para debugging.`,
      };
    }
  }

  /**
   * FASE 1: PLANNING
   *
   * Desglosar tarea en subtareas y estrategia de ejecución.
   */
  private async phase_Planning(
    task: AgentTask,
    previousContext: string,
    iteration: number
  ): Promise<AgentIteration> {
    console.log(`   Desglosando objetivo en subtareas...`);

    const planning = await this.reasoning.plan(
      task.objective,
      task.context,
      previousContext,
      iteration
    );

    console.log(`   Plan generado:`);
    console.log(`   ${planning.steps.slice(0, 2).map(s => `- ${s}`).join('\n   ')}`);

    if (planning.isTaskComplete) {
      return {
        stepNumber: this.iterations.length + 1,
        phase: 'PLANNING',
        action: 'Analizar si tarea está completa',
        result: 'TASK_COMPLETE',
        reasoning: planning.reasoning,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      stepNumber: this.iterations.length + 1,
      phase: 'PLANNING',
      action: `Plan: ${planning.steps.join(' → ')}`,
      result: JSON.stringify(planning.steps),
      reasoning: planning.reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * FASE 2: TOOL USE
   *
   * Seleccionar y ejecutar herramienta apropiada.
   */
  private async phase_ToolUse(plan: string): Promise<AgentIteration> {
    console.log(`   Identificando herramienta apropiada...`);

    const toolDecision = await this.tools.selectTool(plan);

    if (!toolDecision) {
      console.log(`   ⚠️  No se encontró herramienta apropiada`);
      return {
        stepNumber: this.iterations.length + 1,
        phase: 'TOOL_USE',
        action: 'Buscar herramienta',
        result: 'NO_TOOL_FOUND',
        reasoning: 'No hay herramienta disponible para este paso del plan',
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`   📦 Herramienta: ${toolDecision.name}`);
    const toolResult = await this.tools.execute(toolDecision.name, toolDecision.args);

    console.log(`   ✅ Resultado obtenido`);

    return {
      stepNumber: this.iterations.length + 1,
      phase: 'TOOL_USE',
      action: `Ejecutar: ${toolDecision.name}(${JSON.stringify(toolDecision.args)})`,
      result: toolResult,
      reasoning: `Herramienta ejecutada exitosamente`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * FASE 3: OBSERVATION
   *
   * Analizar resultado de herramienta.
   */
  private async phase_Observation(toolResult: any): Promise<AgentIteration> {
    console.log(`   Analizando resultado...`);

    const analysis = await this.reasoning.observe(toolResult);

    console.log(`   📊 Observación: ${analysis.summary}`);

    return {
      stepNumber: this.iterations.length + 1,
      phase: 'OBSERVATION',
      action: 'Analizar resultado',
      result: analysis.summary,
      reasoning: analysis.details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * FASE 4: REFLECTION
   *
   * Reflexionar sobre progreso y determinar próximo paso.
   */
  private async phase_Reflection(
    objective: string,
    currentState: string,
    iteration: number
  ): Promise<AgentIteration> {
    console.log(`   Reflexionando sobre progreso...`);

    const reflection = await this.reasoning.reflect(
      objective,
      currentState,
      iteration,
      this.maxIterations
    );

    console.log(`   🤔 Reflexión: ${reflection.assessment}`);

    return {
      stepNumber: this.iterations.length + 1,
      phase: 'REFLECTION',
      action: 'Evaluar progreso',
      result: reflection.nextStep,
      reasoning: reflection.assessment,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * FASE FINAL: SYNTHESIS
   *
   * Sintetizar todos los resultados en output final.
   */
  private async phase_Synthesis(currentState: string, objective: string): Promise<string> {
    console.log(`   Sintetizando resultados finales...`);

    const synthesis = await this.reasoning.synthesize(currentState, objective);

    console.log(`   ✨ Salida final generada`);

    return synthesis.output;
  }

  /**
   * EXTRACCIÓN DE LECCIÓN APRENDIDA
   *
   * Para el sistema de evolución (Artículo 4)
   */
  private async extractLesson(task: AgentTask, finalOutput: string): Promise<string> {
    const patterns = [
      'Tool más efectiva',
      'Número óptimo de iteraciones',
      'Estrategia más eficiente',
    ];

    return `En la tarea "${task.objective}", aprendí que el enfoque iterativo fue efectivo.
Para tareas similares, comenzar con Planning detallado reduce iteraciones necesarias.`;
  }
}

/**
 * FACTORY PARA CREAR AGENTES
 */
export function createAgent(): AgentCore {
  return new AgentCore();
}
