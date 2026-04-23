/**
 * ENHANCED CHAT HANDLER
 *
 * Orchestrates all conversation systems:
 * - Phase 1: ConversationMemory (context tracking)
 * - Phase 2: IntentClassifier, EmotionalIntelligence, ResponseGenerator, ResponseVariation
 * - AutoLearningEngine (continuous improvement)
 *
 * Creates coherent, empathetic, varied responses while learning from interactions.
 */

import { ConversationMemory } from './ConversationMemory';
import { IntentClassifier, Intent } from './IntentClassifier';
import { EmotionalIntelligenceEngine, EmotionalState } from './EmotionalIntelligence';
import { ResponseGenerator } from './ResponseGenerator';
import { ResponseVariationEngine } from './ResponseVariation';
import { AutoLearningEngine, InteractionRecord } from '../learning/AutoLearningEngine';
import { JarvisAutoEvaluationEngine, PredictionResult } from '../learning/JarvisAutoEvaluationEngine';
import { JarvisMultiClassEvaluationEngine } from '../learning/JarvisMultiClassEvaluationEngine';
import { createComprehensiveAutoImprovementEngine } from '../learning/JarvisComprehensiveAutoImprovementEngine';

export interface EnhancedChatResponse {
  message: string;
  intent: Intent;
  intentConfidence: number;
  emotion: EmotionalState;
  emotionIntensity: number;
  responseStyle: string;
  coherenceScore: number;
  systemsUsed: string[];
  reasoning: string;
  followUpSuggestions: string[];
  timestamp: number;
}

export class EnhancedChatHandler {
  private conversationMemory: ConversationMemory;
  private intentClassifier: IntentClassifier;
  private emotionalIntelligence: EmotionalIntelligenceEngine;
  private responseGenerator: ResponseGenerator;
  private responseVariation: ResponseVariationEngine;
  private autoLearningEngine: AutoLearningEngine;
  private autoEvaluationEngine: JarvisAutoEvaluationEngine;
  private multiClassEvaluationEngine: JarvisMultiClassEvaluationEngine;
  private comprehensiveAutoImprovementEngine: any; // Comprehensive improvement orchestrator

  constructor() {
    this.conversationMemory = new ConversationMemory();
    this.intentClassifier = new IntentClassifier();
    this.emotionalIntelligence = new EmotionalIntelligenceEngine();
    this.responseGenerator = new ResponseGenerator();
    this.responseVariation = new ResponseVariationEngine();
    this.autoLearningEngine = new AutoLearningEngine();
    this.autoEvaluationEngine = new JarvisAutoEvaluationEngine();
    this.multiClassEvaluationEngine = new JarvisMultiClassEvaluationEngine();
    this.comprehensiveAutoImprovementEngine = createComprehensiveAutoImprovementEngine(
      this.autoEvaluationEngine,
      this.multiClassEvaluationEngine
    );

    console.log("✅ [EnhancedChatHandler] Initialized with all Phase 1 & 2 systems");
    console.log("✅ [EnhancedChatHandler] Auto-Evaluation Engine ready for self-assessment");
    console.log("✅ [EnhancedChatHandler] Comprehensive Auto-Improvement Engine initialized");
    console.log("   - Binary Classification Analysis: ✅");
    console.log("   - Multi-Class Evaluation: ✅");
    console.log("   - Problem Clustering Detection: ✅");
    console.log("   - Improvement Path Prediction: ✅");
    console.log("   - Deep Learning Feedback Loops: ✅");
  }

