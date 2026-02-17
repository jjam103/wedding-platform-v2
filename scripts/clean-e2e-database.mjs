#!/usr/bin/env node

/**
 * Clean E2E Database
 * 
 * Removes all test data from the E2E database to ensure clean test runs.
 * Run this before running E2E tests if you suspect old data is causing issues.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.e2e');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
  console.log('🧹 Starting E2E database cleanup...\n');

  try {
    // Delete in order to respect foreign key constraints
    const tables = [
      'columns',
      'sections',
      'content_pages',
      'rsvps',
      'activities',
      'events',
      'room_types',
      'accommodations',
      'locations',
      'guests',
      'guest_groups',
      'photos',
      'email_queue',
      'audit_logs',
    ];

    for (const table of tables) {
      console.log(`🗑️  Cleaning ${table}...`);
      
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID
      
      if (error) {
        console.error(`   ❌ Error cleaning ${table}:`, error.message);
      } else {
        console.log(`   ✅ Cleaned ${table}`);
      }
    }

    console.log('\n✨ E2E database cleanup complete!');
    console.log('\n📊 Summary:');
    console.log('   All test data has been removed');
    console.log('   Database is ready for fresh E2E test runs');
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
