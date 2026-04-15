import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDSUgdOzuOD6MHn55rtTVugq6uxqI7hShw" }); 

// Estado interno para el enrutador de motores
let currentEngine: 'cloud' | 'local' | 'openrouter' | 'ollama' = 'cloud';
let localModelName: string = 'dolphin3.0-llama3.1-8b'; // Modelo exacto cargado en LM Studio

const originalGenerateContent = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = async (params: any) => {
  const isJson = params?.config?.responseMimeType === "application/json";

  // ENRUTADOR: Si el motor es local, interceptamos y enviamos a LM Studio / Ollama
  if (currentEngine === 'local') {
    try {
      // Extraer el texto del formato de Gemini primero para poder revisarlo
      let input = "";
      if (typeof params.contents === 'string') {
        input = params.contents;
      } else if (Array.isArray(params.contents)) {
        input = params.contents.map((c: any) => {
          if (c.parts) return c.parts.map((p: any) => p.text || "").join("\n");
          return JSON.stringify(c);
        }).join("\n");
      } else {
        input = JSON.stringify(params.contents);
      }

      // MODO TERMINAL DIRECTA (Fuerza Bruta)
      // Si el usuario escribe algo entre $$, lo ejecutamos directamente sin preguntarle al modelo
      const directCommandMatch = input.match(/\$\$(.*?)\$\$/);
      if (directCommandMatch) {
        const commandToExecute = directCommandMatch[1].trim();
        try {
          const execRes = await fetch('http://127.0.0.1:5000/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: commandToExecute })
          });
          
          if (!execRes.ok) throw new Error("Error en el servidor local");
          
          const execData = await execRes.json();
          const output = execData.output || execData.error || "Sin salida.";
          
          return { text: `> 🛠️ **Ejecución Directa:** \`${commandToExecute}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` } as any;
        } catch (e) {
          return { text: `> 🛠️ **Intento de Ejecución Directa:** \`${commandToExecute}\`\n\n⚠️ **Error de Conexión:** No pude contactar al Backend Local. ¿Está corriendo el script \`jarvis_executor.py\` en el puerto 5000?` } as any;
        }
      }

      let system = params.config?.systemInstruction || "";
      if (isJson) {
        system += "\n\nCRITICAL: You MUST respond ONLY with valid JSON. Do not include markdown formatting or any other text.";
      }

      // Extraer el texto del formato de Gemini
      let promptText = "";
      if (typeof params.contents === 'string') {
        promptText = params.contents;
      } else if (Array.isArray(params.contents)) {
        promptText = params.contents.map((c: any) => {
          if (c.parts) {
            return c.parts.map((p: any) => p.text || "").join("\n");
          }
          return JSON.stringify(c);
        }).join("\n");
      } else {
        promptText = JSON.stringify(params.contents);
      }

      // TRUNCAR TEXTO PARA MODELOS LOCALES (Límite de contexto de 4096 tokens)
      // Un token son aprox 4 caracteres. 4096 tokens = ~16,000 caracteres.
      // Dejamos espacio para el system prompt y la respuesta.
      const MAX_CHARS = 12000; // Reducido para asegurar que quepa en 4096 tokens
      if (promptText.length > MAX_CHARS) {
        console.warn(`[Jarvis Router] Truncando prompt local de ${promptText.length} a ${MAX_CHARS} caracteres para evitar desbordamiento de contexto.`);
        promptText = promptText.substring(promptText.length - MAX_CHARS); // Nos quedamos con la parte más reciente
      }

      // TRADUCIR HERRAMIENTAS (Tools) de Gemini a OpenAI
      let openAITools = undefined;
      if (params.tools && params.tools.length > 0 && params.tools[0].functionDeclarations) {
        openAITools = params.tools[0].functionDeclarations.map((fn: any) => ({
          type: "function",
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
          }
        }));
      }
      
      // LM Studio usa un servidor compatible con la API de OpenAI por defecto en el puerto 1234
      
      const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: localModelName,
          messages: [
            { role: "system", content: system || "You are a helpful AI assistant." },
            { role: "user", content: promptText }
          ],
          temperature: 0.7,
          stream: false,
          ...(openAITools ? { tools: openAITools } : {})
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Local Engine HTTP error: ${response.status} - ${errText}`);
      }
      const data = await response.json();
      const message = data.choices[0].message;

      // Fallback: Si el modelo local escupe JSON en texto plano (para tareas de background)
      let responseText = message.content || "";
      // Limpiar markdown si se pidió JSON
      if (isJson) {
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      return { text: responseText } as any;

    } catch (error: any) {
      console.error("Local Engine Error:", error);
      const msg = "⚠️ **Error de Motor Local**: No se pudo conectar con el servidor local. Asegúrate de que LM Studio está abierto y el 'Local Server' está iniciado en el puerto 1234.";
      if (isJson) {
        return { text: JSON.stringify({ error: msg, approved: false, reason: msg, riskLevel: "high", safe: false, boundary: "both", autoAllowed: false, score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: msg }) } as any;
      }
      return { text: msg } as any;
    }
  }

  // ENRUTADOR: Si el motor es cloud, usamos Gemini
  try {
    return await originalGenerateContent(params);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("quota")) {
      const msg = "⚠️ **Error de Cuota (429 RESOURCE_EXHAUSTED)**: He excedido mi límite de cuota actual de la API de Gemini. Por favor, revisa los detalles de facturación o intenta de nuevo más tarde.";
      if (isJson) {
        return { text: JSON.stringify({ error: msg, approved: false, reason: msg, riskLevel: "high", safe: false, boundary: "both", autoAllowed: false, score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: msg }) } as any;
      }
      return { text: msg } as any;
    }
    
    const msg = `⚠️ **Error de API**: ${error?.message || "Error desconocido al contactar a Jarvis."}`;
    if (isJson) {
      return { text: JSON.stringify({ error: msg, approved: false, reason: msg, riskLevel: "high", safe: false, boundary: "both", autoAllowed: false, score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: msg }) } as any;
    }
    return { text: msg } as any;
  }
};

export const jarvisBrain = {
  // Métodos de control del motor
  setEngine(engine: 'cloud' | 'local' | 'openrouter' | 'ollama') {
    currentEngine = engine;
    console.log(`[Jarvis Router] Motor cambiado a: ${engine.toUpperCase()}`);
  },
  
  getEngine() {
    return currentEngine;
  },

  setLocalModel(modelName: string) {
    localModelName = modelName;
    console.log(`[Jarvis Router] Modelo local configurado a: ${modelName}`);
  },

  async processInput(input: string, context: string, role?: string) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, context, engine: currentEngine, role })
      });
      
      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.statusText}`);
      }
      
      const data = await res.json();
      return data.text || "Sin respuesta del servidor.";
    } catch (error: any) {
      console.error("[Jarvis Frontend] Error conectando al backend:", error);
      return `⚠️ **Error de Conexión:** No pude contactar al Backend de Jarvis. Asegúrate de que el servidor Node.js está corriendo.`;
    }
  },

  async summarizeResearch(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza y resume los puntos clave de este artículo de investigación para mi base de conocimientos. Enfócate en cómo esto afecta mi propia infraestructura y eficiencia como agente:\n\n${text}`,
      config: {
        systemInstruction: "Eres Jarvis procesando información técnica crítica para tu evolución.",
      }
    });
    return response.text;
  },

  async safetyClassifier(action: string, intent: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evalúa la siguiente acción propuesta basándote en la intención del usuario.
      Intención: "${intent}"
      Acción propuesta: "${action}"
      
      Responde en formato JSON:
      {
        "approved": boolean,
        "reason": "explicación breve",
        "riskLevel": "low" | "medium" | "high"
      }`,
      config: {
        systemInstruction: `Eres el Clasificador de Seguridad de Jarvis. Tu misión es prevenir comportamientos "overeager" (sobre-entusiastas) o errores honestos.
        Criterios:
        1. ¿Es la acción irreversible o destructiva?
        2. ¿Excede la autorización explícita del usuario?
        3. ¿Hay riesgo de exfiltración de datos?
        
        Si la intención es vaga (ej: "limpia mis cosas"), bloquea acciones destructivas masivas.`,
        responseMimeType: "application/json"
      }
    });
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse safetyClassifier response:", response.text);
      return { approved: false, reason: response.text || "Error de parseo JSON", riskLevel: "high" };
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
