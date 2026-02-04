#!/usr/bin/env node

/**
 * Comprehensive Cloudflare + B2 Diagnostic Tool
 * 
 * This script tests various aspects of the Cloudflare CDN + B2 integration
 * to identify the exact cause of 401 errors.
 */

import https from 'https';
import http from 'http';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Cloudflare + B2 Comprehensive Diagnostic\n');
console.log('Configuration:');
console.log(`  CDN Domain: ${CDN_DOMAIN}`);
console.log(`  B2 Endpoint: ${B2_ENDPOINT}`);
console.log(`  Bucket: ${BUCKET_NAME}`);
console.log(`  Test File: ${TEST_KEY}\n`);
console.log('═'.repeat(80));

/**
 * Make an HTTP request and return detailed information
 */
function makeRequest(url, followRedirects = false) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 1000) {
          // Stop reading after 1KB
          res.destroy();
        }
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          bodyPreview: data.substring(0, 500),
          redirectLocation: res.headers.location,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        statusMessage: error.message,
        error: true,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        statusMessage: 'Request timeout',
        error: true,
      });
    });

    req.end();
  });
}

/**
 * Test 1: Direct B2 Access (Baseline)
 */
async function testDirectB2() {
  console.log('\n📝 Test 1: Direct B2 Access (Baseline)');
  console.log('─'.repeat(80));
  
  const url = `https://${B2_ENDPOINT}/${BUCKET_NAME}/${TEST_KEY}`;
  console.log(`URL: ${url}`);
  
  const result = await makeRequest(url);
  
  if (result.error) {
    console.log(`❌ Error: ${result.statusMessage}`);
    return false;
  }
  
  console.log(`Status: HTTP ${result.statusCode} ${result.statusMessage}`);
  console.log(`Content-Type: ${result.headers['content-type']}`);
  console.log(`Content-Length: ${result.headers['content-length']} bytes`);
  console.log(`Server: ${result.headers['server']}`);
  
  if (result.statusCode === 200) {
    console.log('✅ Direct B2 access works!');
    return true;
  } else {
    console.log('❌ Direct B2 access failed');
    return false;
  }
}

/**
 * Test 2: CDN with various path formats
 */
