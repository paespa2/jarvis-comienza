/**
 * JARVIS REASONING EVOLUTION
 *
 * Self-improvement system for Jarvis's reasoning
 * Evolves rules, confidence scores, and genome based on execution results
 */

import { PersistentMemoryManager } from '../persistence/PersistentMemoryManager';
import { JarvisAutonomousReasoner } from './JarvisAutonomousReasoner';
import { ReasoningOutput, ActionStep } from './JarvisAutonomousReasoner';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ReasoningExecution {
  query: string;
  reasoning: ReasoningOutput;
  actions: ActionStep[];
  result: any;
  success: boolean;
  duration: number;
  timestamp: number;
}

export interface EvolutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  generationsEvolved: number;
  currentFitness: number;
}

// ============================================
// REASONING EVOLUTION
// ============================================

export class JarvisReasoningEvolution {
  private memoryManager: PersistentMemoryManager;
  private reasoner: JarvisAutonomousReasoner;
  private executionHistory: ReasoningExecution[] = [];
  private confidenceDecay: number = 0.1; // How much confidence changes per execution

  constructor(
    memoryManager: PersistentMemoryManager,
    reasoner: JarvisAutonomousReasoner
  ) {
    this.memoryManager = memoryManager;
    this.reasoner = reasoner;
  }

  /**
   * Record a reasoning execution
   * This is called after Jarvis completes a task
   */
  async recordExecution(options: {
    query: string;
    reasoning: ReasoningOutput;
    result: any;
    success: boolean;
    duration: number;
  }): Promise<void> {
    const execution: ReasoningExecution = {
      query: options.query,
      reasoning: options.reasoning,
      actions: options.reasoning.plan,
      result: options.result,
      success: options.success,
      duration: options.duration,
      timestamp: Date.now()
    };

    this.executionHistory.push(execution);

    console.log('\n🧬 REASONING EVOLUTION');
    console.log(`   Query: "${options.query}"`);
    console.log(`   Result: ${options.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Duration: ${options.duration}ms`);

    // Learn from the execution
    await this.learnFromExecution(execution);

    // Evolve genome if needed
    await this.evolveGenome(execution);
  }

  /**
   * Learn from successful executions
   * Extract rules and patterns that worked
   */
  private async learnFromExecution(
    execution: ReasoningExecution
  ): Promise<void> {
    const { query, success, reasoning, duration } = execution;

    if (success) {
      // Extract pattern that worked
      const pattern = this.extractSuccessfulPattern(query, reasoning);
      console.log(`   📚 Learned pattern: ${pattern}`);

      // Save as lesson
      await this.memoryManager.saveLesson({
        concept: pattern,
        rule: this.createRuleFromPattern(pattern, reasoning),
        successRate: 0.95,
        source: 'learned'
      });

      // Create or update skill
      const actionName = reasoning.plan[0]?.action;
      if (actionName) {
        const existingSkill = await this.memoryManager.getSkill(actionName);

        if (existingSkill) {
          // Increase effectiveness
          const newEffectiveness = Math.min(
            existingSkill.effectiveness + this.confidenceDecay,
            1.0
          );
          await this.memoryManager.updateSkillEffectiveness(
            actionName,
            newEffectiveness
          );
          console.log(
            `   🔧 Improved skill: ${actionName} → ${(newEffectiveness * 100).toFixed(1)}%`
          );
        } else {
          // Create new skill
          await this.memoryManager.saveSkill({
            name: actionName,
            type: 'tool',
            implementation: `Learned from successful execution of: ${query}`,
            effectiveness: 0.85
          });
          console.log(`   🆕 Created skill: ${actionName}`);
        }
      }
    } else {
      // Learn from failures
      const antiPattern = this.extractFailedPattern(query, reasoning);
      console.log(`   ⚠️  Anti-pattern: ${antiPattern}`);

      // Decrease confidence in the approach
      const reasoning_rules = reasoning.reasoning.find(
        s => s.name === 'INFERENCE'
      )?.data?.inferenceChain;

      if (reasoning_rules && Array.isArray(reasoning_rules)) {
        for (const ruleName of reasoning_rules) {
          const lesson = await this.memoryManager.getLesson(ruleName);
          if (lesson) {
            const newRate = Math.max(lesson.successRate - this.confidenceDecay, 0);
            await this.memoryManager.updateLessonSuccessRate(ruleName, newRate);
            console.log(
              `   ⬇️  Decreased: ${ruleName} → ${(newRate * 100).toFixed(1)}%`
            );
          }
        }
      }
    }
  }

