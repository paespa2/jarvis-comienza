# ⚡ PHASE 2 QUICK START GUIDE

## 🎯 5-Minute Setup

### 1. Install Dependencies
```bash
cd jarvis-comienza
npm install
```

### 2. Set Environment Variables
```bash
# Create .env file
echo "HACKERONE_API_KEY=your_key" > .env
echo "HACKERONE_USERNAME=your_username" >> .env
echo "GOOGLE_SEARCH_API_KEY=your_key" >> .env
```

### 3. Run Server
```bash
npm run dev
# Server running on http://localhost:3000
```

### 4. Open Chat Interface
```
Visit: http://localhost:3000
(New military/professional design)
```

---

## 💻 COMMON COMMANDS

### Web Integration Examples

**Search for Vulnerabilities:**
```
"Busca vulnerabilidades críticas en Express.js 4.17.1"
→ Queries CVE database
→ Returns CVSS scores, descriptions
```

**Find Bug Bounty Programs:**
```
"¿Cuáles son los programas activos de HackerOne con bounties altos?"
→ Lists active programs
→ Shows bounty ranges
```

**OSINT on Domain:**
```
"Realiza OSINT completo en example.com"
→ Extracts DNS records
→ SSL certificates
→ Vulnerabilities
→ Reputation checks
```

### System Automation Examples

**Execute Command:**
```
"Ejecuta nmap -sV -p- 192.168.1.1"
→ Returns scan results
```

**Create Script & Run:**
```
"Crea un script Python que busque SQLi usando payloads"
→ Generates code
→ Executes automatically
→ Returns results
```

**Install Tool:**
```
"Instala sqlmap"
→ Downloads & configures
→ Validates installation
```

### Dynamic Tooling Examples

**Install Security Tool:**
```
"Instala nmap para análisis de redes"
→ Installs via apt
→ Ready to use
```

**List Available Tools:**
```
"¿Qué herramientas de seguridad puedo instalar?"
→ Shows 10 available tools
→ Installation status
→ Capabilities
```

### Autonomous Operation Examples

**Enable Autonomous Mode:**
```
"Activa modo autónomo para escanear bug bounty"
→ Enables independent operation
→ Starts scheduled tasks
```

**Register Bug Bounty Program:**
```
"Registra Yahoo en HackerOne para automatización"
→ Adds to targets
→ Schedules scanning
```

**Generate PoC:**
```
"Genera PoC para SQL Injection"
→ Creates Python exploit code
→ Validates it works
```

---

## 🔌 API ENDPOINTS (Phase 2)

### Create Task (Web Integration)
```bash
POST /api/tasks
Body: { "query": "Search for CVEs in Django 3.0" }
Response: { taskId, status, phase2Tools }
```

### Get Status (Phase 2 Included)
```bash
GET /api/status
Response includes:
  • phase2Initialized: true
  • webIntegration: { active, hackeroneConfigured }
  • systemAutomation: { active, platform }
  • dynamicTooling: { totalTools, installedTools }
  • autonomousOperation: { enabledTasks, bugBountyTargets }
```

### Check Task Result
```bash
GET /api/tasks/{taskId}
Response: { status, result, phase2Tools }
```

---

## 🎯 PHASE 2 WORKFLOW

### Typical Bug Bounty Automation Workflow:

```
1. Register Target
   POST → Register "HackerOne/Yahoo"

2. Enable Autonomous Mode
   POST → Activate autonomous mode
   
3. Task Executes Automatically
   Every 6 hours: Scan vulnerabilities
   Every 4 hours: Generate PoC if found
   Every 1 hour: Monitor new CVEs
   
4. Results Reported
   - Vulnerabilities found
   - PoC generated & validated
   - Bounty estimated
   - Learning recorded
   
5. System Improves
   - Successful tactics recorded
   - Tool effectiveness tracked
   - Strategy optimized
```

---

## 📊 MONITORING

### Check Phase 2 Status:
```bash
curl http://localhost:3000/api/status | jq '.phase2'
```

