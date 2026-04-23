# 🚂 RAILWAY CONFIGURATION GUIDE - COMPLETE SETUP

**Project**: jarvis-comienza  
**Environment**: Production  
**Status**: Needs configuration sync

---

## 🎯 Problem: Things Not Connected

**What you're feeling**:
- Uncertain if everything is properly connected
- Not sure which services are talking to each other
- Configuration scattered across multiple places
- Unsure if data is being persisted

**Solution**: This guide ensures ALL components are connected and synchronized.

---

## 📊 Architecture Overview

```
Railway Instance (Jarvis Server)
├─ /api/chat (Phase 1+2 Conversation AI)
│  ├─ Records interactions to Firestore
│  ├─ Updates context memory
│  └─ Learns from every query
│
├─ /api/self-improve (Daily autonomous improvement)
│  ├─ Reads interactions from Firestore
│  ├─ Analyzes with ML engines
│  ├─ Auto-commits improvements to GitHub
│  └─ Records metrics to Firestore
│
├─ /api/health/firestore (Connection test)
│  └─ Verifies Firestore connectivity
│
└─ Connects to 3 External Services:
   ├─ Firebase Firestore (Database)
   ├─ GitHub (Persistence + Actions)
   └─ Google Cloud (Service account)
```

---

## ✅ CHECKLIST: Railway Environment Setup

Use this checklist to ensure everything is properly configured.

### Section 1: Firebase Firestore

**Location**: https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b/settings/variables

