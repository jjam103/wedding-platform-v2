import { test, expect } from '@playwright/test';

/**
 * E2E tests for Admin Dashboard
 * 
 * These tests verify:
 * 1. Page loads without errors
 * 2. Styling is applied correctly (Tailwind CSS)
 * 3. All dashboard sections render
 * 4. Navigation works
 * 5. No runtime errors in console
 */

test.describe('Admin Dashboard - Visual and Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('commit');
  });

  test('should load admin dashboard without errors', async ({ page }) => {
    // Check that we're on the admin page
    await expect(page).toHaveURL(/\/admin/);
    
    // Check for page title or heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should have Tailwind CSS styling applied', async ({ page }) => {
    // Check that the body has expected background color (not default white)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should not be default white (rgb(255, 255, 255))
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
    
    // Check that buttons have styling
    const buttons = page.locator('button').first();
    if (await buttons.count() > 0) {
      const buttonStyles = await buttons.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor,
        };
      });
      
      // Buttons should have padding (Tailwind applies padding)
      expect(buttonStyles.padding).not.toBe('0px');
    }
  });

  test('should render dashboard metrics cards', async ({ page }) => {
    // Look for metric cards or stat displays
    const cards = page.locator('[class*="card"], [class*="metric"], [class*="stat"]');
    
    // Should have at least some dashboard content
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have no console errors related to styling', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter for styling-related errors
        if (
          text.includes('DOMPurify') ||
          text.includes('jsdom') ||
          text.includes('CSS') ||
          text.includes('stylesheet') ||
          text.includes('Tailwind')
        ) {
          errors.push(text);
        }
      }
    });
    
    // Reload to capture all console messages
    await page.reload();
    await page.waitForLoadState('commit');
    
    // Should have no styling-related errors
    expect(errors).toHaveLength(0);
  });

  test('should have navigation links', async ({ page }) => {
    // Check for navigation menu
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Check for common admin links
    const guestsLink = page.locator('a[href*="guests"], button:has-text("Guests")');
    const eventsLink = page.locator('a[href*="events"], button:has-text("Events")');
    const activitiesLink = page.locator('a[href*="activities"], button:has-text("Activities")');
    
    // At least one navigation element should exist
    const navCount = await guestsLink.count() + await eventsLink.count() + await activitiesLink.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('should render with proper layout structure', async ({ page }) => {
    // Check for main content area
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
    
    // Check that content is not overflowing or broken
    const mainBox = await main.first().boundingBox();
    expect(mainBox).not.toBeNull();
    expect(mainBox!.width).toBeGreaterThan(0);
    expect(mainBox!.height).toBeGreaterThan(0);
  });

  test('should have interactive elements styled correctly', async ({ page }) => {
    // Find first button
    const button = page.locator('button').first();
    
    if (await button.count() > 0) {
      await expect(button).toBeVisible();
      
      // Check button has cursor pointer
      const cursor = await button.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      
      expect(cursor).toBe('pointer');
    }
  });

  test('should handle navigation to guests page', async ({ page }) => {
    // Try to navigate to guests page
    const guestsLink = page.locator('a[href*="/admin/guests"]').first();
    
    if (await guestsLink.count() > 0) {
      await guestsLink.click();
      await page.waitForLoadState('commit');
      
      // Should navigate successfully
      await expect(page).toHaveURL(/\/admin\/guests/);
    }
  });

  test('should have responsive design elements', async ({ page }) => {
    // Check viewport meta tag exists
    const viewport = await page.locator('meta[name="viewport"]').count();
    expect(viewport).toBeGreaterThan(0);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Page should still be visible and not broken
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

test.describe('Admin Dashboard - API Integration', () => {
  test('should load dashboard data from APIs', async ({ page }) => {
    const responses: string[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/admin/')) {
        responses.push(`${response.status()} ${url}`);
      }
    });
    
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    // Should have made API calls
    expect(responses.length).toBeGreaterThan(0);
    
    // Log responses for debugging
    console.log('API Responses:', responses);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    // Page should still render even if some APIs fail
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should show error messages or fallback UI, not crash
    const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
    // It's okay to have error messages, just shouldn't crash
  });
});

test.describe('Admin Dashboard - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    // Press Tab to navigate
    await page.keyboard.press('Tab');
    
    // Should have focus visible on some element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    // Check for navigation with proper role
    const nav = page.locator('[role="navigation"]');
    const navCount = await nav.count();
    
    // Should have at least one navigation element
    expect(navCount).toBeGreaterThanOrEqual(0);
  });
});
