/**
 * JARVIS SELF-KNOWLEDGE ACCESSOR
 *
 * Enables Jarvis to read and analyze its own persisted learning data.
 * Solves: Jarvis doesn't use own knowledge in responses
 * Enables: Auto-improvement cycles and self-aware responses
 */

import fetch from "node-fetch";

export interface JarvisState {
  currentSnapshot: {
    timestamp: number;
    strengthScore: number;
    appliedOptimizations: string[];
    evolutionSteps: number;
    performanceMetrics: {
      averageResponseTime: number;
      successRate: number;
      userSatisfaction: number;
    };
  } | null;
  status: string;
}

export interface KnowledgeMetrics {
  techniques: number;
  instructions: number;
  prompts: number;
  vulnerabilities: number;
  initialized: boolean;
}

export interface ProgressMetrics {
  currentStrength: number;
  baselineStrength: number;
  improvement: number;
  improvementPercent: number;
  targetStrength: number;
  targetRemaining: number;
}

export interface LearningInsights {
  strengthTrend: {
    isImproving: boolean;
    rate: number; // % per day
    nextEstimatedMilestone: number; // Days until next strength milestone
  };
  effectiveStrategies: string[];
  improvementOpportunities: string[];
  nextMilestone: number; // Next target strength %
}

export interface SelfAnalysis {
  readTime: number;
  dataAvailable: boolean;
  strengthTrend: string;
  effectiveStrategies: string[];
  recommendations: string[];
  confidence: number;
}

export class JarvisSelfKnowledgeAccessor {
  private apiBase: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheValidityMs: number = 5 * 60 * 1000; // 5 minute cache

  constructor(apiBase: string = "http://localhost:3000") {
    this.apiBase = apiBase;
  }

