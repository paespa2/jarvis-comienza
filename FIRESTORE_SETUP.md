# 🔥 FIRESTORE INTEGRATION SETUP

**Status**: Ready to configure  
**Database**: ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00  
**Project**: asistente-jarvis-1741893602789

---

## 📋 What's Configured

Jarvis is now properly integrated with your Firestore database. All you need to do is:

1. ✅ **Code**: Firestore service is ready (`firebaseFirestoreService.ts`)
2. ✅ **Collections**: Schema defined for Jarvis data
3. ⏳ **Credentials**: Need to set `GOOGLE_APPLICATION_CREDENTIALS`
4. ⏳ **Test**: Verify connection via health check

---

## 🔐 Step 1: Get Service Account Key

Your Firestore instance requires a service account key for server-side authentication.

### Option A: Download from Firebase Console (Recommended)

1. Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk

2. Click **"Generate New Private Key"**

3. Save the JSON file (keep it secret!)

   ```
   {
     "type": "service_account",
     "project_id": "asistente-jarvis-1741893602789",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@asistente-jarvis-1741893602789.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```

---

## 📁 Step 2: Store Service Account Securely

### For Local Development

```bash
# Create .config directory (excluded from git)
mkdir -p .config

# Move/paste the service account key
cp ~/Downloads/serviceAccountKey.json .config/serviceAccountKey.json

# Verify .config is in .gitignore
echo ".config/" >> .gitignore

# Test local connection
npm run build
npm start
```

### For Railway Deployment

1. **Convert key to JSON string**:
   ```bash
   # Read the JSON file
   cat .config/serviceAccountKey.json
   
   # Copy entire JSON output
   ```

2. **Set in Railway environment**:
   - Go to: https://railway.app/project/jarvis-comienza
   - Click "Variables"
   - Add new variable:
     ```
     GOOGLE_APPLICATION_CREDENTIALS_JSON={paste-entire-json}
     ```
   - OR set as file (Railway will handle it automatically)

3. **Alternative: Using base64**:
   ```bash
   # Encode service account key
   cat .config/serviceAccountKey.json | base64 > key.b64
   
   # Set in Railway
   GOOGLE_APPLICATION_CREDENTIALS_B64={paste-base64-content}
   ```

---

## 🗂️ Step 3: Firestore Collections Structure

Your database will have these collections:

### `interactions` - User queries and Jarvis responses
```
Document ID: Auto-generated
Fields:
├── sessionId: string (session identifier)
├── userQuery: string (user's question)
├── jarvisResponse: string (Jarvis's answer)
├── intent: string (detected intent type)
├── emotion: string (detected emotion)
├── confidence: number (0-1)
├── userSatisfaction: number (0-1, optional)
├── systemsUsed: array (Phase 1 systems used)
├── executionTimeMs: number (response time)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### `improvements` - Auto-improvements from self-improve engine
```
Document ID: Auto-generated
Fields:
├── commitHash: string (git commit hash)
├── improvementType: string (ResponseQuality, etc)
├── targetDimension: string (quality, relevance, coherence, etc)
├── priority: number (1-5)
├── expectedImpact: number (0-1)
├── filesChanged: array (list of files modified)
├── description: string (improvement details)
├── appliedAt: timestamp (when applied)
└── createdAt: timestamp
```

### `daily_metrics` - Daily performance metrics
```
Document ID: YYYY-MM-DD (date string)
Fields:
├── metricDate: string (YYYY-MM-DD)
├── binaryAccuracy: number (0-1)
├── multiClassQuality: number (0-1)
├── multiClassRelevance: number (0-1)
├── multiClassCoherence: number (0-1)
├── multiClassCompleteness: number (0-1)
├── totalInteractions: number (count)
├── avgConfidence: number (0-1)
├── avgSatisfaction: number (0-1)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### `knowledge_graph` - Knowledge base entries
```
Document ID: Auto-generated
Fields:
├── label: string (concept name)
├── nodeType: string (SECURITY_CONCEPT, TOOL, etc)
├── externalId: string (reference ID, optional)
├── properties: object (key-value pairs)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### `h1_learnings` - HackerOne security findings
```
Document ID: Auto-generated
Fields:
├── vulnerabilityType: string (XSS, SSRF, etc)
├── technique: string (specific technique used)
├── toolUsed: string (tool name)
├── successRate: number (0-1)
├── severity: string (critical, high, medium, low)
├── caseStudy: string (detailed description)
├── learnedAt: timestamp
└── createdAt: timestamp
```

---

## ✅ Step 4: Verify Connection

### Test Locally

```bash
# Build
npm run build

# Start server
npm start

# In another terminal, test Firestore connection
curl http://localhost:3000/api/health/firestore

# Expected response:
{
  "success": true,
  "status": "connected",
  "message": "Connected to Firestore (database: ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00)",
  "databaseId": "ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00",
  "timestamp": 1713902400000
}
```

### Test in Production

```bash
# After deploying to Railway
curl https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore

