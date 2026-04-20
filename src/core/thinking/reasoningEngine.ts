/**
 * REASONING ENGINE
 *
 * Motor de razonamiento profundo para Jarvis.
 * Maneja: Planning, Observation, Reflection, Synthesis
 */

import { geminiService } from '../../services/geminiService';

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
  progress: number; // 0-100
}

export interface SynthesisResult {
  output: string;
  quality: string;
}

export class ReasoningEngine {
  /**
   * PLANNING: Desglosar objetivo en pasos ejecutables
   */
  async plan(
    objective: string,
    context: string,
    previousState: string,
    iteration: number
  ): Promise<PlanResult> {
    const prompt = `
ERES JARVIS, un agente agentico avanzado.

OBJETIVO: ${objective}

CONTEXTO: ${context}

ESTADO ANTERIOR: ${previousState}

ITERACIÓN: ${iteration}

Analiza el objetivo y proporciona:
1. Una lista de 3-5 pasos concretos para avanzar
2. Si crees que el objetivo ya está completo, responde TASK_COMPLETE

Responde en JSON:
{
  "steps": ["paso1", "paso2", ...],
  "isTaskComplete": boolean,
  "reasoning": "explicación"
}
`;

    try {
      const response = await geminiService.generateResponse(
        prompt,
        'Eres un planificador estratégico. Desglosa objetivos en pasos ejecutables.',
        false,
        'gemini-3-flash-preview'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          steps: parsed.steps || [],
          isTaskComplete: parsed.isTaskComplete || false,
          reasoning: parsed.reasoning || '',
        };
      }

      return {
        steps: [objective],
        isTaskComplete: false,
        reasoning: 'No se pudo parsear el plan, usando objetivo directo',
      };
    } catch (error: any) {
      console.error('Error en ReasoningEngine.plan:', error);
      return {
        steps: [objective],
        isTaskComplete: false,
        reasoning: `Error: ${error.message}`,
      };
    }
  }

  /**
   * OBSERVATION: Analizar resultado de herramienta
   */
  async observe(toolResult: any): Promise<ObservationResult> {
    const prompt = `
Analiza este resultado de una herramienta ejecutada:

RESULTADO: ${JSON.stringify(toolResult, null, 2)}

Proporciona:
1. Un resumen breve (1-2 líneas)
2. Detalles importantes del resultado
3. Confianza en la validez del resultado (0-100)

Responde en JSON:
{
  "summary": "resumen",
  "details": "detalles",
  "confidence": número
}
`;

    try {
      const response = await geminiService.generateResponse(
        prompt,
        'Analiza resultados de ejecución de herramientas y extrae información clave.',
        false,
        'gemini-3-flash-preview'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Herramienta ejecutada',
          details: parsed.details || '',
          confidence: parsed.confidence || 70,
        };
      }

      return {
        summary: 'Herramienta ejecutada exitosamente',
        details: JSON.stringify(toolResult).substring(0, 100),
        confidence: 50,
      };
    } catch (error: any) {
      return {
        summary: 'Herramienta ejecutada',
        details: `Error: ${error.message}`,
        confidence: 30,
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
    const prompt = `
OBJETIVO ORIGINAL: ${objective}

ESTADO ACTUAL: ${currentState}

ITERACIÓN: ${iteration}/${maxIterations}

Reflexiona:
1. ¿Qué tan cerca estamos del objetivo? (0-100%)
2. ¿Qué se logró en esta iteración?
3. ¿Cuál es el próximo paso?
4. ¿Deberíamos detener aquí o continuar?

Responde en JSON:
{
  "assessment": "evaluación de progreso",
  "nextStep": "próximo paso a tomar o TASK_COMPLETE si está listo",
  "progress": número 0-100
}
`;

    try {
      const response = await geminiService.generateResponse(
        prompt,
        'Reflexiona sobre progreso hacia objetivos y determina próximos pasos.',
        false,
        'gemini-3-flash-preview'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          assessment: parsed.assessment || 'Progreso en curso',
          nextStep: parsed.nextStep || 'Continuar',
          progress: parsed.progress || 50,
        };
      }

      return {
        assessment: 'Iteración completada',
        nextStep: iteration >= maxIterations ? 'TASK_COMPLETE' : 'Continuar',
        progress: (iteration / maxIterations) * 100,
      };
    } catch (error: any) {
      return {
        assessment: `Error: ${error.message}`,
        nextStep: 'TASK_COMPLETE',
        progress: 0,
      };
    }
  }

  /**
   * SYNTHESIS: Sintetizar output final
   */
  async synthesize(currentState: string, objective: string): Promise<SynthesisResult> {
    const prompt = `
OBJETIVO: ${objective}

RESULTADO FINAL: ${currentState}

Sintetiza esto en una respuesta clara y bien estructurada para el usuario:
- Resume lo que se logró
- Proporciona datos/insights concretos
- Sugiere próximos pasos si es aplicable

Responde en JSON:
{
  "output": "respuesta sintética",
  "quality": "excelente/buena/aceptable"
}
`;

    try {
      const response = await geminiService.generateResponse(
        prompt,
        'Sintetiza resultados de ejecución en respuestas claras y estructuradas.',
        false,
        'gemini-3-flash-preview'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          output: parsed.output || currentState,
          quality: parsed.quality || 'buena',
        };
      }

      return {
        output: currentState,
        quality: 'aceptable',
      };
    } catch (error: any) {
      return {
        output: currentState,
        quality: 'degradada',
      };
    }
  }
}
