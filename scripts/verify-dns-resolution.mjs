#!/usr/bin/env node

/**
 * Verify DNS Resolution for Cloudflare CDN
 * Checks what the CNAME actually resolves to
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CDN_DOMAIN = 'cdn.jamara.us';
const EXPECTED_TARGET = 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com';

console.log('🔍 DNS Resolution Verification\n');
console.log('═'.repeat(60));

async function checkDNS() {
  try {
    console.log(`\n1️⃣  Checking CNAME record for ${CDN_DOMAIN}...\n`);
    
    const { stdout: digOutput } = await execAsync(`dig ${CDN_DOMAIN} CNAME +short`);
    const cnameTarget = digOutput.trim();
    
    if (!cnameTarget) {
      console.log('❌ No CNAME record found!');
      console.log('\nThis means the DNS record might not exist or is not a CNAME.');
      return;
    }
    
    console.log(`Current CNAME target: ${cnameTarget}`);
    console.log(`Expected target:      ${EXPECTED_TARGET}`);
    
    if (cnameTarget === EXPECTED_TARGET || cnameTarget === EXPECTED_TARGET + '.') {
      console.log('\n✅ CNAME target is CORRECT!');
    } else {
      console.log('\n❌ CNAME target is INCORRECT!');
      console.log('\n📝 Action Required:');
      console.log('   1. Go to Cloudflare Dashboard');
      console.log('   2. Navigate to DNS settings');
      console.log('   3. Click "Edit" on the cdn CNAME record');
      console.log('   4. Change target to:');
      console.log(`      ${EXPECTED_TARGET}`);
      console.log('   5. Save and wait 2-3 minutes');
    }
    
    console.log('\n2️⃣  Checking IP resolution...\n');
    
    const { stdout: ipOutput } = await execAsync(`dig ${CDN_DOMAIN} +short`);
    const ips = ipOutput.trim().split('\n').filter(line => line.match(/^\d+\.\d+\.\d+\.\d+$/));
    
    if (ips.length > 0) {
      console.log('Resolved IPs (Cloudflare proxied):');
      ips.forEach(ip => console.log(`  - ${ip}`));
      console.log('\n✅ DNS is resolving through Cloudflare proxy');
    } else {
      console.log('❌ No IP addresses resolved');
    }
    
    console.log('\n3️⃣  Checking B2 endpoint resolution...\n');
    
    const { stdout: b2Output } = await execAsync(`dig ${EXPECTED_TARGET} +short`);
    const b2Ips = b2Output.trim().split('\n').filter(line => line.match(/^\d+\.\d+\.\d+\.\d+$/));
    
    if (b2Ips.length > 0) {
      console.log('B2 endpoint IPs:');
      b2Ips.forEach(ip => console.log(`  - ${ip}`));
      console.log('\n✅ B2 endpoint is reachable');
    } else {
      console.log('❌ B2 endpoint not resolving');
    }
    
  } catch (error) {
    console.log(`\n❌ Error running DNS checks: ${error.message}`);
    console.log('\nNote: This script requires the "dig" command.');
    console.log('On macOS, it should be available by default.');
  }
}

async function checkCloudflareCache() {
  console.log('\n4️⃣  Checking Cloudflare cache status...\n');
  
  const https = await import('https');
  
  return new Promise((resolve) => {
    https.get(`https://${CDN_DOMAIN}/photos/test-cache-${Date.now()}.jpg`, { timeout: 5000 }, (res) => {
      console.log(`Cache Status: ${res.headers['cf-cache-status'] || 'UNKNOWN'}`);
      console.log(`CF-Ray: ${res.headers['cf-ray'] || 'UNKNOWN'}`);
      
      if (res.headers['cf-cache-status'] === 'HIT') {
        console.log('\n⚠️  Cloudflare is serving cached responses');
        console.log('   You need to purge the cache in Cloudflare Dashboard:');
        console.log('   1. Go to Caching > Configuration');
        console.log('   2. Click "Purge Everything"');
        console.log('   3. Wait 30 seconds');
        console.log('   4. Test again');
      }
      
      res.resume();
      resolve();
    }).on('error', () => resolve());
  });
}

console.log('\n📋 Summary of Required Configuration:\n');
console.log('Cloudflare DNS Record:');
console.log('  Type:   CNAME');
console.log('  Name:   cdn');
console.log('  Target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com');
console.log('  Proxy:  ON (orange cloud ☁️)');
console.log('  TTL:    Auto');

console.log('\n' + '═'.repeat(60));

await checkDNS();
await checkCloudflareCache();

console.log('\n' + '═'.repeat(60));
console.log('\n💡 Next Steps:\n');
console.log('1. If CNAME is incorrect, update it in Cloudflare Dashboard');
console.log('2. Purge Cloudflare cache (Caching > Purge Everything)');
console.log('3. Wait 2-3 minutes for changes to propagate');
console.log('4. Run: node scripts/test-cdn-final.mjs');
console.log('\n');
