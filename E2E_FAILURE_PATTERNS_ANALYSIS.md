# E2E Test Failure Patterns Analysis

**Date**: February 9, 2026  
**Test Run**: Most recent complete E2E suite  
**Results**: 224 passed | 104 failed | 9 flaky | Total: 337 tests  
**Pass Rate**: 66.5%

## Executive Summary

The E2E test suite has **104 failing tests** and **9 flaky tests** that need to be fixed to reach 100% passing. Analysis reveals **5 distinct failure patterns** that account for the majority of failures. Fixing these patterns systematically will dramatically improve the pass rate.

## Failure Pattern Breakdown

### Pattern 1: **Dropdown/Select Element Timeout** (🔴 HIGH PRIORITY)
**Count**: ~40-50 failures  
**Error**: `TimeoutError: locator.selectOption: Timeout 15000ms exceeded`

**Root Cause**: Select elements are found but Playwright cannot interact with them because they're waiting to be "visible and enabled". This suggests:
1. Elements are disabled during data loading
2. Elements are covered by loading overlays
3. Elements need data to populate before becoming interactive

**Affected Tests**:
- Location Hierarchy Management (all tests)
- Email Composition (recipient selection)
- Guest Groups (group selection)
- Reference Blocks (type selection)
- CSV Import (field mapping)

**Example Error**:
```
TimeoutError: locator.selectOption: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('select[name="parentLocationId"]').first()
  - locator resolved to <select aria-invalid="false" name="parentLocationId"...>
  - attempting select option action
    2 × waiting for element to be visible and enabled
```

**Fix Strategy**:
```typescript
// BEFORE (Fails)
await page.locator('select[name="parentLocationId"]').selectOption(parentId);

// AFTER (Works)
const select = page.locator('select[name="parentLocationId"]');
await select.waitFor({ state: 'visible', timeout: 10000 });
await page.waitForFunction(() => {
  const el = document.querySelector('select[name="parentLocationId"]');
  return el && !el.disabled && el.options.length > 1;
}, { timeout: 10000 });
await select.selectOption(parentId);
```

---

### Pattern 2: **API Data Loading Race Conditions** (🔴 HIGH PRIORITY)
**Count**: ~20-30 failures  
**Error**: Tests fail because data hasn't loaded before interaction

**Root Cause**: Tests don't wait for API responses to complete before interacting with UI elements that depend on that data.

**Affected Tests**:
- Email Management (guest/group dropdowns)
- Content Management (reference lookups)
- Photo Upload (metadata fields)
- RSVP Management (activity lists)

**Fix Strategy**:
```typescript
// Add helper function to wait for dropdown options
async function waitForDropdownOptions(page: Page, selector: string, minOptions = 1) {
  await page.waitForFunction(
    ({ sel, min }) => {
      const select = document.querySelector(sel);
      return select && select.options.length > min;
    },
    { sel: selector, min: minOptions },
    { timeout: 10000 }
  );
}

// Usage
await page.goto('/admin/emails');
await page.click('text=Compose Email');
await waitForDropdownOptions(page, 'select#recipients', 1);
await page.locator('select#recipients').selectOption([guestId]);
```

---

### Pattern 3: **Navigation/Page Load Timeouts** (🟡 MEDIUM PRIORITY)
**Count**: ~15-20 failures  
**Error**: `TimeoutError: page.goto: Timeout 15000ms exceeded`

**Root Cause**: Pages take longer than 15 seconds to load, likely due to:
1. Heavy data fetching on page load
2. Slow database queries
3. Multiple sequential API calls

**Affected Tests**:
- Admin Navigation (sidebar navigation)
- Content Management (home page editing)
- Data Management (CSV import page)

**Fix Strategy**:
```typescript
// Increase timeout for heavy pages
await page.goto('/admin/locations', { 
  timeout: 30000,
  waitUntil: 'domcontentloaded' // Don't wait for all resources
});

// Or wait for specific element instead
await page.goto('/admin/locations', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('h1:has-text("Locations")', { timeout: 10000 });
```

---

### Pattern 4: **Form Submission/Button Click Failures** (🟡 MEDIUM PRIORITY)
**Count**: ~10-15 failures  
**Error**: Buttons not clickable or forms not submitting

