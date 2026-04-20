/**
 * DYNAMIC TOOLING SERVICE
 *
 * Extensión dinámica de capacidades:
 * - Instalación de herramientas en runtime
 * - Sistema de plugins
 * - Integración de APIs personalizadas
 * - Carga dinámica de módulos
 */

import * as fs from 'fs';
import * as path from 'path';
import { systemAutomationService } from './systemAutomationService';

interface Tool {
  id: string;
  name: string;
  description: string;
  version: string;
  packageName?: string;
  packageManager?: 'npm' | 'pip' | 'apt' | 'brew';
  installed: boolean;
  enabled: boolean;
  capabilities: string[];
  installTime?: number;
  lastUsed?: number;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  entryPoint: string;
  capabilities: string[];
  installed: boolean;
  enabled: boolean;
  config?: any;
}

interface CustomAPI {
  id: string;
  name: string;
  baseUrl: string;
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    params?: string[];
  }>;
  headers?: Record<string, string>;
  authenticated: boolean;
  rateLimit?: number;
}

export class DynamicToolingService {
  private toolsDirectory: string;
  private pluginsDirectory: string;
  private registeredTools: Map<string, Tool> = new Map();
  private loadedPlugins: Map<string, Plugin> = new Map();
  private customAPIs: Map<string, CustomAPI> = new Map();

  constructor(baseDir: string = process.cwd()) {
    this.toolsDirectory = path.join(baseDir, '.jarvis-tools');
    this.pluginsDirectory = path.join(baseDir, '.jarvis-plugins');

    this.ensureDirectories();
    this.loadToolRegistry();
  }

