/**
 * JARVIS LOCAL DATABASE
 *
 * All learning persisted to .jarvis-db/ directory
 * Auto-commits every 15 minutes to Git
 * Single source of truth: .jarvis-db/
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export class JarvisLocalDB {
  private dbPath = './.jarvis-db';
  private commitInterval = 15 * 60 * 1000; // 15 minutes
  private isDirty = false;
  private commitTimer: NodeJS.Timeout | null = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    // Create .jarvis-db structure if not exists
    this.ensureDirectoryStructure();

    // Load existing data
    await this.loadState();

    // Start auto-commit timer
    this.startAutoCommitTimer();

    console.log('✅ Jarvis Local DB initialized');
  }

  private ensureDirectoryStructure(): void {
    const dirs = [
      'interactions',
      'knowledge',
      'improvements',
      'metrics/daily',
      'metrics/weekly',
      'security-learnings',
      'domain-knowledge',
      'decisions',
      'genome'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.dbPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private async loadState(): Promise<void> {
    // Load metadata if exists
    const metadataFile = path.join(this.dbPath, 'metadata.json');
    if (fs.existsSync(metadataFile)) {
      const metadata = this.readJSON(metadataFile);
      if (metadata) {
        console.log(`📚 Loaded state: ${metadata.total_interactions || 0} interactions`);
      }
    }
  }

  // ============================================
  // INTERACTION RECORDING
  // ============================================

  async recordInteraction(interaction: {
    message: string;
    response: string;
    intent: string;
    confidence: number;
    systemsUsed: string[];
    responseTime: number;
    qualityScore?: number;
  }): Promise<string> {
    const id = `int-${Date.now()}`;
    const record = {
      timestamp: new Date().toISOString(),
      id,
      ...interaction
    };

    // Append to current.jsonl (buffer)
    const currentFile = path.join(this.dbPath, 'interactions', 'current.jsonl');
    fs.appendFileSync(currentFile, JSON.stringify(record) + '\n');

    this.isDirty = true;
    return id;
  }

  async getRecentInteractions(count: number = 100): Promise<any[]> {
    const currentFile = path.join(this.dbPath, 'interactions', 'current.jsonl');

    if (!fs.existsSync(currentFile)) return [];

    const lines = fs.readFileSync(currentFile, 'utf-8')
      .split('\n')
      .filter(l => l.trim())
      .slice(-count)
      .map(l => JSON.parse(l));

    return lines;
  }

  // ============================================
  // KNOWLEDGE MANAGEMENT
  // ============================================

  async updateKnowledge(updates: {
    concepts?: any;
    relationships?: any;
    skills?: any;
  }): Promise<void> {
    if (updates.concepts) {
      const conceptsFile = path.join(this.dbPath, 'knowledge', 'concepts.json');
      const current = this.readJSON(conceptsFile) || {};
      const merged = { ...current, ...updates.concepts };
      this.writeJSON(conceptsFile, merged);
    }

    if (updates.relationships) {
      const relFile = path.join(this.dbPath, 'knowledge', 'relationships.json');
      const current = this.readJSON(relFile) || [];
      const merged = [...current, ...updates.relationships];
      this.writeJSON(relFile, merged);
    }

    if (updates.skills) {
      const skillsFile = path.join(this.dbPath, 'knowledge', 'skills.json');
      const current = this.readJSON(skillsFile) || {};
      const merged = { ...current, ...updates.skills };
      this.writeJSON(skillsFile, merged);
    }

    this.isDirty = true;
  }

  async getKnowledge(): Promise<{
    concepts: any;
    relationships: any;
    skills: any;
  }> {
    return {
      concepts: this.readJSON(path.join(this.dbPath, 'knowledge', 'concepts.json')) || {},
      relationships: this.readJSON(path.join(this.dbPath, 'knowledge', 'relationships.json')) || [],
      skills: this.readJSON(path.join(this.dbPath, 'knowledge', 'skills.json')) || {}
    };
  }

  // ============================================
  // IMPROVEMENTS TRACKING
  // ============================================

  async recordImprovement(improvement: {
    strategy: string;
    targetDimension: string;
    expectedImpact: number;
    priority: number;
    implementationSteps: string[];
    estimatedEffort: string;
  }): Promise<string> {
    const id = `imp-${Date.now()}`;
    const record = {
      id,
      identified_at: new Date().toISOString(),
      status: 'pending',
      ...improvement
    };

    const pendingFile = path.join(this.dbPath, 'improvements', 'pending.json');
    const pending = this.readJSON(pendingFile) || [];
    pending.push(record);
    this.writeJSON(pendingFile, pending);

    this.isDirty = true;
    return id;
  }

  async applyImprovement(improvementId: string, result: {
    actual_impact: number;
    files_modified: string[];
    validation: 'success' | 'failed';
    metrics_before: any;
    metrics_after: any;
  }): Promise<void> {
    const pendingFile = path.join(this.dbPath, 'improvements', 'pending.json');
    const appliedFile = path.join(this.dbPath, 'improvements', 'applied.json');

    const pending = this.readJSON(pendingFile) || [];
    const improvement = pending.find((i: any) => i.id === improvementId);

    if (!improvement) throw new Error('Improvement not found');

    // Move to applied
    const applied = this.readJSON(appliedFile) || [];
    applied.push({
      ...improvement,
      applied_at: new Date().toISOString(),
      status: 'applied',
      ...result
    });

    this.writeJSON(pendingFile, pending.filter((i: any) => i.id !== improvementId));
    this.writeJSON(appliedFile, applied);

    this.isDirty = true;
  }

  // ============================================
  // METRICS TRACKING
  // ============================================

  async recordDailyMetrics(metrics: any): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const metricsFile = path.join(this.dbPath, 'metrics', 'daily', `${date}.json`);
    this.writeJSON(metricsFile, {
      date,
      timestamp: new Date().toISOString(),
      ...metrics
    });

    // Update lifetime metrics
    const lifetimeFile = path.join(this.dbPath, 'metrics', 'lifetime.json');
    const lifetime = this.readJSON(lifetimeFile) || {
      total_interactions: 0,
      avg_quality: 0,
      total_learning_cycles: 0,
      days_active: 0
    };

    lifetime.total_interactions += metrics.interactions_count || 0;
    lifetime.days_active = (lifetime.days_active || 0) + 1;

    this.writeJSON(lifetimeFile, lifetime);

    this.isDirty = true;
  }

  // ============================================
  // COMMIT & PERSISTENCE
  // ============================================

  private startAutoCommitTimer(): void {
    this.commitTimer = setInterval(async () => {
      if (this.isDirty) {
        await this.commitToGit();
      }
    }, this.commitInterval);

    console.log('⏲️  Auto-commit timer started (every 15 minutes)');
  }

  async commitToGit(): Promise<string> {
    try {
      // Check if there are changes
      const statusCheck = execSync('git status --porcelain .jarvis-db/', {
        encoding: 'utf-8'
      });

      if (!statusCheck.trim()) {
        this.isDirty = false;
        return 'No changes to commit';
      }

      // Get summary of what changed
      const summary = await this.generateCommitSummary();

      // Stage changes
      execSync('git add .jarvis-db/', { stdio: 'pipe' });

      // Commit
      const commitMsg = `🧠 Auto-improvement: ${summary}\n\nTimestamp: ${new Date().toISOString()}`;

      const result = execSync(`git commit -m "${commitMsg}"`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      console.log(`✅ Jarvis learning committed: ${summary}`);

      this.isDirty = false;
      return result;

    } catch (error: any) {
      if (error.message && error.message.includes('nothing to commit')) {
        this.isDirty = false;
        return 'No changes to commit';
      }
      console.error('Error during commit:', error.message);
      return 'Commit failed';
    }
  }

  private async generateCommitSummary(): Promise<string> {
    const currentFile = path.join(this.dbPath, 'interactions', 'current.jsonl');

    if (!fs.existsSync(currentFile)) {
      return 'System initialized';
    }

    const interactions = fs.readFileSync(currentFile, 'utf-8')
      .split('\n')
      .filter(l => l.trim())
      .length;

    const knowledge = this.readJSON(path.join(this.dbPath, 'knowledge', 'concepts.json')) || {};
    const conceptsCount = Object.keys(knowledge).length;

    return `${interactions} interactions analyzed, ${conceptsCount} concepts learned`;
  }

  // ============================================
  // UTILITIES
  // ============================================

  private readJSON(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return null;
    }
  }

  private writeJSON(filePath: string, data: any): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
    }
  }

  async getStats(): Promise<{
    total_interactions: number;
    concepts_learned: number;
    skills_mastered: number;
    improvements_pending: number;
    improvements_applied: number;
    days_active: number;
  }> {
    const currentFile = path.join(this.dbPath, 'interactions', 'current.jsonl');
    const interactions = fs.existsSync(currentFile)
      ? fs.readFileSync(currentFile, 'utf-8').split('\n').filter(l => l.trim()).length
      : 0;

    const knowledge = this.readJSON(path.join(this.dbPath, 'knowledge', 'concepts.json')) || {};
    const skills = this.readJSON(path.join(this.dbPath, 'knowledge', 'skills.json')) || {};
    const pending = this.readJSON(path.join(this.dbPath, 'improvements', 'pending.json')) || [];
    const applied = this.readJSON(path.join(this.dbPath, 'improvements', 'applied.json')) || [];
    const lifetime = this.readJSON(path.join(this.dbPath, 'metrics', 'lifetime.json')) || {};

    return {
      total_interactions: interactions,
      concepts_learned: Object.keys(knowledge).length,
      skills_mastered: Object.values(skills as any).filter((s: any) => s.mastery >= 0.8).length,
      improvements_pending: pending.length,
      improvements_applied: applied.length,
      days_active: lifetime.days_active || 0
    };
  }

  async cleanup(): Promise<void> {
    if (this.commitTimer) {
      clearInterval(this.commitTimer);
    }

    // Final commit before shutdown
    if (this.isDirty) {
      await this.commitToGit();
    }

    console.log('✅ Jarvis Local DB cleanup complete');
  }
}

export const jarvisLocalDB = new JarvisLocalDB();
