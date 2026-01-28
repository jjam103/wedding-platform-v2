#!/usr/bin/env node

/**
 * Simple diagnostic script to check admin dashboard health
 * Run with: node scripts/check-admin-dashboard.js
 */

const http = require('http');

const checks = [
  {
    name: 'Admin Dashboard Page',
    path: '/admin',
    expectedStatus: 200,
  },
  {
    name: 'Admin Metrics API',
    path: '/api/admin/metrics',
    expectedStatus: 200,
  },
  {
    name: 'Admin Alerts API',
    path: '/api/admin/alerts',
    expectedStatus: 200,
  },
];

function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {
        'Cookie': 'sb-access-token=test', // Mock auth for testing
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          hasHtml: data.includes('<html') || data.includes('<!DOCTYPE'),
          hasJson: data.trim().startsWith('{') || data.trim().startsWith('['),
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

async function runChecks() {
  console.log('\n🔍 Admin Dashboard Health Check\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    process.stdout.write(`\nChecking: ${check.name}...`);
    
    const result = await checkEndpoint(check.path);
    
    if (result.error) {
      console.log(` ❌ FAILED`);
      console.log(`   Error: ${result.error}`);
      failed++;
    } else if (result.status === check.expectedStatus) {
      console.log(` ✅ PASSED`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Content-Type: ${result.headers['content-type']}`);
      console.log(`   Body Length: ${result.bodyLength} bytes`);
      if (result.hasHtml) {
        console.log(`   Format: HTML`);
      } else if (result.hasJson) {
        console.log(`   Format: JSON`);
      }
      passed++;
    } else {
      console.log(` ❌ FAILED`);
      console.log(`   Expected: ${check.expectedStatus}, Got: ${result.status}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✨ All checks passed! Admin dashboard is healthy.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if dev server is running on http://localhost:3000...\n');

checkEndpoint('/').then((result) => {
  if (result.error) {
    console.log('❌ Dev server is not running!');
    console.log(`   Error: ${result.error}`);
    console.log('\n💡 Please start the dev server with: npm run dev\n');
    process.exit(1);
  } else {
    console.log('✅ Dev server is running\n');
    runChecks();
  }
});
