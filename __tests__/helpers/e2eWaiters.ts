/**
 * E2E Test Helper Functions
 * 
 * Reusable wait functions for common E2E test patterns.
 * These helpers solve timing issues that cause test failures.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Wait for a dropdown/select element to be populated with options.
 * 
 * Solves Pattern 1: Dropdown/Select Timeout
 * - Waits for select to be visible
 * - Waits for select to be enabled
 * - Waits for options to be populated
 * 
 * @param page - Playwright page object
 * @param selector - CSS selector for the select element
 * @param minOptions - Minimum number of options required (default: 1, not counting empty option)
 * @param timeout - Maximum wait time in milliseconds (default: 10000)
 */
export async function waitForDropdownOptions(
  page: Page,
  selector: string,
  minOptions = 1,
  timeout = 10000
): Promise<void> {
  // First wait for the select element to be visible
  await page.waitForSelector(selector, { state: 'visible', timeout });

  // Then wait for it to be enabled and populated
  await page.waitForFunction(
    ({ sel, min }) => {
      const select = document.querySelector(sel) as HTMLSelectElement | null;
      if (!select) return false;
      if (select.disabled) return false;
      
      // Count non-empty options
      const options = Array.from(select.options);
      const nonEmptyOptions = options.filter(opt => opt.value !== '');
      
      return nonEmptyOptions.length >= min;
    },
    { sel: selector, min: minOptions },
    { timeout }
  );
}

/**
 * Wait for a button to be enabled and clickable.
 * 
 * Solves Pattern 4: Button/Form Submission Failures
 * - Waits for button to be visible
 * - Waits for button to be enabled
 * - Ensures button is not covered by overlays
 * 
 * @param page - Playwright page object
 * @param selector - CSS selector for the button
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 */
export async function waitForButtonEnabled(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  const button = page.locator(selector);
  
  // Wait for button to be visible
  await button.waitFor({ state: 'visible', timeout });
  
  // Wait for button to be enabled
  await page.waitForFunction(
    (sel) => {
      const btn = document.querySelector(sel) as HTMLButtonElement | null;
      return btn && !btn.disabled;
    },
    selector,
    { timeout }
  );
}

/**
 * Wait for an API response matching a URL pattern.
 * 
 * Solves Pattern 2: API Data Loading Race Conditions
 * - Waits for specific API endpoint to respond
 * - Ensures data is loaded before UI interaction
 * 
 * @param page - Playwright page object
 * @param urlPattern - String or RegExp to match against response URL
 * @param timeout - Maximum wait time in milliseconds (default: 10000)
 * @returns Promise that resolves with the Response object
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<any> {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches && response.status() === 200;
    },
    { timeout }
  );
}

/**
 * Wait for a form to be ready for submission.
 * 
 * Solves Pattern 4: Form Submission Failures
 * - Waits for all required fields to be filled
 * - Waits for submit button to be enabled
 * - Ensures form is not in loading state
 * 
 * @param page - Playwright page object
 * @param formSelector - CSS selector for the form element
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 */
export async function waitForFormReady(
  page: Page,
  formSelector: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const form = document.querySelector(sel) as HTMLFormElement | null;
      if (!form) return false;
      
      // Check if form has a submit button that's enabled
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (!submitButton || submitButton.disabled) return false;
      
      // Check if form is not in loading state
      const isLoading = form.classList.contains('loading') || 
                       form.getAttribute('aria-busy') === 'true';
      
      return !isLoading;
    },
    formSelector,
    { timeout }
  );
}

/**
 * Wait for a page to finish loading with all data.
 * 
 * Solves Pattern 3: Page Load Timeouts
 * - Waits for specific element to appear
 * - Waits for loading indicators to disappear
 * - Ensures page is interactive
 * 
 * @param page - Playwright page object
 * @param elementSelector - CSS selector for element that indicates page is loaded
 * @param timeout - Maximum wait time in milliseconds (default: 15000)
 */
