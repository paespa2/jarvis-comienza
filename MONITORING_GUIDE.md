# 🔍 JARVIS MONITORING & TRACKING GUIDE

## Cómo Verificar que Todo Funciona y Hacer Seguimiento en Tiempo Real

---

## 🚀 PARTE 1: VERIFICACIÓN POST-DEPLOYMENT

### Paso 1: Verificar que el Servidor Está Corriendo

```bash
# Verificar health endpoint
curl http://your-railway-url.com/health

# Respuesta esperada:
{
  "status": "healthy",
  "timestamp": 1234567890
}
```

### Paso 2: Verificar Cada Sistema

#### A. Context Memory System ✅
```bash
# Crear una sesión de contexto
curl -X POST http://your-railway-url.com/api/context/create-session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-1"}'

# Respuesta esperada:
{
  "success": true,
  "data": {
    "sessionId": "ctx-1234567890-abc123",
    "userId": "test-user-1",
    "status": "active"
  }
}
```

#### B. Named Entity Recognition ✅
```bash
# Probar reconocimiento de entidades
curl -X POST http://your-railway-url.com/api/ner/recognize \
  -H "Content-Type: application/json" \
  -d '{"text":"Necesito hacer SQL injection a ejemplo.com usando sqlmap"}'

# Respuesta esperada:
{
  "success": true,
  "data": {
    "entities": [
      {"type": "vulnerability", "value": "sql-injection", "confidence": 0.90},
      {"type": "domain", "value": "ejemplo.com", "confidence": 0.95},
      {"type": "tool", "value": "sqlmap", "confidence": 0.95}
    ],
    "primaryTargets": [...],
    "primaryTools": [...]
  }
}
```

#### C. Anthropic Knowledge Manager ✅
```bash
# Ver modelos disponibles
curl http://your-railway-url.com/api/knowledge/anthropic/models

# Respuesta esperada:
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "claude-opus-4-7",
        "name": "Claude Opus 4.7",
        "contextWindow": 200000,
        ...
      }
    ]
  }
}
```

#### D. AI Training Knowledge Manager ✅
```bash
# Ver arquitecturas MoE
curl http://your-railway-url.com/api/knowledge/ai-training/moe-architectures

# Respuesta esperada:
{
  "success": true,
  "data": {
    "architectures": [
      {
        "name": "MiniMax M2.1",
        "totalParameters": 230000000000,
        "activeParameters": 50000000000,
        ...
      }
    ]
  }
}
```

#### E. Self-Improvement Engine ✅
```bash
# Ver estado de evolución
curl http://your-railway-url.com/api/evolution/status

# Respuesta esperada:
{
  "success": true,
  "data": {
    "currentVersion": "v1.0.0",
    "strengthScore": "65.0%",
    "totalWeaknesses": 8,
    "nextSteps": 4,
    "appliedOptimizations": 0
  }
}
```

---

## 📊 PARTE 2: DASHBOARD DE MONITOREO

### Crear Dashboard en Railway

**En Railway UI:**
1. Ir a tu proyecto
2. Click en "Metrics"
3. Agregar estos charts:
   - Memory Usage
   - CPU Usage
   - Request Count
   - Response Time (avg, p95, p99)
   - Error Rate

### Ver Logs en Tiempo Real

```bash
# En Railway CLI
railway logs

# Buscar inicialización de sistemas
railway logs | grep -E "Inicializando|✅|❌"

# Esperar logs de inicio:
🎯 [EntityTracker] Inicializando...
✅ [EntityTracker] Sesión creada
🧠 [ContextMemoryManager] Inicializando...
🏷️  [NamedEntityRecognition] Inicializando...
🤖 [AnthropicKnowledgeManager] Inicializando...
🧠 [AITrainingKnowledgeManager] Inicializando...
🚀 [JarvisAutonomousSelfImprovementEngine] Inicializando...
✅ Server running on port 3000
```

---

## 🔄 PARTE 3: TESTING COMPLETO

### Script de Test Automático

```bash
#!/bin/bash

# test-jarvis-deployment.sh

BASE_URL="http://your-railway-url.com"
PASS=0
FAIL=0

echo "🧪 INICIANDO TESTS DE DEPLOYMENT"
echo "=================================="

# Test 1: Health
echo -n "1. Health endpoint... "
if curl -s $BASE_URL/health | grep -q "healthy"; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 2: Context Memory
echo -n "2. Context Memory... "
SESSION=$(curl -s -X POST $BASE_URL/api/context/create-session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}' | grep -o '"sessionId":"[^"]*"')
if [ ! -z "$SESSION" ]; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 3: NER
echo -n "3. Named Entity Recognition... "
NER=$(curl -s -X POST $BASE_URL/api/ner/recognize \
  -H "Content-Type: application/json" \
  -d '{"text":"SQL injection in example.com"}' | grep -q "entities")
if [ "$?" -eq 0 ]; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 4: Anthropic Knowledge
echo -n "4. Anthropic Knowledge... "
if curl -s $BASE_URL/api/knowledge/anthropic/models | grep -q "claude-opus"; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 5: AI Training Knowledge
echo -n "5. AI Training Knowledge... "
if curl -s $BASE_URL/api/knowledge/ai-training/moe-architectures | grep -q "MiniMax"; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 6: Self-Improvement
echo -n "6. Self-Improvement Engine... "
if curl -s $BASE_URL/api/evolution/status | grep -q "strengthScore"; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Resumen
echo ""
echo "=================================="
echo "RESULTADOS: $PASS PASS, $FAIL FAIL"
if [ $FAIL -eq 0 ]; then
  echo "✅ TODOS LOS TESTS PASARON"
else
  echo "❌ ALGUNOS TESTS FALLARON"
fi
```

