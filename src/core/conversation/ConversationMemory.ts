/**
 * CONVERSATION MEMORY
 *
 * Tracks conversation context across multiple turns.
 * Solves: Lost context problem (currently 0% retention)
 * Target: 95%+ context retention
 */

export interface Message {
  role: "user" | "jarvis";
  content: string;
  timestamp: number;
}

export interface EntityMap {
  companies: string[];
  technologies: string[];
  objectives: string[];
  constraints: string[];
  vulnerabilities: string[];
  techniques: string[];
}

export interface ConversationContext {
  sessionId: string;
  turn: number;
  messages: Message[];
  extractedEntities: EntityMap;
  conversationSummary: string;
  previousPatterns: string[]; // What worked before
  skillLevel: "beginner" | "intermediate" | "expert";
  emotionalState: {
    frustrated: number;
    excited: number;
    confused: number;
    blocked: number;
  };
  topicSequence: string[]; // Order of topics discussed
  lastUpdateTime: number;
}

export class ConversationMemory {
  private sessionStore: Map<string, ConversationContext> = new Map();
  private entityExtractor = new EntityExtractor();

  /**
   * Initialize or retrieve existing conversation context
   */
  initializeContext(sessionId: string): ConversationContext {
    if (this.sessionStore.has(sessionId)) {
      return this.sessionStore.get(sessionId)!;
    }

    const newContext: ConversationContext = {
      sessionId,
      turn: 0,
      messages: [],
      extractedEntities: {
        companies: [],
        technologies: [],
        objectives: [],
        constraints: [],
        vulnerabilities: [],
        techniques: []
      },
      conversationSummary: "",
      previousPatterns: [],
      skillLevel: "intermediate",
      emotionalState: {
        frustrated: 0,
        excited: 0,
        confused: 0,
        blocked: 0
      },
      topicSequence: [],
      lastUpdateTime: Date.now()
    };

    this.sessionStore.set(sessionId, newContext);
    return newContext;
  }

  /**
   * Add a message to conversation history
   */
  addMessage(sessionId: string, message: Message): ConversationContext {
    const context = this.initializeContext(sessionId);

    context.messages.push({
      ...message,
      timestamp: Date.now()
    });

    context.turn++;
    context.lastUpdateTime = Date.now();

    // Extract entities from user messages
    if (message.role === "user") {
      const newEntities = this.entityExtractor.extract(message.content);
      this.mergeEntities(context.extractedEntities, newEntities);

      // Update skill level based on question complexity
      context.skillLevel = this.inferSkillLevel(message.content, context);

      // Update emotional state
      context.emotionalState = this.analyzeEmotion(message.content);
    }

    // Update summary after each message
    context.conversationSummary = this.generateSummary(context);

    return context;
  }

  /**
   * Get current conversation context
   */
  getContext(sessionId: string): ConversationContext {
    return this.initializeContext(sessionId);
  }

  /**
   * Get context as a string for inclusion in prompts
   */
  getContextAsString(sessionId: string): string {
    const context = this.getContext(sessionId);

    if (context.turn === 0) {
      return ""; // No prior context
    }

    let contextStr = `## Conversation Context\n\n`;
    contextStr += `**Turn:** ${context.turn}\n`;
    contextStr += `**Summary:** ${context.conversationSummary}\n`;

    if (context.extractedEntities.companies.length > 0) {
      contextStr += `**Companies/Projects Mentioned:** ${context.extractedEntities.companies.join(", ")}\n`;
    }

    if (context.extractedEntities.objectives.length > 0) {
      contextStr += `**User's Objectives:** ${context.extractedEntities.objectives.join(", ")}\n`;
    }

    if (context.extractedEntities.constraints.length > 0) {
      contextStr += `**Constraints:** ${context.extractedEntities.constraints.join(", ")}\n`;
    }

    if (context.topicSequence.length > 0) {
      contextStr += `**Topics Discussed:** ${context.topicSequence.join(" → ")}\n`;
    }

    contextStr += `**User Skill Level:** ${context.skillLevel}\n`;

    if (context.emotionalState.frustrated > 0.5) {
      contextStr += `**Note:** User appears frustrated - be encouraging and supportive\n`;
    } else if (context.emotionalState.excited > 0.5) {
      contextStr += `**Note:** User is excited and engaged - encourage deeper learning\n`;
    } else if (context.emotionalState.confused > 0.5) {
      contextStr += `**Note:** User is confused - simplify explanation and offer support\n`;
    }

    contextStr += "\n";

    return contextStr;
  }

