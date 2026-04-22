/**
 * WIKI AUTOMATION — Automatic maintenance and ingestion
 *
 * Schedules:
 * - Weekly lint (health check)
 * - Daily ingestion checks for new sources
 * - Monthly synthesis generation
 */

import { llmWikiSystem } from './LLMWikiSystem';
import * as fs from 'fs';
import * as path from 'path';

export class WikiAutomation {
  private wikiRunning: boolean = false;
  private lintInterval: NodeJS.Timeout | null = null;
  private ingestInterval: NodeJS.Timeout | null = null;
  private lastLintTime: number = 0;
  private lastIngestTime: number = 0;

  /**
   * Start automated wiki maintenance
   */
  startAutomation(sourcesDir: string = './jarvis-wiki/sources'): void {
    if (this.wikiRunning) {
      console.log('[Wiki] ⚠️  Automation already running');
      return;
    }

    console.log('[Wiki] 🔄 Starting automated wiki maintenance');
    this.wikiRunning = true;

    // Weekly lint (every 7 days = 604,800,000 ms)
    this.lintInterval = setInterval(async () => {
      await this.runWeeklyLint();
    }, 7 * 24 * 60 * 60 * 1000);

    // Daily ingest check (every 24 hours)
    this.ingestInterval = setInterval(async () => {
      await this.checkAndIngestNewSources(sourcesDir);
    }, 24 * 60 * 60 * 1000);

    // Run lint immediately on startup
    this.runWeeklyLint().catch(err =>
      console.error('[Wiki] Lint error:', err.message)
    );

    // Check for sources immediately
    this.checkAndIngestNewSources(sourcesDir).catch(err =>
      console.error('[Wiki] Ingest error:', err.message)
    );

    console.log('[Wiki] ✅ Automation started');
  }

  /**
   * Stop automation
   */
  stopAutomation(): void {
    if (this.lintInterval) clearInterval(this.lintInterval);
    if (this.ingestInterval) clearInterval(this.ingestInterval);
    this.wikiRunning = false;
    console.log('[Wiki] ⛔ Automation stopped');
  }

  /**
   * Weekly health check
   */
  private async runWeeklyLint(): Promise<void> {
    const now = Date.now();
    if (now - this.lastLintTime < 7 * 24 * 60 * 60 * 1000) {
      return; // Skip if already ran this week
    }

    console.log('\n[Wiki] 🔧 === WEEKLY HEALTH CHECK ===\n');

    try {
      const result = await llmWikiSystem.lintWiki();

      console.log(`[Wiki] Issues found: ${result.issues.length}`);
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`));

      console.log(`[Wiki] Suggestions: ${result.suggestions.length}`);
      result.suggestions.forEach(sugg => console.log(`  💡 ${sugg}`));

      this.lastLintTime = now;
    } catch (err: any) {
      console.error('[Wiki] Lint error:', err.message);
    }
  }

  /**
   * Check for new sources and auto-ingest them
   */
  private async checkAndIngestNewSources(sourcesDir: string): Promise<void> {
    if (!fs.existsSync(sourcesDir)) return;

    const files = fs.readdirSync(sourcesDir);
    const uningestedFiles = files.filter(f => !f.startsWith('.'));

    if (uningestedFiles.length === 0) return;

    console.log(`\n[Wiki] 📥 Found ${uningestedFiles.length} uningestedfiles`);

    // Auto-ingest first file (limit to 1 per day to avoid overwhelming)
    if (uningestedFiles.length > 0) {
      const file = uningestedFiles[0];
      const title = path.basename(file, path.extname(file));

      try {
        console.log(`[Wiki] Auto-ingesting: ${title}`);
        await llmWikiSystem.ingestSource(file, title, 'article');
        console.log(`[Wiki] ✅ Auto-ingested: ${title}`);

        this.lastIngestTime = Date.now();
      } catch (err: any) {
        console.error(`[Wiki] Failed to ingest ${file}:`, err.message);
      }
    }
  }

  /**
   * Get automation status
   */
  getStatus() {
    return {
      isRunning: this.wikiRunning,
      lastLintTime: new Date(this.lastLintTime),
      lastIngestTime: new Date(this.lastIngestTime),
    };
  }
}

export const wikiAutomation = new WikiAutomation();
