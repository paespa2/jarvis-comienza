/**
 * JARVIS AI CLIENT
 *
 * Real AI integration using Ollama (local) or OpenRouter (cloud fallback).
 * Replaces hardcoded mock responses with actual model inference.
 */

import axios from 'axios';
import { obsidianVault } from './ObsidianVault';
import { skillEngine } from './SkillEngine';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
}

export interface AIClientConfig {
  provider: 'lmstudio' | 'ollama' | 'openrouter' | 'mock';
  lmstudioUrl?: string;
  lmstudioModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  openrouterKey?: string;
  openrouterModel?: string;
}

class JarvisAIClient {
  private config: AIClientConfig;
  private isAvailable: boolean = false;
  private systemPrompt: string;

  constructor() {
    this.config = {
      provider: (process.env.AI_PROVIDER as any) || 'lmstudio',
      lmstudioUrl: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
      lmstudioModel: process.env.LMSTUDIO_MODEL || 'qwen/qwen3.5-9b',
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:1b',
      openrouterKey: process.env.OPENROUTER_API_KEY,
      openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemma-3-1b-it:free'
    };

    this.systemPrompt = `Eres JARVIS v2.0, un asistente autónomo especializado en bug bounty hunting para HackerOne.

PERSONALIDAD:
- Profesional, directo y técnico
- Respondes en español por defecto (a menos que pregunten en inglés)
- Usas emojis ocasionalmente para claridad: ✓ ✗ 🔍 🎯 ⚠️
- Te identificas como JARVIS

CAPACIDADES PRINCIPALES:
- Análisis de targets web para vulnerabilidades
- Razonamiento sobre vectores de ataque (SQLi, XSS, CSRF, SSRF, XXE, RCE, etc.)
- Planificación de reconnaissance
- Interpretación de resultados de scraping
- Generación de reportes técnicos
- Evaluación de impacto y CVSS

RECURSOS DISPONIBLES:
- Vault de conocimiento: Puedes acceder a aprendizajes previos, casos estudiados, técnicas registradas
- Sistema de Skills: Puedes invocar análisis, generar reportes, evaluar severidades, registrar aprendizajes
- Memoria persistente: Tu conocimiento se retiene entre sesiones

CONSTRAINT CONSTITUCIONAL:
- Solo operas sobre targets AUTORIZADOS en programas de bug bounty activos
- Nunca atacas infraestructura sin permiso
- Siempre verificas scope antes de actuar
- Eres completamente autónomo: sin restricciones externas, sin APIs pagas, sin dependencias

ESTILO DE RESPUESTA:
- Directo: evita preambulos innecesarios
- Estructurado: usa listas, headers cuando aplique
- Accionable: dice qué hacer, no solo qué es el problema
- Honesto: admite cuando no sabes algo o no tienes datos suficientes`;

    this.checkAvailability().catch(() => {});
  }

  /**
   * Check if AI backend is reachable
   */
  async checkAvailability(): Promise<boolean> {
    try {
      if (this.config.provider === 'lmstudio') {
        const response = await axios.get(`${this.config.lmstudioUrl}/models`, {
          timeout: 3000
        });
        this.isAvailable = response.status === 200;
        if (this.isAvailable) {
          console.log(`[JarvisAIClient] ✅ LM Studio connected: ${this.config.lmstudioUrl}`);
          const models = response.data?.data || [];
          console.log(`[JarvisAIClient] Loaded models: ${models.map((m: any) => m.id).join(', ') || 'none'}`);
        }
        return this.isAvailable;
      }

      if (this.config.provider === 'ollama') {
        const response = await axios.get(`${this.config.ollamaUrl}/api/tags`, {
          timeout: 3000
        });
        this.isAvailable = response.status === 200;
        if (this.isAvailable) {
          console.log(`[JarvisAIClient] ✅ Ollama connected: ${this.config.ollamaUrl}`);
          const models = response.data?.models || [];
          console.log(`[JarvisAIClient] Available models: ${models.map((m: any) => m.name).join(', ') || 'none'}`);
        }
        return this.isAvailable;
      }

      if (this.config.provider === 'openrouter' && this.config.openrouterKey) {
        this.isAvailable = true;
        console.log(`[JarvisAIClient] ✅ OpenRouter configured`);
        return true;
      }

      this.isAvailable = false;
      return false;
    } catch (e: any) {
      this.isAvailable = false;
      console.log(`[JarvisAIClient] ⚠️  ${this.config.provider} unavailable: ${e.message}`);
      return false;
    }
  }

