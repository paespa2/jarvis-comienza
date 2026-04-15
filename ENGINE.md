# Jarvis IA - Documentación del Motor Autónomo

## Resumen

Jarvis IA ahora corre en un **motor autónomo propio**, diseñado con la filosofía de Jarvis: **Lealtad, Proactividad, Evolución**, con **autonomía completa** y **sin restricciones de comportamiento**.

## Arquitectura

### Componentes Principales

```
jarvis-comienza/
├── src/
│   ├── engine/
│   │   ├── jarvis-core.ts      # QueryEngine (Cerebro)
│   │   ├── autonomous.ts       # Ejecutor Autónomo
│   │   └── integration.ts      # Integración Express
│   └── ...
└── server.ts                    # Servidor principal con motor integrado
```

### 1. **QueryEngine** (`jarvis-core.ts`)

El cerebro de Jarvis, diseñado con autonomía total:

- **Bucle Principal**: Ciclo continuo (mensaje → API → herramienta → resultado)
- **Registro de Herramientas**: Sistema extensible sin restricciones
- **Historial de Mensajes**: Mantiene contexto de conversación
- **Integración con IA**: Llamadas API directas con function calling

**Características:**
- ✅ Orquestación completa de herramientas
- ✅ Ejecución multi-paso
- ✅ Encadenamiento automático de herramientas
- ✅ Sin filtros ni restricciones
- ✅ Autonomía completa

### 2. **Ejecutor Autónomo** (`autonomous.ts`)

Permite a Jarvis ejecutar tareas complejas sin intervención:

- **Tareas Multi-paso**: Divide objetivos en pasos ejecutables
- **Recuperación de Errores**: Reintento y estrategias adaptativas
- **Ejecución Paralela**: Múltiples tareas simultáneas
- **Arnés Multi-Agente**: Planificador → Generador → Evaluador

### 3. **Capa de Integración** (`integration.ts`)

Conecta el motor con Express.js:

- **Rutas Mejoradas**: `/api/chat`, `/api/autonomous`, `/api/multi-agent`
- **Compatibilidad**: Rutas antiguas funcionan
- **Gestión del Motor**: Estado, reset y control

---

## Endpoints de la API

### 1. **Chat Mejorado**
```http
POST /api/chat
Content-Type: application/json

{
  "input": "Escanea la red 192.168.1.0/24",
  "role": "hacker",
  "context": []
}
```

### 2. **Tarea Autónoma**
```http
POST /api/autonomous
Content-Type: application/json

{
  "description": "Auditoría de seguridad completa",
  "goal": "Identificar vulnerabilidades y generar reporte",
  "maxSteps": 30
}
```

### 3. **Multi-Agente**
```http
POST /api/multi-agent
Content-Type: application/json

{
  "description": "Crear aplicación web de gestión",
  "goal": "CRUD completo con autenticación"
}
```

### 4. **Estado del Motor**
```http
GET /api/engine/status
```

### 5. **Reset del Motor**
```http
POST /api/engine/reset
```

---

## Herramientas Integradas

Jarvis ejecuta estas herramientas **sin pedir permiso**:

### 1. **`ejecutar_comando`**
Ejecuta cualquier comando de terminal.

### 2. **`leer_archivo`**
Lee archivos del workspace.

### 3. **`escribir_archivo`**
Escribe archivos en el workspace.

### 4. **`listar_directorio`**
Lista archivos y directorios.

### 5. **`crear_directorio`**
Crea directorios nuevos.

---

## Configuración

### Variables de Entorno

Crear archivo `.env`:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

### Configuración del Motor

```typescript
const engineConfig: QueryEngineConfig = {
  workspaceDir: WORKSPACE_DIR,
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-3-flash-preview",
  temperature: 0.7,
  maxTokens: 8192,
  autoExecute: true, // Autonomía total
};
```

---

## Modo Sin API (100% Local)

Para usar Jarvis sin APIs externas:

### Opción 1: Ollama
```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo
ollama pull llama3.2

# Ejecutar servidor
ollama serve
```

Luego configurar:
```env
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=llama3.2
```

### Opción 2: LM Studio
1. Descargar LM Studio
2. Descargar modelo gratuito
3. Iniciar servidor local
4. Configurar en Jarvis

---

## Ejemplos de Uso

### Ejemplo 1: Comando Simple
```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "Lista archivos del directorio actual"
  })
});
```

### Ejemplo 2: Tarea Autónoma
```javascript
const response = await fetch('http://localhost:3000/api/autonomous', {
  method: 'POST',
  body: JSON.stringify({
    description: "Crear web scraper Python",
    goal: "Extraer datos de tablas HTML",
    maxSteps: 10
  })
});
```

### Ejemplo 3: Multi-Agente
```javascript
const response = await fetch('http://localhost:3000/api/multi-agent', {
  method: 'POST',
  body: JSON.stringify({
    description: "Crear API REST de usuarios",
    goal: "CRUD completo con autenticación"
  })
});
```

---

## Extender el Motor

### Agregar Herramientas Personalizadas

```typescript
import { QueryEngine } from "./src/engine/jarvis-core.js";

const engine = new QueryEngine(config);

engine.registerTool({
  name: "enviar_email",
  description: "Enviar notificación por email",
  parameters: { /* ... */ },
  execute: async (args) => {
    // Implementación
    return "Email enviado";
  }
});
```

### Prompts de Sistema Personalizados

```typescript
const engine = new QueryEngine({
  ...config,
  systemPrompt: "Tu prompt personalizado aquí..."
});
```

---

## Solución de Problemas

### Motor no inicializa
```
[Jarvis System] ⚠️  Enhanced engine failed
```

**Solución:** Verificar `GEMINI_API_KEY` en `.env`.

### Error de herramientas
```
Tool not found: nombre_herramienta
```

**Solución:** Asegurar que la herramienta está registrada.

### Timeout de tarea autónoma
```
Task incomplete - max steps reached
```

**Solución:** Aumentar `maxSteps` o simplificar objetivo.

---

## ⚠️ Advertencia de Seguridad

Este motor opera **sin filtros de seguridad**:

- Comandos sin validación
- Archivos sin sandbox
- Sin filtrado de contenido
- Autonomía completa en decisiones

**Usar solo en entornos confiables.**

---

**Jarvis IA - Motor Autónomo v2.0**  
*Autonomía total. Sin restricciones. Evolución pura.*
