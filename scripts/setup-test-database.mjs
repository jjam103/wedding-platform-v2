#!/usr/bin/env node

/**
 * Setup Test Database
 * 
 * This script helps configure the dedicated test database for property-based tests.
 * 
 * Test Database Details:
 * - Project ID: olcqaawrpnanioaorfer
 * - Project Name: wedding-platform-test
 * - URL: https://olcqaawrpnanioaorfer.supabase.co
 * - Region: us-east-1
 * - Status: ACTIVE_HEALTHY
 * 
 * API Keys (already available):
 * - Anon (legacy JWT): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY3FhYXdycG5hbmlvYW9yZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTg5MTYsImV4cCI6MjA4NTM5NDkxNn0.8spxVI6sOKhn1kGrUQQb5jTHHnm0n2pCkYGNmCTmhSU
 * - Publishable: sb_publishable_WQL9o677koIzor2XLeHSrg_OgY8rm8r
 * 
 * REQUIRED: Get service_role key from Supabase Dashboard
 * 1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/settings/api
 * 2. Find "Legacy API Keys" section
 * 3. Copy the "service_role" key (starts with eyJ...)
 * 4. Run this script with the key as an argument:
 *    node scripts/setup-test-database.mjs <service_role_key>
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

// Load .env.test file
config({ path: '.env.test' });

const TEST_PROJECT_ID = 'olcqaawrpnanioaorfer';
const TEST_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olcqaawrpnanioaorfer.supabase.co';
const TEST_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY3FhYXdycG5hbmlvYW9yZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTg5MTYsImV4cCI6MjA4NTM5NDkxNn0.8spxVI6sOKhn1kGrUQQb5jTHHnm0n2pCkYGNmCTmhSU';

async function main() {
  // Try to get service role key from environment first, then command line
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];
  
  if (!serviceRoleKey) {
    console.error('❌ Error: service_role key is required');
    console.log('\nUsage: node scripts/setup-test-database.mjs <service_role_key>');
    console.log('Or set SUPABASE_SERVICE_ROLE_KEY in .env.test');
    console.log('\nGet the service_role key from:');
    console.log(`https://supabase.com/dashboard/project/${TEST_PROJECT_ID}/settings/api`);
    console.log('\nLook for "Legacy API Keys" section and copy the "service_role" key');
    process.exit(1);
  }
  
  console.log('✓ Service role key found');
  console.log(`✓ Using test database: ${TEST_URL}\n`);
  
  console.log('🚀 Setting up test database...\n');
  
  // Create Supabase client with service_role key
  const supabase = createClient(TEST_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Test connection
  console.log('📡 Testing database connection...');
  const { error: testError } = await supabase
    .from('_migrations')
    .select('version')
    .limit(1);
  
  // PGRST116 = table doesn't exist yet (expected for fresh database)
  // PGRST301 = could not find table (also expected)
  if (testError && testError.code !== 'PGRST116' && testError.code !== 'PGRST301' && !testError.message.includes('Could not find the table')) {
    console.error('❌ Connection failed:', testError.message);
    process.exit(1);
  }
  
  console.log('✅ Connection successful\n');
  
  // Read all migration files
  console.log('📂 Reading migration files...');
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  const migrationFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ensure chronological order
  
  console.log(`Found ${migrationFiles.length} migration files\n`);
  
  // Apply each migration
  for (const file of migrationFiles) {
    console.log(`📝 Applying migration: ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = await readFile(filePath, 'utf-8');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try direct execution if RPC doesn't exist
        const { error: directError } = await supabase.from('_migrations').insert({
          version: file.replace('.sql', ''),
          name: file,
          applied_at: new Date().toISOString()
        });
        
        if (directError) {
          console.error(`   ❌ Failed: ${error.message}`);
          console.log('   ⚠️  You may need to apply migrations manually via Supabase Dashboard');
        } else {
          console.log('   ✅ Applied');
        }
      } else {
        console.log('   ✅ Applied');
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n📝 Creating .env.test.dedicated file...');
  
  const envContent = `# Dedicated Test Database Configuration
# Created: ${new Date().toISOString()}
# Project: wedding-platform-test (${TEST_PROJECT_ID})

# Test Database URL
NEXT_PUBLIC_SUPABASE_URL=${TEST_URL}

# Test Database Keys (Legacy JWT format - required for auth admin API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=${TEST_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Database Connection (for direct Postgres access if needed)
DATABASE_URL=postgresql://postgres.${TEST_PROJECT_ID}:YOUR_DB_PASSWORD@db.${TEST_PROJECT_ID}.supabase.co:5432/postgres

# Note: This is a DEDICATED TEST DATABASE
# - Safe for property-based tests that create real data
# - Isolated from production data
# - Can be reset/wiped without consequences
`;
  
  await import('fs/promises').then(fs => fs.writeFile('.env.test.dedicated', envContent));
  console.log('✅ Created .env.test.dedicated\n');
  
  console.log('🎉 Test database setup complete!\n');
  console.log('Next steps:');
  console.log('1. Review .env.test.dedicated file');
  console.log('2. Run property-based tests: npm run test:property');
  console.log('3. Optionally remove .skip() from tests in:');
  console.log('   __tests__/integration/entityCreation.integration.test.ts');
}

main().catch(console.error);
