# 🔐 JARVIS SECURITY GUIDE

**CRITICAL**: Never expose secrets in chat, email, or code.

---

## ⚠️ WHAT YOU JUST DID (And How to Fix It)

You exposed:
- ❌ Firebase private key (service account)
- ❌ GitHub personal access token
- ❌ Cloud SQL password
- ❌ Hugging Face token

**These are NOW COMPROMISED.** You MUST:

1. ✅ Revoke all exposed credentials (see below)
2. ✅ Generate new credentials
3. ✅ Add to Railway using secure method
4. ✅ Never share credentials again

---

## 🚨 IMMEDIATE ACTIONS

### 1. Revoke GitHub Token

```
https://github.com/settings/tokens
```

1. Find the token you exposed
2. Click "Delete" ❌
3. Generate new token:
   - https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: `jarvis-auto-commit`
   - Scope: `repo` (full control)
   - Expiration: 90 days
   - Click "Generate token"
   - **Copy and save safely** (in password manager)

### 2. Revoke Hugging Face Token

```
https://huggingface.co/settings/tokens
```

1. Find the token you exposed
2. Click "Delete" ❌
3. Generate new token:
   - https://huggingface.co/settings/tokens
   - Click "New token"
   - Name: `jarvis`
   - Type: `read`
   - Click "Generate token"
   - **Copy and save safely**

### 3. Regenerate Firebase Service Account Key

```
https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk
```

1. Find the key you exposed in "Service Accounts" tab
2. Find the key ID (private_key_id: f8b183e6...)
3. Click the key row
4. Find and click "Delete key" ❌
5. Generate new key:
   - Click "Generate New Private Key"
   - Download the JSON file
   - **Do NOT paste in chat** (see section below for safe method)

### 4. Change Cloud SQL Password

```
https://console.cloud.google.com/sql/instances
```

1. Click instance: `asistente-jarvis-1741893602789-instance`
2. Click "Change password"
3. Generate strong password (16+ chars, mixed case, numbers, symbols)
4. **Do NOT paste in chat** (see section below for safe method)

---

## ✅ SAFE METHOD: Configure Railway Without Exposing Secrets

### Step 1: Download Credentials (Keep on Your Local Machine)

**For Firebase Service Account**:
1. Go: https://console.firebase.google.com/u/0/project/asistente-jarvis-1741893602789/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Save to your Downloads folder: `serviceAccountKey.json`
4. **DO NOT paste contents anywhere**
5. Open the file locally and keep it safe

**For GitHub Token**:
1. Go: https://github.com/settings/tokens
2. Generate new token (see above)
3. **Copy immediately after generation** (GitHub only shows it once)
4. Paste into a password manager (1Password, Bitwarden, etc.)
5. **DO NOT paste in chat/email/anywhere public**

### Step 2: Add to Railway (Secure Upload Method)

**Option A: Railway Web UI (Recommended)**

1. Go to Railway project:
   ```
   https://railway.app/project/41e4d06b-b65e-4261-890b-8726483c016b
   ```

2. Click "Jarvis" service

3. Click "Variables" tab

4. For **GOOGLE_APPLICATION_CREDENTIALS_JSON**:
   - Click "Add Variable"
   - Name: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: 
     * Open `serviceAccountKey.json` in text editor
     * Select all (Ctrl+A / Cmd+A)
     * Copy (Ctrl+C / Cmd+C)
     * Paste into Railway value field
     * Click "Add"

5. For **GITHUB_TOKEN**:
   - Click "Add Variable"
   - Name: `GITHUB_TOKEN`
   - Value: Paste token from password manager
   - Click "Add"

6. For other variables (GITHUB_OWNER, GITHUB_REPO, etc):
   - Add normally (these are not secrets)

7. Click "Deploy" to apply changes

**Option B: Railway CLI (If You Have It)**

```bash
# Login
railway login

# Add secret (will not appear in logs/history)
railway secret add GOOGLE_APPLICATION_CREDENTIALS_JSON < serviceAccountKey.json

# Add token
railway secret add GITHUB_TOKEN "ghp_xxxxxxx"

# Deploy
railway up
```

### Step 3: Verify Configuration

After adding variables:

