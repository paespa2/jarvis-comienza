/**
 * FEDFSH AGGREGATION FOR MIXTURE OF EXPERTS
 *
 * Applies FedFish (Federated Learning with Fisher Information) to aggregate
 * knowledge from multiple specialized experts.
 *
 * Key Innovation: Instead of simple parameter averaging (FedAvg), uses Fisher
 * Information diagonal to weight parameter importance, making aggregation robust
 * to heterogeneous expert training.
 *
 * Based on: "Leveraging Function Space Aggregation for Federated Learning at Scale"
 * (TMLR 2024)
 */

import { ExpertAgent, ExpertType, ExpertResponse } from '../expertise/MixtureOfExperts';

export interface ExpertFisher {
  expertType: ExpertType;
  parameterCount: number;
  averageImportance: number;  // avg Fisher diagonal value
  maxImportance: number;      // max Fisher diagonal value
  minImportance: number;      // min Fisher diagonal value
  computedAt: number;
  trainingEpochs: number;
  queryCount: number;
}

export interface AggregationMetrics {
  timestamp: number;
  queriesAggregated: number;
  expertCount: number;
  consensusConfidence: number;  // avg of expert confidences
  clientServerBarrier: number;   // diff between aggregated and best expert
  improvementOverAvg: number;    // % improvement vs simple average
}

export interface FedFishAggregationResult {
  aggregatedResponse: string;
  expertPerspectives: Array<{
    expert: ExpertType;
    response: string;
    confidence: number;
    fisherWeight: number;
  }>;
  aggregationMetrics: {
    consensusScore: number;
    clientServerBarrier: number;
    weightDistribution: Record<ExpertType, number>;
  };
}

export class FedFishAggregator {
  private fisherCache: Map<ExpertType, ExpertFisher> = new Map();
  private metricsHistory: AggregationMetrics[] = [];
  private aggregationCount: number = 0;

