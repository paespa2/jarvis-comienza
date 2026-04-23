# 🚀 GITHUB ACTIONS SETUP - Daily Self-Improvement

**Status**: Workflow fixed (v4) - Now needs secrets configured

---

## 📋 What's Happening

Your GitHub Actions workflow (`daily-improve.yml`) is trying to run but **missing secrets**.

**Current Error**:
```
Error: This request has been automatically failed because it uses a 
deprecated version of `actions/upload-artifact: v3`
```

**Status**: ✅ FIXED (updated to v4)

---

## 🔐 Required Secrets for GitHub Actions

The workflow needs 2 secrets to work:

### Secret 1: `JARVIS_API_URL`
```
Value: https://jarvis-comienza-jarvis-ia.up.railway.app
Purpose: Where to call /api/self-improve
```

### Secret 2: `JARVIS_TOKEN`
```
Value: (You can use your GitHub token or create a new one)
Purpose: Authentication for the self-improve endpoint
```

---

## 🔧 How to Add Secrets to GitHub

### Step 1: Go to Repository Settings

```
https://github.com/paespa2/jarvis-comienza/settings/secrets/actions
```

### Step 2: Add Secret 1: JARVIS_API_URL

1. Click "New repository secret"
2. Name: `JARVIS_API_URL`
3. Value: `https://jarvis-comienza-jarvis-ia.up.railway.app`
4. Click "Add secret"

### Step 3: Add Secret 2: JARVIS_TOKEN

1. Click "New repository secret"
2. Name: `JARVIS_TOKEN`
3. Value: Use your GitHub personal access token (same `GITHUB_TOKEN` you created earlier)
   - Or: Create a new token from https://github.com/settings/tokens
   - Scopes: `repo` (full control)
4. Click "Add secret"

---

## 📊 Workflow Schedule

The workflow is configured to run:

```yaml
on:
  schedule:
    - cron: '0 6 * * *'  # Every day at 6 AM UTC
  workflow_dispatch:     # Can also trigger manually
```

**Runs automatically**: Every day at 6 AM UTC  
**Can trigger manually**: https://github.com/paespa2/jarvis-comienza/actions/workflows/daily-improve.yml

---

## 🧪 Test the Workflow

### Option 1: Wait Until Tomorrow (6 AM UTC)

The workflow will automatically run and:
1. Call `/api/self-improve` on Railway
2. Analyze last 24h interactions from Firestore
3. Generate improvements
4. Auto-commit to GitHub
5. Save results as artifact

### Option 2: Trigger Manually (Now)

1. Go to: https://github.com/paespa2/jarvis-comienza/actions
2. Find "Jarvis Daily Self-Improvement" workflow
3. Click "Run workflow"
4. Select branch: `claude/jarvis-autonomous-testing-FlgyW`
5. Click "Run workflow"
6. Wait 30 seconds
7. Check if it succeeds

---

## 📈 What the Workflow Does

```
1. Checkout code
   ↓
2. Trigger /api/self-improve on Railway
   ├─ With: days=1 (analyze last 24h)
   ├─ Get: commitHash, improvements, diagnosis
   └─ Extract: success, commit_hash, improvements_count
   ↓
3. Log results to workflow summary
   ├─ Date
   ├─ Status (success/failed)
   ├─ Commit hash
   └─ Number of changes
   ↓
4. Save results as artifact (30 days retention)
   ↓
5. If failed: Log failure reason
```

---

## ✅ Verification Checklist

- [ ] Go to GitHub Actions Settings: https://github.com/paespa2/jarvis-comienza/settings/secrets/actions
- [ ] Add secret: `JARVIS_API_URL` = `https://jarvis-comienza-jarvis-ia.up.railway.app`
- [ ] Add secret: `JARVIS_TOKEN` = (your GitHub token)
- [ ] Go to Workflows: https://github.com/paespa2/jarvis-comienza/actions
- [ ] Click "Jarvis Daily Self-Improvement"
- [ ] Click "Run workflow" button
- [ ] Select branch: `claude/jarvis-autonomous-testing-FlgyW`
- [ ] Click "Run workflow"
- [ ] Wait for completion (should take ~30 seconds)
- [ ] Check result shows ✅ Success
- [ ] Verify auto-commit appears in: https://github.com/paespa2/jarvis-comienza/commits/claude/jarvis-autonomous-testing-FlgyW

