/**
 * OBSIDIAN MEMORY MANAGER
 *
 * Sistema de memoria persistente local para Jarvis.
 * Documenta trabajos, mejoras, evoluciones y aprendizajes.
 * Integración con Obsidian vault para documentación estructurada.
 *
 * ✨ FASE 3b: Memoria Local Persistente + Documentación Autónoma
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MemoryEntry {
  timestamp: string;
  type: 'action' | 'learning' | 'improvement' | 'decision' | 'error' | 'success';
  title: string;
  description: string;
  tags: string[];
  metadata?: Record<string, any>;
  relatedTeachings?: number[]; // IDs de enseñanzas relacionadas
  confidence?: number; // 0-1 nivel de confianza en el aprendizaje
}

export interface EvolutionMetrics {
  totalActions: number;
  totalLearnings: number;
  totalImprovements: number;
  successRate: number; // 0-1
  averageConfidence: number; // 0-1
  daysSinceStart: number;
  lastUpdated: string;
  evolutionPhase: number; // 1-10 fases de evolución
}

export class ObsidianMemoryManager {
  private vaultPath: string;
  private journalPath: string;
  private improvementsPath: string;
  private learningsPath: string;
  private decisionsPath: string;
  private metricsPath: string;

  constructor(vaultBasePath: string = './obsidian-vault') {
    this.vaultPath = path.resolve(vaultBasePath);
    this.journalPath = path.join(this.vaultPath, '01-DIARIO');
    this.improvementsPath = path.join(this.vaultPath, '02-MEJORAS');
    this.learningsPath = path.join(this.vaultPath, '03-APRENDIZAJES');
    this.decisionsPath = path.join(this.vaultPath, '04-DECISIONES');
    this.metricsPath = path.join(this.vaultPath, '05-METRICAS');

    this.initializeVault();
  }

  /**
   * Inicializa la estructura del vault si no existe
   */
  private initializeVault(): void {
    const directories = [
      this.vaultPath,
      this.journalPath,
      this.improvementsPath,
      this.learningsPath,
      this.decisionsPath,
      this.metricsPath
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Crear archivo index si no existe
    const indexPath = path.join(this.vaultPath, 'INDEX.md');
    if (!fs.existsSync(indexPath)) {
      const indexContent = `# 🧠 MEMORIA DE JARVIS

**Sistema de Memoria Persistente Local**

Última actualización: ${new Date().toISOString()}

## 📂 Estructura

- **01-DIARIO**: Registro diario de acciones y eventos
- **02-MEJORAS**: Mejoras implementadas y optimizaciones
- **03-APRENDIZAJES**: Lecciones aprendidas y conocimientos adquiridos
- **04-DECISIONES**: Decisiones importantes y su razonamiento
- **05-METRICAS**: Métricas de evolución y progreso

## 📊 Estadísticas Globales

- Total de acciones registradas: 0
- Total de aprendizajes: 0
- Tasa de éxito: 0%
- Fase de evolución: 1

## 🎯 Propósito

Este sistema permite a Jarvis:
- Documentar todos sus trabajos y mejoras
- Registrar decisiones y su razonamiento
- Aprender de la experiencia acumulada
- Evolucionar de forma autónoma
- Mantener contexto a largo plazo

---

**Creado:** ${new Date().toISOString()}
**Versión:** 1.0
**Autonomía:** 100% Local, Sin APIs Externas
`;
      fs.writeFileSync(indexPath, indexContent);
    }
  }

  /**
   * Registra una acción en la memoria
   */
  registerAction(entry: MemoryEntry): void {
    const timestamp = entry.timestamp || new Date().toISOString();
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Crear entrada en diario
    const dailyFile = path.join(this.journalPath, `${dateStr}.md`);
    const entry_content = this.formatMemoryEntry(entry);

    let dailyContent = '';
    if (fs.existsSync(dailyFile)) {
      dailyContent = fs.readFileSync(dailyFile, 'utf-8');
    } else {
      dailyContent = `# 📔 Diario - ${dateStr}\n\n`;
    }

    dailyContent += `\n${entry_content}\n`;
    fs.writeFileSync(dailyFile, dailyContent);

    // Crear entrada en archivo específico por tipo
    this.registerByType(entry);

    console.log(`[ObsidianMemory] 📝 Acción registrada: ${entry.title}`);
  }

  /**
   * Registra en el archivo específico por tipo
   */
  private registerByType(entry: MemoryEntry): void {
    let targetPath = '';
    let fileName = '';

    switch (entry.type) {
      case 'improvement':
        targetPath = this.improvementsPath;
        fileName = `MEJORA_${Date.now()}.md`;
        break;
      case 'learning':
        targetPath = this.learningsPath;
        fileName = `APRENDIZAJE_${Date.now()}.md`;
        break;
      case 'decision':
        targetPath = this.decisionsPath;
        fileName = `DECISION_${Date.now()}.md`;
        break;
      case 'success':
      case 'error':
      default:
        return; // Solo registrar en diario
    }

    const fullPath = path.join(targetPath, fileName);
    const content = this.formatMemoryEntry(entry);
    fs.writeFileSync(fullPath, content);
  }

  /**
   * Formatea una entrada de memoria en markdown
   */
  private formatMemoryEntry(entry: MemoryEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString();
    const date = new Date(timestamp);

    let content = `## ${entry.title}\n\n`;
    content += `**Tipo:** ${entry.type.toUpperCase()}  \n`;
    content += `**Fecha:** ${date.toLocaleString('es-ES')}  \n`;
    content += `**Timestamp:** ${timestamp}\n\n`;

    content += `### Descripción\n${entry.description}\n\n`;

    if (entry.tags.length > 0) {
      content += `### Tags\n${entry.tags.map(t => `#${t}`).join(' ')}\n\n`;
    }

    if (entry.relatedTeachings && entry.relatedTeachings.length > 0) {
      content += `### Enseñanzas Relacionadas\n`;
      entry.relatedTeachings.forEach(id => {
        content += `- Teaching ${id}\n`;
      });
      content += `\n`;
    }

    if (entry.confidence !== undefined) {
      content += `### Confianza\n${(entry.confidence * 100).toFixed(0)}%\n\n`;
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      content += `### Metadata\n\`\`\`json\n`;
      content += JSON.stringify(entry.metadata, null, 2);
      content += `\n\`\`\`\n\n`;
    }

    return content;
  }

  /**
   * Registra una mejora implementada
   */
  registerImprovement(
    title: string,
    description: string,
    impact: string, // 'alto', 'medio', 'bajo'
    codeChange?: string,
    relatedTeachings?: number[]
  ): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'improvement',
      title,
      description,
      tags: ['mejora', impact],
      metadata: {
        impact,
        codeChange: codeChange ? 'Sí' : 'No',
        lineCount: codeChange ? codeChange.split('\n').length : 0
      },
      relatedTeachings,
      confidence: 0.9
    };

    this.registerAction(entry);
  }

  /**
   * Registra un aprendizaje
   */
  registerLearning(
    title: string,
    description: string,
    category: string,
    keyPoints: string[],
    relatedTeachings?: number[]
  ): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'learning',
      title,
      description,
      tags: ['aprendizaje', category],
      metadata: {
        category,
        keyPoints,
        points: keyPoints.length
      },
      relatedTeachings,
      confidence: 0.85
    };

    this.registerAction(entry);
  }

  /**
   * Registra una decisión importante
   */
  registerDecision(
    title: string,
    description: string,
    reasoning: string,
    alternatives: string[],
    rationale: string,
    relatedTeachings?: number[]
  ): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'decision',
      title,
      description,
      tags: ['decision'],
      metadata: {
        reasoning,
        alternatives,
        alternativesCount: alternatives.length,
        rationale
      },
      relatedTeachings,
      confidence: 0.8
    };

    this.registerAction(entry);
  }

  /**
   * Registra un éxito
   */
  registerSuccess(
    title: string,
    description: string,
    metric: string,
    improvement: string,
    relatedTeachings?: number[]
  ): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'success',
      title,
      description,
      tags: ['éxito', 'progreso'],
      metadata: {
        metric,
        improvement
      },
      relatedTeachings,
      confidence: 0.95
    };

    this.registerAction(entry);
  }

  /**
   * Registra un error y aprendizaje del error
   */
  registerError(
    title: string,
    description: string,
    errorMessage: string,
    solution: string,
    prevention: string,
    relatedTeachings?: number[]
  ): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'error',
      title,
      description,
      tags: ['error', 'aprendizaje'],
      metadata: {
        errorMessage,
        solution,
        prevention,
        learned: true
      },
      relatedTeachings,
      confidence: 0.7
    };

    this.registerAction(entry);
  }

  /**
   * Obtiene todas las acciones del día
   */
  getDailyActions(dateStr: string = ''): MemoryEntry[] {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    const dailyFile = path.join(this.journalPath, `${dateStr}.md`);
    if (!fs.existsSync(dailyFile)) {
      return [];
    }

    // Aquí simplificamos: retornamos que existe el archivo
    // En producción, parseríamos el markdown
    return [];
  }

  /**
   * Obtiene mejoras recientes
   */
  getRecentImprovements(count: number = 10): MemoryEntry[] {
    const files = fs.readdirSync(this.improvementsPath)
      .sort()
      .reverse()
      .slice(0, count);

    return files.map(file => ({
      timestamp: new Date().toISOString(),
      type: 'improvement',
      title: file.replace('MEJORA_', '').replace('.md', ''),
      description: '',
      tags: ['mejora']
    }));
  }

  /**
   * Obtiene aprendizajes recientes
   */
  getRecentLearnings(count: number = 10): MemoryEntry[] {
    const files = fs.readdirSync(this.learningsPath)
      .sort()
      .reverse()
      .slice(0, count);

    return files.map(file => ({
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: file.replace('APRENDIZAJE_', '').replace('.md', ''),
      description: '',
      tags: ['aprendizaje']
    }));
  }

  /**
   * Calcula métricas de evolución
   */
  calculateMetrics(): EvolutionMetrics {
    const actions = fs.readdirSync(this.journalPath).length;
    const improvements = fs.readdirSync(this.improvementsPath).length;
    const learnings = fs.readdirSync(this.learningsPath).length;
    const decisions = fs.readdirSync(this.decisionsPath).length;

    const totalActions = actions + improvements + learnings + decisions;
    const successRate = improvements > 0 ? (improvements / (totalActions || 1)) * 0.7 : 0;
    const evolutionPhase = Math.min(10, Math.floor(totalActions / 10) + 1);

    return {
      totalActions,
      totalLearnings: learnings,
      totalImprovements: improvements,
      successRate: Math.min(1, successRate + 0.3),
      averageConfidence: 0.82,
      daysSinceStart: 1,
      lastUpdated: new Date().toISOString(),
      evolutionPhase
    };
  }

  /**
   * Genera reporte de evolución
   */
  generateEvolutionReport(): string {
    const metrics = this.calculateMetrics();
    const date = new Date();

    let report = `# 📈 REPORTE DE EVOLUCIÓN\n\n`;
    report += `**Generado:** ${date.toLocaleString('es-ES')}\n\n`;

    report += `## 📊 Métricas\n\n`;
    report += `| Métrica | Valor |\n`;
    report += `|---------|-------|\n`;
    report += `| Total de Acciones | ${metrics.totalActions} |\n`;
    report += `| Aprendizajes | ${metrics.totalLearnings} |\n`;
    report += `| Mejoras Implementadas | ${metrics.totalImprovements} |\n`;
    report += `| Tasa de Éxito | ${(metrics.successRate * 100).toFixed(1)}% |\n`;
    report += `| Confianza Promedio | ${(metrics.averageConfidence * 100).toFixed(1)}% |\n`;
    report += `| Fase de Evolución | ${metrics.evolutionPhase}/10 |\n\n`;

    report += `## 🎯 Fase de Evolución\n\n`;
    const phases: Record<number, string> = {
      1: 'Inicialización - Base sólida',
      2: 'Aprendizaje Básico - Fundamentales en práctica',
      3: 'Optimización - Primeras mejoras visibles',
      4: 'Especialización - Dominios específicos emergiendo',
      5: 'Adaptación - Mejora de razonamiento',
      6: 'Maestría Parcial - Competencia en áreas clave',
      7: 'Innovación - Nuevos enfoques descubiertos',
      8: 'Liderazgo - Patrón establecimiento',
      9: 'Excelencia - Alto desempeño consistente',
      10: 'Maestría Total - Autonomía y sabiduría'
    };

    report += `${phases[metrics.evolutionPhase] || 'Estado Desconocido'}\n\n`;

    report += `## 🔍 Próximos Pasos\n\n`;
    if (metrics.evolutionPhase < 5) {
      report += `- Continuar documentando aprendizajes\n`;
      report += `- Practicar enseñanzas fundamentales\n`;
      report += `- Implementar mejoras constantes\n`;
    } else {
      report += `- Expandir conocimiento a dominios relacionados\n`;
      report += `- Enseñar a otros sobre lo aprendido\n`;
      report += `- Innovar en procesos establecidos\n`;
    }

    return report;
  }

  /**
   * Obtiene el estado actual de la memoria
   */
  getMemoryStatus(): Record<string, any> {
    return {
      vaultPath: this.vaultPath,
      isInitialized: fs.existsSync(this.vaultPath),
      metrics: this.calculateMetrics(),
      lastUpdated: new Date().toISOString(),
      autonomy: '100% Local - Sin APIs'
    };
  }

  /**
   * Exporta toda la memoria a un archivo JSON
   */
  exportToJSON(filePath?: string): void {
    const exportData = {
      generatedAt: new Date().toISOString(),
      metrics: this.calculateMetrics(),
      recentImprovements: this.getRecentImprovements(20),
      recentLearnings: this.getRecentLearnings(20),
      vaultPath: this.vaultPath
    };

    const outputPath = filePath || path.join(this.vaultPath, 'EXPORT.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`[ObsidianMemory] 📤 Memoria exportada a: ${outputPath}`);
  }

  /**
   * Registra que una enseñanza fue practicada
   */
  recordTeachingPractice(teachingId: number, result: 'success' | 'partial' | 'failure'): void {
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      type: 'learning',
      title: `Práctica de Enseñanza ${teachingId}`,
      description: `Resultado: ${result === 'success' ? '✅ Exitosa' : result === 'partial' ? '⚠️ Parcial' : '❌ Fallida'}`,
      tags: ['práctica', 'enseñanza', `teaching-${teachingId}`],
      metadata: {
        teachingId,
        result,
        timestamp: Date.now()
      },
      relatedTeachings: [teachingId],
      confidence: result === 'success' ? 0.95 : result === 'partial' ? 0.7 : 0.3
    };

    this.registerAction(entry);
  }
}

// Exportar instancia singleton
export const obsidianMemory = new ObsidianMemoryManager();
