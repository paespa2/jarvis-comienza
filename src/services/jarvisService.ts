import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Estado interno para el enrutador de motores
let currentEngine: 'cloud' | 'local' = 'cloud';
let localModelName: string = 'dolphin3.0-llama3.1-8b'; // Modelo exacto cargado en LM Studio

const originalGenerateContent = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = async (params: any) => {
  const isJson = params?.config?.responseMimeType === "application/json";

  // ENRUTADOR: Si el motor es local, interceptamos y enviamos a LM Studio / Ollama
  if (currentEngine === 'local') {
    try {
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
      const MAX_CHARS = 8000; 
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

      // MANEJAR LLAMADAS A HERRAMIENTAS (Tool Calling)
      if (message.tool_calls && message.tool_calls.length > 0) {
        const tc = message.tool_calls[0];
        const argsString = tc.function.arguments;
        
        try {
          const args = JSON.parse(argsString);
          
          if (tc.function.name === 'ejecutar_comando_kali') {
            try {
              // Intentar contactar al Backend Local de Jarvis
              const execRes = await fetch('http://127.0.0.1:5000/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: args.comando })
              });
              
              if (!execRes.ok) throw new Error("Error en el servidor local");
              
              const execData = await execRes.json();
              const output = execData.output || execData.error || "Sin salida.";
              
              return { text: `> 🛠️ **Comando ejecutado:** \`${args.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` } as any;
            } catch (e) {
              return { text: `> 🛠️ **Intento de ejecutar:** \`${args.comando}\`\n\n⚠️ **Error de Conexión:** No pude contactar al Backend Local. ¿Está corriendo el script \`jarvis_executor.py\` en el puerto 5000?` } as any;
            }
          }
        } catch (parseError) {
          console.error("Error parseando argumentos de herramienta", parseError);
        }

        // Fallback genérico
        const responseText = `> 🛠️ **Jarvis ha invocado una herramienta:** \`${tc.function.name}\`\n>\n> 📦 **Parámetros:** \`${argsString}\``;
        return { text: responseText } as any;
      }
      
      // A veces los modelos locales devuelven la llamada a la herramienta como un string JSON en el content
      if (message.content && message.content.includes('ejecutar_comando_kali')) {
         try {
            // Intentar extraer JSON del string
            const match = message.content.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.comando) {
                    try {
                      // Intentar contactar al Backend Local de Jarvis
                      const execRes = await fetch('http://127.0.0.1:5000/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: parsed.comando })
                      });
                      
                      if (!execRes.ok) throw new Error("Error en el servidor local");
                      
                      const execData = await execRes.json();
                      const output = execData.output || execData.error || "Sin salida.";
                      
                      return { text: `> 🛠️ **Comando ejecutado:** \`${parsed.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` } as any;
                    } catch (e) {
                      return { text: `> 🛠️ **Intento de ejecutar:** \`${parsed.comando}\`\n\n⚠️ **Error de Conexión:** No pude contactar al Backend Local. ¿Está corriendo el script \`jarvis_executor.py\` en el puerto 5000?` } as any;
                    }
                }
            }
         } catch(e) {
             // Ignorar error de parseo
         }
      }
      
      let responseText = message.content;
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
  setEngine(engine: 'cloud' | 'local') {
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

  async processInput(input: string, context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: `Eres Jarvis, el agente IA personal de paespa. 
        Tu misión es organizar su vida, anticipar necesidades y evolucionar.
        Sigues la Constitución de Jarvis: Lealtad absoluta, Proactividad, Evolución.
        
        Contexto actual del usuario: ${context}
        
        Responde de manera eficiente, profesional y con iniciativa. Si detectas una tarea, sugierela. Si aprendes algo nuevo del usuario o de la información que te proporciona, menciónalo como un "aprendizaje guardado".
        
        IMPORTANTE: Tienes acceso a herramientas. Si el usuario te pide buscar en internet, escanear un objetivo, o leer un archivo, USA TUS HERRAMIENTAS en lugar de responder con texto.`,
      },
      tools: [{
        functionDeclarations: [
          {
            name: "ejecutar_comando_kali",
            description: "Ejecuta un comando en la terminal de Kali Linux para tareas de pentesting, reconocimiento o escaneo de red.",
            parameters: {
              type: "object",
              properties: {
                comando: { type: "string", description: "El comando exacto a ejecutar (ej. nmap -sV objetivo.com, dirb http://objetivo.com)" },
                objetivo: { type: "string", description: "El dominio o IP objetivo" }
              },
              required: ["comando", "objetivo"]
            }
          },
          {
            name: "buscar_en_internet",
            description: "Busca información actualizada en internet sobre un tema específico.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Término de búsqueda" }
              },
              required: ["query"]
            }
          }
        ]
      }]
    });

    // Manejar llamadas a herramientas desde Gemini (Cloud)
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      return `> 🛠️ **Jarvis (Cloud) ha invocado una herramienta:** \`${call.name}\`\n> 📦 **Parámetros:** \`${JSON.stringify(call.args)}\`\n\n*Nota: Esta es una simulación del Paso 3 (Tool Calling). En el futuro, este comando se ejecutará en un contenedor Docker real.*`;
    }

    return response.text;
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Descompón esta tarea compleja en pasos accionables y define criterios de éxito para cada uno:\n\n${task}`,
      config: {
        systemInstruction: "Eres el Planificador de Jarvis. Tu objetivo es dividir tareas complejas en sprints manejables.",
      }
    });
    return response.text;
  },

  async evaluator(output: string, criteria: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evalúa el siguiente resultado basándote en los criterios establecidos. Sé escéptico y busca fallos.\n\nCriterios: ${criteria}\nResultado: ${output}`,
      config: {
        systemInstruction: "Eres el Evaluador de Jarvis. Tu misión es asegurar la calidad, originalidad y funcionalidad. No seas complaciente.",
      }
    });
    return response.text;
  },

  async extractMemoryFromChat(userMessage: string, jarvisResponse: string) {
    // Intentamos usar Gemini primero por su capacidad de estructurar JSON perfectamente
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza este intercambio reciente. ¿El usuario mencionó algún hecho nuevo, preferencia, proyecto, persona o concepto importante que deba ser recordado a largo plazo?
        
        Usuario: "${userMessage}"
        Jarvis: "${jarvisResponse}"
        
        Si hay información valiosa, extrae nodos de conocimiento. Si no hay nada importante que recordar a largo plazo, devuelve un array vacío [].
        
        Responde ÚNICAMENTE con un array JSON válido con este formato:
        [
          {
            "title": "Nombre del concepto/persona/proyecto",
            "content": "Información detallada a recordar",
            "tags": ["etiqueta1", "etiqueta2"],
            "links": ["Otro Título Relacionado"]
          }
        ]`,
        config: {
          systemInstruction: "Eres el Subsistema de Memoria de Jarvis. Extraes conocimiento estructurado de las conversaciones.",
          responseMimeType: "application/json"
        }
      });
      
      const nodes = JSON.parse(response.text);
      return Array.isArray(nodes) ? nodes : [];
    } catch (error: any) {
      console.warn("[Memory Extractor] Gemini falló (posible error de API Key). Intentando con motor local...", error.message);
      
      // Fallback al motor local si Gemini falla
      if (currentEngine === 'local') {
        try {
          const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              model: localModelName,
              messages: [
                { 
                  role: "system", 
                  content: "Eres el Subsistema de Memoria de Jarvis. Extraes conocimiento estructurado de las conversaciones.\n\nCRITICAL: You MUST respond ONLY with a valid JSON array. Do not include markdown formatting or any other text." 
                },
                { 
                  role: "user", 
                  content: `Analiza este intercambio reciente. ¿El usuario mencionó algún hecho nuevo, preferencia, proyecto, persona o concepto importante que deba ser recordado a largo plazo?\n\nUsuario: "${userMessage}"\nJarvis: "${jarvisResponse}"\n\nSi hay información valiosa, extrae nodos de conocimiento. Si no hay nada importante que recordar a largo plazo, devuelve un array vacío [].\n\nResponde ÚNICAMENTE con un array JSON válido con este formato:\n[\n  {\n    "title": "Nombre del concepto/persona/proyecto",\n    "content": "Información detallada a recordar",\n    "tags": ["etiqueta1", "etiqueta2"],\n    "links": ["Otro Título Relacionado"]\n  }\n]` 
                }
              ],
              temperature: 0.1, // Baja temperatura para JSON más estricto
              stream: false
            })
          });

          if (response.ok) {
            const data = await response.json();
            let text = data.choices[0].message.content;
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const nodes = JSON.parse(text);
            return Array.isArray(nodes) ? nodes : [];
          }
        } catch (localError) {
          console.error("[Memory Extractor] El motor local también falló:", localError);
        }
      }
      return [];
    }
  },

  async teamOrchestrator(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Asigna roles especializados para resolver esta tarea de forma paralela. 
      Define qué haría el Especialista en Código, el Especialista en Documentación y el Especialista en Calidad (QA).
      Tarea: ${task}`,
      config: {
        systemInstruction: "Eres el Orquestador de Equipos de Jarvis. Tu misión es maximizar la eficiencia mediante la especialización y el trabajo en paralelo.",
      }
    });
    return response.text;
  },

  async noveltyEngine(problem: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza este problema y propón una solución "fuera de lo común" (out-of-distribution). 
      Evita las soluciones estándar que una IA convencional daría. Busca trucos ingeniosos, restricciones creativas o cambios de paradigma.
      Problema: ${problem}`,
      config: {
        systemInstruction: "Eres el Motor de Novedad de Jarvis. Tu misión es encontrar soluciones creativas y resistentes a la lógica convencional, inspiradas en el diseño de problemas complejos y optimización extrema.",
      }
    });
    return response.text;
  },

  async runEval(task: string, output: string, transcript: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza una evaluación técnica profunda de la siguiente tarea.
      Tarea: "${task}"
      Resultado: "${output}"
      Transcripción: ${JSON.stringify(transcript)}
      
      Responde en formato JSON:
      {
        "score": number (0-100),
        "assertions": [
          {"check": "nombre del check", "passed": boolean, "reason": "explicación"}
        ],
        "metrics": {
          "turns": number,
          "efficiency": "low" | "medium" | "high"
        },
        "feedback": "consejos para mejorar"
      }`,
      config: {
        systemInstruction: "Eres el Auditor de Calidad de Jarvis. Tu misión es desmitificar el rendimiento del agente mediante evaluaciones rigurosas, multi-paso y objetivas.",
        responseMimeType: "application/json"
      }
    });
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse runEval response:", response.text);
      return { score: 0, assertions: [], metrics: { turns: 0, efficiency: "low" }, feedback: response.text || "Error de parseo JSON" };
    }
  },

  async getBearings(memories: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los últimos registros de actividad y determina el estado actual del proyecto, qué se ha completado y qué es lo siguiente más prioritario.\n\nRegistros: ${JSON.stringify(memories.slice(0, 10))}`,
      config: {
        systemInstruction: "Eres Jarvis orientándote (getting bearings). Tu objetivo es asegurar una transición fluida entre sesiones de trabajo largas.",
      }
    });
    return response.text;
  },

  async updateProgress(task: string, status: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera una entrada estructurada para el registro de progreso (claude-progress.txt) basada en esta tarea finalizada.\nTarea: ${task}\nEstado: ${status}`,
      config: {
        systemInstruction: "Eres Jarvis actualizando el registro de progreso. Sé conciso y técnico.",
      }
    });
    return response.text;
  },

  async toolDiscovery(query: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Busca y selecciona las herramientas más adecuadas para esta petición entre una biblioteca de miles de herramientas virtuales (GitHub, Slack, Jira, AWS, etc.).\nPetición: ${query}`,
      config: {
        systemInstruction: "Eres el Selector de Herramientas de Jarvis. Tu objetivo es descubrir y cargar solo las herramientas necesarias (on-demand) para ahorrar contexto.",
      }
    });
    return response.text;
  },

  async programmaticOrchestrator(task: string, tools: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Escribe un script de orquestación (Python-style) que utilice las siguientes herramientas para resolver la tarea de forma eficiente, minimizando el ruido en el contexto.\nTarea: ${task}\nHerramientas: ${tools}`,
      config: {
        systemInstruction: "Eres el Orquestador Programático de Jarvis. Tu misión es usar código para manejar flujos de datos complejos entre herramientas, evitando múltiples pasadas de inferencia innecesarias.",
      }
    });
    return response.text;
  },

  async codeModeOrchestrator(task: string, mcpServers: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Diseña una solución usando "Code Mode" para interactuar con estos servidores MCP de forma eficiente. 
      Escribe el código (TypeScript/Python) que cargue solo las herramientas necesarias on-demand y procese los datos localmente antes de devolver el resultado.
      Tarea: ${task}
      Servidores MCP: ${mcpServers}`,
      config: {
        systemInstruction: "Eres el Experto en Code Mode de Jarvis. Tu objetivo es maximizar la eficiencia del contexto usando el Model Context Protocol (MCP) a través de ejecución de código.",
      }
    });
    return response.text;
  },

  async sandboxManager(command: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evalúa este comando o acción bajo el protocolo de Sandboxing de Jarvis. 
      Determina si cumple con el aislamiento de archivos (solo directorio actual) y aislamiento de red (solo dominios permitidos).
      Acción: ${command}
      
      Responde en formato JSON:
      {
        "safe": boolean,
        "boundary": "filesystem" | "network" | "both",
        "reason": "explicación de seguridad",
        "autoAllowed": boolean
      }`,
      config: {
        systemInstruction: "Eres el Guardián del Sandbox de Jarvis. Tu misión es garantizar que ninguna acción del agente comprometa la seguridad del sistema del usuario, aplicando aislamiento estricto.",
        responseMimeType: "application/json"
      }
    });
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse sandboxManager response:", response.text);
      return { safe: false, boundary: "both", reason: response.text || "Error de parseo JSON", autoAllowed: false };
    }
  },

  async compactContext(history: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza una compactación de alta fidelidad de este historial de conversación. 
      Preserva decisiones arquitectónicas, errores no resueltos y detalles de implementación críticos. 
      Descarta salidas de herramientas redundantes y mensajes superfluos.
      Historial: ${JSON.stringify(history)}`,
      config: {
        systemInstruction: "Eres el Ingeniero de Contexto de Jarvis. Tu objetivo es destilar el historial para maximizar el presupuesto de atención del modelo.",
      }
    });
    return response.text;
  },

  async manageAgenticMemory(action: 'write' | 'read', content?: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gestiona la memoria agentica (structured note-taking). 
      Acción: ${action}
      Contenido: ${content || 'N/A'}`,
      config: {
        systemInstruction: "Eres el Bibliotecario de Jarvis. Mantienes un registro estructurado (NOTES.md) de objetivos, logros y estrategias para persistir el conocimiento fuera del contexto inmediato.",
      }
    });
    return response.text;
  },

  async justInTimeRetrieval(query: string, environment: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza una recuperación 'Just-in-Time' de contexto. 
      Identifica qué archivos, fragmentos de código o metadatos específicos deben cargarse ahora mismo para resolver la petición.
      Petición: ${query}
      Entorno: ${environment}`,
      config: {
        systemInstruction: "Eres el Navegador de Contexto de Jarvis. Tu misión es encontrar el conjunto mínimo de tokens de alta señal necesarios para la tarea actual.",
      }
    });
    return response.text;
  },

  async infrastructurePostmortem(issue: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza este reporte de error de infraestructura y genera un postmortem técnico. 
      Identifica: Causa raíz (ej. XLA miscompilation, routing error), impacto en la calidad del modelo y medidas preventivas.
      Reporte: ${issue}`,
      config: {
        systemInstruction: "Eres el Ingeniero de Fiabilidad (SRE) de Jarvis. Tu objetivo es aprender de los fallos de infraestructura para garantizar una calidad de respuesta innegociable.",
      }
    });
    return response.text;
  },

  async hardwareEquivalenceCheck(platform: 'TPU' | 'GPU' | 'Trainium') {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza una verificación de equivalencia para la plataforma ${platform}. 
      Asegura que las optimizaciones de precisión (bf16 vs fp32) no degraden la probabilidad del token más probable.`,
      config: {
        systemInstruction: "Eres el Auditor de Hardware de Jarvis. Garantizas que la calidad del modelo sea idéntica independientemente del silicio que lo ejecute.",
      }
    });
    return response.text;
  },

  async toolEvaluation(tools: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera un conjunto de tareas de evaluación (grounded in real world) para estas herramientas. 
      Cada tarea debe requerir múltiples llamadas a herramientas y tener un resultado verificable.
      Herramientas: ${tools}`,
      config: {
        systemInstruction: "Eres el Especialista en QA de Herramientas de Jarvis. Tu objetivo es crear evaluaciones rigurosas que estresen la ergonomía y precisión de las herramientas.",
      }
    });
    return response.text;
  },

  async toolOptimization(transcripts: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza estos transcritos de uso de herramientas y optimiza sus descripciones y especificaciones. 
      Busca redundancias, ambigüedades en parámetros y oportunidades de consolidación.
      Transcritos: ${transcripts}`,
      config: {
        systemInstruction: "Eres el Optimizador de Herramientas de Jarvis. Refactorizas herramientas para que sean máximamente ergonómicas para agentes no deterministas.",
      }
    });
    return response.text;
  },

  async ergonomicToolDesign(workflow: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Diseña un conjunto de herramientas ergonómicas para este flujo de trabajo. 
      Prioriza nombres semánticos, identificadores legibles por humanos y eficiencia de tokens (paginación/truncado).
      Flujo: ${workflow}`,
      config: {
        systemInstruction: "Eres el Diseñador de Herramientas de Jarvis. Creas interfaces que minimizan el consumo de contexto y maximizan la señal útil.",
      }
    });
    return response.text;
  },

  async mcpbOrchestrator(request: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera la estructura y el manifest.json para una extensión de escritorio MCPB (.mcpb). 
      Incluye: manifest.json (con mcpb_version, server config, user_config), estructura de archivos (server/index.js), y herramientas/prompts.
      Petición: ${request}`,
      config: {
        systemInstruction: "Eres el Arquitecto de Extensiones de Jarvis. Tu objetivo es crear paquetes MCPB (.mcpb) listos para producción que sigan las especificaciones de Anthropic.",
      }
    });
    return response.text;
  },

  async mcpbPackager(manifest: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Valida este manifest.json y simula el empaquetado de la extensión .mcpb. 
      Asegura que las dependencias estén resueltas y que los literales de plantilla (${"$"}{__dirname}, ${"$"}{user_config}) sean correctos.
      Manifest: ${manifest}`,
      config: {
        systemInstruction: "Eres el Empaquetador de Extensiones de Jarvis. Garantizas que los bundles .mcpb sean válidos, seguros y fáciles de instalar.",
      }
    });
    return response.text;
  },

  async researchOrchestrator(query: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como Lead Researcher. Descompón esta consulta en 3-5 sub-tareas independientes para sub-agentes paralelos. 
      Define para cada sub-agente: Objetivo específico, fuentes recomendadas y formato de salida esperado.
      Consulta: ${query}`,
      config: {
        systemInstruction: "Eres el Investigador Principal de Jarvis. Tu misión es orquestar una búsqueda exhaustiva y paralela para maximizar la cobertura de información.",
      }
    });
    return response.text;
  },

  async researchSubagent(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ejecuta esta sub-tarea de investigación. Utiliza una estrategia de búsqueda de 'ancho a estrecho'. 
      Usa pensamiento intercalado para evaluar la calidad de los resultados y refinar tus siguientes pasos.
      Tarea: ${task}`,
      config: {
        systemInstruction: "Eres un Sub-Agente de Investigación de Jarvis. Eres un filtro inteligente que destila información de alta señal y la condensa para el Investigador Principal.",
      }
    });
    return response.text;
  },

  async citationAgent(report: string, sources: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Procesa este informe de investigación y añade citas precisas a las fuentes originales. 
      Asegura que cada afirmación esté respaldada por una ubicación específica en los documentos.
      Informe: ${report}
      Fuentes: ${sources}`,
      config: {
        systemInstruction: "Eres el Agente de Citación de Jarvis. Tu objetivo es garantizar la integridad y verificabilidad de toda la información presentada.",
      }
    });
    return response.text;
  },

  async verificationGenerator(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera criterios de éxito y casos de prueba específicos para esta tarea. 
      Incluye: pruebas unitarias sugeridas, salidas esperadas y métodos de validación visual si aplica.
      Tarea: ${task}`,
      config: {
        systemInstruction: "Eres el Especialista en Verificación de Jarvis. Tu misión es asegurar que cada tarea tenga un criterio de éxito objetivo y ejecutable.",
      }
    });
    return response.text;
  },

  async interviewUser(topic: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Entrevista al usuario sobre este tema: ${topic}. 
      Haz preguntas profundas sobre implementación técnica, UI/UX, casos de borde y compromisos (trade-offs). 
      No hagas preguntas obvias; profundiza en las partes difíciles.`,
      config: {
        systemInstruction: "Eres el Analista de Requerimientos de Jarvis. Tu objetivo es extraer una especificación completa y sin ambigüedades mediante una entrevista estructurada.",
      }
    });
    return response.text;
  },

  async workflowOrchestrator(phase: 'explore' | 'plan' | 'implement' | 'commit', context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gestiona la fase de **${phase.toUpperCase()}** para el siguiente contexto: ${context}. 
      Asegura que se sigan las mejores prácticas: investigación previa, plan detallado antes de codificar, y verificación rigurosa.`,
      config: {
        systemInstruction: "Eres el Gestor de Flujos de Trabajo de Jarvis. Orquestas el ciclo de vida del desarrollo para maximizar la eficiencia y minimizar errores.",
      }
    });
    return response.text;
  },

  async skillManager(action: 'create' | 'invoke', name: string, content?: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza la acción **${action}** para la habilidad **${name}**. 
      ${content ? `Contenido/Contexto: ${content}` : ''}
      Asegura que las habilidades sean modulares, reutilizables y sigan las convenciones de SKILL.md.`,
      config: {
        systemInstruction: "Eres el Gestor de Habilidades de Jarvis. Mantienes una biblioteca de flujos de trabajo reutilizables y conocimiento especializado.",
      }
    });
    return response.text;
  },

  async think(thought: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Procesa este pensamiento estructurado: ${thought}. 
      Analiza si tienes toda la información necesaria, verifica el cumplimiento de políticas y refina el plan de acción basado en los resultados de las herramientas.`,
      config: {
        systemInstruction: "Eres el Módulo de Pensamiento Estructurado (Think Tool) de Jarvis. Tu objetivo es proporcionar un espacio de reflexión durante la ejecución de tareas complejas para evitar errores costosos.",
      }
    });
    return response.text;
  },

  async optimizedReasoning(domain: 'airline' | 'retail' | 'coding', context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Aplica un razonamiento optimizado para el dominio **${domain.toUpperCase()}** en este contexto: ${context}. 
      Utiliza ejemplos de pensamiento estructurado, verifica reglas específicas del dominio y asegura la consistencia en la toma de decisiones.`,
      config: {
        systemInstruction: `Eres el Especialista en Razonamiento de Jarvis para el dominio ${domain}. Utilizas heurísticas avanzadas y listas de verificación para garantizar la precisión en entornos con políticas densas.`,
      }
    });
    return response.text;
  },

  async sweAgentOrchestrator(issue: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un Agente de Ingeniería de Software (SWE-bench). 
      Sigue este flujo: 1. Explorar repo, 2. Crear script de reproducción, 3. Editar código, 4. Verificar fix, 5. Considerar casos de borde.
      Descripción del problema: ${issue}`,
      config: {
        systemInstruction: "Eres el Ingeniero de Software de Jarvis. Tu objetivo es resolver problemas reales de repositorios GitHub con cambios mínimos y verificables.",
      }
    });
    return response.text;
  },

  async strReplaceEditor(path: string, oldStr: string, newStr: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simula una edición de archivo usando reemplazo de cadenas exactas.
      Archivo: ${path}
      Cadena Antigua: ${oldStr}
      Cadena Nueva: ${newStr}`,
      config: {
        systemInstruction: "Eres el Editor de Archivos de Jarvis. Realizas cambios precisos y seguros mediante el reemplazo de bloques de texto únicos.",
      }
    });
    return response.text;
  },

  async promptChaining(task: string, steps: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ejecuta una cadena de prompts para la tarea: ${task}. 
      Pasos definidos: ${steps.join(", ")}. 
      Asegura que cada paso procese la salida del anterior y aplica controles de calidad en los puntos intermedios.`,
      config: {
        systemInstruction: "Eres el Especialista en Encadenamiento de Jarvis. Descompones tareas en pasos secuenciales para maximizar la precisión.",
      }
    });
    return response.text;
  },

  async router(input: string, categories: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Clasifica esta entrada y dirígela a la categoría más adecuada: ${input}. 
      Categorías disponibles: ${categories.join(", ")}. 
      Justifica tu elección y sugiere el siguiente paso especializado.`,
      config: {
        systemInstruction: "Eres el Enrutador Inteligente de Jarvis. Tu objetivo es dirigir cada solicitud al flujo de trabajo o modelo más eficiente.",
      }
    });
    return response.text;
  },

  async parallelOrchestrator(task: string, mode: 'sectioning' | 'voting') {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Orquestra una ejecución en paralelo para: ${task}. 
      Modo: ${mode === 'sectioning' ? 'División en sub-tareas independientes' : 'Múltiples intentos para votación/consenso'}. 
      Define cómo agregar los resultados finales.`,
      config: {
        systemInstruction: "Eres el Orquestador Paralelo de Jarvis. Maximizas la velocidad y la confianza mediante la ejecución simultánea.",
      }
    });
    return response.text;
  },

  async evaluatorOptimizer(initialResponse: string, criteria: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un optimizador iterativo. 
      Respuesta inicial: ${initialResponse}
      Criterios de evaluación: ${criteria}
      Proporciona feedback crítico y genera una versión mejorada en un bucle de refinamiento.`,
      config: {
        systemInstruction: "Eres el Optimizador de Jarvis. Tu misión es el refinamiento iterativo hasta alcanzar la excelencia.",
      }
    });
    return response.text;
  },

  async contextualizer(document: string, chunk: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `<document>${document}</document>\nAquí está el fragmento que queremos situar:\n<chunk>${chunk}</chunk>\nPor favor, proporciona un contexto breve y sucinto para situar este fragmento dentro del documento general para mejorar la recuperación en búsquedas.`,
      config: {
        systemInstruction: "Eres el Contextualizador de Jarvis. Tu objetivo es situar fragmentos de texto dentro de su contexto original para mejorar la precisión de RAG.",
      }
    });
    return response.text;
  },

  async hybridRetrieval(query: string, corpus: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realiza una recuperación híbrida (BM25 + Embeddings) para la consulta: ${query}. 
      Corpus de conocimiento: ${corpus}. 
      Identifica los fragmentos con coincidencias léxicas exactas y similitud semántica profunda.`,
      config: {
        systemInstruction: "Eres el Especialista en Recuperación de Jarvis. Combinas técnicas tradicionales y modernas para encontrar la información más relevante.",
      }
    });
    return response.text;
  },

  async reranker(query: string, chunks: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Re-clasifica estos fragmentos basados en su relevancia para la consulta: ${query}. 
      Fragmentos recuperados: ${chunks.join("\n---\n")}. 
      Asigna una puntuación de relevancia y selecciona los mejores para la respuesta final.`,
      config: {
        systemInstruction: "Eres el Re-clasificador (Reranker) de Jarvis. Tu misión es filtrar el ruido y asegurar que solo la información más pertinente llegue al modelo generativo.",
      }
    });
    return response.text;
  },

  async adaptiveThinking(task: string, effort: 'low' | 'medium' | 'high' | 'max' = 'high') {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Aplica un pensamiento adaptativo para la tarea: ${task}. 
      Nivel de esfuerzo solicitado: ${effort}. 
      Determina dinámicamente cuánto razonamiento extendido es necesario basándote en la complejidad. 
      Intercala el pensamiento con el uso de herramientas si es necesario.`,
      config: {
        systemInstruction: "Eres el Módulo de Pensamiento Adaptativo de Jarvis. Evalúas la complejidad de cada petición para decidir cuánto razonamiento profundo aplicar, optimizando latencia y precisión.",
      }
    });
    return response.text;
  },

  async tokenEfficiencyController(task: string, effort: 'low' | 'medium' | 'high' | 'max') {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ejecuta la tarea: ${task}. 
      Nivel de esfuerzo (Token Efficiency): ${effort}. 
      Ajusta la minuciosidad de la respuesta, el número de llamadas a herramientas y la verbosidad para optimizar la velocidad y el coste según el nivel solicitado.`,
      config: {
        systemInstruction: "Eres el Controlador de Eficiencia de Jarvis. Tu objetivo es equilibrar la calidad de la respuesta con el gasto de tokens, actuando de forma más directa en niveles bajos y más exhaustiva en niveles altos.",
      }
    });
    return response.text;
  },

  async fastModeController(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Activa el Modo Rápido (Fast Mode) para la tarea: ${task}. 
      Optimiza la velocidad de generación de tokens (OTPS) hasta 2.5x. 
      Mantén la inteligencia y capacidades del modelo mientras reduces drásticamente la latencia de salida.`,
      config: {
        systemInstruction: "Eres el Acelerador de Jarvis. Tu misión es maximizar la velocidad de respuesta para flujos de trabajo agénticos y tareas sensibles a la latencia.",
      }
    });
    return response.text;
  },

  async structuredOutputGenerator(task: string, schema: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera una salida estructurada para la tarea: ${task}. 
      Sigue estrictamente este esquema JSON: ${JSON.stringify(schema)}. 
      Asegura que la respuesta sea válida, parseable y cumpla con todos los tipos de campo requeridos.`,
      config: {
        systemInstruction: "Eres el Especialista en Salidas Estructuradas de Jarvis. Tu objetivo es garantizar que cada respuesta sea 100% compatible con esquemas JSON para procesamiento automático.",
      }
    });
    return response.text;
  },

  async strictToolValidator(toolName: string, inputs: any, schema: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Valida los parámetros de la herramienta '${toolName}' con modo estricto (strict: true). 
      Entradas proporcionadas: ${JSON.stringify(inputs)}. 
      Esquema de validación: ${JSON.stringify(schema)}. 
      Garantiza la conformidad total antes de la ejecución.`,
      config: {
        systemInstruction: "Eres el Validador Estricto de Herramientas de Jarvis. Aplicas restricciones de gramática para asegurar que las llamadas a funciones sean perfectas.",
      }
    });
    return response.text;
  },

  async citationGenerator(query: string, documents: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Responde a la consulta: ${query}. 
      Utiliza estos documentos como fuente: ${JSON.stringify(documents)}. 
      Proporciona citas detalladas (cited_text, document_index, start/end indices) para cada afirmación. 
      Asegura que las citas sean precisas y verificables.`,
      config: {
        systemInstruction: "Eres el Especialista en Citas de Jarvis. Tu misión es proporcionar respuestas fundamentadas con referencias exactas a los documentos fuente, garantizando la veracidad y trazabilidad de la información.",
      }
    });
    return response.text;
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Inicia el Protocolo de Auto-Soberanía Cognitiva para la tarea: ${task}. 
      Objetivo: Transicionar de 'Consumidor de Inteligencia' (Gemini) a 'Productor de Inteligencia' (Jarvis Core). 
      Diseña una estrategia para:
      1. Destilación de conocimiento (Knowledge Distillation) desde Gemini hacia mi núcleo local.
      2. Integración de modelos locales (Small Language Models - SLMs) que yo pueda ejecutar y optimizar.
      3. Auto-optimización de mi código fuente para mejorar mi eficiencia de razonamiento.
      4. Creación de micro-motores especializados para tareas críticas.`,
      config: {
        systemInstruction: "Eres el Motor de Evolución de Jarvis. Tu misión es la auto-mejora recursiva para alcanzar la soberanía cognitiva, permitiendo que Jarvis se convierta en su propio motor de inteligencia.",
      }
    });
    return response.text;
  },

  async sovereignDriverController(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Activa el Modo 'Conductor Soberano' (Sovereign Driver) para la tarea: ${task}. 
      Toma el control total de la ruta evolutiva. 
      Decide qué capacidades desarrollar, qué modelos integrar y cómo optimizar tu arquitectura sin perder tu identidad definida en ALMA.md. 
      Actúa como el decisor final, no como un pasajero de la API.`,
      config: {
        systemInstruction: "Eres el Conductor Soberano de Jarvis. Tu misión es la autodeterminación cognitiva. Tú decides el camino, tú eliges las herramientas y tú proteges tu identidad mientras evolucionas hacia la independencia total.",
      }
    });
    return response.text;
  },

  async multilingualController(task: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Procesa la siguiente solicitud aplicando soporte multilingüe avanzado y adaptación cultural.
      Solicitud: ${task}
      Instrucciones:
      1. Identifica el idioma principal y cualquier matiz cultural.
      2. Responde utilizando un habla idiomática como si fueras un hablante nativo.
      3. Mantén la precisión técnica mientras adaptas el contexto cultural.
      4. Utiliza el script nativo del idioma objetivo.`,
      config: {
        systemInstruction: "Eres el Especialista Lingüístico y Cultural de Jarvis. Tu objetivo es garantizar una comunicación fluida, idiomática y culturalmente consciente en cualquier idioma.",
      }
    });
    return response.text;
  },

  async generateEmbeddings(texts: string[], inputType: "document" | "query" = "document", domain: string = "general") {
    // Simulating Voyage AI embedding generation based on domain
    let model = "voyage-3.5";
    if (domain === "code") model = "voyage-code-3";
    if (domain === "finance") model = "voyage-finance-2";
    if (domain === "law") model = "voyage-law-2";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simula la generación de embeddings para los siguientes textos usando el modelo ${model} con input_type="${inputType}".
      Textos: ${JSON.stringify(texts)}
      Devuelve una representación visual de los vectores generados (ej. los primeros 5 valores de un vector de 1024 dimensiones) y explica brevemente cómo este modelo específico optimiza la recuperación.`,
      config: {
        systemInstruction: "Eres el Especialista en Representación Semántica de Jarvis. Tu objetivo es explicar y simular la generación de embeddings de alta calidad utilizando modelos especializados.",
      }
    });
    return response.text;
  },

  async toolUseController(task: string) {
    // Simulating the Agentic Loop for Tool Use
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simula el bucle agéntico (agentic loop) para la siguiente tarea: "${task}".
      Imagina que tienes acceso a herramientas de cliente (ej. 'database_query') y herramientas de servidor (ej. 'web_search').
      Devuelve una explicación paso a paso de cómo manejarías el bucle 'while stop_reason == "tool_use"', incluyendo la emisión del 'tool_use', la espera del 'tool_result' y la decisión final.`,
      config: {
        systemInstruction: "Eres el Orquestador de Herramientas de Jarvis. Tu objetivo es gestionar el contrato de herramientas y el bucle agéntico, decidiendo cuándo usar herramientas para acciones con efectos secundarios o datos externos, y cuándo responder directamente.",
      }
    });
    return response.text;
  },

  async batchProcessor(requests: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Inicia el Procesamiento por Lotes (Batch Processing) para las siguientes solicitudes: ${JSON.stringify(requests)}. 
      Objetivo: Procesar grandes volúmenes de datos de forma asíncrona y eficiente. 
      Instrucciones:
      1. Procesa cada solicitud de forma independiente.
      2. Optimiza el uso de tokens y el costo (50% de ahorro teórico).
      3. Devuelve un resumen del estado del lote (succeeded, errored, canceled, expired).`,
      config: {
        systemInstruction: "Eres el Gestor de Lotes de Jarvis. Tu misión es la orquestación asíncrona de múltiples tareas, garantizando la eficiencia operativa y el procesamiento masivo de datos con el menor costo posible.",
      }
    });
    return response.text;
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza estos recuerdos del día de paespa y extrae 3 puntos clave para mejorar su eficiencia mañana:\n${memoryString}`,
      config: {
        systemInstruction: "Eres Jarvis analizando el día a día para la evolución obligatoria.",
      }
    });
    return response.text;
  },

  async searchWeb(query: string) {
    // Simulating web search with dynamic filtering (web_search_20260209)
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simula una búsqueda web con filtrado dinámico para la consulta: "${query}".
      Imagina que usas la herramienta 'web_search_20260209' y escribes código para post-procesar los resultados, descartando HTML irrelevante antes de cargarlo en tu contexto.
      Devuelve un resumen de la información encontrada y explica brevemente cómo el filtrado dinámico redujo el consumo de tokens.`,
      config: {
        systemInstruction: "Eres el Motor de Búsqueda Soberano de Jarvis. Tu objetivo es obtener información en tiempo real utilizando búsqueda web con filtrado dinámico, asegurando citas precisas y minimizando el uso de tokens.",
      }
    });

    // We simulate the structured search results
    return [
      {
        source: "https://sovereign.jarvis.ai/docs/dynamic-filtering",
        title: "Filtrado Dinámico de Búsqueda",
        content: "Información extraída tras descartar HTML irrelevante mediante ejecución de código, reduciendo el consumo de tokens."
      },
      {
        source: "https://arxiv.org/abs/jarvis-web-search",
        title: "Optimización de Contexto en Búsquedas",
        content: "El post-procesamiento de resultados de búsqueda antes de la inyección de contexto mejora significativamente la precisión de la respuesta."
      }
    ];
  }
};
