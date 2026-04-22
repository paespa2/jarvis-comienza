/**
 * MEMORY MANAGER
 *
 * Orquestador central del sistema de triple memoria de Jarvis.
 * Coordina Episodic, Semantic y Procedural memory.
 */

import { EpisodicMemorySystem } from './episodic/episodicMemory';
import { SemanticMemorySystem } from './semantic/semanticMemory';
import { ProceduralMemorySystem } from './procedural/proceduralMemory';
import {
  MemoryManagerState,
  Genome,
  ConsolidationEvent,
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
} from './memoryTypes';
import { v4 as uuidv4 } from 'uuid';

export class MemoryManager {
  private episodic: EpisodicMemorySystem;
  private semantic: SemanticMemorySystem;
  private procedural: ProceduralMemorySystem;
  private consolidationHistory: ConsolidationEvent[] = [];
  private currentGenome: Genome;
  private genomeLineage: Genome[] = [];
  private lastConsolidation: number = Date.now();

  constructor() {
    console.log(`\n🧠 INICIALIZANDO MEMORY MANAGER\n`);

    this.episodic = new EpisodicMemorySystem();
    this.semantic = new SemanticMemorySystem();
    this.procedural = new ProceduralMemorySystem();

    // Crear genoma inicial
    this.currentGenome = this.createInitialGenome();
    this.genomeLineage.push(this.currentGenome);

    console.log(`   ✅ Triple Memory inicializado`);
    console.log(`   🧬 Genoma inicial: ${this.currentGenome.generationId}`);
    console.log('');
  }

  /**
   * CREAR GENOMA INICIAL
   */
  private createInitialGenome(): Genome {
    return {
      generationId: `gen-${Date.now()}`,
      createdAt: Date.now(),
      mutationVector: {
        aggressiveness: 0.5,
        caution: 0.5,
        predictivity: 0.5,
        creativity: 0.5,
        loyalty: 0.95, // INMUTABLE
      },
      metrics: {
        totalTasksExecuted: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0,
        averageLoyaltyScore: 95,
        agentUtilization: {},
        skillsLearned: 0,
        knowledgeNodesCreated: 0,
      },
      status: 'ACTIVE',
      isCurrentGeneration: true,
    };
  }

  /**
   * REGISTRAR EPISODIO
   */
  recordEpisode(
    type: EpisodicMemory['type'],
    description: string,
    context: any,
    outcome: 'success' | 'failure' | 'partial' = 'success'
  ): void {
    const episode = this.episodic.recordEpisode(type, description, context, outcome);

    // Actualizar genoma metrics
    this.currentGenome.metrics.totalTasksExecuted++;
    if (outcome === 'success') {
      this.currentGenome.metrics.successfulTasks++;
    } else if (outcome === 'failure') {
      this.currentGenome.metrics.failedTasks++;
    }

    // Trigger consolidation si es necesario
    if (this.shouldConsolidate()) {
      this.consolidateMemory();
    }
  }

  /**
   * CREAR O ACTUALIZAR CONOCIMIENTO
   */
  addKnowledge(
    category: SemanticMemory['category'],
    title: string,
    content: string,
    domains: string[],
    sourceEpisodes?: string[]
  ): void {
    this.semantic.createOrUpdateKnowledge(category, title, content, domains, sourceEpisodes);
    this.currentGenome.metrics.knowledgeNodesCreated++;
  }

  /**
   * REGISTRAR SKILL
   */
  addSkill(
    skillName: string,
    description: string,
    steps: any[],
    category: string,
    prerequisites: string[] = []
  ): void {
    this.procedural.registerSkill(skillName, description, steps, category, prerequisites);
    this.currentGenome.metrics.skillsLearned++;
  }

  /**
   * REGISTRAR EJECUCIÓN EXITOSA DE SKILL
   */
  recordSkillSuccess(skillId: string): void {
    this.procedural.recordSuccessfulExecution(skillId);
  }