export async function waitForPageLoad(
  page: Page,
  elementSelector: string,
  timeout = 15000
): Promise<void> {
  // Wait for the specific element
  await page.waitForSelector(elementSelector, { state: 'visible', timeout });
  
  // Wait for any loading indicators to disappear
  await page.waitForFunction(
    () => {
      const loadingIndicators = document.querySelectorAll('[data-loading="true"], .loading, [aria-busy="true"]');
      return loadingIndicators.length === 0;
    },
    { timeout: 5000 }
  ).catch(() => {
    // Ignore timeout - loading indicators might not exist
  });
}

/**
 * Wait for a modal/dialog to be fully rendered and interactive.
 * 
 * Solves Pattern 4: Modal/Dialog Interaction Issues
 * - Waits for modal to be visible
 * - Waits for modal animation to complete
 * - Ensures modal content is loaded
 * 
 * @param page - Playwright page object
 * @param modalSelector - CSS selector for the modal element
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 */
export async function waitForModal(
  page: Page,
  modalSelector: string,
  timeout = 5000
): Promise<void> {
  // Wait for modal to be visible
  await page.waitForSelector(modalSelector, { state: 'visible', timeout });
  
  // Wait for animation to complete (small delay)
  await page.waitForTimeout(300);
  
  // Ensure modal is interactive
  await page.waitForFunction(
    (sel) => {
      const modal = document.querySelector(sel);
      if (!modal) return false;
      
      // Check if modal has focus trap active
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      return focusableElements.length > 0;
    },
    modalSelector,
    { timeout: 2000 }
  ).catch(() => {
    // Ignore timeout - modal might not have focusable elements
  });
}

/**
 * Wait for data table to finish loading and rendering.
 * 
 * Solves Pattern 2: Data Table Loading Issues
 * - Waits for table to be visible
 * - Waits for rows to be populated
 * - Ensures table is not in loading state
 * 
 * @param page - Playwright page object
 * @param tableSelector - CSS selector for the table element
 * @param minRows - Minimum number of rows expected (default: 0)
 * @param timeout - Maximum wait time in milliseconds (default: 10000)
 */
export async function waitForDataTable(
  page: Page,
  tableSelector: string,
  minRows = 0,
  timeout = 10000
): Promise<void> {
  // Wait for table to be visible
  await page.waitForSelector(tableSelector, { state: 'visible', timeout });
  
  // Wait for rows to be populated
  await page.waitForFunction(
    ({ sel, min }) => {
      const table = document.querySelector(sel);
      if (!table) return false;
      
      // Check if table is loading
      const isLoading = table.classList.contains('loading') || 
                       table.getAttribute('aria-busy') === 'true';
      if (isLoading) return false;
      
      // Count rows (excluding header)
      const rows = table.querySelectorAll('tbody tr');
      return rows.length >= min;
    },
    { sel: tableSelector, min: minRows },
    { timeout }
  );
}

/**
 * Wait for keyboard focus to settle after Tab navigation.
 * 
 * Solves Pattern 5: Keyboard Navigation Issues
 * - Waits for focus to move to new element
 * - Ensures focus is on an interactive element
 * 
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in milliseconds (default: 1000)
 */
export async function waitForFocusSettled(
  page: Page,
  timeout = 1000
): Promise<void> {
  // Small delay to allow focus to settle
  await page.waitForTimeout(100);
  
  // Verify focus is on an interactive element
  await page.waitForFunction(
    () => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      
      const interactiveTags = ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA', 'A'];
      return interactiveTags.includes(activeElement.tagName) ||
             activeElement.hasAttribute('tabindex');
    },
    { timeout }
  ).catch(() => {
    // Ignore timeout - focus might be on body or non-interactive element
  });
}

/**
 * Retry an action with exponential backoff.
 * 
 * Useful for flaky operations that might fail due to timing.
 * 
 * @param action - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns Promise that resolves with the action result
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