  /**
   * Get recent conversation snippet (last N turns)
   */
  getRecentTurns(sessionId: string, n: number = 3): Message[] {
    const context = this.getContext(sessionId);
    return context.messages.slice(-n * 2); // N turns = N*2 messages (user + jarvis)
  }

  /**
   * Find similar past interactions
   */
  getSimilarPastInteractions(sessionId: string, query: string, limit: number = 3): string[] {
    const context = this.getContext(sessionId);

    // Simple similarity: find messages containing similar words
    const queryWords = query.toLowerCase().split(" ");
    const similar: string[] = [];

    for (const message of context.messages) {
      if (message.role === "jarvis") {
        const messageWords = message.content.toLowerCase();
        const matches = queryWords.filter(word => messageWords.includes(word)).length;

        if (matches > 2) {
          similar.push(message.content);
        }
      }
    }

    return similar.slice(0, limit);
  }

  /**
   * Clear old sessions (for memory management)
   */
  clearOldSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();

    for (const [sessionId, context] of this.sessionStore.entries()) {
      if (now - context.lastUpdateTime > maxAgeMs) {
        this.sessionStore.delete(sessionId);
      }
    }
  }

  /**
   * Get memory usage stats
   */
  getStats(): {
    activeSessions: number;
    totalMessages: number;
    averageTurnLength: number;
  } {
    let totalMessages = 0;
    let activeSessions = 0;

    for (const context of this.sessionStore.values()) {
      activeSessions++;
      totalMessages += context.messages.length;
    }

    return {
      activeSessions,
      totalMessages,
      averageTurnLength: activeSessions > 0 ? totalMessages / activeSessions : 0
    };
  }

  /**
   * Private: Merge new entities into existing ones
   */
  private mergeEntities(existing: EntityMap, newEntities: EntityMap): void {
    for (const key of Object.keys(newEntities) as Array<keyof EntityMap>) {
      const newValues = newEntities[key];
      const existingValues = existing[key];

      // Add new values that don't exist
      for (const value of newValues) {
        if (!existingValues.includes(value)) {
          existingValues.push(value);
        }
      }
    }
  }

  /**
   * Private: Infer user's skill level from question complexity
   */
  private inferSkillLevel(message: string, context: ConversationContext): "beginner" | "intermediate" | "expert" {
    const beginnerKeywords = ["how", "what is", "explain", "teach", "learn"];
    const expertKeywords = ["exploit", "payload", "evasion", "WAF bypass", "0-day", "privilege escalation"];

    const lowerMessage = message.toLowerCase();
    const expertCount = expertKeywords.filter(kw => lowerMessage.includes(kw)).length;
    const beginnerCount = beginnerKeywords.filter(kw => lowerMessage.includes(kw)).length;

    if (expertCount > 2) return "expert";
    if (beginnerCount > 2) return "beginner";

    return context.skillLevel; // Keep previous level if ambiguous
  }

  /**
   * Private: Analyze emotional state from message
   */
  private analyzeEmotion(message: string): ConversationContext["emotionalState"] {
    const lowerMessage = message.toLowerCase();

    const frustrationWords = ["frustrated", "confused", "stuck", "don't understand", "can't figure"];
    const excitementWords = ["excited", "love", "awesome", "amazing", "fascinating"];
    const confusionWords = ["what", "how", "why", "confused", "unclear"];
    const blockedWords = ["stuck", "blocked", "can't", "unable", "problem"];

    const frustration = frustrationWords.filter(word => lowerMessage.includes(word)).length > 0 ? 0.8 : 0;
    const excited = excitementWords.filter(word => lowerMessage.includes(word)).length > 0 ? 0.8 : 0;
    const confused = confusionWords.filter(word => lowerMessage.includes(word)).length > 1 ? 0.7 : 0;
    const blocked = blockedWords.filter(word => lowerMessage.includes(word)).length > 0 ? 0.6 : 0;

    return {
      frustrated: Math.min(frustration, 1),
      excited: Math.min(excited, 1),
      confused: Math.min(confused, 1),
      blocked: Math.min(blocked, 1)
    };
  }

  /**
   * Private: Generate conversation summary
   */
  private generateSummary(context: ConversationContext): string {
    if (context.turn === 0) return "";

    const recentMessages = context.messages.slice(-4); // Last 2 exchanges
    const userMessages = recentMessages.filter(m => m.role === "user");

    if (userMessages.length === 0) return "";

    const topics = userMessages.map(m => this.extractMainTopic(m.content)).filter(t => t.length > 0);

    if (topics.length === 0) return "Discussing security topics";

    return `User is discussing: ${topics.join(", ")}`;
  }

  /**
   * Private: Extract main topic from message
   */
  private extractMainTopic(message: string): string {
    const topicPatterns = ["SQL injection", "XSS", "CSRF", "RCE", "XXE", "SSRF", "authentication", "encryption"];

    for (const pattern of topicPatterns) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return pattern;
      }
    }

    // Generic extraction: first significant phrase
    const words = message.split(" ").slice(0, 5).join(" ");
    return words.length > 0 ? words : "";
  }
}

