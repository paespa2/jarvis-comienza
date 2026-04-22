/**
 * EVOLUTION ENGINE — Autonomous continuous improvement for Jarvis
 *
 * Orchestrates:
 * 1. Population management (track multiple Jarvis variants)
 * 2. Testing cycles (basic → elite levels)
 * 3. Fitness evaluation and selection
 * 4. Reproduction and evolution
 * 5. Firebase persistence of best variants
 */

import { ModelVariant, CapabilityGene } from './ModelVariant';
import { EvolutionTestingFramework, TestSession } from './EvolutionTestingFramework';
import { geneticOperators } from './GeneticOperators';
import { firebaseServerService } from '../../services/firebaseServerService';
import { selfProgrammingEngine } from '../selfProgramming/SelfProgrammingEngine';

export interface GenerationReport {
  generationNumber: number;
  populationSize: number;
  bestVariantId: string;
  bestFitness: number;
  averageFitness: number;
  worseVariantId: string;
  worseFitness: number;
  avgCapabilities: number;
  mutationRate: number;
  elapsedTime: number;
  timestamp: number;
  topVariants: any[];
}

export class EvolutionEngine {
  private population: ModelVariant[] = [];
  private testingFramework: EvolutionTestingFramework;
  private generationNumber: number = 0;
  private evolutionRunning: boolean = false;
  private testHistory: Map<string, TestSession[]> = new Map();
  private generationReports: GenerationReport[] = [];
  private populationSize: number = 5;
  private mutationRate: number = 0.3;

  constructor() {
    this.testingFramework = new EvolutionTestingFramework();
  }

  /**
   * Initialize population with baseline variant
   */
  async initialize(): Promise<void> {
    console.log('[Evolution] 🧬 Initializing Jarvis Evolution Engine...');

    // Create baseline variant with known working capabilities
    const baseline = new ModelVariant(1, null);

    // Add 5 core working capabilities (baseline Jarvis features)
    const workingCaps: CapabilityGene[] = [
      {
        id: 'knowledge_recall',
        name: 'Knowledge Recall from Training',
        enabled: true,
        confidence: 0.85,
        lastTestedAt: Date.now(),
        successRate: 0.85,
      },
      {
        id: 'reasoning_chain',
        name: 'Multi-Step Reasoning',
        enabled: true,
        confidence: 0.80,
        lastTestedAt: Date.now(),
        successRate: 0.78,
      },
      {
        id: 'vulnerability_analysis',
        name: 'Vulnerability Pattern Analysis',
        enabled: true,
        confidence: 0.82,
        lastTestedAt: Date.now(),
        successRate: 0.80,
      },
      {
        id: 'payload_suggestion',
        name: 'Payload Suggestion Generation',
        enabled: true,
        confidence: 0.75,
        lastTestedAt: Date.now(),
        successRate: 0.72,
      },
      {
        id: 'recon_planning',
        name: 'Reconnaissance Planning',
        enabled: true,
        confidence: 0.78,
        lastTestedAt: Date.now(),
        successRate: 0.76,
      },
    ];

    workingCaps.forEach(cap => baseline.addWorkingCapability(cap));

    // Add 5 failed attempts (things we tried but didn't perfect)
    const failedCaps: CapabilityGene[] = [
      {
        id: 'waf_detection',
        name: 'WAF Technology Detection',
        enabled: false,
        confidence: 0.45,
        lastTestedAt: Date.now(),
        successRate: 0.40,
      },
      {
        id: 'auth_fingerprint',
        name: 'Authentication Mechanism Fingerprinting',
        enabled: false,
        confidence: 0.50,
        lastTestedAt: Date.now(),
        successRate: 0.48,
      },
      {
        id: 'logic_flaw_detect',
        name: 'Business Logic Flaw Detection',
        enabled: false,
        confidence: 0.40,
        lastTestedAt: Date.now(),
        successRate: 0.35,
      },
      {
        id: 'race_detect',
        name: 'Race Condition Detection',
        enabled: false,
        confidence: 0.35,
        lastTestedAt: Date.now(),
        successRate: 0.30,
      },
      {
        id: 'zero_day_hunt',
        name: 'Zero-Day Pattern Hunting',
        enabled: false,
        confidence: 0.30,
        lastTestedAt: Date.now(),
        successRate: 0.25,
      },
    ];

    failedCaps.forEach(cap => baseline.addFailedCapability(cap));

    this.population = [baseline];
    this.generationNumber = 1;

    console.log('[Evolution] ✅ Baseline variant initialized with 5 working + 5 failed capabilities');
  }

