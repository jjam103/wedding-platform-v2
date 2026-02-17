#!/usr/bin/env node

/**
 * Verify E2E Environment Variable Configuration
 * 
 * This script checks if NEXT_PUBLIC_E2E_TEST is properly configured
 * and accessible in the Next.js runtime.
 */

console.log('🔍 Verifying E2E Environment Configuration\n');

console.log('Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  NEXT_PUBLIC_E2E_TEST:', process.env.NEXT_PUBLIC_E2E_TEST);
console.log('  E2E_TEST (old):', process.env.E2E_TEST);
console.log('');

// Check if the new variable is set
if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
  console.log('✅ NEXT_PUBLIC_E2E_TEST is correctly set to "true"');
  console.log('✅ E2E test mode should activate in Next.js runtime');
} else {
  console.log('❌ NEXT_PUBLIC_E2E_TEST is NOT set or not "true"');
  console.log('❌ E2E test mode will NOT activate');
  console.log('');
  console.log('Troubleshooting:');
  console.log('1. Check .env.test.e2e has: NEXT_PUBLIC_E2E_TEST=true');
  console.log('2. Restart the Next.js server to pick up new env vars');
  console.log('3. Verify playwright.config.ts passes NEXT_PUBLIC_E2E_TEST');
}

console.log('');
console.log('Expected behavior in E2E tests:');
console.log('- Email service should log: "[emailService.sendEmail] E2E Test Mode - Skipping Resend API call"');
console.log('- Photo service should log: "🧪 [PhotoService] Using MOCK B2 service"');
console.log('- Service detector should log: "🧪 [SERVICE DETECTOR] E2E test mode detected"');
