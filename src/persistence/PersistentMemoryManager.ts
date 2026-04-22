/**
 * PERSISTENT MEMORY MANAGER
 *
 * Manages all persistent storage of Jarvis's knowledge
 * - Episodic Memory (what happened)
 * - Semantic Memory (what was learned)
 * - Procedural Memory (how to do things)
 * - Model Evolution (genome tracking)
 *
 * NOTE: Using Firebase for cloud deployment instead of local SQLite
 */

// NOTE: better-sqlite3 removed for Railway deployment
// Using Firebase RTDB for cloud persistence instead of local SQLite
// This class provides interface compatibility; actual persistence via Firebase

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Episode {
  id?: number;
  timestamp: number;
  query: string;
  agents: string[];
  actions: string[];
  result: any;
  executionTime: number;
  success: boolean;
}

export interface Lesson {
  id?: number;
  concept: string;
  rule: string;
  successRate: number;
  timesUsed?: number;
  timesSuccessful?: number;
  lastUsed?: number;
  source?: string;
}

export interface Skill {
  id?: number;
  name: string;
  type: 'tool' | 'pattern' | 'heuristic';
  implementation: string;
  effectiveness: number;
  lastExecuted?: number;
  timesExecuted?: number;
  timesSuccessful?: number;
}

export interface Genome {
  id?: number;
  generationId: number;
  timestamp: number;
  mutationVector: number[];
  fitnessScore: number;
  changes: string;
  parentGeneration?: number;
}

export interface JarvisTask {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface Pattern {
  id?: number;
  name: string;
  description: string;
  signature: string;
  confidence: number;
  timesMatched?: number;
  timesSuccessful?: number;
  lastMatched?: number;
}

// ============================================
// PERSISTENT MEMORY MANAGER
// ============================================

export class PersistentMemoryManager {
  private db: any; // Firebase RTDB or stub interface

  constructor() {
    // Firebase RTDB will be configured via environment variables
    // This class maintains API compatibility for the rest of the system
    this.db = null; // TODO: Initialize Firebase RTDB connection
  }

  // ========================================
  // EPISODIC MEMORY (Events & Experiences)
  // ========================================

