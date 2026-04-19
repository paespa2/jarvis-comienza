import Groq from "groq-sdk";

// Lazy initialization para evitar crashes al cargar el módulo si la key no está lista
let _groqClient: Groq | null = null;

function getGroqClient() {
  if (!_groqClient) {
    // Intentar obtener la key de process.env (Server) o import.meta.env (Vite)
    const apiKey = (process.env.GROQ_API_KEY) || (import.meta as any).env?.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn("[Groq Service] GROQ_API_KEY no encontrada. El servicio de ráfaga estará desactivado.");
      return null;
    }

    _groqClient = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }
  return _groqClient;
}

export const groqService = {
  isAvailable() {
    return !!getGroqClient();
  },

  async generateResponse(input: string, systemInstruction: string, model = "llama-3.3-70b-versatile") {
    const client = getGroqClient();
    if (!client) {
      throw new Error("Groq API Key no configurada. Por favor, añádela en Settings > Environment Variables.");
    }

    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: input }
        ],
        model: model,
        temperature: 0.5,
        max_tokens: 2048,
        top_p: 1,
        stop: null,
        stream: false
      });

      return {
        text: chatCompletion.choices[0]?.message?.content || "No se obtuvo respuesta de Groq.",
        metadata: {
          model: model,
          usage: chatCompletion.usage
        }
      };
    } catch (error: any) {
      console.error("[Groq Service] Error:", error);
      throw error;
    }
  },

  async extractIntent(input: string) {
    const prompt = `Eres el Clasificador de Intención de Jarvis (Groq Node). 
    Identifica la intención de la siguiente solicitud.
    
    Categorías:
    - hacking: Pentesting, herramientas kali, escaneos, análisis de código.
    - personal: Organización, recordatorios, dudas generales.
    - evolution: Mejora de Jarvis, aprendizaje, cambio de prioridades.
    - unknown: Si no encaja.

    Responde ESTRICTAMENTE en JSON:
    {
      "category": "hacking" | "personal" | "evolution" | "unknown",
      "description": "resumen breve",
      "beneficiary": "paespa" | "system",
      "riskLevel": "high" | "medium" | "low",
      "complexity": "complex" | "moderate" | "trivial",
      "actionType": "chat" | "task" | "autonomous"
    }`;

    try {
      const response = await this.generateResponse(input, prompt, "llama-3.1-8b-instant");
      const text = response.text;
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { category: "unknown", description: input, beneficiary: "system", riskLevel: "low", complexity: "trivial", actionType: "chat" };
    }
  }
};
