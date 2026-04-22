/**
 * GENETIC OPERATORS — Mutation, crossover, selection, reproduction
 *
 * Evolves Jarvis through:
 * 1. MUTATION: Random parameter changes, enable/disable capabilities, novel combinations
 * 2. CROSSOVER: Combine best working capabilities from two variants
 * 3. SELECTION: Tournament selection based on fitness
 * 4. REPRODUCTION: Create next generation offspring
 */

import { ModelVariant, CapabilityGene, MutationRecord } from './ModelVariant';

export class GeneticOperators {
  // Capability templates for mutations
  private capabilityPool: CapabilityGene[] = [
    { id: 'advanced_recon', name: 'Advanced Reconnaissance', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'payload_generation', name: 'Adaptive Payload Generation', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'vulnerability_chaining', name: 'Multi-Step Vulnerability Chaining', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'waf_bypass', name: 'WAF Evasion Strategies', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'api_enumeration', name: 'Intelligent API Enumeration', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'auth_bypass', name: 'Authentication Bypass Techniques', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'data_exfiltration', name: 'Covert Data Exfiltration', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'race_condition', name: 'Race Condition Detection', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'logic_flaws', name: 'Business Logic Flaw Discovery', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
    { id: 'zero_day_pattern', name: 'Zero-Day Pattern Recognition', enabled: false, confidence: 0.5, lastTestedAt: 0, successRate: 0 },
  ];

  /**
   * MUTATION: Apply random changes to a variant to create diversity
   */
  mutate(variant: ModelVariant, mutationRate: number = 0.3): ModelVariant {
    const offspring = new ModelVariant(variant.generation + 1, variant.id);
    offspring.workingCapabilities = [...variant.workingCapabilities];
    offspring.failedCapabilities = [...variant.failedCapabilities];
    offspring.experimentalCapabilities = [...variant.experimentalCapabilities];

    // Type 1: Enable a failed capability (attempt to fix it)
    if (Math.random() < mutationRate) {
      const failedToFix = variant.failedCapabilities[Math.floor(Math.random() * variant.failedCapabilities.length)];
      if (failedToFix) {
        const mutated = { ...failedToFix, enabled: true, confidence: failedToFix.confidence * 1.1 };
        offspring.experimentalCapabilities.push(mutated);
        offspring.mutations.push({
          type: 'enable',
          geneName: failedToFix.id,
          description: `Retry previously failed capability: ${failedToFix.name}`,
          appliedAt: Date.now(),
          improved: false,
        });
      }
    }

    // Type 2: Parameter shift on working capability (optimize)
    if (Math.random() < mutationRate * 0.7) {
      const toOptimize = variant.workingCapabilities[Math.floor(Math.random() * variant.workingCapabilities.length)];
      if (toOptimize) {
        const mutated = {
          ...toOptimize,
          confidence: Math.min(1, toOptimize.confidence * (0.9 + Math.random() * 0.2)),
        };
        offspring.workingCapabilities[offspring.workingCapabilities.indexOf(toOptimize)] = mutated;
        offspring.mutations.push({
          type: 'parameter_shift',
          geneName: toOptimize.id,
          description: `Optimized confidence for: ${toOptimize.name}`,
          appliedAt: Date.now(),
          improved: false,
        });
      }
    }

    // Type 3: Novel capability (pick random from pool)
    if (Math.random() < mutationRate * 0.5) {
      const novelGene = this.capabilityPool[Math.floor(Math.random() * this.capabilityPool.length)];
      if (!offspring.experimentalCapabilities.some(c => c.id === novelGene.id)) {
        const newCapability = { ...novelGene, enabled: true, confidence: 0.4, lastTestedAt: Date.now() };
        offspring.experimentalCapabilities.push(newCapability);
        offspring.mutations.push({
          type: 'novel',
          geneName: novelGene.id,
          description: `Novel capability discovered: ${novelGene.name}`,
          appliedAt: Date.now(),
          improved: false,
        });
      }
    }

    // Type 4: Combination (merge two working capabilities)
    if (Math.random() < mutationRate * 0.4 && variant.workingCapabilities.length >= 2) {
      const cap1 = variant.workingCapabilities[Math.floor(Math.random() * variant.workingCapabilities.length)];
      const cap2 = variant.workingCapabilities[Math.floor(Math.random() * variant.workingCapabilities.length)];

      if (cap1.id !== cap2.id) {
        const combined: CapabilityGene = {
          id: `${cap1.id}_${cap2.id}`,
          name: `${cap1.name} + ${cap2.name}`,
          enabled: true,
          confidence: (cap1.confidence + cap2.confidence) / 2 * 0.95,
          lastTestedAt: Date.now(),
          successRate: (cap1.successRate + cap2.successRate) / 2,
        };
        offspring.experimentalCapabilities.push(combined);
        offspring.mutations.push({
          type: 'combination',
          geneName: combined.id,
          description: `Combined: ${cap1.name} + ${cap2.name}`,
          appliedAt: Date.now(),
          improved: false,
        });
      }
    }

    return offspring;
  }

  /**
   * CROSSOVER: Combine best traits from two parent variants
   */
  crossover(parent1: ModelVariant, parent2: ModelVariant): ModelVariant {
    const offspring = new ModelVariant(Math.max(parent1.generation, parent2.generation) + 1, parent1.id);

    // Inherit best working capabilities from both parents
    const workingSet = new Map<string, CapabilityGene>();
    [...parent1.workingCapabilities, ...parent2.workingCapabilities].forEach(cap => {
      if (!workingSet.has(cap.id) || cap.confidence > workingSet.get(cap.id)!.confidence) {
        workingSet.set(cap.id, cap);
      }
    });
    offspring.workingCapabilities = Array.from(workingSet.values());

    // Inherit promising experimental capabilities
    const experimentalSet = new Map<string, CapabilityGene>();
    [...parent1.experimentalCapabilities, ...parent2.experimentalCapabilities]
      .filter(cap => cap.confidence > 0.6)
      .forEach(cap => {
        if (!experimentalSet.has(cap.id) || cap.confidence > experimentalSet.get(cap.id)!.confidence) {
          experimentalSet.set(cap.id, cap);
        }
      });
    offspring.experimentalCapabilities = Array.from(experimentalSet.values());

    offspring.mutations.push({
      type: 'combination',
      geneName: 'multi-parent',
      description: `Crossover from parents: ${parent1.id} + ${parent2.id}`,
      appliedAt: Date.now(),
      improved: false,
    });

    return offspring;
  }

  /**
   * SELECTION: Tournament selection based on fitness
   * Returns the variant with highest fitness score from a random sample
   */
  tournamentSelect(population: ModelVariant[], tournamentSize: number = 3): ModelVariant {
    const candidates: ModelVariant[] = [];
    for (let i = 0; i < tournamentSize; i++) {
      candidates.push(population[Math.floor(Math.random() * population.length)]);
    }

    return candidates.sort((a, b) => b.fitnessScore - a.fitnessScore)[0];
  }

  /**
   * ELITE SELECTION: Keep top N variants by fitness
   */
  selectElite(population: ModelVariant[], count: number): ModelVariant[] {
    return population.sort((a, b) => b.fitnessScore - a.fitnessScore).slice(0, count);
  }

  /**
   * REPRODUCTION: Create next generation from population
   */
  reproduce(population: ModelVariant[], generationSize: number): ModelVariant[] {
    if (population.length === 0) return [];

    const nextGen: ModelVariant[] = [];

    // Keep elite (top 20%)
    const eliteCount = Math.max(1, Math.floor(generationSize * 0.2));
    const elite = this.selectElite(population, eliteCount);
    nextGen.push(...elite);

    // Crossover (30%)
    const crossoverCount = Math.max(1, Math.floor(generationSize * 0.3));
    for (let i = 0; i < crossoverCount; i++) {
      const p1 = this.tournamentSelect(population);
      const p2 = this.tournamentSelect(population);
      nextGen.push(this.crossover(p1, p2));
    }

    // Mutation (50%)
    const mutationCount = generationSize - nextGen.length;
    for (let i = 0; i < mutationCount; i++) {
      const parent = this.tournamentSelect(population);
      nextGen.push(this.mutate(parent));
    }

    return nextGen;
  }

  /**
   * PROMOTE: Mark experimental capability as working if it proves itself
   */
  promote(variant: ModelVariant, experimentalId: string, successRate: number): void {
    const experiment = variant.experimentalCapabilities.find(c => c.id === experimentalId);
    if (experiment && successRate > 0.7) {
      experiment.enabled = true;
      experiment.successRate = successRate;
      experiment.confidence = Math.min(1, experiment.confidence * (1 + successRate * 0.3));

      variant.workingCapabilities.push({ ...experiment });
      variant.experimentalCapabilities = variant.experimentalCapabilities.filter(c => c.id !== experimentalId);
    }
  }

  /**
   * DEMOTE: Mark failed capability as needing rework
   */
  demote(variant: ModelVariant, workingId: string): void {
    const working = variant.workingCapabilities.find(c => c.id === workingId);
    if (working) {
      working.enabled = false;
      working.confidence = Math.max(0.2, working.confidence * 0.7);
      variant.failedCapabilities.push({ ...working });
      variant.workingCapabilities = variant.workingCapabilities.filter(c => c.id !== workingId);
    }
  }

  /**
   * CALCULATE DIVERSITY: How different is this variant from the population
   */
  calculateDiversity(variant: ModelVariant, population: ModelVariant[]): number {
    if (population.length === 0) return 1;

    let totalDistance = 0;
    for (const other of population) {
      if (other.id === variant.id) continue;
      const workingDiff = Math.abs(variant.workingCapabilities.length - other.workingCapabilities.length);
      const experimentalDiff = Math.abs(variant.experimentalCapabilities.length - other.experimentalCapabilities.length);
      const fitnessDiff = Math.abs(variant.fitnessScore - other.fitnessScore);

      const distance = (workingDiff + experimentalDiff) * 0.5 + fitnessDiff;
      totalDistance += distance;
    }

    return totalDistance / population.length;
  }
}

export const geneticOperators = new GeneticOperators();
