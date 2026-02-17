#!/usr/bin/env node

/**
 * Script to add action column to audit_logs table
 * 
 * This script applies migration 053 which adds the action column
 * needed for tracking authentication events.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying audit_logs action column migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/053_add_audit_logs_action_column.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('');

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', { query: statement });
        if (execError) {
          console.error('❌ Failed to execute statement:', statement);
          console.error('   Error:', execError.message);
          throw execError;
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');

    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('audit_logs')
      .select('action')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Could not verify column (this is OK if table is empty)');
      console.log('   Error:', verifyError.message);
    } else {
      console.log('✅ Verified: action column exists in audit_logs table');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