/**
 * Entity Extractor
 * Uses pattern matching to identify important entities in messages
 */
class EntityExtractor {
  extract(text: string): EntityMap {
    return {
      companies: this.extractCompanies(text),
      technologies: this.extractTechnologies(text),
      objectives: this.extractObjectives(text),
      constraints: this.extractConstraints(text),
      vulnerabilities: this.extractVulnerabilities(text),
      techniques: this.extractTechniques(text)
    };
  }

  private extractCompanies(text: string): string[] {
    // Look for company names (capitalized words that sound like companies)
    const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const matches = text.match(pattern) || [];
    return matches.filter(m => m.length > 3).slice(0, 5);
  }

  private extractTechnologies(text: string): string[] {
    const techKeywords = [
      "React",
      "Node",
      "Python",
      "Java",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "PostgreSQL",
      "MongoDB",
      "Redis"
    ];
    return techKeywords.filter(tech => text.includes(tech));
  }

  private extractObjectives(text: string): string[] {
    const objectiveKeywords = ["pentesting", "vulnerability analysis", "security audit", "red team", "bug bounty"];
    return objectiveKeywords.filter(obj => text.toLowerCase().includes(obj));
  }

  private extractConstraints(text: string): string[] {
    const constraintKeywords = ["authorized", "in scope", "timeline", "budget", "approved"];
    return constraintKeywords.filter(con => text.toLowerCase().includes(con));
  }

  private extractVulnerabilities(text: string): string[] {
    const vulnPatterns = ["CVE-\\d{4}-\\d{4,5}", "SQL injection", "XSS", "RCE", "XXE", "SSRF"];
    const found: string[] = [];

    for (const pattern of vulnPatterns) {
      if (new RegExp(pattern, "i").test(text)) {
        found.push(pattern.replace(/\\/g, ""));
      }
    }

    return found;
  }

  private extractTechniques(text: string): string[] {
    const techniqueKeywords = ["privilege escalation", "lateral movement", "persistence", "evasion", "exfiltration"];
    return techniqueKeywords.filter(tech => text.toLowerCase().includes(tech));
  }
}

export const conversationMemory = new ConversationMemory();
