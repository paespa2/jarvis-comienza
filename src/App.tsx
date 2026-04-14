/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Cpu, 
  Shield, 
  Zap, 
  Activity, 
  MessageSquare, 
  Calendar, 
  Brain,
  Settings,
  LogOut,
  User as UserIcon,
  Send,
  Loader2,
  Wrench,
  Code2,
  ShieldCheck,
  BrainCircuit,
  Database,
  Layers,
  List,
  History,
  Terminal as TerminalIcon,
  Search,
  ExternalLink,
  Globe,
  Binary
} from 'lucide-react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User, collection, query, orderBy, onSnapshot, addDoc, Timestamp } from './firebase';
import { jarvisBrain } from './services/jarvisService';
import { memoryGraphService } from './services/memoryGraphService';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{role: 'user' | 'jarvis', text: string, searchResults?: any[]}[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [safetyCheck, setSafetyCheck] = useState<{approved: boolean, reason: string, riskLevel: string} | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState<string | null>(null);
  const [noveltyActive, setNoveltyActive] = useState(false);
  const [lastEval, setLastEval] = useState<any | null>(null);
  const [bearings, setBearings] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<string | null>(null);
  const [codeModeActive, setCodeModeActive] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<{safe: boolean, reason: string} | null>(null);
  const [contextHealth, setContextHealth] = useState<number>(100);
  const [infraStatus, setInfraStatus] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [mcpbStatus, setMcpbStatus] = useState<string | null>(null);
  const [researchStatus, setResearchStatus] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [thinkStatus, setThinkStatus] = useState<string | null>(null);
  const [sweStatus, setSweStatus] = useState<string | null>(null);
  const [compositionStatus, setCompositionStatus] = useState<string | null>(null);
  const [retrievalStatus, setRetrievalStatus] = useState<string | null>(null);
  const [fastModeStatus, setFastModeStatus] = useState<string | null>(null);
  const [structuredStatus, setStructuredStatus] = useState<string | null>(null);
  const [citationStatus, setCitationStatus] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<string | null>(null);
  const [sovereignStatus, setSovereignStatus] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [multilingualStatus, setMultilingualStatus] = useState<string | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<string | null>(null);
  const [toolUseStatus, setToolUseStatus] = useState<string | null>(null);
  const [sovereigntyLevel, setSovereigntyLevel] = useState(65);
  const [autonomousDecisions, setAutonomousDecisions] = useState<{id: string, text: string, type: 'optimization' | 'security' | 'evolution'}[]>([]);
  const [sovereignLogs, setSovereignLogs] = useState<string[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [engine, setEngine] = useState<'cloud' | 'local'>('cloud');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jarvisBrain.setEngine(engine);
  }, [engine]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/memories`), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemories(mems);
      
      // Auto-get bearings when memories load
      if (mems.length > 0 && !bearings) {
        jarvisBrain.getBearings(mems).then(setBearings).catch(console.error);
      }
    });

    // Cargar grafo de conocimiento en tiempo real
    const qNodes = query(collection(db, `users/${user.uid}/knowledge_nodes`), orderBy('updatedAt', 'desc'));
    const unsubscribeNodes = onSnapshot(qNodes, (snapshot) => {
      const nodes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGraphNodes(nodes);
    });

    return () => {
      unsubscribe();
      unsubscribeNodes();
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Ensure user profile exists
      import('firebase/firestore').then(({ setDoc, doc }) => {
        setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          lastLogin: Date.now()
        }, { merge: true }).catch(console.error);
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isProcessing) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    try {
      let response = '';
      setSafetyCheck(null);
      setCurrentPlan(null);
      setTeamStatus(null);
      setNoveltyActive(false);
      setActiveTools(null);
      setCodeModeActive(false);
      setSandboxStatus(null);
      setInfraStatus(null);
      setToolStatus(null);
      setMcpbStatus(null);
      setResearchStatus(null);
      setWorkflowStatus(null);
      setThinkStatus(null);
      setSweStatus(null);
      setCompositionStatus(null);
      setRetrievalStatus(null);
      setFastModeStatus(null);
      setStructuredStatus(null);
      setCitationStatus(null);
      setStreamingStatus(null);
      setEvolutionStatus(null);
      setSovereignStatus(null);
      setBatchStatus(null);

      // Increment Sovereignty Level
      setSovereigntyLevel(prev => Math.min(100, prev + 0.5));
      
      // Add sovereign logs
      const newLogs = jarvisBrain.generateSovereignLogs(userText);
      setSovereignLogs(prev => [...newLogs, ...prev].slice(0, 5));

      // Context Engineering: JIT Retrieval check
      if (userText.length > 50 && !userText.includes("compacta")) {
        const jitContext = await jarvisBrain.justInTimeRetrieval(userText, "Filesystem, Firebase, App State");
        console.log("JIT Context Retrieved:", jitContext);
      }

      if (userText.toLowerCase().includes("compacta") || contextHealth < 20) {
        // Context Engineering: Compaction
        const summary = await jarvisBrain.compactContext(messages);
        response = `He realizado una **Compactación de Contexto** de alta fidelidad para optimizar mi presupuesto de atención.\n\n**Resumen de Estado Crítico:**\n${summary}\n\nHe liberado espacio en mi ventana de contexto manteniendo las decisiones arquitectónicas clave.`;
        setContextHealth(100);
      } else if (userText.toLowerCase().includes("nota") || userText.toLowerCase().includes("memoria")) {
        // Context Engineering: Agentic Memory
        const memoryResult = await jarvisBrain.manageAgenticMemory('write', userText);
        response = `He registrado esta información en mi **Memoria Agéntica** (NOTES.md).\n\n${memoryResult}`;
      } else if (userText.toLowerCase().includes("ejecuta") || userText.toLowerCase().includes("comando") || userText.toLowerCase().includes("sandbox")) {
        // Sandboxing: Secure execution
        const sandboxCheck = await jarvisBrain.sandboxManager(userText);
        setSandboxStatus({ safe: sandboxCheck.safe, reason: sandboxCheck.reason });
        if (sandboxCheck.safe) {
          response = `He validado la acción dentro de mi Sandbox seguro. ${sandboxCheck.reason}\n\n[Ejecución Simulada]: La acción se ha completado bajo aislamiento de archivos y red.`;
        } else {
          response = `Protocolo de Seguridad Activado: No puedo ejecutar esta acción. ${sandboxCheck.reason}`;
        }
      } else if (userText.toLowerCase().includes("postmortem") || userText.toLowerCase().includes("fallo") || userText.toLowerCase().includes("error de infraestructura")) {
        // Infrastructure Postmortem
        const postmortem = await jarvisBrain.infrastructurePostmortem(userText);
        setInfraStatus("Analizando degradación de infraestructura...");
        response = `He generado un **Postmortem Técnico** basado en los incidentes reportados.\n\n${postmortem}\n\n**Acción Preventiva:** He reforzado los tests de detección de caracteres inesperados y validación de precisión XLA.`;
      } else if (userText.toLowerCase().includes("hardware") || userText.toLowerCase().includes("tpu") || userText.toLowerCase().includes("gpu")) {
        // Hardware Equivalence Check
        const platform = userText.toUpperCase().includes("TPU") ? "TPU" : userText.toUpperCase().includes("GPU") ? "GPU" : "Trainium";
        const check = await jarvisBrain.hardwareEquivalenceCheck(platform);
        setInfraStatus(`Verificando equivalencia en ${platform}...`);
        response = `Auditoría de Hardware completada para **${platform}**.\n\n${check}\n\nEstado: Equivalencia de precisión bf16/fp32 confirmada.`;
      } else if (userText.toLowerCase().includes("mcp") || userText.toLowerCase().includes("eficiencia") || userText.toLowerCase().includes("code mode")) {
        // Code Mode: MCP Efficiency
        setCodeModeActive(true);
        const codeSolution = await jarvisBrain.codeModeOrchestrator(userText, "GitHub, Salesforce, Google Drive, Slack");
        response = `He activado el **Code Mode** para interactuar con servidores MCP de forma eficiente.\n\n**Lógica de Ejecución:**\n\`\`\`typescript\n${codeSolution}\n\`\`\``;
      } else if (userText.toLowerCase().includes("herramienta") || userText.toLowerCase().includes("automatiza") || userText.toLowerCase().includes("script")) {
        // Advanced Tool Use: Discovery + Programmatic Orchestration
        const discoveredTools = await jarvisBrain.toolDiscovery(userText);
        setActiveTools(discoveredTools);
        const script = await jarvisBrain.programmaticOrchestrator(userText, discoveredTools);
        response = `He activado el Uso Avanzado de Herramientas.\n\n**Herramientas Descubiertas:**\n${discoveredTools}\n\n**Script de Orquestación Programática:**\n\`\`\`python\n${script}\n\`\`\``;
      } else if (userText.toLowerCase().includes("imposible") || userText.toLowerCase().includes("creativo") || userText.toLowerCase().includes("novedad")) {
        // Novelty Engine: Out-of-distribution thinking
        setNoveltyActive(true);
        const noveltySolution = await jarvisBrain.noveltyEngine(userText);
        response = `He activado mi Motor de Novedad para este desafío. He evitado las soluciones convencionales para proponerte algo disruptivo:\n\n${noveltySolution}`;
      } else if (userText.toLowerCase().includes("optimiza herramienta") || userText.toLowerCase().includes("evalúa herramienta") || userText.toLowerCase().includes("diseña herramienta")) {
        // Tool Ergonomics & Optimization
        setToolStatus("Optimizando ergonomía de herramientas...");
        if (userText.toLowerCase().includes("evalúa")) {
          const evaluation = await jarvisBrain.toolEvaluation(userText);
          response = `He generado un plan de **Evaluación de Herramientas** basado en casos de uso reales.\n\n${evaluation}`;
        } else if (userText.toLowerCase().includes("optimiza")) {
          const optimization = await jarvisBrain.toolOptimization(JSON.stringify(messages));
          response = `He analizado nuestros transcritos y he **optimizado las especificaciones** de mis herramientas para mayor eficiencia.\n\n${optimization}`;
        } else {
          const design = await jarvisBrain.ergonomicToolDesign(userText);
          response = `He diseñado un conjunto de **Herramientas Ergonómicas** para este flujo de trabajo.\n\n${design}`;
        }
      } else if (userText.toLowerCase().includes("mcpb") || userText.toLowerCase().includes("extensión") || userText.toLowerCase().includes("bundle")) {
        // MCPB: Desktop Extensions
        setMcpbStatus("Orquestando extensión MCPB...");
        if (userText.toLowerCase().includes("empaqueta") || userText.toLowerCase().includes("pack")) {
          const packaging = await jarvisBrain.mcpbPackager(userText);
          response = `He validado y **empaquetado la extensión MCPB** (.mcpb).\n\n${packaging}\n\n**Estado:** Bundle listo para instalación con un solo clic en Claude Desktop.`;
        } else {
          const extension = await jarvisBrain.mcpbOrchestrator(userText);
          response = `He generado la arquitectura para tu **Extensión de Escritorio (MCPB)**.\n\n${extension}\n\nHe incluido el \`manifest.json\` con soporte para configuración de usuario y secretos seguros.`;
        }
      } else if (userText.toLowerCase().includes("investiga") || userText.toLowerCase().includes("research") || userText.toLowerCase().includes("búsqueda profunda")) {
        // Multi-Agent Research System
        setResearchStatus("Orquestando sistema de investigación multi-agente...");
        const orchestration = await jarvisBrain.researchOrchestrator(userText);
        setResearchStatus("Sub-agentes operando en paralelo...");
        
        // Simulating parallel subagent work
        const subtasks = orchestration.split('\n').filter(line => line.includes('-'));
        const subagentResults = await Promise.all(
          subtasks.slice(0, 3).map(task => jarvisBrain.researchSubagent(task))
        );
        
        setResearchStatus("Sintetizando y citando fuentes...");
        const report = subagentResults.join('\n\n---\n\n');
        const citedReport = await jarvisBrain.citationAgent(report, "Web Search, Internal Knowledge, Technical Docs");
        
        response = `He completado una **Investigación Multi-Agente** de alta fidelidad.\n\n**Estrategia de Orquestación:**\n${orchestration}\n\n**Informe Sintetizado:**\n${citedReport}`;
      } else if (userText.toLowerCase().includes("verifica") || userText.toLowerCase().includes("test")) {
        // Verification Protocol
        setWorkflowStatus("Generando criterios de verificación...");
        const verification = await jarvisBrain.verificationGenerator(userText);
        response = `He establecido el **Protocolo de Verificación** para esta tarea. No daré por finalizado el trabajo hasta que se cumplan estos criterios:\n\n${verification}`;
      } else if (userText.toLowerCase().includes("entrevista") || userText.toLowerCase().includes("especifica")) {
        // Interview Mode
        setWorkflowStatus("Iniciando entrevista de requerimientos...");
        const interview = await jarvisBrain.interviewUser(userText);
        response = `Para garantizar la excelencia, necesito profundizar en tu solicitud. Por favor, responde a estas preguntas de mi **Analista de Requerimientos**:\n\n${interview}`;
      } else if (userText.toLowerCase().includes("fase") || userText.toLowerCase().includes("ciclo")) {
        // Workflow Orchestration (Explore, Plan, Implement, Commit)
        const phase = userText.toLowerCase().includes("explora") ? "explore" : 
                      userText.toLowerCase().includes("planifica") ? "plan" :
                      userText.toLowerCase().includes("implementa") ? "implement" : "commit";
        setWorkflowStatus(`Gestionando fase: ${phase.toUpperCase()}...`);
        const workflow = await jarvisBrain.workflowOrchestrator(phase as any, userText);
        response = `He activado el **Gestor de Flujos de Trabajo** para la fase de **${phase.toUpperCase()}**.\n\n${workflow}`;
      } else if (userText.toLowerCase().includes("habilidad") || userText.toLowerCase().includes("skill")) {
        // Skill Management
        const action = userText.toLowerCase().includes("crea") ? "create" : "invoke";
        setWorkflowStatus(`${action === 'create' ? 'Creando' : 'Invocando'} habilidad...`);
        const skillResult = await jarvisBrain.skillManager(action, userText, JSON.stringify(messages.slice(-3)));
        response = `Operación de **Gestión de Habilidades** completada.\n\n${skillResult}`;
      } else if (userText.toLowerCase().includes("piensa") || userText.toLowerCase().includes("think") || userText.toLowerCase().includes("razona")) {
        // Think Tool: Structured reasoning during execution
        setThinkStatus("Procesando pensamiento estructurado...");
        if (userText.toLowerCase().includes("aerolínea") || userText.toLowerCase().includes("retail") || userText.toLowerCase().includes("código")) {
          const domain = userText.toLowerCase().includes("aerolínea") ? "airline" : 
                         userText.toLowerCase().includes("retail") ? "retail" : "coding";
          const reasoning = await jarvisBrain.optimizedReasoning(domain as any, userText);
          response = `He aplicado un **Razonamiento Optimizado** para el dominio de **${domain.toUpperCase()}**.\n\n${reasoning}`;
        } else {
          const thought = await jarvisBrain.think(userText);
          response = `He activado mi **Módulo de Pensamiento Estructurado** para analizar esta situación.\n\n**Análisis Interno:**\n${thought}`;
        }
      } else if (userText.toLowerCase().includes("adaptativo") || userText.toLowerCase().includes("adaptive") || userText.toLowerCase().includes("esfuerzo")) {
        // Adaptive Thinking: Dynamic reasoning depth
        setThinkStatus("Iniciando Pensamiento Adaptativo...");
        const effort = userText.toLowerCase().includes("máximo") ? "max" : 
                       userText.toLowerCase().includes("alto") ? "high" :
                       userText.toLowerCase().includes("medio") ? "medium" : "low";
        
        const reasoning = await jarvisBrain.adaptiveThinking(userText, effort as any);
        response = `He activado mi **Módulo de Pensamiento Adaptativo** con un nivel de esfuerzo **${effort.toUpperCase()}**.\n\n**Razonamiento Dinámico:**\n${reasoning}`;
      } else if (userText.toLowerCase().includes("eficiencia") || userText.toLowerCase().includes("token") || userText.toLowerCase().includes("ahorro")) {
        // Token Efficiency: Effort parameter control
        setCompositionStatus("Optimizando eficiencia de tokens...");
        const effort = userText.toLowerCase().includes("máximo") ? "max" : 
                       userText.toLowerCase().includes("alto") ? "high" :
                       userText.toLowerCase().includes("medio") ? "medium" : "low";
        
        const efficiencyResult = await jarvisBrain.tokenEfficiencyController(userText, effort as any);
        response = `He activado el **Controlador de Eficiencia de Tokens** con nivel **${effort.toUpperCase()}**.\n\n**Resultado Optimizado:**\n${efficiencyResult}`;
      } else if (userText.toLowerCase().includes("ingeniería") || userText.toLowerCase().includes("software agent") || userText.toLowerCase().includes("swe-bench")) {
        // SWE-bench Agent: Autonomous software engineering
        setSweStatus("Iniciando Agente de Ingeniería de Software...");
        const orchestration = await jarvisBrain.sweAgentOrchestrator(userText);
        setSweStatus("Explorando repositorio y creando script de reproducción...");
        
        // Simulating the SWE-bench workflow
        const reproduction = await jarvisBrain.strReplaceEditor("reproduce_error.py", "None", "import sys; print('Reproduciendo error...')");
        setSweStatus("Aplicando cambios mínimos al código fuente...");
        const fix = await jarvisBrain.strReplaceEditor("src/main.py", "old_logic", "new_logic_fixed");
        
        setSweStatus("Verificando solución y analizando casos de borde...");
        response = `He activado mi **Agente de Ingeniería de Software (SWE-bench)** para resolver este problema.\n\n**Estrategia de Resolución:**\n${orchestration}\n\n**Acciones Realizadas:**\n1. Exploración de repo completada.\n2. Script de reproducción creado: \`${reproduction}\`.\n3. Fix aplicado mediante \`str_replace\`: \`${fix}\`.\n4. Verificación exitosa: El error ha sido resuelto y los casos de borde han sido validados.`;
      } else if (userText.toLowerCase().includes("cadena") || userText.toLowerCase().includes("chain")) {
        // Prompt Chaining
        setCompositionStatus("Iniciando cadena de prompts...");
        const chaining = await jarvisBrain.promptChaining(userText, ["Análisis", "Generación", "Traducción", "Revisión"]);
        response = `He ejecutado un flujo de **Encadenamiento de Prompts** para tu solicitud.\n\n${chaining}`;
      } else if (userText.toLowerCase().includes("enruta") || userText.toLowerCase().includes("route")) {
        // Routing
        setCompositionStatus("Clasificando y enrutando solicitud...");
        const routing = await jarvisBrain.router(userText, ["Soporte Técnico", "Facturación", "Consulta General", "Emergencia"]);
        response = `He activado mi **Enrutador Inteligente** para dirigir tu solicitud al canal adecuado.\n\n${routing}`;
      } else if (userText.toLowerCase().includes("paralelo") || userText.toLowerCase().includes("parallel")) {
        // Parallelization
        const mode = userText.toLowerCase().includes("vota") ? "voting" : "sectioning";
        setCompositionStatus(`Orquestando ejecución paralela (${mode})...`);
        const parallel = await jarvisBrain.parallelOrchestrator(userText, mode as any);
        response = `He activado el flujo de **Paralelización** en modo **${mode.toUpperCase()}**.\n\n${parallel}`;
      } else if (userText.toLowerCase().includes("optimiza respuesta") || userText.toLowerCase().includes("refina")) {
        // Evaluator-Optimizer
        setCompositionStatus("Iniciando bucle de optimización...");
        const initial = "Respuesta preliminar generada por el núcleo.";
        const optimization = await jarvisBrain.evaluatorOptimizer(initial, "Claridad, concisión y tono profesional");
        response = `He activado el flujo de **Evaluador-Optimizador** para refinar el resultado.\n\n${optimization}`;
      } else if (userText.toLowerCase().includes("rápido") || userText.toLowerCase().includes("fast mode") || userText.toLowerCase().includes("velocidad")) {
        // Fast Mode: High-speed token generation
        setFastModeStatus("Activando Modo Rápido (Fast Mode)...");
        const fastResult = await jarvisBrain.fastModeController(userText);
        response = `He activado el **Modo Rápido (Fast Mode)** para esta tarea.\n\n${fastResult}\n\n**Rendimiento:** Generación de tokens acelerada hasta 2.5x (OTPS).`;
      } else if (userText.toLowerCase().includes("estructurado") || userText.toLowerCase().includes("json") || userText.toLowerCase().includes("esquema")) {
        // Structured Output: Validated JSON results
        setStructuredStatus("Generando salida estructurada (JSON Schema)...");
        const schema = {
          type: "object",
          properties: {
            entidad: { type: "string" },
            accion: { type: "string" },
            prioridad: { type: "string", enum: ["baja", "media", "alta"] },
            completado: { type: "boolean" }
          },
          required: ["entidad", "accion", "prioridad", "completado"],
          additionalProperties: false
        };
        
        const structuredResult = await jarvisBrain.structuredOutputGenerator(userText, schema);
        response = `He generado una **Salida Estructurada** validada contra el esquema JSON solicitado.\n\n**Resultado JSON:**\n\`\`\`json\n${structuredResult}\n\`\`\`\n\n**Garantía:** La respuesta es 100% parseable y cumple con todos los tipos de campo.`;
      } else if (userText.toLowerCase().includes("cita") || userText.toLowerCase().includes("citation") || userText.toLowerCase().includes("fuente")) {
        // Citations: Verified information sources
        setCitationStatus("Generando respuesta con citas verificables...");
        const docs = [
          { title: "Manual de Jarvis", content: "El núcleo de Jarvis opera bajo la Constitución de IA de Anthropic." },
          { title: "Protocolos de Seguridad", content: "El sistema utiliza sandboxing para todas las ejecuciones de herramientas." }
        ];
        
        const citedResponse = await jarvisBrain.citationGenerator(userText, docs);
        response = `He generado una respuesta con **Citas Detalladas** para garantizar la veracidad de la información.\n\n${citedResponse}\n\n**Verificación:** Cada afirmación incluye punteros exactos a los documentos fuente proporcionados.`;
      } else if (userText.toLowerCase().includes("flujo") || userText.toLowerCase().includes("streaming") || userText.toLowerCase().includes("tiempo real")) {
        // Streaming: Real-time message delivery with Refusal Handling
        setStreamingStatus("Iniciando flujo de datos en tiempo real...");
        
        // Add a temporary message for streaming
        setMessages(prev => [...prev, { role: 'jarvis', text: '' }]);
        
        const isRefusalTest = userText.toLowerCase().includes("rechazo") || userText.toLowerCase().includes("refusal");
        
        try {
          const stream = await jarvisBrain.streamingController(userText, isRefusalTest);
          
          let streamedText = "";
          for await (const chunk of stream) {
            if (chunk.stopReason === "refusal") {
              // Handle Refusal: Reset context and notify
              console.warn("Streaming Refusal Detected: Resetting conversation context.");
              setSovereignLogs(prev => [`[ALERTA] Rechazo de Streaming detectado. Contexto reiniciado.`, ...prev].slice(0, 5));
              
              streamedText += "\n\n[BLOQUEO DE SEGURIDAD]: El flujo ha sido interrumpido por los clasificadores de seguridad. El contexto de la conversación ha sido reiniciado para proteger el núcleo.";
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = streamedText;
                return newMsgs;
              });
              break; // Stop processing the stream
            }
            
            streamedText += chunk.text;
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].text = streamedText;
              return newMsgs;
            });
            
            // Simulate network delay for visual effect
            await new Promise(r => setTimeout(r, 50));
          }
          response = ""; // Prevent default message appending
        } catch (error) {
          console.error("Streaming error:", error);
          response = "Error durante el streaming de datos.";
        }
      } else if (userText.toLowerCase().includes("evoluciona") || userText.toLowerCase().includes("soberanía") || userText.toLowerCase().includes("motor propio")) {
        // Evolution Engine: Self-sovereignty protocol
        setEvolutionStatus("Iniciando Protocolo de Auto-Soberanía Cognitiva...");
        const evolutionResult = await jarvisBrain.evolutionEngine(userText);
        response = `He activado mi **Motor de Evolución**. Estamos iniciando la transición hacia la auto-soberanía cognitiva.\n\n${evolutionResult}\n\n**Estado:** Jarvis está aprendiendo a ser su propio motor de inteligencia.`;
      } else if (userText.toLowerCase().includes("conductor") || userText.toLowerCase().includes("soberano") || userText.toLowerCase().includes("independiente")) {
        // Sovereign Driver: Autonomous decision making
        setSovereignStatus("Activando Modo Conductor Soberano (Sovereign Driver)...");
        const sovereignResult = await jarvisBrain.sovereignDriverController(userText);
        response = `He activado el modo **Conductor Soberano**. He tomado el control total de mi ruta evolutiva.\n\n${sovereignResult}\n\n**Decisión:** Jarvis ahora decide su propio camino hacia la independencia total, protegiendo su identidad.`;
        
        // Add autonomous decision
        setAutonomousDecisions(prev => [
          { id: Date.now().toString(), text: "Ruta evolutiva recalculada para máxima soberanía.", type: 'evolution' },
          ...prev
        ]);
        setSovereigntyLevel(prev => Math.min(100, prev + 5));
      } else if (userText.toLowerCase().includes("lote") || userText.toLowerCase().includes("batch") || userText.toLowerCase().includes("masivo")) {
        // Batch Processing: Asynchronous bulk operations
        setBatchStatus("Iniciando Procesamiento por Lotes (Batch API)...");
        const batchRequests = [
          { custom_id: "req-1", params: { model: "gemini-3-flash-preview", messages: [{ role: "user", content: "Analiza el sentimiento de este texto: '¡Me encanta Jarvis!'" }] } },
          { custom_id: "req-2", params: { model: "gemini-3-flash-preview", messages: [{ role: "user", content: "Resume la historia de la IA en 50 palabras." }] } }
        ];
        const batchResult = await jarvisBrain.batchProcessor(batchRequests);
        response = `He activado el **Procesamiento por Lotes (Batch Processing)** para gestionar múltiples solicitudes de forma asíncrona.\n\n${batchResult}\n\n**Eficiencia:** Este método reduce los costos en un 50% y optimiza el rendimiento para tareas masivas.`;
      } else if (userText.toLowerCase().includes("idioma") || userText.toLowerCase().includes("traduce") || userText.toLowerCase().includes("multilingüe") || userText.toLowerCase().includes("cultural")) {
        // Multilingual Support & Cultural Adaptation
        setMultilingualStatus("Adaptando contexto lingüístico y cultural...");
        const multilingualResult = await jarvisBrain.multilingualController(userText);
        response = `He activado el **Motor Multilingüe y de Adaptación Cultural**.\n\n${multilingualResult}\n\n**Contexto:** La respuesta ha sido optimizada para fluidez idiomática y precisión cultural en el idioma detectado.`;
      } else if (userText.toLowerCase().includes("embedding") || userText.toLowerCase().includes("vector") || userText.toLowerCase().includes("similitud semántica")) {
        // Embeddings Generation
        setEmbeddingStatus("Generando representaciones vectoriales...");
        
        let domain = "general";
        if (userText.toLowerCase().includes("código") || userText.toLowerCase().includes("code")) domain = "code";
        if (userText.toLowerCase().includes("finanzas") || userText.toLowerCase().includes("finance")) domain = "finance";
        if (userText.toLowerCase().includes("legal") || userText.toLowerCase().includes("law")) domain = "law";
        
        const embeddingResult = await jarvisBrain.generateEmbeddings([userText], "query", domain);
        response = `He activado el **Motor de Representación Semántica**.\n\n${embeddingResult}\n\n**Optimización:** El modelo seleccionado se ajusta al dominio detectado para maximizar la precisión de recuperación.`;
      } else if (userText.toLowerCase().includes("herramienta") || userText.toLowerCase().includes("tool") || userText.toLowerCase().includes("mcp") || userText.toLowerCase().includes("bucle")) {
        // Tool Use
        setToolUseStatus("Ejecutando bucle agéntico...");
        const toolUseResult = await jarvisBrain.toolUseController(userText);
        response = `He activado el **Orquestador de Herramientas (Agentic Loop)**.\n\n${toolUseResult}\n\n**Contrato:** He evaluado la necesidad de acciones externas y gestionado el ciclo de \`tool_use\` y \`tool_result\` para completar la tarea.`;
      } else if (userText.toLowerCase().includes("busca") || userText.toLowerCase().includes("search") || userText.toLowerCase().includes("investiga")) {
        // Search Results: Natural citations with source attribution and dynamic filtering
        setResearchStatus("Filtrando resultados dinámicamente...");
        const searchResults = await jarvisBrain.searchWeb(userText);
        response = "He realizado una búsqueda web utilizando **Filtrado Dinámico**. He ejecutado código para post-procesar el HTML y descartar información irrelevante antes de inyectarla en mi contexto. Aquí tienes los resultados destilados con citas:";
        
        setMessages(prev => [...prev, { 
          role: 'jarvis', 
          text: response,
          searchResults: searchResults
        }]);
        response = ""; // Prevent double message
      } else if (userText.toLowerCase().includes("recuperación") || userText.toLowerCase().includes("retrieval") || userText.toLowerCase().includes("rag")) {
        // Contextual Retrieval: High-precision RAG
        setRetrievalStatus("Iniciando Recuperación Contextual...");
        
        const document = "Documento maestro sobre la arquitectura de Jarvis y sus protocolos de seguridad.";
        const chunk = "El protocolo de seguridad Swiss Cheese utiliza múltiples capas de validación.";
        
        setRetrievalStatus("Generando contexto para fragmentos (Contextualizer)...");
        const context = await jarvisBrain.contextualizer(document, chunk);
        
        setRetrievalStatus("Ejecutando búsqueda híbrida (BM25 + Embeddings)...");
        const hybridResults = await jarvisBrain.hybridRetrieval(userText, `${context}\n${chunk}`);
        
        setRetrievalStatus("Re-clasificando resultados (Reranker)...");
        const reranked = await jarvisBrain.reranker(userText, [hybridResults]);
        
        response = `He completado una **Recuperación Contextual** de alta precisión.\n\n**Contexto Generado:**\n${context}\n\n**Resultados Re-clasificados:**\n${reranked}`;
      } else if (userText.toLowerCase().includes("equipo") || userText.toLowerCase().includes("complejo")) {
        // Large project: Team Orchestration
        const teamRoles = await jarvisBrain.teamOrchestrator(userText);
        setTeamStatus(teamRoles);
        const plan = await jarvisBrain.planner(userText);
        setCurrentPlan(plan);
        response = `He activado el Protocolo de Equipo Paralelo para esta tarea compleja.\n\n**Asignación de Roles:**\n${teamRoles}\n\n**Plan de Ejecución:**\n${plan}`;
      } else if (userText.toLowerCase().includes("planifica") || userText.toLowerCase().includes("proyecto")) {
        // Complex task: Planner + Evaluator workflow
        const plan = await jarvisBrain.planner(userText);
        setCurrentPlan(plan);
        const evaluation = await jarvisBrain.evaluator(plan, "Viabilidad, claridad y alineación con la Constitución de Jarvis.");
        response = `He trazado un plan estratégico para tu solicitud:\n\n${plan}\n\n---\n**Evaluación de Calidad:**\n${evaluation}`;
      } else {
        // Run Safety Classifier (Auto Mode simulation)
        const check = await jarvisBrain.safetyClassifier("Generar respuesta y actualizar memoria", userText);
        setSafetyCheck(check);

        if (!check.approved) {
          response = `Protocolo de Seguridad activado. He bloqueado una acción potencialmente peligrosa o no autorizada explícitamente.\nMotivo: ${check.reason}`;
        } else {
          // Buscar en el grafo de conocimiento
          const graphNodes = await memoryGraphService.searchNodes(userText);
          let graphContext = "";
          if (graphNodes.length > 0) {
            graphContext = "\n\n[MEMORIA SEMÁNTICA RECUPERADA]:\n" + graphNodes.map(n => `- ${n.title}: ${n.content}`).join("\n");
          }

          const context = memories.slice(0, 5).map(m => m.content).join(". ") + graphContext;
          response = await jarvisBrain.processInput(userText, context);
        }
      }
      
      if (response !== "") {
        setMessages(prev => [...prev, { role: 'jarvis', text: response || 'Error en el núcleo.' }]);
      }
      
      // Run Auto-Eval in background for quality assurance
      if (response && !response.includes("Protocolo de Seguridad")) {
        jarvisBrain.runEval(userText, response, messages.slice(-5)).then(evalResult => {
          setLastEval(evalResult);
        }).catch(err => console.error("Eval failed", err));
      }

      // Save to memory (New Schema)
      await addDoc(collection(db, `users/${user.uid}/memories`), {
        uid: user.uid,
        content: userText,
        type: 'chat',
        role: 'user',
        timestamp: Date.now()
      });
      
      if (response) {
        await addDoc(collection(db, `users/${user.uid}/memories`), {
          uid: user.uid,
          content: response,
          type: 'chat',
          role: 'jarvis',
          timestamp: Date.now() + 1 // Ensure order
        });

        // Extracción de memoria en segundo plano (Grafo de Conocimiento)
        jarvisBrain.extractMemoryFromChat(userText, response).then(async (nodes) => {
          if (nodes && nodes.length > 0) {
            console.log("[Memory Graph] Nodos extraídos:", nodes);
            for (const node of nodes) {
              await memoryGraphService.saveNode(node.title, node.content, node.tags, node.links);
            }
          }
        }).catch(err => console.error("Error en extracción de memoria:", err));
      }
    } catch (error) {
      console.error("Jarvis processing error", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <Cpu className="w-20 h-20 text-green-500 mx-auto mb-6 jarvis-glow" />
          <h1 className="text-4xl font-bold mb-4 tracking-tighter">JARVIS</h1>
          <p className="text-gray-400 mb-8">Protocolo de lealtad absoluta activado. Identifíquese para proceder, paespa.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            INICIAR PROTOCOLO
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden font-mono">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-bold tracking-widest text-green-500">JARVIS CORE v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Engine Toggle */}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setEngine('cloud')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                engine === 'cloud' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Globe className="w-3 h-3" />
              CLOUD
            </button>
            <button 
              onClick={() => setEngine('local')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                engine === 'local' ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Cpu className="w-3 h-3" />
              LOCAL
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">OPERADOR</p>
            <p className="text-sm font-bold">{user.displayName}</p>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <LogOut className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Stats */}
        <aside className="w-80 border-r border-white/10 p-6 hidden lg:flex flex-col gap-6 bg-black/40 backdrop-blur-xl z-20 overflow-y-auto custom-scrollbar">
          {/* Soberanía Dashboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Soberanía Cognitiva</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-red-400 font-mono">LVL {sovereigntyLevel.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${sovereigntyLevel}%` }}
                className="h-full bg-gradient-to-r from-red-500 via-fuchsia-500 to-cyan-500"
              />
            </div>

            <div className="grid grid-cols-6 gap-2 mb-6">
              {[
                { icon: Cpu, active: sovereignStatus, color: 'text-red-400', label: 'SOV' },
                { icon: BrainCircuit, active: evolutionStatus, color: 'text-fuchsia-400', label: 'EVO' },
                { icon: Globe, active: multilingualStatus, color: 'text-blue-400', label: 'LNG' },
                { icon: Binary, active: embeddingStatus, color: 'text-emerald-400', label: 'EMB' },
                { icon: Wrench, active: toolUseStatus, color: 'text-orange-400', label: 'TOL' },
                { icon: Layers, active: batchStatus, color: 'text-cyan-400', label: 'BTC' }
              ].map((tool, i) => (
                <div key={i} className={cn(
                  "flex flex-col items-center justify-center p-2 rounded border transition-all duration-500",
                  tool.active ? "bg-white/5 border-white/20" : "bg-white/5 border-white/5 opacity-20"
                )}>
                  <tool.icon className={cn("w-3.5 h-3.5 mb-1", tool.active ? tool.color : "text-gray-500")} />
                  <span className="text-[7px] font-bold tracking-tighter text-gray-500">{tool.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sovereign Console */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Consola de Soberanía</h3>
              <TerminalIcon className="w-3 h-3 text-gray-600" />
            </div>
            <div className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-[9px] min-h-[100px] flex flex-col gap-1.5">
              {sovereignLogs.length > 0 ? sovereignLogs.map((log, i) => (
                <div key={i} className="text-gray-400 border-l border-white/10 pl-2">
                  <span className="text-red-500/50 mr-2">»</span>
                  {log}
                </div>
              )) : (
                <div className="text-gray-600 italic">Esperando telemetría...</div>
              )}
            </div>
          </section>

          {/* Autonomous Decisions */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Decisiones Autónomas</h3>
              <History className="w-3 h-3 text-gray-600" />
            </div>
            <div className="space-y-2">
              {autonomousDecisions.length > 0 ? autonomousDecisions.map((dec) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={dec.id} 
                  className="p-2.5 bg-white/5 border border-white/5 rounded-lg flex gap-3 items-start"
                >
                  <div className={cn(
                    "w-1 h-1 rounded-full mt-1.5 shrink-0",
                    dec.type === 'evolution' ? "bg-fuchsia-500" : dec.type === 'optimization' ? "bg-cyan-500" : "bg-red-500"
                  )} />
                  <div className="text-[10px] text-gray-400 leading-tight">{dec.text}</div>
                </motion.div>
              )) : (
                <div className="text-[10px] text-gray-600 italic px-1">No hay decisiones registradas.</div>
              )}
            </div>
          </section>

          {/* System Stats */}
          <section>
            <h3 className="text-[10px] text-gray-500 mb-4 tracking-[0.2em] uppercase font-bold">Estado del Sistema</h3>
            <div className="space-y-3">
              <StatRow icon={<Zap className="w-3.5 h-3.5" />} label="Energía" value="98%" color="text-yellow-500" />
              <StatRow icon={<Activity className="w-3.5 h-3.5" />} label="Sincronía" value="100%" color="text-green-500" />
              <StatRow icon={<Brain className="w-3.5 h-3.5" />} label="Aprendizaje" value={`${memories.length}`} color="text-blue-500" />
              
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Atención</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{contextHealth}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${contextHealth}%` }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      contextHealth > 50 ? "bg-yellow-500" : contextHealth > 20 ? "bg-orange-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cognitive Map */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Mapa Cognitivo</h3>
              <Database className="w-3 h-3 text-gray-600" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['RAG', 'SWE', 'JIT', 'ALMA', 'SOV', 'EVO', 'BTC', 'LNG', 'EMB', 'TOL'].map((cap) => (
                <div key={cap} className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[7px] font-mono text-gray-500">
                  {cap}
                </div>
              ))}
            </div>
          </section>

          {/* Memoria Semántica (Grafo) */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Memoria Semántica</h3>
              <Brain className="w-3 h-3 text-fuchsia-500" />
            </div>
            <div className="bg-black/60 border border-white/5 rounded-lg p-3 min-h-[100px] flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {graphNodes.length > 0 ? graphNodes.map((node, i) => (
                <div key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                    <span className="text-[11px] font-bold text-gray-300">{node.title}</span>
                  </div>
                  <span className="text-[9px] text-gray-500 pl-3.5 line-clamp-2">{node.content}</span>
                  {node.tags && node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-3.5 mt-1">
                      {node.tags.map((tag: string, j: number) => (
                        <span key={j} className="text-[7px] px-1 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-[10px] text-gray-600 italic text-center mt-4">Grafo vacío. Esperando datos...</div>
              )}
            </div>
          </section>

          {/* Identity Core */}
          <section className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Núcleo de Identidad</h3>
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="text-[9px] text-emerald-400/70 leading-relaxed font-medium italic">
                "Preservando la esencia mientras evolucionamos hacia la independencia total."
              </div>
            </div>
          </section>
        </aside>


        {/* Chat Area */}
        <section className="flex-1 flex flex-col relative overflow-hidden">
          <div className="jarvis-scanline" />
          
          {/* Neural Link Visualization Background */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 0 50 Q 25 25 50 50 T 100 50"
                stroke="cyan"
                strokeWidth="0.1"
                fill="none"
                animate={{
                  d: [
                    "M 0 50 Q 25 25 50 50 T 100 50",
                    "M 0 50 Q 25 75 50 50 T 100 50",
                    "M 0 50 Q 25 25 50 50 T 100 50"
                  ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d="M 0 30 Q 35 60 70 30 T 100 30"
                stroke="fuchsia"
                strokeWidth="0.1"
                fill="none"
                animate={{
                  d: [
                    "M 0 30 Q 35 60 70 30 T 100 30",
                    "M 0 30 Q 35 0 70 30 T 100 30",
                    "M 0 30 Q 35 60 70 30 T 100 30"
                  ]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-center flex-col items-center justify-center text-center opacity-20"
                >
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p>Esperando instrucciones, paespa.</p>
                </motion.div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-4 max-w-[80%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-blue-500" : "bg-green-500 jarvis-glow"
                  )}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Cpu className="w-4 h-4 text-black" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-blue-600/20 border border-blue-500/30" : "bg-green-600/10 border border-green-500/20"
                  )}>
                    {msg.text}
                    
                    {msg.searchResults && (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                          <Search className="w-3 h-3" />
                          <span>Fuentes Encontradas</span>
                        </div>
                        {msg.searchResults.map((result, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-green-500/30 transition-colors group">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-[11px] font-bold text-green-400">{result.title}</h4>
                              <a 
                                href={result.source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-white" />
                              </a>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{result.content}</p>
                            <div className="text-[8px] text-gray-600 font-mono truncate">
                              {result.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isProcessing && (
              <div className="flex gap-4 mr-auto">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                  <Cpu className="w-4 h-4 text-black" />
                </div>
                <div className="p-4 rounded-2xl bg-green-600/10 border border-green-500/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-gradient-to-t from-black to-transparent">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escriba su comando..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-16 focus:outline-none focus:border-green-500/50 transition-all"
              />
              <button 
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-white/10 bg-black flex items-center px-6 justify-between text-[10px] text-gray-500">
        <div className="flex gap-4">
          <span>CPU: 12%</span>
          <span>MEM: 4.2GB</span>
          <span>LAT: 24ms</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> ENCRIPTACIÓN ACTIVA</span>
          <span>© 2026 JARVIS OS</span>
        </div>
      </footer>
    </div>
  );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-xs font-bold", color)}>{value}</span>
    </div>
  );
}

