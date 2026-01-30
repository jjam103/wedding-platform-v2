#!/usr/bin/env node

/**
 * Script to check which tables exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check for expected tables by trying to query them
  const expectedTables = [
    'users',
    'guests',
    'groups',
    'activities',
    'events',
    'locations',
    'content_pages',
    'sections',
    'photos',
    'accommodations',
    'room_types',
    'rsvps',
    'vendors',
    'audit_logs',
  ];

  console.log('🔍 Checking for expected tables:\n');
  
  const results = [];
  
  for (const table of expectedTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`   ❌ ${table} - ${error.message}`);
      results.push({ table, exists: false, error: error.message });
    } else {
      console.log(`   ✅ ${table}`);
      results.push({ table, exists: true });
    }
  }
  
  const missing = results.filter(r => !r.exists);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} tables:`);
    missing.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
    console.log('\n💡 You may need to run database migrations.');
  } else {
    console.log(`\n✅ All expected tables exist!`);
  }
}

checkTables();
