/**
 * MODEL EVOLUTION TYPES
 *
 * Tipos para el sistema de meta-learning de Jarvis
 */

/**
 * TRAINING DATA POINT
 *
 * Una interacción exitosa que Jarvis usa para aprender
 */
export interface TrainingDataPoint {
  id: string;
  timestamp: number;

  // Input
  userQuery: string;
  context: any;

  // Processing
  agentUsed: string;
  toolsUsed: string[];
  executionTime: number;
  iterationsUsed: number;

  // Output
  response: string;
  artifacts?: any[];

  // Quality metrics
  qualityScore: number; // 0-100 (auto-calculated)
  userSatisfaction?: number; // 0-100 (if available)
  successfulOutcome: boolean;

  // Contextual info
  taskCategory: string;
  complexity: 'simple' | 'moderate' | 'complex';

  // Feedback loop
  wasUsedForTraining?: boolean;
  trainingGenerations?: string[];
}

/**
 * MODEL VARIANT
 *
 * Un modelo específico que Jarvis usa o está evaluando
 */
export interface ModelVariant {
  id: string;
  name: string;
  type: 'base' | 'finetuned' | 'distilled' | 'quantized';

  // Base model info
  baseModel: string; // e.g., "claude-3.5-sonnet"
  version: string;

  // Fine-tuning info (si aplica)
  finetuningConfig?: {
    trainingDataPoints: number;
    epochs: number;
    learningRate: number;
    lossFunctionType: string;
  };

  // Performance metrics
  metrics: {
    averageLatency: number; // ms
    qualityScore: number; // 0-100
    costPerRequest: number; // USD
    tokensPerRequest: number;
    successRate: number; // 0-1
  };

  // Status
  isActive: boolean;
  createdAt: number;
  trainedOn: number; // data points used
  generations: number; // cuántas veces fue reentrenado
}

/**
 * A/B TEST
 *
 * Comparación entre dos modelos
 */
export interface ABTest {
  id: string;
  timestamp: number;

  modelA: {
    id: string;
    name: string;
  };

  modelB: {
    id: string;
    name: string;
  };

  // Test parameters
  testDuration: number; // ms
  samplesRequired: number;
  samplesTaken: number;

  // Results
  modelA_scores: number[];
  modelB_scores: number[];
  modelA_avgScore: number;
  modelB_avgScore: number;

  winner?: 'A' | 'B' | 'tie';
  confidenceLevel: number; // 0-1
  statisticalSignificance: boolean;

  // Cost analysis
  costA: number;
  costB: number;
  costSavings?: number;
}

/**
 * MODEL LINEAGE
 *
 * Genealogía de modelos (similar a genoma)
 */
export interface ModelLineage {
  generationId: string;
  createdAt: number;
  parentId?: string;

  modelVariant: string;
  trainingDataPoints: number;

  // Evolution parameters
  improvementArea: string; // 'latency' | 'quality' | 'cost' | 'accuracy'
  improvementAmount: number; // porcentaje

  status: 'ACTIVE' | 'ARCHIVED' | 'SUPERSEDED';
  abTestResults?: {
    testedAgainst: string;
    winner: string;
  };
}

/**
 * MODEL EVALUATION RESULT
 *
 * Resultado de evaluar un modelo
 */
export interface ModelEvaluationResult {
  modelId: string;
  evaluationTime: number;

  metrics: {
    latency: number;
    qualityScore: number;
    costPerRequest: number;
    accuracy: number;
    robustness: number;
  };

  improvements: {
    vs_baseModel: number; // %
    vs_previousGeneration: number; // %
  };

  recommendations: string[];
}

/**
 * TRAINING SESSION
 *
 * Sesión de fine-tuning
 */
export interface TrainingSession {
  id: string;
  startTime: number;
  endTime?: number;

  sourceModel: string;
  targetModelId: string;

  trainingData: {
    totalPoints: number;
    successfulPoints: number;
    categories: Map<string, number>;
  };

  config: {
    epochs: number;
    batchSize: number;
    learningRate: number;
  };

  progress: {
    currentEpoch: number;
    currentLoss: number;
    validationAccuracy: number;
    validationLoss?: number;
    bestValidationAccuracy?: number;
    trainingTime?: number;
    estimatedTimeRemaining?: number;
  };

  status: 'running' | 'completed' | 'failed' | 'paused';
  result?: {
    finalLoss: number;
    finalAccuracy: number;
    improvements: ModelEvaluationResult;
  };
}

/**
 * COST ANALYSIS
 *
 * Análisis de costos y ahorros
 */
export interface CostAnalysis {
  period: {
    startDate: number;
    endDate: number;
  };

  apiCalls: {
    baseModel: {
      count: number;
      costUSD: number;
    };
    personalizedModel: {
      count: number;
      costUSD: number;
    };
  };

  savings: {
    amountUSD: number;
    percentageReduction: number;
  };

  tradeoffs: {
    latencyImprovement: number; // ms faster
    qualityDelta: number; // % change
  };
}

/**
 * META-LEARNING STATE
 *
 * Estado del sistema completo de meta-learning
 */
export interface MetaLearningState {
  trainingData: TrainingDataPoint[];
  modelVariants: ModelVariant[];
  modelLineage: ModelLineage[];
  abTests: any[];
  trainingSessions: TrainingSession[];
  costAnalysis: CostAnalysis;

  activeModel: ModelVariant;
  candidateModel?: ModelVariant;

  statistics: {
    totalInteractionsTrained: number;
    totalModelIterations: number;
    bestModelImprovement: number; // %
    totalCostsSaved: number; // USD
  };
}
