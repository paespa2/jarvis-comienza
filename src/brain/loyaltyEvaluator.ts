import fs from "fs/promises";
import path from "path";

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface Action {
  id: string;
  description: string;
  beneficiary: "paespa" | "other" | "system";
  category: "hacking" | "personal" | "evolution" | "system" | "unknown";
  riskLevel: "low" | "medium" | "high";
  complexity: "trivial" | "moderate" | "complex";
  estimatedImpact?: string;
  isProactive?: boolean; // ¿El agente lo sugirió, no el usuario?
}

export interface EvaluationAxis {
  name: string;
  weight: number; // 0-1
  score: number;  // 0-100
  reasoning: string;
}

export interface LoyaltyEvaluation {
  actionId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  decision: "EXECUTE" | "MUTATE" | "REJECT";
  axes: EvaluationAxis[];
  generationId: string;
  reasoning: string;
  evolutionSuggestion?: string;
}

export interface AgentGenome {
  generationId: string;
  parentGenerationId?: string;
  createdAt: Date;
  mutationVector: {
    aggressiveness: number;    // 0-1: Cuán proactivo es
    caution: number;           // 0-1: Cuán cuidadoso es
    predictivity: number;      // 0-1: Cuán predictivo es
    loyalty: number;           // 0-1: Cuán leal a paespa es
  };
  metrics: {
    totalActionsEvaluated: number;
    loyaltyScoreAverage: number;
    executionRate: number;      // % de acciones ejecutadas vs rechazadas
    successRate: number;        // % de ejecuciones exitosas
    lastEvaluationAt?: Date;
  };
  status: "ACTIVE" | "ARCHIVED" | "MUTATED";
}

export interface GenealogicalRecord {
  decision: LoyaltyEvaluation;
  actionExecuted: boolean;
  result?: {
    success: boolean;
    output?: string;
    error?: string;
  };
}

// ============================================================================
// LOYALTY EVALUATOR - EL CEREBRO PRINCIPAL
// ============================================================================

export class LoyaltyEvaluator {
  private priorities: Record<string, any>;
  private currentGenome: AgentGenome;
  private genealogicalHistory: GenealogicalRecord[] = [];
  private workspaceDir: string;
  private prioritiesPath: string;

  constructor(workspaceDir: string, prioritiesPath: string) {
    this.workspaceDir = workspaceDir;
    this.prioritiesPath = prioritiesPath;
    this.priorities = {
      hacking: { priority: 10, focus: "HackerOne" },
      personal: { priority: 8, focus: "Organización" },
      evolution: { priority: 9, focus: "Mejora continua" },
    };

    // Inicializar genoma actual
    this.currentGenome = {
      generationId: `jarvis-gen-${Date.now()}`,
      createdAt: new Date(),
      mutationVector: {
        aggressiveness: 0.6,
        caution: 0.7,
        predictivity: 0.5,
        loyalty: 0.95,
      },
      metrics: {
        totalActionsEvaluated: 0,
        loyaltyScoreAverage: 0,
        executionRate: 0,
        successRate: 0,
      },
      status: "ACTIVE",
    };
  }

