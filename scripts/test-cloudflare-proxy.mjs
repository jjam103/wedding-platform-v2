#!/usr/bin/env node

/**
 * Test if Cloudflare is proxying to B2 correctly
 */

import https from 'https';
import { promisify } from 'util';
import dns from 'dns';

const resolveCname = promisify(dns.resolveCname);

const CDN_DOMAIN = 'cdn.jamara.us';
const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Cloudflare Proxy Test\n');

// Step 1: Check DNS
console.log('Step 1: DNS Resolution');
console.log('─'.repeat(60));
try {
  const cnames = await resolveCname(CDN_DOMAIN);
  console.log(`CNAME: ${CDN_DOMAIN} → ${cnames.join(', ')}`);
  
  if (cnames.some(c => c.includes('backblazeb2.com'))) {
    console.log('✅ CNAME points to Backblaze B2');
  } else {
    console.log('⚠️  CNAME does not point to Backblaze B2');
    console.log(`   Expected: something.backblazeb2.com`);
    console.log(`   Got: ${cnames[0]}`);
  }
} catch (e) {
  console.log(`❌ No CNAME found: ${e.message}`);
}

// Step 2: Test what Cloudflare is actually requesting from B2
console.log('\nStep 2: Testing Cloudflare → B2 Request');
console.log('─'.repeat(60));

const testUrl = `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`;
console.log(`Request: ${testUrl}`);

https.get(testUrl, { timeout: 5000 }, (res) => {
  console.log(`\nResponse from Cloudflare:`);
  console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`  Server: ${res.headers['server']}`);
  console.log(`  CF-Ray: ${res.headers['cf-ray']}`);
  
  // Check if response is from B2
  if (res.headers['x-amz-request-id']) {
    console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id']}`);
    console.log('  ✅ Response is from B2 (has x-amz-request-id header)');
  } else {
    console.log('  ⚠️  No x-amz-request-id header - might not be reaching B2');
  }
  
  // Read response body for 404
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode === 404 && body) {
      console.log(`\nResponse body:`);
      console.log(body.substring(0, 500));
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n💡 DIAGNOSIS:');
    
    if (res.statusCode === 404 && res.headers['x-amz-request-id']) {
      console.log('\n❌ Cloudflare IS reaching B2, but B2 returns 404');
      console.log('   This means:');
      console.log('   1. Cloudflare CNAME is configured correctly');
      console.log('   2. But Cloudflare is requesting the wrong path from B2');
      console.log('   3. OR there\'s a Cloudflare Transform Rule modifying the path');
      console.log('\n💡 Solution:');
      console.log('   Check Cloudflare Transform Rules / Page Rules');
      console.log('   The path being sent to B2 might be incorrect');
    } else if (res.statusCode === 404 && !res.headers['x-amz-request-id']) {
      console.log('\n❌ Cloudflare is NOT reaching B2');
      console.log('   This means:');
      console.log('   1. CNAME might not be configured correctly');
      console.log('   2. OR Cloudflare is not proxying (orange cloud off)');
      console.log('\n💡 Solution:');
      console.log('   1. Check Cloudflare DNS settings');
      console.log('   2. Ensure orange cloud is ON (proxied)');
      console.log('   3. Verify CNAME points to correct B2 endpoint');
    }
  });
}).on('error', (err) => {
  console.log(`\n❌ Error: ${err.message}`);
});
