#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Tests basic connectivity to the E2E test database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
const envPath = join(__dirname, '..', '.env.e2e');
dotenv.config({ path: envPath });

console.log('Testing simple database connection...\n');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('Anon Key:', anonKey ? 'Set (length: ' + anonKey.length + ')' : 'NOT SET');
console.log('Service Key:', serviceKey ? 'Set (length: ' + serviceKey.length + ')' : 'NOT SET');

if (!url || !serviceKey) {
  console.error('Missing credentials!');
  process.exit(1);
}

// Use service role key to bypass RLS for testing
const supabase = createClient(url, serviceKey);

console.log('\nAttempting to query guests table...');

try {
  const { data, error } = await supabase
    .from('guests')
    .select('count')
    .limit(1);
  
  console.log('\nResult:');
  console.log('Data:', data);
  console.log('Error:', error);
  
  if (error) {
    console.log('\nError object keys:', Object.keys(error));
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    console.log('Error hint:', error.hint);
  }
  
  if (!error) {
    console.log('\n✅ Connection successful!');
  } else {
    console.log('\n❌ Connection failed');
  }
} catch (err) {
  console.error('\n❌ Exception:', err);
}
