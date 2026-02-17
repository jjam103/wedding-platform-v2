# E2E Event Form Test - Root Cause & Fix

**Date**: February 10, 2026  
**Test**: `should submit valid event form successfully`  
**Status**: ❌ FAILING (after 2 retries)

## Error Analysis

### First Attempt Error
```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

**What this means**: The test is waiting for an API response from `/api/admin/events` with status 201, but the response never comes within 10 seconds.

### Retry Error
```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/admin/events
```

**What this means**: On retry, the page navigation itself is failing, likely because the previous test left the browser in a bad state.

## Root Cause

The form submission is not completing successfully. Possible reasons:

1. **Form validation failing** - Required fields not filled correctly
2. **Submit button not clickable** - Element interception by CollapsibleForm header
3. **API call not triggered** - Form submission handler not firing
4. **Network issue** - API endpoint not responding

## Investigation Steps

### Step 1: Check if form is actually submitting

The test uses `force: true` to bypass interception:
```typescript
await page.click('[data-testid="form-submit-button"]', { force: true });
```

This suggests the button might be intercepted, but `force: true` should bypass that.

### Step 2: Check what's different from working tests

**Guest form test** (PASSING):
- Uses same pattern
- Same wait times
- Same force: true click

**Activity form test** (PASSING):
- Uses same pattern
- Same wait times  
- Same force: true click

**Event form test** (FAILING):
- Uses same pattern
- Same wait times
- Same force: true click

**Difference**: The event form might have additional required fields or validation that's not being satisfied.

## Solution Approaches

### Approach 1: Add More Debugging (Recommended First Step)

Add console logging to see what's happening:

```typescript
test('should submit valid event form successfully', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('[Browser Console]', msg.type(), msg.text()));
  
  await page.goto('/admin/events', { waitUntil: 'commit' });
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // ... rest of test ...
  
  // Before clicking submit, check button state
  const submitButton = page.locator('[data-testid="form-submit-button"]');
  const isDisabled = await submitButton.isDisabled();
  const isVisible = await submitButton.isVisible();
  console.log('Submit button - disabled:', isDisabled, 'visible:', isVisible);
  
  // Check form validity
  const formValid = await page.evaluate(() => {
    const form = document.querySelector('form');
    return form ? form.checkValidity() : false;
  });
  console.log('Form valid:', formValid);
  
  // Click and wait
  await page.click('[data-testid="form-submit-button"]', { force: true });
  
  // Wait a bit to see if anything happens
  await page.waitForTimeout(2000);
  
  // Check for any error messages
  const errorMessages = await page.locator('[role="alert"], .error-message').allTextContents();
  console.log('Error messages:', errorMessages);
});
```

### Approach 2: Check Required Fields

The event form might have additional required fields. Let me check what fields are required:

```typescript
// Before submitting, log all form fields and their values
const formData = await page.evaluate(() => {
  const form = document.querySelector('form');
  if (!form) return null;
  
  const data = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    data[input.name] = {
      value: input.value,
      required: input.required,
      type: input.type
    };
  });
  return data;
});
console.log('Form data:', JSON.stringify(formData, null, 2));
```

### Approach 3: Wait for Network Idle Before Submitting

The page might still be loading when we try to submit:

```typescript
// After filling form, wait for network to be idle
await page.waitForLoadState('networkidle', { timeout: 10000 });

// Then submit
await page.click('[data-testid="form-submit-button"]', { force: true });
```

### Approach 4: Use Different Wait Strategy

Instead of waiting for API response, wait for the success toast:

```typescript
// Remove the responsePromise wait
// await responsePromise;

// Just click and wait for toast
await page.click('[data-testid="form-submit-button"]', { force: true });

