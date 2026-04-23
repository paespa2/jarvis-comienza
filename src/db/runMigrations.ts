/**
 * Database Migrations Runner
 * Ejecuta el schema SQL y prepara la base de datos
 */

import { cloudSQLService } from '../services/cloudSQLService';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations(): Promise<void> {
  console.log('\n📦 [Database] Starting migrations...');

  try {
    // Test connection first
    const connTest = await cloudSQLService.testConnection();
    if (!connTest.ok) {
      console.error('❌ [Database] Cannot connect to Cloud SQL:', connTest.message);
      console.error('[Database] Ensure environment variables are set:');
      console.error('  - CLOUD_SQL_HOST');
      console.error('  - CLOUD_SQL_USER');
      console.error('  - CLOUD_SQL_PASSWORD (optional)');
      console.error('  - CLOUD_SQL_DATABASE');
      return;
    }

    console.log('✅ [Database] Connected to Cloud SQL');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'migrations', '001-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ [Database] Schema file not found: ${schemaPath}`);
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    for (const statement of statements) {
      try {
        await cloudSQLService.query(statement);
        executed++;
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  [Database] Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          throw err;
        }
      }
    }

    console.log(`✅ [Database] Migrations completed: ${executed} statements executed`);

    // Create default node types
    await createDefaultNodeTypes();

    console.log('✅ [Database] Database ready\n');

  } catch (err: any) {
    console.error('[Database] Migration failed:', err.message);
    throw err;
  }
}

async function createDefaultNodeTypes(): Promise<void> {
  const nodeTypes = [
    { name: 'SECURITY_CONCEPT', description: 'Cybersecurity concepts and terms' },
    { name: 'TOOL', description: 'Security tools and utilities' },
    { name: 'VULNERABILITY', description: 'Types of vulnerabilities' },
    { name: 'TECHNIQUE', description: 'Hacking and pentesting techniques' },
    { name: 'LEARNING_PATH', description: 'Learning paths and courses' },
    { name: 'RESOURCE', description: 'External resources and references' },
  ];

  for (const nodeType of nodeTypes) {
    try {
      await cloudSQLService.createNodeType(nodeType.name, nodeType.description);
      console.log(`✅ Created node type: ${nodeType.name}`);
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        console.warn(`⚠️  Could not create node type ${nodeType.name}:`, err.message);
      }
    }
  }
}

async function createDefaultRelationshipTypes(): Promise<void> {
  const relationshipTypes = [
    { name: 'RELATED_TO', description: 'General relationship', directed: false },
    { name: 'REQUIRES', description: 'Prerequisite relationship', directed: true },
    { name: 'USED_IN', description: 'Tool used in technique', directed: true },
    { name: 'EXPLOITS', description: 'Technique that exploits vulnerability', directed: true },
    { name: 'CAUSES', description: 'Cause and effect relationship', directed: true },
  ];

  console.log('📦 [Database] Creating relationship types...');

  for (const relType of relationshipTypes) {
    try {
      await cloudSQLService.query(
        `INSERT INTO relationship_types (name, description, directed)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [relType.name, relType.description, relType.directed]
      );
      console.log(`✅ Created relationship type: ${relType.name}`);
    } catch (err: any) {
      console.warn(`⚠️  Could not create relationship type ${relType.name}:`, err.message);
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations, createDefaultRelationshipTypes };
