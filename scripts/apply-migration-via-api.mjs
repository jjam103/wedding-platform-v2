#!/usr/bin/env node

/**
 * Apply migration via Supabase REST API
 * Uses the service role key to execute SQL statements
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Applying migration via Supabase REST API...\n');

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '055_fix_get_user_role_for_admin_users.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📄 Migration file loaded:');
console.log('   Path:', migrationPath);
console.log('   Size:', migrationSQL.length, 'bytes\n');

// Execute SQL via REST API
console.log('📡 Executing SQL via REST API...\n');

try {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: migrationSQL
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API request failed:', response.status, response.statusText);
    console.error('   Response:', errorText);
    
    console.log('\n⚠️  The REST API approach did not work.');
    console.log('   This is expected - Supabase does not expose SQL execution via REST API for security reasons.\n');
    console.log('📝 PLEASE APPLY THE MIGRATION MANUALLY:\n');
    console.log('1. Go to your Supabase dashboard SQL Editor:');
    console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor\n`);
    console.log('2. Copy and paste the following SQL:\n');
    console.log('━'.repeat(80));
    console.log(migrationSQL);
    console.log('━'.repeat(80));
    console.log('\n3. Click "Run" to execute\n');
    console.log('4. Then run: node scripts/diagnose-email-composer-issue.mjs\n');
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ Migration executed successfully');
  console.log('   Result:', result);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📝 PLEASE APPLY THE MIGRATION MANUALLY:\n');
  console.log('1. Go to your Supabase dashboard SQL Editor:');
  console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor\n`);
  console.log('2. Copy and paste the following SQL:\n');
  console.log('━'.repeat(80));
  console.log(migrationSQL);
  console.log('━'.repeat(80));
  console.log('\n3. Click "Run" to execute\n');
  console.log('4. Then run: node scripts/diagnose-email-composer-issue.mjs\n');
  process.exit(1);
}

process.exit(0);
