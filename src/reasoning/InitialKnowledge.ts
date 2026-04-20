/**
 * INITIAL KNOWLEDGE FOR JARVIS
 *
 * Bootstrap knowledge that Jarvis starts with
 * These are foundational lessons, skills, and patterns
 * that allow Jarvis to begin reasoning autonomously
 */

// ============================================
// INITIAL LESSONS (Foundational Knowledge)
// ============================================

export const INITIAL_LESSONS = [
  // Search & Retrieval Patterns
  {
    concept: 'SEARCH_PATTERN',
    rule: 'IF query_contains([search, find, busca, buscar, obtén]) THEN use_search_skill WITH cache=true AND timeout=30s',
    successRate: 0.95,
    source: 'system'
  },

  // Execution Patterns
  {
    concept: 'EXECUTION_PATTERN',
    rule: 'IF query_contains([execute, run, ejecuta, corre, launch]) THEN select_execution_skill WITH timeout=60s AND retries=2',
    successRate: 0.85,
    source: 'system'
  },

  // Analysis Patterns
  {
    concept: 'ANALYSIS_PATTERN',
    rule: 'IF query_contains([analyze, analiza, examina, revisa, inspect]) THEN load_analyzer_skill WITH verbose=true',
    successRate: 0.80,
    source: 'system'
  },

  // Learning from Success
  {
    concept: 'POSITIVE_REINFORCEMENT',
    rule: 'IF execution_result=success THEN (confidence += 0.10) FOR used_rules AND save_as_successful_pattern',
    successRate: 0.98,
    source: 'system'
  },

  // Learning from Failure
  {
    concept: 'NEGATIVE_REINFORCEMENT',
    rule: 'IF execution_result=failure THEN (confidence -= 0.20) FOR used_rules AND generate_alternative_approach',
    successRate: 0.92,
    source: 'system'
  },

  // Caching & Optimization
  {
    concept: 'CACHE_OPTIMIZATION',
    rule: 'IF similar_query_exists_in_episodes THEN use_cached_result WITH timestamp_check AND validity_threshold=3600',
    successRate: 0.88,
    source: 'system'
  },

  // Pattern Recognition
  {
    concept: 'PATTERN_RECOGNITION',
    rule: 'IF query_similarity > 0.7 WITH past_episode THEN consider_same_pattern AND adjust_confidence_based_on_past_success',
    successRate: 0.82,
    source: 'system'
  },

  // Constitutional Validation
  {
    concept: 'CONSTITUTIONAL_CHECK',
    rule: 'IF request_received THEN validate_against_5_constitutional_articles BEFORE execution',
    successRate: 0.99,
    source: 'system'
  },

  // Multi-agent Coordination
  {
    concept: 'AGENT_SELECTION',
    rule: 'IF query_keywords_match_agent_specialization THEN select_agent_from_team WITH confidence_threshold=0.6',
    successRate: 0.75,
    source: 'system'
  },

  // Error Recovery
  {
    concept: 'ERROR_RECOVERY',
    rule: 'IF execution_fails THEN (attempt_fallback_strategy) AND (log_error) AND (update_confidence_negatively)',
    successRate: 0.80,
    source: 'system'
  },

  // Knowledge Consolidation
  {
    concept: 'KNOWLEDGE_CONSOLIDATION',
    rule: 'IF execution_complete THEN (save_episode) AND (extract_lessons) AND (create_skills) AND (update_genome)',
    successRate: 0.91,
    source: 'system'
  }
];

// ============================================
// INITIAL SKILLS (Foundational Capabilities)
// ============================================

export const INITIAL_SKILLS = [
  // Search Skills
  {
    name: 'search_knowledge_base',
    type: 'tool' as const,
    implementation: 'Query persistent database for similar episodes and lessons',
    effectiveness: 0.95
  },

  {
    name: 'cache_lookup',
    type: 'tool' as const,
    implementation: 'Check if similar query was recently executed and reuse result',
    effectiveness: 0.92
  },

  // Pattern Matching
  {
    name: 'pattern_matching',
    type: 'pattern' as const,
    implementation: 'Compare current query with past episodes using cosine similarity',
    effectiveness: 0.85
  },

  {
    name: 'keyword_extraction',
    type: 'pattern' as const,
    implementation: 'Extract actionable keywords from natural language query',
    effectiveness: 0.88
  },

  // Reasoning Heuristics
  {
    name: 'backward_chaining',
    type: 'heuristic' as const,
    implementation: 'Start from goal and work backwards to find required steps',
    effectiveness: 0.80
  },

  {
    name: 'forward_chaining',
    type: 'heuristic' as const,
    implementation: 'Apply rules to known facts to derive new conclusions',
    effectiveness: 0.78
  },

  {
    name: 'confidence_calculation',
    type: 'heuristic' as const,
    implementation: 'Calculate confidence score based on lesson success rates and pattern similarity',
    effectiveness: 0.89
  },

  {
    name: 'agent_selection',
    type: 'heuristic' as const,
    implementation: 'Select appropriate agents from team based on query keywords',
    effectiveness: 0.75
  },

  // Learning
  {
    name: 'learn_from_success',
    type: 'tool' as const,
    implementation: 'Save successful execution as lesson and pattern',
    effectiveness: 0.98
  },

  {
    name: 'learn_from_failure',
    type: 'tool' as const,
    implementation: 'Generate anti-patterns and reduce confidence in failed approaches',
    effectiveness: 0.85
  },

  // Consolidation
  {
    name: 'consolidate_memory',
    type: 'tool' as const,
    implementation: 'Convert episodes to lessons, create skills, update genome',
    effectiveness: 0.91
  },

  {
    name: 'update_genome',
    type: 'tool' as const,
    implementation: 'Evolve mutation vector based on fitness scores',
    effectiveness: 0.72
  }
];

