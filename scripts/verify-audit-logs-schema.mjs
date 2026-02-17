#!/usr/bin/env node

/**
 * Verify Audit Logs Schema
 * 
 * This script checks if the audit_logs table has the required columns
 * (action and details) that were added in migration 053.
 * 
 * Usage:
 *   node scripts/verify-audit-logs-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('🔍 Checking audit_logs table schema...\n');

  try {
    // Query information_schema to check for columns
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'audit_logs')
      .in('column_name', ['action', 'details']);

    if (error) {
      console.error('❌ Error querying schema:', error.message);
      console.log('\n💡 This might mean the columns don\'t exist yet.');
      console.log('   Please apply the migration manually via Supabase dashboard.\n');
      return false;
    }

    if (!data || data.length === 0) {
      console.log('❌ Columns not found in audit_logs table\n');
      console.log('Missing columns:');
      console.log('  - action (TEXT)');
      console.log('  - details (JSONB)\n');
      console.log('📋 To fix this, apply the migration:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
      console.log('   2. Execute SQL from: supabase/migrations/053_add_action_and_details_to_audit_logs.sql\n');
      return false;
    }

    // Check which columns exist
    const actionColumn = data.find(col => col.column_name === 'action');
    const detailsColumn = data.find(col => col.column_name === 'details');

    console.log('📊 Schema Check Results:\n');
    
    if (actionColumn) {
      console.log('✅ action column exists');
      console.log(`   Type: ${actionColumn.data_type}`);
      console.log(`   Nullable: ${actionColumn.is_nullable}`);
    } else {
      console.log('❌ action column missing');
    }

    if (detailsColumn) {
      console.log('✅ details column exists');
      console.log(`   Type: ${detailsColumn.data_type}`);
      console.log(`   Nullable: ${detailsColumn.is_nullable}`);
    } else {
      console.log('❌ details column missing');
    }

    console.log('');

    if (actionColumn && detailsColumn) {
      console.log('✅ All required columns exist!\n');
      
      // Test inserting an audit log entry
      console.log('🧪 Testing audit log insertion...\n');
      
      const { error: insertError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'test',
          entity_id: '00000000-0000-0000-0000-000000000000',
          operation_type: 'test',
          action: 'schema_verification_test',
          details: { test: true, timestamp: new Date().toISOString() },
        });

      if (insertError) {
        console.log('⚠️  Insert test failed:', insertError.message);
        console.log('   This might indicate a permission issue.\n');
        return false;
      }

      console.log('✅ Audit log insertion successful!\n');
      
      // Clean up test entry
      await supabase
        .from('audit_logs')
        .delete()
        .eq('action', 'schema_verification_test');

      return true;
    } else {
      console.log('❌ Schema verification failed\n');
      console.log('📋 To fix this, apply the migration:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Execute SQL from: supabase/migrations/053_add_action_and_details_to_audit_logs.sql\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run verification
verifySchema().then(success => {
  process.exit(success ? 0 : 1);
});
