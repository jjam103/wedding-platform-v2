#!/usr/bin/env node

/**
 * Diagnostic script for E2E reference blocks test
 * Checks if test data is visible and accessible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create service client (bypasses RLS)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Create anon client (uses RLS)
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Diagnosing E2E Reference Blocks Test\n');

  // Generate unique ID like the test does
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log('1️⃣ Creating test data...');
  
  // Create test event
  const { data: event, error: eventError } = await serviceClient
    .from('events')
    .insert({
      name: 'Test Event for References',
      slug: `test-event-ref-${uniqueId}`,
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'ceremony',
      description: 'Test event for reference blocks',
      status: 'published',
    })
    .select()
    .single();
  
  if (eventError) {
    console.error('❌ Failed to create event:', eventError.message);
    return;
  }
  console.log('✅ Created event:', event.id);

  // Create test activity
  const { data: activity, error: activityError } = await serviceClient
    .from('activities')
    .insert({
      name: 'Test Activity for References',
      slug: `test-activity-ref-${uniqueId}`,
      event_id: event.id,
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      activity_type: 'activity',
      description: 'Test activity for reference blocks',
      status: 'published',
    })
    .select()
    .single();
  
  if (activityError) {
    console.error('❌ Failed to create activity:', activityError.message);
    return;
  }
  console.log('✅ Created activity:', activity.id);

  // Create test content page
  const { data: contentPage, error: contentPageError } = await serviceClient
    .from('content_pages')
    .insert({
      title: 'Test Content Page',
      slug: `test-page-ref-${uniqueId}`,
      status: 'published',
    })
    .select()
    .single();
  
  if (contentPageError) {
    console.error('❌ Failed to create content page:', contentPageError.message);
    return;
  }
  console.log('✅ Created content page:', contentPage.id);

  console.log('\n2️⃣ Checking data visibility with service client (bypasses RLS)...');
  
  const { data: servicePages, error: serviceError } = await serviceClient
    .from('content_pages')
    .select('*')
    .eq('id', contentPage.id);
  
  console.log('Service client result:', servicePages ? `Found ${servicePages.length} pages` : 'No pages found');
  if (serviceError) console.error('Service client error:', serviceError.message);

  console.log('\n3️⃣ Checking data visibility with anon client (uses RLS)...');
  
  const { data: anonPages, error: anonError } = await anonClient
    .from('content_pages')
    .select('*')
    .eq('id', contentPage.id);
  
  console.log('Anon client result:', anonPages ? `Found ${anonPages.length} pages` : 'No pages found');
  if (anonError) console.error('Anon client error:', anonError.message);

  console.log('\n4️⃣ Checking RLS policies on content_pages table...');
  
  const { data: policies, error: policiesError } = await serviceClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'content_pages');
  
  if (policiesError) {
    console.error('❌ Failed to fetch policies:', policiesError.message);
  } else {
    console.log(`Found ${policies?.length || 0} RLS policies:`);
    policies?.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd}): ${policy.qual || 'No condition'}`);
    });
  }

  console.log('\n5️⃣ Simulating API call to /api/admin/content-pages...');
  
  // This simulates what the API route does
  const { data: apiPages, error: apiError } = await serviceClient
    .from('content_pages')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('API simulation result:', apiPages ? `Found ${apiPages.length} pages` : 'No pages found');
  if (apiError) console.error('API simulation error:', apiError.message);
  
  if (apiPages && apiPages.length > 0) {
    console.log('\nRecent pages:');
    apiPages.slice(0, 5).forEach(page => {
      console.log(`  - ${page.title} (${page.slug}) - ${page.status}`);
    });
  }

  console.log('\n6️⃣ Cleaning up test data...');
  
  await serviceClient.from('activities').delete().eq('id', activity.id);
  await serviceClient.from('events').delete().eq('id', event.id);
  await serviceClient.from('content_pages').delete().eq('id', contentPage.id);
  
  console.log('✅ Cleanup complete');
}

main().catch(console.error);
