#!/usr/bin/env node

/**
 * Quick Photo URL Tester
 * 
 * Tests if a specific photo URL is accessible.
 * Usage: node scripts/test-photo-url.mjs <url>
 */

import https from 'https';

const url = process.argv[2];

if (!url) {
  console.log('Usage: node scripts/test-photo-url.mjs <url>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/test-photo-url.mjs "https://cdn.jamara.us/photos/1234-photo.jpg"');
  process.exit(1);
}

console.log(`Testing: ${url}\n`);

const urlObj = new URL(url);

const options = {
  hostname: urlObj.hostname,
  path: urlObj.pathname + urlObj.search,
  method: 'HEAD',
  timeout: 10000,
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('');
  console.log('Headers:');
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');
  
  if (res.statusCode === 200) {
    console.log('✅ SUCCESS! Photo is accessible.');
  } else if (res.statusCode === 401) {
    console.log('❌ HTTP 401 Unauthorized');
    console.log('   Try purging Cloudflare cache.');
  } else if (res.statusCode === 403) {
    console.log('❌ HTTP 403 Forbidden');
    console.log('   Check bucket permissions.');
  } else if (res.statusCode === 404) {
    console.log('❌ HTTP 404 Not Found');
    console.log('   Photo does not exist or wrong URL format.');
  } else {
    console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
  }
});

req.on('error', (error) => {
  console.log(`❌ Error: ${error.message}`);
});

req.on('timeout', () => {
  console.log('❌ Request timeout');
  req.destroy();
});

req.end();
