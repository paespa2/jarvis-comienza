/**
 * CONVERSATIONAL INTERFACE
 *
 * Jarvis entiende lenguaje natural sin necesidad de comandos específicos.
 * El usuario habla naturalmente, Jarvis entiende la intención y actúa.
 *
 * Inteligencia:
 * 1. Intent Classification — ¿Qué quiere el usuario?
 * 2. Context Management — Mantiene conversación fluida
 * 3. Routing — Dirige a sistema correcto automáticamente
 * 4. Response Synthesis — Responde en forma natural
 * 5. Learning — Mejora con cada interacción
 */

import { jarvisNativeModel } from '../nativeModel/JarvisNativeModel';
import { mixtureOfExperts } from '../expertise/MixtureOfExperts';
import { advancedReasoningEngine } from '../reasoning/AdvancedReasoningEngine';
import { chainOfThoughtVerification } from '../verification/ChainOfThoughtVerification';
import { adversarialSelfChallenge } from '../adversarial/AdversarialSelfChallenge';
import { jarvisWebIntelligence } from '../web/JarvisWebIntelligence';
import { llmWikiSystem } from '../wiki/LLMWikiSystem';
import { autonomousActivation } from '../automation/AutonomousActivation';

export type Intent =
  | 'ask_question'
  | 'request_analysis'
  | 'learn_concept'
  | 'debug_reasoning'
  | 'verify_answer'
  | 'improve_robustness'
  | 'analyze_webpage'
  | 'research_topic'
  | 'strategic_planning'
  | 'self_reflection'
  | 'status_check'
  | 'unknown';

export interface ConversationContext {
  sessionId: string;
  history: Array<{ role: 'user' | 'jarvis'; message: string; timestamp: number }>;
  currentTopic: string;
  previousIntents: Intent[];
  mood: 'learning' | 'analyzing' | 'reasoning' | 'reflecting';
  confidence: number;
}

export interface ConversationResponse {
  message: string;
  intent: Intent;
  reasoning: string;
  systemsUsed: string[];
  confidence: number;
  followUpSuggestions: string[];
  timestamp: number;
}

export class ConversationalInterface {
  private contexts: Map<string, ConversationContext> = new Map();
  private sessionCounter: number = 0;

