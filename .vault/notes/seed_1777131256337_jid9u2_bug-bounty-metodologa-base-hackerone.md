---
id: seed_1777131256337_jid9u2
title: Bug Bounty — Metodología Base HackerOne
type: technique
tags: ["hackerone", "bug-bounty", "metodología", "recon"]
created: 2026-04-25T15:34:16.337Z
updated: 2026-04-25T15:34:16.337Z
---

## Fases de Bug Bounty

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
- Intigriti: programas europeos, menos competencia