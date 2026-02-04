#!/usr/bin/env node

/**
 * Test CORS headers from CDN
 * This checks if the Cloudflare Worker is setting proper CORS headers
 */

const testUrl = 'https://cdn.jamara.us/photos/1770094855401-IMG_0627.jpeg';

console.log('🔍 Testing CORS headers...\n');
console.log(`URL: ${testUrl}\n`);

try {
  const response = await fetch(testUrl);
  
  console.log('📊 Response Status:', response.status, response.statusText);
  console.log('\n📋 CORS-Related Headers:');
  console.log('  Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin') || '❌ MISSING');
  console.log('  Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods') || '(not set)');
  console.log('  Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers') || '(not set)');
  console.log('  Access-Control-Expose-Headers:', response.headers.get('Access-Control-Expose-Headers') || '(not set)');
  
  console.log('\n📋 Other Important Headers:');
  console.log('  Content-Type:', response.headers.get('Content-Type') || '❌ MISSING');
  console.log('  Cache-Control:', response.headers.get('Cache-Control') || '(not set)');
  console.log('  CF-Cache-Status:', response.headers.get('CF-Cache-Status') || '(not set)');
  console.log('  x-amz-request-id:', response.headers.get('x-amz-request-id') || '(not set)');
  
  console.log('\n📋 All Response Headers:');
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Check if CORS is properly configured
  const corsHeader = response.headers.get('Access-Control-Allow-Origin');
  
  if (!corsHeader) {
    console.log('\n❌ PROBLEM FOUND: Missing Access-Control-Allow-Origin header');
    console.log('\n🔧 FIX: Update your Cloudflare Worker to include CORS headers:');
    console.log(`
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000');
    return newResponse;
    `);
  } else if (corsHeader === '*') {
    console.log('\n✅ CORS is properly configured (allows all origins)');
  } else {
    console.log(`\n⚠️  CORS is configured but restrictive: ${corsHeader}`);
  }
  
  if (response.status === 200) {
    console.log('\n✅ Image is accessible (HTTP 200)');
  } else {
    console.log(`\n❌ Image returned ${response.status} ${response.statusText}`);
  }
  
} catch (error) {
  console.error('\n❌ Error testing CORS:', error.message);
  process.exit(1);
}
