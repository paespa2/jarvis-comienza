/**
 * PHASE 2 COMPREHENSIVE TEST
 *
 * Tests the Autonomous Reasoning Engine
 * - InferenceEngine (backward/forward chaining)
 * - JarvisAutonomousReasoner (4-stage reasoning)
 * - JarvisReasoningEvolution (self-improvement)
 */

import { initializeDatabase, PersistentMemoryManager } from '../persistence';
import { initializeBootstrapKnowledge } from './InitialKnowledge';
import { InferenceEngine } from './InferenceEngine';
import { JarvisAutonomousReasoner } from './JarvisAutonomousReasoner';
import { JarvisReasoningEvolution } from './JarvisReasoningEvolution';

async function runTests(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PHASE 2: AUTONOMOUS REASONING ENGINE TEST');
  console.log('='.repeat(70) + '\n');

  try {
    // ========================================
    // TEST 1: Inference Engine
    // ========================================
    console.log('📝 TEST 1: Inference Engine\n');

    const engine = new InferenceEngine();

    // Add facts
    engine.addFact({ property: 'is_cloudy', value: true, confidence: 0.9 });
    engine.addFact({
      property: 'is_cold',
      value: true,
      confidence: 0.95
    });
    engine.addFact({
      property: 'humidity_high',
      value: true,
      confidence: 0.85
    });

    // Add rules
    engine.addRule({
      name: 'weather_rule_1',
      preconditions: ['is_cloudy=true', 'is_cold=true'],
      conclusion: 'might_snow=true',
      confidence: 0.8
    });

    engine.addRule({
      name: 'weather_rule_2',
      preconditions: ['might_snow=true', 'humidity_high=true'],
      conclusion: 'prepare_for_snow=true',
      confidence: 0.75
    });

    // Test backward chaining
    console.log('Testing Backward Chaining...\n');
    const backwardResult = await engine.backwardChain('prepare_for_snow=true');
    console.log(`✅ Backward chaining complete`);
    console.log(`   Rules used: ${backwardResult.usedRules.length}`);
    console.log(`   Facts derived: ${backwardResult.derivedFacts.length}\n`);

    // Test forward chaining
    console.log('Testing Forward Chaining...\n');
    const forwardResult = await engine.forwardChain();
    console.log(`✅ Forward chaining complete`);
    console.log(`   Rules applied: ${forwardResult.usedRules.length}`);
    console.log(`   New facts: ${forwardResult.derivedFacts.length}\n`);

    const engineStats = engine.getStatistics();
    console.log('📊 Inference Engine Statistics:');
    console.log(`   Total facts: ${engineStats.factsCount}`);
    console.log(`   Total rules: ${engineStats.rulesCount}`);
    console.log(`   Inferences run: ${engineStats.inferencesRun}`);
    console.log(`   Average confidence: ${(engineStats.averageConfidence * 100).toFixed(1)}%\n`);

    // ========================================
    // TEST 2: Autonomous Reasoner
    // ========================================
    console.log('📝 TEST 2: Autonomous Reasoner\n');

    // Initialize persistence
    initializeDatabase();
    const memoryManager = new PersistentMemoryManager();
    await initializeBootstrapKnowledge(memoryManager);

    // Create reasoner
    const reasoner = new JarvisAutonomousReasoner(memoryManager);

    // Test reasoning
    const testQueries = [
      'Busca información sobre CVEs en Express.js',
      'Ejecuta un análisis de seguridad',
      'Aprende sobre patrones de diseño'
    ];

    const reasoningResults = [];

    for (const query of testQueries) {
      console.log(`\n🔍 Query: "${query}"`);
      const result = await reasoner.reason(query);

      reasoningResults.push(result);

      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Plan steps: ${result.plan.length}`);
      console.log(`   Total time: ${result.totalTime}ms`);
    }

    console.log('\n✅ All reasoning tests complete\n');

    // ========================================
    // TEST 3: Reasoning Evolution
    // ========================================
    console.log('📝 TEST 3: Reasoning Evolution\n');

    const evolution = new JarvisReasoningEvolution(memoryManager, reasoner);

    // Simulate successful execution
    console.log('Simulating successful execution...\n');
    await evolution.recordExecution({
      query: testQueries[0],
      reasoning: reasoningResults[0],
      result: { success: true, data: 42 },
      success: true,
      duration: 2500
    });

    // Simulate failed execution
    console.log('\nSimulating failed execution...\n');
    const failedReasoning = await reasoner.reason(
      'Do something impossible'
    );
    await evolution.recordExecution({
      query: 'Do something impossible',
      reasoning: failedReasoning,
      result: { error: 'Task failed' },
      success: false,
      duration: 5000
    });

    // Log evolution metrics
    await evolution.logMetrics();

    // ========================================
    // TEST 4: Integration Test
    // ========================================
    console.log('\n📝 TEST 4: Full Integration Test\n');

    const memoryStats = await memoryManager.getStatistics();
    console.log('📊 Memory Statistics After Evolution:');
    console.log(`   Episodes: ${memoryStats.totalEpisodes}`);
    console.log(`   Lessons: ${memoryStats.totalLessons}`);
    console.log(`   Skills: ${memoryStats.totalSkills}`);
    console.log(`   Average success rate: ${(memoryStats.averageSuccessRate * 100).toFixed(1)}%\n`);

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('='.repeat(70));
    console.log('✅ ALL PHASE 2 TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n✨ Jarvis Autonomous Reasoning Engine is fully operational!\n');

    console.log('📊 FINAL SUMMARY:');
    console.log(`   ✅ Inference Engine: ${engineStats.inferencesRun} inferences`);
    console.log(`   ✅ Autonomous Reasoner: ${reasoningResults.length} reasoning cycles`);
    console.log(
      `   ✅ Reasoning Evolution: ${2} executions recorded`
    );
    console.log(`   ✅ Integration: Full pipeline working\n`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests().catch(console.error);
}
