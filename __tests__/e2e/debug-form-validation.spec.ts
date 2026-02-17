import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/admin.json' });

test('debug form validation errors', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/admin/guests');
  await page.waitForLoadState('commit');
  
  // Click Add New Guest button
  await page.click('text=Add New Guest');
  await page.waitForSelector('button:has-text("Create")', { state: 'visible' });
  
  // Fill all required fields
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.fill('input[name="email"]', `john.doe.${Date.now()}@example.com`);
  
  // Select all required dropdowns
  const groupSelect = page.locator('select[name="groupId"]');
  const firstGroupValue = await groupSelect.locator('option').nth(1).getAttribute('value');
  await groupSelect.selectOption(firstGroupValue!);
  
  await page.locator('select[name="ageType"]').selectOption('adult');
  await page.locator('select[name="guestType"]').selectOption('wedding_guest');
  
  // Wait for React state to update
  await page.waitForTimeout(500);
  
  console.log('=== BEFORE SUBMIT ===');
  
  // Check for any existing validation errors
  const existingAlerts = await page.locator('[role="alert"]').count();
  console.log(`Existing alerts before submit: ${existingAlerts}`);
  
  if (existingAlerts > 0) {
    for (let i = 0; i < existingAlerts; i++) {
      const alertText = await page.locator('[role="alert"]').nth(i).textContent();
      const alertId = await page.locator('[role="alert"]').nth(i).getAttribute('id');
      console.log(`Alert ${i}: id="${alertId}", text="${alertText}"`);
    }
  }
  
  // Submit the form
  console.log('=== SUBMITTING FORM ===');
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait a moment for validation
  await page.waitForTimeout(1000);
  
  console.log('=== AFTER SUBMIT ===');
  
  // Check for validation errors
  const alertsAfter = await page.locator('[role="alert"]').count();
  console.log(`Alerts after submit: ${alertsAfter}`);
  
  if (alertsAfter > 0) {
    for (let i = 0; i < alertsAfter; i++) {
      const alert = page.locator('[role="alert"]').nth(i);
      const alertText = await alert.textContent();
      const alertId = await alert.getAttribute('id');
      const isVisible = await alert.isVisible();
      console.log(`Alert ${i}: id="${alertId}", visible=${isVisible}, text="${alertText}"`);
    }
  }
  
  // Check for toasts
  const successToast = await page.locator('[data-testid="toast-success"]').isVisible().catch(() => false);
  const errorToast = await page.locator('[data-testid="toast-error"]').isVisible().catch(() => false);
  
  console.log(`Success toast visible: ${successToast}`);
  console.log(`Error toast visible: ${errorToast}`);
  
  if (errorToast) {
    const errorText = await page.locator('[data-testid="toast-error"]').textContent();
    console.log(`Error toast text: "${errorText}"`);
  }
  
  // Check form state
  const formStillOpen = await page.locator('button:has-text("Create")').isVisible();
  console.log(`Form still open: ${formStillOpen}`);
  
  // Get all form field values
  console.log('=== FORM FIELD VALUES ===');
  const firstName = await page.locator('input[name="firstName"]').inputValue();
  const lastName = await page.locator('input[name="lastName"]').inputValue();
  const email = await page.locator('input[name="email"]').inputValue();
  const groupId = await page.locator('select[name="groupId"]').inputValue();
  const ageType = await page.locator('select[name="ageType"]').inputValue();
  const guestType = await page.locator('select[name="guestType"]').inputValue();
  
  console.log(`firstName: "${firstName}"`);
  console.log(`lastName: "${lastName}"`);
  console.log(`email: "${email}"`);
  console.log(`groupId: "${groupId}"`);
  console.log(`ageType: "${ageType}"`);
  console.log(`guestType: "${guestType}"`);
  
  await page.screenshot({ path: 'test-results/validation-debug.png', fullPage: true });
});
