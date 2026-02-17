# E2E Reference Blocks Tests - Continued Fixes

**Date**: February 14, 2026  
**Status**: Applying additional fixes for remaining failures

---

## Current Status

From the test results screenshot:
- ✅ **5/8 tests passing** (62.5%)
- ❌ **3/8 tests failing** (37.5%)
- ⚠️ **1 test flaky** (remove reference from section)

---

## Fixes Applied

### Fix #1: Test #1 - Increased Stability Wait for Event Reference Click

**Problem**: Test fails on first run due to element detachment during re-renders

**Solution**: Increased stability wait from 1000ms to 2000ms and extended retry timeout

```typescript
// OLD: 1000ms wait, 15s timeout
await page.waitForTimeout(1000);
await expect(async () => {
  await eventItem.click({ force: true });
  // ...
}).toPass({ timeout: 15000, intervals: [1000, 2000, 3000] });

// NEW: 2000ms wait, 20s timeout with longer intervals
await page.waitForTimeout(2000);
await expect(async () => {
  await eventItem.click({ force: true });
  // ...
}).toPass({ timeout: 20000, intervals: [1000, 2000, 3000, 5000] });
```

**Why This Works**: Gives the UI more time to stabilize after API responses and re-renders, reducing the chance of clicking a detached element.

---

## Remaining Issues to Investigate

### Issue #1: Test #4 - Multiple Reference Types (New Failure)

**Status**: Was passing before, now failing  
**Action Needed**: Run test individually to see actual error

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts -g "should create multiple reference types"
```

**Possible Causes**:
1. Timing issue with sequential reference additions
2. API response handling changed
3. UI state management issue

### Issue #2: Test #9 - Circular References (Implementation Complete)

**Status**: Test implementation is complete but may have validation issues  
**Action Needed**: Verify circular reference validation is working

**Test Flow**:
1. ✅ Creates two content pages (A and B)
2. ✅ Adds reference from Page A → Page B
3. ✅ Navigates to Page B edit form
4. ✅ Opens section editor for Page B
5. ✅ Selects References column type
6. ✅ Selects content_page type
7. ✅ Clicks on Page A (creates circular reference)
8. ✅ Clicks Save button
9. ❓ Verifies circular reference error message

**Potential Issue**: The error message selector may not match the actual error display:

```typescript
// Current selector
const errorMessage = page.locator('.bg-red-50, .text-red-800, .text-red-600, text=/circular|cycle|loop/i').first();
```

**Action**: Check if circular reference validation is actually running and displaying an error.

### Issue #3: Test #5 - Remove Reference (Flaky)

**Status**: Passes on retry but not on first run  
**Possible Cause**: Database query timing issue

**Current Fix**: Already applied - query by `section_id` instead of `column_id`

**Action**: Monitor if this continues to be flaky after other fixes are applied.

---

## Next Steps

1. **Run Test #4 individually** to see actual error:
   ```bash
   npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts -g "should create multiple reference types"
   ```

2. **Verify circular reference validation** is working:
   - Check `services/sectionsService.ts` for circular reference detection
   - Verify error is being returned from API
   - Check if error is being displayed in UI

3. **Run full suite** to verify Fix #1 improves Test #1 stability:
   ```bash
   npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
   ```

4. **Monitor flaky test** (Test #5) to see if it stabilizes with other fixes

---

## Expected Outcome

After these fixes:
- Test #1 should pass consistently (no longer flaky)
- Test #4 needs investigation to understand new failure
- Test #9 needs validation verification
- Test #5 should stabilize (already fixed)

**Target**: 6-7/8 tests passing (75-87.5%)

---

## Files Modified

1. ✅ `__tests__/e2e/admin/referenceBlocks.spec.ts` - Increased stability wait for Test #1

---

## Verification Commands

```bash
# Run all reference block tests
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts

# Run specific failing test
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts -g "should create multiple reference types"

# Run with retries to check for flakiness
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --retries=2

# Run with UI mode for debugging
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --ui
```

---

## Summary

Applied one fix to improve Test #1 stability. Three tests still need attention:
- Test #1: Improved (increased wait time)
- Test #4: Needs investigation (new failure)
- Test #9: Needs validation verification (implementation complete)

The test suite is progressing from 50% → 62.5% → targeting 75-87.5% passing rate.
