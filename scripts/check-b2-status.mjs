#!/usr/bin/env node

/**
 * Check B2 storage status and circuit breaker state
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== B2 Storage Status Check ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log(`   B2_BUCKET_NAME: ${process.env.B2_BUCKET_NAME || 'NOT SET'}`);
console.log(`   B2_ACCESS_KEY_ID: ${process.env.B2_ACCESS_KEY_ID ? '✓ SET' : '✗ NOT SET'}`);
console.log(`   B2_SECRET_ACCESS_KEY: ${process.env.B2_SECRET_ACCESS_KEY ? '✓ SET' : '✗ NOT SET'}`);
console.log(`   B2_ENDPOINT: ${process.env.B2_ENDPOINT || 'NOT SET'}`);
console.log(`   B2_REGION: ${process.env.B2_REGION || 'NOT SET'}`);
console.log(`   B2_CDN_DOMAIN: ${process.env.B2_CDN_DOMAIN || 'NOT SET'}`);

// Check B2 connectivity
console.log('\n2. B2 Connectivity Test:');
try {
  const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: {
      accessKeyId: process.env.B2_ACCESS_KEY_ID,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  const command = new HeadBucketCommand({
    Bucket: process.env.B2_BUCKET_NAME,
  });

  await s3Client.send(command);
  console.log('   ✓ B2 bucket is accessible');
} catch (error) {
  console.log('   ✗ B2 bucket check failed:', error.message);
  console.log('   Error details:', error);
}

// Check recent photo uploads
console.log('\n3. Recent Photo Uploads:');
try {
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, storage_type, photo_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('   ✗ Failed to fetch photos:', error.message);
  } else {
    console.log(`   Found ${photos.length} recent photos:`);
    photos.forEach((photo, index) => {
      console.log(`   ${index + 1}. Storage: ${photo.storage_type.toUpperCase()}`);
      console.log(`      URL: ${photo.photo_url}`);
      console.log(`      Created: ${new Date(photo.created_at).toLocaleString()}`);
    });
  }
} catch (error) {
  console.log('   ✗ Error:', error.message);
}

console.log('\n=== End of Status Check ===\n');
process.exit(0);
