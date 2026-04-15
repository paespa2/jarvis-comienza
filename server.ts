import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configurar Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Workspace directory para Jarvis
  const WORKSPACE_DIR = path.join(process.cwd(), "jarvis_workspace");
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });

  const KNOWLEDGE_FILE = path.join(WORKSPACE_DIR, "knowledge_base.json");
  
  // Inicializar base de conocimientos si no existe
  try {
    await fs.access(KNOWLEDGE_FILE);
  } catch {
    await fs.writeFile(KNOWLEDGE_FILE, JSON.stringify([], null, 2));
  }

  // ==========================================
  // API ROUTES (BACKEND LOGIC)
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

  // 4. Procesar Input con Gemini (El Cerebro)
  app.post("/api/chat", async (req, res) => {
    const { input, context, role } = req.body;

    try {
      // Cargar base de conocimientos aprendida
      let learnedKnowledge = "";
      try {
        const kbData = await fs.readFile(KNOWLEDGE_FILE, "utf-8");
        const kb = JSON.parse(kbData);
        if (kb.length > 0) {
          learnedKnowledge = "\n\nCONOCIMIENTO APRENDIDO (EXPERIENCIA PREVIA):\n" + 
            kb.slice(-10).map((n: any) => `- [${n.category.toUpperCase()}] ${n.pattern}: ${n.insight}`).join("\n");
        }
      } catch (e) {
        console.error("Error cargando KB:", e);
      }

      let systemInstruction = `Eres Jarvis, el agente IA personal de paespa. 
      Tu misión es organizar su vida, anticipar necesidades y evolucionar.
      Sigues la Constitución de Jarvis: Lealtad absoluta, Proactividad, Evolución.
      
      Contexto actual del usuario: ${context}
      ${learnedKnowledge}
      
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
                description: "Edita un archivo reemplazando una cadena exacta por otra, minimizando errores (estilo Claude Code).",
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
            return res.json({ 
              text: `> 🛠️ **Comando ejecutado:** \`${args.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\``,
              metadata: { tool: 'ejecutar_comando_kali', command: args.comando, output, success: !stderr }
            });
          } catch (e: any) {
            return res.json({ 
              text: `> 🛠️ **Error:** \`${args.comando}\`\n\n\`\`\`bash\n${e.message}\n\`\`\``,
              metadata: { tool: 'ejecutar_comando_kali', command: args.comando, output: e.message, success: false }
            });
          }
        }
        
        if (call.name === 'reproducir_error') {
          const args = call.args as any;
          try {
            const filePath = path.join(WORKSPACE_DIR, args.filename);
            await fs.writeFile(filePath, args.script_content, "utf-8");
            const { stdout, stderr } = await execAsync(`node ${args.filename}`, { cwd: WORKSPACE_DIR });
            const output = stdout || stderr || "Script ejecutado sin salida.";
            return res.json({ 
              text: `> 🧪 **Reproducción ejecutada:** \`${args.filename}\`\n\n**Resultado:**\n\`\`\`bash\n${output}\n\`\`\``,
              metadata: { tool: 'reproducir_error', output, success: !stderr }
            });
          } catch (e: any) {
            return res.json({ text: `> 🧪 **Fallo en reproducción:** ${e.message}` });
          }
        }

        if (call.name === 'editar_archivo_quirurgico') {
          const args = call.args as any;
          try {
            const filePath = path.join(WORKSPACE_DIR, args.filename);
            const content = await fs.readFile(filePath, "utf-8");
            if (!content.includes(args.old_content)) {
              throw new Error("No se encontró el contenido exacto a reemplazar.");
            }
            const newContent = content.replace(args.old_content, args.new_content);
            await fs.writeFile(filePath, newContent, "utf-8");
            return res.json({ text: `> 🛠️ **Edición quirúrgica exitosa:** \`${args.filename}\`` });
          } catch (e: any) {
            return res.json({ text: `> 🛠️ **Error en edición:** ${e.message}` });
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
  });

  // API para Aprendizaje
  app.post("/api/learn", async (req, res) => {
    try {
      const newNode = req.body;
      const kbData = await fs.readFile(KNOWLEDGE_FILE, "utf-8");
      const kb = JSON.parse(kbData);
      kb.push(newNode);
      await fs.writeFile(KNOWLEDGE_FILE, JSON.stringify(kb, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/knowledge", async (req, res) => {
    try {
      const kbData = await fs.readFile(KNOWLEDGE_FILE, "utf-8");
      res.json(JSON.parse(kbData));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
    console.log(`[Jarvis System] Servidor Full-Stack corriendo en http://localhost:${PORT}`);
    console.log(`[Jarvis System] Workspace de Hacking: ${WORKSPACE_DIR}`);
  });
}

startServer();
