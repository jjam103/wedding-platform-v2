#!/usr/bin/env node

/**
 * Quick CDN Test - Fast diagnostic for Cloudflare + B2
 */

import https from 'https';

const CDN_DOMAIN = 'cdn.jamara.us';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 Quick CDN Test\n');

async function testURL(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      console.log(`\n${name}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`  Server: ${res.headers['server'] || 'N/A'}`);
      console.log(`  CF-Ray: ${res.headers['cf-ray'] || 'N/A'}`);
      console.log(`  CF-Cache: ${res.headers['cf-cache-status'] || 'N/A'}`);
      
      if (res.statusCode === 200) {
        console.log(`  ✅ SUCCESS!`);
      } else if (res.statusCode === 401) {
        console.log(`  ❌ Unauthorized`);
      } else if (res.statusCode === 403) {
        console.log(`  ❌ Forbidden`);
      } else if (res.statusCode === 404) {
        console.log(`  ❌ Not Found`);
      }
      
      res.resume();
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log(`\n${name}:`);
      console.log(`  ❌ Error: ${err.message}`);
      resolve(0);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`\n${name}:`);
      console.log(`  ❌ Timeout`);
      resolve(0);
    });
  });
}

async function main() {
  // Test different URL formats
  const tests = [
    {
      name: 'Format 1: Direct key',
      url: `https://${CDN_DOMAIN}/${TEST_KEY}`
    },
    {
      name: 'Format 2: With bucket',
      url: `https://${CDN_DOMAIN}/${BUCKET_NAME}/${TEST_KEY}`
    },
    {
      name: 'Format 3: With /file/',
      url: `https://${CDN_DOMAIN}/file/${BUCKET_NAME}/${TEST_KEY}`
    },
    {
      name: 'Format 4: B2 native API',
      url: `https://${CDN_DOMAIN}/b2api/v2/b2_download_file_by_name/${BUCKET_NAME}/${TEST_KEY}`
    }
  ];
  
  for (const test of tests) {
    await testURL(test.url, test.name);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 If all formats fail with 401/403, the issue is likely:');
  console.log('   1. Cloudflare cache has stale auth responses');
  console.log('   2. B2 bucket auth settings changed');
  console.log('   3. Cloudflare transform rules blocking access');
  console.log('\n💡 Next steps:');
  console.log('   1. Purge Cloudflare cache for this domain');
  console.log('   2. Check B2 bucket is truly public');
  console.log('   3. Check Cloudflare Page Rules / Transform Rules');
}

main().catch(console.error);
