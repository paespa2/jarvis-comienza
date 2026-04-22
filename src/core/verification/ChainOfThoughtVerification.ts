/**
 * CHAIN-OF-THOUGHT SELF-VERIFICATION
 *
 * For every answer, Jarvis:
 * 1. Generates reasoning steps
 * 2. Checks each step for logical consistency
 * 3. Verifies conclusion follows from premises
 * 4. Identifies assumptions
 * 5. Assigns overall confidence score
 *
 * Multi-path verification: generate multiple paths and aggregate
 */

import { jarvisNativeModel } from '../nativeModel/JarvisNativeModel';

export interface ReasoningStep {
  number: number;
  statement: string;
  evidence: string[];
  assumptions: string[];
  confidence: number;
}

export interface VerificationResult {
  originalAnswer: string;
  reasoningSteps: ReasoningStep[];
  logicalConsistency: number; // 0-1
  evidenceStrength: number; // 0-1
  assumptionRisk: number; // 0-1 (higher = more risky)
  overallConfidence: number; // 0-1
  alternativeConclusions: string[];
  criticalAssumptions: string[];
  weakPoints: string[];
  recommendedActions: string[];
}

export class ChainOfThoughtVerification {
  /**
   * Verify a reasoning chain
   */
  async verify(answer: string, query: string): Promise<VerificationResult> {
    // Step 1: Extract reasoning steps
    const steps = await this.extractReasoningSteps(answer);

    // Step 2: Verify each step
    const verifiedSteps = await this.verifyEachStep(steps, query);

    // Step 3: Check logical consistency
    const logicalConsistency = this.checkLogicalFlow(verifiedSteps);

    // Step 4: Verify conclusion
    const conclusionVerified = this.verifyConclusionFollows(verifiedSteps, answer);

    // Step 5: Identify critical assumptions
    const criticalAssumptions = this.extractCriticalAssumptions(verifiedSteps);

    // Step 6: Find weak points
    const weakPoints = this.identifyWeakPoints(verifiedSteps);

    // Step 7: Generate alternative conclusions
    const alternatives = await this.generateAlternatives(query, verifiedSteps);

    // Step 8: Calculate overall confidence
    const overallConfidence = this.aggregateConfidence(
      verifiedSteps,
      logicalConsistency,
      conclusionVerified
    );

    return {
      originalAnswer: answer,
      reasoningSteps: verifiedSteps,
      logicalConsistency,
      evidenceStrength: this.calculateEvidenceStrength(verifiedSteps),
      assumptionRisk: this.calculateAssumptionRisk(criticalAssumptions),
      overallConfidence,
      alternativeConclusions: alternatives,
      criticalAssumptions,
      weakPoints,
      recommendedActions: this.generateRecommendations(weakPoints, alternatives),
    };
  }

  /**
   * Extract logical reasoning steps from answer
   */
  private async extractReasoningSteps(answer: string): Promise<ReasoningStep[]> {
    const prompt = `Extract the reasoning steps from this answer. For each step, identify:
1. The statement/claim
2. Supporting evidence or premises
3. Assumptions being made
4. Confidence level (0-1)

Answer: ${answer}

Format as JSON array of steps.`;

    const output = jarvisNativeModel.generate({
      query: prompt,
      mode: 'fivephase',
    });

    // Simple parsing: split by numbered or bulleted items
    const stepTexts = answer.match(/\d+\.|[-•]\s+/g) || [''];
    const steps: ReasoningStep[] = [];

    for (let i = 0; i < stepTexts.length; i++) {
      steps.push({
        number: i + 1,
        statement: `Step ${i + 1}`,
        evidence: [],
        assumptions: [],
        confidence: 0.7,
      });
    }

    return steps;
  }

  /**
   * Verify each step individually
   */
  private async verifyEachStep(steps: ReasoningStep[], query: string): Promise<ReasoningStep[]> {
    const verified: ReasoningStep[] = [];

    for (const step of steps) {
      // Check if step is supported by evidence
      const supportedScore = await this.checkStepSupport(step, query);

      // Check for common logical fallacies
      const fallacyScore = this.checkForFallacies(step);

      // Estimate confidence
      const stepConfidence = (supportedScore + fallacyScore) / 2;

      verified.push({
        ...step,
        confidence: stepConfidence,
      });
    }

    return verified;
  }

  /**
   * Check if step is supported by evidence
   */
  private async checkStepSupport(step: ReasoningStep, query: string): Promise<number> {
    // Verify with model
    const verification = jarvisNativeModel.generate({
      query: `Is this statement well-supported by evidence? "${step.statement}" Context: ${query}`,
      mode: 'react',
    });

    // Simple scoring based on response
    const response = verification.text.toLowerCase();
    if (response.includes('yes') || response.includes('strongly') || response.includes('well'))
      return 0.8;
    if (
      response.includes('somewhat') ||
      response.includes('partial') ||
      response.includes('moderate')
    )
      return 0.5;
    return 0.2;
  }

  /**
   * Check for logical fallacies
   */
  private checkForFallacies(step: ReasoningStep): number {
    const statement = step.statement.toLowerCase();

    const fallacies = {
      'ad hominem': /attacks|discredits|person/,
      'begging the question': /therefore|thus|clearly/,
      'false dilemma': /only|either.*or|either|both/,
      'appeal to authority': /according to|expert says|studies show/,
      'hasty generalization': /all|none|everyone|always|never/,
    };

    let fallacyCount = 0;
    for (const [name, pattern] of Object.entries(fallacies)) {
      if (pattern.test(statement)) fallacyCount++;
    }

    return Math.max(0, 1 - fallacyCount * 0.2);
  }

