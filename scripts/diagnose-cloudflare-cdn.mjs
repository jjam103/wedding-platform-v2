#!/usr/bin/env node

/**
 * Comprehensive Cloudflare CDN Diagnostic Tool
 * 
 * This script performs a complete diagnostic of your Cloudflare CDN setup
 * to identify why images are returning 401 errors.
 */

import https from 'https';
import dns from 'dns/promises';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Cloudflare CDN Diagnostic Tool\n');
console.log('═'.repeat(80));

/**
 * Test 1: DNS Resolution
 */
async function testDNS() {
  console.log('\n📡 Test 1: DNS Resolution');
  console.log('─'.repeat(80));
  
  try {
    const addresses = await dns.resolve(CDN_DOMAIN);
    console.log(`✅ ${CDN_DOMAIN} resolves to:`);
    addresses.forEach(addr => console.log(`   - ${addr}`));
    
    const cname = await dns.resolveCname(CDN_DOMAIN).catch(() => null);
    if (cname) {
      console.log(`✅ CNAME record: ${cname[0]}`);
      if (cname[0].includes('backblazeb2.com')) {
        console.log('   ✅ Points to Backblaze B2 (correct)');
      } else {
        console.log('   ⚠️  Does not point to Backblaze B2');
      }
    } else {
      console.log('⚠️  No CNAME record found (using A record)');
    }
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
  }
}

/**
 * Test 2: Direct B2 Access
 */
async function testDirectB2() {
  console.log('\n🔗 Test 2: Direct B2 Access (Baseline)');
  console.log('─'.repeat(80));
  
  const url = `https://${B2_ENDPOINT}/${BUCKET_NAME}/${TEST_KEY}`;
  console.log(`Testing: ${url}`);
  
  const result = await makeRequest(url);
  
  if (result.statusCode === 200) {
    console.log('✅ Direct B2 access works (HTTP 200)');
    console.log(`   Content-Type: ${result.headers['content-type']}`);
    console.log(`   Content-Length: ${result.headers['content-length']} bytes`);
    console.log('   This confirms the bucket is public and file exists.');
  } else {
    console.log(`❌ Direct B2 access failed (HTTP ${result.statusCode})`);
    console.log('   This is a problem - the bucket might not be public.');
  }
  
  return result.statusCode === 200;
}

/**
 * Test 3: Cloudflare CDN URL Formats
 */
async function testCDNFormats() {
  console.log('\n🌐 Test 3: Cloudflare CDN URL Formats');
  console.log('─'.repeat(80));
  
  const formats = [
    {
      name: 'Format 1: /bucket/key',
      url: `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`,
      description: 'Standard S3 path format',
    },
    {
      name: 'Format 2: /file/bucket/key',
      url: `https://${CDN_DOMAIN}/file/${BUCKET_NAME}/${TEST_KEY}`,
      description: 'B2 native format',
    },
    {
      name: 'Format 3: /key only',
      url: `https://${CDN_DOMAIN}/${TEST_KEY}`,
      description: 'Direct key (if bucket resolved by CNAME)',
    },
  ];
  
  let workingFormat = null;
  
  for (const format of formats) {
    console.log(`\n${format.name}`);
    console.log(`URL: ${format.url}`);
    console.log(`Description: ${format.description}`);
    
    const result = await makeRequest(format.url);
    
    if (result.statusCode === 200) {
      console.log(`✅ SUCCESS! HTTP ${result.statusCode}`);
      console.log(`   Content-Type: ${result.headers['content-type']}`);
      console.log(`   Content-Length: ${result.headers['content-length']} bytes`);
      workingFormat = format;
    } else if (result.statusCode === 401) {
      console.log(`❌ HTTP 401 Unauthorized`);
      console.log('   Possible causes:');
      console.log('   - Cloudflare cache has old 401 responses');
      console.log('   - Host header mismatch');
      console.log('   - B2 CORS settings');
    } else if (result.statusCode === 403) {
      console.log(`❌ HTTP 403 Forbidden`);
      console.log('   Bucket might not be public or CORS issue');
    } else if (result.statusCode === 404) {
      console.log(`❌ HTTP 404 Not Found`);
      console.log('   Wrong URL format for this CDN setup');
    } else {
      console.log(`⚠️  HTTP ${result.statusCode}: ${result.statusMessage}`);
    }
  }
  
  return workingFormat;
}

/**
 * Test 4: Host Header Test
 */
