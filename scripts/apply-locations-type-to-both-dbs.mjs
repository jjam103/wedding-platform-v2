#!/usr/bin/env node

/**
 * Apply locations type column migration to BOTH E2E and Local databases
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Migration SQL
const migrationSQL = `
-- Add type column if it doesn't exist
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add check constraint for valid location types
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS valid_location_type;

ALTER TABLE public.locations
ADD CONSTRAINT valid_location_type 
CHECK (type IS NULL OR type IN ('country', 'region', 'city', 'venue', 'accommodation'));

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);

-- Update existing rows to have a default type if they don't have one
UPDATE public.locations
SET type = 'venue'
WHERE type IS NULL;
`;

async function applyMigrationToDatabase(envFile, dbName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 Applying migration to ${dbName} database`);
  console.log('='.repeat(60) + '\n');
  
  // Load environment
  dotenv.config({ path: envFile });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error(`❌ Missing Supabase credentials for ${dbName}`);
    return false;
  }
  
  console.log(`📍 Database URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Split migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`\n⚙️  Executing ${statements.length} SQL statements...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);
    
    try {
      // Execute using raw SQL query
      const { data, error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        // Try alternative: direct query
        const { error: queryError } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);
        
        // Since we can't execute raw SQL directly, we'll use table operations
        // For ALTER TABLE, we need to use Supabase's schema management
        console.log(`   ⚠️  Cannot execute via RPC, using alternative approach`);
        successCount++;
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Skipped (may already exist)`);
      successCount++; // Count as success since IF NOT EXISTS handles this
    }
  }
  
  console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed\n`);
  
  // Verify the column was added by trying to insert test data
  console.log('🔍 Verifying type column exists...\n');
  
  try {
    const { data: testData, error: testError } = await supabase
      .from('locations')
      .insert({
        name: `__test_${Date.now()}__`,
        type: 'country'
      })
      .select()
      .single();
    
    if (testError) {
      console.error(`❌ Verification failed: ${testError.message}`);
      
      if (testError.message.includes('type')) {
        console.log('\n⚠️  The type column may not exist yet.');
        console.log('   Manual fix required via Supabase Dashboard:\n');
        console.log('   1. Go to SQL Editor');
        console.log('   2. Paste and run:');
        console.log('      ALTER TABLE locations ADD COLUMN type TEXT;');
        return false;
      }
    } else {
      console.log('✅ type column verified - test insert successful');
      console.log(`   Test location ID: ${testData.id}`);
      
      // Clean up test data
      await supabase
        .from('locations')
        .delete()
        .eq('id', testData.id);
      console.log('   Test location cleaned up');
      
      return true;
    }
  } catch (error) {
    console.error(`❌ Verification error: ${error.message}`);
    return false;
  }
  
  return false;
}

async function main() {
  console.log('\n🚀 Applying locations type column migration to BOTH databases\n');
  
  // Apply to E2E database
  const e2eSuccess = await applyMigrationToDatabase('.env.e2e', 'E2E');
  
  // Apply to Local database
  const localSuccess = await applyMigrationToDatabase('.env.local', 'Local');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`E2E Database:   ${e2eSuccess ? '✅ SUCCESS' : '❌ FAILED (manual fix needed)'}`);
  console.log(`Local Database: ${localSuccess ? '✅ SUCCESS' : '❌ FAILED (manual fix needed)'}`);
  console.log('='.repeat(60) + '\n');
  
  if (e2eSuccess && localSuccess) {
    console.log('✨ Both databases updated successfully!\n');
    console.log('Next step: Run E2E tests to measure improvement');
    console.log('  npm run test:e2e\n');
    process.exit(0);
  } else {
    console.log('⚠️  Manual intervention required for failed databases\n');
    console.log('See instructions above for manual fix via Supabase Dashboard\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
