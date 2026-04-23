/**
 * ENHANCED SECURITY KNOWLEDGE BASE
 *
 * Integrates HuggingFace security datasets into Jarvis knowledge system
 * Phase 3: Integration - Knowledge Base Expansion
 */

import { securityDatasetProcessor, SecurityEntity } from '../../data/SecurityDatasetProcessor';

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  platforms: string[];
  relatedVulnerabilities: string[];
  detectionMethods: string[];
  mitigations: string[];
}

export interface CVEInstruction {
  cveId: string;
  cvssScore: number;
  description: string;
  affectedProducts: string[];
  exploitationSteps: string[];
  detectionIndicators: string[];
  references: string[];
}

export interface SecurityPrompt {
  id: string;
  category: string;
  domain: string;
  content: string;
  keywords: string[];
  relatedTechniques: string[];
  relatedVulnerabilities: string[];
}

export class EnhancedSecurityKnowledgeBase {
  private techniques: Map<string, MitreTechnique> = new Map();
  private instructions: Map<string, CVEInstruction> = new Map();
  private prompts: Map<string, SecurityPrompt> = new Map();
  private vulnerabilities: Map<string, SecurityEntity> = new Map();
  private knowledgeGraph: Map<string, Set<string>> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    console.log('\n📚 [EnhancedSecurityKnowledgeBase] Inicializando...');
  }

  /**
   * Inicializar la base de conocimiento con datos procesados
   */
  async initialize(): Promise<void> {
    console.log('\n📚 Initializing Enhanced Security Knowledge Base...');

    try {
      // Procesar datasets
      const metrics = await securityDatasetProcessor.processAllDatasets();

      // Cargar entidades procesadas
      const entities = securityDatasetProcessor.getProcessedEntities();

      console.log(`\n📥 Loading ${entities.length} processed entities...`);

      // Organizar por tipo
      for (const entity of entities) {
        switch (entity.type) {
          case 'technique':
            this.loadMitreTechnique(entity);
            break;
          case 'instruction':
            this.loadCVEInstruction(entity);
            break;
          case 'prompt':
            this.loadSecurityPrompt(entity);
            break;
          case 'vulnerability':
            this.vulnerabilities.set(entity.id, entity);
            break;
        }

        // Construir grafo de conocimiento
        for (const related of entity.relatedEntities) {
          if (!this.knowledgeGraph.has(entity.id)) {
            this.knowledgeGraph.set(entity.id, new Set());
          }
          this.knowledgeGraph.get(entity.id)!.add(related);
        }
      }

      console.log(`\n✅ Knowledge Base Loaded:`);
      console.log(`   MITRE Techniques: ${this.techniques.size}`);
      console.log(`   CVE Instructions: ${this.instructions.size}`);
      console.log(`   Security Prompts: ${this.prompts.size}`);
      console.log(`   Vulnerabilities: ${this.vulnerabilities.size}`);
      console.log(`   Knowledge Relationships: ${this.knowledgeGraph.size}\n`);

      this.isInitialized = true;
    } catch (err: any) {
      console.error(`❌ Error initializing knowledge base: ${err.message}`);
      throw err;
    }
  }

  /**
   * Cargar técnica MITRE
   */
  private loadMitreTechnique(entity: SecurityEntity): void {
    const technique: MitreTechnique = {
      id: entity.metadata.techniqueId || entity.id,
      name: entity.metadata.name || entity.content,
      tactic: entity.metadata.tactic || 'unknown',
      description: entity.metadata.description || entity.content,
      platforms: entity.metadata.platforms || [],
      relatedVulnerabilities: [],
      detectionMethods: [],
      mitigations: []
    };

    this.techniques.set(technique.id, technique);
  }

  /**
   * Cargar instrucción CVE
   */
  private loadCVEInstruction(entity: SecurityEntity): void {
    const instruction: CVEInstruction = {
      cveId: entity.metadata.cveId || entity.id,
      cvssScore: parseFloat(entity.metadata.cvssScore || '7.5'),
      description: entity.metadata.description || entity.content,
      affectedProducts: entity.metadata.affectedProducts || [],
      exploitationSteps: entity.metadata.exploitationSteps || [entity.content],
      detectionIndicators: entity.metadata.detectionIndicators || [],
      references: entity.metadata.references || []
    };

    this.instructions.set(instruction.cveId, instruction);
  }

  /**
   * Cargar prompt de seguridad
   */
  private loadSecurityPrompt(entity: SecurityEntity): void {
    const prompt: SecurityPrompt = {
      id: entity.id,
      category: entity.metadata.category || 'general',
      domain: entity.metadata.domain || 'security',
      content: entity.content,
      keywords: entity.metadata.keywords || [],
      relatedTechniques: [],
      relatedVulnerabilities: []
    };

    this.prompts.set(prompt.id, prompt);
  }

  /**
   * Buscar por técnica MITRE
   */
  searchByMitreTechnique(query: string): MitreTechnique[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.techniques.values()).filter(
      t =>
        t.id.toLowerCase().includes(lowerQuery) ||
        t.name.toLowerCase().includes(lowerQuery) ||
        t.tactic.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obtener instrucciones para un CVE
   */
  getCVEInstructions(cveId: string): CVEInstruction | null {
    return this.instructions.get(cveId) || null;
  }

  /**
   * Buscar vulnerabilidades similares
   */
  findSimilarVulnerabilities(description: string): SecurityEntity[] {
    const keywords = description.toLowerCase().split(/\s+/);
    const results: SecurityEntity[] = [];

    for (const vuln of this.vulnerabilities.values()) {
      const vulnText = vuln.content.toLowerCase();
      const matches = keywords.filter(kw => vulnText.includes(kw)).length;
      if (matches > 0) {
        results.push(vuln);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Obtener técnicas relacionadas con una vulnerabilidad
   */
  getRelatedTechniques(vulnerabilityId: string): MitreTechnique[] {
    const vuln = this.vulnerabilities.get(vulnerabilityId);
    if (!vuln) return [];

    const related = this.knowledgeGraph.get(vulnerabilityId) || new Set();
    return Array.from(related)
      .map(id => this.techniques.get(id))
      .filter((t): t is MitreTechnique => t !== undefined);
  }

  /**
   * Obtener contexto completo de una técnica
   */
  getTechniqueContext(techniqueId: string): Record<string, any> {
    const technique = this.techniques.get(techniqueId);
    if (!technique) return {};

    return {
      technique,
      relatedVulnerabilities: Array.from(this.vulnerabilities.values())
        .filter(v => v.content.toLowerCase().includes(technique.tactic))
        .slice(0, 10),
      relatedPrompts: Array.from(this.prompts.values())
        .filter(p =>
          p.content.toLowerCase().includes(technique.tactic) ||
          p.relatedTechniques.includes(techniqueId)
        )
        .slice(0, 5),
      detectionMethods: technique.detectionMethods,
      mitigations: technique.mitigations
    };
  }

  /**
   * Búsqueda semántica en prompts
   */
  semanticSearchPrompts(query: string): SecurityPrompt[] {
    const keywords = query.toLowerCase().split(/\s+/);
    const scored: Array<[SecurityPrompt, number]> = [];

    for (const prompt of this.prompts.values()) {
      const contentLower = prompt.content.toLowerCase();
      const categoryLower = prompt.category.toLowerCase();
      const domainLower = prompt.domain.toLowerCase();

      let score = 0;
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) score += 2;
        if (categoryLower.includes(keyword)) score += 3;
        if (domainLower.includes(keyword)) score += 3;
        if (prompt.keywords.some(kw => kw.includes(keyword))) score += 4;
      }

      if (score > 0) {
        scored.push([prompt, score]);
      }
    }

    return scored.sort((a, b) => b[1] - a[1]).map(([prompt]) => prompt);
  }

  /**
   * Obtener pares DPO para training
   */
  getDPOPairsForTopic(topic: string): Array<{ chosen: string; rejected: string }> {
    const prompts = this.semanticSearchPrompts(topic);
    const pairs: Array<{ chosen: string; rejected: string }> = [];

    for (let i = 0; i < prompts.length - 1; i++) {
      pairs.push({
        chosen: prompts[i].content,
        rejected: prompts[i + 1].content
      });
    }

    return pairs;
  }

  /**
   * Obtener estadísticas de la base de conocimiento
   */
  getStats(): {
    totalTechniques: number;
    totalInstructions: number;
    totalPrompts: number;
    totalVulnerabilities: number;
    knowledgeGraphSize: number;
    isInitialized: boolean;
  } {
    return {
      totalTechniques: this.techniques.size,
      totalInstructions: this.instructions.size,
      totalPrompts: this.prompts.size,
      totalVulnerabilities: this.vulnerabilities.size,
      knowledgeGraphSize: this.knowledgeGraph.size,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Obtener técnicas por táctico
   */
  getTechniquesByTactic(tactic: string): MitreTechnique[] {
    return Array.from(this.techniques.values()).filter(t => t.tactic.toLowerCase() === tactic.toLowerCase());
  }

  /**
   * Obtener CVEs de alto riesgo
   */
  getHighRiskCVEs(): CVEInstruction[] {
    return Array.from(this.instructions.values())
      .filter(cve => cve.cvssScore >= 7.0)
      .sort((a, b) => b.cvssScore - a.cvssScore);
  }

  /**
   * Obtener todos los técnicos
   */
  getAllTechniques(): MitreTechnique[] {
    return Array.from(this.techniques.values());
  }

  /**
   * Obtener todas las instrucciones CVE
   */
  getAllCVEInstructions(): CVEInstruction[] {
    return Array.from(this.instructions.values());
  }
}

export const enhancedSecurityKnowledgeBase = new EnhancedSecurityKnowledgeBase();
