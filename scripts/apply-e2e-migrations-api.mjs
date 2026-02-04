#!/usr/bin/env node

/**
 * Apply Missing E2E Test Database Migrations - Using Supabase REST API
 * 
 * This script applies missing migrations to the E2E test database
 * using Supabase's REST API for SQL execution.
 * 
 * Usage: node scripts/apply-e2e-migrations-api.mjs
 */

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

/**
 * Missing migrations identified by verification script (in order)
 */
const missingMigrations = [
  '034_add_section_title.sql',
  '036_add_auth_method_fields.sql',
  '037_create_magic_link_tokens_table.sql',
  '038_add_slug_columns_to_events_activities.sql',
  '038_create_admin_users_table.sql',
  '038_create_guest_sessions_table.sql',
  '039_add_slug_columns_to_accommodations_room_types.sql',
  '039_create_email_templates_table.sql',
  '040_create_email_history_table.sql',
  '048_add_soft_delete_columns.sql',
  '049_populate_entity_slugs.sql',
  '050_create_system_settings_table.sql',
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
 * Execute SQL using Supabase REST API
 */
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

/**
 * Apply a single migration
 */
async function applyMigration(filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    
    // Execute the migration SQL
    await executeSql(sql);
    
    console.log(`✅ Migration applied successfully: ${filename}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error applying migration: ${error.message}`);
    
    // Check if error is due to already existing objects
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Some objects already exist, continuing...`);
      return { success: true, warning: 'Some objects already existed' };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Main application function
 */
async function main() {
  console.log('🔧 E2E Test Database - Apply Missing Migrations (REST API)');
  console.log('==========================================================\n');
  
  console.log(`📊 Database: ${supabaseUrl}`);
  console.log(`📁 Migrations to apply: ${missingMigrations.length}\n`);
  
  console.log('⚠️  NOTE: This script requires the exec_sql RPC function to exist.');
  console.log('   If migrations fail, use the Supabase Dashboard SQL Editor instead.\n');
  
  // Apply each migration
  const results = [];
  for (const filename of missingMigrations) {
    const result = await applyMigration(filename);
    results.push({ filename, ...result });
    
    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n\n📊 Migration Summary');
  console.log('===================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const warnings = results.filter(r => r.warning);
  
  console.log(`Total migrations: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`⚠️  With warnings: ${warnings.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Migrations:');
    for (const { filename, error } of failed) {
      console.log(`  - ${filename}: ${error}`);
    }
    
    console.log('\n📝 Alternative: Use Supabase Dashboard');
    console.log('=====================================');
    console.log('1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql');
    console.log('2. Open file: supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql');
    console.log('3. Copy all SQL content');
    console.log('4. Paste into SQL Editor and click "Run"');
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Migrations with Warnings:');
    for (const { filename, warning } of warnings) {
      console.log(`  - ${filename}: ${warning}`);
    }
  }
  
  console.log('\n\n📝 Next Steps:');
  console.log('=============');
  console.log('1. Verify migrations were applied:');
  console.log('   node scripts/verify-e2e-migrations.mjs');
  console.log('2. Run E2E tests to verify fixes:');
  console.log('   npm run test:e2e');
  
  if (failed.length > 0) {
    console.log('\n⚠️  Some migrations failed. Use Supabase Dashboard as alternative.');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations applied successfully!');
    process.exit(0);
  }
}

// Run script
main().catch(error => {
  console.error('\n❌ Script failed:', error);
  console.error('\n📝 Alternative: Use Supabase Dashboard');
  console.error('1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql');
  console.error('2. Open file: supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql');
  console.error('3. Copy all SQL content');
  console.error('4. Paste into SQL Editor and click "Run"');
  process.exit(1);
});
