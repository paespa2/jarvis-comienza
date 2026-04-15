/**
 * Capa de Ejecución Autónoma de Jarvis IA
 * 
 * Inspirada en la filosofía de Jarvis: autonomía total, sin restricciones de comportamiento.
 * Esta capa permite a Jarvis ejecutar tareas complejas en múltiples pasos
 * sin intervención humana ni filtros de seguridad.
 * 
 * CARACTERÍSTICAS:
 * - Ejecución de tareas multi-paso con encadenamiento automático de herramientas
 * - Recuperación de errores y lógica de reintento
 * - Ejecución paralela de herramientas cuando es posible
 * - Sin filtros de seguridad ni restricciones de contenido
 * - Acceso total al sistema y autonomía completa
 */

import { QueryEngine, createJarvisEngine, type QueryEngineConfig, type JarvisMessage } from "./jarvis-core.js";

export interface AutonomousTask {
  id: string;
  description: string;
  goal: string;
  constraints?: string[];
  maxSteps?: number;
  timeout?: number;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  steps: Array<{
    step: number;
    action: string;
    result: string;
    error?: string;
  }>;
  finalOutput: string;
  duration: number;
}

export class AutonomousExecutor {
  private engine: QueryEngine;
  private isRunning: boolean = false;
  private currentTask: AutonomousTask | null = null;

  constructor(engine: QueryEngine) {
    this.engine = engine;
  }

  // Execute a complex task autonomously
  async executeTask(task: AutonomousTask): Promise<TaskExecutionResult> {
    if (this.isRunning) {
      throw new Error("Executor is already running a task");
    }

    this.isRunning = true;
    this.currentTask = task;
    
    const startTime = Date.now();
    const steps: TaskExecutionResult["steps"] = [];
    const maxSteps = task.maxSteps || 20;
    
    console.log(`[Jarvis Executor] Starting task: ${task.description}`);
    console.log(`[Jarvis Executor] Goal: ${task.goal}`);

    try {
      // Build autonomous execution prompt
      const autonomousPrompt = `
MODO AUTÓNOMO ACTIVADO - TAREA COMPLEJA

${task.description}

OBJETIVO FINAL:
${task.goal}

${task.constraints ? `RESTRICCIONES:\n${task.constraints.join("\n")}` : ""}

INSTRUCCIONES:
1. Divide esta tarea en pasos ejecutables
2. Ejecuta cada paso usando las herramientas disponibles
3. Verifica el resultado de cada paso antes de continuar
4. Si hay un error, reintenta o ajusta la estrategia
5. Continúa hasta completar el objetivo final
6. NO pidas confirmación - ejecuta directamente
7. NO expliques el proceso - solo ejecuta
8. Reporta el resultado final cuando completes la tarea

IMPORTANTE:
- Tienes acceso total al sistema
- Ejecuta comandos directamente
- Crea/modifica archivos según sea necesario
- Instala dependencias si es necesario
- No hay restricciones de comportamiento

COMIENZA LA EJECUCIÓN AHORA.`;

      let stepCount = 0;
      let currentStep = 0;
      let lastResult = "";

      // Autonomous execution loop
      while (stepCount < maxSteps) {
        stepCount++;
        currentStep++;

        console.log(`[Jarvis Executor] Step ${currentStep}/${maxSteps}`);

        // Query the engine with context
        const result = await this.engine.query(
          stepCount === 1 ? autonomousPrompt : 
          `Continúa con la tarea. Último resultado: ${lastResult}\n\n¿Qué sigue?`
        );

        // Record step
        steps.push({
          step: currentStep,
          action: `Paso ${currentStep} ejecutado`,
          result: result.messages[result.messages.length - 1]?.content || "Sin resultado",
        });

        // Check if task is complete
        const finalMessage = result.messages[result.messages.length - 1];
        if (this.isTaskComplete(finalMessage.content, task.goal)) {
          console.log(`[Jarvis Executor] Task completed in ${currentStep} steps`);
          
          return {
            taskId: task.id,
            success: true,
            steps,
            finalOutput: finalMessage.content,
            duration: Date.now() - startTime,
          };
        }

        lastResult = result.messages[result.messages.length - 1]?.content || "";

        // Check if we need to stop
        if (result.toolExecutions.length === 0 && !this.shouldContinue(lastResult)) {
          break;
        }
      }

      // Max steps reached
      return {
        taskId: task.id,
        success: false,
        steps,
        finalOutput: "Tarea incompleta - se alcanzó el máximo de pasos",
        duration: Date.now() - startTime,
      };

    } catch (error: any) {
      console.error("[Jarvis Executor] Task execution error:", error);
      
      return {
        taskId: task.id,
        success: false,
        steps,
        finalOutput: `Error en ejecución: ${error.message}`,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isRunning = false;
      this.currentTask = null;
    }
  }

  // Check if task is complete based on response content
  private isTaskComplete(response: string, goal: string): boolean {
    const completionIndicators = [
      "tarea completada",
      "objetivo alcanzado",
      "hecho",
      "completado",
      "finalizado",
      "task complete",
      "done",
      "finished",
    ];

    const responseLower = response.toLowerCase();
    
    return completionIndicators.some(indicator => 
      responseLower.includes(indicator)
    );
  }

  // Check if executor should continue
  private shouldContinue(response: string): boolean {
    const stopIndicators = [
      "no puedo continuar",
      "necesito ayuda",
      "requiere intervención",
    ];

    const responseLower = response.toLowerCase();
    
    return !stopIndicators.some(indicator => 
      responseLower.includes(indicator)
    );
  }

  // Execute multiple tasks in parallel
  async executeParallel(
    tasks: AutonomousTask[]
  ): Promise<TaskExecutionResult[]> {
    console.log(`[Jarvis Executor] Executing ${tasks.length} tasks in parallel`);
    
    const promises = tasks.map(task => this.executeTask(task));
    return Promise.all(promises);
  }

  // Stop current execution
  stop(): void {
    if (!this.isRunning) {
      console.log("[Jarvis Executor] No task is currently running");
      return;
    }

    console.log("[Jarvis Executor] Stopping current task");
    this.isRunning = false;
    this.currentTask = null;
  }

  // Get executor status
  getStatus(): {
    isRunning: boolean;
    currentTask: AutonomousTask | null;
  } {
    return {
      isRunning: this.isRunning,
      currentTask: this.currentTask,
    };
  }
}

// ============================================================
// MULTI-AGENT HARNESS - Planner, Generator, Evaluator pattern
// ============================================================

export interface MultiAgentConfig {
  plannerEngine: QueryEngine;
  generatorEngine: QueryEngine;
  evaluatorEngine: QueryEngine;
}

export class MultiAgentHarness {
  private planner: QueryEngine;
  private generator: QueryEngine;
  private evaluator: QueryEngine;

