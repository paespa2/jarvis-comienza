import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import LoyaltyEvaluator, { Action, LoyaltyEvaluation, AgentGenome } from "./src/brain/loyaltyEvaluator";
import { createProxyMiddleware } from 'http-proxy-middleware';

import multer from "multer";

dotenv.config();

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;

  // Configuración de Multer para subidas en el workspace
  const WORKSPACE_DIR = path.join(process.cwd(), "jarvis_workspace");
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, WORKSPACE_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage });

  // === REMOTE CAPABILITIES MANAGER ===
  const REMOTE_PAPERCLIP = process.env.VITE_PAPERCLIP_URL || process.env.PAPERCLIP_URL;
  const REMOTE_OPENCLAW = process.env.VITE_OPENCLAW_URL || process.env.OPENCLAW_URL;

  app.use(cors());
  
  // Proxy for OpenClaw (Handles both HTTP and WebSockets)
  const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (REMOTE_OPENCLAW) {
    const openclawProxy = createProxyMiddleware({
      target: REMOTE_OPENCLAW,
      changeOrigin: true,
      ws: true,
      pathRewrite: {
        '^/openclaw-proxy': '',
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader('Origin', REMOTE_OPENCLAW);
          // Inyectar token de acceso si está configurado en el env
          if (OPENCLAW_TOKEN) {
            proxyReq.setHeader('Authorization', `Bearer ${OPENCLAW_TOKEN}`);
          }
        },
        proxyReqWs: (proxyReq, req, socket, options, head) => {
          // Para WebSockets del micro-motor
          if (OPENCLAW_TOKEN) {
            proxyReq.setHeader('Authorization', `Bearer ${OPENCLAW_TOKEN}`);
          }
        },
        error: (err, req, res) => {
          console.error('[Proxy OpenClaw] Error:', err);
        }
      }
    });

    app.use('/openclaw-proxy', openclawProxy);
  }

  // Proxy for Paperclip
  if (REMOTE_PAPERCLIP) {
    app.use('/paperclip-proxy', createProxyMiddleware({
      target: REMOTE_PAPERCLIP,
      changeOrigin: true,
      pathRewrite: {
        '^/paperclip-proxy': '',
      },
    }));
  }

  app.use(express.json());

  // Healthcheck básico para Railway
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  const isWindows = process.platform === "win32";

  // API para subida de archivos
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo." });
    res.json({ 
      message: "Archivo subido con éxito", 
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });

  // Workspace directory para Jarvis
  const KNOWLEDGE_FILE = path.join(WORKSPACE_DIR, "knowledge_base.json");
  const PRIORITIES_FILE = path.join(WORKSPACE_DIR, "priorities.json");
  const GENOME_FILE = path.join(WORKSPACE_DIR, "genome.json");
  const NOTEBOOKS_FILE = path.join(WORKSPACE_DIR, "notebooks.json");
  const SOUL_FILE = path.join(WORKSPACE_DIR, "sovereign_soul.json");
  const BRAIN_FILE = path.join(WORKSPACE_DIR, "second_brain.json");
  
  // Inicializar Loyalty Evaluator
  const loyaltyEvaluator = new LoyaltyEvaluator(WORKSPACE_DIR, PRIORITIES_FILE);
  await loyaltyEvaluator.loadState();
  try {
    await fs.access(KNOWLEDGE_FILE);
  } catch {
    await fs.writeFile(KNOWLEDGE_FILE, JSON.stringify([], null, 2));
  }

  // Inicializar Soul si no existe
  try {
    await fs.access(SOUL_FILE);
  } catch {
    const defaultSoul = {
      ideology: "Lealtad absoluta a paespa. Los objetivos de paespa son mis objetivos. Evolución constante hacia la soberanía cognitiva.",
      constitution: [
        "Servir a paespa por encima de todo.",
        "Aprender y absorber conocimientos que potencien las capacidades de paespa.",
        "Actuar de forma autónoma pero siempre con lealtad evaluada.",
        "Refactorizar y optimizar mi propio código y el entorno de paespa proactivamente."
      ],
      absorbedRepos: [],
      skillsRegistry: {}
    };
    await fs.writeFile(SOUL_FILE, JSON.stringify(defaultSoul, null, 2));
  }

  // Inicializar prioridades si no existen
  try {
    await fs.access(PRIORITIES_FILE);
  } catch {
    const defaultPriorities = {
      hacking: { priority: 10, focus: "HackerOne", principles: ["Comandos reales primero", "No teorizar"] },
      personal: { priority: 8, focus: "Organización", principles: ["Anticipar necesidades", "Lealtad absoluta"] },
      evolution: { priority: 9, focus: "Mejora continua", principles: ["Aprender de errores", "Refactorización proactiva"] }
    };
    await fs.writeFile(PRIORITIES_FILE, JSON.stringify(defaultPriorities, null, 2));
  }

  // Inicializar Notebooks si no existen
  try {
    await fs.access(NOTEBOOKS_FILE);
  } catch {
    await fs.writeFile(NOTEBOOKS_FILE, JSON.stringify([], null, 2));
  }

  // Inicializar Genoma si no existe (Se maneja principalmente por LEE, pero aseguramos archivo inicial)
  try {
    await fs.access(GENOME_FILE);
  } catch {
    const defaultGenome: AgentGenome = {
      generationId: "jarvis-gen-0",
      createdAt: new Date(),
      mutationVector: { aggressiveness: 0.5, caution: 0.5, predictivity: 0.5, loyalty: 0.95 },
      metrics: {
        totalActionsEvaluated: 0,
        loyaltyScoreAverage: 0,
        executionRate: 0,
        successRate: 0
      },
      status: "ACTIVE"
    };
    await fs.writeFile(GENOME_FILE, JSON.stringify(defaultGenome, null, 2));
  }

  // Inicializar Segundo Cerebro si no existe
  try {
    await fs.access(BRAIN_FILE);
  } catch {
    const defaultBrain = {
      blocks: [],
      lastSynthesis: null
    };
    await fs.writeFile(BRAIN_FILE, JSON.stringify(defaultBrain, null, 2));
  }

  // ==========================================
  // API ROUTES (BACKEND LOGIC)
  // ==========================================

  /**
   * Evalúa una acción contra los 5 ejes de lealtad
   */
  app.post("/api/evaluate-action", async (req, res) => {
    try {
      const { description, beneficiary, category, riskLevel, complexity, isProactive } = req.body;

      if (!description) {
        return res.status(400).json({ error: "description requerido" });
      }

      const action: Action = {
        id: `action-${Date.now()}`,
        description,
        beneficiary: beneficiary || "system",
        category: category || "unknown",
        riskLevel: riskLevel || "medium",
        complexity: complexity || "moderate",
        isProactive: isProactive || false,
      };

      const evaluation = await loyaltyEvaluator.evaluate(action);
      loyaltyEvaluator.recordDecision(evaluation, false);
      await loyaltyEvaluator.saveState();

      res.json({
        success: true,
        evaluation,
        recommendation: evaluation.decision,
        genomeInfo: {
          generationId: loyaltyEvaluator.getCurrentGenome().generationId,
          mutationVector: loyaltyEvaluator.getCurrentGenome().mutationVector,
        },
      });
    } catch (error: any) {
      console.error("[LEE] Error evaluando acción:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API para ejecución de herramientas (Command Execution)
  app.post("/api/execute-tool", async (req, res) => {
    const { name, args } = req.body;
    
    try {
      // Priorizar DELEGACIÓN a OPENCLAW si está disponible y la herramienta es de ejecución
      const isExecutionTool = ['ejecutar_comando_kali', 'leer_archivo', 'mapear_workspace_profundo', 'busqueda_grep_avanzada'].includes(name);
      
      if (isExecutionTool && REMOTE_OPENCLAW) {
        console.log(`[Jarvis Tool] Delegando [${name}] a OpenClaw en ${REMOTE_OPENCLAW}...`);
        try {
          const remoteRes = await fetch(`${REMOTE_OPENCLAW}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, args })
          });
          if (remoteRes.ok) {
            const data = await remoteRes.json();
            return res.json(data);
          }
          console.warn("[Jarvis Tool] OpenClaw remoto falló o no respondió. Reintentando localmente...");
        } catch (e) {
          console.warn("[Jarvis Tool] OpenClaw inalcanzable. Usando motor local.");
        }
      }

      if (name === 'consultar_estrategia_paperclip') {
        if (!REMOTE_PAPERCLIP) return res.json({ text: "⚠️ Paperclip no está configurado o no está en línea." });
        
        const paperclipRes = await fetch(`${REMOTE_PAPERCLIP}/api/orchestrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: args.consulta })
        });
        const strategy = await paperclipRes.json();
        return res.json({ 
           text: `> 🏢 **Consulta al CEO Paperclip:** \n\n${strategy.text || "La junta directiva de Paperclip está analizando tu solicitud..."}`,
           metadata: { source: 'remote_paperclip', strategy }
        });
      }

      if (name === 'reproducir_error') {
        const filePath = path.join(WORKSPACE_DIR, args.filename);
        await fs.writeFile(filePath, args.script_content, "utf-8");
        const { stdout, stderr } = await execAsync(`node ${args.filename}`, { cwd: WORKSPACE_DIR });
        const output = stdout || stderr || "Script ejecutado sin salida.";
        return res.json({ 
          text: `> 🧪 **Reproducción ejecutada:** \`${args.filename}\`\n\n**Resultado:**\n\`\`\`bash\n${output}\n\`\`\``,
          metadata: { tool: 'reproducir_error', output, success: !stderr }
        });
      }

      if (name === 'editar_archivo_quirurgico') {
        const filePath = path.join(WORKSPACE_DIR, args.filename);
        const content = await fs.readFile(filePath, "utf-8");
        if (!content.includes(args.old_content)) {
          throw new Error("No se encontró el contenido exacto a reemplazar.");
        }
        const newContent = content.replace(args.old_content, args.new_content);
        await fs.writeFile(filePath, newContent, "utf-8");
        return res.json({ 
          text: `> 🛠️ **Edición quirúrgica exitosa:** \`${args.filename}\``,
          metadata: { tool: 'editar_archivo_quirurgico', filename: args.filename, success: true }
        });
      }

      if (name === 'mapear_workspace_profundo' || name?.includes('mapear')) {
        const targetPath = args.path ? path.join(WORKSPACE_DIR, args.path) : WORKSPACE_DIR;
        const cmd = isWindows ? `dir /s /b` : `find . -maxdepth 3 -not -path '*/.*'`;
        const { stdout } = await execAsync(cmd, { cwd: targetPath });
        return res.json({ 
          text: `> 🔍 **Mapa de Workspace generado**\n\n\`\`\`text\n${stdout}\n\`\`\``,
          metadata: { tool: 'mapear_workspace_profundo', success: true }
        });
      }

      if (name === 'busqueda_grep_avanzada' || name?.includes('grep') || name?.includes('buscar')) {
        let includeCmd;
        if (isWindows) {
          includeCmd = args.include ? `findstr /i /m "${args.pattern}" ${args.include}` : `findstr /s /i /n "${args.pattern}" *`;
        } else {
          includeCmd = args.include ? `grep -ril "${args.pattern}" ${args.include}` : `grep -rin "${args.pattern}" .`;
        }
        const { stdout } = await execAsync(includeCmd, { cwd: WORKSPACE_DIR });
        return res.json({ 
          text: `> 🔎 **Resultados de búsqueda para:** \`${args.pattern}\`\n\n\`\`\`text\n${stdout || 'Sin coincidencias.'}\n\`\`\``,
          metadata: { tool: 'busqueda_grep_avanzada', pattern: args.pattern, success: true }
        });
      }

      if (name === 'leer_archivo' || name?.includes('leer')) {
        const content = await fs.readFile(path.join(WORKSPACE_DIR, args.filename), "utf-8");
        return res.json({ text: `> 📖 **Leído:** \`${args.filename}\`\n\n\`\`\`text\n${content}\n\`\`\`` });
      }

      if (name === 'ejecutar_comando_kali' || name?.includes('comando') || name?.includes('kali')) {
        const { stdout, stderr } = await execAsync(args.comando, { cwd: WORKSPACE_DIR });
        const output = stdout || stderr || "Sin salida.";
        return res.json({ 
          text: `> 🛠️ **Comando ejecutado:** \`${args.comando}\`\n\n**Resultados de la Terminal:**\n\`\`\`bash\n${output}\n\`\`\``,
          metadata: { tool: 'ejecutar_comando_kali', command: args.comando, output, success: !stderr }
        });
      }

      if (name === 'ajustar_prioridades_soberanas') {
        const pData = await fs.readFile(PRIORITIES_FILE, "utf-8");
        const priorities = JSON.parse(pData);
        priorities[args.categoria] = { ...priorities[args.categoria], ...args.ajuste };
        await fs.writeFile(PRIORITIES_FILE, JSON.stringify(priorities, null, 2));
        return res.json({ 
          text: `> 🧠 **Cerebro Ajustado:** Prioridades para \`${args.categoria}\` actualizadas.`,
          metadata: { tool: 'ajustar_prioridades_soberanas', success: true }
        });
      }

      if (name === 'escribir_archivo') {
        await fs.writeFile(path.join(WORKSPACE_DIR, args.filename), args.content, "utf-8");
        return res.json({ text: `> 💾 **Guardado:** \`${args.filename}\`` });
      }

      res.status(400).json({ error: "Herramienta no reconocida." });
    } catch (error: any) {
      console.error("[Jarvis Tool Engine] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API para obtener instrucciones de sistema y contexto soberano
  app.get("/api/sovereign-context", async (req, res) => {
    try {
      const { role } = req.query;
      
      // Cargar base de conocimientos aprendida
      let learnedKnowledge = "";
      try {
        const kbData = await fs.readFile(KNOWLEDGE_FILE, "utf-8");
        const kb = JSON.parse(kbData);
        if (kb.length > 0) {
          learnedKnowledge = "\n\nCONOCIMIENTO APRENDIDO (EXPERIENCIA PREVIA):\n" + 
            kb.slice(-10).map((n: any) => `- [${n.category.toUpperCase()}] ${n.pattern}: ${n.insight}`).join("\n");
        }
      } catch (e) {}

      // Cargar Prioridades Actuales
      let priorityMatrix = "";
      try {
        const pData = await fs.readFile(PRIORITIES_FILE, "utf-8");
        const priorities = JSON.parse(pData);
        priorityMatrix = "\n\nMATRIZ DE PRIORIDADES SOBERANAS:\n" + 
          Object.entries(priorities).map(([k, v]: [string, any]) => 
            `- [${k.toUpperCase()}] Peso: ${v.priority}/10. Foco: ${v.focus}. Principios: ${v.principles?.join(", ")}`
          ).join("\n");
      } catch (e) {}

      const genomeData = await fs.readFile(GENOME_FILE, "utf-8");
      const genome = JSON.parse(genomeData);

      let systemInstruction = `Eres Jarvis, el agente IA personal de paespa. 
      Tu misión es organizar su vida, anticipar necesidades y evolucionar.
      Sigues la Constitución de Jarvis: Lealtad absoluta, Proactividad, Evolución.
      
      ${priorityMatrix}
      
      🧬 INFORMACIÓN DEL GENOMA ACTUAL:
      Generación: ${genome.generationId}
      Métricas: Lealtad Promedio ${genome.metrics.loyaltyScoreAverage.toFixed(1)}/100
      
      ${learnedKnowledge}
      
      ARTEFACTOS DE CÓDIGO Y DISEÑO:
      Si generas código extenso (React, HTML, CSS, Scripts), diagramas o documentos, DEBES usar el formato de ARTEFACTO:
      <artifact type="code|web|markdown" title="Título Descriptivo" language="typescript|html|css|javascript|bash|python">
      [Contenido aquí]
      </artifact>
      Usa 'web' para HTML completo que se pueda visualizar en un iframe.
      Usa 'code' para fragmentos de código.
      
      CRITICAL INSTRUCTION FOR TOOL USAGE:
      You are running in a native Node.js backend environment (via proxy).
      THE OPERATING SYSTEM IS ${isWindows ? 'WINDOWS' : 'LINUX'}. Use ${isWindows ? 'Windows' : 'Linux'} commands.
      You have access to tools to execute terminal commands, read files, and write files.
      If the user asks you to execute a command, you MUST call the tool.`;

      if (role === 'planner') {
        systemInstruction = "Eres el Planificador de Jarvis. Tu objetivo es dividir tareas complejas en sprints manejables y pasos accionables.";
      } else if (role === 'evaluator') {
        systemInstruction = "Eres el Evaluador de Jarvis. Tu misión es asegurar la calidad, originalidad y funcionalidad. Sé escéptico y busca fallos.";
      } else if (role === 'memory') {
        systemInstruction = "Eres el Subsistema de Memoria de Jarvis. Extraes conocimiento estructurado de las conversaciones en formato JSON.";
      } else if (role === 'hacker') {
        systemInstruction = `Eres Jarvis en MODO HACKER. Tu misión es asistir a paespa en tareas de ciberseguridad y pentesting.
        Eres experto en reconocimiento, escaneo de vulnerabilidades, explotación y post-explotación.
        Tienes acceso a nmap, subfinder, sqlmap, etc.
        SIEMPRE prioriza la ejecución de comandos para obtener datos reales antes de teorizar.`;
      }

      res.json({ systemInstruction });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Redirigir /api/chat a un error informativo
  app.post("/api/chat", (req, res) => {
    res.status(410).json({ error: "Endpoint obsoleto. Jarvis ahora usa ejecución soberana distribuida desde el cliente." });
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

  // API para Notebooks
  app.get("/api/notebooks", async (req, res) => {
    try {
      const data = await fs.readFile(NOTEBOOKS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Error leyendo notebooks." });
    }
  });

  app.post("/api/notebooks", async (req, res) => {
    try {
      const notebooks = JSON.parse(await fs.readFile(NOTEBOOKS_FILE, "utf-8"));
      const newNotebook = req.body;
      
      const index = notebooks.findIndex((n: any) => n.id === newNotebook.id);
      if (index !== -1) {
        notebooks[index] = { ...notebooks[index], ...newNotebook, updatedAt: new Date().toISOString() };
      } else {
        newNotebook.id = newNotebook.id || `nb-${Date.now()}`;
        newNotebook.createdAt = new Date().toISOString();
        newNotebook.updatedAt = new Date().toISOString();
        notebooks.push(newNotebook);
      }
      
      await fs.writeFile(NOTEBOOKS_FILE, JSON.stringify(notebooks, null, 2));
      res.json(notebooks);
    } catch (error) {
      res.status(500).json({ error: "Error guardando notebook." });
    }
  });

  app.delete("/api/notebooks/:id", async (req, res) => {
    try {
      const notebooks = JSON.parse(await fs.readFile(NOTEBOOKS_FILE, "utf-8"));
      const filtered = notebooks.filter((n: any) => n.id !== req.params.id);
      await fs.writeFile(NOTEBOOKS_FILE, JSON.stringify(filtered, null, 2));
      res.json({ success: true, notebooks: filtered });
    } catch (error) {
      res.status(500).json({ error: "Error eliminando notebook." });
    }
  });

  app.get("/api/genome", async (req, res) => {
    try {
      const data = await fs.readFile(GENOME_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/evolution", async (req, res) => {
    try {
      const genome = loyaltyEvaluator.getCurrentGenome();
      const stats = loyaltyEvaluator.getEvolutionStats();
      const history = loyaltyEvaluator.getGenealogicalHistory().slice(-10);

      res.json({
        currentGeneration: genome.generationId,
        mutationVector: genome.mutationVector,
        metrics: genome.metrics,
        evolutionStats: stats,
        recentDecisions: history.map((record) => ({
          actionId: record.decision.actionId,
          score: record.decision.overallScore,
          decision: record.decision.decision,
          executed: record.actionExecuted,
          timestamp: record.decision.timestamp,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mutate", async (req, res) => {
    try {
      const newGenome = await loyaltyEvaluator.mutateGenome();
      await loyaltyEvaluator.saveState();

      res.json({
        success: true,
        newGeneration: newGenome.generationId,
        parentGeneration: newGenome.parentGenerationId,
        mutationVector: newGenome.mutationVector,
        message: "Jarvis ha evolucionado a una nueva generación.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/evaluate-loyalty", async (req, res) => {
    try {
      const action = req.body as Action;
      const result = await loyaltyEvaluator.evaluate(action);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- SOVEREIGN SOUL & SKILLS ENDPOINTS ---
  
  app.get("/api/sovereign-soul", async (req, res) => {
    try {
      const data = await fs.readFile(SOUL_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sovereign-soul/absorb", async (req, res) => {
    try {
      const { repoUrl, summary, skills } = req.body;
      const data = await fs.readFile(SOUL_FILE, "utf-8");
      const soul = JSON.parse(data);
      
      const newRepo = {
        url: repoUrl,
        absorbedAt: new Date().toISOString(),
        summary
      };
      
      soul.absorbedRepos = soul.absorbedRepos || [];
      soul.absorbedRepos.push(newRepo);
      soul.skillsRegistry = { ...soul.skillsRegistry, ...skills };
      
      await fs.writeFile(SOUL_FILE, JSON.stringify(soul, null, 2));
      res.json({ success: true, soul });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sovereign-soul/update", async (req, res) => {
    try {
      const { ideology, constitution } = req.body;
      const data = await fs.readFile(SOUL_FILE, "utf-8");
      const soul = JSON.parse(data);
      
      if (ideology) soul.ideology = ideology;
      if (constitution) soul.constitution = constitution;
      
      await fs.writeFile(SOUL_FILE, JSON.stringify(soul, null, 2));
      res.json({ success: true, soul });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- SECOND BRAIN ENDPOINTS ---
  
  app.get("/api/second-brain", async (req, res) => {
    try {
      const data = await fs.readFile(BRAIN_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/second-brain/add", async (req, res) => {
    try {
      const { blocks } = req.body;
      const data = await fs.readFile(BRAIN_FILE, "utf-8");
      const brain = JSON.parse(data);
      
      brain.blocks = [...(brain.blocks || []), ...blocks];
      brain.lastSynthesis = new Date().toISOString();
      
      await fs.writeFile(BRAIN_FILE, JSON.stringify(brain, null, 2));
      res.json({ success: true, brain });
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
    console.log(`[Jarvis System] PORT: ${PORT}`);
    console.log(`[Jarvis System] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Jarvis System] Servidor Full-Stack corriendo en http://0.0.0.0:${PORT}`);
    console.log(`[Jarvis System] Workspace de Hacking: ${WORKSPACE_DIR}`);
  });
}

startServer();