  /**
   * REGISTRAR FALLO DE SKILL
   */
  recordSkillFailure(skillId: string): void {
    this.procedural.recordFailedExecution(skillId);
  }

  /**
   =====================================================
   CONSOLIDACIÓN DE MEMORIA
   =====================================================

   Convertir episodios en conocimiento y skills.
   Este es el proceso de "aprendizaje" de Jarvis.
   */

  /**
   * ¿DEBERÍAMOS CONSOLIDAR?
   *
   * Trigger basado en:
   * - Tiempo desde última consolidación (> 1 hora)
   * - Número de episodios desde última consolidación (> 50)
   */
  private shouldConsolidate(): boolean {
    const timeSinceLastConsolidation = Date.now() - this.lastConsolidation;
    const hourInMs = 60 * 60 * 1000;
    const episodesSinceConsolidation = this.episodic.getAllEpisodes().length -
      this.consolidationHistory.reduce((sum, ce) => sum + ce.sourceEpisodes.length, 0);

    return timeSinceLastConsolidation > hourInMs || episodesSinceConsolidation > 50;
  }

  /**
   * CONSOLIDAR MEMORIA
   *
   * Analizar episodios recientes y convertirlos en conocimiento y skills.
   */
  private consolidateMemory(): void {
    console.log(`\n🔄 CONSOLIDACIÓN DE MEMORIA INICIADA`);

    const recentEpisodes = this.episodic.getRecentEpisodes(50);
    const successEpisodes = recentEpisodes.filter(e => e.outcome === 'success');
    const failureEpisodes = recentEpisodes.filter(e => e.outcome === 'failure');

    // EXTRACTING PATTERNS FROM SUCCESSES
    if (successEpisodes.length >= 3) {
      // Si ejecutamos la misma tarea exitosamente 3+ veces, crear skill
      const taskTypes = new Map<string, EpisodicMemory[]>();
      successEpisodes.forEach(ep => {
        if (!taskTypes.has(ep.type)) {
          taskTypes.set(ep.type, []);
        }
        taskTypes.get(ep.type)!.push(ep);
      });

      taskTypes.forEach((episodes, type) => {
        if (episodes.length >= 3) {
          this.procedural.registerSkill(
            `Proficient in ${type}`,
            `Successfully executed ${type} multiple times`,
            [
              { order: 1, description: `Prepare for ${type}`, expectedOutcome: 'Ready to execute' },
              { order: 2, description: `Execute ${type}`, expectedOutcome: 'Task complete' },
            ],
            type,
            []
          );

          const consolidation: ConsolidationEvent = {
            id: `cons-${uuidv4()}`,
            timestamp: Date.now(),
            type: 'episodic_to_procedural',
            sourceEpisodes: episodes.map(e => e.id),
            resultingMemory: `Skill: ${type}`,
            confidenceLevel: Math.min(1, episodes.length / 10),
            description: `Learned skill from ${episodes.length} successful executions`,
          };

          this.consolidationHistory.push(consolidation);
          console.log(`   ✅ Skill creado: "Proficient in ${type}"`);
        }
      });
    }

    // LEARNING FROM FAILURES
    if (failureEpisodes.length >= 2) {
      failureEpisodes.forEach(ep => {
        // Crear "anti-knowledge" para evitar errores
        this.semantic.createOrUpdateKnowledge(
          'principle',
          `Avoid: ${ep.description}`,
          `Pattern learned from failure: ${ep.context}`,
          ['error-avoidance'],
          [ep.id]
        );
      });

      console.log(
        `   ⚠️  ${failureEpisodes.length} patrones de error documentados`
      );
    }

    this.lastConsolidation = Date.now();
    console.log(`✅ Consolidación completada\n`);
  }

  /**
   =====================================================
   EVOLUCIÓN DEL GENOMA
   =====================================================

   Mutación automática basada en performance.
   */

