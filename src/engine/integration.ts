/**
 * Jarvis Engine Integration
 * 
 * Integrates the new QueryEngine-based architecture with
 * the existing Express server, replacing the basic chat endpoint
 * with the full autonomous engine.
 */

import express from "express";
import { createJarvisEngine, createBuiltinTools, type QueryEngineConfig } from "../engine/jarvis-core.js";
import { createAutonomousSystem, type AutonomousTask } from "../engine/autonomous.js";

export function createEngineRoutes(
  app: express.Express,
  config: {
    workspaceDir: string;
    apiKey: string;
  }
) {
  // Initialize engine
  const engineConfig: QueryEngineConfig = {
    workspaceDir: config.workspaceDir,
    apiKey: config.apiKey,
    autoExecute: true,
  };

  const { engine, executor } = createAutonomousSystem(engineConfig);

  // ============================================
  // ENHANCED CHAT ENDPOINT - Uses QueryEngine
  // ============================================
  app.post("/api/chat", async (req, res) => {
    const { input, context, engine: engineType, role } = req.body;

    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    try {
      console.log(`[Jarvis API] Processing input: ${input.substring(0, 50)}...`);

      // Build context for the query
      const queryContext = {
        role,
        conversationHistory: context || [],
      };

      // Execute query with engine
      const result = await engine.query(input, queryContext);

      // Return response
      const lastMessage = result.messages[result.messages.length - 1];
      
      res.json({
        text: lastMessage?.content || "",
        toolExecutions: result.toolExecutions,
        cost: result.cost,
      });

    } catch (error: any) {
      console.error("[Jarvis API] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AUTONOMOUS TASK ENDPOINT
  // ============================================
  app.post("/api/autonomous", async (req, res) => {
    const { description, goal, constraints, maxSteps, timeout } = req.body;

    if (!description || !goal) {
      return res.status(400).json({ error: "Description and goal are required" });
    }

    try {
      console.log(`[Jarvis API] Starting autonomous task: ${description}`);

      const task: AutonomousTask = {
        id: `task_${Date.now()}`,
        description,
        goal,
        constraints,
        maxSteps,
        timeout,
      };

      const result = await executor.executeTask(task);

      res.json(result);

    } catch (error: any) {
      console.error("[Jarvis API] Autonomous task error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MULTI-AGENT ENDPOINT
  // ============================================
  app.post("/api/multi-agent", async (req, res) => {
    const { description, goal } = req.body;

    if (!description || !goal) {
      return res.status(400).json({ error: "Description and goal are required" });
    }

    try {
      console.log(`[Jarvis API] Starting multi-agent task: ${description}`);

      // Create multi-agent harness
      const plannerEngine = createJarvisEngine({
        ...engineConfig,
        systemPrompt: "Eres el Planificador de Jarvis. Divide tareas complejas en pasos accionables.",
      });

      const generatorEngine = createJarvisEngine({
        ...engineConfig,
        systemPrompt: "Eres el Generador de Jarvis. Implementa planes con código y acciones concretas.",
      });

      const evaluatorEngine = createJarvisEngine({
        ...engineConfig,
        systemPrompt: "Eres el Evaluador de Jarvis. Sé escéptico y crítico. Encuentra fallos y problemas.",
      });

      const { MultiAgentHarness } = await import("../engine/autonomous.js");
      const harness = new MultiAgentHarness({
        plannerEngine,
        generatorEngine,
        evaluatorEngine,
      });

      const result = await harness.executeWithAgents({ description, goal });

      res.json(result);

    } catch (error: any) {
      console.error("[Jarvis API] Multi-agent error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ENGINE STATUS ENDPOINT
  // ============================================
  app.get("/api/engine/status", (req, res) => {
    res.json({
      status: "online",
      executor: executor.getStatus(),
      engine: "QueryEngine v2.0 (Motor Autónomo Jarvis IA)",
    });
  });

  // ============================================
  // RESET ENGINE ENDPOINT
  // ============================================
  app.post("/api/engine/reset", (req, res) => {
    engine.clearHistory();
    executor.stop();
    
    res.json({
      success: true,
      message: "Engine reset successfully",
    });
  });

  console.log("[Jarvis API] Enhanced engine routes initialized");
  
  return { engine, executor };
}
