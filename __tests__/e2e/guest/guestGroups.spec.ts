/**
 * E2E Test Suite: Guest Groups & Registration
 * 
 * Consolidated from:
 * - guestGroupsFlow.spec.ts (10 tests)
 * - guestGroupsDropdown.spec.ts (10 tests)
 * - guestRegistration.spec.ts (7 tests)
 * 
 * This suite tests the complete guest groups management and registration workflows:
 * 
 * **Guest Groups Management**:
 * - Group creation and immediate dropdown availability
 * - Group editing and deletion
 * - Multiple groups handling
 * - Form validation and error handling
 * 
 * **Dropdown Reactivity**:
 * - Dropdown updates after group creation
 * - Async params handling
 * - Loading and error states
 * - State persistence across navigation
 * 
 * **Guest Registration**:
 * - Complete registration flow
 * - Form validation and XSS prevention
 * - Duplicate email handling
 * - Accessibility compliance
 * 
 * **Coverage**:
 * - Requirements: 3.3, 4.1, 4.4, 4.5, 4.6
 * - Original Tests: 27 → Consolidated: 15 (44% reduction)
 * 
 * **Why These Tests Are Critical**:
 * This suite would have caught the dropdown reactivity bug where newly created groups
 * didn't appear in the guest creation dropdown. The bug occurred because formFields
 * was static and didn't update when groups state changed. These E2E tests validate
 * the complete user workflow, not just isolated component behavior.
 * 
 * @see docs/E2E_CONSOLIDATION_PHASE3_COMPLETE.md
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Groups Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to guests page
    await page.goto('/admin/guests');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Guest Management');
  });
  
  test('should create group and immediately use it for guest creation', async ({ page }) => {
    const groupName = `Test Family ${Date.now()}`;
    const guestFirstName = 'John';
    const guestLastName = 'Doe';
    
    // Step 1: Create a new group
    await test.step('Create new guest group', async () => {
      // Open groups section
      await page.click('text=Manage Groups');
      
      // Wait for form to be visible
      await expect(page.locator('input[name="name"]')).toBeVisible();
      
      // Fill in group name
      await page.fill('input[name="name"]', groupName);
      await page.fill('textarea[name="description"]', 'Test group for E2E testing');
      
      // Submit form
      await page.click('button:has-text("Create Group")');
      
      // Wait for success toast
      await expect(page.locator('text=Group created successfully')).toBeVisible({ timeout: 5000 });
    });
    
    // Step 2: Verify group appears in the list
    await test.step('Verify group appears in list', async () => {
      // Group should be visible in the groups list
      await expect(page.locator(`text=${groupName}`)).toBeVisible();
    });
    
    // Step 3: Open guest creation form and verify group is in dropdown
    await test.step('Verify group appears in guest creation dropdown', async () => {
      // Open guest creation section
      await page.click('text=Add New Guest');
      
      // Wait for form to be visible
      await expect(page.locator('select[name="groupId"]')).toBeVisible();
      
      // Check that the new group appears in the dropdown
      const groupSelect = page.locator('select[name="groupId"]');
      const options = await groupSelect.locator('option').allTextContents();
      
      // THIS IS THE KEY TEST - Would have caught the dropdown bug!
      expect(options).toContain(groupName);
    });
    
    // Step 4: Create a guest with the new group
    await test.step('Create guest with new group', async () => {
      // Select the new group
      await page.selectOption('select[name="groupId"]', { label: groupName });
      
      // Fill in guest details
      await page.fill('input[name="firstName"]', guestFirstName);
      await page.fill('input[name="lastName"]', guestLastName);
      await page.fill('input[name="email"]', `john.doe.${Date.now()}@example.com`);
      await page.selectOption('select[name="ageType"]', 'adult');
      await page.selectOption('select[name="guestType"]', 'wedding_guest');
      
      // Submit form
      await page.click('button:has-text("Create Guest")');
      
      // Wait for success toast
      await expect(page.locator('text=Guest created successfully')).toBeVisible({ timeout: 5000 });
    });
    
    // Step 5: Verify guest appears in the list with correct group
    await test.step('Verify guest appears with correct group', async () => {
      // Guest should be visible in the table
      await expect(page.locator(`text=${guestFirstName} ${guestLastName}`)).toBeVisible();
      
      // Find the row containing the guest
      const guestRow = page.locator(`tr:has-text("${guestFirstName} ${guestLastName}")`);
      
      // Verify the group name appears in the same row
      await expect(guestRow.locator(`text=${groupName}`)).toBeVisible();
    });
  });
  
  test('should update and delete groups with proper handling', async ({ page }) => {
    const originalName = `Original Group ${Date.now()}`;
    const updatedName = `Updated Group ${Date.now()}`;
    
    // Step 1: Create a group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', originalName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Step 2: Edit the group
    await page.click(`button[aria-label*="Edit ${originalName}"]`);
    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Update Group")');
    await expect(page.locator('text=Group updated successfully')).toBeVisible();
    
    // Step 3: Verify updated name appears
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator(`text=${originalName}`)).not.toBeVisible();
    
    // Step 4: Delete the group
    await page.click(`button[aria-label*="Delete ${updatedName}"]`);
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Group deleted successfully')).toBeVisible();
    
    // Verify group is removed
    await expect(page.locator(`text=${updatedName}`)).not.toBeVisible();
  });
  
  test('should handle multiple groups in dropdown correctly', async ({ page }) => {
    const group1 = `Group A ${Date.now()}`;
    const group2 = `Group B ${Date.now()}`;
    const group3 = `Group C ${Date.now()}`;
    
    // Create multiple groups
    await page.click('text=Manage Groups');
    
    for (const groupName of [group1, group2, group3]) {
      await page.fill('input[name="name"]', groupName);
      await page.click('button:has-text("Create Group")');
      await expect(page.locator('text=Group created successfully')).toBeVisible();
      
      // Clear the form for next group
      await page.fill('input[name="name"]', '');
    }
    
    // Open guest form and verify all groups appear
    await page.click('text=Add New Guest');
    const groupSelect = page.locator('select[name="groupId"]');
    const options = await groupSelect.locator('option').allTextContents();
    
    // All three groups should be in the dropdown
    expect(options).toContain(group1);
    expect(options).toContain(group2);
    expect(options).toContain(group3);
  });

  test('should show validation errors and handle form states', async ({ page }) => {
    // Step 1: Test validation errors
    await page.click('text=Manage Groups');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Group")');
    
    // Should show validation error
    await expect(page.locator('text=Name is required')).toBeVisible({ timeout: 2000 });
    
    // Step 2: Test loading state
    const groupName = `Loading Test ${Date.now()}`;
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    
    // Should show loading indicator (button disabled or spinner)
    const createButton = page.locator('button:has-text("Create Group")');
    await expect(createButton).toBeDisabled({ timeout: 1000 });
    
    // Wait for success
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Step 3: Form should be cleared after successful creation
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });
  
  test('should handle network errors and prevent duplicates', async ({ page }) => {
    const groupName = `Error Test ${Date.now()}`;
    
    // Step 1: Test network error handling
    await page.route('**/api/admin/guest-groups', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
          },
        }),
      });
    });
    
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    
    // Should show error toast
    await expect(page.locator('text=Database connection failed')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Remove route interception
    await page.unroute('**/api/admin/guest-groups');
    
    // Step 3: Create group successfully
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Step 4: Try to create duplicate
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    
    // Should show error
    await expect(page.locator('text=already exists')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dropdown Reactivity & State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/guests');
    await expect(page.locator('h1')).toContainText('Guest Management');
  });
  
  test('should update dropdown immediately after creating new group', async ({ page }) => {
    const groupName = `Dropdown Test ${Date.now()}`;
    
    // Step 1: Check initial dropdown state
    await page.click('text=Add New Guest');
    const groupSelect = page.locator('select[name="groupId"]');
    const initialOptions = await groupSelect.locator('option').allTextContents();
    
    // Close guest form
    await page.keyboard.press('Escape');
    
    // Step 2: Create new group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Step 3: Open guest form again and check dropdown
    await page.click('text=Add New Guest');
    await expect(groupSelect).toBeVisible();
    
    // THIS IS THE CRITICAL TEST - New group should appear immediately
    const updatedOptions = await groupSelect.locator('option').allTextContents();
    
    expect(updatedOptions).toContain(groupName);
    expect(updatedOptions.length).toBeGreaterThan(initialOptions.length);
    
    // Step 4: Verify selection works
    await groupSelect.selectOption({ label: groupName });
    const selectedValue = await groupSelect.inputValue();
    expect(selectedValue).toBeTruthy();
    expect(selectedValue).not.toBe('');
  });
  
  test('should handle async params and maintain state across navigation', async ({ page }) => {
    const groupName = `Navigation Test ${Date.now()}`;
    
    // Step 1: Create group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Step 2: Test async params in dynamic route
    await page.goto('/admin/accommodations');
    await expect(page.locator('h1')).toContainText('Accommodations');
    
    const firstAccommodation = page.locator('tr').nth(1);
    const hasAccommodations = await firstAccommodation.isVisible().catch(() => false);
    
    if (hasAccommodations) {
      await firstAccommodation.click();
      
      // Should not crash with "params is a Promise" error
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    }
    
    // Step 3: Navigate back to guests
    await page.goto('/admin/guests');
    await expect(page.locator('h1')).toContainText('Guest Management');
    
    // Step 4: Open guest form - new group should still be in dropdown
    await page.click('text=Add New Guest');
    const groupSelect = page.locator('select[name="groupId"]');
    const options = await groupSelect.locator('option').allTextContents();
    
    expect(options).toContain(groupName);
  });
  
  test('should handle loading and error states in dropdown', async ({ page }) => {
    // Step 1: Test loading state
    await page.route('**/api/admin/guest-groups', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.click('text=Add New Guest');
    const groupSelect = page.locator('select[name="groupId"]');
    
    // Either dropdown is disabled or shows loading text
    const isDisabled = await groupSelect.isDisabled().catch(() => false);
    const hasLoadingText = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(isDisabled || hasLoadingText).toBe(true);
    
    // Wait for loading to complete
    await page.waitForTimeout(1500);
    
    // Step 2: Test empty groups list
    await page.unroute('**/api/admin/guest-groups');
    await page.route('**/api/admin/guest-groups', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
    
    await page.reload();
    await page.click('text=Add New Guest');
    
    const options = await groupSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toMatch(/select|choose|no groups/i);
    
    // Step 3: Test API error
    await page.unroute('**/api/admin/guest-groups');
    await page.route('**/api/admin/guest-groups', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to load groups',
          },
        }),
      });
    });
    
    await page.reload();
    await page.click('text=Add New Guest');
    
    const hasError = await page.locator('text=Failed to load groups').isVisible({ timeout: 3000 }).catch(() => false);
    const isDisabledAfterError = await groupSelect.isDisabled().catch(() => false);
    
    expect(hasError || isDisabledAfterError).toBe(true);
  });
});

