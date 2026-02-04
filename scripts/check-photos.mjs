#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPhotos() {
  console.log('🔍 Checking photos in database...\n');

  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching photos:', error);
    return;
  }

  if (!photos || photos.length === 0) {
    console.log('📭 No photos found in database');
    return;
  }

  console.log(`✅ Found ${photos.length} photos:\n`);

  photos.forEach((photo, index) => {
    console.log(`Photo ${index + 1}:`);
    console.log(`  ID: ${photo.id}`);
    console.log(`  URL: ${photo.photo_url}`);
    console.log(`  Storage: ${photo.storage_type}`);
    console.log(`  Status: ${photo.moderation_status}`);
    console.log(`  Page Type: ${photo.page_type}`);
    console.log(`  Caption: ${photo.caption || '(none)'}`);
    console.log('');
  });

  // Check if URLs are accessible
  console.log('🌐 Testing photo URL accessibility...\n');
  
  for (const photo of photos.slice(0, 3)) {
    try {
      const response = await fetch(photo.photo_url, { method: 'HEAD' });
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${photo.photo_url} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${photo.photo_url} - Error: ${error.message}`);
    }
  }
}

checkPhotos().catch(console.error);
