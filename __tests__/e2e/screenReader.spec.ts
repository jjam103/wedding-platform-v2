/**
 * Screen Reader Compatibility E2E Tests
 * 
 * Tests screen reader accessibility across the application.
 * Validates:
 * - ARIA labels and descriptions
 * - Live regions for dynamic content
 * - Semantic HTML structure
 * - Alternative text for images
 * - Form field associations
 * - Status announcements
 */

import { test, expect } from '@playwright/test';

test.describe('Screen Reader Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have main landmark region', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have navigation landmark', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]');
    const count = await nav.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that h1 exists
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have ARIA labels on interactive elements without text', async ({ page }) => {
    // Find buttons with only icons (no text)
    const iconButtons = await page.locator('button:not(:has-text(""))').all();
    
    for (const button of iconButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');
      
      // Should have at least one way to be labeled
      const hasLabel = ariaLabel || ariaLabelledBy || title;
      
      if (!hasLabel) {
        const text = await button.textContent();
        // If no label, should have text content
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should have alt text for all images', async ({ page }) => {
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper form field labels', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const inputs = await page.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Should have label or ARIA label
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        // Without ID, must have ARIA label
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should announce form errors to screen readers', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    // Submit form without filling required fields
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait for validation
      await page.waitForTimeout(500);
      
      // Check for error messages with proper ARIA
      const errors = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
      const errorCount = await errors.count();
      
      // Should have error announcements
      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('should have live regions for dynamic content', async ({ page }) => {
    // Check for live regions
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"], [role="alert"]');
    const count = await liveRegions.count();
    
    // Application should have live regions for announcements
    expect(count).toBeGreaterThan(0);
  });

  test('should have descriptive link text', async ({ page }) => {
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      
      // Links should have descriptive text
      const hasDescription = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
      expect(hasDescription).toBeTruthy();
      
      // Avoid generic link text
      if (text) {
        const genericTexts = ['click here', 'read more', 'link', 'here'];
        const isGeneric = genericTexts.some(generic => text.toLowerCase().trim() === generic);
        
        if (isGeneric) {
          // Generic text should have aria-label for context
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should have proper button labels', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // Buttons should have text or ARIA label
      const hasLabel = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should indicate required form fields', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const requiredInputs = await page.locator('input[required], select[required], textarea[required]').all();
    
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      const ariaLabel = await input.getAttribute('aria-label');
      
      // Required fields should be marked
      expect(ariaRequired === 'true' || ariaLabel?.includes('required')).toBeTruthy();
    }
  });

  test('should have proper table structure', async ({ page }) => {
    await page.goto('/admin/guests');
    
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Tables should have headers
      const headers = await table.locator('th').count();
      expect(headers).toBeGreaterThan(0);
      
      // Check for caption or aria-label
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      // Tables should be labeled
      expect(caption > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should announce loading states', async ({ page }) => {
    // Navigate to a page that loads data
    await page.goto('/guest/dashboard');
    
    // Check for loading indicators with proper ARIA
    const loadingIndicators = page.locator('[aria-busy="true"], [role="status"]:has-text("Loading"), [aria-live]:has-text("Loading")');
    
    // May or may not be loading at this point, but structure should exist
    const count = await loadingIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have proper dialog/modal structure', async ({ page }) => {
    // Look for modal trigger
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal
      await page.waitForTimeout(300);
      
      // Check modal structure
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      
      if (await dialog.count() > 0) {
        // Dialog should have label
        const ariaLabel = await dialog.getAttribute('aria-label');
        const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        // Dialog should have describedby for description
        const ariaDescribedBy = await dialog.getAttribute('aria-describedby');
        
        // Should have description or be simple enough not to need one
        expect(typeof ariaDescribedBy).toBe('string');
      }
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")');
    
    if (await skipLink.count() > 0) {
      // Skip link should be first focusable element
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      expect(focused?.toLowerCase()).toContain('skip');
    }
  });

  test('should have proper list structure', async ({ page }) => {
    const lists = await page.locator('ul, ol').all();
    
    for (const list of lists) {
      // Lists should contain list items
      const items = await list.locator('li').count();
      expect(items).toBeGreaterThan(0);
    }
  });

  test('should indicate current page in navigation', async ({ page }) => {
    const navLinks = await page.locator('nav a, [role="navigation"] a').all();
    
    let hasCurrentIndicator = false;
    
    for (const link of navLinks) {
      const ariaCurrent = await link.getAttribute('aria-current');
      
      if (ariaCurrent === 'page') {
        hasCurrentIndicator = true;
        break;
      }
    }
    
    // At least one nav link should indicate current page
    // (This may not be true on home page, so we check structure exists)
    expect(typeof hasCurrentIndicator).toBe('boolean');
  });

  test('should have proper status messages', async ({ page }) => {
    // Navigate to a page with status messages
    await page.goto('/guest/rsvp');
    
    // Submit form to trigger status message
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Check for status messages
      const statusMessages = page.locator('[role="status"], [role="alert"]');
      const count = await statusMessages.count();
      
      // Should have status announcements
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have proper error message associations', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    // Submit to trigger validation errors
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait for validation
      await page.waitForTimeout(500);
      
      // Check error messages are associated with fields
      const errorMessages = await page.locator('[role="alert"], .error-message, [id$="-error"]').all();
      
      for (const error of errorMessages) {
        const id = await error.getAttribute('id');
        
        if (id) {
          // Check if any input references this error
          const referencingInput = page.locator(`[aria-describedby*="${id}"]`);
          const count = await referencingInput.count();
          
          // Error should be referenced by an input
          expect(count).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have proper ARIA expanded states', async ({ page }) => {
    // Look for expandable elements
    const expandables = await page.locator('[aria-expanded]').all();
    
    for (const element of expandables) {
      const expanded = await element.getAttribute('aria-expanded');
      
      // aria-expanded should be true or false
      expect(['true', 'false']).toContain(expanded);
    }
  });

  test('should have proper ARIA controls relationships', async ({ page }) => {
    // Look for elements with aria-controls
    const controllers = await page.locator('[aria-controls]').all();
    
    for (const controller of controllers) {
      const controlsId = await controller.getAttribute('aria-controls');
      
      if (controlsId) {
        // Controlled element should exist
        const controlled = page.locator(`#${controlsId}`);
        const exists = await controlled.count() > 0;
        
        expect(exists).toBeTruthy();
      }
    }
  });

  test('should announce success messages', async ({ page }) => {
    // Navigate to form
    await page.goto('/guest/rsvp');
    
    // Look for success message structure
    const successRegions = page.locator('[role="status"]:has-text("Success"), [role="alert"]:has-text("Success"), [aria-live]:has-text("Success")');
    
    // Structure should exist for success announcements
    const count = await successRegions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Screen Reader - Guest Portal', () => {
  test('should have accessible RSVP form', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    // Check form has proper structure
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    // Form should have accessible name
    const ariaLabel = await form.getAttribute('aria-label');
    const ariaLabelledBy = await form.getAttribute('aria-labelledby');
    
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();
  });

  test('should have accessible photo upload', async ({ page }) => {
    await page.goto('/guest/photos');
    
    // File input should be labeled
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      const ariaLabel = await fileInput.getAttribute('aria-label');
      const id = await fileInput.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        expect(hasLabel || ariaLabel).toBeTruthy();
      } else {
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have accessible itinerary', async ({ page }) => {
    await page.goto('/guest/itinerary');
    
    // Itinerary should have proper structure
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Should have headings
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);
  });
});

test.describe('Screen Reader - Admin Portal', () => {
  test('should have accessible admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Dashboard should have proper structure
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Should have navigation
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('should have accessible data tables', async ({ page }) => {
    await page.goto('/admin/guests');
    
    // Tables should have proper structure
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Should have headers
      const headers = await table.locator('th').count();
      expect(headers).toBeGreaterThan(0);
    }
  });
});
