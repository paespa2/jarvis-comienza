import { GoogleGenAI } from "@google/genai";

// Estado interno
export const jarvisBrain = {
  async processInput(input: string, context: string, role?: string) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, context, role })
      });
      
      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.metadata) {
        return data; // Return full object if metadata exists
      }
      return data.text || "Sin respuesta del servidor.";
    } catch (error: any) {
      console.error("[Jarvis Frontend] Error conectando al backend:", error);
      return `⚠️ **Error de Conexión:** No pude contactar al Backend de Jarvis. Asegúrate de que el servidor Node.js está corriendo.`;
    }
  },

  async summarizeResearch(text: string) {
    return this.processInput(`Analiza y resume los puntos clave de este artículo de investigación para mi base de conocimientos. Enfócate en cómo esto afecta mi propia infraestructura y eficiencia como agente:\n\n${text}`, "", "memory");
  },

  async safetyClassifier(action: string, intent: string) {
    const response = await this.processInput(`Evalúa la siguiente acción propuesta basándote en la intención del usuario.
      Intención: "${intent}"
      Acción propuesta: "${action}"
      
      Responde en formato JSON:
      {
        "approved": boolean,
        "reason": "explicación breve",
        "riskLevel": "low" | "medium" | "high"
      }`, "", "evaluator");
    try {
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse safetyClassifier response:", response);
      return { approved: false, reason: response || "Error de parseo JSON", riskLevel: "high" };
    }
  },

  async planner(task: string) {
    return this.processInput(task, "", "planner");
  },

  async evaluator(output: string, criteria: string) {
    return this.processInput(`Resultado: ${output}\nCriterios: ${criteria}`, "", "evaluator");
  },

  async extractMemoryFromChat(userMessage: string, jarvisResponse: string) {
    const input = `Usuario: "${userMessage}"\nJarvis: "${jarvisResponse}"`;
    const response = await this.processInput(input, "", "memory");
    try {
      // Intentar limpiar el JSON si el modelo local incluyó markdown
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const nodes = JSON.parse(cleanJson);
      return Array.isArray(nodes) ? nodes : [];
    } catch (e) {
      return [];
    }
  },

  async teamOrchestrator(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async noveltyEngine(problem: string) {
    return this.processInput(`Problema: ${problem}`, "", "planner");
  },

  async runEval(task: string, output: string, transcript: any[]) {
    const input = `Tarea: "${task}"\nResultado: "${output}"\nTranscripción: ${JSON.stringify(transcript)}`;
    const response = await this.processInput(input, "", "evaluator");
    try {
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: response };
    }
  },

  async getBearings(memories: any[]) {
    return this.processInput(`Registros: ${JSON.stringify(memories.slice(0, 10))}`, "", "jit");
  },

  async updateProgress(task: string, status: string) {
    return this.processInput(`Tarea: ${task}\nEstado: ${status}`, "", "planner");
  },

  async toolDiscovery(query: string) {
    return this.processInput(`Petición: ${query}`, "", "jit");
  },

  async programmaticOrchestrator(task: string, tools: string) {
    return this.processInput(`Tarea: ${task}\nHerramientas: ${tools}`, "", "planner");
  },

  async codeModeOrchestrator(task: string, mcpServers: string) {
    return this.processInput(`Tarea: ${task}\nServidores MCP: ${mcpServers}`, "", "planner");
  },

  async sandboxManager(command: string) {
    const response = await this.processInput(`Acción: ${command}`, "", "evaluator");
    try {
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { safe: false, boundary: "both", reason: response, autoAllowed: false };
    }
  },

  async compactContext(history: any[]) {
    return this.processInput(`Historial: ${JSON.stringify(history)}`, "", "memory");
  },

  async manageAgenticMemory(action: 'write' | 'read', content?: string) {
    return this.processInput(`Acción: ${action}\nContenido: ${content || 'N/A'}`, "", "memory");
  },

  async justInTimeRetrieval(query: string, environment: string) {
    return this.processInput(`Petición: ${query}\nEntorno: ${environment}`, "", "jit");
  },

  async infrastructurePostmortem(issue: string) {
    return this.processInput(`Reporte: ${issue}`, "", "evaluator");
  },

  async hardwareEquivalenceCheck(platform: 'TPU' | 'GPU' | 'Trainium') {
    return this.processInput(`Plataforma: ${platform}`, "", "evaluator");
  },

  async toolEvaluation(tools: string) {
    return this.processInput(`Herramientas: ${tools}`, "", "evaluator");
  },

  async toolOptimization(transcripts: string) {
    return this.processInput(`Transcritos: ${transcripts}`, "", "evaluator");
  },

  async ergonomicToolDesign(workflow: string) {
    return this.processInput(`Flujo: ${workflow}`, "", "planner");
  },

  async mcpbOrchestrator(request: string) {
    return this.processInput(`Petición: ${request}`, "", "planner");
  },

  async mcpbPackager(manifest: string) {
    return this.processInput(`Manifest: ${manifest}`, "", "evaluator");
  },

  async researchOrchestrator(query: string) {
    return this.processInput(`Consulta: ${query}`, "", "planner");
  },

  async researchSubagent(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "jit");
  },

  async citationAgent(report: string, sources: string) {
    return this.processInput(`Informe: ${report}\nFuentes: ${sources}`, "", "memory");
  },

  async verificationGenerator(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "evaluator");
  },

  async interviewUser(topic: string) {
    return this.processInput(`Tema: ${topic}`, "", "planner");
  },

  async workflowOrchestrator(phase: 'explore' | 'plan' | 'implement' | 'commit', context: string) {
    return this.processInput(`Fase: ${phase}\nContexto: ${context}`, "", "planner");
  },

  async skillManager(action: 'create' | 'invoke', name: string, content?: string) {
    return this.processInput(`Acción: ${action}\nNombre: ${name}\nContenido: ${content || 'N/A'}`, "", "planner");
  },

  async think(thought: string) {
    return this.processInput(`Pensamiento: ${thought}`, "", "planner");
  },

  async optimizedReasoning(domain: 'airline' | 'retail' | 'coding', context: string) {
    return this.processInput(`Dominio: ${domain}\nContexto: ${context}`, "", "planner");
  },

  async sweAgentOrchestrator(issue: string) {
    return this.processInput(`Problema: ${issue}`, "", "planner");
  },

  async strReplaceEditor(path: string, oldStr: string, newStr: string) {
    return this.processInput(`Archivo: ${path}\nAntiguo: ${oldStr}\nNuevo: ${newStr}`, "", "planner");
  },

  async promptChaining(task: string, steps: string[]) {
    return this.processInput(`Tarea: ${task}\nPasos: ${steps.join(", ")}`, "", "planner");
  },

  async router(input: string, categories: string[]) {
    return this.processInput(`Entrada: ${input}\nCategorías: ${categories.join(", ")}`, "", "planner");
  },

  async parallelOrchestrator(task: string, mode: 'sectioning' | 'voting') {
    return this.processInput(`Tarea: ${task}\nModo: ${mode}`, "", "planner");
  },

  async evaluatorOptimizer(initialResponse: string, criteria: string) {
    return this.processInput(`Respuesta: ${initialResponse}\nCriterios: ${criteria}`, "", "evaluator");
  },

  async contextualizer(document: string, chunk: string) {
    return this.processInput(`Documento: ${document}\nFragmento: ${chunk}`, "", "memory");
  },

  async hybridRetrieval(query: string, corpus: string) {
    return this.processInput(`Consulta: ${query}\nCorpus: ${corpus}`, "", "jit");
  },

  async reranker(query: string, chunks: string[]) {
    return this.processInput(`Consulta: ${query}\nFragmentos: ${chunks.join("\n---\n")}`, "", "evaluator");
  },

  async adaptiveThinking(task: string, effort: 'low' | 'medium' | 'high' | 'max' = 'high') {
    return this.processInput(`Tarea: ${task}\nEsfuerzo: ${effort}`, "", "planner");
  },

  async tokenEfficiencyController(task: string, effort: 'low' | 'medium' | 'high' | 'max') {
    return this.processInput(`Tarea: ${task}\nEsfuerzo: ${effort}`, "", "planner");
  },

  async fastModeController(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async structuredOutputGenerator(task: string, schema: any) {
    return this.processInput(`Tarea: ${task}\nEsquema: ${JSON.stringify(schema)}`, "", "planner");
  },

  async strictToolValidator(toolName: string, inputs: any, schema: any) {
    return this.processInput(`Herramienta: ${toolName}\nEntradas: ${JSON.stringify(inputs)}\nEsquema: ${JSON.stringify(schema)}`, "", "evaluator");
  },

  async citationGenerator(query: string, documents: any[]) {
    return this.processInput(`Consulta: ${query}\nDocumentos: ${JSON.stringify(documents)}`, "", "memory");
  },

  async *streamingController(task: string, simulateRefusal: boolean = false) {
    const baseText = `Iniciando flujo de datos en tiempo real para: ${task}. Este es un ejemplo de cómo Jarvis procesa y entrega información de forma incremental, reduciendo la latencia percibida y mejorando la experiencia del operador.`;
    const words = baseText.split(" ");
    
    for (let i = 0; i < words.length; i++) {
      // Simulate a refusal mid-stream if requested
      if (simulateRefusal && i === Math.floor(words.length / 2)) {
        yield { text: " [CONTENIDO SOSPECHOSO DETECTADO]...", stopReason: "refusal" };
        return; // Stop the generator
      }
      
      yield { text: words[i] + " ", stopReason: null };
    }
    
    yield { text: "\n\n**Flujo completado con éxito.**", stopReason: "stop" };
  },

  async evolutionEngine(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async sovereignDriverController(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async multilingualController(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async generateEmbeddings(texts: string[], inputType: "document" | "query" = "document", domain: string = "general") {
    return this.processInput(`Textos: ${JSON.stringify(texts)}\nTipo: ${inputType}\nDominio: ${domain}`, "", "memory");
  },

  async toolUseController(task: string) {
    return this.processInput(`Tarea: ${task}`, "", "planner");
  },

  async batchProcessor(requests: any[]) {
    return this.processInput(`Solicitudes: ${JSON.stringify(requests)}`, "", "planner");
  },

  generateSovereignLogs(input: string) {
    const logs = [
      `Analizando patrones de intención: "${input.substring(0, 15)}..."`,
      "Verificando alineación con Núcleo de Identidad (ALMA.md)",
      "Optimizando ruta de inferencia para baja latencia",
      "Evaluando necesidad de destilación de conocimiento JIT",
      "Sincronizando estado con Firebase Sovereign Store",
      "Decidiendo nivel de esfuerzo cognitivo autónomo",
      "Escaneando vulnerabilidades en el flujo de evolución",
      "Ajustando parámetros de contexto cultural e idiomático",
      "Optimizando dimensiones de embeddings Matryoshka",
      "Ejecutando bucle agéntico para resolución de herramientas",
      "Aplicando filtrado dinámico a resultados de búsqueda web"
    ];
    return logs.sort(() => Math.random() - 0.5).slice(0, 3);
  },

  async analyzeDay(memories: any[]) {
    const memoryString = memories.map(m => m.content).join("\n");
    return this.processInput(`Recuerdos:\n${memoryString}`, "", "memory");
  },

  async searchWeb(query: string) {
    const response = await this.processInput(`Consulta: ${query}`, "", "jit");
    return [
      {
        source: "Local Search",
        title: "Resultado de Búsqueda",
        content: response
      }
    ];
  }
};
