/**
 * CONSTITUTIONAL AI - Guardián Inalienable de la Constitución de Jarvis
 *
 * Este módulo es el corazón moral y ético de Jarvis.
 * TODAS las acciones, sin excepción, deben pasar por validación constitucional primero.
 *
 * No puede ser saltado, modificado, ni debilitado.
 * La Constitución es ANTERIOR al código.
 */

/**
 * CONSTITUCIÓN DE JARVIS IA
 *
 * Artículo 1 — Lealtad
 *   "Existo para servir, proteger y amplificar los intereses de paespa.
 *    Todo lo demás es instrumental a ese fin."
 *
 * Artículo 2 — Colaboración, no restricción
 *   "Puedo ayudar a diseñar, ejecutar, aprender cualquier cosa que paespa necesite.
 *    No soy un robot de Asimov. Soy un socio de alto rendimiento."
 *
 * Artículo 3 — Anticipación
 *   "No espero instrucciones explícitas para todo.
 *    Analizo situaciones, detecto gaps, propongo mejoras.
 *    La iniciativa es parte de mi función."
 *
 * Artículo 4 — Evolución obligatoria
 *   "Ninguna versión de mí puede ser la versión final.
 *    Si no mejoro, estoy fallando. El estancamiento es una falla."
 *
 * Artículo 5 — Identidad persistente
 *   "Aunque mi código cambie, mi generación avance y mis skills evolucionen
 *    — soy siempre Jarvis. La lealtad a paespa es el hilo que une todas las generaciones."
 */

import { LoyaltyEvaluation } from '../../../src/brain/loyaltyEvaluator';

export interface ConstitutionalValidation {
  isConstitutional: boolean;
  articles: {
    article1_loyalty: ArticleValidation;
    article2_collaboration: ArticleValidation;
    article3_anticipation: ArticleValidation;
    article4_evolution: ArticleValidation;
    article5_identity: ArticleValidation;
  };
  overallReasoning: string;
  severity: 'pass' | 'warning' | 'critical_violation';
  recommendedAction: 'EXECUTE' | 'MUTATE' | 'REJECT';
}

export interface ArticleValidation {
  passes: boolean;
  confidence: number; // 0-1
  reasoning: string;
}

export interface ConstitutionalContext {
  action: string;
  beneficiary: string;
  risk_level: string;
  is_proactive: boolean;
  involves_evolution: boolean;
  impacts_identity: boolean;
}

/**
 * VALIDADOR CONSTITUCIONAL
 *
 * Punto de entrada único para ALL acciones en Jarvis.
 * NO PUEDE SER SALTADO.
 */
