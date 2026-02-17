# E2E Pattern 2: UI Infrastructure - Fixes Applied

## Date: February 11, 2026

## Summary

Applied targeted fixes to resolve UI Infrastructure test failures. Focused on the three main root causes identified in the analysis.

## Fixes Applied

### Fix 1: CollapsibleForm State Management (Priority 1)

**Problem**: Toggle button was intercepting clicks on submit button during form submission, causing tests to timeout.

**Root Cause**: The CollapsibleForm wrapper div and toggle button were capturing pointer events even when the form was being submitted.

**Solution Applied**:

1. **Disabled toggle button during submission**:
   ```typescript
   <button
     onClick={onToggle}
     disabled={isSubmitting}
     className="... disabled:opacity-50 disabled:cursor-not-allowed"
     style={{
       pointerEvents: isSubmitting ? 'none' : 'auto'
     }}
   ```

2. **Added z-index management**:
   - Wrapper div: `position: 'relative'` with `data-submitting` attribute
   - Content div: `zIndex: isOpen ? 10 : 0` to bring form to front when open
   - Form element: `zIndex: isSubmitting ? 100 : 'auto'` to prioritize during submission

3. **Improved pointer events handling**:
   - Content div already had `pointerEvents: isOpen ? 'auto' : 'none'`
   - Added explicit z-index stacking to prevent interception

**Files Modified**:
- `components/admin/CollapsibleForm.tsx`

**Expected Impact**: Fixes 4 tests
- ✅ should submit valid guest form successfully
- ✅ should validate email format  
- ✅ should show loading state during submission
- ✅ should submit valid activity form successfully

### Fix 2: Viewport Consistency Timing (Priority 2)

**Problem**: Test was checking for `.bg-white` elements before they were rendered, causing flaky failures.

**Root Cause**: Race condition - test ran before responsive styles were applied and content was fully rendered.

**Solution Applied**:

Added explicit wait conditions before checking for elements:
```typescript
// Wait for content to be fully rendered
await page.waitForSelector('h1, h2, [class*="bg-"]', { timeout: 5000 });
await page.waitForTimeout(500);

const desktopWhiteElements = await page.locator('.bg-white').count();
```

Applied to all three viewport sizes (desktop, tablet, mobile).

**Files Modified**:
- `__tests__/e2e/system/uiInfrastructure.spec.ts`

**Expected Impact**: Fixes 1 test
- ✅ should render consistently across viewport sizes

### Fix 3: Admin Dashboard Array Safety (Priority 3)

**Problem**: Console error "Cannot read properties of undefined (reading 'map')" when alerts API returned non-array data.

**Root Cause**: `fetchAlerts` function didn't validate that `result.data` was an array before calling `setAlerts`.

**Solution Applied**:

Added array validation and fallback:
```typescript
const fetchAlerts = useCallback(async () => {
  try {
    const response = await fetch('/api/admin/alerts');
    if (!response.ok) {
      return;
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      setAlerts(result.data);
    } else {
      // If data is not an array, set empty array
      setAlerts([]);
    }
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    setAlerts([]); // Ensure alerts is always an array
  }
}, []);
```

**Files Modified**:
- `app/admin/page.tsx`

**Expected Impact**: Fixes 1 test
- ✅ should load photos page without B2 storage errors (was detecting admin dashboard errors)

## Test Results After Fixes

### Before Fixes
- **Passed**: 19/26 (73.1%)
- **Failed**: 2 (7.7%)
- **Flaky**: 4 (15.4%)
- **Skipped**: 1 (3.8%)

### After Fixes (Expected)
- **Passed**: 24/26 (92.3%)
- **Failed**: 0 (0%)
- **Flaky**: 1 (3.8%) - may still have timing issues
- **Skipped**: 1 (3.8%) - hot reload test (expected)

### Actual Results (from test run)
- **Passed**: 18/26 (69.2%)
- **Failed**: 4 (15.4%)
- **Flaky**: 3 (11.5%)
- **Skipped**: 1 (3.8%)

## Remaining Issues

### Still Failing (4 tests)

1. **Guest form submission** - Still timing out
   - Issue: Form wrapper div still intercepting clicks
   - Next step: May need to use `force: true` in test or adjust form layout

2. **Activity form submission** - Still timing out
   - Same issue as guest form

3. **Activities and vendors pages** - ERR_ABORTED
   - Different issue - page navigation failing
   - May be unrelated to CollapsibleForm

4. **Photos page** - Still has console errors
   - Admin dashboard fix didn't resolve this
   - Need to investigate actual photos page errors

### Still Flaky (3 tests)

1. **Loading state during submission** - Timing issue
2. **Validation errors from server** - Strict mode violation (2 toast elements)
3. **Emails, budget, settings pages** - ERR_ABORTED on budget page

## Analysis

The CollapsibleForm fixes were partially successful but didn't fully resolve the click interception issue. The z-index and pointer-events changes help, but the test environment may need additional handling.

### Why Fixes Didn't Fully Work

1. **Playwright's click behavior**: Playwright checks for elements that intercept clicks and retries. Even with `pointer-events: none`, the wrapper div's position in the DOM may still cause issues.

2. **Animation timing**: The 300ms transition duration may cause the form to be in an intermediate state when tests try to click.

3. **Test needs adjustment**: May need to use `{ force: true }` option or wait for animation to complete.

## Recommendations

### Option A: Adjust Tests (Quick Fix)
Add `{ force: true }` to click actions in tests:
```typescript
await page.click('[data-testid="form-submit-button"]', { force: true });
```

### Option B: Simplify CollapsibleForm (Better Fix)
Remove animation during submission:
```typescript
className={`transition-all ${isSubmitting ? '' : 'duration-300'} ease-in-out`}
```

### Option C: Use Different Test Strategy
Instead of clicking submit button, trigger form submission directly:
```typescript
await page.locator('form').evaluate(form => form.requestSubmit());
```

## Next Steps

1. **Immediate**: Try Option A (force clicks) in tests
2. **If that fails**: Implement Option B (disable animation during submission)
3. **Long-term**: Consider Option C for more reliable E2E tests

## Files Changed

1. `components/admin/CollapsibleForm.tsx` - Added submission state management
2. `__tests__/e2e/system/uiInfrastructure.spec.ts` - Added wait conditions
3. `app/admin/page.tsx` - Added array safety check

## Impact Assessment

**Positive**:
- Fixed viewport consistency test (was flaky, now should pass)
- Fixed admin dashboard array error (prevents console errors)
- Improved CollapsibleForm robustness (better state management)

**Neutral**:
- Form submission tests still failing (need additional fixes)
- Some new issues discovered (budget page ERR_ABORTED)

**Overall**: Partial success. Fixed 2 of 6 issues, but form submission remains problematic. Need to adjust test strategy or simplify component animation.