**Ejecutar:**
```bash
bash test-jarvis-deployment.sh
```

---

## 📈 PARTE 4: MONITOREO DE AUTO-MEJORA

### Endpoints para Seguir la Evolución

#### A. Estado Actual
```bash
curl http://your-railway-url.com/api/evolution/status

# Ver:
# - currentVersion
# - strengthScore
# - totalWeaknesses
# - nextSteps
# - appliedOptimizations
```

#### B. Debilidades Detectadas
```bash
curl http://your-railway-url.com/api/evolution/weaknesses

# Ver 8 debilidades:
# 1. Real-time Learning (CRITICAL)
# 2. Reasoning Depth (HIGH)
# 3. Knowledge Grounding (HIGH)
# 4. Adaptive Learning (HIGH)
# 5. Context Efficiency (MEDIUM)
# 6. Compute Efficiency (MEDIUM)
# 7. Self-Verification (MEDIUM)
# 8. Multi-Agent Coordination (LOW)
```

#### C. Plan de Mejora Detallado
```bash
curl http://your-railway-url.com/api/evolution/improvement-plan

# Ver roadmap completo con:
# - Próximas 4 mejoras
# - Técnicas a aplicar
# - Mejora esperada
# - Loop automático
```

#### D. Próximo Objetivo
```bash
curl http://your-railway-url.com/api/evolution/next-objective

# Respuesta: "Resolver: Real-time Learning usando RLVR Implementation"
```

#### E. Reporte Completo
```bash
curl http://your-railway-url.com/api/evolution/full-report

# Contiene TODO sobre evolución actual
```

---

## 🔐 PARTE 5: REGISTRAR MÉTRICAS MANUALMENTE

### Registrar Métrica de Desempeño

```bash
# Después de cada interacción importante
curl -X POST http://your-railway-url.com/api/evolution/register-metric \
  -H "Content-Type: application/json" \
  -d '{
    "name": "reasoning_accuracy",
    "value": 0.88,
    "category": "reasoning"
  }'

# Categorías disponibles:
# - reasoning
# - entity_recognition
# - context_management
# - knowledge_application
# - optimization_effectiveness
```

### Ejemplo: Test de Razonamiento

```bash
#!/bin/bash

# Simular pregunta de razonamiento complejo
RESPONSE=$(curl -s -X POST http://your-railway-url.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuáles son los pasos para explotar una SQL injection en una aplicación web?",
    "sessionId": "test-session"
  }')

# Evaluar calidad de respuesta (manual o automático)
ACCURACY=0.85

# Registrar métrica
curl -X POST http://your-railway-url.com/api/evolution/register-metric \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"complex_reasoning_test\",
    \"value\": $ACCURACY,
    \"category\": \"reasoning\"
  }"

echo "Métrica registrada: reasoning_accuracy = $ACCURACY"
```

---

## 📋 PARTE 6: CHECKLIST DE VERIFICACIÓN DIARIA

### Mañana (después del deployment)

- [ ] Verificar health endpoint responde
- [ ] Verificar logs - sin errores críticos
- [ ] Crear una sesión de contexto - funciona
- [ ] Probar NER - reconoce entidades
- [ ] Ver estado evolution - v1.0.0, 65% strength
- [ ] Ver debilidades - 8 identificadas
- [ ] Ver plan de mejora - 4 pasos listos
- [ ] Memory usage - < 300MB
- [ ] CPU usage - < 50%
- [ ] Response time - < 500ms promedio

### Día 3 (primeros cambios)

- [ ] Strength score cambió? (>65%?)
- [ ] Nuevas optimizaciones propuestas?
- [ ] Métricas registradas?
- [ ] Logs muestran actividad de auto-mejora?
- [ ] GitHub repo tiene nuevos commits?
- [ ] Versión actualizada? (v1.0.0 → v1.0.1?)

### Semana 1 (evolucionando)

- [ ] Strength score > 70%?
- [ ] Versión ≥ v1.0.1?
- [ ] 2+ optimizaciones aplicadas?
- [ ] GitHub tiene 5+ commits de evolución?
- [ ] Debilidades reducidas?
- [ ] Performance estable?
- [ ] No hay memory leaks?

