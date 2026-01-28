#!/usr/bin/env node

/**
 * Script to apply a SQL migration to Supabase database
 * Usage: node scripts/apply-migration.mjs <migration-file-path>
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get migration file path from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/apply-migration.mjs <migration-file-path>');
  process.exit(1);
}

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read migration file
const migrationPath = resolve(__dirname, '..', migrationFile);
console.log(`Reading migration from: ${migrationPath}`);

let sql;
try {
  sql = readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error(`Error reading migration file: ${error.message}`);
  process.exit(1);
}

console.log('Migration SQL:');
console.log('---');
console.log(sql);
console.log('---');

// Apply migration using Supabase RPC
console.log('\nApplying migration...');

try {
  // Execute the SQL using the service role
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration applied successfully!');
  console.log('Result:', data);
} catch (error) {
  console.error('Error:', error.message);
  
  // Try alternative method: split into individual statements
  console.log('\nTrying alternative method (individual statements)...');
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error);
        process.exit(1);
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    } catch (err) {
      console.error(`Error in statement ${i + 1}:`, err.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All statements executed successfully!');
}

process.exit(0);
