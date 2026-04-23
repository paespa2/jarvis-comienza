/**
 * ANTHROPIC KNOWLEDGE MANAGER
 *
 * Sistema de transferencia de conocimiento desde Anthropic
 * - Mapea capacidades de Claude y modelos
 * - Documenta best practices de prompt engineering
 * - Aprende patrones de interacción efectivos
 * - Integra conocimiento en decisiones de Jarvis
 *
 * ✨ FASE 9: Aprendizaje Continuo desde Anthropic
 */

import { gitHubLearningRepository } from '../learning/GitHubLearningRepository';

export interface ClaudeCapability {
  name: string;
  description: string;
  examples: string[];
  limitations?: string[];
  recommended_use_cases: string[];
  confidence: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  context_window: number;
  max_tokens: number;
  release_date: string;
  strengths: string[];
  weaknesses: string[];
  recommended_for: string[];
}

export interface PromptPattern {
  name: string;
  category: string;
  description: string;
  example: string;
  effectiveness_score: number;
  use_cases: string[];
}

export interface AnthropicKnowledgeBase {
  models: Map<string, ModelInfo>;
  capabilities: Map<string, ClaudeCapability>;
  promptPatterns: Map<string, PromptPattern>;
  bestPractices: Map<string, string>;
  lastUpdated: number;
}

export class AnthropicKnowledgeManager {
  private knowledgeBase: AnthropicKnowledgeBase;
  private updateInterval: number = 86400000; // 24 horas

  constructor() {
    console.log('\n🤖 [AnthropicKnowledgeManager] Inicializando...');
    this.knowledgeBase = {
      models: new Map(),
      capabilities: new Map(),
      promptPatterns: new Map(),
      bestPractices: new Map(),
      lastUpdated: Date.now()
    };
    this.initializeStaticKnowledge();
  }

  /**
   * Inicializar conocimiento estático sobre Anthropic
   */
  private initializeStaticKnowledge(): void {
    // Información de modelos Claude
    const models: ModelInfo[] = [
      {
        id: 'claude-opus-4-7',
        name: 'Claude Opus 4.7',
        context_window: 200000,
        max_tokens: 16000,
        release_date: '2025-02',
        strengths: [
          'Razonamiento complejo',
          'Análisis profundo de código',
          'Resolución de problemas multidimensionales',
          'Pensamiento extendido',
          'Comprensión de contexto largo'
        ],
        weaknesses: [
          'Latencia más alta',
          'Mayor consumo de tokens'
        ],
        recommended_for: [
          'Análisis profundo',
          'Razonamiento científico',
          'Código complejo',
          'Investigación'
        ]
      },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        context_window: 200000,
        max_tokens: 16000,
        release_date: '2025-01',
        strengths: [
          'Balance velocidad/capacidad',
          'Manejo excelente de herramientas',
          'Respuestas rápidas',
          'Bajo costo relativo'
        ],
        weaknesses: [
          'Menos razonamiento que Opus',
          'Context window más limitado que Opus'
        ],
        recommended_for: [
          'Aplicaciones en tiempo real',
          'Uso intensivo de herramientas',
          'Aplicaciones de producción',
          'Análisis rápido'
        ]
      },
      {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        context_window: 200000,
        max_tokens: 16000,
        release_date: '2024-10',
        strengths: [
          'Muy rápido',
          'Bajo costo',
          'Perfecto para tareas simples',
          'Excelente para streaming'
        ],
        weaknesses: [
          'Capacidad de razonamiento limitada',
          'No ideal para análisis complejos'
        ],
        recommended_for: [
          'Tareas simples',
          'Respuestas rápidas',
          'Aplicaciones de bajo costo',
          'Procesamiento en lote'
        ]
      }
    ];

    for (const model of models) {
      this.knowledgeBase.models.set(model.id, model);
    }

