#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

console.log('🔍 Testing RLS policies with anon client...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Query events with status = 'published'
console.log('Test 1: Query published events');
const { data: events, error: eventsError } = await supabase
  .from('events')
  .select('id, name, status, deleted_at')
  .eq('status', 'published')
  .is('deleted_at', null)
  .limit(5);

if (eventsError) {
  console.error('❌ Events query failed:', eventsError);
} else {
  console.log(`✅ Found ${events.length} published events`);
  events.forEach(e => console.log(`   - ${e.name} (${e.id})`));
}

// Test 2: Query specific event by ID
console.log('\nTest 2: Query specific event by ID');
const testEventId = '1ac98fde-8f65-4c2c-8259-ad92286e873f';
const { data: event, error: eventError } = await supabase
  .from('events')
  .select('*')
  .eq('id', testEventId)
  .eq('status', 'published')
  .is('deleted_at', null)
  .single();

if (eventError) {
  console.error(`❌ Event query failed:`, eventError);
} else if (!event) {
  console.log('❌ Event not found');
} else {
  console.log(`✅ Event found: ${event.name}`);
  console.log(`   Status: ${event.status}`);
  console.log(`   Deleted: ${event.deleted_at}`);
}

// Test 3: Query activities
console.log('\nTest 3: Query published activities');
const { data: activities, error: activitiesError } = await supabase
  .from('activities')
  .select('id, name, status, deleted_at')
  .eq('status', 'published')
  .is('deleted_at', null)
  .limit(5);

if (activitiesError) {
  console.error('❌ Activities query failed:', activitiesError);
} else {
  console.log(`✅ Found ${activities.length} published activities`);
  activities.forEach(a => console.log(`   - ${a.name} (${a.id})`));
}

// Test 4: Check RLS policies
console.log('\nTest 4: Check RLS policies');
const { data: policies, error: policiesError } = await supabase
  .from('pg_policies')
  .select('tablename, policyname, permissive, roles, cmd')
  .in('tablename', ['events', 'activities', 'content_pages', 'accommodations', 'locations']);

if (policiesError) {
  console.error('❌ Policies query failed:', policiesError);
} else {
  console.log(`✅ Found ${policies.length} RLS policies`);
  const publicPolicies = policies.filter(p => p.roles?.includes('anon'));
  console.log(`   ${publicPolicies.length} policies allow anon access`);
}

console.log('\n✅ Diagnostic complete');
