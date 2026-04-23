/**
 * ENHANCED CHAT HANDLER - PHASE 2
 *
 * Extends Phase 1 with Advanced Reasoning Systems:
 * - AdvancedReasoningEngine (multi-step reasoning)
 * - ChainOfThoughtVerification (logic verification)
 * - AdversarialSelfChallenge (self-questioning)
 *
 * Creates responses that are:
 * ✅ Reasoned (multi-step)
 * ✅ Verified (logic checked)
 * ✅ Questioned (self-critical)
 * ✅ Coherent (context aware)
 * ✅ Empathetic (emotion aware)
 * ✅ Varied (85%+ different)
 */

import { EnhancedChatHandler, EnhancedChatResponse } from './EnhancedChatHandler';
import { AdvancedReasoningEngine, ReasoningProblem, ReasoningResult } from '../reasoning/AdvancedReasoningEngine';
import { chainOfThoughtVerification } from '../verification/ChainOfThoughtVerification';
import { adversarialSelfChallenge } from '../adversarial/AdversarialSelfChallenge';

export class EnhancedChatHandlerV2 extends EnhancedChatHandler {
  private advancedReasoningEngine: AdvancedReasoningEngine;

  constructor() {
    super();
    this.advancedReasoningEngine = new AdvancedReasoningEngine();

    console.log('\n🧠 [EnhancedChatHandlerV2] PHASE 2 INITIALIZED');
    console.log('   ✅ AdvancedReasoningEngine (multi-step reasoning)');
    console.log('   ✅ ChainOfThoughtVerification (logic verification)');
    console.log('   ✅ AdversarialSelfChallenge (self-questioning)');
    console.log('   🎯 Responses now include: reasoning trace, verification, self-challenge\n');
  }

