#!/usr/bin/env node

/**
 * Verify E2E Authentication Fix
 * 
 * This script verifies that the E2E authentication fix is working correctly by:
 * 1. Checking that .auth/user.json exists and contains valid cookies
 * 2. Verifying admin user exists in test database
 * 3. Testing that saved auth state grants admin access
 * 
 * Run this after applying the E2E auth session fix to verify it works.
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

console.log('\n🔍 E2E Authentication Fix Verification\n');
console.log('=' .repeat(60));

// Check 1: Verify environment variables
console.log('\n1️⃣  Checking environment variables...');
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Please ensure .env.e2e is configured correctly');
  process.exit(1);
}
console.log('✅ Environment variables configured');

// Check 2: Verify .auth directory and admin.json file
console.log('\n2️⃣  Checking authentication state file...');
const authDir = path.join(__dirname, '..', '.auth');
const authFilePath = path.join(authDir, 'admin.json');

if (!fs.existsSync(authDir)) {
  console.error('❌ .auth directory does not exist');
  console.error('   Run: npm run test:e2e to trigger global-setup');
  process.exit(1);
}

if (!fs.existsSync(authFilePath)) {
  console.error('❌ .auth/admin.json does not exist');
  console.error('   Run: npm run test:e2e to trigger global-setup');
  process.exit(1);
}

console.log('✅ .auth/admin.json exists');

// Check 3: Validate auth state file contents
console.log('\n3️⃣  Validating authentication state contents...');
let authState;
try {
  authState = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
} catch (error) {
  console.error('❌ Failed to parse .auth/user.json');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

const hasCookies = authState.cookies && authState.cookies.length > 0;
const hasAuthCookies = authState.cookies?.some(c => 
  c.name.includes('auth') || c.name.includes('session') || c.name.includes('sb-')
);

console.log(`   Total cookies: ${authState.cookies?.length || 0}`);
console.log(`   Has auth cookies: ${hasAuthCookies ? '✅' : '❌'}`);
console.log(`   Origins: ${authState.origins?.length || 0}`);

if (!hasCookies) {
  console.error('❌ No cookies in authentication state');
  console.error('   The auth state file is empty or corrupted');
  console.error('   Delete .auth/ and run: npm run test:e2e');
  process.exit(1);
}

if (!hasAuthCookies) {
  console.warn('⚠️  Warning: No authentication cookies found');
  console.warn('   Auth state may not work properly');
}

console.log('✅ Authentication state contains cookies');

// Check 4: Verify admin user exists in database
console.log('\n4️⃣  Checking admin user in database...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data: adminUser, error: adminError } = await supabase
  .from('admin_users')
  .select('id, email, role, status')
  .eq('email', adminEmail)
  .maybeSingle();

if (adminError) {
  console.error('❌ Database query failed');
  console.error(`   Error: ${adminError.message}`);
  process.exit(1);
}

if (!adminUser) {
  console.error(`❌ Admin user not found: ${adminEmail}`);
  console.error('   Run: node scripts/create-e2e-admin-user.mjs');
  process.exit(1);
}

console.log(`✅ Admin user exists: ${adminUser.email}`);
console.log(`   Role: ${adminUser.role}`);
console.log(`   Status: ${adminUser.status}`);

if (adminUser.status !== 'active') {
  console.error('❌ Admin user is not active');
  console.error('   Update status in admin_users table');
  process.exit(1);
}

if (!['owner', 'admin'].includes(adminUser.role)) {
  console.error('❌ Admin user does not have required role');
  console.error(`   Current role: ${adminUser.role}`);
  console.error('   Required: owner or admin');
  process.exit(1);
}

// Check 5: Test authentication state with browser
console.log('\n5️⃣  Testing authentication state with browser...');
console.log('   Launching browser...');

const browser = await chromium.launch({ headless: true });
let testPassed = false;

try {
  // Create context with saved auth state
  const context = await browser.newContext({ storageState: authFilePath });
  const page = await context.newPage();
  
  console.log(`   Navigating to ${baseURL}/admin...`);
  
  // Try to access admin page
  await page.goto(`${baseURL}/admin`, { 
    timeout: 15000,
    waitUntil: 'networkidle'
  });
  
  // Wait a bit for any redirects
  await page.waitForTimeout(2000);
  
  const currentURL = page.url();
  console.log(`   Current URL: ${currentURL}`);
  
  // Check if we're on an admin page (not redirected to login)
  if (currentURL.includes('/admin') && !currentURL.includes('/auth/login')) {
    console.log('✅ Successfully accessed admin page with saved auth state');
    testPassed = true;
    
    // Try to find navigation elements to confirm page loaded
    try {
      await page.waitForSelector('nav[aria-label="Main navigation"]', { timeout: 5000 });
      console.log('✅ Admin navigation loaded successfully');
    } catch {
      console.warn('⚠️  Warning: Admin navigation not found (page may still be loading)');
    }
  } else {
    console.error('❌ Redirected to login page - authentication state not working');
    console.error(`   Expected: ${baseURL}/admin`);
    console.error(`   Got: ${currentURL}`);
  }
  
  await context.close();
} catch (error) {
  console.error('❌ Browser test failed');
  console.error(`   Error: ${error.message}`);
  
  if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
    console.error('\n   💡 Next.js dev server is not running!');
    console.error('   Start it with: npm run dev');
  }
} finally {
  await browser.close();
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Summary\n');

if (testPassed) {
  console.log('✅ All checks passed!');
  console.log('\nYour E2E authentication fix is working correctly.');
  console.log('You can now run the full E2E test suite:');
  console.log('  npm run test:e2e');
  process.exit(0);
} else {
  console.log('❌ Authentication test failed');
  console.log('\nTroubleshooting steps:');
  console.log('1. Ensure Next.js dev server is running: npm run dev');
  console.log('2. Delete .auth/ directory: rm -rf .auth/');
  console.log('3. Run E2E tests to regenerate auth state: npm run test:e2e');
  console.log('4. Check E2E_AUTH_SESSION_FIX_COMPLETE.md for more help');
  process.exit(1);
}