  /**
   * EVALUAR SI DEBE EVOLUCIONAR
   */
  evaluateEvolution(): void {
    const successRate =
      this.currentGenome.metrics.totalTasksExecuted > 0
        ? this.currentGenome.metrics.successfulTasks /
          this.currentGenome.metrics.totalTasksExecuted
        : 0;

    const needsEvolution =
      this.currentGenome.metrics.totalTasksExecuted >= 20 && // Requiere mínimo de ejecuciones
      (successRate < 0.7 || // Success rate bajo
        this.currentGenome.metrics.averageExecutionTime > 5000); // Ejecución lenta

    if (needsEvolution) {
      this.mutateGenome(
        successRate < 0.7
          ? 'Low success rate detected'
          : 'High execution time detected'
      );
    }
  }

  /**
   * MUTAR GENOMA
   */
  private mutateGenome(reason: string): void {
    console.log(`\n🧬 MUTACIÓN DE GENOMA INICIADA`);
    console.log(`   Razón: ${reason}\n`);

    // Archivenar generación actual
    this.currentGenome.status = 'SUPERCEDED';
    this.currentGenome.isCurrentGeneration = false;

    // Crear nueva generación
    const successRate =
      this.currentGenome.metrics.totalTasksExecuted > 0
        ? this.currentGenome.metrics.successfulTasks /
          this.currentGenome.metrics.totalTasksExecuted
        : 0;

    const newGenome: Genome = {
      generationId: `gen-${Date.now()}`,
      createdAt: Date.now(),
      parentGenerationId: this.currentGenome.generationId,
      mutationVector: {
        // Ajustar vector de mutación basado en performance
        aggressiveness:
          successRate < 0.7
            ? this.currentGenome.mutationVector.aggressiveness - 0.1
            : this.currentGenome.mutationVector.aggressiveness + 0.05,
        caution:
          successRate < 0.7
            ? this.currentGenome.mutationVector.caution + 0.1
            : this.currentGenome.mutationVector.caution - 0.05,
        predictivity: Math.min(
          1,
          this.currentGenome.mutationVector.predictivity + 0.05
        ),
        creativity: Math.min(
          1,
          this.currentGenome.mutationVector.creativity + 0.03
        ),
        loyalty: 0.95, // SIEMPRE INMUTABLE
      },
      metrics: {
        totalTasksExecuted: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0,
        averageLoyaltyScore: 95,
        agentUtilization: {},
        skillsLearned: this.currentGenome.metrics.skillsLearned,
        knowledgeNodesCreated: this.currentGenome.metrics.knowledgeNodesCreated,
      },
      status: 'ACTIVE',
      isCurrentGeneration: true,
      evolutionTriggeredBy: reason,
    };

    this.currentGenome = newGenome;
    this.genomeLineage.push(newGenome);

    console.log(`   🧬 Nueva generación: ${newGenome.generationId}`);
    console.log(
      `   Aggressiveness: ${newGenome.mutationVector.aggressiveness.toFixed(2)}`
    );
    console.log(`   Caution: ${newGenome.mutationVector.caution.toFixed(2)}`);
    console.log(`   Predictivity: ${newGenome.mutationVector.predictivity.toFixed(2)}`);
    console.log(`   Creativity: ${newGenome.mutationVector.creativity.toFixed(2)}\n`);
  }

  /**
   =====================================================
   QUERY INTERFACE
   =====================================================
   */

  /**
   * OBTENER ESTADO COMPLETO
   */
  getFullState(): MemoryManagerState {
    return {
      episodicMemories: this.episodic.getAllEpisodes(),
      semanticMemories: this.semantic.getAllKnowledge(),
      proceduralMemories: this.procedural.getAllSkills(),
      consolidationHistory: this.consolidationHistory,
      currentGenome: this.currentGenome,
      genomeLineage: this.genomeLineage,
      lastConsolidation: this.lastConsolidation,
      totalMemoriesStored:
        this.episodic.getAllEpisodes().length +
        this.semantic.getAllKnowledge().length +
        this.procedural.getAllSkills().length,
    };
  }

