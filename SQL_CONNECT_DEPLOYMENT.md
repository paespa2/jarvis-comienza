# 🔥 Firebase SQL Connect Deployment Guide

**Integration: Jarvis ↔️ Firebase SQL Connect (GraphQL)**

---

## 📋 Overview

Jarvis now integrates with **Firebase SQL Connect** for managed PostgreSQL with automatic GraphQL API generation.

**Your Setup:**
- ✅ Service: `asistente-jarvis-1741893602789-service`
- ✅ Location: `us-east4`
- ✅ Database: `asistente-jarvis-1741893602789-database`
- ✅ Console: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/dataconnect/locations/us-east4/services/asistente-jarvis-1741893602789-service/data

---

## 🚀 Setup Steps

### 1. Enable SQL Connect in Firebase Console

Your service is already created. Verify at:
```
Firebase Console → Data Connect → asistente-jarvis-1741893602789-service
```

### 2. Deploy Schema & Connectors

```bash
# Install Firebase CLI (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy dataconnect.yaml
firebase deploy --only dataconnect

# This will:
# ✅ Create PostgreSQL tables
# ✅ Generate GraphQL types
# ✅ Create Connectors
# ✅ Set up Authorization rules
```

### 3. Configure Environment Variables

Add to Railway or `.env`:

```bash
# Firebase SQL Connect
FIREBASE_PROJECT_ID=asistente-jarvis-1741893602789
FIREBASE_SERVICE_ID=asistente-jarvis-1741893602789-service
FIREBASE_LOCATION=us-east4
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_SQL_CONNECT_ENDPOINT=https://us-east4-asistente-jarvis-1741893602789.firebaseapp.com/graphql/asistente-jarvis-1741893602789-service

# Or use Auto-discovery
# Endpoint will be constructed from PROJECT_ID if not provided
```

### 4. Get Firebase API Key

In Firebase Console:

```
Project Settings → Service Accounts → Generate Private Key
OR
Project Settings → API Keys → Create API Key
```

Then set `FIREBASE_API_KEY` environment variable.

---

## 🏗️ Architecture Now

```
┌─────────────────────────────────────┐
│      Jarvis AI (Node.js)            │
├─────────────────────────────────────┤
│                                     │
│  Phase 1: Coherence                 │
│  Phase 2: Reasoning                 │
│  Phase 3: Autonomy                  │
│                                     │
├─────────────────────────────────────┤
│    SQL Connect Client (GraphQL)      │
│                                     │
│  sqlConnectService.ts               │
│  └─ Axios GraphQL Client            │
│                                     │
├─────────────────────────────────────┤
│    Firebase SQL Connect (GraphQL)    │
│                                     │
│  ✅ Connectors (auto-generated)     │
│  ├─ CreateNode                      │
│  ├─ RecordInteraction               │
│  ├─ SaveDailyMetrics                │
│  └─ GetImprovementHistory           │
│                                     │
├─────────────────────────────────────┤
│    Cloud SQL for PostgreSQL          │
│                                     │
│  ✅ Knowledge Graph Tables          │
│  ├─ nodes                           │
│  ├─ edges                           │
│  ├─ interactions                    │
│  ├─ improvements                    │
│  └─ daily_metrics                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 Schema Summary

Your `dataconnect.yaml` defines:

### Core Tables
- **NodeType** - Knowledge concepts (security, tools, etc)
- **Node** - Knowledge base entries
- **Edge** - Relationships between nodes
- **RelationshipType** - Types of relationships

### Tracking Tables
- **Interaction** - User queries & responses
- **Improvement** - Auto-applied improvements
- **DailyMetric** - Coherence/accuracy trends
- **H1Learning** - Security learnings

### Connectors (GraphQL Operations)
- `CreateNode` - Add knowledge
- `GetNodesByType` - Search knowledge
- `RecordInteraction` - Track conversations
- `GetRecentInteractions` - Analyze patterns
- `SaveDailyMetrics` - Record improvements
- `GetMetricsTrend` - Track progress
- `RecordImprovement` - Audit changes
- `GetImprovementHistory` - Review improvements

---

## 💻 Usage in Code

### Record an Interaction

```typescript
import { sqlConnectService } from './services/sqlConnectService';

// Automatically converts to GraphQL + sends to Firebase SQL Connect
await sqlConnectService.recordInteraction({
  sessionId: 'session-123',
  userQuery: 'What is XSS?',
  jarvisResponse: 'XSS is a security vulnerability...',
  intent: 'SECURITY_CONCEPTUAL',
  emotion: 'CURIOUS',
  confidence: 0.92,
  userSatisfaction: 0.85,
  systemsUsed: ['ResponseGenerator', 'EmotionalIntelligence']
});
```

### Get Recent Interactions (For Self-Improvement)

```typescript
// Used by /api/self-improve endpoint
const interactions = await sqlConnectService.getRecentInteractions(1);
// GraphQL query fetches last 24 hours from Firebase SQL Connect
```

### Save Daily Metrics

```typescript
await sqlConnectService.saveDailyMetrics({
  metricDate: new Date(),
  binaryAccuracy: 0.78,
  multiClassQuality: 0.82,
  multiClassRelevance: 0.85,
  multiClassCoherence: 0.75,
  multiClassCompleteness: 0.72,
  totalInteractions: 45
});
```

---

## 🔄 How It Works

### GraphQL Flow

```
1. sqlConnectService.recordInteraction({...})
2. Constructs GraphQL mutation:
   mutation RecordInteraction($sessionId: String!, ...) {
     interactionInsert(input: {...}) {
       id
       createdAt
     }
   }
