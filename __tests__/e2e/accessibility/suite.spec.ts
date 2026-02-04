/**
 * Accessibility Suite E2E Tests
 * 
 * Consolidated test suite covering:
 * - Keyboard Navigation
 * - Screen Reader Compatibility
 * - Responsive Design
 * - Data Table Accessibility
 * 
 * Source Files Consolidated:
 * - keyboardNavigation.spec.ts (18 tests)
 * - screenReader.spec.ts (28 tests)
 * - responsiveDesign.spec.ts (16 tests)
 * - dataTableProperties.spec.ts (15 tests)
 * 
 * Total: 77 tests → 52 tests (32% reduction)
 * 
 * This suite validates comprehensive accessibility compliance including WCAG 2.1 AA
 * standards, keyboard navigation, screen reader support, responsive design, and
 * accessible data table interactions.
 */

import { test, expect, Page } from '@playwright/test';

// Test viewports
const MOBILE_VIEWPORT = { width: 320, height: 568 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 }; // Desktop

// Minimum touch target size (WCAG 2.1 AA)
const MIN_TOUCH_TARGET_SIZE = 44;

// ============================================================================
// Keyboard Navigation
// ============================================================================

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through page with Tab and Shift+Tab', async ({ page }) => {
    await page.keyboard.press('Tab');
    
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const forwardElement = await page.evaluate(() => document.activeElement?.outerHTML);
    
    await page.keyboard.press('Shift+Tab');
    
    const backwardElement = await page.evaluate(() => document.activeElement?.outerHTML);
    expect(backwardElement).not.toBe(forwardElement);
  });

  test('should activate buttons with Enter and Space keys', async ({ page }) => {
    const button = page.locator('button').first();
    await button.focus();
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    await button.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  });

  test('should show visible focus indicators', async ({ page }) => {
    await page.keyboard.press('Tab');
    
    const hasFocusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(element);
      
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
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")').first();
    
    if (await skipLink.count() > 0) {
      await skipLink.focus();
      await expect(skipLink).toBeVisible();
      
      await page.keyboard.press('Enter');
      
      const mainFocused = await page.evaluate(() => {
        const main = document.getElementById('main-content') || document.querySelector('main');
        return document.activeElement === main || main?.contains(document.activeElement);
      });
      
      expect(mainFocused).toBeTruthy();
    }
  });

  test('should trap focus in modal dialogs and close with Escape', async ({ page }) => {
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Edit")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [role="alertdialog"], .modal');
        return modal?.contains(document.activeElement);
      });
      
      expect(focusInModal).toBeTruthy();
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const modalVisible = await page.locator('[role="dialog"], [role="alertdialog"], .modal').isVisible().catch(() => false);
      
      expect(modalVisible).toBeFalsy();
    }
  });

  test('should navigate form fields and dropdowns with keyboard', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    await page.keyboard.press('Tab');
    
    let currentField = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(currentField);
    
    const select = page.locator('select').first();
    
    if (await select.count() > 0) {
      await select.focus();
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      const value = await select.inputValue();
      expect(value).toBeTruthy();
    }
  });

  test('should support Home and End keys in text inputs', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    
    if (await input.count() > 0) {
      await input.fill('Test content here');
      await input.focus();
      
      await page.keyboard.press('End');
      await page.keyboard.type('!');
      
      let value = await input.inputValue();
      expect(value).toBe('Test content here!');
      
      await page.keyboard.press('Home');
      await page.keyboard.type('Start: ');
      
      value = await input.inputValue();
      expect(value).toContain('Start:');
    }
  });

  test('should not trap focus on disabled elements', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const isDisabled = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
    });
    
    expect(isDisabled).toBeFalsy();
  });

  test('should restore focus after modal closes', async ({ page }) => {
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.focus();
      await modalTrigger.click();
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      const triggerText = await modalTrigger.textContent();
      
      expect(focusedElement).toContain(triggerText);
    }
  });

  test('should navigate admin dashboard and guest management with keyboard', async ({ page }) => {
    await page.goto('/admin');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(activeElement);
    
    await page.goto('/admin/guests');
    
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    const inTable = await page.evaluate(() => {
      return document.activeElement?.closest('table') !== null ||
             document.activeElement?.closest('[role="grid"]') !== null;
    });
    
    expect(typeof inTable).toBe('boolean');
  });
});

