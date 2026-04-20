/**
 * JARVIS AUTONOMOUS REASONER
 *
 * Main reasoning engine for Jarvis IA
 * Performs autonomous reasoning without external APIs
 *
 * Architecture:
 * Stage 1: Knowledge Retrieval
 * Stage 2: Pattern Matching
 * Stage 3: Inference (Backward/Forward Chaining)
 * Stage 4: Execution Planning
 */

import { PersistentMemoryManager } from '../persistence/PersistentMemoryManager';
import { InferenceEngine, Fact, Rule, InferenceResult } from './InferenceEngine';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ReasoningStage {
  name: string;
  timestamp: number;
  duration: number;
  data: any;
}

export interface ActionStep {
  stepId: string;
  action: string;
  parameters: Record<string, any>;
  estimatedTime: number;
  fallback: 'retry' | 'abort' | 'skip';
  condition: string[];
}

export interface ReasoningOutput {
  query: string;
  reasoning: ReasoningStage[];
  plan: ActionStep[];
  confidence: number;
  totalTime: number;
  generatedAt: number;
}

// ============================================
// JARVIS AUTONOMOUS REASONER
// ============================================

export class JarvisAutonomousReasoner {
  private memoryManager: PersistentMemoryManager;
  private inferenceEngine: InferenceEngine;
  private confidenceThreshold: number = 0.6;
  private maxPlanSteps: number = 10;

  constructor(memoryManager: PersistentMemoryManager) {
    this.memoryManager = memoryManager;
    this.inferenceEngine = new InferenceEngine([], [], this.confidenceThreshold);
  }

