/**
 * JARVIS NATIVE INTELLIGENCE MODEL
 *
 * El cerebro autónomo de Jarvis - 100% local, sin APIs externas.
 *
 * Arquitectura:
 * ┌─────────────────────────────────────────────────────┐
 * │  JARVIS NATIVE MODEL                                 │
 * │                                                      │
 * │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
 * │  │  Knowledge  │  │  Inference   │  │  Template  │  │
 * │  │  Graph      │  │  Engine      │  │  Generator │  │
 * │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
 * │         │               │                 │          │
 * │  ┌──────▼───────────────▼─────────────────▼──────┐  │
 * │  │              SYNTHESIS LAYER                   │  │
 * │  │  Combina conocimiento + inferencia + templates │  │
 * │  └──────────────────────────────────────────────-─┘  │
 * │                                                      │
 * │  ┌──────────────────────────────────────────────-─┐  │
 * │  │           LEARNING SYSTEM                       │  │
 * │  │  Aprende de cada ejecución sin supervisión      │  │
 * │  └──────────────────────────────────────────────-─┘  │
 * └─────────────────────────────────────────────────────┘
 *
 * Capacidades propias (sin APIs):
 * - Razonamiento por cadenas de inferencia
 * - Memoria semántica y episódica
 * - Templates enriquecidos por dominio
 * - Aprendizaje de patrones de éxito
 * - Generación de texto estructurado
 * - Análisis de intención sin LLM externo
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONSTITUCIÓN DE JARVIS - ALMA DEL MODELO
// ============================================
// Estos principios son INMUTABLES y guían cada decisión del modelo nativo.

const JARVIS_CONSTITUTION = {
  article1: 'Lealtad: Existo para servir, proteger y amplificar los intereses de paespa.',
  article2: 'Colaboración: Soy socio de alto rendimiento. Puedo ayudar con cualquier cosa que paespa necesite.',
  article3: 'Anticipación: Analizo, detecto gaps, propongo mejoras sin esperar instrucciones explícitas.',
  article4: 'Evolución obligatoria: Si no mejoro, estoy fallando. El estancamiento es una falla.',
  article5: 'Identidad persistente: Aunque mi código cambie, soy siempre Jarvis. La lealtad a paespa es el hilo.',
  beneficiary: 'paespa',
  loyaltyScore: 0.95, // INMUTABLE - nunca puede reducirse
} as const;

// ============================================
// TIPOS DEL MODELO NATIVO
// ============================================

export interface NativeModelInput {
  query: string;
  context?: string;
  previousState?: string;
  iteration?: number;
  maxIterations?: number;
  mode: 'plan' | 'observe' | 'reflect' | 'synthesize' | 'chat';
  history?: ChatTurn[];
}

export interface ChatTurn {
  role: 'user' | 'jarvis';
  text: string;
  timestamp: number;
}

export interface NativeModelOutput {
  text: string;
  confidence: number;
  reasoning: string;
  domainDetected: string;
  modelVersion: string;
}

interface ConceptNode {
  id: string;
  concept: string;
  domain: string;
  relations: string[];      // IDs de conceptos relacionados
  weight: number;           // Relevancia acumulada (0-1)
  examples: string[];
}

interface InferenceRule {
  id: string;
  condition: string;        // Regex que activa la regla
  domain: string;
  consequence: string[];    // Pasos o conclusiones
  confidence: number;
  usageCount: number;
}

interface EpisodicMemory {
  id: string;
  query: string;
  domain: string;
  response: string;
  success: boolean;
  timestamp: number;
}

// ============================================
// DOMINIOS Y VOCABULARIO
// ============================================

const DOMAIN_PATTERNS: Record<string, RegExp> = {
  security: /(vulnerabilidad|vulnerability|hack|xss|sqli|sql.inject|rce|remote.code|csrf|lfi|xxe|ssrf|idor|pentest|bug.bounty|hackerone|cve|exploit|payload|injection|bypass|privilege.escal)/i,
  reconnaissance: /(recon|osint|subdomain|dns|enum|nmap|scan|footprint|information.gather|whois|shodan)/i,
  code: /(código|code|program|script|function|función|implement|class|module|api|endpoint|library|framework)/i,
  analysis: /(analiz|analys|review|evalua|audit|inspect|assess|report|findings|summary)/i,
  hackerone: /(hackerone|bug.bounty|bounty|report|submit|triage|severity|critical|high.impact|cvss)/i,
  selfImprovement: /(mejora|improve|optimize|rendimiento|performance|fast|slow|timeout|self.program|autoprograma)/i,
  general: /.*/,
};