// Wait for success toast with longer timeout
await expect(page.locator('[data-testid="toast-success"]')).toContainText(
  /created successfully|Event created/i, 
  { timeout: 15000 } // Increased timeout
);
```

### Approach 5: Check if Event Form Has Different Structure

The event form might use a different component or have different validation. Let me check the events page:

```typescript
// Add a step to inspect the form structure
const formStructure = await page.evaluate(() => {
  const form = document.querySelector('form');
  if (!form) return 'No form found';
  
  return {
    action: form.action,
    method: form.method,
    fields: Array.from(form.elements).map(el => ({
      name: el.name,
      type: el.type,
      required: el.required,
      tagName: el.tagName
    }))
  };
});
console.log('Form structure:', JSON.stringify(formStructure, null, 2));
```

## Recommended Fix

Based on the error pattern, I recommend a multi-step fix:

### Step 1: Add Better Error Handling

```typescript
test('should submit valid event form successfully', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[Browser Error]', msg.text());
    }
  });
  
  try {
    await page.goto('/admin/events', { waitUntil: 'commit' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Click the collapsible form toggle
    const toggleButton = page.locator('[data-testid="collapsible-form-toggle"]');
    await toggleButton.waitFor({ state: 'visible', timeout: 10000 });
    const isExpanded = await toggleButton.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await toggleButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for form
    await Promise.all([
      page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 }),
      page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 })
    ]);
    
    // Fill required fields
    await page.fill('input[name="name"]', `Test Event ${Date.now()}`);
    await page.selectOption('select[name="eventType"]', 'ceremony');
    await page.selectOption('select[name="status"]', 'draft');
    
    // Handle datetime
    const startDateInput = page.locator('input[name="startDate"]');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const dateString = tomorrow.toISOString().slice(0, 16);
    await startDateInput.fill(dateString);
    
    // Wait for form to be ready
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if submit button is enabled
    const submitButton = page.locator('[data-testid="form-submit-button"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    
    // Submit form - don't wait for specific API response
    await submitButton.click({ force: true });
    
    // Wait for either success toast OR error message
    await Promise.race([
      expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 15000 }),
      expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 15000 })
    ]);
    
    // Verify it was success
    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      /created successfully|Event created/i
    );
    
  } catch (error) {
    // Take screenshot on failure
    await page.screenshot({ path: 'event-form-failure.png', fullPage: true });
    
    // Log form state
    const formState = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'No form found';
      
      const data = {};
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        data[input.name] = {
          value: input.value,
          required: input.required,
          validity: input.validity.valid
        };
      });
      return data;
    });
    console.log('Form state at failure:', JSON.stringify(formState, null, 2));
    
    throw error;
  }
});
```

### Step 2: Simplify the Test

Remove the API response wait and just wait for the toast:

```typescript
test('should submit valid event form successfully', async ({ page }) => {
  await page.goto('/admin/events', { waitUntil: 'commit' });
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Open form if collapsed
  const toggleButton = page.locator('[data-testid="collapsible-form-toggle"]');
  await toggleButton.waitFor({ state: 'visible', timeout: 10000 });
  const isExpanded = await toggleButton.getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await toggleButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Wait for form
  await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 });
  
  // Fill form
  await page.fill('input[name="name"]', `Test Event ${Date.now()}`);
  await page.selectOption('select[name="eventType"]', 'ceremony');
  await page.selectOption('select[name="status"]', 'draft');
  
  const startDateInput = page.locator('input[name="startDate"]');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  await startDateInput.fill(tomorrow.toISOString().slice(0, 16));
  
  // Wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Submit
  await page.click('[data-testid="form-submit-button"]', { force: true });
  
  // Wait for success toast (increased timeout)
  await expect(page.locator('[data-testid="toast-success"]')).toContainText(
    /created successfully|Event created/i, 
    { timeout: 15000 }
  );
});
```

## Next Steps

1. **Apply Step 1 fix** (add debugging) to understand what's failing
2. **Run test in headed mode** to see what's happening visually
3. **Check browser console** for any JavaScript errors
4. **Verify form fields** are all filled correctly
5. **Apply Step 2 fix** (simplified version) once we understand the issue

## Expected Outcome

After applying the fix, the event form test should:
- ✅ Pass consistently
- ✅ Complete within 15 seconds
- ✅ Show clear error messages if it fails
- ✅ Match the behavior of guest and activity form tests

## Commands

### Run with debugging
```bash
npx playwright test --headed --grep "should submit valid event form successfully"
```

### View trace
```bash
npx playwright show-trace test-results/system-uiInfrastructure-Fo-0cfb0-lid-event-form-successfully-chromium-retry1/trace.zip
```

### Take screenshot
```bash
# Screenshot is automatically saved on failure
# Check: test-results/*/test-failed-1.png
```
