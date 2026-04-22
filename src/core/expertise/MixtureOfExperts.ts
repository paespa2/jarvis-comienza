/**
 * MIXTURE OF EXPERTS (MoE) — Specialized Expert Agents
 *
 * Instead of one generalist Jarvis, maintain 3 specialized experts:
 * 1. SECURITY_EXPERT — Vulnerabilities, exploitation, HackerOne
 * 2. METHODOLOGY_EXPERT — Techniques, frameworks, OWASP
 * 3. RESEARCH_EXPERT — Papers, trends, predictions
 *
 * Each expert:
 * - Maintains own wiki and knowledge base
 * - Tracks own performance metrics
 * - Specializes and deepens in domain
 * - Learns independently
 *
 * Router selects best expert for each query
 */

import { jarvisNativeModel } from '../nativeModel/JarvisNativeModel';
import { selfProgrammingEngine } from '../selfProgramming/SelfProgrammingEngine';
import { fedFishAggregator, FedFishAggregationResult } from '../aggregation/FedFishAggregator';

export type ExpertType = 'security' | 'methodology' | 'research';

export interface ExpertStats {
  type: ExpertType;
  totalQueries: number;
  successfulQueries: number;
  averageConfidence: number;
  specialties: string[];
  lastUpdated: number;
}

export interface ExpertResponse {
  answer: string;
  expert: ExpertType;
  confidence: number;
  reasoning: string;
  relatedTopics: string[];
  suggestions: string[];
  expertise_depth: number; // 0-1
}

export class ExpertAgent {
  type: ExpertType;
  specialty: string;
  totalQueries: number = 0;
  successfulQueries: number = 0;
  confidenceScores: number[] = [];
  knowledgeBase: Map<string, any> = new Map();
  specialties: Set<string> = new Set();

  // Fisher Information tracking for FedFish aggregation
  fisherAccumulator: number = 0;  // accumulated squared gradients
  fisherQueryCount: number = 0;
  lastFisherUpdate: number = 0;

  constructor(type: ExpertType, specialty: string) {
    this.type = type;
    this.specialty = specialty;
    this.initializeSpecialties();
  }

  private initializeSpecialties(): void {
    if (this.type === 'security') {
      this.specialties = new Set([
        'xss',
        'sql-injection',
        'csrf',
        'idor',
        'rce',
        'auth-bypass',
        'privilege-escalation',
        'payload-generation',
        'exploitation',
        'bounty-assessment',
      ]);
    } else if (this.type === 'methodology') {
      this.specialties = new Set([
        'reconnaissance',
        'enumeration',
        'scanning',
        'exploitation-technique',
        'privilege-escalation',
        'lateral-movement',
        'persistence',
        'evasion',
        'remediation',
        'framework',
      ]);
    } else {
      this.specialties = new Set([
        'vulnerability-trends',
        'emerging-threats',
        'research-papers',
        'zero-day-patterns',
        'attack-prediction',
        'technology-forecasting',
        'threat-intelligence',
        'academic-insights',
        'industry-reports',
      ]);
    }
  }

  async answer(query: string, context?: string): Promise<ExpertResponse> {
    this.totalQueries++;

    // Generate answer in expert's domain
    const prompt = this.buildExpertPrompt(query);
    const response = jarvisNativeModel.generate({
      query: prompt,
      mode: 'fivephase',
      context: context || this.specialty,
    });

    const confidence = this.assessConfidence(response.text, query);
    if (confidence > 0.7) {
      this.successfulQueries++;
    }

    this.confidenceScores.push(confidence);

    // Track Fisher Information: use squared gradient magnitude as proxy
    // Fisher ~ (confidence)^2 * (answer length / max_length)
    const answerLength = Math.min(response.text.length, 1000);
    const fisherEstimate = Math.pow(confidence, 2) * (answerLength / 1000);
    this.fisherAccumulator += fisherEstimate;
    this.fisherQueryCount++;
    this.lastFisherUpdate = Date.now();

    // Extract related topics and suggestions
    const relatedTopics = this.extractRelatedTopics(response.text);
    const suggestions = this.generateSuggestions(query, response.text);

    return {
      answer: response.text,
      expert: this.type,
      confidence,
      reasoning: response.reasoning,
      relatedTopics,
      suggestions,
      expertise_depth: this.calculateExpertiseDepth(),
    };
  }

