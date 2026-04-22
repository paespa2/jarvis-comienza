/**
 * NAMED ENTITY RECOGNITION (NER)
 *
 * Sistema de reconocimiento de entidades nombradas
 * - Identifica targets (dominios, IPs, URLs)
 * - Detecta herramientas de seguridad
 * - Reconoce CVEs y vulnerabilidades
 * - Rastrea referencias a tecnologías
 * - Extrae parámetros de ataque
 *
 * ✨ FASE 8: Comprensión Profunda de Entidades
 */

export interface NamedEntity {
  type: 'domain' | 'ip-address' | 'url' | 'tool' | 'cve' | 'vulnerability' | 'port' | 'protocol' | 'file' | 'user' | 'technology';
  value: string;
  confidence: number;
  context?: string;
}

export interface EntityPattern {
  type: string;
  pattern: RegExp;
  confidence: number;
}

export interface NERResult {
  text: string;
  entities: NamedEntity[];
  entityFrequency: Map<string, number>;
  primaryTargets: NamedEntity[];
  primaryTools: NamedEntity[];
  vulnerabilities: NamedEntity[];
}

export class NamedEntityRecognition {
  private entityPatterns: EntityPattern[] = [];
  private securityTools: Set<string> = new Set();
  private commonVulnerabilities: Set<string> = new Set();

  constructor() {
    console.log('\n🏷️  [NamedEntityRecognition] Inicializando...');
    this.initializePatterns();
    this.loadSecurityDatabase();
  }

  /**
   * Inicializar patrones de reconocimiento
   */
  private initializePatterns(): void {
    this.entityPatterns = [
      // Dominios
      {
        type: 'domain',
        pattern: /(?:^|\s)([a-zA-Z0-9-]+\.(?:com|org|net|io|co|es|fr|de|uk|au|ca|jp|cn|ru|gov|edu|mil|info|biz|co\.uk|co\.jp|com\.br|com\.mx))\b/gi,
        confidence: 0.95
      },

      // URLs
      {
        type: 'url',
        pattern: /(https?:\/\/[^\s\)]+)/gi,
        confidence: 0.98
      },

      // Direcciones IP (IPv4)
      {
        type: 'ip-address',
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        confidence: 0.99
      },

      // CVEs
      {
        type: 'cve',
        pattern: /CVE-\d{4}-\d{4,5}/gi,
        confidence: 0.99
      },

      // Puertos
      {
        type: 'port',
        pattern: /(?:puerto|port|:)\s*(\d{2,5})/gi,
        confidence: 0.85
      },

      // Protocolos
      {
        type: 'protocol',
        pattern: /\b(http|https|ftp|ssh|telnet|smtp|pop3|imap|ldap|dns|mysql|postgresql|mongodb|redis)\b/gi,
        confidence: 0.90
      },

      // Rutas de archivo
      {
        type: 'file',
        pattern: /(?:\/[a-zA-Z0-9._\-/]*|C:\\[a-zA-Z0-9._\-\\]*)/g,
        confidence: 0.80
      },

      // Nombres de usuario
      {
        type: 'user',
        pattern: /(?:usuario|user|usuario\s+de|login\s+as)\s+([a-zA-Z0-9._\-@]+)/gi,
        confidence: 0.75
      }
    ];

