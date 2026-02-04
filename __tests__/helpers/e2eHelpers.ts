/**
 * E2E Test Helpers
 * 
 * Comprehensive utility functions to simplify E2E test operations.
 * These helpers reduce boilerplate, handle common edge cases, and provide
 * type-safe implementations for common testing patterns.
 * 
 * @module e2eHelpers
 */

import { Page, expect, Locator } from '@playwright/test';
import { createTestClient } from './testDb';
import type { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Element Waiting Utilities
// ============================================================================

/**
 * Wait for element to be visible with custom timeout
 * 
 * @example
 * await waitForElement(page, '[data-testid="guest-list"]', 10000);
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Wait for element to be hidden
 * 
 * @example
 * await waitForElementHidden(page, '.loading-spinner');
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toBeHidden({ timeout });
}

/**
 * Wait for element to contain specific text
 * 
 * @example
 * await waitForText(page, '.status', 'Complete');
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toContainText(text, { timeout });
}

/**
 * Wait for element count to match expected value
 * 
 * @example
 * await waitForElementCount(page, '.guest-row', 5);
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  count: number,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(count, { timeout });
}

/**
 * Wait for page to finish loading (no loading indicators)
 * 
 * @example
 * await waitForPageLoad(page);
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '.loading-spinner',
    '[data-testid="loading"]',
    '.skeleton',
    '[aria-busy="true"]',
  ];
  
  for (const selector of loadingSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      await expect(elements.first()).toBeHidden({ timeout: 10000 });
    }
  }
}

// ============================================================================
// Form Filling Utilities
// ============================================================================

/**
 * Fill form and submit
 * 
 * @example
 * await fillAndSubmitForm(page, {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com'
 * }, 'Create Guest');
 */
export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonText: string = 'Submit'
): Promise<void> {
  // Fill all form fields
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
    const count = await input.count();
    
    if (count === 0) {
      throw new Error(`Form field not found: ${name}`);
    }
    
    // Handle different input types
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
    
    if (tagName === 'select') {
      await input.selectOption(value);
    } else {
      await input.fill(value);
    }
  }
  
  // Submit form
  await page.click(`button:has-text("${submitButtonText}")`);
}

/**
 * Fill form field by label text
 * 
 * @example
 * await fillFormFieldByLabel(page, 'First Name', 'John');
 */
export async function fillFormFieldByLabel(
  page: Page,
  labelText: string,
  value: string
): Promise<void> {
  const label = page.locator(`label:has-text("${labelText}")`);
  const forAttr = await label.getAttribute('for');
  
  if (forAttr) {
    await page.locator(`#${forAttr}`).fill(value);
  } else {
    // Label wraps input
    await label.locator('input, textarea, select').fill(value);
  }
}

/**
 * Select option from dropdown by label
 * 
 * @example
 * await selectDropdownOption(page, 'Guest Type', 'Wedding Guest');
 */
export async function selectDropdownOption(
  page: Page,
  labelText: string,
  optionText: string
): Promise<void> {
  const label = page.locator(`label:has-text("${labelText}")`);
  const forAttr = await label.getAttribute('for');
  
  if (forAttr) {
    await page.locator(`#${forAttr}`).selectOption({ label: optionText });
  } else {
    await label.locator('select').selectOption({ label: optionText });
  }
}

/**
 * Check or uncheck checkbox by label
 * 
 * @example
 * await toggleCheckbox(page, 'Adults Only', true);
 */
export async function toggleCheckbox(
  page: Page,
  labelText: string,
  checked: boolean
): Promise<void> {
  const label = page.locator(`label:has-text("${labelText}")`);
  const forAttr = await label.getAttribute('for');
  
  const checkbox = forAttr 
    ? page.locator(`#${forAttr}`)
    : label.locator('input[type="checkbox"]');
  
  if (checked) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }
}

// ============================================================================
// Toast Message Utilities
// ============================================================================

/**
 * Wait for toast message to appear
 * 
 * @example
 * await waitForToast(page, 'Guest created successfully', 'success');
 */
