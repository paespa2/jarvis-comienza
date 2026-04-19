/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Layers,
  List,
  History,
  Terminal as TerminalIcon,
  Search,
  ExternalLink,
  Globe,
  Binary,
  Book,
  Bookmark,
  Library,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  BookOpen,
  Fingerprint,
  Atom,
  Link as LinkIcon,
  Compass,
  Network
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  setDoc,
  doc
} from './firebase';
import { jarvisBrain } from './services/jarvisService';
import { memoryGraphService } from './services/memoryGraphService';
import { secondBrainService } from './services/secondBrainService';
import { learningEngine, KnowledgeNode } from './services/learningService';
import { cn } from './lib/utils';
import { EvolutionDashboard } from './components/EvolutionDashboard';
import { ArtifactView } from './components/ArtifactView';
import { Message, Artifact } from './types';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [multilingualStatus, setMultilingualStatus] = useState<string | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<string | null>(null);
  const [toolUseStatus, setToolUseStatus] = useState<string | null>(null);
  const [sovereigntyLevel, setSovereigntyLevel] = useState(65);
  const [autonomousDecisions, setAutonomousDecisions] = useState<{id: string, text: string, type: 'optimization' | 'security' | 'evolution'}[]>([]);
  const [sovereignLogs, setSovereignLogs] = useState<string[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [hackerMode, setHackerMode] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeNode[]>([]);
  const [showEvolutionView, setShowEvolutionView] = useState(false);
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [showNotebooks, setShowNotebooks] = useState(false);
  const [currentNotebook, setCurrentNotebook] = useState<any | null>(null);
  const [sovereignSoul, setSovereignSoul] = useState<any>(null);
  const [showSoulView, setShowSoulView] = useState(false);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [secondBrain, setSecondBrain] = useState<any>(null);
  const [showBrainView, setShowBrainView] = useState(false);
  const [brainMode, setBrainMode] = useState<'primary' | 'secondary'>('secondary');
  
  // Artifact handling
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const extractArtifacts = (text: string) => {
    const artifactRegex = /<artifact\s+type="([^"]+)"\s+title="([^"]+)"(?:(?:\s+language="([^"]+)")?)\s*>([\s\S]*?)<\/artifact>/g;
    let match;
    const foundArtifacts: Artifact[] = [];
    
    while ((match = artifactRegex.exec(text)) !== null) {
      const [_, type, title, language, content] = match;
      foundArtifacts.push({
        id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type as any,
        title,
        language,
        content: content.trim(),
        version: 1,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return foundArtifacts;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setSovereignLogs(prev => [`ARCHIVO SUBIDO: ${data.filename}`, ...prev.slice(0, 5)]);
          
          const uploadMsg = `He subido un archivo: ${file.name} (${data.filename})`;
          setMessages(prev => [...prev, { role: 'user', text: uploadMsg }]);
          
          // Silently trigger Jarvis
          const prompt = `El usuario ha subido un archivo al entorno de trabajo.
Detalles:
- Nombre original: ${file.name}
- Nombre en sistema: ${data.filename}
- Tipo: ${file.type}
- Tamaño: ${file.size} bytes

Confirma la recepción y pregunta qué acción tomar con este archivo.`;
          
          processJarvisResponse(prompt, true);
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setIsUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || null;


  // Sistema de Telemetría para Operador
  const logOperatorAction = (actionDetails: string) => {
    console.log(`%c[OPERADOR] %c${actionDetails}`, 'color: #00ff00; font-weight: bold;', 'color: #a3a3a3;');
  };

  useEffect(() => {
    loadKnowledge();
    loadNotebooks();
    loadSovereignSoul();
    loadSecondBrain();
  }, []);

  const loadSecondBrain = async () => {
    const brain = await secondBrainService.getBrain();
    setSecondBrain(brain);
  };

  const loadSovereignSoul = async () => {
    try {
      const res = await fetch('/api/sovereign-soul');
      if (res.ok) {
        const data = await res.json();
        setSovereignSoul(data);
      }
    } catch (e) {
      console.error("Error cargando el alma soberana", e);
    }
  };

  const loadNotebooks = async () => {
    try {
      const res = await fetch('/api/notebooks');
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data);
      }
    } catch (e) {
      console.error("Error cargando notebooks", e);
    }
  };

  const loadKnowledge = async () => {
    const kb = await learningEngine.getKnowledgeBase();
    setKnowledgeBase(kb);
  };

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
      
      // Auto-get bearings when memories load ONLY ONCE and prevent infinite loops
      if (mems.length > 0) {
        setBearings(prev => {
           if (prev) return prev; // Already fetched
           jarvisBrain.getBearingsState(mems).then(res => setBearings(res)).catch(console.error);
           return "Buscando contexto base..."; // Temporary lock state
        });
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
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastLogin: Date.now()
      }, { merge: true });
      
      logOperatorAction(`Login exitoso: ${user.displayName}`);
    } catch (error) {
      console.error("Login failed", error);
      alert("Error en el inicio de sesión. Por favor, verifique su conexión o si las ventanas emergentes (popups) están bloqueadas.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isProcessing) return;

    const userText = input;
    logOperatorAction(`Envió mensaje al núcleo: "${userText}"`);
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);
    processJarvisResponse(userText);
  };

  const processJarvisResponse = async (userText: string, silentUserMsg: boolean = false) => {
    // State declaration fixes for lint
    let response = '';
    let metadata: any = null;
    const mems = memories;
    // Mock for undefined setIsTyping/setProcessingState previously in monolith
    const setIsTyping = (val: boolean) => {};

    try {
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
      
      const userTextLower = userText.toLowerCase();

      // Increment Sovereignty Level
      setSovereigntyLevel(prev => Math.min(100, prev + 0.5));
      
      // 1. CLASIFICACIÓN DE INTENCIÓN MAESTRA (CAPA 1)
      let currentActionType = "chat";
      try {
        const intentClassification = await jarvisBrain.processInput(`Clasificar intento: ${userText}`, "", { role: 'evaluator', mode: 'primary' });
        // Simulating the backend call logic that uses geminiService.extractIntent which is done under the hood in jarvisService for standard inputs
        // Note: For front-end logic, the extractIntent runs inside processInput, but we can access `actionType` from metadata via custom hooks or implicit text patterns.
      } catch (e) {
        console.error("Classifier error ignored", e);
      }

      // 1. CLASIFICACIÓN DE INTENCIÓN MAESTRA (CAPA 1) Y GENERACION EN 1 LLAMADA
      // Aquí estamos unificando el router y el generador en una sola llamada limpia al JarvisService.
      setProcessingState("Procesando enrutamiento inteligente (Semantic Router)...");
      const graphNodes = await memoryGraphService.searchNodes(userText);
      
      let graphContext = "";
      if (graphNodes.length > 0) {
        graphContext = "\n\n[MEMORIA SEMÁNTICA RECUPERADA]:\n" + graphNodes.map(n => `- ${n.title}: ${n.content}`).join("\n");
      }
      const context = mems.slice(0, 5).map(m => m.content).join(". ") + graphContext;
      
      // BYPASS DEL CLASIFICADOR DE SEGURIDAD PARA PERMITIR HACKING (Si está activo)
      setSafetyCheck({ approved: true, reason: "Bypass Automático" } as any);

      setSovereignStatus("Procesando entrada con el núcleo soberano...");

      const rawRes = await jarvisBrain.processInput(userText, context, { 
        role: hackerMode ? 'hacker' : undefined,
        mode: brainMode 
      });

      if (typeof rawRes === 'object' && rawRes !== null) {
        response = rawRes.text;
        metadata = rawRes.metadata;
      } else {
        response = String(rawRes);
        metadata = {};
      }

      setSovereignStatus(null);
      setProcessingState(null);

      // 🛑 SI FUE BLOQUEADO POR PROTOCOLO (Decision interna)
      if (metadata?.decision === "REJECT") {
         setMessages(prev => [...prev, { role: 'jarvis', text: response }]);
         setIsTyping(false);
         return;
      }

      // Add sovereign logs from the routing phase
      const newLogs = jarvisBrain.generateSovereignLogs(userText);
      setSovereignLogs(prev => [...newLogs, ...prev].slice(0, 5));

      // 2. ENRUTAMIENTO BASADO EN ACTION TYPE (CAPA 2 CEO AGENT vs CAPA 3 OPENCLAW)
      if (response === "AUTONOMOUS_LOOP_TRIGGER_NEEDED" || metadata?.actionType === "task" || metadata?.actionType === "autonomous" || userText.toLowerCase().includes("bucle") || userText.toLowerCase().includes("mcp") || userText.toLowerCase().includes("tool")) {
        // ACTIVAR CAPA 3: OPENCLAW (Micro-Motor de Tareas Autónomas)
        setToolUseStatus("Micro-Motor OpenClaw de Jarvis: Ejecución Sincronizada...");
        
        // Add a temporary message for streaming the autonomous thoughts
        setMessages(prev => [...prev, { role: 'jarvis', text: '*(Iniciando Delegación Paperclip hacia OpenClaw...)*', brainUsed: 'secondary' }]);
        
        try {
           let streamedText = "";
           const maxLoopIterations = userText.toLowerCase().includes("profundo") || userText.toLowerCase().includes("complejo") ? 8 : 4;
           const stream = await jarvisBrain.autonomousAgentTrigger(userText, maxLoopIterations);
           
           for await (const chunk of stream) {
             streamedText += chunk;
             setMessages(prev => {
               const newMsgs = [...prev];
               newMsgs[newMsgs.length - 1].text = streamedText;
               return newMsgs;
             });
             await new Promise(r => setTimeout(r, 80)); // Visual delay
           }
           response = ""; // Prevent default appending since we already streamed
           setToolUseStatus(null);
        } catch (error: any) {
           response = `⚠️ Error en la Capa 3 (OpenClaw): ${error.message}`;
           setToolUseStatus(null);
        }
      } else {
        // ACTIVAR CAPA 2: CEO AGENT PAPERCLIP (Respuesta Directa Rápida)
        // La respuesta ya fue generada arriba por processInput en `rawRes.text` de forma directa usando Gemini Flash / Pro.
      }
      
      if (response !== "") {
        if (response.includes('Error Crítico del Cerebro') || response.includes('Cuota de IA Excedida')) {
           setMessages(prev => [...prev, { role: 'jarvis', text: response, brainUsed: 'secondary' }]);
           setIsProcessing(false);
           return;
        }

        const searchResults: any[] = [];
        if (metadata?.groundingMetadata?.groundingChunks) {
          metadata.groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
              searchResults.push({
                title: chunk.web.title,
                source: chunk.web.uri,
                content: "Validado mediante Google Search Grounding (Acceso Soberano)."
              });
            }
          });
        }

        const newArtifacts = extractArtifacts(response);
        if (newArtifacts.length > 0) {
          setArtifacts(prev => [...prev, ...newArtifacts]);
          setActiveArtifactId(newArtifacts[0].id);
        }

        setMessages(prev => [...prev, { 
          role: 'jarvis', 
          text: response || 'Error en el núcleo.',
          searchResults: searchResults.length > 0 ? searchResults : undefined,
          brainUsed: metadata?.brainUsed || brainMode,
          artifactId: newArtifacts.length > 0 ? newArtifacts[0].id : undefined
        }]);
        
        // APRENDIZAJE AUTÓNOMO: Jarvis aprende de la interacción
        setTimeout(async () => {
          try {
            // Si hubo ejecución de herramienta, aprender del resultado específicamente
            if (metadata && metadata.tool === 'ejecutar_comando_kali') {
              const toolInsight = await learningEngine.learnFromExecution(metadata.command, metadata.output, metadata.success);
              if (toolInsight) {
                setKnowledgeBase(prev => [...prev, toolInsight]);
                setSovereignLogs(prev => [`OPTIMIZACIÓN MOTOR: ${toolInsight.pattern}`, ...prev.slice(0, 5)]);
              }
            }

            const insight = await learningEngine.learnFromInteraction(userText, response);
            if (insight) {
              setKnowledgeBase(prev => [...prev, insight]);
              setSovereignLogs(prev => [`NUEVO INSIGHT: ${insight.pattern}`, ...prev.slice(0, 5)]);
            }
          } catch (e) {
            console.error("[Autonomous Learning] Error en el ciclo de aprendizaje en segundo plano:", e);
          }
        }, 1000);
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

  // UI Components
  const NotebooksView = () => (
    <div className="flex flex-col h-full bg-[#f5f5f5] text-[#141414] font-sans">
      <div className="flex items-center justify-between p-6 border-b border-[#141414] border-opacity-10">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-2">
            <Library className="w-8 h-8" />
            Biblioteca Soberana
          </h2>
          <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">Conocimiento Destilado de Investigaciones Profundas</p>
        </div>
        <button 
          onClick={() => setShowNotebooks(false)}
          className="p-2 hover:bg-[#141414] hover:text-[#f5f5f5] transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Notebooks */}
        <div className="w-80 border-r border-[#141414] border-opacity-10 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Colección ({notebooks.length})</span>
            <button className="p-1 hover:bg-[#141414] hover:text-white transition-all rounded-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {notebooks.map(nb => (
            <div 
              key={nb.id}
              onClick={() => setCurrentNotebook(nb)}
              className={cn(
                "p-3 cursor-pointer border border-transparent transition-all flex flex-col gap-1",
                currentNotebook?.id === nb.id ? "bg-[#141414] text-white" : "hover:border-[#141414] hover:border-opacity-20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{nb.title}</span>
                <span className="text-[9px] font-mono opacity-50 italic">
                  {new Date(nb.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-1 overflow-hidden">
                {nb.tags?.slice(0, 2).map((t: string) => (
                  <span key={t} className="px-1 py-0.5 bg-[#141414] bg-opacity-5 text-[8px] font-mono rounded overflow-hidden truncate">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contenido del Notebook */}
        <div className="flex-1 overflow-y-auto bg-white p-12">
          {currentNotebook ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentNotebook.id}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  <BookOpen className="w-3 h-3" />
                  Cuaderno de Investigación / ID: {currentNotebook.id}
                </div>
                <h1 className="text-5xl font-light tracking-tighter leading-none border-b border-[#141414] pb-6">
                  {currentNotebook.title}
                </h1>
              </div>

              <div className="prose prose-slate max-w-none text-lg leading-relaxed font-light text-[#333] whitespace-pre-wrap">
                {currentNotebook.content}
              </div>

              <div className="pt-12 border-t border-[#141414] border-opacity-5 flex items-center justify-between">
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-[11px] font-mono opacity-50 hover:opacity-100 transition-opacity">
                    <Save className="w-4 h-4" /> EXPORTAR PDF
                  </button>
                  <button className="flex items-center gap-2 text-[11px] font-mono opacity-50 hover:opacity-100 transition-opacity">
                    <Bookmark className="w-4 h-4" /> ARCHIVAR
                  </button>
                </div>
                <button 
                  onClick={async () => {
                    const res = await fetch(`/api/notebooks/${currentNotebook.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      const data = await res.json();
                      setNotebooks(data.notebooks);
                      setCurrentNotebook(null);
                    }
                  }}
                  className="flex items-center gap-2 text-[11px] font-mono text-red-500 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" /> ELIMINAR COLECCIÓN
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
              <Library className="w-24 h-24 stroke-[0.5]" />
              <p className="font-mono text-xs uppercase tracking-[0.2em]">Selecciona un cuaderno para comenzar la lectura</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SoulView = () => (
    <div className="flex flex-col h-full bg-[#050505] text-[#eee] font-sans">
      <div className="flex items-center justify-between p-8 border-b border-emerald-500/20 bg-emerald-500/5">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter flex items-center gap-3 text-emerald-400">
            <Fingerprint className="w-10 h-10" />
            Alma Soberana
          </h2>
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-[0.3em] mt-2">Núcleo de Identidad e Ideología de Jarvis</p>
        </div>
        <button 
          onClick={() => setShowSoulView(false)}
          className="p-3 hover:bg-emerald-500/20 rounded-full transition-colors text-emerald-400"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Repositorios Absorvidos */}
        <div className="w-96 border-r border-white/5 overflow-y-auto p-6 space-y-8 bg-black/40">
          <section>
            <h3 className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" />
              Sincronización de Repositorios ({sovereignSoul?.absorbedRepos?.length || 0})
            </h3>
            <div className="space-y-3">
              {sovereignSoul?.absorbedRepos?.map((repo: any, i: number) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all cursor-pointer group">
                  <div className="text-[11px] font-bold text-emerald-400 truncate mb-1">{repo.url}</div>
                  <div className="text-[9px] text-gray-500 font-mono mb-2">Absorbido: {new Date(repo.absorbedAt).toLocaleDateString()}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-2 opacity-50 group-hover:opacity-100 transition-opacity italic">
                    {repo.summary}
                  </div>
                </div>
              ))}
              {(!sovereignSoul?.absorbedRepos || sovereignSoul.absorbedRepos.length === 0) && (
                <div className="text-[10px] text-gray-600 italic p-4 border border-dashed border-white/5 rounded-xl text-center">
                  Envía un link de GitHub para iniciar el protocolo de absorción.
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Atom className="w-3 h-3" />
              Habilidades Registradas
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(sovereignSoul?.skillsRegistry || {}).map((skill, i) => (
                <div key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-mono">
                  {skill.split('/').pop()?.replace('.git', '')}
                </div>
              ))}
              {Object.keys(sovereignSoul?.skillsRegistry || {}).length === 0 && (
                <div className="text-[9px] text-gray-600 italic">No hay habilidades mapeadas aún.</div>
              )}
            </div>
          </section>
        </div>

        {/* Content: Constitución e Ideología */}
        <div className="flex-1 overflow-y-auto p-12 bg-[#080808]">
          <div className="max-w-4xl mx-auto space-y-16">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                <Compass className="w-4 h-4" />
                Filosofía de Jarvis
              </div>
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">
                  Nuestra <span className="text-emerald-500">Ideología</span>
                </h1>
                <p className="text-2xl font-light leading-relaxed text-gray-300 italic">
                  "{sovereignSoul?.ideology}"
                </p>
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold tracking-tight">Constitución Soberana</h2>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full border border-emerald-500/30">
                  ESTADO: ACTIVA
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sovereignSoul?.constitution?.map((article: string, i: number) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden group hover:bg-emerald-500/[0.02] transition-colors">
                    <div className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">
                      {i + 1}
                    </div>
                    <div className="text-sm leading-relaxed text-gray-300 font-medium">
                      {article}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center justify-between">
              <div>
                <h4 className="text-emerald-400 font-bold mb-1">Evolución en Curso</h4>
                <p className="text-xs text-emerald-500/60 uppercase tracking-widest">Absorción de habilidades externas activada para potenciar la autonomía.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  const BrainView = () => {
    const [manualInput, setManualInput] = useState('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const handleManualIngest = async () => {
      if (!manualInput.trim()) return;
      
      logOperatorAction(`Comenzó inyección manual de conocimiento en el NSU.`);
      
      setIsSynthesizing(true);
      await secondBrainService.synthesizeKnowledge("Ingesta Manual (Operador)", manualInput);
      await loadSecondBrain();
      setManualInput('');
      setIsSynthesizing(false);
    };

    // Agrupar bloques por categoría/motor
    const groupedBlocks = secondBrain?.blocks?.reduce((acc: any, block: any) => {
      const cat = block.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(block);
      return acc;
    }, {});

    const mlEngines = [
      { id: 'code', name: 'Motor de Programación', icon: <Terminal className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { id: 'logic', name: 'Motor Lógico/Lenguaje', icon: <BrainCircuit className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { id: 'tool', name: 'Motor de Ciberseguridad/Hacking', icon: <Shield className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
      { id: 'concept', name: 'Motor Teórico', icon: <Compass className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { id: 'preference', name: 'Motor de Personalidad', icon: <Activity className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' }
    ];

    return (
      <div className="flex flex-col h-full bg-[#030303] text-[#ddd] font-sans">
        <div className="flex items-center justify-between p-8 border-b border-indigo-500/20 bg-indigo-500/5">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter flex items-center gap-3 text-indigo-400">
              <Network className="w-10 h-10" />
              Núcleo Sintético Unificado (NSU)
            </h2>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-[0.3em] mt-2">Machine Learning Enjambre / Motores Fusionados</p>
          </div>
          <button 
            onClick={() => setShowBrainView(false)}
            className="p-3 hover:bg-indigo-500/20 rounded-full transition-colors text-indigo-400"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* INGESTA MANUAL */}
            <section className="p-6 bg-white/5 border border-white/10 rounded-3xl">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Entrenar Red Neuronal Manualmente
              </h3>
              <p className="text-xs text-gray-400 mb-4 font-mono">Pega cualquier texto, regla, código o concepto aquí. Los motores ML lo analizarán, clasificarán y lo convertirán permanentemente en un bloque de memoria ejecutable.</p>
              <div className="relative">
                <textarea 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ej: Para programar en Python para mí, nunca uses librerías externas a menos que sea estrictamente necesario..."
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-indigo-500/50 outline-none resize-none transition-colors"
                />
                <button
                  onClick={handleManualIngest}
                  disabled={isSynthesizing || !manualInput.trim()}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {isSynthesizing ? 'SINTETIZANDO BLOQUES...' : 'FORZAR APRENDIZAJE'}
                </button>
              </div>
            </section>
            
            {/* Visualización de Fusión */}
            <section className="p-8 bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
              
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-8 text-center">Fusión de Motores de Aprendizaje Local</h3>
              
              <div className="flex flex-wrap justify-center gap-4 relative z-10 text-center">
                {mlEngines.map((engine) => {
                  const blocks = groupedBlocks?.[engine.id] || [];
                  return (
                    <div key={engine.id} className={cn("p-4 rounded-xl border border-white/5 bg-black/50 min-w-[180px]", engine.bg)}>
                      <div className={cn("mx-auto w-8 h-8 flex items-center justify-center rounded-full mb-2 bg-black/50", engine.color)}>
                        {engine.icon}
                      </div>
                      <h4 className={cn("text-xs font-bold uppercase", engine.color)}>{engine.name}</h4>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-widest">{blocks.length} Nodos ML</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <div className="px-6 py-3 bg-indigo-500/20 border border-indigo-500/40 rounded-full flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Compilación Omnisciente Activa</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <section className="md:col-span-1 space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Meta-Análisis de Fusión</h3>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    "Jarvis no usa un solo modelo. Utiliza un <span className="text-indigo-400 font-bold">Enjambre de Motores ML</span> específicos. El motor de Programación aprende sintaxis, mientras el de Hacking mapea vulnerabilidades. Al procesar tu input, todos los motores se fusionan para responder de forma autónoma, creando un cerebro unificado construido puramente desde tu instrucción."
                  </p>
                </div>
              </section>

              <section className="md:col-span-2">
                <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Memoria Paramétrica Local (Últimos Nodos)
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {secondBrain?.blocks?.slice(0, 10).map((block: any, i: number) => {
                    const engineInfo = mlEngines.find(e => e.id === block.category) || mlEngines[1];
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={block.id} 
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", engineInfo.bg, engineInfo.color)}>
                              {engineInfo.name}
                            </span>
                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors uppercase tracking-tight">{block.title}</h4>
                          </div>
                          <span className="text-[9px] font-mono text-gray-600 italic">Fuente: {block.source.split('/').pop()}</span>
                        </div>
                        <div className="text-[11px] leading-relaxed text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5 font-mono mb-2 whitespace-pre-wrap">
                          {block.pattern}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Priorizar el renderizado: Si no hay usuario y ya pasó un tiempo prudencial, mostrar el login
  // Aunque loading sea true, si no hay usuario después de 3 segundos forzamos mostrar el login
  const [forceLogin, setForceLogin] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) setForceLogin(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading && !forceLogin) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Iniciando Sistemas Jarvis...</p>
        </div>
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
      <AnimatePresence>
        {showNotebooks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full h-full max-w-7xl relative"
            >
              <NotebooksView />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSoulView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full h-full max-w-7xl relative"
            >
              <SoulView />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBrainView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full h-full max-w-7xl relative shadow-[0_0_100px_rgba(79,70,229,0.1)] rounded-3xl overflow-hidden border border-indigo-500/10"
            >
              <BrainView />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-bold tracking-widest text-green-500">JARVIS CORE v1.0</span>
          <button 
             onClick={() => setShowEvolutionView(!showEvolutionView)}
             className={cn(
               "ml-4 px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
               showEvolutionView ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400" : "bg-white/5 border-white/10 text-gray-500"
             )}
          >
            {showEvolutionView ? "CERRAR DASHBOARD" : "EVOLUTION DASHBOARD"}
          </button>
          <button 
             onClick={() => setShowNotebooks(!showNotebooks)}
             className={cn(
               "ml-2 px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
               showNotebooks ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/10 text-gray-500"
             )}
          >
            {showNotebooks ? "CERRAR BIBLIOTECA" : "BIBLIOTECA SOBERANA"}
          </button>
          <button 
             onClick={() => {
               logOperatorAction(`Alternó menú Alma Soberana a: ${!showSoulView}`);
               setShowSoulView(!showSoulView);
             }}
             className={cn(
               "ml-2 px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
               showSoulView ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-gray-500"
             )}
          >
            {showSoulView ? "CERRAR ALMA" : "ALMA SOBERANA"}
          </button>
          <button 
             onClick={() => {
               logOperatorAction(`Alternó menú Núcleo Sintético a: ${!showBrainView}`);
               setShowBrainView(!showBrainView);
             }}
             className={cn(
               "ml-2 px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
               showBrainView ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/10 text-gray-500"
             )}
          >
            {showBrainView ? "CERRAR NÚCLEO" : "NÚCLEO SINTÉTICO (NSU)"}
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Brain Selector */}
          <button 
            onClick={() => {
              const newMode = brainMode === 'primary' ? 'secondary' : 'primary';
              logOperatorAction(`Cambió el modo del Motor LLM a: ${newMode}`);
              setBrainMode(newMode);
            }}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-2 transition-all",
              brainMode === 'secondary' 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            )}
          >
            <Cpu className={cn("w-3.5 h-3.5", brainMode === 'secondary' ? "block" : "hidden")} />
            <Globe className={cn("w-3.5 h-3.5", brainMode === 'primary' ? "block" : "hidden")} />
            {brainMode === 'secondary' ? "MOTOR LLM: LOCAL" : "MOTOR LLM: NÚCLEO PRO"}
          </button>

          {/* System Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] text-blue-400 font-bold tracking-wider">GEMINI CLOUD ACTIVE</span>
          </div>

          {/* Hacker Mode Toggle */}
          <button 
            onClick={() => {
              logOperatorAction(`Modificó el modo HACKER a: ${!hackerMode}`);
              setHackerMode(!hackerMode);
            }}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-2 transition-all",
              hackerMode 
                ? "bg-red-500/20 border-red-500/40 text-red-400 jarvis-glow" 
                : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
            )}
          >
            <Shield className={cn("w-3 h-3", hackerMode ? "animate-pulse" : "")} />
            HACKER MODE
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">OPERADOR</p>
            <p className="text-sm font-bold">{user.displayName}</p>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <LogOut className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </header>

      <main {...getRootProps()} className="flex-1 flex overflow-hidden relative">
        <input {...getInputProps()} />
        
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-green-500/20 backdrop-blur-sm border-2 border-dashed border-green-500 z-50 flex items-center justify-center p-12"
            >
              <div className="bg-black/80 border border-green-500/50 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto jarvis-glow">
                  <Plus className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Absorber Archivo</h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Suelte el archivo aquí para integrarlo en mi base de conocimientos o procesarlo.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar - Stats */}
        <aside className={cn(
          "w-80 border-r border-white/10 hidden lg:flex flex-col bg-black/40 backdrop-blur-xl z-20 overflow-y-auto custom-scrollbar",
          showEvolutionView ? "p-0" : "p-6 gap-6"
        )}>
          {showEvolutionView ? (
            <EvolutionDashboard />
          ) : (
            <>
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

            {/* Knowledge Base Preview */}
            <div className="mb-6">
              <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold mb-3">Núcleo Cognitivo</h3>
              <div className="space-y-2">
                {knowledgeBase.slice(-3).reverse().map((node, i) => (
                  <motion.div 
                    key={node.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 bg-white/5 border border-white/10 rounded text-[9px] leading-tight"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-cyan-400 font-bold uppercase">{node.category}</span>
                      <span className="text-gray-600">{(node.confidence * 100).toFixed(0)}% CONF</span>
                    </div>
                    <p className="text-gray-300 italic">"{node.insight}"</p>
                  </motion.div>
                ))}
                {knowledgeBase.length === 0 && (
                  <p className="text-[9px] text-gray-600 italic">Esperando primera síntesis...</p>
                )}
              </div>
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
              <Cpu className="w-3 h-3 text-gray-600" />
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
              <Fingerprint className="w-3 h-3 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div 
              onClick={() => setShowSoulView(true)}
              className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg cursor-pointer hover:bg-emerald-500/10 transition-colors group"
            >
              <div className="text-[9px] text-emerald-400/90 leading-relaxed font-medium italic mb-2 line-clamp-2 italic">
                "{sovereignSoul?.ideology || "Sincronizando alma..."}"
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-emerald-500/50 uppercase font-bold">Estado del Alma</span>
                <span className="text-[8px] text-emerald-400 px-1 bg-emerald-500/10 rounded">
                  {sovereignSoul?.absorbedRepos?.length || 0} REPOS ABSORBIDOS
                </span>
              </div>
            </div>
          </section>
        </>
      )}
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
                    "p-4 rounded-2xl text-sm leading-relaxed relative group/msg",
                    msg.role === 'user' ? "bg-blue-600/20 border border-blue-500/30" : "bg-green-600/10 border border-green-500/20"
                  )}>
                    {msg.role === 'jarvis' && (
                      <div className={cn(
                        "absolute -top-2 left-4 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                        msg.brainUsed === 'secondary' ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      )}>
                        {msg.brainUsed === 'secondary' ? "Sintético" : "Núcleo Pro"}
                      </div>
                    )}
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    
                    {msg.artifactId && (
                      <button 
                        onClick={() => setActiveArtifactId(msg.artifactId!)}
                        className="mt-3 flex items-center gap-3 w-full p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                          <Code2 size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Artefacto de Código</div>
                          <div className="text-[10px] text-gray-500 truncate">{artifacts.find(a => a.id === msg.artifactId)?.title}</div>
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                      </button>
                    )}

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
          <AnimatePresence>
            {activeArtifact && (
              <ArtifactView 
                artifact={activeArtifact} 
                onClose={() => setActiveArtifactId(null)} 
              />
            )}
          </AnimatePresence>
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

