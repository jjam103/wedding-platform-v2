#!/usr/bin/env node

/**
 * Diagnostic script to check B2 and photo storage issues
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 B2 Storage Diagnostic\n');

// Check B2 configuration
console.log('1. B2 Configuration:');
console.log('   ACCESS_KEY_ID:', process.env.B2_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
console.log('   SECRET_ACCESS_KEY:', process.env.B2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
console.log('   ENDPOINT:', process.env.B2_ENDPOINT || '✗ Missing');
console.log('   REGION:', process.env.B2_REGION || '✗ Missing');
console.log('   BUCKET_NAME:', process.env.B2_BUCKET_NAME || '✗ Missing');
console.log('   CDN_DOMAIN:', process.env.B2_CDN_DOMAIN || '✗ Missing');
console.log('');

// Test B2 connection
if (process.env.B2_ACCESS_KEY_ID && process.env.B2_SECRET_ACCESS_KEY && process.env.B2_BUCKET_NAME) {
  console.log('2. Testing B2 Connection:');
  try {
    const s3Client = new S3Client({
      endpoint: process.env.B2_ENDPOINT || `https://s3.${process.env.B2_REGION || 'us-west-004'}.backblazeb2.com`,
      region: process.env.B2_REGION || 'us-west-004',
      credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY_ID,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const headCommand = new HeadBucketCommand({
      Bucket: process.env.B2_BUCKET_NAME,
    });

    await s3Client.send(headCommand);
    console.log('   ✓ B2 bucket accessible');

    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      MaxKeys: 5,
    });

    const listResult = await s3Client.send(listCommand);
    console.log(`   ✓ Found ${listResult.KeyCount || 0} objects in bucket`);
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('   Sample objects:');
      listResult.Contents.slice(0, 3).forEach(obj => {
        console.log(`     - ${obj.Key} (${obj.Size} bytes)`);
      });
    }
  } catch (error) {
    console.log('   ✗ B2 connection failed:', error.message);
    console.log('   Error details:', error);
  }
  console.log('');
} else {
  console.log('2. B2 Connection: ✗ Skipped (missing credentials)\n');
}

// Check photos in database
console.log('3. Photos in Database:');
try {
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, photo_url, storage_type, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('   ✗ Database query failed:', error.message);
  } else if (!photos || photos.length === 0) {
    console.log('   ⚠ No photos found in database');
  } else {
    console.log(`   ✓ Found ${photos.length} recent photos:`);
    photos.forEach((photo, i) => {
      console.log(`\n   Photo ${i + 1}:`);
      console.log(`     ID: ${photo.id}`);
      console.log(`     Storage: ${photo.storage_type}`);
      console.log(`     URL: ${photo.photo_url}`);
      console.log(`     Caption: ${photo.caption || '(none)'}`);
      console.log(`     Created: ${new Date(photo.created_at).toLocaleString()}`);
      
      // Check URL format
      if (photo.photo_url.includes('backblazeb2.com') || photo.photo_url.includes('cdn.jamara.us')) {
        console.log(`     ✓ URL looks like B2`);
      } else if (photo.photo_url.includes('supabase.co')) {
        console.log(`     ✓ URL looks like Supabase Storage`);
      } else {
        console.log(`     ⚠ URL format unknown`);
      }
    });
  }
} catch (error) {
  console.log('   ✗ Error:', error.message);
}
console.log('');

// Check Supabase Storage bucket
console.log('4. Supabase Storage:');
try {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('   ✗ Failed to list buckets:', error.message);
  } else {
    console.log(`   ✓ Found ${buckets.length} storage buckets:`);
    buckets.forEach(bucket => {
      console.log(`     - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check photos bucket
    const photosBucket = buckets.find(b => b.name === 'photos');
    if (photosBucket) {
      const { data: files, error: filesError } = await supabase.storage
        .from('photos')
        .list('photos', { limit: 5 });
      
      if (filesError) {
        console.log('   ✗ Failed to list files:', filesError.message);
      } else {
        console.log(`   ✓ Photos bucket has ${files.length} files (showing first 5)`);
        files.forEach(file => {
          console.log(`     - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }
  }
} catch (error) {
  console.log('   ✗ Error:', error.message);
}
console.log('');

console.log('5. Recommendations:');
if (!process.env.B2_ACCESS_KEY_ID || !process.env.B2_SECRET_ACCESS_KEY) {
  console.log('   • Configure B2 credentials in .env.local');
}
console.log('   • Check browser console for image load errors');
console.log('   • Verify CORS settings on B2 bucket');
console.log('   • Check if CDN domain is correctly configured');
console.log('   • Try uploading a new photo to test current setup');