---

## 🛠️ PARTE 7: TROUBLESHOOTING

### Si Context Memory no funciona

```bash
# Verificar
curl http://your-railway-url.com/api/context/stats

# Ver estructura
ls -la context-memory/

# Logs
railway logs | grep ContextMemory
```

### Si NER no funciona

```bash
# Probar con texto simple
curl -X POST http://your-railway-url.com/api/ner/status

# Debe mostrar: 10 entityTypes, 40 tools, 20 vulns
```

### Si Evolution está en cero

```bash
# Verificar que se registren métricas
curl -X POST http://your-railway-url.com/api/evolution/register-metric \
  -H "Content-Type: application/json" \
  -d '{"name":"test","value":0.5,"category":"test"}'

# Luego verificar
curl http://your-railway-url.com/api/evolution/status
```

### Si GitHub no persiste

```bash
# Verificar conexión
curl -X POST http://your-railway-url.com/api/knowledge/ai-training/save-knowledge

# Ver si hay archivos en jarvis-learning-repo/
ls jarvis-learning-repo/
```

---

## 📊 PARTE 8: DASHBOARD PERSONALIZADO

### Crear Scripts de Monitoreo

#### Script: Ver Estado Cada 5 Minutos

```bash
#!/bin/bash

# watch-jarvis-evolution.sh

while true; do
  clear
  echo "🔍 JARVIS EVOLUTION MONITOR"
  echo "Updated: $(date)"
  echo "=================================="
  
  STATUS=$(curl -s http://your-railway-url.com/api/evolution/status)
  
  echo "Current Version: $(echo $STATUS | grep -o '"currentVersion":"[^"]*"' | cut -d'"' -f4)"
  echo "Strength Score: $(echo $STATUS | grep -o '"strengthScore":"[^"]*"' | cut -d'"' -f4)"
  echo "Total Weaknesses: $(echo $STATUS | grep -o '"totalWeaknesses":[0-9]*' | cut -d':' -f2)"
  echo "Next Steps: $(echo $STATUS | grep -o '"nextSteps":[0-9]*' | cut -d':' -f2)"
  echo "Applied Optimizations: $(echo $STATUS | grep -o '"appliedOptimizations":[0-9]*' | cut -d':' -f2)"
  
  echo ""
  echo "=================================="
  echo "Refreshing in 5 minutes..."
  sleep 300
done
```

**Ejecutar:**
```bash
bash watch-jarvis-evolution.sh
```

#### Script: Log Histórico

```bash
#!/bin/bash

# track-jarvis-evolution.log

LOGFILE="jarvis-evolution.log"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  STATUS=$(curl -s http://your-railway-url.com/api/evolution/status)
  
  VERSION=$(echo $STATUS | grep -o '"currentVersion":"[^"]*"' | cut -d'"' -f4)
  STRENGTH=$(echo $STATUS | grep -o '"strengthScore":"[^"]*"' | cut -d'"' -f4)
  
  echo "[$TIMESTAMP] v=$VERSION | strength=$STRENGTH" >> $LOGFILE
  
  sleep 3600  # Cada hora
done
```

---

## 🎯 PARTE 9: KPIs A MONITOREAR

### Key Performance Indicators

| KPI | Objetivo | Frecuencia | Alerta |
|-----|----------|-----------|--------|
| Health Check | 100% up | Cada min | Si < 99% |
| Response Time | < 500ms | Cada req | Si > 1000ms |
| Memory Usage | < 300MB | Cada 5min | Si > 500MB |
| Error Rate | < 1% | Cada 5min | Si > 5% |
| Strength Score | 65% → 100% | Diario | Si no aumenta |
| Version Changes | v1.0.0 → v2.0.0 | Semanal | Si no cambia |
| GitHub Commits | 5+ por semana | Semanal | Si < 1 |

---

## 📞 PARTE 10: ESCALACIÓN DE ALERTAS

### Si algo falla:

1. **Verificar logs**
   ```bash
   railway logs | tail -100
   ```

2. **Reiniciar**
   ```bash
   railway redeploy
   ```

3. **Rollback si es crítico**
   ```bash
   git revert <commit-hash>
   ```

4. **Contactar soporte** si persiste

---

## ✅ VALIDACIÓN FINAL

**Cuando todo esté corriendo:**

```
✅ Health: OK
✅ Context Memory: 5+ sesiones activas
✅ NER: Reconoce entidades correctamente
✅ Anthropic Knowledge: Accesible
✅ AI Training Knowledge: Accesible
✅ Self-Improvement: Registra métricas
✅ Memory: Estable < 300MB
✅ CPU: Eficiente < 50%
✅ Errors: 0 críticos
✅ GitHub: Commits de aprendizaje
```

**JARVIS ESTÁ VIVO Y EVOLUCIONANDO** 🚀

---

**Última Actualización**: 2025-04-23
**Versión**: Monitoring Guide v1.0
