# E2E Reference Blocks - After Revert Results
**Date**: February 14, 2026
**Status**: ✅ IMPROVED - Back to better than baseline!

## Summary

After reverting our "comprehensive timing fixes" to Test #7, we're now at **5/8 passing (62.5%)**, which is BETTER than:
- Our "fixed" version: 3/8 passing (37.5%)
- The baseline: 4/8 passing (50%)

**Key Finding**: Reverting Test #7 not only fixed that test, but also fixed Test #6 (Remove reference)!

## Test Results

### ✅ Passing Tests (5/8 = 62.5%)
1. **should create activity reference block** - ✓ Passed (17.7s)
2. **should create multiple reference types in one section** - ✓ Passed (17.6s)
3. **should remove reference from section** - ✓ Passed (18.8s) **← NOW PASSING!**
4. **should filter references by type in picker** - ✓ Passed (15.7s) **← FIXED BY REVERT!**
5. **should detect broken references** - ✓ Passed (14.3s)

### ❌ Failing Tests (3/8 = 37.5%)
1. **should create event reference block** - ❌ Failed (39.5s + 34.5s retry)
   - Error: Timeout clicking reference item
   - Item renders but click doesn't work
   
2. **should prevent circular references** - ❌ Failed (21.0s + 35.7s retry)
   - Error: Can't find Edit button for Content Page B
   - UI structure mismatch
   
3. **should display reference blocks in guest view** - ❌ Failed (23.6s + 35.1s retry)
   - Error: Expanded details show "Loading details..." instead of actual data
   - API not returning data correctly

## Progress Comparison

| Metric | Before Fixes | After "Fixes" | After Revert | Change |
|--------|--------------|---------------|--------------|--------|
| Pass Rate | 50% (4/8) | 37.5% (3/8) | **62.5% (5/8)** | **+25%** |
| Passing Tests | 4 | 3 | **5** | **+1** |
| Failing Tests | 4 | 5 | **3** | **-1** |

## What We Learned

### Lesson #1: Simple is Better
Test #7 was passing with a simple `await page.waitForTimeout(1000)`. Our "comprehensive timing fixes" with API waits, spinner waits, and retry logic broke it.

**Before (Working)**:
```typescript
await typeSelect.selectOption('event');
await page.waitForTimeout(1000);
```

**After Our "Fixes" (Broken)**:
```typescript
await typeSelect.selectOption('event');
await page.waitForResponse(...); // Wait for API
await page.waitForSelector('.animate-spin', { state: 'hidden' }); // Wait for spinner
await expect(async () => { ... }).toPass({ timeout: 15000 }); // Retry logic
```

**Result**: The complex version broke a working test.

### Lesson #2: Reverting Can Fix Multiple Tests
Reverting Test #7 also fixed Test #6 (Remove reference). This suggests our changes had side effects or timing issues that affected other tests.

### Lesson #3: Read Before Fixing
We should have read the test code and checked the baseline before making changes. We assumed tests were failing due to timing issues without verifying.

## Remaining Issues

### Issue #1: Test #1 - Create Event Reference (Click Not Working)
**Symptom**: Item renders, API returns data, but click on item doesn't work
**Error**: `locator.click: Timeout 15000ms exceeded`
**Next Step**: Run with --debug to see what's happening when we try to click

### Issue #2: Test #9 - Circular References (UI Mismatch)
**Symptom**: Can't find Edit button for Content Page B
**Error**: `expect(locator).toBeVisible() failed`
**Next Step**: Manual testing to see actual card structure

### Issue #3: Test #12 - Guest View (API Issue)
**Symptom**: Expanded details show "Loading details..." instead of actual data
**Error**: `unexpected value "Loading details..."`
**Next Step**: Check API route `/api/admin/references/[type]/[id]`

## Next Actions

### Priority 1: Investigate Test #1 (Create Event Reference)
This is the most important test - it's the basic "create reference" workflow. If this doesn't work, the feature is broken.

**Action**: Run with --debug and --headed to see what happens when we click the item:
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:266 --debug --headed
```

### Priority 2: Fix Test #12 (Guest View API)
This is a clear API bug - the route is returning "Loading details..." instead of actual data.

**Action**: Check `app/api/admin/references/[type]/[id]/route.ts` and `components/guest/GuestReferencePreview.tsx`

### Priority 3: Fix Test #9 (Circular References UI)
This is a UI structure mismatch - need to understand actual card layout.

**Action**: Manual testing to see how content pages are displayed and where the Edit button is

## Success Metrics

- ✅ Reverted Test #7 successfully
- ✅ Test #7 now passing (15.7s)
- ✅ Test #6 now passing (18.8s) - bonus fix!
- ✅ Improved from 4/8 to 5/8 passing (+25%)
- ✅ Better than baseline (50% → 62.5%)

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Reverted Test #7 timing fixes (lines 674-690)

## Commands Used

```bash
# Reverted Test #7 changes
# Removed: API wait, spinner wait, retry logic
# Kept: Simple timeout

# Ran full test suite
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

## Conclusion

Reverting our "comprehensive timing fixes" was the right decision. We:
- Fixed Test #7 (Filter by type)
- Fixed Test #6 (Remove reference) as a bonus
- Improved from 50% to 62.5% passing
- Learned valuable lessons about not over-engineering solutions

**Next**: Focus on the 3 remaining failures with proper investigation (--debug, --ui, manual testing) before making any code changes.
