/**
 * A/B TESTING FRAMEWORK
 *
 * Compara dos modelos (A vs B) usando metodología estadística rigurosa
 * para determinar cuál es superior con un nivel de confianza dado.
 */

import { ABTest, ModelVariant, TrainingDataPoint } from '../modelTypes';
import { v4 as uuidv4 } from 'uuid';

export interface ABTestConfig {
  sampleSize: number; // Número de ejemplos a probar
  confidenceLevel: number; // 0.9, 0.95, 0.99
  minimalImprovement: number; // % mínima para considerar ganador
  timeout: number; // ms máximo para el test
}

export interface ABTestResult {
  testId: string;
  modelA: { id: string; name: string };
  modelB: { id: string; name: string };
  samplesUsed: number;
  durationMs: number;

  // Scores
  modelA_avgScore: number;
  modelB_avgScore: number;
  modelA_stdDev: number;
  modelB_stdDev: number;

  // Resultados estadísticos
  winner?: 'A' | 'B' | 'tie';
  winnerName?: string;
  improvementPercent: number; // % de mejora del ganador
  pValue: number; // Significancia estadística
  statisticalSignificance: boolean; // p < alpha
  confidenceInterval: [number, number]; // Intervalo de confianza para la diferencia

  // Análisis de costo-beneficio
  costA_Total: number; // Costo total de A
  costB_Total: number; // Costo total de B
  costSavings?: number; // Ahorros si cambiar a B

  // Recomendación
  recommendation: string;
  readyToDeploy: boolean;
}

export class ABTestingFramework {
  private tests: Map<string, ABTestResult> = new Map();

  private defaultConfig: ABTestConfig = {
    sampleSize: 100,
    confidenceLevel: 0.95,
    minimalImprovement: 3, // 3% mínimo
    timeout: 60000, // 1 minuto
  };

  /**
   * INICIAR TEST A/B
   */
  startABTest(
    modelA: ModelVariant,
    modelB: ModelVariant,
    testData: TrainingDataPoint[],
    config: Partial<ABTestConfig> = {}
  ): ABTestResult {
    const finalConfig = { ...this.defaultConfig, ...config };

    console.log(`\n🧪 INICIANDO A/B TEST`);
    console.log(`   Modelo A: ${modelA.name}`);
    console.log(`   Modelo B: ${modelB.name}`);
    console.log(`   Sample Size: ${finalConfig.sampleSize}`);
    console.log(`   Confidence Level: ${(finalConfig.confidenceLevel * 100).toFixed(0)}%`);
    console.log(`   Minimal Improvement: ${finalConfig.minimalImprovement}%`);
    console.log('');

    const startTime = Date.now();

    // Seleccionar muestras aleatoriamente
    const samples = this.selectRandomSamples(
      testData,
      finalConfig.sampleSize
    );

    // Simular resultados de modelo A
    const scoresA = samples.map(sample =>
      this.simulateModelScore(modelA, sample)
    );

    // Simular resultados de modelo B
    const scoresB = samples.map(sample =>
      this.simulateModelScore(modelB, sample)
    );

    // Calcular estadísticas
    const avgA = this.calculateMean(scoresA);
    const avgB = this.calculateMean(scoresB);
    const stdDevA = this.calculateStdDev(scoresA, avgA);
    const stdDevB = this.calculateStdDev(scoresB, avgB);

    // Test t-Student para dos muestras independientes
    const tStatistic = this.calculateTStatistic(
      scoresA,
      scoresB,
      avgA,
      avgB,
      stdDevA,
      stdDevB
    );

    // Calcular p-value
    const pValue = this.calculatePValue(
      tStatistic,
      samples.length + samples.length - 2
    );

    // Determinar significancia
    const alpha = 1 - finalConfig.confidenceLevel;
    const statisticalSignificance = pValue < alpha;

    // Calcular intervalo de confianza para la diferencia
    const difference = avgB - avgA;
    const seeDifference = Math.sqrt(
      (stdDevA ** 2) / scoresA.length + (stdDevB ** 2) / scoresB.length
    );
    const zScore = this.getZScore(finalConfig.confidenceLevel);
    const marginOfError = zScore * seeDifference;
    const confidenceInterval: [number, number] = [
      difference - marginOfError,
      difference + marginOfError,
    ];

    // Determinar ganador
    let winner: 'A' | 'B' | 'tie' | undefined;
    let winnerName: string | undefined;

    if (statisticalSignificance) {
      if (avgB > avgA) {
        const improvement = ((avgB - avgA) / avgA) * 100;
        if (improvement >= finalConfig.minimalImprovement) {
          winner = 'B';
          winnerName = modelB.name;
        } else {
          winner = 'tie';
        }
      } else {
        const improvement = ((avgA - avgB) / avgB) * 100;
        if (improvement >= finalConfig.minimalImprovement) {
          winner = 'A';
          winnerName = modelA.name;
        } else {
          winner = 'tie';
        }
      }
    } else {
      winner = 'tie';
    }

    // Calcular costos y ahorros
    const costA_Total = (samples.length * modelA.metrics.costPerRequest);
    const costB_Total = (samples.length * modelB.metrics.costPerRequest);
    const costSavings = Math.max(0, costA_Total - costB_Total);

    // Generar recomendación
    const recommendation = this.generateRecommendation(
      winner,
      avgA,
      avgB,
      statisticalSignificance,
      costSavings,
      pValue
    );

    // Determinar si está listo para deploy
    const readyToDeploy =
      winner === 'B' &&
      statisticalSignificance &&
      avgB > 80 &&
      costSavings >= 0;

    const result: ABTestResult = {
      testId: `abtest-${uuidv4()}`,
      modelA: { id: modelA.id, name: modelA.name },
      modelB: { id: modelB.id, name: modelB.name },
      samplesUsed: samples.length,
      durationMs: Date.now() - startTime,
      modelA_avgScore: avgA,
      modelB_avgScore: avgB,
      modelA_stdDev: stdDevA,
      modelB_stdDev: stdDevB,
      winner,
      winnerName,
      improvementPercent: winner === 'B'
        ? ((avgB - avgA) / avgA) * 100
        : winner === 'A'
        ? ((avgA - avgB) / avgB) * 100
        : 0,
      pValue,
      statisticalSignificance,
      confidenceInterval,
      costA_Total,
      costB_Total,
      costSavings,
      recommendation,
      readyToDeploy,
    };

    this.tests.set(result.testId, result);
    this.printABTestResult(result);

    return result;
  }

