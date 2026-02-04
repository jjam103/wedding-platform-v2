#!/usr/bin/env node

/**
 * Test if B2 accepts requests with different Host headers
 * This simulates what Cloudflare does when proxying
 */

import https from 'https';

const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Testing Host Header Variations\n');

async function testWithHost(hostHeader) {
  return new Promise((resolve) => {
    const options = {
      hostname: B2_ENDPOINT,
      path: `/${BUCKET_NAME}/${TEST_KEY}`,
      method: 'GET',
      headers: {
        'Host': hostHeader,
      },
      timeout: 5000,
    };
    
    console.log(`\nTesting Host: ${hostHeader}`);
    console.log(`  Connecting to: ${B2_ENDPOINT}`);
    console.log(`  Path: ${options.path}`);
    
    const req = https.request(options, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Server: ${res.headers['server']}`);
      
      if (res.statusCode === 200) {
        console.log(`  ✅ WORKS!`);
      } else if (res.statusCode === 403 || res.statusCode === 401) {
        console.log(`  ❌ Auth error - B2 rejected this Host header`);
      }
      
      res.resume();
      resolve();
    });
    
    req.on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`  ❌ Timeout`);
      resolve();
    });
    
    req.end();
  });
}

async function main() {
  // Test different Host headers
  await testWithHost(B2_ENDPOINT); // Normal
  await testWithHost('cdn.jamara.us'); // What Cloudflare sends
  await testWithHost(`${BUCKET_NAME}.${B2_ENDPOINT}`); // Virtual host style
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 DIAGNOSIS:');
  console.log('If "cdn.jamara.us" fails but others work:');
  console.log('  → B2 is rejecting requests with custom Host headers');
  console.log('  → This is why Cloudflare CDN returns 404');
  console.log('\n💡 SOLUTION:');
  console.log('  Use virtual-host style CNAME:');
  console.log(`  Target: ${BUCKET_NAME}.${B2_ENDPOINT}`);
}

main().catch(console.error);
