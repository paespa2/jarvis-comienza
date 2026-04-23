# 🔐 Firebase Admin Setup Guide - Jarvis IA

Complete guide to set up Firebase Admin SDK for server-side operations.

## Overview

This Jarvis IA project uses Firebase for:
- **Realtime Database (RTDB)**: Knowledge graph, learnings, metrics
- **Firestore**: User data, sessions, analytics
- **Authentication**: User management and authorization
- **Storage**: Model checkpoints and datasets

## Step 1: Get Service Account Key

### 1.1 Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select project: **"asistente-jarvis-1741893602789"**

### 1.2 Download Service Account Key
1. Go to **Project Settings** (⚙️ icon)
2. Click **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. A `serviceAccountKey.json` file will download

### 1.3 Place Key Securely

**Recommended (Production):**
```bash
# Create secure config directory
mkdir -p .config
# Copy the downloaded file
cp ~/Downloads/serviceAccountKey.json .config/
chmod 600 .config/serviceAccountKey.json
```

**Alternative (Development - less secure):**
```bash
# Copy to project root (ONLY for local development)
cp ~/Downloads/serviceAccountKey.json ./
```

**Best Practice (CI/CD):**
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

## Step 2: Verify Configuration

The `firebaseAdminService.ts` will automatically find the service account in this order:
1. ✅ `GOOGLE_APPLICATION_CREDENTIALS` environment variable (best)
2. ✅ `.config/serviceAccountKey.json` (secure)
3. ⚠️ `./serviceAccountKey.json` (project root)

## Step 3: Update .gitignore

Make sure service account keys are never committed:

```bash
# Add to .gitignore
echo "serviceAccountKey.json" >> .gitignore
echo ".config/serviceAccountKey.json" >> .gitignore
echo ".config/" >> .gitignore  # Exclude entire config directory
```

## Step 4: Initialize in Server

The Firebase Admin SDK is automatically initialized when the server starts. Add this to your server startup:

```typescript
import { initializeFirebaseAdmin } from './services/firebaseAdminService';

// Initialize Firebase Admin
initializeFirebaseAdmin();
```

## Step 5: Use Admin Services

### Read from Realtime Database
```typescript
import { readFromRTDB, writeToRTDB } from './services/firebaseAdminService';

// Write
await writeToRTDB('jarvis/knowledge_graph/xss', {
  severity: 'high',
  description: 'Cross-site scripting vulnerability',
  timestamp: Date.now()
});

// Read
const data = await readFromRTDB('jarvis/knowledge_graph/xss');
```

### Write to Firestore
```typescript
import { writeToFirestore, readFromFirestore } from './services/firebaseAdminService';

// Write user session
await writeToFirestore('sessions', sessionId, {
  userId: user.uid,
  startTime: Date.now(),
  interactions: []
});

// Read
const session = await readFromFirestore('sessions', sessionId);
```

### Manage Users
```typescript
import { createUser, setUserClaims, getUser } from './services/firebaseAdminService';

// Create user
const uid = await createUser('user@example.com', 'password');

// Set admin claims
await setUserClaims(uid, { admin: true });

// Get user
const user = await getUser(uid);
```

## Firebase Structure in Jarvis

### Realtime Database (RTDB)
```
asistente-jarvis-1741893602789-default-rtdb.firebaseio.com
├── jarvis/
│   ├── knowledge_graph/        # Learning data
│   ├── h1_learnings/           # HackerOne insights
│   ├── daily_metrics/          # Performance metrics
│   ├── research_sessions/      # Auto-researcher data
│   ├── learning_events/        # Interaction history
│   └── auto_improvement/       # Self-learning progress
```

### Firestore Database
```
asistente-jarvis-1741893602789
├── users/                      # User profiles
├── sessions/                   # Chat sessions
├── interactions/               # Conversation records
├── learnings/                  # Knowledge base
└── metrics/                    # Analytics
```

## Environment Variables (Optional)

Add to `.env` or `.env.local`:
```bash
# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=.config/serviceAccountKey.json
VITE_FIREBASE_DB_URL=https://asistente-jarvis-1741893602789-default-rtdb.firebaseio.com

# Security
FIREBASE_API_KEY=AIzaSyDE3HOrmYMG_nEeb88LDRVYUvLMqI0OVRg
FIREBASE_PROJECT_ID=asistente-jarvis-1741893602789
```

## Troubleshooting

### Service Account Not Found
```
⚠️ [FirebaseAdmin] Service account key not found.
```
**Solution**: Place `serviceAccountKey.json` in `.config/` directory

### Database Connection Error
```
❌ [RTDB] Failed to connect
```
**Solution**: Check `databaseURL` in `firebase-applet-config.json`

### Authentication Error
```
❌ [Auth] Failed to verify token
```
**Solution**: Ensure service account has proper permissions in Firebase Console

## Security Best Practices

✅ **DO:**
- Store service account in `.config/` directory
- Use environment variables in production
- Rotate service account keys regularly
- Add `.config/` to `.gitignore`
- Use separate service accounts for different environments

❌ **DON'T:**
- Commit `serviceAccountKey.json` to git
- Share service account keys
- Use browser API keys for server operations
- Store secrets in code

## Next Steps

1. ✅ Download `serviceAccountKey.json`
2. ✅ Place in `.config/serviceAccountKey.json`
3. ✅ Verify `GOOGLE_APPLICATION_CREDENTIALS` is set
4. ✅ Test with: `npm run dev` or `npm run build`

## References

- Firebase Console: https://console.firebase.google.com/
- Jarvis IA Project: asistente-jarvis-1741893602789
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Service Accounts: https://firebase.google.com/docs/auth/admin/create-manage-users

---

**Created**: 2026-04-23  
**Updated**: During Phase 1 & 2 Integration  
**Status**: Ready for Production ✅
