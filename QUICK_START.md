# 🚀 JARVIS v2.0 - Quick Start (5 minutos)

## 1️⃣ Instala Ollama (1 vez)

Ve a: https://ollama.com/download

- **macOS**: `brew install ollama`
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`
- **Windows**: Descarga instalador

## 2️⃣ Ejecuta setup automático

```bash
cd jarvis-comienza
bash scripts/setup.sh
```

**Esto:**
- ✅ Verifica Node.js, npm
- ✅ Crea estructura .vault/
- ✅ Descarga modelo Gemma 3 1B (~5 min)
- ✅ npm install
- ✅ npm run build

## 3️⃣ Inicia Ollama (Terminal 1)

```bash
ollama serve
```

Espera a que diga: `Listening on 127.0.0.1:11434`

## 4️⃣ Inicia JARVIS (Terminal 2)

```bash
cd jarvis-comienza
npm start
```

Verás:
```
[ObsidianVault] ✅ Initialized at ./.vault
[JarvisAIClient] ✅ Ollama connected: http://localhost:11434
[Server] ✅ JARVIS running on http://localhost:3000
```

## 5️⃣ Abre en navegador

```
http://localhost:3000
```

Haz clic en **"Chat Inteligente"** y habla con JARVIS.

---

## 💬 Ejemplos de uso

```
"Analiza example.com"
→ JARVIS ejecuta análisis

"¿Qué vulnerabilidades frecuentes tiene PHP?"
→ JARVIS razona basado en su conocimiento previo

"Registra: encontré SQL injection en login"
→ JARVIS guarda en vault para futuras referencias
```

---

## ⚙️ Configuración (Opcional)

### Cambiar puerto

```bash
PORT=3001 npm start
```

### Usar modelo más potente (si tienes 8GB+ VRAM)

```bash
# En terminal con Ollama
ollama pull mistral:7b

# Edita .env
OLLAMA_MODEL=mistral:7b

# Reinicia JARVIS
npm start
```

### Modelos recomendados

| Modelo | VRAM | Velocidad | Poder |
|--------|------|-----------|-------|
| **gemma3:1b** | 2GB | ⚡⚡⚡ Rápido | ⭐⭐ Básico |
| mistral:7b | 4GB | ⚡⚡ Medio | ⭐⭐⭐⭐ Muy Bueno |
| llama2:7b | 3GB | ⚡⚡ Medio | ⭐⭐⭐ Bueno |
| phi:latest | 2GB | ⚡⚡⚡ Rápido | ⭐⭐⭐ Bueno |

---

## 🐛 Si algo no funciona

### "Ollama no conecta"
```bash
# Verifica que Ollama corre
ps aux | grep ollama

# O reinicia manualmente
ollama serve
```

### "Modelo no encontrado"
```bash
ollama list              # Ver qué tienes
ollama pull gemma3:1b    # Descargar
```

### "Puerto 3000 ocupado"
```bash
PORT=3001 npm start      # Usa otro puerto
```

### "npm install falla"
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentación Completa

Lee `README.md` para:
- Arquitectura detallada
- API reference
- Desarrollo de skills
- Troubleshooting avanzado

---

## ✨ Características Principales

✅ **100% Local**: Sin APIs externas, sin costos  
✅ **Memoria Persistente**: Obsidian vault retiene conocimiento  
✅ **Autoaprendizaje**: Mejora con cada interacción  
✅ **Sin Restricciones**: Completamente autónomo  
✅ **Skills Extensibles**: Sistema modular de capacidades  

---

**¡Listo! Disfruta de JARVIS.** 🤖

Preguntas? Lee `README.md` o crea un issue en GitHub.
