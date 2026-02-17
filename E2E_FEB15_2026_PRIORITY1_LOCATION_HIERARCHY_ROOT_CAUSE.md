# E2E Priority 1: Location Hierarchy - Root Cause Analysis

**Date**: February 15, 2026  
**Status**: ❌ All 4 tests failing  
**Environment**: Dev server (not production build)

## Critical Discovery

The tests are running against **dev server**, not production build. The fixes applied were designed for production build timing differences, which is why they're not working.

## Test Failures Summary

### Test #1: "should create hierarchical location structure"
- **First run**: Country created successfully but not visible in tree
  - Error: `text=Test Country 1771195973739` found in dropdown but marked as "hidden"
  - This means the country was created and is in the database, but not displayed in the tree view
- **Retry**: Form not closing after submission
  - Error: Form content still visible after 5000ms timeout
  - Expected: Form should close after successful creation

### Test #2: "should prevent circular reference in location hierarchy"
- **Error**: POST request timeout (20000ms)
- **Root cause**: POST request never fires because form submission isn't working

### Test #3: "should expand/collapse tree and search locations"
- **Error**: Tree expansion not working
- **Details**: After clicking expand button, `aria-expanded` stays "false"
- **Root cause**: Tree interaction logic not responding to clicks

### Test #4: "should delete location and validate required fields"
- **Error**: POST request timeout (20000ms)
- **Root cause**: Same as Test #2 - form submission not working

## Root Cause Analysis

### Primary Issue: Dev Server vs Production Build
The fixes were designed for production build timing:
- Increased POST timeouts to 20000ms
- Changed tree reload wait from API response to networkidle
- Increased post-wait delays to 1000ms

However, tests are running against dev server which has:
- Different timing characteristics
- Different form submission behavior
- Different tree rendering behavior

### Secondary Issues

#### 1. Form Not Closing (Test #1 retry)
```typescript
// Current code (line 288)
await expect(formContent).not.toBeVisible({ timeout: 5000 });
```
**Problem**: Form stays open after submission in dev mode
**Possible causes**:
- Form submission handler not completing
- State update not triggering form close
- Collapsible component not responding to state change

#### 2. POST Requests Not Firing (Tests #2, #4)
```typescript
// Current code (lines 397, 513)
const createPromise = page.waitForResponse(
  response => response.url().includes('/api/admin/locations') && response.request().method() === 'POST',
  { timeout: 20000 }
);
```
**Problem**: POST request never happens
**Possible causes**:
- Form submit button not triggering submission
- Form validation preventing submission
- JavaScript error preventing form submission

#### 3. Tree Expansion Not Working (Test #3)
```typescript
// Current code (line 470)
const isExpanded = await firstCollapsedButton.getAttribute('aria-expanded');
expect(isExpanded).toBe('true'); // Fails: still 'false'
```
**Problem**: Clicking expand button doesn't change aria-expanded
**Possible causes**:
- Click not registering
- Tree component state not updating
- Event handler not attached

#### 4. Country Created But Not Visible (Test #1 first run)
```typescript
// Error message
// Locator resolved to <option value="...">Test Country 1771195973739</option>
// - unexpected value "hidden"
```
**Problem**: Country exists in dropdown but marked as hidden
**Possible causes**:
- Tree view not refreshing after creation
- CSS hiding the element
- Tree component not rendering new items

## Evidence from Test Output

### Test #1 First Run
```
Error: expect(locator).toBeVisible() failed
Locator: locator('text=Test Country 1771195973739').first()
Expected: visible
Received: hidden

14 × locator resolved to <option value="...">Test Country 1771195973739</option>
   - unexpected value "hidden"
```
**Analysis**: The country was successfully created (it's in the dropdown), but the tree view isn't showing it.

### Test #1 Retry
```
Error: expect(locator).not.toBeVisible() failed
Locator: getByTestId('collapsible-form-content')
Expected: not visible
Received: visible

4-5 × locator resolved to <div aria-hidden="true" data-state="closed" ...>
   - unexpected value "visible"
```
**Analysis**: Form has `data-state="closed"` and `aria-hidden="true"` but is still visible. This is a CSS/animation issue.

## Next Steps

### Option 1: Switch to Production Build (Recommended)
**Pros**:
- Fixes are already designed for production
- Production build is the actual deployment target
- More representative of real-world behavior

**Cons**:
- Need to build and start production server
- Longer startup time

**Implementation**:
```bash
# Build production
npm run build

# Start production server
npm start

# Set environment variable
export E2E_USE_PRODUCTION=true

# Run tests
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

### Option 2: Adjust Fixes for Dev Server
**Pros**:
- Faster iteration during development
- No build step required

**Cons**:
- Fixes may not work in production
- Dev server behavior may be inconsistent

**Implementation**:
1. Investigate why form isn't closing in dev mode
2. Add longer waits for dev server timing
3. Add explicit waits for tree rendering
4. Add debugging to understand POST request issue

### Option 3: Hybrid Approach
Run tests against production build for baseline, use dev server for debugging specific issues.

## Recommendation

**Use Option 1: Switch to Production Build**

Reasons:
1. The three-way analysis confirmed production build is the best baseline
2. Fixes are already designed for production timing
3. Production build is what gets deployed
4. Dev server behavior is less predictable

## Action Plan

1. ✅ Document root cause (this file)
2. ⏭️ Build production and start server
3. ⏭️ Set E2E_USE_PRODUCTION=true
4. ⏭️ Run tests against production build
5. ⏭️ Verify fixes work in production environment
6. ⏭️ If tests still fail, investigate production-specific issues

## Files Involved

- `__tests__/e2e/admin/dataManagement.spec.ts` - Test file with applied fixes
- `app/admin/locations/page.tsx` - Component being tested
- `playwright.config.ts` - Test configuration
- `.env.e2e` - Environment configuration (no E2E_USE_PRODUCTION set)

## Related Documents

- `E2E_FEB15_2026_THREE_WAY_ANALYSIS_FINAL.md` - Analysis showing production is best baseline
- `E2E_FEB15_2026_PRIORITY1_FIX_APPLIED.md` - Documentation of fixes applied
- `e2e-location-hierarchy-test-results.log` - Latest test results
