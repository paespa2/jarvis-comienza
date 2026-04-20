/**
 * DEMO FASE 4: META-LEARNING Y EVOLUCIÓN DE MODELOS
 *
 * Demostración completa del sistema de meta-learning
 * desde recolección de datos hasta despliegue automático.
 */

import { ModelEvolutionOrchestrator } from './modelEvolution/modelEvolutionOrchestrator';
import { DatasetBuilder } from './modelEvolution/dataCollection/datasetBuilder';
import { ModelOptimizer } from './modelEvolution/optimization/modelOptimizer';
import { FineTuner } from './modelEvolution/training/fineTuner';
import { ModelEvaluator } from './modelEvolution/evaluation/modelEvaluator';
import { ABTestingFramework } from './modelEvolution/testing/abTestingFramework';
import { CostAnalyzer } from './modelEvolution/optimization/costAnalyzer';
import { ModelVariant, TrainingDataPoint } from './modelEvolution/modelTypes';

/**
 * DEMO 1: Recolección Automática de Datos
 */
async function demo1_DataCollection() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 1: RECOLECCIÓN AUTOMÁTICA DE DATOS`);
  console.log(`${'='.repeat(70)}\n`);

  const datasetBuilder = new DatasetBuilder();

  // Simular 5 interacciones exitosas
  const interactions = [
    {
      query: "Implement user authentication with JWT",
      context: { projectType: "backend" },
      agent: "DeveloperAgent",
      tools: ["CodeGenerator", "APITester"],
      response: "Implemented JWT authentication with refresh tokens...",
      time: 1200,
      iterations: 2,
    },
    {
      query: "Find SQL injection vulnerabilities",
      context: { targetFile: "api/auth.js" },
      agent: "SecurityAuditAgent",
      tools: ["VulnerabilityScanner", "SQLAnalyzer"],
      response: "Found 2 SQL injection vulnerabilities in login endpoint...",
      time: 1500,
      iterations: 3,
    },
    {
      query: "Implement JWT authentication with JWT",
      context: { projectType: "backend" },
      agent: "DeveloperAgent",
      tools: ["CodeGenerator"],
      response: "JWT implementation with proper error handling...",
      time: 950,
      iterations: 2,
    },
    {
      query: "Write comprehensive API documentation",
      context: { apiVersion: "v2" },
      agent: "DocumentationWriterAgent",
      tools: ["DocGenerator", "CodeAnalyzer"],
      response: "Created comprehensive API docs with examples...",
      time: 2000,
      iterations: 2,
    },
    {
      query: "Find SQL injection vulnerabilities",
      context: { targetFile: "api/users.js" },
      agent: "SecurityAuditAgent",
      tools: ["VulnerabilityScanner"],
      response: "Scanned database queries, no vulnerabilities found...",
      time: 1200,
      iterations: 2,
    },
  ];

  console.log(`📊 Capturando ${interactions.length} interacciones exitosas:\n`);

  const trainingData: TrainingDataPoint[] = [];
  interactions.forEach((interaction, i) => {
    const dataPoint = datasetBuilder.captureSuccessfulInteraction(
      interaction.query,
      interaction.context,
      interaction.agent,
      interaction.tools,
      interaction.response,
      interaction.time,
      interaction.iterations
    );

    if (dataPoint) {
      trainingData.push(dataPoint);
      console.log(
        `   ${i + 1}. ✅ ${interaction.query.substring(0, 40)}...`
      );
    }
  });

  console.log(
    `\n✅ Dataset colectado: ${trainingData.length} puntos de entrenamiento`
  );

  return trainingData;
}

/**
 * DEMO 2: Análisis del Dataset
 */
async function demo2_DataAnalysis(trainingData: TrainingDataPoint[]) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 2: ANÁLISIS DEL DATASET`);
  console.log(`${'='.repeat(70)}\n`);

  const optimizer = new ModelOptimizer();

  console.log(`📊 Analizando ${trainingData.length} puntos de datos...\n`);

  const analysis = optimizer.analyzeDataset(trainingData);

  console.log(`\n🔍 ANÁLISIS COMPLETADO:`);
  console.log(`   Categorías encontradas:`);
  analysis.byCategory.forEach((count, category) => {
    console.log(`      - ${category}: ${count} puntos`);
  });

  console.log(`\n📈 Distribución de Calidad:`);
  console.log(`   Excelente (90-100): ${analysis.qualityDistribution.excellent}`);
  console.log(`   Buena (80-89): ${analysis.qualityDistribution.good}`);
  console.log(`   Aceptable (70-79): ${analysis.qualityDistribution.acceptable}`);
  console.log(`   Pobre (<70): ${analysis.qualityDistribution.poor}`);

  console.log(`\n💡 Estrategia Recomendada:`);
  const strategy = optimizer.generateOptimizationStrategy(analysis);
  console.log(`   ${strategy.recommendedApproach}`);
  console.log(`   Mejora esperada: +${strategy.expectedImprovement.toFixed(1)}%`);
  console.log(`   Dificultad: ${strategy.difficulty}`);

  return strategy;
}