export async function waitForToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
): Promise<void> {
  // Try multiple toast selector patterns
  const selectors = [
    `.toast.${type}`,
    `[data-toast-type="${type}"]`,
    `[role="alert"].${type}`,
    `.notification.${type}`,
  ];
  
  let found = false;
  for (const selector of selectors) {
    const toast = page.locator(selector);
    const count = await toast.count();
    
    if (count > 0) {
      await expect(toast.first()).toBeVisible({ timeout: 5000 });
      await expect(toast.first()).toContainText(message);
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Fallback: look for any element containing the message
    const messageElement = page.locator(`text="${message}"`);
    await expect(messageElement).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Wait for any toast to disappear
 * 
 * @example
 * await waitForToastDismiss(page);
 */
export async function waitForToastDismiss(page: Page): Promise<void> {
  const selectors = [
    '.toast',
    '[data-toast]',
    '[role="alert"]',
    '.notification',
  ];
  
  for (const selector of selectors) {
    const toast = page.locator(selector);
    const count = await toast.count();
    
    if (count > 0) {
      await expect(toast.first()).toBeHidden({ timeout: 10000 });
    }
  }
}

/**
 * Dismiss toast by clicking close button
 * 
 * @example
 * await dismissToast(page);
 */
export async function dismissToast(page: Page): Promise<void> {
  const closeButtons = [
    '.toast button[aria-label="Close"]',
    '.toast .close-button',
    '[data-toast] button',
  ];
  
  for (const selector of closeButtons) {
    const button = page.locator(selector);
    const count = await button.count();
    
    if (count > 0) {
      await button.first().click();
      return;
    }
  }
}

// ============================================================================
// Test Data Creation Utilities
// ============================================================================

/**
 * Create test guest in database
 * 
 * @example
 * const guest = await createTestGuest({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   groupId: 'group-123'
 * });
 */
export async function createTestGuest(data: {
  firstName: string;
  lastName: string;
  email: string;
  groupId: string;
  ageType?: 'adult' | 'child' | 'senior';
  guestType?: 'wedding_party' | 'wedding_guest' | 'prewedding_only' | 'postwedding_only';
  authMethod?: 'email_matching' | 'magic_link';
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: guest, error } = await supabase
    .from('guests')
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      group_id: data.groupId,
      age_type: data.ageType || 'adult',
      guest_type: data.guestType || 'wedding_guest',
      auth_method: data.authMethod || 'email_matching',
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test guest: ${error.message}`);
  }
  
  return guest;
}

/**
 * Create test guest group in database
 * 
 * @example
 * const group = await createTestGroup({ name: 'Smith Family' });
 */
export async function createTestGroup(data: {
  name: string;
  groupOwnerId?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: group, error } = await supabase
    .from('guest_groups')
    .insert({
      name: data.name,
      group_owner_id: data.groupOwnerId || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test group: ${error.message}`);
  }
  
  return group;
}

/**
 * Create test event in database
 * 
 * @example
 * const event = await createTestEvent({
 *   name: 'Wedding Ceremony',
 *   date: '2026-06-15',
 *   slug: 'wedding-ceremony'
 * });
 */
export async function createTestEvent(data: {
  name: string;
  date: string;
  slug: string;
  location?: string;
  description?: string;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      name: data.name,
      date: data.date,
      slug: data.slug,
      location: data.location || null,
      description: data.description || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test event: ${error.message}`);
  }
  
  return event;
}

/**
 * Create test activity in database
 * 
 * @example
 * const activity = await createTestActivity({
 *   name: 'Beach Volleyball',
 *   eventId: 'event-123',
 *   slug: 'beach-volleyball',
 *   capacity: 20
 * });
 */
export async function createTestActivity(data: {
  name: string;
  eventId: string;
  slug: string;
  capacity?: number;
  description?: string;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: activity, error } = await supabase
    .from('activities')
    .insert({
      name: data.name,
      event_id: data.eventId,
      slug: data.slug,
      capacity: data.capacity || null,
      description: data.description || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test activity: ${error.message}`);
  }
  
  return activity;
}

/**
 * Create test content page in database
 * 
 * @example
 * const page = await createTestContentPage({
 *   title: 'Our Story',
 *   slug: 'our-story',
 *   type: 'page'
 * });
 */
