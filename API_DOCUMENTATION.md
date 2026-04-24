# 📚 JARVIS v2.0-Kimi-K26 API Documentation

## Descripción General

API completa para gestión de vulnerabilidades, casos y exportación a HackerOne. Integrada con sistema autónomo de 300 agentes.

---

## 🎯 Chat & Assistant Endpoints

### POST `/api/jarvis-chat`
Interfaz conversacional con Jarvis. Procesa comandos en lenguaje natural.

**Request:**
```json
{
  "message": "analiza example.com",
  "sessionId": "opcional-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "response": "Análisis de Target...",
  "findings": [
    {
      "type": "SQLi",
      "severity": "Alta",
      "location": "/api/users",
      "cvss": 8.6,
      "bounty": 2500
    }
  ],
  "metrics": {
    "vulns": 3,
    "pocs": 0,
    "targets": 1
  },
  "caseIds": ["uuid1", "uuid2", "uuid3"],
  "nextAction": "Generando exploits..."
}
```

**Comandos soportados:**
- `analiza [target]` - Análisis automático de target
- `inicia hunt` - Despliega 300 agentes
- `muestra casos` - Lista vulnerabilidades encontradas
- `genera exploit` - Crea POC
- `dashboard` - Acceso al gestor de casos

---

## 📋 Case Management Endpoints

### GET `/api/cases`
Obtiene todos los casos registrados.

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "uuid",
        "timestamp": 1234567890,
        "target": "example.com",
        "type": "SQL Injection",
        "severity": "Alta",
        "cvss": 8.6,
        "location": "/api/users",
        "parameter": "id",
        "payload": "1' OR '1'='1",
        "impact": "Acceso a base de datos...",
        "bountyEstimate": 2500,
        "status": "discovered",
        "steps": []
      }
    ],
    "statistics": {
      "total": 12,
      "bySeverity": {
        "critica": 2,
        "alta": 5,
        "media": 4,
        "baja": 1
      },
      "byStatus": {
        "discovered": 8,
        "documented": 3,
        "submitted": 1,
        "resolved": 0
      },
      "totalBounty": 25000,
      "averageCVSS": 7.2
    }
  }
}
```

### POST `/api/cases`
Crea un nuevo caso de vulnerabilidad.

**Request:**
```json
{
  "target": "example.com",
  "type": "SQL Injection",
  "severity": "Alta",
  "cvss": 8.6,
  "location": "/api/users",
  "parameter": "id",
  "payload": "1' OR '1'='1",
  "impact": "Acceso a base de datos completa",
  "bountyEstimate": 2500,
  "screenshot": "base64-encoded-image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "timestamp": 1234567890,
    ...
  }
}
```

### GET `/api/cases/:caseId`
Obtiene detalles de un caso específico.

### GET `/api/cases/:caseId/report`
Genera reporte HTML del caso.

**Response:** HTML document

### POST `/api/cases/:caseId/export-ho`
Exporta caso a HackerOne.

**Request:**
```json
{
  "programHandle": "nombre-programa"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "HO-12345"
}
```

### GET `/api/cases/stats`
Obtiene estadísticas globales.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "bySeverity": { ... },
    "byStatus": { ... },
    "totalBounty": 25000,
    "averageCVSS": 7.2
  }
}
```

### GET `/api/cases/by-target/:target`
Obtiene casos de un target específico.

---

## 🔐 Kimi Swarm Endpoints

### GET `/api/kimi/identity`
Información de identidad de Jarvis.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "v2.0-Kimi-K26",
    "creators": "paespa2",
    "birthDate": "2026-04-23",
    "specialization": "Autonomous HackerOne Bug Bounty Hunting Machine",
    "autonomy": 1.0,
    "identity": "Jarvis"
  }
}
```

### GET `/api/kimi/constitution`
Constitución y restricciones del sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "constraint": "Target must be in active HackerOne program scope",
    "capabilities": [
      "Exploit development & weaponization",
      "Payload generation & obfuscation",
      "Attack chaining & multi-stage exploitation",
      "Fuzzing, brute force, credential testing",
      "Autonomous hunting 24/7 without pause"
    ]
  }
}
```

### GET `/api/kimi/swarm-status`
Estado en vivo del swarm de 300 agentes.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents_total": 300,
    "agents_active": 287,
    "agents_ready": 13,
    "specializations": {
      "web-injection": 30,
      "auth-bypass": 30,
      "api-enumeration": 30,
      ...
    },
    "sessionStatus": "hunting"
  }
}
```

### POST `/api/kimi/start-autonomous-hunt`
Inicia hunt automático con los 300 agentes.

**Request:**
```json
{
  "programName": "programa-hackerone",
  "targets": [
    { "url": "target1.com", "scope": "web" },
    { "url": "target2.com", "scope": "api" }
  ],
  "autoBudget": 100000,
  "autoSubmit": true,
  "continuousMode": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "agentsDeployed": 300,
    "startTime": "2026-04-24T14:30:00Z",
    "estimatedDuration": "2-4 hours"
  }
}
```

### POST `/api/kimi/vision-recon`
Análisis visual de screenshots/diagramas.

**Request (multipart):**
```
POST /api/kimi/vision-recon
Content-Type: multipart/form-data

