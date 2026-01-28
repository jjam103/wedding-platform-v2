/**
 * E2E Test: Complete Email Sending Flow
 * 
 * Tests the full email lifecycle from template creation through sending
 * and delivery tracking.
 */

import { test, expect } from '@playwright/test';

test.describe('Email Sending Flow', () => {
  const adminEmail = `email-admin-${Date.now()}@example.com`;
  const guestEmail = `email-guest-${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test.beforeEach(async ({ page }) => {
    // Register and login as admin
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Email');
    await page.fill('input[name="lastName"]', 'Admin');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'super_admin');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  });

  test('should create email template', async ({ page }) => {
    // Navigate to email management
    await page.click('a[href*="emails"]');
    await expect(page).toHaveURL(/\/admin\/emails/);

    // Click create template
    await page.click('button[data-action="create-template"]');

    // Fill template form
    await page.fill('input[name="templateName"]', 'RSVP Reminder');
    await page.fill('input[name="subject"]', 'Please RSVP for {{eventName}}');
    await page.fill('textarea[name="body"]', 'Hi {{firstName}}, please remember to RSVP for {{eventName}} by {{deadline}}.');

    // Save template
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=/template.*created/i')).toBeVisible();
    await expect(page.locator('[data-testid="template-list"]')).toContainText('RSVP Reminder');
  });

  test('should send single email', async ({ page }) => {
    // Create guest first
    await page.goto('/admin/guests');
    await page.click('button[data-action="add-guest"]');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Guest');
    await page.fill('input[name="email"]', guestEmail);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/guest.*added/i');

    // Navigate to email management
    await page.goto('/admin/emails');

    // Click send email
    await page.click('button[data-action="send-email"]');

    // Select recipient
    await page.fill('input[name="recipientEmail"]', guestEmail);

    // Fill email details
    await page.fill('input[name="subject"]', 'Welcome to our wedding!');
    await page.fill('textarea[name="body"]', 'We are excited to celebrate with you.');

    // Send email
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=/email.*sent/i')).toBeVisible({ timeout: 10000 });
  });

  test('should send bulk email', async ({ page }) => {
    // Navigate to email management
    await page.goto('/admin/emails');

    // Click bulk send
    await page.click('button[data-action="bulk-send"]');

    // Select recipients
    await page.click('input[name="selectAll"]');

    // Fill email details
    await page.fill('input[name="subject"]', 'Important Update');
    await page.fill('textarea[name="body"]', 'Dear guests, here is an important update about the wedding.');

    // Send bulk email
    await page.click('button[type="submit"]');

    // Verify confirmation dialog
    await expect(page.locator('text=/send.*to.*guests/i')).toBeVisible();
    await page.click('button[data-action="confirm"]');

    // Verify success
    await expect(page.locator('text=/emails.*queued/i')).toBeVisible({ timeout: 10000 });
  });

  test('should use template variables', async ({ page }) => {
    // Create template with variables
    await page.goto('/admin/emails');
    await page.click('button[data-action="create-template"]');
    await page.fill('input[name="templateName"]', 'Personalized Welcome');
    await page.fill('input[name="subject"]', 'Welcome {{firstName}}!');
    await page.fill('textarea[name="body"]', 'Hi {{firstName}} {{lastName}}, welcome to our wedding celebration!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/template.*created/i');

    // Send email using template
    await page.click('button[data-action="send-email"]');
    await page.selectOption('select[name="template"]', 'Personalized Welcome');

    // Verify variables are shown
    await expect(page.locator('text=/{{firstName}}/i')).toBeVisible();
    await expect(page.locator('text=/{{lastName}}/i')).toBeVisible();

    // Fill recipient
    await page.fill('input[name="recipientEmail"]', guestEmail);

    // Send
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/email.*sent/i')).toBeVisible();
  });

  test('should track email delivery status', async ({ page }) => {
    // Send email
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');
    await page.fill('input[name="recipientEmail"]', guestEmail);
    await page.fill('input[name="subject"]', 'Test Delivery Tracking');
    await page.fill('textarea[name="body"]', 'Testing delivery status');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/email.*sent/i');

    // Navigate to delivery tracking
    await page.click('a[href*="email-tracking"]');

    // Verify email appears in tracking list
    await expect(page.locator('[data-testid="email-log"]')).toContainText('Test Delivery Tracking');
    await expect(page.locator('[data-testid="email-status"]')).toContainText(/sent|delivered|pending/i);
  });

  test('should schedule email for future delivery', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Fill email details
    await page.fill('input[name="recipientEmail"]', guestEmail);
    await page.fill('input[name="subject"]', 'Scheduled Email');
    await page.fill('textarea[name="body"]', 'This email is scheduled for future delivery');

    // Enable scheduling
    await page.click('input[name="scheduleEmail"]');

    // Set future date/time
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    await page.fill('input[name="scheduledDate"]', futureDate.toISOString().split('T')[0]);
    await page.fill('input[name="scheduledTime"]', '10:00');

    // Schedule email
    await page.click('button[type="submit"]');

    // Verify scheduled
    await expect(page.locator('text=/email.*scheduled/i')).toBeVisible();
  });

  test('should validate email addresses', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Enter invalid email
    await page.fill('input[name="recipientEmail"]', 'invalid-email');
    await page.fill('input[name="subject"]', 'Test');
    await page.fill('textarea[name="body"]', 'Test body');
    await page.click('button[type="submit"]');

    // Verify validation error
    await expect(page.locator('text=/valid.*email/i')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Try to send without filling fields
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=/recipient.*required/i')).toBeVisible();
    await expect(page.locator('text=/subject.*required/i')).toBeVisible();
    await expect(page.locator('text=/body.*required/i')).toBeVisible();
  });

  test('should sanitize email content', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Enter XSS payload
    const xssPayload = '<script>alert("xss")</script>Important message';
    await page.fill('input[name="recipientEmail"]', guestEmail);
    await page.fill('input[name="subject"]', 'Test');
    await page.fill('textarea[name="body"]', xssPayload);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=/email.*sent/i');

    // Check email log
    await page.click('a[href*="email-tracking"]');
    const emailBody = await page.locator('[data-testid="email-body"]').first().textContent();

    // Verify XSS was sanitized
    expect(emailBody).not.toContain('<script>');
    expect(emailBody).not.toContain('alert');
  });

  test('should preview email before sending', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    await page.fill('input[name="recipientEmail"]', guestEmail);
    await page.fill('input[name="subject"]', 'Preview Test');
    await page.fill('textarea[name="body"]', 'This is a preview test');

    // Click preview
    await page.click('button[data-action="preview"]');

    // Verify preview modal
    await expect(page.locator('[data-testid="email-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-subject"]')).toContainText('Preview Test');
    await expect(page.locator('[data-testid="preview-body"]')).toContainText('This is a preview test');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="recipientEmail"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="subject"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('textarea[name="body"]')).toBeFocused();
  });

  test('should have accessible form elements', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.click('button[data-action="send-email"]');

    // Verify accessibility
    await expect(page.locator('form')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="recipientEmail"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="subject"]')).toHaveAttribute('aria-label');
    await expect(page.locator('textarea[name="body"]')).toHaveAttribute('aria-label');
  });
});
