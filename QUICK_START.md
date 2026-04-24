# 🚀 JARVIS v2.0-Kimi-K26 - QUICK START GUIDE

## ¿Qué se acaba de implementar?

Se ha completado el sistema completo de gestión de casos, reportes y exportación a HackerOne. Ahora Jarvis puede:

✅ **Encontrar vulnerabilidades automáticamente**
✅ **Documentarlas en reportes HTML**
✅ **Guardarlas en base de datos**
✅ **Exportarlas a HackerOne directamente**

---

## 🎯 Interfaces Web Disponibles

### 1. **Dashboard** (Gestor Visual de Casos)
**URL:** `http://localhost:3000/dashboard.html`

![Dashboard Features]
- 📋 Lista completa de vulnerabilidades encontradas
- 📊 Estadísticas en tiempo real
- 📄 Generar reportes HTML por caso
- 📤 Exportar a HackerOne con 1 click
- ➕ Crear nuevos casos manualmente

**Uso:**
```
1. Ve a /dashboard.html
2. Verás casos encontrados automáticamente
3. Click en un caso → ver detalles
4. "📄 Reporte" → descarga HTML
5. "📤 H1" → envía a HackerOne
```

### 2. **Chat Assistant** (Interfaz Conversacional)
**URL:** `http://localhost:3000/chat.html`

- 💬 Chatea con Jarvis como en Claude.com
- 📡 Panel de monitoreo en vivo (300 agentes)
- 📊 Estadísticas en tiempo real
- ⚡ Acciones rápidas

**Comandos:**
```
"analiza example.com"      → Análisis automático
"inicia hunt"              → Despliega 300 agentes
"muestra casos"            → Lista vulnerabilidades
"genera exploit para SQLi" → Crea POC
"dashboard"                → Abre gestor de casos
```

### 3. **Status Dashboard** (Estado del Sistema)
**URL:** `http://localhost:3000/index.html`

- 🔷 Información de identidad (v2.0-Kimi-K26)
- 🤖 Estado del swarm (300/300 agentes)
- 📋 HackerOne Constitution
- 📈 Performance metrics
- 📅 Timeline de operaciones

---

## 🔧 Endpoints API

### Gestión de Casos

```bash
# Obtener todos los casos
curl http://localhost:3000/api/cases

# Crear nuevo caso
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "type": "SQL Injection",
    "severity": "Alta",
    "cvss": 8.6,
    "location": "/api/users",
    "bountyEstimate": 2500,
    "payload": "1 OR 1=1",
    "impact": "Acceso completo a DB"
  }'

# Obtener caso específico
curl http://localhost:3000/api/cases/[case-id]

# Generar reporte HTML
curl http://localhost:3000/api/cases/[case-id]/report > reporte.html

# Exportar a HackerOne
curl -X POST http://localhost:3000/api/cases/[case-id]/export-ho \
  -H "Content-Type: application/json" \
  -d '{ "programHandle": "nombre-programa" }'

# Obtener estadísticas
curl http://localhost:3000/api/cases/stats
```

### Chat y Análisis

```bash
# Enviar mensaje a Jarvis
curl -X POST http://localhost:3000/api/jarvis-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "analiza example.com",
    "sessionId": "opcional-uuid"
  }'
```

### Swarm & Kimi

```bash
# Identidad del sistema
curl http://localhost:3000/api/kimi/identity

# HackerOne Constitution
curl http://localhost:3000/api/kimi/constitution

# Estado del swarm
curl http://localhost:3000/api/kimi/swarm-status

# Iniciar hunt automático
curl -X POST http://localhost:3000/api/kimi/start-autonomous-hunt \
  -H "Content-Type: application/json" \
  -d '{
    "programName": "tu-programa",
    "targets": [
      { "url": "target1.com", "scope": "web" },
      { "url": "target2.com", "scope": "api" }
    ],
    "autoBudget": 100000,
    "autoSubmit": true,
    "continuousMode": true
  }'
```

---

## 📊 Estructura de Datos

### Vulnerability Case
```typescript
{
  id: "uuid",
  timestamp: 1234567890,
  target: "example.com",
  type: "SQL Injection",
  severity: "Alta" | "Media" | "Baja" | "Crítica",
  cvss: 8.6,
  location: "/api/users",
  parameter: "id",
  payload: "1' OR '1'='1",
  screenshot?: "base64",
  poc?: "código",
  impact: "descripción",
  bountyEstimate: 2500,
  hackeroneProgram?: "programa",
  status: "discovered" | "documented" | "submitted" | "resolved",
  steps?: [
    { title: "Step 1", description: "...", screenshot?: "base64" },
    ...
  ]
}
```

### Statistics Response
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

## 🎮 Flujo Completo de Uso

