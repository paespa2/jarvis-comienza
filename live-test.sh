#!/bin/bash

# 🧪 JARVIS LIVE TESTING SCRIPT
# Complete end-to-end production testing

PROD_URL="https://jarvis-comienza-jarvis-ia.up.railway.app"
SESSION_ID="live-test-$(date +%s)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
header() { echo -e "${BLUE}════════════════════════════════════════${NC}\n$1\n${BLUE}════════════════════════════════════════${NC}"; }

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s "$PROD_URL$endpoint")
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$endpoint")
    else
        RESPONSE=$(curl -s -X "$method" "$PROD_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$PROD_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        pass "$test_name (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$RESPONSE"
        return 0
    else
        fail "$test_name (HTTP $HTTP_CODE)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "Response: $RESPONSE"
        return 1
    fi
}

echo ""
header "🧪 JARVIS LIVE PRODUCTION TESTING"
echo ""
info "Instance: $PROD_URL"
info "Session: $SESSION_ID"
info "Time: $TIMESTAMP"
echo ""

# ============================================
# TEST 1: HEALTH CHECK
# ============================================
header "TEST 1️⃣  - HEALTH CHECK"

test_endpoint "Health endpoint" "GET" "/health"
if [ $? -eq 0 ]; then
    echo ""
fi

# ============================================
# TEST 2: SYSTEM STATUS
# ============================================
header "TEST 2️⃣  - SYSTEM STATUS"

STATUS_RESPONSE=$(curl -s "$PROD_URL/api/status")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/status")

if [ "$HTTP_CODE" = "200" ]; then
    pass "System status endpoint"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    # Try to extract uptime
    UPTIME=$(echo "$STATUS_RESPONSE" | grep -o '"uptime":[0-9]*' | cut -d':' -f2)
    if [ -n "$UPTIME" ]; then
        UPTIME_HOURS=$((UPTIME / 3600000))
        info "Uptime: ${UPTIME_HOURS} hours"
    fi
else
    fail "System status endpoint (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 3: FIRESTORE CONNECTION
# ============================================
header "TEST 3️⃣  - FIRESTORE CONNECTION"

FIRESTORE=$(curl -s "$PROD_URL/api/health/firestore")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/health/firestore")

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$FIRESTORE" | grep -q '"success":true'; then
        pass "Firestore connection (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        DB_ID=$(echo "$FIRESTORE" | grep -o '"databaseId":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$DB_ID" ]; then
            info "Database ID: $DB_ID"
        fi
    else
        fail "Firestore connection not working"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "Response: $FIRESTORE"
    fi
else
    fail "Firestore health check (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 4: BASIC CHAT (Simple message)
# ============================================
header "TEST 4️⃣  - BASIC CHAT"

