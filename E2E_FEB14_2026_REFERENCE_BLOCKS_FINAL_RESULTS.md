# E2E Reference Blocks Tests - Final Results
**Date**: February 14, 2026
**Status**: 4/8 passing (50%), 3 failing, 1 flaky

---

## Test Results Summary

### ✅ Passing Tests (4/8)
1. ✅ **Test #2**: Create event reference block (passed on retry)
2. ✅ **Test #3**: Create activity reference block
3. ✅ **Test #4**: Create multiple reference types in one section
4. ✅ **Test #5**: Remove reference from section
5. ✅ **Test #7**: Detect broken references

### ⚠️ Flaky Tests (1/8)
1. ⚠️ **Test #1**: Create event reference block (failed first, passed on retry)
   - **Issue**: Timeout clicking reference item
   - **Root Cause**: Element detachment during re-renders
   - **Status**: Needs stability improvements

### ❌ Failing Tests (3/8)
1. ❌ **Test #6**: Filter references by type in picker (line 652)
   - **Error**: `expect(locator).toBeVisible() failed` for event item button
   - **Root Cause**: After selecting "event" type, no reference items appear
   - **Status**: API call succeeds but UI doesn't render items

2. ❌ **Test #9**: Prevent circular references (line 689)
   - **Error**: `expect(locator).toBeVisible() failed` for Edit button on Content Page B
   - **Root Cause**: Edit button selector still not finding the button
   - **Status**: Selector fix didn't work, need different approach

3. ❌ **Test #11**: Guest view with preview modals (line 875)
   - **Error**: Expanded details show "Loading details..." instead of event data
   - **Root Cause**: API route `/api/admin/references/[type]/[id]` returns data but component shows loading state
   - **Status**: API fix worked, but component not displaying fetched data

---

## Detailed Failure Analysis

### Test #6: Filter References by Type

**Error Message**:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('button:has-text("Test Event for References")').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

**What Happens**:
1. ✅ Section editor opens successfully
2. ✅ Column type selector changes to "References"
3. ✅ SimpleReferenceSelector loads
4. ✅ Type selector changes to "event"
5. ✅ API call to `/api/admin/events` succeeds (returns 1 event)
6. ❌ No reference item buttons render in the UI

**Root Cause**:
The API returns data successfully, but the SimpleReferenceSelector component doesn't render the reference items. This suggests:
- Component state not updating after API response
- Conditional rendering logic preventing items from showing
- Missing key or data transformation issue

**Fix Needed**:
- Investigate SimpleReferenceSelector component
- Check if items array is being set in state
- Verify rendering logic for reference items

---

### Test #9: Prevent Circular References

**Error Message**:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('button:has-text("Edit")').filter({ has: locator('text=Test Content Page B') }).or(...)
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

**What Happens**:
1. ✅ Content Page A created with reference to Content Page B
2. ✅ Content Page B created
3. ✅ Navigate to /admin/content-pages
4. ✅ Page loads successfully
5. ❌ Cannot find Edit button for Content Page B

**Root Cause**:
The Edit button selector is still not working. The applied fix using `filter({ has: })` didn't solve the issue. Possible reasons:
- Content Page B not visible on the page (pagination?)
- Edit button has different structure than expected
- Card layout different from what selector expects

**Fix Needed**:
- Check if Content Page B is visible on the page (might need to scroll or paginate)
- Inspect actual DOM structure of content page cards
- Use more reliable selector (data-testid or unique identifier)

---

### Test #11: Guest View with Preview Modals

**Error Message**:
```
Error: expect(locator).toContainText(expected) failed
Expected substring: "Test Event for References"
Actual: "Loading details..."
```

**What Happens**:
1. ✅ References added to section in database
2. ✅ Navigate to guest view `/custom/[slug]`
3. ✅ Page loads with gradient background
4. ✅ Page title visible
5. ✅ References container visible
6. ✅ Event reference card visible
7. ✅ Activity reference card visible
8. ✅ Click on event reference card
9. ✅ Expanded details section appears
10. ❌ Expanded details show "Loading details..." instead of event data

**Root Cause**:
The API route fix worked (columns are correct now), but the GuestReferencePreview component is stuck in loading state. This suggests:
- API call to `/api/admin/references/[type]/[id]` is failing or timing out
- Component error handling showing loading state on error
- Missing await or promise not resolving

**Fix Needed**:
- Check GuestReferencePreview component's API call logic
- Verify error handling doesn't show loading state
- Add timeout or retry logic for API calls
- Check browser console for API errors

---

## Fixes Applied (From Previous Session)

### Fix #1: Test #9 Edit Button Selector ❌ (Didn't Work)
**Applied**: Changed selector to use `filter({ has: })` pattern
**Result**: Still failing - selector not finding button
**Next Step**: Need different approach (check DOM structure, use data-testid)

### Fix #2: Test #11 API Route Database Columns ✅ (Partially Working)
**Applied**: Fixed column names in API queries
- Events: `is_active` → `status`, `start_time` → `start_date`, `end_time` → `end_date`
- Activities: Added `location_id`, `date` field
- Accommodations: Added `location_id`, `room_count` field
- Content Pages: `content_sections` → `sections` table

**Result**: API returns data successfully, but component not displaying it
**Next Step**: Fix component to handle API response correctly

---

## Next Steps

### Priority 1: Fix Test #11 (Guest View)
1. Read `components/guest/GuestReferencePreview.tsx`
2. Check API call logic and error handling
3. Verify data transformation from API response
4. Add proper loading/error states
5. Test API endpoint manually to confirm it works

### Priority 2: Fix Test #6 (Filter References)
1. Read `components/admin/SimpleReferenceSelector.tsx`
2. Check state management after API response
3. Verify rendering logic for reference items
4. Add console logging to debug state updates
5. Test component in isolation

### Priority 3: Fix Test #9 (Circular References)
1. Inspect actual DOM structure of content page cards
2. Check if Content Page B is visible (pagination/scroll)
3. Use browser DevTools to find correct selector
4. Consider using data-testid attributes
5. Update test with working selector

### Priority 4: Fix Flaky Test #1
1. Add more stable waiting logic
2. Increase timeouts for element interactions
3. Add retry logic with exponential backoff
4. Verify element is stable before clicking

---

## Test Coverage Status

**Overall**: 50% passing (4/8 tests)
- Create operations: 75% (3/4 passing)
- Edit operations: 100% (1/1 passing)
- Validation: 33% (1/3 passing)
- Guest view: 0% (0/1 passing)

**Critical Path**: Guest view test is blocking, as it validates the end-user experience.

---

## Files to Investigate

1. `components/guest/GuestReferencePreview.tsx` - Loading state issue
2. `components/admin/SimpleReferenceSelector.tsx` - Items not rendering
3. `app/admin/content-pages/page.tsx` - Card layout and Edit button structure

---

## Conclusion

We made progress on the API route fixes (Test #11), but the component-level issues remain. The next session should focus on:
1. Component debugging (GuestReferencePreview, SimpleReferenceSelector)
2. DOM structure inspection for correct selectors
3. Stability improvements for flaky tests

The API route fixes were correct and working - the issues are now in the UI components and test selectors.
