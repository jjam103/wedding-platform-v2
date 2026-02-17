# E2E Data Management Suite - Tree Selector Fix

**Date**: February 15, 2026  
**Status**: ✅ COMPLETE  
**Test File**: `__tests__/e2e/admin/dataManagement.spec.ts`

## Problem Summary

The Location Hierarchy E2E test was failing because the final verification step was finding location names in the parent location dropdown `<option>` elements instead of in the visible tree structure.

### Error Message
```
Locator: locator('text=Test Country 1771202309865').first()
  - Expected: visible
  - Received: hidden
  - Locator resolved to <option value="...">Test Country 1771202309865</option>
```

## Root Cause

The test was using generic text locators for the final verification:
```typescript
// ❌ WRONG - finds dropdown options (hidden)
await expect(page.locator(`text=${countryName}`).first()).toBeVisible();
await expect(page.locator(`text=${regionName}`).first()).toBeVisible();
await expect(page.locator(`text=${cityName}`).first()).toBeVisible();
```

These locators were finding the location names in the `<select>` dropdown for parent location selection, which are hidden `<option>` elements, not the visible tree nodes.

## Solution Applied

Updated the final verification to use the tree container selector that was already defined earlier in the test:

```typescript
// ✅ CORRECT - finds tree nodes (visible)
await expect(treeContainer.locator(`text=${countryName}`)).toBeVisible();
await expect(treeContainer.locator(`text=${regionName}`)).toBeVisible();
await expect(treeContainer.locator(`text=${cityName}`)).toBeVisible();
```

Where `treeContainer` is defined as:
```typescript
const treeContainer = page.locator('div.mt-6.bg-white.rounded-lg.shadow');
```

This matches the tree container in `app/admin/locations/page.tsx`:
```tsx
<div className="mt-6 bg-white rounded-lg shadow">
  {filteredLocations.map((location) => renderTreeNode(location))}
</div>
```

## Changes Made

### File: `__tests__/e2e/admin/dataManagement.spec.ts`

**Lines 377-382** - Updated final verification selectors:

```diff
  // Verify tree display
- await expect(page.locator(`text=${countryName}`).first()).toBeVisible();
- await expect(page.locator(`text=${regionName}`).first()).toBeVisible();
- await expect(page.locator(`text=${cityName}`).first()).toBeVisible();
+ await expect(treeContainer.locator(`text=${countryName}`)).toBeVisible();
+ await expect(treeContainer.locator(`text=${regionName}`)).toBeVisible();
+ await expect(treeContainer.locator(`text=${cityName}`)).toBeVisible();
```

## Test Coverage

This fix applies to:
- ✅ **Test #1**: "should create location hierarchy (country → region → city)" - FIXED
- ⏭️ **Test #2**: "should prevent circular reference in location hierarchy" - No change needed (doesn't verify tree display)
- ⏭️ **Test #3**: "should expand/collapse tree and search locations" - No change needed (uses different selectors)

## Why This Works

1. **Scoped Selection**: By using `treeContainer.locator()` instead of `page.locator()`, we limit the search to only elements within the tree container
2. **Avoids Dropdown**: The dropdown `<select>` element is outside the tree container, so it won't be found
3. **Finds Visible Elements**: The tree nodes are rendered inside the tree container and are visible to the user
4. **Consistent Pattern**: This matches the pattern already used earlier in the test for expanding tree nodes

## Related Documentation

- **Previous Fix**: `E2E_FEB15_2026_DATA_MANAGEMENT_FORM_FIXES.md` - Fixed form opening issues
- **DOM Structure**: `E2E_FEB15_2026_DOM_INSPECTION_VISUAL_GUIDE.md` - Visual guide to DOM structure
- **Component**: `app/admin/locations/page.tsx` - Location hierarchy page component

## Next Steps

1. ✅ Fix applied
2. ⏭️ Run the test to verify it passes
3. ⏭️ If passing, move to next failing test in the suite

## Testing Command

```bash
# Run just the Location Hierarchy tests
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep "Location Hierarchy"

# Run the specific test
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep "should create location hierarchy"
```

## Expected Outcome

The test should now:
1. ✅ Create country, region, and city locations
2. ✅ Wait for forms to open properly (previous fix)
3. ✅ Find the created locations in the visible tree structure (this fix)
4. ✅ Pass all assertions

## Test Results

✅ **TEST PASSED** - Verified on February 15, 2026

```
Running 1 test using 1 worker
✓  1 …rchical location structure (8.7s)
1 passed (19.2s)
```

The fix successfully resolved the issue. The test now correctly finds the location names in the visible tree container instead of the hidden dropdown options.

## Confidence Level

**HIGH** - This is a straightforward selector fix that:
- Uses the correct container selector already defined in the test
- Matches the actual DOM structure in the component
- Follows the same pattern used elsewhere in the test
- Addresses the exact error message we were seeing
- **VERIFIED PASSING** in actual test execution
