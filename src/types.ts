export interface Artifact {
  id: string;
  type: 'code' | 'web' | 'markdown' | 'image' | 'file';
  title: string;
  content: string;
  language?: string;
  version: number;
  lastUpdated: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'jarvis';
  text: string;
  searchResults?: any[];
  brainUsed?: string;
  timestamp?: any;
  artifactId?: string;
}

export interface SovereignLog {
  id: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface AutonomousDecision {
  id: string;
  text: string;
  type: 'optimization' | 'security' | 'evolution';
  timestamp: string;
}
