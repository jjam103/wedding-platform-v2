#!/usr/bin/env node

/**
 * Test script to diagnose reference API endpoint
 * Tests with authenticated guest user using cookies (not Bearer token)
 * This replicates the E2E test scenario exactly
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReferenceAPI() {
  console.log('🔍 Testing Reference API Endpoint with Cookies\n');

  // 1. Create test location
  console.log('1️⃣  Creating test location...');
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .insert({
      name: 'API Test Location',
      type: 'venue',
      description: 'Test location for API diagnostics',
    })
    .select()
    .single();

  if (locationError) {
    console.error('❌ Failed to create location:', locationError);
    return;
  }
  console.log('✅ Location created:', location.id);

  // 2. Create test event
  console.log('\n2️⃣  Creating test event...');
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      name: 'API Test Event',
      slug: `api-test-event-${Date.now()}`,
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'ceremony',
      description: 'Test event for API diagnostics',
      status: 'published',
      location_id: location.id,
    })
    .select()
    .single();

  if (eventError) {
    console.error('❌ Failed to create event:', eventError);
    return;
  }
  console.log('✅ Event created:', event.id);

  // 3. Create guest user
  console.log('\n3️⃣  Creating guest user...');
  const testEmail = `api-test-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';

  const { data: guestUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (createUserError) {
    console.error('❌ Failed to create guest user:', createUserError);
    return;
  }
  console.log('✅ Guest user created:', guestUser.user.id);

  // 4. Sign in as guest
  console.log('\n4️⃣  Signing in as guest...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('❌ Failed to sign in:', signInError);
    return;
  }
  console.log('✅ Guest signed in');

  // 5. Create cookie in Supabase format (base64-encoded)
  console.log('\n5️⃣  Creating Supabase auth cookie...');
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Could not extract project ref from URL');
    return;
  }

  const cookieValue = {
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    expires_at: signInData.session.expires_at,
    expires_in: signInData.session.expires_in,
    token_type: 'bearer',
    user: signInData.session.user,
  };

  const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');
  const cookieString = `sb-${projectRef}-auth-token=base64-${base64Value}`;
  
  console.log('✅ Cookie created');
  console.log('   Cookie name:', `sb-${projectRef}-auth-token`);
  console.log('   Cookie value (first 50 chars):', `base64-${base64Value}`.substring(0, 50) + '...');

  // 6. Test API endpoint with cookie
  console.log('\n6️⃣  Testing API endpoint with cookie...');
  console.log(`   URL: http://localhost:3000/api/admin/references/event/${event.id}`);

  try {
    const response = await fetch(`http://localhost:3000/api/admin/references/event/${event.id}`, {
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ API endpoint working correctly with cookies!');
      console.log('   Event name:', data.data.name);
      console.log('   Event description:', data.data.details.description);
      console.log('   Location:', data.data.details.location);
    } else {
      console.log('\n❌ API endpoint returned error');
      console.log('   Error code:', data.error?.code);
      console.log('   Error message:', data.error?.message);
    }
  } catch (error) {
    console.error('\n❌ Failed to call API:', error.message);
  }

  // 7. Cleanup
  console.log('\n7️⃣  Cleaning up...');
  await supabase.auth.admin.deleteUser(guestUser.user.id);
  await supabase.from('events').delete().eq('id', event.id);
  await supabase.from('locations').delete().eq('id', location.id);
  console.log('✅ Cleanup complete');
}

testReferenceAPI().catch(console.error);
