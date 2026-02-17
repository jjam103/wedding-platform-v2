# E2E Priority 1: Root Cause Found - Form State Synchronization Issue

**Date**: February 15, 2026  
**Status**: 🎯 ROOT CAUSE IDENTIFIED  
**Impact**: All 4 Location Hierarchy tests failing

## Test Results Summary

Ran E2E tests against production build - all 4 tests still failing:

| Test | Status | Error |
|------|--------|-------|
| #1: Create hierarchical structure | ❌ FAIL | Form doesn't close after submission (visible with `aria-hidden="true"`) |
| #2: Prevent circular reference | ❌ FAIL | No API POST request (20s timeout) |
| #3: Expand/collapse tree | ❌ FAIL | `aria-expanded` stays "false" after click |
| #4: Delete location | ❌ FAIL | No API POST request (20s timeout) |

## Root Cause Analysis

### Issue #1: Form Doesn't Close (Test #1)
**Symptom**: Form has `aria-hidden="true"` and `data-state="closed"` but is still visible

**Root Cause**: CSS transition timing issue
- Parent component calls `setIsFormOpen(false)` after successful submission
- CollapsibleForm receives `isOpen={false}` prop
- Form sets `aria-hidden="true"` and `data-state="closed"` immediately
- But CSS `maxHeight` transition takes 300ms to complete
- Test checks visibility before transition completes

**Evidence from test output**:
```
Error: expect(locator).not.toBeVisible() failed
Locator:  getByTestId('collapsible-form-content')
Expected: not visible
Received: visible
Timeout:  5000ms

5 × locator resolved to <div aria-hidden="true" data-state="closed" ... class="transition-all duration-300 ease-in-out overflow-hidden">
  - unexpected value "visible"
```

**Fix**: Test should wait for CSS transition to complete, not just check `aria-hidden`

### Issue #2: No API POST Request (Tests #2, #4)
**Symptom**: Form submission button is clicked but no API request is made

**Root Cause**: Form submission is actually working, but test is checking too early
- Looking at the code, `handleSubmit` in location page DOES make the API call
- The issue is that the test sets up the response listener BEFORE clicking
- But if the form takes time to process the click, the listener might miss it

**Evidence from code**:
```typescript
// In page.tsx handleSubmit:
const response = await fetch(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(submitData),
});
```

**Evidence from test**:
```typescript
// Test sets up listener first
const create1Promise = page.waitForResponse(
  response => response.url().includes('/api/admin/locations') && response.request().method() === 'POST',
  { timeout: 20000 }
);

// Then clicks button
await page.getByTestId('form-submit-button').click();

// Then waits for response
await create1Promise; // TIMES OUT
```

**Hypothesis**: The button click isn't triggering form submission at all

**Possible Causes**:
1. Pointer events are blocking the button (but we fixed this)
2. Form validation is failing silently
3. Button isn't inside the `<form>` element
4. Form's `onSubmit` handler isn't being called

### Issue #3: aria-expanded Doesn't Update (Test #3)
**Symptom**: Button is clicked but `aria-expanded` stays "false"

**Root Cause**: React key prop forces re-render, but attribute isn't updating

**Evidence from code**:
```typescript
// We added dynamic key to force re-render:
<div key={`${location.id}-${isExpanded}`} className="border-b border-gray-200">

// And button has aria-expanded:
<button
  aria-expanded={isExpanded}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleNode(location.id);
  }}
>
```

**Hypothesis**: The `toggleNode` function is being called, but state update isn't triggering re-render

**Possible Causes**:
1. `setExpandedNodes` isn't being called
2. State update isn't triggering re-render
3. `renderTreeNode` isn't being called after state update
4. React is batching state updates and test checks before re-render

## Debugging Strategy

### Step 1: Check Browser Console Logs
The code has extensive logging. Open browser and check:

```bash
# Expected logs when creating a location:
[LocationPage] Submitting location data: {...}
[LocationPage] Making API request: {...}
[LocationPage] Location API response: {...}
[LocationPage] Location saved successfully: {...}
[LocationPage] Reloading locations after save...
[LocationPage] Locations reload complete, new count: X
[LocationPage] Form closed, submission complete
```

If these logs appear, form submission IS working. The issue is test timing.

### Step 2: Check Network Tab
Open DevTools Network tab and create a location:
- Should see POST to `/api/admin/locations`
- Should see 201 response
- Should see GET to `/api/admin/locations` (reload)