export async function createTestContentPage(data: {
  title: string;
  slug: string;
  type: 'page' | 'section';
  content?: string;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: page, error } = await supabase
    .from('content_pages')
    .insert({
      title: data.title,
      slug: data.slug,
      type: data.type,
      content: data.content || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test content page: ${error.message}`);
  }
  
  return page;
}

// ============================================================================
// Screenshot Utilities
// ============================================================================

/**
 * Take screenshot with timestamp
 * 
 * @example
 * await takeTimestampedScreenshot(page, 'guest-list-error');
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  
  // Ensure directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const filepath = path.join(screenshotDir, filename);
  
  await page.screenshot({
    path: filepath,
    fullPage: true,
  });
  
  return filepath;
}

/**
 * Take screenshot of specific element
 * 
 * @example
 * await takeElementScreenshot(page, '.error-message', 'validation-error');
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const filepath = path.join(screenshotDir, filename);
  const element = page.locator(selector);
  
  await element.screenshot({ path: filepath });
  
  return filepath;
}

/**
 * Take screenshot on test failure (use in afterEach)
 * 
 * @example
 * test.afterEach(async ({ page }, testInfo) => {
 *   await screenshotOnFailure(page, testInfo);
 * });
 */
export async function screenshotOnFailure(
  page: Page,
  testInfo: any
): Promise<void> {
  if (testInfo.status !== 'passed') {
    const filename = `failure-${testInfo.title.replace(/\s+/g, '-')}`;
    await takeTimestampedScreenshot(page, filename);
  }
}

// ============================================================================
// Navigation Utilities
// ============================================================================

/**
 * Navigate to page and wait for load
 * 
 * @example
 * await navigateAndWait(page, '/admin/guests');
 */
export async function navigateAndWait(
  page: Page,
  url: string
): Promise<void> {
  await page.goto(url);
  await waitForPageLoad(page);
}

/**
 * Click link and wait for navigation
 * 
 * @example
 * await clickAndNavigate(page, 'text=View Details');
 */
export async function clickAndNavigate(
  page: Page,
  selector: string
): Promise<void> {
  await Promise.all([
    page.waitForNavigation(),
    page.click(selector),
  ]);
  await waitForPageLoad(page);
}

/**
 * Go back and wait for load
 * 
 * @example
 * await goBackAndWait(page);
 */
export async function goBackAndWait(page: Page): Promise<void> {
  await page.goBack();
  await waitForPageLoad(page);
}

// ============================================================================
// Modal/Dialog Utilities
// ============================================================================

/**
 * Wait for modal to open
 * 
 * @example
 * await waitForModal(page, 'Create Guest');
 */
export async function waitForModal(
  page: Page,
  titleText?: string
): Promise<Locator> {
  const modalSelectors = [
    '[role="dialog"]',
    '.modal',
    '[data-testid="modal"]',
  ];
  
  let modal: Locator | null = null;
  
  for (const selector of modalSelectors) {
    const element = page.locator(selector);
    const count = await element.count();
    
    if (count > 0) {
      await expect(element.first()).toBeVisible({ timeout: 5000 });
      modal = element.first();
      break;
    }
  }
  
  if (!modal) {
    throw new Error('Modal not found');
  }
  
  if (titleText) {
    await expect(modal).toContainText(titleText);
  }
  
  return modal;
}

/**
 * Close modal by clicking close button or overlay
 * 
 * @example
 * await closeModal(page);
 */
export async function closeModal(page: Page): Promise<void> {
  const closeSelectors = [
    '[role="dialog"] button[aria-label="Close"]',
    '.modal .close-button',
    '[data-testid="modal-close"]',
  ];
  
  for (const selector of closeSelectors) {
    const button = page.locator(selector);
    const count = await button.count();
    
    if (count > 0) {
      await button.first().click();
      await waitForElementHidden(page, '[role="dialog"]');
      return;
    }
  }
  
  // Try clicking overlay
  await page.locator('.modal-overlay, [data-testid="modal-overlay"]').click();
  await waitForElementHidden(page, '[role="dialog"]');
}

// ============================================================================
// Table/List Utilities
// ============================================================================

/**
 * Get row count in table
 * 
 * @example
 * const count = await getTableRowCount(page, '[data-testid="guest-table"]');
 */
export async function getTableRowCount(
  page: Page,
  tableSelector: string
): Promise<number> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  return await rows.count();
}

/**
 * Find table row by cell content
 * 
 * @example
 * const row = await findTableRow(page, 'table', 'John Doe');
 */
export async function findTableRow(
  page: Page,
  tableSelector: string,
  cellContent: string
): Promise<Locator> {
  const row = page.locator(`${tableSelector} tbody tr:has-text("${cellContent}")`);
  await expect(row).toBeVisible();
  return row;
}

/**
 * Click button in table row
 * 
 * @example
 * await clickRowButton(page, 'table', 'John Doe', 'Edit');
 */
export async function clickRowButton(
  page: Page,
  tableSelector: string,
  rowIdentifier: string,
  buttonText: string
): Promise<void> {
  const row = await findTableRow(page, tableSelector, rowIdentifier);
  await row.locator(`button:has-text("${buttonText}")`).click();
}

// ============================================================================
// Authentication Utilities
// ============================================================================

/**
 * Login as admin user
 * 
 * @example
 * await loginAsAdmin(page, 'admin@test.com', 'password');
 */
export async function loginAsAdmin(
  page: Page,
  email: string = 'admin@test.com',
  password: string = 'test-password'
): Promise<void> {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**');
  await waitForPageLoad(page);
}

/**
 * Login as guest user
 * 
 * @example
 * await loginAsGuest(page, 'guest@example.com');
 */
export async function loginAsGuest(
  page: Page,
  email: string
): Promise<void> {
  await page.goto('/auth/guest-login');
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');
  await waitForToast(page, 'Login successful', 'success');
  await waitForPageLoad(page);
}

/**
 * Logout current user
 * 
 * @example
 * await logout(page);
 */
export async function logout(page: Page): Promise<void> {
  await page.click('button:has-text("Logout"), a:has-text("Logout")');
  await page.waitForURL('**/login');
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Delete test data by prefix
 * 
 * @example
 * await cleanupTestData('test-');
 */
export async function cleanupTestData(prefix: string = 'test-'): Promise<void> {
  const supabase = createTestClient();
  
  // Clean up in order to respect foreign key constraints
  const tables = [
    'rsvps',
    'activities',
    'events',
    'guests',
    'guest_groups',
    'content_pages',
    'sections',
    'photos',
  ];
  
  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .like('name', `${prefix}%`);
  }
}

/**
 * Delete specific test entity
 * 
 * @example
 * await deleteTestEntity('guests', 'guest-123');
 */
export async function deleteTestEntity(
  table: string,
  id: string
): Promise<void> {
  const supabase = createTestClient();
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.warn(`Failed to delete test entity: ${error.message}`);
  }
}

// ============================================================================
// Assertion Utilities
// ============================================================================

/**
 * Assert URL contains path
 * 
 * @example
 * await assertUrlContains(page, '/admin/guests');
 */
export async function assertUrlContains(
  page: Page,
  path: string
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Assert element has attribute value
 * 
 * @example
 * await assertAttribute(page, 'input[name="email"]', 'type', 'email');
 */
export async function assertAttribute(
  page: Page,
  selector: string,
  attribute: string,
  value: string
): Promise<void> {
  await expect(page.locator(selector)).toHaveAttribute(attribute, value);
}

/**
 * Assert element has CSS class
 * 
 * @example
 * await assertHasClass(page, '.button', 'active');
 */
export async function assertHasClass(
  page: Page,
  selector: string,
  className: string
): Promise<void> {
  await expect(page.locator(selector)).toHaveClass(new RegExp(className));
}

// ============================================================================
// Debugging Utilities
// ============================================================================

/**
 * Log page console messages
 * 
 * @example
 * logConsoleMessages(page);
 */
export function logConsoleMessages(page: Page): void {
  page.on('console', (msg) => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });
}

/**
 * Log network requests
 * 
 * @example
 * logNetworkRequests(page);
 */
export function logNetworkRequests(page: Page): void {
  page.on('request', (request) => {
    console.log(`[Request]: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', (response) => {
    console.log(`[Response]: ${response.status()} ${response.url()}`);
  });
}

