# E2E Reference Blocks - Baseline Comparison & Root Cause Analysis
**Date**: February 14, 2026
**Status**: ⚠️ REGRESSION - Went from 4/8 passing (50%) to 3/8 passing (37.5%)

## Executive Summary

The user was correct - we had **4 tests passing consistently** before our fixes, not 3. Our "fixes" actually made things worse:
- **Before fixes**: 4/8 passing (50%)
- **After fixes**: 3/8 passing (37.5%)
- **Regression**: Lost 1 passing test (-12.5%)

## Baseline (Feb 13, 2026 - Before Our Fixes)

From `E2E_FEB13_2026_REFERENCE_BLOCKS_FIX_STATUS.md`:

### ✅ Passing Tests (4/8 = 50%)
1. **should create activity reference block** - ✓ Passed (18.5s)
2. **should create multiple reference types in one section** - ✓ Passed (19.2s)
3. **should filter references by type in picker** - ✓ Passed (17.8s)
4. **should detect broken references** - ✓ Passed (16.4s)

### ❌ Failing Tests (4/8 = 50%)
1. **should create event reference block** - ❌ Failed (44.3s) - Flaky timing issue
2. **should remove reference from section** - ❌ Failed (22.1s) - Remove button not working
3. **should prevent circular references** - ❌ Failed (38.7s) - Edit button not found
4. **should display reference blocks in guest view** - ❌ Failed (29.5s) - References not visible

## Current Status (Feb 14, 2026 - After Our Fixes)

From `E2E_FEB14_2026_REFERENCE_BLOCKS_TEST_RUN_RESULTS.md`:

### ✅ Passing Tests (3/8 = 37.5%)
1. **should create activity reference block** - ✓ Passed
2. **should create multiple reference types in one section** - ✓ Passed
3. **should detect broken references** - ✓ Passed

### ❌ Failing Tests (5/8 = 62.5%)
1. **should create event reference block** - ❌ Failed (timeout after items render)
2. **should remove reference from section** - ❌ Failed (timeout waiting for save)
3. **should filter references by type in picker** - ❌ Failed (items not appearing) **← REGRESSION**
4. **should prevent circular references** - ❌ Failed (Edit button not found)
5. **should display reference blocks in guest view** - ❌ Failed (API returning "Loading details...")

## What Went Wrong

### Regression: Test #7 (Filter by type)
**Before**: ✅ Passing (17.8s)
**After**: ❌ Failing (timeout)
**Our "Fix"**: Added wait for API response, wait for loading spinner, retry logic
**Result**: Made it worse - items no longer appear at all

### Tests That Got Worse
1. **Test #1 (Create event reference)**: Still failing, but now with different symptoms
2. **Test #4 (Create multiple types)**: Still passing, but our fixes didn't help
3. **Test #6 (Remove reference)**: Still failing, our fixes didn't help
4. **Test #9 (Circular references)**: Still failing, our fixes didn't help
5. **Test #12 (Guest view)**: Still failing, our fixes didn't help

## Root Cause Analysis

### Why Our Fixes Failed

1. **We Made Assumptions Without Reading Tests**
   - We assumed tests were failing due to timing issues
   - We added waits and retries without understanding what tests actually do
   - We didn't verify our assumptions against actual test code

2. **We Fixed Symptoms, Not Root Causes**
   - Test #7 was passing before - it didn't need timing fixes
   - Our "comprehensive timing fixes" broke a working test
   - We added complexity that introduced new bugs

3. **We Didn't Verify Baseline**
   - We assumed 3 tests were passing
   - User correctly pointed out it was 4 tests
   - We didn't check previous documentation before making changes

## What Tests Actually Do (From Reading Test Code)

### Test #1: Create Event Reference Block (FAILING)
**What it does**:
1. Opens section editor
2. Selects "References" column type
3. Selects "event" from type dropdown
4. Waits for API response
5. Waits for items to render
6. Clicks on specific event using `data-testid="reference-item-{testEventId}"`
7. Verifies reference appears
8. Clicks "Save Section"
9. Waits for save to complete
10. Verifies reference saved in database

**Why it's failing**: Test times out after items render, suggesting it's not completing steps 6-10

### Test #4: Create Multiple Reference Types (PASSING)
**What it does**: Same as Test #1, but adds both event and activity references

**Why it's passing**: Unknown - needs investigation

### Test #6: Remove Reference from Section (FAILING)
**What it does**:
1. Adds reference to section via database
2. Reloads page
3. Opens section editor
4. Finds remove button with `aria-label="Remove reference"`
5. Clicks remove button
6. Verifies reference removed from UI
7. Clicks "Save Section"
8. Verifies reference removed from database

