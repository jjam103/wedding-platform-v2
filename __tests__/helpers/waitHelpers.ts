/**
 * Wait Helpers for E2E Tests
 * 
 * Provides reusable wait conditions for common async operations.
 */

import { Page } from '@playwright/test';

/**
 * Wait for a condition to be true
 * 
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @param interval - Check interval in milliseconds (default: 100)
 * @returns Promise that resolves when condition is met
 * 
 * @example
 * await waitForCondition(async () => {
 *   const data = await fetchData();
 *   return data !== null;
 * }, 5000);
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for CSS styles to be loaded and applied
 * 
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * 
 * @example
 * await waitForStyles(page);
 */
export async function waitForStyles(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForFunction(() => {
    const styles = window.getComputedStyle(document.body);
    return styles.fontFamily !== '' && styles.fontSize !== '';
  }, { timeout });
}

/**
 * Wait for modal to close
 * 
 * @param page - Playwright page object
 * @param modalSelector - Selector for the modal element
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * 
 * @example
 * await waitForModalClose(page, '[role="dialog"]');
 */
export async function waitForModalClose(
  page: Page,
  modalSelector: string = '[role="dialog"]',
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(modalSelector, { state: 'hidden', timeout });
}

/**
 * Wait for navigation to complete
 * 
 * @param page - Playwright page object
 * @param expectedUrl - Expected URL or URL pattern
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 * 
 * @example
 * await waitForNavigation(page, '/admin/dashboard');
 */
export async function waitForNavigation(
  page: Page,
  expectedUrl: string | RegExp,
  timeout: number = 30000
): Promise<void> {
  await page.waitForURL(expectedUrl, { timeout });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await waitForStyles(page);
}

/**
 * Wait for API response
 * 
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Response object
 * 
 * @example
 * const response = await waitForApiResponse(page, '/api/guests');
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string,
  timeout: number = 10000
): Promise<any> {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200,
    { timeout }
  );
}

/**
 * Wait for element to be visible and stable
 * 
 * @param page - Playwright page object
 * @param locator - Playwright locator or CSS selector string
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * 
 * @example
 * // With Playwright locator
 * await waitForElementStable(page, page.getByRole('button', { name: 'Submit' }));
 * 
 * // With CSS selector (no pseudo-selectors)
 * await waitForElementStable(page, 'button[type="submit"]');
 */
export async function waitForElementStable(
  page: Page,
  locator: any,
  timeout: number = 10000
): Promise<void> {
  // Convert string selector to locator if needed
  const element = typeof locator === 'string' 
    ? page.locator(locator) 
    : locator;
  
  // Wait for element to be visible
  await element.waitFor({ state: 'visible', timeout });
  
  // Wait for animations to complete (simple approach)
  await page.waitForTimeout(100);
}

/**
 * Wait for data to be loaded
 * 
 * @param page - Playwright page object
 * @param dataTestId - data-testid attribute value
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * 
 * @example
 * await waitForDataLoaded(page, 'guest-list');
 */
export async function waitForDataLoaded(
  page: Page,
  dataTestId: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(`[data-testid="${dataTestId}"]`, { timeout });
  
  // Wait for loading indicators to disappear
  await page.waitForSelector('[data-testid="loading"]', { 
    state: 'hidden', 
    timeout: 5000 
  }).catch(() => {
    // Loading indicator might not exist, that's okay
  });
}

/**
 * Wait for toast message to appear and disappear
 * 
 * @param page - Playwright page object
 * @param message - Expected toast message (optional)
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * 
 * @example
 * await waitForToast(page, 'Guest created successfully');
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout: number = 10000
): Promise<void> {
  const selector = message 
    ? `[role="alert"]:has-text("${message}")`
    : '[role="alert"]';
  
  // Wait for toast to appear
  await page.waitForSelector(selector, { state: 'visible', timeout });
  
  // Wait for toast to disappear
  await page.waitForSelector(selector, { state: 'hidden', timeout: 5000 });
}

export default {
  waitForCondition,
  waitForStyles,
  waitForModalClose,
  waitForNavigation,
  waitForApiResponse,
  waitForElementStable,
  waitForDataLoaded,
  waitForToast,
};
