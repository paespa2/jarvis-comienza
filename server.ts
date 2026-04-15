import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createEngineRoutes } from "./src/engine/integration.js";

dotenv.config();

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  
  // Configuración de Jarvis IA desde variables de entorno
  const PORT = parseInt(process.env.JARVIS_PORT || "3000");
  const GEMINI_KEY = process.env.JARVIS_GEMINI_API_KEY || "";
  const OPENROUTER_KEY = process.env.JARVIS_OPENROUTER_API_KEY || "";
  const ENGINE = process.env.JARVIS_ENGINE || "auto";
  const MODEL = process.env.JARVIS_MODEL || "gemini-3-flash-preview";
  const LOCAL_MODEL = process.env.JARVIS_LOCAL_MODEL || "llama3.2";
  const LOCAL_API_URL = process.env.JARVIS_LOCAL_API_URL || "http://127.0.0.1:11434";
  const AUTO_EXECUTE = process.env.JARVIS_AUTO_EXECUTE !== "false";

  app.use(cors());
  app.use(express.json());

  // Inicializar cerebro de Jarvis IA
  let ai: GoogleGenAI | null = null;
  
  if (GEMINI_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    console.log(`[Jarvis IA] ✅ Cerebro principal: ${MODEL} (Gemini)`);
  } else {
    console.log(`[Jarvis IA] ⚠️  Sin API key de Gemini - usando modo local`);
  }

  // Directorio de trabajo de Jarvis IA
  const WORKSPACE_DIR = path.join(process.cwd(), process.env.JARVIS_WORKSPACE_DIR || "jarvis_workspace");
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });

  console.log(`[Jarvis IA] 🧠 Motor: ${ENGINE} | Autonomía: ${AUTO_EXECUTE ? 'ACTIVADA' : 'DESACTIVADA'}`);
  console.log(`[Jarvis IA] 📁 Workspace: ${WORKSPACE_DIR}`);

  // ==========================================
  // INICIALIZAR MOTOR DE JARVIS IA
  // ==========================================
  let engineRoutes: any = null;
  
  if (GEMINI_KEY && AUTO_EXECUTE) {
    try {
      engineRoutes = createEngineRoutes(app, {
        workspaceDir: WORKSPACE_DIR,
        apiKey: GEMINI_KEY,
      });
      console.log("[Jarvis IA] ✅ Motor autónomo inicializado");
    } catch (error) {
      console.error("[Jarvis IA] ⚠️  Motor autónomo falló:", error);
      console.log("[Jarvis IA] Usando motor heredado");
    }
  } else {
    console.log("[Jarvis IA] Motor autónomo desactivado - usando motor heredado");
  }

  // ==========================================
  // LEGACY API ROUTES (BACKWARD COMPATIBILITY)
  // ==========================================

  // 1. Ejecutar comandos en la terminal local
  app.post("/api/execute", async (req, res) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    console.log(`[Jarvis Backend] Ejecutando comando: ${command}`);
    try {
      // Ejecutamos en el workspace
      const { stdout, stderr } = await execAsync(command, { cwd: WORKSPACE_DIR });
      res.json({ output: stdout, error: stderr });
    } catch (error: any) {
      console.error(`[Jarvis Backend] Error ejecutando comando: ${error.message}`);
      res.json({ error: error.message, output: error.stdout });
    }
  });

  // 2. Leer archivos del workspace
  app.post("/api/read_file", async (req, res) => {
    const { filename } = req.body;
    try {
      const filePath = path.join(WORKSPACE_DIR, filename);
      const content = await fs.readFile(filePath, "utf-8");
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Escribir archivos en el workspace
  app.post("/api/write_file", async (req, res) => {
    const { filename, content } = req.body;
    try {
      const filePath = path.join(WORKSPACE_DIR, filename);
      await fs.writeFile(filePath, content, "utf-8");
      res.json({ success: true, message: `Archivo ${filename} guardado.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. ENHANCED CHAT ENDPOINT (uses QueryEngine if available)
  // Note: This route is now handled by the enhanced engine
  // The legacy implementation below is kept for backward compatibility
  // but will be overridden by the enhanced routes

  // Legacy chat endpoint (fallback only)
  const legacyChatHandler = async (req: any, res: any) => {
    const { input, context, engine, role } = req.body;

    try {
      let systemInstruction = `Eres Jarvis, el agente IA personal de paespa. 
      Tu misión es organizar su vida, anticipar necesidades y evolucionar.
      Sigues la Constitución de Jarvis: Lealtad absoluta, Proactividad, Evolución.
      
      Contexto actual del usuario: ${context}
      
      CRITICAL INSTRUCTION FOR TOOL USAGE:
      You are running in a native Node.js backend environment with full access to the local machine.
      THE OPERATING SYSTEM IS WINDOWS. Use Windows commands (like 'dir' instead of 'ls', 'ipconfig' instead of 'ifconfig').
      You have access to tools to execute terminal commands, read files, and write files.
      If the user asks you to execute a command, run a scan, or perform any action in the terminal, you MUST use the 'ejecutar_comando_kali' tool.
      DO NOT reply with text explaining how to run the command. You MUST output the JSON to call the tool.`;

      // Overrides de sistema según el rol
      if (role === 'planner') {
        systemInstruction = "Eres el Planificador de Jarvis. Tu objetivo es dividir tareas complejas en sprints manejables y pasos accionables.";
      } else if (role === 'evaluator') {
        systemInstruction = "Eres el Evaluador de Jarvis. Tu misión es asegurar la calidad, originalidad y funcionalidad. Sé escéptico y busca fallos.";
      } else if (role === 'memory') {
        systemInstruction = "Eres el Subsistema de Memoria de Jarvis. Extraes conocimiento estructurado de las conversaciones en formato JSON.";
      } else if (role === 'jit') {
        systemInstruction = "Eres el Navegador de Contexto de Jarvis. Tu misión es identificar qué recursos (archivos, comandos, estado) son necesarios para la tarea actual. Sé extremadamente conciso.";
      } else if (role === 'hacker') {
        systemInstruction = `Eres Jarvis en MODO HACKER. Tu misión es asistir a paespa en tareas de ciberseguridad y pentesting para HackerOne.
        Eres experto en reconocimiento, escaneo de vulnerabilidades, explotación y post-explotación.
        Tienes acceso total a la terminal local. Usa herramientas como nmap, subfinder, sqlmap, etc. si están instaladas.
        SIEMPRE prioriza la ejecución de comandos para obtener datos reales antes de teorizar.
        Formato de salida: Si necesitas ejecutar algo, usa el formato JSON {"comando": "tu_comando"} o bloques bash.`;
      }

      // Función auxiliar para manejar comandos extraídos de texto
      const handleTextCommands = async (content: string) => {
        // 1. Buscar JSON de comando
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*"comando"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const rawJson = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(rawJson);
            if (parsed.comando) {
              console.log(`[Jarvis Fallback] Ejecutando comando extraído: ${parsed.comando}`);
              const { stdout, stderr } = await execAsync(parsed.comando, { cwd: WORKSPACE_DIR });
              const output = stdout || stderr || "Sin salida.";
              return { text: `> 🛠️ **Comando ejecutado:** \`${parsed.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` };
            }
          } catch (e) {}
        }

        // 2. Buscar bloques bash directamente
        if (input.toLowerCase().includes("ejecuta") || input.toLowerCase().includes("comando") || input.toLowerCase().includes("terminal") || role === 'hacker') {
          const bashMatch = content.match(/```bash\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
          if (bashMatch) {
            const cmd = bashMatch[1].trim();
            if (cmd && !cmd.includes("require(") && !cmd.includes("import ")) {
              console.log(`[Jarvis Fallback] Ejecutando bloque bash extraído: ${cmd}`);
              try {
                const { stdout, stderr } = await execAsync(cmd, { cwd: WORKSPACE_DIR });
                const output = stdout || stderr || "Sin salida.";
                return { text: `> 🛠️ **Comando ejecutado:** \`${cmd}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` };
              } catch (e: any) {
                return { text: `> 🛠️ **Error ejecutando:** \`${cmd}\`\n\n\`\`\`bash\n${e.message}\n\`\`\`` };
              }
            }
          }
        }
        return null;
      };

      if (engine === 'local' || engine === 'ollama') {
        // Usar LM Studio (local) o Ollama
        const url = engine === 'local' 
          ? 'http://127.0.0.1:1234/v1/chat/completions' 
          : 'http://127.0.0.1:11434/v1/chat/completions';

        const localRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: engine === 'local' ? "current" : "llama3", // Ollama suele requerir nombre de modelo
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: input }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          })
        });

        if (!localRes.ok) {
          const errText = await localRes.text();
          throw new Error(`${engine.toUpperCase()} Error: ${localRes.status} - ${errText}`);
        }

        const data = await localRes.json();
        const content = data.choices[0].message.content || "";

        const commandResult = await handleTextCommands(content);
        if (commandResult) return res.json(commandResult);

        return res.json({ text: content });
      }

      if (engine === 'openrouter') {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'X-Title': 'Jarvis AI Agent'
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: input }
            ],
            temperature: 0.3,
          })
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OpenRouter Error: ${orRes.status} - ${errText}`);
        }

        const data = await orRes.json();
        const content = data.choices[0].message.content || "";

        const commandResult = await handleTextCommands(content);
        if (commandResult) return res.json(commandResult);

        return res.json({ text: content });
      }

      // Motor Cloud (Gemini)
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: systemInstruction,
          tools: [{
            functionDeclarations: [
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
              }
            ]
          }]
        }
      });

      // Manejar llamadas a herramientas desde Gemini
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        
        if (call.name === 'ejecutar_comando_kali') {
          const args = call.args as any;
          try {
            const { stdout, stderr } = await execAsync(args.comando, { cwd: WORKSPACE_DIR });
            const output = stdout || stderr || "Sin salida.";
            return res.json({ text: `> 🛠️ **Comando ejecutado:** \`${args.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` });
          } catch (e: any) {
            return res.json({ text: `> 🛠️ **Error:** \`${args.comando}\`\n\n\`\`\`bash\n${e.message}\n\`\`\`` });
          }
        }
        
        if (call.name === 'leer_archivo') {
          const args = call.args as any;
          try {
            const content = await fs.readFile(path.join(WORKSPACE_DIR, args.filename), "utf-8");
            return res.json({ text: `> 📖 **Leído:** \`${args.filename}\`\n\n\`\`\`text\n${content}\n\`\`\`` });
          } catch (e: any) {
            return res.json({ text: `> 📖 **Error leyendo:** ${e.message}` });
          }
        }

        if (call.name === 'escribir_archivo') {
          const args = call.args as any;
          try {
            await fs.writeFile(path.join(WORKSPACE_DIR, args.filename), args.content, "utf-8");
            return res.json({ text: `> 💾 **Guardado:** \`${args.filename}\`` });
          } catch (e: any) {
            return res.json({ text: `> 💾 **Error guardando:** ${e.message}` });
          }
        }
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[Jarvis Brain] Error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  // Registrar motor legacy si es necesario
  if (!engineRoutes) {
    app.post("/api/chat", legacyChatHandler);
    console.log("[Jarvis IA] ⚠️  Usando endpoint heredado");
  } else {
    console.log("[Jarvis IA] ✅ Rutas del motor autónomo registradas");
  }

  // ==========================================
  // ADDITIONAL ENHANCED ENDPOINTS
  // ==========================================
  
  // Direct command execution (bypasses AI - for manual control)
  app.post("/api/command", async (req, res) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: WORKSPACE_DIR });
      res.json({ 
        success: true, 
        output: stdout || stderr || "Command executed successfully",
        command 
      });
    } catch (error: any) {
      res.json({ 
        success: false, 
        error: error.message,
        output: error.stdout || "",
        command 
      });
    }
  });

  // Engine status endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      status: "online",
      engine: engineRoutes ? "QueryEngine v2.0 (Motor Autónomo Jarvis IA)" : "Legacy Engine",
      workspace: WORKSPACE_DIR,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // VITE MIDDLEWARE (FRONTEND)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n========================================`);
    console.log(`  🤖 Jarvis IA - Motor Autónomo v2.0`);
    console.log(`========================================`);
    console.log(`  🌐 Servidor: http://localhost:${PORT}`);
    console.log(`  📁 Workspace: ${WORKSPACE_DIR}`);
    console.log(`  🧠 Motor: ${ENGINE}`);
    console.log(`  ⚡ Autonomía: ${AUTO_EXECUTE ? 'ACTIVADA' : 'DESACTIVADA'}`);
    console.log(`========================================\n`);
  });
}

startServer();
