# E2E Guest Form Tests - Current Status

## Summary

After implementing the fix to use CollapsibleForm's built-in toggle, the guest form tests are **still failing** in the E2E environment.

## Test Results

From the test run output:

### ✅ Passing (6 tests)
1. CSS Delivery & Loading tests (5 tests)
2. Form loading state test (1 test)

### ❌ Failing (6 tests - with retries)
1. `should submit valid guest form successfully` - **FAILED** (retry also failed)
2. `should show validation errors for missing required fields` - **FAILED** (retry also failed)
3. `should validate email format` - **FAILED** (retry also failed)
4. `should clear form after successful submission` - **FAILED** (retry also failed)
5. `should preserve form data on validation error` - **FAILED** (retry also failed)
6. `should render consistently across viewport sizes` - **FAILED** (retry passed on 2nd attempt)

### ⏭️ Skipped (6 tests)
- Event and activity form tests (still skipped from before)
- Network error handling tests
- Server validation error tests

## Analysis

The fix we implemented (using CollapsibleForm's built-in toggle) **did not resolve the issue**. The tests are still failing, which suggests:

1. **The form is still not appearing** in the E2E environment
2. **CollapsibleForm's toggle might not be working** in E2E tests either
3. **There may be a deeper issue** with how the form renders in the test environment

## Possible Root Causes

### 1. CollapsibleForm Animation/Timing Issue
The CollapsibleForm uses CSS transitions for showing/hiding content:
```typescript
style={{
  maxHeight: isOpen ? 'none' : '0px',
  opacity: isOpen ? 1 : 0,
}}
```

**Problem**: The test might be clicking the toggle and immediately looking for form fields before the CSS transition completes.

**Evidence**: We added `await page.waitForTimeout(500)` but it might not be enough.

### 2. React State Update Timing
The `isFormOpen` state might not be updating properly in the E2E environment.

**Problem**: React's state updates are asynchronous, and the test environment might have different timing than manual testing.

### 3. CollapsibleForm's `isOpen` Prop Not Working
The CollapsibleForm might not be responding to the `isOpen` prop correctly.

**Problem**: The form might be rendered but hidden due to CSS, or not rendered at all.

### 4. Test Selector Issues
The test might be looking for the wrong elements or using incorrect selectors.

**Problem**: The `[data-testid="collapsible-form-content"]` might not be visible even when the form is "open".

## Next Steps

### Option 1: Debug the Current Implementation
1. Add more detailed logging to the test
2. Take screenshots at each step
3. Check what's actually in the DOM
4. Verify the `isOpen` state is changing

### Option 2: Simplify the Form Rendering
1. Remove the CollapsibleForm wrapper entirely for the guest form
2. Use a simple show/hide with CSS `display: none`
3. Make the form always visible in E2E tests

### Option 3: Fix CollapsibleForm for E2E
1. Add a `data-testid` to the form container inside CollapsibleForm
2. Wait for the form to be fully visible (not just present in DOM)
3. Increase wait times for animations

### Option 4: Use a Different Approach
1. Keep the custom toggle button
2. But fix the conditional rendering issue
3. Use `display: none` instead of conditional rendering

## Recommended Approach

**Option 3: Fix CollapsibleForm for E2E** is the best approach because:
- It fixes the root cause
- It benefits all pages using CollapsibleForm
- It's the most maintainable solution

### Implementation Plan

1. **Add explicit wait for form visibility**:
   ```typescript
   // Wait for form content to be visible (not just present)
   await page.waitForSelector('[data-testid="collapsible-form-content"]', { 
     state: 'visible', 
     timeout: 10000 
   });
   
   // Wait for CSS transition to complete
   await page.waitForTimeout(1000); // Increase from 500ms
   
   // Verify form is actually visible
   const isVisible = await page.locator('[data-testid="collapsible-form-content"]').isVisible();
   expect(isVisible).toBe(true);
   ```

2. **Add debugging to see what's happening**:
   ```typescript
   // Check if toggle button exists
   const toggleExists = await page.locator('[data-testid="collapsible-form-toggle"]').count();
   console.log('Toggle button count:', toggleExists);
   
   // Check aria-expanded before click
   const ariaBeforeClick = await page.locator('[data-testid="collapsible-form-toggle"]').getAttribute('aria-expanded');
   console.log('aria-expanded before click:', ariaBeforeClick);
   
   // Click toggle
   await page.locator('[data-testid="collapsible-form-toggle"]').click();
   
   // Check aria-expanded after click
   const ariaAfterClick = await page.locator('[data-testid="collapsible-form-toggle"]').getAttribute('aria-expanded');
   console.log('aria-expanded after click:', ariaAfterClick);
   
   // Check if form content exists in DOM
   const formContentCount = await page.locator('[data-testid="collapsible-form-content"]').count();
   console.log('Form content count:', formContentCount);
   
   // Check if form content is visible
   const formContentVisible = await page.locator('[data-testid="collapsible-form-content"]').isVisible();
   console.log('Form content visible:', formContentVisible);
   ```

3. **Fix CollapsibleForm if needed**:
   - Ensure `data-testid="collapsible-form-content"` is on the correct element
   - Ensure the element is actually visible when `isOpen={true}`
   - Consider using `display: none` instead of `maxHeight: 0` for hiding

## Current Blockers

1. **Tests are failing** - Need to understand why
2. **No detailed error messages** - Need to add debugging
3. **Unknown root cause** - Need to investigate further

## Files to Check

1. `components/admin/CollapsibleForm.tsx` - Check the toggle and content rendering
2. `app/admin/guests/page.tsx` - Check how CollapsibleForm is used
3. `__tests__/e2e/system/uiInfrastructure.spec.ts` - Check test implementation

## Timeline

- **Investigation**: 30-60 minutes
- **Fix Implementation**: 30-60 minutes
- **Testing & Verification**: 30 minutes
- **Total**: 1.5-2.5 hours

---

**Status**: ❌ Tests Still Failing
**Priority**: High (blocking E2E test suite)
**Next Action**: Add debugging to understand why form isn't appearing
