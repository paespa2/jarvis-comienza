/**
 * CASE MANAGER - Gestión de vulnerabilidades encontradas
 * Persiste en JarvisLocalDB y sincroniza con el sistema
 */

import { jarvisLocalDB } from './JarvisLocalDB';
import { v4 as uuidv4 } from 'uuid';

export interface VulnerabilityCase {
  id: string;
  timestamp: number;
  target: string;
  type: string;
  severity: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  cvss: number;
  location: string;
  parameter?: string;
  payload?: string;
  screenshot?: string;
  poc?: string;
  impact: string;
  bountyEstimate: number;
  hackeroneProgram?: string;
  status: 'discovered' | 'documented' | 'submitted' | 'resolved';
  steps?: { title: string; description: string; screenshot?: string }[];
}

class CaseManager {
  private cases: Map<string, VulnerabilityCase> = new Map();

  async initialize() {
    // Load from JarvisLocalDB
    const stored = await jarvisLocalDB.getRecentInteractions(100);
    console.log('[CaseManager] Initialized with local DB');
  }

  /**
   * Create a new vulnerability case
   */
  async createCase(data: Partial<VulnerabilityCase>): Promise<VulnerabilityCase> {
    const caseData: VulnerabilityCase = {
      id: uuidv4(),
      timestamp: Date.now(),
      target: data.target || 'unknown',
      type: data.type || 'unknown',
      severity: data.severity || 'Media',
      cvss: data.cvss || 0,
      location: data.location || '',
      parameter: data.parameter,
      payload: data.payload,
      screenshot: data.screenshot,
      poc: data.poc,
      impact: data.impact || '',
      bountyEstimate: data.bountyEstimate || 0,
      hackeroneProgram: data.hackeroneProgram,
      status: 'discovered',
      steps: data.steps || []
    };

    this.cases.set(caseData.id, caseData);

    // Store in JarvisLocalDB
    await jarvisLocalDB.recordInteraction({
      intent: 'vulnerability_found',
      message: `${caseData.type} in ${caseData.target}`,
      response: `Case ${caseData.id} created`,
      confidence: 0.95,
      responseTime: 0,
      systemsUsed: ['vulnerability_detection'],
      qualityScore: 0.9
    });

    return caseData;
  }

