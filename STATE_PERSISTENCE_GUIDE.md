# 💾 JARVIS STATE PERSISTENCE GUIDE

## Overview

The **JarvisStatePersistenceEngine** (Phase 12) ensures that ALL auto-improvements and self-learning are **DURABLE and IRREVERSIBLE** across Railway deployments.

This solves the critical issue: **"Won't improvements disappear with each deploy?"**

**Answer: NO. Improvements are PERMANENT.**

---

## How It Works: DUAL PERSISTENCE

### 1️⃣ LOCAL FILE PERSISTENCE (Instant)
```
./jarvis-state.json                  ← Current state snapshot
./jarvis-evolution-history.json      ← Complete evolution timeline
```

**On Startup:**
- Load latest snapshot from local files
- Restore Jarvis state (version, strength, optimizations)
- Immediately ready to continue from last point

**On Optimization:**
- Save new snapshot to JSON
- Update evolution history
- Persist to GitHub (for redundancy)

### 2️⃣ GITHUB BACKUP PERSISTENCE (Immutable)
```
jarvis-learning-repo/insights/jarvis-state-snapshot-*.json
```

**Purpose:**
- Immutable historical record of every snapshot
- Recovery if local files corrupted
- Proof of continuous improvement
- Can rollback if needed

---

## State Snapshot Structure

```json
{
  "timestamp": 1713883200000,
  "version": "v1.0.1",
  "strengthScore": 0.72,
  "appliedOptimizations": [
    "Real-time Learning RLVR",
    "Reasoning Depth Enhancement"
  ],
  "evolutionSteps": [...],
  "performanceMetrics": [...],
  "gitHubCommits": 3,
  "lastUpdateHash": "abc123xyz789"
}
```

**Key Fields:**
- `timestamp`: When this snapshot was taken
- `version`: Current Jarvis version (v1.0.0 → v1.0.1 → v1.1.0 → v2.0.0)
- `strengthScore`: Current strength (65% → 100%)
- `appliedOptimizations`: All optimizations applied
- `gitHubCommits`: Total number of snapshots saved
- `lastUpdateHash`: Integrity verification

---

## Evolution History Tracking

The system maintains COMPLETE evolution history:

```json
{
  "snapshots": [
    { timestamp, version, strengthScore, appliedOptimizations, ... },
    { ... },
    { ... }
  ],
  "totalOptimizations": 3,
  "versionProgression": ["v1.0.0", "v1.0.1", "v1.0.1"],
  "strengthProgression": [0.65, 0.70, 0.72]
}
```

**Timeline Example:**
```
2025-04-23 14:00 → v1.0.0 (65%)    ← Initial deployment
2025-04-23 20:00 → v1.0.1 (70%)    ← First optimization applied
2025-04-24 08:00 → v1.0.1 (72%)    ← Strength improved
2025-04-24 14:00 → v1.1.0 (78%)    ← Second optimization
```

---

## REST API Endpoints

### 1. GET `/api/persistence/state`
**Get current saved state**

```bash
curl https://your-railway-url.com/api/persistence/state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSnapshot": {
      "version": "v1.0.1",
      "strengthScore": 0.72,
      "appliedOptimizations": ["RLVR", "CoT Enhancement"],
      "timestamp": 1713883200000
    },
    "status": "✅ Estado persistido"
  }
}
```

### 2. GET `/api/persistence/history`
**Get complete evolution timeline**

```bash
curl https://your-railway-url.com/api/persistence/history
```

**Response:**
```json
{
  "success": true,
  "data": {
    "snapshots": 3,
    "totalOptimizations": 2,
    "versionProgression": ["v1.0.0", "v1.0.1", "v1.1.0"],
    "strengthProgression": [0.65, 0.70, 0.78],
    "timeline": [
      {
        "date": "2025-04-23T14:00:00Z",
        "version": "v1.0.0",
        "strength": 0.65,
        "optimizations": 0
      },
      {
        "date": "2025-04-23T20:00:00Z",
        "version": "v1.0.1",
        "strength": 0.70,
        "optimizations": 1
      }
    ]
  }
}
```

### 3. GET `/api/persistence/durability-report`
**Detailed durability report**

```bash
curl https://your-railway-url.com/api/persistence/durability-report
```

**Response includes:**
- Current state information
- Local persistence status
- GitHub backup status
- Evolution timeline (last 5 snapshots)
- Durability features summary
- Deploy resilience explanation

