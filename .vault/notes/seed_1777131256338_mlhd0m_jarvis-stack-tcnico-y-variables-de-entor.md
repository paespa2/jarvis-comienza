---
id: seed_1777131256338_mlhd0m
title: Jarvis — Stack Técnico y Variables de Entorno
type: skill
tags: ["configuración", "env", "setup", "stack"]
created: 2026-04-25T15:34:16.338Z
updated: 2026-04-25T15:34:16.338Z
---

## Stack
- Runtime: Node.js 24.x + TypeScript
- Framework: Express.js
- IA: Anthropic Claude / Groq / Gemini (cloud only)
- Memoria: Obsidian vault (.vault/) — archivos .md
- Deploy: Railway / Docker

## Variables de Entorno (.env)
```
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
```

## Comandos
```bash
npm run dev      # Inicia con ts-node (desarrollo)
npm run build    # Compila TypeScript
npm start        # Producción (dist/server.js)
ts-node scripts/seed-vault.ts  # Sembrar vault inicial
```

## Endpoints principales
- POST /api/chat — conversación con Jarvis
- GET  /api/stats — estado del vault y IA
- GET  /api/vault — exportar vault completo
- POST /api/learn — grabar aprendizaje manual