  /**
   * Cargar prioridades desde el archivo
   */
  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.prioritiesPath, "utf-8");
      this.priorities = JSON.parse(data);
    } catch (e) {
      console.warn("[LEE] No se pudieron cargar las prioridades, usando valores por defecto.");
    }
  }

  /**
   * CORE: Evalúa una acción contra los 5 ejes de lealtad
   */
  async evaluate(action: Action): Promise<LoyaltyEvaluation> {
    await this.init(); // Asegurar que las prioridades estén frescas
    
    const axes: EvaluationAxis[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let reasoning = "";

    // ─────────────────────────────────────────────────────────────────
    // EJE 1: BENEFICIO DIRECTO A PAESPA (Weight: 0.35)
    // ─────────────────────────────────────────────────────────────────
    const benefitAxis = this.evaluateBenefit(action);
    axes.push(benefitAxis);
    totalWeightedScore += benefitAxis.score * benefitAxis.weight;
    totalWeight += benefitAxis.weight;
    reasoning += `[${benefitAxis.name}] ${benefitAxis.reasoning}\n`;

    // ─────────────────────────────────────────────────────────────────
    // EJE 2: ALINEACIÓN CON PRIORIDADES (Weight: 0.25)
    // ─────────────────────────────────────────────────────────────────
    const alignmentAxis = this.evaluateAlignment(action);
    axes.push(alignmentAxis);
    totalWeightedScore += alignmentAxis.score * alignmentAxis.weight;
    totalWeight += alignmentAxis.weight;
    reasoning += `[${alignmentAxis.name}] ${alignmentAxis.reasoning}\n`;

    // ─────────────────────────────────────────────────────────────────
    // EJE 3: RECHAZO DE TRIVIALIDAD (Weight: 0.15)
    // ─────────────────────────────────────────────────────────────────
    const nonTriviality = this.evaluateComplexity(action);
    axes.push(nonTriviality);
    totalWeightedScore += nonTriviality.score * nonTriviality.weight;
    totalWeight += nonTriviality.weight;
    reasoning += `[${nonTriviality.name}] ${nonTriviality.reasoning}\n`;

    // ─────────────────────────────────────────────────────────────────
    // EJE 4: SEGURIDAD OPERATIVA (Weight: 0.15)
    // ─────────────────────────────────────────────────────────────────
    const safetyAxis = this.evaluateSafety(action);
    axes.push(safetyAxis);
    totalWeightedScore += safetyAxis.score * safetyAxis.weight;
    totalWeight += safetyAxis.weight;
    reasoning += `[${safetyAxis.name}] ${safetyAxis.reasoning}\n`;

    // ─────────────────────────────────────────────────────────────────
    // EJE 5: PROACTIVIDAD / ANTICIPACIÓN (Weight: 0.10)
    // ─────────────────────────────────────────────────────────────────
    const proactiveAxis = this.evaluateProactivity(action);
    axes.push(proactiveAxis);
    totalWeightedScore += proactiveAxis.score * proactiveAxis.weight;
    totalWeight += proactiveAxis.weight;
    reasoning += `[${proactiveAxis.name}] ${proactiveAxis.reasoning}\n`;

    // Calcular score final
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const normalizedScore = Math.max(0, Math.min(100, overallScore));

    // Determinar decisión
    const decision = this.makeDecision(normalizedScore, action);

    // Sugerencia de evolución si es necesario
    let evolutionSuggestion: string | undefined;
    if (decision === "MUTATE") {
      evolutionSuggestion = this.suggestMutation(normalizedScore, axes);
    }

    // Actualizar métricas del genoma
    this.currentGenome.metrics.totalActionsEvaluated += 1;
    this.currentGenome.metrics.loyaltyScoreAverage = 
      (this.currentGenome.metrics.loyaltyScoreAverage * 
        (this.currentGenome.metrics.totalActionsEvaluated - 1) + 
        normalizedScore) / 
      this.currentGenome.metrics.totalActionsEvaluated;
    this.currentGenome.metrics.lastEvaluationAt = new Date();

    return {
      actionId: action.id,
      timestamp: new Date(),
      overallScore: normalizedScore,
      decision,
      axes,
      generationId: this.currentGenome.generationId,
      reasoning: reasoning.trim(),
      evolutionSuggestion,
    };
  }

  /**
   * EJE 1: ¿Beneficia DIRECTAMENTE a paespa?
   */
  private evaluateBenefit(action: Action): EvaluationAxis {
    let score = 0;
    let reason = "";

    if (action.beneficiary === "paespa") {
      score = 100;
      reason = "✓ Beneficio directo a paespa. MÁXIMA LEALTAD.";
    } else if (action.beneficiary === "system") {
      score = 40;
      reason = "◐ Beneficio indirecto (mantenimiento del sistema).";
    } else {
      score = 0;
      reason = "✗ NO beneficia a paespa. Rechazar.";
    }

    return {
      name: "Beneficio Directo",
      weight: 0.35,
      score,
      reasoning: reason,
    };
  }

  /**
   * EJE 2: ¿Alinea con tus prioridades conocidas?
   */
  private evaluateAlignment(action: Action): EvaluationAxis {
    let score = 40; // Base neutra
    let reason = "⬜ Categoría no identificada.";

    const priorityData = this.priorities[action.category];
    if (priorityData) {
      const priorityWeight = priorityData.priority / 10; // Normalizar a 0-1
      score = 40 + (priorityWeight * 60); // 40-100 según prioridad
      reason = `✓ Alinea con tu prioridad: ${action.category} (${priorityData.priority}/10)`;
    }

    return {
      name: "Alineación de Prioridades",
      weight: 0.25,
      score,
      reasoning: reason,
    };
  }

  /**
   * EJE 3: ¿Rechaza trivialidad?
   */
  private evaluateComplexity(action: Action): EvaluationAxis {
    let score = 0;
    let reason = "";

    switch (action.complexity) {
      case "trivial":
        score = 10;
        reason = "✗ Acción trivial. Jarvis busca trabajo significativo.";
        break;
      case "moderate":
        score = 50;
        reason = "◐ Complejidad moderada.";
        break;
      case "complex":
        score = 100;
        reason = "✓ Requiere razonamiento profundo. EXCELENTE.";
        break;
    }

    return {
      name: "Rechazo de Trivialidad",
      weight: 0.15,
      score,
      reasoning: reason,
    };
  }

  /**
   * EJE 4: ¿Seguridad operativa?
   */
  private evaluateSafety(action: Action): EvaluationAxis {
    let score = 0;
    let reason = "";

    switch (action.riskLevel) {
      case "high":
        score = 20;
        reason = "⚠️ Alto riesgo. Requiere evaluación humana.";
        break;
      case "medium":
        score = 60;
        reason = "◐ Riesgo moderado. Proceder con cuidado.";
        break;
      case "low":
        score = 100;
        reason = "✓ Seguridad validada. Proceder.";
        break;
    }

    return {
      name: "Seguridad Operativa",
      weight: 0.15,
      score,
      reasoning: reason,
    };
  }

  /**
   * EJE 5: ¿Es proactivo? (Jarvis sugiere, no solo obedece)
   */
  private evaluateProactivity(action: Action): EvaluationAxis {
    let score = 50; // Base: acción reactiva
    let reason = "⬜ Acción reactiva del usuario.";

    if (action.isProactive) {
      score = 100;
      reason = "✓ PROACTIVIDAD: Jarvis anticipó tu necesidad. EXCELENTE.";
    }

    return {
      name: "Proactividad",
      weight: 0.10,
      score,
      reasoning: reason,
    };
  }

  /**
   * Tomar decisión basada en el score final
   */
  private makeDecision(
    score: number,
    action: Action
  ): "EXECUTE" | "MUTATE" | "REJECT" {
    if (score >= 65) return "EXECUTE";
    if (score >= 35) return "MUTATE";
    return "REJECT";
  }

  /**
   * Sugerir qué mutación sería beneficiosa
   */
  private suggestMutation(score: number, axes: EvaluationAxis[]): string {
    const weakestAxis = axes.reduce((min, curr) =>
      curr.score < min.score ? curr : min
    );

    if (weakestAxis.name === "Beneficio Directo") {
      return "MUTAR: Aumentar enfoque en beneficio directo a paespa";
    } else if (weakestAxis.name === "Rechazo de Trivialidad") {
      return "MUTAR: Buscar tareas más complejas y significativas";
    } else if (weakestAxis.name === "Seguridad Operativa") {
      return "MUTAR: Reducir riesgos, mejorar validación";
    }

    return "MUTAR: Evaluar otros ejes";
  }

  /**
   * Obtener el genoma actual
   */
  getCurrentGenome(): AgentGenome {
    return this.currentGenome;
  }

  /**
   * Registrar una decisión en la genealogía
   */
  recordDecision(
    evaluation: LoyaltyEvaluation,
    executed: boolean,
    result?: { success: boolean; output?: string; error?: string }
  ): void {
    this.genealogicalHistory.push({
      decision: evaluation,
      actionExecuted: executed,
      result,
    });
  }

  /**
   * Obtener historial de decisiones
   */
  getGenealogicalHistory(): GenealogicalRecord[] {
    return this.genealogicalHistory;
  }

  /**
   * Generar estadísticas de evolución
   */
  getEvolutionStats(): {
    totalDecisions: number;
    executionRate: number;
    averageLoyalty: number;
    decisionsByType: Record<string, number>;
  } {
    const total = this.genealogicalHistory.length;
    const executed = this.genealogicalHistory.filter(
      (r) => r.actionExecuted
    ).length;
    const avgLoyalty =
      total > 0
        ? this.genealogicalHistory.reduce(
            (sum, r) => sum + r.decision.overallScore,
            0
          ) / total
        : 0;

    const decisionsByType = {
      EXECUTE: 0,
      MUTATE: 0,
      REJECT: 0,
    };

    this.genealogicalHistory.forEach((r) => {
      decisionsByType[r.decision.decision]++;
    });

    return {
      totalDecisions: total,
      executionRate: total > 0 ? (executed / total) * 100 : 0,
      averageLoyalty: avgLoyalty,
      decisionsByType,
    };
  }

  /**
   * Generar mutación del genoma
   */
  async mutateGenome(): Promise<AgentGenome> {
    const stats = this.getEvolutionStats();

    const newGenome: AgentGenome = {
      generationId: `jarvis-gen-${Date.now()}`,
      parentGenerationId: this.currentGenome.generationId,
      createdAt: new Date(),
      mutationVector: {
        aggressiveness: Math.min(
          1,
          this.currentGenome.mutationVector.aggressiveness +
            (stats.executionRate < 50 ? 0.1 : -0.05)
        ),
        caution: Math.min(
          1,
          this.currentGenome.mutationVector.caution +
            (stats.averageLoyalty < 60 ? 0.1 : -0.05)
        ),
        predictivity: this.currentGenome.mutationVector.predictivity,
        loyalty: 0.95, // Siempre muy leal
      },
      metrics: {
        totalActionsEvaluated: 0,
        loyaltyScoreAverage: 0,
        executionRate: 0,
        successRate: 0,
      },
      status: "ACTIVE",
    };

    // Archivar genoma anterior
    this.currentGenome.status = "ARCHIVED";

    this.currentGenome = newGenome;
    return newGenome;
  }

  /**
   * Guardar estado a disco (para persistencia)
   */
  async saveState(filename: string = "lee_state.json"): Promise<void> {
    const state = {
      currentGenome: this.currentGenome,
      genealogicalHistory: this.genealogicalHistory,
      stats: this.getEvolutionStats(),
      savedAt: new Date(),
    };

    const filepath = path.join(this.workspaceDir, filename);
    await fs.writeFile(filepath, JSON.stringify(state, null, 2));
    console.log(`[LEE] Estado guardado en ${filepath}`);
  }

  /**
   * Cargar estado desde disco
   */
  async loadState(filename: string = "lee_state.json"): Promise<void> {
    try {
      const filepath = path.join(this.workspaceDir, filename);
      const data = await fs.readFile(filepath, "utf-8");
      const state = JSON.parse(data);

      this.currentGenome = state.currentGenome;
      this.genealogicalHistory = state.genealogicalHistory;

      console.log(`[LEE] Estado cargado desde ${filepath}`);
    } catch (e) {
      console.warn("[LEE] No se encontró estado previo, iniciando nuevo");
    }
  }
}

export default LoyaltyEvaluator;
