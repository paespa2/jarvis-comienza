/**
 * SYSTEM AUTOMATION SERVICE
 *
 * Automatización del sistema:
 * - Ejecución de comandos
 * - Creación y ejecución de scripts
 * - Gestión de archivos
 * - Instalación de software
 * - Análisis de procesos
 */

import { execSync, exec, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  timestamp: number;
}

interface ScriptExecutionResult {
  scriptPath: string;
  language: string;
  exitCode: number;
  output: string;
  errors: string;
  executionTime: number;
  timestamp: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  memory: string;
  cpu: string;
}

interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: number;
  hostname: string;
  user: string;
}

export class SystemAutomationService {
  private workingDirectory: string;
  private maxCommandTimeout: number = 30000; // 30 segundos

  constructor(workingDir: string = process.cwd()) {
    this.workingDirectory = workingDir;
    console.log(`📁 System Automation initialized at: ${workingDir}`);
  }

  /**
   * EJECUTAR COMANDO
   * Ejecuta un comando del sistema con timeout
   */
  async executeCommand(
    command: string,
    options?: { cwd?: string; timeout?: number; shell?: string }
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const cwd = options?.cwd || this.workingDirectory;
    const timeout = options?.timeout || this.maxCommandTimeout;
    const shell = options?.shell || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');

    try {
      console.log(`⚡ Ejecutando: ${command}`);

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      // Usar exec con timeout
      await new Promise((resolve, reject) => {
        const proc = exec(command, { cwd, shell, timeout }, (error, out, err) => {
          stdout = out || '';
          stderr = err || '';
          if (error) {
            exitCode = error.code || 1;
          }
          resolve(null);
        });

        // Timeout handler
        const timeoutHandle = setTimeout(() => {
          proc.kill();
          reject(new Error(`Command timeout after ${timeout}ms`));
        }, timeout);

        proc.on('close', () => clearTimeout(timeoutHandle));
      });

      return {
        command,
        exitCode,
        stdout,
        stderr,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error ejecutando comando:`, error.message);
      return {
        command,
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * CREAR Y EJECUTAR SCRIPT
   * Crea un archivo de script y lo ejecuta
   */
  async createAndExecuteScript(
    content: string,
    filename: string,
    language: 'python' | 'javascript' | 'bash' | 'powershell' = 'javascript'
  ): Promise<ScriptExecutionResult> {
    const startTime = Date.now();

    try {
      // Determinar extensión y comando de ejecución
      let extension = '.js';
      let executeCommand = 'node';

      switch (language) {
        case 'python':
          extension = '.py';
          executeCommand = 'python3';
          break;
        case 'bash':
          extension = '.sh';
          executeCommand = 'bash';
          break;
        case 'powershell':
          extension = '.ps1';
          executeCommand = 'powershell.exe';
          break;
      }

      // Crear archivo
      const scriptPath = path.join(this.workingDirectory, `${filename}${extension}`);
      fs.writeFileSync(scriptPath, content, 'utf-8');

      console.log(`📝 Script creado: ${scriptPath}`);

      // Ejecutar
      const result = await this.executeCommand(`${executeCommand} "${scriptPath}"`);

      // Limpiar archivo si está en fallback mode (opcional)
      // fs.unlinkSync(scriptPath);

      return {
        scriptPath,
        language,
        exitCode: result.exitCode,
        output: result.stdout,
        errors: result.stderr,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error en script execution:`, error.message);
      return {
        scriptPath: filename,
        language,
        exitCode: 1,
        output: '',
        errors: error.message,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * CREAR ARCHIVO
   * Crea un archivo con contenido
   */
  async createFile(
    filename: string,
    content: string,
    options?: { overwrite?: boolean }
  ): Promise<{ path: string; success: boolean; message: string }> {
    try {
      const filePath = path.join(this.workingDirectory, filename);

      // Verificar si existe y no permitir sobrescribir
      if (fs.existsSync(filePath) && !options?.overwrite) {
        return {
          path: filePath,
          success: false,
          message: `Archivo ya existe: ${filePath}`,
        };
      }

      // Crear directorio si es necesario
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf-8');

      console.log(`✅ Archivo creado: ${filePath}`);

      return {
        path: filePath,
        success: true,
        message: `Archivo creado: ${filePath}`,
      };
    } catch (error: any) {
      console.error(`❌ Error creando archivo:`, error.message);
      return {
        path: filename,
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * LEER ARCHIVO
   */
  async readFile(filename: string): Promise<{ path: string; content: string; success: boolean }> {
    try {
      const filePath = path.join(this.workingDirectory, filename);

      if (!fs.existsSync(filePath)) {
        return {
          path: filePath,
          content: '',
          success: false,
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        path: filePath,
        content,
        success: true,
      };
    } catch (error: any) {
      console.error(`❌ Error leyendo archivo:`, error.message);
      return {
        path: filename,
        content: '',
        success: false,
      };
    }
  }

  /**
   * LISTAR DIRECTORIO
   */
  async listDirectory(dirPath: string = '.'): Promise<{
    path: string;
    files: string[];
    directories: string[];
  }> {
    try {
      const fullPath = path.join(this.workingDirectory, dirPath);

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });

      const files = entries.filter(e => e.isFile()).map(e => e.name);
      const directories = entries.filter(e => e.isDirectory()).map(e => e.name);

      return {
        path: fullPath,
        files,
        directories,
      };
    } catch (error: any) {
      console.error(`❌ Error listando directorio:`, error.message);
      return {
        path: dirPath,
        files: [],
        directories: [],
      };
    }
  }

  /**
   * INSTALAR PAQUETE
   * Instala paquetes usando npm, pip, apt, etc.
   */
  async installPackage(
    packageName: string,
    packageManager: 'npm' | 'pip' | 'apt' | 'brew' = 'npm'
  ): Promise<CommandResult> {
    const commands: Record<string, string> = {
      npm: `npm install ${packageName} --save`,
      pip: `pip install ${packageName}`,
      apt: `sudo apt-get install -y ${packageName}`,
      brew: `brew install ${packageName}`,
    };

    const command = commands[packageManager] || commands.npm;

    console.log(`📦 Instalando ${packageName} con ${packageManager}...`);

    return await this.executeCommand(command);
  }

  /**
   * OBTENER INFORMACIÓN DEL SISTEMA
   */
  getSystemInfo(): SystemInfo {
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: cpuCount,
      totalMemory: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMemory: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: os.uptime(),
      hostname: os.hostname(),
      user: os.userInfo().username,
    };
  }

  /**
   * LISTAR PROCESOS (básico)
   */
  async listProcesses(): Promise<ProcessInfo[]> {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'tasklist /FO CSV /NH' : 'ps aux';

      const result = await this.executeCommand(command);

      // Parsing básico - retornar formato procesado
      const lines = result.stdout.split('\n');

      return lines.slice(0, 10).map((line, idx) => ({
        pid: idx,
        name: line.split(',')[0]?.replace(/"/g, '') || 'unknown',
        memory: 'N/A',
        cpu: 'N/A',
      }));
    } catch (error) {
      console.error(`❌ Error listando procesos:`, error);
      return [];
    }
  }

  /**
   * ANALIZAR CÓDIGO
   * Análisis estático de código (búsqueda de patrones)
   */
  async analyzeCode(
    filePath: string,
    patterns?: string[]
  ): Promise<{ issues: Array<{ line: number; pattern: string; match: string }> }> {
    try {
      const result = await this.readFile(filePath);

      if (!result.success) {
        return { issues: [] };
      }

      const issues: Array<{ line: number; pattern: string; match: string }> = [];

      // Patrones de seguridad por defecto
      const securityPatterns = patterns || [
        'eval\\(',
        'exec\\(',
        'system\\(',
        'shell_exec\\(',
        '__import__',
        'subprocess',
        'os\\.system',
        'os\\.popen',
      ];

      const lines = result.content.split('\n');

      lines.forEach((line, lineNum) => {
        securityPatterns.forEach(pattern => {
          const regex = new RegExp(pattern, 'g');
          let match;
          while ((match = regex.exec(line)) !== null) {
            issues.push({
              line: lineNum + 1,
              pattern,
              match: match[0],
            });
          }
        });
      });

      return { issues };
    } catch (error: any) {
      console.error(`❌ Error analizando código:`, error.message);
      return { issues: [] };
    }
  }

  /**
   * GENERAR REPORTE
   * Genera un reporte de estado del sistema
   */
  async generateSystemReport(): Promise<string> {
    const systemInfo = this.getSystemInfo();
    const processes = await this.listProcesses();

    return `
╔════════════════════════════════════════════════════════════╗
║         SYSTEM AUTOMATION REPORT
╚════════════════════════════════════════════════════════════╝

📊 SYSTEM INFORMATION:
  Platform: ${systemInfo.platform} ${systemInfo.arch}
  Hostname: ${systemInfo.hostname}
  User: ${systemInfo.user}
  CPUs: ${systemInfo.cpus}
  Total Memory: ${systemInfo.totalMemory}
  Free Memory: ${systemInfo.freeMemory}
  Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m

📁 WORKING DIRECTORY:
  ${this.workingDirectory}

⚙️  STATUS:
  ✅ Command Execution: READY
  ✅ Script Execution: READY
  ✅ File Operations: READY
  ✅ Package Management: READY
  ✅ Process Monitoring: READY

🔧 CAPABILITIES:
  • Execute arbitrary commands
  • Create and run scripts (Python, Bash, JavaScript, PowerShell)
  • Manage files and directories
  • Install packages
  • Monitor system processes
  • Analyze code for security patterns
    `;
  }
}

export const systemAutomationService = new SystemAutomationService();
