/**
 * GEMINI SERVICE
 *
 * Integración con Google Gemini API
 * Con manejo graceful de dependencias opcionales
 * ✨ OPTIMIZACIÓN PHASE 3a: LRU Cache + Request Deduplication + Reduced Retry Delay
 */

// ============================================
// LRU CACHE IMPLEMENTATION
// ============================================

class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================
// GEMINI SERVICE INITIALIZATION
// ============================================

let ai: any = null;
let googleGenAI: any = null;

// Intenta cargar Google GenAI - es opcional
try {
  const imported = require("@google/genai");
  googleGenAI = imported;
  const GoogleGenAI = imported.GoogleGenAI;

  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.warn(`⚠️  @google/genai no disponible - Gemini service desactivado`);
  console.warn(`   Para habilitar: npm install @google/genai`);
}

const Type = googleGenAI?.Type || {};

export interface ToolCall {
  name: string;
  args: any;
}

export const JARVIS_TOOLS = [
  // FASE 1: BASIC TOOLS
  {
    name: "ejecutar_comando_kali",
    description: "Ejecuta un comando en la terminal local para tareas de pentesting o sistema.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        comando: { type: Type.STRING, description: "El comando exacto a ejecutar (ej. dir, ipconfig, nmap)" }
      },
      required: ["comando"]
    }
  },
  {
    name: "reproducir_error",
    description: "Crea y ejecuta un script de prueba para reproducir un error o validar una vulnerabilidad.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        script_content: { type: Type.STRING, description: "Contenido del script de reproducción" },
        filename: { type: Type.STRING, description: "Nombre del archivo (ej. repro.js, test.py)" }
      },
      required: ["script_content", "filename"]
    }
  },
  {
    name: "leer_archivo",
    description: "Lee el contenido de un archivo en el workspace.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: "Nombre del archivo" }
      },
      required: ["filename"]
    }
  },
  {
    name: "escribir_archivo",
    description: "Escribe contenido en un archivo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: "Nombre del archivo" },
        content: { type: Type.STRING, description: "Contenido" }
      },
      required: ["filename", "content"]
    }
  },

  // FASE 2: WEB INTEGRATION TOOLS
  {
    name: "raspar_pagina_web",
    description: "Obtiene contenido de una página web para análisis.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "URL de la página a raspar (https://...)" }
      },
      required: ["url"]
    }
  },
  {
    name: "llamar_api_externa",
    description: "Realiza llamadas a APIs externas (GET, POST, PUT, DELETE).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "URL del endpoint API" },
        metodo: { type: Type.STRING, description: "HTTP method: GET, POST, PUT, DELETE" },
        datos: { type: Type.STRING, description: "JSON data para POST/PUT (opcional)" },
        encabezados: { type: Type.STRING, description: "JSON headers personalizados (opcional)" }
      },
      required: ["url", "metodo"]
    }
  },
  {
    name: "buscar_cves",
    description: "Busca vulnerabilidades (CVEs) en la base de datos NVD.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Término de búsqueda (software, librería, versión)" },
        limite: { type: Type.NUMBER, description: "Máximo de resultados (default: 10)" }
      },
      required: ["query"]
    }
  },
  {
    name: "buscar_programas_hackerone",
    description: "Busca programas activos de bug bounty en HackerOne.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filtro_bounty: { type: "boolean", description: "Solo programas que ofrecen bounties" },
        bounty_minimo: { type: Type.NUMBER, description: "Bounty mínimo en USD" }
      }
    }
  },
  {
    name: "realizar_osint",
    description: "Realiza Open Source Intelligence en un dominio/target.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: { type: Type.STRING, description: "Dominio o IP a investigar" }
      },
      required: ["target"]
    }
  },
  {
    name: "buscar_exploits",
    description: "Busca exploits públicos en ExploitDB u otras fuentes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        keyword: { type: Type.STRING, description: "Término de búsqueda (ej. SQL injection, RCE)" },
        limite: { type: Type.NUMBER, description: "Máximo de resultados" }
      },
      required: ["keyword"]
    }
  },

  // FASE 2: SYSTEM AUTOMATION TOOLS
  {
    name: "crear_y_ejecutar_script",
    description: "Crea un archivo script y lo ejecuta automáticamente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        contenido: { type: Type.STRING, description: "Código del script" },
        nombre_archivo: { type: Type.STRING, description: "Nombre del archivo (sin extensión)" },
        lenguaje: { type: Type.STRING, description: "Lenguaje: python, javascript, bash, powershell" }
      },
      required: ["contenido", "nombre_archivo", "lenguaje"]
    }
  },
  {
    name: "instalar_paquete",
    description: "Instala paquetes de software usando npm, pip, apt, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        nombre_paquete: { type: Type.STRING, description: "Nombre del paquete" },
        gestor: { type: Type.STRING, description: "npm, pip, apt, brew" }
      },
      required: ["nombre_paquete", "gestor"]
    }
  },
  {
    name: "listar_procesos",
    description: "Lista los procesos del sistema actualmente ejecutándose.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "analizar_codigo_seguridad",
    description: "Analiza código para encontrar patrones inseguros.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        archivo: { type: Type.STRING, description: "Ruta del archivo a analizar" }
      },
      required: ["archivo"]
    }
  },

  // FASE 2: DYNAMIC TOOLING TOOLS
  {
    name: "instalar_herramienta_hacking",
    description: "Instala herramientas de seguridad (nmap, sqlmap, metasploit, etc).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        herramienta_id: { type: Type.STRING, description: "ID de herramienta: nmap, metasploit, burpsuite, sqlmap, wireshark, aircrack-ng, john, ghidra" }
      },
      required: ["herramienta_id"]
    }
  },
  {
    name: "habilitar_herramienta",
    description: "Habilita una herramienta instalada para usar.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        herramienta_id: { type: Type.STRING, description: "ID de la herramienta" }
      },
      required: ["herramienta_id"]
    }
  },
  {
    name: "registrar_api_personalizada",
    description: "Registra una API personalizada para acceso futuro.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        nombre_api: { type: Type.STRING, description: "Nombre descriptivo" },
        url_base: { type: Type.STRING, description: "URL base de la API" },
        autenticada: { type: "boolean", description: "Requiere autenticación" }
      },
      required: ["nombre_api", "url_base"]
    }
  },

  // FASE 2: AUTONOMOUS OPERATION TOOLS
  {
    name: "activar_modo_autonomo",
    description: "Activa el modo de operación autónoma de Jarvis.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "registrar_objetivo_bug_bounty",
    description: "Registra un programa de bug bounty para automatización.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        plataforma: { type: Type.STRING, description: "hackerone, bugcrowd, intigriti" },
        programa: { type: Type.STRING, description: "Handle del programa" },
        bounty_maximo: { type: Type.NUMBER, description: "Target de bounty máximo" }
      },
      required: ["plataforma", "programa"]
    }
  },
  {
    name: "generar_poc",
    description: "Genera automáticamente Proof-of-Concept code para vulnerabilidades.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo_vulnerabilidad: { type: Type.STRING, description: "sql-injection, xss, csrf, rce, etc" },
        descripcion: { type: Type.STRING, description: "Descripción de la vulnerabilidad" },
        url_target: { type: Type.STRING, description: "URL objetivo (opcional)" },
        severidad: { type: Type.STRING, description: "critical, high, medium, low" }
      },
      required: ["tipo_vulnerabilidad"]
    }
  },
  {
    name: "habilitar_tarea_autonoma",
    description: "Habilita una tarea de operación autónoma.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tarea_id: { type: Type.STRING, description: "ID: scan-vulnerabilities, monitor-cves, code-generation, self-improvement, security-audit" }
      },
      required: ["tarea_id"]
    }
  },
  {
    name: "registrar_metrica_aprendizaje",
    description: "Registra una métrica de aprendizaje para auto-mejora.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        metrica: { type: Type.STRING, description: "Nombre de la métrica" },
        valor: { type: Type.NUMBER, description: "Valor numérico" }
      },
      required: ["metrica", "valor"]
    }
  }
];

