#!/usr/bin/env node

/**
 * Check if activities table has soft delete columns
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking activities table schema...\n');

  try {
    // Try to query the activities table with deleted_at column
    const { data, error } = await supabase
      .from('activities')
      .select('id, name, deleted_at, deleted_by')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Soft delete columns NOT found in activities table');
        console.log('\nThe migration has not been applied yet.');
        console.log('\nTo fix this, run:');
        console.log('  npm run db:migrate');
        console.log('\nOr apply the migration manually using your Supabase dashboard.');
        return false;
      }
      throw error;
    }

    console.log('✅ Soft delete columns exist in activities table');
    console.log('\nColumns found:');
    console.log('  - deleted_at (TIMESTAMPTZ)');
    console.log('  - deleted_by (UUID)');
    
    // Check if there are any soft-deleted activities
    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null);
    
    console.log(`\nCurrently ${count || 0} soft-deleted activities in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    return false;
  }
}

checkSchema()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
