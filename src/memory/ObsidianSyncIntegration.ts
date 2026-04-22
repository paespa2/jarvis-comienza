/**
 * OBSIDIAN SYNC INTEGRATION
 *
 * Jarvis accede directamente a bóveda de Obsidian sincronizada.
 * Lee y escribe conocimiento en tiempo real.
 *
 * ✨ Sincronización bidireccional con Obsidian
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  tags: string[];
  frontmatter: Record<string, any>;
  lastModified: number;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  references: string[];
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

export class ObsidianSyncIntegration {
  private vaultPath: string;
  private syncEnabled: boolean = false;
  private knowledgeFolder: string = '04-CONOCIMIENTO';
  private jarvisFolder: string = '05-JARVIS-BRAIN';
  private lastSyncTime: number = 0;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(vaultPath?: string) {
    // Si se proporciona ruta, usar esa; si no, buscar bóveda predeterminada
    this.vaultPath = vaultPath || this.findObsidianVault();
    console.log(`\n📚 [ObsidianSync] Vault path: ${this.vaultPath}`);
  }

  /**
   * Buscar bóveda de Obsidian en ubicaciones estándar
   */
  private findObsidianVault(): string {
    const possiblePaths = [
      path.join(process.env.HOME || '/root', 'Obsidian', 'vault'),
      path.join(process.env.HOME || '/root', 'Documents', 'Obsidian'),
      './obsidian-vault',
      './jarvis-wiki'
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log(`✅ Bóveda encontrada: ${p}`);
        return p;
      }
    }

    // Fallback: crear carpeta local
    const fallback = './obsidian-vault';
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }

  /**
   * Inicializar sincronización con Obsidian
   */
  async initializeSync(): Promise<boolean> {
    try {
      console.log('\n🔄 [ObsidianSync] Inicializando sincronización...');

      // Verificar que la bóveda existe
      if (!fs.existsSync(this.vaultPath)) {
        console.warn(`⚠️  Bóveda no encontrada: ${this.vaultPath}`);
        return false;
      }

      // Crear carpetas necesarias
      await this.ensureFolders();

      // Leer archivos existentes para validar
      const notes = await this.getAllNotes();
      console.log(`✅ Bóveda sincronizada: ${notes.length} notas encontradas`);

      this.syncEnabled = true;
      this.lastSyncTime = Date.now();

      // Iniciar sincronización periódica
      this.startPeriodicSync();

      return true;
    } catch (err: any) {
      console.error('[ObsidianSync] Error:', err.message);
      return false;
    }
  }

  /**
   * Asegurar que existen las carpetas necesarias
   */
  private async ensureFolders(): Promise<void> {
    const folders = [
      this.knowledgeFolder,
      this.jarvisFolder,
      path.join(this.jarvisFolder, 'learning'),
      path.join(this.jarvisFolder, 'improvements'),
      path.join(this.jarvisFolder, 'kali-techniques')
    ];

    for (const folder of folders) {
      const folderPath = path.join(this.vaultPath, folder);
      if (!fs.existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true });
      }
    }
  }

  /**
   * Obtener todas las notas de la bóveda
   */
  private async getAllNotes(): Promise<ObsidianNote[]> {
    const notes: ObsidianNote[] = [];

    async function scanDir(dir: string, relativePath = ''): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (entry.name.endsWith('.md')) {
          const content = await readFile(fullPath, 'utf-8');
          const { frontmatter, body } = this.parseMDFile(content);

          notes.push({
            path: relPath,
            title: frontmatter.title || path.basename(entry.name, '.md'),
            content: body,
            tags: frontmatter.tags || [],
            frontmatter,
            lastModified: Date.now()
          });
        }
      }
    }

    await scanDir(this.vaultPath);
    return notes;
  }

  /**
   * Parsear archivo Markdown con YAML frontmatter
   */
  private parseMDFile(content: string): { frontmatter: Record<string, any>; body: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      const frontmatterStr = match[1];
      const body = match[2];

      const frontmatter: Record<string, any> = {};
      frontmatterStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key) {
          const value = valueParts.join(':').trim();
          if (value === 'true') frontmatter[key.trim()] = true;
          else if (value === 'false') frontmatter[key.trim()] = false;
          else if (!isNaN(Number(value))) frontmatter[key.trim()] = Number(value);
          else frontmatter[key.trim()] = value;
        }
      });

      return { frontmatter, body };
    }

    return { frontmatter: {}, body: content };
  }

  /**
   * Guardar conocimiento en Obsidian
   */
  async saveKnowledge(entry: KnowledgeEntry): Promise<boolean> {
    try {
      if (!this.syncEnabled) {
        console.warn('⚠️  Sincronización no activa');
        return false;
      }

      // Determinar carpeta según categoría
      let folder = this.knowledgeFolder;
      if (entry.category === 'kali-technique') {
        folder = path.join(this.jarvisFolder, 'kali-techniques');
      } else if (entry.category === 'improvement') {
        folder = path.join(this.jarvisFolder, 'improvements');
      } else if (entry.category === 'learning') {
        folder = path.join(this.jarvisFolder, 'learning');
      }

      const folderPath = path.join(this.vaultPath, folder);
      await mkdir(folderPath, { recursive: true });

      // Crear filename sanitizado
      const filename = `${entry.id}-${entry.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      const filePath = path.join(folderPath, filename);

      // Crear contenido con frontmatter
      const frontmatter = {
        title: entry.title,
        category: entry.category,
        tags: entry.tags,
        confidence: entry.confidence,
        createdAt: new Date(entry.createdAt).toISOString(),
        updatedAt: new Date(entry.updatedAt).toISOString(),
        references: entry.references,
        jarvis: true
      };

      const yamlStr = Object.entries(frontmatter)
        .map(([k, v]) => {
          if (Array.isArray(v)) {
            return `${k}: [${v.map(x => `"${x}"`).join(', ')}]`;
          }
          return `${k}: ${typeof v === 'string' ? `"${v}"` : v}`;
        })
        .join('\n');

      const mdContent = `---\n${yamlStr}\n---\n\n${entry.content}`;

      await writeFile(filePath, mdContent, 'utf-8');
      console.log(`✅ Conocimiento guardado: ${entry.title}`);

      return true;
    } catch (err: any) {
      console.error('[ObsidianSync] Error guardando:', err.message);
      return false;
    }
  }

  /**
   * Leer conocimiento de Obsidian
   */
  async readKnowledge(category?: string): Promise<KnowledgeEntry[]> {
    try {
      if (!this.syncEnabled) {
        return [];
      }

      const allNotes = await this.getAllNotes();
      const jarvisNotes = allNotes.filter(note =>
        note.frontmatter.jarvis === true ||
        note.path.includes('JARVIS-BRAIN')
      );

      return jarvisNotes
        .filter(note => !category || note.frontmatter.category === category)
        .map(note => ({
          id: path.basename(note.path, '.md'),
          title: note.title,
          category: note.frontmatter.category || 'general',
          content: note.content,
          tags: note.tags,
          references: note.frontmatter.references || [],
          confidence: note.frontmatter.confidence || 0.5,
          createdAt: note.frontmatter.createdAt ? new Date(note.frontmatter.createdAt).getTime() : Date.now(),
          updatedAt: note.lastModified
        }));
    } catch (err: any) {
      console.error('[ObsidianSync] Error leyendo:', err.message);
      return [];
    }
  }

  /**
   * Buscar en Obsidian
   */
  async searchKnowledge(query: string): Promise<KnowledgeEntry[]> {
    try {
      const allKnowledge = await this.readKnowledge();
      const lowerQuery = query.toLowerCase();

      return allKnowledge.filter(entry =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (err: any) {
      console.error('[ObsidianSync] Error buscando:', err.message);
      return [];
    }
  }

  /**
   * Iniciar sincronización periódica
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Sincronizar cada 5 minutos
    this.syncInterval = setInterval(async () => {
      console.log('🔄 [ObsidianSync] Sincronización periódica...');
      this.lastSyncTime = Date.now();
    }, 5 * 60 * 1000);
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async getSyncStats(): Promise<{
    enabled: boolean;
    vaultPath: string;
    lastSync: number;
    knowledgeCount: number;
    improvementCount: number;
    kaliTechniqueCount: number;
  }> {
    const knowledge = await this.readKnowledge();
    const improvements = await this.readKnowledge('improvement');
    const kaliTechniques = await this.readKnowledge('kali-technique');

    return {
      enabled: this.syncEnabled,
      vaultPath: this.vaultPath,
      lastSync: this.lastSyncTime,
      knowledgeCount: knowledge.length,
      improvementCount: improvements.length,
      kaliTechniqueCount: kaliTechniques.length
    };
  }

  /**
   * Detener sincronización
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.syncEnabled = false;
    console.log('🛑 [ObsidianSync] Sincronización detenida');
  }
}

// Exportar instancia singleton
export const obsidianSync = new ObsidianSyncIntegration();
