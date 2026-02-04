#!/usr/bin/env node

/**
 * Check Photo URLs in Database
 * 
 * This script checks what URLs are actually stored in the database
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPhotoUrls() {
  console.log('🔍 Checking photo URLs in database...\n');

  // Get all photos
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, photo_url, storage_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching photos:', error.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log('No photos found in database');
    return;
  }

  console.log(`Found ${photos.length} most recent photo(s):\n`);

  photos.forEach((photo, index) => {
    console.log(`Photo ${index + 1}:`);
    console.log(`  ID: ${photo.id}`);
    console.log(`  Storage: ${photo.storage_type}`);
    console.log(`  URL: ${photo.photo_url}`);
    console.log(`  Created: ${new Date(photo.created_at).toLocaleString()}`);
    
    // Check URL format
    if (photo.photo_url.includes('/file/')) {
      console.log(`  ⚠️  Contains /file/ path`);
    }
    if (photo.photo_url.includes('wedding-photos-2026-jamara')) {
      console.log(`  ⚠️  Contains bucket name in path`);
    }
    console.log('');
  });

  // Count by storage type
  const { data: b2Photos } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('storage_type', 'b2');

  const { data: supabasePhotos } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('storage_type', 'supabase');

  console.log('📊 Storage distribution:');
  console.log(`  B2: ${b2Photos?.length || 0} photos`);
  console.log(`  Supabase: ${supabasePhotos?.length || 0} photos`);
}

checkPhotoUrls().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
