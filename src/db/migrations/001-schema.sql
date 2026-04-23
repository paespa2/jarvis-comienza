-- Cloud SQL Schema for Jarvis Knowledge Graph
-- Database: asistente-jarvis-1741893602789-database

-- ============================================
-- NODE TYPES (Tipos de conceptos)
-- ============================================
CREATE TABLE IF NOT EXISTS node_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_node_types_name ON node_types(name);

-- ============================================
-- RELATIONSHIP TYPES (Tipos de relaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS relationship_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  directed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relationship_types_name ON relationship_types(name);

-- ============================================
-- NODES (Instancias de conceptos)
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
  id SERIAL PRIMARY KEY,
  node_type_id INT NOT NULL REFERENCES node_types(id),
  external_id VARCHAR(255),
  label VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nodes_external_id ON nodes(external_id);
CREATE INDEX idx_nodes_label ON nodes(label);
CREATE INDEX idx_nodes_node_type_id ON nodes(node_type_id);

-- ============================================
-- NODE PROPERTIES (Propiedades de nodos)
-- ============================================
CREATE TABLE IF NOT EXISTS node_properties (
  id SERIAL PRIMARY KEY,
  node_id INT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  property_key VARCHAR(255) NOT NULL,
  property_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_node_properties_node_id ON node_properties(node_id);
CREATE INDEX idx_node_properties_key ON node_properties(property_key);

-- ============================================
-- EDGES (Relaciones entre nodos)
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
  id SERIAL PRIMARY KEY,
  relationship_type_id INT NOT NULL REFERENCES relationship_types(id),
  source_node_id INT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id INT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_edge CHECK (source_node_id != target_node_id)
);

CREATE INDEX idx_edges_relationship_type_id ON edges(relationship_type_id);
CREATE INDEX idx_edges_source_node_id ON edges(source_node_id);
CREATE INDEX idx_edges_target_node_id ON edges(target_node_id);
CREATE INDEX idx_edges_source_target ON edges(source_node_id, target_node_id);

-- ============================================
-- EDGE PROPERTIES (Propiedades de relaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS edge_properties (
  id SERIAL PRIMARY KEY,
  edge_id INT NOT NULL REFERENCES edges(id) ON DELETE CASCADE,
  property_key VARCHAR(255) NOT NULL,
  property_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_edge_properties_edge_id ON edge_properties(edge_id);
CREATE INDEX idx_edge_properties_key ON edge_properties(property_key);

-- ============================================
-- INTERACTIONS (Interacciones de usuario con Jarvis)
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_query TEXT NOT NULL,
  jarvis_response TEXT NOT NULL,
  intent VARCHAR(100),
  emotion VARCHAR(50),
  confidence FLOAT,
  user_satisfaction FLOAT,
  execution_time_ms INT,
  systems_used TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_session_id ON interactions(session_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
CREATE INDEX idx_interactions_intent ON interactions(intent);

-- ============================================
-- IMPROVEMENT RECORDS (Mejoras aplicadas)
-- ============================================
CREATE TABLE IF NOT EXISTS improvements (
  id SERIAL PRIMARY KEY,
  commit_hash VARCHAR(50) NOT NULL UNIQUE,
  improvement_type VARCHAR(100),
  target_dimension VARCHAR(100),
  priority INT,
  expected_impact FLOAT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  files_changed TEXT, -- JSON array
  description TEXT
);

CREATE INDEX idx_improvements_commit_hash ON improvements(commit_hash);
CREATE INDEX idx_improvements_applied_at ON improvements(applied_at);

-- ============================================
-- DAILY METRICS (Métricas diarias)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL UNIQUE,
  binary_accuracy FLOAT,
  multi_class_quality FLOAT,
  multi_class_relevance FLOAT,
  multi_class_coherence FLOAT,
  multi_class_completeness FLOAT,
  response_variation FLOAT,
  context_retention FLOAT,
  total_interactions INT,
  avg_confidence FLOAT,
  avg_satisfaction FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);

-- ============================================
-- HACKER ONE LEARNINGS (Aprendizajes de seguridad)
-- ============================================
CREATE TABLE IF NOT EXISTS h1_learnings (
  id SERIAL PRIMARY KEY,
  vulnerability_type VARCHAR(255),
  technique VARCHAR(255),
  tool_used VARCHAR(255),
  success_rate FLOAT,
  severity VARCHAR(50),
  case_study TEXT,
  learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_h1_learnings_vulnerability_type ON h1_learnings(vulnerability_type);
CREATE INDEX idx_h1_learnings_learned_at ON h1_learnings(learned_at);

-- ============================================
-- RESEARCH SESSIONS (Sesiones de investigación)
-- ============================================
CREATE TABLE IF NOT EXISTS research_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  papers_found INT,
  knowledge_added INT,
  topics TEXT, -- JSON array
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_sessions_created_at ON research_sessions(created_at);

-- ============================================
-- EMBEDDINGS (Embeddings para búsqueda semántica)
-- ============================================
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50), -- 'node', 'interaction', 'learning'
  entity_id INT,
  text_content TEXT,
  embedding_vector BYTEA, -- Binary representation of embedding
  embedding_dim INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_entity_type ON embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_created_at ON embeddings(created_at);