  /**
   * Run evolution cycle: test, evaluate, reproduce
   */
  async evolveGeneration(): Promise<GenerationReport> {
    if (this.evolutionRunning) {
      console.log('[Evolution] ⚠️  Evolution already in progress');
      return this.getGenerationReport();
    }

    this.evolutionRunning = true;
    const cycleStart = Date.now();

    try {
      console.log(`\n[Evolution] 🧬 === GENERATION ${this.generationNumber + 1} START ===\n`);

      // Step 1: Test all variants across difficulty levels
      console.log('[Evolution] 🧪 Testing population...');
      await this.testPopulation();

      // Step 2: Update fitness scores
      this.evaluateFitness();

      // Step 3: Report current state
      const report = this.getGenerationReport();
      console.log(`[Evolution] 📊 Generation ${this.generationNumber}:`);
      console.log(`   Best fitness: ${(report.bestFitness * 100).toFixed(2)}%`);
      console.log(`   Avg fitness: ${(report.averageFitness * 100).toFixed(2)}%`);
      console.log(`   Population: ${report.populationSize} variants`);

      // Step 4: Promote/demote capabilities based on test results
      console.log('[Evolution] 🎯 Promoting/demoting capabilities...');
      this.updateCapabilities();

      // Step 5: Reproduce next generation
      console.log('[Evolution] 🔬 Reproducing next generation...');
      this.population = geneticOperators.reproduce(this.population, this.populationSize);
      this.generationNumber++;

      // Step 6: Save to Firebase
      console.log('[Evolution] 💾 Saving to Firebase...');
      await this.persistGeneration(report);

      const cycleTime = Date.now() - cycleStart;
      console.log(`[Evolution] ✅ Generation complete in ${(cycleTime / 1000).toFixed(2)}s\n`);

      return report;
    } finally {
      this.evolutionRunning = false;
    }
  }

