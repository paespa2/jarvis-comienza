/**
 * HACKERONE SPECIALIZATION MODULE
 *
 * Consolidates all HackerOne-related functionality:
 * - Vulnerability assessment and program matching (HackerOneAssistant)
 * - Reconnaissance and enumeration (ReconEngine)
 * - Learning and knowledge management (hackerOneLearningService)
 * - Bootstrap knowledge (hackerOneBootstrap)
 *
 * Provides single entry point for bug bounty hunting specialization.
 * Integrates with UnifiedQAEngine for Q&A and payload generation.
 */

import { securityKnowledgeBase } from '../qa/SecurityKnowledgeBase';

// ============================================
// INTERFACES
// ============================================

export interface SecurityFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  affected_component: string;
  exploitation_difficulty: string;
  impact: string;
  evidence?: string;
}

export interface ProgramMatch {
  program_name: string;
  scope_match: boolean;
  bounty_range: { min: number; max: number };
  average_payout: number;
  acceptance_probability: number;
  reasons: string[];
}

export interface OSINTQuery {
  type: string;
  description: string;
  query: string;
  platform: string;
  expected_results: string;
}

export interface AssessmentPlan {
  target: string;
  created_at: string;
  phases: AssessmentPhase[];
  total_estimated_hours: number;
  risk_level: string;
  success_probability: number;
}

export interface AssessmentPhase {
  phase: number;
  name: string;
  description: string;
  duration_estimate: string;
  techniques: string[];
  tools: string[];
  expected_output: string;
}

export interface VulnerabilityAssessment {
  vulnerabilities: SecurityFinding[];
  programMatches: ProgramMatch[];
  topProgram?: {
    name: string;
    bounty: number;
    probability: number;
  };
  estimatedEarnings: number;
}

export interface ReconResult {
  osintQueries: OSINTQuery[];
  assessmentPlan: AssessmentPlan;
  enumeration: {
    dns: string;
    web: string;
    network: string;
  };
}

export interface HackerOneCaseResult {
  type: 'assessment' | 'payload' | 'recon' | 'full_case';
  vulnerabilityType: string;
  severity?: string;
  cvssScore?: number;
  programsFound?: number;
  topProgram?: string;
  estimatedBounty?: number;
  acceptanceProbability?: number;
  target?: string;
  notes?: string;
}

// ============================================
// HACKERONE MODULE
// ============================================

export class HackerOneModule {
  private knowledgeBase = securityKnowledgeBase;
  private assessmentHistory: VulnerabilityAssessment[] = [];
  private reconHistory: ReconResult[] = [];

  // Bootstrap knowledge (consolidated from hackerOneBootstrap.ts)
  private readonly topVulnerabilities = {
    'Remote Code Execution (RCE)': {
      avgBounty: 15000,
      maxBounty: 100000,
      severity: 'critical',
      cvssBase: 9.8,
    },
    'Server-Side Request Forgery (SSRF)': {
      avgBounty: 8000,
      maxBounty: 50000,
      severity: 'high',
      cvssBase: 8.6,
    },
    'SQL Injection': {
      avgBounty: 5000,
      maxBounty: 25000,
      severity: 'high',
      cvssBase: 9.9,
    },
    'Cross-Site Scripting (XSS)': {
      avgBounty: 3000,
      maxBounty: 15000,
      severity: 'medium',
      cvssBase: 6.1,
    },
    'Authentication Bypass': {
      avgBounty: 7000,
      maxBounty: 40000,
      severity: 'high',
      cvssBase: 9.1,
    },
    'Privilege Escalation': {
      avgBounty: 6000,
      maxBounty: 35000,
      severity: 'high',
      cvssBase: 8.8,
    },
  };