/**
 * Pause test execution for debugging
 * 
 * @example
 * await debugPause(page);
 */
export async function debugPause(page: Page): Promise<void> {
  await page.pause();
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  // Element waiting
  waitForElement,
  waitForElementHidden,
  waitForText,
  waitForElementCount,
  waitForPageLoad,
  
  // Form filling
  fillAndSubmitForm,
  fillFormFieldByLabel,
  selectDropdownOption,
  toggleCheckbox,
  
  // Toast messages
  waitForToast,
  waitForToastDismiss,
  dismissToast,
  
  // Test data creation
  createTestGuest,
  createTestGroup,
  createTestEvent,
  createTestActivity,
  createTestContentPage,
  
  // Screenshots
  takeTimestampedScreenshot,
  takeElementScreenshot,
  screenshotOnFailure,
  
  // Navigation
  navigateAndWait,
  clickAndNavigate,
  goBackAndWait,
  
  // Modals
  waitForModal,
  closeModal,
  
  // Tables
  getTableRowCount,
  findTableRow,
  clickRowButton,
  
  // Authentication
  loginAsAdmin,
  loginAsGuest,
  logout,
  
  // Cleanup
  cleanupTestData,
  deleteTestEntity,
  
  // Assertions
  assertUrlContains,
  assertAttribute,
  assertHasClass,
  
  // Debugging
  logConsoleMessages,
  logNetworkRequests,
  debugPause,
};
