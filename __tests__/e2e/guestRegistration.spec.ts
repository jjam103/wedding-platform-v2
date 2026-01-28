/**
 * E2E Test: Complete Guest Registration Flow
 * 
 * Tests the full user journey from initial registration through dashboard access.
 * Validates authentication, data persistence, and UI interactions.
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Registration Flow', () => {
  const testEmail = `test-guest-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  test('should complete full guest registration flow', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Register/i);

    // 2. Fill out registration form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');

    // 3. Submit registration
    await page.click('button[type="submit"]');

    // 4. Verify success message
    await expect(page.locator('text=/registration successful/i')).toBeVisible({ timeout: 10000 });

    // 5. Verify redirect to dashboard
    await expect(page).toHaveURL(/\/guest\/dashboard/);

    // 6. Verify dashboard displays user information
    await expect(page.locator('text=/welcome.*john/i')).toBeVisible();
    await expect(page.locator('[data-testid="guest-name"]')).toContainText('John Doe');

    // 7. Verify navigation menu is accessible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href*="rsvp"]')).toBeVisible();
    await expect(page.locator('a[href*="itinerary"]')).toBeVisible();
  });

  test('should prevent XSS in registration form', async ({ page }) => {
    await page.goto('/auth/register');

    const xssPayload = '<script>alert("xss")</script>';
    
    await page.fill('input[name="firstName"]', xssPayload);
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');

    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });

    // Verify XSS payload was sanitized
    const nameElement = page.locator('[data-testid="guest-name"]');
    const nameText = await nameElement.textContent();
    
    expect(nameText).not.toContain('<script>');
    expect(nameText).not.toContain('alert');
    expect(nameText).not.toContain('xss');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Verify validation errors are displayed
    await expect(page.locator('text=/first name.*required/i')).toBeVisible();
    await expect(page.locator('text=/last name.*required/i')).toBeVisible();
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Verify email validation error
    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });

  test('should handle duplicate email registration', async ({ page }) => {
    // First registration
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });

    // Logout
    await page.click('button[aria-label="Logout"]');
    await page.waitForURL(/\/auth\/login/);

    // Try to register again with same email
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=/email.*already.*registered/i')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/register');

    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="firstName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="lastName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
  });

  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/register');

    // Check for basic accessibility requirements
    await expect(page.locator('form')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('type', 'email');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
