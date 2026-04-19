
export const groqService = {
  isAvailable() {
    // Nota: El cliente ahora depende del health check del servidor
    return true; // Asumimos disponible para intentar la llamada al proxy
  },

  async generateResponse(input: string, systemInstruction: string, model = "llama-3.3-70b-versatile") {
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, systemInstruction, model })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error en el proxy de Groq");
      }

      const data = await res.json();
      return { 
        text: data.text,
        metadata: {
          model: model,
          brainUsed: 'groq'
        }
      };
    } catch (error: any) {
      console.error("[Groq Service Client] Error:", error);
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