/**
 * DEMO 3: Fine-Tuning Automático
 */
async function demo3_FinetuningTraining(
  trainingData: TrainingDataPoint[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 3: FINE-TUNING AUTOMÁTICO DEL MODELO`);
  console.log(`${'='.repeat(70)}\n`);

  const fineTuner = new FineTuner();
  const baselineAccuracy = 0.75;

  const session = fineTuner.startTrainingSession(
    trainingData,
    'personalized-model-gen-1',
    {
      epochs: 3,
      batchSize: 32,
      learningRate: 0.0001,
    }
  );

  console.log(`🏋️ Iniciando entrenamiento...\n`);

  const result = await fineTuner.trainModel(
    session,
    trainingData,
    baselineAccuracy
  );

  console.log(`\n✅ ENTRENAMIENTO COMPLETADO`);
  console.log(`   Accuracy Final: ${(result.finalAccuracy * 100).toFixed(2)}%`);
  console.log(
    `   Mejora sobre baseline: +${result.improvementOverBase.toFixed(2)}%`
  );
  console.log(`   Éxito: ${result.success ? 'SÍ ✓' : 'NO ✗'}`);

  return result;
}

/**
 * DEMO 4: Evaluación del Modelo
 */
async function demo4_ModelEvaluation(
  trainingResult: any,
  baselineAccuracy: number,
  trainingData: TrainingDataPoint[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 4: EVALUACIÓN DEL MODELO PERSONALIZADO`);
  console.log(`${'='.repeat(70)}\n`);

  const evaluator = new ModelEvaluator();

  // Crear modelos simulados
  const baseModel: ModelVariant = {
    id: 'base-model',
    name: 'Claude 3.5 Sonnet',
    type: 'base',
    baseModel: 'claude-3.5-sonnet',
    version: '1.0',
    metrics: {
      averageLatency: 500,
      qualityScore: 75,
      costPerRequest: 0.003,
      tokensPerRequest: 800,
      successRate: baselineAccuracy,
    },
    isActive: true,
    createdAt: Date.now(),
    trainedOn: 0,
    generations: 0,
  };

  const personalizedModel: ModelVariant = {
    id: `personalized-${Date.now()}`,
    name: 'Personalized Model Gen 1',
    type: 'finetuned',
    baseModel: 'claude-3.5-sonnet',
    version: '1.0-ft',
    metrics: {
      averageLatency: 450, // 10% faster
      qualityScore: trainingResult.finalAccuracy * 100,
      costPerRequest: 0.0024, // 20% cheaper
      tokensPerRequest: 800,
      successRate: trainingResult.finalAccuracy,
    },
    isActive: false,
    createdAt: Date.now(),
    trainedOn: trainingData.length,
    generations: 1,
  };

  console.log(`📊 Evaluando modelo personalizado...\n`);

  const report = evaluator.evaluateModel(
    personalizedModel,
    trainingData.slice(Math.floor(trainingData.length * 0.8)),
    baseModel
  );

  console.log(`\n✅ EVALUACIÓN COMPLETADA`);
  console.log(
    `   Listo para producción: ${report.readyForProduction ? 'SÍ ✓' : 'NO ✗'}`
  );
  console.log(`   Score de confianza: ${(report.confidenceScore * 100).toFixed(0)}%`);

  return { baseModel, personalizedModel, report };
}