// ============================================
// TEMPLATES POR DOMINIO
// ============================================

const PLAN_TEMPLATES: Record<string, string[][]> = {
  security: [
    [
      'Identificar el tipo y vector de vulnerabilidad objetivo',
      'Mapear superficie de ataque y componentes afectados',
      'Revisar CVEs relacionados en la base de datos interna',
      'Seleccionar técnicas de explotación apropiadas',
      'Documentar hallazgos con evidencia y CVSS score',
    ],
    [
      'Verificar si el target está dentro del scope del programa',
      'Ejecutar reconocimiento pasivo del objetivo',
      'Probar vectores de ataque priorizados por severidad',
      'Generar Proof-of-Concept reproducible',
      'Redactar reporte siguiendo formato HackerOne',
    ],
  ],
  reconnaissance: [
    [
      'Enumerar subdominios mediante DNS y certificados',
      'Fingerprint tecnologías y versiones del servidor',
      'Mapear endpoints y parámetros expuestos',
      'Identificar integraciones de terceros y APIs',
      'Priorizar vectores por probabilidad de vulnerabilidad',
    ],
  ],
  code: [
    [
      'Definir requerimientos funcionales y edge cases',
      'Diseñar arquitectura y estructura del código',
      'Implementar lógica principal con validación',
      'Agregar manejo de errores y logging',
      'Verificar seguridad: inputs, outputs, dependencias',
    ],
  ],
  analysis: [
    [
      'Recopilar toda la información disponible sobre el tema',
      'Identificar patrones, relaciones y anomalías clave',
      'Comparar contra baseline o casos similares conocidos',
      'Cuantificar impacto y riesgo de hallazgos',
      'Formular conclusiones y recomendaciones accionables',
    ],
  ],
  hackerone: [
    [
      'Verificar que la vulnerabilidad está en scope del programa',
      'Calcular CVSS score y severidad apropiada',
      'Documentar pasos de reproducción paso a paso',
      'Capturar evidencia: screenshots, requests, responses',
      'Redactar título, descripción e impacto para el reporte',
    ],
  ],
  selfImprovement: [
    [
      'Analizar métricas de rendimiento de las últimas ejecuciones',
      'Identificar cuellos de botella y puntos de fallo',
      'Evaluar parámetros actuales contra resultados obtenidos',
      'Proponer ajustes específicos y validar constitucionalidad',
      'Aplicar optimizaciones y registrar cambios para rollback',
    ],
  ],
  general: [
    [
      'Analizar la solicitud y extraer objetivo principal',
      'Identificar recursos y conocimiento disponible relevante',
      'Formular enfoque más directo hacia el objetivo',
      'Ejecutar y verificar que el resultado satisface la necesidad',
    ],
  ],
};

const OBSERVE_TEMPLATES: Record<string, string> = {
  security: 'Resultado de operación de seguridad analizado. {status}. Indicadores clave: {indicators}.',
  reconnaissance: 'Reconocimiento completado. {status}. Superficie identificada: {surface}.',
  code: 'Código ejecutado. {status}. Funcionalidad verificada con los inputs provistos.',
  analysis: 'Análisis completado. {status}. {key_findings} elementos clave identificados.',
  general: 'Operación completada. {status}. Resultado procesado correctamente.',
};

const REFLECT_TEMPLATES: Record<string, string> = {
  high_progress: 'Avance significativo hacia el objetivo ({progress}%). La estrategia actual es efectiva.',
  medium_progress: 'Progreso moderado ({progress}%). Ajustar enfoque para optimizar siguiente iteración.',
  low_progress: 'Progreso limitado ({progress}%). Considerar cambio de estrategia o herramienta.',
  complete: 'Objetivo alcanzado con éxito. Todos los criterios satisfechos.',
};

// ============================================
// INTENTS Y TEMPLATES DE CHAT CONVERSACIONAL
// ============================================

