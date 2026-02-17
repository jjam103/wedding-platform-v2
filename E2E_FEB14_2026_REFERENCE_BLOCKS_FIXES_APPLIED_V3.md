# E2E Reference Blocks - Fixes Applied (Feb 14, 2026 - V3)

## Summary

Applied consistent selector strategy across all failing tests. Switched from text-based selectors to data-testid selectors for reliability.

## Root Cause

The original issue was that we were using inconsistent selector strategies:
- Test #1 tried text first, then fell back to data-testid
- Test #3 tried text-based selectors
- Test #7 tried text-based selectors

The problem: Text-based selectors like `button:has-text("Test Event for References")` were unreliable because:
1. The text is nested inside a `<span>` element
2. There might be multiple elements with similar text
3. The button structure is complex with badges and metadata

## Solution

**Use data-testid consistently across all tests.**

The SimpleReferenceSelector component already renders buttons with:
```typescript
data-testid={`reference-item-${item.id}`}
```

This is the most reliable selector because:
- ✅ Unique per item (uses UUID)
- ✅ Doesn't depend on text content
- ✅ Doesn't depend on DOM structure
- ✅ Already implemented in the component

## Fixes Applied

### Fix #1: Test #1 (Event Reference Click)
**Location:** Line ~330

**Before:**
```typescript
// Try multiple strategies: text → data-testid → coordinates → force
const eventByText = page.locator('button:has-text("Test Event for References")').first();
// ... complex fallback logic
```

**After:**
```typescript
// Use data-testid directly (most reliable)
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
await eventItem.waitFor({ state: 'visible', timeout: 10000 });
await eventItem.click();
```

### Fix #2: Test #3 (Multiple References - Event Selection)
**Location:** Line ~510

**Before:**
```typescript
// Wait for text-based selector with retry logic
await expect(async () => {
  const eventItem = page.locator('button:has-text("Test Event for References")').first();
  await expect(eventItem).toBeVisible({ timeout: 2000 });
}).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });
```

**After:**
```typescript
// Wait for data-testid selector
await page.waitForSelector(`[data-testid="reference-item-${testEventId}"]`, { timeout: 10000 });
const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
await eventItem.click();
```

### Fix #3: Test #3 (Multiple References - Activity Selection)
**Location:** Line ~530

**Before:**
```typescript
// Text-based selector with complex waiting
const activityItem = page.locator('button:has-text("Test Activity for References")').first();
await activityItem.waitFor({ state: 'attached', timeout: 5000 });
await activityItem.waitFor({ state: 'visible', timeout: 5000 });
await activityItem.click({ force: true });
```

**After:**
```typescript
// Data-testid selector
await page.waitForSelector(`[data-testid="reference-item-${testActivityId}"]`, { timeout: 10000 });
const activityItem = page.locator(`[data-testid="reference-item-${testActivityId}"]`);
await activityItem.click();
```

### Fix #4: Test #7 (Circular References - Content Page Selection)
**Location:** Line ~910

**Before:**
```typescript
// Text-based selector
const contentPageAItem = page.locator('button:has-text("Test Content Page")').first();
await contentPageAItem.waitFor({ state: 'attached', timeout: 5000 });
await contentPageAItem.waitFor({ state: 'visible', timeout: 5000 });
await contentPageAItem.click({ force: true });
```

**After:**
```typescript
// Data-testid selector
const contentPageAItem = page.locator(`[data-testid="reference-item-${testContentPageId}"]`);
await contentPageAItem.waitFor({ state: 'visible', timeout: 10000 });
await contentPageAItem.click();
```

## Benefits of This Approach

1. **Consistency** - All tests use the same selector strategy
2. **Reliability** - data-testid is specifically designed for testing
3. **Simplicity** - No complex fallback logic needed
4. **Maintainability** - Easy to understand and debug
5. **Performance** - Faster than text-based selectors with retry logic

## Test Status After Fixes

### Expected Results:
- ✅ Test #1: should create event reference block
- ✅ Test #2: should create activity reference block (already passing)
- ✅ Test #3: should create multiple reference types in one section
- ✅ Test #5: should remove reference from section (already passing)
- ✅ Test #6: should filter references by type in picker (already passing)
- ✅ Test #7: should prevent circular references
- ✅ Test #9: should detect broken references (already passing)
- ⚠️ Test #10: should display reference blocks in guest view (API issue - separate fix needed)

### Remaining Work:
**Test #10 (Guest View API)** - The API endpoint `/api/admin/references/event/{id}` is returning "Details could not be loaded". This is likely:
1. RLS policy blocking anon access to events table
2. The API uses anon key (correct for guest view) but RLS might be too restrictive
3. Need to verify RLS policies allow public read access to published events

## Next Steps

1. Run tests to verify fixes work
2. If Tests #1, #3, #7 pass, move to Test #10 API investigation
3. Check RLS policies on events table for anon/guest access
4. Verify API endpoint returns correct data for guest view

## Files Modified

- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Applied consistent data-testid selectors

## Time Estimate

- Fixes applied: ✅ Complete
- Test verification: 5-10 minutes
- Test #10 API fix: 15-20 minutes (if needed)
- Total remaining: 20-30 minutes to 100% passing

## Conclusion

Switched from inconsistent text-based selectors to consistent data-testid selectors across all reference selection tests. This should fix Tests #1, #3, and #7. Test #10 requires separate API/RLS investigation.

**Status:** Fixes applied, ready for testing ✓
