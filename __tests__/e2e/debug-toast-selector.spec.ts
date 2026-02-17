import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/admin.json' });

test('debug toast selector', async ({ page }) => {
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
  
  // Submit the form
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait for toast to appear
  await page.waitForTimeout(2000);
  
  console.log('=== CHECKING TOAST SELECTORS ===');
  
  // Try different selectors
  const selectors = [
    '[data-testid="toast-success"]',
    '[data-testid="toast-error"]',
    '[role="alert"]',
    '.animate-slide-in-right',
    'div[role="alert"][data-testid]',
  ];
  
  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    console.log(`Selector "${selector}": ${count} elements`);
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const element = page.locator(selector).nth(i);
        const text = await element.textContent();
        const testid = await element.getAttribute('data-testid');
        const role = await element.getAttribute('role');
        const isVisible = await element.isVisible();
        console.log(`  [${i}] testid="${testid}", role="${role}", visible=${isVisible}, text="${text?.substring(0, 50)}"`);
      }
    }
  }
  
  // Get the HTML of all alert elements
  const alerts = page.locator('[role="alert"]');
  const alertCount = await alerts.count();
  console.log(`\n=== ALERT ELEMENTS HTML ===`);
  for (let i = 0; i < alertCount; i++) {
    const html = await alerts.nth(i).evaluate(el => el.outerHTML.substring(0, 200));
    console.log(`Alert ${i}: ${html}`);
  }
});
