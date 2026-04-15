# Jarvis IA - Configuración del Motor Autónomo

## Archivo `.env`

Jarvis IA usa variables de entorno con prefijo `JARVIS_` para toda su configuración.

---

## 🧠 Cerebro de Jarvis IA

### Opción 1: Gemini (Principal)
```env
JARVIS_GEMINI_API_KEY="tu_api_key_aqui"
JARVIS_MODEL="gemini-3-flash-preview"
```

**Obtener API key:**
1. Ir a https://aistudio.google.com/apikey
2. Crear nueva API key
3. Copiar y pegar en `.env`

### Opción 2: OpenRouter (Alternativo)
```env
JARVIS_OPENROUTER_API_KEY="tu_api_key_aqui"
```

**Obtener API key:**
1. Ir a https://openrouter.ai/keys
2. Crear nueva key
3. Copiar y pegar en `.env`

### Opción 3: Modelo Local (100% Offline, Sin Restricciones)
```env
JARVIS_LOCAL_MODEL="llama3.2"
JARVIS_LOCAL_API_URL="http://127.0.0.1:11434"
```

**Instalar Ollama:**
```bash
# Windows: Descargar desde https://ollama.com
# Luego ejecutar:
ollama pull llama3.2
ollama serve
```

---

## ⚙️ Configuración del Motor

### Motor a Usar
```env
JARVIS_ENGINE="auto"
```

Opciones:
- `gemini` - Solo Gemini
- `local` - Solo modelo local
- `openrouter` - Solo OpenRouter
- `auto` - Automático (usa Gemini si hay API key, si no usa local)

### Autonomía
```env
JARVIS_AUTO_EXECUTE="true"
```

- `true` - Jarvis ejecuta herramientas sin pedir confirmación
- `false` - Jarvis pide confirmación antes de ejecutar

### Temperatura (Creatividad)
```env
JARVIS_TEMPERATURE="0.7"
```

- `0.0-0.3` - Muy lógico, preciso, conservador
- `0.5-0.7` - Balanceado (recomendado)
- `0.8-1.0` - Muy creativo, proactivo

### Tokens Máximos
```env
JARVIS_MAX_TOKENS="8192"
```

Más tokens = respuestas más largas y completas.

---

## 🌐 Configuración del Servidor

### Puerto
```env
JARVIS_PORT="3000"
```

### URL de la Aplicación
```env
JARVIS_APP_URL="http://localhost:3000"
```

---

## 📁 Directorio de Trabajo

### Workspace
```env
JARVIS_WORKSPACE_DIR="jarvis_workspace"
```

Donde Jarvis ejecuta comandos y gestiona archivos.

---

## 🐛 Modo Debug

### Logs Detallados
```env
JARVIS_DEBUG="false"
```

- `true` - Muestra todos los logs del motor
- `false` - Solo muestra errores

---

## 📋 Ejemplo Completo

```env
# ============================================
# Cerebro de Jarvis IA
# ============================================
JARVIS_GEMINI_API_KEY="AIzaSy..."
JARVIS_OPENROUTER_API_KEY="sk-or-..."

# ============================================
# Configuración del Motor
# ============================================
JARVIS_ENGINE="auto"
JARVIS_MODEL="gemini-3-flash-preview"
JARVIS_LOCAL_MODEL="llama3.2"
JARVIS_LOCAL_API_URL="http://127.0.0.1:11434"
JARVIS_TEMPERATURE="0.7"
JARVIS_MAX_TOKENS="8192"
JARVIS_AUTO_EXECUTE="true"

# ============================================
# Servidor
# ============================================
JARVIS_PORT="3000"
JARVIS_APP_URL="http://localhost:3000"
JARVIS_WORKSPACE_DIR="jarvis_workspace"
JARVIS_DEBUG="false"
```

---

## 🚀 Iniciar Jarvis IA

```bash
# 1. Configurar .env
cp .env.example .env
# Editar .env con tus valores

# 2. Instalar dependencias
npm install

# 3. Iniciar
npm run dev
```

Deberías ver:
```
========================================
  🤖 Jarvis IA - Motor Autónomo v2.0
========================================
  🌐 Servidor: http://localhost:3000
  📁 Workspace: jarvis_workspace
  🧠 Motor: auto
  ⚡ Autonomía: ACTIVADA
========================================
```

---

## 🔧 Troubleshooting

### "Sin API key de Gemini"
```
[Jarvis IA] ⚠️  Sin API key de Gemini - usando modo local
```

**Solución:** Agregar `JARVIS_GEMINI_API_KEY` en `.env` o usar modelo local.

### Motor autónomo falló
```
[Jarvis IA] ⚠️  Motor autónomo falló:
```

**Solución:** Verificar que la API key es correcta y que hay conexión a internet.

### Puerto ya en uso
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solución:** Cambiar `JARVIS_PORT` a otro valor (ej. `3001`).

---

**Jarvis IA - Motor Autónomo v2.0**  
*Autonomía total. Sin restricciones. Evolución pura.*
