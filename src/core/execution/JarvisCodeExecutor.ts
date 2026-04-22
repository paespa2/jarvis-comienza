/**
 * JARVIS CODE EXECUTOR
 *
 * Sistema de ejecución de código como Claude.Code
 * - Ejecutar bash commands
 * - Ejecutar Python scripts
 * - Leer y escribir archivos
 * - Operaciones Git
 * - Razonamiento y planificación
 *
 * ✨ FASE 6: Jarvis se convierte en Claude.Code
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface ExecutionResult {
  id: string;
  type: 'bash' | 'python' | 'file-read' | 'file-write' | 'git' | 'analysis';
  command: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface CodeAnalysis {
  file: string;
  language: string;
  lines: number;
  functions: string[];
  imports: string[];
  issues: string[];
  suggestions: string[];
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  steps: Array<{
    step: number;
    task: string;
    type: string;
    command?: string;
  }>;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class JarvisCodeExecutor {
  private executions: Map<string, ExecutionResult> = new Map();
  private cwd: string = process.cwd();
  private executionHistory: ExecutionResult[] = [];

  constructor() {
    console.log('\n💻 [JarvisCodeExecutor] Inicializando como Claude.Code...');
  }

  /**
   * Ejecutar comando bash
   */
  async executeBash(command: string, description?: string): Promise<ExecutionResult> {
    const id = `bash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`\n🔧 [Bash] ${description || command}`);
    console.log(`   Comando: ${command}`);

    try {
      const output = execSync(command, {
        cwd: this.cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      const result: ExecutionResult = {
        id,
        type: 'bash',
        command,
        success: true,
        output: output.trim(),
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ✅ Éxito (${result.duration}ms)`);
      if (output.length < 500) {
        console.log(`   Output:\n${output}`);
      } else {
        console.log(`   Output: ${output.substring(0, 500)}... (truncado)`);
      }

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    } catch (err: any) {
      const result: ExecutionResult = {
        id,
        type: 'bash',
        command,
        success: false,
        output: err.stdout?.toString() || '',
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ❌ Error: ${err.message}`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    }
  }

  /**
   * Ejecutar Python script
   */
  async executePython(script: string, description?: string): Promise<ExecutionResult> {
    const id = `python-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`\n🐍 [Python] ${description || 'Ejecutando script'}`);

    try {
      // Guardar script temporalmente
      const scriptPath = path.join('/tmp', `jarvis-${Date.now()}.py`);
      await writeFile(scriptPath, script);

      const output = execSync(`python3 ${scriptPath}`, {
        cwd: this.cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      const result: ExecutionResult = {
        id,
        type: 'python',
        command: script,
        success: true,
        output: output.trim(),
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ✅ Éxito (${result.duration}ms)`);
      console.log(`   Output:\n${output.substring(0, 500)}`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    } catch (err: any) {
      const result: ExecutionResult = {
        id,
        type: 'python',
        command: script,
        success: false,
        output: '',
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ❌ Error: ${err.message}`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    }
  }

  /**
   * Leer archivo
   */
  async readFile(filePath: string): Promise<ExecutionResult> {
    const id = `read-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const fullPath = path.resolve(this.cwd, filePath);
    console.log(`\n📖 [Read] ${filePath}`);

    try {
      const content = await readFile(fullPath, 'utf-8');

      const result: ExecutionResult = {
        id,
        type: 'file-read',
        command: `read: ${filePath}`,
        success: true,
        output: content,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ✅ Archivo leído (${content.length} caracteres)`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    } catch (err: any) {
      const result: ExecutionResult = {
        id,
        type: 'file-read',
        command: `read: ${filePath}`,
        success: false,
        output: '',
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ❌ Error: ${err.message}`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    }
  }

  /**
   * Escribir archivo
   */
  async writeFile(filePath: string, content: string, description?: string): Promise<ExecutionResult> {
    const id = `write-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const fullPath = path.resolve(this.cwd, filePath);
    console.log(`\n✍️  [Write] ${description || filePath}`);

    try {
      // Crear directorio si no existe
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await writeFile(fullPath, content);

      const result: ExecutionResult = {
        id,
        type: 'file-write',
        command: `write: ${filePath}`,
        success: true,
        output: `Archivo escrito: ${filePath} (${content.length} caracteres)`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ✅ Archivo escrito (${content.length} caracteres)`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    } catch (err: any) {
      const result: ExecutionResult = {
        id,
        type: 'file-write',
        command: `write: ${filePath}`,
        success: false,
        output: '',
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`   ❌ Error: ${err.message}`);

      this.executions.set(id, result);
      this.executionHistory.push(result);

      return result;
    }
  }

  /**
   * Operación Git
   */
  async gitCommand(command: string, description?: string): Promise<ExecutionResult> {
    return this.executeBash(`git ${command}`, `[Git] ${description || command}`);
  }

  /**
   * Git commit
   */
  async gitCommit(message: string): Promise<ExecutionResult> {
    await this.executeBash('git add -A', 'Staging changes');
    return this.gitCommand(`commit -m "${message}"`, `Commit: ${message}`);
  }

  /**
   * Analizar código
   */
  analyzeCode(filePath: string, language: string, content: string): CodeAnalysis {
    console.log(`\n🔬 [Analyze] ${filePath}`);

    const analysis: CodeAnalysis = {
      file: filePath,
      language,
      lines: content.split('\n').length,
      functions: [],
      imports: [],
      issues: [],
      suggestions: []
    };

    // Detectar funciones/métodos
    if (language === 'typescript' || language === 'javascript') {
      const funcRegex = /(?:function|const|async)\s+(\w+)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        analysis.functions.push(match[1]);
      }

      const importRegex = /import\s+.+\s+from\s+['"](.+)['"]/g;
      while ((match = importRegex.exec(content)) !== null) {
        analysis.imports.push(match[1]);
      }
    }

    // Detectar issues comunes
    if (content.includes('console.log') && language !== 'javascript') {
      analysis.issues.push('console.log encontrado - remover logs en producción');
    }
    if (content.includes('TODO')) {
      analysis.issues.push('TODOs encontrados - revisar pendientes');
    }
    if (content.includes('FIXME')) {
      analysis.issues.push('FIXMEs encontrados - revisar errores conocidos');
    }

    // Sugerencias
    if (analysis.lines > 500) {
      analysis.suggestions.push('Archivo muy largo - considerar dividir en módulos');
    }
    if (analysis.functions.length === 0) {
      analysis.suggestions.push('No se detectaron funciones - verificar estructura');
    }

    console.log(`   📊 ${analysis.lines} líneas, ${analysis.functions.length} funciones`);
    console.log(`   ⚠️  ${analysis.issues.length} issues, 💡 ${analysis.suggestions.length} sugerencias`);

    return analysis;
  }

  /**
   * Crear plan de ejecución
   */
  createPlan(goal: string, steps: Array<{ task: string; type: string; command?: string }>): ExecutionPlan {
    const plan: ExecutionPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      goal,
      steps: steps.map((s, i) => ({
        step: i + 1,
        ...s
      })),
      estimatedDuration: steps.length * 2000,
      riskLevel: 'low'
    };

    console.log(`\n📋 [Plan] ${goal}`);
    console.log(`   Pasos: ${steps.length}`);
    for (const step of plan.steps) {
      console.log(`   ${step.step}. [${step.type}] ${step.task}`);
    }

    return plan;
  }

  /**
   * Ejecutar plan
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult[]> {
    console.log(`\n▶️  [Ejecutar Plan] ${plan.goal}`);

    const results: ExecutionResult[] = [];

    for (const step of plan.steps) {
      console.log(`\n→ Paso ${step.step}/${plan.steps.length}: ${step.task}`);

      let result: ExecutionResult;

      switch (step.type) {
        case 'bash':
          result = await this.executeBash(step.command || '', step.task);
          break;
        case 'python':
          result = await this.executePython(step.command || '', step.task);
          break;
        case 'git':
          result = await this.gitCommand(step.command || '', step.task);
          break;
        default:
          result = {
            id: `step-${Date.now()}`,
            type: 'bash',
            command: step.task,
            success: false,
            output: '',
            error: `Tipo de paso desconocido: ${step.type}`,
            duration: 0,
            timestamp: Date.now()
          };
      }

      results.push(result);

      if (!result.success) {
        console.log(`\n⚠️  Error en paso ${step.step}, deteniendo plan`);
        break;
      }
    }

    console.log(`\n✅ Plan completado: ${results.filter(r => r.success).length}/${results.length} pasos exitosos`);

    return results;
  }

  /**
   * Obtener historial de ejecuciones
   */
  getHistory(limit = 50): ExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Obtener estadísticas
   */
  getStats(): any {
    const successful = this.executionHistory.filter(e => e.success).length;
    const failed = this.executionHistory.filter(e => !e.success).length;
    const byType = this.executionHistory.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDuration = this.executionHistory.reduce((sum, e) => sum + e.duration, 0);

    return {
      totalExecutions: this.executionHistory.length,
      successful,
      failed,
      successRate: `${((successful / this.executionHistory.length) * 100).toFixed(1)}%`,
      byType,
      totalDuration,
      averageDuration: (totalDuration / this.executionHistory.length).toFixed(0) + 'ms'
    };
  }

  /**
   * Cambiar directorio de trabajo
   */
  changeWorkingDirectory(dir: string): boolean {
    const fullPath = path.resolve(this.cwd, dir);
    if (fs.existsSync(fullPath)) {
      this.cwd = fullPath;
      console.log(`📁 Working directory: ${this.cwd}`);
      return true;
    }
    console.warn(`❌ Directorio no existe: ${fullPath}`);
    return false;
  }

  /**
   * Generar reporte de capacidades
   */
  generateCapabilityReport(): string {
    const stats = this.getStats();

    const report = `
💻 JARVIS CODE EXECUTOR - COMO CLAUDE.CODE

🎯 Capacidades Habilitadas
  ✅ Ejecutar comandos bash
  ✅ Ejecutar scripts Python
  ✅ Leer y escribir archivos
  ✅ Operaciones Git (commit, push, etc)
  ✅ Análisis de código
  ✅ Planificación de tareas
  ✅ Ejecución de planes multi-paso

📊 Estadísticas de Ejecución
  • Total: ${stats.totalExecutions} ejecuciones
  • Exitosas: ${stats.successful}
  • Fallidas: ${stats.failed}
  • Tasa éxito: ${stats.successRate}
  • Tiempo total: ${(stats.totalDuration / 1000).toFixed(1)}s
  • Tiempo promedio: ${stats.averageDuration}

🔧 Ejecuciones por tipo
${Object.entries(stats.byType).map(([type, count]) => `  • ${type}: ${count}`).join('\n')}

🚀 Flujo de Trabajo
  1. Recibir tarea
  2. Analizar y crear plan
  3. Ejecutar paso a paso
  4. Registrar resultado
  5. Aprender de la ejecución
  6. Mejorar para próximas veces

✨ Estado: OPERACIONAL - Jarvis es como Claude.Code
`;

    return report;
  }
}

export const jarvisCodeExecutor = new JarvisCodeExecutor();