### Output Example:
```json
{
  "webIntegration": {
    "active": true,
    "hackeroneConfigured": false
  },
  "systemAutomation": {
    "active": true,
    "platform": "linux"
  },
  "dynamicTooling": {
    "active": true,
    "totalTools": 10,
    "installedTools": 3,
    "enabledTools": 2
  },
  "autonomousOperation": {
    "active": true,
    "autonomousMode": false,
    "enabledTasks": 2,
    "bugBountyTargets": 1
  }
}
```

---

## 🚨 IMPORTANT SECURITY NOTES

### Constitutional AI Still Enforces:
- ✅ All requests validated
- ✅ Unauthorized access blocked
- ✅ Malicious actions prevented
- ✅ Ethical compliance checked

### Authorized Uses:
- Bug bounty research
- Authorized pentesting
- Vulnerability assessment
- Code security review

### Prohibited Uses:
- Unauthorized access
- Data theft
- System damage
- Privacy violation

---

## 🐛 TROUBLESHOOTING

### Phase 2 Not Showing in Status:
```bash
# Check if services initialized
npm run dev 2>&1 | grep "FASE 2"
# Should show "✅ FASE 2: EXTENSIONES DISPONIBLES"
```

### Tool Installation Fails:
```bash
# Check system compatibility
npm run dev
# Check error in console logs
# May need apt/brew/pip installed first
```

### Autonomous Tasks Not Running:
```bash
# Verify autonomous mode enabled
GET /api/status
# Check "autonomousMode": true
# Check "enabledTasks" count > 0
```

---

## 📚 DOCUMENTATION REFERENCES

| Document | Purpose |
|----------|---------|
| PHASE2_IMPLEMENTATION.md | Full specification |
| PHASE2_SUMMARY.md | Architecture overview |
| QUICK_START_PHASE2.md | This guide |
| service files | Method documentation |

---

## ⚡ POWER USER TIPS

### Combine Multiple Phases:

**Advanced Hunt:**
```
"Busca programas activos en HackerOne, 
instala nmap y sqlmap, 
escanea hosts encontrados 
y genera PoC automáticamente"
```

1. Web Integration (HackerOne search)
2. Dynamic Tooling (install tools)
3. System Automation (execute commands)
4. Autonomous Operation (generate PoC)

### Enable Full Autonomy:

```
"Activa modo autónomo, 
registra Yahoo en HackerOne,
habilita todos los escaneos automáticos
y monitorea nuevas CVEs"
```

Result: Jarvis runs independently 24/7

### Monitor Learning:

```
"Muestra estadísticas de aprendizaje
y las métricas de mejora"
```

Get: Success rates, optimization trends, efficiency improvements

---

## 🎓 NEXT LEARNING STEPS

1. **Understand Constitutional AI:**
   - Read constitution files
   - See how validation works
   - Understand soul/principles

2. **Study Agentic Loop:**
   - PLANNING phase
   - TOOL_USE with Phase 2 tools
   - OBSERVATION & REFLECTION

3. **Explore Memory System:**
   - Episodic memory
   - Semantic knowledge
   - Procedural learning

4. **Master Autonomy:**
   - Enable autonomous mode
   - Configure tasks
   - Monitor execution

---

## 🚀 PRODUCTION DEPLOYMENT

### Build for Production:
```bash
npm run build
docker build -t jarvis-ia .
docker run -p 3000:3000 jarvis-ia
```

### Deploy to Railway:
```bash
railway up
# Available at: https://jarvis-ia.up.railway.app
```

### Environment Variables (Production):
```
NODE_ENV=production
PORT=3000
HACKERONE_API_KEY=xxx
GOOGLE_SEARCH_API_KEY=xxx
```

---

## 📞 QUICK HELP

### To see all Phase 2 tools:
```
"¿Qué herramientas y capacidades tengo disponibles en Fase 2?"
```

### To enable a specific feature:
```
"Habilita [web-integration|system-automation|dynamic-tooling|autonomous-operation]"
```

### To check what's running:
```
"Muéstrame el estado de todos los servicios de Fase 2"
```

### To see recent operations:
```
"¿Qué han sido las últimas 10 operaciones?"
```

---

## ✨ YOU'RE READY!

Phase 2 is fully integrated and operational. 

Start with simple commands and work up to autonomous mode.

Jarvis learns from every operation and continuously improves.

**Bienvenido a FASE 2 🚀**

---

Last Updated: 2026-04-20 23:35 UTC
