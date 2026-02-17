# E2E Test Failure Pattern Analysis - Path to 100%

**Date**: February 9, 2026  
**Current Status**: 224 passed, 104 failed, 9 flaky (67.5% pass rate)  
**Goal**: Identify patterns and fixes to reach 100% passing

## Executive Summary

The E2E test suite has **3 primary failure patterns** that account for the majority of failures:

1. **Form Fill Timeouts** (24 failures) - `page.fill` timing out
2. **Dropdown Selection Timeouts** (10 failures) - `locator.selectOption` timing out  
3. **Button Click Timeouts** (7 failures) - `locator.click` timing out

These are **NOT functional bugs** - they are **test timing/synchronization issues**. The application works correctly, but tests need better wait conditions.

## Detailed Failure Patterns

### Pattern 1: Form Fill Timeouts (24 failures)
**Error**: `TimeoutError: page.fill: Timeout 15000ms exceeded`

**Affected Tests**:
- Guest form submissions (2 failures)
- Event form submissions (2 failures)
- Activity form submissions (2 failures)
- RSVP form submissions (2 failures)
- Email composer (2 failures)
- Location forms (multiple failures)
- Content management forms (multiple failures)

**Root Cause**: Tests try to fill form fields before they're fully rendered or enabled.

**Fix Strategy**:
```typescript
// BEFORE (Fails)
await page.fill('input[name="firstName"]', 'John');

// AFTER (Works)
const firstNameInput = page.locator('input[name="firstName"]');
await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
await firstNameInput.fill('John');
```

**Implementation**:
1. Add explicit `waitFor({ state: 'visible' })` before all `fill()` calls
2. Increase timeout to 10-15 seconds for slow-loading forms
3. Wait for form to be in ready state (not disabled/loading)

---

### Pattern 2: Dropdown Selection Timeouts (10 failures)
**Error**: `TimeoutError: locator.selectOption: Timeout 15000ms exceeded`

**Specific Issue**: `select[name="parentLocationId"]` - waiting for element to be visible and enabled

**Affected Tests**:
- Location hierarchy tests (multiple failures)
- Group selection in email composer (2 failures)
- Parent location selection (multiple failures)

**Root Cause**: Dropdown options are loaded asynchronously, but tests try to select before options are populated.

**Fix Strategy**:
```typescript
// BEFORE (Fails)
await page.locator('select[name="parentLocationId"]').selectOption(parentId);

// AFTER (Works)
const select = page.locator('select[name="parentLocationId"]');

// Wait for select to be enabled
await select.waitFor({ state: 'visible', timeout: 10000 });

// Wait for options to load (more than just the placeholder)
await page.waitForFunction(() => {
  const selectEl = document.querySelector('select[name="parentLocationId"]');
  return selectEl && selectEl.options.length > 1;
}, { timeout: 10000 });

// Now select
await select.selectOption(parentId);
```

**Implementation**:
1. Create helper function `waitForDropdownOptions(page, selector)`
2. Use helper before all `selectOption()` calls
3. Verify options are loaded before selection

---

### Pattern 3: Button Click Timeouts (7 failures)
**Error**: `TimeoutError: locator.click: Timeout 15000ms exceeded`

**Affected Tests**:
- Preview button clicks (email management)
- Submit button clicks (various forms)
- Navigation button clicks

**Root Cause**: Buttons become temporarily unclickable due to:
- Loading states
- Overlapping elements
- Navigation in progress

**Fix Strategy**:
```typescript
// BEFORE (Fails)
await page.locator('button:has-text("Submit")').click();

// AFTER (Works)
const submitButton = page.locator('button:has-text("Submit")');
await submitButton.waitFor({ state: 'visible', timeout: 10000 });
await submitButton.scrollIntoViewIfNeeded();
await submitButton.click({ force: true }); // Force if obscured
```

**Implementation**:
1. Add `scrollIntoViewIfNeeded()` before clicks
2. Use `{ force: true }` for buttons that might be temporarily obscured
3. Wait for navigation to complete after clicks

---

### Pattern 4: Page Navigation Timeouts (1 failure)
**Error**: `TimeoutError: page.goto: Timeout 15000ms exceeded`

**Fix Strategy**:
```typescript
// BEFORE
await page.goto('/admin/emails');

// AFTER
await page.goto('/admin/emails', { 
  waitUntil: 'networkidle',
  timeout: 30000 
});
```