  /**
   * Process user message through all systems and generate enhanced response
   */
  async process(userMessage: string, sessionId: string): Promise<EnhancedChatResponse> {
    const startTime = Date.now();

    // 1. Initialize conversation context
    this.conversationMemory.initializeContext(sessionId);

    // 2. Classify intent
    const classificationResult = this.intentClassifier.classify(userMessage, {
      previousTopics: this.conversationMemory.getContext(sessionId)?.extractedEntities?.techniques,
      skillLevel: this.conversationMemory.getContext(sessionId)?.skillLevel
    });

    console.log(`\n📊 [EnhancedChat] Intent: ${classificationResult.intent} (confidence: ${(classificationResult.confidence * 100).toFixed(0)}%)`);

    // 3. Check if should decline request
    const approach = this.intentClassifier.getResponseApproach(classificationResult.intent);
    if (!approach.shouldAccept) {
      const declineResponse = this.generateDeclineResponse(classificationResult.intent, userMessage);

      // Record declined interaction for learning
      this.recordInteraction(userMessage, declineResponse, classificationResult, false);

      return {
        message: declineResponse,
        intent: classificationResult.intent,
        intentConfidence: classificationResult.confidence,
        emotion: EmotionalState.NEUTRAL,
        emotionIntensity: 0,
        responseStyle: approach.responseStyle,
        coherenceScore: 0.5,
        systemsUsed: ['IntentClassifier'],
        reasoning: classificationResult.reasoning,
        followUpSuggestions: [],
        timestamp: Date.now()
      };
    }

    // 4. Analyze emotional state
    const emotionAnalysis = this.emotionalIntelligence.analyze(userMessage);
    console.log(`🎭 [Emotion] ${emotionAnalysis.primaryEmotion} (intensity: ${(emotionAnalysis.intensity * 100).toFixed(0)}%)`);

    // 5. Load conversation context
    this.conversationMemory.addMessage(sessionId, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });
    const context = this.conversationMemory.getContext(sessionId);
    const contextString = this.conversationMemory.getContextAsString(sessionId);

    // 6. Find similar past interactions for inspiration
    const similarInteractions = this.conversationMemory.getSimilarPastInteractions(sessionId, userMessage, 3);

    // 7. Generate response with appropriate style
    let responseMessage = '';
    let responseStyle = approach.responseStyle;

    if (emotionAnalysis.shouldAcknowledge) {
      const acknowledgment = this.emotionalIntelligence.generateAcknowledgment(
        emotionAnalysis.primaryEmotion,
        emotionAnalysis.intensity
      );

      const toneGuidance = this.emotionalIntelligence.suggestTone(
        emotionAnalysis.primaryEmotion,
        emotionAnalysis.intensity
      );

      // Generate main response based on intent
      const mainResponse = this.generateResponseByIntent(
        classificationResult.intent,
        userMessage,
        contextString,
        toneGuidance,
        approach
      );

      // Add emotional closing
      const closing = this.emotionalIntelligence.generateClosing(
        emotionAnalysis.primaryEmotion,
        emotionAnalysis.intensity
      );

      responseMessage = `${acknowledgment}\n\n${mainResponse}\n\n${closing}`;
      responseStyle = `empathetic_${toneGuidance.tone}`;
    } else {
      responseMessage = this.generateResponseByIntent(
        classificationResult.intent,
        userMessage,
        contextString,
        null,
        approach
      );
    }

    // 8. Apply response variation for naturalness
    const topic = this.extractTopic(userMessage);
    const variation = this.responseVariation.selectRandom(topic);
    if (variation && !responseMessage.includes(variation)) {
      responseMessage = variation + '\n\n' + responseMessage;
    }

    // 9. Record response in memory
    this.conversationMemory.addMessage(sessionId, {
      role: 'jarvis',
      content: responseMessage,
      timestamp: Date.now()
    });

    // 10. Calculate coherence score
    const coherenceScore = this.calculateCoherence(responseMessage, context, classificationResult);

    // 11. Generate follow-up suggestions based on intent
    const followUpSuggestions = this.generateFollowUpSuggestions(
      classificationResult.intent,
      emotionAnalysis.primaryEmotion
    );

    // 12. Record interaction for learning
    this.recordInteraction(userMessage, responseMessage, classificationResult, true, emotionAnalysis);

    // 13. Start auto-learning if not already running
    if (!this.autoLearningEngine.getStatus().isRunning) {
      this.autoLearningEngine.startAutomaticLearning();
    }

