#!/usr/bin/env node

/**
 * Test Photo URL in Browser
 * 
 * This script tests if a photo URL is accessible
 */

import https from 'https';
import http from 'http';

const testUrl = process.argv[2] || 'https://cdn.jamara.us/photos/1770094543867-IMG_0629.jpeg';

console.log(`🧪 Testing Photo URL\n`);
console.log(`URL: ${testUrl}\n`);

const url = new URL(testUrl);
const client = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'HEAD',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
};

const req = client.request(options, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`\nResponse Headers:`);
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  if (res.statusCode === 200) {
    console.log(`\n✅ Photo is accessible!`);
  } else if (res.statusCode === 404) {
    console.log(`\n❌ Photo not found (404)`);
    console.log(`\nPossible causes:`);
    console.log(`  1. Photo was deleted from B2`);
    console.log(`  2. Incorrect URL format`);
    console.log(`  3. Cloudflare Worker not routing correctly`);
  } else if (res.statusCode === 403) {
    console.log(`\n❌ Access forbidden (403)`);
    console.log(`\nPossible causes:`);
    console.log(`  1. B2 bucket not public`);
    console.log(`  2. CORS issue`);
  } else {
    console.log(`\n⚠️  Unexpected status code`);
  }
});

req.on('error', (error) => {
  console.error(`\n❌ Request failed:`, error.message);
});

req.end();