```bash
# Test Firestore connection
curl https://jarvis-comienza-jarvis-ia.up.railway.app/api/health/firestore

# Should return:
{
  "success": true,
  "status": "connected",
  "message": "Connected to Firestore (database: ai-studio-...)",
  "databaseId": "ai-studio-c3c7e8ab-6b21-450e-8773-3df90f5aad00",
  "timestamp": 1713902400000
}
```

---

## 🔒 Best Practices Going Forward

### 1. NEVER Put Secrets in Chat

✅ **DO THIS**:
- Use password managers (1Password, Bitwarden, LastPass)
- Store in `.env.local` (gitignored)
- Add directly to Railway web UI
- Use `railway secret add` command

❌ **DON'T DO THIS**:
- Paste in Claude chat
- Paste in email
- Paste in Slack/Discord
- Commit to git
- Hardcode in source files

### 2. Use .env Files Locally

```bash
# Create local .env file (NOT in git)
cp .env.local.example .env.local

# Edit with credentials
nano .env.local

# Add to .gitignore (should already be there)
echo ".env.local" >> .gitignore
```

### 3. Rotate Credentials Regularly

- GitHub tokens: Every 90 days
- Firebase service accounts: Every 6 months
- Cloud SQL passwords: Every 3 months

### 4. Monitor for Exposure

Check if your credentials were leaked:
- https://haveibeenpwned.com (for email/password)
- GitHub will warn if you commit a token
- Firebase will revoke compromised service accounts

---

## 📋 Credential Checklist

- [ ] Revoke exposed GitHub token
- [ ] Generate new GitHub token
- [ ] Save to password manager (not in chat)
- [ ] Revoke exposed Firebase service account key
- [ ] Generate new Firebase service account key
- [ ] Change Cloud SQL password
- [ ] Revoke exposed Hugging Face token
- [ ] Generate new Hugging Face token
- [ ] Add GOOGLE_APPLICATION_CREDENTIALS_JSON to Railway
- [ ] Add GITHUB_TOKEN to Railway
- [ ] Add other variables (GITHUB_OWNER, GITHUB_REPO, etc)
- [ ] Test `/api/health/firestore` endpoint
- [ ] Test `/api/chat` endpoint
- [ ] Verify data appears in Firestore Console
- [ ] Delete `serviceAccountKey.json` from Downloads (after copying contents)
- [ ] Clear chat history (you can ask me to delete the message with credentials)

---

## 🛡️ If Credentials Are Compromised

**Signs of compromise**:
- Unauthorized Railway deployments
- Unexpected Firebase data modifications
- GitHub commits you didn't make
- Cloud SQL data access
- Billing anomalies

**Response**:
1. Revoke all credentials immediately
2. Generate new credentials
3. Check activity logs:
   - GitHub: https://github.com/settings/security-log
   - Firebase: https://console.cloud.google.com/activity
   - Cloud SQL: GCP Cloud Audit Logs
4. Ensure only your IP/devices have access
5. Enable 2FA on all accounts

---

## 📚 Reference

### Secure Storage
- 1Password: https://1password.com
- Bitwarden: https://bitwarden.com
- LastPass: https://www.lastpass.com
- KeePass: https://keepass.info (local only)

### Token Management
- GitHub: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Firebase: https://firebase.google.com/docs/admin/setup

### Security Monitoring
- OWASP Secrets Management: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Have I Been Pwned: https://haveibeenpwned.com

---

## ✨ Summary

**What happened**: You exposed secrets in chat (now compromised)

**What to do**:
1. Revoke all 4 types of credentials (GitHub, Firebase, Hugging Face, Cloud SQL)
2. Generate new credentials
3. Add to Railway via web UI (safely, without pasting in chat)
4. Test endpoints to verify it works
5. Remember: Never share credentials in chat again

**Time needed**: 30 minutes

**Security level after**: Same as before (all credentials rotated = fresh start)

---

**IMPORTANT**: When you're ready to add the credentials to Railway, do it through the Railway web UI directly (don't paste them here). Just tell me "Credentials added to Railway" and I'll help you test the connection.

🔐 Security is everyone's responsibility. Good catch asking for help - now we fix it properly!