    // Capacidades principales de Claude
    const capabilities: ClaudeCapability[] = [
      {
        name: 'Code Execution',
        description: 'Ejecución de código en contexto sin limitaciones técnicas',
        examples: [
          'Bash: shell commands, file operations, git',
          'Python: scripts, data processing',
          'File operations: read, write, edit',
          'Git operations: commit, push, branch'
        ],
        limitations: [
          'No acceso a internet real (solo URLs explícitas)',
          'No modificación de sistema operativo'
        ],
        recommended_use_cases: [
          'Automatización de tareas',
          'Procesamiento de código',
          'Operaciones de repositorio',
          'Transformación de datos'
        ],
        confidence: 0.99
      },
      {
        name: 'Tool Use',
        description: 'Uso de herramientas externas para extender capacidades',
        examples: [
          'GitHub operations (read, write, PR)',
          'File system access',
          'Web fetching (URLs públicas)',
          'Custom MCP tools'
        ],
        recommended_use_cases: [
          'Integración con sistemas externos',
          'Operaciones de repositorio',
          'Acceso a información actualizada',
          'Automatización compleja'
        ],
        confidence: 0.98
      },
      {
        name: 'Extended Thinking',
        description: 'Razonamiento extendido para problemas complejos',
        examples: [
          'Análisis profundo de arquitectura',
          'Resolución de problemas abstractos',
          'Investigación de alternativas'
        ],
        limitations: [
          'Mayor latencia',
          'Mayor consumo de tokens',
          'No disponible en todos los modelos'
        ],
        recommended_use_cases: [
          'Problemas complejos',
          'Análisis arquitectural',
          'Investigación profunda'
        ],
        confidence: 0.95
      },
      {
        name: 'Prompt Caching',
        description: 'Caché de prompts para reducir latencia y costos',
        examples: [
          'Contexto de repositorio cacheado',
          'Documentación como sistema prompt',
          'Configuración del proyecto como cache'
        ],
        recommended_use_cases: [
          'Procesamiento repetitivo',
          'Documentación constante',
          'Contexto largo reutilizado'
        ],
        confidence: 0.97
      },
      {
        name: 'Vision',
        description: 'Análisis de imágenes y screenshots',
        examples: [
          'UI analysis',
          'Diagram interpretation',
          'Screenshot understanding',
          'Chart and graph analysis'
        ],
        recommended_use_cases: [
          'Análisis de UI/UX',
          'Validación visual',
          'OCR y extracción de texto',
          'Interpretación de diagramas'
        ],
        confidence: 0.96
      }
    ];

    for (const cap of capabilities) {
      this.knowledgeBase.capabilities.set(cap.name, cap);
    }

    // Patrones de prompt engineering efectivos
    const patterns: PromptPattern[] = [
      {
        name: 'Chain of Thought',
        category: 'Reasoning',
        description: 'Desglosar razonamiento en pasos',
        example: 'Let me think through this step by step:\n1. First...\n2. Then...\n3. Finally...',
        effectiveness_score: 0.95,
        use_cases: ['Problemas complejos', 'Análisis', 'Decisiones']
      },
      {
        name: 'Few-Shot Examples',
        category: 'Learning',
        description: 'Proporcionar ejemplos de entrada/salida',
        example: 'Example 1: INPUT → OUTPUT\nExample 2: INPUT → OUTPUT\nNow for your input:',
        effectiveness_score: 0.92,
        use_cases: ['Formato específico', 'Tareas repetitivas', 'Patrones']
      },
      {
        name: 'Constraint Specification',
        category: 'Control',
        description: 'Especificar limitaciones y restricciones',
        example: 'Respond in: English only, under 100 words, JSON format',
        effectiveness_score: 0.98,
        use_cases: ['Control de output', 'Formato específico', 'Restricciones']
      },
      {
        name: 'Role Playing',
        category: 'Personalization',
        description: 'Asumir un rol específico',
        example: 'You are a security expert. Analyze this from a security perspective.',
        effectiveness_score: 0.88,
        use_cases: ['Perspectivas especializadas', 'Personaje específico', 'Tonalidad']
      },
      {
        name: 'Tool Delegation',
        category: 'Execution',
        description: 'Usar herramientas disponibles para tareas',
        example: 'Use the bash tool to: 1. Check file, 2. Run command, 3. Verify output',
        effectiveness_score: 0.99,
        use_cases: ['Ejecución de código', 'Operaciones file', 'Git operations']
      },
      {
        name: 'Context Preservation',
        category: 'Memory',
        description: 'Mantener contexto a través de múltiples turns',
        example: 'As discussed earlier about [topic], now let\'s extend to...',
        effectiveness_score: 0.94,
        use_cases: ['Conversaciones largas', 'Referencia histórica', 'Coherencia']
      }
    ];

