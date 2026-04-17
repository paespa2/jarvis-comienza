import { geminiService } from "./geminiService";

export interface CognitiveBlock {
  id: string;
  source: string;
  category: 'logic' | 'tool' | 'preference' | 'concept' | 'code';
  title: string;
  pattern: string;
  distilledAt: string;
}

let extractionQueue = Promise.resolve();

export const secondBrainService = {
  async getBrain() {
    try {
      const res = await fetch('/api/second-brain');
      if (res.ok) return await res.json();
      return { blocks: [], lastSynthesis: null };
    } catch (e) {
      return { blocks: [], lastSynthesis: null };
    }
  },

  async synthesizeKnowledge(source: string, rawData: string) {
    return new Promise<CognitiveBlock[]>((resolve) => {
      extractionQueue = extractionQueue.then(async () => {
        console.log(`[Second Brain] Sintetizando conocimiento de: ${source}`);
        await new Promise(r => setTimeout(r, 1000)); // Rate limiting buffer
        
        // Usar Flash para la síntesis: Económico y con mayor cuota (ML-lite)
        const prompt = `Actúa como el Motor de Síntesis Cognitiva de Jarvis. 
        Analiza esta información y extrae TODOS los bloques cognitivos individuales de conocimiento útiles. 
        Divídelos identificando reglas, conceptos, trucos de herramientas o código.
        
        Fuente: ${source}
        Información: "${rawData}"
        
        Responde estrictamente en formato JSON (sin markdown) respetando esta estructura:
        {
          "blocks": [
            {
              "category": "logic|tool|preference|concept|code",
              "title": "Un título descriptivo (ej: Comprensión de Listas en Python)",
              "pattern": "Descansa aquí la regla, orden o conocimiento técnico directo y claro",
              "isExecutable": boolean
            }
          ]
        }`;

        try {
          const distillationRes = await geminiService.extractJson(prompt);

          if (!distillationRes || !Array.isArray(distillationRes.blocks)) {
            console.warn("[Second Brain] Extracción no contenía .blocks válidos. Cancelando inyección.");
            resolve([]);
            return;
          }

          const newBlocks: CognitiveBlock[] = distillationRes.blocks.map((b: any) => ({
            ...b,
            id: `block-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            source,
            distilledAt: new Date().toISOString()
          }));

          // Guardar en el backend
          await fetch('/api/second-brain/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocks: newBlocks })
          });

          resolve(newBlocks);
        } catch (e) {
          console.error("[Second Brain] Error en síntesis:", e);
          resolve([]);
        }
      });
    });
  },

  async queryBrain(task: string) {
    const brain = await this.getBrain();
    if (!brain.blocks || brain.blocks.length === 0) return null;

    // Búsqueda simple por palabras clave (Simulando recuperación semántica)
    const keywords = task.toLowerCase().split(' ');
    const relevantBlocks = brain.blocks.filter((b: any) => 
      keywords.some((k: string) => k.length > 3 && (b.title.toLowerCase().includes(k) || b.pattern.toLowerCase().includes(k)))
    );

    return relevantBlocks.length > 0 ? relevantBlocks.slice(0, 3) : null;
  }
};
