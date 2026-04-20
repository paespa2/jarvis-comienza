/**
 * JARVIS PERSISTENT DATABASE
 *
 * SQLite-based persistent knowledge base for autonomous reasoning
 * All knowledge, episodes, skills, and genome evolution is stored here
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class JarvisDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'jarvis-knowledge.db');

    console.log(`📦 Initializing Jarvis Knowledge Base at: ${this.dbPath}`);

    // Crear o abrir base de datos
    this.db = new Database(this.dbPath);

    // Performance settings
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging para mejor concurrencia
    this.db.pragma('synchronous = NORMAL'); // Balance entre seguridad y velocidad
    this.db.pragma('foreign_keys = ON'); // Activar restricciones de foreign keys
    this.db.pragma('cache_size = -64000'); // 64MB cache

    console.log('✅ Database connected');

    // Inicializar schema
    this.initializeSchema();
  }

  /**
   * Inicializar schema de la base de datos
   */
  private initializeSchema(): void {
    try {
      // Leer schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Ejecutar cada statement del schema
      const statements = schema.split(';').filter(stmt => stmt.trim());

      for (const stmt of statements) {
        if (stmt.trim()) {
          this.db.exec(stmt);
        }
      }

      console.log('✅ Schema initialized');

      // Verificar que las tablas existen
      const tables = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all();

      console.log(`📊 Database tables: ${tables.length}`);
      console.log(`   ${tables.map((t: any) => t.name).join(', ')}`);

    } catch (error) {
      console.error('❌ Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Obtener la instancia de la base de datos
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Cerrar la conexión
   */
  close(): void {
    this.db.close();
    console.log('✅ Database closed');
  }

  /**
   * Hacer un backup de la base de datos
   */
  backup(backupPath?: string): void {
    const backup = backupPath || path.join(
      process.cwd(),
      `backup-${Date.now()}.db`
    );

    try {
      fs.copyFileSync(this.dbPath, backup);
      console.log(`✅ Backup created: ${backup}`);
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restaurar desde un backup
   */
  restore(backupPath: string): void {
    try {
      this.db.close();
      fs.copyFileSync(backupPath, this.dbPath);

      // Reinicializar
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');

      console.log(`✅ Database restored from: ${backupPath}`);
    } catch (error) {
      console.error('❌ Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  getStats(): {
    episodes: number;
    lessons: number;
    skills: number;
    genomes: number;
    tasks: number;
    patterns: number;
    databaseSize: number;
  } {
    const episodes = this.db.prepare('SELECT COUNT(*) as count FROM episodes')
      .get() as any;
    const lessons = this.db.prepare('SELECT COUNT(*) as count FROM lessons')
      .get() as any;
    const skills = this.db.prepare('SELECT COUNT(*) as count FROM skills')
      .get() as any;
    const genomes = this.db.prepare('SELECT COUNT(*) as count FROM genomes')
      .get() as any;
    const tasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks')
      .get() as any;
    const patterns = this.db.prepare('SELECT COUNT(*) as count FROM patterns')
      .get() as any;

    const stats = fs.statSync(this.dbPath);
    const sizeInMB = stats.size / (1024 * 1024);

    return {
      episodes: episodes.count,
      lessons: lessons.count,
      skills: skills.count,
      genomes: genomes.count,
      tasks: tasks.count,
      patterns: patterns.count,
      databaseSize: Math.round(sizeInMB * 100) / 100
    };
  }

  /**
   * Resetear la base de datos (para testing)
   */
  reset(): void {
    try {
      const tables = [
        'episodes', 'lessons', 'skills', 'genomes', 'tasks',
        'patterns', 'antiPatterns', 'metadata'
      ];

      for (const table of tables) {
        this.db.prepare(`DELETE FROM ${table}`).run();
      }

      console.log('✅ Database reset');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }
}

// Crear instancia global
let instance: JarvisDatabase | null = null;

export function initializeDatabase(dbPath?: string): JarvisDatabase {
  if (!instance) {
    instance = new JarvisDatabase(dbPath);
  }
  return instance;
}

export function getDatabase(): JarvisDatabase {
  if (!instance) {
    instance = new JarvisDatabase();
  }
  return instance;
}
