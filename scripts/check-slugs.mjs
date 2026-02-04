#!/usr/bin/env node

/**
 * Check Slugs Diagnostic Script
 * 
 * Checks if events and activities have slugs in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSlugs() {
  console.log('🔍 Checking slugs in database...\n');
  
  // Check events
  console.log('📅 EVENTS:');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError.message);
  } else if (!events || events.length === 0) {
    console.log('  No events found');
  } else {
    const withSlug = events.filter(e => e.slug);
    const withoutSlug = events.filter(e => !e.slug);
    
    console.log(`  Total: ${events.length}`);
    console.log(`  With slug: ${withSlug.length}`);
    console.log(`  Without slug: ${withoutSlug.length}`);
    
    if (withoutSlug.length > 0) {
      console.log('\n  ⚠️  Events missing slugs:');
      withoutSlug.forEach(e => {
        console.log(`    - ${e.name} (ID: ${e.id})`);
      });
    }
    
    if (withSlug.length > 0) {
      console.log('\n  ✅ Sample events with slugs:');
      withSlug.slice(0, 3).forEach(e => {
        console.log(`    - ${e.name} → /event/${e.slug}`);
      });
    }
  }
  
  console.log('\n🎯 ACTIVITIES:');
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (activitiesError) {
    console.error('❌ Error fetching activities:', activitiesError.message);
  } else if (!activities || activities.length === 0) {
    console.log('  No activities found');
  } else {
    const withSlug = activities.filter(a => a.slug);
    const withoutSlug = activities.filter(a => !a.slug);
    
    console.log(`  Total: ${activities.length}`);
    console.log(`  With slug: ${withSlug.length}`);
    console.log(`  Without slug: ${withoutSlug.length}`);
    
    if (withoutSlug.length > 0) {
      console.log('\n  ⚠️  Activities missing slugs:');
      withoutSlug.forEach(a => {
        console.log(`    - ${a.name} (ID: ${a.id})`);
      });
    }
    
    if (withSlug.length > 0) {
      console.log('\n  ✅ Sample activities with slugs:');
      withSlug.slice(0, 3).forEach(a => {
        console.log(`    - ${a.name} → /activity/${a.slug}`);
      });
    }
  }
  
  console.log('\n🏨 ACCOMMODATIONS:');
  const { data: accommodations, error: accommodationsError } = await supabase
    .from('accommodations')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (accommodationsError) {
    console.error('❌ Error fetching accommodations:', accommodationsError.message);
  } else if (!accommodations || accommodations.length === 0) {
    console.log('  No accommodations found');
  } else {
    const withSlug = accommodations.filter(a => a.slug);
    const withoutSlug = accommodations.filter(a => !a.slug);
    
    console.log(`  Total: ${accommodations.length}`);
    console.log(`  With slug: ${withSlug.length}`);
    console.log(`  Without slug: ${withoutSlug.length}`);
    
    if (withoutSlug.length > 0) {
      console.log('\n  ⚠️  Accommodations missing slugs:');
      withoutSlug.forEach(a => {
        console.log(`    - ${a.name} (ID: ${a.id})`);
      });
    }
    
    if (withSlug.length > 0) {
      console.log('\n  ✅ Sample accommodations with slugs:');
      withSlug.slice(0, 3).forEach(a => {
        console.log(`    - ${a.name} → /accommodation/${a.slug}`);
      });
    }
  }
  
  console.log('\n🛏️  ROOM TYPES:');
  const { data: roomTypes, error: roomTypesError } = await supabase
    .from('room_types')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (roomTypesError) {
    console.error('❌ Error fetching room types:', roomTypesError.message);
  } else if (!roomTypes || roomTypes.length === 0) {
    console.log('  No room types found');
  } else {
    const withSlug = roomTypes.filter(r => r.slug);
    const withoutSlug = roomTypes.filter(r => !r.slug);
    
    console.log(`  Total: ${roomTypes.length}`);
    console.log(`  With slug: ${withSlug.length}`);
    console.log(`  Without slug: ${withoutSlug.length}`);
    
    if (withoutSlug.length > 0) {
      console.log('\n  ⚠️  Room types missing slugs:');
      withoutSlug.forEach(r => {
        console.log(`    - ${r.name} (ID: ${r.id})`);
      });
    }
    
    if (withSlug.length > 0) {
      console.log('\n  ✅ Sample room types with slugs:');
      withSlug.slice(0, 3).forEach(r => {
        console.log(`    - ${r.name} → /room-type/${r.slug}`);
      });
    }
  }
  
  console.log('\n📊 SUMMARY:');
  const eventsWithSlug = events?.filter(e => e.slug).length || 0;
  const eventsTotal = events?.length || 0;
  const activitiesWithSlug = activities?.filter(a => a.slug).length || 0;
  const activitiesTotal = activities?.length || 0;
  const accommodationsWithSlug = accommodations?.filter(a => a.slug).length || 0;
  const accommodationsTotal = accommodations?.length || 0;
  const roomTypesWithSlug = roomTypes?.filter(r => r.slug).length || 0;
  const roomTypesTotal = roomTypes?.length || 0;
  
  if (eventsTotal > 0 && eventsWithSlug === 0) {
    console.log('❌ No events have slugs - migration may not have run');
  } else if (eventsTotal > 0 && eventsWithSlug < eventsTotal) {
    console.log(`⚠️  Some events missing slugs (${eventsWithSlug}/${eventsTotal})`);
  } else if (eventsTotal > 0) {
    console.log(`✅ All events have slugs (${eventsWithSlug}/${eventsTotal})`);
  }
  
  if (activitiesTotal > 0 && activitiesWithSlug === 0) {
    console.log('❌ No activities have slugs - migration may not have run');
  } else if (activitiesTotal > 0 && activitiesWithSlug < activitiesTotal) {
    console.log(`⚠️  Some activities missing slugs (${activitiesWithSlug}/${activitiesTotal})`);
  } else if (activitiesTotal > 0) {
    console.log(`✅ All activities have slugs (${activitiesWithSlug}/${activitiesTotal})`);
  }
  
  if (accommodationsTotal > 0 && accommodationsWithSlug === 0) {
    console.log('❌ No accommodations have slugs - migration may not have run');
  } else if (accommodationsTotal > 0 && accommodationsWithSlug < accommodationsTotal) {
    console.log(`⚠️  Some accommodations missing slugs (${accommodationsWithSlug}/${accommodationsTotal})`);
  } else if (accommodationsTotal > 0) {
    console.log(`✅ All accommodations have slugs (${accommodationsWithSlug}/${accommodationsTotal})`);
  }
  
  if (roomTypesTotal > 0 && roomTypesWithSlug === 0) {
    console.log('❌ No room types have slugs - migration may not have run');
  } else if (roomTypesTotal > 0 && roomTypesWithSlug < roomTypesTotal) {
    console.log(`⚠️  Some room types missing slugs (${roomTypesWithSlug}/${roomTypesTotal})`);
  } else if (roomTypesTotal > 0) {
    console.log(`✅ All room types have slugs (${roomTypesWithSlug}/${roomTypesTotal})`);
  }
}

checkSlugs().catch(console.error);