**Why it's failing**: Test times out waiting for save, suggesting step 7-8 not completing

### Test #7: Filter References by Type (REGRESSION - WAS PASSING)
**What it does**:
1. Opens section editor
2. Selects "References" column type
3. Selects "event" from type dropdown
4. Waits for API response
5. Waits for loading spinner to disappear
6. Waits for items to render
7. Verifies event item visible
8. Verifies activity item NOT visible

**Why it's failing now**: Our "comprehensive timing fixes" broke it - items no longer appear

### Test #9: Prevent Circular References (FAILING)
**What it does**:
1. Creates Content Page A → Content Page B reference via database
2. Navigates to Content Page B
3. Finds "Test Content Page B" card
4. Finds Edit button within that card (uses two selector strategies)
5. Clicks Edit button
6. Opens section editor
7. Tries to add reference back to Content Page A (would create cycle)
8. Clicks Save
9. Verifies circular reference error appears

**Why it's failing**: Can't find Edit button for Content Page B (step 4)

### Test #12: Guest View Preview (FAILING)
**What it does**:
1. Adds references to section via database
2. Navigates to guest view `/custom/{slug}`
3. Waits for page container to load
4. Waits for page title
5. Waits for references container
6. Verifies reference cards visible
7. Clicks on event reference card
8. Verifies inline expansion shows details
9. Clicks to collapse
10. Repeats for activity reference

**Why it's failing**: API returning "Loading details..." instead of actual data

## The Real Issues

### Issue #1: Tests Not Completing Full Workflow
Tests #1, #4, #6 are timing out, suggesting they're not completing the full workflow. This is NOT a selector issue - it's a workflow issue.

**Hypothesis**: Tests are missing steps or have incorrect expectations about what happens after certain actions.

### Issue #2: Our "Fix" Broke Test #7
Test #7 was working fine. Our timing fixes broke it. We need to revert our changes to Test #7.

### Issue #3: Test #9 Has UI Mismatch
The test expects to find an Edit button within a card containing "Test Content Page B", but the actual UI structure is different.

**Hypothesis**: Content pages use a different card layout than tests expect.

### Issue #4: Test #12 Has API Issue
The API route `/api/admin/references/[type]/[id]` is returning "Loading details..." instead of actual data.

**Hypothesis**: We made the route public (removed auth), but there's another issue preventing data from loading.

## Next Steps (Correct Approach)

### Step 1: Revert Our Changes to Test #7
Our "comprehensive timing fixes" broke a working test. Revert them.

### Step 2: Run Tests Individually with --debug
Run each failing test individually to see what's actually happening:
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:XXX --debug
```

### Step 3: Use Playwright UI Mode
Open tests in UI mode to step through and see what's happening:
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --ui
```

### Step 4: Manual Testing
Open the admin UI and manually follow the test steps to understand actual behavior.

### Step 5: Fix Real Bugs, Not Test Selectors
Focus on fixing actual application bugs, not just making tests pass with better selectors.

## Key Lessons

1. **Always verify baseline before making changes**
2. **Read test code before making assumptions**
3. **Don't fix symptoms - fix root causes**
4. **Test your fixes - don't assume they work**
5. **If a test was passing, don't "fix" it**

## Success Criteria

- ✅ Revert changes that broke Test #7
- ✅ Get back to 4/8 passing (50% baseline)
- ✅ Understand why tests are failing (not just guess)
- ✅ Fix actual bugs in application (not just test selectors)
- ✅ Get to 8/8 passing (100%)

## Files to Investigate

### For Test #1 (Event Reference Creation)
- `components/admin/SimpleReferenceSelector.tsx` - Why aren't items clickable?
- `components/admin/InlineSectionEditor.tsx` - Why isn't save completing?

### For Test #6 (Remove Reference)
- `components/admin/SimpleReferenceSelector.tsx` - Remove button handler
- `app/api/admin/sections/[id]/route.ts` - Save handler

### For Test #7 (Filter by Type) - REVERT OUR CHANGES
- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Line 652 - Revert timing fixes

### For Test #9 (Circular References)
- `app/admin/content-pages/page.tsx` - Card layout structure
- Manual testing to understand actual UI

### For Test #12 (Guest View)
- `app/api/admin/references/[type]/[id]/route.ts` - Why returning "Loading details..."?
- `components/guest/GuestReferencePreview.tsx` - Data fetching logic

## Conclusion

We made the test suite worse by making speculative fixes without understanding the actual problems. The user was right to question our approach. We need to:

1. Revert our changes
2. Get back to baseline (4/8 passing)
3. Understand actual test logic
4. Fix real bugs, not test selectors
5. Verify fixes work before claiming success
