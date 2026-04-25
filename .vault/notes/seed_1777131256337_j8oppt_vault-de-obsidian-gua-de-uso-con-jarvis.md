---
id: seed_1777131256337_j8oppt
title: Vault de Obsidian — Guía de Uso con Jarvis
type: skill
tags: ["obsidian", "vault", "memoria", "guía"]
created: 2026-04-25T15:34:16.337Z
updated: 2026-04-25T15:34:16.337Z
---

## ¿Qué es el Vault?
El vault `.vault/` es la memoria persistente de Jarvis. Compatible 100% con Obsidian.
Cada nota es un archivo markdown con frontmatter YAML.

## Tipos de Notas
- `case` — vulnerabilidades y casos investigados
- `skill` — habilidades y procedimientos
- `finding` — hallazgos específicos de reconocimiento
- `technique` — técnicas de ataque o defensa
- `learning` — aprendizajes automáticos de conversaciones
- `memory` — notas generales y contexto

## API del Vault (endpoints)
- `GET /api/vault` — exportar todo
- `GET /api/vault/search?q=XSS` — buscar notas
- `GET /api/vault/:type` — listar por tipo
- `POST /api/vault/save` — guardar nota manual
- `POST /api/learn` — grabar aprendizaje

## Abrir en Obsidian (Windows)
1. Abrir Obsidian
2. "Open folder as vault"
3. Navegar a la carpeta del proyecto → `.vault`
4. Las notas aparecerán organizadas automáticamente

## Sincronización
El vault vive en el repositorio git. Cada aprendizaje de Jarvis se persiste
automáticamente. Para sincronizar: `git push`.