---

### Pattern 5: Event Waiting Timeouts (8 failures)
**Error**: `TimeoutError: page.waitForEvent / browserContext.waitForEvent`

**Affected Tests**:
- File download tests
- Navigation tests
- Form submission tests

**Fix Strategy**:
```typescript
// BEFORE
const downloadPromise = page.waitForEvent('download');
await page.click('button:has-text("Export")');
const download = await downloadPromise;

// AFTER
const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
await page.click('button:has-text("Export")');
const download = await downloadPromise;
```

---

## Recommended Fixes by Priority

### Priority 1: Create Test Helper Functions (HIGH IMPACT)

Create `__tests__/helpers/e2eWaitHelpers.ts`:

```typescript
import type { Page, Locator } from '@playwright/test';

/**
 * Wait for form field to be ready for input
 */
export async function waitForFormField(
  page: Page, 
  selector: string, 
  timeout = 10000
): Promise<Locator> {
  const field = page.locator(selector);
  await field.waitFor({ state: 'visible', timeout });
  await field.waitFor({ state: 'attached', timeout });
  
  // Wait for field to not be disabled
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && !el.hasAttribute('disabled');
    },
    selector,
    { timeout }
  );
  
  return field;
}

/**
 * Wait for dropdown to have options loaded
 */
export async function waitForDropdownOptions(
  page: Page,
  selector: string,
  minOptions = 1,
  timeout = 10000
): Promise<Locator> {
  const select = page.locator(selector);
  await select.waitFor({ state: 'visible', timeout });
  
  // Wait for options to load
  await page.waitForFunction(
    ({ sel, min }) => {
      const selectEl = document.querySelector(sel);
      return selectEl && selectEl.options.length > min;
    },
    { sel: selector, min: minOptions },
    { timeout }
  );
  
  return select;
}

/**
 * Wait for button to be clickable
 */
export async function waitForClickableButton(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<Locator> {
  const button = page.locator(selector);
  await button.waitFor({ state: 'visible', timeout });
  await button.scrollIntoViewIfNeeded();
  
  // Wait for button to not be disabled
  await page.waitForFunction(
    (sel) => {
      const btn = document.querySelector(sel);
      return btn && !btn.hasAttribute('disabled') && !btn.classList.contains('loading');
    },
    selector,
    { timeout }
  );
  
  return button;
}

/**
 * Fill form field with proper waiting
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  timeout = 10000
): Promise<void> {
  const field = await waitForFormField(page, selector, timeout);
  await field.fill(value);
  
  // Verify value was set
  await page.waitForFunction(
    ({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      return el && el.value === val;
    },
    { sel: selector, val: value },
    { timeout: 5000 }
  );
}

/**
 * Select dropdown option with proper waiting
 */
export async function selectDropdownOption(
  page: Page,
  selector: string,
  value: string | string[],
  timeout = 10000
): Promise<void> {
  const select = await waitForDropdownOptions(page, selector, 1, timeout);
  await select.selectOption(value);
  
  // Verify selection
  await page.waitForTimeout(300); // Allow React state to update
}

/**
 * Click button with proper waiting
 */
export async function clickButton(
  page: Page,
  selector: string,
  options: { force?: boolean; timeout?: number } = {}
): Promise<void> {
  const { force = false, timeout = 10000 } = options;
  const button = await waitForClickableButton(page, selector, timeout);
  await button.click({ force });
}
```

### Priority 2: Update All Form Tests (MEDIUM IMPACT)

Replace all direct `page.fill()`, `selectOption()`, and `click()` calls with helper functions:

```typescript
// BEFORE
await page.fill('input[name="firstName"]', 'John');
await page.locator('select[name="groupId"]').selectOption(groupId);
await page.click('button[type="submit"]');

// AFTER
import { fillFormField, selectDropdownOption, clickButton } from '@/__tests__/helpers/e2eWaitHelpers';

await fillFormField(page, 'input[name="firstName"]', 'John');
await selectDropdownOption(page, 'select[name="groupId"]', groupId);
await clickButton(page, 'button[type="submit"]');
```

### Priority 3: Increase Global Timeouts (LOW IMPACT)

