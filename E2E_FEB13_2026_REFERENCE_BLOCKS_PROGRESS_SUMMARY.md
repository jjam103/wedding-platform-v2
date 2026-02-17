# E2E Reference Blocks Tests - Progress Summary

**Date**: February 13, 2026  
**Status**: 🔄 IN PROGRESS - Major fixes applied, tests progressing  
**Test File**: `__tests__/e2e/admin/referenceBlocks.spec.ts`

## Fixes Applied

### Fix 1: Navigation Check (✅ COMPLETE)
**Problem**: All tests failing with "Test content page not visible after navigation"  
**Root Cause**: Text selector couldn't match "Test Content Page" due to HTML rendering  
**Solution**: Changed from text-based selector to button-based selector  
**Result**: ✅ All tests now pass navigation check

### Fix 2: Section Editor Opening (✅ COMPLETE)
**Problem**: Tests failing when trying to open section editor  
**Root Cause**: Helper function was clicking "Edit" button (opens content page form) instead of "Manage Sections" button  
**Solution**: Removed incorrect "Edit" button click, directly click "Manage Sections"  
**Result**: ✅ Section editor now opens correctly

## Current Test Status

### Tests Progressing to Later Stages
1. ✅ **Navigation check** - All tests pass
2. ✅ **Section editor opening** - All tests pass
3. 🔄 **Reference selector loading** - Tests failing here (current issue)

### Current Failure Point
Tests are now failing at line 207 when trying to find the event/activity items in the reference selector:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('button:has-text("Test Event for References")').first()
```

This means:
- ✅ Test data is created successfully
- ✅ Page navigation works
- ✅ Section editor opens
- ❌ Reference selector doesn't show the test events/activities

## Next Steps

### Issue 3: Reference Selector Not Loading Data
**Symptoms**:
- Section editor opens successfully
- Column type selector is visible
- "References" option is selected
- Type selector (event/activity) is visible
- BUT: No items appear in the list

**Possible Causes**:
1. API call to fetch events/activities is failing
2. RLS policies preventing data access
3. Timing issue - items haven't loaded yet
4. Test data not visible to the authenticated user
5. SimpleReferenceSelector component not fetching data correctly

**Investigation Needed**:
1. Check if API call `/api/admin/references/search` is succeeding
2. Verify RLS policies allow admin user to see test events/activities
3. Add wait for API response before looking for items
4. Check browser console for errors
5. Verify test events/activities are actually created with correct status

### Issue 4: Foreign Key Constraint (Test 7)
**Error**: `insert or update on table "activities" violates foreign key constraint "activities_event_id_fkey"`  
**Cause**: Test 7 deletes the event, then tries to create an activity referencing it  
**Solution**: Recreate the event in Test 7's beforeEach or use a different event

### Issue 5: Guest View References (Test 8)
**Error**: References not visible in guest view  
**Cause**: Unknown - need to investigate guest view rendering  
**Solution**: TBD after investigating

## Test Results Timeline

### Before Any Fixes
- 8/8 tests failing at `beforeEach` line 176
- Error: "Test content page not visible after navigation"
- No tests progressed past navigation

### After Fix 1 (Navigation)
- 8/8 tests pass navigation check
- Tests fail at different stages (section editor, reference selector, etc.)
- Proves navigation fix worked

### After Fix 2 (Section Editor)
- Tests progress past section editor opening
- Tests fail when looking for reference items
- Proves section editor fix worked

### Current Status
- Tests are at the reference selector stage
- Need to fix data loading in reference selector
- Then address remaining issues (foreign key, guest view)

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts`
   - Line 167-177: Fixed navigation check (text → button selector)
   - Line 26-50: Fixed openSectionEditor helper (removed Edit button click)

## Key Learnings

1. **Text Selectors Are Fragile**: HTML can concatenate text without spaces
2. **UI Flow Understanding Is Critical**: Must understand actual button flow
3. **Progressive Debugging**: Fix one issue at a time, verify each fix works
4. **Test Isolation**: Each test should be independent and not affect others

## Proof of Progress

### Evidence 1: Navigation Fix Works
All 8 tests now show page content in logs:
```
Test Content Page/test-page-ref-1771029485138PublishedViewEdit▶ Manage SectionsDelete
```

### Evidence 2: Section Editor Fix Works
Test now fails at line 207 (looking for event item), not at section editor opening.
This proves the section editor is opening successfully.

### Evidence 3: Tests Are Progressing
Before fixes: All tests failed at line 176 (navigation)  
After fixes: Tests fail at line 207 (reference selector)  
This is 31 lines of progress, proving fixes are working.

## Next Actions

1. **Investigate reference selector data loading**
   - Add debug logging to see what's on the page
   - Check API calls in browser network tab
   - Verify RLS policies
   - Add explicit waits for data loading

2. **Fix foreign key constraint in Test 7**
   - Recreate event in test or use different approach

3. **Fix guest view references in Test 8**
   - Investigate why references aren't visible
   - Check guest view rendering logic

4. **Run full suite after all fixes**
   - Verify all 8 tests pass
   - Document final results

## Estimated Completion

- Issue 3 (Reference Selector): 30-60 minutes
- Issue 4 (Foreign Key): 15 minutes
- Issue 5 (Guest View): 30-45 minutes
- Final verification: 15 minutes

**Total**: 1.5-2 hours to complete all fixes