file: [image file]
target: example.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "findings": [
      {
        "type": "UI vulnerability",
        "description": "Hidden input field detected",
        "location": "Login form",
        "severity": "Medium"
      }
    ]
  }
}
```

### POST `/api/kimi/auto-chain-exploits`
Genera cadena automática de exploits.

**Request:**
```json
{
  "vulnerabilities": [
    { "type": "SQLi", "location": "/api/users" },
    { "type": "JWT", "location": "/auth" }
  ],
  "target": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chain": [
      {
        "stage": 1,
        "exploit": "SQLi injection",
        "payload": "...",
        "expected": "User list extracted"
      },
      {
        "stage": 2,
        "exploit": "JWT bypass",
        "payload": "...",
        "expected": "Admin token obtained"
      }
    ]
  }
}
```

---

## 🎨 Interfaces Web

### Dashboard
**URL:** `/dashboard.html`

Gestor visual de casos con:
- Lista de vulnerabilidades encontradas
- Detalles y estadísticas por caso
- Generación de reportes HTML
- Exportación a HackerOne
- Creación manual de casos

### Chat Assistant
**URL:** `/chat.html`

Interfaz conversacional con:
- Chat en lenguaje natural
- Panel de monitoreo en vivo (300 agentes)
- Estadísticas en tiempo real
- Integración con caso manager

### Status Dashboard
**URL:** `/index.html`

Estado actual del sistema:
- v2.0-Kimi-K26 identity
- 300/300 agentes activos
- HackerOne Constitution
- Performance metrics
- 7-day timeline

---

## 🔧 Servicios Backend

### CaseManager
Gestión de vulnerabilidades en memoria + JarvisLocalDB.

```typescript
// Crear caso
const caseData = await caseManager.createCase({
  target: "example.com",
  type: "SQLi",
  severity: "Alta",
  cvss: 8.6,
  location: "/api/users",
  bountyEstimate: 2500
});

// Obtener todos
const allCases = caseManager.getAllCases();

// Estadísticas
const stats = caseManager.getStatistics();

// Generar reporte HTML
const report = caseManager.generateCaseReport(caseId);
```

### HackerOneExporter
Integración directa con API de HackerOne.

```typescript
// Enviar caso a HackerOne
const result = await hackerOneExporter.submitReport(
  caseData,
  "programa-handle"
);

// Batch submit
const results = await hackerOneExporter.submitBatch(
  cases,
  "programa-handle"
);
```

---

## 📊 Casos de Uso

### 1. Análisis Automático
```bash
# Chat: "analiza example.com"
# → Crea 3 casos automáticamente
# → Los guarda en CaseManager
# → Muestra hallazgos en tiempo real
```

### 2. Generación de Reporte
```bash
# GET /api/cases/[caseId]/report
# → HTML con toda la información
# → Screenshots integrados
# → Impacto y recomendaciones
```

### 3. Exportación a HackerOne
```bash
# POST /api/cases/[caseId]/export-ho
# {  "programHandle": "programa" }
# → Envía directamente a HO API
# → Actualiza status del caso
# → Devuelve report ID
```

### 4. Hunt Continuo
```bash
# POST /api/kimi/start-autonomous-hunt
# → 300 agentes desplegados
# → Ataque paralelo 24/7
# → Auto-create casos según hallazgos
```

---

## 🔒 Autenticación & Seguridad

### Variables de Entorno Requeridas
```bash
HO_API_TOKEN=<tu-token-hackerone>  # Opcional para exportar
JARVIS_MODE=production
SWARM_SIZE=300
AUTO_SUBMIT=true
```

### Rate Limiting
- HackerOne API: 1000 requests/hour
- Internal APIs: Sin límite (local)
- Batch submissions: 1 segundo entre reportes

---

## 📈 Estadísticas & Métricas

### Datos Recopilados
- Total de vulnerabilidades
- Distribución por severidad
- Bounty estimado total
- CVSS promedio
- Status de cada caso

### Ejemplo de Estadísticas
```json
{
  "total": 47,
  "bySeverity": {
    "critica": 3,
    "alta": 12,
    "media": 22,
    "baja": 10
  },
  "byStatus": {
    "discovered": 32,
    "documented": 10,
    "submitted": 4,
    "resolved": 1
  },
  "totalBounty": 125000,
  "averageCVSS": 6.8
}
```

---

## 🚀 Próximas Mejoras

- [ ] Integración con Burp Suite API
- [ ] Auto-generación de POCs en múltiples lenguajes
- [ ] Sincronización en tiempo real con HackerOne
- [ ] Análisis visual automático con vision
- [ ] Generación de reportes PDF
- [ ] Webhook notifications
- [ ] Multi-tenancy support

---

## 📞 Soporte

Documentación completa en `/api/docs` (próximamente)
