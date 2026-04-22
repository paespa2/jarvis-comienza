/**
 * EXECUTION COMMAND HANDLER
 *
 * Interpreta comandos de ejecución en conversaciones
 * - Detecta intención de ejecutar código
 * - Crea planes de ejecución
 * - Ejecuta y reporta resultados
 */

import { jarvisCodeExecutor } from './JarvisCodeExecutor';

export interface ExecutionCommand {
  type: 'bash' | 'python' | 'file' | 'git' | 'analysis' | 'plan';
  action?: string;
  target?: string;
  code?: string;
  description?: string;
  confidence: number;
}

export class ExecutionCommandHandler {
  constructor() {
    console.log('\n⚙️  [ExecutionCommandHandler] Inicializando...');
  }

  /**
   * Detectar comando de ejecución en texto
   */
  detectExecutionCommand(text: string): ExecutionCommand | null {
    const lower = text.toLowerCase();

    // Detectar ejecución de bash
    if (/(ejecuta|run|executa)\s+(bash|comando|cmd)?\s*:\s*(.+)/i.test(text)) {
      const match = text.match(/(ejecuta|run)\s+(bash|comando)?\s*:\s*(.+)/i);
      if (match) {
        return {
          type: 'bash',
          action: 'execute',
          code: match[3].trim(),
          confidence: 0.9
        };
      }
    }

    // Detectar ejecución de Python
    if (/(python|ejecuta python|corre python)\s*:\s*(.+)/i.test(text)) {
      const match = text.match(/(python|ejecuta python)\s*:\s*(.+)/i);
      if (match) {
        return {
          type: 'python',
          action: 'execute',
          code: match[2].trim(),
          confidence: 0.9
        };
      }
    }

    // Detectar lectura de archivo
    if (/(lee|read|abre|open)\s+(archivo|file)?\s+(.+\.(\w+))/i.test(text)) {
      const match = text.match(/(lee|read|abre|open)\s+(archivo|file)?\s+(.+\.(\w+))/i);
      if (match) {
        return {
          type: 'file',
          action: 'read',
          target: match[3].trim(),
          confidence: 0.95
        };
      }
    }

    // Detectar escritura de archivo
    if (/(escribe|write|crea|create)\s+(archivo|file)?\s+(.+)/i.test(text)) {
      const match = text.match(/(escribe|write|crea|create)\s+(archivo|file)?\s+(.+)/i);
      if (match) {
        return {
          type: 'file',
          action: 'write',
          target: match[3].trim(),
          confidence: 0.85
        };
      }
    }

    // Detectar operación Git
    if (/(git|commit|push|pull)\s+(.+)/i.test(text)) {
      const match = text.match(/(git|commit|push|pull)\s+(.+)/i);
      if (match) {
        return {
          type: 'git',
          action: match[1].toLowerCase(),
          code: match[2].trim(),
          confidence: 0.9
        };
      }
    }

    // Detectar solicitud de plan
    if (/(plan|planifica|planify)\s+(.+)para(.+)/i.test(text)) {
      const match = text.match(/(plan|planifica)\s+(.+)\s+para\s+(.+)/i);
      if (match) {
        return {
          type: 'plan',
          action: 'create',
          description: match[2].trim(),
          confidence: 0.85
        };
      }
    }

    // Detectar análisis de código
    if (/(analiza|analyze)\s+(código|code)?\s+(.+\.(\w+))/i.test(text)) {
      const match = text.match(/(analiza|analyze)\s+(código|code)?\s+(.+\.(\w+))/i);
      if (match) {
        return {
          type: 'analysis',
          action: 'analyze',
          target: match[3].trim(),
          confidence: 0.9
        };
      }
    }

    return null;
  }

  /**
   * Ejecutar comando
   */
  async executeCommand(command: ExecutionCommand): Promise<any> {
    console.log(`\n⚡ [ExecutionHandler] Ejecutando: ${command.type}`);

    switch (command.type) {
      case 'bash':
        return await this.executeBash(command.code!);

      case 'python':
        return await this.executePython(command.code!);

      case 'file':
        if (command.action === 'read') {
          return await this.readFile(command.target!);
        } else if (command.action === 'write') {
          return await this.writeFile(command.target!, command.code!);
        }
        break;

      case 'git':
        return await this.executeGit(command.code!);

      case 'analysis':
        return await this.analyzeCode(command.target!);

      case 'plan':
        return await this.createAndExecutePlan(command.description!);

      default:
        return { error: `Tipo desconocido: ${command.type}` };
    }
  }

  /**
   * Ejecutar bash
   */
  private async executeBash(command: string): Promise<any> {
    const result = await jarvisCodeExecutor.executeBash(command, 'Bash command');

    return {
      success: result.success,
      command: result.command,
      output: result.output.substring(0, 1000),
      duration: result.duration,
      message: result.success ? 'Comando ejecutado exitosamente' : `Error: ${result.error}`
    };
  }

  /**
   * Ejecutar Python
   */
  private async executePython(code: string): Promise<any> {
    const result = await jarvisCodeExecutor.executePython(code, 'Python script');

    return {
      success: result.success,
      output: result.output.substring(0, 1000),
      duration: result.duration,
      message: result.success ? 'Script ejecutado exitosamente' : `Error: ${result.error}`
    };
  }

