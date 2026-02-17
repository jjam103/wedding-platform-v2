import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/admin.json' });

test('debug validation errors', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.waitForLoadState('commit');
  
  await page.click('text=Add New Guest');
  await page.waitForSelector('button[type="submit"]:has-text("Create")', { state: 'visible' });
  
  // Don't fill any fields - just submit
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait a moment for validation
  await page.waitForTimeout(1000);
  
  console.log('=== CHECKING FOR VALIDATION ERRORS ===');
  
  // Check for all possible error indicators
  const alerts = await page.locator('[role="alert"]').count();
  console.log(`Total alerts: ${alerts}`);
  
  for (let i = 0; i < alerts; i++) {
    const alert = page.locator('[role="alert"]').nth(i);
    const text = await alert.textContent();
    const id = await alert.getAttribute('id');
    const isVisible = await alert.isVisible();
    console.log(`Alert ${i}: id="${id}", visible=${isVisible}, text="${text}"`);
  }
  
  // Check for field-level errors
  const fieldErrors = await page.locator('[id$="-error"]').count();
  console.log(`\nField errors: ${fieldErrors}`);
  
  for (let i = 0; i < fieldErrors; i++) {
    const error = page.locator('[id$="-error"]').nth(i);
    const text = await error.textContent();
    const id = await error.getAttribute('id');
    const isVisible = await error.isVisible();
    console.log(`Field error ${i}: id="${id}", visible=${isVisible}, text="${text}"`);
  }
  
  // Check if form is still open
  const formOpen = await page.locator('button[type="submit"]:has-text("Create")').isVisible();
  console.log(`\nForm still open: ${formOpen}`);
  
  // Check for any text containing "required"
  const requiredText = await page.locator('text=/required/i').count();
  console.log(`Elements with "required" text: ${requiredText}`);
  
  await page.screenshot({ path: 'test-results/validation-errors-debug.png', fullPage: true });
});