// ============================================
// CACHING & DEDUPLICATION
// ============================================

const responseCache = new LRUCache<string, any>(100);
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(input: string, systemInstruction: string, useSearch: boolean, model: string): string {
  // Create deterministic cache key from inputs
  return `${model}|${useSearch}|${systemInstruction.substring(0, 100)}|${input.substring(0, 200)}`;
}

// ============================================
// GEMINI SERVICE
// ============================================

export const geminiService = {
  // Clear cache (useful for testing)
  clearCache(): void {
    responseCache.clear();
    console.log("[Gemini Service] ✨ Cache cleared");
  },

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return { size: responseCache.size(), maxSize: 100 };
  },

  async withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 200): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || JSON.stringify(error);
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
          // Retry reducido: 200ms, 400ms (total max ~600ms de espera)
          const delay = initialDelay * Math.pow(2, i);
          const jitter = Math.random() * 100;
          const finalDelay = delay + jitter;

          console.warn(`[Gemini Service] 🔋 Rate Limit. Retry en ${Math.round(finalDelay)}ms (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, finalDelay));
          continue;
        }
        throw error;
      }
    }
    console.warn("[Gemini Service] Retries agotados - caller debe usar fallback local.");
    throw lastError;
  },

  async generateResponse(input: string, systemInstruction: string, useSearch = false, model = "gemini-3.1-pro-preview", skipTools = false) {
    try {
      // OPTIMIZACIÓN: Cache hit detection
      const cacheKey = getCacheKey(input, systemInstruction, useSearch, model);
      const cached = responseCache.get(cacheKey);

      if (cached) {
        console.log(`[Gemini Service] ✨ Cache HIT (${responseCache.size()}/${100})`);
        return cached;
      }

      // OPTIMIZACIÓN: Request deduplication - if same request is in flight, wait for it
      if (pendingRequests.has(cacheKey)) {
        console.log(`[Gemini Service] 🔄 Deduplicating request (awaiting in-flight request)`);
        return await pendingRequests.get(cacheKey)!;
      }

      // Mark this request as pending
      const requestPromise = (async () => {
        try {
          return await this.withRetry(async () => {
            const tools: any[] = [];
            if (!skipTools) {
              tools.push({ functionDeclarations: JARVIS_TOOLS });
            }
            if (useSearch) {
              tools.push({ googleSearch: {} });
            }

            const response = await ai.models.generateContent({
              model: model,
              contents: [{ role: "user", parts: [{ text: input }] }],
              config: {
                systemInstruction: systemInstruction,
                tools: tools.length > 0 ? tools : undefined,
                toolConfig: (tools.length > 0 && useSearch) ? { includeServerSideToolInvocations: true } : undefined
              },
            });

            const result = {
              text: response.text || "Operación procesada con éxito. (Respuesta en blanco)",
              functionCalls: response.functionCalls,
              groundingMetadata: (response.candidates?.[0] as any)?.groundingMetadata
            };

            // Cache the result before returning
            responseCache.set(cacheKey, result);
            console.log(`[Gemini Service] 💾 Cached response (${responseCache.size()}/${100})`);

            return result;
          });
        } finally {
          // Remove from pending
          pendingRequests.delete(cacheKey);
        }
      })();

      pendingRequests.set(cacheKey, requestPromise);
      return await requestPromise;
    } catch (error: any) {
      // Fallback automático a Flash si Pro falla por cuota (429) excesiva o límite 0
      const errMsg = error.message || "";
      if ((errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) && model === "gemini-3.1-pro-preview") {
        console.warn("[Gemini Service] 🔄 Quota Pro agotada. Activando modo Recuperación (Flash)...");
        return this.generateResponse(input, systemInstruction, useSearch, "gemini-3-flash-preview", skipTools);
      }
      throw error;
    }
  },

  async extractIntent(input: string) {
    try {
      return await this.withRetry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: `Eres el Clasificador de Intención de Jarvis (Capa 1). 
Identifica la intención de la siguiente solicitud.

Tipos de Acción:
- "chat": Pregunta directa, conversacional, consulta rápida de conocimiento.
- "task": Tarea que requiere ejecución de scripts, manejo de archivos, o el bucle OpenClaw.
- "autonomous": Tarea de investigación profunda, evolución oculta o monitoreo de fondo.

Solicitud: "${input}"

Responde SOLO con JSON válido (sin markdown):
{
  "actionType": "chat|task|autonomous",
  "description": "descripción breve del objetivo",
  "beneficiary": "paespa|system|other",
  "category": "hacking|personal|evolution|system|unknown",
  "riskLevel": "low|medium|high",
  "complexity": "trivial|moderate|complex"
}`}]}],
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = response.text || "{}";
        const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleanJson);
      });
    } catch (error: any) {
      console.error("[Gemini Service] Error extrayendo intención tras reintentos:", error);
      return {
        actionType: "chat", // Default a chat seguro y rápido
        description: input,
        beneficiary: "system",
        category: "unknown",
        riskLevel: "low",
        complexity: "trivial",
      };
    }
  },

  async extractJson(prompt: string) {
    try {
      return await this.withRetry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = response.text || "{}";
        const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleanJson);
      });
    } catch (error: any) {
      console.error("[Gemini Service] Error extrayendo JSON genérico:", error);
      return null;
    }
  }
};
