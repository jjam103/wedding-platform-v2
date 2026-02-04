#!/usr/bin/env node

/**
 * Test Cloudflare SSL/TLS connection to B2
 */

import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CDN_DOMAIN = 'cdn.jamara.us';
const B2_TARGET = 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔐 Cloudflare SSL/TLS Connection Test\n');
console.log('═'.repeat(60));

// Test 1: Direct B2 connection
console.log('\n1️⃣  Testing direct B2 connection...\n');

https.get(`https://${B2_TARGET}/${TEST_KEY}`, { timeout: 10000 }, (res) => {
  console.log(`Direct B2 URL: https://${B2_TARGET}/${TEST_KEY}`);
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`x-amz-request-id: ${res.headers['x-amz-request-id'] || 'MISSING'}`);
  
  if (res.statusCode === 200) {
    console.log('✅ Direct B2 connection works!\n');
  } else {
    console.log('❌ Direct B2 connection failed!\n');
  }
  
  res.resume();
  
  // Test 2: CDN connection
  console.log('2️⃣  Testing CDN connection...\n');
  
  https.get(`https://${CDN_DOMAIN}/${TEST_KEY}`, { timeout: 10000 }, (cdnRes) => {
    console.log(`CDN URL: https://${CDN_DOMAIN}/${TEST_KEY}`);
    console.log(`Status: ${cdnRes.statusCode} ${cdnRes.statusMessage}`);
    console.log(`Server: ${cdnRes.headers['server']}`);
    console.log(`CF-Ray: ${cdnRes.headers['cf-ray']}`);
    console.log(`CF-Cache-Status: ${cdnRes.headers['cf-cache-status']}`);
    console.log(`x-amz-request-id: ${cdnRes.headers['x-amz-request-id'] || 'MISSING'}`);
    
    cdnRes.resume();
    
    console.log('\n' + '═'.repeat(60));
    
    if (cdnRes.statusCode === 200 && cdnRes.headers['x-amz-request-id']) {
      console.log('\n🎉 SUCCESS! CDN is working correctly!');
    } else if (cdnRes.statusCode === 404 && !cdnRes.headers['x-amz-request-id']) {
      console.log('\n❌ CDN is NOT reaching B2');
      console.log('\nPossible causes:');
      console.log('  1. CNAME target is incorrect (verify in Cloudflare UI)');
      console.log('  2. SSL/TLS mode is wrong (should be "Full")');
      console.log('  3. Transform Rule is interfering');
      console.log('  4. Page Rule is blocking the request');
      console.log('  5. Cloudflare cache needs more time to clear');
      
      console.log('\n🔍 Debugging steps:');
      console.log('  1. In Cloudflare, go to SSL/TLS → Overview');
      console.log('     - Should be set to "Full" (not "Flexible")');
      console.log('  2. Go to Rules → Transform Rules');
      console.log('     - Verify no rules affect cdn.jamara.us');
      console.log('  3. Go to Rules → Page Rules');
      console.log('     - Verify no rules affect cdn.jamara.us/*');
      console.log('  4. Try temporarily setting CNAME to "DNS only" (gray cloud)');
      console.log('     - This bypasses Cloudflare proxy to test if it works');
    }
    
    // Test 3: Check SSL certificate
    console.log('\n3️⃣  Checking SSL certificate for B2 endpoint...\n');
    
    execAsync(`openssl s_client -connect ${B2_TARGET}:443 -servername ${B2_TARGET} </dev/null 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject Alternative Name"`).then(({ stdout }) => {
      console.log('B2 SSL Certificate SANs:');
      console.log(stdout || '(Could not retrieve)');
      
      console.log('\n✅ The certificate should include:');
      console.log('   - *.s3.us-east-005.backblazeb2.com');
      console.log('   - s3.us-east-005.backblazeb2.com');
      
      console.log('\n' + '═'.repeat(60));
      console.log('\n💡 Next Steps:\n');
      console.log('If CNAME is definitely correct:');
      console.log('  1. Check SSL/TLS mode in Cloudflare (should be "Full")');
      console.log('  2. Check for interfering rules');
      console.log('  3. Try "DNS only" mode temporarily to isolate issue');
      console.log('  4. Contact Cloudflare support if still failing\n');
    }).catch(() => {
      console.log('(Could not check SSL certificate - openssl not available)\n');
    });
    
  }).on('error', (err) => {
    console.log(`\n❌ CDN Error: ${err.message}`);
  });
  
}).on('error', (err) => {
  console.log(`\n❌ Direct B2 Error: ${err.message}`);
});