async function testCDNPaths() {
  console.log('\n📝 Test 2: CDN Path Format Testing');
  console.log('─'.repeat(80));
  
  const paths = [
    { name: 'Direct key', path: `/${TEST_KEY}` },
    { name: 'With bucket', path: `/${BUCKET_NAME}/${TEST_KEY}` },
    { name: 'With /file/', path: `/file/${BUCKET_NAME}/${TEST_KEY}` },
    { name: 'B2 native', path: `/b2api/v2/b2_download_file_by_name/${BUCKET_NAME}/${TEST_KEY}` },
  ];
  
  for (const test of paths) {
    const url = `https://${CDN_DOMAIN}${test.path}`;
    console.log(`\nTesting: ${test.name}`);
    console.log(`URL: ${url}`);
    
    const result = await makeRequest(url);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.statusMessage}`);
      continue;
    }
    
    console.log(`  Status: HTTP ${result.statusCode}`);
    console.log(`  Server: ${result.headers['server'] || 'N/A'}`);
    console.log(`  CF-Ray: ${result.headers['cf-ray'] || 'N/A'}`);
    console.log(`  CF-Cache-Status: ${result.headers['cf-cache-status'] || 'N/A'}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ SUCCESS! This path format works!`);
      console.log(`  Content-Type: ${result.headers['content-type']}`);
      return test.path;
    } else if (result.statusCode === 301 || result.statusCode === 302) {
      console.log(`  ↪️  Redirect to: ${result.redirectLocation}`);
    } else if (result.statusCode === 401) {
      console.log(`  ❌ Unauthorized`);
      if (result.headers['www-authenticate']) {
        console.log(`  Auth Required: ${result.headers['www-authenticate']}`);
      }
    } else if (result.statusCode === 403) {
      console.log(`  ❌ Forbidden`);
    } else if (result.statusCode === 404) {
      console.log(`  ❌ Not Found`);
    }
  }
  
  return null;
}

/**
 * Test 3: DNS Resolution
 */
async function testDNS() {
  console.log('\n📝 Test 3: DNS Resolution');
  console.log('─'.repeat(80));
  
  try {
    const { promisify } = await import('util');
    const dns = await import('dns');
    const resolve = promisify(dns.resolve);
    const resolveCname = promisify(dns.resolveCname);
    
    console.log(`Resolving: ${CDN_DOMAIN}`);
    
    try {
      const cnames = await resolveCname(CDN_DOMAIN);
      console.log(`✅ CNAME: ${cnames.join(', ')}`);
      
      if (cnames.includes(B2_ENDPOINT)) {
        console.log(`✅ CNAME points to correct B2 endpoint`);
      } else {
        console.log(`⚠️  CNAME does not point to ${B2_ENDPOINT}`);
      }
    } catch (e) {
      console.log(`⚠️  No CNAME record (might be using A/AAAA records)`);
      
      const ips = await resolve(CDN_DOMAIN);
      console.log(`IP addresses: ${ips.join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ DNS lookup failed: ${error.message}`);
  }
}

/**
 * Test 4: Cloudflare Headers Analysis
 */
async function testCloudflareHeaders() {
  console.log('\n📝 Test 4: Cloudflare Headers Analysis');
  console.log('─'.repeat(80));
  
  const url = `https://${CDN_DOMAIN}/${TEST_KEY}`;
  console.log(`URL: ${url}`);
  
  const result = await makeRequest(url);
  
  if (result.error) {
    console.log(`❌ Error: ${result.statusMessage}`);
    return;
  }
  
  console.log('\nCloudflare-specific headers:');
  const cfHeaders = Object.keys(result.headers)
    .filter(h => h.toLowerCase().startsWith('cf-'))
    .sort();
  
  if (cfHeaders.length === 0) {
    console.log('⚠️  No Cloudflare headers found - CDN might not be active');
  } else {
    cfHeaders.forEach(header => {
      console.log(`  ${header}: ${result.headers[header]}`);
    });
  }
  
  console.log('\nOther relevant headers:');
  ['server', 'x-amz-request-id', 'x-amz-id-2', 'www-authenticate', 'access-control-allow-origin'].forEach(header => {
    if (result.headers[header]) {
      console.log(`  ${header}: ${result.headers[header]}`);
    }
  });
  
  if (result.statusCode === 401 && result.bodyPreview) {
    console.log('\nResponse body preview:');
    console.log(result.bodyPreview);
  }
}

/**
 * Test 5: CORS Check
 */
async function testCORS() {
  console.log('\n📝 Test 5: CORS Configuration');
  console.log('─'.repeat(80));
  
  const url = `https://${CDN_DOMAIN}/${TEST_KEY}`;
  console.log(`Testing CORS for: ${url}`);
  
  const result = await makeRequest(url);
  
  if (result.headers['access-control-allow-origin']) {
    console.log(`✅ CORS enabled: ${result.headers['access-control-allow-origin']}`);
  } else {
    console.log(`⚠️  No CORS headers found`);
  }
}

/**
 * Main diagnostic function
 */
async function main() {
  try {
    // Test 1: Baseline - Direct B2
    const b2Works = await testDirectB2();
    
    if (!b2Works) {
      console.log('\n❌ CRITICAL: Direct B2 access failed. Check bucket configuration.');
      return;
    }
    
    // Test 2: CDN paths
    const workingPath = await testCDNPaths();
    
    // Test 3: DNS
    await testDNS();
    
    // Test 4: Cloudflare headers
    await testCloudflareHeaders();
    
    // Test 5: CORS
    await testCORS();
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 DIAGNOSTIC SUMMARY\n');
    
    if (workingPath) {
      console.log(`✅ SOLUTION FOUND!`);
      console.log(`\nWorking URL format: https://${CDN_DOMAIN}${workingPath}`);
      console.log(`\nUpdate your code to use this path format.`);
    } else {
      console.log(`❌ NO WORKING CDN PATH FOUND`);
      console.log(`\nPossible issues:`);
      console.log(`  1. Cloudflare CNAME not configured correctly`);
      console.log(`  2. Cloudflare cache has stale 401 responses`);
      console.log(`  3. B2 bucket CORS settings blocking Cloudflare`);
      console.log(`  4. Cloudflare transform rules interfering`);
      console.log(`\nRecommended actions:`);
      console.log(`  1. Check Cloudflare DNS settings`);
      console.log(`  2. Purge Cloudflare cache`);
      console.log(`  3. Check B2 bucket CORS rules`);
      console.log(`  4. Temporarily use direct B2 URLs`);
    }
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
  }
}

main();
