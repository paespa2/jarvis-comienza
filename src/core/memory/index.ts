/**
 * MEMORY MODULE - Exports
 */

// Types
export type {
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
  ConsolidationEvent,
  Genome,
  MemoryManagerState,
  MemoryQuery,
  MemoryQueryResult,
} from './memoryTypes';

// Systems
export { EpisodicMemorySystem } from './episodic/episodicMemory';
export { SemanticMemorySystem } from './semantic/semanticMemory';
export { ProceduralMemorySystem } from './procedural/proceduralMemory';

// Manager
export { MemoryManager, createMemoryManager } from './memoryManager';
