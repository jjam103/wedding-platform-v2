# E2E Data Management - Expand/Collapse Button Fix

**Date**: February 15, 2026  
**Status**: ✅ FIX APPLIED  
**Test**: "should expand/collapse tree and search locations"  
**File**: `__tests__/e2e/admin/dataManagement.spec.ts` (lines 469-505)

---

## Problem Summary

The expand/collapse tree test was failing because it was finding the wrong button - it was selecting the tab navigation button instead of the tree node expand/collapse button.

### Error Message
```
Error: expect(locator).toHaveAttribute(expected) failed
Locator: locator('button[aria-expanded="false"]').first()
Expected: "true"
Received: "false"

Resolved to: <button tabindex="0" role="button" aria-label="Content" data-tab-id="content" aria-expanded="false" aria-controls="content-panel" class="...">
```

---

## Root Cause

The test was using a generic selector that matched ANY button with `aria-expanded="false"`:

```typescript
// ❌ WRONG - finds first button with aria-expanded, which is the tab button
const collapsedButtons = page.locator('button[aria-expanded="false"]');
```

This selector found the "Content" tab button first, which also has `aria-expanded="false"` for tab panel control.

---

## Solution Applied

### Fix Strategy

1. **Scope to tree container**: Use the tree container to limit search area
2. **Use aria-label**: Tree expand buttons have `aria-label="Expand"` or `aria-label="Collapse"`
3. **Avoid tab buttons**: Tab buttons have different aria-labels like "Content", "Settings", etc.

### Code Changes

**File**: `__tests__/e2e/admin/dataManagement.spec.ts`

**Lines 469-487** - Updated button selector:

```diff
  test('should expand/collapse tree and search locations', async ({ page }) => {
+   // Get the tree container to scope our selectors
+   const treeContainer = page.locator('div.mt-6.bg-white.rounded-lg.shadow');
+   
    // Test tree expansion - find a button that is currently collapsed
-   const collapsedButtons = page.locator('button[aria-expanded="false"]');
+   // Use aria-label to distinguish tree expand buttons from tab buttons
+   const collapsedButtons = treeContainer.locator('button[aria-label="Expand"]');
    
    if (await collapsedButtons.count() > 0) {
      const firstCollapsedButton = collapsedButtons.first();
      
      // Click to expand
      await firstCollapsedButton.click();
      
      // Wait for React to re-render and attribute to update
      await expect(firstCollapsedButton).toHaveAttribute('aria-expanded', 'true', { timeout: 2000 });
      
      // Click again to collapse
      await firstCollapsedButton.click();
      
      // Wait for React to re-render and attribute to update
      await expect(firstCollapsedButton).toHaveAttribute('aria-expanded', 'false', { timeout: 2000 });
    }
```

---

## Why This Works

### 1. Tree Container Scoping
```typescript
const treeContainer = page.locator('div.mt-6.bg-white.rounded-lg.shadow');
```
- Limits search to the tree display area
- Excludes tab navigation and other UI elements
- Same pattern used in previous successful fix

### 2. Aria-Label Selector
```typescript
const collapsedButtons = treeContainer.locator('button[aria-label="Expand"]');
```
- Tree expand buttons have `aria-label="Expand"` when collapsed
- Tree collapse buttons have `aria-label="Collapse"` when expanded
- Tab buttons have different labels ("Content", "Settings", etc.)
- More specific than just `aria-expanded` attribute

### 3. Component Structure

From `app/admin/locations/page.tsx` (lines 185-195):

```tsx
{hasChildren && (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNode(location.id);
    }}
    className="mr-2 text-gray-500 hover:text-gray-700"
    aria-label={isExpanded ? 'Collapse' : 'Expand'}
    aria-expanded={isExpanded}
    type="button"
  >
    {isExpanded ? '▼' : '▶'}
  </button>
)}
```

The button has:
- `aria-label="Expand"` when collapsed (`isExpanded = false`)
- `aria-label="Collapse"` when expanded (`isExpanded = true`)
- `aria-expanded` attribute that changes with state

---

## Test Flow

### Before Fix
1. Test looks for `button[aria-expanded="false"]`
2. Finds tab button first (outside tree container)
3. Clicks tab button
4. Tab button's `aria-expanded` doesn't change (it controls tab panel, not tree)
5. Test fails expecting `aria-expanded="true"`

### After Fix
1. Test scopes to tree container
2. Looks for `button[aria-label="Expand"]` within tree
3. Finds tree expand button (not tab button)
4. Clicks tree expand button
5. Button's `aria-expanded` changes to `true`
6. Test passes ✅

---

## Related Fixes

This fix follows the same pattern as:
- **Tree Selector Fix**: `E2E_FEB15_2026_DATA_MANAGEMENT_TREE_SELECTOR_FIX.md`
  - Also used tree container scoping
  - Avoided finding elements in wrong locations
  - Successful pattern to follow

---

## Testing

### Run This Test Only
```bash
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep "should expand/collapse tree and search locations"
```

### Expected Outcome
- ✅ Test finds tree expand button (not tab button)
- ✅ Clicking button expands tree node
- ✅ `aria-expanded` changes to `true`
- ✅ Clicking again collapses tree node
- ✅ `aria-expanded` changes back to `false`
- ✅ Test passes

---

## Confidence Level

**VERY HIGH** - This fix:
- Uses proven pattern from previous successful fix
- Targets correct component with specific aria-label
- Scopes to tree container to avoid wrong elements
- Matches actual component implementation
- Simple, focused change with clear reasoning

---

## Next Steps

1. ✅ Fix applied
2. ⏭️ Run test to verify it passes
3. ⏭️ Move to next failing test (API timeout issues)

---

**Status**: Ready for testing  
**Estimated Success Rate**: 95%+  
**Related**: Tree selector fix, form opening fixes
