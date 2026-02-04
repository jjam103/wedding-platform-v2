#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findPhoto() {
  console.log('🔍 Searching for photo: 1770087981693-IMG_0627.jpeg\n');

  // Search for the photo by URL pattern
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .or(`photo_url.like.%1770087981693-IMG_0627.jpeg%`);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log('❌ Photo not found in database');
    console.log('\nThis photo may have been deleted or never existed.');
    return;
  }

  console.log(`Found ${photos.length} matching photo(s):\n`);

  photos.forEach((photo) => {
    console.log('Photo Details:');
    console.log(`  ID: ${photo.id}`);
    console.log(`  URL: ${photo.photo_url}`);
    console.log(`  Storage: ${photo.storage_type}`);
    console.log(`  Status: ${photo.moderation_status}`);
    console.log(`  Created: ${new Date(photo.created_at).toLocaleString()}`);
    console.log('');

    // Check if URL needs fixing
    if (photo.photo_url.includes('/file/wedding-photos-2026-jamara/')) {
      console.log('⚠️  This photo has the incorrect URL format!');
      const correctUrl = photo.photo_url.replace('/file/wedding-photos-2026-jamara/', '/');
      console.log(`  ❌ Current: ${photo.photo_url}`);
      console.log(`  ✅ Should be: ${correctUrl}`);
    } else {
      console.log('✅ URL format is correct');
    }
  });
}

findPhoto().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
