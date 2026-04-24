/**
 * SKILL ENGINE
 *
 * Sistema de Skills que extienden las capacidades de JARVIS.
 * Cada skill es una función que puede ser invocada por JARVIS.
 */

export interface SkillExecutionContext {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface SkillResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
}

export type SkillFunction = (
  input: any,
  context: SkillExecutionContext
) => Promise<SkillResult>;

export interface Skill {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, { type: string; description: string }>;
  execute: SkillFunction;
}

class SkillEngine {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    this.registerBuiltinSkills();
  }

  /**
   * Registrar una skill nueva
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
    console.log(`[SkillEngine] ✅ Registered skill: ${skill.name}`);
  }

  /**
   * Obtener una skill por nombre
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Ejecutar una skill
   */
  async executeSkill(
    skillName: string,
    input: any,
    context: SkillExecutionContext = {}
  ): Promise<SkillResult> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return {
        success: false,
        output: null,
        error: `Skill not found: ${skillName}`,
        executionTime: 0
      };
    }

    const startTime = Date.now();
    try {
      const result = await skill.execute(input, context);
      result.executionTime = Date.now() - startTime;
      return result;
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Listar todas las skills disponibles
   */
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Obtener información formateada de skills para el LLM
   */
  getSkillsDefinition(): string {
    const skills = Array.from(this.skills.values());
    return skills
      .map(
        skill => `
**${skill.name}** (${skill.category})
${skill.description}

Parameters:
${Object.entries(skill.parameters)
  .map(([key, param]) => `- ${key} (${param.type}): ${param.description}`)
  .join('\n')}
`
      )
      .join('\n---\n');
  }

  /**
   * Registrar las skills built-in
   */
  private registerBuiltinSkills(): void {
    // ============ ANALYSIS SKILLS ============

    this.registerSkill({
      name: 'analyze_target',
      description:
        'Analiza un objetivo (URL/dominio) buscando información técnica y posibles vectores de ataque',
      category: 'analysis',
      parameters: {
        target: { type: 'string', description: 'URL o dominio a analizar' },
        depth: { type: 'number', description: 'Profundidad del análisis (1-3)' }
      },
      execute: async (input, context) => {
        const { target, depth = 2 } = input;
        return {
          success: true,
          output: {
            target,
            depth,
            findings: [
              { type: 'http_headers', severity: 'medium', value: 'Missing HSTS header' },
              { type: 'ciphers', severity: 'low', value: 'Weak TLS ciphers detected' }
            ],
            timestamp: new Date().toISOString()
          }
        };
      }
    });

    this.registerSkill({
      name: 'evaluate_severity',
      description:
        'Evalúa la severidad de una vulnerabilidad según CVSS y contexto del programa',
      category: 'analysis',
      parameters: {
        vulnerability: { type: 'string', description: 'Tipo de vulnerabilidad' },
        context: { type: 'string', description: 'Contexto técnico' },
        impact: { type: 'string', description: 'Impacto potencial' }
      },
      execute: async (input) => {
        const { vulnerability, context } = input;
        return {
          success: true,
          output: {
            vulnerability,
            cvss_score: 7.5,
            severity: 'HIGH',
            reasoning: 'Based on context and vulnerability type'
          }
        };
      }
    });

    // ============ LEARNING SKILLS ============

    this.registerSkill({
      name: 'record_learning',
      description: 'Registra un aprendizaje en el vault del conocimiento',
      category: 'learning',
      parameters: {
        topic: { type: 'string', description: 'Tema aprendido' },
        insight: { type: 'string', description: 'Insight clave' },
        evidence: { type: 'string', description: 'Evidencia o fuente' }
      },
      execute: async (input) => {
        const { topic, insight, evidence } = input;
        // En la práctica, esto llamaría a ObsidianVault.recordLearning()
        return {
          success: true,
          output: {
            status: 'recorded',
            topic,
            timestamp: new Date().toISOString()
          }
        };
      }
    });

    this.registerSkill({
      name: 'retrieve_context',
      description: 'Obtiene contexto relevante del vault de conocimiento',
      category: 'learning',
      parameters: {
        query: { type: 'string', description: 'Búsqueda en el vault' },
        type: {
          type: 'string',
          description: 'Tipo de nota (case, skill, finding, learning)'
        }
      },
      execute: async (input) => {
        const { query, type } = input;
        return {
          success: true,
          output: {
            query,
            type,
            results: [],
            context:
              'No context found - vault empty or no matches. This is normal for new installations.'
          }
        };
      }
    });

    // ============ TOOL SKILLS ============

    this.registerSkill({
      name: 'generate_report',
      description: 'Genera un reporte formateado de hallazgos',
      category: 'tools',
      parameters: {
        findings: { type: 'array', description: 'Lista de hallazgos' },
        severity_threshold: {
          type: 'string',
          description: 'Severidad mínima a incluir'
        }
      },
      execute: async (input) => {
        const { findings = [], severity_threshold = 'LOW' } = input;
        return {
          success: true,
          output: {
            report_id: `RPT_${Date.now()}`,
            findings_count: findings.length,
            threshold: severity_threshold,
            generated_at: new Date().toISOString()
          }
        };
      }
    });

    this.registerSkill({
      name: 'format_payload',
      description:
        'Formatea un payload de ataque según el tipo de vulnerabilidad',
      category: 'tools',
      parameters: {
        vuln_type: {
          type: 'string',
          description: 'Tipo: sqli, xss, csrf, ssrf, rce, xxe'
        },
        technology: { type: 'string', description: 'Tech stack (php, nodejs, java)' },
        payload_type: { type: 'string', description: 'Tipo de payload (detection, PoC)' }
      },
      execute: async (input) => {
        const { vuln_type, technology, payload_type } = input;
        return {
          success: true,
          output: {
            vuln_type,
            technology,
            payload_type,
            payload: `[Payload example for ${vuln_type}]`,
            explanation: 'How this payload works',
            tested: false
          }
        };
      }
    });

    // ============ REASONING SKILLS ============

    this.registerSkill({
      name: 'reason_about_attack',
      description:
        'Razona sobre los posibles pasos de ataque para una vulnerabilidad',
      category: 'reasoning',
      parameters: {
        vulnerability: { type: 'string', description: 'Tipo de vulnerabilidad' },
        target_info: { type: 'string', description: 'Info del target' }
      },
      execute: async (input) => {
        const { vulnerability } = input;
        return {
          success: true,
          output: {
            vulnerability,
            reasoning_steps: [
              'Step 1: Identify input vector',
              'Step 2: Test for basic payloads',
              'Step 3: Evaluate output encoding',
              'Step 4: Exploit if vulnerable'
            ],
            confidence: 0.8
          }
        };
      }
    });

    console.log('[SkillEngine] ✅ Loaded built-in skills');
  }
}

export const skillEngine = new SkillEngine();
