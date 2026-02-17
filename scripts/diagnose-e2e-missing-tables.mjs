#!/usr/bin/env node

/**
 * Diagnostic Script: Check E2E Database for Missing Tables
 * 
 * Checks if required tables exist in the E2E test database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking E2E Database Tables...\n');
  
  const tablesToCheck = [
    'settings',
    'announcements',
    'audit_logs',
    'magic_link_tokens',
    'guest_sessions',
    'guests',
    'groups',
  ];
  
  const results = {};
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        results[table] = { exists: false, error: error.message };
      } else {
        results[table] = { 
          exists: true, 
          columns: data && data.length > 0 ? Object.keys(data[0]) : 'empty table'
        };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }
  
  // Print results
  console.log('Table Status:');
  console.log('='.repeat(80));
  
  for (const [table, result] of Object.entries(results)) {
    if (result.exists) {
      console.log(`✅ ${table.padEnd(25)} EXISTS`);
      if (result.columns !== 'empty table') {
        console.log(`   Columns: ${result.columns.join(', ')}`);
      } else {
        console.log(`   (empty table)`);
      }
    } else {
      console.log(`❌ ${table.padEnd(25)} MISSING`);
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Check audit_logs for details column specifically
  if (results.audit_logs?.exists) {
    console.log('\n🔍 Checking audit_logs schema...');
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      const hasDetailsColumn = 'details' in data[0];
      const hasActionColumn = 'action' in data[0];
      
      console.log(`   Has 'action' column: ${hasActionColumn ? '✅' : '❌'}`);
      console.log(`   Has 'details' column: ${hasDetailsColumn ? '✅' : '❌'}`);
      
      if (!hasDetailsColumn || !hasActionColumn) {
        console.log('\n⚠️  Migration 053 needs to be applied!');
        console.log('   Run: node scripts/apply-audit-logs-migration.mjs');
      }
    }
  }
  
  // Summary
  const missingTables = Object.entries(results)
    .filter(([_, result]) => !result.exists)
    .map(([table]) => table);
  
  console.log('\n' + '='.repeat(80));
  if (missingTables.length === 0) {
    console.log('✅ All required tables exist!');
  } else {
    console.log(`❌ Missing ${missingTables.length} table(s): ${missingTables.join(', ')}`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Check which migrations create these tables');
    console.log('   2. Apply missing migrations to E2E database');
    console.log('   3. Run: node scripts/apply-missing-e2e-migrations.mjs');
  }
}

checkTables().catch(console.error);
