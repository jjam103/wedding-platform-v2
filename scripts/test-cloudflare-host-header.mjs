#!/usr/bin/env node

/**
 * Test if Cloudflare is passing the correct Host header to B2
 */

async function testHostHeader() {
  console.log('🔍 Testing Host Header Forwarding\n');

  const testFile = 'photos/1770087981693-IMG_0627.jpeg';
  
  // Test with explicit Host header
  console.log('Test: Fetching from CDN with explicit Host header');
  const cdnUrl = `https://cdn.jamara.us/${testFile}`;
  
  try {
    const response = await fetch(cdnUrl, {
      method: 'GET',
      headers: {
        'Host': 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`CF-Cache-Status: ${response.headers.get('cf-cache-status')}`);
    console.log(`x-amz-request-id: ${response.headers.get('x-amz-request-id') || 'MISSING'}`);
    
    if (response.status === 200) {
      console.log('✅ Works with explicit Host header!\n');
    } else {
      console.log('❌ Still fails even with explicit Host header\n');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('💡 Diagnosis:\n');
  console.log('If the CDN is returning 404, it means Cloudflare is not');
  console.log('forwarding requests to B2 correctly.\n');
  console.log('This usually happens when:\n');
  console.log('1. The CNAME target is incorrect');
  console.log('2. There are Transform Rules modifying the request');
  console.log('3. The Host header is not being preserved\n');
  console.log('Next steps:');
  console.log('1. Double-check CNAME target in Cloudflare DNS');
  console.log('2. Check for any Transform Rules or Page Rules');
  console.log('3. Try setting "Origin Rules" in Cloudflare to preserve Host header');
}

testHostHeader().catch(console.error);