  /**
   * Evolve the genome based on execution results
   * The genome encodes the system's reasoning preferences
   */
  private async evolveGenome(execution: ReasoningExecution): Promise<void> {
    const currentGenome = await this.memoryManager.getLatestGenome();

    // Calculate new fitness based on execution
    let newFitness = currentGenome.fitnessScore;

    if (execution.success) {
      // Success: increase fitness
      newFitness = Math.min(
        currentGenome.fitnessScore + 0.05 * (1 - execution.reasoning.confidence),
        1.0
      );

      console.log(`   📈 Fitness increased: ${newFitness.toFixed(2)}`);
    } else {
      // Failure: decrease fitness
      newFitness = Math.max(currentGenome.fitnessScore - 0.1, 0.1);

      console.log(`   📉 Fitness decreased: ${newFitness.toFixed(2)}`);
    }

    // Mutate the genome vector
    const mutatedVector = this.mutateGenomeVector(
      currentGenome.mutationVector,
      execution.success
    );

    // Save new genome generation
    await this.memoryManager.saveGenome({
      generationId: currentGenome.generationId + 1,
      timestamp: Date.now(),
      mutationVector: mutatedVector,
      fitnessScore: newFitness,
      changes: execution.success ? 'REINFORCEMENT' : 'ADAPTATION',
      parentGeneration: currentGenome.generationId
    });

    console.log(`   🧬 New generation: ${currentGenome.generationId + 1}`);
    console.log(
      `   📊 Mutation vector: [${mutatedVector.map(v => v.toFixed(2)).join(', ')}]`
    );
  }

  /**
   * Mutate the genome vector
   * Small random changes to explore better strategies
   */
  private mutateGenomeVector(
    vector: number[],
    success: boolean
  ): number[] {
    return vector.map(v => {
      if (success) {
        // Successful: reinforce by adding small positive change
        const change = (Math.random() - 0.5) * 0.15; // ±7.5%
        return Math.max(0, Math.min(1, v + change));
      } else {
        // Failed: adapt by larger change
        const change = (Math.random() - 0.5) * 0.25; // ±12.5%
        return Math.max(0, Math.min(1, v + change));
      }
    });
  }

  /**
   * Extract successful pattern from execution
   */
  private extractSuccessfulPattern(
    query: string,
    reasoning: ReasoningOutput
  ): string {
    const queryType = this.classifyQuery(query);
    const confidence = reasoning.confidence;

    if (confidence > 0.9) {
      return `HIGH_CONFIDENCE_${queryType}`;
    } else if (confidence > 0.7) {
      return `MEDIUM_CONFIDENCE_${queryType}`;
    } else {
      return `LUCKY_${queryType}`;
    }
  }

  /**
   * Extract failed pattern from execution
   */
  private extractFailedPattern(
    query: string,
    reasoning: ReasoningOutput
  ): string {
    const queryType = this.classifyQuery(query);
    return `FAILED_${queryType}_APPROACH`;
  }

  /**
   * Create rule from pattern
   */
  private createRuleFromPattern(
    pattern: string,
    reasoning: ReasoningOutput
  ): string {
    const actions = reasoning.plan.map(p => p.action).join(' → ');
    return `IF ${pattern} THEN apply_steps: ${actions}`;
  }

  /**
   * Classify query type
   */
  private classifyQuery(query: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('search') || lower.includes('busca')) return 'SEARCH';
    if (lower.includes('execute') || lower.includes('ejecuta')) return 'EXEC';
    if (lower.includes('analyze')) return 'ANALYZE';
    return 'OTHER';
  }

  /**
   * Get evolution metrics
   */
  async getMetrics(): Promise<EvolutionMetrics> {
    const successful = this.executionHistory.filter(e => e.success).length;
    const failed = this.executionHistory.filter(e => !e.success).length;
    const totalExecutions = this.executionHistory.length;

    const avgConfidence =
      totalExecutions > 0
        ? this.executionHistory.reduce(
            (sum, e) => sum + e.reasoning.confidence,
            0
          ) / totalExecutions
        : 0;

    const avgTime =
      totalExecutions > 0
        ? this.executionHistory.reduce((sum, e) => sum + e.duration, 0) /
          totalExecutions
        : 0;

    const currentGenome = await this.memoryManager.getLatestGenome();
    const stats = await this.memoryManager.getStatistics();

    return {
      totalExecutions,
      successfulExecutions: successful,
      failedExecutions: failed,
      successRate: totalExecutions > 0 ? successful / totalExecutions : 0,
      averageConfidence: avgConfidence,
      averageExecutionTime: avgTime,
      generationsEvolved: currentGenome.generationId,
      currentFitness: currentGenome.fitnessScore
    };
  }

  /**
   * Log detailed evolution metrics
   */
  async logMetrics(): Promise<void> {
    const metrics = await this.getMetrics();

    console.log('\n📊 REASONING EVOLUTION METRICS');
    console.log(
      `   Total executions: ${metrics.totalExecutions}`
    );
    console.log(
      `   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`
    );
    console.log(
      `   Average confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`
    );
    console.log(
      `   Average execution time: ${metrics.averageExecutionTime.toFixed(0)}ms`
    );
    console.log(
      `   Generations evolved: ${metrics.generationsEvolved}`
    );
    console.log(
      `   Current fitness: ${metrics.currentFitness.toFixed(2)}`
    );
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ReasoningExecution[] {
    return this.executionHistory;
  }

  /**
   * Reset evolution (for testing)
   */
  reset(): void {
    this.executionHistory = [];
  }
}
