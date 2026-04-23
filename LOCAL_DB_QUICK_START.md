# 🚀 Local Database Quick Start Guide

Get Jarvis learning with Git-based persistence in 5 minutes.

---

## 1️⃣ Start the Server

```bash
npm install
npm run build
npm start
```

Expected output:
```
✅ Jarvis Local DB initialized
⏲️  Auto-commit timer started (every 15 minutes)
✅ Servidor iniciado en http://localhost:3000
```

---

## 2️⃣ Have a Conversation

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is XSS vulnerability?"}'
```

**What happens:**
1. Jarvis responds to your question
2. Interaction is recorded to `.jarvis-db/interactions/current.jsonl`
3. Response time and confidence tracked
4. Every 15 minutes, Git auto-commits

---

## 3️⃣ Ask Knowledge Questions

```bash
curl -X POST http://localhost:3000/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How to prevent SQL injection?"}'
```

**Tracked:**
- Question text
- Answer text
- Confidence score
- Response time
- Intent: `knowledge-question`

---

## 4️⃣ Generate Code

```bash
curl -X POST http://localhost:3000/api/qa/generate-code \
  -H "Content-Type: application/json" \
  -d '{"query": "Generate XSS payload tester"}'
```

**Recorded:**
- Code generation request
- Generated code language
- Confidence score
- Intent: `code-generation`

---

## 5️⃣ View Your Learning

### Get Statistics
```bash
curl http://localhost:3000/api/jarvis/learning-stats | jq
```

Response example:
```json
{
  "success": true,
  "data": {
    "total_interactions": 5,
    "concepts_learned": 0,
    "skills_mastered": 0,
    "improvements_pending": 0,
    "improvements_applied": 0,
    "days_active": 1,
    "timestamp": "2026-04-23T21:00:00Z",
    "database": ".jarvis-db/",
    "storage": "Git repository"
  }
}
```

### View Recent Interactions
```bash
curl "http://localhost:3000/api/jarvis/interactions?count=10" | jq
```

### View Knowledge Base
```bash
curl http://localhost:3000/api/jarvis/knowledge | jq
```

---

## 6️⃣ Trigger Self-Improvement

```bash
curl -X POST http://localhost:3000/api/self-improve \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'
```

**What happens:**
1. Analyzes recent interactions
2. Identifies improvement strategies
3. Records improvements to local DB
4. Records daily metrics
5. **Automatically commits to Git** with summary

Example commit:
```
🧠 Auto-improvement: 5 interactions analyzed, 0 concepts learned

Timestamp: 2026-04-23T21:00:00Z
```

---

## 7️⃣ Check Git History

```bash
# See all learning commits
git log --oneline .jarvis-db/

# See what Jarvis learned in the last commit
git show --stat

# See full details of learning changes
git log -p .jarvis-db/
```

---

## 📂 Database Files

After running some interactions, you'll see:

```
.jarvis-db/
├── interactions/
│   └── current.jsonl          ← All interactions (append-only)
├── knowledge/
│   ├── concepts.json          ← Learned concepts
│   ├── relationships.json     ← Concept relationships
│   ├── skills.json            ← Skill mastery levels
│   └── patterns.json          ← Learned patterns
├── improvements/
│   ├── pending.json           ← Improvements to apply
│   └── applied.json           ← Applied improvements with results
├── metrics/
│   ├── daily/2026-04-23.json  ← Daily summary
│   └── lifetime.json          ← Lifetime statistics
└── schema.json                ← Database schema definition
```

---

## 🔄 Auto-Commit Process

**Every 15 minutes automatically:**

1. ✅ Check if database has changes
2. 📝 Generate commit summary
3. 📦 Stage `.jarvis-db/` directory  
4. 💾 Commit to Git with timestamp
5. 🔄 Clear dirty flag and reset timer

---

## 🧪 Testing Workflow

```bash
# 1. Start server
npm start

# 2. In another terminal, send test requests
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Test message $i\"}"
  sleep 1
done

# 3. View statistics
curl http://localhost:3000/api/jarvis/learning-stats | jq

# 4. View interactions
curl http://localhost:3000/api/jarvis/interactions | jq '.data.interactions'

# 5. Manually trigger commit
curl -X POST http://localhost:3000/api/jarvis/commit | jq

# 6. Check Git log
git log --oneline -5 .jarvis-db/
```

---

## 📊 Understanding the Data Format

### Interactions (JSONL format)

Each line is one interaction:
```jsonl
{"timestamp":"2026-04-23T21:00:00Z","id":"int-1234567890","message":"What is XSS?","response":"Cross-Site Scripting is...","intent":"knowledge-question","confidence":0.95,"systemsUsed":["UnifiedQAEngine"],"responseTime":245,"qualityScore":0.95}
{"timestamp":"2026-04-23T21:01:30Z","id":"int-1234567891","message":"Generate code","response":"Generated JavaScript code","intent":"code-generation","confidence":0.92,"systemsUsed":["CodeGenerator"],"responseTime":189,"qualityScore":0.92}
```

**Why JSONL?**
- ✅ Append-only (fast writes)
- ✅ Line-delimited (easy parsing)
- ✅ Streaming compatible
- ✅ Git-friendly

### Skills JSON

```json
{
  "security_analysis": {
    "id": "security_analysis",
    "mastery": 0.82,
    "times_practiced": 234,
    "successful_applications": 189,
    "failure_rate": 0.15,
    "strengths": ["vulnerability_identification"],
    "improvement_needed": ["cwe_classification"]
  }
}
```

---

## 🎯 Next Steps

1. **In 15 minutes**: Watch first auto-commit happen
   ```bash
   watch -n 5 'git log --oneline -5 .jarvis-db/'
   ```

2. **After multiple interactions**: Check metrics
   ```bash
   cat .jarvis-db/metrics/daily/2026-04-23.json | jq
   ```

3. **Review learning**: Look at interactions
   ```bash
   tail -100 .jarvis-db/interactions/current.jsonl | jq -r '.message'
   ```

4. **Analyze patterns**: Use Git to see learning evolution
   ```bash
   git diff HEAD~1 .jarvis-db/knowledge/
   ```

---

## ❓ FAQ

**Q: How is data persisted?**
A: Everything is saved to `.jarvis-db/` files. Every 15 minutes, these files are committed to Git.

**Q: What if the server crashes?**
A: All data is in Git. When you restart, all learning is preserved.

**Q: Can I access the data outside the API?**
A: Yes! Just read the JSON/JSONL files directly. It's plain text.

**Q: How do I backup?**
A: Just `git push`. All learning is in Git history.

**Q: Can I see what Jarvis learned?**
A: Yes! `git log .jarvis-db/` shows every learning cycle.

---

## 🚀 Production Deployment

Once you're ready for production:

1. **Push to main branch**
   ```bash
   git push origin claude/jarvis-autonomous-testing-FlgyW:main
   ```

2. **Deploy to Railway**
   - Push to main automatically triggers build
   - Server initializes JarvisLocalDB on startup
   - Auto-commits happen every 15 minutes

3. **Monitor learning**
   ```bash
   # Via GitHub
   git log --oneline origin/main --path=.jarvis-db/
   
   # Via API
   curl https://your-deployment.up.railway.app/api/jarvis/learning-stats
   ```

---

**Start learning!** 🧠

The system is ready. Every interaction Jarvis has will be recorded, analyzed, and committed to Git. All learning is transparent, auditable, and permanent.

