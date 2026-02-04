#!/usr/bin/env node

/**
 * Test if Cloudflare needs virtual-host style CNAME
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Testing Cloudflare Virtual-Host Style\n');

// The issue might be that Cloudflare CNAME should point to:
// wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
// instead of:
// s3.us-east-005.backblazeb2.com

console.log('Current CNAME target: s3.us-east-005.backblazeb2.com');
console.log('Suggested CNAME target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com\n');

console.log('Testing current setup with path-style URL:');
const pathStyleUrl = `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`;
console.log(`  ${pathStyleUrl}`);

https.get(pathStyleUrl, { timeout: 5000 }, (res) => {
  console.log(`  Status: ${res.statusCode}`);
  console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || 'MISSING'}`);
  
  if (res.statusCode === 404 && !res.headers['x-amz-request-id']) {
    console.log('\n❌ Not reaching B2 - Cloudflare returns its own 404\n');
    console.log('💡 SOLUTION:');
    console.log('\nChange your Cloudflare CNAME target from:');
    console.log('  ❌ s3.us-east-005.backblazeb2.com');
    console.log('\nTo:');
    console.log('  ✅ wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com');
    console.log('\nThis uses B2\'s virtual-host style, which works better with Cloudflare CDN.');
    console.log('\nAfter changing:');
    console.log('  1. Wait 1-5 minutes for DNS propagation');
    console.log('  2. Purge Cloudflare cache');
    console.log('  3. Test again with: node scripts/test-cdn-fix.mjs');
  } else if (res.statusCode === 200) {
    console.log('\n✅ SUCCESS! It works now!');
  }
  
  res.resume();
}).on('error', (err) => {
  console.log(`  Error: ${err.message}`);
});