### Escenario 1: Análisis Automático
```
Usuario:    "analiza example.com"
            ↓
Jarvis:     Despliega 300 agentes
            Ejecuta reconnaissance completo
            Encuentra 3 vulnerabilidades
            ↓
Sistema:    Auto-crea 3 casos
            Los guarda en base de datos
            Devuelve estadísticas
            ↓
Usuario:    Va a /dashboard.html
            Ve los 3 casos nuevos
            Click en uno → ve detalles
            Click "📄 Reporte" → descarga HTML
            ↓
Reporte:    HTML completo con:
            - Descripción técnica
            - CVSS score
            - Pasos de reproducción
            - Screenshots (si hay)
            - Recomendaciones
```

### Escenario 2: Exportación a HackerOne
```
Usuario:    Abre /dashboard.html
            Selecciona caso de SQLi
            Click "📤 H1"
            Ingresa "nombre-programa"
            Click "Exportar y Enviar"
            ↓
Sistema:    Valida caso
            Convierte a formato HO
            Envía a API de HackerOne
            Actualiza estado a "submitted"
            ↓
Resultado:  ✓ Caso enviado
            HackerOne Report ID: HO-12345
            Status: submitted
```

### Escenario 3: Hunt 24/7 Automático
```
Usuario:    POST /api/kimi/start-autonomous-hunt
            Especifica targets y programas
            ↓
Jarvis:     Despliega 300 agentes
            Distribuye targets
            Inicia ataque paralelo
            ↓
Monitor:    En tiempo real muestra:
            - Agentes activos: 300/300
            - Vulnerabilidades: 12
            - POCs: 8
            - Targets: 5
            ↓
Auto:       Crea casos automáticamente
            Los guardar en DB
            Los exporta a HO si está configurado
```

---

## 🔐 Configuración de HackerOne (Opcional)

Para exportar directamente a HackerOne, configura:

```bash
# En variables de entorno o .env
export HO_API_TOKEN=tu_token_de_hackerone

# O en el código (no recomendado):
# hackerOneExporter.initialize('tu_token');
```

**Obtener token:**
1. Ir a https://hackerone.com/settings/authentication
2. Crear API token
3. Copiar y guardar en variable de entorno

---

## 📊 Ejemplos de Respuestas

### Chat: "analiza example.com"
```json
{
  "success": true,
  "response": "**Análisis de Target: example.com**\n\n🔍 **Reconocimiento Completado**\n...",
  "findings": [
    {
      "type": "SQLi",
      "severity": "Alta",
      "location": "/api/users",
      "cvss": 8.6,
      "bounty": 2500
    },
    ...
  ],
  "caseIds": ["uuid1", "uuid2", "uuid3"],
  "metrics": {
    "vulns": 3,
    "pocs": 0,
    "targets": 1
  }
}
```

### Dashboard: Lista de Casos
```
┌─ Vulnerabilidades Encontradas
├─ SQL Injection (Alta) - example.com
│  └─ /api/users | CVSS 8.6 | $2,500
├─ XSS Reflejado (Media) - example.com
│  └─ /search | CVSS 5.8 | $500
└─ JWT Bypass (Alta) - example.com
   └─ /auth | CVSS 8.1 | $3,000

📊 Estadísticas:
   Total: 3 casos
   Críticas: 0 | Altas: 2 | Medias: 1 | Bajas: 0
   Bounty: $6,000
```

---

## 🚀 Próximos Pasos

1. **Abre el dashboard:** http://localhost:3000/dashboard.html
2. **Prueba el chat:** http://localhost:3000/chat.html
3. **Analiza un target:** Escribe "analiza example.com"
4. **Ve casos crearse automáticamente** en el dashboard
5. **Genera un reporte:** Click "📄 Reporte"
6. **Exporta a HackerOne:** Click "📤 H1"

---

## 📚 Documentación Completa

Ver: `/API_DOCUMENTATION.md` para documentación técnica completa.

---

## 💡 Tips

- **Rápido:** Usa los botones de quick action en el chat
- **Detallado:** Usa el dashboard para ver todo en un vistazo
- **Automatizado:** Configura `continuousMode: true` en hunts
- **Integración:** Los casos se guardan automáticamente en JarvisLocalDB
- **Reportes:** Cada caso genera un HTML descargable

---

## ⚠️ Notas Importantes

✅ **Todos los casos se guardan automáticamente**
✅ **Reportes HTML se generan bajo demanda**
✅ **HackerOne export requiere token (opcional)**
✅ **Dashboard muestra datos en tiempo real**
✅ **Chat integrado con gestor de casos**

**LISTO PARA USAR** - No requiere configuración adicional. Solo abre las interfaces y empieza a usar. 🎉

---

*Jarvis v2.0-Kimi-K26 - Autonomous HackerOne Bug Bounty Hunting Machine*