  /**
   * Process natural language input
   */
  async process(userMessage: string, sessionId?: string): Promise<ConversationResponse> {
    // Get or create context
    const contextId = sessionId || `session-${++this.sessionCounter}`;
    let context = this.contexts.get(contextId);

    if (!context) {
      context = this.createContext(contextId);
      this.contexts.set(contextId, context);
    }

    // Add to history
    context.history.push({
      role: 'user',
      message: userMessage,
      timestamp: Date.now(),
    });

    try {
      // 1. Classify intent
      const intent = await this.classifyIntent(userMessage, context);
      console.log(`\n[Conversational] 🎯 Intent: ${intent}`);

      // 2. Route to appropriate system(s)
      let systemsUsed: string[] = [];
      let response = '';
      let reasoning = '';

      switch (intent) {
        case 'ask_question':
          ({ response, systemsUsed } = await this.handleQuestion(
            userMessage,
            context
          ));
          break;

        case 'request_analysis':
          ({ response, systemsUsed } = await this.handleAnalysis(
            userMessage,
            context
          ));
          break;

        case 'learn_concept':
          ({ response, systemsUsed } = await this.handleLearning(
            userMessage,
            context
          ));
          break;

        case 'debug_reasoning':
          ({ response, systemsUsed } = await this.handleDebug(
            userMessage,
            context
          ));
          break;

        case 'verify_answer':
          ({ response, systemsUsed } = await this.handleVerification(
            userMessage,
            context
          ));
          break;

        case 'improve_robustness':
          ({ response, systemsUsed } = await this.handleRobustness(
            userMessage,
            context
          ));
          break;

        case 'analyze_webpage':
          ({ response, systemsUsed } = await this.handleWebAnalysis(
            userMessage,
            context
          ));
          break;

        case 'research_topic':
          ({ response, systemsUsed } = await this.handleResearch(
            userMessage,
            context
          ));
          break;

        case 'self_reflection':
          ({ response, systemsUsed } = await this.handleReflection(
            userMessage,
            context
          ));
          break;

        case 'status_check':
          ({ response, systemsUsed } = await this.handleStatusCheck(
            userMessage,
            context
          ));
          break;

        default:
          response = await this.handleGeneral(userMessage, context);
          systemsUsed.push('native-model');
      }

      // 3. Calculate confidence
      const confidence = this.calculateConfidence(intent, systemsUsed);

      // 4. Generate follow-up suggestions
      const followUpSuggestions = this.generateFollowUps(intent, userMessage);

      // 5. Update context mood
      context.mood = this.determineMood(intent);
      context.previousIntents.push(intent);

      // 6. Build response
      const conversationResponse: ConversationResponse = {
        message: response,
        intent,
        reasoning: `Used ${systemsUsed.length} system(s): ${systemsUsed.join(', ')}`,
        systemsUsed,
        confidence,
        followUpSuggestions,
        timestamp: Date.now(),
      };

      // Add to history
      context.history.push({
        role: 'jarvis',
        message: response,
        timestamp: Date.now(),
      });

      // Limit history
      if (context.history.length > 50) {
        context.history = context.history.slice(-25);
      }

      return conversationResponse;
    } catch (err: any) {
      console.error('[Conversational] Error:', err.message);
      return {
        message: `I encountered an error: ${err.message}. Let me try a different approach.`,
        intent: 'unknown',
        reasoning: err.message,
        systemsUsed: [],
        confidence: 0.2,
        followUpSuggestions: ['Could you rephrase that?', 'Let me reflect on this...'],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Classify user intent from natural language
   */
  private async classifyIntent(message: string, context: ConversationContext): Promise<Intent> {
    const prompt = `Classify the user's intent. They said: "${message}"

Possible intents:
- ask_question: User asks a question
- request_analysis: User wants analysis of something
- learn_concept: User wants to learn about something
- debug_reasoning: User wants to debug/understand reasoning
- verify_answer: User wants to verify correctness
- improve_robustness: User wants to harden/strengthen something
- analyze_webpage: User mentions a URL/webpage
- research_topic: User wants research/investigation
- self_reflection: User asks Jarvis to reflect on itself
- status_check: User asks for status/stats

Return ONLY the intent name.`;

    const result = jarvisNativeModel.generate({
      query: prompt,
      mode: 'react',
    });

    const intentText = result.text.toLowerCase().trim();

    // Match intent
    const intents: Intent[] = [
      'ask_question',
      'request_analysis',
      'learn_concept',
      'debug_reasoning',
      'verify_answer',
      'improve_robustness',
      'analyze_webpage',
      'research_topic',
      'self_reflection',
      'status_check',
    ];

    for (const intent of intents) {
      if (intentText.includes(intent)) {
        return intent;
      }
    }

    // Heuristic fallback
    const lower = message.toLowerCase();
    if (lower.includes('http') || lower.includes('www')) return 'analyze_webpage';
    if (lower.includes('learn') || lower.includes('explain')) return 'learn_concept';
    if (lower.includes('research') || lower.includes('investigate')) return 'research_topic';
    if (lower.includes('verify') || lower.includes('check')) return 'verify_answer';
    if (lower.includes('debug') || lower.includes('why')) return 'debug_reasoning';
    if (lower.includes('analyze') || lower.includes('examine')) return 'request_analysis';
    if (lower.includes('status') || lower.includes('stats')) return 'status_check';

    return 'ask_question'; // Default
  }

  private async handleQuestion(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Use Mixture of Experts for intelligent routing
    const expertResponse = await mixtureOfExperts.answer(message, this.getContextString(context));

    return {
      response: `${expertResponse.answer}\n\n**Confidence:** ${expertResponse.confidence.toFixed(0)}%\n**Expert:** ${expertResponse.expert.toUpperCase()}`,
      systemsUsed: ['mixture-of-experts'],
    };
  }

  private async handleAnalysis(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    const analysis = await advancedReasoningEngine.reason({
      query: message,
      context: this.getContextString(context),
    });

    return {
      response: `**Analysis:**\n${analysis.answer}\n\n**Reasoning Path:** ${analysis.reasoning[0]?.strategyUsed || 'multi-strategy'}\n**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%`,
      systemsUsed: ['advanced-reasoning'],
    };
  }

  private async handleLearning(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Explain with examples and context
    const explanation = await mixtureOfExperts.answer(
      `Explain this concept thoroughly with examples: ${message}`,
      'educational'
    );

    return {
      response: explanation.answer,
      systemsUsed: ['mixture-of-experts', 'knowledge-base'],
    };
  }

  private async handleDebug(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Use reasoning engine to trace logic
    const reasoning = await advancedReasoningEngine.reason({
      query: `Debug and explain this: ${message}`,
      context: 'debugging',
    });

    return {
      response: `**Debugging Analysis:**\n${reasoning.answer}\n\n**Key Insights:** ${reasoning.alternatives.slice(0, 2).join('; ')}`,
      systemsUsed: ['advanced-reasoning'],
    };
  }

  private async handleVerification(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Extract claim from message and verify
    const result = await chainOfThoughtVerification.verifyMultiplePaths(message, 3);

    return {
      response: `**Verification Result:**\n${result.recommendation}\n\n**Consensus:** ${result.consensus}\n**Confidence:** ${(result.aggregatedConfidence * 100).toFixed(0)}%`,
      systemsUsed: ['chain-of-thought-verification'],
    };
  }

  private async handleRobustness(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Challenge own reasoning
    const challenge = await adversarialSelfChallenge.challengeAnswer(message, 'robustness-testing');

    return {
      response: `**Robustness Analysis:**\nFlaws found: ${challenge.criticalFlaws}\n\n**Improvements:**\n${challenge.improvementSuggestions.join('\n')}\n\n**Fortified Answer:**\n${challenge.fortifiedAnswer}`,
      systemsUsed: ['adversarial-self-challenge'],
    };
  }

  private async handleWebAnalysis(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Extract URL and analyze
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      return {
        response: "I don't see a URL in your message. Could you provide one?",
        systemsUsed: [],
      };
    }

    const analysis = await jarvisWebIntelligence.analyzePage(urlMatch[0]);
    const report = jarvisWebIntelligence.generateReport(analysis);

    const bugBountyScore = (
      analysis.bugBountyRelevance.interestingEndpoints.length +
      analysis.bugBountyRelevance.exposedParameters.length +
      analysis.bugBountyRelevance.potentialVulnerabilities.length
    ) / 3;

    return {
      response: `**Web Analysis:**\n${report.slice(0, 500)}...\n\n**Summary:** Found ${analysis.forms.length} forms, ${analysis.links.length} links. Security relevance: ${bugBountyScore.toFixed(1)}/10 (${analysis.bugBountyRelevance.potentialVulnerabilities.length} potential vulnerabilities)`,
      systemsUsed: ['web-intelligence'],
    };
  }

  private async handleResearch(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Query wiki system
    const result = await llmWikiSystem.queryWiki(message);

    return {
      response: `**Research Result:**\n${result.answer}\n\n**Sources Used:** ${result.sources.length}\n${result.newPage ? `**New Insight:** Filed as ${result.newPage}` : ''}`,
      systemsUsed: ['wiki-system'],
    };
  }

  private async handleReflection(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Self-reflection prompt
    const reflection = jarvisNativeModel.generate({
      query: `Self-reflect on this: ${message}\n\nThink about:\n- What have I learned?\n- What are my limitations?\n- How can I improve?`,
      mode: 'fivephase',
      context: 'self-reflection',
    });

    return {
      response: `**Self-Reflection:**\n${reflection.text}`,
      systemsUsed: ['native-model'],
    };
  }

  private async handleStatusCheck(
    message: string,
    context: ConversationContext
  ): Promise<{ response: string; systemsUsed: string[] }> {
    // Compile stats from all systems
    const autoStats = autonomousActivation.getStats();

    return {
      response: `**Status Report:**\n- Autonomous tasks completed: ${autoStats.completedTasks}\n- Tasks failed: ${autoStats.failedTasks}\n- Current mood: ${context.mood}\n- Session history: ${context.history.length} messages`,
      systemsUsed: ['status'],
    };
  }

  private async handleGeneral(
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const response = jarvisNativeModel.generate({
      query: message,
      mode: 'fivephase',
      context: this.getContextString(context),
    });

    return response.text;
  }

  /**
   * Helper methods
   */

  private createContext(sessionId: string): ConversationContext {
    return {
      sessionId,
      history: [],
      currentTopic: '',
      previousIntents: [],
      mood: 'analyzing',
      confidence: 0.8,
    };
  }

  private getContextString(context: ConversationContext): string {
    const recent = context.history.slice(-3).map(h => `${h.role}: ${h.message}`).join('\n');
    return recent || 'New conversation';
  }

  private calculateConfidence(intent: Intent, systemsUsed: string[]): number {
    const baseConfidence = 0.7;
    const systemBonus = Math.min(0.2, systemsUsed.length * 0.05);
    return Math.min(1, baseConfidence + systemBonus);
  }

  private generateFollowUps(intent: Intent, message: string): string[] {
    const suggestions: string[] = [];

    switch (intent) {
      case 'ask_question':
        suggestions.push('Want me to verify this?', 'Should I analyze this deeper?');
        break;
      case 'request_analysis':
        suggestions.push('Should I find edge cases?', 'Want alternative approaches?');
        break;
      case 'learn_concept':
        suggestions.push('Want examples?', 'Should I explain more?');
        break;
      case 'verify_answer':
        suggestions.push('Want me to strengthen it?', 'Should I challenge it?');
        break;
      default:
        suggestions.push('Anything else?', 'Want me to dig deeper?');
    }

    return suggestions;
  }

  private determineMood(intent: Intent): 'learning' | 'analyzing' | 'reasoning' | 'reflecting' {
    if (intent === 'learn_concept') return 'learning';
    if (intent === 'request_analysis') return 'analyzing';
    if (intent === 'debug_reasoning') return 'reasoning';
    if (intent === 'self_reflection') return 'reflecting';
    return 'analyzing';
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): string {
    const context = this.contexts.get(sessionId);
    if (!context) return 'No conversation history';

    return context.history.map(h => `${h.role.toUpperCase()}: ${h.message}`).join('\n\n');
  }
}

export const conversationalInterface = new ConversationalInterface();
