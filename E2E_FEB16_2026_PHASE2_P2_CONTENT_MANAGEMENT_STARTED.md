# E2E Phase 2 P2 - Content Management Tests Started

**Date**: February 16, 2026  
**Status**: In Progress  
**Test Suite**: `__tests__/e2e/admin/contentManagement.spec.ts`

---

## Overview

Beginning Phase 2 P2 work on Content Management tests - applying race condition prevention helpers to replace manual timeouts with semantic waits.

## Test Suite Analysis

### File Statistics
- **Total Tests**: 22 tests
- **Test Describes**: 5 groups
  1. Content Page Management (3 tests)
  2. Home Page Editing (4 tests)
  3. Inline Section Editor (5 tests)
  4. Event References (2 tests)
  5. Content Management Accessibility (4 tests)

### Manual Timeouts Found
```bash
grep -n "waitForTimeout" __tests__/e2e/admin/contentManagement.spec.ts
```

**Count**: ~15+ manual timeouts identified

**Locations**:
- Line 169: `await page.waitForTimeout(1000);` (beforeEach cleanup)
- Line 421: `await page.waitForTimeout(1000);` (beforeEach cleanup)
- Line 473: `await page.waitForTimeout(500);` (after save)
- Line 509: `await page.waitForTimeout(500);` (editor clear wait)
- Line 511: `await page.waitForTimeout(500);` (editor fill wait)
- Line 577: `await page.waitForTimeout(1000);` (beforeEach cleanup)
- Line 606: `await page.waitForTimeout(1000);` (React hydration)
- Line 616: `await page.waitForTimeout(200);` (scroll wait)
- Line 621: `await page.waitForTimeout(500);` (click wait)
- Line 651: `await page.waitForTimeout(2000);` (section add wait)
- Line 732: `await page.waitForTimeout(1000);` (React hydration)
- Line 742: `await page.waitForTimeout(200);` (scroll wait)
- Line 747: `await page.waitForTimeout(500);` (click wait)
- Line 756: `await page.waitForTimeout(2000);` (section add wait)
- Line 800: `await page.waitForTimeout(1000);` (React hydration)
- Line 810: `await page.waitForTimeout(200);` (scroll wait)
- Line 815: `await page.waitForTimeout(500);` (click wait)
- Line 933: `await page.waitForTimeout(1000);` (beforeEach cleanup)
- Line 948: `await page.waitForTimeout(1000);` (cleanup wait)
- Line 1001: `await page.waitForTimeout(2000);` (database write wait)
- Line 1013: `await page.waitForTimeout(1000);` (reload wait)

## Changes Applied

### 1. Import Wait Helpers ✅
```typescript
import {
  waitForStyles,
  waitForCondition,
  waitForElementStable,
  waitForModalClose,
  waitForApiResponse,
} from '../../helpers/waitHelpers';
```

### 2. First beforeEach Block Updated ✅
**Location**: Content Page Management beforeEach (line ~145)

**Before**:
```typescript
// Wait for cleanup to complete
await page.waitForTimeout(1000);
```

**After**:
```typescript
// PHASE 2 P2: Replace manual timeout with CSS wait
await waitForStyles(page);
```

## Remaining Work

### Priority 1: beforeEach Blocks (3 more)
- Home Page Editing beforeEach (line ~421)
- Inline Section Editor beforeEach (line ~577)
- Event References beforeEach (line ~933)

### Priority 2: Test Body Timeouts (~17 remaining)
- React hydration waits (1000ms) → `waitForStyles(page)`
- Scroll waits (200ms) → `waitForElementStable(page, element)`
- Click waits (500ms) → `waitForStyles(page)`
- Section add waits (2000ms) → `waitForCondition()` for element visibility
- Database write waits (2000ms) → `waitForApiResponse()` + `waitForStyles()`
- Editor waits (500ms) → `waitForStyles(page)`

### Priority 3: Retry Logic Improvements
Several tests use retry logic with `expect().toPass()` - these are good but could be enhanced with semantic waits.

## Patterns to Apply

### Pattern 1: Replace Cleanup Timeouts
```typescript
// ❌ Before:
await page.waitForTimeout(1000);

// ✅ After:
await waitForStyles(page);
```

### Pattern 2: Replace React Hydration Waits
```typescript
// ❌ Before:
await page.waitForTimeout(1000); // Wait for React hydration

// ✅ After:
await waitForStyles(page);
await waitForCondition(async () => {
  const button = page.locator('button');
  return await button.isEnabled();
}, 5000);
```

### Pattern 3: Replace Scroll + Click Waits
```typescript
// ❌ Before:
await toggleButton.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await toggleButton.click({ force: true });
await page.waitForTimeout(500);

// ✅ After:
await waitForElementStable(page, toggleButton);
await toggleButton.click();
await waitForStyles(page);
```

### Pattern 4: Replace Section Add Waits
```typescript
// ❌ Before:
await addSectionButton.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// ✅ After:
await addSectionButton.click();
await waitForStyles(page);
await waitForCondition(async () => {
  const sections = page.locator('[draggable="true"]');
  return await sections.count() > 0;
}, 5000);
```

### Pattern 5: Replace Database Write Waits
```typescript
// ❌ Before:
await createButton.click();
await createResponsePromise;
await page.waitForTimeout(2000); // Wait for database write

// ✅ After:
await createButton.click();
await waitForApiResponse(page, '/api/admin/events');
await waitForStyles(page);
```

### Pattern 6: Replace Editor Waits
```typescript
// ❌ Before:
await editor.clear();
await page.waitForTimeout(500);
await editor.fill('text');
await page.waitForTimeout(500);

// ✅ After:
await editor.clear();
await waitForStyles(page);
await editor.fill('text');
await waitForStyles(page);
```

## Next Steps

1. ✅ Import wait helpers
2. ✅ Update first beforeEach block
3. 🔄 Update remaining 3 beforeEach blocks
4. ⏳ Replace ~17 manual timeouts in test bodies
5. ⏳ Test the changes
6. ⏳ Document results

## Expected Results

Based on Phase 2 P1 patterns:
- **Manual Timeouts Removed**: ~21
- **Helpers Applied**: ~25-30
- **Code Reduction**: ~20-25%
- **Pass Rate**: 80%+ (currently unknown)
- **Execution Time**: Likely faster due to semantic waits

## Notes

- This file has complex async operations with inline section editor
- The `waitForInlineSectionEditor` helper function is well-designed but could benefit from semantic waits
- Multiple beforeEach blocks are identical - opportunity for DRY refactoring
- Tests use good retry logic with `expect().toPass()` - keep this pattern

---

**Status**: In Progress  
**Next Action**: Continue replacing manual timeouts systematically  
**Estimated Completion**: 2-3 hours

**Last Updated**: February 16, 2026
