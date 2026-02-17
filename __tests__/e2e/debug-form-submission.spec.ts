import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/admin.json' });

test('debug form submission', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/admin/guests');
  console.log('✓ Navigated to guests page');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('commit');
  console.log('✓ Page loaded');
  
  // Click Add New Guest button
  await page.click('text=Add New Guest');
  console.log('✓ Clicked Add New Guest');
  
  // Wait for form to be visible
  await page.waitForSelector('button:has-text("Create")', { state: 'visible' });
  console.log('✓ Form is visible');
  
  // Fill text fields
  await page.fill('input[name="firstName"]', 'John');
  console.log('✓ Filled firstName');
  
  await page.fill('input[name="lastName"]', 'Doe');
  console.log('✓ Filled lastName');
  
  await page.fill('input[name="email"]', `john.doe.${Date.now()}@example.com`);
  console.log('✓ Filled email');
  
  // Check if group select is visible and has options
  const groupSelect = page.locator('select[name="groupId"]');
  const isGroupVisible = await groupSelect.isVisible();
  console.log(`✓ Group select visible: ${isGroupVisible}`);
  
  if (isGroupVisible) {
    const options = await groupSelect.locator('option').allTextContents();
    console.log(`✓ Group options: ${JSON.stringify(options)}`);
    
    // Try to select the first non-placeholder option
    if (options.length > 1) {
      const firstOption = await groupSelect.locator('option').nth(1).getAttribute('value');
      console.log(`✓ Selecting group with value: ${firstOption}`);
      await groupSelect.selectOption(firstOption!);
      
      // Verify selection
      const selectedValue = await groupSelect.inputValue();
      console.log(`✓ Group selected value: ${selectedValue}`);
    }
  }
  
  // Select age type
  const ageTypeSelect = page.locator('select[name="ageType"]');
  const ageOptions = await ageTypeSelect.locator('option').allTextContents();
  console.log(`✓ Age type options: ${JSON.stringify(ageOptions)}`);
  
  await ageTypeSelect.selectOption('adult');
  const ageValue = await ageTypeSelect.inputValue();
  console.log(`✓ Age type selected value: ${ageValue}`);
  
  // Select guest type
  const guestTypeSelect = page.locator('select[name="guestType"]');
  const guestOptions = await guestTypeSelect.locator('option').allTextContents();
  console.log(`✓ Guest type options: ${JSON.stringify(guestOptions)}`);
  
  await guestTypeSelect.selectOption('wedding_guest');
  const guestValue = await guestTypeSelect.inputValue();
  console.log(`✓ Guest type selected value: ${guestValue}`);
  
  // Wait a moment for React state to update
  await page.waitForTimeout(500);
  
  // Take a screenshot before submission
  await page.screenshot({ path: 'test-results/before-submit.png', fullPage: true });
  console.log('✓ Screenshot taken');
  
  // Try to submit
  console.log('✓ Attempting to submit form...');
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait for either success toast or error
  try {
    await page.waitForSelector('[data-testid="toast-success"], [data-testid="toast-error"], [role="alert"]', { timeout: 5000 });
    console.log('✓ Toast or error appeared');
    
    // Check what appeared
    const successToast = await page.locator('[data-testid="toast-success"]').isVisible().catch(() => false);
    const errorToast = await page.locator('[data-testid="toast-error"]').isVisible().catch(() => false);
    const alertElement = await page.locator('[role="alert"]').first().isVisible().catch(() => false);
    
    console.log(`Success toast: ${successToast}`);
    console.log(`Error toast: ${errorToast}`);
    console.log(`Alert element: ${alertElement}`);
    
    if (alertElement) {
      const alertText = await page.locator('[role="alert"]').first().textContent();
      console.log(`Alert text: ${alertText}`);
    }
    
    if (errorToast) {
      const errorText = await page.locator('[data-testid="toast-error"]').textContent();
      console.log(`Error toast text: ${errorText}`);
    }
    
  } catch (error) {
    console.log('✗ No toast or error appeared within timeout');
    await page.screenshot({ path: 'test-results/after-submit-no-toast.png', fullPage: true });
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/after-submit.png', fullPage: true });
});
