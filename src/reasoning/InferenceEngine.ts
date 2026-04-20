/**
 * INFERENCE ENGINE
 *
 * Core logical reasoning engine for Jarvis
 * Implements backward chaining and forward chaining inference
 * 100% autonomous - no external APIs
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Fact {
  property: string;
  value: string | number | boolean;
  timestamp?: number;
  confidence?: number;
}

export interface Rule {
  name: string;
  preconditions: string[]; // Facts that must be true
  conclusion: string; // Fact that becomes true if preconditions are met
  confidence: number; // 0.0 - 1.0
  weight?: number; // Importance of this rule
}

export interface InferenceResult {
  query: string;
  derivedFacts: Fact[];
  usedRules: string[];
  confidence: number;
  timestamp: number;
  executionTime: number;
}

// ============================================
// INFERENCE ENGINE
// ============================================

export class InferenceEngine {
  private facts: Map<string, Fact> = new Map();
  private rules: Map<string, Rule> = new Map();
  private inferenceHistory: InferenceResult[] = [];
  private maxIterations: number = 100;
  private confidenceThreshold: number = 0.5;

  constructor(
    initialFacts?: Fact[],
    initialRules?: Rule[],
    confidenceThreshold?: number
  ) {
    this.confidenceThreshold = confidenceThreshold || 0.5;

    if (initialFacts) {
      for (const fact of initialFacts) {
        this.addFact(fact);
      }
    }

    if (initialRules) {
      for (const rule of initialRules) {
        this.addRule(rule);
      }
    }
  }

  /**
   * Add a fact to the knowledge base
   */
  addFact(fact: Fact): void {
    const key = `${fact.property}=${fact.value}`;
    this.facts.set(key, {
      ...fact,
      timestamp: fact.timestamp || Date.now(),
      confidence: fact.confidence || 1.0
    });
  }

  /**
   * Add a rule to the knowledge base
   */
  addRule(rule: Rule): void {
    this.rules.set(rule.name, {
      ...rule,
      weight: rule.weight || 1.0
    });
  }

  /**
   * Get a fact from the knowledge base
   */
  getFact(property: string, value?: string | number | boolean): Fact | null {
    if (value !== undefined) {
      const key = `${property}=${value}`;
      return this.facts.get(key) || null;
    }

    // Return any fact matching the property
    for (const fact of this.facts.values()) {
      if (fact.property === property) {
        return fact;
      }
    }
    return null;
  }

  /**
   * BACKWARD CHAINING
   * Start from goal and work backwards to find required steps
   *
   * Example:
   * Goal: "user_can_execute_task"
   * Requirements:
   *   - user_authenticated = true
   *   - task_exists = true
   *   - permissions_granted = true
   *
   * Works backwards to satisfy all requirements
   */
  async backwardChain(goal: string): Promise<InferenceResult> {
    const startTime = Date.now();
    const usedRules: string[] = [];
    const derivedFacts: Fact[] = [];
    let iterations = 0;

    console.log(`🔄 BACKWARD CHAINING: Goal = "${goal}"`);

    // Stack to track goal decomposition
    const goalStack: string[] = [goal];
    const satisfiedGoals = new Set<string>();

    while (goalStack.length > 0 && iterations < this.maxIterations) {
      iterations++;
      const currentGoal = goalStack.pop()!;

      console.log(`   Iteration ${iterations}: Checking goal "${currentGoal}"`);

      // Check if goal is already satisfied
      if (this.isSatisfied(currentGoal)) {
        console.log(`   ✅ Goal satisfied: "${currentGoal}"`);
        satisfiedGoals.add(currentGoal);
        continue;
      }

      // Find rules that could satisfy this goal
      const applicableRules = this.findRulesForGoal(currentGoal);

      if (applicableRules.length === 0) {
        console.log(`   ⚠️  No rules found for: "${currentGoal}"`);
        continue;
      }

      // Apply the best rule (highest confidence)
      const bestRule = applicableRules.sort(
        (a, b) => b.confidence - a.confidence
      )[0];

      console.log(`   📋 Applying rule: "${bestRule.name}" (confidence: ${bestRule.confidence})`);

      usedRules.push(bestRule.name);

      // Add preconditions to goal stack
      for (const precondition of bestRule.preconditions) {
        if (!satisfiedGoals.has(precondition)) {
          goalStack.push(precondition);
        }
      }

      // Derive the conclusion
      const derivedFact = this.deriveFactFromRule(bestRule);
      if (derivedFact) {
        derivedFacts.push(derivedFact);
        this.addFact(derivedFact);
        console.log(`   ✨ Derived: ${derivedFact.property} = ${derivedFact.value}`);
      }
    }

    // Calculate overall confidence
    const overallConfidence =
      usedRules.length > 0
        ? usedRules.reduce((sum, ruleName) => {
            const rule = this.rules.get(ruleName);
            return sum + (rule?.confidence || 0);
          }, 0) / usedRules.length
        : 0;

    const result: InferenceResult = {
      query: goal,
      derivedFacts,
      usedRules,
      confidence: overallConfidence,
      timestamp: Date.now(),
      executionTime: Date.now() - startTime
    };

    this.inferenceHistory.push(result);
    console.log(`✅ Backward chaining complete (${iterations} iterations)`);

    return result;
  }

  /**
   * FORWARD CHAINING
   * Start from known facts and derive new conclusions
   *
   * Example:
   * Facts: [
   *   "is_cloudy" = true,
   *   "is_cold" = true,
   *   "humidity_high" = true
   * ]
   *
   * Rules: [
   *   IF is_cloudy AND is_cold THEN might_snow = true
   *   IF might_snow AND humidity_high THEN prepare_for_snow = true
   * ]
   *
   * Derives: ["might_snow" = true, "prepare_for_snow" = true]
   */
  async forwardChain(): Promise<InferenceResult> {
    const startTime = Date.now();
    const usedRules: string[] = [];
    const derivedFacts: Fact[] = [];
    let iterations = 0;
    let newFactsFound = true;

    console.log(`\n🔁 FORWARD CHAINING: Starting from ${this.facts.size} known facts\n`);

    while (newFactsFound && iterations < this.maxIterations) {
      iterations++;
      newFactsFound = false;

      console.log(`   Iteration ${iterations}:`);

      // Try each rule
      for (const [ruleName, rule] of this.rules) {
        // Check if all preconditions are satisfied
        const preconditionsSatisfied = rule.preconditions.every(precond =>
          this.isSatisfied(precond)
        );

        if (preconditionsSatisfied) {
          // Check if we haven't already applied this rule
          if (!usedRules.includes(ruleName)) {
            console.log(`      📋 Applying: ${ruleName}`);

            // Derive the new fact
            const derivedFact = this.deriveFactFromRule(rule);

            if (derivedFact && !this.hasFact(derivedFact)) {
              this.addFact(derivedFact);
              derivedFacts.push(derivedFact);
              usedRules.push(ruleName);
              newFactsFound = true;

              console.log(
                `      ✨ New fact: ${derivedFact.property} = ${derivedFact.value}`
              );
            }
          }
        }
      }

      if (!newFactsFound) {
        console.log(`   ℹ️  No new facts derived`);
      }
    }

    // Calculate confidence
    const overallConfidence =
      usedRules.length > 0
        ? usedRules.reduce((sum, ruleName) => {
            const rule = this.rules.get(ruleName);
            return sum + (rule?.confidence || 0);
          }, 0) / usedRules.length
        : 0;

    const result: InferenceResult = {
      query: 'forward_chain',
      derivedFacts,
      usedRules,
      confidence: overallConfidence,
      timestamp: Date.now(),
      executionTime: Date.now() - startTime
    };

    this.inferenceHistory.push(result);
    console.log(`✅ Forward chaining complete (${iterations} iterations)\n`);

    return result;
  }

  /**
   * Find rules that could satisfy a goal
   */
  private findRulesForGoal(goal: string): Rule[] {
    const applicable: Rule[] = [];

    for (const rule of this.rules.values()) {
      // Check if rule's conclusion matches the goal
      if (rule.conclusion.includes(goal)) {
        applicable.push(rule);
      }
    }

    return applicable;
  }

  /**
   * Check if a goal/fact is satisfied
   */
  private isSatisfied(factString: string): boolean {
    // Parse "property=value" format
    const [property, value] = factString.split('=');

    if (!property || !value) return false;

    return this.facts.has(`${property}=${value}`);
  }

  /**
   * Derive a new fact from a rule
   */
  private deriveFactFromRule(rule: Rule): Fact | null {
    try {
      const [property, value] = rule.conclusion.split('=');

      if (!property || !value) return null;

      return {
        property: property.trim(),
        value: value.trim(),
        timestamp: Date.now(),
        confidence: rule.confidence
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a fact already exists
   */
  private hasFact(fact: Fact): boolean {
    const key = `${fact.property}=${fact.value}`;
    return this.facts.has(key);
  }

  /**
   * Query the knowledge base
   */
  query(property: string): Fact[] {
    const results: Fact[] = [];

    for (const fact of this.facts.values()) {
      if (fact.property === property) {
        results.push(fact);
      }
    }

    return results;
  }

  /**
   * Get all known facts
   */
  getAllFacts(): Fact[] {
    return Array.from(this.facts.values());
  }

  /**
   * Get all rules
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get inference history
   */
  getInferenceHistory(): InferenceResult[] {
    return this.inferenceHistory;
  }

  /**
   * Clear the knowledge base (for testing)
   */
  clear(): void {
    this.facts.clear();
    this.rules.clear();
    this.inferenceHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    factsCount: number;
    rulesCount: number;
    inferencesRun: number;
    averageConfidence: number;
    totalExecutionTime: number;
  } {
    const avgConfidence =
      this.inferenceHistory.length > 0
        ? this.inferenceHistory.reduce((sum, r) => sum + r.confidence, 0) /
          this.inferenceHistory.length
        : 0;

    const totalTime = this.inferenceHistory.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );

    return {
      factsCount: this.facts.size,
      rulesCount: this.rules.size,
      inferencesRun: this.inferenceHistory.length,
      averageConfidence: avgConfidence,
      totalExecutionTime: totalTime
    };
  }
}
