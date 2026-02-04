#!/usr/bin/env node

/**
 * Apply Auth Method Migration
 * 
 * Applies the 036_add_auth_method_fields.sql migration to add auth_method column to guests table.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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
  console.log('🚀 Applying Auth Method Migration');
  console.log('==================================\n');
  
  try {
    // Step 1: Add auth_method column to guests table
    console.log('📝 Step 1: Adding auth_method column to guests table...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE guests 
        ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'email_matching';
      `
    });
    
    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError.message);
      console.log('\n⚠️  Note: If the error is about exec_sql not existing, you need to apply the migration manually.');
      console.log('Please use the Supabase Dashboard SQL Editor or Supabase CLI to run:');
      console.log('   supabase/migrations/036_add_auth_method_fields.sql\n');
      process.exit(1);
    }
    
    console.log('✅ auth_method column added successfully');
    
    // Step 2: Add constraint
    console.log('\n📝 Step 2: Adding constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'guests_auth_method_check'
          ) THEN
            ALTER TABLE guests 
            ADD CONSTRAINT guests_auth_method_check 
            CHECK (auth_method IN ('email_matching', 'magic_link'));
          END IF;
        END $$;
      `
    });
    
    if (constraintError) {
      console.log('⚠️  Warning: Could not add constraint:', constraintError.message);
    } else {
      console.log('✅ Constraint added successfully');
    }
    
    // Step 3: Create indexes
    console.log('\n📝 Step 3: Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_guests_auth_method ON guests(auth_method);
        CREATE INDEX IF NOT EXISTS idx_guests_email_auth_method ON guests(email, auth_method) 
        WHERE email IS NOT NULL;
      `
    });
    
    if (indexError) {
      console.log('⚠️  Warning: Could not create indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    console.log('\n✅ Migration applied successfully!');
    console.log('\nYou can now run the fix script:');
    console.log('   node scripts/fix-guest-auth-method.mjs --all\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    console.log('\n⚠️  Manual migration required.');
    console.log('Please apply the migration using Supabase Dashboard or CLI:');
    console.log('   supabase/migrations/036_add_auth_method_fields.sql\n');
    process.exit(1);
  }
}

applyMigration();
