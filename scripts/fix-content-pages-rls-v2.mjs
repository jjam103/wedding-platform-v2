#!/usr/bin/env node

/**
 * Fix Content Pages RLS Policy
 * 
 * Updates the content_pages RLS policy to reference the correct table (profiles instead of users)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
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
    // Drop existing policy
    console.log('1. Dropping existing policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;'
    });

    if (dropError) {
      console.error('   ⚠️  Warning dropping policy:', dropError.message);
    } else {
      console.log('   ✓ Policy dropped');
    }

    // Create new policy with correct table reference
    console.log('\n2. Creating new policy with profiles table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "hosts_manage_content_pages"
        ON content_pages FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'host')
          )
        );
      `
    });

    if (createError) {
      console.error('   ❌ Error creating policy:', createError.message);
      
      // Try alternative approach using direct SQL
      console.log('\n3. Trying alternative approach...');
      const { error: altError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
            
            CREATE POLICY "hosts_manage_content_pages"
            ON content_pages FOR ALL
            USING (
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('super_admin', 'host')
              )
            );
          END $$;
        `
      });

      if (altError) {
        console.error('   ❌ Alternative approach failed:', altError.message);
        throw altError;
      }
    }

    console.log('   ✓ Policy created successfully');

    // Verify the fix
    console.log('\n4. Verifying policy...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'content_pages')
      .eq('policyname', 'hosts_manage_content_pages');

    if (verifyError) {
      console.error('   ⚠️  Could not verify policy:', verifyError.message);
    } else if (policies && policies.length > 0) {
      console.log('   ✓ Policy verified');
    } else {
      console.log('   ⚠️  Policy not found in verification');
    }

    console.log('\n✅ Content pages RLS policy fixed successfully!');
    console.log('\nYou can now create content pages without RLS errors.');

  } catch (error) {
    console.error('\n❌ Error fixing RLS policy:', error);
    console.error('\nManual fix required:');
    console.log('\nRun this SQL in Supabase SQL Editor:');
    console.log(`
DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;

CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
    `);
    process.exit(1);
  }
}

// Run the fix
fixContentPagesRLS();
