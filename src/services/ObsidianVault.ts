/**
 * OBSIDIAN VAULT SERVICE
 *
 * Gestiona el conocimiento persistente de JARVIS usando Obsidian.
 * Cada nota es markdown con tags, cada aprendizaje se persiste.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  type: 'case' | 'skill' | 'finding' | 'technique' | 'learning' | 'memory';
}

export interface SearchResult {
  notes: VaultNote[];
  context: string;
}

class ObsidianVault {
  private vaultPath: string;
  private notesPath: string;

  constructor(vaultPath: string = './.vault') {
    this.vaultPath = vaultPath;
    this.notesPath = path.join(vaultPath, 'notes');
    this.initialize();
  }

  private initialize(): void {
    // Crear estructura de carpetas
    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true });
    }

    if (!fs.existsSync(this.notesPath)) {
      fs.mkdirSync(this.notesPath, { recursive: true });
    }

    // Crear .obsidian config si no existe
    const obsidianDir = path.join(this.vaultPath, '.obsidian');
    if (!fs.existsSync(obsidianDir)) {
      fs.mkdirSync(obsidianDir, { recursive: true });

      // Config mínima de Obsidian
      const config = {
        version: 13,
        showLineNumber: true,
        newFileLocation: 'current',
        newFilePath: '',
        newFileNameFormat: '{{DATE:YYYY-MM-DD}}_{{name}}',
        defaultViewMode: 'source'
      };

      fs.writeFileSync(
        path.join(obsidianDir, 'app.json'),
        JSON.stringify(config, null, 2)
      );
    }

    console.log(`[ObsidianVault] ✅ Initialized at ${this.vaultPath}`);
  }

  /**
   * Guardar una nota en el vault
   */
  async saveNote(
    title: string,
    content: string,
    type: VaultNote['type'],
    tags: string[] = []
  ): Promise<VaultNote> {
    const id = this.generateId();
    const now = new Date();

    const note: VaultNote = {
      id,
      title,
      content,
      tags,
      createdAt: now,
      updatedAt: now,
      type
    };

    // Crear archivo markdown con frontmatter
    const markdown = this.noteToMarkdown(note);
    const filename = `${id}_${this.slugify(title)}.md`;
    const filepath = path.join(this.notesPath, filename);

    fs.writeFileSync(filepath, markdown, 'utf-8');

    console.log(`[ObsidianVault] 📝 Saved note: ${title} (${type})`);
    return note;
  }

  /**
   * Buscar notas por tag o contenido
   */
  async search(query: string, tag?: string): Promise<SearchResult> {
    const files = fs.readdirSync(this.notesPath).filter(f => f.endsWith('.md'));
    const results: VaultNote[] = [];

    const lowerQuery = query.toLowerCase();

    for (const file of files) {
      const filepath = path.join(this.notesPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const note = this.parseMarkdown(content);

      // Filtrar por tag si se especifica
      if (tag && !note.tags.includes(tag)) continue;

      // Buscar en título o contenido
      if (
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
      ) {
        results.push(note);
      }
    }

    // Ordenar por relevancia (fecha más reciente primero)
    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Generar contexto resumido para LLM
    const context = this.generateContext(results.slice(0, 5));

    return { notes: results, context };
  }

  /**
   * Obtener notas por tipo (cases, skills, findings, etc)
   */
  async getByType(type: VaultNote['type']): Promise<VaultNote[]> {
    const files = fs.readdirSync(this.notesPath).filter(f => f.endsWith('.md'));
    const results: VaultNote[] = [];

    for (const file of files) {
      const filepath = path.join(this.notesPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const note = this.parseMarkdown(content);

      if (note.type === type) {
        results.push(note);
      }
    }

    return results;
  }

  /**
   * Obtener contexto reciente para usar en prompts del LLM
   */
  async getRecentContext(limit: number = 5): Promise<string> {
    const files = fs.readdirSync(this.notesPath).filter(f => f.endsWith('.md'));
    const notes: VaultNote[] = [];

    for (const file of files) {
      const filepath = path.join(this.notesPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      notes.push(this.parseMarkdown(content));
    }

    // Ordenar por actualización reciente
    notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return this.generateContext(notes.slice(0, limit));
  }

  /**
   * Crear una nota de "aprendizaje" desde una interacción
   */
  async recordLearning(
    topic: string,
    insight: string,
    evidence: string
  ): Promise<VaultNote> {
    const title = `Learning: ${topic} @ ${new Date().toISOString().split('T')[0]}`;
    const content = `## Topic\n${topic}\n\n## Insight\n${insight}\n\n## Evidence\n${evidence}`;

    return this.saveNote(title, content, 'learning', ['auto-generated', 'learning']);
  }

  /**
   * Registrar un caso/vulnerabilidad encontrada
   */
  async recordCase(
    target: string,
    vulnerability: string,
    severity: string,
    details: string
  ): Promise<VaultNote> {
    const title = `Case: ${target} - ${vulnerability}`;
    const content = `## Target\n${target}\n\n## Vulnerability\n${vulnerability}\n\n## Severity\n${severity}\n\n## Details\n${details}`;

    return this.saveNote(title, content, 'case', ['vulnerability', severity.toLowerCase()]);
  }

  /**
   * Exportar vault a JSON (útil para backup)
   */
  async export(): Promise<VaultNote[]> {
    const files = fs.readdirSync(this.notesPath).filter(f => f.endsWith('.md'));
    const notes: VaultNote[] = [];

    for (const file of files) {
      const filepath = path.join(this.notesPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      notes.push(this.parseMarkdown(content));
    }

    return notes;
  }

  /**
   * Contar notas por tipo
   */
  async getStats(): Promise<Record<string, number>> {
    const files = fs.readdirSync(this.notesPath).filter(f => f.endsWith('.md'));
    const stats: Record<string, number> = {
      total: files.length,
      cases: 0,
      skills: 0,
      findings: 0,
      learnings: 0,
      memories: 0
    };

    for (const file of files) {
      const filepath = path.join(this.notesPath, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const note = this.parseMarkdown(content);
      if (stats[note.type]) stats[note.type]++;
    }

    return stats;
  }

  // ============ PRIVATE HELPERS ============

  private noteToMarkdown(note: VaultNote): string {
    const frontmatter = `---
id: ${note.id}
title: ${note.title}
type: ${note.type}
tags: [${note.tags.map(t => `"${t}"`).join(', ')}]
created: ${note.createdAt.toISOString()}
updated: ${note.updatedAt.toISOString()}
---`;

    return `${frontmatter}\n\n${note.content}`;
  }

  private parseMarkdown(markdown: string): VaultNote {
    const lines = markdown.split('\n');
    let inFrontmatter = false;
    let frontmatterLines: string[] = [];

    // Extraer frontmatter
    for (const line of lines) {
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          break;
        }
      } else if (inFrontmatter) {
        frontmatterLines.push(line);
      }
    }

    // Parsear frontmatter
    const frontmatter: Record<string, any> = {};
    for (const line of frontmatterLines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (key.trim() === 'tags') {
        frontmatter.tags = value
          .replace(/\[|\]/g, '')
          .split(',')
          .map(t => t.trim().replace(/"/g, ''));
      } else {
        frontmatter[key.trim()] = value;
      }
    }

    // Extraer contenido después del frontmatter
    const contentStart = markdown.indexOf('---', 3) + 3;
    const content = markdown.substring(contentStart).trim();

    return {
      id: frontmatter.id || this.generateId(),
      title: frontmatter.title || 'Untitled',
      content,
      tags: frontmatter.tags || [],
      createdAt: frontmatter.created ? new Date(frontmatter.created) : new Date(),
      updatedAt: frontmatter.updated ? new Date(frontmatter.updated) : new Date(),
      type: frontmatter.type || 'memory'
    };
  }

  private generateContext(notes: VaultNote[]): string {
    if (notes.length === 0) {
      return 'No relevant context found in vault.';
    }

    const context = notes
      .map(
        note =>
          `[${note.type.toUpperCase()}] ${note.title}\nTags: ${note.tags.join(', ')}\n${note.content.substring(0, 200)}...`
      )
      .join('\n\n---\n\n');

    return `## JARVIS Knowledge Base Context\n\n${context}`;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }

  private generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const obsidianVault = new ObsidianVault();
