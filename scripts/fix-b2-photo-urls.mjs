#!/usr/bin/env node

/**
 * Fix B2 Photo URLs in Database
 * 
 * This script fixes photo URLs that have the incorrect format:
 * ❌ https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/...
 * ✅ https://cdn.jamara.us/photos/...
 * 
 * The extra /file/wedding-photos-2026-jamara/ path was added by an older
 * version of the code and needs to be removed.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPhotoUrls() {
  console.log('🔍 Checking for photos with incorrect URL format...\n');

  // Find all photos with B2 storage that have the incorrect URL format
  const { data: photos, error: fetchError } = await supabase
    .from('photos')
    .select('id, photo_url, storage_type')
    .eq('storage_type', 'b2')
    .like('photo_url', '%/file/wedding-photos-2026-jamara/%');

  if (fetchError) {
    console.error('❌ Error fetching photos:', fetchError.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log('✅ No photos found with incorrect URL format');
    console.log('All B2 photo URLs are correct!');
    return;
  }

  console.log(`Found ${photos.length} photo(s) with incorrect URL format:\n`);

  // Show examples
  photos.slice(0, 3).forEach((photo, index) => {
    console.log(`Example ${index + 1}:`);
    console.log(`  ID: ${photo.id}`);
    console.log(`  ❌ Old: ${photo.photo_url}`);
    const newUrl = photo.photo_url.replace('/file/wedding-photos-2026-jamara/', '/');
    console.log(`  ✅ New: ${newUrl}`);
    console.log('');
  });

  // Ask for confirmation
  console.log(`\n⚠️  About to update ${photos.length} photo URL(s)`);
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🔧 Updating photo URLs...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const photo of photos) {
    const newUrl = photo.photo_url.replace('/file/wedding-photos-2026-jamara/', '/');

    const { error: updateError } = await supabase
      .from('photos')
      .update({ photo_url: newUrl })
      .eq('id', photo.id);

    if (updateError) {
      console.error(`❌ Failed to update photo ${photo.id}:`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ Updated photo ${photo.id}`);
      successCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Successfully updated: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📝 Total processed: ${photos.length}`);

  if (successCount > 0) {
    console.log('\n✨ Photo URLs have been fixed!');
    console.log('Images should now load correctly in the browser.');
  }
}

// Run the script
fixPhotoUrls().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
