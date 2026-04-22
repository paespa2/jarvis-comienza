/**
 * LLM WIKI SYSTEM FOR JARVIS
 *
 * Implements the LLM Wiki pattern:
 * - Raw sources layer (immutable documents)
 * - Wiki layer (LLM-maintained markdown knowledge base)
 * - Schema layer (configuration & workflows)
 *
 * Three key operations:
 * 1. INGEST — Process new sources, extract knowledge, update wiki
 * 2. QUERY — Answer questions by synthesizing wiki pages
 * 3. LINT — Health check, maintain consistency, discover gaps
 */

import * as fs from 'fs';
import * as path from 'path';
import { jarvisNativeModel } from '../nativeModel/JarvisNativeModel';
import { selfProgrammingEngine } from '../selfProgramming/SelfProgrammingEngine';
import { firebaseServerService } from '../../services/firebaseServerService';

export interface WikiSource {
  id: string;
  filename: string;
  title: string;
  type: 'article' | 'paper' | 'book_chapter' | 'transcript' | 'report' | 'webpage';
  addedAt: number;
  summary: string;
  keyTakeaways: string[];
  tags: string[];
  sourceUrl?: string;
}

export interface WikiPage {
  filename: string;
  title: string;
  category: 'entity' | 'concept' | 'comparison' | 'synthesis' | 'index' | 'log';
  content: string;
  backlinks: string[];      // Pages that link to this
  outgoingLinks: string[]; // Pages this links to
  sourceReferences: string[]; // Source IDs referenced
  lastUpdated: number;
  version: number;
}

export interface WikiEntry {
  timestamp: number;
  action: 'ingest' | 'query' | 'lint' | 'update';
  title: string;
  details: string;
}

export class LLMWikiSystem {
  private wikiDir: string;
  private rawSourcesDir: string;
  private schemaPath: string;
  private indexPath: string;
  private logPath: string;
  private sources: Map<string, WikiSource> = new Map();
  private pages: Map<string, WikiPage> = new Map();
  private log: WikiEntry[] = [];

  constructor(baseDir: string = './llm-wiki') {
    this.wikiDir = path.join(baseDir, 'wiki');
    this.rawSourcesDir = path.join(baseDir, 'sources');
    this.schemaPath = path.join(baseDir, 'WIKI_SCHEMA.md');
    this.indexPath = path.join(this.wikiDir, 'index.md');
    this.logPath = path.join(this.wikiDir, 'log.md');

    this.ensureDirectories();
    this.loadExistingWiki();
    this.initializeSchema();
  }

