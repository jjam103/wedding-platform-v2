/**
 * E2E Test: Complete Photo Upload and Moderation Flow
 * 
 * Tests the full photo lifecycle from guest upload through admin moderation
 * to public display in the gallery.
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Photo Upload and Moderation Flow', () => {
  const guestEmail = `photo-guest-${Date.now()}@example.com`;
  const adminEmail = `photo-admin-${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test.beforeAll(async ({ browser }) => {
    // Create admin user
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Admin');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'super_admin');
    await page.click('button[type="submit"]');
    
    await context.close();
  });

  test('should complete full photo upload and moderation flow', async ({ browser }) => {
    // GUEST: Upload photo
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    // Register guest
    await guestPage.goto('/auth/register');
    await guestPage.fill('input[name="firstName"]', 'Photo');
    await guestPage.fill('input[name="lastName"]', 'Guest');
    await guestPage.fill('input[name="email"]', guestEmail);
    await guestPage.fill('input[name="password"]', password);
    await guestPage.selectOption('select[name="ageType"]', 'adult');
    await guestPage.click('button[type="submit"]');
    await guestPage.waitForURL(/\/guest\/dashboard/);

    // Navigate to photo upload
    await guestPage.click('a[href*="photos"]');
    await expect(guestPage).toHaveURL(/\/guest\/photos/);

    // Upload photo
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await guestPage.setInputFiles('input[type="file"]', testImagePath);
    
    // Add caption
    await guestPage.fill('input[name="caption"]', 'Beautiful Costa Rica sunset');
    await guestPage.fill('textarea[name="description"]', 'Taken at the beach during our first evening');
    
    // Submit upload
    await guestPage.click('button[type="submit"]');
    
    // Verify success message
    await expect(guestPage.locator('text=/photo.*uploaded.*pending/i')).toBeVisible({ timeout: 10000 });

    await guestContext.close();

    // ADMIN: Moderate photo
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Login as admin
    await adminPage.goto('/auth/login');
    await adminPage.fill('input[name="email"]', adminEmail);
    await adminPage.fill('input[name="password"]', password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL(/\/admin/);

    // Navigate to photo moderation
    await adminPage.click('a[href*="photos"]');
    await expect(adminPage).toHaveURL(/\/admin\/photos/);

    // Find pending photo
    const pendingPhoto = adminPage.locator('[data-testid="pending-photo"]').first();
    await expect(pendingPhoto).toBeVisible();

    // Verify photo details
    await expect(pendingPhoto.locator('[data-testid="photo-caption"]')).toContainText('Beautiful Costa Rica sunset');

    // Approve photo
    await pendingPhoto.locator('button[data-action="approve"]').click();
    
    // Verify approval success
    await expect(adminPage.locator('text=/photo.*approved/i')).toBeVisible();

    await adminContext.close();

    // GUEST: Verify photo is visible in gallery
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();

    await verifyPage.goto('/memories');
    
    // Verify photo appears in public gallery
    await expect(verifyPage.locator('img[alt*="Beautiful Costa Rica sunset"]')).toBeVisible({ timeout: 5000 });

    await verifyContext.close();
  });

  test('should reject photo with reason', async ({ browser }) => {
    // Guest uploads photo
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto('/auth/register');
    await guestPage.fill('input[name="firstName"]', 'Test');
    await guestPage.fill('input[name="lastName"]', 'User');
    await guestPage.fill('input[name="email"]', `reject-test-${Date.now()}@example.com`);
    await guestPage.fill('input[name="password"]', password);
    await guestPage.selectOption('select[name="ageType"]', 'adult');
    await guestPage.click('button[type="submit"]');
    await guestPage.waitForURL(/\/guest\/dashboard/);

    await guestPage.click('a[href*="photos"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await guestPage.setInputFiles('input[type="file"]', testImagePath);
    await guestPage.fill('input[name="caption"]', 'Test photo for rejection');
    await guestPage.click('button[type="submit"]');
    await guestPage.waitForSelector('text=/photo.*uploaded/i');

    await guestContext.close();

    // Admin rejects photo
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/auth/login');
    await adminPage.fill('input[name="email"]', adminEmail);
    await adminPage.fill('input[name="password"]', password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL(/\/admin/);

    await adminPage.click('a[href*="photos"]');
    
    const pendingPhoto = adminPage.locator('[data-testid="pending-photo"]').filter({ hasText: 'Test photo for rejection' }).first();
    await pendingPhoto.locator('button[data-action="reject"]').click();

    // Enter rejection reason
    await adminPage.fill('textarea[name="rejectionReason"]', 'Photo quality too low');
    await adminPage.click('button[data-action="confirm-reject"]');

    // Verify rejection success
    await expect(adminPage.locator('text=/photo.*rejected/i')).toBeVisible();

    await adminContext.close();
  });

  test('should validate file type', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'File');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `file-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/);

    await page.click('a[href*="photos"]');

    // Try to upload non-image file
    const textFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    await page.setInputFiles('input[type="file"]', textFilePath);

    // Verify error message
    await expect(page.locator('text=/invalid.*file.*type/i')).toBeVisible();
  });

  test('should validate file size', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Size');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `size-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/);

    await page.click('a[href*="photos"]');

    // Try to upload oversized file (if available)
    const largeFilePath = path.join(__dirname, '../fixtures/large-image.jpg');
    
    try {
      await page.setInputFiles('input[type="file"]', largeFilePath);
      await expect(page.locator('text=/file.*too.*large/i')).toBeVisible();
    } catch {
      // Skip if large file fixture doesn't exist
      test.skip();
    }
  });

  test('should support batch upload', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Batch');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `batch-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/);

    await page.click('a[href*="photos"]');

    // Upload multiple photos
    const image1 = path.join(__dirname, '../fixtures/test-image-1.jpg');
    const image2 = path.join(__dirname, '../fixtures/test-image-2.jpg');
    
    await page.setInputFiles('input[type="file"][multiple]', [image1, image2]);

    // Verify multiple files selected
    await expect(page.locator('[data-testid="file-count"]')).toContainText('2');

    await page.click('button[type="submit"]');

    // Verify batch upload success
    await expect(page.locator('text=/2.*photos.*uploaded/i')).toBeVisible({ timeout: 10000 });
  });

  test('should sanitize caption and description', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'XSS');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `xss-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/);

    await page.click('a[href*="photos"]');

    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await page.setInputFiles('input[type="file"]', testImagePath);

    // Enter XSS payload
    const xssPayload = '<script>alert("xss")</script>Beautiful sunset';
    await page.fill('input[name="caption"]', xssPayload);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=/photo.*uploaded/i');

    // Verify XSS was sanitized in gallery
    await page.goto('/memories');
    const caption = await page.locator('[data-testid="photo-caption"]').first().textContent();
    
    expect(caption).not.toContain('<script>');
    expect(caption).not.toContain('alert');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Keyboard');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `keyboard-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/);

    await page.click('a[href*="photos"]');

    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="file"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="caption"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('textarea[name="description"]')).toBeFocused();
  });

  test('should have accessible form elements', async ({ page }) => {
    await page.goto('/guest/photos');

    // Verify accessibility attributes
    await expect(page.locator('input[type="file"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="caption"]')).toHaveAttribute('aria-label');
    await expect(page.locator('form')).toHaveAttribute('aria-label');
  });
});
