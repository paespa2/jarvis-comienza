/**
 * JARVIS AUTO RESEARCHER
 *
 * Sistema de auto-investigación que busca papers académicos de IA en:
 * - arXiv (gratis, sin API key) — papers recientes de cs.AI / cs.CR
 * - transformer-circuits.pub (Anthropic) — investigación de interpretabilidad
 *
 * Flujo:
 * 1. Fetch papers de arXiv + transformer-circuits.pub
 * 2. Extraer conceptos clave de abstracts y contenido
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
  url?: string;
  source: 'arxiv' | 'transformer-circuits' | 'other';
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
          source: 'arxiv',
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
    // General AI reasoning
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
    // Anthropic interpretability (transformer-circuits.pub)
    /\b(monosemanticity|polysemanticity|superposition)\b/gi,
    /\b(sparse autoencoder|sae|dictionary learning)\b/gi,
    /\b(mechanistic interpretability|circuit analysis|feature visualization)\b/gi,
    /\b(attention head|mlp layer|residual stream)\b/gi,
    /\b(feature geometry|linear representation|representation engineering)\b/gi,
    /\b(induction head|copy suppression|inhibition)\b/gi,
    /\b(activation patching|causal tracing|causal mediation)\b/gi,
    /\b(universal approximation|emergent behavior|phase transition)\b/gi,
    /\b(token prediction|next token|autoregressive)\b/gi,
    /\b(steering vector|concept activation|probing classifier)\b/gi,
    /\b(circuit discovery|path patching|node ablation)\b/gi,
    /\b(scaling laws?|neural scaling|chinchilla)\b/gi,
    /\b(interpretable feature|latent space|embedding space)\b/gi,
  ];

  const found = new Set<string>();
  for (const pat of conceptPatterns) {
    const matches = lower.match(pat);
    if (matches) matches.forEach(m => found.add(m.trim().replace(/\s+/g, ' ')));
  }
  return [...found].slice(0, 12);
}

// ============================================
// TRANSFORMER-CIRCUITS.PUB SCRAPER
// ============================================

const TC_BASE_URL = 'https://transformer-circuits.pub';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPaperLinks(indexHtml: string): string[] {
  const links: string[] = [];
  // Match hrefs like "2024/scaling-monosemanticity/index.html" or "/2024/paper/index.html"
  const pattern = /href="([/]?\d{4}\/[^"]+\/index\.html)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(indexHtml)) !== null) {
    const href = match[1].startsWith('/') ? match[1] : '/' + match[1];
    const full = TC_BASE_URL + href;
    if (!links.includes(full)) links.push(full);
  }
  return links;
}

function parseTCPaper(html: string, url: string): ResearchPaper | null {
  // Title: from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].replace(/\s*[|–-].*$/, '').trim() : '';
  if (!rawTitle || rawTitle.length < 5) return null;

  // Extract year from URL
  const yearMatch = url.match(/\/(\d{4})\//);
  const year = yearMatch ? yearMatch[1] : '2024';

  // Authors: look for byline patterns like "By Chris Olah" or meta author
  const authorMeta = html.match(/<meta[^>]+name="author"[^>]+content="([^"]+)"/i);
  const bylineMatch = html.match(/[Bb]y\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+(?:,\s+[A-Z][a-z]+(?: [A-Z][a-z]+)+)*)/);
  const authorsRaw = authorMeta ? authorMeta[1] : (bylineMatch ? bylineMatch[1] : 'Anthropic');
  const authors = authorsRaw.split(/,\s*/).slice(0, 4).map(a => a.trim());

  // Abstract: first few substantial <p> tags after <body>, skipping navigation
  // We strip script/style first, then grab paragraphs
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Find paragraphs — take first 3 that are > 80 chars (likely real content)
  const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pPattern.exec(bodyContent)) !== null && paragraphs.length < 5) {
    const text = stripHtml(pMatch[1]).trim();
    if (text.length > 80 && !text.toLowerCase().startsWith('cite') && !text.startsWith('©')) {
      paragraphs.push(text);
    }
  }

  const abstract = paragraphs.slice(0, 2).join(' ').substring(0, 700);
  if (abstract.length < 50) return null;

  const fullText = rawTitle + ' ' + abstract;

  return {
    title: rawTitle,
    abstract,
    authors,
    published: year + '-01-01',
    arxivId: '',
    url,
    source: 'transformer-circuits',
    categories: ['interpretability', 'mechanistic-interpretability', 'cs.LG'],
    concepts: extractConcepts(fullText),
  };
}