  /**
   * Leer archivo
   */
  private async readFile(filePath: string): Promise<any> {
    const result = await jarvisCodeExecutor.readFile(filePath);

    return {
      success: result.success,
      file: filePath,
      content: result.output.substring(0, 2000),
      size: result.output.length,
      message: result.success ? 'Archivo leído' : `Error: ${result.error}`
    };
  }

  /**
   * Escribir archivo
   */
  private async writeFile(filePath: string, content: string): Promise<any> {
    const result = await jarvisCodeExecutor.writeFile(filePath, content);

    return {
      success: result.success,
      file: filePath,
      size: content.length,
      message: result.success ? 'Archivo escrito' : `Error: ${result.error}`
    };
  }

  /**
   * Ejecutar Git
   */
  private async executeGit(command: string): Promise<any> {
    const result = await jarvisCodeExecutor.gitCommand(command);

    return {
      success: result.success,
      command: `git ${command}`,
      output: result.output.substring(0, 500),
      message: result.success ? 'Comando Git ejecutado' : `Error: ${result.error}`
    };
  }

  /**
   * Analizar código
   */
  private async analyzeCode(filePath: string): Promise<any> {
    try {
      const result = await jarvisCodeExecutor.readFile(filePath);

      if (!result.success) {
        return { error: result.error };
      }

      const language = filePath.split('.').pop() || 'text';
      const analysis = jarvisCodeExecutor.analyzeCode(filePath, language, result.output);

      return {
        success: true,
        file: filePath,
        analysis: {
          lines: analysis.lines,
          functions: analysis.functions.length,
          imports: analysis.imports.length,
          issues: analysis.issues,
          suggestions: analysis.suggestions
        }
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * Crear y ejecutar plan
   */
  private async createAndExecutePlan(goal: string): Promise<any> {
    // Ejemplo de plan simple
    const steps = [
      { task: 'Verificar estado del repositorio', type: 'git', command: 'status' },
      { task: 'Obtener logs recientes', type: 'bash', command: 'git log --oneline -5' },
      { task: 'Mostrar archivos modificados', type: 'bash', command: 'git diff --name-only' }
    ];

    const plan = jarvisCodeExecutor.createPlan(goal, steps);
    const results = await jarvisCodeExecutor.executePlan(plan);

    return {
      success: results.every(r => r.success),
      planId: plan.id,
      goal: plan.goal,
      steps: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Generar respuesta conversacional
   */
  generateResponse(command: ExecutionCommand, result: any): string {
    if (result.error) {
      return `❌ Error ejecutando ${command.type}: ${result.error}`;
    }

    let response = '';

    switch (command.type) {
      case 'bash':
        response = `✅ Bash ejecutado exitosamente\n`;
        response += `⏱️  ${result.duration}ms\n`;
        response += `📤 Output:\n\`\`\`\n${result.output}\n\`\`\``;
        break;

      case 'python':
        response = `✅ Python script ejecutado\n`;
        response += `⏱️  ${result.duration}ms\n`;
        response += `📊 Resultado:\n\`\`\`\n${result.output}\n\`\`\``;
        break;

      case 'file':
        if (command.action === 'read') {
          response = `📖 Contenido de ${result.file} (${result.size} chars):\n\`\`\`\n${result.content}\n\`\`\``;
        } else {
          response = `✍️  Archivo ${result.file} escrito (${result.size} bytes)`;
        }
        break;

      case 'git':
        response = `🔗 Git command executed: ${result.command}\n\`\`\`\n${result.output}\n\`\`\``;
        break;

      case 'analysis':
        response = `🔬 Análisis de ${result.file}:\n`;
        response += `📝 Líneas: ${result.analysis.lines}\n`;
        response += `🔧 Funciones: ${result.analysis.functions}\n`;
        response += `📦 Imports: ${result.analysis.imports}\n`;
        if (result.analysis.issues.length > 0) {
          response += `⚠️  Issues:\n${result.analysis.issues.map((i: string) => `  • ${i}`).join('\n')}\n`;
        }
        if (result.analysis.suggestions.length > 0) {
          response += `💡 Sugerencias:\n${result.analysis.suggestions.map((s: string) => `  • ${s}`).join('\n')}`;
        }
        break;

      case 'plan':
        response = `📋 Plan ejecutado: ${result.goal}\n`;
        response += `✅ Exitosos: ${result.successful}/${result.steps}\n`;
        response += `❌ Fallidos: ${result.failed}`;
        break;

      default:
        response = result.message || 'Comando ejecutado';
    }

    return response;
  }

  /**
   * Obtener capacidades disponibles
   */
  getCapabilities(): string {
    return `
💻 JARVIS CODE EXECUTOR - CAPACIDADES

🔧 Puedo:
  • Ejecutar comandos bash: "ejecuta bash: ls -la"
  • Correr scripts Python: "python: print('Hello')"
  • Leer archivos: "lee archivo src/main.ts"
  • Escribir archivos: "escribe archivo nuevo.txt con contenido"
  • Operaciones Git: "git commit con mensaje 'cambios'"
  • Analizar código: "analiza código en src/app.ts"
  • Crear planes: "planifica ejecución para compilar"

📊 Estadísticas: ${JSON.stringify(jarvisCodeExecutor.getStats(), null, 2)}

✨ Como Claude.Code: Puedo programar, ejecutar y mejorar code en tiempo real
`;
  }
}

export const executionCommandHandler = new ExecutionCommandHandler();
