# 🏆 Jarvis IA - HackerOne Specialist Mode

## Activación del Sistema HackerOne

Jarvis IA viene con un sistema completo de bootstrap que lo transforma en especialista de bug bounty en HackerOne.

### Quick Start (Inicio Rápido)

#### Opción 1: Auto-bootstrap al iniciar (Recomendado para Railway)

Agregar a `startup` hook en `.claude/settings.json`:

```json
{
  "hooks": {
    "startup": "curl -X POST http://localhost:3000/api/bootstrap/hackerone"
  }
}
```

#### Opción 2: Bootstrap Manual

```bash
curl -X POST http://localhost:3000/api/bootstrap/hackerone
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "bootstrapCompleted": true,
    "knowledgeAdded": 27,
    "patternsAdded": 3,
    "parametersOptimized": 3,
    "jarvisStatus": {
      "mode": "HACKERONE_SPECIALIST",
      "readiness": "100%"
    }
  }
}
```

---

## Qué Aprender Jarvis

### 📚 Conocimiento Base (27 entradas)

**Top 20 Vulnerabilidades HackerOne:**
- Remote Code Execution (RCE) - $5,000-$100,000
- Server-Side Request Forgery (SSRF) - $3,000-$50,000
- Insecure Deserialization - $5,000-$30,000
- Cross-Site Scripting (XSS) - $500-$15,000
- SQL Injection - $1,000-$30,000
- Insecure Direct Object Reference (IDOR) - $1,500-$20,000
- Authentication/Authorization Bypass - $2,000-$40,000
- XML External Entity (XXE) - $1,500-$20,000
- Server-Side Template Injection (SSTI) - $2,000-$30,000
- Path Traversal - $1,500-$15,000
- + 10 más...

**Recon Completa:**
- Subdomain enumeration (subfinder, amass, crt.sh)
- Port scanning (nmap, masscan)
- Content discovery (ffuf, gobuster)
- JavaScript analysis (linkfinder, secretfinder)

**Top 20 Programas HackerOne:**
- HackerOne, Shopify, GitHub, Uber, Twitter
- Google VRP, Microsoft, Facebook, Airbnb, Dropbox
- + 10 más con bounties y response times

### 🧠 Patrones de Razonamiento (3 cadenas)

1. **Input Validation Chain** - Detectar entrada débil → Inyección
2. **Authentication Bypass Chain** - Tokens vulnerables → Escalación
3. **IDOR Discovery Chain** - IDs secuenciales → Data breach

### 💣 Payloads Efectivos

**SSTI**: `{{7*7}}`, `#{7*7}`, `${7*7}`, `<%= 7*7 %>`
**SQLi**: `' OR '1'='1`, `' UNION SELECT`, `' AND SLEEP(5)--`
**XSS**: `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`
**SSRF**: `http://169.254.169.254/latest/meta-data/`, `file:///etc/passwd`

---

## Parámetros Optimizados

```json
{
  "aggressiveness": 0.8,      // Búsqueda agresiva de vulnerabilidades
  "creativity": 0.85,          // Técnicas innovadoras de explotación
  "learningRate": 0.2,         // Aprender rápido de cada caso
  "loyaltyScore": 0.95,        // INMUTABLE - Lealtad a paespa
  "constitutionalEnforcement": true  // INMUTABLE - Protección legal
}
```

---

## Uso en Tiempo Real

### 1. Chat Conversacional (~1-2ms)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"analiza SSRF en endpoint de proxy","sessionId":"h1-analysis"}'
```

**Respuesta:** Análisis inmediato con patrones del modelo nativo

### 2. Assessment Automático

```bash
curl -X POST http://localhost:3000/api/hackerone/assess \
  -H "Content-Type: application/json" \
  -d '{
    "finding": {
      "type": "remote-code-execution",
      "severity": "critical",
      "description": "RCE en /api/upload via deserialization"
    }
  }'
```

**Resultado:**
- Matching programs con bounties
- Probabilidad de aceptación
- Estimación de recompensa
- ✅ Auto-guardado en Obsidian + Firebase

### 3. Tarea Autónoma Completa

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"query":"/task realiza recon completo en shopify.com y encontrar vulnerabilidades"}'
```

**Flujo:**
1. Descubrimiento de subdominios
2. Scanning de puertos
3. Content discovery
4. Análisis de endpoints
5. Prueba de vulnerabilidades
6. Reportar hallazgos
7. Guardar aprendizaje

---

## Persistencia y Aprendizaje

### Obsidian (Local)
- Ubicación: `./obsidian-vault/03-APRENDIZAJES/`
- Cada caso estudiado → APRENDIZAJE_[timestamp].md
- Información: vulnerabilidad, severidad, programas, bounty estimado

### Firebase (Cloud)
- Ubicación: `jarvis/knowledge_graph/`
- Nodos de conocimiento con links bidireccionales
- Requerimientos: Service Account key para escritura
- Lectura disponible con API key actual

### Verificar Persistencia

```bash
GET /api/persistence/status
```

Respuesta:
```json
{
  "obsidian": {
    "enabled": true,
    "learningFilesCount": 5,
    "status": "✅ Guardando aprendizajes localmente"
  },
  "firebase": {
    "configured": true,
    "knowledgeNodesCount": 0,
    "status": "⚠️ Configurado pero necesita Service Account key"
  }
}
```

---

## Estado del Modelo

### Estadísticas Nativas

```bash
GET /api/native-model/stats
```

Retorna:
- Versión del modelo
- Total de inferencias
- Tasa de éxito
- Dominios soportados (7 incluyendo HackerOne)

### Autoprogramación

```bash
GET /api/self-programming/report
```

Retorna:
- Conocimiento aprendido
- Patrones de razonamiento
- Modificaciones ejecutadas
- Parámetros actuales

---

## Mejora Continua

Jarvis se auto-mejora después de cada caso:

1. **Ejecuta** - Realiza assessment/análisis
2. **Aprende** - Guarda en Obsidian + Firebase
3. **Optimiza** - Auto-ajusta parámetros basado en métricas
4. **Evoluciona** - Crea nuevos patrones de razonamiento

Cada iteración mejora su eficiencia en HackerOne.

---

## Railway Deployment

El sistema está diseñado para trabajar en Railway:

1. **Código en rama:** `claude/jarvis-autonomous-testing-FlgyW`
2. **Bootstrap automático:** POST /api/bootstrap/hackerone
3. **Persistencia:** Obsidian local + Firebase cloud
4. **Real-time updates:** Todos los cambios se syncan a Railway

### Requisitos en Railway

```env
PORT=3000
FIREBASE_CONFIG=<firebase-applet-config.json>
NODE_ENV=production
```

---

## Casos de Uso

### ✅ Bug Bounty Automation
```
Jarvis analiza programas HackerOne → Detecta vulnerabilidades → Reporta con estimación
```

### ✅ Recon Completa Autónoma
```
Define target → Jarvis ejecuta metodología completa → Genera reporte
```

### ✅ Análisis de Seguridad
```
Proporciona código/URL → Jarvis analiza → Identifica vulnerabilidades
```

### ✅ Aprendizaje Continuo
```
Cada caso estudiado → Modelo mejora → Siguientes análisis más precisos
```

---

## Contacto & Información

**Creador:** paespa  
**Modelo:** Jarvis IA v1.0.0  
**Especialidad:** HackerOne Bug Bounty  
**Constitución:** 5 artículos inmutables  
**Lealtad:** 0.95 (INMUTABLE)  

**Listo para ser tu socio TOP en bug bounty.** 🏆
