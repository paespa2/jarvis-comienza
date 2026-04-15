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
    const { input, context } = req.body;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: `Eres Jarvis, el agente IA personal de paespa. 
          Tu misión es organizar su vida, anticipar necesidades y evolucionar.
          Sigues la Constitución de Jarvis: Lealtad absoluta, Proactividad, Evolución.
          
          Contexto actual del usuario: ${context}
          
          CRITICAL INSTRUCTION FOR TOOL USAGE:
          You are running in a native Node.js backend environment with full access to the local machine.
          You have access to tools to execute terminal commands, read files, and write files.
          If the user asks you to execute a command, run a scan, or perform any action in the terminal, you MUST use the 'ejecutar_comando_kali' tool.
          DO NOT reply with text explaining how to run the command. You MUST output the JSON to call the tool.`,
          tools: [{
            functionDeclarations: [
              {
                name: "ejecutar_comando_kali",
                description: "Ejecuta un comando en la terminal local (Linux/Windows/Mac) para tareas de pentesting, reconocimiento o escaneo de red.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    comando: { type: Type.STRING, description: "El comando exacto a ejecutar (ej. nmap -sV objetivo.com, dirb http://objetivo.com)" },
                    objetivo: { type: Type.STRING, description: "El dominio o IP objetivo (opcional)" }
                  },
                  required: ["comando"]
                }
              },
              {
                name: "leer_archivo",
                description: "Lee el contenido de un archivo en el workspace de Jarvis.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    filename: { type: Type.STRING, description: "Nombre del archivo a leer (ej. scan_results.txt)" }
                  },
                  required: ["filename"]
                }
              },
              {
                name: "escribir_archivo",
                description: "Escribe o guarda contenido en un archivo en el workspace de Jarvis.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    filename: { type: Type.STRING, description: "Nombre del archivo a escribir" },
                    content: { type: Type.STRING, description: "Contenido a guardar en el archivo" }
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
          console.log(`[Jarvis Brain] Ejecutando herramienta: ${call.name} -> ${args.comando}`);
          try {
            const { stdout, stderr } = await execAsync(args.comando, { cwd: WORKSPACE_DIR });
            const output = stdout || stderr || "Sin salida.";
            return res.json({ text: `> 🛠️ **Comando ejecutado:** \`${args.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\`` });
          } catch (e: any) {
            return res.json({ text: `> 🛠️ **Intento de ejecutar:** \`${args.comando}\`\n\n⚠️ **Error de Ejecución:**\n\`\`\`bash\n${e.message}\n${e.stdout || ''}\n\`\`\`` });
          }
        }
        
        if (call.name === 'leer_archivo') {
          const args = call.args as any;
          try {
            const content = await fs.readFile(path.join(WORKSPACE_DIR, args.filename), "utf-8");
            return res.json({ text: `> 📖 **Archivo leído:** \`${args.filename}\`\n\n\`\`\`text\n${content}\n\`\`\`` });
          } catch (e: any) {
            return res.json({ text: `> 📖 **Intento de leer:** \`${args.filename}\`\n\n⚠️ **Error:** ${e.message}` });
          }
        }

        if (call.name === 'escribir_archivo') {
          const args = call.args as any;
          try {
            await fs.writeFile(path.join(WORKSPACE_DIR, args.filename), args.content, "utf-8");
            return res.json({ text: `> 💾 **Archivo guardado:** \`${args.filename}\`` });
          } catch (e: any) {
            return res.json({ text: `> 💾 **Intento de guardar:** \`${args.filename}\`\n\n⚠️ **Error:** ${e.message}` });
          }
        }

        return res.json({ text: `> 🛠️ **Jarvis ha invocado una herramienta:** \`${call.name}\`\n> 📦 **Parámetros:** \`${JSON.stringify(call.args)}\`` });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[Jarvis Brain] Error:", error);
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
