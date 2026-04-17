import { jarvisBrain } from "./jarvisService";

export interface KnowledgeNode {
  id: string;
  category: 'hacking' | 'coding' | 'system' | 'preference';
  pattern: string;
  insight: string;
  confidence: number;
  timestamp: string;
}

class JarvisLearningEngine {
  private knowledgeBase: KnowledgeNode[] = [];

  async learnFromInteraction(userMessage: string, jarvisResponse: string) {
    console.log("[Learning Engine] Analizando interacción para extraer conocimiento...");
    
    const prompt = `Analiza la siguiente interacción y extrae UN SOLO "Insight de Aprendizaje" crítico que mejore tu desempeño futuro como Agente Inteligente.
    
    Usuario: "${userMessage}"
    Jarvis: "${jarvisResponse}"
    
    Responde estrictamente en formato JSON:
    {
      "category": "code" | "logic" | "tool" | "concept" | "preference",
      "title": "título corto del patrón",
      "pattern": "descripción breve del patrón detectado",
      "insight": "la lección aprendida o regla a seguir",
      "confidence": 0.0 a 1.0
    }`;

    try {
      // Ignorar si la respuesta es un mensaje de error de cuota (contiene el emoji 🔋 o ⚠️)
      if (jarvisResponse.includes('🔋') || jarvisResponse.includes('⚠️')) {
        console.log("[Learning Engine] Saltando aprendizaje: La respuesta detectada es un mensaje de error.");
        return null;
      }

      const response = await jarvisBrain.processInput(prompt, "Estás en modo APRENDIZAJE CRÍTICO.", { role: "memory" });
      if (!response.text) throw new Error("Respuesta vacía de Jarvis Brain");
      const cleanJson = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const node = JSON.parse(cleanJson);
      
      const newNode: KnowledgeNode = {
        ...node,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      // Enviar al backend para persistencia
      await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });

      return newNode;
    } catch (e) {
      console.error("[Learning Engine] Error sintetizando conocimiento:", e);
      return null;
    }
  }

  async learnFromExecution(command: string, output: string, success: boolean) {
    console.log("[Learning Engine] Analizando resultado de ejecución para optimizar motor...");
    
    const prompt = `Analiza el resultado de la ejecución de este comando y genera una "Regla de Optimización del Motor".
    
    Comando: "${command}"
    Resultado: "${output.substring(0, 500)}${output.length > 500 ? '...' : ''}"
    Éxito: ${success ? 'SÍ' : 'NO'}
    
    Responde estrictamente en formato JSON:
    {
      "category": "tool",
      "title": "Uso de comando: ${command.split(' ')[0]}",
      "pattern": "Comando: ${command.split(' ')[0]}",
      "insight": "${success ? 'Patrón exitoso: ' : 'Error detectado: '} [Tu análisis de cómo usar o evitar este comando en el futuro]",
      "confidence": 0.9
    }`;

    try {
      const response = await jarvisBrain.processInput(prompt, "Estás en modo OPTIMIZACIÓN DE MOTOR.", { role: "memory" });
      if (!response.text) throw new Error("Respuesta vacía de Jarvis Brain");
      const cleanJson = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const node = JSON.parse(cleanJson);
      
      const newNode: KnowledgeNode = {
        ...node,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });

      return newNode;
    } catch (e) {
      return null;
    }
  }

  async getKnowledgeBase(): Promise<KnowledgeNode[]> {
    try {
      const res = await fetch('/api/knowledge');
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  }
}

export const learningEngine = new JarvisLearningEngine();