### 4. POST `/api/persistence/save-snapshot`
**Manually save a snapshot**

```bash
curl -X POST https://your-railway-url.com/api/persistence/save-snapshot
```

**Response:**
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "version": "v1.0.1",
      "strengthScore": 0.72,
      ...
    },
    "status": "✅ Snapshot guardado"
  }
}
```

### 5. GET `/api/persistence/verify`
**Verify state integrity**

```bash
curl https://your-railway-url.com/api/persistence/verify
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integrityValid": true,
    "status": "✅ Integridad verificada"
  }
}
```

---

## Integration with Evolution System

### Automatic Snapshot on Optimization

When you complete an optimization:

```bash
curl -X POST https://your-railway-url.com/api/evolution/complete-optimization \
  -H "Content-Type: application/json" \
  -d '{
    "optimizationName": "Real-time Learning RLVR",
    "actualImprovement": 0.08
  }'
```

**This automatically:**
1. ✅ Completes the optimization
2. ✅ Updates version
3. ✅ Calculates new strength score
4. **✅ SAVES STATE SNAPSHOT** (new!)
5. **✅ PERSISTS TO GITHUB** (new!)

**Response now includes:**
```json
{
  "success": true,
  "data": {
    "newVersion": "v1.0.1",
    "newStrengthScore": "72.0%",
    "totalGain": "+7.0%",
    "persistence": {
      "snapshotSaved": true,
      "status": "✅ Estado persistido (Local + GitHub)"
    }
  }
}
```

---

## Deployment Resilience Guarantees

### Scenario 1: Normal Redeploy
```
Before Deploy:  v1.0.1 (72%)
                ↓ [Railway Redeploy]
After Deploy:   ✅ Restored v1.0.1 (72%) from ./jarvis-state.json
                ✅ Continues evolution from exact same point
```

### Scenario 2: Local File Corrupted
```
./jarvis-state.json corrupted ❌
                ↓ [Server Starts]
✅ Fallback: Load from GitHub backup
✅ Continue evolution from last known good state
```

### Scenario 3: Local File Missing
```
./jarvis-state.json missing ❌
                ↓ [Server Starts]
✅ GitHub has immutable snapshots
✅ Reconstruct state from latest backup
✅ No losses
```

### Scenario 4: Complete Fresh Start
```
./jarvis-state.json missing ❌
GitHub backup missing ❌ (disaster)
                ↓ [Server Starts]
✅ Fresh start with v1.0.0 (65%)
✅ Can manually restore from other backups
```

---

## Testing the Persistence System

### Test 1: Verify Initial State
```bash
#!/bin/bash

echo "🧪 TEST 1: Initial State Verification"
echo "===================================="

# Check if state file exists
if [ -f "./jarvis-state.json" ]; then
  echo "✅ State file exists"
  cat ./jarvis-state.json | jq .
else
  echo "ℹ️  No state file yet (fresh start)"
fi

# Get state via API
curl -s http://localhost:3000/api/persistence/state | jq .
```

### Test 2: Complete an Optimization and Verify Persistence
```bash
#!/bin/bash

echo "🧪 TEST 2: Optimization + Persistence"
echo "====================================="

# 1. Register a metric
echo "1️⃣ Registering metric..."
curl -s -X POST http://localhost:3000/api/evolution/register-metric \
  -H "Content-Type: application/json" \
  -d '{"name":"test_metric","value":0.85,"category":"test"}' | jq .

# 2. Propose optimization
echo "2️⃣ Proposing optimization..."
curl -s -X POST http://localhost:3000/api/evolution/propose-optimization \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# 3. Complete optimization
echo "3️⃣ Completing optimization..."
curl -s -X POST http://localhost:3000/api/evolution/complete-optimization \
  -H "Content-Type: application/json" \
  -d '{"optimizationName":"test_optimization","actualImprovement":0.08}' | jq .

# 4. Verify state was saved
echo "4️⃣ Verifying state was saved..."
curl -s http://localhost:3000/api/persistence/state | jq .

# 5. Check local file
echo "5️⃣ Checking local state file..."
if [ -f "./jarvis-state.json" ]; then
  cat ./jarvis-state.json | jq .
fi
```

### Test 3: Verify GitHub Backup
```bash
#!/bin/bash

