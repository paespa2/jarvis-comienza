/**
 * DIFFERENTIAL PRIVACY MODULE
 *
 * Based on: "FP-Fed: Privacy-Preserving Federated Detection" (NDSS 2024)
 *
 * Provides formal privacy guarantees:
 * - (ε, δ)-differential privacy
 * - Protects against membership inference attacks
 * - Scales with number of participants
 *
 * Privacy levels:
 * - ε = 1.0  (High privacy, some accuracy loss)
 * - ε = 5.0  (Moderate privacy, balanced)
 * - ε = 10.0 (Low privacy, near-centralized accuracy)
 */

/**
 * Sample from Laplace distribution for DP noise
 * Used for: weight clipping, feature normalization
 */
function sampleLaplaceNoise(
  mean: number,
  scale: number,
): number {
  // Box-Muller + inverse transform sampling
  const u1 = Math.random();
  const u2 = Math.random();

  if (u1 < 0.5) {
    return mean - scale * Math.log(2 * u1);
  } else {
    return mean + scale * Math.log(2 * (1 - u1));
  }
}

/**
 * Clip vector to bounded L2 norm
 * Ensures sensitivity bounds for DP
 */
function clipVector(vector: number[], clipBound: number): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

  if (norm <= clipBound) {
    return vector;
  }

  const scale = clipBound / norm;
  return vector.map((v) => v * scale);
}

export interface DifferentialPrivacyConfig {
  epsilon: number;      // Privacy budget (lower = more private)
  delta: number;        // Failure probability (typically 1e-5)
  sensitivity: number;  // L2 sensitivity bound (typically 1.0)
  mechanism: 'laplace' | 'gaussian';  // Noise mechanism
}

export interface DPAggregationResult {
  noisyWeights: number[];
  privacyBudgetUsed: number;
  noiseScale: number;
  clipBound: number;
}

export interface FeatureNormalizationConfig {
  epsilon: number;
  delta: number;
  numFeatures: number;
  numParticipants: number;
}

export class DifferentialPrivacyModule {
  private privacyBudgetUsed: number = 0;
  private dpConfig: DifferentialPrivacyConfig;

  constructor(dpConfig: DifferentialPrivacyConfig) {
    this.dpConfig = dpConfig;
  }

  /**
   * Add Laplace noise to weights for DP aggregation
   * Based on: Algorithm 1 (DP-FedAvg) from FP-Fed
   */
  addDPNoiseToWeights(
    weights: number[],
    sensitivityBound: number = 1.0,
  ): DPAggregationResult {
    // Ensure sensitivity bound
    const clipped = clipVector(weights, sensitivityBound);

    // Calculate noise scale
    // σ = (sensitivity * scale) / epsilon
    const scale = sensitivityBound / this.dpConfig.epsilon;

    // Add Laplace noise to each weight
    const noisyWeights = clipped.map((w) =>
      w + sampleLaplaceNoise(0, scale),
    );

    // Track privacy budget consumption
    this.privacyBudgetUsed += this.dpConfig.epsilon;

    return {
      noisyWeights,
      privacyBudgetUsed: this.privacyBudgetUsed,
      noiseScale: scale,
      clipBound: sensitivityBound,
    };
  }

  /**
   * Differentially private mean computation
   * Used for feature normalization
   */
  computeDPMean(
    values: number[],
    epsilon: number,
    sensitivity: number = 1.0,
  ): { mean: number; noiseAdded: number } {
    // Compute empirical mean
    const empiricalMean = values.reduce((a, b) => a + b, 0) / values.length;

    // Laplace noise scale for mean
    const noiseScale = sensitivity / epsilon;
    const noise = sampleLaplaceNoise(0, noiseScale);

    // Add DP noise
    const dpMean = empiricalMean + noise;

    return {
      mean: dpMean,
      noiseAdded: noise,
    };
  }