  async saveEpisode(episode: Episode): Promise<number> {
    if (!this.db) {
      // Firebase stub: just return a timestamp-based ID
      return Math.floor(Date.now() / 1000);
    }

    const stmt = this.db.prepare(`
      INSERT INTO episodes
      (timestamp, query, agents, actions, result, executionTime, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      episode.timestamp,
      episode.query,
      JSON.stringify(episode.agents),
      JSON.stringify(episode.actions),
      JSON.stringify(episode.result),
      episode.executionTime,
      episode.success ? 1 : 0
    );

    return result.lastInsertRowid as number;
  }

  async getEpisodes(limit: number = 100): Promise<Episode[]> {
    if (!this.db) return []; // Firebase stub

    const stmt = this.db.prepare(`
      SELECT * FROM episodes
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const episodes = stmt.all(limit) as any[];
    return episodes.map(e => this.parseEpisode(e));
  }

  async findSimilarEpisodes(
    query: string,
    options: { limit?: number; minSimilarity?: number } = {}
  ): Promise<Episode[]> {
    const limit = options.limit || 5;

    // Búsqueda simple por palabras clave en la query
    const keywords = query.toLowerCase().split(/\s+/);
    const placeholders = keywords.map(() => '?').join(' OR ');

    const stmt = this.db.prepare(`
      SELECT * FROM episodes
      WHERE ${keywords.map(() => "query LIKE ?").join(' OR ')}
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const searchParams = keywords.map(k => `%${k}%`);
    const episodes = stmt.all(...searchParams, limit) as any[];

    return episodes.map(e => this.parseEpisode(e));
  }

  private parseEpisode(raw: any): Episode {
    return {
      ...raw,
      agents: JSON.parse(raw.agents || '[]'),
      actions: JSON.parse(raw.actions || '[]'),
      result: JSON.parse(raw.result || '{}'),
      success: Boolean(raw.success)
    };
  }

  // ========================================
  // SEMANTIC MEMORY (Learned Knowledge)
  // ========================================

  async saveLesson(lesson: Lesson): Promise<void> {
    if (!this.db) return; // Firebase stub

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO lessons
      (concept, rule, successRate, source, lastUsed)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      lesson.concept,
      lesson.rule,
      lesson.successRate,
      lesson.source || 'learned',
      lesson.lastUsed || Date.now()
    );
  }

  async getLessons(limit: number = 100): Promise<Lesson[]> {
    if (!this.db) return []; // Firebase stub

    const stmt = this.db.prepare(`
      SELECT * FROM lessons
      ORDER BY successRate DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Lesson[];
  }

  async searchLessons(keywords: string[]): Promise<Lesson[]> {
    if (keywords.length === 0 || !this.db) return [];

    const placeholders = keywords.map(() => 'concept LIKE ?').join(' OR ');
    const stmt = this.db.prepare(`
      SELECT * FROM lessons
      WHERE ${placeholders}
      ORDER BY successRate DESC
    `);

    const searchParams = keywords.map(k => `%${k}%`);
    return stmt.all(...searchParams) as Lesson[];
  }

  async getLesson(concept: string): Promise<Lesson | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM lessons WHERE concept = ?
    `);

    return (stmt.get(concept) as Lesson) || null;
  }

  async updateLessonSuccessRate(
    concept: string,
    newSuccessRate: number
  ): Promise<void> {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      UPDATE lessons
      SET successRate = ?, lastUsed = ?, timesUsed = timesUsed + 1
      WHERE concept = ?
    `);

    stmt.run(newSuccessRate, Date.now(), concept);
  }

  // ========================================
  // PROCEDURAL MEMORY (Skills & Techniques)
  // ========================================

  async saveSkill(skill: Skill): Promise<void> {
    if (!this.db) return; // Firebase stub

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO skills
      (name, type, implementation, effectiveness)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(skill.name, skill.type, skill.implementation, skill.effectiveness);
  }

  async getSkills(limit: number = 100): Promise<Skill[]> {
    if (!this.db) return []; // Firebase stub

    const stmt = this.db.prepare(`
      SELECT * FROM skills
      ORDER BY effectiveness DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Skill[];
  }

  async searchSkills(keywords: string[]): Promise<Skill[]> {
    if (keywords.length === 0 || !this.db) return [];

    const placeholders = keywords.map(() => 'name LIKE ?').join(' OR ');
    const stmt = this.db.prepare(`
      SELECT * FROM skills
      WHERE ${placeholders}
      ORDER BY effectiveness DESC
    `);

    const searchParams = keywords.map(k => `%${k}%`);
    return stmt.all(...searchParams) as Skill[];
  }

  async getSkill(name: string): Promise<Skill | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM skills WHERE name = ?
    `);

    return (stmt.get(name) as Skill) || null;
  }

  async updateSkillEffectiveness(
    name: string,
    newEffectiveness: number
  ): Promise<void> {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      UPDATE skills
      SET effectiveness = ?, lastExecuted = ?, timesExecuted = timesExecuted + 1
      WHERE name = ?
    `);

    stmt.run(newEffectiveness, Date.now(), name);
  }

  // ========================================
  // GENOME EVOLUTION
  // ========================================

  async getLatestGenome(): Promise<Genome> {
    if (!this.db) {
      // Firebase stub: return initial genome
      return this.createInitialGenome();
    }

    const stmt = this.db.prepare(`
      SELECT * FROM genomes
      ORDER BY generationId DESC
      LIMIT 1
    `);

    const genome = stmt.get() as any;

    if (!genome) {
      // Si no existe genome, crear uno inicial
      return this.createInitialGenome();
    }

    return this.parseGenome(genome);
  }

  async saveGenome(genome: Genome): Promise<void> {
    if (!this.db) return; // Firebase stub

    const stmt = this.db.prepare(`
      INSERT INTO genomes
      (generationId, timestamp, mutationVector, fitnessScore, changes, parentGeneration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      genome.generationId,
      genome.timestamp,
      JSON.stringify(genome.mutationVector),
      genome.fitnessScore,
      genome.changes,
      genome.parentGeneration || null
    );
  }