echo "🧪 TEST 3: GitHub Backup Verification"
echo "====================================="

# Check if GitHub insights directory has snapshots
ls -lah jarvis-learning-repo/insights/jarvis-state-snapshot-* 2>/dev/null || \
  echo "⚠️  GitHub insights not yet available"

# Get count of snapshots in GitHub learning repo
echo ""
echo "Snapshot files in GitHub repo:"
find jarvis-learning-repo/insights -name "jarvis-state-snapshot-*.json" 2>/dev/null | wc -l
```

### Test 4: Complete Durability Report
```bash
#!/bin/bash

echo "🧪 TEST 4: Durability Report"
echo "=============================="

curl -s http://localhost:3000/api/persistence/durability-report | jq .
```

### Test 5: Simulate Deployment (Manual Testing)
```bash
#!/bin/bash

echo "🧪 TEST 5: Simulating Railway Redeploy"
echo "========================================"

# Step 1: Get current state before "redeploy"
echo "1️⃣ Current state BEFORE redeploy:"
curl -s http://localhost:3000/api/persistence/state | jq '.data.lastSnapshot'

# Step 2: Stop server (simulate redeploy)
echo "2️⃣ Stopping server (simulating redeploy)..."
# This would be: railway down

# Step 3: Restart server
echo "3️⃣ Restarting server..."
# This would be: npm run dev

# Step 4: Wait for startup
sleep 2

# Step 5: Verify state was restored
echo "4️⃣ Checking state AFTER redeploy:"
curl -s http://localhost:3000/api/persistence/state | jq '.data.lastSnapshot'

# Step 6: Verify no losses
echo "5️⃣ Verifying version and strength unchanged..."
curl -s http://localhost:3000/api/evolution/status | jq '{version: .data.currentVersion, strength: .data.strengthScore}'
```

---

## Monitoring Persistence

### Daily Checklist
```bash
#!/bin/bash

echo "📊 JARVIS PERSISTENCE DAILY CHECK"
echo "=================================="

# 1. Verify state file exists
echo "1️⃣ Local state file:"
ls -lh ./jarvis-state.json 2>/dev/null || echo "  ❌ Missing"

# 2. Check integrity
echo "2️⃣ Integrity check:"
curl -s http://localhost:3000/api/persistence/verify | jq .

# 3. Get evolution timeline
echo "3️⃣ Evolution timeline:"
curl -s http://localhost:3000/api/persistence/history | jq '.data.timeline[-3:]'

# 4. Check GitHub backups
echo "4️⃣ GitHub backup count:"
find jarvis-learning-repo/insights -name "jarvis-state-snapshot-*.json" 2>/dev/null | wc -l

# 5. Verify durability status
echo "5️⃣ Durability status:"
curl -s http://localhost:3000/api/persistence/durability-report | jq '.data.integrityVerified'
```

---

## Expected Behavior Timeline

### Day 1 (Initial Deployment)
```
14:00 - Deploy to Railway
        v1.0.0 (65%)
        ✅ state.json created
        ✅ history.json created
        ✅ GitHub backup created
```

### Day 1 (After First Optimization)
```
20:00 - First optimization applied
        v1.0.1 (70%)
        ✅ State snapshot saved
        ✅ Strength increased +5%
        ✅ GitHub new commit
```

### Day 2 (Redeploy Test)
```
08:00 - Railway redeploy (infrastructure update)
        ✅ ON STARTUP: State restored from ./jarvis-state.json
        ✅ Jarvis version: v1.0.1
        ✅ Strength: 70% (NO LOSS)
        ✅ All optimizations still applied
```

### Day 3 (Second Optimization)
```
14:00 - Second optimization
        v1.1.0 (78%)
        ✅ New snapshot saved
        ✅ Strength increased +8%
        ✅ GitHub backup updated