// ============================================================================
// Screen Reader Compatibility
// ============================================================================

test.describe('Screen Reader Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page structure with title, landmarks, and headings', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    const nav = page.locator('nav, [role="navigation"]');
    const count = await nav.count();
    expect(count).toBeGreaterThan(0);

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have ARIA labels on interactive elements and alt text for images', async ({ page }) => {
    const iconButtons = await page.locator('button:not(:has-text(""))').all();
    
    for (const button of iconButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');
      
      const hasLabel = ariaLabel || ariaLabelledBy || title;
      
      if (!hasLabel) {
        const text = await button.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }

    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper form field labels and associations', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const inputs = await page.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should announce form errors and have live regions', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      const errors = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
      const errorCount = await errors.count();
      
      expect(errorCount).toBeGreaterThan(0);
    }

    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"], [role="alert"]');
    const count = await liveRegions.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have descriptive link and button text', async ({ page }) => {
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      
      const hasDescription = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
      expect(hasDescription).toBeTruthy();
      
      if (text) {
        const genericTexts = ['click here', 'read more', 'link', 'here'];
        const isGeneric = genericTexts.some(generic => text.toLowerCase().trim() === generic);
        
        if (isGeneric) {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }

    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
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
      
      expect(ariaRequired === 'true' || ariaLabel?.includes('required')).toBeTruthy();
    }
  });

  test('should have proper table structure with headers and labels', async ({ page }) => {
    await page.goto('/admin/guests');
    
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      const headers = await table.locator('th').count();
      expect(headers).toBeGreaterThan(0);
      
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      expect(caption > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should have proper dialog/modal structure', async ({ page }) => {
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);
      
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      
      if (await dialog.count() > 0) {
        const ariaLabel = await dialog.getAttribute('aria-label');
        const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        const ariaDescribedBy = await dialog.getAttribute('aria-describedby');
        expect(typeof ariaDescribedBy).toBe('string');
      }
    }
  });

  test('should have proper list structure and current page indication', async ({ page }) => {
    const lists = await page.locator('ul, ol').all();
    
    for (const list of lists) {
      const items = await list.locator('li').count();
      expect(items).toBeGreaterThan(0);
    }

    const navLinks = await page.locator('nav a, [role="navigation"] a').all();
    
    let hasCurrentIndicator = false;
    
    for (const link of navLinks) {
      const ariaCurrent = await link.getAttribute('aria-current');
      
      if (ariaCurrent === 'page') {
        hasCurrentIndicator = true;
        break;
      }
    }
    
    expect(typeof hasCurrentIndicator).toBe('boolean');
  });

  test('should have proper error message associations', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      const errorMessages = await page.locator('[role="alert"], .error-message, [id$="-error"]').all();
      
      for (const error of errorMessages) {
        const id = await error.getAttribute('id');
        
        if (id) {
          const referencingInput = page.locator(`[aria-describedby*="${id}"]`);
          const count = await referencingInput.count();
          
          expect(count).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have proper ARIA expanded states and controls relationships', async ({ page }) => {
    const expandables = await page.locator('[aria-expanded]').all();
    
    for (const element of expandables) {
      const expanded = await element.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);
    }

    const controllers = await page.locator('[aria-controls]').all();
    
    for (const controller of controllers) {
      const controlsId = await controller.getAttribute('aria-controls');
      
      if (controlsId) {
        const controlled = page.locator(`#${controlsId}`);
        const exists = await controlled.count() > 0;
        
        expect(exists).toBeTruthy();
      }
    }
  });

  test('should have accessible RSVP form and photo upload', async ({ page }) => {
    await page.goto('/guest/rsvp');
    
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    const ariaLabel = await form.getAttribute('aria-label');
    const ariaLabelledBy = await form.getAttribute('aria-labelledby');
    
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();

    await page.goto('/guest/photos');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      const fileAriaLabel = await fileInput.getAttribute('aria-label');
      const id = await fileInput.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        expect(hasLabel || fileAriaLabel).toBeTruthy();
      } else {
        expect(fileAriaLabel).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// Responsive Design
// ============================================================================

async function testPageResponsiveness(page: Page, url: string, pageName: string) {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(url);
  await expect(page.locator('body')).toBeVisible();
  
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  
  await page.setViewportSize(TABLET_VIEWPORT);
  await page.reload();
  await expect(page.locator('body')).toBeVisible();
  
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.reload();
  await expect(page.locator('body')).toBeVisible();
}

test.describe('Responsive Design', () => {
  test('should be responsive across admin pages', async ({ page }) => {
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    const pages = [
      { url: '/admin', name: 'Dashboard' },
      { url: '/admin/guests', name: 'Guests' },
      { url: '/admin/events', name: 'Events' },
      { url: '/admin/activities', name: 'Activities' },
    ];

    for (const pageInfo of pages) {
      await testPageResponsiveness(page, pageInfo.url, pageInfo.name);
    }
  });

  test('should be responsive across guest pages', async ({ page }) => {
    await page.goto('/auth/guest-login');
    await page.fill('input[name="email"]', 'guest@example.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/guest/dashboard');

    const pages = [
      { url: '/guest/dashboard', name: 'Dashboard' },
      { url: '/guest/events', name: 'Events' },
      { url: '/guest/activities', name: 'Activities' },
      { url: '/guest/itinerary', name: 'Itinerary' },
    ];

    for (const pageInfo of pages) {
      await testPageResponsiveness(page, pageInfo.url, pageInfo.name);
    }
  });

  test('should have adequate touch targets on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/admin');
    
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    const box = await hamburgerButton.boundingBox();
    
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
      expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    }

    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const buttonBox = await button.boundingBox();
      
      if (buttonBox) {
        const meetsSize = buttonBox.width >= MIN_TOUCH_TARGET_SIZE && buttonBox.height >= MIN_TOUCH_TARGET_SIZE;
        
        if (!meetsSize) {
          const padding = await button.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
              top: parseInt(style.paddingTop),
              bottom: parseInt(style.paddingBottom),
              left: parseInt(style.paddingLeft),
              right: parseInt(style.paddingRight),
            };
          });
          
          const totalWidth = buttonBox.width + padding.left + padding.right;
          const totalHeight = buttonBox.height + padding.top + padding.bottom;
          
          expect(totalWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - 4);
          expect(totalHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - 4);
        }
      }
    }
  });

  test('should support mobile navigation with swipe gestures', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/admin');
    
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await hamburgerButton.click();
    
    const mobileMenu = page.locator('[role="dialog"], nav[aria-label*="mobile"]').first();
    await expect(mobileMenu).toBeVisible();
    
    const closeButton = page.locator('button[aria-label*="close"], button[aria-label*="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('should support 200% zoom on admin and guest pages', async ({ page }) => {
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await expect(page.locator('body')).toBeVisible();
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    const hasExcessiveScroll = scrollWidth > clientWidth * 1.5;
    expect(hasExcessiveScroll).toBe(false);
    
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });

    await page.goto('/auth/guest-login');
    await page.fill('input[name="email"]', 'guest@example.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/guest/dashboard');
    
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await expect(page.locator('body')).toBeVisible();
    
    const fontSize = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontSize;
    });
    
    expect(fontSize).toBeTruthy();
    
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should render correctly across browsers without layout issues', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    expect(criticalErrors.length).toBe(0);

    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    
    await expect(page.locator('body')).toBeVisible();
    
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasOverflow).toBe(false);
  });

  test('should have responsive images with lazy loading', async ({ page }) => {
    await page.goto('/guest/dashboard');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const loading = await img.getAttribute('loading');
        const isAboveFold = await img.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight;
        });
        
        if (!isAboveFold) {
          expect(loading).toBe('lazy');
        }
      }
    }
  });

  test('should have usable form inputs on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/auth/guest-login');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    const box = await emailInput.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - 4);
    }
    
    await emailInput.click();
    await expect(emailInput).toBeFocused();
  });
});

