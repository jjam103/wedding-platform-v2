#!/usr/bin/env node

/**
 * Verify E2E Environment Configuration
 * 
 * This script verifies that .env.e2e is properly loaded and all required
 * environment variables are available for E2E tests.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.e2e
const result = dotenv.config({ path: join(rootDir, '.env.e2e') });

if (result.error) {
  console.error('❌ Failed to load .env.e2e:', result.error.message);
  process.exit(1);
}

console.log('✅ Successfully loaded .env.e2e\n');

// Required environment variables for E2E tests
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_BASE_URL',
  'E2E_WORKERS',
];

// Optional but recommended variables
const optionalVars = [
  'B2_ACCESS_KEY_ID',
  'B2_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'GEMINI_API_KEY',
  'E2E_HEADLESS',
  'E2E_TIMEOUT',
];

console.log('📋 Checking required environment variables:\n');

let allPresent = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    allPresent = false;
  }
}

console.log('\n📋 Checking optional environment variables:\n');

for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
  }
}

console.log('\n' + '='.repeat(60));

if (allPresent) {
  console.log('✅ All required environment variables are set!');
  console.log('✨ E2E tests are ready to run.');
  process.exit(0);
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('⚠️  Please check your .env.e2e file.');
  process.exit(1);
}
