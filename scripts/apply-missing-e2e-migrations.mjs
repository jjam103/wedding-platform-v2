#!/usr/bin/env node

/**
 * Apply Missing E2E Test Database Migrations
 * 
 * This script applies the missing migrations identified by the verification script
 * to the E2E test database.
 * 
 * Usage: node scripts/apply-missing-e2e-migrations.mjs
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
 * Missing migrations identified by verification script
 */
const missingMigrations = [
  '034_add_section_title.sql',
  '036_add_auth_method_fields.sql',
  '037_create_magic_link_tokens_table.sql',
  '038_add_slug_columns_to_events_activities.sql',
  '038_create_admin_users_table.sql',
  '038_create_guest_sessions_table.sql',
  '039_add_slug_columns_to_accommodations_room_types.sql',
  '040_create_email_history_table.sql',
  '048_add_soft_delete_columns.sql',
  '051_add_base_cost_to_vendor_bookings.sql',
  '051_add_default_auth_method.sql',
  '051_add_event_id_to_accommodations.sql',
];

/**
 * Read migration file content
 */
function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }
  
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Apply a single migration using Supabase SQL execution
 */
async function applyMigration(filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    
    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to use the REST API or Supabase CLI
    console.log('⚠️  Cannot apply migration directly via Supabase client');
    console.log('   Migration SQL needs to be applied via:');
    console.log('   1. Supabase Dashboard SQL Editor');
    console.log('   2. Supabase CLI: supabase db push');
    console.log('   3. Direct PostgreSQL connection');
    
    // Display the SQL for manual application
    console.log('\n📋 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    
    return { success: false, manual: true };
  } catch (error) {
    console.error(`❌ Error reading migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main application function
 */
async function main() {
  console.log('🔧 E2E Test Database - Apply Missing Migrations');
  console.log('================================================\n');
  
  console.log(`📊 Database: ${supabaseUrl}`);
  console.log(`📁 Migrations to apply: ${missingMigrations.length}\n`);
  
  // Test connection
  console.log('🔌 Testing database connection...');
  const { error: connectionError } = await supabase
    .from('guests')
    .select('count')
    .limit(1);
  
  if (connectionError) {
    console.error(`❌ Database connection failed: ${connectionError.message}`);
    process.exit(1);
  }
  console.log('✅ Database connection successful\n');
  
  // Important note about migration application
  console.log('⚠️  IMPORTANT: Migration Application Method');
  console.log('==========================================');
  console.log('The Supabase JavaScript client does not support raw SQL execution.');
  console.log('Migrations must be applied using one of these methods:\n');
  console.log('1. **Supabase Dashboard** (Recommended for test database):');
  console.log('   - Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql');
  console.log('   - Copy migration SQL from supabase/migrations/');
  console.log('   - Paste and execute in SQL Editor\n');
  console.log('2. **Supabase CLI**:');
  console.log('   - Install: npm install -g supabase');
  console.log('   - Link project: supabase link --project-ref olcqaawrpnanioaorfer');
  console.log('   - Push migrations: supabase db push\n');
  console.log('3. **Direct PostgreSQL Connection**:');
  console.log('   - Use psql or any PostgreSQL client');
  console.log('   - Connect to test database');
  console.log('   - Execute migration files\n');
  
  // List migrations that need to be applied
  console.log('📋 Migrations to Apply (in order):');
  console.log('==================================\n');
  
  for (let i = 0; i < missingMigrations.length; i++) {
    const filename = missingMigrations[i];
    console.log(`${i + 1}. ${filename}`);
    
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ File exists: ${filePath}`);
    } else {
      console.log(`   ❌ File not found: ${filePath}`);
    }
  }
  
  console.log('\n\n📝 Next Steps:');
  console.log('=============');
  console.log('1. Open Supabase Dashboard SQL Editor');
  console.log('2. For each migration file above:');
  console.log('   a. Open the file in your editor');
  console.log('   b. Copy the SQL content');
  console.log('   c. Paste into Supabase SQL Editor');
  console.log('   d. Click "Run" to execute');
  console.log('3. After applying all migrations, run verification:');
  console.log('   node scripts/verify-e2e-migrations.mjs');
  console.log('4. Verify all tests pass:');
  console.log('   npm run test:e2e\n');
  
  // Create a combined SQL file for convenience
  console.log('💡 Creating combined migration file for convenience...');
  
  let combinedSql = `-- Combined Missing Migrations for E2E Test Database
-- Generated: ${new Date().toISOString()}
-- Apply these migrations in the Supabase SQL Editor
-- Database: ${supabaseUrl}

`;
  
  for (const filename of missingMigrations) {
    try {
      const sql = readMigrationFile(filename);
      combinedSql += `\n-- ============================================\n`;
      combinedSql += `-- Migration: ${filename}\n`;
      combinedSql += `-- ============================================\n\n`;
      combinedSql += sql;
      combinedSql += `\n\n`;
    } catch (error) {
      console.error(`⚠️  Could not read ${filename}: ${error.message}`);
    }
  }
  
  const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', 'COMBINED_MISSING_E2E_MIGRATIONS.sql');
  fs.writeFileSync(outputPath, combinedSql);
  
  console.log(`✅ Combined migration file created: ${outputPath}`);
  console.log('\n📋 You can now:');
  console.log('   1. Open this file in your editor');
  console.log('   2. Copy all content');
  console.log('   3. Paste into Supabase SQL Editor');
  console.log('   4. Execute all migrations at once\n');
  
  console.log('✨ Script complete!');
  console.log('   Follow the steps above to apply migrations.');
}

// Run script
main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