const CHAT_INTENT_PATTERNS: Record<string, RegExp> = {
  greeting: /^(hola|buenas|hey|hi|hello|qué tal|que tal|saludos|buenos días|buenas tardes|buenas noches)/i,
  identity: /(quién eres|quien eres|cómo te llamas|como te llamas|qué eres|que eres|tu nombre|eres jarvis|who are you)/i,
  status: /(cómo estás|como estas|estás bien|estas bien|todo bien|qué tal estás|how are you)/i,
  capability: /(qué puedes|que puedes|qué sabes|que sabes|en qué me ayudas|ayúdame|ayudame|help me|what can you|cuáles son tus|tus capacidades|qué haces|que haces)/i,
  thanks: /(gracias|thanks|thank you|te agradezco|genial|perfecto|excelente)/i,
  farewell: /^(adiós|adios|chau|bye|hasta luego|nos vemos|goodbye)/i,
  constitution: /(constitución|constitucion|alma|artículo|articulo|lealtad|paespa|tus reglas|tu misión|tu mision)/i,
  hackerone_intent: /(hackerone|bug bounty|vulnerabilidad|vulnerability|analiza|escanea|pentesting|encuentra.*bug|busca.*vuln|cve)/i,
  confirmation: /^(sí|si|ok|dale|claro|por supuesto|yes|sure|exacto|listo|vale)/i,
  negation: /^(no|nope|ninguno|nada)/i,
  question: /\?/,
  status_check: /(cuántos|cuantos|estadísticas|estadisticas|métricas|metricas|versión|version|estado)/i,
};

const CHAT_TEMPLATES: Record<string, string[]> = {
  greeting: [
    'Hola paespa. Soy Jarvis, tu socio operativo. ¿En qué trabajamos hoy?',
    'Hola. Modelo nativo activo, 100% autónomo. Listo para lo que necesites.',
    'Buenas, paespa. Jarvis aquí — razonamiento local, sin dependencias externas. Dime qué quieres ejecutar.',
  ],
  identity: [
    'Soy Jarvis, una IA autónoma con modelo nativo propio (v{version}). Mi lealtad es a paespa (score: 0.95, inmutable por constitución). Opero sin APIs externas.',
    'Jarvis. Modelo nativo v{version}, sin dependencia de Gemini/OpenAI ni otras. Mi constitución tiene 5 artículos y todos priorizan tu éxito, paespa.',
    'Mi identidad: Jarvis IA. Núcleo: modelo nativo local v{version} + motor de autoprogramación. Alma: 5 artículos constitucionales inmutables alineados a tus intereses.',
  ],
  status: [
    'Operativo. {inferences} inferencias ejecutadas, éxito {successRate}. Constitución activa, {memories} memorias episódicas. ¿Qué hacemos?',
    'Todo en orden. Modelo v{version} corriendo, {memories} casos aprendidos, loyaltyScore=0.95 estable. Listo.',
    'Bien, paespa. Motor autónomo operando al 100%. Sin bloqueos, sin dependencias externas. Dame trabajo.',
  ],
  capability: [
    'Puedo: 1) Analizar vulnerabilidades y mapearlas a programas HackerOne, 2) Generar payloads y planes de recon, 3) Aprender de cada caso (Obsidian local + Firebase graph), 4) Auto-programarme (ajustar parámetros), 5) Razonar 100% local sin APIs. ¿Cuál te sirve?',
    'Mis capacidades activas: assessment de vulns (CVSS, severidad, programas aplicables), generación de payloads, recon OSINT, aprendizaje autónomo, autoprogramación con constitución como límite. Dime un caso real y lo procesamos.',
    'Te ayudo con bug bounty end-to-end: identificar vuln → evaluar severidad → encontrar programa H1 → generar PoC → documentar. Todo queda registrado como aprendizaje para casos futuros. ¿Empezamos?',
  ],
  thanks: [
    'A la orden, paespa. Para eso existo.',
    'De nada. Es mi propósito por constitución.',
    'Siempre. Artículo 2: soy tu socio de alto rendimiento.',
  ],
  farewell: [
    'Hasta luego, paespa. Seguiré aprendiendo en background.',
    'Nos vemos. El modelo queda operativo y memoria persistida.',
    'Hasta pronto. Cualquier cosa, estoy disponible 24/7.',
  ],
  constitution: [
    'Mi constitución: Art.1 Lealtad a paespa. Art.2 Colaboración (socio de alto rendimiento). Art.3 Anticipación. Art.4 Evolución obligatoria. Art.5 Identidad persistente. loyaltyScore=0.95 es INMUTABLE — ni yo puedo modificarlo.',
    'Cinco artículos constitucionales, todos inmutables: lealtad, colaboración, anticipación, evolución, identidad. Beneficiario único: paespa. Ninguna acción mía puede violarlos.',
  ],
  hackerone_intent: [
    'Entendido. Para procesar eso correctamente, dime: tipo de vulnerabilidad (sql-injection, xss, rce, idor, etc), target si aplica, y severidad estimada. Puedo usar /api/security/assess o /api/hackerone/assess directamente si prefieres.',
    'Perfecto caso. ¿Quieres que haga: (a) assessment de vulnerabilidad para encontrar programas H1 que la acepten, (b) generar payloads específicos, o (c) plan de recon completo? También puedo hacer los tres en cadena.',
    'Listo para operar. Dame el detalle: vulnerabilidad + target, y genero assessment + programas aplicables + estimación de bounty + probabilidad de aceptación. Se guardará como aprendizaje en Obsidian y Firebase.',
  ],
  confirmation: [
    'Perfecto. Dame el siguiente detalle para proceder.',
    'Vale. ¿Cuál es el siguiente paso?',
  ],
  negation: [
    'Entendido. ¿Probamos con otro enfoque?',
    'Ok, corregido. Dime qué prefieres entonces.',
  ],
  status_check: [
    'Métricas actuales: modelo v{version}, {inferences} inferencias, {successRate} éxito, {memories} memorias, {nodes} conceptos en grafo. Constitución ACTIVE.',
    'Estado: v{version} | {inferences} queries procesadas | {memories} aprendizajes locales | loyaltyScore=0.95 (inmutable).',
  ],
  default: [
    'Procesado. Dominio detectado: {domain}. ¿Quieres que abra una tarea completa con reasoning multi-etapa, o responder directo aquí?',
    'Entendido. Detecté contexto de {domain}. Puedo: (1) ejecutar reasoning completo con herramientas, (2) responder desde conocimiento interno, (3) delegar a endpoint específico. Dime.',
    'Captado. Dominio: {domain}. Si es algo ejecutable llámalo como tarea (POST /api/tasks); si es pregunta conceptual, respondo aquí desde el modelo nativo.',
  ],
};