  /**
   * OBTENER RESUMEN
   */
  getSummary() {
    return {
      episodic: this.episodic.getStatistics(),
      semantic: this.semantic.getStatistics(),
      procedural: this.procedural.getStatistics(),
      genome: {
        generationId: this.currentGenome.generationId,
        mutationVector: this.currentGenome.mutationVector,
        successRate:
          this.currentGenome.metrics.totalTasksExecuted > 0
            ? (this.currentGenome.metrics.successfulTasks /
                this.currentGenome.metrics.totalTasksExecuted) *
              100
            : 0,
      },
      memoryUsage: {
        episodic: this.episodic.getMemoryUsage(),
        semantic: this.semantic.getMemoryUsage(),
        procedural: this.procedural.getMemoryUsage(),
      },
    };
  }

  /**
   * OBTENER RECOMENDACIÓN DE SKILL
   */
  getRecommendedSkills(domain: string): ProceduralMemory[] {
    return this.procedural.getSkillsByCategory(domain);
  }

  /**
   * OBTENER CONOCIMIENTO CONFIABLE
   */
  getTrustedKnowledge(domain?: string): SemanticMemory[] {
    return this.semantic.getMostConfidentKnowledge(domain);
  }

  /**
   * CONSOLIDAR EXPERIENCIA
   *
   * Procesa una experiencia completada, registra episodio,
   * y consolida aprendizajes en memoria semántica/procedural.
   */
  async consolidateExperience(data: {
    taskId: string;
    query: string;
    success: boolean;
    iterations: any[];
    lessonLearned?: string;
  }): Promise<any> {
    console.log(`\n📚 CONSOLIDANDO EXPERIENCIA`);
    console.log(`   Tarea: ${data.taskId}`);
    console.log(`   Éxito: ${data.success ? '✅' : '❌'}`);
    console.log(`   Iteraciones: ${data.iterations.length}`);

    // Registrar episodio
    const outcome = data.success ? 'success' : 'failure';
    this.recordEpisode(
      'task_execution',
      `Ejecutada tarea: ${data.query.substring(0, 50)}...`,
      {
        taskId: data.taskId,
        query: data.query,
        iterationCount: data.iterations.length,
      },
      outcome
    );

    // Registrar lección aprendida como conocimiento
    if (data.lessonLearned) {
      this.addKnowledge(
        'fact',
        `Lección de ${data.taskId}`,
        data.lessonLearned,
        ['learning', 'improvement'],
        []
      );
    }

    // Actualizar métrica de tiempo de ejecución
    if (data.iterations.length > 0) {
      const avgTime = data.iterations.reduce((sum: number, it: any) => sum + (it.executionTime || 0), 0) / data.iterations.length;
      this.currentGenome.metrics.averageExecutionTime = avgTime;
    }

    // Si hay suficientes iteraciones exitosas, considerar crear skill
    if (data.success && data.iterations.length >= 2) {
      const skillName = `Execute: ${data.query.substring(0, 30)}`;
      this.addSkill(
        skillName,
        `Habilidad para ejecutar: ${data.query.substring(0, 50)}...`,
        data.iterations.map((it, idx) => ({
          order: idx + 1,
          description: it.phase || `Paso ${idx + 1}`,
          expectedOutcome: 'Completado'
        })),
        'task_execution',
        []
      );
    }

    console.log(`   ✅ Experiencia consolidada`);
    console.log(`   📊 Genoma: ${this.currentGenome.generationId}\n`);

    return {
      consolidationId: `cons-${uuidv4()}`,
      taskId: data.taskId,
      episodesRecorded: 1,
      knowledgeCreated: data.lessonLearned ? 1 : 0,
      skillsCreated: data.success && data.iterations.length >= 2 ? 1 : 0,
      timestamp: Date.now(),
      currentGenome: this.currentGenome.generationId,
    };
  }
}

/**
 * FACTORY
 */
export function createMemoryManager(): MemoryManager {
  return new MemoryManager();
}