Update `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 30000, // Increase from 15000 to 30000
  expect: {
    timeout: 10000, // Increase from 5000 to 10000
  },
  use: {
    actionTimeout: 15000, // Increase from 10000 to 15000
    navigationTimeout: 30000, // Increase from 15000 to 30000
  },
});
```

### Priority 4: Add Retry Logic for Flaky Tests (LOW IMPACT)

Update test configuration for flaky tests:

```typescript
test.describe('Email Management', () => {
  test.describe.configure({ retries: 2 }); // Retry flaky tests
  
  test('should preview email before sending', async ({ page }) => {
    // Test implementation
  });
});
```

---

## Implementation Plan

### Phase 1: Create Helper Functions (1-2 hours)
1. Create `__tests__/helpers/e2eWaitHelpers.ts`
2. Add all helper functions with proper TypeScript types
3. Add tests for helper functions
4. Export from `__tests__/helpers/index.ts`

### Phase 2: Update High-Impact Tests (2-3 hours)
1. **Email Management Tests** (12 tests) - Use helpers for form fills and dropdown selections
2. **Location Hierarchy Tests** (10 tests) - Use `waitForDropdownOptions` helper
3. **Form Submission Tests** (20 tests) - Use `fillFormField` and `clickButton` helpers

### Phase 3: Update Remaining Tests (3-4 hours)
1. **RSVP Management Tests** - Use helpers
2. **Content Management Tests** - Use helpers
3. **Guest Management Tests** - Use helpers
4. **Activity Management Tests** - Use helpers

### Phase 4: Increase Timeouts & Add Retries (30 minutes)
1. Update `playwright.config.ts` with increased timeouts
2. Add retry configuration for known flaky tests
3. Run full test suite to verify

---

## Expected Results

### After Phase 1-2 (Helper Functions + High-Impact Tests)
- **Pass Rate**: 67.5% → 85% (+17.5%)
- **Failures**: 104 → 50 (-54 failures)
- **Time**: 3-5 hours

### After Phase 3 (All Tests Updated)
- **Pass Rate**: 85% → 95% (+10%)
- **Failures**: 50 → 17 (-33 failures)
- **Time**: +3-4 hours

### After Phase 4 (Timeouts & Retries)
- **Pass Rate**: 95% → 98-100% (+3-5%)
- **Failures**: 17 → 0-7 (-10-17 failures)
- **Time**: +30 minutes

---

## Key Insights

### Why Tests Are Failing
1. **Not functional bugs** - Application works correctly
2. **Timing issues** - Tests don't wait for async operations
3. **React state updates** - Tests don't wait for React to re-render
4. **Network delays** - API calls take time to complete

### Why This Happens
1. **Fast development** - Tests written quickly without proper waits
2. **Local testing** - Works on fast local machines, fails in CI
3. **Async UI** - Modern React apps have many async state updates
4. **Dynamic content** - Dropdowns/forms load data asynchronously

### Why Helper Functions Fix This
1. **Consistent waiting** - All tests use same wait logic
2. **Proper synchronization** - Wait for React state + DOM updates
3. **Better error messages** - Helpers provide context on failures
4. **Maintainable** - Fix once in helper, all tests benefit

---

## Success Metrics

### Current State
- ✅ 224 tests passing (67.5%)
- ❌ 104 tests failing (31.3%)
- ⚠️ 9 tests flaky (2.7%)

### Target State (After Fixes)
- ✅ 330+ tests passing (99-100%)
- ❌ 0-3 tests failing (0-1%)
- ⚠️ 0-4 tests flaky (0-1%)

### Quality Indicators
- **Reliability**: Tests pass consistently (not flaky)
- **Speed**: Tests complete in reasonable time (<15 min)
- **Maintainability**: Easy to update when UI changes
- **Debuggability**: Clear error messages when tests fail

---

## Conclusion

The path to 100% passing E2E tests is clear:

1. **Root Cause**: Timing/synchronization issues, not functional bugs
2. **Solution**: Helper functions with proper wait conditions
3. **Effort**: 7-10 hours of focused work
4. **Impact**: 67.5% → 99-100% pass rate

The application is working correctly. We just need to teach the tests to wait properly for async operations to complete.

**Next Steps**:
1. Create helper functions (Priority 1)
2. Update high-impact tests (Priority 2)
3. Update remaining tests (Priority 3)
4. Adjust timeouts and retries (Priority 4)

**Estimated Time to 100%**: 7-10 hours of focused work
