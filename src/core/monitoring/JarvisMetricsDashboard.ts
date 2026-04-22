/**
 * JARVIS METRICS DASHBOARD
 *
 * Unified monitoring system for all advanced capabilities:
 * - FedFish aggregation quality
 * - Differential Privacy budget
 * - Non-IID resilience
 * - Unanchored collaboration effectiveness
 * - DEDIER debiasing impact
 * - Expert group fairness
 *
 * Provides real-time metrics, trends, and health indicators
 */

export interface MetricsSnapshot {
  timestamp: number;
  version: string;

  // FedFish metrics
  aggregations: {
    count: number;
    averageConsensus: number;
    clientServerBarrier: number;
  };

  // Privacy metrics
  privacy: {
    dpEnabled: boolean;
    epsilon: number;
    budgetUsed: number;
    budgetRemaining: number;
  };

  // Non-IID metrics
  nonIID: {
    score: number;
    adaptationLevel: 'none' | 'low' | 'medium' | 'high';
    resilience: number;
    participantCount: number;
  };

  // Unanchored collaboration metrics
  collaboration: {
    enabled: boolean;
    complementarityAvg: number;
    perspectivePairsGenerated: number;
  };

  // DEDIER debiasing metrics
  debiasing: {
    problematicInstancesDetected: number;
    worstGroupAccuracy: number;
    fairnessGap: number;
    detectionEffectiveness: number;
  };

  // Overall system health
  health: {
    isHealthy: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    issues: string[];
    recommendations: string[];
  };
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  percentChange: number;
  severity: 'none' | 'warning' | 'critical';
}

export class JarvisMetricsDashboard {
  private snapshotHistory: MetricsSnapshot[] = [];
  private readonly maxHistorySize: number = 1000;

  /**
   * Record a metrics snapshot
   */
  recordSnapshot(snapshot: Omit<MetricsSnapshot, 'timestamp' | 'version'>): void {
    const fullSnapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      version: '1.0.0',
      ...snapshot,
    };

    this.snapshotHistory.push(fullSnapshot);

    // Keep only recent history
    if (this.snapshotHistory.length > this.maxHistorySize) {
      this.snapshotHistory = this.snapshotHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get current dashboard state
   */
  getCurrentState(): MetricsSnapshot | null {
    return this.snapshotHistory.length > 0
      ? this.snapshotHistory[this.snapshotHistory.length - 1]
      : null;
  }

  /**
   * Analyze trends in metrics
   */
  analyzeTrends(lookbackCount: number = 10): TrendAnalysis[] {
    if (this.snapshotHistory.length < 2) {
      return [];
    }

    const recent = this.snapshotHistory.slice(-lookbackCount);
    const trends: TrendAnalysis[] = [];

    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];

      // FedFish consensus trend
      const consensusChange =
        ((last.aggregations.averageConsensus -
          first.aggregations.averageConsensus) /
          (first.aggregations.averageConsensus || 1)) *
        100;
      trends.push({
        metric: 'FedFish Consensus',
        trend: consensusChange > 2 ? 'improving' : consensusChange < -2 ? 'degrading' : 'stable',
        percentChange: consensusChange,
        severity:
          Math.abs(consensusChange) > 10 ? 'critical' : Math.abs(consensusChange) > 5 ? 'warning' : 'none',
      });

      // Privacy budget trend
      const budgetChange =
        ((last.privacy.budgetUsed - first.privacy.budgetUsed) /
          (first.privacy.budgetUsed || 1)) *
        100;
      trends.push({
        metric: 'Privacy Budget Usage',
        trend: budgetChange > 10 ? 'degrading' : budgetChange < -10 ? 'improving' : 'stable',
        percentChange: budgetChange,
        severity: last.privacy.budgetRemaining < 2 ? 'critical' : last.privacy.budgetRemaining < 5 ? 'warning' : 'none',
      });

      // Non-IID score trend
      const nonIIDChange =
        ((last.nonIID.score - first.nonIID.score) / (first.nonIID.score || 1)) * 100;
      trends.push({
        metric: 'Non-IID Score',
        trend: nonIIDChange > 5 ? 'degrading' : nonIIDChange < -5 ? 'improving' : 'stable',
        percentChange: nonIIDChange,
        severity: last.nonIID.score > 8 ? 'critical' : last.nonIID.score > 5 ? 'warning' : 'none',
      });

      // Fairness gap trend
      const fairnessChange =
        ((last.debiasing.fairnessGap - first.debiasing.fairnessGap) /
          (first.debiasing.fairnessGap || 0.1)) *
        100;
      trends.push({
        metric: 'Fairness Gap',
        trend: fairnessChange < -10 ? 'improving' : fairnessChange > 10 ? 'degrading' : 'stable',
        percentChange: fairnessChange,
        severity:
          last.debiasing.fairnessGap > 0.2
            ? 'critical'
            : last.debiasing.fairnessGap > 0.15
              ? 'warning'
              : 'none',
      });
    }

