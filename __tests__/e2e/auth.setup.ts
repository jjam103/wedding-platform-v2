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
  
  // Navigate to login page
  await page.goto('http://localhost:3000/auth/login');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Fill in login credentials
  const emailInput = page.locator('input[name="email"], input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill('jrnabelsohn@gmail.com');
  
  const passwordInput = page.locator('input[name="password"], input[type="password"]');
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('WeddingAdmin2026!');
  
  // Submit login form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('**/admin**', { timeout: 15000 });
  
  // Verify we're authenticated by checking for admin content
  const adminHeading = page.locator('h1, h2').first();
  await expect(adminHeading).toBeVisible({ timeout: 10000 });
  
  console.log('Authentication successful! Saving session state...');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log(`Session saved to ${authFile}`);
});

