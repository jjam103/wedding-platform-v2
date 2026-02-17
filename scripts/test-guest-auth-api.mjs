#!/usr/bin/env node

/**
 * Test Guest Authentication API Routes
 * 
 * Tests the /api/guest-auth/* routes to verify they work correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testEmailMatchAuth() {
  console.log('\n🧪 Testing Email Match Authentication...\n');
  
  // Create test guest
  const testEmail = `test-${Date.now()}@example.com`;
  console.log(`📧 Creating test guest with email: ${testEmail}`);
  
  // Create group first
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: 'Test Group' })
    .select()
    .single();
  
  if (groupError) {
    console.error('❌ Failed to create group:', groupError);
    return false;
  }
  
  console.log(`✅ Created group: ${group.id}`);
  
  // Create guest
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      first_name: 'Test',
      last_name: 'Guest',
      email: testEmail,
      group_id: group.id,
      age_type: 'adult',
      guest_type: 'wedding_guest',
      auth_method: 'email_matching',
    })
    .select()
    .single();
  
  if (guestError) {
    console.error('❌ Failed to create guest:', guestError);
    return false;
  }
  
  console.log(`✅ Created guest: ${guest.id}`);
  
  // Test 1: Valid email
  console.log('\n📝 Test 1: Valid email authentication');
  const response1 = await fetch(`${API_BASE}/api/guest-auth/email-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  
  const data1 = await response1.json();
  console.log(`Status: ${response1.status}`);
  console.log(`Response:`, JSON.stringify(data1, null, 2));
  
  if (response1.status === 200 && data1.success) {
    console.log('✅ Valid email authentication works');
  } else {
    console.log('❌ Valid email authentication failed');
    return false;
  }
  
  // Test 2: Non-existent email
  console.log('\n📝 Test 2: Non-existent email');
  const response2 = await fetch(`${API_BASE}/api/guest-auth/email-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com' }),
  });
  
  const data2 = await response2.json();
  console.log(`Status: ${response2.status}`);
  console.log(`Response:`, JSON.stringify(data2, null, 2));
  
  if (response2.status === 404 && !data2.success) {
    console.log('✅ Non-existent email returns 404');
  } else {
    console.log('❌ Non-existent email should return 404');
    return false;
  }
  
  // Test 3: Invalid email format
  console.log('\n📝 Test 3: Invalid email format');
  const response3 = await fetch(`${API_BASE}/api/guest-auth/email-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid-email' }),
  });
  
  const data3 = await response3.json();
  console.log(`Status: ${response3.status}`);
  console.log(`Response:`, JSON.stringify(data3, null, 2));
  
  if (response3.status === 400 && !data3.success) {
    console.log('✅ Invalid email format returns 400');
  } else {
    console.log('❌ Invalid email format should return 400');
    return false;
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await supabase.from('guests').delete().eq('id', guest.id);
  await supabase.from('groups').delete().eq('id', group.id);
  console.log('✅ Cleanup complete');
  
  return true;
}

async function testMagicLinkAuth() {
  console.log('\n🧪 Testing Magic Link Authentication...\n');
  
  // Create test guest
  const testEmail = `test-magic-${Date.now()}@example.com`;
  console.log(`📧 Creating test guest with email: ${testEmail}`);
  
  // Create group first
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: 'Test Group Magic' })
    .select()
    .single();
  
  if (groupError) {
    console.error('❌ Failed to create group:', groupError);
    return false;
  }
  
  console.log(`✅ Created group: ${group.id}`);
  
  // Create guest
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      first_name: 'Test',
      last_name: 'Magic',
      email: testEmail,
      group_id: group.id,
      age_type: 'adult',
      guest_type: 'wedding_guest',
      auth_method: 'magic_link',
    })
    .select()
    .single();
  
  if (guestError) {
    console.error('❌ Failed to create guest:', guestError);
    return false;
  }
  
  console.log(`✅ Created guest: ${guest.id}`);
  
  // Test 1: Request magic link
  console.log('\n📝 Test 1: Request magic link');
  const response1 = await fetch(`${API_BASE}/api/guest-auth/magic-link/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  
  const data1 = await response1.json();
  console.log(`Status: ${response1.status}`);
  console.log(`Response:`, JSON.stringify(data1, null, 2));
  
  if (response1.status === 200 && data1.success) {
    console.log('✅ Magic link request works');
  } else {
    console.log('❌ Magic link request failed');
    return false;
  }
  
  // Get the token from database
  const { data: tokens } = await supabase
    .from('magic_link_tokens')
    .select('token')
    .eq('guest_id', guest.id)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!tokens || tokens.length === 0) {
    console.log('❌ No magic link token found in database');
    return false;
  }
  
  const token = tokens[0].token;
  console.log(`✅ Found token: ${token.substring(0, 16)}...`);
  
  // Test 2: Verify magic link
  console.log('\n📝 Test 2: Verify magic link');
  const response2 = await fetch(`${API_BASE}/api/guest-auth/magic-link/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  
  const data2 = await response2.json();
  console.log(`Status: ${response2.status}`);
  console.log(`Response:`, JSON.stringify(data2, null, 2));
  
  if (response2.status === 200 && data2.success) {
    console.log('✅ Magic link verification works');
  } else {
    console.log('❌ Magic link verification failed');
    return false;
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await supabase.from('magic_link_tokens').delete().eq('guest_id', guest.id);
  await supabase.from('guests').delete().eq('id', guest.id);
  await supabase.from('groups').delete().eq('id', group.id);
  console.log('✅ Cleanup complete');
  
  return true;
}

async function main() {
  console.log('🚀 Guest Authentication API Test Suite\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  let allPassed = true;
  
  // Test email match auth
  const emailMatchPassed = await testEmailMatchAuth();
  if (!emailMatchPassed) {
    allPassed = false;
  }
  
  // Test magic link auth
  const magicLinkPassed = await testMagicLinkAuth();
  if (!magicLinkPassed) {
    allPassed = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
