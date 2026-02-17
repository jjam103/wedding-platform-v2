# E2E Form Submission Fix Plan

**Date**: February 10, 2026  
**Status**: In Progress  
**Issue**: Form submission tests are failing/flaky

---

## Problem Analysis

### Current Test Results

**Failing Tests** (2):
1. `should submit valid guest form successfully` - Flaky (passes on retry)
2. `should clear form after successful submission` - Not yet tested

**Flaky Tests** (4):
1. `should show validation errors for missing required fields` - Timing issues
2. `should validate email format` - Timing issues
3. `should submit valid event form successfully` - Timing issues
4. `should submit valid activity form successfully` - Timing issues

### Root Cause

The test is failing because:

1. **Form Opening Timing**: The test clicks `text=Add New Guest` which opens the collapsible section, but there's a delay before the `CollapsibleForm` component renders
2. **Submit Button Selector**: The test waits for `[data-testid="form-submit-button"]` with only 5 seconds timeout
3. **React State Updates**: The form needs time for React state to update and render the form fields

### Code Structure

```typescript
// In app/admin/guests/page.tsx
<button onClick={() => setIsFormOpen(!isFormOpen)}>
  <h2>Add New Guest</h2>
</button>

{isFormOpen && (
  <div>
    <CollapsibleForm
      isOpen={true}
      // ... form props
    />
  </div>
)}
```

The `CollapsibleForm` component has the submit button with `data-testid="form-submit-button"`.

---

## Solution

### Fix 1: Increase Wait Timeout

Change the timeout from 5 seconds to 10 seconds to account for React rendering:

```typescript
await page.waitForSelector('[data-testid="form-submit-button"]', { 
  state: 'visible', 
  timeout: 10000  // Increased from 5000
});
```

### Fix 2: Add Explicit Wait After Opening Form

Add a wait after clicking "Add New Guest" to ensure the form has time to render:

```typescript
await page.click('text=Add New Guest');
await page.waitForTimeout(1000);  // Wait for form to render
await page.waitForSelector('[data-testid="form-submit-button"]', { 
  state: 'visible', 
  timeout: 10000 
});
```

### Fix 3: Use Better Selector for Opening Form

Instead of clicking on text, click on the button element directly:

```typescript
// Find the button that contains "Add New Guest"
const addButton = page.locator('button:has-text("Add New Guest")');
await addButton.click();
await page.waitForTimeout(500);
```

### Fix 4: Wait for Form to Be Fully Loaded

Wait for multiple form elements to ensure the form is fully rendered:

```typescript
await page.click('text=Add New Guest');

// Wait for form to be fully loaded
await Promise.all([
  page.waitForSelector('input[name="firstName"]', { state: 'visible', timeout: 10000 }),
  page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 })
]);
```

---

## Implementation Plan

### Step 1: Fix Guest Form Test

Update `__tests__/e2e/system/uiInfrastructure.spec.ts`:

```typescript
test('should submit valid guest form successfully', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Click Add New Guest button - use better selector
  const addButton = page.locator('button:has-text("Add New Guest")');
  await addButton.click();
  
  // Wait for form to be fully loaded
  await Promise.all([
    page.waitForSelector('input[name="firstName"]', { state: 'visible', timeout: 10000 }),
    page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 })
  ]);
  
  // Fill in required fields
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.fill('input[name="email"]', `john.doe.${Date.now()}@example.com`);
  
  // Select group (required field)
  const groupSelect = page.locator('select[name="groupId"]');
  const hasGroupSelect = await groupSelect.isVisible().catch(() => false);
  
  if (hasGroupSelect) {
    const options = await groupSelect.locator('option').count();
    if (options > 1) {
      const firstOptionValue = await groupSelect.locator('option').nth(1).getAttribute('value');
      if (firstOptionValue) {
        await groupSelect.selectOption(firstOptionValue);
      }
    }
  }
  
  // Select age type (required field)
  await page.selectOption('select[name="ageType"]', 'adult');
  
  // Select guest type (required field)
  await page.selectOption('select[name="guestType"]', 'wedding_guest');
  
  // Wait for React state to update
  await page.waitForTimeout(500);
  
  // Submit the form and wait for API response
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/admin/guests') && resp.status() === 201,
    { timeout: 10000 }
  );
  
  await page.click('[data-testid="form-submit-button"]');
  
  // Wait for response
  await responsePromise;
  
  // Wait for success toast with longer timeout
  await expect(page.locator('[data-testid="toast-success"]')).toContainText('Guest created successfully', { timeout: 10000 });
});
```

