#!/usr/bin/env node

/**
 * Test Cloudflare Configuration
 * Checks if Cloudflare is properly forwarding requests to B2
 */

async function testCloudflareConfig() {
  console.log('🔍 Testing Cloudflare Configuration\n');

  const testFile = 'photos/1770087981693-IMG_0627.jpeg';
  
  // Test 1: Direct B2 URL (should work)
  console.log('Test 1: Direct B2 URL');
  const directUrl = `https://wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com/${testFile}`;
  console.log(`URL: ${directUrl}`);
  
  try {
    const response = await fetch(directUrl, { method: 'HEAD' });
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Content-Length: ${response.headers.get('content-length')}`);
    console.log('✅ Direct B2 URL works\n');
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: CDN URL (currently failing)
  console.log('Test 2: Cloudflare CDN URL');
  const cdnUrl = `https://cdn.jamara.us/${testFile}`;
  console.log(`URL: ${cdnUrl}`);
  
  try {
    const response = await fetch(cdnUrl, { method: 'HEAD' });
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Server: ${response.headers.get('server')}`);
    console.log(`CF-Cache-Status: ${response.headers.get('cf-cache-status')}`);
    console.log(`CF-Ray: ${response.headers.get('cf-ray')}`);
    console.log(`x-amz-request-id: ${response.headers.get('x-amz-request-id') || 'MISSING'}`);
    
    if (response.status === 404) {
      console.log('❌ CDN returns 404\n');
    } else {
      console.log('✅ CDN works!\n');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Check DNS resolution
  console.log('Test 3: DNS Resolution Check');
  console.log('Run this command to verify DNS:');
  console.log('  dig cdn.jamara.us CNAME\n');
  console.log('Expected CNAME target:');
  console.log('  wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com\n');

  // Test 4: Troubleshooting steps
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 Troubleshooting Steps:\n');
  console.log('1. Verify CNAME in Cloudflare Dashboard:');
  console.log('   - Type: CNAME');
  console.log('   - Name: cdn');
  console.log('   - Target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com');
  console.log('   - Proxy status: Proxied (orange cloud)\n');
  
  console.log('2. Check for Transform Rules:');
  console.log('   - Go to Rules > Transform Rules');
  console.log('   - Look for any rules affecting cdn.jamara.us');
  console.log('   - Disable any rules that modify the path\n');
  
  console.log('3. Check for Page Rules:');
  console.log('   - Go to Rules > Page Rules');
  console.log('   - Look for any rules affecting cdn.jamara.us');
  console.log('   - Disable any rules that might interfere\n');
  
  console.log('4. Purge Cache Again:');
  console.log('   - Go to Caching > Configuration');
  console.log('   - Click "Purge Everything"');
  console.log('   - Wait 30 seconds and test again\n');
  
  console.log('5. Wait for DNS Propagation:');
  console.log('   - DNS changes can take 1-5 minutes');
  console.log('   - Run this script again in 2 minutes\n');
}

testCloudflareConfig().catch(console.error);
