#!/bin/bash

# 🔧 RAILWAY DIAGNOSTIC TOOL
# Helps identify what's wrong with Railway deployment

echo "🔧 JARVIS RAILWAY DIAGNOSTIC TOOL"
echo "=================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with:"
    echo "   npm install -g @railway/cli"
    echo ""
    echo "Then run: railway login"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI installed and logged in"
echo ""

# ============================================
# 1. Check Variables
# ============================================
echo "1️⃣  ENVIRONMENT VARIABLES"
echo "========================"
echo ""

VARS=$(railway variables)

if echo "$VARS" | grep -q "GOOGLE_APPLICATION_CREDENTIALS_JSON"; then
    echo "✅ GOOGLE_APPLICATION_CREDENTIALS_JSON is set"
else
    echo "❌ GOOGLE_APPLICATION_CREDENTIALS_JSON is MISSING (CRITICAL)"
fi

if echo "$VARS" | grep -q "GITHUB_TOKEN"; then
    echo "✅ GITHUB_TOKEN is set"
else
    echo "❌ GITHUB_TOKEN is MISSING (CRITICAL)"
fi

if echo "$VARS" | grep -q "GITHUB_OWNER"; then
    echo "✅ GITHUB_OWNER is set"
else
    echo "❌ GITHUB_OWNER is MISSING"
fi

if echo "$VARS" | grep -q "NODE_ENV"; then
    echo "✅ NODE_ENV is set"
else
    echo "❌ NODE_ENV is MISSING"
fi

echo ""

# ============================================
# 2. Check Recent Logs
# ============================================
echo "2️⃣  RECENT LOGS (Last 50 lines)"
echo "==============================="
echo ""

echo "Fetching logs..."
LOGS=$(railway logs --lines 50 2>&1)

# Check for success indicator
if echo "$LOGS" | grep -q "Servidor iniciado"; then
    echo "✅ Service started successfully"
    echo ""
    echo "Recent relevant logs:"
    echo "$LOGS" | grep -i "servidor\|connected\|listening" | tail -5
else
    # Check for common errors
    echo "⚠️  Service may have issues. Check for errors:"
    echo ""

    if echo "$LOGS" | grep -i "error"; then
        echo "❌ Errors found:"
        echo "$LOGS" | grep -i "error" | head -5
    fi

    if echo "$LOGS" | grep -i "cannot find module"; then
        echo "❌ Missing dependencies:"
        echo "$LOGS" | grep "cannot find module"
    fi

    if echo "$LOGS" | grep -i "permission"; then
        echo "❌ Permission denied (check Firebase credentials):"
        echo "$LOGS" | grep -i "permission" | head -3
    fi
fi

echo ""

# ============================================
# 3. Check Service Status
# ============================================
echo "3️⃣  SERVICE STATUS"
echo "================="
echo ""

STATUS=$(curl -s -I https://jarvis-comienza-jarvis-ia.up.railway.app/health 2>&1)
HTTP_CODE=$(echo "$STATUS" | head -1 | awk '{print $2}')

echo "Health Endpoint Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Service is responding (200 OK)"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "❌ Service unavailable (503) - Still deploying or crashed"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "❌ Bad gateway (502) - Railway issue"
else
    echo "⚠️  Unexpected status: $HTTP_CODE"
fi

echo ""

# ============================================
# 4. Check Firestore Connection
# ============================================
echo "4️⃣  FIRESTORE CONNECTION"
echo "======================="
echo ""

FIRESTORE=$(curl -s https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore 2>&1)

if echo "$FIRESTORE" | grep -q '"success":true'; then
    echo "✅ Firestore is connected"
    echo "Response: $FIRESTORE"
elif echo "$FIRESTORE" | grep -q "PERMISSION_DENIED"; then
    echo "❌ Firestore permission denied"
    echo "   → Check GOOGLE_APPLICATION_CREDENTIALS_JSON format"
    echo "   → Verify Firebase service account has Firestore permissions"
elif echo "$FIRESTORE" | grep -q "error"; then
    echo "❌ Firestore error:"
    echo "   $FIRESTORE"
else
    echo "⚠️  Could not test Firestore (service might be down)"
fi

echo ""

# ============================================
# 5. Check Build Status
# ============================================
echo "5️⃣  BUILD STATUS"
echo "==============="
echo ""

echo "Checking if TypeScript builds locally..."
if npm run build &> /dev/null; then
    echo "✅ TypeScript build successful (0 errors)"
else
    echo "❌ TypeScript build failed"
    echo "Run: npm run build"
    npm run build 2>&1 | grep -i error | head -5
fi

echo ""

# ============================================
# 6. Summary & Recommendations
# ============================================
echo "6️⃣  RECOMMENDATIONS"
echo "=================="
echo ""

if [ "$HTTP_CODE" = "200" ] && echo "$FIRESTORE" | grep -q '"success":true'; then
    echo "✅ Everything looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Test chat endpoint:"
    echo "   curl -X POST https://jarvis-comienza-jarvis-ia.up.railway.app/api/chat \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"message\":\"Hello\",\"sessionId\":\"test\"}'"
    echo ""
    echo "2. Check Firestore Console for recorded interactions:"
    echo "   https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/"
else
    echo "⚠️  There are issues to fix:"
    echo ""

    if [ "$HTTP_CODE" != "200" ]; then
        echo "Problem: Service not responding with 200"
        echo "Solution: Check logs: railway logs -f"
        echo ""
    fi

    if ! echo "$FIRESTORE" | grep -q '"success":true'; then
        echo "Problem: Firestore not connected"
        echo "Solution:"
        echo "1. Verify GOOGLE_APPLICATION_CREDENTIALS_JSON in variables"
        echo "2. Run: railway variables"
        echo "3. Check it's the complete JSON (not truncated)"
        echo ""
    fi

    echo "Debug commands:"
    echo "• View all logs: railway logs -f"
    echo "• Check variables: railway variables"
    echo "• Local build test: npm run build"
    echo "• Redeploy: railway up"
fi

echo ""
echo "📊 Full Diagnostic Report"
echo "========================"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo "Firestore: $(echo "$FIRESTORE" | grep -o '"success":[^,]*')"
echo "Logs: $(echo "$LOGS" | wc -l) lines available"
echo ""
echo "✨ Done! Use the recommendations above to fix any issues."
