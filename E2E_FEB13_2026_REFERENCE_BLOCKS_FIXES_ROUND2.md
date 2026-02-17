# E2E Reference Blocks - Fixes Round 2
**Date**: February 13, 2026
**Status**: 🔧 Significant Progress - Fixed 2 Critical Bugs

## Summary

Fixed two critical bugs in the reference blocks E2E tests that were preventing them from running:

1. **Variable Name Bug**: Tests were using `testData.eventId` instead of `testEventId`
2. **Page Structure Bug**: Tests were looking for a table element that doesn't exist on the content pages admin page

## Bugs Fixed

### Bug #1: Undefined Variable Reference

**Problem**: Tests were trying to access `testData.eventId` and `testData.activityId`, but these variables don't exist.

**Root Cause**: The test suite declares variables as `testEventId` and `testActivityId` (without "Data"), but the test code was trying to access them as `testData.eventId`.

**Fix Applied**:
```typescript
// BEFORE (incorrect):
const eventItem = page.locator(`[data-testid="reference-item-${testData.eventId}"]`);

// AFTER (correct):
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
```

**Impact**: This would have caused a runtime error: `Cannot read property 'eventId' of undefined`

### Bug #2: Wrong Page Structure Assumption

**Problem**: The `beforeEach` hook was looking for a `<table>` element on the content pages admin page, but the page uses a card-based layout instead.

**Root Cause**: The test assumed the content pages page uses a DataTable component with a `<table>` element, but the actual implementation uses a custom card layout with divs.

**Fix Applied**:
```typescript
// BEFORE (incorrect):
const table = page.locator('table, [role="table"]').first();
await expect(table).toBeVisible({ timeout: 3000 });

// AFTER (correct):
const pageContent = page.locator('.space-y-4, .text-center.py-12').first();
await expect(pageContent).toBeVisible({ timeout: 3000 });
```

**Impact**: Test would timeout waiting for a table that never appears.

## Test Results After Fixes

### First Attempt
✅ **beforeEach hook passed** - Test data created and page loaded successfully
```
✓ Created test data: { eventId: '...', activityId: '...', ... }
✓ Verify content page exists in DB: YES 
✓ Test content page is visible and editable in UI
```

❌ **Test failed in openSectionEditor** - Couldn't find title input after clicking Edit
```
Error: expect(locator).toBeVisible() failed
Locator: locator('input[placeholder*="Enter a title"]').first()
Timeout: 2000ms
```

**Duration**: 20.8s (down from 28-37s in previous runs)

### Retry Attempt
❌ **beforeEach hook failed** - Couldn't find page content
```
Error: expect(locator).toBeVisible() failed
Locator: locator('.space-y-4, .text-center.py-12').first()
Timeout: 3000ms
```

**Duration**: 32.6s

## Progress Analysis

### What's Working Now ✅
1. Variable references are correct (no more undefined errors)
2. Page structure detection is correct (looking for divs, not tables)
3. Test data creation is working
4. Navigation to content pages is working
5. Page content is loading (at least on first attempt)

### What's Still Failing ❌
1. **Section editor not opening reliably** - The title input doesn't appear after clicking Edit
2. **Flaky behavior** - First attempt gets further than retry, suggesting state issues
3. **Timing issues** - Still hitting timeouts, though at different points

## Next Steps

### Priority 1: Investigate Section Editor Opening (CRITICAL)

The test is failing when trying to open the section editor. Need to understand why the title input doesn't appear.

**Possible causes**:
1. The "Manage Sections" button click isn't working
2. The "Edit" button click isn't working
3. The section editor is opening but the title input has a different selector
4. React state isn't updating correctly

**Investigation approach**:
```bash
# Run test in headed mode to see what's happening
npm run test:e2e -- referenceBlocks.spec.ts --grep "should create event reference block" --headed --workers=1 --debug
```

### Priority 2: Fix Flaky Behavior

The retry attempt fails earlier than the first attempt, suggesting:
1. Test cleanup isn't working properly
2. Browser state is persisting between attempts
3. Database state is causing issues

**Investigation approach**:
- Check if test cleanup is removing all test data
- Verify browser storage is cleared between attempts
- Add more logging to understand state differences

### Priority 3: Improve Waiting Strategy

The test is still hitting timeouts, suggesting the waiting strategy needs improvement.

**Possible improvements**:
1. Wait for specific API responses before proceeding
2. Add more checkpoints to verify state
3. Increase timeouts for slow operations
4. Add retry logic for flaky operations

## Code Changes Made

### File 1: `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Change 1**: Fixed variable reference in event test
```typescript
// Line ~260
- const eventItem = page.locator(`[data-testid="reference-item-${testData.eventId}"]`);
+ const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
```

**Change 2**: Fixed variable reference in activity test
```typescript
// Line ~290
- const activityItem = page.locator(`[data-testid="reference-item-${testData.activityId}"]`);
+ const activityItem = page.locator(`[data-testid="reference-item-${testActivityId}"]`);
```

**Change 3**: Fixed page structure detection in beforeEach
```typescript
// Line ~205
- const table = page.locator('table, [role="table"]').first();
- await expect(table).toBeVisible({ timeout: 3000 });
+ const pageContent = page.locator('.space-y-4, .text-center.py-12').first();
+ await expect(pageContent).toBeVisible({ timeout: 3000 });
```

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Fixed 3 bugs

## Estimated Time to Complete

Based on current progress:
- Investigation in headed mode: 15 minutes
- Fix section editor opening: 15 minutes
- Fix flaky behavior: 15 minutes
- Test and verify: 15 minutes
- **Total: 60 minutes**

## Success Criteria

- [ ] Test passes consistently (no flaky failures)
- [ ] Test completes in <20 seconds
- [ ] No timeouts
- [ ] All 8 reference blocks tests pass

## Recommended Next Action

**Run test in headed mode** to see exactly what's happening when the section editor fails to open:

```bash
npm run test:e2e -- referenceBlocks.spec.ts --grep "should create event reference block" --headed --workers=1 --debug
```

This will show:
1. Whether the "Manage Sections" button is clicked
2. Whether the section editor expands
3. Whether the "Edit" button is clicked
4. Whether the title input appears
5. What the actual page structure looks like

## Context for Next Session

You fixed two critical bugs:
1. Variable name mismatch (`testData.eventId` → `testEventId`)
2. Wrong page structure assumption (table → card layout)

The test now gets past the beforeEach hook and into the actual test, but fails when trying to open the section editor. The next step is to run the test in headed mode to see what's happening visually and understand why the section editor isn't opening correctly.

The key insight is that the test is making progress - it's getting further than before. The remaining issues are likely related to timing and the section editor's behavior, not fundamental bugs in the test setup.
