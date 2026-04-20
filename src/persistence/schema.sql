-- ============================================
-- JARVIS PERSISTENT KNOWLEDGE BASE
-- SQLite Schema for autonomous reasoning
-- ============================================

-- Episodic Memory: What happened (events and experiences)
CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  query TEXT NOT NULL,
  agents TEXT, -- JSON array of agents used
  actions TEXT, -- JSON array of actions taken
  result TEXT, -- JSON result
  executionTime INTEGER, -- milliseconds
  success BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Semantic Memory: What was learned (consolidated knowledge)
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept TEXT NOT NULL UNIQUE,
  rule TEXT NOT NULL, -- The learned rule/pattern
  successRate REAL NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  timesUsed INTEGER NOT NULL DEFAULT 0,
  timesSuccessful INTEGER NOT NULL DEFAULT 0,
  lastUsed INTEGER, -- timestamp
  source TEXT DEFAULT 'learned', -- 'learned' or 'system'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Procedural Memory: How to do things (skills)
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'tool', 'pattern', 'heuristic'
  implementation TEXT NOT NULL, -- Code or description
  effectiveness REAL NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  lastExecuted INTEGER, -- timestamp
  timesExecuted INTEGER NOT NULL DEFAULT 0,
  timesSuccessful INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model Evolution: Genome tracking
CREATE TABLE IF NOT EXISTS genomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generationId INTEGER NOT NULL UNIQUE,
  timestamp INTEGER NOT NULL,
  mutationVector TEXT NOT NULL, -- JSON array of floats [0.0 to 1.0]
  fitnessScore REAL NOT NULL DEFAULT 0.5,
  changes TEXT, -- Description of changes
  parentGeneration INTEGER, -- ID of previous generation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task History: What tasks were executed
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  result TEXT, -- JSON result
  error TEXT,
  createdAt INTEGER NOT NULL,
  startedAt INTEGER,
  completedAt INTEGER,
  duration INTEGER, -- milliseconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patterns: Recognized patterns and their effectiveness
CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  signature TEXT, -- Hash or pattern identifier
  confidence REAL NOT NULL DEFAULT 0.5,
  timesMatched INTEGER NOT NULL DEFAULT 0,
  timesSuccessful INTEGER NOT NULL DEFAULT 0,
  lastMatched INTEGER, -- timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anti-Patterns: Things that don't work
CREATE TABLE IF NOT EXISTS antiPatterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  signature TEXT, -- Hash or pattern identifier
  confidence REAL NOT NULL DEFAULT -0.5, -- negative confidence
  timesEncountered INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_episodes_query ON episodes(query);
CREATE INDEX IF NOT EXISTS idx_episodes_success ON episodes(success);
CREATE INDEX IF NOT EXISTS idx_episodes_timestamp ON episodes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_concept ON lessons(concept);
CREATE INDEX IF NOT EXISTS idx_lessons_successRate ON lessons(successRate DESC);
CREATE INDEX IF NOT EXISTS idx_skills_effectiveness ON skills(effectiveness DESC);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_genomes_generationId ON genomes(generationId);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt DESC);

-- ============================================
-- METADATA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize metadata
INSERT OR IGNORE INTO metadata (key, value) VALUES
  ('last_genome_id', '1'),
  ('total_queries_processed', '0'),
  ('total_successful_queries', '0'),
  ('last_bootstrap', datetime('now'));
