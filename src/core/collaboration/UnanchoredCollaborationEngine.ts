/**
 * UNANCHORED COLLABORATION ENGINE
 *
 * Based on: "When Are Two Lists Better Than One? Benefits and Harms in Joint Decision-Making"
 * (Donahue & Gollapudi, AAAI 2024)
 *
 * Key insight: Joint human-algorithm systems perform BETTER when:
 * 1. Not anchored (algorithm doesn't present ordering as "correct")
 * 2. Present k=2 complementary perspectives
 * 3. Both perspectives have equal weight (no hierarchy)
 *
 * Performance improvement with k=2 unanchored:
 * - Equal accuracy experts: 3-5% improvement
 * - Asymmetric accuracy: even larger zones of complementarity
 */

export interface UnanchoredPerspective {
  source: string;                    // "Security", "Methodology", "Research"
  response: string;
  reasoning: string;
  confidence: number;
  specialty: string;                 // What this expert specializes in
}

export interface UnanchoredCollaborationResponse {
  perspectives: [UnanchoredPerspective, UnanchoredPerspective];  // k=2
  presentationMode: 'unanchored';
  userGuidance: string;
  complementarityScore: number;      // How different are these perspectives?
  recommendation: null;              // NO recommendation (would be anchoring)
  timestamp: number;
}

export class UnanchoredCollaborationEngine {
  /**
   * Select k=2 most complementary experts
   * Key: NOT ordered by confidence (that would be anchoring)
   */
  async selectComplementaryPair(
    expertResponses: Array<{
      expert: string;
      response: string;
      reasoning: string;
      confidence: number;
      specialty: string;
    }>,
    query: string
  ): Promise<[UnanchoredPerspective, UnanchoredPerspective]> {
    if (expertResponses.length < 2) {
      throw new Error('Need at least 2 experts for unanchored collaboration');
    }

    // Convert to UnanchoredPerspectives
    const perspectives: UnanchoredPerspective[] = expertResponses.map((resp) => ({
      source: resp.expert,
      response: resp.response,
      reasoning: resp.reasoning,
      confidence: resp.confidence,
      specialty: resp.specialty,
    }));

    // Find most complementary pair (NOT most confident)
    let bestPair: [UnanchoredPerspective, UnanchoredPerspective] | null = null;
    let maxComplementarity = -1;

    for (let i = 0; i < perspectives.length; i++) {
      for (let j = i + 1; j < perspectives.length; j++) {
        const complementarity = this.computeComplementarity(
          perspectives[i],
          perspectives[j],
          query
        );

        if (complementarity > maxComplementarity) {
          maxComplementarity = complementarity;
          bestPair = [perspectives[i], perspectives[j]];
        }
      }
    }

    if (!bestPair) {
      bestPair = [perspectives[0], perspectives[1]];
      maxComplementarity = 0.5;
    }

    return bestPair;
  }

  /**
   * Compute complementarity between two perspectives
   * High complementarity = different reasoning paths, different specialties
   * Low complementarity = similar perspectives (would reduce benefit)
   */
  private computeComplementarity(
    p1: UnanchoredPerspective,
    p2: UnanchoredPerspective,
    query: string
  ): number {
    let score = 0;

    // 1. Different specialties is good (1.0 max)
    if (p1.specialty !== p2.specialty) {
      score += 0.4;
    }

    // 2. Semantic difference in responses (measure via word overlap)
    const words1 = new Set(p1.response.toLowerCase().split(/\s+/));
    const words2 = new Set(p2.response.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    const jaccardSimilarity = intersection / (union || 1);
    const semanticDiversity = 1 - jaccardSimilarity;
    score += semanticDiversity * 0.3;  // 0 to 0.3

    // 3. Reasoning diversity (different approaches)
    const reasoning1 = p1.reasoning.toLowerCase();
    const reasoning2 = p2.reasoning.toLowerCase();

    const reasoningApproaches = [
      'deductive',
      'inductive',
      'analogical',
      'causal',
      'empirical',
      'theoretical',
    ];

    let approaches1 = 0,
      approaches2 = 0;
    for (const approach of reasoningApproaches) {
      if (reasoning1.includes(approach)) approaches1++;
      if (reasoning2.includes(approach)) approaches2++;
    }

    // High diversity if different approaches
    if (approaches1 !== approaches2) {
      score += 0.2;
    }

    // 4. Confidence balance (avoid too-skewed pairs)
    const confDiff = Math.abs(p1.confidence - p2.confidence);
    if (confDiff < 0.5) {
      // Balanced confidence is good
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Create unanchored response - BOTH perspectives equal weight
   * Key: NO ordering, NO "recommendation", NO bias toward one
   */
  async createUnanchoredResponse(
    pair: [UnanchoredPerspective, UnanchoredPerspective],
    complementarityScore: number
  ): Promise<UnanchoredCollaborationResponse> {
    // Randomize order to avoid presentation bias
    const perspectives =
      Math.random() > 0.5 ? pair : [pair[1], pair[0]];

    // Generate balanced guidance - emphasize that both are valid
    const guidance = `
Both perspectives below offer valid approaches. The choice depends on your specific context:

**${perspectives[0].source}** focuses on: ${perspectives[0].specialty}
**${perspectives[1].source}** focuses on: ${perspectives[1].specialty}

Neither is inherently "better" - they represent different valuable viewpoints.
Consider which aligns better with your current needs.
    `.trim();

    return {
      perspectives: [perspectives[0], perspectives[1]],
      presentationMode: 'unanchored',
      userGuidance: guidance,
      complementarityScore,
      recommendation: null,  // Explicitly null - no anchoring
      timestamp: Date.now(),
    };
  }

  /**
   * Detect anchoring bias in user selection
   * If user always picks first option → probably anchored
   */
  trackUserSelectionPattern(
    sessionId: string,
    userSelectedIndex: 0 | 1
  ): { isAnchored: boolean; confidence: number } {
    // In real implementation, track over 10+ selections
    // If >70% pick first → probable anchoring
    // This helps us detect when anchoring bias is hurting user

    return {
      isAnchored: false,
      confidence: 0,
    };
  }

  /**
   * Key paper finding: Anchoring ALWAYS hurts joint performance
   * This detects when it's happening and can warn user
   */
  validateNoAnchoring(response: UnanchoredCollaborationResponse): {
    isUnanchored: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check 1: No recommendation
    if (response.recommendation !== null) {
      issues.push('Response has explicit recommendation (violates unanchoring)');
    }

    // Check 2: Presentation order is randomized (in implementation)
    // Check 3: Guidance treats both equally
    if (
      response.userGuidance.includes('better') ||
      response.userGuidance.includes('recommended')
    ) {
      issues.push('Guidance contains preference language');
    }

    return {
      isUnanchored: issues.length === 0,
      issues,
    };
  }
}

// Singleton instance
export const unanchoredCollaborationEngine = new UnanchoredCollaborationEngine();
