#!/usr/bin/env node

/**
 * Debug script to test RSVP service directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Debugging RSVP Service');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '✓ Present' : '✗ Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRSVPQuery() {
  try {
    console.log('\n📊 Testing RSVP query with joins...');
    
    // Test the exact query from the service
    let query = supabase
      .from('rsvps')
      .select(`
        id,
        guest_id,
        event_id,
        activity_id,
        status,
        guest_count,
        dietary_notes,
        special_requirements,
        notes,
        responded_at,
        created_at,
        updated_at,
        guests!inner (
          first_name,
          last_name,
          email
        ),
        events (
          name
        ),
        activities (
          name
        )
      `, { count: 'exact' });

    // Apply pagination
    query = query.range(0, 49);
    
    // Order by created_at
    query = query.order('created_at', { ascending: false });

    console.log('Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log('✅ Query successful!');
    console.log('Count:', count);
    console.log('Data length:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\nFirst RSVP:', JSON.stringify(data[0], null, 2));
    }

    // Test with search (no pagination at DB level)
    console.log('\n📊 Testing RSVP query WITHOUT pagination (for search)...');
    
    let searchQuery = supabase
      .from('rsvps')
      .select(`
        id,
        guest_id,
        event_id,
        activity_id,
        status,
        guest_count,
        dietary_notes,
        special_requirements,
        notes,
        responded_at,
        created_at,
        updated_at,
        guests!inner (
          first_name,
          last_name,
          email
        ),
        events (
          name
        ),
        activities (
          name
        )
      `, { count: 'exact' });

    // NO pagination - fetch all
    searchQuery = searchQuery.order('created_at', { ascending: false });

    console.log('Executing search query...');
    const { data: searchData, error: searchError, count: searchCount } = await searchQuery;

    if (searchError) {
      console.error('❌ Search query error:', searchError);
      return;
    }

    console.log('✅ Search query successful!');
    console.log('Count:', searchCount);
    console.log('Data length:', searchData?.length || 0);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testRSVPQuery();