  private ensureDirectories(): void {
    [this.wikiDir, this.rawSourcesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadExistingWiki(): void {
    // Load all markdown files from wiki directory
    if (fs.existsSync(this.wikiDir)) {
      const files = fs.readdirSync(this.wikiDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        if (file === 'index.md' || file === 'log.md') continue;

        const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');
        const title = this.extractTitle(content);

        this.pages.set(file, {
          filename: file,
          title,
          category: this.classifyPage(file),
          content,
          backlinks: [],
          outgoingLinks: this.extractLinks(content),
          sourceReferences: this.extractSourceRefs(content),
          lastUpdated: Date.now(),
          version: 1,
        });
      }
    }

    // Load log entries
    if (fs.existsSync(this.logPath)) {
      const logContent = fs.readFileSync(this.logPath, 'utf-8');
      const entries = logContent.match(/^## \[.+?\]/gm) || [];
      this.log.length = entries.length;
    }
  }

  private initializeSchema(): void {
    if (!fs.existsSync(this.schemaPath)) {
      const schema = `# LLM Wiki Schema for Jarvis

## Directory Structure
\`\`\`
llm-wiki/
  sources/           # Immutable raw sources
  wiki/
    index.md        # Content-oriented catalog
    log.md          # Append-only operation log
    entities/       # Entity pages (HackerOne programs, vulnerabilities, etc.)
    concepts/       # Concept pages (techniques, methodologies)
    comparisons/    # Comparative analysis
    synthesis/      # Synthetic insights & theories
\`\`\`

## Page Conventions

### Entity Pages (entities/*.md)
- One page per entity (vulnerability type, HackerOne program, technique)
- Fields: Definition, Examples, Related Concepts, Source References
- Linked to: Concepts, Comparison pages

### Concept Pages (concepts/*.md)
- One page per methodology/technique/framework
- Fields: Description, When to Use, Steps, Related Entities, References
- Updated when new sources provide new angles

### Comparison Pages (comparisons/*.md)
- Comparative analysis between 2+ entities/concepts
- Auto-generated from queries
- Linked back to both subjects

### Synthesis Pages (synthesis/*.md)
- High-level insights combining multiple sources
- Generated during lint passes
- Updated with new evidence

## Operations

### Ingest: Add a new source
1. Source is analyzed by LLM native model
2. Key takeaways extracted
3. Wiki updated:
   - New entity/concept pages if needed
   - Existing pages updated with new info
   - Cross-references added
   - Contradictions flagged
4. Index updated
5. Log entry appended

### Query: Answer a question
1. Search index for relevant pages
2. Read those pages
3. Synthesize answer with citations
4. File valuable results as new wiki pages
5. Log the query

### Lint: Health check
1. Find orphan pages (no inbound links)
2. Find contradictions between pages
3. Find important concepts lacking pages
4. Find missing cross-references
5. Suggest new sources to investigate
6. Suggest new questions

## Frontmatter Convention
\`\`\`yaml
---
title: Page Title
category: entity|concept|comparison|synthesis
tags: [tag1, tag2]
sources: [source-id-1, source-id-2]
created: 2026-04-22
updated: 2026-04-22
confidence: 0.85
---
\`\`\`

## Linking Convention
- Internal: [Link Text](page-name.md)
- Source refs: [Source](../sources/source-id.md)
- Bidirectional: LLM maintains backlinks

## Index.md Format
\`\`\`
# Wiki Index

## Entities (15 pages)
- [Vulnerability Type](entities/xss.md) — Cross-site scripting variants
- ...

## Concepts (20 pages)
- [Recon Methodology](concepts/recon.md) — Information gathering
- ...

## Comparisons (8 pages)
- [SQL Injection vs NoSQL Injection](comparisons/sql-vs-nosql.md)
- ...

## Synthesis (5 pages)
- [2026 Vulnerability Trends](synthesis/trends-2026.md)
- ...
\`\`\`

## Log.md Format
\`\`\`
# Wiki Operation Log

## [2026-04-22] ingest | HackerOne Top 100 Programs Analysis
Updated 8 entity pages, created 3 new concept pages

## [2026-04-22] query | "What vulnerabilities are most valuable in 2026?"
Filed result as synthesis/trends-2026.md

## [2026-04-22] lint | Weekly health check
Found 2 orphan pages, 1 contradiction, suggested 3 new sources
\`\`\`
`;

      fs.writeFileSync(this.schemaPath, schema);
      console.log(`[Wiki] Schema initialized at ${this.schemaPath}`);
    }
  }

  /**
   * INGEST: Process a new source and update wiki
   */
  async ingestSource(sourceFile: string, title: string, type: string): Promise<WikiSource> {
    console.log(`\n[Wiki] 📥 Ingesting: ${title}`);

    // 1. Read source
    const sourcePath = path.join(this.rawSourcesDir, sourceFile);
    const sourceContent = fs.readFileSync(sourcePath, 'utf-8');

    // 2. Analyze with native model
    const analysis = jarvisNativeModel.generate({
      query: `Analyze this source and extract: key takeaways, main concepts, important entities, and contradictions with existing knowledge.\n\n${sourceContent.slice(0, 2000)}...`,
      mode: 'fivephase',
    });

    // 3. Create source record
    const sourceId = `source-${Date.now()}`;
    const source: WikiSource = {
      id: sourceId,
      filename: sourceFile,
      title,
      type: type as any,
      addedAt: Date.now(),
      summary: analysis.text.slice(0, 500),
      keyTakeaways: this.extractKeyTakeaways(analysis.text),
      tags: this.extractTags(analysis.text),
      sourceUrl: '',
    };

    this.sources.set(sourceId, source);

    // 4. Update wiki pages
    await this.updateWikiForSource(source, sourceContent);

    // 5. Update index
    this.updateIndex();

    // 6. Log
    this.addLogEntry('ingest', title, `Added ${source.keyTakeaways.length} key takeaways`);

    console.log(`[Wiki] ✅ Ingested: ${title} (updated ${this.pages.size} pages)`);
    return source;
  }

  /**
   * Update wiki pages based on new source
   */
  private async updateWikiForSource(source: WikiSource, content: string): Promise<void> {
    // Extract entities
    const entities = this.extractEntities(content);
    for (const entity of entities) {
      await this.updateOrCreateEntityPage(entity, source);
    }

    // Extract concepts
    const concepts = this.extractConcepts(content);
    for (const concept of concepts) {
      await this.updateOrCreateConceptPage(concept, source);
    }

    // Check for contradictions
    const contradictions = this.findContradictions(content);
    if (contradictions.length > 0) {
      await this.createContradictionNote(source, contradictions);
    }
  }

  /**
   * QUERY: Answer question by synthesizing wiki
   */
  async queryWiki(question: string): Promise<{ answer: string; sources: string[]; newPage?: string }> {
    console.log(`\n[Wiki] 🔍 Query: ${question}`);

    // 1. Search index
    const relevantPages = this.searchIndex(question);
    console.log(`[Wiki] Found ${relevantPages.length} relevant pages`);

    // 2. Read relevant pages
    const pageContents = relevantPages.map(filename => {
      const page = this.pages.get(filename);
      return page ? `# ${page.title}\n${page.content}` : '';
    });

    // 3. Synthesize answer
    const synthesis = jarvisNativeModel.generate({
      query: `Answer this question using the following wiki pages:\n\nQuestion: ${question}\n\nPages:\n${pageContents.join('\n\n---\n')}`,
      mode: 'fivephase',
    });

    // 4. File valuable results
    const shouldCreatePage = this.isValueableInsight(synthesis.text);
    let newPage = '';
    if (shouldCreatePage) {
      newPage = await this.createSynthesisPage(question, synthesis.text, relevantPages);
    }

    // 5. Log
    this.addLogEntry('query', question, `Generated answer from ${relevantPages.length} pages`);

    return {
      answer: synthesis.text,
      sources: relevantPages,
      newPage,
    };
  }

  /**
   * LINT: Health check and maintenance
   */
  async lintWiki(): Promise<{ issues: string[]; suggestions: string[] }> {
    console.log(`\n[Wiki] 🔧 Running health check...`);

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Find orphan pages
    const orphans = this.findOrphanPages();
    if (orphans.length > 0) {
      issues.push(`Found ${orphans.length} orphan pages: ${orphans.join(', ')}`);
    }

    // Find contradictions
    const contradictions = this.scanForContradictions();
    if (contradictions.length > 0) {
      issues.push(`Found ${contradictions.length} potential contradictions`);
    }

    // Find missing cross-references
    const missing = this.findMissingLinks();
    if (missing.length > 0) {
      issues.push(`${missing.length} pages could benefit from additional cross-references`);
    }

    // Suggest new concepts
    const suggestedConcepts = this.suggestNewConcepts();
    suggestions.push(
      ...suggestedConcepts.map(c => `Consider creating concept page: ${c}`)
    );

    // Suggest sources
    const suggestedSources = this.suggestNewSources();
    suggestions.push(
      ...suggestedSources.map(s => `Consider investigating: ${s}`)
    );

    // Log
    this.addLogEntry('lint', 'Health Check', `${issues.length} issues, ${suggestions.length} suggestions`);

    console.log(`[Wiki] Issues: ${issues.length}, Suggestions: ${suggestions.length}`);
    return { issues, suggestions };
  }

  /**
   * Helper methods
   */

  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+?)$/m);
    return match ? match[1] : 'Untitled';
  }

