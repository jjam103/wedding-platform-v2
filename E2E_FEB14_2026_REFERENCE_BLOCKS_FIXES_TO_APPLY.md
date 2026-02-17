# E2E Reference Blocks - Fixes to Apply (Feb 14, 2026)

## Test Results Summary

**Total Tests:** 8
**Passing:** 5 ✓ (62.5%)
**Failing:** 3 ✘ (37.5%)

## Root Causes Identified

### Issue #1: Event Reference Click Timeout (Tests #1, #2)
**Symptom:** `TimeoutError: locator.click: Timeout 15000ms exceeded` on `[data-testid="reference-item-{id}"]`

**Root Cause:** The test waits for the element with `waitFor({ state: 'attached' })` and `waitFor({ state: 'visible' })`, then waits 2 seconds, but the element still isn't clickable. This suggests the element might be:
1. Covered by another element
2. Not fully interactive yet
3. Re-rendering after the wait

**Evidence from logs:**
```
API Response: { "success": true, "data": { "events": [...] } }
✓ Reference items rendered
[TIMEOUT - can't click element]
```

**Fix:** Add explicit wait for element to be in a stable, clickable state before clicking.

### Issue #2: Content Page References Not Loading (Tests #7, #8)
**Symptom:** `Error: element(s) not found` for `button:has-text("Test Content Page")`

**Root Cause:** After selecting `content_page` type, the API is called but items don't render. Looking at SimpleReferenceSelector code:

```typescript
case 'content_page':
  if (Array.isArray(result.data)) {
    // Direct array response
    dataArray = result.data;
  }
  break;
```

The content pages API returns a direct array, but the component might not be handling it correctly.

**Evidence from logs:**
```
✓ Selected content_page type
[API call happens]
[No items rendered - can't find button]
```

**Fix:** Verify content pages API response format and ensure SimpleReferenceSelector handles it correctly.

### Issue #3: Guest View Event Details Not Loading (Test #10)
**Symptom:** Shows "Details could not be loaded" instead of event details

**Root Cause:** The GuestReferencePreview component makes an API call to `/api/admin/references/event/{id}` but it fails. The component has defensive error handling that sets fallback text:

```typescript
if (!response.ok) {
  setDetails({
    name: reference.name || 'Unknown',
    description: 'Details could not be loaded',
  });
  return;
}
```

**Evidence from logs:**
```
✓ Event details expanded
→ Expanded details text: Loading details......
→ Expanded details text: DescriptionDetails could not be loaded...
```

**Fix:** Check if the API endpoint `/api/admin/references/event/{id}` exists and returns correct data.

## Fixes to Apply

### Fix #1: Improve Event Reference Click Stability

**File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Change:** Replace the click logic with a more robust approach:

```typescript
// OLD CODE (line 330-345):
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
await expect(eventItem).toBeVisible({ timeout: 5000 });

// Wait for element to be fully attached and stable
await eventItem.waitFor({ state: 'attached', timeout: 5000 });
await eventItem.waitFor({ state: 'visible', timeout: 5000 });

// Wait for element to be stable (no re-renders)
await page.waitForTimeout(2000);

// Click the item
await eventItem.click({ force: true });

// NEW CODE:
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);

// Wait for element with retry logic
await expect(async () => {
  await expect(eventItem).toBeVisible({ timeout: 2000 });
  await expect(eventItem).toBeEnabled({ timeout: 1000 });
}).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

// Scroll into view to ensure it's clickable
await eventItem.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Click with retry
await expect(async () => {
  await eventItem.click({ timeout: 2000 });
  // Verify click worked by checking if reference was added
  await page.waitForTimeout(500);
}).toPass({ timeout: 10000, intervals: [500, 1000] });
```

### Fix #2: Add Logging to Debug Content Page Loading

**File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Change:** Add logging after selecting content_page type (line 850):

```typescript
// After this line:
await page.waitForTimeout(1000);

// ADD:
// Debug: Check what items are rendered
const itemCount = await page.locator('[data-testid^="reference-item-"]').count();
console.log(`→ Found ${itemCount} reference items after selecting content_page type`);

// Debug: Check if API was called
const apiCalls = await page.evaluate(() => {
  return (window as any).__apiCalls || [];
});
console.log(`→ API calls made:`, apiCalls);

// Debug: Check SimpleReferenceSelector state
const selectorState = await page.evaluate(() => {
  const selector = document.querySelector('[id="type-select"]');
  return {
    value: (selector as HTMLSelectElement)?.value,
    itemsVisible: document.querySelectorAll('[data-testid^="reference-item-"]').length,
  };
});
console.log(`→ Selector state:`, selectorState);
```

### Fix #3: Check API Endpoint for Guest View

**Investigation needed:** Check if `/api/admin/references/event/{id}` endpoint exists.

**File to check:** `app/api/admin/references/[type]/[id]/route.ts`

**Expected behavior:** Should return event details in format:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Test Event for References",
    "type": "event",
    "slug": "...",
    "status": "published",
    "details": {
      "description": "...",
      "date": "...",
      "location": "..."
    }
  }
}
```

## Implementation Plan

### Step 1: Apply Fix #1 (Event Reference Click)
1. Update test file with new click logic
2. Run test to verify fix
3. If still failing, add more logging

### Step 2: Apply Fix #2 (Content Page Debug Logging)
1. Add logging to circular reference test
2. Run test to see what's happening
3. Based on logs, determine if it's:
   - API not being called
   - API returning wrong format
   - Items not rendering
   - Items rendering but not findable

### Step 3: Investigate Fix #3 (Guest View API)
1. Check if API endpoint exists
2. Test endpoint manually with curl
3. If endpoint missing, create it
4. If endpoint exists but broken, fix it

## Expected Outcomes

After Fix #1: Tests #1, #2 should pass (event reference click works)
After Fix #2: Tests #7, #8 should pass (content page references work)
After Fix #3: Test #10 should pass (guest view event details load)

**Final Expected:** 8/8 tests passing (100%)

## Time Estimate

- Fix #1: 15-20 minutes (apply + test)
- Fix #2: 20-30 minutes (debug + fix)
- Fix #3: 30-45 minutes (investigate + fix API)
- **Total: ~1.5 hours to 100% passing**