  /**
   * Main reasoning method
   * Performs all 4 stages of reasoning
   */
  async reason(query: string, context: any = {}): Promise<ReasoningOutput> {
    const startTime = Date.now();
    const stages: ReasoningStage[] = [];

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧠 JARVIS AUTONOMOUS REASONING`);
    console.log(`Query: "${query}"`);
    console.log(`${'='.repeat(70)}\n`);

    // ================================================
    // STAGE 1: KNOWLEDGE RETRIEVAL
    // ================================================
    console.log('📚 STAGE 1: Knowledge Retrieval');
    const stage1Start = Date.now();

    const keywords = this.extractKeywords(query);
    const relevantLessons = await this.memoryManager.searchLessons(keywords);
    const relevantSkills = await this.memoryManager.searchSkills(keywords);
    const similarEpisodes = await this.memoryManager.findSimilarEpisodes(
      query,
      { limit: 5 }
    );
    const currentGenome = await this.memoryManager.getLatestGenome();

    stages.push({
      name: 'KNOWLEDGE_RETRIEVAL',
      timestamp: Date.now(),
      duration: Date.now() - stage1Start,
      data: {
        keywordsFound: keywords.length,
        lessonsRetrieved: relevantLessons.length,
        skillsRetrieved: relevantSkills.length,
        similarEpisodesFound: similarEpisodes.length,
        currentGeneration: currentGenome.generationId
      }
    });

    console.log(`   ✅ Keywords: ${keywords.length}`);
    console.log(`   ✅ Lessons: ${relevantLessons.length}`);
    console.log(`   ✅ Skills: ${relevantSkills.length}`);
    console.log(`   ✅ Similar episodes: ${similarEpisodes.length}\n`);

    // ================================================
    // STAGE 2: PATTERN MATCHING
    // ================================================
    console.log('🔍 STAGE 2: Pattern Matching');
    const stage2Start = Date.now();

    const patterns = this.identifyPatterns(query, similarEpisodes);
    const queryType = this.classifyQueryType(query, patterns);
    const complexity = this.estimateComplexity(query, patterns);

    stages.push({
      name: 'PATTERN_MATCHING',
      timestamp: Date.now(),
      duration: Date.now() - stage2Start,
      data: {
        patternsFound: patterns.length,
        queryType,
        complexity,
        patterns: patterns.map(p => ({ name: p.name, confidence: p.confidence }))
      }
    });

    console.log(`   ✅ Query type: ${queryType}`);
    console.log(`   ✅ Complexity: ${complexity}`);
    console.log(`   ✅ Patterns matched: ${patterns.length}\n`);

    // ================================================
    // STAGE 3: INFERENCE & REASONING
    // ================================================
    console.log('⚙️  STAGE 3: Inference & Reasoning');
    const stage3Start = Date.now();

    // Load facts from memory into inference engine
    this.loadFactsFromLessons(relevantLessons, currentGenome);

    // Add query as initial fact
    this.inferenceEngine.addFact({
      property: 'query_type',
      value: queryType,
      confidence: 0.9
    });

    // Perform inference
    const inferenceResult = await this.inferenceEngine.backwardChain(
      `execute_${queryType.toLowerCase()}`
    );

    // Calculate confidence
    const inferenceConfidence = this.calculateInferenceConfidence(
      inferenceResult,
      relevantLessons,
      similarEpisodes
    );

    stages.push({
      name: 'INFERENCE',
      timestamp: Date.now(),
      duration: Date.now() - stage3Start,
      data: {
        rulesApplied: inferenceResult.usedRules.length,
        factsDerivced: inferenceResult.derivedFacts.length,
        confidence: inferenceConfidence,
        inferenceChain: inferenceResult.usedRules
      }
    });

    console.log(`   ✅ Rules applied: ${inferenceResult.usedRules.length}`);
    console.log(`   ✅ Facts derived: ${inferenceResult.derivedFacts.length}`);
    console.log(`   ✅ Inference confidence: ${(inferenceConfidence * 100).toFixed(1)}%\n`);

    // ================================================
    // STAGE 4: EXECUTION PLANNING
    // ================================================
    console.log('📋 STAGE 4: Execution Planning');
    const stage4Start = Date.now();

    const actionPlan = this.generateActionPlan(
      queryType,
      relevantSkills,
      inferenceResult,
      complexity,
      currentGenome
    );

    stages.push({
      name: 'EXECUTION_PLANNING',
      timestamp: Date.now(),
      duration: Date.now() - stage4Start,
      data: {
        planSteps: actionPlan.length,
        estimatedDuration: actionPlan.reduce((t, s) => t + s.estimatedTime, 0),
        plan: actionPlan.map(s => ({ stepId: s.stepId, action: s.action }))
      }
    });

    console.log(`   ✅ Action steps: ${actionPlan.length}`);
    console.log(
      `   ✅ Estimated time: ${actionPlan.reduce((t, s) => t + s.estimatedTime, 0)}ms\n`
    );

    // ================================================
    // COMPILE OUTPUT
    // ================================================

    const totalTime = Date.now() - startTime;
    const finalConfidence = Math.min(
      inferenceConfidence,
      Math.max(...patterns.map(p => p.confidence), 0.5)
    );

    const output: ReasoningOutput = {
      query,
      reasoning: stages,
      plan: actionPlan,
      confidence: finalConfidence,
      totalTime,
      generatedAt: Date.now()
    };

    console.log(`${'='.repeat(70)}`);
    console.log(`✅ REASONING COMPLETE`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Final confidence: ${(finalConfidence * 100).toFixed(1)}%`);
    console.log(`   Plan steps: ${actionPlan.length}`);
    console.log(`${'='.repeat(70)}\n`);