// ============================================
// INITIAL PATTERNS (Recognized Patterns)
// ============================================

export const INITIAL_PATTERNS = [
  {
    name: 'information_retrieval',
    description: 'Pattern for queries asking to find or search for information',
    signature: 'SEARCH|FIND|BUSCAR|OBTENER',
    confidence: 0.90
  },

  {
    name: 'code_execution',
    description: 'Pattern for queries asking to execute code or run tasks',
    signature: 'EXECUTE|RUN|CORRE|EJECUTA|LAUNCH',
    confidence: 0.88
  },

  {
    name: 'analysis_request',
    description: 'Pattern for queries asking to analyze or examine something',
    signature: 'ANALYZE|ANALIZA|EXAMINE|INSPECT|REVIEW',
    confidence: 0.85
  },

  {
    name: 'learning_request',
    description: 'Pattern for queries asking to learn or understand something',
    signature: 'LEARN|ENSEÑA|EXPLAIN|UNDERSTAND|APRENDER',
    confidence: 0.82
  },

  {
    name: 'optimization_request',
    description: 'Pattern for queries asking to improve or optimize something',
    signature: 'OPTIMIZE|IMPROVE|FASTER|MEJOR|OPTIMIZA',
    confidence: 0.75
  },

  {
    name: 'security_request',
    description: 'Pattern for queries about security vulnerabilities or threats',
    signature: 'SECURITY|VULNERABILITY|CVE|EXPLOIT|HACK|SEGURIDAD',
    confidence: 0.80
  },

  {
    name: 'autonomous_operation',
    description: 'Pattern for queries requesting autonomous execution',
    signature: 'AUTONOMOUS|AUTO|SELF|AUTOMATIC|AUTOMATICO',
    confidence: 0.70
  }
];

// ============================================
// ANTI-PATTERNS (Things That Don't Work)
// ============================================

export const INITIAL_ANTI_PATTERNS = [
  {
    name: 'invalid_api_keys',
    description: 'Trying to use invalid or expired API keys',
    signature: 'API_ERROR|AUTH_FAILED|INVALID_KEY',
    confidence: -0.95
  },

  {
    name: 'timeout_on_large_queries',
    description: 'Very large queries tend to timeout more often',
    signature: 'QUERY_LENGTH>1000|COMPLEX_LOGIC',
    confidence: -0.80
  },

  {
    name: 'external_api_dependency',
    description: 'Over-reliance on external APIs causes failures',
    signature: 'EXTERNAL_API|NETWORK_DEPENDENT',
    confidence: -0.75
  }
];

// ============================================
// INITIALIZATION FUNCTION
// ============================================

export async function initializeBootstrapKnowledge(
  memoryManager: any
): Promise<void> {
  console.log('\n🌱 INITIALIZING BOOTSTRAP KNOWLEDGE...\n');

  // Get current stats to check if already initialized
  const stats = await memoryManager.getStatistics();
  const alreadyInitialized = stats.totalLessons > 0;

  if (alreadyInitialized) {
    console.log('✅ Knowledge base already initialized, skipping bootstrap');
    return;
  }

  // Save initial lessons
  console.log(`📚 Saving ${INITIAL_LESSONS.length} foundational lessons...`);
  for (const lesson of INITIAL_LESSONS) {
    await memoryManager.saveLesson(lesson);
  }

  // Save initial skills
  console.log(`🔧 Saving ${INITIAL_SKILLS.length} foundational skills...`);
  for (const skill of INITIAL_SKILLS) {
    await memoryManager.saveSkill(skill);
  }

  // Save initial patterns
  console.log(`🎯 Saving ${INITIAL_PATTERNS.length} initial patterns...`);
  for (const pattern of INITIAL_PATTERNS) {
    await memoryManager.savePattern(pattern);
  }

  // Create initial genome
  console.log('🧬 Creating initial genome...');
  const genome = await memoryManager.getLatestGenome();
  console.log(`   Generation: ${genome.generationId}`);
  console.log(`   Fitness Score: ${genome.fitnessScore}`);
  console.log(`   Mutation Vector: [${genome.mutationVector.join(', ')}]`);

  // Log final statistics
  console.log('\n✅ BOOTSTRAP KNOWLEDGE INITIALIZED\n');
  await memoryManager.logMetrics();
}