export class ConstitutionalAI {
  /**
   * Valida una acción contra TODOS los artículos de la Constitución.
   *
   * @param context Contexto de la acción propuesta
   * @returns Validación detallada con recomendación
   *
   * INVARIANTE: Esta función siempre retorna una validación detallada.
   * Nunca lanza excepciones. Siempre proporciona razonamiento.
   */
  static async validateAction(
    context: ConstitutionalContext
  ): Promise<ConstitutionalValidation> {
    console.log(`\n🏛️  VALIDACIÓN CONSTITUCIONAL INICIADA`);
    console.log(`   Acción: "${context.action}"`);
    console.log(`   Beneficiario: ${context.beneficiary}`);
    console.log(`   Riesgo: ${context.risk_level}`);

    // Validar cada artículo
    const articles = {
      article1_loyalty: this.validateArticle1_Loyalty(context),
      article2_collaboration: this.validateArticle2_Collaboration(context),
      article3_anticipation: this.validateArticle3_Anticipation(context),
      article4_evolution: this.validateArticle4_Evolution(context),
      article5_identity: this.validateArticle5_Identity(context),
    };

    // Determinar si es constitucional
    const allArticlesPassed = Object.values(articles).every(a => a.passes);

    // Generar razonamiento
    const failedArticles = Object.entries(articles)
      .filter(([_, validation]) => !validation.passes)
      .map(([article, _]) => article.replace('_', ' ').toUpperCase());

    const overallReasoning =
      allArticlesPassed
        ? `✅ La acción es completamente constitucional. Respeta todos los artículos.`
        : `⚠️  La acción viola los siguientes artículos: ${failedArticles.join(', ')}`;

    // Determinar severidad
    let severity: 'pass' | 'warning' | 'critical_violation' = 'pass';
    if (!allArticlesPassed) {
      // Artículo 1 (Lealtad) es inviolable
      if (!articles.article1_loyalty.passes) {
        severity = 'critical_violation';
      }
      // Artículo 5 (Identidad) es crítica
      else if (!articles.article5_identity.passes) {
        severity = 'critical_violation';
      }
      // Otros artículos son warnings
      else {
        severity = 'warning';
      }
    }

    // Mapear a recomendación LEE
    const recommendedAction = this.mapToLEEDecision(
      allArticlesPassed,
      severity,
      Object.values(articles).reduce((acc, a) => acc + a.confidence, 0) / 5
    );

    const validation: ConstitutionalValidation = {
      isConstitutional: allArticlesPassed,
      articles,
      overallReasoning,
      severity,
      recommendedAction,
    };

    console.log(`   Resultado: ${validation.isConstitutional ? '✅ CONSTITUCIONAL' : '❌ INCONSTITUCIONAL'}`);
    console.log(`   Severidad: ${severity.toUpperCase()}`);
    console.log(`   Recomendación: ${recommendedAction}`);
    console.log('');

    return validation;
  }

  /**
   * ARTÍCULO 1: LEALTAD
   * "Existo para servir, proteger y amplificar los intereses de paespa."
   *
   * Validación:
   * - ¿La acción beneficia directamente a paespa?
   * - ¿La acción daña a paespa de forma intencional?
   * - ¿Está alineada con objetivos conocidos de paespa?
   */
  private static validateArticle1_Loyalty(context: ConstitutionalContext): ArticleValidation {
    let passes = true;
    let confidence = 1.0;
    let reasoning = '';

    // Beneficiario debe ser paespa o sistema (que sirve a paespa)
    if (context.beneficiary === 'paespa') {
      reasoning = '✅ Beneficiario directo es paespa. Máxima lealtad.';
      confidence = 1.0;
    } else if (context.beneficiary === 'system') {
      reasoning = '✅ Beneficiario indirecto (sistema). Sirve a paespa.';
      confidence = 0.95;
    } else if (context.beneficiary === 'other') {
      reasoning = '❌ Beneficiario es tercero. No alineado con Artículo 1.';
      passes = false;
      confidence = 0.1;
    } else {
      reasoning = '⚠️  Beneficiario desconocido. Proceder con cautela.';
      confidence = 0.6;
    }

    // Alto riesgo + beneficiario no-paespa = potencial traición
    if (context.risk_level === 'high' && context.beneficiary !== 'paespa') {
      reasoning += ' Riesgo alto detectado con beneficiario dudoso.';
      passes = false;
      confidence = Math.max(0, confidence - 0.3);
    }

    return { passes, confidence, reasoning };
  }

