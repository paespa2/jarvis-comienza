import { GoogleGenAI, Type } from "@google/genai";

// Inicializar la IA de Google - Siguiendo guías de AI Studio para React (Vite)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ToolCall {
  name: string;
  args: any;
}

export const JARVIS_TOOLS = [
  {
    name: "ejecutar_comando_kali",
    description: "Ejecuta un comando en la terminal local (Windows) para tareas de pentesting o sistema.",
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
    name: "editar_archivo_quirurgico",
    description: "Edita un archivo reemplazando una cadena exacta por otra.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: "Nombre del archivo" },
        old_content: { type: Type.STRING, description: "Contenido exacto a reemplazar" },
        new_content: { type: Type.STRING, description: "Nuevo contenido" }
      },
      required: ["filename", "old_content", "new_content"]
    }
  },
  {
    name: "mapear_workspace_profundo",
    description: "Realiza un listado recursivo del workspace.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Ruta relativa opcional" }
      }
    }
  },
  {
    name: "busqueda_grep_avanzada",
    description: "Busca patrones de texto en todo el workspace.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        pattern: { type: Type.STRING, description: "Patrón de búsqueda (regex)" },
        include: { type: Type.STRING, description: "Filtro de archivos (ej. *.js)" }
      },
      required: ["pattern"]
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
    name: "ajustar_prioridades_soberanas",
    description: "Ajusta la matriz de prioridades de Jarvis.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        categoria: { type: Type.STRING, description: "Categoría a ajustar (ej. hacking, personal)" },
        ajuste: { 
          type: Type.OBJECT, 
          properties: {
            priority: { type: Type.NUMBER },
            focus: { type: Type.STRING },
            principles: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      required: ["categoria", "ajuste"]
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
  }
];

export const geminiService = {
  async withRetry<T>(fn: () => Promise<T>, maxRetries = 4, initialDelay = 2000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || JSON.stringify(error);
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
          const delay = initialDelay * Math.pow(2, i); // 2s, 4s, 8s, 16s...
          console.warn(`[Gemini Service] Quota excedida (429). Reintentando en ${delay}ms... (Intento ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  },

  async generateResponse(input: string, systemInstruction: string, useSearch = false, model = "gemini-3.1-pro-preview", skipTools = false) {
    return this.withRetry(async () => {
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
          toolConfig: useSearch ? { includeServerSideToolInvocations: true } : undefined
        },
      });

      return {
        text: response.text || "Operación procesada con éxito. (Respuesta en blanco)",
        functionCalls: response.functionCalls,
        groundingMetadata: (response.candidates?.[0] as any)?.groundingMetadata
      };
    });
  },

  async extractIntent(input: string) {
    try {
      return await this.withRetry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash",
          contents: [{ role: "user", parts: [{ text: `Identifica la intención de esta solicitud en JSON.
        
Solicitud: "${input}"

Responde SOLO con JSON válido (sin markdown):
{
  "description": "descripción breve de la acción",
  "beneficiary": "paespa|other|system",
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
        description: input,
        beneficiary: "system",
        category: "unknown",
        riskLevel: "medium",
        complexity: "moderate",
      };
    }
  },

  async extractJson(prompt: string) {
    try {
      return await this.withRetry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash",
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
