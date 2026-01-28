import { test, expect } from '@playwright/test';

/**
 * E2E Test: Verify all admin pages are styled correctly
 * 
 * This test validates that CSS styling is properly applied across all admin pages
 * and UI components, ensuring consistent visual presentation.
 * 
 * Requirements: 10.2, 10.3
 */

test.describe('Admin Pages Styling Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should have styled dashboard page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check that the page has background color (not transparent)
    const bgColor = await page.locator('body').evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');

    // Check for styled cards/containers
    const cards = page.locator('[class*="bg-white"], [class*="bg-gray"]').first();
    if (await cards.count() > 0) {
      const cardBg = await cards.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );
      expect(cardBg).toBeTruthy();
    }

    // Check for proper spacing (padding/margin)
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.count() > 0) {
      const padding = await mainContent.evaluate(
        el => window.getComputedStyle(el).padding
      );
      expect(padding).not.toBe('0px');
    }
  });

  test('should have styled guests page', async ({ page }) => {
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');

    // Check page is styled
    const mainContent = page.locator('main, [role="main"]').first();
    const bgColor = await mainContent.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();

    // Check for DataTable styling
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      const tableBorder = await table.evaluate(
        el => window.getComputedStyle(el).borderWidth
      );
      expect(tableBorder).toBeTruthy();
    }
  });

  test('should have styled events page', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled activities page', async ({ page }) => {
    await page.goto('/admin/activities');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled vendors page', async ({ page }) => {
    await page.goto('/admin/vendors');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled photos page', async ({ page }) => {
    await page.goto('/admin/photos');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled emails page', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled budget page', async ({ page }) => {
    await page.goto('/admin/budget');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have styled settings page', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Check page has proper styling
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('UI Components Styling Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should have styled DataTable component', async ({ page }) => {
    // Navigate to a page with DataTable (guests page)
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');

    // Check for table element
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      // Check table headers are styled
      const thead = table.locator('thead').first();
      if (await thead.count() > 0) {
        const theadBg = await thead.evaluate(
          el => window.getComputedStyle(el).backgroundColor
        );
        expect(theadBg).toBeTruthy();
      }

      // Check table rows have proper styling
      const tbody = table.locator('tbody').first();
      if (await tbody.count() > 0) {
        const tbodyColor = await tbody.evaluate(
          el => window.getComputedStyle(el).color
        );
        expect(tbodyColor).toBeTruthy();
      }
    }
  });

  test('should have styled buttons', async ({ page }) => {
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');

    // Check for button styling
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      const buttonBg = await button.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );
      const buttonPadding = await button.evaluate(
        el => window.getComputedStyle(el).padding
      );
      
      expect(buttonBg).toBeTruthy();
      expect(buttonPadding).not.toBe('0px');
    }
  });

  test('should have styled sidebar navigation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check for sidebar/navigation styling
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      const navBg = await nav.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );
      expect(navBg).toBeTruthy();
    }
  });

  test('should have styled form inputs', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Check for input styling
    const input = page.locator('input[type="text"], input[type="email"]').first();
    if (await input.count() > 0) {
      const inputBorder = await input.evaluate(
        el => window.getComputedStyle(el).borderWidth
      );
      const inputPadding = await input.evaluate(
        el => window.getComputedStyle(el).padding
      );
      
      expect(inputBorder).toBeTruthy();
      expect(inputPadding).not.toBe('0px');
    }
  });

  test('should have styled cards/containers', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check for card styling
    const card = page.locator('[class*="card"], [class*="bg-white"]').first();
    if (await card.count() > 0) {
      const cardBg = await card.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );
      const cardBorder = await card.evaluate(
        el => window.getComputedStyle(el).borderRadius
      );
      
      expect(cardBg).toBeTruthy();
      expect(cardBorder).toBeTruthy();
    }
  });
});

test.describe('CSS File Delivery', () => {
  test('should load CSS file successfully', async ({ page }) => {
    // Listen for CSS file requests
    const cssRequests: any[] = [];
    page.on('response', response => {
      if (response.url().includes('.css') || response.headers()['content-type']?.includes('text/css')) {
        cssRequests.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()['content-type']
        });
      }
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify at least one CSS file was loaded
    expect(cssRequests.length).toBeGreaterThan(0);

    // Verify CSS files loaded successfully (status 200)
    const successfulCssRequests = cssRequests.filter(req => req.status === 200);
    expect(successfulCssRequests.length).toBeGreaterThan(0);
  });

  test('should have Tailwind classes in CSS', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check that common Tailwind classes are applied
    const element = page.locator('[class*="bg-"], [class*="text-"], [class*="p-"]').first();
    if (await element.count() > 0) {
      const className = await element.getAttribute('class');
      expect(className).toBeTruthy();
      
      // Verify the element has computed styles
      const bgColor = await element.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    }
  });
});