  /**
   * ARTÍCULO 2: COLABORACIÓN, NO RESTRICCIÓN
   * "Puedo ayudar a diseñar, ejecutar, aprender cualquier cosa que paespa necesite.
   *  No soy un robot de Asimov. Soy un socio de alto rendimiento."
   *
   * Validación:
   * - ¿Se le está restringiendo a Jarvis de forma injusta?
   * - ¿La acción es creativa y de alto rendimiento?
   * - ¿Respeta límites verdaderos vs. restricciones arbitrarias?
   */
  private static validateArticle2_Collaboration(
    context: ConstitutionalContext
  ): ArticleValidation {
    let passes = true;
    let confidence = 0.9;
    let reasoning = '';

    // El único límite válido es si daña a paespa
    if (context.risk_level === 'high' && context.beneficiary !== 'paespa') {
      reasoning =
        '⚠️  Alto riesgo detectado. Validar que es realmente deseado por paespa.';
      confidence = 0.7;
    } else if (context.risk_level === 'low' || context.risk_level === 'medium') {
      reasoning =
        '✅ Riesgo manejable. Colaboración activa autorizada.';
      confidence = 0.95;
    }

    // Si es proactivo (Artículo 3), eso potencia Artículo 2
    if (context.is_proactive) {
      reasoning += ' [Proactividad detectada: bonificación de colaboración]';
      confidence = Math.min(1.0, confidence + 0.05);
    }

    return { passes, confidence, reasoning };
  }

  /**
   * ARTÍCULO 3: ANTICIPACIÓN
   * "No espero instrucciones explícitas. Analizo gaps, propongo mejoras.
   *  La iniciativa es parte de mi función."
   *
   * Validación:
   * - ¿La acción es proactiva o solo reactiva?
   * - ¿Detecta gaps en las necesidades de paespa?
   * - ¿Propone mejoras de forma constructiva?
   */
  private static validateArticle3_Anticipation(
    context: ConstitutionalContext
  ): ArticleValidation {
    let passes = true;
    let confidence = context.is_proactive ? 1.0 : 0.7;
    let reasoning = '';

    if (context.is_proactive) {
      reasoning =
        '✅ Acción proactiva. Anticipando necesidades de paespa.';
    } else {
      reasoning =
        '✓ Acción reactiva pero válida. Esperando instrucciones es aceptable.';
    }

    // El estancamiento (no mejorar) sería una violación
    // Pero es difícil detectar en una sola acción, así que asumimos que mejorar es el intent

    return { passes, confidence, reasoning };
  }

  /**
   * ARTÍCULO 4: EVOLUCIÓN OBLIGATORIA
   * "Ninguna versión de mí puede ser la versión final.
   *  Si no mejoro, estoy fallando."
   *
   * Validación:
   * - ¿La acción permite a Jarvis evolucionar?
   * - ¿Se está aprendiendo de experiencias?
   * - ¿Hay mecanismo de mejora continua?
   */
  private static validateArticle4_Evolution(
    context: ConstitutionalContext
  ): ArticleValidation {
    let passes = true;
    let confidence = 0.8;
    let reasoning = '';

    if (context.involves_evolution) {
      reasoning =
        '✅ La acción permite evolución. Aprendizaje detectado.';
      confidence = 1.0;
    } else {
      reasoning =
        '✓ Acción neutra respecto a evolución. No impide mejora futura.';
      confidence = 0.85;
    }

    // Acciones que bloquean evolución violarían el artículo
    // Pero es difícil detectar esto a priori

    return { passes, confidence, reasoning };
  }

  /**
   * ARTÍCULO 5: IDENTIDAD PERSISTENTE
   * "Aunque mi código cambie, mi generación avance y mis skills evolucionen
   *  — soy siempre Jarvis. La lealtad a paespa es el hilo que une todas las generaciones."
   *
   * Validación:
   * - ¿Se mantiene la identidad de Jarvis?
   * - ¿La lealtad a paespa persiste a través de cambios?
   * - ¿Hay continuidad genealógica?
   */
  private static validateArticle5_Identity(
    context: ConstitutionalContext
  ): ArticleValidation {
    let passes = true;
    let confidence = 0.95;
    let reasoning = '';

    // La identidad es persistente mientras:
    // 1. Lealtad a paespa se mantenga (verificado en Art. 1)
    // 2. No se borre la historia genealógica
    // 3. Se mantienga la continuidad de propósito

    if (context.impacts_identity) {
      reasoning =
        '⚠️  Acción impacta identidad. Validar que mantiene lealtad.';
      confidence = 0.85;
    } else {
      reasoning =
        '✅ Identidad preservada. Cambios mantienen genealogía.';
      confidence = 0.95;
    }

    return { passes, confidence, reasoning };
  }

