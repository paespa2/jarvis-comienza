# 🔧 RAILWAY DIAGNOSTICS & TROUBLESHOOTING

**Status**: Production instance may be redeploying or has issues

---

## 🚀 Quick Check: Is Railway Up?

### Check Service Status

1. **Open Railway Dashboard**:
   ```
   https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
   ```

2. **Look for the Jarvis service**:
   - Should show a green checkmark ✅ if running
   - Orange icon 🟠 if deploying
   - Red icon ❌ if failed

3. **Check Recent Deployments**:
   - Click "Deployments" tab
   - Should see recent successful deployment
   - If latest is red, click it to see error logs

---

## 📊 What Each Status Means

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Green | Running | Service is healthy |
| 🟠 Orange | Deploying | Wait 2-5 minutes |
| 🟡 Yellow | Building | Wait for build to finish |
| ❌ Red | Failed | Check logs for error |
| ⚫ Gray | Stopped | Click "Deploy" button |

---

## 🔍 Check Logs

### Via Railway Dashboard

1. Go to: https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
2. Click "Jarvis" service
3. Click "Logs" tab
4. Look for:
   - ✅ "✅ Servidor iniciado en http://0.0.0.0:3000" = Success
   - ❌ Error messages = Problems
   - 🟡 "Building..." = Still deploying

### Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs -f

# Or check specific service
railway logs -f --service jarvis
```

---

## 🚨 Common Issues & Fixes

### Issue 1: 503 Service Unavailable

**Symptom**: `HTTP 503` or "Service Unavailable"

**Causes**:
- Service is still deploying (wait 2-5 min)
- Startup error (check logs)
- Missing environment variables
- Crashed process

**Fix**:
1. Check Railway dashboard for deployment status
2. If deploying, wait for it to finish
3. If failed, check logs:
   ```bash
   railway logs -f
   ```
4. If missing env vars, add them and redeploy:
   - Go to Variables
   - Add missing: GOOGLE_APPLICATION_CREDENTIALS_JSON, GITHUB_TOKEN
   - Click "Deploy" button

---

### Issue 2: Service Won't Start

**Symptom**: Logs show errors like "Cannot find module" or "Port already in use"

**Logs to look for**:
```
❌ Error: Cannot find module '@google-cloud/firestore'
❌ EADDRINUSE: address already in use
❌ Syntax error in TypeScript
```

**Fix**:
1. Check if dependencies are installed:
   ```bash
   npm install
   ```

2. Rebuild TypeScript:
   ```bash
   npm run build
   ```

3. Push to Railway (triggers rebuild):
   ```bash
   git add .
   git commit -m "Fix deployment"
   git push
   ```

---

### Issue 3: Firestore Connection Failed

**Symptom**: Logs show "Connection failed" or "Permission denied"

**Logs to look for**:
```
❌ [Firestore] Initialization error: Connection failed
❌ 7 PERMISSION_DENIED: Missing or insufficient permissions
❌ Invalid service account key
```

**Fix**:
1. Verify GOOGLE_APPLICATION_CREDENTIALS_JSON is set:
   ```bash
   railway variables
   ```

2. Check if it's the complete JSON (not truncated)

3. Regenerate service account key:
   - https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk
   - Delete old key
   - Generate new key
   - Add to Railway (full JSON)

4. Redeploy:
   ```bash
   git push
   ```

---

### Issue 4: GitHub Token Failed

**Symptom**: Logs show "GitHub auth failed" or "Token invalid"

**Logs to look for**:
```
❌ GitHub authentication failed
❌ Invalid token: ghp_...
❌ 401 Unauthorized
```

**Fix**:
1. Check token hasn't expired:
   - https://github.com/settings/tokens
   - Look for `jarvis-auto-commit` token
   - If expired or not found, generate new token

2. Verify GITHUB_TOKEN in Railway:
   ```bash
   railway variables
   ```

3. Add new token:
   - Go to Railway Variables
   - Update GITHUB_TOKEN with new value
   - Redeploy

---

## ✅ Verification Checklist

After deployment:

- [ ] Railway dashboard shows green ✅ status
- [ ] Recent deployment is marked as successful
- [ ] Logs show "✅ Servidor iniciado"
- [ ] No error messages in logs
- [ ] /health endpoint returns 200
- [ ] /api/health/firestore returns 200
- [ ] /api/chat responds with 200
- [ ] Firestore Console shows new data

---

## 📋 Manual Verification Steps

### Step 1: Service Running?

```bash
# Should return 200 OK
curl -I https://jarvis-comienza-jarvis-ia.up.railway.app/health

