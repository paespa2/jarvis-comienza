/**
 * TOOL EXECUTOR
 *
 * Ejecutor unificado de herramientas.
 * Selecciona, valida y ejecuta tools de forma segura.
 */

import { geminiService, JARVIS_TOOLS } from '../../services/geminiService';

export interface ToolDecision {
  name: string;
  args: Record<string, any>;
  confidence: number;
}

export interface ToolResult {
  success: boolean;
  output: string;
  duration: number;
}

/**
 * REGISTRO DE HERRAMIENTAS
 *
 * Aquí se registran todas las herramientas disponibles.
 * Esta es la versión inicial (10 herramientas).
 * Será expandido a 50+ en las próximas iteraciones.
 */
const TOOL_REGISTRY = {
  // File Operations
  'file_read': {
    description: 'Leer contenido de un archivo',
    params: { filePath: 'string' },
    category: 'file_ops',
  },
  'file_write': {
    description: 'Escribir contenido a un archivo',
    params: { filePath: 'string', content: 'string' },
    category: 'file_ops',
  },
  'file_search': {
    description: 'Buscar patrones en archivos con grep',
    params: { pattern: 'string', directory: 'string' },
    category: 'file_ops',
  },

  // Code Execution
  'code_execute': {
    description: 'Ejecutar código (Python, JavaScript, Bash)',
    params: { language: 'string', code: 'string' },
    category: 'code_exec',
  },

  // Web Operations
  'web_fetch': {
    description: 'Fetch de contenido web',
    params: { url: 'string' },
    category: 'web_ops',
  },

  // Data Analysis
  'data_analyze': {
    description: 'Analizar datos (CSV, JSON)',
    params: { data: 'string', analysisType: 'string' },
    category: 'data_analysis',
  },

  // Git Operations
  'git_status': {
    description: 'Obtener estado del repositorio git',
    params: { repoPath: 'string' },
    category: 'git',
  },
  'git_commit': {
    description: 'Crear commit en git',
    params: { repoPath: 'string', message: 'string' },
    category: 'git',
  },

  // System
  'system_info': {
    description: 'Obtener información del sistema',
    params: {},
    category: 'system',
  },

  // Documentation
  'markdown_generate': {
    description: 'Generar documentación en Markdown',
    params: { topic: 'string', content: 'string' },
    category: 'documentation',
  },
};

export class ToolExecutor {
  /**
   * SELECCIONAR HERRAMIENTA APROPIADA
   *
   * Analiza el plan y decide qué herramienta usar
   */
  async selectTool(plan: string): Promise<ToolDecision | null> {
    console.log(`   Consultando Gemini para selección de herramienta...`);

    const toolDescriptions = Object.entries(TOOL_REGISTRY)
      .map(([name, info]) => `- ${name}: ${info.description}`)
      .join('\n');

    const prompt = `
PLAN A EJECUTAR: ${plan}

HERRAMIENTAS DISPONIBLES:
${toolDescriptions}

¿Cuál es la herramienta más apropiada para este paso?
Responde en JSON:
{
  "toolName": "nombre_de_herramienta",
  "args": { "param": "valor" },
  "confidence": 0.0-1.0,
  "reasoning": "por qué elegiste esta herramienta"
}

Si ninguna herramienta es aplicable, responde:
{
  "toolName": null,
  "reasoning": "razón"
}
`;

    try {
      const response = await geminiService.generateResponse(
        prompt,
        'Eres un selector de herramientas. Identifica qué herramienta es más apropiada para cada tarea.',
        false,
        'gemini-3-flash-preview'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const decision = JSON.parse(jsonMatch[0]);

      if (!decision.toolName) return null;

      return {
        name: decision.toolName,
        args: decision.args || {},
        confidence: decision.confidence || 0.5,
      };
    } catch (error: any) {
      console.error('Error seleccionando herramienta:', error);
      return null;
    }
  }

  /**
   * EJECUTAR HERRAMIENTA
   *
   * Ejecuta la herramienta seleccionada de forma segura
   */
  async execute(toolName: string, args: Record<string, any>): Promise<string> {
    console.log(`   📦 Ejecutando: ${toolName}`);
    console.log(`   Args: ${JSON.stringify(args)}`);

    const startTime = Date.now();

    try {
      // VALIDACIÓN 1: ¿Existe la herramienta?
      if (!TOOL_REGISTRY[toolName as keyof typeof TOOL_REGISTRY]) {
        throw new Error(`Herramienta desconocida: ${toolName}`);
      }

      // VALIDACIÓN 2: ¿Tiene permisos?
      await this.validatePermissions(toolName, args);

      // EJECUCIÓN
      let result: string;

      switch (toolName) {
        case 'file_read':
          result = await this.tool_FileRead(args.filePath);
          break;
        case 'file_write':
          result = await this.tool_FileWrite(args.filePath, args.content);
          break;
        case 'file_search':
          result = await this.tool_FileSearch(args.pattern, args.directory);
          break;
        case 'code_execute':
          result = await this.tool_CodeExecute(args.language, args.code);
          break;
        case 'web_fetch':
          result = await this.tool_WebFetch(args.url);
          break;
        case 'system_info':
          result = await this.tool_SystemInfo();
          break;
        default:
          result = `Herramienta ${toolName} no implementada aún. Placeholder.`;
      }

      const duration = Date.now() - startTime;
      console.log(`   ✅ Completado en ${duration}ms`);

      return result;
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message);
      return `ERROR: ${error.message}`;
    }
  }

  /**
   * VALIDACIÓN DE PERMISOS
   */
  private async validatePermissions(toolName: string, args: Record<string, any>): Promise<void> {
    // Implementar lógica de validación de permisos
    // Por ahora, permitir todo (será expandido en seguridad)

    const dangerousTools = ['code_execute'];
    if (dangerousTools.includes(toolName)) {
      console.log(`   ⚠️  Tool peligrosa: ${toolName}. Requiere validación adicional.`);
      // En producción, aquí haría una llamada a LoyaltyEvaluator
    }
  }

  /**
   * IMPLEMENTACIÓN DE TOOLS
   */

  private async tool_FileRead(filePath: string): Promise<string> {
    // En producción, usar fs.readFileSync
    return `[STUB] Contenido de ${filePath}`;
  }

  private async tool_FileWrite(filePath: string, content: string): Promise<string> {
    // En producción, usar fs.writeFileSync
    return `[STUB] Archivo escrito: ${filePath}`;
  }

  private async tool_FileSearch(pattern: string, directory: string): Promise<string> {
    // En producción, usar grep/rg
    return `[STUB] Búsqueda de "${pattern}" en ${directory}`;
  }

  private async tool_CodeExecute(language: string, code: string): Promise<string> {
    // En producción, usar child_process.exec con sandbox
    return `[STUB] Ejecutar ${language}: ${code.substring(0, 50)}...`;
  }

  private async tool_WebFetch(url: string): Promise<string> {
    // En producción, usar fetch API
    return `[STUB] Contenido de ${url}`;
  }

  private async tool_SystemInfo(): Promise<string> {
    return `[STUB] Información del sistema: Node ${process.version}`;
  }
}