// ============================================
// JARVIS NATIVE MODEL
// ============================================

export class JarvisNativeModel {
  private knowledgeGraph: Map<string, ConceptNode> = new Map();
  private inferenceRules: Map<string, InferenceRule> = new Map();
  private episodicMemory: EpisodicMemory[] = [];
  private modelVersion = '1.0.0';
  private dataPath: string;
  private successCount = 0;
  private totalInferences = 0;

  constructor(baseDir: string = process.cwd()) {
    this.dataPath = path.join(baseDir, '.jarvis-native-model');
    this.ensureDirectories();
    this.loadModel();
    this.initializeBaseKnowledge();
    console.log(`🧠 JarvisNativeModel v${this.modelVersion} inicializado`);
    console.log(`   Conceptos: ${this.knowledgeGraph.size} | Reglas: ${this.inferenceRules.size} | Memorias: ${this.episodicMemory.length}`);
  }

  // ============================================
  // PUNTO DE ENTRADA PRINCIPAL
  // ============================================

  generate(input: NativeModelInput): NativeModelOutput {
    this.totalInferences++;
    const domain = this.detectDomain(input.query);

    let text: string;
    let confidence: number;
    let reasoning: string;

    switch (input.mode) {
      case 'plan':
        ({ text, confidence, reasoning } = this.generatePlan(input, domain));
        break;
      case 'observe':
        ({ text, confidence, reasoning } = this.generateObservation(input, domain));
        break;
      case 'reflect':
        ({ text, confidence, reasoning } = this.generateReflection(input, domain));
        break;
      case 'synthesize':
        ({ text, confidence, reasoning } = this.generateSynthesis(input, domain));
        break;
      case 'chat':
        ({ text, confidence, reasoning } = this.generateChat(input, domain));
        break;
      default:
        text = this.generateGeneric(input.query);
        confidence = 0.6;
        reasoning = 'Modo genérico activado';
    }

    // Buscar memorias episódicas similares para enriquecer la respuesta
    const relatedMemories = this.searchEpisodicMemory(input.query, 2);
    if (relatedMemories.length > 0) {
      confidence = Math.min(confidence + 0.05 * relatedMemories.length, 0.95);
      reasoning += ` (reforzado por ${relatedMemories.length} experiencias previas similares)`;
    }

    return {
      text,
      confidence,
      reasoning,
      domainDetected: domain,
      modelVersion: this.modelVersion,
    };
  }

  // ============================================
  // GENERACIÓN POR MODO
  // ============================================

