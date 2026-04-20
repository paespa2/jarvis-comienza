/**
 * MODEL EVOLUTION MODULE - Exports
 *
 * Sistema de Meta-Learning para evolución automática de modelos
 */

// Types
export type {
  TrainingDataPoint,
  ModelVariant,
  ABTest,
  ModelLineage,
  ModelEvaluationResult,
  TrainingSession,
  CostAnalysis,
  MetaLearningState,
} from './modelTypes';

// Data Collection
export { DatasetBuilder } from './dataCollection/datasetBuilder';

// Optimization
export { ModelOptimizer } from './optimization/modelOptimizer';
export type { OptimizationStrategy, DatasetAnalysis } from './optimization/modelOptimizer';

export { CostAnalyzer } from './optimization/costAnalyzer';
export type { CostBreakdown, CostProjection } from './optimization/costAnalyzer';

// Training
export { FineTuner } from './training/fineTuner';
export type { FineTuningConfig, TrainingProgress, TrainingResult } from './training/fineTuner';

// Evaluation
export { ModelEvaluator } from './evaluation/modelEvaluator';
export type { EvaluationMetrics, EvaluationReport } from './evaluation/modelEvaluator';

// Testing
export { ABTestingFramework } from './testing/abTestingFramework';
export type { ABTestConfig, ABTestResult } from './testing/abTestingFramework';

// Orchestration
export { ModelEvolutionOrchestrator } from './modelEvolutionOrchestrator';
export type { EvolutionPipeline } from './modelEvolutionOrchestrator';