  private buildExpertPrompt(query: string): string {
    const context = Array.from(this.specialties).join(', ');
    return `As a ${this.type} expert specializing in ${this.specialty}, answer this query:\n\n${query}\n\nUse your expertise in: ${context}`;
  }

  private assessConfidence(answer: string, query: string): number {
    let score = 0.5; // Base score

    // Increase if answer contains relevant keywords
    const keywords = Array.from(this.specialties);
    const answerLower = answer.toLowerCase();

    const matches = keywords.filter(k => answerLower.includes(k)).length;
    score += (matches / keywords.length) * 0.3;

    // Increase if answer is detailed
    if (answer.length > 200) score += 0.1;
    if (answer.length > 500) score += 0.1;

    return Math.min(1, score);
  }

  private extractRelatedTopics(answer: string): string[] {
    const topics: string[] = [];

    for (const specialty of this.specialties) {
      if (answer.toLowerCase().includes(specialty)) {
        topics.push(specialty);
      }
    }

    return topics.slice(0, 5);
  }

  private generateSuggestions(query: string, answer: string): string[] {
    const suggestions: string[] = [];

    if (query.includes('how')) {
      suggestions.push('Create step-by-step guide');
    }
    if (query.includes('why')) {
      suggestions.push('Deeper root cause analysis');
    }
    if (answer.length < 200) {
      suggestions.push('Request more detailed explanation');
    }
    if (!answer.includes('example')) {
      suggestions.push('Ask for concrete examples');
    }

    return suggestions.slice(0, 3);
  }

  private calculateExpertiseDepth(): number {
    if (this.totalQueries === 0) return 0.3; // New expert

    const avgConfidence = this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length;
    const successRate = this.successfulQueries / this.totalQueries;

    return Math.min(1, (avgConfidence + successRate) / 2);
  }

  /**
   * Get Fisher Information diagonal (average importance)
   */
  getFisherDiagonal(): number {
    if (this.fisherQueryCount === 0) {
      return 0.5; // Default for new expert
    }
    return this.fisherAccumulator / this.fisherQueryCount;
  }

  getStats(): ExpertStats {
    return {
      type: this.type,
      totalQueries: this.totalQueries,
      successfulQueries: this.successfulQueries,
      averageConfidence:
        this.confidenceScores.length > 0
          ? this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length
          : 0,
      specialties: Array.from(this.specialties),
      lastUpdated: Date.now(),
    };
  }
}

export class MixtureOfExperts {
  private experts: Map<ExpertType, ExpertAgent> = new Map();
  private queryHistory: Array<{ query: string; expert: ExpertType; confidence: number }> = [];

  constructor() {
    // Initialize experts
    this.experts.set('security', new ExpertAgent('security', 'Vulnerability Analysis & Exploitation'));
    this.experts.set('methodology', new ExpertAgent('methodology', 'Security Testing Frameworks'));
    this.experts.set('research', new ExpertAgent('research', 'Security Research & Trends'));
  }

