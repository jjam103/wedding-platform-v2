#!/usr/bin/env node

/**
 * Test CDN Fix - Verify the corrected URL format works
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

// This is the NEW format we're using
const NEW_URL = `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`;

console.log('🧪 Testing CDN Fix\n');
console.log('New URL format (S3-compatible):');
console.log(`  ${NEW_URL}\n`);

https.get(NEW_URL, { timeout: 5000 }, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`Server: ${res.headers['server']}`);
  console.log(`CF-Ray: ${res.headers['cf-ray']}`);
  console.log(`CF-Cache-Status: ${res.headers['cf-cache-status']}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Length: ${res.headers['content-length']} bytes`);
  
  if (res.statusCode === 200) {
    console.log('\n✅ SUCCESS! CDN is now working correctly!');
    console.log('\n📸 Images will now load through Cloudflare CDN');
  } else if (res.statusCode === 404) {
    console.log('\n❌ 404 Not Found - File might not exist or path is wrong');
  } else if (res.statusCode === 401) {
    console.log('\n❌ 401 Unauthorized - Still having auth issues');
  } else {
    console.log(`\n⚠️  Unexpected status: ${res.statusCode}`);
  }
  
  res.resume();
}).on('error', (err) => {
  console.log(`\n❌ Error: ${err.message}`);
});
