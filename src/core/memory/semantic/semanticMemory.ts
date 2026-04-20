/**
 * SEMANTIC MEMORY SYSTEM
 *
 * Almacena QUÉ SABE Jarvis.
 * Conocimiento generalizado, principios, patrones, hechos, conceptos.
 *
 * Ejemplo:
 * - "Las vulnerabilidades XSS ocurren cuando no escapas user input"
 * - "TypeScript es mejor que JavaScript para proyectos grandes"
 * - "El patrón singleton centraliza instancias globales"
 *
 * Esta es la "sabiduría" de Jarvis.
 */

import { SemanticMemory } from '../memoryTypes';
import { v4 as uuidv4 } from 'uuid';

export class SemanticMemorySystem {
  private memories: Map<string, SemanticMemory> = new Map();
  private memories_byCategory: Map<string, SemanticMemory[]> = new Map();
  private memories_byDomain: Map<string, SemanticMemory[]> = new Map();

  /**
   * CREAR O ACTUALIZAR CONOCIMIENTO
   */
  createOrUpdateKnowledge(
    category: SemanticMemory['category'],
    title: string,
    content: string,
    applicableDomains: string[],
    sourceTasks?: string[]
  ): SemanticMemory {
    // Buscar si ya existe este conocimiento
    let memory = Array.from(this.memories.values()).find(
      m => m.title.toLowerCase() === title.toLowerCase()
    );

    if (memory) {
      // Actualizar existente
      memory.content = content;
      memory.applicableDomains = [
        ...new Set([...memory.applicableDomains, ...applicableDomains]),
      ];
      memory.usageCount++;
      memory.lastReinforced = Date.now();
      memory.confidenceScore = Math.min(1, memory.confidenceScore + 0.05);

      console.log(`🧠 Conocimiento actualizado: ${title}`);
      return memory;
    }

    // Crear nuevo
    const knowledge: SemanticMemory = {
      id: `sem-${uuidv4()}`,
      category,
      title,
      content,
      applicableDomains,
      confidenceScore: 0.7, // Nueva información comienza con confianza media
      sourceTasks,
      lastReinforced: Date.now(),
      usageCount: 1,
      tags: this.extractTags(content),
    };

    this.memories.set(knowledge.id, knowledge);

    // Índices
    if (!this.memories_byCategory.has(category)) {
      this.memories_byCategory.set(category, []);
    }
    this.memories_byCategory.get(category)!.push(knowledge);

    applicableDomains.forEach(domain => {
      if (!this.memories_byDomain.has(domain)) {
        this.memories_byDomain.set(domain, []);
      }
      this.memories_byDomain.get(domain)!.push(knowledge);
    });

    console.log(`🧠 Nuevo conocimiento creado: ${title}`);
    return knowledge;
  }

  /**
   * RECUPERAR CONOCIMIENTO POR DOMINIO
   */
  getKnowledgeByDomain(domain: string): SemanticMemory[] {
    return this.memories_byDomain.get(domain) || [];
  }

  /**
   * RECUPERAR CONOCIMIENTO POR CATEGORÍA
   */
  getKnowledgeByCategory(category: SemanticMemory['category']): SemanticMemory[] {
    return this.memories_byCategory.get(category) || [];
  }

  /**
   * BUSCAR CONOCIMIENTO RELEVANTE
   */
  searchKnowledge(query: string): SemanticMemory[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.memories.values()).filter(
      mem =>
        mem.title.toLowerCase().includes(queryLower) ||
        mem.content.toLowerCase().includes(queryLower) ||
        mem.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  /**
   * OBTENER CONOCIMIENTO MÁS CONFIABLE
   */
  getMostConfidentKnowledge(domain?: string): SemanticMemory[] {
    const candidates = domain ? this.getKnowledgeByDomain(domain) : Array.from(this.memories.values());

    return candidates
      .sort((a, b) => {
        // Ordenar por: confianza (desc) → último uso (desc) → frecuencia de uso (desc)
        if (b.confidenceScore !== a.confidenceScore) {
          return b.confidenceScore - a.confidenceScore;
        }
        if (b.lastReinforced !== a.lastReinforced) {
          return b.lastReinforced - a.lastReinforced;
        }
        return b.usageCount - a.usageCount;
      })
      .slice(0, 10);
  }

  /**
   * REFORZAR CONOCIMIENTO (Cuando se usa exitosamente)
   */
  reinforceKnowledge(knowledgeId: string): void {
    const knowledge = this.memories.get(knowledgeId);
    if (knowledge) {
      knowledge.usageCount++;
      knowledge.lastReinforced = Date.now();
      knowledge.confidenceScore = Math.min(1, knowledge.confidenceScore + 0.01);

      console.log(`💪 Conocimiento reforzado: ${knowledge.title}`);
    }
  }

  /**
   * DEBILITAR CONOCIMIENTO (Cuando resulta incorrecto)
   */
  weakenKnowledge(knowledgeId: string): void {
    const knowledge = this.memories.get(knowledgeId);
    if (knowledge) {
      knowledge.confidenceScore = Math.max(0, knowledge.confidenceScore - 0.2);

      console.log(`⚠️  Conocimiento debilitado: ${knowledge.title}`);
    }
  }

  /**
   * OBTENER ESTADÍSTICAS
   */
  getStatistics() {
    const allKnowledge = Array.from(this.memories.values());

    return {
      totalKnowledgeNodes: this.memories.size,
      byCategory: Object.fromEntries(
        Array.from(this.memories_byCategory.entries()).map(([cat, mems]) => [cat, mems.length])
      ),
      byDomain: Object.fromEntries(
        Array.from(this.memories_byDomain.entries()).map(([dom, mems]) => [dom, mems.length])
      ),
      averageConfidence: allKnowledge.length > 0
        ? allKnowledge.reduce((sum, k) => sum + k.confidenceScore, 0) / allKnowledge.length
        : 0,
      mostUsedKnowledge: allKnowledge
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(k => ({ title: k.title, uses: k.usageCount })),
    };
  }

  /**
   * OBTENER TODOS LOS CONOCIMIENTOS
   */
  getAllKnowledge(): SemanticMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * EXTRAER TAGS DEL CONTENIDO
   */
  private extractTags(content: string): string[] {
    // Simple extraction - buscar palabras en mayúsculas o números
    const matches = content.match(/\b[A-Z]+[A-Za-z0-9]*\b/g) || [];
    return [...new Set(matches)].slice(0, 10);
  }

  /**
   * MEMORIA TOTAL EN KB
   */
  getMemoryUsage(): number {
    return (JSON.stringify(Array.from(this.memories.values())).length / 1024).toFixed(2) as any;
  }
}
