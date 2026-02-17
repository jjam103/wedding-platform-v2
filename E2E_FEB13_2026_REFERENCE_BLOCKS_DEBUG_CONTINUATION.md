# E2E Reference Blocks - Debug Continuation
**Date**: February 13, 2026
**Status**: Investigating test timeouts

## Current Situation

Tests are timing out at 29-37 seconds, all failing at the same point: trying to find and click the event/activity item button.

## Test Execution Results

```
✘ should create event reference block (29.0s, retry: 37.6s)
✘ should create activity reference block (29.4s, retry: 34.7s)
✘ should create multiple reference types in one section (28.9s)
```

All tests timeout waiting for the reference item button to appear.

## Root Cause Analysis

### What We Know

1. **API is working** - Test logs show:
   ```
   ✓ Created test data: { eventId: '...', activityId: '...', ... }
   ✓ Verify content page exists in DB: YES
   ```

2. **Component is loading** - Test successfully:
   - Opens section editor
   - Finds column type selector
   - Selects "references" option
   - Finds type selector (`select#type-select`)
   - Selects event/activity type
   - Waits for API response (succeeds)

3. **Test fails at** - Finding the button to click:
   ```typescript
   const eventItem = page.locator('.p-4.max-h-96 button')
     .filter({ hasText: 'Test Event for References' })
     .first();
   await expect(eventItem).toBeVisible({ timeout: 10000 });
   ```

### Hypothesis

The issue is likely one of these:

**Hypothesis A**: The button text doesn't match "Test Event for References"
- The test creates an event with name "Test Event for References"
- But the button might display a different text (truncated, formatted, etc.)

**Hypothesis B**: The button selector is wrong
- The component might use a different class structure
- The `.p-4.max-h-96 button` selector might not match

**Hypothesis C**: React rendering timing
- The API response arrives but React hasn't rendered the buttons yet
- The 1000ms wait might not be enough

**Hypothesis D**: The items array is empty
- The API returns success but with empty events array
- Component shows "No events found" instead of buttons

## Investigation Plan

### Step 1: Check what's actually rendered (5 minutes)

Add more debug logging to see what's on the page:

```typescript
// After API response
const pageContent = await page.locator('.p-4.max-h-96').innerHTML();
console.log('Full HTML content:', pageContent);

const allText = await page.locator('.p-4.max-h-96').allTextContents();
console.log('All text content:', allText);

const allButtons = await page.locator('button').allTextContents();
console.log('All buttons on page:', allButtons);
```

### Step 2: Check API response data (5 minutes)

The test already logs the API response, but let's verify the structure:

```typescript
const apiData = await apiResponse.json();
console.log('API Response:', JSON.stringify(apiData, null, 2));
console.log('Events array:', apiData.data?.events);
console.log('Events count:', apiData.data?.events?.length);
```

### Step 3: Check component state (5 minutes)

Add logging to SimpleReferenceSelector to see what it's doing:

```typescript
// In SimpleReferenceSelector.tsx, after setting items
console.log('[SimpleReferenceSelector] Items set:', {
  count: normalizedItems.length,
  items: normalizedItems.map(i => ({ id: i.id, name: i.name }))
});
```

### Step 4: Try different selectors (10 minutes)

Instead of the complex selector, try simpler ones:

```typescript
// Try 1: Any button with the event name
const eventItem = page.getByRole('button', { name: /Test Event for References/ });

// Try 2: Button containing the text anywhere
const eventItem = page.locator('button:has-text("Test Event")');

// Try 3: Just find any button in the list
const firstButton = page.locator('.p-4.max-h-96 button').first();
```

## Quick Fix Strategy

### Fix 1: Use more robust selector (RECOMMENDED)

Instead of relying on exact text match, use a data attribute:

**In SimpleReferenceSelector.tsx**:
```typescript
<button
  key={item.id}
  type="button"
  data-testid={`reference-item-${item.id}`}
  data-reference-type={selectedType}
  data-reference-name={item.name}
  className="w-full text-left border border-gray-200 rounded-md p-3..."
  onClick={() => handleSelectItem(item)}
>
```

**In test**:
```typescript
// Use the test ID with the known event ID
const eventItem = page.locator(`[data-testid="reference-item-${testData.eventId}"]`);
await expect(eventItem).toBeVisible({ timeout: 10000 });
await eventItem.click();
```

### Fix 2: Wait for items to render (QUICK WIN)

Add a more specific wait condition:

```typescript
// Wait for at least one button to appear in the list
await page.waitForSelector('.p-4.max-h-96 button', { timeout: 10000 });

// Wait for the loading spinner to disappear
await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

// Then find the specific item
const eventItem = page.locator('.p-4.max-h-96 button')
  .filter({ hasText: 'Test Event' })  // Partial match
  .first();
```

### Fix 3: Use getByRole with flexible matching (ALTERNATIVE)

```typescript
// Use Playwright's built-in role selector
const eventItem = page.getByRole('button', { 
  name: new RegExp(testData.eventId.slice(0, 8))  // Match by ID prefix
});
```

## Immediate Action

Let me implement Fix 1 (most robust) and Fix 2 (quick win) together:

### Changes Needed

1. **Add data-testid to SimpleReferenceSelector** (1 file)
2. **Update test to use data-testid** (1 file)
3. **Add better wait conditions** (1 file)

### Expected Outcome

- Tests will reliably find the reference items
- No more timeouts waiting for buttons
- Tests complete in <20 seconds

## Implementation

### File 1: components/admin/SimpleReferenceSelector.tsx

```typescript
// Line ~200, in the button element
<button
  key={item.id}
  type="button"
  data-testid={`reference-item-${item.id}`}
  data-reference-type={selectedType}
  className="w-full text-left border border-gray-200 rounded-md p-3 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
  onClick={() => handleSelectItem(item)}
>
```

### File 2: __tests__/e2e/admin/referenceBlocks.spec.ts

```typescript
// Replace the complex selector with data-testid
// After waiting for API response

// Wait for loading to complete
await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

// Wait for at least one item button to appear
await page.waitForSelector('[data-testid^="reference-item-"]', { timeout: 10000 });

// Click on the specific event using its ID
const eventItem = page.locator(`[data-testid="reference-item-${testData.eventId}"]`);
await expect(eventItem).toBeVisible({ timeout: 5000 });
await eventItem.click();
```

## Testing Plan

1. **Apply fixes** (5 minutes)
2. **Run one test** to verify (2 minutes)
   ```bash
   npm run test:e2e -- referenceBlocks.spec.ts --grep "should create event reference block" --workers=1
   ```
3. **Run full suite** if first test passes (5 minutes)
   ```bash
   npm run test:e2e -- referenceBlocks.spec.ts --workers=1
   ```

## Success Criteria

- [ ] Test finds the reference item button
- [ ] Test completes in <20 seconds
- [ ] No timeouts
- [ ] All 8 tests pass

## Estimated Time

- Investigation: 10 minutes (already done)
- Implementation: 5 minutes
- Testing: 10 minutes
- **Total: 25 minutes**

## Next Steps

1. Apply Fix 1 + Fix 2
2. Run test to verify
3. If successful, document the fix
4. If not, try Fix 3 or investigate further

Let's proceed with the implementation!
