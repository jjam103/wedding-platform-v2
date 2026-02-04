import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Playwright Authentication Setup
 * 
 * This file runs before all E2E tests to authenticate once and save the session.
 * All tests will reuse this authenticated state, avoiding repeated logins.
 * 
 * The authentication state is saved to .auth/user.json and reused across tests.
 */

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  console.log('Setting up authentication for E2E tests...');
  
  // Enable console logging to debug issues
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('LOGIN') || msg.text().includes('Supabase')) {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    }
  });
  
  // Navigate to login page
  await page.goto('http://localhost:3000/auth/login');
  
  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  
  // Check if there are any error messages already visible
  const existingError = page.locator('div.bg-volcano-50');
  if (await existingError.isVisible()) {
    const errorText = await existingError.textContent();
    console.log('⚠️ Error already visible on page:', errorText);
  }
  
  // Fill in login credentials (use same credentials as global setup)
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password';
  
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(adminEmail);
  
  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(adminPassword);
  
  console.log('Credentials filled, clicking submit button...');
  
  // Click submit and wait a moment for the request to be made
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for either success (navigation) or error message
  try {
    await page.waitForURL('**/admin**', { timeout: 20000 });
    console.log('✅ Navigation to admin dashboard successful!');
  } catch (error) {
    // Check if there's an error message
    const errorDiv = page.locator('div.bg-volcano-50');
    if (await errorDiv.isVisible()) {
      const errorText = await errorDiv.textContent();
      console.error('❌ Login failed with error:', errorText);
      throw new Error(`Login failed: ${errorText}`);
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.error('❌ Navigation timeout. Current URL:', currentUrl);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-failure.png', fullPage: true });
    
    throw error;
  }
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Verify we're authenticated by checking for admin content
  const adminContent = page.locator('text=/dashboard|admin|welcome/i').first();
  await expect(adminContent).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Authentication successful! Saving session state...');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log(`✅ Session saved to ${authFile}`);
});

