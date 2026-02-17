#!/usr/bin/env node

/**
 * Check locations table schema in E2E database
 */

import { createClient } from '@supabase/supabase-js';
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

async function checkLocationsSchema() {
  console.log('\n🔍 Checking locations table schema...\n');
  
  // Query the information_schema to get column details
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'locations')
    .order('ordinal_position');
  
  if (error) {
    console.error('❌ Error querying schema:', error.message);
    
    // Try alternative approach - just try to query the table
    console.log('\n📊 Trying to query locations table directly...\n');
    const { data: testData, error: testError } = await supabase
      .from('locations')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error querying locations:', testError.message);
    } else {
      console.log('✅ Locations table exists');
      if (testData && testData.length > 0) {
        console.log('\n📋 Sample row columns:');
        console.log(Object.keys(testData[0]).join(', '));
      } else {
        console.log('⚠️  Table is empty, cannot determine columns from data');
      }
    }
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('❌ locations table not found or has no columns');
    return;
  }
  
  console.log('✅ locations table found with columns:\n');
  console.log('Column Name              | Data Type    | Nullable');
  console.log('-------------------------|--------------|----------');
  
  data.forEach(col => {
    const name = col.column_name.padEnd(24);
    const type = col.data_type.padEnd(12);
    const nullable = col.is_nullable;
    console.log(`${name} | ${type} | ${nullable}`);
  });
  
  // Check for type column specifically
  const hasTypeColumn = data.some(col => col.column_name === 'type');
  
  console.log('\n' + '='.repeat(60));
  if (hasTypeColumn) {
    console.log('✅ type column EXISTS');
  } else {
    console.log('❌ type column MISSING');
    console.log('\n💡 Need to add type column with migration:');
    console.log('   ALTER TABLE locations ADD COLUMN type TEXT;');
  }
  console.log('='.repeat(60) + '\n');
}

checkLocationsSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
