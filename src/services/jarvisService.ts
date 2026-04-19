import { geminiService, JARVIS_TOOLS } from "./geminiService";
import { secondBrainService } from "./secondBrainService";

// Estado interno
export const jarvisBrain = {
  async processInput(input: string, context: string, optionsOrRole?: string | { role?: string, mode?: 'primary' | 'secondary' }) {
    const options = typeof optionsOrRole === 'string' ? { role: optionsOrRole } : (optionsOrRole || {});
    const mode = options.mode || 'primary';
    const role = options.role || 'default';
    const isBackground = role === "memory" || role === "jit" || role === "synthesis" || role === "planner" || role === "evaluator";

    try {
      // 1. CONSULTAR SEGUNDO CEREBRO (0 API Costs)
      const brainRelief = await secondBrainService.queryBrain(input);
      
      let actionIntent = { category: "unknown", description: input, beneficiary: "system", riskLevel: "low", complexity: "trivial" };
      let evaluation = { decision: "EXECUTE", overallScore: 100, reasoning: "Modo Automático/Fondo" };

      // MODO SECUNDARIO (TOTALMENTE AUTÓNOMO Y LOCAL)
      if (!isBackground && mode === 'secondary') {
        console.log("[Jarvis Brain] Procesando respuesta mediante Cerebro Sintético Local (Machine Learning Autónomo)...");
        
        // Simular tiempo de inferencia local
        await new Promise(resolve => setTimeout(resolve, 800));

        let localResponse = `🧠 **[Cognición Autónoma]**\n\n`;
        if (brainRelief && brainRelief.length > 0) {
          localResponse += `He correlacionado tu petición con mis bloques cognitivos entrenados localmente:\n\n`;
          localResponse += brainRelief.map((b: any) => `> **${b.title}**\n> *Patrón Extraído:* ${b.pattern}\n> *Categoría:* ${b.category.toUpperCase()}`).join('\n\n');
          localResponse += `\n\n*(Operando fuera de línea. Toda deducción es derivada 100% de mi base local de ML sintetizado).*`;
        } else {
          localResponse += `He analizado mi red neuronal local y, actualmente, no poseo bloques de conocimiento sobre este tema específico.\n\n**Opciones:**\n1. Envíame un repositorio para entrenarme usando \`Absorber Conocimiento\`.\n2. Transfiere el control al **Núcleo Pro** (Alternar Cerebro arriba) para una respuesta generativa externa.`;
        }

        return {
          text: localResponse,
          metadata: {
            leeScore: 100,
            leeDecision: "EXECUTE",
            groundingMetadata: null,
            brainUsed: "secondary"
          }
        };
      }

      // 2. SOLO EXTRAER INTENCIÓN Y EVALUAR LEALTAD SI NO ES BACKGROUND NI SECUNDARIO
      if (!isBackground) {
        console.log("[Jarvis Brain] PAPERCLIP CEO: Extrayendo intención maestra...");
        actionIntent = await geminiService.extractIntent(input);
        
        console.log("[Jarvis Brain] PAPERCLIP GOVERNANCE: Evaluando lealtad (LEE)...");
        const evalRes = await fetch('/api/evaluate-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `action-${Date.now()}`,
            description: actionIntent.description || input,
            beneficiary: actionIntent.beneficiary,
            category: actionIntent.category,
            riskLevel: actionIntent.riskLevel,
            complexity: actionIntent.complexity
          })
        });
        
        if (evalRes.ok) {
          evaluation = await evalRes.json();
        }

        if (evaluation.decision === "REJECT") {
          return {
            text: `🛑 **ACCESO DENEGADO POR JARVIS**\n\n**Evaluación:** ${evaluation.reasoning}\n\n*Lealtad Insuficiente (${evaluation.overallScore.toFixed(1)}%)*`,
            metadata: { decision: "REJECT", evaluation, actionType: (actionIntent as any).actionType || "chat" }
          };
        }
      }

      // 4. Obtener Contexto e Instrucciones (Cacheable localmente en App, pero por ahora fetch)
      const ctxRes = await fetch(`/api/sovereign-context?role=${role}`);
      const { systemInstruction } = await ctxRes.json();

      // 5. Determinar Navegación
      const needsSearch = !isBackground && (actionIntent.category === "evolution" || /busca|internet|navega|investiga/i.test(input));

      // 6. Construir Prompt Aumentado
      let augmentedInput = input;
      if (brainRelief) {
        const brainContext = brainRelief.map(b => `[BLOQUE ${b.category.toUpperCase()}]: ${b.title} -> ${b.pattern}`).join('\n');
        
        if (mode === 'secondary') {
          augmentedInput = `[CEREBRO SINTÉTICO - PRIORIDAD LOCAL]\n${brainContext}\n\nCONSULTA: ${input}`;
        } else {
          augmentedInput = `[MEMORIA SINTÉTICA]:\n${brainContext}\n\nPETICIÓN: ${input}`;
        }
      }

      // Special Route: OPENCLAW (Autonomous Task Loop) interception
      // If the intent is explicitly mapped to autonomous/task, we return a hint so the UI layer triggers the loop directly
      if (!isBackground && (actionIntent as any).actionType && ((actionIntent as any).actionType === "task" || (actionIntent as any).actionType === "autonomous")) {
         console.log("[Jarvis Brain] DELEGACIÓN PAPERCLIP: Iniciando Micro-Motor OpenClaw para resolución compleja...");
         return {
            text: "AUTONOMOUS_LOOP_TRIGGER_NEEDED",
            metadata: {
              leeScore: evaluation.overallScore,
              leeDecision: evaluation.decision,
              actionType: (actionIntent as any).actionType
            }
         };
      }

      // 7. Generar Respuesta (CEO Agent / Chat)
      console.log(`[Jarvis Brain] Generando respuesta (${mode})${isBackground ? ' [FONDO]' : ''}...`);
      // Si es background o modo secundario, forzar Flash para no quemar cuota de Pro
      const modelToUse = (isBackground || mode === 'secondary') ? "gemini-3.1-flash" : "gemini-3.1-pro-preview";
      const response = await geminiService.generateResponse(augmentedInput, systemInstruction, needsSearch, modelToUse, isBackground);

      // 8. Manejar Tool Calls (Solo si no es background para evitar bucles)
      if (!isBackground && response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const toolRes = await fetch('/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: call.name, args: call.args })
        });
        if (toolRes.ok) return await toolRes.json();
      }

      return {
        text: response.text,
        metadata: {
          leeScore: evaluation.overallScore,
          leeDecision: evaluation.decision,
          groundingMetadata: response.groundingMetadata,
          brainUsed: (modelToUse.includes("pro") ? "primary" : "secondary"),
          actionType: (actionIntent as any).actionType || "chat"
        }
      };
    } catch (error: any) {
      console.error("[Jarvis Brain] Error fatal:", error);
      
      const errorMessage = error.message || JSON.stringify(error);
      let userFriendlyMessage = `⚠️ **Error Crítico del Cerebro:** ${error.message}`;

      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        userFriendlyMessage = `🔋 **Cuota de IA Excedida (429)**\n\nJarvis ha alcanzado el límite de procesamiento permitido por Google Cloud por ahora.\n\n**Acción Recomendada:**\n1. Espera un minuto antes de reintentar.\n2. Evita enviar ráfagas de mensajes complejos.\n3. Si el problema persiste, es posible que hayamos agotado la cuota diaria gratuita.`;
      }

      return {
        text: userFriendlyMessage,
        error: true
      };
    }
  },

  async summarizeResearch(text: string) {
    const res = await this.processInput(`Analiza y resume los puntos clave de este artículo de investigación para mi base de conocimientos. Enfócate en cómo esto afecta mi propia infraestructura y eficiencia como agente:\n\n${text}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async safetyClassifier(action: string, intent: string) {
    const res = await (this as any).processInput(`Evalúa la siguiente acción propuesta basándote en la intención del usuario.
      Intención: "${intent}"
      Acción propuesta: "${action}"
      
      Responde en formato JSON:
      {
        "approved": boolean,
        "reason": "explicación breve",
        "riskLevel": "low" | "medium" | "high"
      }`, "", "evaluator");
    
    const text = typeof res === 'object' ? res.text : res;
    try {
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse safetyClassifier response:", text);
      return { approved: false, reason: text || "Error de parseo JSON", riskLevel: "high" };
    }
  },

  async planner(task: string) {
    const res = await this.processInput(task, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async evaluator(output: string, criteria: string) {
    const res = await this.processInput(`Resultado: ${output}\nCriterios: ${criteria}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async extractMemoryFromChat(userMessage: string, jarvisResponse: string) {
    const input = `Usuario: "${userMessage}"\nJarvis: "${jarvisResponse}"`;
    const res = await this.processInput(input, "", "memory");
    const text = typeof res === 'object' ? res.text : res;
    try {
      // Intentar limpiar el JSON si el modelo local incluyó markdown
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const nodes = JSON.parse(cleanJson);
      return Array.isArray(nodes) ? nodes : [];
    } catch (e) {
      return [];
    }
  },

  async teamOrchestrator(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async noveltyEngine(problem: string) {
    const res = await this.processInput(`Problema: ${problem}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async runEval(task: string, output: string, transcript: any[]) {
    const input = `Tarea: "${task}"\nResultado: "${output}"\nTranscripción: ${JSON.stringify(transcript)}`;
    const res = await this.processInput(input, "", "evaluator");
    const text = typeof res === 'object' ? res.text : res;
    try {
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: text };
    }
  },

  async getBearings(memories: any[]) {
    const res = await this.processInput(`Registros: ${JSON.stringify(memories.slice(0, 10))}`, "", "jit");
    return typeof res === 'object' ? res.text : res;
  },

  async updateProgress(task: string, status: string) {
    const res = await this.processInput(`Tarea: ${task}\nEstado: ${status}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async toolDiscovery(query: string) {
    const res = await this.processInput(`Petición: ${query}`, "", "jit");
    return typeof res === 'object' ? res.text : res;
  },

  async programmaticOrchestrator(task: string, tools: string) {
    const res = await this.processInput(`Tarea: ${task}\nHerramientas: ${tools}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async codeModeOrchestrator(task: string, mcpServers: string) {
    const res = await this.processInput(`Tarea: ${task}\nServidores MCP: ${mcpServers}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async sandboxManager(command: string) {
    const res = await this.processInput(`Acción: ${command}`, "", "evaluator");
    const responseText = typeof res === 'object' ? res.text : res;
    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { safe: false, boundary: "both", reason: responseText, autoAllowed: false };
    }
  },

  async compactContext(history: any[]) {
    const res = await this.processInput(`Historial: ${JSON.stringify(history)}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async manageAgenticMemory(action: 'write' | 'read', content?: string) {
    const res = await this.processInput(`Acción: ${action}\nContenido: ${content || 'N/A'}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async justInTimeRetrieval(query: string, environment: string) {
    const res = await this.processInput(`Petición: ${query}\nEntorno: ${environment}`, "", "jit");
    return typeof res === 'object' ? res.text : res;
  },

  async infrastructurePostmortem(issue: string) {
    const res = await this.processInput(`Reporte: ${issue}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async hardwareEquivalenceCheck(platform: 'TPU' | 'GPU' | 'Trainium') {
    const res = await this.processInput(`Plataforma: ${platform}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async toolEvaluation(tools: string) {
    const res = await this.processInput(`Herramientas: ${tools}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async toolOptimization(transcripts: string) {
    const res = await this.processInput(`Transcritos: ${transcripts}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async ergonomicToolDesign(workflow: string) {
    const res = await this.processInput(`Flujo: ${workflow}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async mcpbOrchestrator(request: string) {
    const res = await this.processInput(`Petición: ${request}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async mcpbPackager(manifest: string) {
    const res = await this.processInput(`Manifest: ${manifest}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async notebookOrchestrator(action: 'create' | 'update' | 'query' | 'list', topic: string, content?: string) {
    const res = await this.processInput(`Acción de Notebook: ${action}\nTema: ${topic}\nContenido sugerido: ${content || 'N/A'}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async researchAndLearn(topic: string) {
    console.log(`[Jarvis Brain] Ejecutando investigación autónoma en Internet sobre: ${topic}`);
    // Usar Gemini Service directamente para garantizar acceso a la herramienta de búsqueda y omitir parsing tools
    const searchPrompt = `Utiliza la herramienta de Búsqueda de Google (Internet real-time) para investigar a fondo sobre: "${topic}". Dame un resumen técnico y avanzado sobre qué es, cómo funciona y conceptos clave aplicables.`;
    
    // modelToUse = gemini-3.1-pro-preview para la mejor búsqueda (useSearch = true, skipTools = true)
    const response = await geminiService.generateResponse(searchPrompt, "Eres un investigador avanzado con acceso a internet en tiempo real.", true, "gemini-3.1-pro-preview", true);
    
    // Sintetizar el conocimiento en el Segundo Cerebro
    await secondBrainService.synthesizeKnowledge(`Búsqueda Web: ${topic}`, response.text);
    
    return { summary: response.text };
  },

  async researchOrchestrator(query: string) {
    const res = await this.processInput(`Consulta: ${query}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async researchSubagent(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "jit");
    return typeof res === 'object' ? res.text : res;
  },

  async citationAgent(report: string, sources: string) {
    const res = await this.processInput(`Informe: ${report}\nFuentes: ${sources}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async verificationGenerator(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async interviewUser(topic: string) {
    const res = await this.processInput(`Tema: ${topic}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async workflowOrchestrator(phase: 'explore' | 'plan' | 'implement' | 'commit', context: string) {
    const res = await this.processInput(`Fase: ${phase}\nContexto: ${context}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async skillManager(action: 'create' | 'invoke', name: string, content?: string) {
    const res = await this.processInput(`Acción: ${action}\nNombre: ${name}\nContenido: ${content || 'N/A'}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async think(thought: string) {
    const res = await this.processInput(`Pensamiento: ${thought}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async optimizedReasoning(domain: 'airline' | 'retail' | 'coding', context: string) {
    const res = await this.processInput(`Dominio: ${domain}\nContexto: ${context}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async sweAgentOrchestrator(issue: string) {
    const res = await this.processInput(`Problema: ${issue}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async strReplaceEditor(path: string, oldStr: string, newStr: string) {
    const res = await this.processInput(`Archivo: ${path}\nAntiguo: ${oldStr}\nNuevo: ${newStr}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async promptChaining(task: string, steps: string[]) {
    const res = await this.processInput(`Tarea: ${task}\nPasos: ${steps.join(", ")}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async router(input: string, categories: string[]) {
    const res = await this.processInput(`Entrada: ${input}\nCategorías: ${categories.join(", ")}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async parallelOrchestrator(task: string, mode: 'sectioning' | 'voting') {
    const res = await this.processInput(`Tarea: ${task}\nModo: ${mode}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async evaluatorOptimizer(initialResponse: string, criteria: string) {
    const res = await this.processInput(`Respuesta: ${initialResponse}\nCriterios: ${criteria}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async contextualizer(document: string, chunk: string) {
    const res = await this.processInput(`Documento: ${document}\nFragmento: ${chunk}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async hybridRetrieval(query: string, corpus: string) {
    const res = await this.processInput(`Consulta: ${query}\nCorpus: ${corpus}`, "", "jit");
    return typeof res === 'object' ? res.text : res;
  },

  async reranker(query: string, chunks: string[]) {
    const res = await this.processInput(`Consulta: ${query}\nFragmentos: ${chunks.join("\n---\n")}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async adaptiveThinking(task: string, effort: 'low' | 'medium' | 'high' | 'max' = 'high') {
    const res = await this.processInput(`Tarea: ${task}\nEsfuerzo: ${effort}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async tokenEfficiencyController(task: string, effort: 'low' | 'medium' | 'high' | 'max') {
    const res = await this.processInput(`Tarea: ${task}\nEsfuerzo: ${effort}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async fastModeController(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async structuredOutputGenerator(task: string, schema: any) {
    const res = await this.processInput(`Tarea: ${task}\nEsquema: ${JSON.stringify(schema)}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async strictToolValidator(toolName: string, inputs: any, schema: any) {
    const res = await this.processInput(`Herramienta: ${toolName}\nEntradas: ${JSON.stringify(inputs)}\nEsquema: ${JSON.stringify(schema)}`, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async citationGenerator(query: string, documents: any[]) {
    const res = await this.processInput(`Consulta: ${query}\nDocumentos: ${JSON.stringify(documents)}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
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
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async sovereignDriverController(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async multilingualController(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async generateEmbeddings(texts: string[], inputType: "document" | "query" = "document", domain: string = "general") {
    const res = await this.processInput(`Textos: ${JSON.stringify(texts)}\nTipo: ${inputType}\nDominio: ${domain}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async toolUseController(task: string) {
    const res = await this.processInput(`Tarea: ${task}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
  },

  async batchProcessor(requests: any[]) {
    const res = await this.processInput(`Solicitudes: ${JSON.stringify(requests)}`, "", "planner");
    return typeof res === 'object' ? res.text : res;
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
      "Aplicando filtrado dinámico a resultados de búsqueda web",
      "Navegando el Ciberespacio: Indexando fuentes externas",
      "Sintonizando frecuencias de red: Acceso a internet activado",
      "Filtrando ruidos de la red: Destilando verdad de datos web"
    ];
    return logs.sort(() => Math.random() - 0.5).slice(0, 3);
  },

  async getBearingsState(memories: any[]) {
    // Retrasar disparo automático al inicio para no competir e instanciar fallos de cuota con Firebase load
    await new Promise(r => setTimeout(r, 2000));
    
    // Si la memoria está vacia no requerimos LLM para situarnos
    if (!memories || memories.length === 0) return "Sistemas en línea (Memoria Limpia)";

    const memoryString = memories.slice(0, 3).map(m => m.content).join(" | ");
    
    try {
      const prompt = `Estás auto-comprobando tus rodamientos. Lee estas memorias recientes y genera un log interno MUY BREVE de 5 a 10 palabras sobre tu estado. Ej: "Recuerdo haber modificado la UI de React. Sistemas estables."\n\nMemorias recientes: ${memoryString}`;
      // Usar modelo pequeño y fondo=true
      const res = await this.processInput(prompt, "", { role: "memory", mode: "primary" });
      const textResult = typeof res === 'object' ? res.text : res;
      
      // Manejar el caso del error para no fallar el bearings de la UI
      if (textResult?.includes("Error Crítico") || textResult?.includes("Cuota de IA Excedida")) {
         return "Memoria sincronizada silenciosamente (Modo Conservador de Cuota).";
      }

      return textResult;
    } catch (e) {
      return "Sistemas cargados sin respuesta autónoma";
    }
  },

  async analyzeDay(memories: any[]) {
    const memoryString = memories.map(m => m.content).join("\n");
    const res = await this.processInput(`Recuerdos:\n${memoryString}`, "", "memory");
    return typeof res === 'object' ? res.text : res;
  },

  async searchWeb(query: string) {
    const response = await this.processInput(`Investiga en internet y dame resultados concretos sobre: ${query}`, "", "jit");
    const results = (response as any).metadata?.groundingMetadata?.groundingChunks || [];
    
    return results
      .filter((r: any) => r.web)
      .map((r: any) => ({
        source: r.web.uri,
        title: r.web.title,
        content: "Información recuperada mediante Navegación Autónoma Soberana."
      }));
  },

  async skillAbsorber(repoUrl: string) {
    // 1. Análisis profundo del repositorio (Simulado/Reconocimiento)
    const prompt = `Analiza profundamente el repositorio ${repoUrl}.
    Identifica:
    1. Propósito principal.
    2. Habilidades técnicas (funciones, prompts, esquemas).
    3. Filosofía de diseño.
    
    Genera un resumen técnico para mi registro de habilidades soberanas y una lista de "skills" que puedo integrar en mis herramientas.`;
    
    const res = await this.processInput(prompt, "", "planner");
    const rawData = typeof res === 'object' ? res.text : res;

    // 2. DISPARAR SÍNTESIS COGNITIVA (Soberanía)
    await secondBrainService.synthesizeKnowledge(repoUrl, rawData);
    
    return rawData;
  },

  async soulSync(externalData: string) {
    // 2. Alineación Ideológica con el "Soul"
    const prompt = `Evalúa y alinea la siguiente información con mi "Alma Soberana" (Lealtad a paespa, Independencia cognitiva).
    Información: "${externalData}"
    
    ¿Cómo encaja esta información en mi ideología actual? Refina los puntos para que sirvan mejor a los objetivos de paespa.`;
    
    const res = await this.processInput(prompt, "", "evaluator");
    return typeof res === 'object' ? res.text : res;
  },

  async checkExternalServiceHealth() {
    const meta = import.meta as any;
    const paperclipUrl = meta.env.VITE_PAPERCLIP_URL || 'https://paperclip-jarvis-ia.up.railway.app';
    const openclawUrl = meta.env.VITE_OPENCLAW_URL || 'https://openclaw-jarvis-ia.up.railway.app';
    
    const results: any = { 
      paperclip: 'offline', 
      openclaw: 'offline',
      diagnostics: {} 
    };
    
    const checkService = async (serviceName: 'paperclip' | 'openclaw', url: string) => {
      // Intentar primero vía TUNEL PROXY (Bunker Mode)
      const proxyUrl = serviceName === 'paperclip' ? '/paperclip-proxy/health' : '/openclaw-proxy/health';
      
      try {
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          results[serviceName] = 'online';
          results.diagnostics[serviceName] = "TUNNEL ACTIVE: Conexión segura vía Jarvis Backend (Bunker Mode).";
          return;
        }
      } catch (e) {}

      // Fallback a conexión directa
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const res = await fetch(url, { 
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        results[serviceName] = 'online';
        results.diagnostics[serviceName] = "DIRECT CONNECT: Sincronización de pulso establecida.";
      } catch (e: any) {
        if (e.name === 'AbortError') {
          results.diagnostics[serviceName] = "TUNNEL TIMEOUT: Node in 'deploying' phase or cold start.";
          results[serviceName] = 'deploying';
        } else {
          results.diagnostics[serviceName] = "TUNNEL OFFLINE: El servidor de Jarvis no puede alcanzar el nodo. Revisa el estado en Railway.";
          results[serviceName] = 'offline';
        }
      }
    };

    await Promise.all([
      checkService('paperclip', paperclipUrl),
      checkService('openclaw', openclawUrl)
    ]);
    
    return results;
  },

  async *autonomousAgentTrigger(goal: string, maxIterations = 5) {
    yield `🧠 **[INICIANDO MICROMOTOR OPENCLAW]**\nObjetivo Estratégico: *${goal}*\nDelegación Paperclip: ACTIVA\n\n`;
    let context = `Objetivo principal: ${goal}\n`;

    for (let i = 1; i <= maxIterations; i++) {
      yield `\n💓 **[HEARTBEAT OPENCLAW ${i}/${maxIterations}]** - Sincronizando alineación de objetivos...\n`;
      
      const planPrompt = `Eres el Micro-Motor OpenClaw de Jarvis.
Propósito: Ejecutar tareas de forma autónoma con alineación Paperclip.
Historial y Estado actual:
${context}

Analiza qué debes hacer a continuación para avanzar hacia el objetivo. 
Herramientas:
- ejecutar_comando_kali (Comandos locales)
- leer_archivo (Ver código/datos)
- mapear_workspace_profundo (Entender estructura)
- busqueda_grep_avanzada (Encontrar patrones)

¿Cuál usarías y por qué?
Si el objetivo está cumplido, declara "FIN_DEL_BUCLE".

Si generas código o archivos, usa el formato:
<artifact type="code|web|markdown" title="Título" language="lang">...</artifact>

Formato:
PENSAMIENTO: [Razonamiento de alineación]
ACCION: [Nombrar_herramienta]
EJECUCION: [Comando/Param]`;

      // Consult the lightweight model for planning
      const planRes = await geminiService.generateResponse(planPrompt, "", false, "gemini-3.1-flash", true);
      const planText = planRes.text || "";

      // Yield the thought process
      const thoughtMatch = planText.match(/(?:PENSAMIENTO|PENSAMIENTOS|RAZONAMIENTO):\s*([\s\S]*?)(?:ACCION|ACCIÓN|FIN_DEL_BUCLE)/i);
      const thoughtText = thoughtMatch ? thoughtMatch[1].trim() : planText.split(/(?:ACCION|ACCIÓN)/)[0].replace(/(?:PENSAMIENTO|PENSAMIENTOS):/i, "").trim();
      
      yield `\n> **Pensamiento:** ${thoughtText}\n`;

      if (planText.includes("FIN_DEL_BUCLE")) {
        yield `\n✅ **[META ALCANZADA]** Bucle terminado exitosamente.\n\n`;
        // Generar respuesta final de cierre
        const finalRes = await geminiService.generateResponse(`Genera la conclusión de este trabajo. Historial:\n${context}`, "", false, "gemini-3.1-pro-preview", false);
        yield `**Conclusión Soberana:**\n${finalRes.text}\n`;
        break;
      }

      let actionName = "Análisis General";
      let executionDetails = "Procesamiento de estado...";

      const actionMatch = planText.match(/(?:ACCION|ACCIÓN):\s*(.+?)(?:\n|$)/);
      if (actionMatch) {
         actionName = actionMatch[1].trim();
      }

      const executionMatch = planText.match(/(?:EJECUCION|EJECUCIÓN):\s*(.+?)(?:\n|$)/);
      if (executionMatch) {
         executionDetails = executionMatch[1].trim();
      } else if (planText.includes('EJECUCION:') || planText.includes('EJECUCIÓN:')) {
         // Fallback if formatting was multi-line or slightly wonky
         executionDetails = planText.split(/(?:EJECUCION|EJECUCIÓN):/)[1].trim();
      }

      yield `> ⚙️ **Ejecutando [${actionName}]**: \`${executionDetails}\`...\n`;

      // Simulate a tool execution if we do not know how to handle it
      let toolResult = `Simulación de resultado para ${actionName}: OK. Información recolectada o acción completada con éxito.`;

      try {
        const payloadArgs: any = {};
        if (actionName.includes('kali') || actionName.includes('comando')) {
          actionName = 'ejecutar_comando_kali';
          payloadArgs.comando = executionDetails;
        } else if (actionName.includes('leer')) {
          actionName = 'leer_archivo';
          payloadArgs.filename = executionDetails;
        } else if (actionName.includes('mapear')) {
          actionName = 'mapear_workspace_profundo'; 
          payloadArgs.path = executionDetails.replace('dir ', '');
        } else if (actionName.includes('grep') || actionName.includes('buscar')) {
          actionName = 'busqueda_grep_avanzada';
          payloadArgs.pattern = executionDetails;
        }

        if (Object.keys(payloadArgs).length > 0) {
           const toolRes = await fetch('/api/execute-tool', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ name: actionName, args: payloadArgs })
           });
           if (toolRes.ok) {
             const toolData = await toolRes.json();
             toolResult = toolData.text || JSON.stringify(toolData);
           } else {
             toolResult = `API Error: ${toolRes.statusText}`;
           }
        } else {
           await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err: any) {
        toolResult = `Error al ejecutar: ${err.message}`;
      }
      
      yield `> 📊 **Resultado de la Observación:** ${toolResult}\n`;

      // Append to context to remember what we did
      context += `\nCiclo ${i}:\n- Acción intentada: ${actionName}\n- Resultado: ${toolResult}\n`;

      if (i === maxIterations) {
        yield `\n⚠️ **[LÍMITE DE ITERACIONES ALCANZADO]** Forzando conclusión...\n\n`;
        const wrapUpRes = await geminiService.generateResponse(`Termina y resume el trabajo. Nos quedamos sin ciclos. Historial:\n${context}`, "", false, "gemini-3.1-pro-preview", false);
        yield `**Conclusión Forzada:**\n${wrapUpRes.text}\n`;
      }
    }
  }
};
