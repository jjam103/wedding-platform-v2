# E2E Reference Blocks - Progress Update (Feb 14, 2026)

## Current Status

**Tests Passing:** 5/8 (62.5%) - BACK TO BASELINE ✓
**Tests Failing:** 3/8 (37.5%)

## What We Fixed

### Fix #1: Test #1 (Event Reference Click) ✅ SUCCESSFUL
- Multi-strategy click now works
- Test passes consistently using text-based selection
- Event references can be created successfully

### Fix #2: Test #3 (Multiple References) ⚠️ PARTIAL
- Added coordinate-based clicking
- Added wait for DOM stabilization between selections
- **Still failing** - items not found by data-testid

### Fix #3: Test #7 (Circular References) ⚠️ PARTIAL  
- Improved item loading detection
- Added coordinate-based clicking
- **Still failing** - items not found by data-testid

## Root Cause Analysis

### The Real Problem: data-testid Not Found

Looking at the test output:
```
✓ Found 3 reference items  ← Items ARE rendering!
TimeoutError: locator.boundingBox: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-testid="reference-item-{id}"]')  ← But can't find by data-testid!
```

**This means:**
1. Items ARE rendering (count shows 3 items)
2. But `[data-testid="reference-item-{id}"]` selector doesn't find them
3. Either:
   - data-testid attribute is missing
   - ID format is different
   - Items are rendered but not with the expected structure

### Why Test #1 Works But Test #3 Doesn't

**Test #1 (Event Reference - Single Selection):**
- Uses text-based selector: `button:has-text("Test Event for References")`
- This works because it doesn't rely on data-testid
- ✅ PASSES

**Test #3 (Multiple References):**
- Uses data-testid selector: `[data-testid="reference-item-${testEventId}"]`
- This fails because data-testid might not be present or ID is wrong
- ✘ FAILS

## Next Steps

### Priority 1: Investigate data-testid Issue
1. Check if SimpleReferenceSelector actually renders data-testid
2. Verify the ID format matches what we're looking for
3. Check if items are rendered differently after type selection

### Priority 2: Use Text-Based Selectors
If data-testid is unreliable, switch to text-based selectors:
```typescript
// Instead of:
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);

// Use:
const eventItem = page.locator('button:has-text("Test Event for References")').first();
```

### Priority 3: Fix Guest View API (Test #10)
The event details API is returning "Details could not be loaded". This is likely:
1. RLS policy blocking anon access
2. Wrong API endpoint
3. Missing event data in response

## Test Results Summary

### ✅ PASSING (5/8)
1. should create event reference block ✓
2. should create activity reference block ✓
5. should remove reference from section ✓
6. should filter references by type in picker ✓
9. should detect broken references ✓

### ✘ FAILING (3/8)
3. should create multiple reference types in one section ✘
   - **Issue:** Can't find event item by data-testid
   - **Fix:** Use text-based selector instead

7. should prevent circular references ✘
   - **Issue:** Can't find content page item by data-testid
   - **Fix:** Use text-based selector instead

10. should display reference blocks in guest view ✘
   - **Issue:** Event details API returns "Details could not be loaded"
   - **Fix:** Check RLS policies or API endpoint

## Recommended Immediate Action

**Switch to text-based selectors for all reference selections:**

```typescript
// For event references:
const eventItem = page.locator('button:has-text("Test Event for References")').first();

// For activity references:
const activityItem = page.locator('button:has-text("Test Activity for References")').first();

// For content page references:
const contentPageItem = page.locator('button:has-text("Test Content Page")').first();
```

This approach:
- ✅ Works for Test #1 (proven)
- ✅ More resilient to DOM changes
- ✅ Doesn't depend on data-testid attribute
- ✅ Matches how users interact with the UI

## Time Estimate

- **Fix Tests #3 and #7:** 15-20 minutes (switch to text selectors)
- **Fix Test #10:** 20-30 minutes (investigate API/RLS)
- **Total:** 35-50 minutes to 100% passing

## Conclusion

We're back to baseline (5/8 passing). The remaining failures are all related to selector strategy - data-testid isn't reliable for these items. Switching to text-based selectors (which already works for Test #1) should fix Tests #3 and #7 quickly. Test #10 requires API/RLS investigation.

**Status:** On track to reach 100% passing ✓
