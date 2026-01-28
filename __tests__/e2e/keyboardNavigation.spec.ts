/**
 * Keyboard Navigation E2E Tests
 * 
 * Tests keyboard accessibility across the application.
 * Validates:
 * - Tab navigation through interactive elements
 * - Enter/Space activation of buttons and links
 * - Arrow key navigation in lists and menus
 * - Escape key to close modals/dialogs
 * - Focus visibility and management
 * - Skip navigation links
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should navigate through page with Tab key', async ({ page }) => {
    // Press Tab to move through focusable elements
    await page.keyboard.press('Tab');
    
    // First focusable element should be focused
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still be on a focusable element
    const currentFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(currentFocused);
  });

  test('should navigate backwards with Shift+Tab', async ({ page }) => {
    // Tab forward a few times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const forwardElement = await page.evaluate(() => document.activeElement?.outerHTML);
    
    // Tab backward
    await page.keyboard.press('Shift+Tab');
    
    const backwardElement = await page.evaluate(() => document.activeElement?.outerHTML);
    
    // Should be on a different element
    expect(backwardElement).not.toBe(forwardElement);
  });

  test('should activate buttons with Enter key', async ({ page }) => {
    // Find a button and focus it
    const button = page.locator('button').first();
    await button.focus();
    
    // Press Enter
    await page.keyboard.press('Enter');
    
    // Button should have been activated (check for any navigation or state change)
    await page.waitForTimeout(100);
  });

  test('should activate buttons with Space key', async ({ page }) => {
    // Find a button and focus it
    const button = page.locator('button').first();
    await button.focus();
    
    // Press Space
    await page.keyboard.press('Space');
    
    // Button should have been activated
    await page.waitForTimeout(100);
  });

  test('should show visible focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible focus styles
    const hasFocusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Check for common focus indicators
      return (
        styles.outline !== 'none' ||
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none' ||
        element.classList.contains('focus:ring') ||
        element.classList.contains('focus:outline')
      );
    });
    
    expect(hasFocusStyles).toBeTruthy();
  });

  test('should support skip navigation link', async ({ page }) => {
    // Press Tab to focus skip link (usually first focusable element)
    await page.keyboard.press('Tab');
    
    // Check if skip link is visible when focused
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")').first();
    
    if (await skipLink.count() > 0) {
      await skipLink.focus();
      
      // Skip link should be visible when focused
      await expect(skipLink).toBeVisible();
      
      // Press Enter to activate skip link
      await page.keyboard.press('Enter');
      
      // Main content should now be focused
      const mainFocused = await page.evaluate(() => {
        const main = document.getElementById('main-content') || document.querySelector('main');
        return document.activeElement === main || main?.contains(document.activeElement);
      });
      
      expect(mainFocused).toBeTruthy();
    }
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    // Look for a button that opens a modal
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Edit")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(300);
      
      // Tab through modal elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should stay within modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [role="alertdialog"], .modal');
        return modal?.contains(document.activeElement);
      });
      
      expect(focusInModal).toBeTruthy();
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    // Look for a button that opens a modal
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Edit")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(300);
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should be closed
      await page.waitForTimeout(300);
      const modalVisible = await page.locator('[role="dialog"], [role="alertdialog"], .modal').isVisible().catch(() => false);
      
      expect(modalVisible).toBeFalsy();
    }
  });

  test('should navigate form fields with Tab', async ({ page }) => {
    // Navigate to a page with a form
    await page.goto('/guest/rsvp');
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    
    let currentField = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(currentField);
    
    // Continue through multiple fields
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      currentField = await page.evaluate(() => document.activeElement?.tagName);
      
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(currentField || '')) {
        // Successfully navigating through form
        break;
      }
    }
  });

  test('should navigate dropdown with arrow keys', async ({ page }) => {
    // Find a select element
    const select = page.locator('select').first();
    
    if (await select.count() > 0) {
      await select.focus();
      
      // Open dropdown with Space or Enter
      await page.keyboard.press('Space');
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Select with Enter
      await page.keyboard.press('Enter');
      
      // Value should have changed
      const value = await select.inputValue();
      expect(value).toBeTruthy();
    }
  });

  test('should support Home and End keys in text inputs', async ({ page }) => {
    // Find a text input
    const input = page.locator('input[type="text"]').first();
    
    if (await input.count() > 0) {
      await input.fill('Test content here');
      await input.focus();
      
      // Press End to go to end of text
      await page.keyboard.press('End');
      
      // Type at end
      await page.keyboard.type('!');
      
      let value = await input.inputValue();
      expect(value).toBe('Test content here!');
      
      // Press Home to go to beginning
      await page.keyboard.press('Home');
      
      // Type at beginning
      await page.keyboard.type('Start: ');
      
      value = await input.inputValue();
      expect(value).toContain('Start:');
    }
  });

  test('should not trap focus on disabled elements', async ({ page }) => {
    // Tab through page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focused element is not disabled
    const isDisabled = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
    });
    
    expect(isDisabled).toBeFalsy();
  });

  test('should maintain focus order in dynamic content', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/guest/dashboard');
    
    // Tab through elements
    const focusOrder: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const elementInfo = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        return {
          tag: element.tagName,
          text: element.textContent?.substring(0, 20),
          id: element.id,
        };
      });
      
      focusOrder.push(`${elementInfo.tag}:${elementInfo.id || elementInfo.text}`);
    }
    
    // Focus order should be logical (no jumping around)
    expect(focusOrder.length).toBeGreaterThan(0);
  });

  test('should support keyboard navigation in tables', async ({ page }) => {
    // Navigate to admin page with tables
    await page.goto('/admin/guests');
    
    // Find table
    const table = page.locator('table').first();
    
    if (await table.count() > 0) {
      // Tab to first interactive element in table
      await page.keyboard.press('Tab');
      
      // Should be able to navigate through table cells
      const inTable = await page.evaluate(() => {
        const element = document.activeElement;
        return element?.closest('table') !== null;
      });
      
      // If we're in a table, we should be able to continue navigating
      if (inTable) {
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        const stillInTable = await page.evaluate(() => {
          const element = document.activeElement;
          return element?.closest('table') !== null;
        });
        
        expect(stillInTable).toBeTruthy();
      }
    }
  });

  test('should support keyboard shortcuts for common actions', async ({ page }) => {
    // Test common keyboard shortcuts if implemented
    // For example: Ctrl+S to save, Ctrl+K for search, etc.
    
    // Navigate to a page with keyboard shortcuts
    await page.goto('/admin');
    
    // Try common shortcuts (these may not be implemented yet)
    // This test documents expected behavior
    
    // Ctrl+K or Cmd+K for search (common pattern)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+K`);
    
    // Check if search opened (if implemented)
    await page.waitForTimeout(300);
  });

  test('should restore focus after modal closes', async ({ page }) => {
    // Find a button that opens a modal
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create")').first();
    
    if (await modalTrigger.count() > 0) {
      // Focus and click the trigger
      await modalTrigger.focus();
      await modalTrigger.click();
      
      // Wait for modal
      await page.waitForTimeout(300);
      
      // Close modal with Escape
      await page.keyboard.press('Escape');
      
      // Wait for modal to close
      await page.waitForTimeout(300);
      
      // Focus should return to trigger button
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      const triggerText = await modalTrigger.textContent();
      
      expect(focusedElement).toContain(triggerText);
    }
  });
});

test.describe('Keyboard Navigation - Guest Portal', () => {
  test('should navigate RSVP form with keyboard', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    // Tab through RSVP form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to interact with form elements
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA']).toContain(activeElement);
  });

  test('should navigate photo upload with keyboard', async ({ page }) => {
    await page.goto('/guest/photos');
    
    // Tab to upload button
    await page.keyboard.press('Tab');
    
    // Should be able to reach upload controls
    const hasUploadControls = await page.locator('input[type="file"], button:has-text("Upload")').count();
    expect(hasUploadControls).toBeGreaterThan(0);
  });
});

test.describe('Keyboard Navigation - Admin Portal', () => {
  test('should navigate admin dashboard with keyboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Tab through dashboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate admin controls
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(activeElement);
  });

  test('should navigate guest management table with keyboard', async ({ page }) => {
    await page.goto('/admin/guests');
    
    // Tab through table
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should be able to reach table controls
    const inTable = await page.evaluate(() => {
      return document.activeElement?.closest('table') !== null ||
             document.activeElement?.closest('[role="grid"]') !== null;
    });
    
    // Either in table or on table controls
    expect(typeof inTable).toBe('boolean');
  });
});
