/**
 * SERVER INTEGRATION
 *
 * Integration module to connect persistent storage with the Express server
 * This is the bridge between the HTTP API and the persistent knowledge base
 */

import { PersistentMemoryManager } from './PersistentMemoryManager';
import { initializeBootstrapKnowledge } from '../reasoning/InitialKnowledge';

// Export PersistentMemoryManager for server integration
export { PersistentMemoryManager };

/**
 * Global persistent memory manager instance
 * Will be initialized once when the server starts
 */
let persistenceManager: PersistentMemoryManager | null = null;

/**
 * Initialize persistent storage for the server
 * Call this in your server initialization
 */
export async function initializePersistence(): Promise<PersistentMemoryManager> {
  console.log('\n💾 INITIALIZING PERSISTENT STORAGE...\n');

  // Create memory manager (Firebase-based, no SQLite dependency)
  persistenceManager = new PersistentMemoryManager();

  // Bootstrap initial knowledge if needed
  await initializeBootstrapKnowledge(persistenceManager);

  console.log('✅ Persistent storage ready\n');

  return persistenceManager;
}

/**
 * Get the persistent memory manager instance
 */
export function getPersistenceManager(): PersistentMemoryManager {
  if (!persistenceManager) {
    throw new Error(
      'Persistence manager not initialized. Call initializePersistence first.'
    );
  }
  return persistenceManager;
}

/**
 * Save task execution to persistent storage
 * Call this after each task completes
 */
export async function saveTaskExecution(
  taskId: string,
  query: string,
  status: 'completed' | 'failed' | 'pending',
  result?: any,
  error?: string,
  duration?: number
): Promise<void> {
  const manager = getPersistenceManager();

  const task = {
    id: taskId,
    query,
    status,
    result,
    error,
    createdAt: Date.now(),
    completedAt: Date.now(),
    duration
  };

  await manager.saveTask(task);
}

/**
 * Consolidate execution experience in persistent memory
 * Call this with detailed execution information
 */
export async function consolidateExecution(options: {
  query: string;
  agents: string[];
  actions: string[];
  result: any;
  executionTime: number;
  success: boolean;
}): Promise<void> {
  const manager = getPersistenceManager();
  await manager.consolidateExperience(options);
}

/**
 * Get similar past executions for context
 * Useful for caching and pattern matching
 */
export async function getSimilarPastExecutions(
  query: string,
  limit: number = 5
): Promise<any[]> {
  const manager = getPersistenceManager();
  return await manager.findSimilarEpisodes(query, { limit });
}

/**
 * Get applicable lessons for a query
 * These are learned patterns that might help
 */
export async function getApplicableLessons(
  keywords: string[]
): Promise<any[]> {
  const manager = getPersistenceManager();
  return await manager.searchLessons(keywords);
}

/**
 * Get relevant skills for execution
 */
export async function getRelevantSkills(keywords: string[]): Promise<any[]> {
  const manager = getPersistenceManager();
  return await manager.searchSkills(keywords);
}

/**
 * Get memory statistics for debugging and metrics
 */
export async function getMemoryStatistics(): Promise<any> {
  const manager = getPersistenceManager();
  return await manager.getStatistics();
}

/**
 * Middleware for Express to add persistence context to requests
 * Usage: app.use(persistenceMiddleware)
 */
export function persistenceMiddleware(req: any, res: any, next: any) {
  req.persistence = {
    saveTask: saveTaskExecution,
    consolidate: consolidateExecution,
    getSimilar: getSimilarPastExecutions,
    getLessons: getApplicableLessons,
    getSkills: getRelevantSkills,
    getStats: getMemoryStatistics
  };
  next();
}

/**
 * Log detailed persistence metrics
 */
export async function logPersistenceMetrics(): Promise<void> {
  const manager = getPersistenceManager();
  await manager.logMetrics();
}
