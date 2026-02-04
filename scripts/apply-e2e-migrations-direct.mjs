#!/usr/bin/env node

/**
 * Apply Missing E2E Test Database Migrations - Direct PostgreSQL Connection
 * 
 * This script applies missing migrations directly to the E2E test database
 * using a PostgreSQL connection.
 * 
 * Usage: node scripts/apply-e2e-migrations-direct.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
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

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from Supabase URL');
  process.exit(1);
}

// Construct PostgreSQL connection string
// Supabase direct connection on port 5432
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;

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
 * Apply a single migration
 */
async function applyMigration(client, filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    
    // Execute the migration SQL
    await client.query(sql);
    
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
  console.log('🔧 E2E Test Database - Apply Missing Migrations (Direct)');
  console.log('========================================================\n');
  
  console.log(`📊 Database: ${supabaseUrl}`);
  console.log(`📁 Migrations to apply: ${missingMigrations.length}\n`);
  
  // Create PostgreSQL client
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful\n');
    
    // Apply each migration
    const results = [];
    for (const filename of missingMigrations) {
      const result = await applyMigration(client, filename);
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
      console.log('\n⚠️  Some migrations failed. Please review errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All migrations applied successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify .env.e2e has correct credentials');
    console.error('2. Check if database is accessible');
    console.error('3. Verify service role key has sufficient permissions');
    process.exit(1);
  } finally {
    // Close connection
    await client.end();
  }
}

// Run script
main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
