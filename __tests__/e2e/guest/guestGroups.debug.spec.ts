/**
 * DEBUG Test: Guest Groups - Understanding Why Tests Fail
 * 
 * This test helps us understand the actual state of the page
 * and why the guest creation tests are failing.
 */

import { test, expect } from '@playwright/test';

test.describe('DEBUG: Guest Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/guests');
    await expect(page.locator('h1:has-text("Guest Management")')).toBeVisible();
  });
  
  test('DEBUG: Understand guest creation workflow', async ({ page }) => {
    const groupName = `Debug Group ${Date.now()}`;
    
    // Step 1: Take initial screenshot
    await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });
    console.log('✓ Step 1: Initial page loaded');
    
    // Step 2: Create a group
    await page.click('text=Manage Groups');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'debug-2-groups-section-open.png', fullPage: true });
    console.log('✓ Step 2: Groups section opened');
    
    await page.fill('input[name="name"]', groupName);
    await page.fill('textarea[name="description"]', 'Debug test group');
    await page.screenshot({ path: 'debug-3-group-form-filled.png', fullPage: true });
    console.log('✓ Step 3: Group form filled');
    
    await page.click('button:has-text("Create Group")');
    
    // Wait for success toast
    try {
      await expect(page.locator('text=Group created successfully')).toBeVisible({ timeout: 5000 });
      console.log('✓ Step 4: Group created successfully');
    } catch (e) {
      console.log('✗ Step 4: No success toast found');
      await page.screenshot({ path: 'debug-4-no-toast.png', fullPage: true });
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-5-after-group-creation.png', fullPage: true });
    
    // Step 3: Check if group appears in list
    const groupInList = await page.locator(`text=${groupName}`).first().isVisible();
    console.log(`✓ Step 5: Group in list: ${groupInList}`);
    
    // Step 4: Open guest form
    console.log('Attempting to open guest form...');
    const addGuestButton = page.locator('text=Add Guest');
    const isAddGuestVisible = await addGuestButton.isVisible();
    console.log(`  Add Guest button visible: ${isAddGuestVisible}`);
    
    if (isAddGuestVisible) {
      await addGuestButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'debug-6-guest-form-opened.png', fullPage: true });
      console.log('✓ Step 6: Guest form opened');
      
      // Step 5: Check dropdown options
      const groupSelect = page.locator('select[name="groupId"]');
      const isSelectVisible = await groupSelect.isVisible();
      console.log(`  Group select visible: ${isSelectVisible}`);
      
      if (isSelectVisible) {
        const options = await groupSelect.locator('option').allTextContents();
        console.log(`  Dropdown options (${options.length}):`, options);
        console.log(`  New group "${groupName}" in dropdown: ${options.includes(groupName)}`);
        
        // Step 6: Fill form fields
        console.log('Filling guest form...');
        
        // Try to select the group
        if (options.includes(groupName)) {
          await groupSelect.selectOption({ label: groupName });
          console.log('  ✓ Group selected');
        } else {
          console.log('  ✗ Group not in dropdown - cannot proceed');
          await page.screenshot({ path: 'debug-7-group-not-in-dropdown.png', fullPage: true });
          return;
        }
        
        await page.fill('input[name="firstName"]', 'Debug');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', `debug.${Date.now()}@example.com`);
        await page.selectOption('select[name="ageType"]', 'adult');
        await page.selectOption('select[name="guestType"]', 'wedding_guest');
        
        await page.screenshot({ path: 'debug-8-guest-form-filled.png', fullPage: true });
        console.log('✓ Step 7: Guest form filled');
        
        // Step 7: Check submit button (use data-testid to avoid strict mode violation)
        const submitButton = page.locator('button[data-testid="form-submit-button"]');
        const isSubmitVisible = await submitButton.isVisible();
        const isSubmitEnabled = await submitButton.isEnabled();
        console.log(`  Submit button visible: ${isSubmitVisible}`);
        console.log(`  Submit button enabled: ${isSubmitEnabled}`);
        
        if (!isSubmitVisible) {
          console.log('  Checking for other submit buttons...');
          const allButtons = await page.locator('button[type="submit"]').allTextContents();
          console.log('  All submit buttons:', allButtons);
        }
        
        await page.screenshot({ path: 'debug-9-before-submit.png', fullPage: true });
        
        // Step 8: Try to submit
        if (isSubmitVisible && isSubmitEnabled) {
          console.log('Attempting to submit form...');
          await submitButton.click();
          
          // Wait for response
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'debug-10-after-submit.png', fullPage: true });
          
          // Check for success toast
          const successToast = await page.locator('text=Guest created successfully').isVisible().catch(() => false);
          console.log(`  Success toast visible: ${successToast}`);
          
          // Check for error toast
          const errorToast = await page.locator('[role="alert"]').isVisible().catch(() => false);
          if (errorToast) {
            const errorText = await page.locator('[role="alert"]').textContent();
            console.log(`  Error toast: ${errorText}`);
          }
        } else {
          console.log('  ✗ Cannot submit - button not visible or not enabled');
        }
      } else {
        console.log('  ✗ Group select not visible');
      }
    } else {
      console.log('  ✗ Add Guest button not visible');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-11-final-state.png', fullPage: true });
    console.log('✓ Debug test complete - check screenshots in project root');
  });
  
  test('DEBUG: Check form state and reactivity', async ({ page }) => {
    const groupName = `Reactivity Test ${Date.now()}`;
    
    // Create a group
    await page.click('text=Manage Groups');
    await page.fill('input[name="name"]', groupName);
    await page.click('button:has-text("Create Group")');
    await page.waitForTimeout(1000);
    
    // Open guest form BEFORE checking dropdown
    await page.click('text=Add Guest');
    await page.waitForTimeout(500);
    
    // Get initial dropdown state
    const groupSelect = page.locator('select[name="groupId"]');
    const initialOptions = await groupSelect.locator('option').allTextContents();
    console.log('Initial dropdown options:', initialOptions);
    console.log(`New group in dropdown: ${initialOptions.includes(groupName)}`);
    
    // Close and reopen form to test reactivity
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.click('text=Add Guest');
    await page.waitForTimeout(500);
    
    const updatedOptions = await groupSelect.locator('option').allTextContents();
    console.log('Updated dropdown options:', updatedOptions);
    console.log(`New group in dropdown after reopen: ${updatedOptions.includes(groupName)}`);
    
    // Check if formFields memo is working
    console.log('Dropdown options count:', updatedOptions.length);
    console.log('Expected to include:', groupName);
    console.log('Actually includes:', updatedOptions.includes(groupName));
  });
});