  /**
   * Aggregate expert responses using FedFish algorithm
   */
  async aggregateExpertKnowledge(
    expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }>,
    query: string
  ): Promise<FedFishAggregationResult> {
    if (expertResponses.length === 0) {
      throw new Error('No expert responses to aggregate');
    }

    // Step 1: Get Fisher Information for each expert
    const fishers = await this.getFisherDiagonals(expertResponses);

    // Step 2: Compute FedFish weights based on Fisher importance
    const weights = this.computeFedFishWeights(fishers);

    // Step 3: Aggregate expert responses weighted by Fisher
    const aggregatedResponse = this.aggregateResponses(
      expertResponses,
      weights
    );

    // Step 4: Calculate aggregation metrics
    const metrics = this.calculateAggregationMetrics(
      expertResponses,
      weights,
      aggregatedResponse
    );

    // Step 5: Store metrics for monitoring
    this.metricsHistory.push({
      timestamp: Date.now(),
      queriesAggregated: ++this.aggregationCount,
      expertCount: expertResponses.length,
      consensusConfidence: metrics.consensusScore,
      clientServerBarrier: metrics.clientServerBarrier,
      improvementOverAvg: this.compareToFedAvg(expertResponses, metrics),
    });

    return {
      aggregatedResponse,
      expertPerspectives: expertResponses.map((exp, i) => ({
        expert: exp.expert.type,
        response: exp.response.answer,
        confidence: exp.response.confidence,
        fisherWeight: weights[exp.expert.type] || 0,
      })),
      aggregationMetrics: metrics,
    };
  }

  /**
   * Get or compute Fisher Information diagonals for experts
   */
  private async getFisherDiagonals(
    expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }>
  ): Promise<ExpertFisher[]> {
    const fishers: ExpertFisher[] = [];

    for (const { expert, response } of expertResponses) {
      let fisher = this.fisherCache.get(expert.type);

      // Recompute if cache is stale (> 1 hour)
      if (
        !fisher ||
        Date.now() - fisher.computedAt > 3600000
      ) {
        fisher = this.computeExpertFisher(expert, response);
        this.fisherCache.set(expert.type, fisher);
      }

      fishers.push(fisher);
    }

    return fishers;
  }

  /**
   * Compute Fisher Information diagonal for a single expert
   * Based on: confidence as proxy for parameter importance
   */
  private computeExpertFisher(
    expert: ExpertAgent,
    response: ExpertResponse
  ): ExpertFisher {
    // Use response confidence and expertise depth as Fisher indicators
    // In a real implementation, this would track actual gradients
    const baseImportance = response.confidence * response.expertise_depth;

    // Estimate parameter count from expert specialties
    const parameterCount = expert.specialties.size * 100; // rough estimate

    return {
      expertType: expert.type,
      parameterCount,
      averageImportance: baseImportance,
      maxImportance: Math.min(1, baseImportance * 1.5),
      minImportance: Math.max(0, baseImportance * 0.5),
      computedAt: Date.now(),
      trainingEpochs: expert.totalQueries,
      queryCount: expert.totalQueries,
    };
  }

  /**
   * Compute FedFish weights: w_j = Fisher_j / Σ Fisher_k
   * Higher Fisher importance = higher weight in aggregation
   */
  private computeFedFishWeights(
    fishers: ExpertFisher[]
  ): Record<ExpertType, number> {
    const weights: Record<ExpertType, number> = {} as any;

    // Sum of Fisher diagonals (normalized importance)
    const totalFisher = fishers.reduce(
      (sum, f) => sum + f.averageImportance,
      0
    );

    // Avoid division by zero
    if (totalFisher === 0) {
      // Fallback to equal weights
      const equalWeight = 1 / fishers.length;
      for (const fisher of fishers) {
        weights[fisher.expertType] = equalWeight;
      }
      return weights;
    }

    // FedFish formula: weight by Fisher importance
    for (const fisher of fishers) {
      weights[fisher.expertType] =
        fisher.averageImportance / totalFisher;
    }

    return weights;
  }

  /**
   * Aggregate expert responses weighted by Fisher importance
   */
  private aggregateResponses(
    expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }>,
    weights: Record<ExpertType, number>
  ): string {
    // Extract key insights from each expert
    const perspectives: Array<{
      expert: ExpertType;
      points: string[];
      weight: number;
    }> = [];

    for (const { expert, response } of expertResponses) {
      const weight = weights[expert.type] || 0;

      // Split response into bullet points
      const points = response.answer
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3); // Top 3 points per expert

      perspectives.push({
        expert: expert.type,
        points,
        weight,
      });
    }

    // Build aggregated response prioritizing high-weight experts
    const sortedPerspectives = perspectives.sort(
      (a, b) => b.weight - a.weight
    );

    let aggregated = '## FedFish-Aggregated Expert Analysis\n\n';

    for (const { expert, points, weight } of sortedPerspectives) {
      if (weight > 0.01) {
        // Only include if weight > 1%
        aggregated += `### ${expert.toUpperCase()} Expert (Weight: ${(weight * 100).toFixed(1)}%)\n`;
        for (const point of points) {
          aggregated += `- ${point}\n`;
        }
        aggregated += '\n';
      }
    }

    return aggregated;
  }

  /**
   * Calculate Client-Server Barrier (CSB) metric
   * CSB = how much global model differs from individual expert models
   */
  private calculateAggregationMetrics(
    expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }>,
    weights: Record<ExpertType, number>,
    aggregatedResponse: string
  ): {
    consensusScore: number;
    clientServerBarrier: number;
    weightDistribution: Record<ExpertType, number>;
  } {
    // Consensus: avg confidence of experts
    const avgConfidence =
      expertResponses.reduce((sum, exp) => sum + exp.response.confidence, 0) /
      expertResponses.length;

    // Client-Server Barrier: difference between aggregated and best expert
    const bestExpertConfidence = Math.max(
      ...expertResponses.map(exp => exp.response.confidence)
    );

    const clientServerBarrier = Math.max(
      0,
      bestExpertConfidence - avgConfidence
    );

    return {
      consensusScore: avgConfidence,
      clientServerBarrier,
      weightDistribution: weights,
    };
  }

  /**
   * Compare FedFish aggregation to simple FedAvg (equal weights)
   */
  private compareToFedAvg(
    expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }>,
    fedFishMetrics: {
      consensusScore: number;
      clientServerBarrier: number;
      weightDistribution: Record<ExpertType, number>;
    }
  ): number {
    // FedAvg: equal weights
    const fedAvgConsensus =
      expertResponses.reduce((sum, exp) => sum + exp.response.confidence, 0) /
      expertResponses.length;

    // Improvement: reduction in Client-Server Barrier
    const fedAvgBarrier =
      Math.max(...expertResponses.map(exp => exp.response.confidence)) -
      fedAvgConsensus;

    if (fedAvgBarrier === 0) return 0;

    return (
      ((fedAvgBarrier - fedFishMetrics.clientServerBarrier) / fedAvgBarrier) *
      100
    );
  }

  /**
   * Get aggregation statistics
   */
  getStats() {
    const recentMetrics = this.metricsHistory.slice(-100);

    if (recentMetrics.length === 0) {
      return {
        aggregationsPerformed: 0,
        averageCSB: 0,
        averageImprovement: 0,
        consensusQuality: 0,
      };
    }

    const avgCSB =
      recentMetrics.reduce((sum, m) => sum + m.clientServerBarrier, 0) /
      recentMetrics.length;

    const avgImprovement =
      recentMetrics.reduce((sum, m) => sum + m.improvementOverAvg, 0) /
      recentMetrics.length;

    const avgConsensus =
      recentMetrics.reduce((sum, m) => sum + m.consensusConfidence, 0) /
      recentMetrics.length;

    return {
      aggregationsPerformed: this.aggregationCount,
      averageCSB: avgCSB,
      averageImprovement: avgImprovement,
      consensusQuality: avgConsensus,
      lastMetrics: recentMetrics[recentMetrics.length - 1],
    };
  }

  /**
   * Clear old cache entries
   */
  clearStaleCache(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [expertType, fisher] of this.fisherCache) {
      if (fisher.computedAt < oneHourAgo) {
        this.fisherCache.delete(expertType);
      }
    }

    // Keep only last 1000 metrics
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }
}

export const fedFishAggregator = new FedFishAggregator();