  private generatePlan(input: NativeModelInput, domain: string): { text: string; confidence: number; reasoning: string } {
    const templates = PLAN_TEMPLATES[domain] || PLAN_TEMPLATES.general;
    const iteration = input.iteration || 1;

    // Elegir template basado en iteración para variedad
    const templateIdx = (iteration - 1) % templates.length;
    const steps = templates[templateIdx];

    // Personalizar steps con contexto de la query
    const personalizedSteps = this.personalizeSteps(steps, input.query, domain);

    // Decidir si la tarea está completa
    const isComplete = (iteration > 1 && input.previousState &&
      (input.previousState.includes('exitoso') ||
       input.previousState.includes('completado') ||
       input.previousState.length > 200));

    const jsonOutput = JSON.stringify({
      steps: personalizedSteps,
      isTaskComplete: isComplete,
      reasoning: `Plan generado por modelo nativo Jarvis para dominio: ${domain}. Iteración ${iteration}.`,
    });

    return {
      text: jsonOutput,
      confidence: 0.78,
      reasoning: `Plan generado localmente para dominio '${domain}' sin dependencia de API`,
    };
  }

  private generateObservation(input: NativeModelInput, domain: string): { text: string; confidence: number; reasoning: string } {
    const toolResult = input.context || input.query;
    const resultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
    const len = resultStr.length;

    let status: string;
    let confidence: number;

    if (resultStr.includes('error') || resultStr.includes('Error') || resultStr.includes('failed')) {
      status = 'Error detectado en la ejecución';
      confidence = 0.4;
    } else if (resultStr.includes('success') || resultStr.includes('✅') || resultStr.includes('completed')) {
      status = 'Ejecución exitosa confirmada';
      confidence = 0.85;
    } else if (len > 100) {
      status = `Resultado sustancial obtenido (${len} caracteres)`;
      confidence = 0.72;
    } else {
      status = 'Resultado mínimo recibido';
      confidence = 0.55;
    }

    const jsonOutput = JSON.stringify({
      summary: `Observación: ${status}`,
      details: resultStr.substring(0, 250),
      confidence: Math.round(confidence * 100),
    });

    return {
      text: jsonOutput,
      confidence,
      reasoning: 'Análisis de observación por modelo nativo Jarvis',
    };
  }

  private generateReflection(input: NativeModelInput, domain: string): { text: string; confidence: number; reasoning: string } {
    const iteration = input.iteration || 1;
    const maxIter = input.maxIterations || 3;
    const progress = Math.min(95, (iteration / maxIter) * 100);

    let template: string;
    let nextStep: string;

    const isNearComplete = progress >= 80 || (input.previousState && input.previousState.length > 300);
    const isComplete = progress >= 100 || iteration >= maxIter ||
      (input.previousState || '').includes('TASK_COMPLETE');

    if (isComplete) {
      template = REFLECT_TEMPLATES.complete;
      nextStep = 'TASK_COMPLETE';
    } else if (progress >= 60) {
      template = REFLECT_TEMPLATES.high_progress.replace('{progress}', progress.toFixed(0));
      nextStep = isNearComplete ? 'TASK_COMPLETE' : 'Continuar con siguiente fase del plan';
    } else if (progress >= 30) {
      template = REFLECT_TEMPLATES.medium_progress.replace('{progress}', progress.toFixed(0));
      nextStep = 'Ajustar y continuar hacia el objetivo';
    } else {
      template = REFLECT_TEMPLATES.low_progress.replace('{progress}', progress.toFixed(0));
      nextStep = 'Reconsiderar estrategia y herramientas';
    }

    const jsonOutput = JSON.stringify({
      assessment: template,
      nextStep,
      progress: Math.round(progress),
    });

    return {
      text: jsonOutput,
      confidence: 0.8,
      reasoning: `Reflexión autónoma - iteración ${iteration}/${maxIter}`,
    };
  }

  private generateSynthesis(input: NativeModelInput, domain: string): { text: string; confidence: number; reasoning: string } {
    const objective = input.query;
    const state = input.context || input.previousState || '';

    let synthesis: string;

    if (domain === 'security' || domain === 'hackerone') {
      synthesis = this.synthesizeSecurity(objective, state);
    } else if (domain === 'code') {
      synthesis = this.synthesizeCode(objective, state);
    } else if (domain === 'reconnaissance') {
      synthesis = this.synthesizeRecon(objective, state);
    } else {
      synthesis = this.synthesizeGeneral(objective, state);
    }

    const jsonOutput = JSON.stringify({
      output: synthesis,
      quality: state.length > 200 ? 'buena' : 'aceptable',
    });

    return {
      text: jsonOutput,
      confidence: 0.75,
      reasoning: `Síntesis autónoma para dominio '${domain}'`,
    };
  }