  /**
   * ASEGURAR DIRECTORIOS
   */
  private ensureDirectories() {
    [this.toolsDirectory, this.pluginsDirectory].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
      }
    });
  }

  /**
   * CARGAR REGISTRO DE HERRAMIENTAS
   */
  private loadToolRegistry() {
    // Herramientas disponibles
    const availableTools: Record<string, Tool> = {
      nmap: {
        id: 'nmap',
        name: 'nmap',
        description: 'Network security scanner',
        version: '7.94',
        packageName: 'nmap',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['network-scanning', 'port-discovery', 'service-enumeration'],
      },
      metasploit: {
        id: 'metasploit',
        name: 'Metasploit Framework',
        description: 'Penetration testing framework',
        version: '6.3',
        packageName: 'metasploit-framework',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: [
          'exploitation',
          'payload-generation',
          'social-engineering',
          'post-exploitation',
        ],
      },
      burpsuite: {
        id: 'burpsuite',
        name: 'Burp Suite',
        description: 'Web application testing platform',
        version: '2023.12',
        packageName: 'burpsuite',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: [
          'web-scanning',
          'proxy-interception',
          'vulnerability-detection',
        ],
      },
      sqlmap: {
        id: 'sqlmap',
        name: 'sqlmap',
        description: 'SQL injection detection and exploitation',
        version: '1.8',
        packageName: 'sqlmap',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['sql-injection', 'database-enumeration', 'data-extraction'],
      },
      wireshark: {
        id: 'wireshark',
        name: 'Wireshark',
        description: 'Network protocol analyzer',
        version: '4.0',
        packageName: 'wireshark',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['packet-analysis', 'network-monitoring', 'protocol-dissection'],
      },
      aircrack_ng: {
        id: 'aircrack-ng',
        name: 'Aircrack-ng',
        description: 'WiFi security testing suite',
        version: '1.7',
        packageName: 'aircrack-ng',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['wifi-cracking', 'packet-capture', 'password-recovery'],
      },
      john: {
        id: 'john',
        name: 'John the Ripper',
        description: 'Password cracking tool',
        version: '1.9',
        packageName: 'john',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['password-cracking', 'hash-cracking', 'dictionary-attacks'],
      },
      ghidra: {
        id: 'ghidra',
        name: 'Ghidra',
        description: 'Reverse engineering framework',
        version: '10.3',
        packageName: 'ghidra',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: [
          'reverse-engineering',
          'binary-analysis',
          'decompilation',
          'debugging',
        ],
      },
      docker: {
        id: 'docker',
        name: 'Docker',
        description: 'Container platform',
        version: '24.0',
        packageName: 'docker.io',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: ['containerization', 'environment-isolation', 'orchestration'],
      },
      kubernetes: {
        id: 'kubernetes',
        name: 'Kubernetes',
        description: 'Container orchestration',
        version: '1.27',
        packageName: 'kubernetes',
        packageManager: 'apt',
        installed: false,
        enabled: false,
        capabilities: [
          'container-orchestration',
          'service-deployment',
          'scaling',
        ],
      },
    };

    // Registrar herramientas
    Object.entries(availableTools).forEach(([key, tool]) => {
      this.registeredTools.set(key, tool);
    });

    console.log(`📦 ${this.registeredTools.size} tools registered`);
  }

  /**
   * INSTALAR HERRAMIENTA
   */
  async installTool(toolId: string): Promise<{
    success: boolean;
    message: string;
    tool?: Tool;
    installTime: number;
  }> {
    const startTime = Date.now();

    const tool = this.registeredTools.get(toolId);
    if (!tool) {
      return {
        success: false,
        message: `Tool not found: ${toolId}`,
        installTime: Date.now() - startTime,
      };
    }

    if (tool.installed) {
      return {
        success: true,
        message: `Tool already installed: ${tool.name}`,
        tool,
        installTime: Date.now() - startTime,
      };
    }

    try {
      console.log(`📦 Instalando herramienta: ${tool.name}...`);

      if (tool.packageName && tool.packageManager) {
        const result = await systemAutomationService.installPackage(
          tool.packageName,
          tool.packageManager
        );

        if (result.exitCode === 0) {
          tool.installed = true;
          tool.installTime = Date.now() - startTime;
          this.registeredTools.set(toolId, tool);

          console.log(`✅ Tool installed: ${tool.name}`);

          return {
            success: true,
            message: `Tool successfully installed: ${tool.name}`,
            tool,
            installTime: Date.now() - startTime,
          };
        } else {
          return {
            success: false,
            message: `Installation failed: ${result.stderr}`,
            installTime: Date.now() - startTime,
          };
        }
      }

      return {
        success: false,
        message: `No installation method available for: ${tool.name}`,
        installTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Installation error: ${error.message}`,
        installTime: Date.now() - startTime,
      };
    }
  }

  /**
   * HABILITAR HERRAMIENTA
   */
  enableTool(toolId: string): { success: boolean; message: string } {
    const tool = this.registeredTools.get(toolId);

    if (!tool) {
      return { success: false, message: `Tool not found: ${toolId}` };
    }

    if (!tool.installed) {
      return {
        success: false,
        message: `Tool must be installed first: ${toolId}`,
      };
    }

    tool.enabled = true;
    tool.lastUsed = Date.now();
    this.registeredTools.set(toolId, tool);

    console.log(`✅ Tool enabled: ${tool.name}`);

    return {
      success: true,
      message: `Tool enabled: ${tool.name}`,
    };
  }

  /**
   * DESHABILITAR HERRAMIENTA
   */
  disableTool(toolId: string): { success: boolean; message: string } {
    const tool = this.registeredTools.get(toolId);

    if (!tool) {
      return { success: false, message: `Tool not found: ${toolId}` };
    }

    tool.enabled = false;
    this.registeredTools.set(toolId, tool);

    return {
      success: true,
      message: `Tool disabled: ${tool.name}`,
    };
  }

  /**
   * LISTAR HERRAMIENTAS DISPONIBLES
   */
  listTools(filter?: { installed?: boolean; enabled?: boolean }): Tool[] {
    let tools = Array.from(this.registeredTools.values());

    if (filter?.installed !== undefined) {
      tools = tools.filter(t => t.installed === filter.installed);
    }

    if (filter?.enabled !== undefined) {
      tools = tools.filter(t => t.enabled === filter.enabled);
    }

    return tools;
  }

  /**
   * CREAR PLUGIN PERSONALIZADO
   */
  async createPlugin(
    pluginDefinition: Omit<Plugin, 'installed' | 'enabled'>
  ): Promise<{ success: boolean; plugin?: Plugin; message: string }> {
    try {
      const plugin: Plugin = {
        ...pluginDefinition,
        installed: true,
        enabled: false,
      };

      // Crear archivo de metadatos
      const metaPath = path.join(
        this.pluginsDirectory,
        `${plugin.id}.metadata.json`
      );
      fs.writeFileSync(metaPath, JSON.stringify(plugin, null, 2), 'utf-8');

      this.loadedPlugins.set(plugin.id, plugin);

      console.log(`✅ Plugin created: ${plugin.name}`);

      return {
        success: true,
        plugin,
        message: `Plugin created: ${plugin.name}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error creating plugin: ${error.message}`,
      };
    }
  }

  /**
   * REGISTRAR API PERSONALIZADA
   */
  registerCustomAPI(api: CustomAPI): { success: boolean; message: string } {
    try {
      this.customAPIs.set(api.id, api);

      console.log(`✅ Custom API registered: ${api.name}`);

      return {
        success: true,
        message: `Custom API registered: ${api.name}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error registering API: ${error.message}`,
      };
    }
  }

  /**
   * LISTAR APIs PERSONALIZADAS
   */
  listCustomAPIs(): CustomAPI[] {
    return Array.from(this.customAPIs.values());
  }

  /**
   * OBTENER STATUS
   */
  getStatus(): {
    totalTools: number;
    installedTools: number;
    enabledTools: number;
    totalPlugins: number;
    customAPIs: number;
  } {
    const tools = Array.from(this.registeredTools.values());
    const installedCount = tools.filter(t => t.installed).length;
    const enabledCount = tools.filter(t => t.enabled).length;

    return {
      totalTools: tools.length,
      installedTools: installedCount,
      enabledTools: enabledCount,
      totalPlugins: this.loadedPlugins.size,
      customAPIs: this.customAPIs.size,
    };
  }

  /**
   * GENERAR REPORTE DE CAPACIDADES
   */
  generateCapabilitiesReport(): string {
    const status = this.getStatus();
    const enabledTools = this.listTools({ enabled: true });

    const capabilities = new Set<string>();
    enabledTools.forEach(tool => {
      tool.capabilities.forEach(cap => capabilities.add(cap));
    });

    return `
╔════════════════════════════════════════════════════════════╗
║         DYNAMIC TOOLING CAPABILITIES REPORT
╚════════════════════════════════════════════════════════════╝

📊 TOOL INVENTORY:
  Total Tools: ${status.totalTools}
  Installed: ${status.installedTools}
  Enabled: ${status.enabledTools}

🔌 PLUGINS:
  Total Loaded: ${status.totalPlugins}

🌐 CUSTOM APIs:
  Registered: ${status.customAPIs}

⚡ ACTIVE CAPABILITIES:
${Array.from(capabilities)
  .map(cap => `  • ${cap}`)
  .join('\n')}

🛠️  INSTALLED TOOLS:
${enabledTools.map(tool => `  • ${tool.name} (v${tool.version})`).join('\n')}
    `;
  }
}

export const dynamicToolingService = new DynamicToolingService();