  /**
   * Read own persisted state
   */
  async readOwnState(): Promise<JarvisState> {
    const cached = this.getFromCache("state");
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiBase}/api/persistence/state`);
      const data = (await response.json()) as { data: JarvisState };

      this.setCache("state", data.data);
      return data.data;
    } catch (error) {
      console.error("[SelfKnowledgeAccessor] Error reading own state:", error);
      return {
        currentSnapshot: null,
        status: "⚠️  Error reading state"
      };
    }
  }

  /**
   * Read knowledge acquired so far
   */
  async readOwnKnowledge(): Promise<KnowledgeMetrics> {
    const cached = this.getFromCache("knowledge");
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiBase}/api/datasets/status`);
      const data = (await response.json()) as { data: { knowledgeBase: KnowledgeMetrics } };

      this.setCache("knowledge", data.data.knowledgeBase);
      return data.data.knowledgeBase;
    } catch (error) {
      console.error("[SelfKnowledgeAccessor] Error reading own knowledge:", error);
      return {
        techniques: 0,
        instructions: 0,
        prompts: 0,
        vulnerabilities: 0,
        initialized: false
      };
    }
  }

  /**
   * Read strength progression
   */
  async readOwnProgress(): Promise<ProgressMetrics> {
    const cached = this.getFromCache("progress");
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiBase}/api/metrics/strength`);
      const data = (await response.json()) as { data: ProgressMetrics };

      this.setCache("progress", data.data);
      return data.data;
    } catch (error) {
      console.error("[SelfKnowledgeAccessor] Error reading own progress:", error);
      return {
        currentStrength: 0,
        baselineStrength: 65,
        improvement: 0,
        improvementPercent: 0,
        targetStrength: 85,
        targetRemaining: 85
      };
    }
  }

  /**
   * Read learning history
   */
  async readOwnLearning(): Promise<LearningInsights> {
    const cached = this.getFromCache("learning");
    if (cached) return cached;

    try {
      // Fetch timeline for trend analysis
      const timelineResponse = await fetch(`${this.apiBase}/api/metrics/strength/timeline`);
      const timelineData = (await timelineResponse.json()) as {
        data: { timeline: Array<{ strength: number; date: string }> };
      };

      // Fetch learning report for effective strategies
      const reportResponse = await fetch(`${this.apiBase}/api/learning/report`);
      const reportData = (await reportResponse.json()) as {
        data: {
          fineTuningMetrics: Array<{ datasetsUsed: string[]; improvementEstimated: number }>;
        };
      };

      const insights = this.analyzeData(timelineData.data.timeline, reportData.data.fineTuningMetrics);

      this.setCache("learning", insights);
      return insights;
    } catch (error) {
      console.error("[SelfKnowledgeAccessor] Error reading own learning:", error);
      return {
        strengthTrend: {
          isImproving: false,
          rate: 0,
          nextEstimatedMilestone: 0
        },
        effectiveStrategies: [],
        improvementOpportunities: [],
        nextMilestone: 70
      };
    }
  }

  /**
   * Generate comprehensive self-analysis
   */
  async generateSelfAnalysis(): Promise<SelfAnalysis> {
    const startTime = Date.now();

    try {
      const [state, knowledge, progress, learning] = await Promise.all([
        this.readOwnState(),
        this.readOwnKnowledge(),
        this.readOwnProgress(),
        this.readOwnLearning()
      ]);

      const readTime = Date.now() - startTime;

      return {
        readTime,
        dataAvailable: state.currentSnapshot !== null,
        strengthTrend: learning.strengthTrend.isImproving ? "📈 Improving" : "📉 Plateaued",
        effectiveStrategies: learning.effectiveStrategies,
        recommendations: this.generateRecommendations(state, knowledge, progress, learning),
        confidence: this.calculateConfidence(state, knowledge, progress)
      };
    } catch (error) {
      console.error("[SelfKnowledgeAccessor] Error generating self-analysis:", error);
      return {
        readTime: 0,
        dataAvailable: false,
        strengthTrend: "❌ Error",
        effectiveStrategies: [],
        recommendations: ["Unable to analyze self-knowledge at this moment"],
        confidence: 0
      };
    }
  }

  /**
   * Get insight about a specific topic
   */
  async getTopicExpertise(topic: string): Promise<{
    isExpert: boolean;
    confidence: number;
    suggestedResources: string[];
  }> {
    const knowledge = await this.readOwnKnowledge();

    // Simple heuristic: if we have knowledge about this topic
    const topicConfidence = this.calculateTopicConfidence(topic, knowledge);

    return {
      isExpert: topicConfidence > 0.7,
      confidence: topicConfidence,
      suggestedResources: topicConfidence < 0.5 ? [`Download more data about ${topic}`] : []
    };
  }

  /**
   * Check if plateau detected (should trigger auto-improvement)
   */
  async isStrengthPlateaued(): Promise<boolean> {
    try {
      const timelineResponse = await fetch(`${this.apiBase}/api/metrics/strength/timeline`);
      const data = (await timelineResponse.json()) as {
        data: { timeline: Array<{ strength: number }> };
      };

      const timeline = data.data.timeline;
      if (timeline.length < 3) return false;

      // Check last 3 measurements
      const recent = timeline.slice(-3).map(t => t.strength);
      const variance = Math.max(...recent) - Math.min(...recent);

      // Plateau if variance is less than 0.5%
      return variance < 0.5;
    } catch (error) {
      return false;
    }
  }

  /**
   * Suggest next learning action
   */
  async suggestNextLearningAction(): Promise<string> {
    const progress = await this.readOwnProgress();
    const learning = await this.readOwnLearning();

    if (progress.improvement === 0) {
      return "Download new security datasets to expand knowledge";
    }

    if (learning.strengthTrend.isImproving) {
      return "Continue with current learning strategy - it's working!";
    }

    if (await this.isStrengthPlateaued()) {
      return "Strength has plateaued - trigger fine-tuning with new datasets";
    }

    return "Review what patterns worked best and apply them more";
  }

  // ========================
  // Private Helper Methods
  // ========================

  private analyzeData(
    timeline: Array<{ strength: number; date: string }>,
    metrics: Array<{ datasetsUsed: string[]; improvementEstimated: number }>
  ): LearningInsights {
    if (timeline.length === 0) {
      return {
        strengthTrend: {
          isImproving: false,
          rate: 0,
          nextEstimatedMilestone: 0
        },
        effectiveStrategies: [],
        improvementOpportunities: [],
        nextMilestone: 70
      };
    }

    // Calculate trend
    const recentStrengths = timeline.slice(-5).map(t => t.strength);
    const isImproving = recentStrengths[recentStrengths.length - 1] > recentStrengths[0];
    const rate = isImproving ? Math.abs(recentStrengths[recentStrengths.length - 1] - recentStrengths[0]) / 5 : 0;

    // Identify effective strategies from metrics
    const effective = metrics
      .filter(m => m.improvementEstimated > 2)
      .flatMap(m => m.datasetsUsed);

    // Current strength target
    const currentStrength = recentStrengths[recentStrengths.length - 1];
    const nextMilestone = Math.ceil(currentStrength / 5) * 5 + 5;

    return {
      strengthTrend: {
        isImproving,
        rate,
        nextEstimatedMilestone: rate > 0 ? Math.ceil((nextMilestone - currentStrength) / rate) : 0
      },
      effectiveStrategies: [...new Set(effective)],
      improvementOpportunities: this.identifyGaps(currentStrength),
      nextMilestone
    };
  }

  private identifyGaps(currentStrength: number): string[] {
    const gaps: string[] = [];

    if (currentStrength < 70) {
      gaps.push("Knowledge Breadth - download more security prompts");
    }
    if (currentStrength < 75) {
      gaps.push("Technique Mastery - study more MITRE techniques");
    }
    if (currentStrength < 80) {
      gaps.push("Exploitation Capability - analyze more code vulnerabilities");
    }

    return gaps;
  }

  private generateRecommendations(
    state: JarvisState,
    knowledge: KnowledgeMetrics,
    progress: ProgressMetrics,
    learning: LearningInsights
  ): string[] {
    const recommendations: string[] = [];

    // Recommendation 1: Data gaps
    if (knowledge.techniques < 1500) {
      recommendations.push("Download more MITRE ATT&CK techniques to improve mastery");
    }
    if (knowledge.vulnerabilities < 3000) {
      recommendations.push("Process more vulnerability data to strengthen exploitation capability");
    }

    // Recommendation 2: Learning strategies
    if (learning.effectiveStrategies.length > 0) {
      recommendations.push(`Double down on: ${learning.effectiveStrategies[0]} (proven effective)`);
    }

    // Recommendation 3: Next milestone
    if (progress.currentStrength < progress.targetStrength) {
      const gap = progress.targetStrength - progress.currentStrength;
      recommendations.push(`${gap.toFixed(1)}% to reach target - ${learning.strengthTrend.isImproving ? "on track!" : "needs acceleration"}`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue learning - you're on a good trajectory");
    }

    return recommendations;
  }

  private calculateConfidence(state: JarvisState, knowledge: KnowledgeMetrics, progress: ProgressMetrics): number {
    let confidence = 0.5; // Base 50%

    if (state.currentSnapshot) confidence += 0.1; // State exists
    if (knowledge.initialized) confidence += 0.1; // Knowledge loaded
    if (progress.improvement > 0) confidence += 0.1; // Making progress
    if (progress.currentStrength > progress.baselineStrength) confidence += 0.1; // Actually improved

    return Math.min(confidence, 1.0);
  }

  private calculateTopicConfidence(topic: string, knowledge: KnowledgeMetrics): number {
    // Simple heuristic based on total knowledge
    const topicKeywords = {
      sql: "instructions",
      xss: "instructions",
      rce: "vulnerabilities",
      techniques: "techniques",
      mitre: "techniques"
    };

    const topicLower = topic.toLowerCase();

    // Check if topic matches keywords
    for (const [keyword, metric] of Object.entries(topicKeywords)) {
      if (topicLower.includes(keyword)) {
        const value = knowledge[metric as keyof KnowledgeMetrics] as number;
        return Math.min(value / 1000, 1.0); // 1000 = 100% confidence
      }
    }

    // Generic confidence based on overall knowledge
    const avgKnowledge = (knowledge.techniques + knowledge.instructions + knowledge.vulnerabilities) / 3;
    return Math.min(avgKnowledge / 1000, 1.0);
  }

  // ========================
  // Caching Utilities
  // ========================

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheValidityMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton
export const jarvisSelfKnowledgeAccessor = new JarvisSelfKnowledgeAccessor();
