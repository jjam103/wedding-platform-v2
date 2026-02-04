#!/usr/bin/env node

/**
 * Diagnostic script to identify why images are showing as black boxes
 * 
 * This script checks:
 * 1. Supabase Storage bucket accessibility
 * 2. B2 bucket accessibility
 * 3. Image URLs and content types
 * 4. CORS configuration
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import https from 'https';
import http from 'http';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

console.log('🔍 Image Visibility Diagnostic\n');
console.log('=' .repeat(60));

// Helper to make HTTP requests
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        accessible: res.statusCode === 200,
      });
    }).on('error', (err) => {
      resolve({
        statusCode: null,
        headers: {},
        accessible: false,
        error: err.message,
      });
    });
  });
}

// Check Supabase configuration
console.log('\n1. Supabase Configuration');
console.log('-'.repeat(60));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log(`✓ Supabase URL: ${SUPABASE_URL}`);
console.log(`✓ Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Check Supabase Storage bucket
console.log('\n2. Supabase Storage Bucket');
console.log('-'.repeat(60));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

try {
  // List buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log(`❌ Error listing buckets: ${bucketsError.message}`);
  } else {
    const photosBucket = buckets.find(b => b.name === 'photos');
    
    if (photosBucket) {
      console.log(`✓ Photos bucket exists`);
      console.log(`  - Name: ${photosBucket.name}`);
      console.log(`  - Public: ${photosBucket.public ? 'Yes' : 'No'}`);
      console.log(`  - Created: ${photosBucket.created_at}`);
      
      if (!photosBucket.public) {
        console.log('\n⚠️  WARNING: Photos bucket is NOT public!');
        console.log('   This is likely why images are showing as black boxes.');
        console.log('   Fix: Go to Supabase Dashboard → Storage → photos → Make Public');
      }
    } else {
      console.log('❌ Photos bucket does NOT exist');
      console.log('   Fix: Create a public bucket named "photos" in Supabase Dashboard');
    }
  }
} catch (error) {
  console.log(`❌ Error checking Supabase Storage: ${error.message}`);
}

// Check photos in database
console.log('\n3. Photos in Database');
console.log('-'.repeat(60));

try {
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .limit(5);
  
  if (photosError) {
    console.log(`❌ Error fetching photos: ${photosError.message}`);
  } else if (!photos || photos.length === 0) {
    console.log('⚠️  No photos found in database');
  } else {
    console.log(`✓ Found ${photos.length} photos`);
    
    // Analyze first photo
    const firstPhoto = photos[0];
    console.log(`\nFirst photo details:`);
    console.log(`  - ID: ${firstPhoto.id}`);
    console.log(`  - URL: ${firstPhoto.photo_url}`);
    console.log(`  - Storage: ${firstPhoto.storage_type}`);
    console.log(`  - Status: ${firstPhoto.moderation_status}`);
    
    // Check if URL is accessible
    console.log(`\n  Testing URL accessibility...`);
    const urlCheck = await checkUrl(firstPhoto.photo_url);
    
    if (urlCheck.accessible) {
      console.log(`  ✓ URL is accessible (HTTP ${urlCheck.statusCode})`);
      console.log(`  ✓ Content-Type: ${urlCheck.headers['content-type']}`);
      console.log(`  ✓ Content-Length: ${urlCheck.headers['content-length']} bytes`);
      
      // Check CORS headers
      if (urlCheck.headers['access-control-allow-origin']) {
        console.log(`  ✓ CORS enabled: ${urlCheck.headers['access-control-allow-origin']}`);
      } else {
        console.log(`  ⚠️  No CORS headers found`);
        console.log(`     This might cause issues in the browser`);
      }
    } else {
      console.log(`  ❌ URL is NOT accessible`);
      console.log(`     Status: ${urlCheck.statusCode || 'Connection failed'}`);
      if (urlCheck.error) {
        console.log(`     Error: ${urlCheck.error}`);
      }
      console.log(`\n  🔴 THIS IS THE PROBLEM!`);
      console.log(`     Images cannot load because the URL returns an error.`);
    }
    
    // Check storage distribution
    const b2Count = photos.filter(p => p.storage_type === 'b2').length;
    const supabaseCount = photos.filter(p => p.storage_type === 'supabase').length;
    
    console.log(`\nStorage distribution:`);
    console.log(`  - B2: ${b2Count} photos`);
    console.log(`  - Supabase: ${supabaseCount} photos`);
    
    if (b2Count === 0 && supabaseCount > 0) {
      console.log(`\n  ⚠️  All photos are in Supabase (none in B2)`);
      console.log(`     This means B2 upload is failing`);
    }
  }
} catch (error) {
  console.log(`❌ Error checking photos: ${error.message}`);
}

// Check B2 configuration
console.log('\n4. B2 Storage Configuration');
console.log('-'.repeat(60));

if (!B2_ACCESS_KEY_ID || !B2_SECRET_ACCESS_KEY || !B2_BUCKET_NAME) {
  console.log('⚠️  B2 not configured (using Supabase Storage only)');
  console.log('   Missing: B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY, or B2_BUCKET_NAME');
} else {
  console.log(`✓ B2 Access Key ID: ${B2_ACCESS_KEY_ID}`);
  console.log(`✓ B2 Bucket: ${B2_BUCKET_NAME}`);
  console.log(`✓ B2 Endpoint: ${B2_ENDPOINT}`);
  console.log(`✓ B2 Region: ${B2_REGION}`);
  
  // Test B2 connection
  console.log(`\nTesting B2 connection...`);
  
  try {
    const s3Client = new S3Client({
      endpoint: B2_ENDPOINT,
      region: B2_REGION,
      credentials: {
        accessKeyId: B2_ACCESS_KEY_ID,
        secretAccessKey: B2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
    
    const command = new HeadBucketCommand({
      Bucket: B2_BUCKET_NAME,
    });
    
    await s3Client.send(command);
    console.log(`✓ B2 bucket is accessible`);
  } catch (error) {
    console.log(`❌ B2 bucket is NOT accessible`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.$metadata?.httpStatusCode || 'Unknown'}`);
    
    if (error.$metadata?.httpStatusCode === 403) {
      console.log(`\n  🔴 HTTP 403 Forbidden - This is the B2 problem!`);
      console.log(`     Possible causes:`);
      console.log(`     1. Wrong access key ID or secret key`);
      console.log(`     2. Application key doesn't have permission for this bucket`);
      console.log(`     3. Bucket doesn't exist or name is wrong`);
      console.log(`\n     Fix:`);
      console.log(`     1. Log into Backblaze B2 console`);
      console.log(`     2. Verify bucket "${B2_BUCKET_NAME}" exists`);
      console.log(`     3. Check application key has these capabilities:`);
      console.log(`        - listBuckets, listFiles, readFiles, writeFiles`);
      console.log(`     4. Create new key if needed and update .env.local`);
    }
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

console.log(`\n📋 Checklist:`);
console.log(`   [ ] Supabase photos bucket exists and is PUBLIC`);
console.log(`   [ ] Photo URLs are accessible (HTTP 200)`);
console.log(`   [ ] CORS headers are present`);
console.log(`   [ ] B2 bucket is accessible (if using B2)`);
console.log(`   [ ] Application key has correct permissions`);

console.log(`\n🔧 Next Steps:`);
console.log(`   1. If Supabase bucket is not public → Make it public`);
console.log(`   2. If photo URLs return 403/404 → Check bucket permissions`);
console.log(`   3. If B2 returns 403 → Fix B2 credentials/permissions`);
console.log(`   4. Hard refresh browser (Cmd+Shift+R) to clear cache`);
console.log(`   5. Check browser console for CORS errors`);

console.log(`\n📖 Full guide: See URGENT_IMAGE_VISIBILITY_FIX.md\n`);
