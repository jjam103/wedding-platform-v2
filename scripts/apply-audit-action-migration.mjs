#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load E2E environment
config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying audit_logs action column migration...\n');

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(0);

    if (checkError) {
      console.error('❌ Cannot access audit_logs table:', checkError.message);
      process.exit(1);
    }

    console.log('✅ Can access audit_logs table');
    console.log('\n📝 Migration SQL:');
    console.log('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);');
    console.log('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);');
    console.log('CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs(entity_id, action);');
    console.log('\n⚠️  Cannot execute DDL via Supabase client API');
    console.log('\n📋 Please apply manually via Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in sidebar');
    console.log('4. Paste the SQL above');
    console.log('5. Click "Run"');
    console.log('\nOr use: psql $E2E_DATABASE_URL < scripts/add-audit-logs-action.sql');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
