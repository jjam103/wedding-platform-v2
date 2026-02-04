#!/usr/bin/env node

/**
 * Test B2 Bucket Configuration
 * Checks if bucket is truly public and accessible
 */

import https from 'https';

const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const BUCKET_NAME = 'wedding-photos-2026-jamara';
const TEST_KEY = 'photos/1770087981693-IMG_0627.jpeg';

console.log('🔍 B2 Bucket Configuration Test\n');

async function testURL(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      console.log(`\n${name}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`  Server: ${res.headers['server'] || 'N/A'}`);
      console.log(`  x-amz-bucket-region: ${res.headers['x-amz-bucket-region'] || 'N/A'}`);
      console.log(`  x-amz-request-id: ${res.headers['x-amz-request-id'] || 'N/A'}`);
      
      if (res.headers['www-authenticate']) {
        console.log(`  ⚠️  Auth Required: ${res.headers['www-authenticate']}`);
      }
      
      if (res.statusCode === 200) {
        console.log(`  ✅ SUCCESS - File is publicly accessible`);
      } else if (res.statusCode === 401) {
        console.log(`  ❌ UNAUTHORIZED - Bucket requires authentication`);
      } else if (res.statusCode === 403) {
        console.log(`  ❌ FORBIDDEN - Access denied`);
      } else if (res.statusCode === 404) {
        console.log(`  ❌ NOT FOUND - File doesn't exist`);
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
  // Test direct B2 access with different formats
  const tests = [
    {
      name: 'S3-compatible path style',
      url: `https://${B2_ENDPOINT}/${BUCKET_NAME}/${TEST_KEY}`
    },
    {
      name: 'S3-compatible virtual host style',
      url: `https://${BUCKET_NAME}.${B2_ENDPOINT}/${TEST_KEY}`
    },
    {
      name: 'B2 native download URL',
      url: `https://${B2_ENDPOINT}/file/${BUCKET_NAME}/${TEST_KEY}`
    }
  ];
  
  for (const test of tests) {
    await testURL(test.url, test.name);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 DIAGNOSIS:');
  console.log('\nIf S3-compatible path style works (200):');
  console.log('  ✅ Bucket is public and accessible');
  console.log('  ⚠️  Cloudflare CNAME might be pointing to wrong endpoint');
  console.log('\nIf all return 401:');
  console.log('  ❌ Bucket is NOT public despite UI showing "Public"');
  console.log('  💡 Solution: Check bucket "Bucket Info" settings in B2 console');
  console.log('  💡 Look for "Bucket Type" - should be "Public"');
  console.log('  💡 Check "Bucket Authorization" - should allow public access');
}

main().catch(console.error);
