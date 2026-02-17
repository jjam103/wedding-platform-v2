#!/usr/bin/env node

/**
 * Test script to verify magic link routes are accessible
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function testRoute(method, path, body = null) {
  console.log(`\n🧪 Testing ${method} ${path}`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return { error: error.message };
  }
}

async function main() {
  console.log('🔗 Testing Magic Link Routes');
  console.log(`   Base URL: ${BASE_URL}`);
  
  // Test 1: Request magic link (should return 404 if email not found, but route should exist)
  await testRoute('POST', '/api/auth/guest/request-magic-link', {
    email: 'test@example.com'
  });
  
  // Test 2: Verify magic link (should return error for invalid token, but route should exist)
  await testRoute('GET', '/api/auth/guest/verify-magic-link?token=invalid');
  
  console.log('\n✅ Route accessibility test complete');
}

main().catch(console.error);
