#!/usr/bin/env node

/**
 * Test script to verify guest reference API is working
 * Tests the /api/guest/references/[type]/[id] endpoint
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGuestReferenceAPI() {
  console.log('🧪 Testing Guest Reference API\n');

  // Step 1: Create a test event
  console.log('1️⃣  Creating test event...');
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      name: 'Test Event for API',
      description: 'This is a test event',
      event_type: 'ceremony',
      start_date: new Date().toISOString(),
      status: 'published',
    })
    .select()
    .single();

  if (eventError) {
    console.error('❌ Failed to create event:', eventError);
    return;
  }

  console.log(`✅ Event created: ${event.id}\n`);

  // Step 2: Test the API endpoint
  console.log('2️⃣  Testing API endpoint...');
  const apiUrl = `http://localhost:3000/api/guest/references/event/${event.id}`;
  console.log(`   URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API returned error: ${errorText}`);
      
      // Cleanup
      await supabase.from('events').delete().eq('id', event.id);
      return;
    }

    const result = await response.json();
    console.log('   Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ API returned success!');
      console.log(`   Event name: ${result.data.name}`);
      console.log(`   Event type: ${result.data.type}`);
      console.log(`   Has details: ${!!result.data.details}`);
    } else {
      console.log('\n❌ API returned failure:', result.error);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }

  // Step 3: Cleanup
  console.log('\n3️⃣  Cleaning up...');
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', event.id);

  if (deleteError) {
    console.error('❌ Failed to delete event:', deleteError);
  } else {
    console.log('✅ Test event deleted');
  }

  console.log('\n✨ Test complete!');
}

testGuestReferenceAPI().catch(console.error);
