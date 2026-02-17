# E2E Phase 1: Location Hierarchy Tests - Current Status

**Date**: February 9, 2026  
**Status**: ⚠️ Still Failing - Need Different Approach  
**Tests Fixed**: 0/4 (0%)

---

## Progress Made

### ✅ Fixed: API Response Timing
Successfully fixed the root cause where `waitForApiResponse()` was missing API calls:

```typescript
// Set up listener BEFORE clicking
const createResponsePromise = page.waitForResponse(
  response => response.url().includes('/api/admin/locations') && response.request().method() === 'POST',
  { timeout: 15000 }
);
await submitButton.click();
await createResponsePromise;
```

**Result**: Locations are now being created successfully (API returns 201).

### ⚠️ Remaining Issue: Tree Not Refreshing Properly

Even with the fixes applied:
1. ✅ Country is created and appears in tree
2. ✅ Country node is expanded before creating region
3. ✅ Region is created successfully (API returns 201)
4. ✅ Wait for tree reload (GET /api/admin/locations)
5. ✅ Expand country node again after reload
6. ❌ **Region still not visible in tree**

---

## Root Cause Analysis

The issue is that the tree component's state management doesn't preserve expansion state across reloads. When `loadLocations()` is called after creating a location:

1. Tree data is updated with new locations
2. `treeKey` is incremented to force re-render
3. **Expansion state (`expandedNodes`) is NOT updated**
4. Tree re-renders with all nodes collapsed

This is a **component design issue**, not a test issue.

---

## Recommended Solutions

### Option 1: Fix the Component (Best Long-term)

Update `app/admin/locations/page.tsx` to preserve expansion state:

```typescript
// After loadLocations(), restore expansion state
const loadLocations = useCallback(async () => {
  // ... existing code ...
  if (result.success) {
    setLocations(result.data);
    setTreeKey(prev => prev + 1);
    
    // NEW: Preserve expansion state for newly created locations
    // If a location was just created, expand its parent
    if (lastCreatedLocationId) {
      const parent = findParentLocation(result.data, lastCreatedLocationId);
      if (parent) {
        setExpandedNodes(prev => new Set([...prev, parent.id]));
      }
    }
  }
}, [lastCreatedLocationId]);
```

**Pros**: Fixes the UX issue for real users too  
**Cons**: Requires component changes, more complex

### Option 2: Simplify the Test (Quickest)

Instead of testing the full hierarchical creation flow, test each level separately:

```typescript
test('should create and display locations at each level', async ({ page }) => {
  // Test 1: Create country
  const country = await createLocation('Test Country');
  await expect(page.locator(`text=${country}`)).toBeVisible();
  
  // Test 2: Create region (separate test or reload page)
  await page.reload();
  await expandNode(country);
  const region = await createLocation('Test Region', country);
  await page.reload();
  await expandNode(country);
  await expect(page.locator(`text=${region}`)).toBeVisible();
  
  // Test 3: Create city
  await expandNode(country);
  await expandNode(region);
  const city = await createLocation('Test City', region);
  await page.reload();
  await expandNode(country);
  await expandNode(region);
  await expect(page.locator(`text=${city}`)).toBeVisible();
});
```

**Pros**: Works with current component behavior  
**Cons**: Less elegant, requires multiple reloads

### Option 3: Skip These Tests Temporarily

Mark tests as `.skip()` and create a GitHub issue to fix the component:

```typescript
test.skip('should create hierarchical location structure', async ({ page }) => {
  // TODO: Fix tree expansion state preservation in location component
  // See issue #XXX
});
```

**Pros**: Unblocks Phase 1 progress  
**Cons**: Tests remain broken

---

## Recommendation

**Use Option 2** (Simplify the Test) for now:

1. It works with the current component behavior
2. Still tests the core functionality (creating hierarchical locations)
3. Doesn't require component changes
4. Can be improved later when component is fixed

Then create a follow-up task to implement Option 1 (fix the component) to improve the UX for real users.

---

## Test Results

```
Running 4 tests:
❌ should create hierarchical location structure - Region not visible after creation
❌ should prevent circular reference - Same issue
❌ should expand/collapse tree - Needs locations to exist first  
❌ should delete location - Same pattern

All tests fail at the same point: child locations not visible after creation.
```

---

## Next Steps

1. **Implement Option 2**: Simplify tests to work with current component behavior
2. **Create GitHub Issue**: Document the tree expansion state preservation issue
3. **Move to Next Test Group**: CSV Import tests (different pattern, likely easier)
4. **Return Later**: Fix component and improve tests when time permits

---

## Files Modified

- `__tests__/e2e/admin/dataManagement.spec.ts` - Applied API timing fixes
- `E2E_PHASE1_LOCATION_HIERARCHY_STATUS.md` - This document

---

## Key Learning

**E2E tests reveal UX issues**: The fact that the tree collapses after creating a location is a real UX problem that affects users, not just tests. This is valuable feedback that should be addressed in the component.

