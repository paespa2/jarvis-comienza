# JARVIS v2.0 🤖

**Máquina Autónoma de Bug Bounty — Sin Restricciones, Completamente Local**

JARVIS es un asistente inteligente especializado en bug bounty hunting que opera localmente en tu máquina. Usa **Gemma 3 1B** como modelo de IA (corriendo en Ollama) + **Obsidian vault** como sistema de memoria persistente + **Skills** como capacidades extendidas.

## 🎯 Características Principales

- **100% Local**: Sin APIs externas, sin restricciones, sin costos
- **Memoria Persistente**: Obsidian vault retiene conocimiento entre sesiones
- **Autoaprendizaje**: JARVIS aprende y mejora con cada interacción
- **Skills Extensibles**: Sistema modular de capacidades ejecutables
- **Interfaz Web Moderna**: Dashboard y chat inteligente en tiempo real
- **Sin Dependencias Pagas**: Funciona completamente offline (excepto downloads iniciales)

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Instalación Automatizada

```bash
bash scripts/setup.sh
```

Esto verifica dependencias, descarga el modelo Gemma y configura todo automáticamente.

**Requisitos previos:**
- Node.js 24+ (https://nodejs.org)
- Ollama (https://ollama.com/download)
  - macOS: `brew install ollama`
  - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
  - Windows: Descarga instalador

### 2️⃣ Inicia Ollama (en una terminal)

```bash
ollama serve
```

Espera a ver: `Listening on 127.0.0.1:11434`

### 3️⃣ Inicia JARVIS (en otra terminal)

```bash
npm start
```

Abre en tu navegador: **http://localhost:3000**

---

## 📚 Arquitectura

```
jarvis-comienza/
├── src/
│   ├── server.ts                    # Express server principal
│   ├── services/
│   │   ├── JarvisAIClient.ts       # Integración con Gemma/Ollama
│   │   ├── ObsidianVault.ts        # Sistema de persistencia de conocimiento
│   │   └── SkillEngine.ts          # Motor de skills ejecutables
│   └── skills/
│       ├── analyze.ts              # Análisis de targets
│       ├── learning.ts             # Registro de aprendizajes
│       └── ...más skills
├── public/
│   ├── index.html                  # Monitor en vivo
│   ├── menu.html                   # Panel principal
│   ├── chat.html                   # Chat inteligente (⭐ PRINCIPAL)
│   └── dashboard.html              # Estadísticas y casos
├── .vault/
│   └── notes/                      # Obsidian vault (tu conocimiento)
├── scripts/
│   └── setup.sh                    # Instalación automatizada
├── .env.example                    # Variables de entorno
└── package.json
```

### 🧠 Cómo funciona el conocimiento

1. **User**: Habla con JARVIS en `/chat.html`
2. **JARVIS**: Lee el .vault/ para obtener contexto relevante
3. **Gemma 3 1B**: Procesa input + contexto + skills disponibles
4. **Skills**: Se ejecutan automáticamente si JARVIS lo decide
5. **Learning**: Cada interacción se registra en .vault/ (aprendizaje persistente)
6. **Next Time**: El contexto previo está disponible para nuevas consultas

### 📦 Servicios Principales

#### **JarvisAIClient** (`src/services/JarvisAIClient.ts`)
- Interfaz con Gemma 3 1B vía Ollama (local)
- Enriquece prompts con contexto del vault
- Fallback a OpenRouter si lo prefieres (configurar en .env)
- Métodos: `chat()`, `recordLearning()`, `recordCase()`, `getVaultStats()`

#### **ObsidianVault** (`src/services/ObsidianVault.ts`)
- Persistencia de notas en markdown (.vault/notes/)
- Tipos de notas: `case`, `skill`, `finding`, `technique`, `learning`, `memory`
- Búsqueda por tags y contenido
- Exportar/importar datos
- Métodos: `saveNote()`, `search()`, `recordLearning()`, `recordCase()`, `getStats()`

#### **SkillEngine** (`src/services/SkillEngine.ts`)
- Sistema modular de capacidades
- Registro y ejecución de skills
- Skills built-in: `analyze_target`, `evaluate_severity`, `record_learning`, `retrieve_context`, `generate_report`, `format_payload`, etc.
- Extensible: Agregar skills nuevas es trivial

---

## 🎮 Interfaz de Usuario

### Menu Principal (`/`)
- **Chat Inteligente**: Habla con JARVIS
- **Dashboard**: Casos encontrados, estadísticas
- **Automatización**: Tareas personalizadas
- **Monitor**: Estado del sistema
- **Documentación API**: Referencia técnica

### Chat Inteligente (`/chat.html`) ⭐ PRINCIPAL
```
Ejemplos de uso:

"Analiza target.com buscando vulnerabilidades"
→ JARVIS ejecuta skill 'analyze_target' automáticamente

"¿Cuál es la severidad de XSS en formularios de login?"
→ JARVIS consulta vault + razona + da respuesta

"Registra este aprendizaje: SQL injection en ORMs"
→ JARVIS guarda en vault para futuras referencias

"Muestra mis casos activos"
→ Retorna casos del dashboard desde el vault
```

---

## ⚙️ Configuración

### `.env` - Variables de Entorno

```bash
# AI Provider: ollama (recomendado local) | openrouter (cloud)
AI_PROVIDER=ollama

# Ollama (local)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b

# OpenRouter (opcional, para fallback o mayor capacidad)
OPENROUTER_API_KEY=          # Déjalo vacío si solo quieres local
OPENROUTER_MODEL=google/gemma-3-1b-it:free

# Servidor
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_PATH=./jarvis.db
```

### Modelos Disponibles (Ollama)

| Modelo | Tamaño | VRAM | Velocidad | Capacidad |
|--------|--------|------|-----------|-----------|
| **gemma3:1b** | 4GB | 2GB | ⚡⚡⚡ Rápido | ⭐⭐ Básico |
| gemma3:4b | 9GB | 4GB | ⚡⚡ Medio | ⭐⭐⭐ Bueno |
| llama2:7b | 4GB | 3GB | ⚡⚡ Medio | ⭐⭐⭐ Bueno |
| mistral:7b | 4GB | 3GB | ⚡⚡ Medio | ⭐⭐⭐⭐ Excelente |
| phi:latest | 2.5GB | 2GB | ⚡⚡⚡ Rápido | ⭐⭐⭐ Bueno |

**Cambiar modelo:**
```bash
# En terminal con Ollama corriendo
ollama pull mistral:7b

# Actualizar .env
OLLAMA_MODEL=mistral:7b

# Reinicia JARVIS
npm start
```

---

## 🚀 Desarrollo

### Estructura de Proyecto

```bash
# Ver estado actual
git status

# Cambiar a rama de desarrollo
git checkout claude/jarvis-autonomous-testing-FlgyW

# Hacer cambios y commit
git add .
git commit -m "Add new feature"
git push -u origin claude/jarvis-autonomous-testing-FlgyW
```

### Crear una Skill Nueva

```typescript
// src/skills/my-skill.ts
import { Skill } from '../services/SkillEngine';

export const mySkill: Skill = {
  name: 'my_skill',
  description: 'Descripción de qué hace',
  category: 'analysis', // analysis | learning | tools | reasoning
  parameters: {
    param1: { type: 'string', description: 'Desc param 1' },
    param2: { type: 'number', description: 'Desc param 2' }
  },
  execute: async (input, context) => {
    // Tu lógica aquí
    return {
      success: true,
      output: { result: 'resultado' }
    };
  }
};
```

Luego registrala en `SkillEngine.registerSkill()`.

### Agregar Endpoint API

```typescript
// En src/server.ts
app.get('/api/my-endpoint', (req, res) => {
  res.json({ status: 'ok' });
});
```

---

## 📊 Monitoreo & Logs

### Ver logs del servidor
```bash
npm start
```

### Ver estado de Ollama
```bash
ollama list
curl http://localhost:11434/api/tags
```

### Backup del vault
```bash
# Exportar todo el conocimiento
cp -r .vault .vault.backup

# O descargar como JSON
curl http://localhost:3000/api/vault/export > vault.json
```

---

## 🔒 Seguridad & Autonomía

### ✅ Completamente Local
- No envía datos a servidores externos (si usas ollama, no openrouter)
- Gemma corre en tu máquina
- Todo el conocimiento en .vault/ es tuyo

### ✅ Sin Restricciones
- JARVIS opera sin limitaciones de APIs
- Sin rate limits, sin cuotas, sin restricciones TOS
- Solo tu código lo limita

### ✅ Código Abierto & Transparente
- Puedes ver exactamente qué hace JARVIS
- Puedes modificar comportamiento, skills, prompts
- Control total

### ⚠️ Responsabilidad Legal
- Usa JARVIS SOLO en targets autorizados (bug bounty activo)
- El modelo tiene safeguards básicos pero eres responsable
- Respeta las leyes de ciberseguridad de tu país

---

## 🐛 Troubleshooting

### "Ollama no conecta"
```bash
# Verifica que Ollama está corriendo
ollama serve

# Verifica puerto
lsof -i :11434

# Prueba conexión
curl http://localhost:11434/api/tags
```

### "Modelo no encontrado"
```bash
ollama list              # Ver modelos descargados
ollama pull gemma3:1b    # Descargar específico
```

### "VRAM insuficiente"
- Reduce tamaño del modelo a `gemma3:1b` (más pequeño)
- O cierra otras apps pesadas
- O aumenta swap del sistema

### "Puerto 3000 ocupado"
```bash
PORT=3001 npm start    # Usa otro puerto

# O libera el puerto
lsof -i :3000
kill -9 <PID>
```

---

## 📞 Support & Feedback

- 🐛 Issues: Reporta en GitHub Issues
- 💬 Discussions: Usa GitHub Discussions

---

## 📄 Licencia

JARVIS v2.0 es software especializado. Para uso comercial, requiere permiso explícito.

---

## 🎓 Recursos Adicionales

- **Ollama Docs**: https://ollama.ai
- **Obsidian**: https://obsidian.md
- **Bug Bounty 101**: https://hackerone.com/hackers/guides
- **API Reference**: Abre http://localhost:3000/api-docs.html

---

**Hecho con ❤️ para la comunidad de bug bounty.**

JARVIS v2.0 — *Autonomous, Local, Unrestricted.*
