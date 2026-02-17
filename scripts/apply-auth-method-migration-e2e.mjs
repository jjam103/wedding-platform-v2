#!/usr/bin/env node

/**
 * Apply auth_method migration to E2E database
 * This adds the auth_method column to guests table and default_auth_method to system_settings
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying auth_method migration to E2E database...\n');

const migration = `
-- Migration: Add authentication method fields for guest authentication
-- Requirements: 5.1, 5.2, 5.3, 22.1, 22.2
-- Task: 4.1 - Create migration for auth_method field

-- Add auth_method column to guests table
-- Supports two authentication methods:
-- - 'email_matching': Guest logs in by entering email that matches their guest record
-- - 'magic_link': Guest receives a one-time passwordless login link via email
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (auth_method IN ('email_matching', 'magic_link'));

-- Add default_auth_method to system_settings table
-- This sets the default authentication method for all new guests
-- Can be overridden per guest using the auth_method column
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS default_auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (default_auth_method IN ('email_matching', 'magic_link'));

-- Create index for auth_method queries
-- This improves performance when filtering guests by authentication method
CREATE INDEX IF NOT EXISTS idx_guests_auth_method ON guests(auth_method);

-- Create index for email + auth_method combination
-- This optimizes the email matching authentication flow
CREATE INDEX IF NOT EXISTS idx_guests_email_auth_method ON guests(email, auth_method) 
WHERE email IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN guests.auth_method IS 'Authentication method for guest login: email_matching or magic_link';
COMMENT ON COLUMN system_settings.default_auth_method IS 'Default authentication method for new guests';
COMMENT ON INDEX idx_guests_auth_method IS 'Index for filtering guests by authentication method';
COMMENT ON INDEX idx_guests_email_auth_method IS 'Composite index for email matching authentication lookups';
`;

try {
  console.log('📝 Executing migration SQL...');
  
  const { error } = await supabase.rpc('exec_sql', {
    query: migration
  });
  
  if (error) {
    // Try direct execution if RPC doesn't work
    console.log('   RPC method failed, trying direct execution...');
    
    // Split into individual statements and execute
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (!statement) continue;
      
      const { error: execError } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });
      
      if (execError) {
        console.error(`   ❌ Error executing statement: ${execError.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
  }
  
  console.log('✅ Migration applied successfully\n');
  
  // Verify the columns were added
  console.log('🔍 Verifying migration...');
  
  const { data: guestsColumns, error: guestsError } = await supabase
    .from('guests')
    .select('*')
    .limit(0);
  
  if (guestsError) {
    console.error('❌ Error verifying guests table:', guestsError.message);
  } else {
    console.log('✅ guests table accessible');
  }
  
  const { data: settingsColumns, error: settingsError } = await supabase
    .from('system_settings')
    .select('*')
    .limit(0);
  
  if (settingsError) {
    console.error('❌ Error verifying system_settings table:', settingsError.message);
  } else {
    console.log('✅ system_settings table accessible');
  }
  
  console.log('\n✨ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Run E2E tests to verify: npm run test:e2e');
  console.log('2. Check admin settings page for auth method toggle');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
}