  /**
   * Enhanced process with advanced reasoning
   */
  async processWithReasoning(userMessage: string, sessionId: string): Promise<EnhancedChatResponse & {
    reasoningTrace: any;
    verificationResult: any;
    challengeResult: any;
    improvementSuggestions: string[];
  }> {
    // Get base response from Phase 1
    const baseResponse = await this.process(userMessage, sessionId);

    try {
      // 1. ADVANCED REASONING - Multi-step analysis
      console.log('\n🧠 [Phase 2] Running advanced reasoning...');
      const reasoningProblem: ReasoningProblem = {
        query: userMessage,
        context: `Previous responses: ${baseResponse.message.substring(0, 200)}`,
        constraints: [
          'Must be accurate',
          'Must reference sources',
          'Must acknowledge uncertainty'
        ]
      };

      const reasoningResult: ReasoningResult = await this.advancedReasoningEngine.reason(reasoningProblem);
      console.log(`   Strategy: ${reasoningResult.reasoning[0]?.strategyUsed || 'multi-strategy'}`);
      console.log(`   Confidence: ${(reasoningResult.confidence * 100).toFixed(0)}%`);
      console.log(`   Steps: ${reasoningResult.reasoning[0]?.steps?.length || 0}`);

      // 2. CHAIN-OF-THOUGHT VERIFICATION
      console.log('\n✓ [Phase 2] Verifying reasoning logic...');
      const verificationResult = await chainOfThoughtVerification.verify(
        reasoningResult.answer,
        userMessage
      );

      console.log(`   Logical Consistency: ${(verificationResult.logicalConsistency * 100).toFixed(0)}%`);
      console.log(`   Evidence Strength: ${(verificationResult.evidenceStrength * 100).toFixed(0)}%`);
      console.log(`   Assumption Risk: ${(verificationResult.assumptionRisk * 100).toFixed(0)}%`);
      console.log(`   Weak Points: ${verificationResult.weakPoints?.length || 0}`);

      // 3. ADVERSARIAL SELF-CHALLENGE
      console.log('\n⚔️  [Phase 2] Self-challenging response...');
      const challengeResult = await adversarialSelfChallenge.challengeAnswer(
        baseResponse.message,
        userMessage
      );

      console.log(`   Challenges found: ${challengeResult.challenges?.length || 0}`);
      console.log(`   Critical flaws: ${challengeResult.criticalFlaws || 0}`);
      console.log(`   Robustness score: ${(challengeResult.robustnessScore * 100).toFixed(0)}%`);

      // 4. GENERATE IMPROVED RESPONSE
      let improvedMessage = baseResponse.message;
      const improvementSuggestions: string[] = [];

      // Add reasoning explanation if not already in response
      if (!improvedMessage.includes('reasoning') && reasoningResult.reasoning.length > 0) {
        const reasoningExplanation = `\n\n📊 **Reasoning Approach:**\n${
          reasoningResult.reasoning.map((r, i) =>
            `${i + 1}. ${r.strategyUsed}: ${r.steps.join(' → ')}`
          ).join('\n')
        }`;
        improvedMessage += reasoningExplanation;
      }

      // Add verification notice if weak points were found
      if (verificationResult.weakPoints && verificationResult.weakPoints.length > 0) {
        const verificationNotice = `\n\n⚠️ **Logical Verification:**\nLogical Consistency: ${(verificationResult.logicalConsistency * 100).toFixed(0)}%\n\nWeak Points:\n${
          verificationResult.weakPoints.slice(0, 2).map(wp => `- ${wp}`).join('\n')
        }\n\nRecommendations:\n${
          verificationResult.recommendedActions.slice(0, 2).map(ra => `- ${ra}`).join('\n')
        }`;
        improvedMessage += verificationNotice;
        improvementSuggestions.push(`Added logical verification and ${verificationResult.recommendedActions.length} improvements`);
      }

      // Add challenges if found
      if (challengeResult.challenges && challengeResult.challenges.length > 0) {
        const challengesSection = `\n\n⚠️ **Adversarial Challenges (Robustness: ${(challengeResult.robustnessScore * 100).toFixed(0)}%):**\n${
          challengeResult.challenges.slice(0, 2).map(challenge =>
            `- [${challenge.type}] ${challenge.counterargument}`
          ).join('\n')
        }`;
        improvedMessage += challengesSection;
        improvementSuggestions.push(`Added ${challengeResult.challenges.length} self-challenges for robustness`);
      }

      // Add confidence caveat if needed
      if (reasoningResult.confidence < 0.8) {
        const caveats = `\n\n⚡ **Confidence:** ${(reasoningResult.confidence * 100).toFixed(0)}% - ${
          reasoningResult.confidence < 0.6
            ? 'This topic requires more research'
            : 'Some uncertainty remains'
        }`;
        improvedMessage += caveats;
      }

      return {
        ...baseResponse,
        message: improvedMessage,
        reasoningTrace: reasoningResult.reasoning,
        verificationResult: {
          logicalConsistency: verificationResult.logicalConsistency,
          evidenceStrength: verificationResult.evidenceStrength,
          weakPoints: verificationResult.weakPoints?.length || 0,
          recommendations: verificationResult.recommendedActions?.length || 0
        },
        challengeResult: {
          challenges: challengeResult.challenges?.length || 0,
          criticalFlaws: challengeResult.criticalFlaws,
          robustnessScore: challengeResult.robustnessScore,
          improvements: challengeResult.improvementSuggestions?.length || 0
        },
        improvementSuggestions,
        systemsUsed: [
          ...baseResponse.systemsUsed,
          'AdvancedReasoningEngine',
          'ChainOfThoughtVerification',
          'AdversarialSelfChallenge'
        ]
      };
    } catch (error: any) {
      // Fallback to base response if reasoning fails
      console.warn('⚠️  [Phase 2] Reasoning failed, using base response:', error.message);
      return {
        ...baseResponse,
        reasoningTrace: null,
        verificationResult: null,
        challengeResult: null,
        improvementSuggestions: []
      };
    }
  }
}

// Export singleton
export const enhancedChatHandlerV2 = new EnhancedChatHandlerV2();
