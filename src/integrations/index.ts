/**
 * INTEGRATIONS MODULE - Exports
 *
 * Módulo de integraciones con servicios externos
 */

// GitHub Integration
export { GitHubIntegration } from './github/githubIntegration';
export type {
  GitHubRepo,
  CodeAnalysisResult,
  PullRequest,
  GitHubIssue,
} from './github/githubIntegration';

// REST API Server
export { RestApiServer } from './api/restApiServer';
export type {
  ApiTask,
  ApiResponse,
  ApiMetrics,
} from './api/restApiServer';

// Webhook Manager
export { WebhookManager } from './webhooks/webhookManager';
export type {
  Webhook,
  WebhookDelivery,
  WebhookEvent,
  WebhookEvent_TaskCompleted,
  WebhookEvent_MemoryConsolidation,
  WebhookEvent_GenomeEvolution,
  WebhookEvent_ModelDeployment,
} from './webhooks/webhookManager';

// Database Layer
export { DatabaseLayer } from './database/databaseLayer';
export type {
  DatabaseConfig,
  StoredTrainingDataPoint,
  StoredModel,
  StoredTask,
  StoredMemoryState,
} from './database/databaseLayer';

// Integration Orchestrator
export { IntegrationOrchestrator } from './IntegrationOrchestrator';
export type { IntegrationConfig } from './IntegrationOrchestrator';