# Should see: HTTP/2 200
```

### Step 2: Firestore Connected?

```bash
# Should return JSON with "success": true
curl https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore
```

### Step 3: Chat Works?

```bash
curl -X POST https://jarvis-comienza-jarvis-ia.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test"}'

# Should return 200 with response
```

### Step 4: Data in Firestore?

1. Go to Firebase Console:
   ```
   https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/
   ```

2. Click "interactions" collection

3. Should see new documents

---

## 🛠️ Manual Redeploy

If you need to force a redeploy:

### Option A: Via Railway Dashboard

1. Go to: https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
2. Click "Jarvis" service
3. Click "Deploy" button (top right)
4. Wait for deployment to finish

### Option B: Via Git Push

```bash
# Any change and push will trigger redeploy
git add .
git commit -m "Trigger redeploy"
git push

# Railway automatically rebuilds and deploys
```

### Option C: Via Railway CLI

```bash
railway up
```

---

## 📈 Monitor Deployment Progress

### Via Dashboard
- Green status appears immediately
- Build starts (usually 1-2 minutes)
- Deployment finishes (usually 2-5 minutes total)

### Via Logs
```bash
railway logs -f

# Watch for:
# 1. "Building..." - Build starting
# 2. "npm install" - Installing deps
# 3. "npm run build" - Compiling TypeScript
# 4. "✅ Servidor iniciado" - Success!
```

---

## 🔗 Important Links

| What | Where |
|------|-------|
| Railway Dashboard | https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b |
| Service Logs | Click "Jarvis" → "Logs" |
| Environment Variables | Click "Jarvis" → "Variables" |
| Deployments | Click "Jarvis" → "Deployments" |
| Production URL | https://jarvis-comienza-jarvis-ia.up.railway.app |
| Firebase Console | https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789 |
| GitHub Repo | https://github.com/paespa2/jarvis-comienza |

---

## 🆘 If Still Having Issues

### Step 1: Check All Variables

```bash
railway variables
```

Must have:
- ✅ GOOGLE_APPLICATION_CREDENTIALS_JSON (Firebase)
- ✅ GITHUB_TOKEN (GitHub)
- ✅ GITHUB_OWNER=paespa2
- ✅ GITHUB_REPO=jarvis-comienza
- ✅ GITHUB_BRANCH=claude/jarvis-autonomous-testing-FlgyW
- ✅ NODE_ENV=production
- ✅ PORT=3000
- ✅ HOST=0.0.0.0

### Step 2: Check Latest Logs

```bash
railway logs --lines 100
```

Look for:
- Any error messages
- "Cannot find module" errors
- Connection timeouts
- Authentication failures

### Step 3: Local Test Build

```bash
# Build locally to check for errors
npm run build

# Should show: 0 TypeScript errors
```

### Step 4: Redeploy with Fresh Build

```bash
# Force rebuild by pushing
git add .
git commit -m "Force redeploy"
git push

# Monitor deployment
railway logs -f
```

---

## 💡 Pro Tips

1. **Always check logs first** - They tell you exactly what's wrong
2. **Variable changes need redeploy** - Always push after adding/changing variables
3. **Errors are usually clear** - Read them carefully, they guide you to the fix
4. **Patience on first deploy** - First deployment takes 3-5 minutes
5. **Keep a watchful eye** - Monitor logs during deployment

---

## ✨ Summary

**Current Status**: Checking...

**Next Action**: 
1. Go to Railway dashboard: https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
2. Check if service is green ✅
3. Click "Logs" tab
4. Look for error messages or "Servidor iniciado"
5. If deploying (🟠), wait 2-5 minutes
6. If error (❌), scroll logs to find problem
7. If stuck, run: `railway logs -f` and tell me what you see

**Is Railway working?** Check the dashboard and let me know what you see! 🚀
