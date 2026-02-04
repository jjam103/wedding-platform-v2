#!/usr/bin/env node

/**
 * Final CDN Test - After CNAME update
 * Tests if Cloudflare CDN can reach Backblaze B2 storage
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';
const EXPECTED_CNAME_TARGET = 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com';

console.log('🧪 Cloudflare CDN Test\n');
console.log('Testing URL: https://' + CDN_DOMAIN + '/' + TEST_KEY);
console.log('Expected CNAME: ' + EXPECTED_CNAME_TARGET + '\n');

https.get(`https://${CDN_DOMAIN}/${TEST_KEY}`, { timeout: 10000 }, (res) => {
  console.log('Response Headers:');
  console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`  Server: ${res.headers['server']}`);
  console.log(`  CF-Ray: ${res.headers['cf-ray']}`);
  console.log(`  CF-Cache-Status: ${res.headers['cf-cache-status']}`);
  console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || '❌ MISSING (not reaching B2!)'}`);
  console.log(`  Content-Type: ${res.headers['content-type']}`);
  console.log(`  Content-Length: ${res.headers['content-length']} bytes`);
  
  console.log('\n' + '═'.repeat(70));
  
  if (res.statusCode === 200) {
    if (res.headers['x-amz-request-id']) {
      console.log('\n🎉 SUCCESS! CDN is working perfectly!');
      console.log('\n✅ Cloudflare CDN is reaching B2 storage');
      console.log('✅ Photos will load through Cloudflare edge network');
      console.log('✅ Fast global delivery with caching');
      console.log('✅ Reduced B2 bandwidth costs');
      console.log('\n📋 Next steps:');
      console.log('  1. Restart dev server: npm run dev');
      console.log('  2. Upload a test photo in admin panel');
      console.log('  3. Verify it displays with blue "B2" badge');
      console.log('  4. Check that images load quickly');
    } else {
      console.log('\n⚠️  HTTP 200 but no x-amz-request-id header');
      console.log('This is unusual. The CDN might be serving cached content.');
      console.log('Try purging Cloudflare cache and test again.');
    }
  } else if (res.statusCode === 404) {
    if (res.headers['x-amz-request-id']) {
      console.log('\n✅ CDN is reaching B2 correctly!');
      console.log('❌ But this specific file doesn\'t exist (404 from B2)');
      console.log('\n📋 Next steps:');
      console.log('  1. Upload a new photo to test');
      console.log('  2. The CDN connection is working - just need fresh content');
    } else {
      console.log('\n❌ CNAME TARGET IS INCORRECT OR INCOMPLETE');
      console.log('\nDiagnosis:');
      console.log('  • No x-amz-request-id header = not reaching B2');
      console.log('  • Cloudflare is returning 404 before reaching B2');
      console.log('  • This means the CNAME target is wrong');
      console.log('\n🔧 Fix Required:');
      console.log('  1. Go to Cloudflare Dashboard → DNS');
      console.log('  2. Find the "cdn" CNAME record');
      console.log('  3. Current target is likely: jamara.s3.us-east-005.backblazeb2.com');
      console.log('  4. Change it to: ' + EXPECTED_CNAME_TARGET);
      console.log('  5. Keep proxy status ON (orange cloud)');
      console.log('  6. Save changes');
      console.log('  7. Purge Cloudflare cache (Caching → Purge Everything)');
      console.log('  8. Wait 2-3 minutes');
      console.log('  9. Run this test again');
      console.log('\n📄 See CLOUDFLARE_FIX_INSTRUCTIONS.md for detailed steps');
    }
  } else if (res.statusCode === 403) {
    console.log('\n❌ 403 Forbidden - Permission issue');
    console.log('\nPossible causes:');
    console.log('  1. B2 bucket is not public');
    console.log('  2. Cloudflare Transform Rule is adding incorrect auth headers');
    console.log('  3. B2 bucket policy is blocking requests');
    console.log('\nVerify:');
    console.log('  • B2 bucket is set to "Public"');
    console.log('  • "B2 Auth" Transform Rule is disabled');
  } else {
    console.log(`\n⚠️  Unexpected status: ${res.statusCode}`);
    console.log('\nThis might indicate:');
    console.log('  • Cloudflare configuration issue');
    console.log('  • B2 service issue');
    console.log('  • Network connectivity problem');
  }
  
  res.resume();
}).on('error', (err) => {
  console.log(`\n❌ Connection Error: ${err.message}`);
  console.log('\nPossible causes:');
  console.log('  • DNS resolution failed');
  console.log('  • Network connectivity issue');
  console.log('  • Cloudflare service issue');
}).on('timeout', () => {
  console.log(`\n❌ Request Timeout (10 seconds)`);
  console.log('\nPossible causes:');
  console.log('  • Cloudflare is not responding');
  console.log('  • Network connectivity issue');
  console.log('  • B2 service is slow or unavailable');
});
