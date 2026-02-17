# E2E Reference Blocks - Work Session Summary
**Date**: February 13, 2026
**Status**: In Progress - Fixes Applied, Testing Needed

## What We Were Working On

Fixing the E2E reference blocks tests that were timing out. We had achieved 50% pass rate (4/8 tests) in the previous session, and were working to fix the remaining 4 failing tests.

## Problem Identified

All failing tests were timing out at the same point: trying to find and click the reference item button after the API response loaded.

**Failure Pattern**:
```
✘ should create event reference block (29.0s, retry: 37.6s)
✘ should create activity reference block (29.4s, retry: 34.7s)  
✘ should create multiple reference types in one section (28.9s)
```

## Root Cause

The test was using a fragile selector that relied on exact text matching:
```typescript
const eventItem = page.locator('.p-4.max-h-96 button')
  .filter({ hasText: 'Test Event for References' })
  .first();
```

This selector was:
1. Too specific (exact text match)
2. Not waiting for React rendering to complete
3. Not using semantic test IDs

## Fixes Applied

### Fix 1: Added data-testid to SimpleReferenceSelector

**File**: `components/admin/SimpleReferenceSelector.tsx`

Added test IDs to make buttons easily identifiable:
```typescript
<button
  key={item.id}
  type="button"
  data-testid={`reference-item-${item.id}`}
  data-reference-type={selectedType}
  data-reference-name={item.name}
  className="..."
  onClick={() => handleSelectItem(item)}
>
```

### Fix 2: Updated Test Selectors

**File**: `__tests__/e2e/admin/referenceBlocks.spec.ts`

Updated both event and activity reference tests to:
1. Wait for loading spinner to disappear
2. Wait for reference items to appear
3. Use data-testid with the known entity ID

**Event Reference Test**:
```typescript
// Wait for loading to complete
await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});

// Wait for items to appear
await page.waitForSelector('[data-testid^="reference-item-"]', { timeout: 10000 });

// Click specific item by ID
const eventItem = page.locator(`[data-testid="reference-item-${testData.eventId}"]`);
await expect(eventItem).toBeVisible({ timeout: 5000 });
await eventItem.click();
```

**Activity Reference Test**:
```typescript
// Wait for API response
await page.waitForResponse(response => 
  response.url().includes('/api/admin/activities') && response.status() === 200,
  { timeout: 10000 }
);

// Wait for loading and items
await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
await page.waitForSelector('[data-testid^="reference-item-"]', { timeout: 10000 });

// Click specific item
const activityItem = page.locator(`[data-testid="reference-item-${testData.activityId}"]`);
await expect(activityItem).toBeVisible({ timeout: 5000 });
await activityItem.click();
```

## Testing Status

**Attempted**: Running the event reference test to verify the fix
**Result**: Test timed out again (60 seconds)
**Status**: Need further investigation

## Next Steps

### Immediate Actions (Next Session)

1. **Run test in headed mode** to see what's actually happening:
   ```bash
   npm run test:e2e -- referenceBlocks.spec.ts --grep "should create event reference block" --headed --workers=1
   ```

2. **Check if the component is rendering at all**:
   - Add console.log to SimpleReferenceSelector to verify it's mounting
   - Check browser console for errors
   - Verify the data-testid attributes are actually in the DOM

3. **Verify test data is being created correctly**:
   - Check if the event/activity IDs in testData match what's in the database
   - Verify the API is returning the correct data

4. **Try a simpler selector first**:
   ```typescript
   // Just find ANY button in the reference list
   const firstButton = page.locator('[data-testid^="reference-item-"]').first();
   await firstButton.click();
   ```

### Alternative Approaches

**Option A**: Debug the component rendering
- Add extensive logging to SimpleReferenceSelector
- Check if items array is populated
- Verify buttons are being rendered

**Option B**: Simplify the test
- Instead of waiting for specific items, just verify the component loads
- Click the first available item regardless of which one it is
- Focus on testing the flow, not the specific data

**Option C**: Check for other issues
- Verify the section editor is actually open
- Check if there are JavaScript errors preventing rendering
- Verify the column type selector is working correctly

## Files Modified

1. `components/admin/SimpleReferenceSelector.tsx` - Added data-testid attributes
2. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Updated selectors for event and activity tests

## Files to Check Next

1. `components/admin/SimpleReferenceSelector.tsx` - Add debug logging
2. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Add more debug output
3. `app/api/admin/events/route.ts` - Verify API is working
4. `app/api/admin/activities/route.ts` - Verify API is working

## Questions to Answer

1. **Is the SimpleReferenceSelector component actually rendering?**
   - Check browser DevTools in headed mode
   - Look for the component in the DOM

2. **Are the data-testid attributes present in the DOM?**
   - Inspect the buttons in browser DevTools
   - Verify the IDs match what the test is looking for

3. **Is the API returning data?**
   - Check Network tab in browser DevTools
   - Verify the response contains events/activities

4. **Is there a timing issue we're missing?**
   - Maybe the component unmounts and remounts?
   - Maybe there's a race condition?

## Recommended Next Action

**Run the test in headed mode with slow-mo** to see exactly what's happening:

```bash
npm run test:e2e -- referenceBlocks.spec.ts --grep "should create event reference block" --headed --workers=1 --debug
```

This will:
- Show the browser window
- Slow down actions so you can see what's happening
- Show detailed logs
- Allow you to inspect the DOM at each step

## Success Criteria

- [ ] Test finds the reference item button using data-testid
- [ ] Test completes in <20 seconds
- [ ] No timeouts
- [ ] Event reference test passes
- [ ] Activity reference test passes
- [ ] All 8 reference blocks tests pass

## Time Spent

- Investigation: 15 minutes
- Implementation: 10 minutes
- Testing: 5 minutes (incomplete)
- **Total: 30 minutes**

## Estimated Time to Complete

- Debug in headed mode: 15 minutes
- Fix identified issues: 15 minutes
- Test and verify: 10 minutes
- **Total: 40 minutes**

## Context for Next Session

You were working on fixing the E2E reference blocks tests. The tests were timing out when trying to find and click reference item buttons. You added data-testid attributes to the SimpleReferenceSelector component and updated the test selectors, but the test still timed out. The next step is to run the test in headed mode to see what's actually happening in the browser.

The key files are:
- `components/admin/SimpleReferenceSelector.tsx` (component with buttons)
- `__tests__/e2e/admin/referenceBlocks.spec.ts` (failing tests)
- `E2E_FEB13_2026_REFERENCE_BLOCKS_DEBUG_CONTINUATION.md` (debug plan)

The test creates an event/activity, navigates to content pages, opens the section editor, selects "references" as the column type, and then tries to click on the event/activity item. It's failing at the last step - finding and clicking the item button.