  /**
   * Test all variants at all difficulty levels
   */
  private async testPopulation(): Promise<void> {
    const levels: Array<'basic' | 'intermediate' | 'advanced' | 'expert' | 'elite'> = [
      'basic',
      'intermediate',
      'advanced',
      'expert',
      'elite',
    ];

    for (const variant of this.population) {
      if (!this.testHistory.has(variant.id)) {
        this.testHistory.set(variant.id, []);
      }

      for (const level of levels) {
        console.log(`   Testing ${variant.id.slice(-4)} at ${level}...`);
        const result = await this.testingFramework.runTestSuite(level, variant.id);
        variant.recordTestResult(level, {
          level,
          testsRun: result.testsRun,
          passed: result.passed,
          failed: result.failed,
          avgTime: result.avgTime,
          timestamp: Date.now(),
        });

        this.testHistory.get(variant.id)!.push(result);

        // Short delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Evaluate fitness for all variants (already done during test, but consolidate here)
   */
  private evaluateFitness(): void {
    for (const variant of this.population) {
      // Fitness already calculated in variant.recordTestResult via updateFitness()
      // Additional bonus for capability count
      const capabilityBonus = (variant.workingCapabilities.length / 10) * 0.1; // Max 10% bonus
      variant.fitnessScore = Math.min(1, variant.fitnessScore + capabilityBonus);
    }
  }

  /**
   * Promote experimental capabilities that passed tests, demote ones that failed
   */
  private updateCapabilities(): void {
    for (const variant of this.population) {
      for (const exp of variant.experimentalCapabilities) {
        // If experimental capability passed tests, promote it
        const basicTest = variant.testResults.get('basic');
        if (basicTest && basicTest.passed / basicTest.testsRun > 0.7) {
          geneticOperators.promote(variant, exp.id, basicTest.passed / basicTest.testsRun);
        }
      }

      // Demote working capabilities that started failing
      for (const working of variant.workingCapabilities) {
        const eliteTest = variant.testResults.get('elite');
        if (eliteTest && eliteTest.passed / eliteTest.testsRun < 0.5) {
          geneticOperators.demote(variant, working.id);
        }
      }
    }
  }

  /**
   * Get current generation report
   */
  private getGenerationReport(): GenerationReport {
    const fitnesses = this.population.map(v => v.fitnessScore);
    const bestVariant = this.population.reduce((a, b) => (a.fitnessScore > b.fitnessScore ? a : b));
    const worseVariant = this.population.reduce((a, b) => (a.fitnessScore < b.fitnessScore ? a : b));

    const avgCapabilities =
      this.population.reduce((sum, v) => sum + v.workingCapabilities.length + v.experimentalCapabilities.length, 0) /
      this.population.length;

    const report: GenerationReport = {
      generationNumber: this.generationNumber,
      populationSize: this.population.length,
      bestVariantId: bestVariant.id,
      bestFitness: bestVariant.fitnessScore,
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worseVariantId: worseVariant.id,
      worseFitness: worseVariant.fitnessScore,
      avgCapabilities,
      mutationRate: this.mutationRate,
      elapsedTime: Date.now(),
      timestamp: Date.now(),
      topVariants: this.population
        .sort((a, b) => b.fitnessScore - a.fitnessScore)
        .slice(0, 3)
        .map(v => v.getSummary()),
    };

    this.generationReports.push(report);
    return report;
  }

  /**
   * Persist generation data to Firebase
   */
  private async persistGeneration(report: GenerationReport): Promise<void> {
    try {
      // Save generation report
      await firebaseServerService.saveResearchSession({
        timestamp: new Date(report.timestamp).toISOString(),
        papersFound: report.populationSize,
        knowledgeAdded: report.topVariants.length,
        topics: ['evolution', `generation-${report.generationNumber}`, 'genetic-algorithm'],
        summary: `Generation ${report.generationNumber}: Best fitness ${(report.bestFitness * 100).toFixed(2)}%, Avg ${(report.averageFitness * 100).toFixed(2)}%`,
      });

      // Save best variant's knowledge to self-programming engine
      const bestVariant = this.population.find(v => v.id === report.bestVariantId);
      if (bestVariant) {
        for (const cap of bestVariant.workingCapabilities) {
          selfProgrammingEngine.addKnowledge({
            category: 'general',
            topic: cap.name,
            content: `Evolved capability from generation ${report.generationNumber}`,
            confidence: Math.min(1, cap.confidence),
          });
        }
      }
    } catch (err: any) {
      console.warn('[Evolution] ⚠️  Could not persist to Firebase:', err.message);
    }
  }

  /**
   * Get current population state
   */
  getPopulation(): ModelVariant[] {
    return [...this.population];
  }

  /**
   * Get best variant
   */
  getBestVariant(): ModelVariant | null {
    if (this.population.length === 0) return null;
    return this.population.reduce((a, b) => (a.fitnessScore > b.fitnessScore ? a : b));
  }

  /**
   * Get evolution statistics
   */
  getStats() {
    return {
      generationNumber: this.generationNumber,
      populationSize: this.population.length,
      totalVariantsEvaluated: this.testHistory.size,
      averageVariantAge: this.population.reduce((sum, v) => sum + (Date.now() - v.createdAt), 0) / this.population.length,
      generationReports: this.generationReports,
      isRunning: this.evolutionRunning,
    };
  }

  /**
   * Manually inject best variant into Jarvis
   */
  async applyBestVariant(): Promise<string> {
    const best = this.getBestVariant();
    if (!best) return 'No variants available';

    console.log(`[Evolution] 🚀 Applying best variant: ${best.id}`);
    console.log(`   Generation: ${best.generation}`);
    console.log(`   Fitness: ${(best.fitnessScore * 100).toFixed(2)}%`);
    console.log(`   Working capabilities: ${best.workingCapabilities.length}`);
    console.log(`   Experimental capabilities: ${best.experimentalCapabilities.length}`);

    // Apply working capabilities to Jarvis
    for (const cap of best.workingCapabilities) {
      selfProgrammingEngine.addKnowledge({
        category: 'reasoning',
        topic: cap.name,
        content: `Optimal variant capability - ${(cap.confidence * 100).toFixed(2)}% confidence`,
        confidence: Math.min(1, cap.confidence),
      });
    }

    return `Applied best variant ${best.id} with ${best.workingCapabilities.length} capabilities`;
  }
}

export const evolutionEngine = new EvolutionEngine();
