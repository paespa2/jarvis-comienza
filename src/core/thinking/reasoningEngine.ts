/**
 * REASONING ENGINE - JARVIS NATIVO
 *
 * Razonamiento 100% autónomo usando el modelo nativo de Jarvis.
 * Sin dependencias de APIs externas. Sin Gemini. Sin OpenAI.
 * Jarvis piensa por sí mismo.
 */

import { jarvisNativeModel } from '../nativeModel/JarvisNativeModel';

export interface PlanResult {
  steps: string[];
  isTaskComplete: boolean;
  reasoning: string;
}

export interface ObservationResult {
  summary: string;
  details: string;
  confidence: number;
}

export interface ReflectionResult {
  assessment: string;
  nextStep: string;
  progress: number;
}

export interface SynthesisResult {
  output: string;
  quality: string;
}

export class ReasoningEngine {
  /**
   * PLANNING: Desglosar objetivo en pasos usando modelo nativo
   */
  async plan(
    objective: string,
    context: string,
    previousState: string,
    iteration: number
  ): Promise<PlanResult> {
    const output = jarvisNativeModel.generate({
      query: objective,
      context,
      previousState,
      iteration,
      mode: 'plan',
    });

    try {
      const parsed = JSON.parse(output.text);
      return {
        steps: parsed.steps?.length > 0 ? parsed.steps : [objective],
        isTaskComplete: parsed.isTaskComplete ?? (iteration > 2),
        reasoning: parsed.reasoning || output.reasoning,
      };
    } catch {
      return {
        steps: [objective],
        isTaskComplete: iteration > 2,
        reasoning: output.reasoning,
      };
    }
  }

  /**
   * OBSERVATION: Analizar resultado de herramienta
   */
  async observe(toolResult: any): Promise<ObservationResult> {
    const resultStr = JSON.stringify(toolResult).substring(0, 400);

    const output = jarvisNativeModel.generate({
      query: 'observe tool result',
      context: resultStr,
      mode: 'observe',
    });

    try {
      const parsed = JSON.parse(output.text);
      return {
        summary: parsed.summary || 'Operación completada',
        details: parsed.details || resultStr.substring(0, 100),
        confidence: parsed.confidence || Math.round(output.confidence * 100),
      };
    } catch {
      return {
        summary: 'Herramienta ejecutada',
        details: resultStr.substring(0, 100),
        confidence: 60,
      };
    }
  }

  /**
   * REFLECTION: Evaluar progreso y determinar próximo paso
   */
  async reflect(
    objective: string,
    currentState: string,
    iteration: number,
    maxIterations: number
  ): Promise<ReflectionResult> {
    const output = jarvisNativeModel.generate({
      query: objective,
      previousState: currentState,
      iteration,
      maxIterations,
      mode: 'reflect',
    });

    try {
      const parsed = JSON.parse(output.text);
      return {
        assessment: parsed.assessment || `Iteración ${iteration}/${maxIterations}`,
        nextStep: parsed.nextStep || (iteration >= maxIterations ? 'TASK_COMPLETE' : 'Continuar'),
        progress: parsed.progress ?? Math.round((iteration / maxIterations) * 100),
      };
    } catch {
      return {
        assessment: `Iteración ${iteration}/${maxIterations} completada`,
        nextStep: iteration >= maxIterations ? 'TASK_COMPLETE' : 'Continuar',
        progress: Math.round((iteration / maxIterations) * 100),
      };
    }
  }

  /**
   * SYNTHESIS: Sintetizar output final
   */
  async synthesize(currentState: string, objective: string): Promise<SynthesisResult> {
    const output = jarvisNativeModel.generate({
      query: objective,
      context: currentState,
      mode: 'synthesize',
    });

    try {
      const parsed = JSON.parse(output.text);
      return {
        output: parsed.output || currentState,
        quality: parsed.quality || 'buena',
      };
    } catch {
      return {
        output: `${objective}\n\n${currentState.substring(0, 400)}`,
        quality: 'aceptable',
      };
    }
  }
}
