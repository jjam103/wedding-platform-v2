#!/usr/bin/env node

/**
 * Find ALL photos with bad URLs - regardless of storage_type
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findBadUrls() {
  console.log('🔍 Searching for photos with /file/wedding-photos-2026-jamara/ in URL...\n');

  // Search for ANY photo with the bad URL pattern
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, photo_url, storage_type, caption, created_at')
    .or('photo_url.like.%/file/wedding-photos-2026-jamara/%,photo_url.like.%cdn.jamara.us/wedding-photos-2026-jamara/%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log('✅ No photos found with bad URL format!\n');
    
    // Show all photos for debugging
    console.log('📸 Showing ALL photos in database:\n');
    const { data: allPhotos, error: allError } = await supabase
      .from('photos')
      .select('id, photo_url, storage_type, caption')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ Error:', allError.message);
      return;
    }
    
    if (!allPhotos || allPhotos.length === 0) {
      console.log('   No photos in database.\n');
      return;
    }
    
    allPhotos.forEach((photo, index) => {
      console.log(`${index + 1}. ${photo.storage_type}: ${photo.photo_url}`);
    });
    console.log('');
    return;
  }

  console.log(`⚠️  Found ${photos.length} photo(s) with bad URLs:\n`);

  photos.forEach((photo, index) => {
    console.log(`${index + 1}. Photo ID: ${photo.id}`);
    console.log(`   Storage Type: ${photo.storage_type}`);
    console.log(`   URL: ${photo.photo_url}`);
    console.log(`   Caption: ${photo.caption || '(none)'}`);
    console.log(`   Created: ${new Date(photo.created_at).toLocaleString()}`);
    console.log('');
  });

  console.log('🔧 Run this to fix them:');
  console.log('   node scripts/fix-b2-photo-urls.mjs\n');
}

findBadUrls().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
