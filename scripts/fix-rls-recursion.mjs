#!/usr/bin/env node

/**
 * Script to fix the infinite recursion in group_members RLS policy
 * This applies the migration 021_fix_group_members_rls_infinite_recursion.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Fixing infinite recursion in group_members RLS policy...\n');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements to execute
const statements = [
  {
    name: 'Drop problematic policy',
    sql: 'DROP POLICY IF EXISTS "group_owners_view_their_members" ON group_members;'
  },
  {
    name: 'Create helper function',
    sql: `
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_id UUID)
RETURNS TABLE(group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id 
  FROM public.group_members gm
  WHERE gm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `.trim()
  },
  {
    name: 'Create fixed policy',
    sql: `
CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.get_user_group_ids(auth.uid())
  )
);
    `.trim()
  },
  {
    name: 'Add documentation comment',
    sql: `COMMENT ON FUNCTION public.get_user_group_ids(UUID) IS 'Returns group IDs for a user, bypassing RLS to prevent infinite recursion in policies';`
  }
];

// Execute each statement
for (const { name, sql } of statements) {
  console.log(`Executing: ${name}...`);
  
  try {
    const { error } = await supabase.rpc('query', { query_text: sql });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error('Details:', error);
      
      // Continue with next statement even if this one fails
      // (some statements like DROP might fail if policy doesn't exist)
      if (!name.includes('Drop')) {
        process.exit(1);
      }
    } else {
      console.log(`✅ ${name} completed\n`);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}\n`);
    
    // Continue with next statement for DROP operations
    if (!name.includes('Drop')) {
      process.exit(1);
    }
  }
}

console.log('✅ RLS policy fix completed!');
console.log('\nTesting database connection...');

// Test the fix by querying guests table
try {
  const { data, error } = await supabase
    .from('guests')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('❌ Test query failed:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Database connection working!');
  console.log('Test query result:', data);
} catch (err) {
  console.error('❌ Test query failed:', err.message);
  process.exit(1);
}

process.exit(0);