async function testHostHeader() {
  console.log('\n🏷️  Test 4: Host Header Test');
  console.log('─'.repeat(80));
  console.log('Testing if Cloudflare is sending the correct Host header to B2...\n');
  
  // Test with CDN domain as Host
  console.log('Test 4a: With Host: cdn.jamara.us');
  const url1 = `https://${B2_ENDPOINT}/${BUCKET_NAME}/${TEST_KEY}`;
  const result1 = await makeRequest(url1, { 'Host': CDN_DOMAIN });
  
  if (result1.statusCode === 200) {
    console.log('✅ B2 accepts Host: cdn.jamara.us');
  } else {
    console.log(`❌ B2 rejects Host: cdn.jamara.us (HTTP ${result1.statusCode})`);
    console.log('   This might be why Cloudflare CDN is failing.');
    console.log('   Solution: Add Host header rewrite in Cloudflare Transform Rules');
  }
  
  // Test with B2 endpoint as Host
  console.log('\nTest 4b: With Host: s3.us-east-005.backblazeb2.com');
  const result2 = await makeRequest(url1, { 'Host': B2_ENDPOINT });
  
  if (result2.statusCode === 200) {
    console.log('✅ B2 accepts Host: s3.us-east-005.backblazeb2.com');
  } else {
    console.log(`❌ B2 rejects Host: s3.us-east-005.backblazeb2.com (HTTP ${result2.statusCode})`);
  }
}

/**
 * Test 5: Cache Headers
 */
async function testCacheHeaders() {
  console.log('\n💾 Test 5: Cache Headers Analysis');
  console.log('─'.repeat(80));
  
  const url = `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`;
  const result = await makeRequest(url);
  
  console.log('Response headers:');
  console.log(`   Cache-Control: ${result.headers['cache-control'] || 'not set'}`);
  console.log(`   CF-Cache-Status: ${result.headers['cf-cache-status'] || 'not set'}`);
  console.log(`   Age: ${result.headers['age'] || 'not set'}`);
  console.log(`   X-Cache: ${result.headers['x-cache'] || 'not set'}`);
  
  if (result.headers['cf-cache-status'] === 'HIT') {
    console.log('\n⚠️  Cloudflare is serving cached response');
    console.log('   If you recently made the bucket public, you need to purge the cache.');
    console.log('   Go to: Cloudflare Dashboard → Caching → Purge Everything');
  } else if (result.headers['cf-cache-status']) {
    console.log(`\n✅ Cache status: ${result.headers['cf-cache-status']}`);
  }
}

/**
 * Make HTTP request
 */
function makeRequest(url, customHeaders = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'HEAD',
      headers: {
        'User-Agent': 'CloudflareCDN-Diagnostic/1.0',
        ...customHeaders,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers,
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        statusMessage: error.message,
        headers: {},
        error: true,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        statusMessage: 'Request timeout',
        headers: {},
        error: true,
      });
    });

    req.end();
  });
}

/**
 * Main diagnostic function
 */
async function main() {
  await testDNS();
  const b2Works = await testDirectB2();
  
  if (!b2Works) {
    console.log('\n❌ CRITICAL: Direct B2 access is not working.');
    console.log('   The bucket might not be public or the file does not exist.');
    console.log('   Fix this before troubleshooting Cloudflare CDN.');
    return;
  }
  
  const workingFormat = await testCDNFormats();
  await testHostHeader();
  await testCacheHeaders();
  
  // Final recommendations
  console.log('\n' + '═'.repeat(80));
  console.log('📋 DIAGNOSTIC SUMMARY & RECOMMENDATIONS\n');
  
  if (workingFormat) {
    console.log('✅ GOOD NEWS: Cloudflare CDN is working!');
    console.log(`   Working URL format: ${workingFormat.name}`);
    console.log(`   Example: ${workingFormat.url}`);
    console.log('\n   Update your code to use this URL format.');
  } else {
    console.log('❌ Cloudflare CDN is not working. Here\'s what to try:\n');
    console.log('1. PURGE CLOUDFLARE CACHE (Try this first!)');
    console.log('   - Go to: https://dash.cloudflare.com');
    console.log('   - Select domain: jamara.us');
    console.log('   - Caching → Configuration → Purge Everything');
    console.log('   - Wait 2-3 minutes, then run this script again\n');
    
    console.log('2. ADD HOST HEADER REWRITE');
    console.log('   - Go to: Cloudflare Dashboard → Rules → Transform Rules');
    console.log('   - Create "Modify Request Header" rule');
    console.log('   - When: Hostname equals "cdn.jamara.us"');
    console.log('   - Then: Set Host header to "s3.us-east-005.backblazeb2.com"\n');
    
    console.log('3. ADD B2 CORS RULES');
    console.log('   - Go to: https://secure.backblaze.com/b2_buckets.htm');
    console.log('   - Bucket Settings → CORS Rules');
    console.log('   - Allow origins: https://cdn.jamara.us, https://jamara.us');
    console.log('   - Allow operations: s3_get, s3_head\n');
    
    console.log('4. CHECK SSL/TLS MODE');
    console.log('   - Go to: Cloudflare Dashboard → SSL/TLS → Overview');
    console.log('   - Try "Full" mode (not "Full (strict)")\n');
  }
  
  console.log('═'.repeat(80));
  console.log('\nRun this script again after making changes to verify the fix.');
}

main().catch(console.error);
