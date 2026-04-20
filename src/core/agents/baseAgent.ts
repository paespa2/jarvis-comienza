/**
 * BASE AGENT
 *
 * Clase abstracta que define la interfaz común para todos los agentes especializados.
 * Todos los agentes heredan de esta clase.
 */

import { ConstitutionalAI } from '../constitution/constitutionalAI';
import { ReasoningEngine } from '../thinking/reasoningEngine';

export interface AgentCapability {
  name: string;
  description: string;
  tools: string[];
  priority: number; // 1-10
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'status' | 'error';
  payload: any;
  timestamp: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  priority: number;
  deadline?: string;
  context?: any;
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  taskId: string;
  success: boolean;
  output: any;
  executionTime: number;
  iterationsUsed: number;
  lessonLearned?: string;
  errors?: string[];
}

/**
 * ABSTRACT BASE AGENT
 *
 * Todo agente especializado debe extender esta clase.
 */
export abstract class BaseAgent {
  protected agentId: string;
  protected agentName: string;
  protected role: string;
  protected capabilities: AgentCapability[];
  protected reasoning: ReasoningEngine;
  protected constitution: typeof ConstitutionalAI;
  protected isActive: boolean = true;
  protected executedTasks: number = 0;
  protected successRate: number = 0;

  constructor(name: string, role: string) {
    this.agentId = `agent-${Date.now()}-${Math.random()}`;
    this.agentName = name;
    this.role = role;
    this.capabilities = [];
    this.reasoning = new ReasoningEngine();
    this.constitution = ConstitutionalAI;
  }

  /**
   * Ejecutar una tarea
   *
   * Método principal que todo agente debe implementar.
   * INVARIANTE: Siempre pasa por validación constitucional primero.
   */
  abstract async execute(task: AgentTask): Promise<AgentExecutionResult>;

  /**
   * Validación constitucional antes de ejecutar
   */
  protected async validateConstituionally(task: AgentTask): Promise<boolean> {
    const { valid, validation } = await ConstitutionalAI.validateAction(
      task.description,
      'paespa',
      'medium',
      true
    );

    if (!valid) {
      console.log(
        `❌ Agente ${this.agentName} rechazó tarea por validación constitucional`
      );
      return false;
    }

    return true;
  }

  /**
   * Solicitar ayuda a otro agente
   */
  protected async requestHelp(
    targetAgentName: string,
    request: AgentMessage
  ): Promise<AgentMessage | null> {
    // Será implementado por el OrchestrationBus
    console.log(
      `📬 ${this.agentName} solicita ayuda a ${targetAgentName}`
    );
    return null;
  }

  /**
   * Registrar capacidad
   */
  protected registerCapability(capability: AgentCapability): void {
    this.capabilities.push(capability);
  }

  /**
   * Obtener metadata del agente
   */
  getMetadata() {
    return {
      agentId: this.agentId,
      agentName: this.agentName,
      role: this.role,
      capabilities: this.capabilities,
      executedTasks: this.executedTasks,
      successRate: this.successRate,
      isActive: this.isActive,
    };
  }

  /**
   * Obtener capacidades
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Marcar como completado
   */
  protected recordTaskCompletion(success: boolean): void {
    this.executedTasks++;
    if (success) {
      this.successRate =
        (this.successRate * (this.executedTasks - 1) + 1) / this.executedTasks;
    } else {
      this.successRate =
        (this.successRate * (this.executedTasks - 1)) / this.executedTasks;
    }
  }

  /**
   * Desactivar agente (si hay error crítico)
   */
  deactivate(): void {
    this.isActive = false;
    console.log(`🔴 Agente ${this.agentName} desactivado`);
  }

  /**
   * Reactivar agente
   */
  reactivate(): void {
    this.isActive = true;
    console.log(`🟢 Agente ${this.agentName} reactivado`);
  }
}
