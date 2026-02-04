#!/usr/bin/env node

/**
 * Test B2 Upload Script
 * Tests B2 upload functionality with detailed logging
 */

import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

console.log('\n=== B2 Upload Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME || '(not set)');
console.log('  B2_ACCESS_KEY_ID:', process.env.B2_ACCESS_KEY_ID ? `${process.env.B2_ACCESS_KEY_ID.substring(0, 10)}...` : '(not set)');
console.log('  B2_SECRET_ACCESS_KEY:', process.env.B2_SECRET_ACCESS_KEY ? '(set)' : '(not set)');
console.log('  B2_ENDPOINT:', process.env.B2_ENDPOINT || '(not set)');
console.log('  B2_REGION:', process.env.B2_REGION || '(not set)');
console.log('  B2_CDN_DOMAIN:', process.env.B2_CDN_DOMAIN || '(not set)');
console.log('');

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

console.log('✓ S3 client initialized\n');

// Test 1: Check bucket access
console.log('Test 1: Checking bucket access...');
try {
  const headCommand = new HeadBucketCommand({
    Bucket: process.env.B2_BUCKET_NAME,
  });
  
  await s3Client.send(headCommand);
  console.log('✓ Bucket is accessible\n');
} catch (error) {
  console.error('✗ Bucket access failed:');
  console.error('  Error:', error.message);
  console.error('  Code:', error.Code || error.$metadata?.httpStatusCode);
  console.error('  Details:', JSON.stringify(error, null, 2));
  console.log('');
  process.exit(1);
}

// Test 2: Upload a test file
console.log('Test 2: Uploading test file...');
try {
  const testContent = Buffer.from('Test upload from diagnostic script');
  const timestamp = Date.now();
  const key = `test-uploads/${timestamp}-test.txt`;
  
  console.log('  Key:', key);
  console.log('  Bucket:', process.env.B2_BUCKET_NAME);
  
  const putCommand = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key,
    Body: testContent,
    ContentType: 'text/plain',
    CacheControl: 'public, max-age=31536000',
  });
  
  const result = await s3Client.send(putCommand);
  console.log('✓ Upload successful');
  console.log('  ETag:', result.ETag);
  console.log('  Status:', result.$metadata.httpStatusCode);
  
  // Generate CDN URL
  const cdnDomain = process.env.B2_CDN_DOMAIN;
  const cdnUrl = `https://${cdnDomain}/${process.env.B2_BUCKET_NAME}/${key}`;
  console.log('  CDN URL:', cdnUrl);
  console.log('');
  
  console.log('✓ All tests passed!');
  console.log('\nYou can test the CDN URL in your browser:');
  console.log(cdnUrl);
  
} catch (error) {
  console.error('✗ Upload failed:');
  console.error('  Error:', error.message);
  console.error('  Code:', error.Code || error.$metadata?.httpStatusCode);
  console.error('  Details:', JSON.stringify(error, null, 2));
  process.exit(1);
}