  async getGenomeHistory(limit: number = 10): Promise<Genome[]> {
    if (!this.db) return []; // Firebase stub

    const stmt = this.db.prepare(`
      SELECT * FROM genomes
      ORDER BY generationId DESC
      LIMIT ?
    `);

    const genomes = stmt.all(limit) as any[];
    return genomes.map(g => this.parseGenome(g));
  }

  private parseGenome(raw: any): Genome {
    return {
      ...raw,
      mutationVector: JSON.parse(raw.mutationVector || '[]')
    };
  }

  private async createInitialGenome(): Promise<Genome> {
    const genome: Genome = {
      generationId: 1,
      timestamp: Date.now(),
      mutationVector: [0.7, 0.6, 0.5, 0.8, 0.4], // Valores iniciales balanceados
      fitnessScore: 0.5,
      changes: 'INITIAL_BOOTSTRAP'
    };

    await this.saveGenome(genome);
    return genome;
  }

  // ========================================
  // TASK HISTORY
  // ========================================

  async saveTask(task: JarvisTask): Promise<void> {
    if (!this.db) return; // Firebase stub

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks
      (id, query, status, result, error, createdAt, startedAt, completedAt, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.query,
      task.status,
      task.result ? JSON.stringify(task.result) : null,
      task.error || null,
      task.createdAt,
      task.startedAt || null,
      task.completedAt || null,
      task.duration || null
    );
  }