    for (const pattern of patterns) {
      this.knowledgeBase.promptPatterns.set(pattern.name, pattern);
    }

    // Best practices
    const bestPractices = new Map<string, string>([
      [
        'Model Selection',
        'Usa Opus para problemas complejos, Sonnet para balance, Haiku para tareas simples'
      ],
      [
        'Token Management',
        'Usa prompt caching para contexto reutilizado, comprime contexto largo'
      ],
      [
        'Error Handling',
        'Siempre maneja errores de herramientas, retry con backoff exponencial'
      ],
      [
        'Cost Optimization',
        'Usa caché para reducir tokens, elige modelo según complejidad'
      ],
      [
        'Reasoning Strategy',
        'Chain of thought para problemas complejos, directo para tareas simples'
      ],
      [
        'Tool Usage',
        'Valida entrada antes de herramientas, maneja outputs heterogéneos'
      ],
      [
        'Long Context',
        'Organiza contexto jerárquicamente, sumariza cuando sea necesario'
      ],
      [
        'Streaming',
        'Usa Haiku/Sonnet para streaming, proporciona feedback en tiempo real'
      ]
    ]);

    this.knowledgeBase.bestPractices = bestPractices;
    console.log(`✅ Base de conocimiento estática inicializada`);
    console.log(`   • ${this.knowledgeBase.models.size} modelos`);
    console.log(`   • ${this.knowledgeBase.capabilities.size} capacidades`);
    console.log(`   • ${this.knowledgeBase.promptPatterns.size} patrones`);
    console.log(`   • ${this.knowledgeBase.bestPractices.size} best practices`);
  }

  /**
   * Obtener información de modelo
   */
  getModelInfo(modelId: string): ModelInfo | null {
    return this.knowledgeBase.models.get(modelId) || null;
  }

  /**
   * Obtener recomendación de modelo
   */
  getModelRecommendation(task: string): ModelInfo | null {
    const taskLower = task.toLowerCase();

    // Heurística simple para recomendación
    if (
      taskLower.includes('complejo') ||
      taskLower.includes('profundo') ||
      taskLower.includes('investigar')
    ) {
      return this.knowledgeBase.models.get('claude-opus-4-7') || null;
    }

    if (taskLower.includes('rápido') || taskLower.includes('tiempo real')) {
      return this.knowledgeBase.models.get('claude-haiku-4-5') || null;
    }

    return this.knowledgeBase.models.get('claude-sonnet-4-6') || null;
  }

  /**
   * Obtener capacidad
   */
  getCapability(name: string): ClaudeCapability | null {
    return this.knowledgeBase.capabilities.get(name) || null;
  }

  /**
   * Listar todas las capacidades
   */
  getCapabilities(): ClaudeCapability[] {
    return Array.from(this.knowledgeBase.capabilities.values());
  }

  /**
   * Obtener patrón de prompt
   */
  getPromptPattern(name: string): PromptPattern | null {
    return this.knowledgeBase.promptPatterns.get(name) || null;
  }

  /**
   * Obtener patrones para categoría
   */
  getPatternsByCategory(category: string): PromptPattern[] {
    return Array.from(this.knowledgeBase.promptPatterns.values()).filter(
      p => p.category === category
    );
  }

  /**
   * Obtener best practice
   */
  getBestPractice(topic: string): string | null {
    return this.knowledgeBase.bestPractices.get(topic) || null;
  }

  /**
   * Obtener recomendaciones contextuales
   */
  getContextualRecommendations(context: {
    task?: string;
    budget?: 'low' | 'medium' | 'high';
    speed?: 'fast' | 'balanced' | 'thorough';
  }): string[] {
    const recommendations: string[] = [];

    if (context.task) {
      const model = this.getModelRecommendation(context.task);
      if (model) {
        recommendations.push(`Modelo recomendado: ${model.name} (${model.id})`);
      }
    }

    if (context.budget === 'low') {
      recommendations.push('Usar Claude Haiku 4.5 para minimizar costos');
      recommendations.push('Implementar prompt caching para reducir tokens');
    }

    if (context.speed === 'fast') {
      recommendations.push('Usar Claude Haiku 4.5 para respuestas rápidas');
      recommendations.push('Evitar extended thinking');
    }

    if (context.speed === 'thorough') {
      recommendations.push('Usar Claude Opus 4.7 para razonamiento profundo');
      recommendations.push('Considerar extended thinking para problemas complejos');
    }

    return recommendations;
  }

  /**
   * Guardar aprendizaje en repositorio de GitHub
   */
  async saveKnowledgeSnapshot(): Promise<boolean> {
    try {
      const snapshot = {
        timestamp: Date.now(),
        models: Array.from(this.knowledgeBase.models.entries()).map(([k, v]) => ({
          id: k,
          ...v
        })),
        capabilities: Array.from(this.knowledgeBase.capabilities.entries()).map(([k, v]) => ({
          name: k,
          ...v
        })),
        promptPatterns: Array.from(this.knowledgeBase.promptPatterns.entries()).map(([k, v]) => ({
          name: k,
          ...v
        })),
        bestPractices: Array.from(this.knowledgeBase.bestPractices.entries()).map(([k, v]) => [
          k,
          v
        ])
      };

      await gitHubLearningRepository.recordInsight({
        id: `anthropic-knowledge-${Date.now()}`,
        topic: 'Anthropic Knowledge Base Snapshot',
        insight: JSON.stringify(snapshot, null, 2),
        confidence: 0.98,
        sources: ['anthropic.com', 'documentation'],
        relatedTo: ['models', 'capabilities', 'prompt-patterns', 'best-practices'],
        timestamp: Date.now()
      });

      console.log('✅ Knowledge snapshot guardado en repositorio');
      return true;
    } catch (err: any) {
      console.error(`❌ Error guardando snapshot: ${err.message}`);
      return false;
    }
  }

  /**
   * Generar reporte de conocimiento
   */
  generateKnowledgeReport(): string {
    const modelsList = Array.from(this.knowledgeBase.models.values())
      .map(m => `  • ${m.name} (${m.context_window} tokens context)`)
      .join('\n');

    const capsList = Array.from(this.knowledgeBase.capabilities.values())
      .map(c => `  • ${c.name}: ${c.description}`)
      .join('\n');

    const patternsList = Array.from(this.knowledgeBase.promptPatterns.values())
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
      .slice(0, 10)
      .map(
        (p, i) =>
          `  ${i + 1}. ${p.name} (${(p.effectiveness_score * 100).toFixed(0)}% efectivo)`
      )
      .join('\n');

    const report = `
🤖 ANTHROPIC KNOWLEDGE BASE REPORT

📊 Modelos Disponibles
${modelsList}

🔧 Capacidades Claude
${capsList}

💡 Patrones de Prompt (Top 10)
${patternsList}

🎯 Best Practices
${Array.from(this.knowledgeBase.bestPractices.entries())
  .map(([topic, practice]) => `  • ${topic}: ${practice}`)
  .join('\n')}

✨ Beneficio
Jarvis ahora comprende completamente las capacidades de Claude y puede:
- Delegar tareas apropiadas a Claude
- Recomendar modelos basados en el contexto
- Aplicar patrones de prompt engineering efectivos
- Optimizar costos y performance
- Desarrollar estrategias híbridas Claude+Jarvis
`;

    return report;
  }

  /**
   * Obtener todas las modelos
   */
  getAllModels(): ModelInfo[] {
    return Array.from(this.knowledgeBase.models.values());
  }
}

export const anthropicKnowledgeManager = new AnthropicKnowledgeManager();
