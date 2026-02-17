# E2E Phase 2 P2 - Quick Start Guide

**Date**: February 16, 2026  
**Status**: Ready to Begin  
**Phase**: Race Condition Prevention - Remaining Test Suites

---

## Overview

Apply the race condition prevention helpers established in Phase 2 P1 to the remaining E2E test suites.

## Prerequisites

✅ Phase 2 P1 Complete - All UI infrastructure tests updated  
✅ Helper functions working correctly (27+ uses, 100% success)  
✅ Patterns established and documented

## Target Test Suites

### Priority 1: High-Value Tests
1. **Content Management** (`__tests__/e2e/admin/contentManagement.spec.ts`)
   - ~15 tests
   - Heavy use of manual timeouts
   - Complex async operations

2. **Data Management** (`__tests__/e2e/admin/dataManagement.spec.ts`)
   - ~20 tests
   - Form submissions and API calls
   - Tree view interactions

3. **Email Management** (`__tests__/e2e/admin/emailManagement.spec.ts`)
   - ~12 tests
   - API-heavy operations
   - Modal interactions

### Priority 2: Form Tests
4. **Section Management** (`__tests__/e2e/admin/sectionManagement.spec.ts`)
   - ~10 tests
   - Rich text editor interactions
   - Photo picker operations

5. **Photo Upload** (`__tests__/e2e/admin/photoUpload.spec.ts`)
   - ~8 tests
   - File upload operations
   - Preview rendering

### Priority 3: Guest Portal
6. **Guest Views** (`__tests__/e2e/guest/guestViews.spec.ts`)
   - ~15 tests
   - Content rendering
   - Reference block interactions

7. **Guest Groups** (`__tests__/e2e/guest/guestGroups.spec.ts`)
   - ~10 tests
   - Authentication flows
   - Group management

## Established Patterns (from Phase 2 P1)

### Pattern 1: Replace Manual Timeouts
```typescript
// ❌ Before:
await button.click();
await page.waitForTimeout(1000);

// ✅ After:
await button.click();
await waitForStyles(page);
```

### Pattern 2: Use Playwright Locators
```typescript
// ❌ Before:
await waitForElementStable(page, 'button:has-text("Save")');

// ✅ After:
await waitForElementStable(page, page.getByRole('button', { name: 'Save' }));
```

### Pattern 3: Wait for Actual Conditions
```typescript
// ❌ Before:
await page.waitForTimeout(3000);
const element = page.locator('selector');

// ✅ After:
await waitForCondition(async () => {
  const element = page.locator('selector');
  return await element.isVisible();
}, 5000);
```

### Pattern 4: Replace Retry Loops
```typescript
// ❌ Before:
let attempts = 0;
while (attempts < 10) {
  if (await checkCondition()) break;
  attempts++;
  await page.waitForTimeout(1000);
}

// ✅ After:
await waitForCondition(async () => {
  return await checkCondition();
}, 10000);
```

## Helper Functions Available

### Core Helpers
- `waitForStyles(page, timeout?)` - Wait for CSS to load
- `waitForCondition(condition, timeout?, interval?)` - Wait for custom condition
- `waitForElementStable(page, locator, timeout?)` - Wait for element visibility + stability

### Specialized Helpers
- `waitForModalClose(page, selector?, timeout?)` - Wait for modal to close
- `waitForNavigation(page, expectedUrl, timeout?)` - Wait for navigation
- `waitForApiResponse(page, urlPattern, timeout?)` - Wait for API call
- `waitForDataLoaded(page, dataTestId, timeout?)` - Wait for data loading
- `waitForToast(page, message?, timeout?)` - Wait for toast notification

## Step-by-Step Process

### 1. Choose a Test Suite
Start with Priority 1 (Content Management, Data Management, or Email Management)

### 2. Analyze Current State
```bash
# Count manual timeouts
grep -n "waitForTimeout" __tests__/e2e/admin/contentManagement.spec.ts

# Count CSS selectors with pseudo-selectors
grep -n ":has-text" __tests__/e2e/admin/contentManagement.spec.ts
```

### 3. Apply Helpers Systematically
Work through the file test by test:
1. Replace manual timeouts with `waitForStyles()` or `waitForCondition()`
2. Replace CSS selectors with Playwright locators
3. Replace retry loops with `waitForCondition()`
4. Test each change incrementally

### 4. Verify Changes
```bash
# Run the updated test suite
npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts

# Check for improvements
# - Reduced execution time
# - Fewer flaky failures
# - Better error messages
```

### 5. Document Results
Update progress tracker with:
- Number of tests updated
- Manual timeouts removed
- Helpers applied
- Pass rate before/after

## Common Scenarios

### Scenario 1: Form Submission
```typescript
// ❌ Before:
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForTimeout(2000);

// ✅ After:
await page.getByRole('button', { name: 'Submit' }).click();
await waitForStyles(page);
await waitForCondition(async () => {
  const toast = page.locator('[role="alert"]');
  return await toast.isVisible();
}, 5000);
```

### Scenario 2: Modal Interactions
```typescript
// ❌ Before:
await page.getByRole('button', { name: 'Open Modal' }).click();
await page.waitForTimeout(500);
const modal = page.locator('[role="dialog"]');

// ✅ After:
await page.getByRole('button', { name: 'Open Modal' }).click();
await waitForStyles(page);
const modal = page.locator('[role="dialog"]');
await waitForElementStable(page, modal);
```

### Scenario 3: API Calls
```typescript
// ❌ Before:
await page.getByRole('button', { name: 'Load Data' }).click();
await page.waitForTimeout(3000);

// ✅ After:
await page.getByRole('button', { name: 'Load Data' }).click();
await waitForApiResponse(page, '/api/data');
await waitForStyles(page);
```

### Scenario 4: Tree View Interactions
```typescript
// ❌ Before:
await page.locator('button[aria-label="Expand"]').click();
await page.waitForTimeout(1000);

// ✅ After:
const expandButton = page.locator('button[aria-label="Expand"]');
await waitForElementStable(page, expandButton);
await expandButton.click();
await waitForStyles(page);
await waitForCondition(async () => {
  const children = page.locator('[role="treeitem"][aria-level="2"]');
  return await children.count() > 0;
}, 5000);
```

## Success Metrics

Track these metrics for each test suite:

- **Tests Updated**: X/Y (Z%)
- **Manual Timeouts Removed**: N
- **Helpers Applied**: N
- **Pass Rate Before**: X%
- **Pass Rate After**: Y%
- **Code Reduction**: Z%

## Expected Results

Based on Phase 2 P1 results:
- ~25% code reduction
- 0 manual timeouts
- 80%+ pass rate
- Improved test reliability
- Better error messages

## Troubleshooting

### Issue: Test Still Flaky After Applying Helpers
**Solution**: Increase timeout values or add additional wait conditions

### Issue: Element Not Found
**Solution**: Verify selector is correct and element exists in DOM

### Issue: Timeout Errors
**Solution**: Check if condition is actually being met, add debug logging

## Next Steps

1. Choose Priority 1 test suite (Content Management recommended)
2. Create progress tracker for Phase 2 P2
3. Apply helpers systematically
4. Document results
5. Move to next test suite

## Resources

- **Phase 2 P1 Complete Summary**: `E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md`
- **Helper Functions**: `__tests__/helpers/waitHelpers.ts`
- **Pattern Examples**: See navigation.spec.ts and referenceBlocks.spec.ts

---

**Status**: Ready to Begin  
**Recommended Start**: Content Management tests  
**Estimated Time**: 2-3 days per test suite

**Last Updated**: February 16, 2026
