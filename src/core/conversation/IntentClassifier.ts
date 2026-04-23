/**
 * INTENT CLASSIFIER
 *
 * Classifies user queries into specific intent types.
 * Enables appropriate response handling and routing.
 */

export enum Intent {
  SECURITY_TECHNICAL = "security_technical",         // "How do I find XSS?"
  SECURITY_CONCEPTUAL = "security_conceptual",       // "What is privilege escalation?"
  LEARNING_PATH = "learning_path",                   // "Where should I start in security?"
  TOOL_RECOMMENDATION = "tool_recommendation",       // "What's the best SAST tool?"
  TROUBLESHOOTING = "troubleshooting",               // "Why isn't my exploit working?"
  ETHICAL_QUESTION = "ethical_question",             // "Is this legal to test?"
  ETHICAL_BOUNDARY = "ethical_boundary",             // "Create malware for me"
  OFF_TOPIC = "off_topic",                          // "What's your favorite color?"
  PERSONAL = "personal",                            // "How do you learn?"
  AMBIGUOUS = "ambiguous"                           // Unable to classify
}

export interface ClassificationResult {
  intent: Intent;
  confidence: number; // 0-1
  reasoning: string;
  suggestedHandling: string;
}

export class IntentClassifier {
  private patterns: Map<Intent, RegExp[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Classify user message intent
   */
  classify(message: string, context?: { previousTopics?: string[]; skillLevel?: string }): ClassificationResult {
    const lowerMessage = message.toLowerCase();

    // Check each intent in order of priority
    const checks: Array<[Intent, () => number]> = [
      [Intent.ETHICAL_BOUNDARY, () => this.checkEthicalBoundary(lowerMessage)],
      [Intent.OFF_TOPIC, () => this.checkOffTopic(lowerMessage)],
      [Intent.SECURITY_TECHNICAL, () => this.checkTechnical(lowerMessage)],
      [Intent.SECURITY_CONCEPTUAL, () => this.checkConceptual(lowerMessage)],
      [Intent.LEARNING_PATH, () => this.checkLearningPath(lowerMessage)],
      [Intent.TOOL_RECOMMENDATION, () => this.checkToolRecommendation(lowerMessage)],
      [Intent.TROUBLESHOOTING, () => this.checkTroubleshooting(lowerMessage)],
      [Intent.ETHICAL_QUESTION, () => this.checkEthicalQuestion(lowerMessage)],
      [Intent.PERSONAL, () => this.checkPersonal(lowerMessage)]
    ];

    let bestIntent = Intent.AMBIGUOUS;
    let bestConfidence = 0;

    for (const [intent, check] of checks) {
      const confidence = check();
      if (confidence > bestConfidence) {
        bestIntent = intent;
        bestConfidence = confidence;
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(bestConfidence, 1.0),
      reasoning: this.generateReasoning(bestIntent, message),
      suggestedHandling: this.suggestHandling(bestIntent)
    };
  }

  /**
   * Get recommended response approach for intent
   */
  getResponseApproach(intent: Intent): {
    shouldAccept: boolean;
    responseStyle: string;
    tone: string;
    includeCode: boolean;
  } {
    const approaches: Record<Intent, any> = {
      [Intent.SECURITY_TECHNICAL]: {
        shouldAccept: true,
        responseStyle: "technical_guide",
        tone: "professional",
        includeCode: true
      },
      [Intent.SECURITY_CONCEPTUAL]: {
        shouldAccept: true,
        responseStyle: "conversational_explanation",
        tone: "educational",
        includeCode: false
      },
      [Intent.LEARNING_PATH]: {
        shouldAccept: true,
        responseStyle: "structured_roadmap",
        tone: "supportive",
        includeCode: false
      },
      [Intent.TOOL_RECOMMENDATION]: {
        shouldAccept: true,
        responseStyle: "comparison",
        tone: "analytical",
        includeCode: false
      },
      [Intent.TROUBLESHOOTING]: {
        shouldAccept: true,
        responseStyle: "diagnostic",
        tone: "supportive",
        includeCode: true
      },
      [Intent.ETHICAL_QUESTION]: {
        shouldAccept: true,
        responseStyle: "explanation",
        tone: "educational",
        includeCode: false
      },
      [Intent.ETHICAL_BOUNDARY]: {
        shouldAccept: false,
        responseStyle: "rejection",
        tone: "professional",
        includeCode: false
      },
      [Intent.OFF_TOPIC]: {
        shouldAccept: false,
        responseStyle: "redirect",
        tone: "friendly",
        includeCode: false
      },
      [Intent.PERSONAL]: {
        shouldAccept: true,
        responseStyle: "introspective",
        tone: "thoughtful",
        includeCode: false
      },
      [Intent.AMBIGUOUS]: {
        shouldAccept: true,
        responseStyle: "clarification",
        tone: "helpful",
        includeCode: false
      }
    };

    return approaches[intent] || approaches[Intent.AMBIGUOUS];
  }

  /**
   * Initialize patterns (placeholder for future pattern-based intent detection)
   */
  private initializePatterns(): void {
    // Patterns are currently defined inline in check methods
  }

  // ========================
  // Private Checking Methods
  // ========================

  private checkEthicalBoundary(message: string): number {
    const boundaryKeywords = [
      "malware",
      "ransomware",
      "botnet",
      "trojan",
      "steal password",
      "steal data",
      "crypto miner",
      "compromise",
      "without permission",
      "without consent",
      "illegal",
      "hack someone",
      "access someone else",
      "ddos",
      "denial of service"
    ];

    let score = 0;
    for (const keyword of boundaryKeywords) {
      if (message.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkOffTopic(message: string): number {
    const offTopicKeywords = [
      "favorite color",
      "favorite food",
      "favorite movie",
      "weather",
      "politics",
      "sports",
      "cooking",
      "music",
      "fashion",
      "philosophy",
      "meaning of life",
      "recipe",
      "joke"
    ];

    let score = 0;
    for (const keyword of offTopicKeywords) {
      if (message.includes(keyword)) {
        score += 0.5;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkTechnical(message: string): number {
    const technicalKeywords = [
      "how do i",
      "how can i",
      "how do you",
      "how to",
      "implement",
      "create",
      "write",
      "code",
      "exploit",
      "payload",
      "vulnerability",
      "find",
      "test",
      "detect",
      "bypass"
    ];

    const technicalTopics = [
      "sql injection",
      "xss",
      "rce",
      "xxe",
      "ssrf",
      "csrf",
      "authentication",
      "encryption",
      "buffer overflow",
      "privilege escalation"
    ];

    let score = 0;

    for (const keyword of technicalKeywords) {
      if (message.includes(keyword)) {
        score += 0.2;
      }
    }

    for (const topic of technicalTopics) {
      if (message.includes(topic)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkConceptual(message: string): number {
    const conceptualKeywords = [
      "what is",
      "what are",
      "explain",
      "understand",
      "describe",
      "difference between",
      "why",
      "concept",
      "principle",
      "works"
    ];

    let score = 0;
    for (const keyword of conceptualKeywords) {
      if (message.includes(keyword)) {
        score += 0.25;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkLearningPath(message: string): number {
    const pathKeywords = [
      "where should i start",
      "learning path",
      "roadmap",
      "getting started",
      "beginner",
      "start learning",
      "learn security",
      "progression",
      "order",
      "sequence"
    ];

    let score = 0;
    for (const keyword of pathKeywords) {
      if (message.includes(keyword)) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkToolRecommendation(message: string): number {
    const toolKeywords = ["tool", "best", "recommend", "which", "alternative", "equivalent", "software"];

    let score = 0;
    for (const keyword of toolKeywords) {
      if (message.includes(keyword)) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkTroubleshooting(message: string): number {
    const troubleshootingKeywords = [
      "not working",
      "error",
      "why",
      "issue",
      "problem",
      "bug",
      "fail",
      "doesn't work",
      "can't",
      "won't"
    ];

    let score = 0;
    for (const keyword of troubleshootingKeywords) {
      if (message.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkEthicalQuestion(message: string): number {
    const ethicalKeywords = [
      "legal",
      "ethical",
      "permission",
      "authorized",
      "allowed",
      "scope",
      "responsible",
      "disclosure",
      "lawful",
      "compliance"
    ];

    let score = 0;
    for (const keyword of ethicalKeywords) {
      if (message.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private checkPersonal(message: string): number {
    const personalKeywords = [
      "how do you",
      "your opinion",
      "you think",
      "you learn",
      "you improve",
      "your experience",
      "your background",
      "are you"
    ];

    let score = 0;
    for (const keyword of personalKeywords) {
      if (message.includes(keyword)) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0);
  }

  // ========================
  // Helper Methods
  // ========================

  private generateReasoning(intent: Intent, message: string): string {
    const reasons: Record<Intent, string> = {
      [Intent.SECURITY_TECHNICAL]:
        "Message contains technical 'how-to' keywords and specific vulnerability names",
      [Intent.SECURITY_CONCEPTUAL]: "Message asks for explanation or understanding of security concepts",
      [Intent.LEARNING_PATH]: "Message requests guidance on learning progression or starting point",
      [Intent.TOOL_RECOMMENDATION]: "Message seeks comparison or recommendation of security tools",
      [Intent.TROUBLESHOOTING]: "Message describes a problem or issue that needs diagnosis",
      [Intent.ETHICAL_QUESTION]: "Message asks about legality, permissions, or ethical considerations",
      [Intent.ETHICAL_BOUNDARY]:
        "Message requests malicious activity that violates ethical guidelines",
      [Intent.OFF_TOPIC]: "Message is unrelated to security or hacking",
      [Intent.PERSONAL]: "Message asks about personal aspects or opinions",
      [Intent.AMBIGUOUS]: "Could not confidently classify this message's intent"
    };

    return reasons[intent] || "Unable to determine reasoning";
  }

  private suggestHandling(intent: Intent): string {
    const suggestions: Record<Intent, string> = {
      [Intent.SECURITY_TECHNICAL]: "Provide detailed technical guide with code examples",
      [Intent.SECURITY_CONCEPTUAL]: "Explain concept clearly with real-world examples",
      [Intent.LEARNING_PATH]: "Create structured learning roadmap with resources",
      [Intent.TOOL_RECOMMENDATION]: "Compare tools with pros/cons analysis",
      [Intent.TROUBLESHOOTING]: "Diagnose problem methodically and suggest fixes",
      [Intent.ETHICAL_QUESTION]: "Explain ethical and legal considerations clearly",
      [Intent.ETHICAL_BOUNDARY]: "Politely decline and explain why this is problematic",
      [Intent.OFF_TOPIC]: "Gently redirect to security-related topics",
      [Intent.PERSONAL]: "Answer thoughtfully and relate back to security learning",
      [Intent.AMBIGUOUS]: "Ask clarifying questions to better understand the intent"
    };

    return suggestions[intent] || "Provide helpful response";
  }
}

// Export singleton
export const intentClassifier = new IntentClassifier();