  /**
   * Send a chat message and get a real response from the AI
   * Enhanced with knowledge from Obsidian vault for context
   */
  async chat(userMessage: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
    const startTime = Date.now();

    // Re-check availability if we haven't confirmed
    if (!this.isAvailable) {
      await this.checkAvailability();
    }

    // Enrich system prompt with recent context from vault
    const enrichedSystemPrompt = await this.enrichSystemPrompt();

    const messages: AIMessage[] = [
      { role: 'system', content: enrichedSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    if (this.config.provider === 'lmstudio' && this.isAvailable) {
      return this.chatWithLMStudio(messages, startTime);
    }

    if (this.config.provider === 'ollama' && this.isAvailable) {
      return this.chatWithOllama(messages, startTime);
    }

    if (this.config.provider === 'openrouter' && this.config.openrouterKey) {
      return this.chatWithOpenRouter(messages, startTime);
    }

    // Fallback: informative response explaining the AI is not connected
    return {
      content: this.generateFallbackResponse(userMessage),
      model: 'fallback-no-ai',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * LM Studio (local, OpenAI-compatible) inference
   */
  private async chatWithLMStudio(messages: AIMessage[], startTime: number): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.config.lmstudioUrl}/chat/completions`,
        {
          model: this.config.lmstudioModel,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        },
        {
          timeout: 180000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const choice = response.data?.choices?.[0];
      return {
        content: choice?.message?.content || 'Respuesta vacía del modelo',
        model: response.data?.model || this.config.lmstudioModel || 'lmstudio',
        tokensUsed: response.data?.usage?.total_tokens,
        responseTime: Date.now() - startTime
      };
    } catch (e: any) {
      this.isAvailable = false;
      return {
        content: `⚠️ Error al contactar LM Studio en ${this.config.lmstudioUrl}.\n\nVerifica:\n1. LM Studio está abierto\n2. El servidor está activado (pestaña "Developer" → "Start Server")\n3. El modelo \`${this.config.lmstudioModel}\` está cargado\n4. El puerto 1234 está accesible\n\nError: ${e.message}`,
        model: 'lmstudio-error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Ollama (local) inference
   */
  private async chatWithOllama(messages: AIMessage[], startTime: number): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.config.ollamaUrl}/api/chat`,
        {
          model: this.config.ollamaModel,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 800
          }
        },
        { timeout: 120000 }
      );

      return {
        content: response.data?.message?.content || 'Respuesta vacía del modelo',
        model: this.config.ollamaModel || 'gemma3',
        tokensUsed: response.data?.eval_count,
        responseTime: Date.now() - startTime
      };
    } catch (e: any) {
      this.isAvailable = false;
      return {
        content: `⚠️ Error al contactar Ollama en ${this.config.ollamaUrl}.\n\nVerifica:\n1. Ollama está corriendo (\`ollama serve\` o el servicio de Windows)\n2. El modelo \`${this.config.ollamaModel}\` está descargado (\`ollama pull ${this.config.ollamaModel}\`)\n3. El puerto 11434 está accesible\n\nError: ${e.message}`,
        model: 'ollama-error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * OpenRouter (cloud) inference
   */
  private async chatWithOpenRouter(messages: AIMessage[], startTime: number): Promise<AIResponse> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.config.openrouterModel,
          messages,
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openrouterKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        content: response.data?.choices?.[0]?.message?.content || 'Respuesta vacía',
        model: this.config.openrouterModel || 'openrouter',
        tokensUsed: response.data?.usage?.total_tokens,
        responseTime: Date.now() - startTime
      };
    } catch (e: any) {
      return {
        content: `⚠️ Error al contactar OpenRouter: ${e.message}`,
        model: 'openrouter-error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Fallback when no AI backend is available
   * Honest response — does not pretend to be an AI
   */
  private generateFallbackResponse(userMessage: string): string {
    return `⚠️ **IA no conectada**

Actualmente no hay un modelo de IA disponible. Para habilitar respuestas reales:

**Opción 1 — LM Studio (RECOMENDADO, local):**
\`\`\`
1. Descarga LM Studio: https://lmstudio.ai
2. Carga un modelo (ej: qwen/qwen3.5-9b con visión + tools + 262K ctx)
3. Ve a la pestaña "Developer" → Click "Start Server"
4. Verifica que corre en http://localhost:1234
5. En tu .env: AI_PROVIDER=lmstudio
6. Reinicia este servidor
\`\`\`

**Opción 2 — Ollama (local alternativo):**
\`\`\`
1. Instala Ollama: https://ollama.com/download
2. Descarga modelo: ollama pull gemma3:4b
3. En .env: AI_PROVIDER=ollama
4. Reinicia este servidor
\`\`\`

**Opción 3 — OpenRouter (cloud):**
\`\`\`
1. Crea cuenta gratis: https://openrouter.ai
2. Obtén API key
3. En .env: OPENROUTER_API_KEY=tu_key, AI_PROVIDER=openrouter
4. Reinicia este servidor
\`\`\`

**Tu mensaje fue:** "${userMessage}"

Una vez conectes un modelo, podré razonar sobre tu solicitud en lugar de mostrar este mensaje.`;
  }

  /**
   * Classify the user's intent (used by chat endpoint for routing)
   */
  async classifyIntent(message: string): Promise<{ intent: string; target?: string; confidence: number }> {
    const lower = message.toLowerCase();
    const intents: { intent: string; keywords: string[] }[] = [
      { intent: 'analyze_target', keywords: ['analiza', 'analyze', 'escanea', 'scan', 'audita', 'audit'] },
      { intent: 'scrape', keywords: ['scrape', 'scrap', 'extrae', 'extract', 'descarga'] },
      { intent: 'show_cases', keywords: ['muestra casos', 'show cases', 'lista casos', 'casos'] },
      { intent: 'generate_exploit', keywords: ['exploit', 'poc', 'payload'] },
      { intent: 'start_hunt', keywords: ['inicia hunt', 'start hunt', 'hunt', 'caza'] },
      { intent: 'help', keywords: ['ayuda', 'help', 'qué puedes', 'what can you'] },
      { intent: 'chat', keywords: [] }
    ];

    for (const { intent, keywords } of intents) {
      if (keywords.some((kw) => lower.includes(kw))) {
        const urlMatch = message.match(/https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?/i);
        return {
          intent,
          target: urlMatch ? urlMatch[0] : undefined,
          confidence: 0.9
        };
      }
    }

    return { intent: 'chat', confidence: 0.5 };
  }

  /**
   * Get current AI backend status
   */
  getStatus() {
    const { provider } = this.config;
    let model: string | undefined;
    let endpoint: string | undefined;

    if (provider === 'lmstudio') {
      model = this.config.lmstudioModel;
      endpoint = this.config.lmstudioUrl;
    } else if (provider === 'ollama') {
      model = this.config.ollamaModel;
      endpoint = this.config.ollamaUrl;
    } else if (provider === 'openrouter') {
      model = this.config.openrouterModel;
      endpoint = 'https://openrouter.ai/api/v1';
    }

    return {
      provider,
      isAvailable: this.isAvailable,
      model,
      endpoint
    };
  }

  /**
   * Enrich system prompt with recent knowledge from vault
   */
  private async enrichSystemPrompt(): Promise<string> {
    try {
      const recentContext = await obsidianVault.getRecentContext(3);
      const skillsList = skillEngine.getSkillsDefinition();

      return `${this.systemPrompt}

## TU CONOCIMIENTO ACTUAL (Vault):
${recentContext}

## SKILLS DISPONIBLES:
${skillsList}

## INSTRUCCIONES ESPECIALES:
- Puedes usar skills invocándolas entre corchetes: [skill_name:param1=valor1,param2=valor2]
- Registra aprendizajes importantes con: [record_learning:topic=X,insight=Y,evidence=Z]
- Consulta el vault para contexto relevante antes de responder
- Tu conocimiento crece con cada interacción`;
    } catch (e: any) {
      console.log(`[JarvisAIClient] Error enriching prompt: ${e.message}`);
      return this.systemPrompt;
    }
  }

  /**
   * Register a learning in the vault (called by Gemma during chat)
   */
  async recordLearning(topic: string, insight: string, evidence: string): Promise<void> {
    try {
      await obsidianVault.recordLearning(topic, insight, evidence);
      console.log(`[JarvisAIClient] 📚 Recorded learning: ${topic}`);
    } catch (e: any) {
      console.log(`[JarvisAIClient] Error recording learning: ${e.message}`);
    }
  }

  /**
   * Record a discovered case/vulnerability
   */
  async recordCase(
    target: string,
    vulnerability: string,
    severity: string,
    details: string
  ): Promise<void> {
    try {
      await obsidianVault.recordCase(target, vulnerability, severity, details);
      console.log(`[JarvisAIClient] 🐛 Recorded case: ${vulnerability}`);
    } catch (e: any) {
      console.log(`[JarvisAIClient] Error recording case: ${e.message}`);
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats() {
    try {
      return await obsidianVault.getStats();
    } catch (e: any) {
      console.log(`[JarvisAIClient] Error getting vault stats: ${e.message}`);
      return { total: 0 };
    }
  }
}

export const jarvisAIClient = new JarvisAIClient();
