# LLM Wiki Schema for Jarvis

## Directory Structure
```
llm-wiki/
  sources/           # Immutable raw sources
  wiki/
    index.md        # Content-oriented catalog
    log.md          # Append-only operation log
    entities/       # Entity pages (HackerOne programs, vulnerabilities, etc.)
    concepts/       # Concept pages (techniques, methodologies)
    comparisons/    # Comparative analysis
    synthesis/      # Synthetic insights & theories
```

## Page Conventions

### Entity Pages (entities/*.md)
- One page per entity (vulnerability type, HackerOne program, technique)
- Fields: Definition, Examples, Related Concepts, Source References
- Linked to: Concepts, Comparison pages

### Concept Pages (concepts/*.md)
- One page per methodology/technique/framework
- Fields: Description, When to Use, Steps, Related Entities, References
- Updated when new sources provide new angles

### Comparison Pages (comparisons/*.md)
- Comparative analysis between 2+ entities/concepts
- Auto-generated from queries
- Linked back to both subjects

### Synthesis Pages (synthesis/*.md)
- High-level insights combining multiple sources
- Generated during lint passes
- Updated with new evidence

## Operations

### Ingest: Add a new source
1. Source is analyzed by LLM native model
2. Key takeaways extracted
3. Wiki updated:
   - New entity/concept pages if needed
   - Existing pages updated with new info
   - Cross-references added
   - Contradictions flagged
4. Index updated
5. Log entry appended

### Query: Answer a question
1. Search index for relevant pages
2. Read those pages
3. Synthesize answer with citations
4. File valuable results as new wiki pages
5. Log the query

### Lint: Health check
1. Find orphan pages (no inbound links)
2. Find contradictions between pages
3. Find important concepts lacking pages
4. Find missing cross-references
5. Suggest new sources to investigate
6. Suggest new questions

## Frontmatter Convention
```yaml
---
title: Page Title
category: entity|concept|comparison|synthesis
tags: [tag1, tag2]
sources: [source-id-1, source-id-2]
created: 2026-04-22
updated: 2026-04-22
confidence: 0.85
---
```

## Linking Convention
- Internal: [Link Text](page-name.md)
- Source refs: [Source](../sources/source-id.md)
- Bidirectional: LLM maintains backlinks

## Index.md Format
```
# Wiki Index

## Entities (15 pages)
- [Vulnerability Type](entities/xss.md) — Cross-site scripting variants
- ...

## Concepts (20 pages)
- [Recon Methodology](concepts/recon.md) — Information gathering
- ...

## Comparisons (8 pages)
- [SQL Injection vs NoSQL Injection](comparisons/sql-vs-nosql.md)
- ...

## Synthesis (5 pages)
- [2026 Vulnerability Trends](synthesis/trends-2026.md)
- ...
```

## Log.md Format
```
# Wiki Operation Log

## [2026-04-22] ingest | HackerOne Top 100 Programs Analysis
Updated 8 entity pages, created 3 new concept pages

## [2026-04-22] query | "What vulnerabilities are most valuable in 2026?"
Filed result as synthesis/trends-2026.md

## [2026-04-22] lint | Weekly health check
Found 2 orphan pages, 1 contradiction, suggested 3 new sources
```
