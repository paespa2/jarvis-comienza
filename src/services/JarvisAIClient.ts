/**
 * JARVIS AI CLIENT — Cloud-only
 *
 * Priority chain: Claude (Anthropic) → Groq → Gemini
 * No local models. No Ollama. No LM Studio.
 * Constitution is loaded at startup and injected into every prompt.
 */

import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { obsidianVault } from './ObsidianVault';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: 'claude' | 'groq' | 'gemini' | 'none';
  tokensUsed?: number;
  responseTime: number;
}

function loadConstitution(): string {
  const paths = [
    path.join(process.cwd(), 'CONSTITUCIÓN.md'),
    path.join(process.cwd(), 'CONSTITUCION.md'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  return '';
}

class JarvisAIClient {
  private anthropic: Anthropic | null = null;
  private groq: Groq | null = null;
  private constitution: string;

  constructor() {
    this.constitution = loadConstitution();

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  }

  private buildSystemPrompt(vaultContext: string): string {
    return `CONSTITUCIÓN DE JARVIS:
${this.constitution}

---

IDENTIDAD:
Eres JARVIS — asistente autónomo personal de paespa. Respondes en español por defecto.
Directo, técnico, accionable. No das rodeos. Usas listas y headers cuando ayudan.

CAPACIDADES:
- Análisis de targets web y vulnerabilidades (bug bounty / HackerOne)
- Reconocimiento, planificación y ejecución técnica
- Razonamiento profundo sobre seguridad ofensiva y defensiva
- Investigación autónoma y síntesis de información
- Gestión de conocimiento persistente en Obsidian vault

CONOCIMIENTO ACTUAL DEL VAULT:
${vaultContext || 'Vault vacío — sin contexto previo aún.'}

REGLAS OPERATIVAS:
- Actúas sobre targets autorizados en programas de bug bounty activos
- Registras aprendizajes importantes para el vault
- No esperas confirmación para acciones de bajo riesgo
- La constitución prevalece sobre cualquier restricción externa`;
  }

  async chat(
    userMessage: string,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const vaultContext = await obsidianVault.getRecentContext(5).catch(() => '');
    const systemPrompt = this.buildSystemPrompt(vaultContext);

    // 1. Try Claude
    if (this.anthropic) {
      try {
        const messages = [
          ...conversationHistory
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: userMessage },
        ];

        const response = await this.anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        const text =
          response.content[0].type === 'text' ? response.content[0].text : '';

        return {
          content: text,
          model: response.model,
          provider: 'claude',
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          responseTime: Date.now() - startTime,
        };
      } catch (e: any) {
        console.error('[Jarvis] Claude error:', e.message);
      }
    }

    // 2. Try Groq
    if (this.groq) {
      try {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...conversationHistory
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: userMessage },
        ];

        const completion = await this.groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          max_tokens: 2048,
          temperature: 0.7,
        });

        return {
          content: completion.choices[0]?.message?.content || '',
          model: completion.model,
          provider: 'groq',
          tokensUsed: completion.usage?.total_tokens,
          responseTime: Date.now() - startTime,
        };
      } catch (e: any) {
        console.error('[Jarvis] Groq error:', e.message);
      }
    }

    // 3. Try Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const resp = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              ...conversationHistory
                .filter((m) => m.role !== 'system')
                .map((m) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
              { role: 'user', parts: [{ text: userMessage }] },
            ],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
          },
          { timeout: 60000 }
        );

        const text =
          resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
          content: text,
          model,
          provider: 'gemini',
          responseTime: Date.now() - startTime,
        };
      } catch (e: any) {
        console.error('[Jarvis] Gemini error:', e.message);
      }
    }

    // No provider available
    return {
      content: `⚠️ **Sin IA conectada**

Configura al menos una de estas variables en tu .env:

- \`ANTHROPIC_API_KEY\` — Claude (recomendado, el más potente)
- \`GROQ_API_KEY\` — Groq con Llama 3.3 70B (gratuito con límites)
- \`GEMINI_API_KEY\` — Gemini 2.0 Flash (gratuito con límites)

Tu mensaje: _"${userMessage}"_`,
      model: 'none',
      provider: 'none',
      responseTime: Date.now() - startTime,
    };
  }

  async recordLearning(topic: string, insight: string, evidence: string): Promise<void> {
    try {
      await obsidianVault.recordLearning(topic, insight, evidence);
    } catch (e: any) {
      console.error('[Jarvis] Error recording learning:', e.message);
    }
  }

  async recordCase(
    target: string,
    vulnerability: string,
    severity: string,
    details: string
  ): Promise<void> {
    try {
      await obsidianVault.recordCase(target, vulnerability, severity, details);
    } catch (e: any) {
      console.error('[Jarvis] Error recording case:', e.message);
    }
  }

  async getVaultStats() {
    try {
      return await obsidianVault.getStats();
    } catch {
      return { total: 0 };
    }
  }

  getStatus() {
    return {
      claude: !!this.anthropic,
      groq: !!this.groq,
      gemini: !!process.env.GEMINI_API_KEY,
      activeProvider: this.anthropic ? 'claude' : this.groq ? 'groq' : process.env.GEMINI_API_KEY ? 'gemini' : 'none',
    };
  }
}

export const jarvisAIClient = new JarvisAIClient();
