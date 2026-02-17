#!/usr/bin/env node

/**
 * List tables in E2E database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load E2E environment
config({ path: resolve(process.cwd(), '.env.e2e') });

const e2eUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const e2eKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!e2eUrl || !e2eKey) {
  console.error('❌ Missing E2E environment variables');
  process.exit(1);
}

const client = createClient(e2eUrl, e2eKey);

console.log('🔍 Listing tables in E2E database...\n');
console.log('E2E DB:', e2eUrl);
console.log('');

async function main() {
  try {
    // Query information_schema directly
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
    
    console.log(`Found ${data.length} tables:\n`);
    data.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