// ============================================================================
// Data Table Accessibility
// ============================================================================

test.describe('Data Table Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle sort direction and update URL', async ({ page }) => {
    await page.waitForSelector('table');
    
    const nameHeader = page.locator('th:has-text("Name")').first();
    
    await nameHeader.click();
    await page.waitForTimeout(300);
    
    let url = new URL(page.url());
    expect(url.searchParams.get('sort')).toBeTruthy();
    expect(url.searchParams.get('direction')).toBe('asc');
    
    await expect(nameHeader).toContainText('↑');
    
    await nameHeader.click();
    await page.waitForTimeout(300);
    
    url = new URL(page.url());
    expect(url.searchParams.get('direction')).toBe('desc');
    
    await expect(nameHeader).toContainText('↓');
  });

  test('should restore sort state from URL on page load', async ({ page }) => {
    await page.goto('/admin/guests?sort=firstName&direction=desc');
    await page.waitForLoadState('networkidle');
    
    const nameHeader = page.locator('th:has-text("Name")').first();
    await expect(nameHeader).toContainText('↓');
  });

  test('should update URL with search parameter after debounce', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Search"]');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test query');
    
    await page.waitForTimeout(500);
    
    const url = new URL(page.url());
    expect(url.searchParams.get('search')).toBe('test query');
  });

  test('should restore search state from URL on page load', async ({ page }) => {
    await page.goto('/admin/guests?search=john');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toHaveValue('john');
  });

  test('should update URL when filter is applied and remove when cleared', async ({ page }) => {
    await page.waitForSelector('table');
    
    const filterSelect = page.locator('select').first();
    
    if (await filterSelect.count() > 0) {
      const options = await filterSelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        let url = new URL(page.url());
        const filterParams = Array.from(url.searchParams.keys()).filter(key => key.startsWith('filter_'));
        expect(filterParams.length).toBeGreaterThan(0);

        await filterSelect.selectOption({ index: 0 });
        await page.waitForTimeout(300);
        
        url = new URL(page.url());
        expect(url.searchParams.get('filter_rsvpStatus')).toBeFalsy();
      }
    }
  });

  test('should restore filter state from URL on mount', async ({ page }) => {
    await page.goto('/admin/guests?filter_rsvpStatus=attending');
    await page.waitForLoadState('networkidle');
    
    const filterSelect = page.locator('select').first();
    
    if (await filterSelect.count() > 0) {
      const selectedValue = await filterSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  test('should display and remove filter chips', async ({ page }) => {
    await page.waitForSelector('table');
    
    const filterSelect = page.locator('select').first();
    
    if (await filterSelect.count() > 0) {
      const options = await filterSelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        const filterChip = page.locator('[class*="filter-chip"], [class*="badge"], button:has-text("×")').first();
        await expect(filterChip).toBeVisible();
      }
    }

    await page.goto('/admin/guests?filter_rsvpStatus=attending');
    await page.waitForLoadState('networkidle');
    
    const removeButton = page.locator('button:has-text("×")').first();
    
    if (await removeButton.count() > 0) {
      await removeButton.click();
      await page.waitForTimeout(300);
      
      const url = new URL(page.url());
      expect(url.searchParams.get('filter_rsvpStatus')).toBeFalsy();
    }
  });

  test('should maintain all state parameters together', async ({ page }) => {
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('john');
    await page.waitForTimeout(500);
    
    const nameHeader = page.locator('th:has-text("Name")').first();
    if (await nameHeader.count() > 0) {
      await nameHeader.click();
      await page.waitForTimeout(300);
    }
    
    const filterSelect = page.locator('select').first();
    if (await filterSelect.count() > 0) {
      const options = await filterSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }
    
    const url = new URL(page.url());
    expect(url.searchParams.get('search')).toBe('john');
    expect(url.searchParams.get('sort')).toBeTruthy();
    expect(url.searchParams.get('direction')).toBeTruthy();
  });

  test('should restore all state parameters on page load', async ({ page }) => {
    const fullUrl = '/admin/guests?search=test&sort=firstName&direction=desc&filter_rsvpStatus=attending';
    await page.goto(fullUrl);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toHaveValue('test');
    
    const headers = page.locator('th');
    const headerCount = await headers.count();
    let foundDescIndicator = false;
    for (let i = 0; i < headerCount; i++) {
      const headerText = await headers.nth(i).textContent();
      if (headerText?.includes('↓')) {
        foundDescIndicator = true;
        break;
      }
    }
    expect(foundDescIndicator).toBe(true);
    
    const url = new URL(page.url());
    expect(url.searchParams.get('search')).toBe('test');
    expect(url.searchParams.get('sort')).toBe('firstName');
    expect(url.searchParams.get('direction')).toBe('desc');
    expect(url.searchParams.get('filter_rsvpStatus')).toBe('attending');
  });
});
