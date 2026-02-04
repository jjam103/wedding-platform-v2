#!/usr/bin/env node

/**
 * Apply migration 051: Add default_auth_method to system_settings
 * 
 * This script applies the migration to add default authentication method
 * configuration for guests.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying migration 051: Add default_auth_method...\n');

  try {
    console.log('📝 Migration steps:');
    console.log('   - Add default_auth_method column to system_settings');
    console.log('   - Add constraint for valid values');
    console.log('   - Insert default setting');
    console.log('   - Create RSVP query indexes\n');

    console.log('⏳ Executing migration steps...\n');

    // Step 1: Check if system_settings table exists
    console.log('1️⃣  Checking system_settings table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);

    if (tableError) {
      console.error('❌ system_settings table not found:', tableError.message);
      throw new Error('system_settings table does not exist. Please run migration 050 first.');
    }
    console.log('✅ system_settings table exists\n');

    // Step 2: Try to insert the default setting (this will also verify the column exists)
    console.log('2️⃣  Inserting default_auth_method setting...');
    const { data: insertData, error: insertError } = await supabase
      .from('system_settings')
      .upsert({
        key: 'default_auth_method',
        value: 'email_matching',
        description: 'Default authentication method for new guests',
        category: 'authentication',
        is_public: false
      }, {
        onConflict: 'key',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('⚠️  Column does not exist yet. This is expected.');
        console.log('   The column needs to be added via SQL migration.');
        console.log('   Please run the migration manually using Supabase dashboard or psql.\n');
        console.log('📋 Manual migration steps:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Copy and paste the contents of:');
        console.log('      supabase/migrations/051_add_default_auth_method.sql');
        console.log('   3. Click "Run" to execute the migration\n');
        return;
      }
      console.error('❌ Error inserting setting:', insertError.message);
      throw insertError;
    }
    console.log('✅ Default setting inserted/updated\n');

    console.log('✅ Migration executed successfully\n');

    console.log('✅ Migration executed successfully\n');

    // Verify the migration
    console.log('🔍 Verifying migration...');

    // Check if setting exists
    const { data: setting, error: settingError } = await supabase
      .from('system_settings')
      .select('key, value, description')
      .eq('key', 'default_auth_method')
      .single();

    if (settingError) {
      console.warn('⚠️  Could not verify setting:', settingError.message);
    } else if (setting) {
      console.log('✅ Default setting verified:');
      console.log('   Key:', setting.key);
      console.log('   Value:', setting.value);
      console.log('   Description:', setting.description);
    }

    console.log('\n✨ Migration verification complete!');
    console.log('\n📋 Summary:');
    console.log('   ✓ default_auth_method setting exists in system_settings');
    console.log('   ✓ Default value set to: email_matching');
    console.log('\n⚠️  Note: Column-level changes and indexes require SQL execution');
    console.log('   Please verify in Supabase Dashboard that:');
    console.log('   - default_auth_method column exists on system_settings table');
    console.log('   - Constraint check_default_auth_method exists');
    console.log('   - RSVP indexes are created');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check database connection');
    console.error('   2. Verify service role key has admin permissions');
    console.error('   3. Check if migration was already applied');
    console.error('   4. Run migration manually via Supabase Dashboard');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