/**
 * DEMO 5: A/B Testing
 */
async function demo5_ABTesting(
  baseModel: ModelVariant,
  personalizedModel: ModelVariant,
  trainingData: TrainingDataPoint[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 5: A/B TESTING ESTADÍSTICO`);
  console.log(`${'='.repeat(70)}\n`);

  const abTesting = new ABTestingFramework();

  console.log(
    `🧪 Comparando Modelo Base vs Personalizado (${Math.min(50, trainingData.length)} muestras)...\n`
  );

  const result = abTesting.startABTest(
    baseModel,
    personalizedModel,
    trainingData,
    {
      sampleSize: Math.min(50, trainingData.length),
      confidenceLevel: 0.95,
      minimalImprovement: 3,
    }
  );

  console.log(`\n✅ A/B TEST COMPLETADO`);
  console.log(`   Ganador: ${result.winner === 'B' ? 'Modelo Personalizado ✓' : 'Modelo Base'}`);
  console.log(
    `   Mejora: ${result.improvementPercent > 0 ? '+' : ''}${result.improvementPercent.toFixed(2)}%`
  );
  console.log(
    `   P-value: ${result.pValue.toFixed(4)} (significativo: ${result.statisticalSignificance ? 'SÍ' : 'NO'})`
  );
  console.log(
    `   Listo para despliegue: ${result.readyToDeploy ? 'SÍ ✓' : 'NO ✗'}`
  );

  return result;
}

/**
 * DEMO 6: Análisis de Costos
 */
async function demo6_CostAnalysis(
  baseModel: ModelVariant,
  personalizedModel: ModelVariant,
  trainingData: TrainingDataPoint[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 6: ANÁLISIS DE COSTOS Y ROI`);
  console.log(`${'='.repeat(70)}\n`);

  const costAnalyzer = new CostAnalyzer();

  console.log(`💰 Analizando costos de modelo personalizado...\n`);

  const analysis = costAnalyzer.analyzeCosts(
    baseModel,
    personalizedModel,
    trainingData,
    'month'
  );

  console.log(`\n✅ ANÁLISIS DE COSTOS COMPLETADO`);
  console.log(
    `   Ahorros mensuales: $${analysis.savings.amountUSD.toFixed(2)}`
  );
  console.log(
    `   Reducción: ${analysis.savings.percentageReduction.toFixed(1)}%`
  );

  const projections = costAnalyzer.projectCosts(
    baseModel,
    personalizedModel,
    trainingData,
    ['month', 'year']
  );

  console.log(`\n📈 Proyecciones:`);
  projections.forEach(proj => {
    console.log(`   ${proj.period.toUpperCase()}`);
    console.log(`      ROI: ${proj.roi.toFixed(1)}%`);
    console.log(`      Ahorros: $${proj.totalSavings.toFixed(2)}`);
  });
}

/**
 * DEMO 7: Pipeline Completo
 */
