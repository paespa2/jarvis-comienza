/**
 * GITHUB LEARNING REPOSITORY
 *
 * Sistema de aprendizaje persistente basado en Git
 * Jarvis almacena conocimiento en repositorio Git versionado
 * - Técnicas aprendidas
 * - Mejoras aplicadas
 * - Insights y patrones
 * - Código generado
 *
 * Ventajas sobre Firebase/Obsidian:
 * - Control de versiones automático
 * - Auditoría completa de cambios
 * - Sincronización confiable
 * - Reutilización en diferentes contextos
 *
 * ✨ FASE 5: Aprendizaje Persistente con Git
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync, spawn } from 'child_process';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

export interface LearnedTechnique {
  id: string;
  name: string;
  category: string; // 'security' | 'coding' | 'analysis' | 'automation'
  description: string;
  steps: string[];
  examples: string[];
  tools: string[];
  successRate: number;
  timesUsed: number;
  lastUsed: number;
  confidence: number;
  tags: string[];
}

export interface AppliedImprovement {
  id: string;
  title: string;
  description: string;
  beforeMetrics: Record<string, number>;
  afterMetrics: Record<string, number>;
  improvement: number;
  appliedAt: number;
  code?: string;
}

export interface LearnedInsight {
  id: string;
  topic: string;
  insight: string;
  confidence: number;
  sources: string[];
  relatedTo: string[];
  timestamp: number;
}

export class GitHubLearningRepository {
  private repoPath: string = './jarvis-learning-repo';
  private initialized = false;
  private techniques: Map<string, LearnedTechnique> = new Map();
  private improvements: Map<string, AppliedImprovement> = new Map();
  private insights: Map<string, LearnedInsight> = new Map();

  constructor() {
    console.log('\n📚 [GitHubLearningRepository] Inicializando...');
    this.initializeRepository();
  }

  /**
   * Inicializar repositorio de aprendizaje
   */
  private async initializeRepository(): Promise<void> {
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(this.repoPath)) {
        fs.mkdirSync(this.repoPath, { recursive: true });
        console.log(`✅ Directorio creado: ${this.repoPath}`);

        // Inicializar git repo
        execSync('git init', { cwd: this.repoPath });
        execSync('git config user.email "jarvis@learning.local"', { cwd: this.repoPath });
        execSync('git config user.name "Jarvis AI"', { cwd: this.repoPath });

        // Crear estructura de directorios
        await this.ensureDirectories();

        // Crear README inicial
        await this.createInitialReadme();

        // Primer commit
        execSync('git add .', { cwd: this.repoPath });
        execSync('git commit -m "Inicializar repositorio de aprendizaje"', { cwd: this.repoPath });

        console.log('✅ Repositorio Git inicializado');
      } else {
        console.log(`✅ Repositorio existente: ${this.repoPath}`);
      }

      // Cargar técnicas almacenadas
      await this.loadTechniques();
      await this.loadImprovements();
      await this.loadInsights();

      this.initialized = true;
      console.log('✅ Repositorio de aprendizaje listo');
    } catch (err: any) {
      console.error('❌ Error inicializando repositorio:', err.message);
    }
  }

  /**
   * Asegurar estructura de directorios
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      'techniques',
      'improvements',
      'insights',
      'code-snippets',
      'analytics',
      'logs'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.repoPath, dir);
      if (!fs.existsSync(fullPath)) {
        await mkdir(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Crear README inicial
   */
  private async createInitialReadme(): Promise<void> {
    const readme = `# Jarvis Learning Repository

Repositorio de aprendizaje autónomo de Jarvis IA.

## Estructura

- \`techniques/\` - Técnicas aprendidas (seguridad, coding, análisis)
- \`improvements/\` - Mejoras aplicadas y resultados
- \`insights/\` - Insights y patrones descubiertos
- \`code-snippets/\` - Fragmentos de código útiles
- \`analytics/\` - Análisis de rendimiento
- \`logs/\` - Logs de aprendizaje

## Inicializado

${new Date().toISOString()}

Cada cambio está versionado en Git para auditoría completa.
`;

    await writeFile(path.join(this.repoPath, 'README.md'), readme);
  }

  /**
   * Registrar técnica aprendida
   */
  async recordTechnique(technique: LearnedTechnique): Promise<boolean> {
    try {
      const filePath = path.join(
        this.repoPath,
        'techniques',
        `${technique.id}.json`
      );

      await writeFile(filePath, JSON.stringify(technique, null, 2));
      this.techniques.set(technique.id, technique);

      // Commit a git
      execSync(`git add ${path.relative(this.repoPath, filePath)}`, { cwd: this.repoPath });
      execSync(
        `git commit -m "Aprendizaje: ${technique.name} (${technique.category})"`,
        { cwd: this.repoPath }
      );

      console.log(`✅ Técnica registrada: ${technique.name}`);
      return true;
    } catch (err: any) {
      console.error(`❌ Error registrando técnica: ${err.message}`);
      return false;
    }
  }

  /**
   * Registrar mejora aplicada
   */
  async recordImprovement(improvement: AppliedImprovement): Promise<boolean> {
    try {
      const filePath = path.join(
        this.repoPath,
        'improvements',
        `${improvement.id}.json`
      );

      await writeFile(filePath, JSON.stringify(improvement, null, 2));
      this.improvements.set(improvement.id, improvement);

      // Calcular % de mejora
      const improvement_pct = (improvement.improvement * 100).toFixed(1);

      execSync(`git add ${path.relative(this.repoPath, filePath)}`, { cwd: this.repoPath });
      execSync(
        `git commit -m "Mejora aplicada: ${improvement.title} (+${improvement_pct}%)"`,
        { cwd: this.repoPath }
      );

      console.log(`✅ Mejora registrada: ${improvement.title} (+${improvement_pct}%)`);
      return true;
    } catch (err: any) {
      console.error(`❌ Error registrando mejora: ${err.message}`);
      return false;
    }
  }

  /**
   * Registrar insight descubierto
   */
  async recordInsight(insight: LearnedInsight): Promise<boolean> {
    try {
      const filePath = path.join(
        this.repoPath,
        'insights',
        `${insight.id}.md`
      );

      const content = `# ${insight.topic}

**Confidence:** ${(insight.confidence * 100).toFixed(0)}%

## Insight

${insight.insight}

## Fuentes

${insight.sources.map(s => `- ${s}`).join('\n')}

## Relacionado

${insight.relatedTo.map(r => `- ${r}`).join('\n')}

---
Registrado: ${new Date(insight.timestamp).toISOString()}
`;

      await writeFile(filePath, content);
      this.insights.set(insight.id, insight);

      execSync(`git add ${path.relative(this.repoPath, filePath)}`, { cwd: this.repoPath });
      execSync(
        `git commit -m "Insight: ${insight.topic}"`,
        { cwd: this.repoPath }
      );

      console.log(`✅ Insight registrado: ${insight.topic}`);
      return true;
    } catch (err: any) {
      console.error(`❌ Error registrando insight: ${err.message}`);
      return false;
    }
  }

  /**
   * Guardar fragmento de código
   */
  async saveCodeSnippet(
    name: string,
    code: string,
    language: string,
    description: string
  ): Promise<boolean> {
    try {
      const id = `${name}-${Date.now()}`;
      const filePath = path.join(
        this.repoPath,
        'code-snippets',
        `${id}.${this.getFileExtension(language)}`
      );

      // Guardar código
      await writeFile(filePath, code);

      // Guardar metadata
      const metaPath = path.join(
        this.repoPath,
        'code-snippets',
        `${id}.meta.json`
      );

      await writeFile(metaPath, JSON.stringify({
        name,
        language,
        description,
        timestamp: Date.now()
      }, null, 2));

      execSync(`git add ${path.relative(this.repoPath, filePath)} ${path.relative(this.repoPath, metaPath)}`, { cwd: this.repoPath });
      execSync(
        `git commit -m "Code snippet: ${name}"`,
        { cwd: this.repoPath }
      );

      console.log(`✅ Código guardado: ${name}`);
      return true;
    } catch (err: any) {
      console.error(`❌ Error guardando código: ${err.message}`);
      return false;
    }
  }

  /**
   * Obtener todas las técnicas
   */
  getTechniques(): LearnedTechnique[] {
    return Array.from(this.techniques.values());
  }

  /**
   * Obtener técnica por categoría
   */
  getTechniquesByCategory(category: string): LearnedTechnique[] {
    return Array.from(this.techniques.values()).filter(t => t.category === category);
  }

  /**
   * Obtener técnica por ID
   */
  getTechnique(id: string): LearnedTechnique | null {
    return this.techniques.get(id) || null;
  }

  /**
   * Búsqueda de técnicas
   */
  searchTechniques(query: string): LearnedTechnique[] {
    const lower = query.toLowerCase();
    return Array.from(this.techniques.values()).filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some(tag => tag.toLowerCase().includes(lower))
    );
  }

  /**
   * Obtener todas las mejoras
   */
  getImprovements(): AppliedImprovement[] {
    return Array.from(this.improvements.values());
  }

  /**
   * Obtener todos los insights
   */
  getInsights(): LearnedInsight[] {
    return Array.from(this.insights.values());
  }

  /**
   * Cargar técnicas desde disco
   */
  private async loadTechniques(): Promise<void> {
    try {
      const dir = path.join(this.repoPath, 'techniques');
      if (!fs.existsSync(dir)) return;

      const files = await readdir(dir);
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const content = await readFile(path.join(dir, file), 'utf-8');
        const technique = JSON.parse(content);
        this.techniques.set(technique.id, technique);
      }

      console.log(`✅ Cargadas ${this.techniques.size} técnicas`);
    } catch (err) {
      console.warn('⚠️  Error cargando técnicas:', err);
    }
  }

  /**
   * Cargar mejoras desde disco
   */
  private async loadImprovements(): Promise<void> {
    try {
      const dir = path.join(this.repoPath, 'improvements');
      if (!fs.existsSync(dir)) return;

      const files = await readdir(dir);
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const content = await readFile(path.join(dir, file), 'utf-8');
        const improvement = JSON.parse(content);
        this.improvements.set(improvement.id, improvement);
      }

      console.log(`✅ Cargadas ${this.improvements.size} mejoras`);
    } catch (err) {
      console.warn('⚠️  Error cargando mejoras:', err);
    }
  }

  /**
   * Cargar insights desde disco
   */
  private async loadInsights(): Promise<void> {
    try {
      const dir = path.join(this.repoPath, 'insights');
      if (!fs.existsSync(dir)) return;

      const files = await readdir(dir);
      // Nota: Los insights se cargan como archivos .md, aquí simplemente contamos
      console.log(`✅ Directorio de insights disponible (${files.length} archivos)`);
    } catch (err) {
      console.warn('⚠️  Error cargando insights:', err);
    }
  }

  /**
   * Obtener información del repositorio
   */
  getRepositoryInfo(): any {
    try {
      const stats = fs.statSync(this.repoPath);
      const techniques = this.techniques.size;
      const improvements = this.improvements.size;
      const insights = this.insights.size;

      let commits = 0;
      try {
        const output = execSync('git rev-list --count HEAD', { cwd: this.repoPath }).toString();
        commits = parseInt(output.trim());
      } catch {}

      return {
        path: this.repoPath,
        initialized: this.initialized,
        techniques,
        improvements,
        insights,
        commits,
        createdAt: stats.birthtimeMs,
        size: this.getDirectorySize(this.repoPath)
      };
    } catch (err) {
      return { error: 'Error obteniendo info' };
    }
  }

  /**
   * Calcular tamaño del directorio
   */
  private getDirectorySize(dir: string): number {
    let size = 0;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const path_full = path.join(dir, file);
        const stats = fs.statSync(path_full);
        if (stats.isDirectory()) {
          size += this.getDirectorySize(path_full);
        } else {
          size += stats.size;
        }
      }
    } catch {}
    return size;
  }

  /**
   * Obtener extensión de archivo por lenguaje
   */
  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'bash': 'sh',
      'sql': 'sql',
      'json': 'json'
    };
    return extensions[language] || 'txt';
  }

  /**
   * Generar reporte de aprendizaje
   */
  generateLearningReport(): string {
    const info = this.getRepositoryInfo();
    const topTechniques = Array.from(this.techniques.values())
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 5);

    const report = `
📚 JARVIS LEARNING REPOSITORY REPORT

🎯 Estadísticas Generales
  • Repositorio: ${info.path}
  • Commits: ${info.commits}
  • Tamaño: ${(info.size / 1024).toFixed(0)} KB

📖 Conocimiento Adquirido
  • Técnicas: ${info.techniques}
  • Mejoras Aplicadas: ${info.improvements}
  • Insights: ${info.insights}

🏆 Técnicas Más Usadas
${topTechniques.map((t, i) => `  ${i + 1}. ${t.name} (usado ${t.timesUsed} veces, confianza: ${(t.confidence * 100).toFixed(0)}%)`).join('\n')}

💾 Sistema de Persistencia
  • Base: Git (versionado)
  • Auditoría: Completa
  • Sincronización: Automática
  • Control: DVCS

✅ Estado: Operacional
`;

    return report;
  }
}

export const gitHubLearningRepository = new GitHubLearningRepository();
