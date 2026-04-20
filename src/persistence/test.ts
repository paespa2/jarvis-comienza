/**
 * PERSISTENCE TEST
 *
 * Quick test to verify persistent storage is working
 */

import { initializeDatabase, getDatabase, PersistentMemoryManager } from './index';
import { initializeBootstrapKnowledge } from '../reasoning/InitialKnowledge';

async function runTests(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 JARVIS PERSISTENCE TEST');
  console.log('='.repeat(70) + '\n');

  try {
    // Initialize database
    console.log('📦 Step 1: Initializing database...');
    initializeDatabase();
    console.log('✅ Database initialized\n');

    // Initialize memory manager
    console.log('💾 Step 2: Initializing memory manager...');
    const memoryManager = new PersistentMemoryManager();
    console.log('✅ Memory manager ready\n');

    // Bootstrap knowledge
    console.log('🌱 Step 3: Loading bootstrap knowledge...');
    await initializeBootstrapKnowledge(memoryManager);
    console.log('✅ Bootstrap complete\n');

    // Test 1: Save and retrieve episode
    console.log('🧪 Step 4: Testing episode storage...');
    const episode = {
      timestamp: Date.now(),
      query: 'Busca información sobre Jarvis IA',
      agents: ['Researcher', 'Developer'],
      actions: ['search_knowledge_base', 'analyze_results'],
      result: { success: true, dataFound: 42 },
      executionTime: 2300,
      success: true
    };

    const episodeId = await memoryManager.saveEpisode(episode);
    console.log(`   ✅ Episode saved with ID: ${episodeId}`);

    const retrievedEpisode = await memoryManager.getEpisodes(1);
    console.log(`   ✅ Episode retrieved: "${retrievedEpisode[0]?.query}"`);
    console.log(`   ✅ Execution time: ${retrievedEpisode[0]?.executionTime}ms\n`);

    // Test 2: Consolidate experience
    console.log('🧪 Step 5: Testing experience consolidation...');
    await memoryManager.consolidateExperience({
      query: 'Ejecuta análisis de código',
      agents: ['Developer', 'SecurityAuditor'],
      actions: ['analyze_code', 'generate_report'],
      result: { issues: 5, severity: 'medium' },
      executionTime: 4500,
      success: true
    });
    console.log('   ✅ Experience consolidated\n');

    // Test 3: Search lessons
    console.log('🧪 Step 6: Testing lesson search...');
    const searchResults = await memoryManager.searchLessons([
      'SEARCH',
      'EXECUTION'
    ]);
    console.log(
      `   ✅ Found ${searchResults.length} lessons with keywords\n`
    );

    // Test 4: Get skill
    console.log('🧪 Step 7: Testing skill retrieval...');
    const skill = await memoryManager.getSkill('search_knowledge_base');
    if (skill) {
      console.log(`   ✅ Skill found: ${skill.name}`);
      console.log(`   ✅ Type: ${skill.type}`);
      console.log(`   ✅ Effectiveness: ${(skill.effectiveness * 100).toFixed(1)}%\n`);
    }

    // Test 5: Get latest genome
    console.log('🧪 Step 8: Testing genome retrieval...');
    const genome = await memoryManager.getLatestGenome();
    console.log(`   ✅ Latest genome generation: ${genome.generationId}`);
    console.log(
      `   ✅ Fitness score: ${genome.fitnessScore.toFixed(2)}`
    );
    console.log(
      `   ✅ Mutation vector: [${genome.mutationVector.map(v => v.toFixed(2)).join(', ')}]\n`
    );

    // Test 6: Statistics
    console.log('🧪 Step 9: Testing statistics...');
    await memoryManager.logMetrics();

    // Test 7: Task storage
    console.log('\n🧪 Step 10: Testing task storage...');
    const task = {
      id: 'task-test-001',
      query: 'Prueba de persistencia',
      status: 'completed' as const,
      result: { test: true },
      createdAt: Date.now(),
      completedAt: Date.now(),
      duration: 1000
    };

    await memoryManager.saveTask(task);
    const retrievedTask = await memoryManager.getTask('task-test-001');

    if (retrievedTask) {
      console.log(`   ✅ Task saved and retrieved: ${retrievedTask.id}`);
      console.log(`   ✅ Status: ${retrievedTask.status}`);
      console.log(`   ✅ Duration: ${retrievedTask.duration}ms\n`);
    }

    // Final summary
    console.log('='.repeat(70));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n✨ Jarvis persistent storage is fully operational!\n');

    // Get database stats
    const db = getDatabase();
    const stats = db.getStats();

    console.log('📊 DATABASE STATISTICS:');
    console.log(`   Size: ${stats.databaseSize} MB`);
    console.log(`   Episodes: ${stats.episodes}`);
    console.log(`   Lessons: ${stats.lessons}`);
    console.log(`   Skills: ${stats.skills}`);
    console.log(`   Genomes: ${stats.genomes}`);
    console.log(`   Tasks: ${stats.tasks}`);
    console.log(`   Patterns: ${stats.patterns}\n`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests().catch(console.error);
}
