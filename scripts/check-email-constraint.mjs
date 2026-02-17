#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmailConstraint() {
  console.log('🔍 Checking email constraint on guests table...\n');
  
  // Get all check constraints on guests table
  const { data: constraints, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          conname AS constraint_name,
          pg_get_constraintdef(oid) AS constraint_definition
        FROM pg_constraint
        WHERE conrelid = 'guests'::regclass
          AND contype = 'c'
        ORDER BY conname;
      `
    });
  
  if (error) {
    console.log('❌ Error querying constraints:', error.message);
    console.log('\nTrying alternative method...\n');
    
    // Try using information_schema
    const { data: altData, error: altError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            constraint_name,
            check_clause
          FROM information_schema.check_constraints
          WHERE constraint_schema = 'public'
            AND constraint_name LIKE '%guest%'
          ORDER BY constraint_name;
        `
      });
    
    if (altError) {
      console.log('❌ Alternative method also failed:', altError.message);
      return;
    }
    
    console.log('Constraints found:', JSON.stringify(altData, null, 2));
    return;
  }
  
  console.log('Constraints found:', JSON.stringify(constraints, null, 2));
}

checkEmailConstraint().catch(console.error);
