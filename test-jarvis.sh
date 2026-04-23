#!/bin/bash

##############################################################################
# JARVIS DEPLOYMENT TEST SCRIPT
# Verifica que todos los sistemas funcionen correctamente
##############################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           JARVIS DEPLOYMENT TEST SUITE v1.0              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Testing: ${YELLOW}$BASE_URL${NC}"
echo ""

##############################################################################
# FUNCIÓN DE TEST
##############################################################################

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected="$5"

  echo -n "Testing: $name... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s "$BASE_URL$endpoint")
  else
    response=$(curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi

  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $response"
    ((FAIL++))
  fi
}

##############################################################################
# TESTS
##############################################################################

echo -e "${YELLOW}1. HEALTH CHECK${NC}"
test_endpoint "Health" "GET" "/health" "" "healthy\|status"

echo ""
echo -e "${YELLOW}2. CONTEXT MEMORY SYSTEM${NC}"
test_endpoint "Create Session" "POST" "/api/context/create-session" \
  '{"userId":"test-user"}' "sessionId"
test_endpoint "Get Stats" "GET" "/api/context/stats" "" "totalSessions\|activeSessions"

echo ""
echo -e "${YELLOW}3. NAMED ENTITY RECOGNITION${NC}"
test_endpoint "Recognize Entities" "POST" "/api/ner/recognize" \
  '{"text":"SQL injection en ejemplo.com usando sqlmap"}' "entities"
test_endpoint "Extract Attack Parameters" "POST" "/api/ner/extract-attack-parameters" \
  '{"text":"RCE vulnerability in Node.js"}' "vulnerabilities"
test_endpoint "NER Status" "GET" "/api/ner/status" "" "entityTypes"

echo ""
echo -e "${YELLOW}4. ENTITY TRACKING${NC}"
test_endpoint "Create Tracking Session" "POST" "/api/ner/track/session" \
  '{"sessionId":"test-session"}' "sessionId"

echo ""
echo -e "${YELLOW}5. ANTHROPIC KNOWLEDGE MANAGER${NC}"
test_endpoint "Get Models" "GET" "/api/knowledge/anthropic/models" "" "claude-opus"
test_endpoint "Get Capabilities" "GET" "/api/knowledge/anthropic/capabilities" "" "capabilities"
test_endpoint "Get Patterns" "GET" "/api/knowledge/anthropic/patterns" "" "patterns"
test_endpoint "Get Best Practices" "GET" "/api/knowledge/anthropic/best-practices" "" "bestPractices"

echo ""
echo -e "${YELLOW}6. AI TRAINING KNOWLEDGE MANAGER${NC}"
test_endpoint "Get MoE Architectures" "GET" "/api/knowledge/ai-training/moe-architectures" "" "architectures"
test_endpoint "Get Optimization Techniques" "GET" "/api/knowledge/ai-training/optimization-techniques" "" "techniques"
test_endpoint "Get Advanced Models" "GET" "/api/knowledge/ai-training/advanced-models" "" "models"
test_endpoint "Get Training Strategies" "GET" "/api/knowledge/ai-training/training-strategies" "" "strategies"

echo ""
echo -e "${YELLOW}7. AUTONOMOUS SELF-IMPROVEMENT ENGINE${NC}"
test_endpoint "Evolution Status" "GET" "/api/evolution/status" "" "strengthScore"
test_endpoint "Get Weaknesses" "GET" "/api/evolution/weaknesses" "" "weaknesses"
test_endpoint "Get Improvement Plan" "GET" "/api/evolution/improvement-plan" "" "plan"
test_endpoint "Get Next Objective" "GET" "/api/evolution/next-objective" "" "objective"

echo ""
echo -e "${YELLOW}8. REGISTER METRICS${NC}"
test_endpoint "Register Metric" "POST" "/api/evolution/register-metric" \
  '{"name":"test_metric","value":0.85,"category":"test"}' "success"

echo ""
echo -e "${YELLOW}9. PROPOSE OPTIMIZATION${NC}"
test_endpoint "Propose Optimization" "POST" "/api/evolution/propose-optimization" \
  '{}' "technique"

echo ""
echo -e "${YELLOW}10. FULL EVOLUTION REPORT${NC}"
test_endpoint "Get Full Report" "GET" "/api/evolution/full-report" "" "currentVersion"

##############################################################################
# RESUMEN
##############################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST RESULTS                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo ""
echo -e "Total Tests:     ${YELLOW}$TOTAL${NC}"
echo -e "Passed:          ${GREEN}$PASS${NC}"
echo -e "Failed:          ${RED}$FAIL${NC}"
echo -e "Success Rate:    ${YELLOW}$PERCENTAGE%${NC}"

echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║        ✅ ALL TESTS PASSED - JARVIS IS RUNNING CORRECTLY   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║          ❌ SOME TESTS FAILED - CHECK DETAILS ABOVE       ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
