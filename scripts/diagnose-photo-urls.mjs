#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Diagnosing Photo URLs...\n');

// Get recent photos
const { data: photos, error } = await supabase
  .from('photos')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Error fetching photos:', error);
  process.exit(1);
}

console.log(`Found ${photos.length} recent photos:\n`);

photos.forEach((photo, index) => {
  console.log(`Photo ${index + 1}:`);
  console.log(`  ID: ${photo.id}`);
  console.log(`  Storage Type: ${photo.storage_type}`);
  console.log(`  URL: ${photo.photo_url}`);
  console.log(`  Created: ${photo.created_at}`);
  console.log(`  Caption: ${photo.caption || '(none)'}`);
  
  // Check URL format
  if (photo.photo_url.includes('backblazeb2.com')) {
    console.log(`  ⚠️  WARNING: Using direct B2 URL (not CDN)`);
  } else if (photo.photo_url.includes('cdn.jamara.us')) {
    console.log(`  ✓ Using CDN URL`);
  } else if (photo.photo_url.includes('supabase.co')) {
    console.log(`  ℹ️  Using Supabase Storage`);
  }
  console.log('');
});

// Check B2 configuration
console.log('\n📋 B2 Configuration:');
console.log(`  Endpoint: ${process.env.B2_ENDPOINT || '(not set)'}`);
console.log(`  Region: ${process.env.B2_REGION || '(not set)'}`);
console.log(`  Bucket: ${process.env.B2_BUCKET_NAME || '(not set)'}`);
console.log(`  CDN Domain: ${process.env.B2_CDN_DOMAIN || '(not set)'}`);
console.log(`  Access Key ID: ${process.env.B2_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set'}`);
console.log(`  Secret Key: ${process.env.B2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set'}`);

console.log('\n✅ Diagnosis complete');
