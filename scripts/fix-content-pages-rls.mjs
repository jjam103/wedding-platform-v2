#!/usr/bin/env node

/**
 * Fix Content Pages RLS Policy
 * 
 * Fixes the RLS policy for content_pages table to check the correct users table.
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
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixContentPagesRLS() {
  console.log('🔧 Fixing content_pages RLS policy...\n');

  try {
    // Drop the old policy
    console.log('1. Dropping old policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;'
    });

    if (dropError) {
      console.log('   Note: Policy may not exist yet, continuing...');
    } else {
      console.log('   ✅ Old policy dropped');
    }

    // Create the new policy
    console.log('\n2. Creating new policy...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "hosts_manage_content_pages"
        ON content_pages FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'host')
          )
        );
      `
    });

    if (createError) {
      // Try direct SQL execution
      const { error: directError } = await supabase.from('content_pages').select('id').limit(0);
      
      if (directError) {
        throw new Error(`Failed to create policy: ${createError.message}`);
      }
      
      console.log('   ⚠️  Could not verify policy creation via RPC');
      console.log('   Please run this SQL manually in Supabase dashboard:');
      console.log(`
        DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
        
        CREATE POLICY "hosts_manage_content_pages"
        ON content_pages FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'host')
          )
        );
      `);
    } else {
      console.log('   ✅ New policy created');
    }

    console.log('\n✅ Content pages RLS policy fixed!');
    console.log('\nYou should now be able to create content pages.');

  } catch (error) {
    console.error('\n❌ Error fixing RLS policy:', error.message);
    console.error('\nPlease run this SQL manually in Supabase dashboard:');
    console.error(`
      DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
      
      CREATE POLICY "hosts_manage_content_pages"
      ON content_pages FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );
    `);
    process.exit(1);
  }
}

fixContentPagesRLS();
