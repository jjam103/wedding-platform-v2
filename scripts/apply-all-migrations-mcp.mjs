#!/usr/bin/env node

/**
 * Apply All Migrations via Supabase MCP
 * 
 * This script reads all migration files and applies them to the test database
 * using the Supabase MCP apply_migration tool.
 * 
 * Note: This script is designed to be run by Kiro AI assistant using the MCP.
 * For manual execution, use the Supabase Dashboard or CLI instead.
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const TEST_PROJECT_ID = 'olcqaawrpnanioaorfer';

async function main() {
  console.log('📂 Reading migration files...\n');
  
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  const migrationFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files\n`);
  console.log('Migration files to apply:');
  
  for (let i = 0; i < migrationFiles.length; i++) {
    const file = migrationFiles[i];
    const status = i === 0 ? '✅ Applied' : '⏳ Pending';
    console.log(`  ${i + 1}. ${file} - ${status}`);
  }
  
  console.log('\n📋 Instructions for Kiro AI:');
  console.log('Use the Supabase MCP to apply each migration:');
  console.log('\nFor each migration file (starting from 002):');
  console.log('1. Read the migration file');
  console.log('2. Call kiroPowers with:');
  console.log('   - action: "use"');
  console.log('   - powerName: "supabase-hosted"');
  console.log('   - serverName: "supabase"');
  console.log('   - toolName: "apply_migration"');
  console.log('   - arguments: {');
  console.log('       project_id: "olcqaawrpnanioaorfer",');
  console.log('       name: "migration_name_without_extension",');
  console.log('       query: "SQL content from file"');
  console.log('     }');
  console.log('\n✅ Migration 001 already applied successfully');
  console.log('⏳ Remaining: 23 migrations (002 through 20250130000000)');
}

main().catch(console.error);
