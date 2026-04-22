/**
 * NON-IID RESILIENCE MONITOR
 *
 * Based on: FP-Fed paper findings on Non-IID distributions
 * Problem: Real-world users have heterogeneous data distributions
 * Solution: Detect and adapt to non-IID patterns
 *
 * Key metric: Non-IIDness score via Kullback-Leibler divergence
 * FP-Fed showed: System resilient up to 80% non-IID participants
 */

interface ParticipantProfile {
  userId: string;
  intentDistribution: Map<string, number>;  // What types of queries
  expertPreferences: Map<string, number>;   // Which experts they use
  queryPatterns: string[];
  lastUpdate: number;
}

interface NonIIDMetrics {
  nonIIDScore: number;           // 0 (IID) to ∞ (extremely non-IID)
  averageKLDivergence: number;
  problematicParticipants: number;
  estimatedResilience: number;   // % how robust system is
  adaptationLevel: 'none' | 'low' | 'medium' | 'high';
}

interface AdaptationStrategy {
  increaseParticipantsPerRound: boolean;
  increaseTrainingRounds: boolean;
  adjustNoiseScale: boolean;
  enableGradientClipping: boolean;
}

export class NonIIDResilienceMonitor {
  private participants: Map<string, ParticipantProfile> = new Map();
  private globalIntentDistribution: Map<string, number> = new Map();
  private metricsHistory: NonIIDMetrics[] = [];

  /**
   * Register or update participant profile
   */
  updateParticipantProfile(
    userId: string,
    intentCounts: Map<string, number>,
    expertCounts: Map<string, number>,
    recentQueries: string[],
  ): void {
    const profile: ParticipantProfile = {
      userId,
      intentDistribution: intentCounts,
      expertPreferences: expertCounts,
      queryPatterns: recentQueries,
      lastUpdate: Date.now(),
    };

    this.participants.set(userId, profile);
    this.updateGlobalDistribution();
  }

  /**
   * Update global intent distribution
   */
  private updateGlobalDistribution(): void {
    const globalCounts = new Map<string, number>();

    for (const profile of this.participants.values()) {
      for (const [intent, count] of profile.intentDistribution) {
        globalCounts.set(intent, (globalCounts.get(intent) || 0) + count);
      }
    }

    this.globalIntentDistribution = globalCounts;
  }

  /**
   * Compute KL divergence between two distributions
   * D_KL(P || Q) = Σ P(x) * log(P(x) / Q(x))
   */
  private computeKLDivergence(
    p: Map<string, number>,
    q: Map<string, number>,
  ): number {
    let divergence = 0;
    const eps = 1e-10;

    // Normalize distributions
    const pTotal = Array.from(p.values()).reduce((a, b) => a + b, 0) || 1;
    const qTotal = Array.from(q.values()).reduce((a, b) => a + b, 0) || 1;

    // Compute KL divergence
    for (const [key, pCount] of p) {
      const pProb = pCount / pTotal;
      const qProb = (q.get(key) || 0) / qTotal;

      if (pProb > eps) {
        divergence += pProb * Math.log((pProb + eps) / (qProb + eps));
      }
    }

    return divergence;
  }

  /**
   * Calculate Non-IIDness score
   * Method: Average pairwise KL divergence (sampled if too many participants)
   */
  calculateNonIIDScore(): NonIIDMetrics {
    const participants = Array.from(this.participants.values());

    if (participants.length < 2) {
      return {
        nonIIDScore: 0,
        averageKLDivergence: 0,
        problematicParticipants: 0,
        estimatedResilience: 1.0,
        adaptationLevel: 'none',
      };
    }

    // Sample if too many participants (avoid O(n²) complexity)
    let sampled = participants;
    if (participants.length > 1000) {
      sampled = [];
      const sampleSize = Math.min(1000, Math.floor(participants.length / 10));
      for (let i = 0; i < sampleSize; i++) {
        const randomIdx = Math.floor(Math.random() * participants.length);
        sampled.push(participants[randomIdx]);
      }
    }

    // Compute pairwise KL divergences
    const divergences: number[] = [];
    for (let i = 0; i < sampled.length; i++) {
      for (let j = i + 1; j < sampled.length; j++) {
        const kl = this.computeKLDivergence(
          sampled[i].intentDistribution,
          sampled[j].intentDistribution,
        );
        divergences.push(kl);
      }
    }

    // Calculate statistics
    const averageKL =
      divergences.reduce((a, b) => a + b, 0) / (divergences.length || 1);
    const maxKL = Math.max(...divergences, 0);

    // Identify problematic participants (outliers)
    const threshold = averageKL + Math.sqrt(averageKL);
    let problematicCount = 0;

    for (const profile of participants) {
      const kl = this.computeKLDivergence(
        profile.intentDistribution,
        this.globalIntentDistribution,
      );
      if (kl > threshold) {
        problematicCount++;
      }
    }

    // Estimate resilience based on non-IIDness
    // FP-Fed: Resilient up to ~8.0 non-IID score (80% problematic)
    // Below 2.0: IID-like, very resilient
    // 2.0-4.0: Mild non-IID, still resilient
    // 4.0-8.0: Moderate non-IID, adaptation needed
    // 8.0+: Severe non-IID, requires significant adaptation
    const estimatedResilience = Math.max(0, 1 - (averageKL / 10));
    const adaptationLevel = this.getAdaptationLevel(averageKL);

    const metrics: NonIIDMetrics = {
      nonIIDScore: averageKL,
      averageKLDivergence: averageKL,
      problematicParticipants: problematicCount,
      estimatedResilience,
      adaptationLevel,
    };

    this.metricsHistory.push(metrics);

    return metrics;
  }