---

## 🔍 Troubleshooting

### Issue: Workflow Still Fails

**Check 1: Secrets are set?**
```
https://github.com/paespa2/jarvis-comienza/settings/secrets/actions
```

Should show:
- ✅ JARVIS_API_URL
- ✅ JARVIS_TOKEN

**Check 2: Values are correct?**
- JARVIS_API_URL must be: `https://jarvis-comienza-jarvis-ia.up.railway.app`
- JARVIS_TOKEN must be valid GitHub token

**Check 3: Workflow logs?**
1. Go to: https://github.com/paespa2/jarvis-comienza/actions
2. Click latest "Jarvis Daily Self-Improvement" run
3. Click "self-improve" job
4. Expand steps to see error message

### Issue: "API unreachable"

This means either:
- Railway instance is down (check https://jarvis-comienza-jarvis-ia.up.railway.app/health)
- JARVIS_API_URL is wrong
- Network timeout

**Fix**:
1. Verify Railway is running
2. Test manually: 
   ```bash
   curl https://jarvis-comienza-jarvis-ia.up.railway.app/api/self-improve \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"days": 1}'
   ```
3. Check response
4. If working, secrets are configured wrong

### Issue: "Missing secrets"

**Error**: `The job was not added because it contains a reference to a secret that does not exist`

**Fix**:
1. Go to: https://github.com/paespa2/jarvis-comienza/settings/secrets/actions
2. Add the missing secret
3. Trigger workflow again

---

## 📊 What You'll See After Success

### In GitHub Actions

```
Workflow: Jarvis Daily Self-Improvement ✅
├─ Job: self-improve ✅
│  ├─ Step: Checkout code ✅
│  ├─ Step: Get current time ✅
│  ├─ Step: Trigger Jarvis Self-Improvement ✅
│  │  └─ ✅ Self-improvement completed successfully
│  │  └─ 📝 Committed: auto-xxxxx
│  │  └─ 🎯 Changes applied: 3
│  ├─ Step: Log improvement metrics ✅
│  └─ Step: Save improvement results ✅
│
└─ Artifacts:
   └─ improvement-results-2026-04-24T06:00:00Z
      └─ improvement_result.json (saved for 30 days)
```

### In GitHub Commits

New commit appears:
```
Auto-improve: ResponseQuality (+0.85 impact)

Analyzed 45 interactions
- Binary accuracy: 82%
- Response quality: 78%
- Coherence: 75%

Auto-generated by Jarvis Self-Improvement Engine
```

### In Firebase Firestore

New records in:
- `improvements` collection (auto-improvement details)
- `daily_metrics` collection (performance metrics for the day)

---

## 🎯 Complete Flow

```
6:00 AM UTC (Daily)
    ↓
GitHub Actions triggers
    ↓
Calls: https://jarvis-comienza-jarvis-ia.up.railway.app/api/self-improve
    ↓
/api/self-improve endpoint:
  1. Reads last 24h interactions from Firestore
  2. Analyzes with ML engines
  3. Generates improvements
  4. Auto-commits to GitHub
  5. Records metrics to Firestore
    ↓
GitHub Actions logs result
    ↓
Result saved as artifact
    ↓
Next day, repeat
```

---

## ✨ Summary

**What was wrong**: `actions/upload-artifact@v3` (deprecated)

**What I fixed**: Updated to `actions/upload-artifact@v4`

**What you need to do**:
1. Add 2 secrets to GitHub Actions
2. (Optional) Trigger manually to test
3. Workflow runs automatically tomorrow at 6 AM UTC

**Time to complete**: 5 minutes

**Difficulty**: Very easy (just adding secrets)

---

## 🚀 Next Steps

1. Go to: https://github.com/paespa2/jarvis-comienza/settings/secrets/actions
2. Add `JARVIS_API_URL` = `https://jarvis-comienza-jarvis-ia.up.railway.app`
3. Add `JARVIS_TOKEN` = (your GitHub token)
4. Go to: https://github.com/paespa2/jarvis-comienza/actions
5. Click "Jarvis Daily Self-Improvement"
6. Click "Run workflow" to test
7. Check if it succeeds

After that, Jarvis will autonomously improve itself every day! 🤖✨
