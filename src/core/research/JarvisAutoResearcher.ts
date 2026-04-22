/**
 * JARVIS AUTO RESEARCHER
 *
 * Sistema de auto-investigación que busca papers académicos de IA en arXiv
 * y Semantic Scholar, identifica gaps de conocimiento en Jarvis, y enseña
 * nuevos conceptos automáticamente. Se ejecuta diariamente en Railway.
 *
 * Flujo:
 * 1. Fetch papers de arXiv (gratis, sin API key)
 * 2. Extraer conceptos clave de abstracts
 * 3. Detectar gaps comparando contra knowledge graph actual
 * 4. Enseñar conceptos nuevos via selfProgrammingEngine
 * 5. Guardar reporte en Obsidian vault
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TIPOS
// ============================================

export interface ResearchPaper {
  title: string;
  abstract: string;
  authors: string[];
  published: string;
  arxivId: string;
  categories: string[];
  concepts: string[];
}

export interface KnowledgeGap {
  topic: string;
  domain: string;
  relevance: number;
  sourceCount: number;
  suggestedContent: string;
}

export interface ResearchSession {
  timestamp: string;
  papersFound: number;
  gapsIdentified: number;
  knowledgeAdded: number;
  topics: string[];
  summary: string;
  papers: ResearchPaper[];
  gaps: KnowledgeGap[];
}

// ============================================
// QUERIES DE BÚSQUEDA POR ÁREA
// ============================================

const RESEARCH_QUERIES = [
  { query: 'AI reasoning chain-of-thought', domain: 'analysis', category: 'ai-reasoning' },
  { query: 'conversational AI context understanding', domain: 'general', category: 'conversational' },
  { query: 'vulnerability detection machine learning', domain: 'security', category: 'security-ai' },
  { query: 'autonomous AI agent planning', domain: 'general', category: 'agentic' },
  { query: 'self-improving neural network knowledge', domain: 'selfImprovement', category: 'self-improvement' },
  { query: 'natural language understanding intent detection', domain: 'general', category: 'nlu' },
  { query: 'security bug detection static analysis AI', domain: 'security', category: 'security-ai' },
];

// Concepts that are already well-known to Jarvis (skip if found)
const KNOWN_CONCEPTS = new Set([
  'sql injection', 'xss', 'csrf', 'ssrf', 'idor', 'rce', 'lfi', 'xxe',
  'hackerone', 'bug bounty', 'cvss', 'vulnerability', 'exploit', 'payload',
  'reconnaissance', 'subdomain', 'pentest',
]);

// ============================================
// PARSER DE XML DE ARXIV
// ============================================

function parseArxivXML(xml: string): ResearchPaper[] {
  const papers: ResearchPaper[] = [];
  const entries = xml.split('<entry>').slice(1);

  for (const entry of entries) {
    try {
      const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() || '';
      const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim() || '';
      const published = extractTag(entry, 'published') || '';
      const id = extractTag(entry, 'id') || '';
      const arxivId = id.split('/abs/')[1]?.split('v')[0] || id;

      const authorMatches = entry.matchAll(/<name>([^<]+)<\/name>/g);
      const authors = [...authorMatches].map(m => m[1]).slice(0, 3);

      const catMatches = entry.matchAll(/term="([^"]+)"/g);
      const categories = [...catMatches].map(m => m[1]).filter(c => c.startsWith('cs.')).slice(0, 3);

      if (title && summary && title.length > 10) {
        papers.push({
          title,
          abstract: summary.substring(0, 600),
          authors,
          published: published.substring(0, 10),
          arxivId,
          categories,
          concepts: extractConcepts(title + ' ' + summary),
        });
      }
    } catch {
      // skip malformed entry
    }
  }

  return papers;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1] : null;
}

function extractConcepts(text: string): string[] {
  const lower = text.toLowerCase();
  const conceptPatterns = [
    /\b(chain.of.thought|cot reasoning)\b/gi,
    /\b(in.context learning|few.shot|zero.shot)\b/gi,
    /\b(transformer|attention mechanism|self.attention)\b/gi,
    /\b(reinforcement learning|rl agent|reward model)\b/gi,
    /\b(knowledge graph|knowledge base|ontology)\b/gi,
    /\b(intent detection|intent classification|nlu)\b/gi,
    /\b(context window|contextual embedding)\b/gi,
    /\b(adversarial training|adversarial examples)\b/gi,
    /\b(retrieval.augmented|rag|vector search)\b/gi,
    /\b(autonomous agent|multi.agent|agentic)\b/gi,
    /\b(static analysis|dynamic analysis|code analysis)\b/gi,
    /\b(anomaly detection|outlier detection)\b/gi,
    /\b(vulnerability|security flaw|security bug)\b/gi,
    /\b(prompt injection|jailbreak|alignment)\b/gi,
    /\b(continual learning|lifelong learning|meta.learning)\b/gi,
    /\b(hallucination|factual accuracy|grounding)\b/gi,
    /\b(reasoning trace|step.by.step|decomposition)\b/gi,
  ];

  const found = new Set<string>();
  for (const pat of conceptPatterns) {
    const matches = lower.match(pat);
    if (matches) matches.forEach(m => found.add(m.trim().replace(/\s+/g, ' ')));
  }
  return [...found].slice(0, 8);
}

// ============================================
// FETCHER HTTP
// ============================================

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'JarvisAutoResearcher/1.0 (jarvis-ia-bot)' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ============================================
// CLASE PRINCIPAL
// ============================================

export class JarvisAutoResearcher {
  private obsidianPath: string;
  private sessionsPath: string;
  private lastSession: ResearchSession | null = null;
  private isRunning = false;
  private dailyCronHandle: NodeJS.Timeout | null = null;

  constructor(baseDir: string = process.cwd()) {
    this.obsidianPath = path.join(baseDir, 'obsidian-vault', '04-INVESTIGACION');
    this.sessionsPath = path.join(baseDir, '.jarvis-research');
    this.ensureDirectories();
    this.loadLastSession();
  }

  private ensureDirectories(): void {
    [this.obsidianPath, this.sessionsPath].forEach(p => {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });
  }

  private loadLastSession(): void {
    const file = path.join(this.sessionsPath, 'last-session.json');
    if (fs.existsSync(file)) {
      try {
        this.lastSession = JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch { /* ignore */ }
    }
  }

  // ============================================
  // IDENTIFICACIÓN DE GAPS
  // ============================================

  identifyGaps(papers: ResearchPaper[], existingKnowledgeKeys: string[]): KnowledgeGap[] {
    const existingLower = existingKnowledgeKeys.map(k => k.toLowerCase());
    const conceptFrequency: Map<string, { count: number; domain: string; papers: ResearchPaper[] }> = new Map();

    for (const paper of papers) {
      const domain = this.inferDomainFromCategories(paper.categories, paper.concepts);
      for (const concept of paper.concepts) {
        const lower = concept.toLowerCase();
        if (KNOWN_CONCEPTS.has(lower)) continue;
        if (existingLower.some(k => k.includes(lower) || lower.includes(k))) continue;

        const entry = conceptFrequency.get(lower) || { count: 0, domain, papers: [] };
        entry.count++;
        if (entry.papers.length < 3) entry.papers.push(paper);
        conceptFrequency.set(lower, entry);
      }
    }

    const gaps: KnowledgeGap[] = [];
    for (const [topic, data] of conceptFrequency.entries()) {
      if (data.count < 1) continue;
      const relevance = Math.min(1.0, data.count / papers.length + 0.3);
      const samplePaper = data.papers[0];
      gaps.push({
        topic,
        domain: data.domain,
        relevance,
        sourceCount: data.count,
        suggestedContent: `Concepto de IA: "${topic}". Encontrado en ${data.count} paper(s). Ejemplo: "${samplePaper.title.substring(0, 80)}". Contexto: ${samplePaper.abstract.substring(0, 200)}`,
      });
    }

    return gaps.sort((a, b) => b.relevance - a.relevance).slice(0, 15);
  }

  private inferDomainFromCategories(categories: string[], concepts: string[]): string {
    const allText = [...categories, ...concepts].join(' ').toLowerCase();
    if (/vulnerab|security|exploit|attack|defense/.test(allText)) return 'security';
    if (/agent|planning|autonomous|agentic/.test(allText)) return 'general';
    if (/reasoning|inference|logic|chain/.test(allText)) return 'analysis';
    if (/code|program|static|dynamic/.test(allText)) return 'code';
    return 'general';
  }

  // ============================================
  // SESIÓN DE INVESTIGACIÓN PRINCIPAL
  // ============================================

  async runResearchSession(
    selfProgrammingAddKnowledge: (entry: { category: string; topic: string; content: string; confidence: number }) => void,
    existingKnowledgeKeys: string[] = [],
    maxQueriesPerSession = 3,
  ): Promise<ResearchSession> {
    if (this.isRunning) {
      throw new Error('Ya hay una sesión de investigación en curso');
    }
    this.isRunning = true;
    const startTime = Date.now();

    console.log('\n🔬 JARVIS AUTO-RESEARCHER: Iniciando sesión de investigación...');

    const allPapers: ResearchPaper[] = [];
    const queriesUsed = RESEARCH_QUERIES.slice(0, maxQueriesPerSession);
    const topicsSearched: string[] = [];

    try {
      for (const { query, domain, category } of queriesUsed) {
        const encoded = encodeURIComponent(query);
        const url = `https://export.arxiv.org/api/query?search_query=all:${encoded}&max_results=5&sortBy=submittedDate&sortOrder=descending`;

        console.log(`   🔍 Buscando: "${query}"...`);
        try {
          const xml = await httpsGet(url);
          const papers = parseArxivXML(xml);
          allPapers.push(...papers);
          topicsSearched.push(category);
          console.log(`   ✅ Encontrados ${papers.length} papers para "${query}"`);
        } catch (err: any) {
          console.warn(`   ⚠️  Error buscando "${query}": ${err.message}`);
        }

        // Pequeña pausa para no sobrecargar arXiv
        await new Promise(r => setTimeout(r, 1500));
      }

      // Identificar gaps
      const gaps = this.identifyGaps(allPapers, existingKnowledgeKeys);
      console.log(`\n🧠 Gaps de conocimiento identificados: ${gaps.length}`);

      // Enseñar conceptos nuevos a Jarvis
      let knowledgeAdded = 0;
      for (const gap of gaps.slice(0, 10)) {
        const catMap: Record<string, string> = {
          security: 'security',
          analysis: 'tools',
          code: 'tools',
          general: 'tools',
          selfImprovement: 'tools',
        };

        selfProgrammingAddKnowledge({
          category: catMap[gap.domain] || 'tools',
          topic: `[AutoResearch] ${gap.topic}`,
          content: gap.suggestedContent,
          confidence: gap.relevance * 0.85,
        });
        knowledgeAdded++;
        console.log(`   📥 Aprendido: "${gap.topic}" (relevancia: ${(gap.relevance * 100).toFixed(0)}%)`);
      }

      const elapsed = Date.now() - startTime;
      const session: ResearchSession = {
        timestamp: new Date().toISOString(),
        papersFound: allPapers.length,
        gapsIdentified: gaps.length,
        knowledgeAdded,
        topics: topicsSearched,
        summary: `Sesión completada en ${elapsed}ms. ${allPapers.length} papers analizados, ${gaps.length} gaps encontrados, ${knowledgeAdded} conceptos aprendidos.`,
        papers: allPapers.slice(0, 20),
        gaps: gaps.slice(0, 10),
      };

      this.lastSession = session;
      this.saveSession(session);
      this.saveObsidianNote(session);

      console.log(`\n✅ Investigación completada: ${knowledgeAdded} conceptos añadidos en ${elapsed}ms\n`);
      return session;

    } finally {
      this.isRunning = false;
    }
  }

  // ============================================
  // PERSISTENCIA
  // ============================================

  private saveSession(session: ResearchSession): void {
    const file = path.join(this.sessionsPath, 'last-session.json');
    fs.writeFileSync(file, JSON.stringify(session, null, 2));

    const historyFile = path.join(this.sessionsPath, `session-${Date.now()}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(session, null, 2));

    // Keep only last 30 sessions
    const allFiles = fs.readdirSync(this.sessionsPath)
      .filter(f => f.startsWith('session-'))
      .sort()
      .reverse();
    for (const f of allFiles.slice(30)) {
      fs.unlinkSync(path.join(this.sessionsPath, f));
    }
  }

  private saveObsidianNote(session: ResearchSession): void {
    const ts = new Date(session.timestamp).toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `INVESTIGACION_${ts}.md`;
    const filepath = path.join(this.obsidianPath, filename);

    const topPapers = session.papers.slice(0, 5).map(p =>
      `- **${p.title.substring(0, 80)}** (${p.published})\n  ${p.abstract.substring(0, 150)}...`
    ).join('\n');

    const topGaps = session.gaps.slice(0, 8).map(g =>
      `- **${g.topic}** — relevancia ${(g.relevance * 100).toFixed(0)}%, ${g.sourceCount} fuentes (dominio: ${g.domain})`
    ).join('\n');

    const content = `# Sesión de Auto-Investigación ${ts}

## Resumen
${session.summary}

## Estadísticas
- Papers analizados: ${session.papersFound}
- Gaps identificados: ${session.gapsIdentified}
- Conocimiento añadido: ${session.knowledgeAdded} entradas
- Áreas investigadas: ${session.topics.join(', ')}

## Gaps de Conocimiento Detectados
${topGaps || 'Ninguno (conocimiento al día)'}

## Papers Más Relevantes
${topPapers || 'Sin papers encontrados'}

---
*Generado automáticamente por JarvisAutoResearcher*
`;

    fs.writeFileSync(filepath, content);
  }

  // ============================================
  // CRON DIARIO
  // ============================================

  startDailyCron(
    selfProgrammingAddKnowledge: (entry: { category: string; topic: string; content: string; confidence: number }) => void,
    existingKnowledgeKeys: () => string[],
    intervalHours = 24,
  ): void {
    if (this.dailyCronHandle) {
      clearInterval(this.dailyCronHandle);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    console.log(`⏰ JarvisAutoResearcher: cron diario iniciado (cada ${intervalHours}h)`);

    // Run immediately on start (after 30s delay to let server stabilize)
    setTimeout(() => {
      this.runResearchSession(selfProgrammingAddKnowledge, existingKnowledgeKeys()).catch(err => {
        console.error('AutoResearcher initial run error:', err.message);
      });
    }, 30000);

    this.dailyCronHandle = setInterval(() => {
      this.runResearchSession(selfProgrammingAddKnowledge, existingKnowledgeKeys()).catch(err => {
        console.error('AutoResearcher daily run error:', err.message);
      });
    }, intervalMs);
  }

  stopDailyCron(): void {
    if (this.dailyCronHandle) {
      clearInterval(this.dailyCronHandle);
      this.dailyCronHandle = null;
      console.log('⏹️  JarvisAutoResearcher: cron detenido');
    }
  }

  // ============================================
  // STATUS Y ESTADÍSTICAS
  // ============================================

  getStatus(): object {
    const sessionFiles = fs.existsSync(this.sessionsPath)
      ? fs.readdirSync(this.sessionsPath).filter(f => f.startsWith('session-')).length
      : 0;

    return {
      isRunning: this.isRunning,
      cronActive: this.dailyCronHandle !== null,
      totalSessionsRun: sessionFiles,
      lastSession: this.lastSession ? {
        timestamp: this.lastSession.timestamp,
        papersFound: this.lastSession.papersFound,
        knowledgeAdded: this.lastSession.knowledgeAdded,
        gapsIdentified: this.lastSession.gapsIdentified,
        topics: this.lastSession.topics,
        summary: this.lastSession.summary,
      } : null,
      obsidianPath: this.obsidianPath,
      scheduledQueries: RESEARCH_QUERIES.length,
    };
  }

  getLastSession(): ResearchSession | null {
    return this.lastSession;
  }
}

export const jarvisAutoResearcher = new JarvisAutoResearcher();