  /**
   * Determine adaptation level based on non-IIDness
   */
  private getAdaptationLevel(
    nonIIDScore: number,
  ): 'none' | 'low' | 'medium' | 'high' {
    if (nonIIDScore < 1.0) return 'none';
    if (nonIIDScore < 3.0) return 'low';
    if (nonIIDScore < 6.0) return 'medium';
    return 'high';
  }

  /**
   * Get recommended adaptation strategy based on non-IIDness
   */
  getAdaptationStrategy(metrics: NonIIDMetrics): AdaptationStrategy {
    const strategy: AdaptationStrategy = {
      increaseParticipantsPerRound: false,
      increaseTrainingRounds: false,
      adjustNoiseScale: false,
      enableGradientClipping: false,
    };

    switch (metrics.adaptationLevel) {
      case 'none':
        // No adaptation needed
        break;

      case 'low':
        // Minor adjustments
        strategy.enableGradientClipping = true;
        break;

      case 'medium':
        // Moderate adaptations
        strategy.increaseTrainingRounds = true;
        strategy.enableGradientClipping = true;
        strategy.increaseParticipantsPerRound = true;
        break;

      case 'high':
        // Significant adaptations
        strategy.increaseParticipantsPerRound = true;
        strategy.increaseTrainingRounds = true;
        strategy.enableGradientClipping = true;
        strategy.adjustNoiseScale = true;  // Reduce DP noise
        break;
    }

    return strategy;
  }

  /**
   * Get detailed report for monitoring
   */
  getMonitoringReport(): {
    metrics: NonIIDMetrics;
    strategy: AdaptationStrategy;
    recommendations: string[];
    trendAnalysis: string;
  } {
    const metrics = this.calculateNonIIDScore();
    const strategy = this.getAdaptationStrategy(metrics);
    const recommendations: string[] = [];
    let trendAnalysis = 'Stable';

    // Generate recommendations
    if (metrics.adaptationLevel !== 'none') {
      recommendations.push(
        `Non-IIDness detected (score: ${metrics.nonIIDScore.toFixed(2)})`,
      );
    }

    if (metrics.problematicParticipants > this.participants.size * 0.2) {
      recommendations.push(
        `${metrics.problematicParticipants} participants have outlier distributions`,
      );
    }

    if (metrics.estimatedResilience < 0.7) {
      recommendations.push('Consider increasing number of training rounds');
    }

    // Trend analysis
    if (this.metricsHistory.length >= 2) {
      const recent = this.metricsHistory.slice(-5);
      const avgRecent = recent.reduce((a, b) => a + b.nonIIDScore, 0) / recent.length;
      const trend = avgRecent - recent[0].nonIIDScore;

      if (trend > 0.5) {
        trendAnalysis = 'Increasing (non-IIDness growing)';
      } else if (trend < -0.5) {
        trendAnalysis = 'Decreasing (converging to IID)';
      }
    }

    return {
      metrics,
      strategy,
      recommendations,
      trendAnalysis,
    };
  }

  /**
   * Clear old profiles (participants inactive for > 30 days)
   */
  pruneInactiveParticipants(): number {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [userId, profile] of this.participants) {
      if (now - profile.lastUpdate > thirtyDaysMs) {
        this.participants.delete(userId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get active participant count
   */
  getActiveParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Export metrics for visualization
   */
  exportMetricsForVisualization(): {
    timestamp: number;
    score: number;
    resilience: number;
    level: string;
  }[] {
    return this.metricsHistory.map((m) => ({
      timestamp: Date.now(),
      score: m.nonIIDScore,
      resilience: m.estimatedResilience,
      level: m.adaptationLevel,
    }));
  }
}

// Singleton instance
export const nonIIDMonitor = new NonIIDResilienceMonitor();