async function fetchTransformerCircuitsPapers(maxPapers = 6): Promise<ResearchPaper[]> {
  console.log('   🔬 Fetching transformer-circuits.pub index...');
  const papers: ResearchPaper[] = [];

  try {
    const indexHtml = await httpsGet(`${TC_BASE_URL}/`);
    const paperLinks = extractPaperLinks(indexHtml);
    console.log(`   📄 Found ${paperLinks.length} papers on transformer-circuits.pub`);

    // Process most recent papers (links appear newest-first)
    const toFetch = paperLinks.slice(0, maxPapers);

    for (const url of toFetch) {
      try {
        console.log(`   📖 Fetching: ${url.replace(TC_BASE_URL, '')}`);
        const html = await httpsGet(url);
        const paper = parseTCPaper(html, url);
        if (paper) {
          papers.push(paper);
          console.log(`   ✅ Parsed: "${paper.title.substring(0, 60)}" | concepts: ${paper.concepts.length}`);
        }
        // Respectful delay between requests
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        console.warn(`   ⚠️  Could not fetch ${url}: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.warn(`   ⚠️  transformer-circuits.pub index failed: ${err.message}`);
  }

  return papers;
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
      // --- Source 1: arXiv ---
      for (const { query, domain, category } of queriesUsed) {
        const encoded = encodeURIComponent(query);
        const url = `https://export.arxiv.org/api/query?search_query=all:${encoded}&max_results=5&sortBy=submittedDate&sortOrder=descending`;

        console.log(`   🔍 arXiv: "${query}"...`);
        try {
          const xml = await httpsGet(url);
          const papers = parseArxivXML(xml);
          allPapers.push(...papers);
          topicsSearched.push(category);
          console.log(`   ✅ ${papers.length} papers para "${query}"`);
        } catch (err: any) {
          console.warn(`   ⚠️  Error buscando "${query}": ${err.message}`);
        }

        // Pequeña pausa para no sobrecargar arXiv
        await new Promise(r => setTimeout(r, 1500));
      }

      // --- Source 2: transformer-circuits.pub (Anthropic) ---
      console.log(`\n   🧠 Leyendo transformer-circuits.pub (Anthropic interpretability)...`);
      try {
        const tcPapers = await fetchTransformerCircuitsPapers(6);
        allPapers.push(...tcPapers);
        if (tcPapers.length > 0) {
          topicsSearched.push('transformer-circuits');
          console.log(`   ✅ ${tcPapers.length} papers de transformer-circuits.pub`);
        }
      } catch (err: any) {
        console.warn(`   ⚠️  transformer-circuits.pub error: ${err.message}`);
      }

      // Identificar gaps
      const gaps = this.identifyGaps(allPapers, existingKnowledgeKeys);
      console.log(`\n🧠 Gaps de conocimiento identificados: ${gaps.length}`);

      // Enseñar también los papers de transformer-circuits directamente (alta confianza)
      const tcPapers = allPapers.filter(p => p.source === 'transformer-circuits');
      for (const paper of tcPapers.slice(0, 6)) {
        if (paper.abstract.length > 100) {
          selfProgrammingAddKnowledge({
            category: 'reasoning',
            topic: `[Anthropic] ${paper.title.substring(0, 60)}`,
            content: `Anthropic interpretability research (${paper.published.substring(0, 4)}). URL: ${paper.url}. Resumen: ${paper.abstract.substring(0, 400)}. Conceptos clave: ${paper.concepts.join(', ')}.`,
            confidence: 0.95,
          });
          console.log(`   🔬 Aprendido (Anthropic): "${paper.title.substring(0, 55)}..."`);
        }
      }

      // Enseñar conceptos nuevos identificados como gaps
      let knowledgeAdded = tcPapers.filter(p => p.abstract.length > 100).length;
      for (const gap of gaps.slice(0, 10)) {
        const catMap: Record<string, string> = {
          security: 'security',
          analysis: 'reasoning',
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

    const tcPapers = session.papers.filter(p => p.source === 'transformer-circuits');
    const arxivPapers = session.papers.filter(p => p.source === 'arxiv');

    const formatPaper = (p: ResearchPaper) => {
      const urlNote = p.url ? `\n  🔗 ${p.url}` : '';
      return `- **${p.title.substring(0, 90)}** (${p.published.substring(0, 4)})${urlNote}\n  ${p.abstract.substring(0, 200)}...`;
    };

    const tcSection = tcPapers.length > 0
      ? tcPapers.slice(0, 6).map(formatPaper).join('\n')
      : '_Ninguno en esta sesión_';

    const arxivSection = arxivPapers.slice(0, 4).map(formatPaper).join('\n') || '_Ninguno_';

    const topGaps = session.gaps.slice(0, 8).map(g =>
      `- **${g.topic}** — relevancia ${(g.relevance * 100).toFixed(0)}%, ${g.sourceCount} fuentes (dominio: ${g.domain})`
    ).join('\n');

    const content = `# Sesión de Auto-Investigación ${ts}

## Resumen
${session.summary}

## Estadísticas
- Papers analizados: ${session.papersFound} (${tcPapers.length} Anthropic + ${arxivPapers.length} arXiv)
- Gaps identificados: ${session.gapsIdentified}
- Conocimiento añadido: ${session.knowledgeAdded} entradas
- Fuentes: ${session.topics.join(', ')}

## 🔬 Anthropic — transformer-circuits.pub
${tcSection}

## 📄 arXiv — Papers Recientes
${arxivSection}

## 🧠 Gaps de Conocimiento Detectados
${topGaps || '_Ninguno — conocimiento al día_'}

---
*Generado automáticamente por JarvisAutoResearcher*
*Fuente verificada: https://transformer-circuits.pub (Anthropic Research)*
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
