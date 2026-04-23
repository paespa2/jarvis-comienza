#!/bin/bash

##############################################################################
# JARVIS STATE PERSISTENCE TEST SUITE
# Prueba que el sistema de persistencia funciona correctamente
##############################################################################

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "         JARVIS STATE PERSISTENCE TEST SUITE v1.0"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Testing: $BASE_URL"
echo ""

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
    echo "✅ PASS"
    ((PASS++))
  else
    echo "❌ FAIL"
    echo "   Response: $response"
    ((FAIL++))
  fi
}

##############################################################################
# PERSISTENCE TESTS
##############################################################################

echo "📋 PERSISTENCE SYSTEM TESTS"
echo "───────────────────────────────────────────────────────────────"

test_endpoint "Get Current State" "GET" "/api/persistence/state" "" "lastSnapshot\|status"
test_endpoint "Get Evolution History" "GET" "/api/persistence/history" "" "snapshots\|totalOptimizations"
test_endpoint "Get Durability Report" "GET" "/api/persistence/durability-report" "" "report\|integrityVerified"
test_endpoint "Save Manual Snapshot" "POST" "/api/persistence/save-snapshot" "" "snapshot"
test_endpoint "Verify Integrity" "GET" "/api/persistence/verify" "" "integrityValid"

echo ""
echo "🔄 EVOLUTION + PERSISTENCE INTEGRATION TESTS"
echo "───────────────────────────────────────────────────────────────"

test_endpoint "Register Metric" "POST" "/api/evolution/register-metric" \
  '{"name":"persistence_test","value":0.85,"category":"test"}' "success"

test_endpoint "Propose Optimization" "POST" "/api/evolution/propose-optimization" \
  '{}' "technique\|expectedGain"

test_endpoint "Complete Optimization" "POST" "/api/evolution/complete-optimization" \
  '{"optimizationName":"test_opt","actualImprovement":0.08}' "newVersion\|persistence"

test_endpoint "Save Progress" "POST" "/api/evolution/save-progress" "" "success"

##############################################################################
# SUMMARY
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                      TEST RESULTS"
echo "═══════════════════════════════════════════════════════════════"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo ""
echo "Total Tests:     $TOTAL"
echo "✅ Passed:       $PASS"
echo "❌ Failed:       $FAIL"
echo "Success Rate:    $PERCENTAGE%"

echo ""

if [ $FAIL -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "  ✅ ALL PERSISTENCE TESTS PASSED"
  echo "     State persistence system is working correctly!"
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo "═══════════════════════════════════════════════════════════════"
  echo "  ❌ SOME TESTS FAILED"
  echo "     Check persistence configuration"
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi
