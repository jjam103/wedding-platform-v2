#!/usr/bin/env node

/**
 * Script to apply the content_pages table migration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function applyMigration() {
  console.log('🔧 Creating content_pages table...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('📝 Step 1: Creating table...');
  
  // Create the table using Supabase admin API
  // Since we can't execute raw SQL directly, we'll use the REST API
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS content_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  console.log('\n💡 To create the table, run this SQL in Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');
  console.log('```sql');
  console.log(readFileSync('supabase/migrations/019_create_content_pages_table.sql', 'utf8'));
  console.log('```\n');
  
  console.log('Or use Supabase CLI:');
  console.log('   supabase db push\n');
  
  console.log('⏳ Waiting for you to create the table...');
  console.log('   Press Ctrl+C when done, then run this script again to verify.\n');
  
  // Check if table exists
  const { data, error } = await supabase
    .from('content_pages')
    .select('*')
    .limit(0);
  
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      console.log('❌ Table does not exist yet.');
      console.log('\n📋 Manual steps:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Paste the SQL from supabase/migrations/019_create_content_pages_table.sql');
      console.log('   5. Click "Run"');
      console.log('   6. Run this script again to verify\n');
      process.exit(1);
    }
    console.error('❌ Error checking table:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Table exists and is accessible!');
  console.log('\n🎉 content_pages table is ready to use!');
}

applyMigration();