  /**
   * SIMULAR SCORE DE MODELO
   */
  private simulateModelScore(
    model: ModelVariant,
    sample: TrainingDataPoint
  ): number {
    // Score base del modelo
    const modelQuality = model.metrics.qualityScore;

    // Ajuste por calidad del sample
    const sampleQuality = sample.qualityScore;

    // Score simulado (media ponderada con ruido)
    const baseScore = (modelQuality * 0.6 + sampleQuality * 0.4);

    // Agregar ruido realista (distribución normal)
    const noise = this.generateGaussian(0, 5);

    return Math.max(0, Math.min(100, baseScore + noise));
  }

  /**
   * SELECCIONAR MUESTRAS ALEATORIAS
   */
  private selectRandomSamples(
    data: TrainingDataPoint[],
    sampleSize: number
  ): TrainingDataPoint[] {
    const size = Math.min(sampleSize, data.length);
    const selected: TrainingDataPoint[] = [];

    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      selected.push(data[randomIndex]);
    }

    return selected;
  }

  /**
   * CALCULAR MEDIA
   */
  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * CALCULAR DESVIACIÓN ESTÁNDAR
   */
  private calculateStdDev(values: number[], mean: number): number {
    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * CALCULAR ESTADÍSTICO T
   */
  private calculateTStatistic(
    samplesA: number[],
    samplesB: number[],
    meanA: number,
    meanB: number,
    stdDevA: number,
    stdDevB: number
  ): number {
    const nA = samplesA.length;
    const nB = samplesB.length;

    const pooledVariance =
      ((nA - 1) * stdDevA ** 2 + (nB - 1) * stdDevB ** 2) / (nA + nB - 2);

    const standardError = Math.sqrt(pooledVariance * (1 / nA + 1 / nB));

    return (meanB - meanA) / standardError;
  }

  /**
   * CALCULAR P-VALUE (aproximación)
   */
  private calculatePValue(tStatistic: number, degreesOfFreedom: number): number {
    // Usar aproximación normal para df > 30
    if (degreesOfFreedom > 30) {
      const absT = Math.abs(tStatistic);
      // Aproximación de la CDF normal
      // Abramowitz & Stegun approximation for erf
      const x = absT / Math.sqrt(2);
      const t2 = 1 / (1 + 0.3275911 * x);
      const erf = 1 - (0.254829592 * t2 - 0.284496736 * t2 ** 2 + 1.421413741 * t2 ** 3 - 1.453152027 * t2 ** 4 + 1.061405429 * t2 ** 5) * Math.exp(-x * x);
      const phi = 0.5 * (1 + erf);
      return 2 * (1 - phi);
    }

    // Para df < 30, usar aproximación conservadora
    const absT = Math.abs(tStatistic);
    if (absT > 2.576) return 0.01;
    if (absT > 1.96) return 0.05;
    if (absT > 1.645) return 0.1;
    return 0.2;
  }

  /**
   * OBTENER Z-SCORE
   */
  private getZScore(confidenceLevel: number): number {
    if (confidenceLevel === 0.99) return 2.576;
    if (confidenceLevel === 0.95) return 1.96;
    if (confidenceLevel === 0.9) return 1.645;
    return 1.96; // default
  }

  /**
   * GENERAR GAUSSIANA
   */
  private generateGaussian(mean: number, stdDev: number): number {
    let u1 = 0;
    let u2 = 0;

    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    return mean + stdDev * z0;
  }

  /**
   * FUNCIÓN ERROR
   */
  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * GENERAR RECOMENDACIÓN
   */
  private generateRecommendation(
    winner: string | undefined,
    scoreA: number,
    scoreB: number,
    significant: boolean,
    costSavings: number,
    pValue: number
  ): string {
    if (winner === 'B') {
      return `✅ Modelo B es significativamente mejor (p=${pValue.toFixed(4)}). Desplegar inmediatamente. Ahorros potenciales: $${costSavings.toFixed(4)}`;
    } else if (winner === 'A') {
      return `✅ Modelo A mantiene superioridad. Continuar con A.`;
    } else {
      return `⚠️ Diferencia no estadísticamente significativa. Aumentar tamaño de muestra o usar modelo actual.`;
    }
  }

  /**
   * IMPRIMIR RESULTADOS
   */
  private printABTestResult(result: ABTestResult): void {
    console.log(`\n📊 A/B TEST RESULTS`);
    console.log(`   Test ID: ${result.testId.slice(0, 12)}...`);
    console.log(`   Samples: ${result.samplesUsed}`);
    console.log(`   Duration: ${result.durationMs}ms`);
    console.log('');
    console.log(`   📈 Modelo A: ${result.modelA.name}`);
    console.log(`      Score: ${result.modelA_avgScore.toFixed(2)} ± ${result.modelA_stdDev.toFixed(2)}`);
    console.log(`      Cost: $${result.costA_Total.toFixed(4)}`);
    console.log('');
    console.log(`   📈 Modelo B: ${result.modelB.name}`);
    console.log(`      Score: ${result.modelB_avgScore.toFixed(2)} ± ${result.modelB_stdDev.toFixed(2)}`);
    console.log(`      Cost: $${result.costB_Total.toFixed(4)}`);
    console.log('');
    console.log(`   🎯 Winner: ${result.winner || 'TBD'} (${result.winnerName || 'None'})`);
    console.log(
      `   📊 Improvement: ${result.improvementPercent > 0 ? '+' : ''}${result.improvementPercent.toFixed(2)}%`
    );
    console.log(`   📉 P-Value: ${result.pValue.toFixed(4)}`);
    console.log(
      `   ✓ Statistical Significance: ${result.statisticalSignificance}`
    );
    console.log(`   💾 Confidence Interval: [${result.confidenceInterval[0].toFixed(2)}, ${result.confidenceInterval[1].toFixed(2)}]`);
    console.log('');
    console.log(`   ${result.readyToDeploy ? '✅' : '⚠️'} Ready to Deploy: ${result.readyToDeploy}`);
    console.log(`   💡 Recommendation: ${result.recommendation}`);
  }

  /**
   * OBTENER RESULTADO DE TEST
   */
  getTestResult(testId: string): ABTestResult | undefined {
    return this.tests.get(testId);
  }

  /**
   * OBTENER TODOS LOS TESTS
   */
  getAllTests(): ABTestResult[] {
    return Array.from(this.tests.values());
  }

  /**
   * OBTENER ESTADÍSTICAS DE TESTS
   */
  getTestStatistics() {
    const allTests = this.getAllTests();

    const totalTests = allTests.length;
    const decisiveTests = allTests.filter(t => t.winner !== 'tie').length;
    const modelAWins = allTests.filter(t => t.winner === 'A').length;
    const modelBWins = allTests.filter(t => t.winner === 'B').length;
    const avgImprovement =
      allTests.reduce((sum, t) => sum + t.improvementPercent, 0) / Math.max(1, totalTests);

    return {
      totalTests,
      decisiveTests,
      modelAWins,
      modelBWins,
      avgImprovement,
      deploymentReady: allTests.filter(t => t.readyToDeploy).length,
    };
  }
}