### Step 2: Fix Event Form Test

Similar changes for event form test:

```typescript
test('should submit valid event form successfully', async ({ page }) => {
  await page.goto('/admin/events');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Click the "+ Add Event" button using data-testid
  await page.click('[data-testid="add-event-button"]');
  
  // Wait for form to be fully loaded
  await Promise.all([
    page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 }),
    page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 })
  ]);
  
  // ... rest of test
});
```

### Step 3: Fix Activity Form Test

Similar changes for activity form test:

```typescript
test('should submit valid activity form successfully', async ({ page }) => {
  await page.goto('/admin/activities');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Ensure the form is open by clicking the toggle if needed
  const formToggle = page.locator('[data-testid="collapsible-form-toggle"]');
  const isExpanded = await formToggle.getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await formToggle.click();
    await page.waitForTimeout(500); // Wait for expansion animation
  }
  
  // Wait for form to be fully loaded
  await Promise.all([
    page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 }),
    page.waitForSelector('[data-testid="form-submit-button"]', { state: 'visible', timeout: 10000 })
  ]);
  
  // ... rest of test
});
```

### Step 4: Fix Validation Tests

For validation tests, use similar approach but don't expect success:

```typescript
test('should show validation errors for missing required fields', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.waitForLoadState('networkidle');
  
  const addButton = page.locator('button:has-text("Add New Guest")');
  await addButton.click();
  
  // Wait for form to be visible
  await page.waitForSelector('button[type="submit"]:has-text("Create")', { 
    state: 'visible',
    timeout: 10000 
  });
  
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait a moment for validation
  await page.waitForTimeout(1000);
  
  // Form should still be open (HTML5 validation prevents submission)
  await expect(page.locator('button[type="submit"]:has-text("Create")')).toBeVisible();
  
  // No success toast should appear
  const successToast = await page.locator('[data-testid="toast-success"]').isVisible().catch(() => false);
  expect(successToast).toBe(false);
});
```

---

## Testing Strategy

### Test Each Fix Individually

1. **Test Guest Form**:
   ```bash
   npx playwright test system/uiInfrastructure.spec.ts --grep "submit valid guest form" --headed
   ```

2. **Test Event Form**:
   ```bash
   npx playwright test system/uiInfrastructure.spec.ts --grep "submit valid event form" --headed
   ```

3. **Test Activity Form**:
   ```bash
   npx playwright test system/uiInfrastructure.spec.ts --grep "submit valid activity form" --headed
   ```

4. **Test Validation**:
   ```bash
   npx playwright test system/uiInfrastructure.spec.ts --grep "validation" --headed
   ```

### Run Full Suite

After individual tests pass:

```bash
npx playwright test system/uiInfrastructure.spec.ts --reporter=list
```

---

## Expected Results

After fixes:
- ✅ Guest form submission: 100% pass rate (currently flaky)
- ✅ Event form submission: 100% pass rate (currently flaky)
- ✅ Activity form submission: 100% pass rate (currently flaky)
- ✅ Validation tests: 100% pass rate (currently flaky)
- ✅ Form clear test: 100% pass rate (not yet tested)

**Total Impact**: +6 tests (2 failing + 4 flaky → all passing)

---

## Next Steps

1. Apply fixes to `__tests__/e2e/system/uiInfrastructure.spec.ts`
2. Test each form individually
3. Run full UI infrastructure suite
4. Verify no regressions
5. Document results
6. Proceed with Task 2 (Admin Page Load Issues)

---

## Success Criteria

- [ ] All form submission tests passing
- [ ] No flaky tests
- [ ] Tests run reliably (3 consecutive passes)
- [ ] No new failures introduced
- [ ] Documentation updated

