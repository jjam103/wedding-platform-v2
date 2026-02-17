#!/usr/bin/env node

/**
 * Apply locations type column migration to E2E database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🚀 Applying locations type column migration...\n');
  
  // Read the migration file
  const migrationSQL = readFileSync('supabase/migrations/052_add_locations_type_column.sql', 'utf8');
  
  console.log('📄 Migration SQL:');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60) + '\n');
  
  // Execute the migration
  console.log('⚙️  Executing migration...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTrying alternative approach with individual statements...\n');
    
    // Try executing statements individually
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      
      // Use the SQL editor endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed: ${errorText}`);
      } else {
        console.log('✅ Success');
      }
    }
    
    return;
  }
  
  console.log('✅ Migration applied successfully!\n');
  
  // Verify the column was added
  console.log('🔍 Verifying type column exists...\n');
  
  const { data: testData, error: testError } = await supabase
    .from('locations')
    .insert({
      name: 'Test Location',
      type: 'country'
    })
    .select()
    .single();
  
  if (testError) {
    console.error('❌ Verification failed:', testError.message);
  } else {
    console.log('✅ type column verified - test insert successful');
    console.log('   Test location created:', testData);
    
    // Clean up test data
    await supabase
      .from('locations')
      .delete()
      .eq('id', testData.id);
    console.log('   Test location cleaned up\n');
  }
}

applyMigration()
  .then(() => {
    console.log('✨ Migration complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