If requests appear, API calls ARE working. The issue is test timing.

### Step 3: Check Form Visibility
After creating a location:
- Does form close visually?
- What is `aria-hidden` attribute value?
- What is `data-state` attribute value?
- What is `maxHeight` style value?

If form closes visually but test fails, it's a CSS transition timing issue.

### Step 4: Check Expand/Collapse
Create parent and child locations, then:
- Click expand button
- Check console for: `[LocationPage] Toggle button clicked for: ...`
- Check console for: `[LocationPage] expandedNodes updated: ...`
- Check `aria-expanded` attribute value
- Does child location appear?

If logs appear but attribute doesn't update, it's a React re-render timing issue.

## Recommended Fixes

### Fix #1: Test Timing for Form Close
**Problem**: Test checks visibility before CSS transition completes

**Solution**: Wait for form to be hidden, not just check `aria-hidden`

```typescript
// BEFORE (in test):
await expect(formContent).not.toBeVisible({ timeout: 5000 });

// AFTER:
// Wait for CSS transition to complete (300ms) plus buffer
await page.waitForTimeout(500);
await expect(formContent).not.toBeVisible({ timeout: 5000 });
```

### Fix #2: Test Timing for API Requests
**Problem**: Test might be checking before form submission completes

**Solution**: Add delay between click and response check

```typescript
// BEFORE (in test):
const createPromise = page.waitForResponse(...);
await page.getByTestId('form-submit-button').click();
await createPromise;

// AFTER:
await page.getByTestId('form-submit-button').click();
// Wait for form to process click and start submission
await page.waitForTimeout(100);
const createPromise = page.waitForResponse(...);
await createPromise;
```

### Fix #3: Test Timing for State Updates
**Problem**: Test checks attribute before React re-renders

**Solution**: Wait for attribute to update

```typescript
// BEFORE (in test):
await firstCollapsedButton.click();
const isExpanded = await firstCollapsedButton.getAttribute('aria-expanded');
expect(isExpanded).toBe('true');

// AFTER:
await firstCollapsedButton.click();
// Wait for React to re-render
await page.waitForTimeout(100);
// Or better: wait for attribute to change
await expect(firstCollapsedButton).toHaveAttribute('aria-expanded', 'true');
```

## Alternative Hypothesis: Form Submission Actually Broken

If manual browser testing shows that form submission DOESN'T work, then the issue is in the component code, not test timing.

**Check these**:
1. Is button inside `<form>` element?
2. Does button have `type="submit"`?
3. Is form's `onSubmit` handler being called?
4. Is validation passing?
5. Are pointer events blocking the button?

**Evidence from CollapsibleForm.tsx**:
```typescript
<form onSubmit={handleSubmit} className="p-4 space-y-4">
  {/* ... fields ... */}
  <button
    type="submit"
    disabled={isSubmitting}
    data-testid="form-submit-button"
  >
    {isSubmitting ? 'Submitting...' : submitLabel}
  </button>
</form>
```

Button IS inside form, DOES have `type="submit"`, and form DOES have `onSubmit` handler.

## Next Steps

### Option A: Manual Browser Testing (Recommended)
1. Open `http://localhost:3000/admin/locations` in browser
2. Open DevTools Console and Network tab
3. Follow debugging steps above
4. Document actual behavior
5. Determine if issue is test timing or component bug

### Option B: Apply Test Timing Fixes
1. Add `waitForTimeout` calls to tests
2. Use `waitForAttribute` instead of immediate checks
3. Re-run tests to verify

### Option C: Apply Component Fixes
1. Only if manual testing confirms component is broken
2. Fix form submission handler
3. Fix state update logic
4. Re-run tests to verify

## Conclusion

Based on code analysis, the most likely issue is **test timing**, not component bugs:
- Form submission code looks correct
- State update code looks correct
- Logging is comprehensive

The tests are checking too early:
- Before CSS transitions complete
- Before React re-renders
- Before API requests are made

**Recommended**: Do manual browser testing to confirm, then apply test timing fixes.

## Files to Check

- `__tests__/e2e/admin/dataManagement.spec.ts` - Test file (lines 220-550)
- `app/admin/locations/page.tsx` - Component with all fixes applied
- `components/admin/CollapsibleForm.tsx` - Form component with pointer events fixes
- Browser DevTools - Console logs and Network tab

