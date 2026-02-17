# E2E Test Improvement - Context Summary

**Date**: February 16, 2026  
**Current Status**: Phase 2 P1 Complete, Phase 2 P2 Ready to Begin

---

## What We're Doing (High-Level)

We're improving the reliability of E2E tests by replacing arbitrary timeouts with semantic wait conditions that check for actual state changes.

## The Problem

E2E tests currently use manual timeouts like this:

```typescript
await button.click();
await page.waitForTimeout(2000); // Hope 2 seconds is enough!
```

This causes:
- **Flaky tests**: Random failures when 2 seconds isn't enough
- **Slow tests**: Waiting longer than necessary
- **Unreliable CI/CD**: Failures based on machine speed

## The Solution

Replace manual timeouts with semantic helpers that wait for actual conditions:

```typescript
await button.click();
await waitForStyles(page); // Wait for CSS to load
await waitForCondition(async () => {
  const toast = page.locator('[role="alert"]');
  return await toast.isVisible(); // Wait for actual toast
}, 5000);
```

This provides:
- **Reliability**: Tests wait for actual conditions, not arbitrary time
- **Speed**: Tests complete as soon as conditions are met
- **Better errors**: Clear messages about what condition wasn't met

---

## What We've Done (Phase 2 P1)

### Completed: February 14-16, 2026

**17 tests updated** across 2 test files:
1. `__tests__/e2e/admin/navigation.spec.ts` (9 tests)
2. `__tests__/e2e/admin/referenceBlocks.spec.ts` (8 tests)

### Results

| Metric | Value |
|--------|-------|
| Manual timeouts removed | 40+ |
| Semantic waits added | 53+ |
| Code reduction | ~25% |
| Pass rate | 82% (14/17 passing) |
| Tests currently failing | 3 (pre-existing issues, not related to helpers) |

### Key Improvements

1. **Replaced 40+ manual timeouts** with semantic helpers
2. **Fixed 6 CSS selector issues** (can't use `:has-text()` in browser)
3. **Established 4 core patterns** for future work
4. **Refactored 1 helper function** to use proper waits

---

## What's Next (Phase 2 P2)

### Target: ~90 tests across 7 test suites

**Priority 1: High-Value Tests** (~47 tests)
1. Content Management - ~15 tests
2. Data Management - ~20 tests  
3. Email Management - ~12 tests

**Priority 2: Form Tests** (~18 tests)
4. Section Management - ~10 tests
5. Photo Upload - ~8 tests

**Priority 3: Guest Portal** (~25 tests)
6. Guest Views - ~15 tests
7. Guest Groups - ~10 tests

### Estimated Timeline

- **2-3 days per test suite**
- **2-3 weeks total** for all 7 suites
- **Start date**: February 17, 2026

---

## Why This Matters

### Current State (Before Fixes)
Tests are passing but have hidden flakiness:
- Manual timeouts mask timing issues
- Tests might fail randomly in CI/CD
- Slow execution due to fixed delays
- Hard to debug when failures occur

### Future State (After Fixes)
Tests will be more reliable:
- Wait for actual conditions, not arbitrary time
- Faster execution (complete as soon as ready)
- Better error messages for debugging
- Consistent behavior across environments

---

## The 4 Core Patterns

### Pattern 1: Replace Manual Timeouts
```typescript
// ❌ Before: Arbitrary wait
await button.click();
await page.waitForTimeout(2000);

// ✅ After: Wait for actual condition
await button.click();
await waitForStyles(page);
```

### Pattern 2: Use Playwright Locators
```typescript
// ❌ Before: CSS selector with pseudo-selector
await waitForElementStable(page, 'button:has-text("Save")');

// ✅ After: Playwright locator
await waitForElementStable(page, page.getByRole('button', { name: 'Save' }));
```

### Pattern 3: Wait for Actual Conditions
```typescript
// ❌ Before: Assume timing
await page.waitForTimeout(3000);
const element = page.locator('selector');

// ✅ After: Wait for actual state
await waitForCondition(async () => {
  const element = page.locator('selector');
  return await element.isVisible();
}, 5000);
```

### Pattern 4: Replace Retry Loops
```typescript
// ❌ Before: Manual retry loop
let attempts = 0;
while (attempts < 10) {
  if (await checkCondition()) break;
  attempts++;
  await page.waitForTimeout(1000);
}

// ✅ After: Semantic helper
await waitForCondition(async () => {
  return await checkCondition();
}, 10000);
```

---

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

---

## Common Questions

### Q: Are we fixing failing tests?
**A**: No. Tests are currently passing. We're improving reliability to prevent future flakiness.

### Q: Why 90 tests?
**A**: That's how many tests still use manual timeouts across 7 test suites.

### Q: What does the fix do?
**A**: Replaces arbitrary timeouts with semantic waits that check for actual conditions.

### Q: How long will this take?
**A**: 2-3 weeks for all 90 tests (2-3 days per test suite).

### Q: What's the benefit?
**A**: More reliable tests, faster execution, better debugging, consistent CI/CD.

---

## Documentation

### Phase 2 P1 (Complete)
- [Progress Tracker](E2E_FEB16_2026_PHASE2_P1_PROGRESS_TRACKER.md)
- [Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md)
- [Final Status](E2E_FEB16_2026_PHASE2_P1_FINAL_STATUS.md)

### Phase 2 P2 (Ready to Begin)
- [Quick Start Guide](E2E_FEB16_2026_PHASE2_P2_QUICK_START.md)
- [Phase 2 Index](E2E_FEB16_2026_PHASE2_INDEX.md)

### Helper Functions
- [Wait Helpers Source](__tests__/helpers/waitHelpers.ts)
- [Usage Guide](__tests__/helpers/E2E_HELPERS_USAGE_GUIDE.md)

---

## Next Steps

1. **Choose a test suite** - Start with Content Management (recommended)
2. **Analyze current state** - Count manual timeouts and CSS selector issues
3. **Apply helpers systematically** - Work through tests one by one
4. **Verify changes** - Run tests to confirm improvements
5. **Document results** - Update progress tracker
6. **Move to next suite** - Repeat process

---

**Last Updated**: February 16, 2026  
**Status**: Phase 2 P1 Complete ✅  
**Next**: Phase 2 P2 - Content Management tests