3. Sends to Firebase SQL Connect GraphQL endpoint
4. SQL Connect translates to PostgreSQL
5. Data stored in Cloud SQL
6. Response returned to Jarvis
```

### Self-Improvement Loop (Now with SQL Connect)

```
1. GitHub Actions triggers (6 AM UTC)
2. POST /api/self-improve
3. sqlConnectService.getRecentInteractions()
   └─ GraphQL query to Firebase SQL Connect
   └─ Fetches from Cloud SQL PostgreSQL
4. Run ML diagnosis
5. Generate improvement strategies
6. sqlConnectService.recordImprovement()
   └─ GraphQL mutation to Firebase SQL Connect
7. sqlConnectService.saveDailyMetrics()
   └─ Records progress metrics
8. Data stays in Cloud SQL (not lost on restart)
```

---

## ✅ Verification

### Test Connection

```bash
curl http://localhost:3000/api/health/sql-connect
```

Response:
```json
{
  "ok": true,
  "message": "Connected to Firebase SQL Connect (us-east4)",
  "endpoint": "https://us-east4-asistente-jarvis-1741893602789.firebaseapp.com/graphql/..."
}
```

### Verify in Firebase Console

1. Go to: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/dataconnect
2. Select service: `asistente-jarvis-1741893602789-service`
3. Click "Data" tab
4. Should see tables with data from Jarvis:
   - ✅ interactions (from chat)
   - ✅ improvements (from auto-commits)
   - ✅ daily_metrics (from self-improve)
   - ✅ nodes (knowledge graph)

---

## 🔐 Security

### Authorization Rules (in dataconnect.yaml)

```yaml
authorizationRules:
  # Public read for knowledge (learning is public)
  - PublicReadNodes: Anyone can read knowledge graph
  
  # Authenticated write for interactions
  - AuthenticatedInteractions: Only logged-in users can record
  
  # Admin-only improvements
  - AdminImprovements: Only admins can record improvements
```

### API Key Security

- Store in Railway Secrets (not in code)
- Use restricted API keys with SQL Connect scope only
- Rotate keys regularly

---

## 📈 Benefits Over Direct PostgreSQL

| Feature | Direct PostgreSQL | SQL Connect |
|---------|---|---|
| Schema | Manual SQL | `dataconnect.yaml` |
| API | Node pg library | GraphQL (auto) |
| Authorization | App-level | Built-in RBAC |
| Migrations | Manual | Automatic |
| TypeScript SDKs | Manual | Generated |
| Monitoring | Cloud Console | Firebase Console |
| Backups | Manual setup | Automatic |
| Scaling | Manage yourself | Google managed |

---

## 🚨 Troubleshooting

### "GraphQL endpoint not found"

```bash
# Verify endpoint format
echo $FIREBASE_SQL_CONNECT_ENDPOINT
# Should be: https://us-east4-PROJECT_ID.firebaseapp.com/graphql/SERVICE_ID
```

### "API Key invalid"

```bash
# Re-generate in Firebase Console
# Settings → Service Accounts → Generate New Private Key
# OR
# Settings → API Keys → Create new key
```

### Data not appearing in Firebase Console

```bash
# Wait a few minutes for Cloud SQL to sync
# Check sqlConnectService logs for GraphQL errors
# Verify authorization rules are correct
```

### High latency on GraphQL queries

```
Solutions:
1. Use connection pooling (Axios retries with backoff)
2. Add indexes to frequently queried fields
3. Cache recent results in memory
4. Use batch queries for multiple operations
```

---

## 📚 Next: Firebase Data Connect SDKs

SQL Connect can auto-generate SDKs for:

```bash
# Generate Web SDK
firebase dataconnect:sdk:generate web

# Generate iOS SDK
firebase dataconnect:sdk:generate ios

# Generate Android SDK
firebase dataconnect:sdk:generate android
```

These SDKs can then be used in:
- 🌐 Web UI for Jarvis
- 📱 Mobile apps
- 🤖 Other services

---

## 🎯 Deployment Checklist

- [ ] Deploy `dataconnect.yaml` via `firebase deploy --only dataconnect`
- [ ] Verify tables created in Firebase Console
- [ ] Set `FIREBASE_API_KEY` in Railway
- [ ] Test `/api/health/sql-connect` endpoint
- [ ] Run `/api/self-improve` to verify recording works
- [ ] Check metrics appear in Firebase Console
- [ ] Monitor GraphQL query latency
- [ ] Set up billing alerts in GCP Console

---

**Status**: ✅ Ready for Deployment  
**Endpoint**: `https://us-east4-asistente-jarvis-1741893602789.firebaseapp.com/graphql/asistente-jarvis-1741893602789-service`  
**Integration**: Node.js + Axios GraphQL Client  
**Cost**: Included in Firebase billing (pay per query)