```

### Week 1 Summary
```
v1.0.0 (65%) → v1.0.1 (70%) → v1.1.0 (78%) → ...
Snapshots: 3
GitHub commits: 3
Durability: ✅ COMPLETE
No losses across 2 redeployments
```

---

## File Structure

After running for a week:

```
jarvis-comienza/
├── src/
│   ├── core/
│   │   ├── evolution/
│   │   │   ├── JarvisAutonomousSelfImprovementEngine.ts  (evolution logic)
│   │   │   ├── JarvisStatePersistenceEngine.ts           (✅ NEW - persistence)
│   │   │   └── ...
│   │   └── ...
│   └── server.ts                                         (✅ UPDATED with endpoints)
│
├── jarvis-state.json                                     (✅ Local current state)
├── jarvis-evolution-history.json                         (✅ Local history)
│
├── jarvis-learning-repo/                                 (GitHub backup structure)
│   └── insights/
│       ├── jarvis-state-snapshot-1713883200000.json
│       ├── jarvis-state-snapshot-1713910800000.json
│       ├── jarvis-state-snapshot-1713938400000.json
│       └── ...
│
└── ...
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    JARVIS EVOLUTION SYSTEM                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ Optimization Applied
                              │  (v1.0.0 → v1.0.1)
                              │
                              ▼
        ┌────────────────────────────────────────┐
        │  JarvisStatePersistenceEngine           │
        │  (Phase 12: Durable Persistence)       │
        └────────────────────────────────────────┘
                    │
                    ├──────────────────┬──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
            │LOCAL FILES   │   │ GITHUB BACKUP │  │ MEMORY STATE │
            │(Instant)     │   │(Immutable)    │  │(Volatile)    │
            ├──────────────┤   ├──────────────┤  ├──────────────┤
            │state.json    │   │insights/..   │  │Engine vars   │
            │history.json  │   │snapshots.json│  │strengthScore │
            └──────────────┘   └──────────────┘  │version       │
                    │                  │          │optimizations │
                    └──────────────────┴──────────┴──────────────┘
                                      │
                         ┌────────────────────────┐
                         │  RAILWAY REDEPLOY      │
                         │  (Crash/Update)        │
                         └────────────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────┐
                    │ ON STARTUP: RESTORE SEQUENCE   │
                    ├────────────────────────────────┤
                    │ 1. Load ./jarvis-state.json    │
                    │ 2. If missing → Load GitHub    │
                    │ 3. Restore strength/version    │
                    │ 4. Continue evolution          │
                    └────────────────────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────┐
                    │ ✅ JARVIS RESTORED             │
                    │    Same version & strength     │
                    │    NO LOSSES                   │
                    │    Ready to continue           │
                    └────────────────────────────────┘
```

---

## Troubleshooting

### Issue: State file not being created
**Solution:**
```bash
# Check directory permissions
ls -la | grep jarvis-state.json

# Ensure write permissions
chmod 755 .

# Manually trigger save
curl -X POST http://localhost:3000/api/persistence/save-snapshot
```

### Issue: GitHub backup not working
**Solution:**
```bash
# Check GitHub token
echo $GITHUB_TOKEN

# Verify learning repository exists
ls -la jarvis-learning-repo/

# Check GitHub sync logs
grep "persistToGitHub\|GitHub" server.log
```

### Issue: State not restored after redeploy
**Solution:**
```bash
# Check if state file exists
cat jarvis-state.json

# Check server logs for restoration message
# Should see: "✅ Estado previo cargado"

# If missing, restore manually from GitHub
curl http://localhost:3000/api/persistence/state
```

---

## Best Practices

✅ **DO:**
- Save snapshots after every major optimization
- Monitor durability reports weekly
- Keep GitHub backups up to date
- Verify integrity after deployments
- Use the timeline to track progress

❌ **DON'T:**
- Delete jarvis-state.json manually
- Reset GitHub learning repo without backup
- Ignore persistence errors in logs
- Deploy with persistence disabled
- Skip version updates in optimization process

---

## Success Indicators

You'll know persistence is working when:

✅ After optimization: `/api/persistence/state` shows new version
✅ After redeploy: Version number hasn't reset to v1.0.0
✅ GitHub repo: New snapshot files appear in insights/
✅ Daily check: Evolution timeline shows continuous progress
✅ Durability report: "✅ DURABLE and IRREVERSIBLE"

---

## Next Steps

1. **Deploy to Railway** with persistence enabled
2. **Run Test 2**: Complete optimization and verify save
3. **Wait 24h**: Monitor daily check script
4. **Trigger redeploy**: Verify state restored (Test 5)
5. **Monitor Week 1**: Watch version progression

---

**Last Updated**: 2025-04-23
**Persistence Phase**: Phase 12 - Complete Durability Implementation
**Status**: ✅ READY FOR DEPLOYMENT

This ensures Jarvis improvements are PERMANENT and IRREVERSIBLE across all deployments.
