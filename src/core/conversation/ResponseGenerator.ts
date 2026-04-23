/**
 * RESPONSE GENERATOR
 *
 * Generates natural, varied responses instead of templates.
 * Eliminates the "FASE 3 - GENERACIÓN" pattern that makes Jarvis sound robotic.
 */

export enum ResponseStyle {
  TECHNICAL_GUIDE = "technical_guide",           // Step-by-step
  CONVERSATIONAL_EXPLANATION = "conversational", // Narrative style
  SOCRATIC_METHOD = "socratic",                  // Ask clarifying questions
  STORY_BASED = "story_based",                  // Real-world example first
  PROS_CONS_ANALYSIS = "pros_cons",             // Compare approaches
  VISUAL_BREAKDOWN = "visual_breakdown"         // Text diagrams
}

interface ResponseContext {
  query: string;
  topic: string;
  userSkillLevel: "beginner" | "intermediate" | "expert";
  isEmotional: boolean;
  emotion?: string;
  hasContext: boolean;
  previousTopics?: string[];
}

export class ResponseGenerator {
  /**
   * Select a random response style to avoid predictability
   */
  selectRandomStyle(): ResponseStyle {
    const styles = Object.values(ResponseStyle);
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * Select style based on context (more intelligent)
   */
  selectStyleForContext(context: ResponseContext): ResponseStyle {
    // If user is emotional, use conversational
    if (context.isEmotional) {
      return ResponseStyle.CONVERSATIONAL_EXPLANATION;
    }

    // If asking "how do I...", use technical guide
    if (context.query.toLowerCase().includes("how")) {
      if (Math.random() > 0.5) {
        return ResponseStyle.TECHNICAL_GUIDE;
      } else {
        return ResponseStyle.STORY_BASED;
      }
    }

    // If asking "what is...", use explanation
    if (context.query.toLowerCase().includes("what")) {
      return ResponseStyle.CONVERSATIONAL_EXPLANATION;
    }

    // If asking "why", use Socratic
    if (context.query.toLowerCase().includes("why")) {
      return ResponseStyle.SOCRATIC_METHOD;
    }

    // Default: random for variety
    return this.selectRandomStyle();
  }

  /**
   * Generate technical step-by-step guide
   */
  generateTechnicalGuide(topic: string, steps: string[]): string {
    const intros = [
      "Here's exactly how this works:",
      "Let me walk you through this step-by-step:",
      "The technical breakdown is:",
      "Follow along with me:",
      "Here's the systematic approach:"
    ];

    const intro = intros[Math.floor(Math.random() * intros.length)];
    let response = intro + "\n\n";

    steps.forEach((step, index) => {
      response += `${index + 1}. ${step}\n`;
    });

    return response;
  }

  /**
   * Generate conversational narrative explanation
   */
  generateConversational(topic: string, explanation: string): string {
    const openers = [
      "So here's the thing about this topic:",
      "Let me explain this in a way that makes sense:",
      "Think of it like this:",
      "The key insight is:",
      "What's really happening here is:",
      "Picture this scenario:",
      "Imagine you're trying to understand this..."
    ];

    const opener = openers[Math.floor(Math.random() * openers.length)];
    return `${opener} ${explanation}`;
  }

  /**
   * Generate Socratic method (ask questions)
   */
  generateSocratic(topic: string, question: string, guidance: string): string {
    const questions = [
      `Before I answer, let me ask: ${question}`,
      `That's a great question! But first, consider: ${question}`,
      `To help you better, I'm curious: ${question}`,
      `Think about it this way first: ${question}`,
      `Here's what I'd ask in return: ${question}`
    ];

    const q = questions[Math.floor(Math.random() * questions.length)];

    return `${q}\n\nOnce you think about that, here's the broader answer: ${guidance}`;
  }

  /**
   * Generate story-based explanation with real-world context
   */
  generateStoryBased(story: string, lesson: string): string {
    const transitions = [
      "Here's a real-world example that illustrates this:",
      "Picture this scenario:",
      "Imagine this happens:",
      "Let me walk you through a concrete example:",
      "Think of it this way with a real scenario:"
    ];

    const transition = transitions[Math.floor(Math.random() * transitions.length)];

    return `${transition}\n\n${story}\n\nThe key takeaway: ${lesson}`;
  }

  /**
   * Generate pros/cons analysis
   */
  generateProsCons(topic: string, pros: string[], cons: string[]): string {
    const openers = [
      "Let me break down the tradeoffs:",
      "Here are the pros and cons:",
      "The advantages and disadvantages are:",
      "Looking at both sides of this:"
    ];

    const opener = openers[Math.floor(Math.random() * openers.length)];

    let response = `${opener}\n\n**Advantages:**\n`;
    pros.forEach(pro => (response += `• ${pro}\n`));

    response += `\n**Disadvantages:**\n`;
    cons.forEach(con => (response += `• ${con}\n`));

    return response;
  }

  /**
   * Generate visual breakdown with ASCII art/diagrams
   */
  generateVisualBreakdown(diagram: string, explanation: string): string {
    return `Here's how it works visually:\n\n\`\`\`\n${diagram}\n\`\`\`\n\nWhat's happening: ${explanation}`;
  }

  /**
   * Format response with acknowledgment if needed
   */
  formatResponse(
    style: ResponseStyle,
    content: string,
    acknowledgeContext?: boolean,
    contextNote?: string
  ): string {
    let response = content;

    // Add context acknowledgment if provided
    if (acknowledgeContext && contextNote) {
      response = `${contextNote}\n\n${response}`;
    }

    // Add closing question to encourage follow-up
    const closingQuestions = [
      "\nDoes that make sense? Want me to elaborate on any part?",
      "\nClear enough? Any follow-up questions?",
      "\nHope that helps! What else would you like to know?",
      "\nDoes this answer your question? Let me know if you need clarification.",
      "\nFeeling good about this? What's next?"
    ];

    if (Math.random() > 0.3) {
      // 70% of the time, add a closing question
      response += closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
    }

    return response;
  }

  /**
   * Generate a NATURAL response (not template-based)
   */
  generateNaturalResponse(
    topic: string,
    content: string,
    style?: ResponseStyle,
    context?: ResponseContext
  ): string {
    // Select style if not provided
    const selectedStyle = style || this.selectRandomStyle();

    // For now, return formatted content with selected style
    // In future, use LLM or templates to generate with proper style
    switch (selectedStyle) {
      case ResponseStyle.TECHNICAL_GUIDE:
        return this.formatResponse(selectedStyle, `Here's the technical approach to ${topic}:\n\n${content}`);

      case ResponseStyle.CONVERSATIONAL_EXPLANATION:
        return this.formatResponse(
          selectedStyle,
          this.generateConversational(topic, content),
          context?.hasContext,
          context?.previousTopics ? `Following up on what we discussed about ${context.previousTopics[0]}:` : undefined
        );

      case ResponseStyle.SOCRATIC_METHOD:
        return this.formatResponse(
          selectedStyle,
          this.generateSocratic(topic, `What's your current understanding of ${topic}?`, content)
        );

      case ResponseStyle.STORY_BASED:
        return this.formatResponse(selectedStyle, `Let me illustrate this with a practical example:\n\n${content}`);

      case ResponseStyle.PROS_CONS_ANALYSIS:
        return this.formatResponse(selectedStyle, content);

      case ResponseStyle.VISUAL_BREAKDOWN:
        return this.formatResponse(selectedStyle, content);

      default:
        return this.formatResponse(selectedStyle, content);
    }
  }

  /**
   * Check if response is template-based (for debugging)
   */
  isTemplateResponse(response: string): boolean {
    const templatePatterns = ["FASE 3", "FASE 4", "FASE 5", "Plan de ataque para"];
    return templatePatterns.some(pattern => response.includes(pattern));
  }

  /**
   * Get response style diversity score (0-1)
   * Higher = more varied responses
   */
  getStyleDiversityScore(recentResponses: string[]): number {
    if (recentResponses.length === 0) return 0;

    const styleScores = new Map<ResponseStyle, number>();
    const responses = recentResponses.slice(-20); // Last 20 responses

    // This is a simplified check - in production, track actual style used
    const hasOpeners = responses.filter(r => r.startsWith("Here's")).length;
    const hasQuestions = responses.filter(r => r.includes("?")).length;
    const hasStories = responses.filter(r => r.includes("Imagine")).length;

    const uniqueStyles = [hasOpeners > 0 ? 1 : 0, hasQuestions > 0 ? 1 : 0, hasStories > 0 ? 1 : 0].reduce(
      (a, b) => a + b,
      0
    );

    return Math.min(uniqueStyles / 6, 1.0); // 6 possible styles
  }

  /**
   * Generate a response that's aware of emotional state
   */
  generateEmotionallyIntelligentResponse(emotion: string, baseContent: string): string {
    const emotionalOpeners = {
      frustrated: "I totally understand that feeling of frustration. Learning security is genuinely hard, and you're not alone in finding it challenging.",
      excited: "I love your energy! That enthusiasm is exactly what you need to master this topic.",
      confused: "It's completely normal to feel confused - this is complex material. Let me break it down into smaller pieces.",
      blocked: "You're hitting a wall, and that's actually a sign you're pushing your boundaries. That's where real learning happens.",
      confident: "Great confidence! That foundation is going to serve you well as you tackle more advanced topics."
    };

    const opener = emotionalOpeners[emotion as keyof typeof emotionalOpeners] || "";

    if (opener) {
      return `${opener}\n\n${baseContent}`;
    }

    return baseContent;
  }
}

export const responseGenerator = new ResponseGenerator();