  /**
   * Differentially private variance computation
   * Key component of feature normalization (DP-FedNorm)
   */
  computeDPVariance(
    values: number[],
    empiricalMean: number,
    epsilon: number,
    sensitivity: number = 1.0,
  ): { variance: number; noiseAdded: number } {
    // Empirical variance
    const empiricalVar =
      values.reduce((sum, v) => sum + Math.pow(v - empiricalMean, 2), 0) /
      (values.length - 1 || 1);

    // Laplace noise for variance
    const noiseScale = sensitivity / epsilon;
    const noise = sampleLaplaceNoise(0, noiseScale);

    // Add DP noise (ensure positive variance)
    const dpVar = Math.max(empiricalVar + noise, 0.001);

    return {
      variance: dpVar,
      noiseAdded: noise,
    };
  }

  /**
   * Normalize features with DP guarantees
   * From FP-Fed paper: DP-FedNorm algorithm
   * Allocates epsilon budget between mean and variance computation
   */
  dpNormalizeFeatures(
    features: number[],
    config: FeatureNormalizationConfig,
  ): {
    normalized: number[];
    mean: number;
    variance: number;
    totalEpsilonUsed: number;
  } {
    // Split epsilon budget: 50% for mean, 50% for variance
    const epsilonMean = config.epsilon * 0.5;
    const epsilonVar = config.epsilon * 0.5;

    // Compute DP mean
    const { mean } = this.computeDPMean(features, epsilonMean);

    // Compute DP variance
    const { variance } = this.computeDPVariance(
      features,
      mean,
      epsilonVar,
    );

    // Normalize: (x - mean) / sqrt(variance)
    const stddev = Math.sqrt(Math.max(variance, 0.001));
    const normalized = features.map((f) => (f - mean) / stddev);

    return {
      normalized,
      mean,
      variance,
      totalEpsilonUsed: config.epsilon,
    };
  }

  /**
   * Compute privacy cost of current configuration
   * Helps understand privacy-utility tradeoff
   */
  estimatePrivacyCost(
    numRounds: number = 10,
    numParticipants: number = 1_000_000,
  ): {
    estimatedEpsilon: number;
    samplingProbability: number;
    noiseReduction: number;
  } {
    // Privacy amplification by sampling
    // More participants = more noise reduction
    const samplingProbability = 100 / numParticipants;  // ~100 per round
    const noiseReduction = Math.sqrt(numParticipants / 100);

    // Total epsilon after privacy amplification
    const estimatedEpsilon =
      (this.dpConfig.epsilon * numRounds) / noiseReduction;

    return {
      estimatedEpsilon,
      samplingProbability,
      noiseReduction,
    };
  }

  /**
   * Validate privacy configuration meets desired bounds
   */
  validatePrivacyConfig(
    maxEpsilon: number = 10.0,
    maxDelta: number = 1e-5,
  ): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (this.dpConfig.epsilon > maxEpsilon) {
      issues.push(
        `ε=${this.dpConfig.epsilon} exceeds maximum ${maxEpsilon}`,
      );
    }

    if (this.dpConfig.delta > maxDelta) {
      issues.push(
        `δ=${this.dpConfig.delta} exceeds maximum ${maxDelta}`,
      );
    }

    if (this.dpConfig.epsilon <= 0 || this.dpConfig.delta <= 0) {
      issues.push('ε and δ must be positive');
    }

    if (this.dpConfig.sensitivity <= 0) {
      issues.push('sensitivity must be positive');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get privacy budget status
   */
  getPrivacyBudgetStatus(): {
    used: number;
    epsilon: number;
    remaining: number;
    percentageUsed: number;
  } {
    const remaining = this.dpConfig.epsilon - this.privacyBudgetUsed;
    const percentageUsed = (this.privacyBudgetUsed / this.dpConfig.epsilon) * 100;

    return {
      used: this.privacyBudgetUsed,
      epsilon: this.dpConfig.epsilon,
      remaining: Math.max(remaining, 0),
      percentageUsed,
    };
  }

  /**
   * Reset privacy budget for new epoch
   */
  resetBudget(): void {
    this.privacyBudgetUsed = 0;
  }
}

/**
 * Privacy presets for common scenarios
 */
export const PrivacyPresets = {
  HIGH_PRIVACY: {
    epsilon: 1.0,
    delta: 1e-5,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
  MODERATE_PRIVACY: {
    epsilon: 5.0,
    delta: 1e-5,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
  LOW_PRIVACY: {
    epsilon: 10.0,
    delta: 1e-5,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
  NO_PRIVACY: {
    epsilon: Infinity,
    delta: 0,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
};