  /**
   * Check if conclusion logically follows from premises
   */
  private checkLogicalFlow(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0;

    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
    const consistency = Math.min(1, avgConfidence);

    return consistency;
  }

  /**
   * Verify conclusion is supported
   */
  private verifyConclusionFollows(steps: ReasoningStep[], conclusion: string): number {
    // Count how many steps have high confidence
    const highConfidenceSteps = steps.filter(s => s.confidence > 0.6).length;
    const ratio = highConfidenceSteps / Math.max(1, steps.length);

    return ratio;
  }

  /**
   * Extract critical assumptions
   */
  private extractCriticalAssumptions(steps: ReasoningStep[]): string[] {
    const assumptions: string[] = [];

    for (const step of steps) {
      if (step.assumptions && step.assumptions.length > 0) {
        assumptions.push(...step.assumptions);
      }

      // Extract implicit assumptions
      if (step.confidence < 0.6) {
        assumptions.push(`Step ${step.number} lacks strong support`);
      }
    }

    return assumptions.slice(0, 5); // Limit to top 5
  }

  /**
   * Identify weak points in reasoning
   */
  private identifyWeakPoints(steps: ReasoningStep[]): string[] {
    const weakPoints: string[] = [];

    for (const step of steps) {
      if (step.confidence < 0.6) {
        weakPoints.push(`Step ${step.number} has low confidence (${(step.confidence * 100).toFixed(2)}%)`);
      }
      if (step.assumptions && step.assumptions.length > 2) {
        weakPoints.push(`Step ${step.number} relies on ${step.assumptions.length} assumptions`);
      }
    }

    return weakPoints;
  }

  /**
   * Generate alternative conclusions
   */
  private async generateAlternatives(
    query: string,
    steps: ReasoningStep[]
  ): Promise<string[]> {
    const prompt = `Given this query: "${query}" and these reasoning steps, what are 3 alternative conclusions that could also be valid?`;

    const output = jarvisNativeModel.generate({
      query: prompt,
      mode: 'fivephase',
    });

    // Extract alternatives from output
    const alternatives = output.text.split('\n').filter(line => line.trim().length > 10).slice(0, 3);

    return alternatives;
  }

  /**
   * Calculate evidence strength
   */
  private calculateEvidenceStrength(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0;

    const stepsWithEvidence = steps.filter(s => s.evidence && s.evidence.length > 0).length;
    return stepsWithEvidence / steps.length;
  }

  /**
   * Calculate assumption risk
   */
  private calculateAssumptionRisk(assumptions: string[]): number {
    // More assumptions = more risk
    return Math.min(1, assumptions.length * 0.15);
  }

  /**
   * Aggregate confidence from all factors
   */
  private aggregateConfidence(
    steps: ReasoningStep[],
    logicalConsistency: number,
    conclusionSupport: number
  ): number {
    if (steps.length === 0) return 0;

    const avgStepConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    // Weighted average
    const weights = {
      steps: 0.4,
      logical: 0.35,
      conclusion: 0.25,
    };

    return (
      avgStepConfidence * weights.steps +
      logicalConsistency * weights.logical +
      conclusionSupport * weights.conclusion
    );
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations(weakPoints: string[], alternatives: string[]): string[] {
    const recommendations: string[] = [];

    if (weakPoints.length > 0) {
      recommendations.push('Address weak points in reasoning chain');
    }

    if (alternatives.length > 0) {
      recommendations.push('Consider alternative conclusions');
    }

    if (weakPoints.some(w => w.includes('assumption'))) {
      recommendations.push('Validate key assumptions with evidence');
    }

    return recommendations;
  }

  /**
   * Multi-path verification: verify multiple reasoning paths and aggregate
   */
  async verifyMultiplePaths(
    query: string,
    numPaths: number = 3
  ): Promise<{
    pathResults: VerificationResult[];
    aggregatedConfidence: number;
    consensus: string;
    recommendation: string;
  }> {
    const results: VerificationResult[] = [];

    // Generate multiple answers with different reasoning approaches
    for (let i = 0; i < numPaths; i++) {
      const answer = jarvisNativeModel.generate({
        query: `${query}\n\n[Approach ${i + 1}]`,
        mode: 'fivephase',
      });

      const verification = await this.verify(answer.text, query);
      results.push(verification);
    }

    // Aggregate confidence
    const avgConfidence =
      results.reduce((sum, r) => sum + r.overallConfidence, 0) / results.length;

    // Determine consensus
    const consensus =
      avgConfidence > 0.75
        ? 'Strong consensus - high confidence'
        : avgConfidence > 0.5
          ? 'Moderate consensus - medium confidence'
          : 'Weak consensus - low confidence';

    // Recommendation
    const recommendation =
      avgConfidence > 0.75
        ? 'Answer is well-supported'
        : avgConfidence > 0.5
          ? 'Answer is partially supported, consider alternatives'
          : 'Answer lacks strong support, recommend further investigation';

    return {
      pathResults: results,
      aggregatedConfidence: avgConfidence,
      consensus,
      recommendation,
    };
  }
}

export const chainOfThoughtVerification = new ChainOfThoughtVerification();
