#!/usr/bin/env node

/**
 * Seed basic locations for Costa Rica wedding
 * 
 * Creates a hierarchical location structure:
 * - Country: Costa Rica
 * - Regions: Guanacaste, San José
 * - Cities: Tamarindo, Liberia, San José City
 * - Venues: Beach venues, hotels, etc.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const locations = [
  // Country
  {
    name: 'Costa Rica',
    type: 'country',
    parent_id: null,
    description: 'Beautiful Central American country',
  },
  // Regions
  {
    name: 'Guanacaste',
    type: 'region',
    parent_name: 'Costa Rica',
    description: 'Pacific coast region known for beaches',
  },
  {
    name: 'San José Province',
    type: 'region',
    parent_name: 'Costa Rica',
    description: 'Central region with the capital city',
  },
  // Cities
  {
    name: 'Tamarindo',
    type: 'city',
    parent_name: 'Guanacaste',
    description: 'Popular beach town',
  },
  {
    name: 'Liberia',
    type: 'city',
    parent_name: 'Guanacaste',
    description: 'Gateway city with international airport (LIR)',
  },
  {
    name: 'San José',
    type: 'city',
    parent_name: 'San José Province',
    description: 'Capital city with international airport (SJO)',
  },
  // Venues
  {
    name: 'Tamarindo Beach',
    type: 'venue',
    parent_name: 'Tamarindo',
    description: 'Beautiful beach for ceremonies',
  },
  {
    name: 'Langosta Beach Club',
    type: 'venue',
    parent_name: 'Tamarindo',
    description: 'Beachfront venue with restaurant',
  },
  {
    name: 'Hotel Capitan Suizo',
    type: 'venue',
    parent_name: 'Tamarindo',
    description: 'Boutique beachfront hotel',
  },
  {
    name: 'JW Marriott Guanacaste',
    type: 'venue',
    parent_name: 'Guanacaste',
    description: 'Luxury resort',
  },
];

async function seedLocations() {
  console.log('🌴 Seeding Costa Rica locations...\n');

  // First, check if locations already exist
  const { data: existing, error: checkError } = await supabase
    .from('locations')
    .select('name')
    .limit(1);

  if (checkError) {
    console.error('❌ Error checking existing locations:', checkError.message);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log('⚠️  Locations already exist. Skipping seed.');
    console.log('   To re-seed, delete existing locations first.');
    return;
  }

  // Create a map to store created location IDs
  const locationIds = new Map();

  // Insert locations in order (parents before children)
  for (const location of locations) {
    const { parent_name, ...locationData } = location;

    // If this location has a parent, look up the parent ID
    if (parent_name) {
      const parentId = locationIds.get(parent_name);
      if (!parentId) {
        console.error(`❌ Parent location "${parent_name}" not found for "${location.name}"`);
        continue;
      }
      locationData.parent_id = parentId;
    }

    // Insert the location
    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting "${location.name}":`, error.message);
      continue;
    }

    // Store the ID for child locations
    locationIds.set(location.name, data.id);
    console.log(`✅ Created: ${location.name} (${location.type})`);
  }

  console.log(`\n✨ Successfully seeded ${locationIds.size} locations!`);
  console.log('\nLocation hierarchy:');
  console.log('📍 Costa Rica');
  console.log('  ├─ Guanacaste (region)');
  console.log('  │  ├─ Tamarindo (city)');
  console.log('  │  │  ├─ Tamarindo Beach (venue)');
  console.log('  │  │  ├─ Langosta Beach Club (venue)');
  console.log('  │  │  └─ Hotel Capitan Suizo (venue)');
  console.log('  │  ├─ Liberia (city)');
  console.log('  │  └─ JW Marriott Guanacaste (venue)');
  console.log('  └─ San José Province (region)');
  console.log('     └─ San José (city)');
}

// Run the seed
seedLocations()
  .then(() => {
    console.log('\n✅ Seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
