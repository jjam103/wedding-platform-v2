/**
 * E2E Test: Complete RSVP Flow
 * 
 * Tests the full RSVP journey including event-level and activity-level RSVPs,
 * dietary restrictions, and capacity management.
 */

import { test, expect } from '@playwright/test';

test.describe('RSVP Flow', () => {
  const testEmail = `rsvp-test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });
  });

  test('should complete event-level RSVP', async ({ page }) => {
    // 1. Navigate to RSVP page
    await page.click('a[href*="rsvp"]');
    await expect(page).toHaveURL(/\/guest\/rsvp/);

    // 2. Select event to RSVP
    await page.click('[data-testid="event-card"]:first-child');

    // 3. Select attendance status
    await page.click('input[value="attending"]');

    // 4. Enter guest count
    await page.fill('input[name="guestCount"]', '2');

    // 5. Enter dietary restrictions
    await page.fill('textarea[name="dietaryRestrictions"]', 'Vegetarian, no nuts');

    // 6. Submit RSVP
    await page.click('button[type="submit"]');

    // 7. Verify success message
    await expect(page.locator('text=/rsvp.*submitted/i')).toBeVisible({ timeout: 5000 });

    // 8. Verify RSVP appears in dashboard
    await page.goto('/guest/dashboard');
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Attending');
  });

  test('should complete activity-level RSVP', async ({ page }) => {
    // Navigate to activities
    await page.click('a[href*="activities"]');
    await expect(page).toHaveURL(/\/guest\/activities/);

    // Select specific activity
    await page.click('[data-testid="activity-card"]:first-child');

    // RSVP to activity
    await page.click('input[value="attending"]');
    await page.fill('input[name="guestCount"]', '1');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=/activity.*rsvp.*confirmed/i')).toBeVisible();
  });

  test('should handle capacity limits', async ({ page }) => {
    // Navigate to activities
    await page.click('a[href*="activities"]');

    // Find activity at capacity
    const fullActivity = page.locator('[data-testid="activity-card"][data-capacity="full"]').first();
    
    if (await fullActivity.count() > 0) {
      await fullActivity.click();

      // Verify RSVP button is disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      await expect(page.locator('text=/capacity.*reached/i')).toBeVisible();
    }
  });

  test('should update existing RSVP', async ({ page }) => {
    // Submit initial RSVP
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');
    await page.click('input[value="attending"]');
    await page.fill('input[name="guestCount"]', '2');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/rsvp.*submitted/i');

    // Navigate back to RSVP page
    await page.goto('/guest/rsvp');
    await page.click('[data-testid="event-card"]:first-child');

    // Verify existing RSVP is pre-filled
    await expect(page.locator('input[value="attending"]')).toBeChecked();
    await expect(page.locator('input[name="guestCount"]')).toHaveValue('2');

    // Update RSVP
    await page.click('input[value="maybe"]');
    await page.fill('input[name="guestCount"]', '1');
    await page.click('button[type="submit"]');

    // Verify update success
    await expect(page.locator('text=/rsvp.*updated/i')).toBeVisible();
  });

  test('should decline RSVP', async ({ page }) => {
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');

    // Select declined
    await page.click('input[value="declined"]');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=/rsvp.*submitted/i')).toBeVisible();

    // Verify dashboard shows declined status
    await page.goto('/guest/dashboard');
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Declined');
  });

  test('should sanitize dietary restrictions input', async ({ page }) => {
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');
    await page.click('input[value="attending"]');

    // Enter XSS payload in dietary restrictions
    const xssPayload = '<script>alert("xss")</script>Vegetarian';
    await page.fill('textarea[name="dietaryRestrictions"]', xssPayload);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=/rsvp.*submitted/i');

    // Navigate to view RSVP
    await page.goto('/guest/rsvp');
    await page.click('[data-testid="event-card"]:first-child');

    // Verify XSS was sanitized
    const dietaryText = await page.locator('textarea[name="dietaryRestrictions"]').inputValue();
    expect(dietaryText).not.toContain('<script>');
    expect(dietaryText).not.toContain('alert');
  });

  test('should validate guest count', async ({ page }) => {
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');
    await page.click('input[value="attending"]');

    // Try negative guest count
    await page.fill('input[name="guestCount"]', '-1');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/guest count.*positive/i')).toBeVisible();

    // Try zero guest count
    await page.fill('input[name="guestCount"]', '0');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/guest count.*at least 1/i')).toBeVisible();
  });

  test('should show RSVP deadline warning', async ({ page }) => {
    await page.click('a[href*="rsvp"]');

    // Check for deadline warning if applicable
    const deadlineWarning = page.locator('[data-testid="rsvp-deadline-warning"]');
    
    if (await deadlineWarning.count() > 0) {
      await expect(deadlineWarning).toBeVisible();
      await expect(deadlineWarning).toContainText(/deadline/i);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');

    // Tab through RSVP form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[value="attending"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[value="declined"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[value="maybe"]')).toBeFocused();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.click('a[href*="rsvp"]');
    await page.click('[data-testid="event-card"]:first-child');

    // Verify form accessibility
    await expect(page.locator('form')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="guestCount"]')).toHaveAttribute('aria-label');
    await expect(page.locator('textarea[name="dietaryRestrictions"]')).toHaveAttribute('aria-label');
  });
});