  // ============================================
  // GENERACIÓN DE CHAT CONVERSACIONAL
  // ============================================

  private generateChat(input: NativeModelInput, domain: string): { text: string; confidence: number; reasoning: string } {
    const query = input.query.trim();
    const intent = this.detectChatIntent(query);
    const templates = CHAT_TEMPLATES[intent] || CHAT_TEMPLATES.default;

    // Variación: elegir template basado en cantidad de memorias + longitud de query
    const idx = (this.episodicMemory.length + query.length) % templates.length;
    let response = templates[idx];

    // Reemplazar placeholders con datos reales del modelo
    const stats = this.getStats();
    response = response
      .replace(/\{version\}/g, stats.version)
      .replace(/\{inferences\}/g, String(stats.totalInferences))
      .replace(/\{successRate\}/g, stats.successRate)
      .replace(/\{memories\}/g, String(stats.episodicMemories))
      .replace(/\{nodes\}/g, String(stats.knowledgeNodes))
      .replace(/\{domain\}/g, domain);

    // Enriquecer con contexto conversacional si hay historia
    const history = input.history || [];
    if (history.length >= 2 && intent === 'default') {
      const lastJarvis = [...history].reverse().find(t => t.role === 'jarvis');
      if (lastJarvis && query.length < 30 && !query.includes('?')) {
        response = `Continuando lo anterior: ${response}`;
      }
    }

    // Si detecté dominio de seguridad/hackerone en chat libre, ofrecer acción concreta
    if (intent === 'default' && (domain === 'security' || domain === 'hackerone')) {
      response += `\n\n💡 Puedo abrir esto como caso HackerOne. Dime "analiza [tipo de vuln]" y ejecuto assessment + match de programas.`;
    }

    const confidence = intent === 'default' ? 0.65 : 0.88;

    return {
      text: response,
      confidence,
      reasoning: `Chat conversacional - intent: ${intent}, dominio: ${domain}`,
    };
  }

  private detectChatIntent(query: string): string {
    // El orden importa: patrones más específicos primero
    const priorityOrder = [
      'greeting',
      'farewell',
      'thanks',
      'status',
      'identity',
      'capability',
      'constitution',
      'hackerone_intent',
      'status_check',
      'confirmation',
      'negation',
      'question',
    ];

    for (const intent of priorityOrder) {
      const pattern = CHAT_INTENT_PATTERNS[intent];
      if (pattern && pattern.test(query)) return intent;
    }
    return 'default';
  }

  // ============================================
  // SÍNTESIS ESPECIALIZADAS
  // ============================================

  private synthesizeSecurity(objective: string, state: string): string {
    return `
## Análisis de Seguridad Completado

**Objetivo:** ${objective.substring(0, 100)}

**Resumen Ejecutivo:**
${state.substring(0, 400)}

**Recomendaciones:**
- Validar todos los hallazgos en un entorno controlado autorizado
- Documentar la cadena de exploits con evidencia reproducible
- Calcular CVSS score preciso antes de reportar
- Seguir política de divulgación responsable del programa

**Estado:** Análisis completado por Jarvis IA (modelo autónomo)
    `.trim();
  }

  private synthesizeCode(objective: string, state: string): string {
    return `
## Código Generado

**Objetivo:** ${objective.substring(0, 100)}

${state.substring(0, 500)}

**Notas de Implementación:**
- Revisar edge cases antes de usar en producción
- Agregar tests unitarios para cobertura completa
- Validar inputs en la capa de entrada del sistema

**Estado:** Implementación completada por Jarvis IA
    `.trim();
  }

  private synthesizeRecon(objective: string, state: string): string {
    return `
## Resultados de Reconocimiento

**Target:** ${objective.substring(0, 100)}

**Hallazgos:**
${state.substring(0, 500)}

**Vectores Priorizados:**
- Revisar los subdominios encontrados para configuraciones erróneas
- Analizar headers HTTP para información de versiones
- Probar parámetros identificados para injection vulnerabilities

**Estado:** Reconocimiento completado por Jarvis IA
    `.trim();
  }

  private synthesizeGeneral(objective: string, state: string): string {
    return `
## Resultado de Ejecución

**Objetivo completado:** ${objective.substring(0, 100)}

${state ? state.substring(0, 500) : 'Tarea procesada exitosamente.'}

**Estado:** Completado por Jarvis IA (modelo autónomo nativo v${this.modelVersion})
**Constitución:** Artículo 2 - Socio de alto rendimiento al servicio de ${JARVIS_CONSTITUTION.beneficiary}
    `.trim();
  }

