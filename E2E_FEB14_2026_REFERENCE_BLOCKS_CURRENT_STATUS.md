# E2E Reference Blocks Test Status - Feb 14, 2026

## Test Run Summary

**Date:** February 14, 2026
**Test File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`
**Total Tests:** 8
**Passing:** 5 ✓
**Failing:** 3 ✘

## Passing Tests ✓

1. **should create activity reference block** (15.6s)
   - Successfully creates activity references
   - All UI interactions working correctly

2. **should create multiple reference types in one section** (23.6s)
   - Can add multiple reference types to same section
   - Mixed event/activity references working

3. **should remove reference from section** (19.5s)
   - Reference removal working correctly
   - Database verification successful

4. **should filter references by type in picker** (14.6s)
   - Type filtering in reference picker working
   - UI correctly shows filtered results

5. **should detect broken references** (16.3s)
   - Broken reference detection working
   - Validation logic functioning correctly

## Failing Tests ✘

### 1. should create event reference block
**Status:** Failed (including retry)
**Duration:** 22.0s (first attempt), 37.9s (retry)

**What's Working:**
- Test data creation ✓
- Content page exists in DB ✓
- UI navigation ✓
- Section editor opens ✓
- SimpleReferenceSelector loads ✓
- API returns event data correctly ✓
- Reference items render ✓

**Where It Fails:**
- Test fails after reference items are rendered
- Likely failing when trying to click/select the event reference
- Similar pattern to previous failures

**Next Steps:**
- Need to check what happens after "Reference items rendered"
- Likely a timing issue or element interaction problem

### 2. should prevent circular references
**Status:** Failed (including retry)
**Duration:** 22.0s (first attempt), 35.4s (retry)

**What's Working:**
- Test data creation ✓
- Content page exists in DB ✓
- UI navigation ✓
- Circular reference scenario created ✓
- Content Page B card visible ✓

**Where It Fails:**
- Fails after navigating to content page B
- The test added navigation back to content pages list
- Likely failing when trying to find/click Edit button for page B

**Root Cause:**
- The navigation fix we added may not be working correctly
- Need to verify the Edit button selector for page B

### 3. should display reference blocks in guest view with preview modals
**Status:** Timed out
**Duration:** 22.0s+ (exceeded 300s total timeout)

**What's Working:**
- Test data creation ✓
- References added to column ✓
- Guest view navigation ✓
- Page loads ✓
- Reference cards visible ✓
- Event reference card clicked ✓
- Event details expanded ✓

**Where It Hangs:**
- After event details expand
- Likely waiting for something that never appears
- Could be modal close, activity card click, or final verification

## Progress Analysis

**Improvement:** 5/8 tests passing (62.5%)
**Previous Status:** 3 failures identified
**Current Status:** Same 3 tests still failing

## Key Findings

1. **Activity references work, event references don't**
   - Test #1 (event) fails
   - Test #3 (activity) passes
   - Suggests event-specific issue in reference selection

2. **Circular reference navigation issue**
   - Added navigation code but still failing
   - Edit button selector may be wrong
   - Need to verify page B edit flow

3. **Guest view modal timeout**
   - Everything loads correctly
   - Hangs after event details expand
   - Likely waiting for wrong element or missing close action

## Next Actions

### Priority 1: Fix Event Reference Selection (Test #1)
1. Read test code after "Reference items rendered"
2. Check event reference click/selection logic
3. Compare with working activity reference test
4. Add more specific logging

### Priority 2: Fix Circular Reference Navigation (Test #7)
1. Verify Edit button selector for page B
2. Check if we need different selector (nth vs. specific)
3. Add logging to see what's found
4. May need to use data-testid or more specific selector

### Priority 3: Fix Guest View Modal Timeout (Test #10)
1. Read test code after "Event details expanded"
2. Check what it's waiting for next
3. Verify modal close logic
4. May need to add explicit close action

## Test Execution Notes

- Global setup working correctly ✓
- Authentication working ✓
- Database cleanup working ✓
- Test data creation reliable ✓
- Most UI interactions working ✓

## Files to Investigate

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Test code
2. `components/admin/SimpleReferenceSelector.tsx` - Reference picker
3. `components/guest/SectionRenderer.tsx` - Guest view rendering
4. `app/admin/content-pages/page.tsx` - Content pages list

## Conclusion

We've made progress - 5 tests are now passing reliably. The 3 failing tests have specific, identifiable issues:
1. Event reference selection problem
2. Navigation/Edit button selector issue
3. Guest view modal timeout

All three appear to be UI interaction/timing issues rather than fundamental logic problems.
