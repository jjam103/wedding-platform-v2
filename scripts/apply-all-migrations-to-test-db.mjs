#!/usr/bin/env node

/**
 * Apply All Migrations to Test Database
 * 
 * Applies all migrations from supabase/migrations/ to the test database
 * using direct SQL execution via Supabase client.
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const TEST_URL = 'https://olcqaawrpnanioaorfer.supabase.co';
const TEST_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY3FhYXdycG5hbmlvYW9yZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxODkxNiwiZXhwIjoyMDg1Mzk0OTE2fQ.TtTFm_44MLA2h5oUfpPXRwHVOUVb6U1jcB9ld9KvYGo';

async function main() {
  console.log('🚀 Applying all migrations to test database...\n');
  
  // Create Supabase client
  const supabase = createClient(TEST_URL, TEST_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Read all migration files
  console.log('📂 Reading migration files...');
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  const migrationFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ensure chronological order
  
  console.log(`Found ${migrationFiles.length} migration files\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Apply each migration
  for (const file of migrationFiles) {
    console.log(`📝 Applying: ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = await readFile(filePath, 'utf-8');
    
    try {
      // Execute SQL directly using rpc
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failCount++;
      } else {
        console.log('   ✅ Applied successfully');
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${migrationFiles.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All migrations applied successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Check errors above.');
  }
}

main().catch(console.error);
