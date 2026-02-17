#!/usr/bin/env node

/**
 * Debug browser login to see what's happening
 */

import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const email = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const password = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

console.log('🌐 Testing browser login with debug...');
console.log(`   Email: ${email}`);
console.log(`   Password: ${password.substring(0, 4)}***`);
console.log(`   Base URL: ${baseURL}`);
console.log('');

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const context = await browser.newContext();
const page = await context.newPage();

// Listen to all console messages
page.on('console', msg => {
  console.log(`[Browser ${msg.type()}]:`, msg.text());
});

// Listen to network requests
page.on('request', request => {
  if (request.url().includes('auth') || request.url().includes('login')) {
    console.log(`[Network] → ${request.method()} ${request.url()}`);
  }
});

page.on('response', response => {
  if (response.url().includes('auth') || response.url().includes('login')) {
    console.log(`[Network] ← ${response.status()} ${response.url()}`);
  }
});

try {
  // Navigate to login page
  console.log('1️⃣  Navigating to login page...');
  await page.goto(`${baseURL}/auth/login`, { waitUntil: 'networkidle' });
  console.log('   ✅ Page loaded');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/login-page.png' });
  console.log('   📸 Screenshot saved: test-results/login-page.png');
  
  // Fill in form
  console.log('2️⃣  Filling in login form...');
  await page.fill('#email', email);
  await page.fill('#password', password);
  console.log('   ✅ Form filled');
  
  // Submit form
  console.log('3️⃣  Submitting form...');
  await page.click('button[type="submit"]');
  
  // Wait a bit to see what happens
  await page.waitForTimeout(5000);
  
  // Check current URL
  const currentURL = page.url();
  console.log(`4️⃣  Current URL: ${currentURL}`);
  
  // Check for error messages
  const errorElement = page.locator('.bg-volcano-50');
  const hasError = await errorElement.isVisible().catch(() => false);
  
  if (hasError) {
    const errorText = await errorElement.textContent();
    console.log(`   ❌ Error message: ${errorText}`);
    await page.screenshot({ path: 'test-results/login-error.png' });
    console.log('   📸 Error screenshot saved: test-results/login-error.png');
  }
  
  // Check if we're on admin page
  if (currentURL.includes('/admin')) {
    console.log('   ✅ Successfully logged in!');
    await page.screenshot({ path: 'test-results/admin-dashboard.png' });
    console.log('   📸 Dashboard screenshot saved: test-results/admin-dashboard.png');
  } else {
    console.log('   ❌ Login failed - still on login page');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  await page.screenshot({ path: 'test-results/error.png' });
} finally {
  console.log('');
  console.log('Press Ctrl+C to close browser...');
  // Keep browser open for inspection
  await page.waitForTimeout(30000);
  await browser.close();
}
