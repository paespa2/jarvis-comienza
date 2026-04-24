/**
 * JARVIS v2.0 - Tipos centralizados
 */

// ============================================================================
// AI / LLM Types
// ============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
}

// ============================================================================
// Vault / Knowledge Types
// ============================================================================

export type VaultNoteType = 'case' | 'skill' | 'finding' | 'technique' | 'learning' | 'memory';

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  type: VaultNoteType;
}

export interface SearchResult {
  notes: VaultNote[];
  context: string;
}

// ============================================================================
// Skills / Capabilities Types
// ============================================================================

export interface SkillExecutionContext {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface SkillResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
}

export type SkillFunction = (
  input: any,
  context: SkillExecutionContext
) => Promise<SkillResult>;

export interface Skill {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, { type: string; description: string }>;
  execute: SkillFunction;
}

// ============================================================================
// Case / Vulnerability Types
// ============================================================================

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Vulnerability {
  id: string;
  type: string; // SQLi, XSS, CSRF, SSRF, XXE, RCE, etc.
  target: string;
  severity: Severity;
  cvss_score: number;
  description: string;
  impact: string;
  steps_to_reproduce: string[];
  proof_of_concept: string;
  remediation: string;
  references: string[];
  discoveredAt: Date;
  reportedAt?: Date;
}

export interface Case {
  id: string;
  target: string;
  program: string; // HackerOne program name
  status: 'open' | 'submitted' | 'resolved' | 'duplicate' | 'not_applicable' | 'informative';
  vulnerabilities: Vulnerability[];
  createdAt: Date;
  updatedAt: Date;
  notes: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ChatRequest {
  message: string;
  sessionId: string;
  conversationHistory?: AIMessage[];
}

export interface ChatResponse {
  response: string;
  model: string;
  responseTime: number;
  sessionId: string;
  timestamp: Date;
}

export interface VaultExportResponse {
  notes: VaultNote[];
  exportedAt: Date;
  totalNotes: number;
  stats: Record<string, number>;
}

export interface SkillExecuteRequest {
  skillName: string;
  input: any;
  context?: SkillExecutionContext;
}

export interface SkillExecuteResponse {
  skillName: string;
  success: boolean;
  result: SkillResult;
  timestamp: Date;
}

// ============================================================================
// System Status Types
// ============================================================================

export interface AIStatus {
  provider: string;
  isAvailable: boolean;
  model: string;
  endpoint: string;
}

export interface VaultStats {
  total: number;
  cases: number;
  skills: number;
  findings: number;
  learnings: number;
  memories: number;
}

export interface SystemStatus {
  server: {
    status: 'running' | 'stopped' | 'error';
    uptime: number;
    port: number;
  };
  ai: AIStatus;
  vault: VaultStats;
  timestamp: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AIClientConfig {
  provider: 'ollama' | 'openrouter' | 'mock';
  ollamaUrl?: string;
  ollamaModel?: string;
  openrouterKey?: string;
  openrouterModel?: string;
}

export interface JarvisConfig {
  port: number;
  host: string;
  aiClient: AIClientConfig;
  vault: {
    path: string;
  };
  database: {
    path: string;
  };
}
