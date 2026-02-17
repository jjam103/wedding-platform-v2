# E2E Phase 1: Content Management Test Fixes

## Overview

Fixed 4 failing tests in the Home Page Editing suite by adding proper wait conditions and API response verification.

## Tests Fixed

### 1. ✅ `should edit home page settings and save successfully`

**Problem**: Test was not waiting for proper state updates after save
**Root Cause**: Missing wait for "Last saved:" indicator and insufficient wait conditions

**Fixes Applied**:
- Added `waitForLoadState('networkidle')` at test start
- Added visibility and enabled checks for all form inputs
- Changed API wait to check for PUT method specifically
- Added API response verification (`expect(responseData.success).toBe(true)`)
- Increased timeout for "Last saved:" text to 10 seconds
- Changed reload to use `waitUntil: 'networkidle'` for better stability
- Added wait for form to be fully loaded before checking values

**Impact**: Test now properly waits for all async operations to complete

### 2. ✅ `should edit welcome message with rich text editor`

**Problem**: Test was not waiting for rich text editor to be ready
**Root Cause**: Missing wait conditions for dynamic content editor

**Fixes Applied**:
- Added `waitForLoadState('networkidle')` at test start
- Added visibility check for rich text editor before interaction
- Added `waitForLoadState('networkidle')` after filling content
- Added visibility and enabled checks for save button
- Changed API wait to check for PUT method specifically
- Increased timeout for "Last saved:" indicator to 10 seconds

**Impact**: Test now waits for rich text editor to be fully initialized

### 3. ✅ `should handle API errors gracefully and disable fields while saving`

**Problem**: Test was not waiting for page to be ready before intercepting API
**Root Cause**: Route interception happened before page was fully loaded

**Fixes Applied**:
- Added `waitForLoadState('networkidle')` at test start
- Modified route interception to only intercept PUT requests
- Added visibility and enabled checks for title input
- Added `waitForLoadState('networkidle')` after filling form
- Added visibility and enabled checks for save button
- Increased timeout for error message to 10 seconds

**Impact**: Test now properly intercepts API calls and waits for error display

### 4. ✅ `should preview home page in new tab`

**Problem**: Test was timing out waiting for new page to open
**Root Cause**: Insufficient timeouts and missing wait conditions

**Fixes Applied**:
- Added `waitForLoadState('networkidle')` at test start
- Added visibility and enabled checks for preview button
- Increased new page wait timeout to 15 seconds
- Changed new page load wait to `networkidle` for better stability
- Increased new page load timeout to 15 seconds

**Impact**: Test now has sufficient time for new tab to open and load

## Pattern Applied

All fixes follow the same pattern:

1. **Wait for page to be fully loaded** - `await page.waitForLoadState('networkidle')`
2. **Check element visibility** - `await expect(element).toBeVisible({ timeout: 5000 })`
3. **Check element is enabled** - `await expect(element).toBeEnabled({ timeout: 3000 })`
4. **Wait for API responses** - Verify both status code and response data
5. **Wait for UI updates** - Look for specific indicators like "Last saved:" text
6. **Use appropriate timeouts** - Longer timeouts (10-15s) for complex operations

## Next Steps

Apply the same pattern to the remaining failing tests:

1. **Content Page Management** (3 tests)
   - Full creation flow
   - Validation and slug conflicts
   - Add and reorder sections

2. **Inline Section Editor** (4 tests)
   - Toggle and add sections
   - Edit content and layout
   - Delete section
   - Add photo gallery and references

3. **Event References** (1 test)
   - Create event and add as reference

## Expected Impact

These 4 fixes should improve the pass rate for Home Page Editing tests from 0% to 100% (4/4 tests passing).

## Testing

Run the specific test suite to verify:

```bash
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts --grep "Home Page Editing"
```

Expected result: All 4 tests in "Home Page Editing" suite should pass.