    return trends;
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: {
      fedfish: 'healthy' | 'warning' | 'critical';
      privacy: 'healthy' | 'warning' | 'critical';
      nonIID: 'healthy' | 'warning' | 'critical';
      collaboration: 'healthy' | 'warning' | 'critical';
      fairness: 'healthy' | 'warning' | 'critical';
    };
    issues: string[];
    recommendations: string[];
  } {
    const current = this.getCurrentState();
    if (!current) {
      return {
        overall: 'warning',
        components: {
          fedfish: 'warning',
          privacy: 'warning',
          nonIID: 'warning',
          collaboration: 'warning',
          fairness: 'warning',
        },
        issues: ['No metrics data available'],
        recommendations: ['Wait for initial metrics to be recorded'],
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check FedFish health
    let fedfishHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (current.aggregations.averageConsensus < 0.7) {
      fedfishHealth = 'warning';
      issues.push(`Low consensus quality: ${(current.aggregations.averageConsensus * 100).toFixed(1)}%`);
      recommendations.push('Increase expert diversity or review aggregation weights');
    }
    if (current.aggregations.clientServerBarrier > 0.3) {
      fedfishHealth = 'critical';
      issues.push(`High client-server barrier: ${current.aggregations.clientServerBarrier.toFixed(3)}`);
      recommendations.push('Experts are too divergent; review specialization boundaries');
    }

    // Check Privacy health
    let privacyHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (!current.privacy.dpEnabled) {
      privacyHealth = 'warning';
      issues.push('Differential Privacy is disabled');
      recommendations.push('Enable DP for production deployment');
    }
    if (current.privacy.budgetRemaining < 2) {
      privacyHealth = 'critical';
      issues.push(`Critical: Privacy budget nearly exhausted (ε=${current.privacy.budgetRemaining.toFixed(2)} remaining)`);
      recommendations.push('Reset privacy budget or reduce data collection');
    }

    // Check Non-IID health
    let nonIIDHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (current.nonIID.score > 8) {
      nonIIDHealth = 'critical';
      issues.push(`Severe non-IID detected (score=${current.nonIID.score.toFixed(2)})`);
      recommendations.push(
        'Increase training rounds and participants',
      );
    } else if (current.nonIID.score > 5) {
      nonIIDHealth = 'warning';
      issues.push(`Moderate non-IID detected (score=${current.nonIID.score.toFixed(2)})`);
      recommendations.push('Monitor convergence; may need adaptation');
    }

    // Check Collaboration health
    let collaborationHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (!current.collaboration.enabled) {
      collaborationHealth = 'warning';
      issues.push('Unanchored collaboration is disabled');
      recommendations.push('Enable for better user decision quality');
    }
    if (current.collaboration.complementarityAvg < 0.4) {
      collaborationHealth = 'warning';
      issues.push(
        `Low complementarity: experts are too similar (avg=${current.collaboration.complementarityAvg.toFixed(2)})`,
      );
      recommendations.push('Review expert specializations; increase diversity');
    }

    // Check Fairness health
    let fairnessHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (current.debiasing.worstGroupAccuracy < 0.8) {
      fairnessHealth = 'critical';
      issues.push(
        `Low worst-group accuracy: ${(current.debiasing.worstGroupAccuracy * 100).toFixed(1)}%`,
      );
      recommendations.push('Apply DEDIER debiasing; check for group imbalance');
    } else if (current.debiasing.fairnessGap > 0.15) {
      fairnessHealth = 'warning';
      issues.push(
        `Fairness gap detected: ${(current.debiasing.fairnessGap * 100).toFixed(1)}%`,
      );
      recommendations.push('Monitor for potential bias in underrepresented groups');
    }

    // Overall health
    const healthCounts = {
      critical: [fedfishHealth, privacyHealth, nonIIDHealth, collaborationHealth, fairnessHealth].filter(
        (h) => h === 'critical',
      ).length,
      warning: [fedfishHealth, privacyHealth, nonIIDHealth, collaborationHealth, fairnessHealth].filter(
        (h) => h === 'warning',
      ).length,
    };

    const overallHealth: 'healthy' | 'warning' | 'critical' =
      healthCounts.critical > 0 ? 'critical' : healthCounts.warning > 0 ? 'warning' : 'healthy';

    return {
      overall: overallHealth,
      components: {
        fedfish: fedfishHealth,
        privacy: privacyHealth,
        nonIID: nonIIDHealth,
        collaboration: collaborationHealth,
        fairness: fairnessHealth,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Export metrics for external visualization
   */
  exportMetricsTimeSeries(limit: number = 100): {
    timestamps: number[];
    consensus: number[];
    privacyBudget: number[];
    nonIIDScore: number[];
    fairnessGap: number[];
  } {
    const recent = this.snapshotHistory.slice(-limit);

    return {
      timestamps: recent.map((s) => s.timestamp),
      consensus: recent.map((s) => s.aggregations.averageConsensus),
      privacyBudget: recent.map((s) => s.privacy.budgetRemaining),
      nonIIDScore: recent.map((s) => s.nonIID.score),
      fairnessGap: recent.map((s) => s.debiasing.fairnessGap),
    };
  }

  /**
   * Get summary statistics
   */
  getSummaryStatistics(): {
    totalSnapshots: number;
    averageConsensus: number;
    averageNonIIDScore: number;
    averageFairnessGap: number;
    uptime: number;
  } {
    if (this.snapshotHistory.length === 0) {
      return {
        totalSnapshots: 0,
        averageConsensus: 0,
        averageNonIIDScore: 0,
        averageFairnessGap: 0,
        uptime: 0,
      };
    }

    const consensuses = this.snapshotHistory.map((s) => s.aggregations.averageConsensus);
    const nonIIDScores = this.snapshotHistory.map((s) => s.nonIID.score);
    const fairnessGaps = this.snapshotHistory.map((s) => s.debiasing.fairnessGap);

    const uptime =
      (this.snapshotHistory[this.snapshotHistory.length - 1].timestamp -
        this.snapshotHistory[0].timestamp) /
      1000 /
      60;  // minutes

    return {
      totalSnapshots: this.snapshotHistory.length,
      averageConsensus:
        consensuses.reduce((a, b) => a + b, 0) / consensuses.length,
      averageNonIIDScore: nonIIDScores.reduce((a, b) => a + b, 0) / nonIIDScores.length,
      averageFairnessGap: fairnessGaps.reduce((a, b) => a + b, 0) / fairnessGaps.length,
      uptime,
    };
  }

  /**
   * Clear history (for testing or reset)
   */
  clearHistory(): void {
    this.snapshotHistory = [];
  }
}

// Singleton instance
export const jarvisMetricsDashboard = new JarvisMetricsDashboard();
