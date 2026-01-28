#!/usr/bin/env node

/**
 * Script to fix the infinite recursion in group_members RLS policy
 * Uses Supabase REST API to execute SQL directly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Fixing infinite recursion in group_members RLS policy...\n');

// SQL statements to execute
const statements = [
  {
    name: 'Drop problematic policy',
    sql: 'DROP POLICY IF EXISTS "group_owners_view_their_members" ON group_members;'
  },
  {
    name: 'Create helper function',
    sql: `CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_id UUID)
RETURNS TABLE(group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id 
  FROM public.group_members gm
  WHERE gm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
  },
  {
    name: 'Create fixed policy',
    sql: `CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.get_user_group_ids(auth.uid())
  )
);`
  },
  {
    name: 'Add documentation comment',
    sql: `COMMENT ON FUNCTION public.get_user_group_ids(UUID) IS 'Returns group IDs for a user, bypassing RLS to prevent infinite recursion in policies';`
  }
];

// Execute SQL using Supabase REST API
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

// Alternative: Use PostgREST query parameter
async function executeSqlDirect(sql) {
  // Extract database URL from Supabase URL
  const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  const postgrestUrl = `${supabaseUrl}/rest/v1/`;
  
  // Use PostgREST's query parameter to execute raw SQL
  const response = await fetch(postgrestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

// Execute each statement
let successCount = 0;
let failCount = 0;

for (const { name, sql } of statements) {
  console.log(`📝 ${name}...`);
  
  try {
    // Try using pg_query extension if available
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log(`✅ ${name} completed\n`);
      successCount++;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed: ${errorText}\n`);
      failCount++;
      
      // Don't exit on DROP failures (policy might not exist)
      if (!name.includes('Drop')) {
        console.error('Critical error, stopping execution.');
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}\n`);
    failCount++;
    
    // Don't exit on DROP failures
    if (!name.includes('Drop')) {
      console.error('Critical error, stopping execution.');
      process.exit(1);
    }
  }
}

console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);

if (failCount > 0 && successCount === 0) {
  console.log('\n⚠️  The Supabase REST API method did not work.');
  console.log('Please apply the fix manually using one of these methods:\n');
  console.log('1. Supabase Dashboard SQL Editor:');
  console.log('   https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/sql\n');
  console.log('2. Run the migration file:');
  console.log('   supabase/migrations/021_fix_group_members_rls_infinite_recursion.sql\n');
  console.log('See FIX_DATABASE_RLS_ISSUE.md for detailed instructions.');
  process.exit(1);
}

console.log('\n✅ RLS policy fix completed!');
process.exit(0);