  async getTask(taskId: string): Promise<JarvisTask | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `);

    const task = stmt.get(taskId) as any;

    if (!task) return null;

    return {
      ...task,
      result: task.result ? JSON.parse(task.result) : undefined
    };
  }

  async getTasks(
    status?: string,
    limit: number = 100
  ): Promise<JarvisTask[]> {
    if (!this.db) return [];

    let stmt;

    if (status) {
      stmt = this.db.prepare(`
        SELECT * FROM tasks
        WHERE status = ?
        ORDER BY createdAt DESC
        LIMIT ?
      `);
      return stmt.all(status, limit) as JarvisTask[];
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM tasks
        ORDER BY createdAt DESC
        LIMIT ?
      `);
      return stmt.all(limit) as JarvisTask[];
    }
  }

  // ========================================
  // PATTERNS & ANTI-PATTERNS
  // ========================================

  async savePattern(pattern: Pattern): Promise<void> {
    if (!this.db) return; // Firebase stub

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO patterns
      (name, description, signature, confidence)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      pattern.name,
      pattern.description,
      pattern.signature,
      pattern.confidence
    );
  }

  async getPatterns(limit: number = 50): Promise<Pattern[]> {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM patterns
      ORDER BY confidence DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Pattern[];
  }

  async findPattern(signature: string): Promise<Pattern | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM patterns WHERE signature = ?
    `);

    return (stmt.get(signature) as Pattern) || null;
  }

  // ========================================
  // CONSOLIDATION & LEARNING
  // ========================================

  async consolidateExperience(options: {
    query: string;
    agents: string[];
    actions: string[];
    result: any;
    executionTime: number;
    success: boolean;
  }): Promise<void> {
    // 1. Guardar como episodio
    const episode: Episode = {
      timestamp: Date.now(),
      query: options.query,
      agents: options.agents,
      actions: options.actions,
      result: options.result,
      executionTime: options.executionTime,
      success: options.success
    };

    await this.saveEpisode(episode);

    // 2. Si fue exitoso, guardar como lección
    if (options.success) {
      const actionPattern = options.actions.join(' → ');
      const concept = this.categorizeQuery(options.query);

      const existingLesson = await this.getLesson(concept);
      const newSuccessRate = existingLesson
        ? (existingLesson.successRate * 0.8 + 0.9) // 80% old + 20% new
        : 0.9;

      await this.saveLesson({
        concept,
        rule: actionPattern,
        successRate: newSuccessRate,
        source: 'learned',
        lastUsed: Date.now()
      });
    }

    // 3. Crear skill si no existe
    const mainAction = options.actions[0];
    if (mainAction && !await this.getSkill(mainAction)) {
      await this.saveSkill({
        name: mainAction,
        type: 'tool',
        implementation: `Learned from: ${options.query}`,
        effectiveness: options.success ? 0.8 : 0.3
      });
    }
  }

  private categorizeQuery(query: string): string {
    const keywords = query.toLowerCase().split(' ');
    if (keywords.some(k => ['busca', 'find', 'search'].includes(k)))
      return 'SEARCH';
    if (keywords.some(k => ['ejecuta', 'run', 'execute'].includes(k)))
      return 'EXECUTION';
    if (keywords.some(k => ['analiza', 'analyze'].includes(k)))
      return 'ANALYSIS';
    return 'GENERAL';
  }

  // ========================================
  // STATISTICS & ANALYTICS
  // ========================================

  async getStatistics(): Promise<{
    totalEpisodes: number;
    totalLessons: number;
    totalSkills: number;
    averageSuccessRate: number;
    successfulEpisodes: number;
    failedEpisodes: number;
    currentGeneration: number;
    currentFitnessScore: number;
  }> {
    if (!this.db) {
      // Firebase stub: return zeros
      const genome = await this.getLatestGenome();
      return {
        totalEpisodes: 0,
        totalLessons: 0,
        totalSkills: 0,
        averageSuccessRate: 0,
        successfulEpisodes: 0,
        failedEpisodes: 0,
        currentGeneration: genome.generationId,
        currentFitnessScore: genome.fitnessScore
      };
    }

    const episodes = this.db.prepare('SELECT COUNT(*) as count FROM episodes')
      .get() as any;
    const successfulEpisodes = this.db.prepare(
      'SELECT COUNT(*) as count FROM episodes WHERE success = 1'
    ).get() as any;
    const lessons = this.db.prepare('SELECT COUNT(*) as count FROM lessons')
      .get() as any;
    const skills = this.db.prepare('SELECT COUNT(*) as count FROM skills')
      .get() as any;
    const avgSuccessRate = this.db.prepare(
      'SELECT AVG(successRate) as avg FROM lessons'
    ).get() as any;
    const genome = await this.getLatestGenome();

    return {
      totalEpisodes: episodes.count,
      totalLessons: lessons.count,
      totalSkills: skills.count,
      averageSuccessRate: avgSuccessRate.avg || 0,
      successfulEpisodes: successfulEpisodes.count,
      failedEpisodes: episodes.count - successfulEpisodes.count,
      currentGeneration: genome.generationId,
      currentFitnessScore: genome.fitnessScore
    };
  }

  async logMetrics(): Promise<void> {
    const stats = await this.getStatistics();

    console.log('\n📊 JARVIS KNOWLEDGE BASE METRICS:');
    console.log(`   Episodes: ${stats.totalEpisodes}`);
    console.log(`   Lessons: ${stats.totalLessons}`);
    console.log(`   Skills: ${stats.totalSkills}`);
    console.log(`   Success Rate: ${(stats.averageSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Successful: ${stats.successfulEpisodes}`);
    console.log(`   Failed: ${stats.failedEpisodes}`);
    console.log(`   Generation: ${stats.currentGeneration}`);
    console.log(`   Fitness Score: ${stats.currentFitnessScore.toFixed(2)}`);
  }
}
