# 🗄️ Cloud SQL Deployment Guide

**Migration Complete: Firebase Realtime Database → Google Cloud SQL (PostgreSQL)**

---

## 📋 Overview

Jarvis now uses **PostgreSQL on Google Cloud SQL** for persistent knowledge storage, replacing Firebase Realtime Database. This provides:

✅ **Permanent persistence** - Knowledge survives Railway deploys  
✅ **Complex queries** - SQL joins for advanced analysis  
✅ **Better scalability** - Handles millions of interactions  
✅ **Knowledge graph** - Structured relationship tracking  
✅ **Audit trail** - Complete history of improvements  

---

## 🚀 Setup Instructions

### 1. Cloud SQL Instance (Already Created)

Your instance is already configured:
- **Instance ID**: `asistente-jarvis-1741893602789-instance`
- **Database**: `asistente-jarvis-1741893602789-database`
- **Region**: Northern Virginia (us-east4)
- **Engine**: PostgreSQL

### 2. Environment Variables

Add these to Railway or your `.env`:

```bash
# Cloud SQL Connection (Private IP for Cloud SQL Auth Proxy)
CLOUD_SQL_HOST=127.0.0.1
CLOUD_SQL_PORT=5432
CLOUD_SQL_USER=postgres
CLOUD_SQL_PASSWORD=your_password_here
CLOUD_SQL_DATABASE=asistente-jarvis-1741893602789-database
CLOUD_SQL_SSL=false

# Or use Cloud SQL Auth Proxy (recommended for Railway)
CLOUD_SQL_INSTANCE=asistente-jarvis-1741893602789-instance
CLOUD_SQL_REGION=us-east4
```

### 3. Connection Methods

#### Option A: Direct Connection (Local Development)
```bash
# For local PostgreSQL testing
CLOUD_SQL_HOST=localhost
CLOUD_SQL_USER=postgres
CLOUD_SQL_PASSWORD=postgres
CLOUD_SQL_DATABASE=asistente-jarvis-1741893602789-database
```

#### Option B: Cloud SQL Auth Proxy (Recommended for Railway)

1. Install Cloud SQL Auth Proxy:
```bash
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy
```

2. Start proxy in background:
```bash
./cloud_sql_proxy -instances=PROJECT_ID:us-east4:asistente-jarvis-1741893602789-instance &
```

3. Then set:
```bash
CLOUD_SQL_HOST=127.0.0.1
CLOUD_SQL_PORT=5432
```

### 4. Initialize Database

The migrations run automatically on server startup:

```bash
# Manual migration (if needed)
npx ts-node src/db/runMigrations.ts
```

---

## 🗂️ Database Schema

### Core Tables

**node_types**
- Security concepts, tools, vulnerabilities, techniques

**nodes**
- Knowledge base entries with properties

**edges**
- Relationships between nodes (REQUIRES, USES_IN, EXPLOITS, etc.)

**interactions**
- User queries and Jarvis responses
- Intent, emotion, confidence, satisfaction

**improvements**
- Auto-applied improvements with commit hashes
- Tracks all self-modifications

**daily_metrics**
- Coherence, accuracy, relevance metrics by day
- Tracks improvement progress

**h1_learnings**
- Security learnings from HackerOne cases

**research_sessions**
- Auto-research sessions and knowledge gained

---

## 📊 Usage Examples

### Record an Interaction

```typescript
import { cloudSQLService } from './services/cloudSQLService';

await cloudSQLService.recordInteraction({
  sessionId: 'session-123',
  userQuery: 'What is SQL injection?',
  jarvisResponse: 'SQL injection is an attack...',
  intent: 'SECURITY_CONCEPTUAL',
  emotion: 'CURIOUS',
  confidence: 0.92,
  userSatisfaction: 0.85,
  systemsUsed: ['ResponseGenerator', 'EmotionalIntelligence']
});
```

### Get Recent Interactions (for self-improvement)

```typescript
const interactions = await cloudSQLService.getRecentInteractions(1); // Last 1 day
// Used by /api/self-improve endpoint
```

### Save Daily Metrics

```typescript
await cloudSQLService.saveDailyMetrics({
  metricDate: new Date(),
  binaryAccuracy: 0.78,
  multiClassQuality: 0.82,
  multiClassRelevance: 0.85,
  multiClassCoherence: 0.75,
  multiClassCompleteness: 0.72,
  totalInteractions: 45
});
```

### Query Knowledge Graph

```typescript
const graph = await cloudSQLService.getKnowledgeGraph();
// Returns nodes, edges, and properties for ML analysis
```

---

## 🔄 Auto-Improvement Loop

Now with permanent storage:

```
1. GitHub Actions triggers (6 AM UTC)
2. POST /api/self-improve
3. Cloud SQL provides interaction history
4. Comprehensive ML diagnosis runs
5. Improvements are applied and committed
6. New metrics saved to Cloud SQL
7. Knowledge persists across Railway deploys ✅
```

---

## 📈 Migration Impact

### Before (Firebase RTDB)
- Interactions: Lost after deploy ❌
- Knowledge graph: Lost after deploy ❌
- Improvements: Lost after deploy ❌
- Max queries: Limited ⚠️

### After (Cloud SQL)
- Interactions: **Permanent** ✅
- Knowledge graph: **Permanent** ✅
- Improvements: **Auditable** ✅
- Max queries: **Unlimited SQL** ✅

---

## 🧪 Testing

### Test Connection

```bash
curl http://localhost:3000/api/self-improve
# Returns:
# {
#   "success": true,
#   "improvements": [...],
#   "diagnosis": {
#     "binaryAccuracy": 0.75,
#     "multiClassQuality": 0.80
#   }
# }
```

### Monitor Metrics

```sql
-- Query latest metrics
SELECT * FROM daily_metrics ORDER BY metric_date DESC LIMIT 7;

-- Check interaction trends
SELECT intent, COUNT(*) as count, AVG(confidence) as avg_confidence
FROM interactions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY intent;
```

---

## 💾 Backup Strategy

### Automatic Backups
Google Cloud SQL provides:
- Automated daily backups (7-35 days retention)
- Point-in-time recovery
- Backups to Google Cloud Storage

### Manual Export

```bash
# Export database to SQL file
pg_dump -h CLOUD_SQL_HOST -U postgres DATABASE_NAME > backup.sql

# Import to another instance
psql -h NEW_HOST -U postgres DATABASE_NAME < backup.sql
```

---

## 🔐 Security

### Access Control

1. **Cloud IAM** - Restrict who can access the instance
2. **Network** - Use Private IP (recommended)
3. **SSL** - Enable SSL connections
4. **Secrets** - Store credentials in Railway Secrets

### Best Practices

```bash
# ✅ Use Cloud SQL Auth Proxy
# ✅ Use Private IP connections  
# ✅ Enable SSL
# ✅ Rotate passwords regularly
# ✅ Use least-privilege IAM roles
```

---

## 📊 Performance Optimization

### Indexes (Already Created)

```sql
-- Node lookups
CREATE INDEX idx_nodes_external_id ON nodes(external_id);
CREATE INDEX idx_nodes_label ON nodes(label);

-- Interaction analysis
CREATE INDEX idx_interactions_session_id ON interactions(session_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
CREATE INDEX idx_interactions_intent ON interactions(intent);

-- Graph traversal
CREATE INDEX idx_edges_source_target ON edges(source_node_id, target_node_id);
```

### Query Optimization

For large datasets:

```typescript
// Paginate results
const interactions = await cloudSQLService.query(
  `SELECT * FROM interactions 
   WHERE created_at >= NOW() - INTERVAL '1 day' 
   ORDER BY created_at DESC 
   LIMIT 1000 OFFSET $1`,
  [0]
);

// Use EXPLAIN to analyze queries
EXPLAIN ANALYZE SELECT ...
```

---

## 🚨 Troubleshooting

### Cannot Connect

```
Error: ECONNREFUSED

Solutions:
1. Check CLOUD_SQL_HOST and CLOUD_SQL_PORT
2. Verify Cloud SQL Auth Proxy is running
3. Confirm credentials are correct
4. Check firewall rules allow connection
```

### High Latency

```
Solutions:
1. Use Private IP (lower latency than Public IP)
2. Enable connection pooling (already configured)
3. Add indexes for common queries
4. Consider read replicas for heavy queries
```

### Disk Space Full

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname != 'pg_catalog'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 💰 Cost Estimation

### Monthly Cost (estimated)

- **Instance**: $7-15 (depending on size)
- **Storage**: $0.17 per GB/month
- **Egress**: $0.12 per GB
- **Network**: Included with Cloud SQL

For typical Jarvis usage:
- **Total**: ~$10-15/month

---

## 🎯 Next Steps

1. **Deploy to Railway**
   - Set Cloud SQL environment variables
   - Run migrations on startup

2. **Monitor Performance**
   - Check query logs
   - Monitor disk space
   - Track inference latency

3. **Scale Safely**
   - Archive old interactions (>90 days)
   - Partition large tables by date
   - Use read replicas if needed

---

## 📚 References

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Node.js pg Library](https://node-postgres.com)

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2026-04-23  
**Persistence**: PostgreSQL (Permanent)