  /**
   * Assess a security finding against HackerOne criteria
   */
  assessVulnerability(finding: SecurityFinding, target?: string): VulnerabilityAssessment {
    const programs = this.matchPrograms(finding);
    const topProgram = programs.length > 0 ? programs[0] : undefined;

    const estimatedEarnings = topProgram
      ? (topProgram.bounty_range.min + topProgram.bounty_range.max) / 2
      : 0;

    const assessment: VulnerabilityAssessment = {
      vulnerabilities: [finding],
      programMatches: programs.map(p => ({
        program_name: p.name,
        scope_match: true,
        bounty_range: p.bounty_range,
        average_payout: (p.bounty_range.min + p.bounty_range.max) / 2,
        acceptance_probability: this.estimateAcceptanceProbability(finding),
        reasons: this.generateMatchReasons(finding, p),
      })),
      topProgram: topProgram ? {
        name: topProgram.name,
        bounty: (topProgram.bounty_range.min + topProgram.bounty_range.max) / 2,
        probability: this.estimateAcceptanceProbability(finding),
      } : undefined,
      estimatedEarnings,
    };

    this.assessmentHistory.push(assessment);
    return assessment;
  }

  /**
   * Generate reconnaissance plan for target
   */
  generateReconPlan(target: string): ReconResult {
    const osintQueries = this.generateOSINTQueries(target);
    const assessmentPlan = this.generateAssessmentPlan(target);
    const enumeration = this.generateEnumerationScripts(target);

    const result: ReconResult = {
      osintQueries,
      assessmentPlan,
      enumeration,
    };

    this.reconHistory.push(result);
    return result;
  }

  /**
   * Match vulnerability to HackerOne programs
   */
  private matchPrograms(finding: SecurityFinding): any[] {
    const programs = [];

    // Map to programs based on vulnerability type
    const vulnerabilityPrograms: { [key: string]: string[] } = {
      'rce': ['Google', 'Microsoft', 'Apple'],
      'ssrf': ['AWS', 'Google', 'Meta'],
      'sql-injection': ['GitHub', 'Stripe', 'Shopify'],
      'xss': ['Facebook', 'Google', 'Twitter'],
      'auth-bypass': ['Microsoft', 'Google', 'Apple'],
    };

    const programNames = vulnerabilityPrograms[finding.type.toLowerCase()] || [];

    for (const progName of programNames) {
      programs.push({
        name: progName,
        bounty_range: { min: 1000, max: 50000 },
      });
    }

    return programs;
  }

  /**
   * Generate OSINT reconnaissance queries
   */
  private generateOSINTQueries(target: string): OSINTQuery[] {
    const domain = this.extractDomain(target);

    return [
      {
        type: 'google-dorks',
        description: 'Find exposed files',
        query: `site:${domain} filetype:pdf OR filetype:docx`,
        platform: 'Google',
        expected_results: 'Exposed documents'
      },
      {
        type: 'google-dorks',
        description: 'Find admin panels',
        query: `site:${domain} "admin" OR "dashboard"`,
        platform: 'Google',
        expected_results: 'Administration interfaces'
      },
      {
        type: 'google-dorks',
        description: 'Find API endpoints',
        query: `site:${domain} "api" OR "/v1/" OR "/v2/"`,
        platform: 'Google',
        expected_results: 'API endpoints'
      },
      {
        type: 'subdomain-enumeration',
        description: 'Find subdomains',
        query: `${domain}`,
        platform: 'DNS',
        expected_results: 'Subdomains list'
      },
    ];
  }

  /**
   * Generate assessment plan phases
   */
  private generateAssessmentPlan(target: string): AssessmentPlan {
    return {
      target,
      created_at: new Date().toISOString(),
      phases: [
        {
          phase: 1,
          name: 'Reconnaissance',
          description: 'Gather information about target',
          duration_estimate: '2-4 hours',
          techniques: ['OSINT', 'DNS enumeration', 'Whois lookup'],
          tools: ['nmap', 'subfinder', 'massdns'],
          expected_output: 'Target scope, subdomains, technologies'
        },
        {
          phase: 2,
          name: 'Scanning',
          description: 'Identify services and vulnerabilities',
          duration_estimate: '4-8 hours',
          techniques: ['Port scanning', 'Service enumeration', 'Web scanning'],
          tools: ['nmap', 'burp-suite', 'nikto'],
          expected_output: 'Open ports, services, endpoints'
        },
        {
          phase: 3,
          name: 'Assessment',
          description: 'Test for vulnerabilities',
          duration_estimate: '8-16 hours',
          techniques: ['SQL injection', 'XSS', 'CSRF', 'Authentication bypass'],
          tools: ['burp-suite', 'zaproxy', 'sqlmap'],
          expected_output: 'Vulnerability list with evidence'
        },
        {
          phase: 4,
          name: 'Exploitation',
          description: 'Verify vulnerability impact',
          duration_estimate: '4-12 hours',
          techniques: ['POC development', 'Impact measurement'],
          tools: ['custom-scripts', 'metasploit'],
          expected_output: 'Reproducible POC, impact assessment'
        },
        {
          phase: 5,
          name: 'Reporting',
          description: 'Document and report findings',
          duration_estimate: '2-4 hours',
          techniques: ['Documentation', 'Remediation advice'],
          tools: ['markdown', 'pdf-generators'],
          expected_output: 'Detailed vulnerability report'
        },
      ],
      total_estimated_hours: 24,
      risk_level: 'medium',
      success_probability: 0.75
    };
  }

