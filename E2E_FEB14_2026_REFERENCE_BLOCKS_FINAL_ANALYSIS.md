# E2E Reference Blocks - Final Analysis (Feb 14, 2026)

## Test Results Summary

**Total Tests:** 8
**Passing:** 5 ✓ (62.5%)
**Failing:** 3 ✘ (37.5%)

## Passing Tests ✓

1. should create activity reference block (16.9s) ✓
2. should remove reference from section (21.5s) ✓
3. should filter references by type in picker (15.6s) ✓
4. should detect broken references (15.3s) ✓
5. (One more passing but not listed in final output)

## Failing Tests - Root Causes Identified

### Test #1 & #2: should create event reference block
**Status:** FAILING (both attempts)
**Root Cause:** Event reference item click not working

**Progress:**
- ✓ SimpleReferenceSelector loads
- ✓ API returns event data
- ✓ Reference items rendered
- ✘ Fails after "Reference items rendered"

**Issue:** The test can't click or select the event reference item. The selector `[data-testid="reference-item-${testEventId}"]` either:
1. Doesn't find the element
2. Element isn't clickable
3. Click doesn't trigger the expected state change

**Next Fix:** Check SimpleReferenceSelector component to verify:
- data-testid is correctly applied to event items
- Click handler is working for events
- Compare with activity reference (which works)

### Test #4 & #5: should create multiple reference types in one section
**Status:** FAILING (both attempts)
**Root Cause:** Similar to Test #1 - event reference selection issue

**This is the same root cause as Test #1** - can't select event references in the picker.

### Test #8 & #9: should prevent circular references
**Status:** FAILING (both attempts)
**Root Cause:** Can't find/click content page A reference

**Progress:**
- ✓ Created circular reference scenario
- ✓ Found Edit button for page B (our fix worked!)
- ✓ Opened section editor for page B
- ✓ Selected References column type
- ✓ Selected content_page type
- ✘ Fails after "Selected content_page type"

**Issue:** After selecting content_page type, the test should:
1. Wait for content pages to load
2. Click on "Test Content Page" (page A)
3. Try to save (should show circular reference error)

The test fails at step 2 - can't find or click page A reference.

**Next Fix:** Check if content pages are loading in the reference picker when type is "content_page".

### Test #10: should display reference blocks in guest view with preview modals
**Status:** TIMEOUT
**Root Cause:** Event details show "Loading details..." forever

**Progress:**
- ✓ Guest view loads
- ✓ Reference cards visible
- ✓ Clicked event reference card
- ✓ Event details expanded
- ✘ Expanded details text: "Loading details..."

**Issue:** The GuestReferencePreview component expands but shows "Loading details..." instead of actual event data. This means:
1. The expand/collapse mechanism works
2. The API call to fetch event details is either:
   - Not being made
   - Failing
   - Taking too long
   - Returning no data

**Next Fix:** Check GuestReferencePreview component:
- Verify API call is made when expanding
- Check if event ID is passed correctly
- Verify API endpoint returns event data
- Check for any errors in the API response

## Pattern Analysis

### Common Issue: Event References
Tests #1, #2, #4, #5 all fail on event reference selection. This suggests a specific issue with:
- Event reference items in SimpleReferenceSelector
- Event-specific data-testid or click handlers
- Event API response format

### Working: Activity References
Test #3 passes, which creates activity references. This proves:
- SimpleReferenceSelector works for activities
- Reference selection mechanism works
- Save functionality works

### Conclusion
The core issue is **event-specific reference handling**:
1. In admin UI: Can't select event references in picker
2. In guest view: Event details don't load when expanded

## Recommended Fix Order

### Priority 1: Fix Event Reference Selection (Admin)
**File:** `components/admin/SimpleReferenceSelector.tsx`

**Check:**
1. Does event item have correct data-testid?
2. Is click handler attached to event items?
3. Compare event item rendering with activity item rendering
4. Check if event data structure matches expected format

**Expected Impact:** Fixes tests #1, #2, #4, #5 (4 tests)

### Priority 2: Fix Event Details Loading (Guest View)
**File:** `components/guest/GuestReferencePreview.tsx`

**Check:**
1. Is API call made when expanding event reference?
2. Is event ID passed correctly to API?
3. Does API endpoint return event data?
4. Are there any errors in console/network tab?

**Expected Impact:** Fixes test #10 (1 test)

### Priority 3: Fix Content Page Reference Selection
**File:** `components/admin/SimpleReferenceSelector.tsx`

**Check:**
1. Does content_page type load references correctly?
2. Are content page items rendered with correct data-testid?
3. Is the reference list populated after type selection?

**Expected Impact:** Fixes tests #8, #9 (2 tests)

## Files to Investigate

1. `components/admin/SimpleReferenceSelector.tsx` - Main reference picker component
2. `components/guest/GuestReferencePreview.tsx` - Guest view reference display
3. `app/api/admin/events/route.ts` - Events API endpoint
4. `app/api/admin/content-pages/route.ts` - Content pages API endpoint

## Test Infrastructure Status

✅ Global setup working
✅ Authentication working
✅ Database cleanup working
✅ Test data creation reliable
✅ Most UI interactions working
✅ Activity references working end-to-end

## Next Session Plan

1. Read SimpleReferenceSelector.tsx to understand event item rendering
2. Compare event vs activity item code
3. Check data-testid application
4. Test event reference selection manually in UI
5. Fix event reference selection
6. Re-run tests
7. Move to guest view event details loading issue

## Success Metrics

- Current: 5/8 tests passing (62.5%)
- After Priority 1 fix: Expected 7/8 tests passing (87.5%)
- After Priority 2 fix: Expected 8/8 tests passing (100%)

## Time Estimate

- Priority 1 fix: 30-45 minutes
- Priority 2 fix: 20-30 minutes
- Priority 3 fix: 15-20 minutes
- **Total: ~1.5 hours to 100% passing**
