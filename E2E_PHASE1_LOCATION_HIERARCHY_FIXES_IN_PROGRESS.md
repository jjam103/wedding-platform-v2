# E2E Phase 1: Location Hierarchy Tests - Fixes In Progress

**Date**: February 9, 2026  
**Status**: 🔧 Fixing - Root Cause Identified and Partially Fixed  
**Tests Fixed**: 0/4 (0% - but making progress)

---

## Current Status

### Root Cause Identified ✅

The primary issue was that `waitForApiResponse()` was being called AFTER the button click, which meant it was waiting for an API call that had already happened. 

**Solution Applied**:
```typescript
// ❌ WRONG - Waits for response that already happened
await submitButton.click();
await waitForApiResponse(page, '/api/admin/locations');

// ✅ CORRECT - Sets up listener BEFORE clicking
const createResponsePromise = page.waitForResponse(
  response => response.url().includes('/api/admin/locations') && response.request().method() === 'POST',
  { timeout: 15000 }
);
await submitButton.click();
await createResponsePromise;
```

### Progress Made

1. ✅ **API calls are now working** - Locations are being created successfully
2. ✅ **First location (country) appears in tree** - Visible after creation
3. ❌ **Child locations not visible** - Need to expand parent nodes first

### Current Failure

**Test**: "should create hierarchical location structure"  
**Error**: `expect(regionRow).toBeVisible()` - Region not found in tree

**Why**: The region is created successfully (API returns 201), but it's a child of the country node which is collapsed by default. The test tries to expand the country AFTER creating the region, but the region won't be visible until the country is expanded.

---

## Next Steps

### Fix 1: Expand Parent Before Checking Child

The test needs to:
1. Create country → Wait for it to appear
2. **Expand the country node**
3. Create region → Wait for API
4. Check if region is visible (should now be visible since parent is expanded)

### Fix 2: Alternative - Check After Expanding

Or we could:
1. Create country → Wait for API
2. Create region → Wait for API  
3. **Then expand country**
4. Check if region is visible

The second approach is better because it tests the actual user flow - create all locations, then navigate the tree.

---

## Files Modified

1. `__tests__/e2e/admin/dataManagement.spec.ts` - Fixed API response waiting pattern
2. `E2E_PHASE1_LOCATION_HIERARCHY_FIXES_IN_PROGRESS.md` - This file

---

## Test Results

```
Running 4 tests:
❌ should create hierarchical location structure - Region not visible (needs parent expansion)
❌ should prevent circular reference - Same issue (needs to create locations first)
❌ should expand/collapse tree - Needs locations to exist first
❌ should delete location - Same pattern as others
```

All tests are failing at the same point - trying to interact with child locations that aren't visible because parent nodes are collapsed.

---

## Recommended Fix

Update the test to expand parent nodes BEFORE creating child locations, or create all locations first and then expand to verify:

```typescript
// Create country
await createLocation(countryName);
await expect(countryRow).toBeVisible();

// Expand country BEFORE creating region
await expandNode(countryName);

// Create region
await createLocation(regionName, countryName);
await expect(regionRow).toBeVisible(); // Should now be visible

// Expand region BEFORE creating city
await expandNode(regionName);

// Create city
await createLocation(cityName, regionName);
await expect(cityRow).toBeVisible(); // Should now be visible
```

---

## Key Learning

**Playwright best practice**: When waiting for API responses, always set up the listener BEFORE triggering the action that causes the API call. Using `page.waitForResponse()` directly instead of a helper function gives more control over timing.

---

## Next Action

Apply the fix to expand parent nodes before checking for child visibility, then re-run tests.