    return output;
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopwords = [
      'el', 'la', 'de', 'en', 'un', 'una', 'y', 'o', 'por', 'para',
      'con', 'sin', 'que', 'como', 'si', 'es', 'son', 'fue', 'fueron',
      'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for'
    ];

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopwords.includes(word) && word.length > 2)
      .map(word => word.replace(/[^\w]/g, ''))
      .slice(0, 10);
  }

  /**
   * Identify patterns in similar episodes
   */
  private identifyPatterns(
    query: string,
    episodes: any[]
  ): { name: string; confidence: number; similarity: number }[] {
    const patterns: Map<string, number> = new Map();

    for (const episode of episodes) {
      const similarity = this.cosineSimilarity(query, episode.query);

      if (similarity > 0.4) {
        const pattern = this.extractPatternFromActions(episode.actions || []);
        patterns.set(pattern, (patterns.get(pattern) || 0) + similarity);
      }
    }

    return Array.from(patterns.entries())
      .map(([name, score]) => ({
        name,
        confidence: Math.min(score / 2, 1),
        similarity: score / Math.max(episodes.length, 1)
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Classify query type
   */
  private classifyQueryType(
    query: string,
    patterns: any[]
  ): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('search') || lowerQuery.includes('busca')) {
      return 'SEARCH';
    }
    if (
      lowerQuery.includes('execute') ||
      lowerQuery.includes('run') ||
      lowerQuery.includes('ejecuta')
    ) {
      return 'EXECUTION';
    }
    if (lowerQuery.includes('analyze') || lowerQuery.includes('analiza')) {
      return 'ANALYSIS';
    }
    if (
      lowerQuery.includes('learn') ||
      lowerQuery.includes('explain') ||
      lowerQuery.includes('enseña')
    ) {
      return 'LEARNING';
    }
    if (
      lowerQuery.includes('optimize') ||
      lowerQuery.includes('improve') ||
      lowerQuery.includes('mejor')
    ) {
      return 'OPTIMIZATION';
    }

    return 'GENERAL';
  }

  /**
   * Estimate query complexity
   */
  private estimateComplexity(
    query: string,
    patterns: any[]
  ): 'simple' | 'moderate' | 'complex' {
    const score = query.length / 10 + patterns.length * 0.5;

    if (score < 10) return 'simple';
    if (score < 25) return 'moderate';
    return 'complex';
  }

  /**
   * Load facts from lessons into inference engine
   */
  private loadFactsFromLessons(lessons: any[], genome: any): void {
    for (const lesson of lessons) {
      // Parse rule to extract facts
      const concept = lesson.concept;
      const successRate = lesson.successRate;

      this.inferenceEngine.addFact({
        property: 'known_pattern',
        value: concept,
        confidence: successRate
      });
    }

    // Add genome fitness as a fact
    this.inferenceEngine.addFact({
      property: 'system_fitness',
      value: genome.fitnessScore.toString(),
      confidence: 0.95
    });
  }

  /**
   * Calculate inference confidence
   */
  private calculateInferenceConfidence(
    inference: InferenceResult,
    lessons: any[],
    episodes: any[]
  ): number {
    const lessonConfidence =
      lessons.length > 0
        ? lessons.reduce((sum, l) => sum + l.successRate, 0) / lessons.length
        : 0.3;

    const episodeSuccess = episodes.filter(e => e.success).length;
    const episodeConfidence =
      episodes.length > 0 ? episodeSuccess / episodes.length : 0.3;

    const inferenceLength = Math.min(inference.usedRules.length / 5, 1);

    return lessonConfidence * 0.4 + episodeConfidence * 0.4 + inferenceLength * 0.2;
  }

  /**
   * Extract pattern from actions
   */
  private extractPatternFromActions(actions: any[]): string {
    if (!actions || actions.length === 0) return 'UNKNOWN';
    return actions[0]?.split('_')[0]?.toUpperCase() || 'UNKNOWN';
  }

  /**
   * Cosine similarity between two strings
   */
  private cosineSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size, 1);
  }

  /**
   * Generate action plan
   */
  private generateActionPlan(
    queryType: string,
    skills: any[],
    inference: InferenceResult,
    complexity: string,
    genome: any
  ): ActionStep[] {
    const steps: ActionStep[] = [];

    // Default actions based on query type
    const actionMap: Record<string, string> = {
      SEARCH: 'search_knowledge_base',
      EXECUTION: 'execute_skill',
      ANALYSIS: 'analyze_content',
      LEARNING: 'retrieve_knowledge',
      OPTIMIZATION: 'optimize_strategy',
      GENERAL: 'process_query'
    };

    const mainAction = actionMap[queryType] || actionMap['GENERAL'];

    // Find matching skill
    const matchingSkill = skills.find(
      s => s.name === mainAction || s.name.includes(queryType.toLowerCase())
    );

    // Create main action step
    steps.push({
      stepId: `step_1_${queryType}`,
      action: mainAction,
      parameters: {
        confidence: inference.confidence,
        timeout: complexity === 'complex' ? 60000 : 30000,
        retries: Math.max(1, Math.round(genome.mutationVector[1] * 3))
      },
      estimatedTime:
        matchingSkill?.effectiveness > 0.8
          ? 5000
          : complexity === 'complex'
            ? 15000
            : 10000,
      fallback: 'retry',
      condition: inference.derivedFacts.map(f => `${f.property}=${f.value}`)
    });

    // Add consolidation step
    if (steps.length < this.maxPlanSteps) {
      steps.push({
        stepId: `step_${steps.length + 1}_consolidate`,
        action: 'consolidate_experience',
        parameters: {
          saveEpisode: true,
          updateGenome: true
        },
        estimatedTime: 2000,
        fallback: 'skip',
        condition: []
      });
    }

    return steps;
  }

  /**
   * Get inference engine for advanced usage
   */
  getInferenceEngine(): InferenceEngine {
    return this.inferenceEngine;
  }
}
