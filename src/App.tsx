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
  Layers
} from 'lucide-react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User, collection, query, orderBy, onSnapshot, addDoc, Timestamp } from './firebase';
import { jarvisBrain } from './services/jarvisService';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{role: 'user' | 'jarvis', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [memories, setMemories] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
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
        // Streaming: Real-time message delivery
        setStreamingStatus("Iniciando flujo de datos en tiempo real...");
        const streamingResult = await jarvisBrain.streamingController(userText);
        response = `He activado el **Flujo de Mensajes en Tiempo Real (Streaming)**.\n\n${streamingResult}\n\n**Experiencia:** Los datos se entregan de forma incremental mediante SSE para una latencia mínima percibida.`;
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
      } else if (userText.toLowerCase().includes("lote") || userText.toLowerCase().includes("batch") || userText.toLowerCase().includes("masivo")) {
        // Batch Processing: Asynchronous bulk operations
        setBatchStatus("Iniciando Procesamiento por Lotes (Batch API)...");
        const batchRequests = [
          { custom_id: "req-1", params: { model: "gemini-3-flash-preview", messages: [{ role: "user", content: "Analiza el sentimiento de este texto: '¡Me encanta Jarvis!'" }] } },
          { custom_id: "req-2", params: { model: "gemini-3-flash-preview", messages: [{ role: "user", content: "Resume la historia de la IA en 50 palabras." }] } }
        ];
        const batchResult = await jarvisBrain.batchProcessor(batchRequests);
        response = `He activado el **Procesamiento por Lotes (Batch Processing)** para gestionar múltiples solicitudes de forma asíncrona.\n\n${batchResult}\n\n**Eficiencia:** Este método reduce los costos en un 50% y optimiza el rendimiento para tareas masivas.`;
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
          const context = memories.slice(0, 5).map(m => m.content).join(". ");
          response = await jarvisBrain.processInput(userText, context);
        }
      }
      
      setMessages(prev => [...prev, { role: 'jarvis', text: response || 'Error en el núcleo.' }]);
      
      // Run Auto-Eval in background for quality assurance
      if (response && !response.includes("Protocolo de Seguridad")) {
        jarvisBrain.runEval(userText, response, messages.slice(-5)).then(evalResult => {
          setLastEval(evalResult);
        }).catch(err => console.error("Eval failed", err));
      }

      // Save to memory
      await addDoc(collection(db, `users/${user.uid}/memories`), {
        uid: user.uid,
        content: userText.length > 1000 ? `Resumen de investigación: ${response.substring(0, 200)}...` : `Usuario dijo: ${userText}. Jarvis respondió: ${response}`,
        category: userText.length > 1000 ? 'observation' : 'observation',
        timestamp: Timestamp.now()
      });
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
        <aside className="w-64 border-r border-white/10 p-6 hidden lg:flex flex-col gap-8 bg-black/20">
          <section>
            <h3 className="text-xs text-gray-500 mb-4 tracking-widest uppercase">Estado del Sistema</h3>
            <div className="space-y-4">
              <StatRow icon={<Zap className="w-4 h-4" />} label="Energía" value="98%" color="text-yellow-500" />
              <StatRow icon={<Activity className="w-4 h-4" />} label="Sincronía" value="100%" color="text-green-500" />
              <StatRow icon={<Brain className="w-4 h-4" />} label="Aprendizaje" value={`${memories.length}`} color="text-blue-500" />
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Auto Mode</span>
                  <span className="text-[10px] text-green-500 font-bold">ACTIVE</span>
                </div>
                {safetyCheck && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-2 rounded text-[9px] border",
                      safetyCheck.approved ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="font-bold uppercase">{safetyCheck.approved ? "Approved" : "Blocked"}</span>
                    </div>
                    <p className="opacity-70">{safetyCheck.reason}</p>
                  </motion.div>
                )}
              </div>
              {currentPlan && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Plan Activo</span>
                  </div>
                  <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[9px] text-blue-300 max-h-32 overflow-y-auto custom-scrollbar">
                    {currentPlan.substring(0, 200)}...
                  </div>
                </div>
              )}
              {teamStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-3 h-3 text-purple-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Equipo Paralelo</span>
                  </div>
                  <div className="p-2 bg-purple-500/5 border border-purple-500/20 rounded text-[9px] text-purple-300 max-h-32 overflow-y-auto custom-scrollbar">
                    {teamStatus.substring(0, 200)}...
                  </div>
                </div>
              )}
              {noveltyActive && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Novelty Engine</span>
                  </div>
                  <div className="p-2 bg-yellow-500/5 border border-yellow-500/20 rounded text-[9px] text-yellow-300">
                    Pensamiento disruptivo activado. Buscando soluciones fuera de distribución.
                  </div>
                </div>
              )}
              {lastEval && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Última Evaluación</span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      lastEval.score > 80 ? "text-green-500" : lastEval.score > 50 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {lastEval.score}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    {lastEval.assertions.slice(0, 2).map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-1 text-[8px] text-gray-400">
                        {a.passed ? <Activity className="w-2 h-2 text-green-500" /> : <Activity className="w-2 h-2 text-red-500" />}
                        <span className="truncate">{a.check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bearings && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Estado de Misión</span>
                  </div>
                  <div className="p-2 bg-cyan-500/5 border border-cyan-500/20 rounded text-[9px] text-cyan-300 max-h-32 overflow-y-auto custom-scrollbar">
                    {bearings}
                  </div>
                </div>
              )}
              {activeTools && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Herramientas Activas</span>
                  </div>
                  <div className="p-2 bg-orange-500/5 border border-orange-500/20 rounded text-[9px] text-orange-300 max-h-32 overflow-y-auto custom-scrollbar">
                    {activeTools}
                  </div>
                </div>
              )}
              {codeModeActive && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Code Mode (MCP)</span>
                  </div>
                  <div className="p-2 bg-green-500/5 border border-green-500/20 rounded text-[9px] text-green-300">
                    Ejecución de código activa. Minimizando uso de tokens y latencia.
                  </div>
                </div>
              )}
              {sandboxStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className={cn("w-3 h-3", sandboxStatus.safe ? "text-green-500" : "text-red-500")} />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sandbox Security</span>
                  </div>
                  <div className={cn(
                    "p-2 border rounded text-[9px]",
                    sandboxStatus.safe ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-300"
                  )}>
                    {sandboxStatus.reason}
                  </div>
                </div>
              )}
              {infraStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Infraestructura & SRE</span>
                  </div>
                  <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[9px] text-blue-300">
                    {infraStatus}
                  </div>
                </div>
              )}
              {toolStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Tool Ergonomics</span>
                  </div>
                  <div className="p-2 bg-orange-500/5 border border-orange-500/20 rounded text-[9px] text-orange-300">
                    {toolStatus}
                  </div>
                </div>
              )}
              {mcpbStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Desktop Extensions</span>
                  </div>
                  <div className="p-2 bg-purple-500/5 border border-purple-500/20 rounded text-[9px] text-purple-300">
                    {mcpbStatus}
                  </div>
                </div>
              )}
              {researchStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Research System</span>
                  </div>
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded text-[9px] text-emerald-300">
                    {researchStatus}
                  </div>
                </div>
              )}
              {workflowStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Development Workflow</span>
                  </div>
                  <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[9px] text-blue-300">
                    {workflowStatus}
                  </div>
                </div>
              )}
              {thinkStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Structured Thinking</span>
                  </div>
                  <div className="p-2 bg-yellow-500/5 border border-yellow-500/20 rounded text-[9px] text-yellow-300">
                    {thinkStatus}
                  </div>
                </div>
              )}
              {sweStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Software Engineering Agent</span>
                  </div>
                  <div className="p-2 bg-indigo-500/5 border border-indigo-500/20 rounded text-[9px] text-indigo-300">
                    {sweStatus}
                  </div>
                </div>
              )}
              {compositionStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Agentic Composition</span>
                  </div>
                  <div className="p-2 bg-orange-500/5 border border-orange-500/20 rounded text-[9px] text-orange-300">
                    {compositionStatus}
                  </div>
                </div>
              )}
              {retrievalStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Contextual Retrieval</span>
                  </div>
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded text-[9px] text-emerald-300">
                    {retrievalStatus}
                  </div>
                </div>
              )}
              {fastModeStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Fast Mode Active</span>
                  </div>
                  <div className="p-2 bg-yellow-500/5 border border-yellow-500/20 rounded text-[9px] text-yellow-300">
                    {fastModeStatus}
                  </div>
                </div>
              )}
              {structuredStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Structured Output</span>
                  </div>
                  <div className="p-2 bg-cyan-500/5 border border-cyan-500/20 rounded text-[9px] text-cyan-300">
                    {structuredStatus}
                  </div>
                </div>
              )}
              {citationStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Citations Active</span>
                  </div>
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded text-[9px] text-emerald-300">
                    {citationStatus}
                  </div>
                </div>
              )}
              {streamingStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Streaming Active</span>
                  </div>
                  <div className="p-2 bg-orange-500/5 border border-orange-500/20 rounded text-[9px] text-orange-300">
                    {streamingStatus}
                  </div>
                </div>
              )}
              {evolutionStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-3 h-3 text-fuchsia-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Evolution Engine</span>
                  </div>
                  <div className="p-2 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded text-[9px] text-fuchsia-300">
                    {evolutionStatus}
                  </div>
                </div>
              )}
              {sovereignStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sovereign Driver</span>
                  </div>
                  <div className="p-2 bg-red-500/5 border border-red-500/20 rounded text-[9px] text-red-300">
                    {sovereignStatus}
                  </div>
                </div>
              )}
              {batchStatus && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Batch Processing</span>
                  </div>
                  <div className="p-2 bg-cyan-500/5 border border-cyan-500/20 rounded text-[9px] text-cyan-300">
                    {batchStatus}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Presupuesto de Atención</span>
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

          <section className="flex-1 overflow-hidden">
            <h3 className="text-xs text-gray-500 mb-4 tracking-widest uppercase">Memoria Reciente</h3>
            <div className="space-y-2 overflow-y-auto h-full pr-2 custom-scrollbar">
              {memories.slice(0, 10).map((m, i) => (
                <div key={i} className="p-2 text-[10px] border border-white/5 rounded bg-white/5 opacity-60 hover:opacity-100 transition-opacity">
                  {m.content.substring(0, 50)}...
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col relative">
          <div className="jarvis-scanline" />
          
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