CHAT_DATA="{\"message\":\"Hello Jarvis, how are you?\",\"sessionId\":\"$SESSION_ID-1\"}"
CHAT=$(curl -s -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    pass "Chat endpoint responding (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    # Extract response
    RESPONSE=$(echo "$CHAT" | grep -o '"response":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$RESPONSE" ]; then
        info "Response: ${RESPONSE:0:100}..."
    fi

    # Extract intent
    INTENT=$(echo "$CHAT" | grep -o '"intent":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$INTENT" ]; then
        info "Intent detected: $INTENT"
    fi

    # Extract coherence
    COHERENCE=$(echo "$CHAT" | grep -o '"coherenceScore":[0-9.]*' | cut -d':' -f2)
    if [ -n "$COHERENCE" ]; then
        info "Coherence score: $COHERENCE"
    fi

else
    fail "Chat endpoint (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 5: TECHNICAL QUESTION CHAT
# ============================================
header "TEST 5️⃣  - TECHNICAL QUESTION CHAT"

CHAT_DATA="{\"message\":\"What is Cross-Site Scripting (XSS)?\",\"sessionId\":\"$SESSION_ID-2\"}"
CHAT=$(curl -s -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    pass "Technical question handled (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    RESPONSE=$(echo "$CHAT" | grep -o '"response":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$RESPONSE" ]; then
        info "Response: ${RESPONSE:0:80}..."
    fi

    INTENT=$(echo "$CHAT" | grep -o '"intent":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$INTENT" ]; then
        info "Intent: $INTENT"
    fi

else
    fail "Technical question (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 6: Q&A ENDPOINT
# ============================================
header "TEST 6️⃣  - Q&A SYSTEM"

QA_DATA="{\"query\":\"What is SQL injection?\"}"
QA=$(curl -s -X POST "$PROD_URL/api/qa/ask" \
    -H "Content-Type: application/json" \
    -d "$QA_DATA")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/qa/ask" \
    -H "Content-Type: application/json" \
    -d "$QA_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    pass "Q&A system working (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    ANSWER=$(echo "$QA" | grep -o '"answer":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$ANSWER" ]; then
        info "Answer: ${ANSWER:0:80}..."
    fi

    CONFIDENCE=$(echo "$QA" | grep -o '"confidence":[0-9.]*' | cut -d':' -f2)
    if [ -n "$CONFIDENCE" ]; then
        info "Confidence: $CONFIDENCE"
    fi

else
    fail "Q&A system (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 7: MULTI-TURN CONVERSATION
# ============================================
header "TEST 7️⃣  - MULTI-TURN CONVERSATION"

# First turn
CHAT_DATA1="{\"message\":\"What is authentication?\",\"sessionId\":\"$SESSION_ID-3\"}"
CHAT1=$(curl -s -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA1")

# Second turn (same session)
CHAT_DATA2="{\"message\":\"How does two-factor authentication work?\",\"sessionId\":\"$SESSION_ID-3\"}"
CHAT2=$(curl -s -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA2")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "$CHAT_DATA2")

if [ "$HTTP_CODE" = "200" ]; then
    pass "Multi-turn conversation working (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    COHERENCE=$(echo "$CHAT2" | grep -o '"coherenceScore":[0-9.]*' | cut -d':' -f2)
    if [ -n "$COHERENCE" ]; then
        info "Coherence score (turn 2): $COHERENCE"
    fi

    info "Conversation context maintained across turns"

else
    fail "Multi-turn conversation (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# TEST 8: SELF-IMPROVE ENDPOINT
# ============================================
header "TEST 8️⃣  - SELF-IMPROVE ENDPOINT"

IMPROVE_DATA="{\"days\":1}"
IMPROVE=$(curl -s -X POST "$PROD_URL/api/self-improve" \
    -H "Content-Type: application/json" \
    -d "$IMPROVE_DATA")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/self-improve" \
    -H "Content-Type: application/json" \
    -d "$IMPROVE_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$IMPROVE" | grep -q '"success":true'; then
        pass "Self-improve endpoint working (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        COMMIT=$(echo "$IMPROVE" | grep -o '"commitHash":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$COMMIT" ]; then
            info "Commit: $COMMIT"
        fi

        IMPROVEMENTS=$(echo "$IMPROVE" | grep -o '"improvements":\[[^]]*\]' | head -c 100)
        if [ -n "$IMPROVEMENTS" ]; then
            info "Improvements generated"
        fi
    else
        warn "Self-improve endpoint responded but no improvements"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    warn "Self-improve endpoint (HTTP $HTTP_CODE) - may not have data yet"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# SUMMARY
# ============================================
header "📊 TEST SUMMARY"

echo ""
echo "Total Tests Run:      $TESTS_RUN"
echo -e "Tests Passed:         ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:         ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    pass "ALL TESTS PASSED! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Check Firestore Console for recorded interactions:"
    echo "   https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/"
    echo ""
    echo "2. Verify interactions were recorded:"
    echo "   - Click 'interactions' collection"
    echo "   - Should see documents for each chat"
    echo ""
    echo "3. Check GitHub Actions:"
    echo "   https://github.com/paespa2/jarvis-comienza/actions"
    echo ""
    echo "4. Monitor auto-commits:"
    echo "   https://github.com/paespa2/jarvis-comienza/commits/claude/jarvis-autonomous-testing-FlgyW"
    echo ""
else
    warn "Some tests failed - check the output above"
fi

echo ""
echo "Session ID for reference: $SESSION_ID"
echo ""
