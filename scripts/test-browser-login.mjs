#!/usr/bin/env node
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

async function main() {
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';
  
  console.log('🌐 Testing browser login...');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });
  
  // Navigate to login page
  console.log('1️⃣ Navigating to login page...');
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in form
  console.log('2️⃣ Filling in login form...');
  await page.fill('#email', email);
  await page.fill('#password', password);
  
  // Submit
  console.log('3️⃣ Submitting form...');
  await page.click('button[type="submit"]');
  
  // Wait for response
  console.log('4️⃣ Waiting for response...');
  await page.waitForTimeout(3000);
  
  // Check URL
  const currentURL = page.url();
  console.log('5️⃣ Current URL:', currentURL);
  
  // Check for error message
  const errorElement = page.locator('.bg-volcano-50');
  const hasError = await errorElement.isVisible().catch(() => false);
  
  if (hasError) {
    const errorText = await errorElement.textContent();
    console.log('❌ Error message:', errorText);
  }
  
  // Check if redirected to admin
  if (currentURL.includes('/admin')) {
    console.log('✅ Login successful! Redirected to admin dashboard');
  } else {
    console.log('❌ Login failed - still on login page');
  }
  
  console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

main().catch(console.error);
