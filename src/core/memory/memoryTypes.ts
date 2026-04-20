/**
 * MEMORY TYPES
 *
 * Definiciones de tipos para el sistema de triple memoria de Jarvis.
 */

/**
 * EPISODIC MEMORY
 * Qué pasó y cuándo. Eventos específicos y experiencias vividas.
 *
 * Ejemplo:
 * - "El 20 de abril ejecuté tarea X, fue exitosa"
 * - "Hubo error en herramienta Y a las 15:30"
 * - "Usuario pidió feature Z"
 */
export interface EpisodicMemory {
  id: string;
  type: 'task_execution' | 'error' | 'success' | 'user_interaction' | 'learning';
  timestamp: number;
  description: string;
  context: any;
  outcome: 'success' | 'failure' | 'partial';
  agentInvolved?: string;
  toolsUsed?: string[];
  duration?: number;
  metadata?: {
    emotionalTone?: 'positive' | 'neutral' | 'negative';
    importance?: number; // 1-10
    isAnomalous?: boolean;
  };
}

/**
 * SEMANTIC MEMORY
 * Qué sé. Conocimiento generalizado, patrones, hechos, conceptos.
 *
 * Ejemplo:
 * - "Las vulnerabilidades de SQL Injection ocurren en queries sin prepared statements"
 * - "El modelo X es mejor para tareas de Y"
 * - "El patrón singleton es útil para Z"
 */
export interface SemanticMemory {
  id: string;
  category: 'technique' | 'pattern' | 'tool' | 'principle' | 'concept' | 'fact';
  title: string;
  content: string; // Knowledge content
  applicableDomains: string[]; // ['security', 'coding', 'devops']
  confidenceScore: number; // 0-1
  sourceTasks?: string[]; // IDs de episodios que generaron este conocimiento
  lastReinforced: number; // timestamp
  usageCount: number;
  tags: string[];
}

/**
 * PROCEDURAL MEMORY
 * Cómo hacer cosas. Skills, técnicas, procedimientos, "muscle memory".
 *
 * Ejemplo:
 * - "Cómo ejecutar un pentesting eficientemente"
 * - "Cómo refactorizar código legacy"
 * - "Cómo optimizar queries SQL"
 */
export interface ProceduralMemory {
  id: string;
  skillName: string;
  description: string;
  steps: ProceduralStep[];
  prerequisites: string[]; // Skills required before this
  successMetrics: string[];
  proficiencyLevel: 'novice' | 'intermediate' | 'expert'; // Auto-updated
  lastPracticed: number;
  successRate: number; // 0-1
  estimatedDuration: number; // ms
  category: string;
  tags: string[];
}

export interface ProceduralStep {
  order: number;
  description: string;
  expectedOutcome: string;
  commonMistakes?: string[];
  tips?: string[];
}

/**
 * MEMORY CONSOLIDATION
 * Proceso de convertir episodios en conocimiento y skills.
 *
 * Cuando Jarvis ha ejecutado la misma tarea exitosamente N veces,
 * consolida eso en procedural memory (skill).
 *
 * Cuando nota patrones en episodios, consolida en semantic memory.
 */
export interface ConsolidationEvent {
  id: string;
  timestamp: number;
  type: 'episodic_to_semantic' | 'episodic_to_procedural' | 'skill_reinforcement';
  sourceEpisodes: string[];
  resultingMemory: string; // ID de la memoria creada/actualizada
  confidenceLevel: number; // 0-1
  description: string;
}

/**
 * GENOME - Genoma evolutivo de Jarvis
 * Su configuración genética que muta y evoluciona.
 */
export interface Genome {
  generationId: string;
  createdAt: number;
  parentGenerationId?: string;

  // Mutation vector - Rasgos heredables
  mutationVector: {
    aggressiveness: number; // 0-1: Cuán proactivo
    caution: number; // 0-1: Cuán cuidadoso
    predictivity: number; // 0-1: Anticipación
    creativity: number; // 0-1: Pensamiento fuera de distribución
    loyalty: number; // 0-1: SIEMPRE 0.95+ (inmutable)
  };

  // Performance metrics
  metrics: {
    totalTasksExecuted: number;
    successfulTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    averageLoyaltyScore: number;
    agentUtilization: { [agentName: string]: number };
    skillsLearned: number;
    knowledgeNodesCreated: number;
  };

  // Status
  status: 'ACTIVE' | 'ARCHIVED' | 'SUPERCEDED';
  isCurrentGeneration: boolean;

  // Evolution trigger
  evolutionTriggeredBy?: string; // Reason for mutation
}

/**
 * MEMORY MANAGER STATE
 * Estado global del sistema de memoria
 */
export interface MemoryManagerState {
  episodicMemories: EpisodicMemory[];
  semanticMemories: SemanticMemory[];
  proceduralMemories: ProceduralMemory[];
  consolidationHistory: ConsolidationEvent[];
  currentGenome: Genome;
  genomeLineage: Genome[];
  lastConsolidation: number;
  totalMemoriesStored: number;
}

/**
 * MEMORY QUERY INTERFACES
 */
export interface MemoryQuery {
  type: 'episodic' | 'semantic' | 'procedural';
  query: string;
  limit?: number;
  timeWindow?: { start: number; end: number };
  filters?: Record<string, any>;
}

export interface MemoryQueryResult {
  type: string;
  results: (EpisodicMemory | SemanticMemory | ProceduralMemory)[];
  totalFound: number;
  queryTime: number;
}
