#!/usr/bin/env node

/**
 * Check if slug migration has been applied to test database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.test');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigration() {
  console.log('Checking slug migration status...\n');

  // Check if slug column exists on events table
  const { data: eventsColumns, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (eventsError) {
    console.error('Error querying events table:', eventsError);
  } else {
    const hasSlugColumn = eventsColumns && eventsColumns.length > 0 && 'slug' in eventsColumns[0];
    console.log(`Events table has slug column: ${hasSlugColumn ? '✅ YES' : '❌ NO'}`);
  }

  // Check if slug column exists on activities table
  const { data: activitiesColumns, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .limit(1);

  if (activitiesError) {
    console.error('Error querying activities table:', activitiesError);
  } else {
    const hasSlugColumn = activitiesColumns && activitiesColumns.length > 0 && 'slug' in activitiesColumns[0];
    console.log(`Activities table has slug column: ${hasSlugColumn ? '✅ YES' : '❌ NO'}`);
  }

  // Check if trigger function exists
  const { data: functions, error: functionsError } = await supabase.rpc('pg_get_functiondef', {
    funcid: 'generate_slug_from_name'
  });

  if (functionsError) {
    console.log('\nTrigger function check: ❌ Function does not exist or cannot be queried');
  } else {
    console.log('\nTrigger function check: ✅ Function exists');
  }

  // Try to insert a test event to see if trigger works
  console.log('\nTesting trigger by inserting test event...');
  const { data: testEvent, error: insertError } = await supabase
    .from('events')
    .insert({
      name: 'Test Slug Generation',
      event_type: 'ceremony',
      start_date: new Date().toISOString(),
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting test event:', insertError);
  } else {
    console.log('Test event inserted successfully');
    console.log('Generated slug:', testEvent?.slug || 'NO SLUG GENERATED');
    
    // Clean up
    if (testEvent?.id) {
      await supabase.from('events').delete().eq('id', testEvent.id);
      console.log('Test event cleaned up');
    }
  }
}

checkMigration().catch(console.error);