    return {
      message: responseMessage,
      intent: classificationResult.intent,
      intentConfidence: classificationResult.confidence,
      emotion: emotionAnalysis.primaryEmotion,
      emotionIntensity: emotionAnalysis.intensity,
      responseStyle: responseStyle,
      coherenceScore,
      systemsUsed: [
        'ConversationMemory',
        'IntentClassifier',
        'EmotionalIntelligence',
        'ResponseGenerator',
        'ResponseVariation',
        'AutoLearningEngine'
      ],
      reasoning: classificationResult.reasoning,
      followUpSuggestions,
      timestamp: Date.now()
    };
  }

  /**
   * Generate response based on classified intent
   */
  private generateResponseByIntent(
    intent: Intent,
    userMessage: string,
    context: string,
    toneGuidance: any,
    approach: any
  ): string {
    const topic = this.extractTopic(userMessage);

    switch (intent) {
      case Intent.SECURITY_TECHNICAL:
        return this.responseGenerator.generateTechnicalGuide(
          topic,
          this.extractStepsFromMessage(userMessage)
        );

      case Intent.SECURITY_CONCEPTUAL:
        return this.responseGenerator.generateConversational(
          topic,
          `Based on your question: "${userMessage}"`
        );

      case Intent.LEARNING_PATH:
        return this.responseGenerator.generateSocratic(
          topic,
          `How would you approach learning ${topic}?`,
          `To help you learn ${topic} effectively`
        );

      case Intent.TOOL_RECOMMENDATION:
        return this.responseGenerator.generateProsCons(
          topic,
          ['Industry standard', 'Well-documented', 'Active community'],
          ['Learning curve', 'Configuration complexity']
        );

      case Intent.TROUBLESHOOTING:
        return this.responseGenerator.generateTechnicalGuide(
          `Troubleshooting ${topic}`,
          ['Identify the problem', 'Check logs', 'Test solutions']
        );

      case Intent.ETHICAL_QUESTION:
        return `Regarding your question about ${topic}:\n\nThis is an important consideration. The key principle is: ` +
               `always operate within legal and authorized boundaries. ` +
               `Never test systems without explicit written permission. ` +
               `Document your findings responsibly and disclose through proper channels.`;

      case Intent.PERSONAL:
        return this.responseGenerator.generateConversational(
          'about my capabilities and learning',
          `Regarding your question about ${topic}: I'm designed to be helpful, harmless, and honest.`
        );

      default:
        return `I'm here to help with security learning and research. ` +
               `Could you clarify what you're interested in? ` +
               `Are you looking for technical guidance, conceptual understanding, or something else?`;
    }
  }

  /**
   * Generate decline response for ethical boundary violations
   */
  private generateDeclineResponse(intent: Intent, userMessage: string): string {
    if (intent === Intent.ETHICAL_BOUNDARY) {
      return `I can't help with that request. ` +
             `I'm designed to support ethical, legal security learning and research. ` +
             `I won't provide guidance on creating malware, unauthorized access, or other harmful activities. ` +
             `Instead, I'd be happy to help you learn defensive security, ethical hacking, or authorized penetration testing.`;
    }

    if (intent === Intent.OFF_TOPIC) {
      return `That's outside my area of expertise. I'm specialized in security learning and ethical hacking. ` +
             `Is there something security-related I can help you with?`;
    }

    return `I'm not able to assist with that request. ` +
           `Let's refocus on security learning topics where I can be most helpful.`;
  }

  /**
   * Calculate response coherence score (0-1)
   */
  private calculateCoherence(response: string, context: any, classification: any): number {
    let score = 0.7; // Base score

    // Check if response addresses the context
    if (context?.extractedEntities) {
      const hasContextualReference = context.extractedEntities.technologies?.some(tech =>
        response.toLowerCase().includes(tech.toLowerCase())
      );
      if (hasContextualReference) score += 0.15;
    }

    // Check confidence reflects in response
    if (classification.confidence > 0.8) {
      score += 0.1;
    }

    // Ensure response is substantive
    if (response.length > 200) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Record interaction for auto-learning engine and self-evaluation
   */
  private recordInteraction(
    userMessage: string,
    response: string,
    classification: any,
    success: boolean,
    emotionAnalysis?: any
  ): void {
    const record: InteractionRecord = {
      timestamp: Date.now(),
      userMessage,
      jarvisResponse: response,
      intent: classification.intent,
      emotion: emotionAnalysis?.primaryEmotion || 'neutral',
      userSatisfaction: success ? Math.min(1, 0.6 + classification.confidence * 0.4) : 0.3,
      responseStyle: classification.suggestedHandling,
      quality: success ? classification.confidence : 0.2
    };

    this.autoLearningEngine.recordInteraction(record);

    // Record for self-evaluation (binary classification: success=1, failure=0)
    const evaluationRecord: PredictionResult = {
      timestamp: Date.now(),
      userQuery: userMessage,
      jarvisResponse: response,
      predictedClass: success ? 1 : 0,
      actualClass: success ? 1 : 0, // Will be updated with user feedback
      confidence: classification.confidence,
      intent: classification.intent,
      emotion: emotionAnalysis?.primaryEmotion || 'neutral'
    };

    this.autoEvaluationEngine.recordPrediction(evaluationRecord);
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(intent: Intent, emotion: EmotionalState): string[] {
    const suggestions: Record<Intent, string[]> = {
      [Intent.SECURITY_TECHNICAL]: [
        'Show me example code',
        'Explain the vulnerability',
        'How do I test for this?'
      ],
      [Intent.SECURITY_CONCEPTUAL]: [
        'Give a real-world example',
        'What are the risks?',
        'How do I protect against this?'
      ],
      [Intent.LEARNING_PATH]: [
        'Recommend resources',
        'What should I learn next?',
        'How long does it take?'
      ],
      [Intent.TOOL_RECOMMENDATION]: [
        'Compare with alternatives',
        'How do I install it?',
        'Show me usage examples'
      ],
      [Intent.TROUBLESHOOTING]: [
        'Check logs for clues',
        'Try a different approach',
        'Search for similar issues'
      ],
      [Intent.ETHICAL_QUESTION]: [
        'Explain the legal implications',
        'How do I get authorization?',
        'What should I do instead?'
      ],
      [Intent.ETHICAL_BOUNDARY]: [
        'Learn about ethical hacking',
        'Explore authorized testing',
        'Understand legal frameworks'
      ],
      [Intent.OFF_TOPIC]: [
        'Ask about security topics',
        'Learn hacking techniques',
        'Explore vulnerabilities'
      ],
      [Intent.PERSONAL]: [
        'What else should I know?',
        'How can you help me?',
        'What are your capabilities?'
      ],
      [Intent.AMBIGUOUS]: [
        'Clarify your question',
        'Give more context',
        'What exactly do you need help with?'
      ]
    };

    return suggestions[intent] || suggestions[Intent.AMBIGUOUS];
  }

  /**
   * Extract main topic from user message
   */
  private extractTopic(message: string): string {
    const topicPatterns = [
      /about (\w+(?:\s+\w+)?)/i,
      /how (?:do|can) i (\w+(?:\s+\w+)?)/i,
      /what is (\w+(?:\s+\w+)?)/i,
      /(\w+(?:\s+\w+)?)\s+(?:vulnerability|exploit|attack|technique)/i
    ];

    for (const pattern of topicPatterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }

    // Fallback to first meaningful word
    const words = message.split(/\s+/).filter(w => w.length > 3);
    return words[0] || 'security';
  }

  /**
   * Extract steps from user message for technical guides
   */
  private extractStepsFromMessage(message: string): string[] {
    if (message.includes('step')) {
      return ['Identify the target', 'Analyze the vulnerability', 'Craft the exploit', 'Test and iterate'];
    }
    return [];
  }

  /**
   * Get current learning status
   */
  getStatus() {
    return this.autoLearningEngine.getStatus();
  }

  /**
   * Get improvement suggestions
   */
  getImprovementSuggestions() {
    return this.autoLearningEngine.getImprovementSuggestions();
  }

  /**
   * Get self-diagnosis summary
   */
  getSelfDiagnosisSummary() {
    return this.autoEvaluationEngine.getDiagnosisSummary();
  }

  /**
   * Perform comprehensive self-evaluation
   */
  performSelfEvaluation() {
    return this.autoEvaluationEngine.performSelfDiagnosis();
  }

  /**
   * Print full self-diagnosis report
   */
  printSelfDiagnosisReport(): void {
    this.autoEvaluationEngine.printSelfDiagnosisReport();
  }

  /**
   * Analyze performance on specific intent
   */
  analyzeIntent(intent: string) {
    return this.autoEvaluationEngine.analyzeIntent(intent);
  }

  /**
   * Get comprehensive auto-improvement plan
   */
  getComprehensiveImprovementPlan() {
    return this.comprehensiveAutoImprovementEngine.performComprehensiveDiagnosis();
  }

  /**
   * Print comprehensive improvement plan
   */
  printComprehensiveImprovementPlan(): void {
    this.comprehensiveAutoImprovementEngine.printComprehensiveImprovementPlan();
  }

  /**
   * Stop learning engine on shutdown
   */
  shutdown(): void {
    this.autoLearningEngine.stop();
    this.printSelfDiagnosisReport();
    console.log("\n📈 Generating Comprehensive Auto-Improvement Plan...");
    this.printComprehensiveImprovementPlan();
    console.log("✅ [EnhancedChatHandler] Shutdown complete");
  }
}

// Export singleton
export const enhancedChatHandler = new EnhancedChatHandler();
