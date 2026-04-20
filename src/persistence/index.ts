/**
 * PERSISTENCE MODULE
 *
 * Exports all persistence-related modules and utilities
 */

export { JarvisDatabase, initializeDatabase, getDatabase } from './database';
export {
  PersistentMemoryManager,
  type Episode,
  type Lesson,
  type Skill,
  type Genome,
  type JarvisTask,
  type Pattern
} from './PersistentMemoryManager';

// Re-export initialization
export { initializeBootstrapKnowledge } from '../reasoning/InitialKnowledge';