- [ ] **GOOGLE_APPLICATION_CREDENTIALS**
  - Value: Path to service account key (if file upload)
  - OR base64-encoded JSON
  - How to get: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk
  - Click "Generate New Private Key"
  - Save the JSON file safely
  - Status: **CRITICAL** (without this, Firestore won't connect)

### Section 2: Database Configuration

**NOTE**: These are OPTIONAL (Firestore is primary). Use if you want fallback options.

- [ ] **FIREBASE_PROJECT_ID** (Optional)
  - Value: `asistente-jarvis-1741893602789`
  - Purpose: For Firebase SQL Connect (alternative to Firestore)
  - Status: Optional

- [ ] **FIREBASE_API_KEY** (Optional)
  - Value: Firebase API key from console
  - Purpose: Firebase SQL Connect GraphQL endpoint
  - Status: Optional

- [ ] **CLOUD_SQL_HOST** (Optional)
  - Value: Cloud SQL instance IP
  - Purpose: PostgreSQL fallback
  - Status: Optional

- [ ] **CLOUD_SQL_USER** (Optional)
  - Value: `postgres`
  - Purpose: Cloud SQL authentication
  - Status: Optional

- [ ] **CLOUD_SQL_PASSWORD** (Optional)
  - Value: Your Cloud SQL password
  - Purpose: Cloud SQL authentication
  - Status: Optional

- [ ] **CLOUD_SQL_DATABASE** (Optional)
  - Value: `asistente-jarvis-1741893602789-database`
  - Purpose: Cloud SQL database name
  - Status: Optional

### Section 3: GitHub Integration (Auto-Commits)

**Required for**: `/api/self-improve` to auto-commit improvements

- [ ] **GITHUB_TOKEN**
  - Value: Personal access token from GitHub
  - How to get:
    1. Go to: https://github.com/settings/tokens
    2. Click "Generate new token (classic)"
    3. Select scopes: `repo` (full control of repos)
    4. Copy token (save securely!)
  - Status: **CRITICAL** (without this, auto-commits won't work)

- [ ] **GITHUB_OWNER**
  - Value: `paespa2`
  - Purpose: Your GitHub username
  - Status: Important

- [ ] **GITHUB_REPO**
  - Value: `jarvis-comienza`
  - Purpose: Repository name
  - Status: Important

- [ ] **GITHUB_BRANCH**
  - Value: `claude/jarvis-autonomous-testing-FlgyW`
  - Purpose: Target branch for auto-commits
  - Status: Important

### Section 4: Jarvis Configuration

- [ ] **NODE_ENV**
  - Value: `production`
  - Purpose: Tells Node.js this is production environment
  - Status: Important

- [ ] **PORT**
  - Value: `3000`
  - Purpose: Service port (Railway sets automatically)
  - Status: Usually auto

- [ ] **HOST**
  - Value: `0.0.0.0`
  - Purpose: Listen on all interfaces
  - Status: Usually auto

### Section 5: Optional Monitoring

- [ ] **LOG_LEVEL**
  - Value: `debug` or `info`
  - Purpose: Control logging verbosity
  - Status: Optional

- [ ] **SENTRY_DSN**
  - Value: Sentry error tracking URL
  - Purpose: Error monitoring
  - Status: Optional

---

## 🔧 Step-by-Step Configuration

### Step 1: Access Railway Environment Variables

1. Go to your Railway project:
   ```
   https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
   ```

2. Click on **"Jarvis"** service

3. Click **"Variables"** tab

4. You should see empty form to add variables

---

### Step 2: Add Firestore Service Account (CRITICAL)

1. **Get Service Account Key**:
   ```bash
   # Option A: Download from Firebase Console
   # Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk
   # Click "Generate New Private Key"
   # Save the JSON file
   ```

2. **Encode the key for Railway**:
   ```bash
   # Read the service account JSON
   cat ~/Downloads/serviceAccountKey.json
   
   # Convert to single line (Railway prefers this)
   # Or use base64:
   cat ~/Downloads/serviceAccountKey.json | base64 > key.b64
   ```

3. **Add to Railway**:
   - Variable name: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste the entire JSON from the file
   - Click "Add"

---

### Step 3: Add GitHub Token (CRITICAL)

1. **Generate GitHub Personal Access Token**:
   ```
   https://github.com/settings/tokens?type=beta
   ```

2. **Create new token with**:
   - Name: `jarvis-auto-commit`
   - Repository access: `jarvis-comienza`
   - Permissions: `Contents:write` (for commits)
   - Expiration: 90 days (renew regularly)

3. **Add to Railway**:
   - Variable name: `GITHUB_TOKEN`
   - Value: `ghp_xxxxxxxxxxxx...` (paste token)
   - Click "Add"

---

### Step 4: Add GitHub Configuration

In Railway Variables, add:

```
GITHUB_OWNER=paespa2
GITHUB_REPO=jarvis-comienza
GITHUB_BRANCH=claude/jarvis-autonomous-testing-FlgyW
```

---

### Step 5: Verify All Variables

Your Railway Variables should look like:

```
GITHUB_BRANCH=claude/jarvis-autonomous-testing-FlgyW
GITHUB_OWNER=paespa2
GITHUB_REPO=jarvis-comienza
GITHUB_TOKEN=ghp_xxxxxxxxxxxx...
GOOGLE_APPLICATION_CREDENTIALS_JSON={entire-json-here}
HOST=0.0.0.0
NODE_ENV=production
PORT=3000
```

**Total**: 8 variables (1 critical: GOOGLE_APPLICATION_CREDENTIALS_JSON + GITHUB_TOKEN)

---

## 🧪 Step 6: Verification

### Test 1: Check Service is Running

```bash
curl https://jarvis-comienza-jarvis-ia.up.railway.app/health
```

Expected:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "features": ["Phase1-Persistence", "Phase2-AutonomousReasoning"],
  "environment": "production"
}
```

### Test 2: Check Firestore Connection

```bash
curl https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore
```

Expected:
```json
{
  "success": true,
  "status": "connected",
  "message": "Connected to Firestore (database: ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00)",
  "databaseId": "ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00",
  "timestamp": 1713902400000
}
```

### Test 3: Chat with Jarvis

```bash
curl -X POST https://jarvis-comienza-jarvis-ia.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Jarvis","sessionId":"test-123"}'
```

Expected: 200 OK with response

### Test 4: Check Firestore has recorded interaction

1. Go to Firebase Console:
   ```
   https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/
   ```

2. Click "interactions" collection

3. Should see new document with:
   - sessionId: "test-123"
   - userQuery: "Hello Jarvis"
   - jarvisResponse: "..."
   - createdAt: (current time)

### Test 5: Trigger Self-Improvement

```bash
curl -X POST https://jarvis-comienza-jarvis-ia.up.railway.app/api/self-improve \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'
```

Expected: 200 OK with improvements

### Test 6: Check GitHub Auto-Commit

1. Go to: https://github.com/paespa2/jarvis-comienza/commits/claude/jarvis-autonomous-testing-FlgyW

2. Should see new commit like:
   ```
   Auto-improve: ResponseQuality (+0.85 impact)
   ```

3. If no commit, check Railway logs for errors

---

## 📋 Railway Environment Visualization

```
Railway Project: jarvis-comienza
├─ Service: Jarvis
│  └─ Status: Must be "Deploy Successful"
│
├─ Environment Variables (8 total):
│  ├─ CRITICAL:
│  │  ├─ GOOGLE_APPLICATION_CREDENTIALS_JSON
│  │  └─ GITHUB_TOKEN
│  ├─ GitHub Config:
│  │  ├─ GITHUB_OWNER
│  │  ├─ GITHUB_REPO
│  │  └─ GITHUB_BRANCH
│  └─ Defaults:
│     ├─ NODE_ENV=production
│     ├─ HOST=0.0.0.0
│     └─ PORT=3000
│
├─ Deployments: Should see recent deploys
│
└─ Logs: Should show:
   ✅ [Firestore] Connected to database...
   ✅ Self-Improve Endpoint registered
   ✅ Servidor iniciado en http://0.0.0.0:3000
```

---

## 🔌 Connection Sync Diagram

```
Jarvis Code
    ↓
Railway Instance (Node.js)
    ├─ firebaseFirestoreService.ts
    │  ├─ Uses: GOOGLE_APPLICATION_CREDENTIALS_JSON
    │  ├─ Connects to: Firebase Firestore
    │  └─ Collections: interactions, improvements, metrics, etc
    │
    └─ self-improve-endpoint.ts
       ├─ Uses: cloudSQLService OR firebaseFirestoreService
       ├─ Uses: GitHub API with GITHUB_TOKEN
       ├─ Reads: interactions from Firestore
       ├─ Analyzes: with ML engines
       ├─ Commits: improvements to GitHub
       └─ Records: metrics to Firestore
```

---

## 🐛 Troubleshooting

### Issue: /api/health/firestore returns 503 (Connection Error)

**Symptom**: 
```json
{
  "success": false,
  "status": "error",
  "message": "Connection failed: ..."
}
```

**Fix**:
1. Check GOOGLE_APPLICATION_CREDENTIALS_JSON is set in Railway
2. Verify the JSON is valid (not truncated)
3. Check Firebase Console to ensure database exists
4. Redeploy: Push a commit to trigger Railway rebuild

### Issue: /api/self-improve returns 404

**Symptom**: Endpoint not found

**Fix**:
1. Verify registerSelfImproveEndpoint(app) is called in server.ts ✅ (already done)
2. Check Railway has redeployed after environment changes
3. Restart service or push new commit

### Issue: Auto-commit not appearing on GitHub

**Symptom**: /api/self-improve succeeds but no commit on GitHub

**Fix**:
1. Check GITHUB_TOKEN is set correctly
2. Verify token has `repo` scope
3. Check token hasn't expired (valid for 90 days)
4. Check Railway logs for auth errors: `railway logs -f`
5. Generate new token if needed

### Issue: Firestore data not appearing

**Symptom**: After /api/chat, no data in Firestore

**Fix**:
1. Verify /api/health/firestore returns 200
2. Check Firestore database ID is correct: `ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00`
3. Verify collections exist (auto-created on first write)
4. Check Firestore Rules allow writes
5. Wait 30 seconds for eventual consistency

---

## 🚀 What Happens After Complete Setup

### Immediate (Seconds):
- ✅ Conversations recorded to Firestore
- ✅ Context memory updated
- ✅ All Phase 1 systems active

### Daily (6 AM UTC via GitHub Actions):
- ✅ Fetch last 24h interactions
- ✅ Analyze with ML engines
- ✅ Generate improvements
- ✅ Auto-commit to GitHub
- ✅ Record metrics to Firestore

### Weekly:
- ✅ Metrics trends visible in Firestore
- ✅ Improvement commits accumulate
- ✅ Jarvis progressively improves

---

## 📞 Quick Reference

### Railway Project URL
```
https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
```

### Service URLs
```
Production: https://jarvis-comienza-jarvis-ia.up.railway.app
Health:     https://jarvis-comienza-jarvis-ia.up.railway.app/health
Firestore:  https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore
Chat:       https://jarvis-comienza-jarvis-ia.up.railway.app/api/chat
Self-Improve: https://jarvis-comienza-jarvis-ia.up.railway.app/api/self-improve
```

### Console URLs
```
Firebase Project: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789
Firestore Database: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/
GitHub Repo: https://github.com/paespa2/jarvis-comienza
GitHub Token: https://github.com/settings/tokens
```

---

## ✨ Summary

**What's NOT configured yet**:
- ❌ GOOGLE_APPLICATION_CREDENTIALS_JSON (need to add)
- ❌ GITHUB_TOKEN (need to add)

**What's already working**:
- ✅ Code is ready
- ✅ Firestore service implemented
- ✅ Self-improve endpoint coded
- ✅ Health check endpoints ready
- ✅ GitHub integration prepared

**Time to complete**: 15 minutes

**Steps**:
1. Download service account key from Firebase
2. Add GOOGLE_APPLICATION_CREDENTIALS_JSON to Railway
3. Generate GitHub token
4. Add GITHUB_TOKEN to Railway
5. Push a commit (triggers redeploy)
6. Test endpoints
7. Watch data flow into Firestore

🎯 **Next**: Go to Railway Variables and add the 2 critical variables above.