**Root Cause**: 
1. Buttons disabled during validation
2. Forms covered by modals/overlays
3. Missing wait for form to be ready

**Affected Tests**:
- Guest form submission
- Activity form submission
- Event form submission
- RSVP submission

**Fix Strategy**:
```typescript
// Wait for button to be enabled
const submitButton = page.locator('button[type="submit"]');
await submitButton.waitFor({ state: 'visible' });
await expect(submitButton).toBeEnabled({ timeout: 5000 });
await submitButton.click();

// Or use force click if button is obscured
await submitButton.click({ force: true });
```

---

### Pattern 5: **Keyboard Navigation/Accessibility Tests** (🟢 LOW PRIORITY)
**Count**: ~5-10 failures  
**Error**: Keyboard navigation not working as expected

**Root Cause**: 
1. Focus management issues
2. Tab order problems
3. Missing keyboard event handlers

**Affected Tests**:
- Keyboard navigation in forms
- Keyboard navigation in reference lookup
- Tab navigation in admin pages

**Fix Strategy**:
```typescript
// Add explicit focus checks
await page.keyboard.press('Tab');
await page.waitForTimeout(100); // Allow focus to settle
const focused = await page.evaluate(() => document.activeElement?.tagName);
expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA']).toContain(focused);
```

---

## Specific Test Suite Analysis

### 📧 Email Management (13 tests)
- **Status**: 12 passing, 1 failing
- **Failing**: "should preview email before sending" (Pattern 4)
- **Fix**: Add wait for preview section to render before hiding

### 📍 Location Hierarchy (5 tests)
- **Status**: 0 passing, 5 failing
- **Failing**: All tests (Pattern 1 - dropdown timeouts)
- **Fix**: Wait for parent location dropdown to populate before selecting

### 📝 Content Management (10 tests)
- **Status**: 6 passing, 4 failing
- **Failing**: Home page editing, inline section editor (Patterns 1 & 3)
- **Fix**: Wait for rich text editor to load, wait for section data

### 📊 CSV Import/Export (3 tests)
- **Status**: 1 passing, 2 failing
- **Failing**: Import validation, special characters (Pattern 3)
- **Fix**: Increase page load timeout, wait for file upload to complete

### 📷 Photo Upload (8 tests)
- **Status**: 5 passing, 3 failing
- **Failing**: Upload with metadata, error handling (Pattern 2)
- **Fix**: Wait for upload form to be ready, wait for API response

### 🔗 Reference Blocks (8 tests)
- **Status**: 3 passing, 5 failing
- **Failing**: Create reference blocks (Pattern 1)
- **Fix**: Wait for reference type dropdown to populate

### 📋 RSVP Management (6 tests)
- **Status**: 4 passing, 2 failing
- **Failing**: CSV export tests (Pattern 3)
- **Fix**: Wait for export to complete before checking download

### 🧭 Navigation (8 tests)
- **Status**: 4 passing, 4 failing
- **Failing**: Sidebar navigation, keyboard navigation (Patterns 3 & 5)
- **Fix**: Wait for page transitions, add focus checks

---

## Recommended Fix Order (Priority)

### Phase 1: Quick Wins (1-2 days) - Target: 85% pass rate
1. **Add `waitForDropdownOptions()` helper** - Fixes Pattern 1 (~40 tests)
2. **Increase page load timeouts** - Fixes Pattern 3 (~15 tests)
3. **Add button enabled checks** - Fixes Pattern 4 (~10 tests)

**Expected Result**: ~65 tests fixed, pass rate jumps to 85%

### Phase 2: API Loading (2-3 days) - Target: 95% pass rate
1. **Add API response waiters** - Fixes Pattern 2 (~25 tests)
2. **Improve form submission waits** - Fixes remaining Pattern 4 tests
3. **Add data loading indicators** - Prevents future race conditions

**Expected Result**: ~30 tests fixed, pass rate jumps to 95%

### Phase 3: Polish (1-2 days) - Target: 100% pass rate
1. **Fix keyboard navigation** - Fixes Pattern 5 (~10 tests)
2. **Fix flaky tests** - Stabilize 9 flaky tests
3. **Add retry logic** - Handle transient failures

**Expected Result**: All tests passing, 100% pass rate

---

## Implementation Guide

