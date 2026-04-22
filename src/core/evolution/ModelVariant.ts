/**
 * MODEL VARIANT — Represents a single evolving instance of Jarvis
 *
 * Each variant has:
 * - Unique DNA (capabilities, weights, strategy parameters)
 * - Performance metrics across difficulty levels
 * - Generation number and parent lineage
 * - Mutations applied to create next generation
 */

export interface CapabilityGene {
  id: string;
  name: string;
  enabled: boolean;
  confidence: number;      // 0-1, how well this capability performs
  lastTestedAt: number;
  successRate: number;     // Historical success rate
}

export interface MutationRecord {
  type: 'enable' | 'disable' | 'parameter_shift' | 'combination' | 'novel';
  geneName: string;
  description: string;
  appliedAt: number;
  improved: boolean;
}

export interface TestResult {
  level: 'basic' | 'intermediate' | 'advanced' | 'expert' | 'elite';
  testsRun: number;
  passed: number;
  failed: number;
  avgTime: number;
  timestamp: number;
}

export class ModelVariant {
  id: string;
  generation: number;
  parentId: string | null;
  createdAt: number;

  // DNA: 5 core capabilities that work
  workingCapabilities: CapabilityGene[];

  // 5 failed attempts (incomplete capabilities)
  failedCapabilities: CapabilityGene[];

  // 5 mutations/new attempts to fix failures
  experimentalCapabilities: CapabilityGene[];

  // Performance across difficulty levels
  testResults: Map<string, TestResult> = new Map();

  // Overall fitness score (0-1)
  fitnessScore: number = 0;

  // Evolution history
  mutations: MutationRecord[] = [];

  constructor(generation: number = 1, parentId: string | null = null) {
    this.id = `variant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.generation = generation;
    this.parentId = parentId;
    this.createdAt = Date.now();
    this.workingCapabilities = [];
    this.failedCapabilities = [];
    this.experimentalCapabilities = [];
  }

  // Add a working/successful capability
  addWorkingCapability(gene: CapabilityGene): void {
    this.workingCapabilities.push(gene);
  }

  // Move a failed capability to history
  addFailedCapability(gene: CapabilityGene): void {
    this.failedCapabilities.push(gene);
  }

  // Add an experimental mutation
  addExperimentalCapability(gene: CapabilityGene): void {
    this.experimentalCapabilities.push(gene);
  }

  // Record test results at a difficulty level
  recordTestResult(level: 'basic' | 'intermediate' | 'advanced' | 'expert' | 'elite', result: TestResult): void {
    this.testResults.set(level, result);
    this.updateFitness();
  }

  // Calculate overall fitness based on all test results
  private updateFitness(): void {
    if (this.testResults.size === 0) {
      this.fitnessScore = 0;
      return;
    }

    let totalScore = 0;
    const levels = ['basic', 'intermediate', 'advanced', 'expert', 'elite'] as const;
    const levelWeights: Record<string, number> = {
      basic: 0.10,
      intermediate: 0.20,
      advanced: 0.30,
      expert: 0.25,
      elite: 0.15,
    };

    for (const level of levels) {
      const result = this.testResults.get(level);
      if (result) {
        const passRate = result.passed / result.testsRun;
        const levelWeight = levelWeights[level] || 0;
        totalScore += passRate * levelWeight;
      }
    }

    this.fitnessScore = Math.min(1, totalScore);
  }

  // Get summary for reproduction/evolution decisions
  getSummary() {
    return {
      id: this.id,
      generation: this.generation,
      fitnessScore: this.fitnessScore,
      workingCount: this.workingCapabilities.length,
      failedCount: this.failedCapabilities.length,
      experimentalCount: this.experimentalCapabilities.length,
      totalCapabilities: this.workingCapabilities.length + this.experimentalCapabilities.length,
      testLevels: Array.from(this.testResults.keys()),
      createdAt: this.createdAt,
    };
  }

  // Prepare for reproduction (cross capabilities with another variant)
  toJSON() {
    return {
      id: this.id,
      generation: this.generation,
      parentId: this.parentId,
      createdAt: this.createdAt,
      fitnessScore: this.fitnessScore,
      workingCapabilities: this.workingCapabilities,
      failedCapabilities: this.failedCapabilities,
      experimentalCapabilities: this.experimentalCapabilities,
      testResults: Object.fromEntries(this.testResults),
      mutations: this.mutations,
    };
  }

  static fromJSON(data: any): ModelVariant {
    const variant = new ModelVariant(data.generation, data.parentId);
    variant.id = data.id;
    variant.createdAt = data.createdAt;
    variant.fitnessScore = data.fitnessScore;
    variant.workingCapabilities = data.workingCapabilities || [];
    variant.failedCapabilities = data.failedCapabilities || [];
    variant.experimentalCapabilities = data.experimentalCapabilities || [];
    variant.mutations = data.mutations || [];

    if (data.testResults) {
      Object.entries(data.testResults).forEach(([level, result]: [string, any]) => {
        variant.testResults.set(level, result);
      });
    }

    return variant;
  }
}
