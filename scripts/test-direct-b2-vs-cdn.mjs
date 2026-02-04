#!/usr/bin/env node

/**
 * Compare Direct B2 vs CDN responses
 */

import https from 'https';

const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';
const DIRECT_B2_URL = `https://wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com/${TEST_KEY}`;
const CDN_URL = `https://cdn.jamara.us/${TEST_KEY}`;

console.log('🔬 Direct B2 vs CDN Comparison\n');
console.log('═'.repeat(70));

async function testUrl(url, label) {
  return new Promise((resolve) => {
    console.log(`\n${label}:`);
    console.log(`URL: ${url}\n`);
    
    https.get(url, { timeout: 10000 }, (res) => {
      console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`  Server: ${res.headers['server']}`);
      console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || 'MISSING'}`);
      console.log(`  x-amz-id-2: ${res.headers['x-amz-id-2'] || 'MISSING'}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Content-Length: ${res.headers['content-length']} bytes`);
      console.log(`  CF-Ray: ${res.headers['cf-ray'] || 'N/A'}`);
      console.log(`  CF-Cache-Status: ${res.headers['cf-cache-status'] || 'N/A'}`);
      
      res.resume();
      resolve({
        status: res.statusCode,
        hasAmzId: !!res.headers['x-amz-request-id'],
        server: res.headers['server']
      });
    }).on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve({ status: 0, hasAmzId: false, error: err.message });
    }).on('timeout', () => {
      console.log(`  ❌ Timeout`);
      resolve({ status: 0, hasAmzId: false, error: 'timeout' });
    });
  });
}

const directResult = await testUrl(DIRECT_B2_URL, '1️⃣  Direct B2 URL');
const cdnResult = await testUrl(CDN_URL, '2️⃣  Cloudflare CDN URL');

console.log('\n' + '═'.repeat(70));
console.log('\n📊 Analysis:\n');

if (directResult.status === 200 && directResult.hasAmzId) {
  console.log('✅ Direct B2: Working correctly');
} else {
  console.log('❌ Direct B2: Not working - file may not exist');
}

if (cdnResult.status === 200 && cdnResult.hasAmzId) {
  console.log('✅ CDN: Working correctly');
} else if (cdnResult.status === 404 && !cdnResult.hasAmzId) {
  console.log('❌ CDN: Not reaching B2 at all');
  console.log('\n🔍 Possible causes:');
  console.log('   1. CNAME target is incorrect (most likely)');
  console.log('   2. SSL/TLS mode is wrong (should be "Full")');
  console.log('   3. Transform Rule interfering');
  console.log('   4. Cloudflare cache needs purging');
} else if (cdnResult.status === 404 && cdnResult.hasAmzId) {
  console.log('⚠️  CDN: Reaching B2 but file not found');
  console.log('   This means CNAME is correct, but file may not exist');
}

console.log('\n' + '═'.repeat(70));
console.log('\n💡 Next Steps:\n');

if (directResult.status === 200 && cdnResult.status === 404 && !cdnResult.hasAmzId) {
  console.log('Since direct B2 works but CDN doesn\'t reach B2:');
  console.log('\n1. Check Cloudflare SSL/TLS Settings:');
  console.log('   - Go to SSL/TLS → Overview');
  console.log('   - Set to "Full" (not "Flexible")');
  console.log('   - Save');
  console.log('\n2. Verify CNAME target (even though you said it\'s correct):');
  console.log('   - Go to DNS settings');
  console.log('   - Click "Edit" on cdn record');
  console.log('   - Screenshot the full target field');
  console.log('   - Should be: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com');
  console.log('\n3. Check for Transform Rules:');
  console.log('   - Go to Rules → Transform Rules');
  console.log('   - Disable ALL rules affecting cdn.jamara.us');
  console.log('\n4. Purge cache again:');
  console.log('   - Caching → Purge Everything');
  console.log('   - Wait 2 minutes');
  console.log('   - Test again');
}

console.log('\n');
