#!/usr/bin/env node

/**
 * Verify E2E Test Database Migrations
 * 
 * This script verifies that all migrations from supabase/migrations/
 * have been applied to the E2E test database.
 * 
 * Usage: node scripts/verify-e2e-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.e2e');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get all migration files from supabase/migrations/
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files;
}

/**
 * Check if a table exists in the database using raw SQL
 */
async function tableExists(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ) as exists;
    `
  });
  
  if (error) {
    // Fallback: try to query the table directly
    const { error: queryError } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    return !queryError;
  }
  
  return data?.[0]?.exists || false;
}

/**
 * Get all tables in the database using raw SQL
 */
async function getAllTables() {
  // Try to query tables directly by attempting to access known tables
  const knownTables = [
    'guests', 'guest_groups', 'group_members', 'events', 'activities',
    'rsvps', 'accommodations', 'room_types', 'locations', 'vendors',
    'vendor_bookings', 'photos', 'content_pages', 'sections', 'columns',
    'email_queue', 'email_templates', 'email_history', 'audit_logs',
    'transportation', 'shuttles', 'magic_link_tokens', 'admin_users',
    'guest_sessions', 'system_settings', 'webhook_logs', 'cron_job_logs',
    'rsvp_reminders', 'scheduled_emails'
  ];
  
  const existingTables = [];
  
  for (const table of knownTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (!error) {
      existingTables.push(table);
    }
  }
  
  return existingTables;
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName, columnName) {
  // Try to select the column from the table
  const { error } = await supabase
    .from(tableName)
    .select(columnName)
    .limit(0);
  
  return !error;
}

/**
 * Parse migration file to extract expected changes
 */
function parseMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const changes = {
    tables: [],
    columns: [],
    functions: [],
    policies: [],
  };
  
  // Extract CREATE TABLE statements
  const tableMatches = content.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/gi);
  for (const match of tableMatches) {
    changes.tables.push(match[1]);
  }
  
  // Extract ALTER TABLE ADD COLUMN statements
  const columnMatches = content.matchAll(/ALTER TABLE\s+(?:public\.)?(\w+)\s+ADD COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)/gi);
  for (const match of columnMatches) {
    changes.columns.push({ table: match[1], column: match[2] });
  }
  
  // Extract CREATE FUNCTION statements
  const functionMatches = content.matchAll(/CREATE\s+(?:OR REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)/gi);
  for (const match of functionMatches) {
    changes.functions.push(match[1]);
  }
  
  // Extract CREATE POLICY statements
  const policyMatches = content.matchAll(/CREATE POLICY\s+"?(\w+)"?\s+ON\s+(?:public\.)?(\w+)/gi);
  for (const match of policyMatches) {
    changes.policies.push({ name: match[1], table: match[2] });
  }
  
  return changes;
}

/**
 * Verify a single migration
 */
async function verifyMigration(filename) {
  console.log(`\n📄 Verifying migration: ${filename}`);
  
  const changes = parseMigrationFile(filename);
  const issues = [];
  
  // Check tables
  for (const table of changes.tables) {
    const exists = await tableExists(table);
    if (!exists) {
      issues.push(`Table '${table}' not found`);
    } else {
      console.log(`  ✅ Table '${table}' exists`);
    }
  }
  
  // Check columns
  for (const { table, column } of changes.columns) {
    const exists = await columnExists(table, column);
    if (!exists) {
      issues.push(`Column '${column}' not found in table '${table}'`);
    } else {
      console.log(`  ✅ Column '${table}.${column}' exists`);
    }
  }
  
  // Note: Functions and policies are harder to verify without direct SQL access
  // We'll just log them for manual verification if needed
  if (changes.functions.length > 0) {
    console.log(`  ℹ️  Functions: ${changes.functions.join(', ')}`);
  }
  if (changes.policies.length > 0) {
    console.log(`  ℹ️  Policies: ${changes.policies.map(p => `${p.name} on ${p.table}`).join(', ')}`);
  }
  
  return issues;
}

/**
 * Main verification function
 */
async function main() {
  console.log('🔍 E2E Test Database Migration Verification');
  console.log('==========================================\n');
  
  console.log(`📊 Database: ${supabaseUrl}`);
  
  // Test connection
  console.log('\n🔌 Testing database connection...');
  const { error: connectionError } = await supabase
    .from('guests')
    .select('count')
    .limit(1);
  
  if (connectionError) {
    console.error(`❌ Database connection failed: ${connectionError.message}`);
    process.exit(1);
  }
  console.log('✅ Database connection successful');
  
  // Get all migration files
  const migrationFiles = getMigrationFiles();
  console.log(`\n📁 Found ${migrationFiles.length} migration files`);
  
  // Get all tables in database
  console.log('\n📊 Fetching database schema...');
  let allTables;
  try {
    allTables = await getAllTables();
    console.log(`✅ Found ${allTables.length} tables in database`);
    console.log(`   Tables: ${allTables.slice(0, 10).join(', ')}${allTables.length > 10 ? '...' : ''}`);
  } catch (error) {
    console.error(`❌ Failed to fetch tables: ${error.message}`);
    process.exit(1);
  }
  
  // Verify each migration
  const allIssues = [];
  for (const filename of migrationFiles) {
    const issues = await verifyMigration(filename);
    if (issues.length > 0) {
      allIssues.push({ filename, issues });
    }
  }
  
  // Summary
  console.log('\n\n📊 Verification Summary');
  console.log('======================');
  console.log(`Total migrations: ${migrationFiles.length}`);
  console.log(`Migrations with issues: ${allIssues.length}`);
  console.log(`Migrations verified: ${migrationFiles.length - allIssues.length}`);
  
  if (allIssues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    for (const { filename, issues } of allIssues) {
      console.log(`\n  ${filename}:`);
      for (const issue of issues) {
        console.log(`    ❌ ${issue}`);
      }
    }
    console.log('\n❌ Some migrations may not be fully applied');
    console.log('   This could be due to:');
    console.log('   1. Migrations not yet applied to test database');
    console.log('   2. Migration file parsing limitations (complex SQL)');
    console.log('   3. Tables/columns created with different names');
    console.log('\n   Recommendation: Review the issues above and apply missing migrations');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations appear to be applied successfully!');
    console.log('   The test database schema matches the migration files.');
    process.exit(0);
  }
}

// Run verification
main().catch(error => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});
