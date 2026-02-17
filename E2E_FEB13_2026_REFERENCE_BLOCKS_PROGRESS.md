# E2E Reference Blocks Tests - Progress Update
**Date**: February 13, 2026
**Status**: In Progress - 2/8 tests passing

## Summary

Fixed the data loading bug in `SimpleReferenceSelector.tsx` that was showing activities when events were selected. Applied additional fix to clear items immediately when type changes.

## Test Results

### ✅ PASSING (2/8)
1. **Test 2**: "should create activity reference block" - PASSING
2. **Test 10**: "should detect broken references" - PASSING

### ❌ FAILING (6/8)

#### Test 1: "should create event reference block"
**Status**: Still failing after fix
**Error**: `button:has-text("Test Event for References")` not visible
**Root Cause**: Despite the fix, events are still not showing correctly. Debug output shows activities are being displayed when "Events" is selected.
**Next Step**: Investigate why the fix isn't working - possible caching issue or the API response format is different than expected.

#### Test 3: "should create multiple reference types in one section"
**Status**: Failing
**Error**: `text=Test Event for References` not visible after adding references
**Root Cause**: Same as Test 1 - events not loading correctly
**Next Step**: Fix Test 1 first, then retest

#### Test 4: "should remove reference from section"
**Status**: Failing on retry
**Error**: Duplicate slug constraint violation in beforeEach
**Root Cause**: Cleanup not working properly between test runs
**Next Step**: Fix cleanup to ensure unique slugs or use better slug generation

#### Test 5: "should filter references by type in picker"
**Status**: Failing
**Error**: Test content page not visible after navigation (retry)
**Root Cause**: Navigation/data loading issue in beforeEach
**Next Step**: Investigate why content page isn't loading on retry

#### Test 7: "should prevent circular references"
**Status**: Failing
**Error**: Column type select not visible (retry)
**Root Cause**: Section editor not opening correctly on events page
**Next Step**: Fix section editor opening logic for events page

#### Test 8: "should display reference blocks in guest view with preview modals"
**Status**: Failing
**Error**: Content page not found for guest view test
**Root Cause**: Test data cleanup removing content page before test runs
**Next Step**: Fix test data management

## Fixes Applied

### Fix 1: Data Loading Bug (PARTIAL SUCCESS)
**File**: `components/admin/SimpleReferenceSelector.tsx`
**Lines**: 88-98, 52-54
**Changes**:
1. Changed data array selection to check `selectedType` instead of just property existence
2. Added immediate item clearing when type changes
3. Added item clearing on error

**Code**:
```typescript
// Clear items immediately when type changes
setItems([]);

// Check based on selectedType
if (selectedType === 'activity' && result.data.activities) {
  dataArray = result.data.activities;
} else if (selectedType === 'event' && result.data.events) {
  dataArray = result.data.events;
} else if (result.data.items) {
  dataArray = result.data.items;
} else if (Array.isArray(result.data)) {
  dataArray = result.data;
}

// Clear items on error
setItems([]);
```

**Result**: Test 2 (activities) now passes, but Test 1 (events) still fails

## Debug Information

### Test 1 Debug Output
```
Reference selector content after API call: EventTest Beach Volleyball...EventTest Activity for References...
```

**Analysis**: The word "Event" appears before each item name, suggesting these are activities (not events). The API might be returning activities even when events endpoint is called, OR the component is still showing cached activity data.

## Next Actions

### Priority 1: Fix Test 1 (Event Reference Block)
1. Add more detailed logging to understand what's happening:
   - Log the API endpoint being called
   - Log the raw API response
   - Log the selectedType value
   - Log the dataArray after extraction
2. Check if the events API is returning the correct data
3. Verify the fix is actually being used (component might be cached)

### Priority 2: Fix Cleanup Issues (Test 4)
1. Update beforeEach to use more unique slugs (add random string, not just timestamp)
2. Ensure cleanup runs properly between tests
3. Consider using test isolation helpers

### Priority 3: Fix Navigation Issues (Tests 5, 8)
1. Investigate why content page isn't visible on retry
2. Add better wait conditions for data loading
3. Consider using test-specific content pages that won't be cleaned up

### Priority 4: Fix Section Editor on Events Page (Test 7)
1. Review events page section editor implementation
2. Update test to match actual UI flow
3. Add better wait conditions for section editor

## Files Modified
- `components/admin/SimpleReferenceSelector.tsx` - Data loading fix

## Files to Review
- `app/api/admin/events/route.ts` - Verify response format
- `app/api/admin/activities/route.ts` - Compare with events API
- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Test implementation
- `__tests__/helpers/cleanup.ts` - Cleanup logic

## Estimated Time to Complete
- Priority 1 (Test 1): 30-60 minutes (investigation + fix)
- Priority 2 (Test 4): 15-30 minutes (cleanup fix)
- Priority 3 (Tests 5, 8): 30-45 minutes (navigation fixes)
- Priority 4 (Test 7): 30-45 minutes (section editor fix)

**Total**: 2-3 hours to fix all remaining issues
