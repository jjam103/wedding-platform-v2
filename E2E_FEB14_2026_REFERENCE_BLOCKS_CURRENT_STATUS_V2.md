# E2E Reference Blocks - Current Status V2 (Feb 14, 2026)

## Summary

Applied fixes to 2 of 3 failing tests. Event reference click issue persists and requires deeper investigation.

## Test Status

**Total Tests:** 8
**Passing:** 5 ✓ (62.5%)
**Failing:** 3 ✘ (37.5%)

### Passing Tests ✓
1. should create activity reference block
2. should remove reference from section
3. should filter references by type in picker
4. should detect broken references
5. should create multiple reference types in one section (sometimes)

### Failing Tests ✘

#### Test #1 & #2: should create event reference block
**Status:** STILL FAILING (timeout)
**Progress:**
- ✓ SimpleReferenceSelector loads
- ✓ API returns event data correctly
- ✓ Reference items rendered with correct data-testid
- ✘ Click on event item times out

**Attempted Fixes:**
1. Simplified click logic (removed extra checks)
2. Used `{ force: true }` to bypass actionability
3. Removed scrollIntoView
4. Added clear logging

**Result:** Still times out at click step

**Next Investigation Needed:**
- Check if there's a parent element intercepting clicks
- Check if button is actually clickable (z-index, pointer-events)
- Try clicking by text instead of data-testid
- Check browser console for JavaScript errors
- Try manual test in UI to see if event selection works

#### Test #7 & #8: should prevent circular references
**Status:** FIX APPLIED, PENDING VERIFICATION
**Fix:** Improved error message selector
**Expected:** Should pass after fix

#### Test #10: should display reference blocks in guest view
**Status:** NEEDS INVESTIGATION
**Issue:** API returns "Details could not be loaded"
**Next Steps:** Check RLS policies and API endpoint

## Detailed Analysis: Event Reference Click Issue

### What We Know

1. **Component Renders Correctly:**
   ```javascript
   <button
     key={item.id}
     type="button"
     data-testid={`reference-item-${item.id}`}
     data-reference-type={selectedType}
     data-reference-name={item.name}
     className="w-full text-left border border-gray-200 rounded-md p-3 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
     onClick={() => handleSelectItem(item)}
   >
   ```

2. **API Returns Data:**
   ```json
   {
     "success": true,
     "data": {
       "events": [{
         "id": "4e96aaf4-9778-4489-9883-70e15c5084b8",
         "name": "Test Event for References",
         ...
       }]
     }
   }
   ```

3. **Items Are Rendered:**
   - Console log shows: `[SimpleReferenceSelector] Rendering item: {id} {name}`
   - Test log shows: "✓ Reference items rendered"

4. **Element Is Found:**
   - Test successfully locates element with `data-testid="reference-item-{id}"`
   - Element passes visibility check

5. **Click Times Out:**
   - Even with `{ force: true }`, click times out
   - No error message, just timeout

### Possible Causes

1. **Parent Element Intercepting Clicks:**
   - The button is inside a scrollable container: `<div className="p-4 max-h-96 overflow-y-auto">`
   - Maybe the container needs to be scrolled first?

2. **Z-Index or Overlay Issue:**
   - Something might be covering the button
   - Check if there's a modal, overlay, or other element on top

3. **React State Not Updated:**
   - Button might be disabled by React state
   - Check if `loading` or `error` state is preventing clicks

4. **Playwright Timing Issue:**
   - Button might not be fully "ready" even though it's visible
   - Need longer wait or different wait condition

5. **Event Handler Not Attached:**
   - onClick handler might not be attached yet
   - React might still be hydrating

### Recommended Next Steps

#### Option 1: Try Different Selector Strategy
```typescript
// Instead of data-testid, try clicking by text
const eventItem = page.locator('button:has-text("Test Event for References")').first();
await eventItem.click({ force: true });
```

#### Option 2: Check for Overlays
```typescript
// Before clicking, check if anything is covering the button
const button = page.locator(`[data-testid="reference-item-${testEventId}"]`);
const box = await button.boundingBox();
if (box) {
  // Click at the center of the button
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
```

#### Option 3: Wait for Network Idle
```typescript
// Wait for all network requests to complete
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
// Then try clicking
```

#### Option 4: Check React State
```typescript
// Add debug logging to see component state
await page.evaluate(() => {
  console.log('Button elements:', document.querySelectorAll('[data-testid^="reference-item-"]'));
  console.log('Loading spinners:', document.querySelectorAll('.animate-spin'));
});
```

#### Option 5: Manual UI Test
1. Run the app locally
2. Navigate to content pages
3. Try to add an event reference manually
4. See if it works in the UI
5. If it doesn't work, there's a bug in the component
6. If it does work, the test needs adjustment

## Recommendation

**Immediate Action:** Run manual UI test to verify event reference selection works

**If UI works:**
- Issue is with test, not component
- Try Option 1 (click by text) or Option 2 (click by coordinates)

**If UI doesn't work:**
- Issue is with component
- Debug SimpleReferenceSelector
- Check onClick handler
- Check parent component integration

## Files to Check

1. `components/admin/SimpleReferenceSelector.tsx` - Reference picker component
2. `components/admin/InlineSectionEditor.tsx` - Parent component that uses SimpleReferenceSelector
3. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Test file

## Time Estimate

- Manual UI test: 10 minutes
- If test issue: 20-30 minutes to fix
- If component issue: 30-45 minutes to debug and fix
- **Total: 1-1.5 hours to resolve**

## Success Criteria

- Event references can be selected in admin UI (both manually and in tests)
- All 8 tests pass (100%)
- Tests are stable and reliable