# Should return same response as above
```

---

## 🧪 Step 5: Test Interaction Recording

Once connected, test recording an interaction:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "sessionId": "test-session-001"
  }'

# This will:
# 1. Generate Jarvis response
# 2. Record in Firestore automatically
# 3. Return response with metadata
```

### Verify in Firebase Console

1. Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/

2. Click "interactions" collection

3. Should see new documents appearing:
   - Document ID (auto-generated)
   - sessionId: "test-session-001"
   - userQuery: "Test message"
   - jarvisResponse: "..."
   - createdAt: (current timestamp)

---

## 🚀 Step 6: Enable Self-Improvement (Optional)

Once Firestore is connected, /api/self-improve will:

1. Fetch recent interactions from Firestore
2. Analyze patterns and generate improvements
3. Record improvements in Firestore
4. Auto-commit to GitHub
5. Save daily metrics to Firestore

### Trigger Manually

```bash
curl -X POST https://jarvis-comienza-jarvis-ia.up.railway.app/api/self-improve \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'

# Expected response:
{
  "success": true,
  "improvements": [
    {
      "type": "ResponseQuality",
      "targetDimension": "quality",
      "priority": 4,
      "expectedImpact": 0.85
    }
  ],
  "diagnosis": {
    "binaryAccuracy": 0.82,
    "multiClassQuality": 0.78
  },
  "commitHash": "auto-xxxxx"
}
```

### Verify in Firestore

Check:
- ✅ `interactions` collection has new records
- ✅ `improvements` collection has new improvement records
- ✅ `daily_metrics` has new daily metric entry
- ✅ GitHub shows new auto-commit

---

## 📊 Database Rules

Your Firestore has these default rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated reads/writes
    match /{document=**} {
      allow read, write: if request.auth != null;
      allow read: if request.auth == null && resource.data.public == true;
    }
  }
}
```

**Note**: These rules allow authenticated access. For Railway deployment, the service account key provides authentication.

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/health/firestore | GET | Test connection | ✅ Ready |
| /api/chat | POST | Record interaction | ✅ Records to Firestore |
| /api/self-improve | POST | Trigger improvements | ✅ Uses Firestore |
| /api/status | GET | System status | ✅ Includes Firestore info |

---

## 🐛 Troubleshooting

### "Permission denied" error

```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions.
```

**Solution**:
1. Service account key might be missing
2. Check if GOOGLE_APPLICATION_CREDENTIALS is set correctly
3. Verify service account has Firestore write permissions

```bash
# Check env var is set
echo $GOOGLE_APPLICATION_CREDENTIALS

# Or check Railway environment variables
# Should have either:
# - GOOGLE_APPLICATION_CREDENTIALS (path to file)
# - GOOGLE_APPLICATION_CREDENTIALS_JSON (JSON string)
```

### "Collection not found" error

```
Error: Collection 'interactions' not found
```

**Solution**: Collections are auto-created on first write. Make sure:
1. Firestore connection is successful (`/api/health/firestore` returns 200)
2. Try POST to `/api/chat` which automatically writes to Firestore
3. Collections appear in Firebase Console within 30 seconds

### Railway redeploy issues

After setting environment variables:

```bash
# Option 1: Push a commit (triggers auto-deploy)
git add .
git commit -m "Firestore setup complete"
git push

# Option 2: Manually redeploy in Railway dashboard
# Go to: https://railway.app/project/jarvis-comienza
# Click "Deploy" button

# Option 3: Check Railway logs
railway logs -f
```

---

## 📈 Monitoring

### Check Data in Firebase Console

1. Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/databases/ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00/data/

2. Explore collections:
   - **interactions**: Growing as users chat with Jarvis
   - **daily_metrics**: One entry per day
   - **improvements**: New entry each time `/api/self-improve` runs
   - **knowledge_graph**: Growing as Jarvis learns

### Check Storage Usage

1. Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/firestore/usage

2. Monitor:
   - Read operations (per query)
   - Write operations (per record)
   - Storage usage (GB)
   - Network bandwidth

### Cost Estimation

Firestore pricing (as of 2026):
- **Reads**: $0.06 per 100k reads
- **Writes**: $0.18 per 100k writes
- **Storage**: $0.18 per GB per month

**Example for Jarvis**:
- 100 chats/day = 100 writes/day = $55/year (very cheap!)
- Daily metrics = 1 write/day = minimal cost

---

## ✨ Summary

**Setup Time**: 15 minutes

**Steps**:
1. Download service account key from Firebase Console
2. Save to `.config/serviceAccountKey.json` (local) or set in Railway env
3. Test connection via `/api/health/firestore`
4. Start using Jarvis - interactions auto-record to Firestore
5. Optionally: Trigger `/api/self-improve` for autonomous improvements

**Next**: After Firestore is working, you can set up GitHub Actions for daily auto-improvements at 6 AM UTC.

🚀 **Ready to proceed?** Download your service account key and follow Step 1-2 above.