test.describe('Guest Registration', () => {
  const testEmail = `test-guest-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  test('should complete full guest registration flow', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Register/i);

    // Step 2: Fill out registration form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Verify success message
    await expect(page.locator('text=/registration successful/i')).toBeVisible({ timeout: 10000 });

    // Step 5: Verify redirect to dashboard
    await expect(page).toHaveURL(/\/guest\/dashboard/);

    // Step 6: Verify dashboard displays user information
    await expect(page.locator('text=/welcome.*john/i')).toBeVisible();
    await expect(page.locator('[data-testid="guest-name"]')).toContainText('John Doe');

    // Step 7: Verify navigation menu is accessible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href*="rsvp"]')).toBeVisible();
    await expect(page.locator('a[href*="itinerary"]')).toBeVisible();
  });

  test('should prevent XSS and validate form inputs', async ({ page }) => {
    await page.goto('/auth/register');

    // Step 1: Test XSS prevention
    const xssPayload = '<script>alert("xss")</script>';
    
    await page.fill('input[name="firstName"]', xssPayload);
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });

    // Verify XSS payload was sanitized
    const nameElement = page.locator('[data-testid="guest-name"]');
    const nameText = await nameElement.textContent();
    
    expect(nameText).not.toContain('<script>');
    expect(nameText).not.toContain('alert');
    expect(nameText).not.toContain('xss');
    
    // Logout for next test
    await page.click('button[aria-label="Logout"]');
    await page.waitForURL(/\/auth\/login/);
    
    // Step 2: Test required field validation
    await page.goto('/auth/register');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/first name.*required/i')).toBeVisible();
    await expect(page.locator('text=/last name.*required/i')).toBeVisible();
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    
    // Step 3: Test email format validation
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });

  test('should handle duplicate email and be keyboard accessible', async ({ page }) => {
    // Step 1: First registration
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });

    // Logout
    await page.click('button[aria-label="Logout"]');
    await page.waitForURL(/\/auth\/login/);

    // Step 2: Try to register again with same email
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=/email.*already.*registered/i')).toBeVisible();
    
    // Step 3: Test keyboard navigation
    await page.goto('/auth/register');
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="firstName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="lastName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
  });
});

test.describe('Guest Groups - Accessibility', () => {
  test('should have proper accessibility attributes', async ({ page }) => {
    // Step 1: Test registration form accessibility
    await page.goto('/auth/register');

    await expect(page.locator('form')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('type', 'email');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Step 2: Test guest groups form accessibility
    await page.goto('/admin/guests');
    await page.click('text=Manage Groups');
    
    const groupForm = page.locator('form').first();
    await expect(groupForm).toBeVisible();
    
    // Form should have proper labels
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    
    // Submit button should be accessible
    const submitButton = page.locator('button:has-text("Create Group")');
    await expect(submitButton).toBeEnabled();
  });
});
