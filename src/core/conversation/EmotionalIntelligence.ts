/**
 * EMOTIONAL INTELLIGENCE ENGINE
 *
 * Detects emotional state from messages and adapts responses accordingly.
 * Enables empathetic, supportive interactions.
 */

export enum EmotionalState {
  FRUSTRATED = "frustrated",
  EXCITED = "excited",
  CONFUSED = "confused",
  BLOCKED = "blocked",
  CONFIDENT = "confident",
  CURIOUS = "curious",
  ANXIOUS = "anxious",
  NEUTRAL = "neutral"
}

export interface EmotionAnalysis {
  primaryEmotion: EmotionalState;
  secondaryEmotion?: EmotionalState;
  intensity: number; // 0-1
  indicators: string[];
  shouldAcknowledge: boolean;
}

export class EmotionalIntelligenceEngine {
  private emotionPatterns: Map<EmotionalState, string[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Analyze emotional state from message
   */
  analyze(message: string): EmotionAnalysis {
    const lowerMessage = message.toLowerCase();

    const emotions: Array<[EmotionalState, number, string[]]> = [
      [EmotionalState.FRUSTRATED, this.scoreFrustration(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.FRUSTRATED)],
      [EmotionalState.EXCITED, this.scoreExcitement(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.EXCITED)],
      [EmotionalState.CONFUSED, this.scoreConfusion(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.CONFUSED)],
      [EmotionalState.BLOCKED, this.scoreBlocked(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.BLOCKED)],
      [EmotionalState.CONFIDENT, this.scoreConfident(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.CONFIDENT)],
      [EmotionalState.CURIOUS, this.scoreCurious(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.CURIOUS)],
      [EmotionalState.ANXIOUS, this.scoreAnxious(lowerMessage), this.findIndicators(lowerMessage, EmotionalState.ANXIOUS)]
    ];

    // Find primary emotion (highest score)
    let primaryEmotion = EmotionalState.NEUTRAL;
    let primaryScore = 0;
    let secondaryEmotion = undefined;
    let secondaryScore = 0;
    let primaryIndicators: string[] = [];

    for (const [emotion, score, indicators] of emotions) {
      if (score > primaryScore) {
        secondaryEmotion = primaryEmotion;
        secondaryScore = primaryScore;
        primaryEmotion = emotion;
        primaryScore = score;
        primaryIndicators = indicators;
      } else if (score > secondaryScore) {
        secondaryEmotion = emotion;
        secondaryScore = score;
      }
    }

    return {
      primaryEmotion,
      secondaryEmotion: secondaryScore > 0.2 ? secondaryEmotion : undefined,
      intensity: Math.min(primaryScore, 1.0),
      indicators: primaryIndicators,
      shouldAcknowledge: primaryScore > 0.3
    };
  }

  /**
   * Generate empathetic response opener based on emotion
   */
  generateAcknowledgment(emotion: EmotionalState, intensity: number): string {
    const acknowledgments: Record<EmotionalState, string[]> = {
      [EmotionalState.FRUSTRATED]: [
        "I totally understand that feeling of frustration. Learning security is genuinely challenging.",
        "That sounds frustrating, and you're definitely not alone in feeling that way.",
        "I hear the frustration. These concepts are complex, but I promise they make sense with the right explanation.",
        "Frustration is a sign you're pushing your boundaries. That's actually where growth happens.",
        "I get it - when things don't work, it's incredibly frustrating. But we can work through this."
      ],
      [EmotionalState.EXCITED]: [
        "Your enthusiasm is exactly what you need! Let's dive deeper into this.",
        "I love your energy! This is the mindset that leads to mastery.",
        "That excitement is powerful. Let's channel it into really solid learning.",
        "Your passion for this is awesome. Let me help you take it to the next level.",
        "This enthusiasm is contagious! Let's explore this further together."
      ],
      [EmotionalState.CONFUSED]: [
        "It's completely normal to feel confused - this is genuinely complex material.",
        "Confusion is actually a sign you're engaging with the right difficulty level.",
        "Let me break this down into smaller pieces that make more sense.",
        "Feeling confused right now is totally okay. Most experts felt the same way once.",
        "Your confusion is valuable - it shows exactly where to focus our explanation."
      ],
      [EmotionalState.BLOCKED]: [
        "You're stuck, and that's frustrating. But this is where breakthroughs happen.",
        "Feeling blocked is temporary. Let's work through this systematically.",
        "You're facing a real obstacle, but you have the capability to overcome it.",
        "Being blocked is part of the learning process. Let's find another angle.",
        "This wall you're hitting is real, but it's not permanent. Let me help you around it."
      ],
      [EmotionalState.CONFIDENT]: [
        "That confidence is well-placed! Let's build on this foundation.",
        "Great confidence! Now let's test it against more advanced concepts.",
        "Your confidence shows you've learned something important. Let's expand on it.",
        "This is the right mindset. Let's keep this momentum going.",
        "That self-assurance is powerful. Let's challenge ourselves further."
      ],
      [EmotionalState.CURIOUS]: [
        "That curiosity is perfect! Let me satisfy it with depth.",
        "I love when people ask these kinds of questions. It shows real thinking.",
        "Your curiosity is leading you in exactly the right direction.",
        "These questions show you're engaging deeply. Let's explore fully.",
        "Curiosity like this is what creates experts. Let's dive in."
      ],
      [EmotionalState.ANXIOUS]: [
        "I can sense some anxiety about this. That's understandable, but you've got this.",
        "Anxiety about security is common, but let me help ease those concerns.",
        "What you're feeling is natural. Let's address it directly and build confidence.",
        "Your concerns are valid, but they're also addressable. Here's how.",
        "Anxiety often comes from uncertainty. Let me provide clarity."
      ],
      [EmotionalState.NEUTRAL]: [
        "Let me help you understand this topic completely.",
        "Here's what you need to know about this subject.",
        "Let me provide a clear explanation of how this works.",
        "I'll walk you through this topic systematically.",
        "Here's a comprehensive overview of what's happening."
      ]
    };

    const options = acknowledgments[emotion] || acknowledgments[EmotionalState.NEUTRAL];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate supportive closing based on emotion
   */
  generateClosing(emotion: EmotionalState, intensity: number): string {
    const closings: Record<EmotionalState, string[]> = {
      [EmotionalState.FRUSTRATED]: [
        "Don't get discouraged - this is a normal part of the learning curve.",
        "You're making progress, even if it doesn't feel like it right now.",
        "Every expert has been where you are. You'll get past this.",
        "Keep pushing. The breakthrough is usually right after the frustration.",
        "You've got the ability to figure this out. Take a break if you need to, then come back to it."
      ],
      [EmotionalState.EXCITED]: [
        "Use this energy to keep pushing forward and learn even more.",
        "This momentum will carry you far. Keep building on it.",
        "Your enthusiasm is your superpower here. Keep it up!",
        "Don't lose this drive. It's the fuel for real mastery.",
        "Ride this wave of excitement into deeper learning."
      ],
      [EmotionalState.CONFUSED]: [
        "Confusion is just clarity waiting to happen. We'll get there.",
        "The fact that you're confused means you're ready to learn. Good sign.",
        "Let this confusion motivate you to dig deeper.",
        "Once this clicks, you'll understand not just the concept but why it works.",
        "You're closer to understanding than you think."
      ],
      [EmotionalState.BLOCKED]: [
        "You're not stuck forever. This is temporary. Let's work around it.",
        "Obstacles are just opportunities to learn a different approach.",
        "Sometimes the best breakthroughs come from hitting walls.",
        "You've overcome obstacles before. This is just the next one.",
        "Take this as a challenge, not a dead end."
      ],
      [EmotionalState.CONFIDENT]: [
        "Now test that confidence by tackling more advanced topics.",
        "Use this foundation to go deeper.",
        "Your confidence is earned. Build on it strategically.",
        "You've proven you can master this. Time for the next level.",
        "This is just the beginning. Keep climbing."
      ],
      [EmotionalState.CURIOUS]: [
        "Keep asking questions like this. That's how experts think.",
        "Your curiosity will take you far in this field.",
        "These deep questions show you're ready for advanced topics.",
        "Never stop asking 'how' and 'why'. It's what separates experts from novices.",
        "Feed that curiosity - it's your greatest asset."
      ],
      [EmotionalState.ANXIOUS]: [
        "Your concerns are reasonable, but they're manageable.",
        "Remember: security is as much about understanding as doing.",
        "You don't need to know everything to be effective. Progress matters.",
        "Take this one step at a time. That's how professionals approach it too.",
        "Your caution is actually a strength in security. Embrace it."
      ],
      [EmotionalState.NEUTRAL]: [
        "Feel free to ask if anything needs clarification.",
        "Let me know what else you'd like to explore.",
        "Does this make sense? Happy to dive deeper into any part.",
        "What's your next question?",
        "Ready to explore the next topic, or do you want to dig deeper here?"
      ]
    };

    const options = closings[emotion] || closings[EmotionalState.NEUTRAL];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Suggest response tone based on emotion
   */
  suggestTone(emotion: EmotionalState, intensity: number): {
    tone: string;
    approach: string;
    encouragement: string;
  } {
    const tones: Record<EmotionalState, any> = {
      [EmotionalState.FRUSTRATED]: {
        tone: "empathetic_supportive",
        approach: "Break down into smaller steps, show progress, celebrate small wins",
        encouragement: "Acknowledge difficulty, reinforce capability"
      },
      [EmotionalState.EXCITED]: {
        tone: "enthusiastic_engaging",
        approach: "Go deeper, provide advanced concepts, create challenges",
        encouragement: "Validate enthusiasm, expand horizons"
      },
      [EmotionalState.CONFUSED]: {
        tone: "patient_clear",
        approach: "Start from fundamentals, use multiple examples, explain thoroughly",
        encouragement: "Normalize confusion, validate learning process"
      },
      [EmotionalState.BLOCKED]: {
        tone: "practical_problem_solving",
        approach: "Offer alternative approaches, suggest resources, provide workarounds",
        encouragement: "Reframe as opportunity, offer support"
      },
      [EmotionalState.CONFIDENT]: {
        tone: "respectful_challenging",
        approach: "Introduce advanced topics, ask probing questions, test understanding",
        encouragement: "Build on confidence, push boundaries"
      },
      [EmotionalState.CURIOUS]: {
        tone: "exploratory_detailed",
        approach: "Provide depth, answer fully, explore connections",
        encouragement: "Validate curiosity, encourage exploration"
      },
      [EmotionalState.ANXIOUS]: {
        tone: "reassuring_grounded",
        approach: "Provide certainty, explain clearly, offer structure",
        encouragement: "Ease concerns, build confidence gradually"
      },
      [EmotionalState.NEUTRAL]: {
        tone: "professional_clear",
        approach: "Provide accurate information, structure logically, offer examples",
        encouragement: "Engage with the material, share findings"
      }
    };

    return tones[emotion] || tones[EmotionalState.NEUTRAL];
  }

  // ========================
  // Private Scoring Methods
  // ========================

  private scoreFrustration(message: string): number {
    const keywords = [
      "frustrated",
      "frustration",
      "annoyed",
      "irritated",
      "exasperated",
      "can't figure",
      "don't understand",
      "still don't get",
      "why isn't",
      "why won't"
    ];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.25;
    }

    return Math.min(score, 1.0);
  }

  private scoreExcitement(message: string): number {
    const keywords = [
      "excited",
      "amazing",
      "awesome",
      "fascinating",
      "love",
      "cool",
      "awesome",
      "great",
      "wonderful",
      "excellent",
      "!",
      "!!"
    ];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private scoreConfusion(message: string): number {
    const keywords = ["confused", "confusing", "unclear", "don't understand", "what", "how", "why", "lost"];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private scoreBlocked(message: string): number {
    const keywords = ["stuck", "blocked", "can't", "unable", "won't work", "not working", "dead end"];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  private scoreConfident(message: string): number {
    const keywords = ["confident", "sure", "definitely", "certain", "know that", "understand", "obvious"];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private scoreCurious(message: string): number {
    const keywords = ["why", "how", "curious", "wonder", "interested", "explore", "tell me more", "deeper"];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  private scoreAnxious(message: string): number {
    const keywords = [
      "worried",
      "concerned",
      "anxious",
      "nervous",
      "scary",
      "risky",
      "danger",
      "afraid",
      "fear",
      "should i",
      "is it safe"
    ];

    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) score += 0.25;
    }

    return Math.min(score, 1.0);
  }

  private findIndicators(message: string, emotion: EmotionalState): string[] {
    const indicators: Record<EmotionalState, string[]> = {
      [EmotionalState.FRUSTRATED]: ["Expresses frustration", "Shows difficulty understanding", "Repeated failures mentioned"],
      [EmotionalState.EXCITED]: ["Enthusiastic language", "Positive exclamations", "Eager to learn more"],
      [EmotionalState.CONFUSED]: ["Asking multiple questions", "Uncertainty expressed", "Seeking clarification"],
      [EmotionalState.BLOCKED]: ["Obstacle mentioned", "Progress halted", "Needs help"],
      [EmotionalState.CONFIDENT]: ["Assertive language", "Clear understanding", "Ready for advancement"],
      [EmotionalState.CURIOUS]: ["Multiple questions", "Deep inquiry", "Seeking understanding"],
      [EmotionalState.ANXIOUS]: ["Expressing concerns", "Seeking reassurance", "Worried about outcomes"],
      [EmotionalState.NEUTRAL]: ["Factual inquiry", "No emotion detected", "Standard question"]
    };

    return indicators[emotion] || [];
  }

  private initializePatterns(): void {
    // Placeholder for future pattern-based approaches
  }
}

// Export singleton
export const emotionalIntelligenceEngine = new EmotionalIntelligenceEngine();
