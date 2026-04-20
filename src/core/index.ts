/**
 * EXPORTS DEL CORE AGENTICO
 *
 * Punto de entrada único para toda la funcionalidad agentica de Jarvis
 */

// Constitution
export { ConstitutionalAI, validateBeforeExecution } from './constitution/constitutionalAI';
export type { ConstitutionalValidation, ConstitutionalContext } from './constitution/constitutionalAI';

// Agent Core
export { AgentCore, createAgent } from './agentic/agentCore';
export type { AgentTask, AgentResult, AgentIteration } from './agentic/agentCore';

// Reasoning
export { ReasoningEngine } from './thinking/reasoningEngine';

// Tools
export { ToolExecutor } from './tools/toolExecutor';
export type { ToolDecision, ToolResult } from './tools/toolExecutor';
