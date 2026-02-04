#!/usr/bin/env node

/**
 * Test different B2 endpoint formats to find the correct one for Cloudflare
 */

import https from 'https';

const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Testing B2 Endpoint Formats\n');

const endpoints = [
  's3.us-east-005.backblazeb2.com',
  'f005.backblazeb2.com',
  's3.us-east-005.backblaze.com',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `https://${endpoint}/${BUCKET_NAME}/${TEST_KEY}`;
    
    https.get(url, { timeout: 5000 }, (res) => {
      console.log(`\n${endpoint}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Server: ${res.headers['server']}`);
      
      if (res.statusCode === 200) {
        console.log(`  ✅ WORKS!`);
      }
      
      res.resume();
      resolve();
    }).on('error', (err) => {
      console.log(`\n${endpoint}:`);
      console.log(`  ❌ Error: ${err.message}`);
      resolve();
    }).on('timeout', () => {
      console.log(`\n${endpoint}:`);
      console.log(`  ❌ Timeout`);
      resolve();
    });
  });
}

async function main() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 The working endpoint should be used as the CNAME target');
}

main().catch(console.error);
