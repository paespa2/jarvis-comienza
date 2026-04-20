/**
 * EPISODIC MEMORY SYSTEM
 *
 * Registra QUÉ PASÓ y CUÁNDO.
 * Eventos, experiencias, acciones concretas con timestamps.
 *
 * Ejemplo:
 * - "Task #123 fue ejecutada exitosamente en 450ms"
 * - "Error: 'file not found' en herramienta X"
 * - "Usuario pidió feature Y"
 *
 * Esta es la "memoria vivida" de Jarvis.
 */

import { EpisodicMemory } from '../memoryTypes';
import { v4 as uuidv4 } from 'uuid';

export class EpisodicMemorySystem {
  private memories: Map<string, EpisodicMemory> = new Map();
  private memories_byType: Map<string, EpisodicMemory[]> = new Map();
  private memories_chronological: EpisodicMemory[] = [];

  /**
   * REGISTRAR EPISODIO
   *
   * Guardar un evento nuevo.
   */
  recordEpisode(
    type: EpisodicMemory['type'],
    description: string,
    context: any,
    outcome: 'success' | 'failure' | 'partial' = 'success'
  ): EpisodicMemory {
    const episode: EpisodicMemory = {
      id: `ep-${uuidv4()}`,
      type,
      timestamp: Date.now(),
      description,
      context,
      outcome,
      metadata: {
        importance: this.calculateImportance(type, outcome),
        emotionalTone:
          outcome === 'success' ? 'positive' : outcome === 'failure' ? 'negative' : 'neutral',
      },
    };

    this.memories.set(episode.id, episode);
    this.memories_chronological.push(episode);

    // Índice por tipo
    if (!this.memories_byType.has(type)) {
      this.memories_byType.set(type, []);
    }
    this.memories_byType.get(type)!.push(episode);

    console.log(`📝 Episodio registrado: ${type} - ${description.substring(0, 40)}...`);

    return episode;
  }

  /**
   * RECUPERAR EPISODIOS POR TIPO
   */
  getEpisodesByType(type: EpisodicMemory['type']): EpisodicMemory[] {
    return this.memories_byType.get(type) || [];
  }

  /**
   * RECUPERAR EPISODIOS RECIENTES
   */
  getRecentEpisodes(count: number = 10): EpisodicMemory[] {
    return this.memories_chronological.slice(-count).reverse();
  }

  /**
   * RECUPERAR EPISODIOS EN VENTANA DE TIEMPO
   */
  getEpisodesInTimeWindow(startTime: number, endTime: number): EpisodicMemory[] {
    return this.memories_chronological.filter(
      ep => ep.timestamp >= startTime && ep.timestamp <= endTime
    );
  }

  /**
   * BUSCAR EPISODIOS POR DESCRIPCIÓN
   */
  searchEpisodes(keyword: string): EpisodicMemory[] {
    return Array.from(this.memories.values()).filter(ep =>
      ep.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * OBTENER ESTADÍSTICAS EPISÓDICAS
   */
  getStatistics() {
    const totalEpisodes = this.memories.size;
    const successCount = Array.from(this.memories.values()).filter(
      ep => ep.outcome === 'success'
    ).length;
    const failureCount = Array.from(this.memories.values()).filter(
      ep => ep.outcome === 'failure'
    ).length;

    return {
      totalEpisodes,
      successRate: totalEpisodes > 0 ? successCount / totalEpisodes : 0,
      failureRate: totalEpisodes > 0 ? failureCount / totalEpisodes : 0,
      byType: Object.fromEntries(
        Array.from(this.memories_byType.entries()).map(([type, eps]) => [
          type,
          eps.length,
        ])
      ),
      oldestEpisode: this.memories_chronological[0]?.timestamp,
      newestEpisode: this.memories_chronological[this.memories_chronological.length - 1]?.timestamp,
    };
  }

  /**
   * OBTENER TODOS LOS EPISODIOS (Para consolidación)
   */
  getAllEpisodes(): EpisodicMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * CALCULAR IMPORTANCIA DE UN EPISODIO
   */
  private calculateImportance(
    type: EpisodicMemory['type'],
    outcome: 'success' | 'failure' | 'partial'
  ): number {
    let importance = 5; // baseline

    // Los errores son más importantes (aprender de fallos)
    if (outcome === 'failure') {
      importance = 9;
    } else if (outcome === 'success') {
      importance = 6;
    }

    // Ciertos tipos son más importantes
    if (type === 'error') {
      importance = Math.min(10, importance + 2);
    } else if (type === 'learning') {
      importance = Math.min(10, importance + 1);
    }

    return importance;
  }

  /**
   * CONTAR EPISODIOS DE TIPO
   */
  countByType(type: EpisodicMemory['type']): number {
    return this.memories_byType.get(type)?.length || 0;
  }

  /**
   * MEMORIA TOTAL EN KB
   */
  getMemoryUsage(): number {
    // Estimación aproximada
    return (JSON.stringify(Array.from(this.memories.values())).length / 1024).toFixed(2) as any;
  }
}