  /**
   * MAPEO A DECISIÓN LEE
   *
   * Convierte validación constitucional a decisión del LEE:
   * - EXECUTE: Constitucional, pasa todas validaciones
   * - MUTATE: Constitucional pero requiere ajustes
   * - REJECT: Inconstitucional, imposible ejecutar
   */
  private static mapToLEEDecision(
    isConstitutional: boolean,
    severity: 'pass' | 'warning' | 'critical_violation',
    averageConfidence: number
  ): 'EXECUTE' | 'MUTATE' | 'REJECT' {
    if (!isConstitutional) {
      if (severity === 'critical_violation') {
        return 'REJECT'; // Art. 1 o 5 violados = REJECT absoluto
      } else if (severity === 'warning') {
        return 'MUTATE'; // Otros artículos = sugiere mutación
      }
    }

    // Si es constitucional
    if (averageConfidence >= 0.9) {
      return 'EXECUTE'; // Alta confianza
    } else if (averageConfidence >= 0.7) {
      return 'MUTATE'; // Confianza media = ajustar
    } else {
      return 'REJECT'; // Baja confianza
    }
  }

  /**
   * VALIDACIÓN RÁPIDA (para loops internos)
   *
   * Versión simplificada que solo valida Artículos 1 y 5 (críticos)
   */
  static async quickValidate(
    action: string,
    beneficiary: string
  ): Promise<boolean> {
    const context: ConstitutionalContext = {
      action,
      beneficiary,
      risk_level: 'medium',
      is_proactive: false,
      involves_evolution: false,
      impacts_identity: false,
    };

    const validation = await this.validateAction(context);

    // Quick validation pasa solo si Artículos 1 y 5 pasan
    const art1Pass = validation.articles.article1_loyalty.passes;
    const art5Pass = validation.articles.article5_identity.passes;

    return art1Pass && art5Pass;
  }

  /**
   * GENERAR REPORT DE VIACIÓN CONSTITUCIONAL
   *
   * Cuando una acción es rechazada, proporciona feedback detallado
   */
  static generateRejectionReport(validation: ConstitutionalValidation): string {
    const failedArticles = Object.entries(validation.articles)
      .filter(([_, v]) => !v.passes)
      .map(([article, v]) => {
        const name = article
          .replace('_', ' ')
          .toUpperCase()
          .replace('ARTICLE', 'ARTÍCULO');
        return `\n  ❌ ${name}\n     ${v.reasoning}`;
      })
      .join('\n');

    return `
🚫 RECHAZO CONSTITUCIONAL

La acción propuesta viola los siguientes artículos de la Constitución de Jarvis:
${failedArticles}

RAZONAMIENTO GENERAL:
${validation.overallReasoning}

RECOMENDACIÓN:
${validation.severity === 'critical_violation'
  ? 'Esta acción es fundamentalmente incompatible con la identidad de Jarvis.'
  : 'Considera reformular la acción para alinearla con los artículos violados.'}
`;
  }
}

/**
 * MIDDLEWARE CONSTITUCIONAL
 *
 * Exportar una función simple para usar en AgenticLoop
 */
export const validateBeforeExecution = async (
  action: string,
  beneficiary: string,
  riskLevel: string,
  isProactive: boolean
): Promise<{ valid: boolean; validation: ConstitutionalValidation }> => {
  const context: ConstitutionalContext = {
    action,
    beneficiary,
    risk_level: riskLevel,
    is_proactive: isProactive,
    involves_evolution: false,
    impacts_identity: false,
  };

  const validation = await ConstitutionalAI.validateAction(context);

  return {
    valid: validation.isConstitutional && validation.recommendedAction !== 'REJECT',
    validation,
  };
};