  private classifyPage(filename: string): 'entity' | 'concept' | 'comparison' | 'synthesis' | 'index' | 'log' {
    if (filename.includes('entities/')) return 'entity';
    if (filename.includes('concepts/')) return 'concept';
    if (filename.includes('comparisons/')) return 'comparison';
    if (filename.includes('synthesis/')) return 'synthesis';
    return 'index';
  }

  private extractLinks(content: string): string[] {
    const matches = content.match(/\[.+?\]\((.+?\.md)\)/g) || [];
    return matches.map(m => m.replace(/.*\((.+?)\).*/, '$1'));
  }

  private extractSourceRefs(content: string): string[] {
    const matches = content.match(/source-\d+/g) || [];
    return [...new Set(matches)];
  }

  private extractEntities(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const entities = new Set<string>();

    // Common security entities
    const patterns = [
      /(?:xss|sql injection|csrf|idor|rce|lfi|auth bypass|rate limit)/gi,
      /(?:hackerone|bugbounty|vulnerability|exploit|payload)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern) || [];
      matches.forEach(m => entities.add(m.toLowerCase()));
    }

    return Array.from(entities);
  }

  private extractConcepts(content: string): string[] {
    const concepts = new Set<string>();

    // Common methodologies
    const keywords = [
      'reconnaissance',
      'enumeration',
      'exploitation',
      'privilege escalation',
      'lateral movement',
      'persistence',
    ];

    keywords.forEach(k => {
      if (content.toLowerCase().includes(k)) {
        concepts.add(k);
      }
    });

    return Array.from(concepts);
  }

  private extractKeyTakeaways(text: string): string[] {
    // Simple heuristic: sentences with keywords
    const sentences = text.split(/\.\s+/);
    return sentences
      .filter(s => s.length > 20 && (s.includes('key') || s.includes('important') || s.includes('notable')))
      .slice(0, 5);
  }

  private extractTags(text: string): string[] {
    const tags = new Set<string>();
    const tagPatterns = [/security|vulnerability|exploit|technique|methodology/gi];

    for (const pattern of tagPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(m => tags.add(m.toLowerCase()));
    }

    return Array.from(tags);
  }

  private async updateOrCreateEntityPage(entity: string, source: WikiSource): Promise<void> {
    const filename = `entities/${entity.replace(/\s+/g, '-').toLowerCase()}.md`;

    let page = this.pages.get(filename);
    if (!page) {
      page = {
        filename,
        title: entity,
        category: 'entity',
        content: `# ${entity}\n\n## Definition\n\n## Examples\n\n## Related Concepts\n\n## Sources\n`,
        backlinks: [],
        outgoingLinks: [],
        sourceReferences: [source.id],
        lastUpdated: Date.now(),
        version: 1,
      };
    } else {
      page.sourceReferences.push(source.id);
      page.lastUpdated = Date.now();
      page.version++;
    }

    this.pages.set(filename, page);
    this.savePage(filename, page);
  }

  private async updateOrCreateConceptPage(concept: string, source: WikiSource): Promise<void> {
    const filename = `concepts/${concept.replace(/\s+/g, '-').toLowerCase()}.md`;

    let page = this.pages.get(filename);
    if (!page) {
      page = {
        filename,
        title: concept,
        category: 'concept',
        content: `# ${concept}\n\n## Description\n\n## When to Use\n\n## Steps\n\n## Related\n\n## Sources\n`,
        backlinks: [],
        outgoingLinks: [],
        sourceReferences: [source.id],
        lastUpdated: Date.now(),
        version: 1,
      };
    } else {
      page.sourceReferences.push(source.id);
      page.lastUpdated = Date.now();
      page.version++;
    }

    this.pages.set(filename, page);
    this.savePage(filename, page);
  }

  private findContradictions(content: string): string[] {
    // Simple heuristic: look for contradictory keywords
    const contradictions: string[] = [];

    if (content.match(/however|but|contrary|contradicts|unlike|different from/i)) {
      contradictions.push('Potential contradiction detected');
    }

    return contradictions;
  }

  private async createContradictionNote(source: WikiSource, contradictions: string[]): Promise<void> {
    const filename = `synthesis/contradictions-${Date.now()}.md`;
    const content = `# Contradiction Note from ${source.title}\n\n${contradictions.join('\n')}`;

    this.pages.set(filename, {
      filename,
      title: `Contradiction: ${source.title}`,
      category: 'synthesis',
      content,
      backlinks: [],
      outgoingLinks: [],
      sourceReferences: [source.id],
      lastUpdated: Date.now(),
      version: 1,
    });

    this.savePage(filename, this.pages.get(filename)!);
  }

  private searchIndex(question: string): string[] {
    const relevantPages: string[] = [];
    const questionWords = question.toLowerCase().split(/\s+/);

    for (const [filename, page] of this.pages) {
      const pageText = (page.title + ' ' + page.content).toLowerCase();
      const matches = questionWords.filter(w => pageText.includes(w)).length;

      if (matches > 0) {
        relevantPages.push(filename);
      }
    }

    return relevantPages.sort((a, b) => {
      const aScore = this.pages.get(a)?.sourceReferences.length || 0;
      const bScore = this.pages.get(b)?.sourceReferences.length || 0;
      return bScore - aScore;
    });
  }

  private isValueableInsight(text: string): boolean {
    // Check if this is a novel insight worth filing
    return (
      text.length > 200 &&
      (text.includes('discover') || text.includes('insight') || text.includes('compare'))
    );
  }

  private async createSynthesisPage(
    question: string,
    answer: string,
    sources: string[]
  ): Promise<string> {
    const filename = `synthesis/${question.replace(/\s+/g, '-').toLowerCase().slice(0, 50)}.md`;

    const content = `# ${question}\n\n${answer}\n\n## Sources\n${sources.map(s => `- [${s}](${s})`).join('\n')}`;

    this.pages.set(filename, {
      filename,
      title: question,
      category: 'synthesis',
      content,
      backlinks: [],
      outgoingLinks: sources,
      sourceReferences: sources,
      lastUpdated: Date.now(),
      version: 1,
    });

    this.savePage(filename, this.pages.get(filename)!);
    return filename;
  }

  private findOrphanPages(): string[] {
    const orphans: string[] = [];

    for (const [filename, page] of this.pages) {
      if (filename === 'index.md' || filename === 'log.md') continue;

      let inboundLinks = 0;
      for (const other of this.pages.values()) {
        if (other.outgoingLinks.includes(filename)) {
          inboundLinks++;
        }
      }

      if (inboundLinks === 0) {
        orphans.push(filename);
      }
    }

    return orphans;
  }

  private scanForContradictions(): string[] {
    const contradictions: string[] = [];

    // Scan for conflicting claims
    for (const [filename, page] of this.pages) {
      if (page.content.match(/However|But|Unlike|Contradicts/i)) {
        contradictions.push(filename);
      }
    }

    return contradictions;
  }

  private findMissingLinks(): string[] {
    const missing: string[] = [];

    for (const [filename, page] of this.pages) {
      if (page.outgoingLinks.length === 0 && page.sourceReferences.length === 0) {
        missing.push(filename);
      }
    }

    return missing;
  }

  private suggestNewConcepts(): string[] {
    return [
      'API Enumeration Techniques',
      'WAF Detection Methods',
      'Authentication Bypass Patterns',
      'Data Exfiltration Strategies',
    ];
  }

  private suggestNewSources(): string[] {
    return [
      'Latest HackerOne vulnerability reports',
      'OWASP Top 10 2026 update',
      'Zero-day research papers',
    ];
  }

  private updateIndex(): void {
    let indexContent = '# Wiki Index\n\n';

    const byCategory: Record<string, string[]> = {
      entities: [],
      concepts: [],
      comparisons: [],
      synthesis: [],
    };

    for (const [filename, page] of this.pages) {
      if (filename === 'index.md' || filename === 'log.md') continue;

      const category = page.category === 'entity' ? 'entities' : `${page.category}s`;
      byCategory[category].push(`- [${page.title}](${filename})`);
    }

    for (const [category, pages] of Object.entries(byCategory)) {
      if (pages.length > 0) {
        indexContent += `## ${category.charAt(0).toUpperCase() + category.slice(1)} (${pages.length} pages)\n`;
        indexContent += pages.join('\n') + '\n\n';
      }
    }

    fs.writeFileSync(this.indexPath, indexContent);
  }

  private savePage(filename: string, page: WikiPage): void {
    const fullPath = path.join(this.wikiDir, filename);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, page.content);
  }

  private addLogEntry(action: string, title: string, details: string): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const entry = `\n## [${timestamp}] ${action} | ${title}\n${details}\n`;

    fs.appendFileSync(this.logPath, entry);

    this.log.push({
      timestamp: Date.now(),
      action: action as any,
      title,
      details,
    });
  }

  /**
   * Get wiki statistics
   */
  getStats() {
    return {
      totalSources: this.sources.size,
      totalPages: this.pages.size,
      pagesByCategory: this.getPagesByCategory(),
      recentOperations: this.log.slice(-10),
      totalLogSize: this.log.length,
    };
  }

  private getPagesByCategory(): Record<string, number> {
    const counts: Record<string, number> = {
      entity: 0,
      concept: 0,
      comparison: 0,
      synthesis: 0,
    };

    for (const page of this.pages.values()) {
      counts[page.category]++;
    }

    return counts;
  }
}

export const llmWikiSystem = new LLMWikiSystem('./jarvis-wiki');