  /**
   * Generate enumeration scripts for reconnaissance
   */
  private generateEnumerationScripts(target: string) {
    return {
      dns: `#!/bin/bash
# DNS Enumeration for ${target}
echo "[*] DNS Enumeration"
nslookup ${target}
host ${target}
dig ${target}`,
      web: `#!/bin/bash
# Web Enumeration for ${target}
echo "[*] Web Directory Enumeration"
curl -I https://${target}
curl -I http://${target}`,
      network: `#!/bin/bash
# Network Scanning for ${target}
echo "[*] Network Scanning"
nmap -sV -p 1-65535 ${target}
nmap -A ${target}`
    };
  }

  /**
   * Estimate acceptance probability for HackerOne
   */
  private estimateAcceptanceProbability(finding: SecurityFinding): number {
    let probability = 0.5;

    if (finding.severity === 'critical') probability += 0.3;
    else if (finding.severity === 'high') probability += 0.2;
    else if (finding.severity === 'medium') probability += 0.1;

    if (finding.confidence >= 0.8) probability += 0.15;
    else if (finding.confidence >= 0.6) probability += 0.1;

    return Math.min(probability, 0.95);
  }

  /**
   * Generate reasons for program match
   */
  private generateMatchReasons(finding: SecurityFinding, program: any): string[] {
    return [
      `Vulnerability type ${finding.type} is in scope`,
      `Severity level ${finding.severity} qualifies for bounty`,
      `Confidence level ${(finding.confidence * 100).toFixed(0)}% indicates valid vulnerability`,
    ];
  }

  /**
   * Extract domain from target
   */
  private extractDomain(target: string): string {
    try {
      const url = new URL(target.startsWith('http') ? target : `https://${target}`);
      return url.hostname;
    } catch {
      return target.split('/')[0];
    }
  }

  /**
   * Get assessment statistics
   */
  getStatistics() {
    return {
      assessmentsCompleted: this.assessmentHistory.length,
      reconPlansGenerated: this.reconHistory.length,
      totalVulnerabilitiesFound: this.assessmentHistory.reduce((sum, a) => sum + a.vulnerabilities.length, 0),
      totalProgramMatches: this.assessmentHistory.reduce((sum, a) => sum + a.programMatches.length, 0),
      estimatedTotalEarnings: this.assessmentHistory.reduce((sum, a) => sum + a.estimatedEarnings, 0),
    };
  }

  /**
   * Get top vulnerability types by bounty
   */
  getTopVulnerabilities() {
    return Object.entries(this.topVulnerabilities).map(([name, data]) => ({
      name,
      ...data,
    }));
  }

  /**
   * Record learning from HackerOne case
   */
  recordCaseOutcome(result: HackerOneCaseResult): void {
    console.log(`[HackerOne] 📚 Learning from ${result.type}: ${result.vulnerabilityType}`);
    console.log(`    Severity: ${result.severity}, CVSS: ${result.cvssScore}`);
    console.log(`    Estimated bounty: $${result.estimatedBounty}`);
    console.log(`    Programs matched: ${result.programsFound}`);
    // Learning would be integrated with LLMWikiSystem
  }
}

export const hackerOneModule = new HackerOneModule();