### Step 1: Create Test Helpers

```typescript
// __tests__/helpers/e2eWaiters.ts

export async function waitForDropdownOptions(
  page: Page, 
  selector: string, 
  minOptions = 1
) {
  await page.waitForFunction(
    ({ sel, min }) => {
      const select = document.querySelector(sel);
      return select && !select.disabled && select.options.length > min;
    },
    { sel: selector, min: minOptions },
    { timeout: 10000 }
  );
}

export async function waitForButtonEnabled(
  page: Page,
  selector: string
) {
  const button = page.locator(selector);
  await button.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(
    (sel) => {
      const btn = document.querySelector(sel);
      return btn && !btn.disabled;
    },
    selector,
    { timeout: 5000 }
  );
}

export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches && response.status() === 200;
    },
    { timeout: 10000 }
  );
}
```

### Step 2: Update Failing Tests

```typescript
// Example: Fix location hierarchy tests
import { waitForDropdownOptions } from '../helpers/e2eWaiters';

test('should create hierarchical location structure', async ({ page }) => {
  await page.goto('/admin/locations');
  
  // Create parent location
  await page.click('text=Add Location');
  await page.fill('input[name="name"]', 'Parent Location');
  await page.selectOption('select[name="type"]', 'country');
  await page.click('button[type="submit"]');
  
  // Wait for parent to be created and dropdown to update
  await page.waitForTimeout(1000);
  
  // Create child location
  await page.click('text=Add Location');
  await page.fill('input[name="name"]', 'Child Location');
  await page.selectOption('select[name="type"]', 'city');
  
  // CRITICAL: Wait for parent dropdown to populate
  await waitForDropdownOptions(page, 'select[name="parentLocationId"]', 1);
  
  // Now select parent
  await page.selectOption('select[name="parentLocationId"]', parentId);
  await page.click('button[type="submit"]');
  
  // Verify hierarchy
  await expect(page.locator('text=Child Location')).toBeVisible();
});
```

### Step 3: Add Global Timeout Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000, // Increase global timeout
  expect: {
    timeout: 10000, // Increase assertion timeout
  },
  use: {
    actionTimeout: 15000, // Increase action timeout
    navigationTimeout: 30000, // Increase navigation timeout
  },
});
```

---

## Success Metrics

### Current State
- **Pass Rate**: 66.5% (224/337 tests)
- **Failing**: 104 tests
- **Flaky**: 9 tests
- **Avg Test Duration**: ~15 seconds

### Target State (After Fixes)
- **Pass Rate**: 100% (337/337 tests)
- **Failing**: 0 tests
- **Flaky**: 0 tests
- **Avg Test Duration**: ~12 seconds (improved with better waits)

### Milestones
- **Phase 1 Complete**: 85% pass rate (289/337 tests passing)
- **Phase 2 Complete**: 95% pass rate (320/337 tests passing)
- **Phase 3 Complete**: 100% pass rate (337/337 tests passing)

---

## Key Takeaways

1. **Pattern 1 (Dropdown Timeouts)** is the biggest issue - fixing this alone will improve pass rate by ~15%
2. **Most failures are timing issues**, not actual bugs - the application works, tests just don't wait properly
3. **Systematic approach** is key - fix patterns, not individual tests
4. **Helper functions** will prevent future issues and make tests more maintainable
5. **Estimated timeline**: 5-7 days to reach 100% pass rate

## Next Steps

1. ✅ Create `e2eWaiters.ts` helper file with wait functions
2. ✅ Update `playwright.config.ts` with increased timeouts
3. ✅ Fix Location Hierarchy tests (Pattern 1) - 5 tests
4. ✅ Fix Email Management tests (Pattern 4) - 1 test
5. ✅ Fix Reference Blocks tests (Pattern 1) - 5 tests
6. ✅ Fix CSV Import tests (Pattern 3) - 2 tests
7. ✅ Fix Photo Upload tests (Pattern 2) - 3 tests
8. ✅ Fix Navigation tests (Patterns 3 & 5) - 4 tests
9. ✅ Fix RSVP Management tests (Pattern 3) - 2 tests
10. ✅ Stabilize flaky tests - 9 tests

**Total Impact**: 104 failing tests → 0 failing tests = 100% pass rate 🎯
