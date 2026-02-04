#!/usr/bin/env node

/**
 * Test B2 CDN URL Formats
 * 
 * This script tests different URL formats to determine which one
 * successfully loads images from your Cloudflare CDN.
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

// Different URL formats to test
const urlFormats = [
  {
    name: 'Direct S3 Path (No /file/)',
    url: `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`,
  },
  {
    name: 'B2 Native Path (With /file/)',
    url: `https://${CDN_DOMAIN}/file/${BUCKET_NAME}/${TEST_KEY}`,
  },
  {
    name: 'Direct to Key (No bucket)',
    url: `https://${CDN_DOMAIN}/${TEST_KEY}`,
  },
  {
    name: 'Direct B2 Endpoint (No CDN)',
    url: `https://s3.us-east-005.backblazeb2.com/${BUCKET_NAME}/${TEST_KEY}`,
  },
];

/**
 * Test a URL by making a HEAD request
 */
function testUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
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
 * Main test function
 */
async function main() {
  console.log('🔍 Testing B2 CDN URL Formats\n');
  console.log(`CDN Domain: ${CDN_DOMAIN}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Test File: ${TEST_KEY}\n`);
  console.log('─'.repeat(80));

  for (const format of urlFormats) {
    console.log(`\n📝 Testing: ${format.name}`);
    console.log(`   URL: ${format.url}`);
    
    const result = await testUrl(format.url);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.statusMessage}`);
    } else if (result.statusCode === 200) {
      console.log(`   ✅ SUCCESS! HTTP ${result.statusCode}`);
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Content-Length: ${result.contentLength} bytes`);
      console.log(`\n   🎉 THIS IS THE CORRECT URL FORMAT!`);
    } else if (result.statusCode === 404) {
      console.log(`   ❌ Not Found (HTTP ${result.statusCode})`);
    } else if (result.statusCode === 403) {
      console.log(`   ❌ Forbidden (HTTP ${result.statusCode})`);
    } else {
      console.log(`   ⚠️  HTTP ${result.statusCode}: ${result.statusMessage}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n📋 Summary:');
  console.log('   Look for the format marked with ✅ SUCCESS!');
  console.log('   That is the correct URL format to use in the code.\n');
}

main().catch(console.error);
