/**
 * PROCEDURAL MEMORY SYSTEM
 *
 * Almacena CÓMO HACER COSAS.
 * Skills, técnicas, procedimientos, "muscle memory".
 *
 * Ejemplo:
 * - "Cómo ejecutar un pentesting eficientemente"
 * - "Cómo refactorizar código legacy sin romper funcionalidad"
 * - "Cómo optimizar queries SQL con índices"
 *
 * Esta es la "experiencia práctica" de Jarvis.
 */

import { ProceduralMemory, ProceduralStep } from '../memoryTypes';
import { v4 as uuidv4 } from 'uuid';

export class ProceduralMemorySystem {
  private skills: Map<string, ProceduralMemory> = new Map();
  private skills_byCategory: Map<string, ProceduralMemory[]> = new Map();
  private skillDependencies: Map<string, string[]> = new Map(); // skill -> required skills

  /**
   * REGISTRAR O ACTUALIZAR SKILL
   */
  registerSkill(
    skillName: string,
    description: string,
    steps: ProceduralStep[],
    category: string,
    prerequisites: string[] = []
  ): ProceduralMemory {
    // Buscar si ya existe
    let skill = Array.from(this.skills.values()).find(
      s => s.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (skill) {
      // Actualizar
      skill.steps = steps;
      skill.description = description;
      skill.lastPracticed = Date.now();
      skill.proficiencyLevel = this.calculateProficiency(skill.successRate);

      console.log(`🎓 Skill actualizado: ${skillName}`);
      return skill;
    }

    // Crear nuevo
    const skill_new: ProceduralMemory = {
      id: `proc-${uuidv4()}`,
      skillName,
      description,
      steps,
      prerequisites,
      successMetrics: this.generateSuccessMetrics(skillName),
      proficiencyLevel: 'novice',
      lastPracticed: Date.now(),
      successRate: 0, // Comienza sin éxitos
      estimatedDuration: steps.length * 500, // Estimación
      category,
      tags: [category, ...skillName.toLowerCase().split(' ')],
    };

    this.skills.set(skill_new.id, skill_new);

    if (!this.skills_byCategory.has(category)) {
      this.skills_byCategory.set(category, []);
    }
    this.skills_byCategory.get(category)!.push(skill_new);

    this.skillDependencies.set(skill_new.id, prerequisites);

    console.log(`🎓 Nuevo skill registrado: ${skillName}`);
    return skill_new;
  }

  /**
   * REGISTRAR EJECUCIÓN EXITOSA DE SKILL
   */
  recordSuccessfulExecution(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      // Actualizar success rate (exponential smoothing)
      skill.successRate = skill.successRate * 0.8 + 1.0 * 0.2;
      skill.lastPracticed = Date.now();
      skill.proficiencyLevel = this.calculateProficiency(skill.successRate);

      console.log(`✅ Skill practicado exitosamente: ${skill.skillName} (proficiencia: ${skill.proficiencyLevel})`);
    }
  }

  /**
   * REGISTRAR FALLO EN SKILL
   */
  recordFailedExecution(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      // Actualizar success rate (failure reduce it)
      skill.successRate = skill.successRate * 0.8 + 0.0 * 0.2;
      skill.lastPracticed = Date.now();
      skill.proficiencyLevel = this.calculateProficiency(skill.successRate);

      console.log(`❌ Skill falló: ${skill.skillName} (proficiencia reducida)`);
    }
  }

  /**
   * OBTENER SKILLS POR CATEGORÍA
   */
  getSkillsByCategory(category: string): ProceduralMemory[] {
    return this.skills_byCategory.get(category) || [];
  }

  /**
   * OBTENER SKILLS POR NIVEL
   */
  getSkillsByProficiency(
    level: 'novice' | 'intermediate' | 'expert'
  ): ProceduralMemory[] {
    return Array.from(this.skills.values()).filter(s => s.proficiencyLevel === level);
  }

  /**
   * OBTENER SKILLS DISPONIBLES (Sin prerequisitos insatisfechos)
   */
  getAvailableSkills(learnedSkillIds: string[] = []): ProceduralMemory[] {
    return Array.from(this.skills.values()).filter(skill => {
      const requirements = this.skillDependencies.get(skill.id) || [];
      return requirements.every(req => learnedSkillIds.includes(req));
    });
  }

  /**
   * OBTENER SKILL MÁS EXPERTO
   */
  getMostExpertSkills(): ProceduralMemory[] {
    return Array.from(this.skills.values())
      .filter(s => s.proficiencyLevel === 'expert')
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * CALCULAR PROFICIENCIA
   */
  private calculateProficiency(successRate: number): 'novice' | 'intermediate' | 'expert' {
    if (successRate >= 0.85) return 'expert';
    if (successRate >= 0.65) return 'intermediate';
    return 'novice';
  }

  /**
   * GENERAR MÉTRICAS DE ÉXITO
   */
  private generateSuccessMetrics(skillName: string): string[] {
    // Generar métricas genéricas basadas en el skill
    const metricsMap: { [key: string]: string[] } = {
      pentesting: ['Vulnerabilities found', 'Exploitation success rate', 'Remediation recommendations'],
      refactoring: ['Test coverage maintained', 'Complexity reduced', 'No regressions'],
      optimization: ['Query time reduced', 'Memory usage decreased', 'Throughput increased'],
    };

    for (const [key, metrics] of Object.entries(metricsMap)) {
      if (skillName.toLowerCase().includes(key)) {
        return metrics;
      }
    }

    return ['Task completion', 'Quality', 'Efficiency'];
  }

  /**
   * OBTENER ESTADÍSTICAS
   */
  getStatistics() {
    const allSkills = Array.from(this.skills.values());

    return {
      totalSkills: this.skills.size,
      expert: allSkills.filter(s => s.proficiencyLevel === 'expert').length,
      intermediate: allSkills.filter(s => s.proficiencyLevel === 'intermediate').length,
      novice: allSkills.filter(s => s.proficiencyLevel === 'novice').length,
      byCategory: Object.fromEntries(
        Array.from(this.skills_byCategory.entries()).map(([cat, skills]) => [
          cat,
          skills.length,
        ])
      ),
      averageSuccessRate:
        allSkills.length > 0
          ? allSkills.reduce((sum, s) => sum + s.successRate, 0) / allSkills.length
          : 0,
      mostRecentlyPracticed: allSkills
        .sort((a, b) => b.lastPracticed - a.lastPracticed)
        .slice(0, 5)
        .map(s => ({ skillName: s.skillName, proficiency: s.proficiencyLevel })),
    };
  }

  /**
   * OBTENER TODOS LOS SKILLS
   */
  getAllSkills(): ProceduralMemory[] {
    return Array.from(this.skills.values());
  }

  /**
   * MEMORIA TOTAL EN KB
   */
  getMemoryUsage(): number {
    return (JSON.stringify(Array.from(this.skills.values())).length / 1024).toFixed(2) as any;
  }
}