  /**
   * Route query to best expert
   */
  async answer(query: string, context?: string): Promise<ExpertResponse> {
    // Classify query to determine best expert
    const bestExpertType = this.routeQuery(query);
    const expert = this.experts.get(bestExpertType)!;

    const response = await expert.answer(query, context);

    // Record in history
    this.queryHistory.push({
      query,
      expert: bestExpertType,
      confidence: response.confidence,
    });

    // Limit history size
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-500);
    }

    return response;
  }

  /**
   * Route query to best expert based on keywords
   */
  private routeQuery(query: string): ExpertType {
    const lowerQuery = query.toLowerCase();

    // Security keywords
    if (
      lowerQuery.match(/xss|sql|csrf|rce|auth|exploit|payload|vulnerability|vuln|injection|bypass/)
    ) {
      return 'security';
    }

    // Methodology keywords
    if (
      lowerQuery.match(
        /technique|step|method|framework|owasp|scanning|enumeration|reconnaissance|how to|testing/
      )
    ) {
      return 'methodology';
    }

    // Research keywords
    if (
      lowerQuery.match(/research|trend|paper|predict|forecast|emerging|zero-day|threat|report|future/)
    ) {
      return 'research';
    }

    // Default: use most recent successful expert
    let bestExpert: ExpertType = 'security';
    let bestStats = this.experts.get('security')!.getStats();

    for (const [type, expert] of this.experts) {
      const stats = expert.getStats();
      if (stats.successfulQueries > bestStats.successfulQueries) {
        bestExpert = type;
        bestStats = stats;
      }
    }

    return bestExpert;
  }

  /**
   * Collaborative answer: query all experts and synthesize
   */
  async collaborativeAnswer(query: string): Promise<{
    synthesized: string;
    expertPerspectives: ExpertResponse[];
    consensus: number;
  }> {
    const perspectives: ExpertResponse[] = [];

    // Get all expert answers
    for (const expert of this.experts.values()) {
      const response = await expert.answer(query);
      perspectives.push(response);
    }

    // Calculate consensus confidence
    const avgConfidence =
      perspectives.reduce((sum, p) => sum + p.confidence, 0) / perspectives.length;

    // Synthesize perspectives
    const synthesized = this.synthesizePerspectives(query, perspectives);

    return {
      synthesized,
      expertPerspectives: perspectives,
      consensus: avgConfidence,
    };
  }

  /**
   * FedFish Collaborative Answer: Advanced aggregation using Fisher Information
   * Weights expert contributions by parameter importance instead of simple averaging
   */
  async collaborativeAnswerWithFedFish(query: string): Promise<{
    synthesized: string;
    expertPerspectives: Array<{
      expert: ExpertType;
      response: string;
      confidence: number;
      fisherWeight: number;
    }>;
    consensus: number;
    aggregationMetrics: any;
  }> {
    const expertResponses: Array<{ expert: ExpertAgent; response: ExpertResponse }> = [];

    // Get all expert answers
    for (const expert of this.experts.values()) {
      const response = await expert.answer(query);
      expertResponses.push({ expert, response });
    }

    // Apply FedFish aggregation
    let fedFishResult: FedFishAggregationResult;
    try {
      fedFishResult = await fedFishAggregator.aggregateExpertKnowledge(
        expertResponses,
        query
      );
    } catch (err: any) {
      console.error('[MoE] FedFish aggregation failed:', err.message);
      // Fallback to simple collaborative answer
      const fallback = await this.collaborativeAnswer(query);
      return {
        synthesized: fallback.synthesized,
        expertPerspectives: fallback.expertPerspectives.map(p => ({
          expert: p.expert,
          response: p.answer,
          confidence: p.confidence,
          fisherWeight: 1 / 3, // equal weights
        })),
        consensus: fallback.consensus,
        aggregationMetrics: { error: 'Aggregation failed, using fallback' },
      };
    }

    return {
      synthesized: fedFishResult.aggregatedResponse,
      expertPerspectives: fedFishResult.expertPerspectives,
      consensus: fedFishResult.aggregationMetrics.consensusScore,
      aggregationMetrics: fedFishResult.aggregationMetrics,
    };
  }

  private synthesizePerspectives(query: string, perspectives: ExpertResponse[]): string {
    return `
## Multi-Expert Analysis

${perspectives
  .map(
    (p, i) => `
### ${p.expert.toUpperCase()} Expert (Confidence: ${(p.confidence * 100).toFixed(2)}%)
${p.answer}

**Related Topics:** ${p.relatedTopics.join(', ')}
**Next Steps:** ${p.suggestions.join('; ')}
`
  )
  .join('\n---\n')}
`;
  }

  /**
   * Get expert statistics
   */
  getStats() {
    const stats: Record<ExpertType, ExpertStats> = {} as any;

    for (const [type, expert] of this.experts) {
      stats[type] = expert.getStats();
    }

    return {
      experts: stats,
      totalQueries: this.queryHistory.length,
      expertUsageDistribution: this.getUsageDistribution(),
      topPerformingExpert: this.getTopPerformer(),
    };
  }

  private getUsageDistribution(): Record<ExpertType, number> {
    const distribution: Record<ExpertType, number> = {
      security: 0,
      methodology: 0,
      research: 0,
    };

    for (const entry of this.queryHistory) {
      distribution[entry.expert]++;
    }

    return distribution;
  }

  private getTopPerformer(): ExpertType {
    let topExpert: ExpertType = 'security';
    let topScore = 0;

    for (const [type, expert] of this.experts) {
      const stats = expert.getStats();
      const score =
        (stats.successfulQueries / (stats.totalQueries || 1)) * stats.averageConfidence;

      if (score > topScore) {
        topScore = score;
        topExpert = type;
      }
    }

    return topExpert;
  }
}

export const mixtureOfExperts = new MixtureOfExperts();