async function demo7_CompletePipeline() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DEMO 7: PIPELINE COMPLETO DE EVOLUCIÓN`);
  console.log(`${'='.repeat(70)}\n`);

  const orchestrator = new ModelEvolutionOrchestrator();

  // Simular dataset de entrenamiento
  const trainingData: TrainingDataPoint[] = [];
  for (let i = 0; i < 50; i++) {
    trainingData.push({
      id: `dp-${i}`,
      timestamp: Date.now() - Math.random() * 10000,
      userQuery: 'Security audit task',
      context: {},
      agentUsed: 'SecurityAuditAgent',
      toolsUsed: ['VulnerabilityScanner'],
      executionTime: 800 + Math.random() * 400,
      iterationsUsed: 2 + Math.floor(Math.random() * 2),
      response: 'Audit completed',
      qualityScore: 80 + Math.random() * 15,
      successfulOutcome: true,
      taskCategory: 'security',
      complexity: 'moderate',
    });
  }

  const baseModel: ModelVariant = {
    id: 'base-model',
    name: 'Claude Base',
    type: 'base',
    baseModel: 'claude-3.5-sonnet',
    version: '1.0',
    metrics: {
      averageLatency: 500,
      qualityScore: 75,
      costPerRequest: 0.003,
      tokensPerRequest: 800,
      successRate: 0.75,
    },
    isActive: true,
    createdAt: Date.now(),
    trainedOn: 0,
    generations: 0,
  };

  console.log(`🚀 Ejecutando pipeline completo de evolución...\n`);

  const pipeline = await orchestrator.runEvolutionPipeline(
    trainingData,
    baseModel
  );

  console.log(`\n✅ PIPELINE COMPLETADO`);
  console.log(`   Estado: ${pipeline.status}`);
  console.log(`   Duración: ${((pipeline.endTime || 0) - pipeline.startTime) / 1000}s`);

  const stats = orchestrator.getStatistics();
  console.log(`\n📊 ESTADÍSTICAS FINALES:`);
  console.log(`   Generación: ${stats.generation}`);
  console.log(`   Datos de entrenamiento: ${stats.totalDataPoints}`);
  console.log(`   Modelos creados: ${stats.modelVariants}`);
  console.log(`   Pipelines completados: ${stats.completedPipelines}`);
}

/**
 * EJECUTAR TODOS LOS DEMOS
 */
async function runAllDemos() {
  console.log(`\n`);
  console.log(`${'█'.repeat(70)}`);
  console.log(`█ JARVIS META-LEARNING DEMOS (FASE 4)`);
  console.log(`█ Sistema de evolución automática de modelos`);
  console.log(`${'█'.repeat(70)}`);

  try {
    // Demo 1
    const trainingData = await demo1_DataCollection();

    // Demo 2
    await demo2_DataAnalysis(trainingData);

    // Demo 3
    const trainingResult = await demo3_FinetuningTraining(trainingData);

    // Demo 4
    const { baseModel, personalizedModel, report } =
      await demo4_ModelEvaluation(trainingResult, 0.75, trainingData);

    // Demo 5
    await demo5_ABTesting(baseModel, personalizedModel, trainingData);

    // Demo 6
    await demo6_CostAnalysis(baseModel, personalizedModel, trainingData);

    // Demo 7
    await demo7_CompletePipeline();

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎉 TODOS LOS DEMOS COMPLETADOS EXITOSAMENTE`);
    console.log(`${'='.repeat(70)}\n`);

    console.log(`
✅ JARVIS FASE 4 DEMOSTRADO:
   ✓ Recolección automática de datos
   ✓ Análisis inteligente del dataset
   ✓ Fine-tuning con early stopping
   ✓ Evaluación completa del modelo
   ✓ A/B testing estadístico
   ✓ Análisis de costos y ROI
   ✓ Pipeline de evolución automática

🚀 El sistema está listo para:
   • Evolucionar continuamente
   • Aprender de sus propias ejecuciones
   • Optimizar costos automáticamente
   • Desplegar modelos mejorados
   • Mantener garantías constitucionales

📊 Próximo paso: FASE 5 - Integraciones
    `);
  } catch (error) {
    console.error(`\n❌ Error en demos:`, error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export { runAllDemos };