    console.log(`✅ ${this.entityPatterns.length} patrones de reconocimiento inicializados`);
  }

  /**
   * Cargar base de datos de seguridad
   */
  private loadSecurityDatabase(): void {
    // Herramientas de seguridad conocidas
    const tools = [
      'nmap', 'metasploit', 'burp-suite', 'burp', 'sqlmap', 'wireshark',
      'hydra', 'john', 'hashcat', 'aircrack', 'w3af', 'zap', 'nikto',
      'masscan', 'zmap', 'shodan', 'censys', 'whatweb', 'dirb', 'gobuster',
      'ffuf', 'wfuzz', 'dirbuster', 'sqlninja', 'commix', 'xsstrike',
      'nuclei', 'subfinder', 'amass', 'subfinder', 'knock', 'fierce',
      'dnsrecon', 'dnsenum', 'recon-ng', 'the-harvester', 'osint',
      'curl', 'wget', 'netcat', 'nc', 'socat', 'python', 'bash', 'powershell'
    ];

    for (const tool of tools) {
      this.securityTools.add(tool);
    }

    // Vulnerabilidades comunes
    const vulns = [
      'sql-injection', 'xss', 'csrf', 'idor', 'rce', 'lfi', 'rfi',
      'path-traversal', 'command-injection', 'xxe', 'insecure-deserialization',
      'broken-authentication', 'sensitive-data-exposure', 'xml-external-entity',
      'broken-access-control', 'security-misconfiguration', 'default-credentials',
      'hardcoded-credentials', 'buffer-overflow', 'race-condition'
    ];

    for (const vuln of vulns) {
      this.commonVulnerabilities.add(vuln);
    }

    console.log(`✅ Base de datos de seguridad cargada: ${this.securityTools.size} tools, ${this.commonVulnerabilities.size} vulns`);
  }

  /**
   * Reconocer entidades en texto
   */
  recognizeEntities(text: string): NERResult {
    const entities: NamedEntity[] = [];
    const entityFrequency = new Map<string, number>();

    // Aplicar todos los patrones
    for (const patternDef of this.entityPatterns) {
      const matches = text.matchAll(patternDef.pattern);

      for (const match of matches) {
        const value = match[1] || match[0];
        const entity: NamedEntity = {
          type: patternDef.type as any,
          value,
          confidence: patternDef.confidence,
          context: text.substring(Math.max(0, match.index! - 20), Math.min(text.length, match.index! + value.length + 20))
        };

        entities.push(entity);

        // Contabilizar frecuencia
        const key = `${entity.type}:${entity.value}`;
        entityFrequency.set(key, (entityFrequency.get(key) || 0) + 1);
      }
    }

    // Detectar herramientas
    const toolMatches = this.detectTools(text);
    for (const tool of toolMatches) {
      entities.push(tool);

      const key = `tool:${tool.value}`;
      entityFrequency.set(key, (entityFrequency.get(key) || 0) + 1);
    }

    // Detectar vulnerabilidades
    const vulnMatches = this.detectVulnerabilities(text);
    for (const vuln of vulnMatches) {
      entities.push(vuln);

      const key = `vulnerability:${vuln.value}`;
      entityFrequency.set(key, (entityFrequency.get(key) || 0) + 1);
    }

    // Detectar tecnologías
    const techMatches = this.detectTechnologies(text);
    for (const tech of techMatches) {
      entities.push(tech);

      const key = `technology:${tech.value}`;
      entityFrequency.set(key, (entityFrequency.get(key) || 0) + 1);
    }

    // Identificar entidades primarias
    const primaryTargets = entities.filter(e =>
      ['domain', 'ip-address', 'url'].includes(e.type)
    );

    const primaryTools = entities.filter(e => e.type === 'tool');

    const vulnerabilities = entities.filter(e => e.type === 'vulnerability');

    return {
      text,
      entities,
      entityFrequency,
      primaryTargets,
      primaryTools,
      vulnerabilities
    };
  }

  /**
   * Detectar herramientas de seguridad
   */
  private detectTools(text: string): NamedEntity[] {
    const tools: NamedEntity[] = [];
    const lower = text.toLowerCase();

    for (const tool of this.securityTools) {
      // Búsqueda con límites de palabra
      const regex = new RegExp(`\\b${tool}\\b`, 'gi');
      const matches = text.matchAll(regex);

      for (const match of matches) {
        tools.push({
          type: 'tool',
          value: tool,
          confidence: 0.95,
          context: text.substring(Math.max(0, match.index! - 20), Math.min(text.length, match.index! + tool.length + 20))
        });
      }
    }

    return tools;
  }

  /**
   * Detectar vulnerabilidades
   */
  private detectVulnerabilities(text: string): NamedEntity[] {
    const vulnerabilities: NamedEntity[] = [];
    const lower = text.toLowerCase();

    for (const vuln of this.commonVulnerabilities) {
      if (lower.includes(vuln) || lower.includes(vuln.replace('-', ' '))) {
        vulnerabilities.push({
          type: 'vulnerability',
          value: vuln,
          confidence: 0.90
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Detectar tecnologías
   */
  private detectTechnologies(text: string): NamedEntity[] {
    const technologies: NamedEntity[] = [];
    const lower = text.toLowerCase();

    const techPatterns = [
      { name: 'Apache', keywords: ['apache', 'httpd'] },
      { name: 'Nginx', keywords: ['nginx'] },
      { name: 'IIS', keywords: ['iis', 'internet information services'] },
      { name: 'Node.js', keywords: ['node.js', 'nodejs', 'node'] },
      { name: 'PHP', keywords: ['php'] },
      { name: 'Python', keywords: ['python'] },
      { name: 'Java', keywords: ['java'] },
      { name: 'MySQL', keywords: ['mysql'] },
      { name: 'PostgreSQL', keywords: ['postgresql', 'postgres'] },
      { name: 'MongoDB', keywords: ['mongodb', 'mongo'] },
      { name: 'Redis', keywords: ['redis'] },
      { name: 'Docker', keywords: ['docker'] },
      { name: 'Kubernetes', keywords: ['kubernetes', 'k8s'] },
      { name: 'AWS', keywords: ['aws', 'amazon web services'] },
      { name: 'Azure', keywords: ['azure', 'microsoft azure'] },
      { name: 'GCP', keywords: ['gcp', 'google cloud'] },
      { name: 'Jenkins', keywords: ['jenkins'] },
      { name: 'Git', keywords: ['git'] },
      { name: 'Linux', keywords: ['linux'] },
      { name: 'Windows', keywords: ['windows'] }
    ];

    for (const tech of techPatterns) {
      for (const keyword of tech.keywords) {
        if (lower.includes(keyword)) {
          technologies.push({
            type: 'technology',
            value: tech.name,
            confidence: 0.85
          });
          break;
        }
      }
    }

    return technologies;
  }

  /**
   * Extraer información de ataque
   */
  extractAttackParameters(text: string): any {
    const result = this.recognizeEntities(text);

    return {
      targets: result.primaryTargets.map(t => ({ type: t.type, value: t.value })),
      tools: result.primaryTools.map(t => t.value),
      vulnerabilities: result.vulnerabilities.map(v => v.value),
      technologies: result.entities.filter(e => e.type === 'technology').map(e => e.value),
      ports: result.entities.filter(e => e.type === 'port').map(e => e.value),
      protocols: result.entities.filter(e => e.type === 'protocol').map(e => e.value),
      files: result.entities.filter(e => e.type === 'file').map(e => e.value),
      cves: result.entities.filter(e => e.type === 'cve').map(e => e.value)
    };
  }

  /**
   * Generar reporte de entidades
   */
  generateEntityReport(nerResult: NERResult): string {
    const report = `
🏷️  NAMED ENTITY RECOGNITION REPORT

📊 Entidades Detectadas: ${nerResult.entities.length}

🎯 Targets Primarios (${nerResult.primaryTargets.length}):
${nerResult.primaryTargets.length > 0
  ? nerResult.primaryTargets.map((t, i) => `  ${i + 1}. [${t.type}] ${t.value}`).join('\n')
  : '  Ninguno'}

🔧 Herramientas (${nerResult.primaryTools.length}):
${nerResult.primaryTools.length > 0
  ? nerResult.primaryTools.map((t, i) => `  ${i + 1}. ${t.value}`).join('\n')
  : '  Ninguna'}

⚠️  Vulnerabilidades (${nerResult.vulnerabilities.length}):
${nerResult.vulnerabilities.length > 0
  ? nerResult.vulnerabilities.map((v, i) => `  ${i + 1}. ${v.value}`).join('\n')
  : '  Ninguna'}

📋 Todas las Entidades:
${Array.from(nerResult.entityFrequency.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([key, freq]) => `  • ${key} (${freq}x)`)
  .join('\n')}

✨ Beneficio
Jarvis ahora identifica automáticamente qué se está atacando,
qué herramientas se necesitan y qué vulnerabilidades explotar.
`;

    return report;
  }
}

export const namedEntityRecognition = new NamedEntityRecognition();
