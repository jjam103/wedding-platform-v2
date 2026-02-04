#!/usr/bin/env node

/**
 * Test CDN with cache-busting to bypass cached 404
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🧪 CDN Cache-Busting Test\n');
console.log('═'.repeat(60));

// Test with cache-busting query parameter
const cacheBustUrl = `https://${CDN_DOMAIN}/${TEST_KEY}?v=${Date.now()}`;

console.log('\n1️⃣  Testing with cache-busting parameter...\n');
console.log(`URL: ${cacheBustUrl}\n`);

https.get(cacheBustUrl, { timeout: 10000 }, (res) => {
  console.log('Response:');
  console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`  Server: ${res.headers['server']}`);
  console.log(`  CF-Ray: ${res.headers['cf-ray']}`);
  console.log(`  CF-Cache-Status: ${res.headers['cf-cache-status']}`);
  console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || 'MISSING'}`);
  console.log(`  Content-Type: ${res.headers['content-type']}`);
  
  console.log('\n' + '═'.repeat(60));
  
  if (res.statusCode === 200 && res.headers['x-amz-request-id']) {
    console.log('\n🎉 SUCCESS! CDN is working!');
    console.log('\nThe issue was cached 404 responses.');
    console.log('\n✅ Solution: Purge cache again and wait longer');
    console.log('   OR temporarily set CNAME to "DNS only" to bypass cache');
    console.log('\nOnce cache clears, regular URLs will work:');
    console.log(`   https://${CDN_DOMAIN}/${TEST_KEY}`);
  } else if (res.statusCode === 404 && res.headers['x-amz-request-id']) {
    console.log('\n⚠️  CDN is reaching B2, but file not found');
    console.log('\nThis is actually GOOD NEWS - the connection works!');
    console.log('The file might have been deleted or the path is wrong.');
    console.log('\nTry uploading a new photo to test.');
  } else if (res.statusCode === 404 && !res.headers['x-amz-request-id']) {
    console.log('\n❌ Still not reaching B2');
    console.log('\nEven with cache-busting, Cloudflare is not connecting to B2.');
    console.log('\n🔍 This indicates a configuration issue:');
    console.log('   1. CNAME target might still be wrong (double-check in UI)');
    console.log('   2. SSL/TLS mode needs to be "Full" (not "Flexible")');
    console.log('   3. A Transform Rule or Page Rule is blocking');
    console.log('   4. Cloudflare has an internal routing issue');
    console.log('\n💡 Recommended: Temporarily set CNAME to "DNS only"');
    console.log('   This will bypass Cloudflare proxy and prove if config is correct.');
  }
  
  res.resume();
}).on('error', (err) => {
  console.log(`\n❌ Error: ${err.message}`);
}).on('timeout', () => {
  console.log(`\n❌ Request timeout`);
});

// Also test without cache-busting after a delay
setTimeout(() => {
  console.log('\n2️⃣  Testing without cache-busting (regular URL)...\n');
  console.log(`URL: https://${CDN_DOMAIN}/${TEST_KEY}\n`);
  
  https.get(`https://${CDN_DOMAIN}/${TEST_KEY}`, { timeout: 10000 }, (res) => {
    console.log('Response:');
    console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`  CF-Cache-Status: ${res.headers['cf-cache-status']}`);
    console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || 'MISSING'}`);
    
    if (res.headers['cf-cache-status'] === 'HIT') {
      console.log('\n⚠️  Still serving from cache');
      console.log('   Cache purge may take longer to propagate');
      console.log('   Try again in 5 minutes');
    }
    
    res.resume();
  }).on('error', () => {});
}, 2000);