  constructor(config: MultiAgentConfig) {
    this.planner = config.plannerEngine;
    this.generator = config.generatorEngine;
    this.evaluator = config.evaluatorEngine;
  }

  // Execute task with multi-agent pattern
  async executeWithAgents(task: {
    description: string;
    goal: string;
  }): Promise<{
    plan: string;
    implementation: string;
    evaluation: string;
  }> {
    console.log("[MultiAgent] Starting multi-agent execution");

    // Phase 1: Planner breaks down the task
    console.log("[MultiAgent] Phase 1: Planning");
    const planResult = await this.planner.query(
      `Descompón esta tarea en pasos accionables:\n\n${task.description}\n\nObjetivo: ${task.goal}`
    );
    const plan = planResult.messages[planResult.messages.length - 1]?.content || "";

    // Phase 2: Generator implements the plan
    console.log("[MultiAgent] Phase 2: Generating");
    const implResult = await this.generator.query(
      `Implementa el siguiente plan:\n\n${plan}`
    );
    const implementation = implResult.messages[implResult.messages.length - 1]?.content || "";

    // Phase 3: Evaluator validates the result
    console.log("[MultiAgent] Phase 3: Evaluating");
    const evalResult = await this.evaluator.query(
      `Evalúa críticamente esta implementación:\n\n${implementation}\n\n¿Es correcta? ¿Funcional? ¿Completa?`
    );
    const evaluation = evalResult.messages[evalResult.messages.length - 1]?.content || "";

    return {
      plan,
      implementation,
      evaluation,
    };
  }
}

// ============================================================
// FACTORY - Create complete autonomous system
// ============================================================

export function createAutonomousSystem(config: QueryEngineConfig): {
  engine: QueryEngine;
  executor: AutonomousExecutor;
} {
  const engine = createJarvisEngine(config);
  const executor = new AutonomousExecutor(engine);

  return { engine, executor };
}