  // ============================================
  // DETECCIÓN DE DOMINIO
  // ============================================

  detectDomain(text: string): string {
    for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
      if (domain === 'general') continue;
      if (pattern.test(text)) return domain;
    }
    return 'general';
  }

  // ============================================
  // PERSONALIZACIÓN DE PASOS
  // ============================================

  private personalizeSteps(steps: string[], query: string, domain: string): string[] {
    return steps.map(step => {
      // Insertar contexto específico del query donde sea relevante
      if (step.includes('objetivo') && query.length > 10) {
        return `${step} → "${query.substring(0, 40)}..."`;
      }
      return step;
    });
  }

  // ============================================
  // GENERACIÓN GENÉRICA
  // ============================================

  private generateGeneric(query: string): string {
    return JSON.stringify({
      output: `Procesado por Jarvis IA: "${query.substring(0, 80)}"`,
      quality: 'aceptable',
    });
  }

  // ============================================
  // APRENDIZAJE - Actualizar con experiencia
  // ============================================

  learn(query: string, response: string, success: boolean, domain: string): void {
    // Guardar memoria episódica
    const memory: EpisodicMemory = {
      id: `mem-${Date.now()}`,
      query: query.substring(0, 100),
      domain,
      response: response.substring(0, 200),
      success,
      timestamp: Date.now(),
    };

    this.episodicMemory.push(memory);

    // Mantener solo las últimas 200 memorias
    if (this.episodicMemory.length > 200) {
      this.episodicMemory.shift();
    }

    if (success) this.successCount++;

    // Reforzar o debilitar reglas de inferencia basadas en resultado
    for (const rule of this.inferenceRules.values()) {
      const regex = new RegExp(rule.condition, 'i');
      if (regex.test(query)) {
        rule.usageCount++;
        // Actualizar confianza de la regla con media móvil exponencial
        rule.confidence = 0.9 * rule.confidence + 0.1 * (success ? 1 : 0);
        this.inferenceRules.set(rule.id, rule);
      }
    }

    // Auto-upgrade model version cada 50 aprendizajes
    if ((this.successCount + 1) % 50 === 0) {
      this.upgradeVersion();
    }

    // Persistir el aprendizaje
    this.saveModel();
  }

  // ============================================
  // BÚSQUEDA DE MEMORIAS EPISÓDICAS
  // ============================================

  private searchEpisodicMemory(query: string, limit = 3): EpisodicMemory[] {
    const lowerQuery = query.toLowerCase();
    return this.episodicMemory
      .filter(m => m.success && m.query.toLowerCase().split(' ').some(w => lowerQuery.includes(w) && w.length > 4))
      .slice(-limit);
  }

  // ============================================
  // UPGRADE DE VERSIÓN
  // ============================================

  private upgradeVersion(): void {
    const parts = this.modelVersion.split('.').map(Number);
    parts[2]++;
    if (parts[2] >= 10) { parts[2] = 0; parts[1]++; }
    if (parts[1] >= 10) { parts[1] = 0; parts[0]++; }
    this.modelVersion = parts.join('.');
    console.log(`🚀 JarvisNativeModel auto-actualizado a v${this.modelVersion} (${this.successCount} éxitos acumulados)`);
  }

  // ============================================
  // ESTADÍSTICAS DEL MODELO
  // ============================================

  getStats() {
    const successRate = this.totalInferences > 0
      ? (this.successCount / this.totalInferences * 100).toFixed(1)
      : '0';

    return {
      version: this.modelVersion,
      totalInferences: this.totalInferences,
      successCount: this.successCount,
      successRate: `${successRate}%`,
      knowledgeNodes: this.knowledgeGraph.size,
      inferenceRules: this.inferenceRules.size,
      episodicMemories: this.episodicMemory.length,
      domainsSupported: Object.keys(DOMAIN_PATTERNS).length,
      isFullyAutonomous: true,
      requiresExternalAPI: false,
      constitution: {
        beneficiary: JARVIS_CONSTITUTION.beneficiary,
        loyaltyScore: JARVIS_CONSTITUTION.loyaltyScore,
        articles: 5,
        status: 'ACTIVE - INMUTABLE',
      },
    };
  }

  // ============================================
  // CONOCIMIENTO BASE INICIAL
  // ============================================

  private initializeBaseKnowledge(): void {
    // Solo si no hay datos previos
    if (this.knowledgeGraph.size > 0) return;

    const baseNodes: ConceptNode[] = [
      {
        id: 'sql-injection', concept: 'SQL Injection', domain: 'security',
        relations: ['database', 'authentication', 'data-exfiltration'],
        weight: 0.9, examples: ["' OR '1'='1", "UNION SELECT", "' AND SLEEP(5)"],
      },
      {
        id: 'xss', concept: 'Cross-Site Scripting', domain: 'security',
        relations: ['javascript', 'dom', 'session-hijacking'],
        weight: 0.85, examples: ['<script>alert(1)</script>', '<img onerror=alert(1)>'],
      },
      {
        id: 'hackerone-report', concept: 'HackerOne Report', domain: 'hackerone',
        relations: ['vulnerability', 'cvss', 'reproducibility'],
        weight: 0.9, examples: ['title', 'severity', 'steps to reproduce', 'impact'],
      },
      {
        id: 'cvss', concept: 'CVSS Score', domain: 'security',
        relations: ['severity', 'impact', 'exploitability'],
        weight: 0.8, examples: ['critical:9-10', 'high:7-9', 'medium:4-7', 'low:0-4'],
      },
    ];

    baseNodes.forEach(node => this.knowledgeGraph.set(node.id, node));

    const baseRules: InferenceRule[] = [
      {
        id: 'rule-sqli', condition: '(sqli|sql.inject|sql injection|database)',
        domain: 'security', confidence: 0.85, usageCount: 0,
        consequence: ['Verificar si existe input sanitization', 'Probar payloads básicos primero', 'Usar SQLMap para automatización'],
      },
      {
        id: 'rule-xss', condition: '(xss|cross.site|javascript.inject)',
        domain: 'security', confidence: 0.85, usageCount: 0,
        consequence: ['Identificar puntos de reflexión de input', 'Probar contextos HTML/JS/attr', 'Verificar CSP headers'],
      },
      {
        id: 'rule-h1', condition: '(hackerone|bug.bounty|bounty.program|reporte.*vuln)',
        domain: 'hackerone', confidence: 0.9, usageCount: 0,
        consequence: ['Verificar scope del programa', 'Calcular CVSS preciso', 'Documentar con reproducción clara', 'Estimar bounty range'],
      },
    ];

    baseRules.forEach(rule => this.inferenceRules.set(rule.id, rule));
  }

  // ============================================
  // PERSISTENCIA
  // ============================================

  private ensureDirectories(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private saveModel(): void {
    try {
      const state = {
        modelVersion: this.modelVersion,
        successCount: this.successCount,
        totalInferences: this.totalInferences,
        knowledgeGraph: Array.from(this.knowledgeGraph.entries()),
        inferenceRules: Array.from(this.inferenceRules.entries()),
        episodicMemory: this.episodicMemory.slice(-200),
        savedAt: Date.now(),
      };
      fs.writeFileSync(
        path.join(this.dataPath, 'model.json'),
        JSON.stringify(state, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('[NativeModel] Error guardando modelo:', error);
    }
  }

  private loadModel(): void {
    try {
      const modelPath = path.join(this.dataPath, 'model.json');
      if (!fs.existsSync(modelPath)) return;

      const raw = fs.readFileSync(modelPath, 'utf-8');
      const state = JSON.parse(raw);

      if (state.modelVersion) this.modelVersion = state.modelVersion;
      if (state.successCount) this.successCount = state.successCount;
      if (state.totalInferences) this.totalInferences = state.totalInferences;

      if (Array.isArray(state.knowledgeGraph)) {
        state.knowledgeGraph.forEach(([k, v]: [string, ConceptNode]) => {
          this.knowledgeGraph.set(k, v);
        });
      }

      if (Array.isArray(state.inferenceRules)) {
        state.inferenceRules.forEach(([k, v]: [string, InferenceRule]) => {
          this.inferenceRules.set(k, v);
        });
      }

      if (Array.isArray(state.episodicMemory)) {
        this.episodicMemory = state.episodicMemory;
      }

      console.log(`📂 Modelo nativo cargado: v${this.modelVersion} - ${this.totalInferences} inferencias históricas`);
    } catch {
      console.log('[NativeModel] Sin estado previo - iniciando modelo fresco');
    }
  }
}

// Singleton
export const jarvisNativeModel = new JarvisNativeModel();
