/**
 * AGENTS MODULE - Exports
 *
 * Punto de entrada único para el sistema multi-agente
 */

// Base Agent
export { BaseAgent } from './baseAgent';
export type {
  AgentCapability,
  AgentMessage,
  AgentTask,
  AgentExecutionResult,
} from './baseAgent';

// Specialized Agents
export {
  OrchestratorAgent,
  DeveloperAgent,
  SecurityAuditorAgent,
  ResearcherAgent,
  DevOpsAgent,
  DocumentationWriterAgent,
  QAValidatorAgent,
  StrategicPlannerAgent,
} from './specialized/allAgents';

// Orchestration
export { AgentOrchestrator, createOrchestrator } from './orchestration/agentOrchestrator';
export type { DelegationPlan, AgentPool, OrchestrationMetrics } from './orchestration/agentOrchestrator';
