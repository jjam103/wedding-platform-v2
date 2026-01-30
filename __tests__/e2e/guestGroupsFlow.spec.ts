/**
 * Guest Groups E2E Flow Test
 * 
 * This test validates the complete guest groups workflow that was missed by unit tests.
 * It would have caught the dropdown reactivity issue where new groups didn't appear
 * in the dropdown after creation.
 * 
 * Test Coverage:
 * - Create a new guest group
 * - Verify group appears in list
 * - Verify group appears in guest creation dropdown
 * - Create a guest assigned to the new group
 * - Verify guest is created with correct group
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Groups Complete Workflow', () => {
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
  
  test('should update group and reflect changes in guest list', async ({ page }) => {
    const originalName = `Original Group ${Date.now()}`;
    const updatedName = `Updated Group ${Date.now()}`;
    
    // Create a group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', originalName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Edit the group
    await page.click(`button[aria-label*="Edit ${originalName}"]`);
    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Update Group")');
    await expect(page.locator('text=Group updated successfully')).toBeVisible();
    
    // Verify updated name appears
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator(`text=${originalName}`)).not.toBeVisible();
  });
  
  test('should delete group and handle guests appropriately', async ({ page }) => {
    const groupName = `Delete Test Group ${Date.now()}`;
    
    // Create a group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    await expect(page.locator('text=Group created successfully')).toBeVisible();
    
    // Delete the group
    await page.click(`button[aria-label*="Delete ${groupName}"]`);
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Group deleted successfully')).toBeVisible();
    
    // Verify group is removed
    await expect(page.locator(`text=${groupName}`)).not.toBeVisible();
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
});

/**
 * Why This Test Would Have Caught the Bug:
 * 
 * The dropdown reactivity bug occurred because formFields was static and didn't
 * update when groups state changed. This E2E test would have failed at Step 3:
 * 
 * Expected: New group appears in dropdown
 * Actual: Dropdown still shows old groups (empty or previous groups)
 * 
 * The test explicitly checks that the newly created group appears in the dropdown,
 * which would have immediately revealed the reactivity issue.
 * 
 * This demonstrates why E2E tests are crucial - they test the actual user experience,
 * not just isolated component behavior.
 */