  /**
   * Get all cases
   */
  getAllCases(): VulnerabilityCase[] {
    return Array.from(this.cases.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get cases by target
   */
  getCasesByTarget(target: string): VulnerabilityCase[] {
    return this.getAllCases().filter(c => c.target.includes(target));
  }

  /**
   * Get cases by severity
   */
  getCasesBySeverity(severity: string): VulnerabilityCase[] {
    return this.getAllCases().filter(c => c.severity === severity);
  }

  /**
   * Update case status
   */
  async updateCaseStatus(caseId: string, status: VulnerabilityCase['status']): Promise<void> {
    const caseData = this.cases.get(caseId);
    if (caseData) {
      caseData.status = status;
      await jarvisLocalDB.recordInteraction({
        intent: 'case_updated',
        message: `Case ${caseId} status: ${status}`,
        response: 'Status updated',
        confidence: 1.0,
        responseTime: 0,
        systemsUsed: ['case_management'],
        qualityScore: 1.0
      });
    }
  }

  /**
   * Add step to case
   */
  async addCaseStep(
    caseId: string,
    step: { title: string; description: string; screenshot?: string }
  ): Promise<void> {
    const caseData = this.cases.get(caseId);
    if (caseData) {
      if (!caseData.steps) caseData.steps = [];
      caseData.steps.push(step);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const cases = this.getAllCases();
    return {
      total: cases.length,
      bySeverity: {
        critica: cases.filter(c => c.severity === 'Crítica').length,
        alta: cases.filter(c => c.severity === 'Alta').length,
        media: cases.filter(c => c.severity === 'Media').length,
        baja: cases.filter(c => c.severity === 'Baja').length
      },
      byStatus: {
        discovered: cases.filter(c => c.status === 'discovered').length,
        documented: cases.filter(c => c.status === 'documented').length,
        submitted: cases.filter(c => c.status === 'submitted').length,
        resolved: cases.filter(c => c.status === 'resolved').length
      },
      totalBounty: cases.reduce((sum, c) => sum + c.bountyEstimate, 0),
      averageCVSS: cases.length > 0 ? (cases.reduce((sum, c) => sum + c.cvss, 0) / cases.length).toFixed(1) : 0
    };
  }

  /**
   * Export case to JSON
   */
  exportCase(caseId: string): string {
    const caseData = this.cases.get(caseId);
    if (!caseData) return '{}';
    return JSON.stringify(caseData, null, 2);
  }

  /**
   * Export all cases
   */
  exportAllCases(): string {
    return JSON.stringify(this.getAllCases(), null, 2);
  }

  /**
   * Generate HTML report for case
   */
  generateCaseReport(caseId: string): string {
    const caseData = this.cases.get(caseId);
    if (!caseData) return '';

    const severityColor = {
      'Crítica': '#ef4444',
      'Alta': '#f59e0b',
      'Media': '#f59e0b',
      'Baja': '#10b981'
    };

    let stepsHTML = '';
    if (caseData.steps && caseData.steps.length > 0) {
      stepsHTML = `
        <h3 style="color: #00d4ff; margin-top: 24px; border-bottom: 1px solid rgba(0,212,255,0.2); padding-bottom: 8px;">
          📋 Pasos de Reproducción
        </h3>
        ${caseData.steps
          .map(
            (step, i) => `
          <div style="margin: 16px 0; padding: 12px; background: rgba(15,22,40,0.8); border-radius: 6px;">
            <h4 style="color: #8b5cf6; margin-bottom: 8px;">Paso ${i + 1}: ${step.title}</h4>
            <p style="color: #94a3b8; margin: 8px 0;">${step.description}</p>
            ${step.screenshot ? `<img src="${step.screenshot}" style="max-width: 100%; margin-top: 12px; border-radius: 4px; border: 1px solid rgba(0,212,255,0.2);">` : ''}
          </div>
        `
          )
          .join('')}
      `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte: ${caseData.type} - ${caseData.target}</title>
  <style>
    body {
      background: #070b1a;
      color: #e2e8f0;
      font-family: 'Inter', sans-serif;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #00d4ff; border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; }
    h2 { color: #8b5cf6; margin-top: 32px; }
    .header-info {
      background: rgba(15,22,40,0.8);
      border: 1px solid rgba(0,212,255,0.2);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-item { }
    .info-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-value { color: #00d4ff; font-size: 16px; font-weight: 600; margin-top: 4px; font-family: 'Roboto Mono'; }
    .severity { color: ${severityColor[caseData.severity]}; font-weight: 700; }
    .impact-box {
      background: rgba(239,68,68,0.1);
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
    }
    .poc-box {
      background: rgba(15,22,40,0.8);
      border: 1px solid rgba(0,212,255,0.2);
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      font-family: 'Roboto Mono';
      font-size: 12px;
      overflow-x: auto;
    }
    code { color: #10b981; }
    footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid rgba(0,212,255,0.2);
      color: #475569;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔓 ${caseData.type}</h1>
    <p style="color: #94a3b8; font-size: 14px; margin: 8px 0;">
      Generado el ${new Date(caseData.timestamp).toLocaleString('es-MX')} | ID: ${caseData.id}
    </p>

    <div class="header-info">
      <div class="info-item">
        <div class="info-label">Target</div>
        <div class="info-value">${caseData.target}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Severidad</div>
        <div class="info-value severity">${caseData.severity}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CVSS Score</div>
        <div class="info-value">${caseData.cvss.toFixed(1)} / 10</div>
      </div>
      <div class="info-item">
        <div class="info-label">Bounty Estimado</div>
        <div class="info-value">$${caseData.bountyEstimate.toLocaleString()}</div>
      </div>
    </div>

    <h2>📍 Ubicación</h2>
    <div style="background: rgba(15,22,40,0.8); border-left: 3px solid #00d4ff; padding: 12px; border-radius: 4px;">
      <code style="color: #00d4ff;">${caseData.location}</code>
      ${caseData.parameter ? `<div style="margin-top: 8px; color: #94a3b8;">Parámetro: <code style="color: #10b981;">${caseData.parameter}</code></div>` : ''}
    </div>

    <h2>💥 Impacto</h2>
    <div class="impact-box">
      ${caseData.impact}
    </div>

    ${caseData.payload ? `
      <h2>🎯 Payload</h2>
      <div class="poc-box">
        ${caseData.payload}
      </div>
    ` : ''}

    ${caseData.poc ? `
      <h2>🛠️ POC (Proof of Concept)</h2>
      <div class="poc-box">
        ${caseData.poc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
    ` : ''}

    ${caseData.screenshot ? `
      <h2>📸 Screenshot</h2>
      <div style="margin: 16px 0;">
        <img src="${caseData.screenshot}" style="max-width: 100%; border-radius: 6px; border: 1px solid rgba(0,212,255,0.2);">
      </div>
    ` : ''}

    ${stepsHTML}

    <h2>✅ Recomendaciones</h2>
    <ul style="color: #94a3b8; line-height: 2;">
      <li>Validar y sanitizar todos los inputs de usuario</li>
      <li>Implementar prepared statements para prevenir SQLi</li>
      <li>Usar Content Security Policy (CSP) headers</li>
      <li>Actualizar todas las dependencias vulnerables</li>
      <li>Realizar auditoría de seguridad completa</li>
    </ul>

    <footer>
      Reporte generado por JARVIS v2.0-Kimi-K26 | HackerOne Mode
    </footer>
  </div>
</body>
</html>
    `;
  }
}

export const caseManager = new CaseManager();
