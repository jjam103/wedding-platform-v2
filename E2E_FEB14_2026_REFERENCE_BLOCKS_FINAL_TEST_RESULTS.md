# E2E Reference Blocks Tests - Final Test Results

**Date**: February 14, 2026  
**Status**: 5/8 PASSING (62.5%), 3 FAILING

---

## Test Results Summary

### ✅ Passing Tests (5/8 - 62.5%)

1. ✅ **Test #3**: "should create activity reference block" - PASSED (17.2s)
2. ✅ **Test #4**: "should create multiple reference types in one section" - PASSED (23.1s) ✅ **FIX VERIFIED**
3. ✅ **Test #5**: "should remove reference from section" - PASSED (21.5s)
4. ✅ **Test #6**: "should filter references by type in picker" - PASSED (15.3s)
5. ✅ **Test #9**: "should detect broken references" - PASSED (15.6s)

### ❌ Failing Tests (3/8 - 37.5%)

#### 1. Test #1: "should create event reference block"
**Status**: Still failing after fixes  
**Duration**: 22.7s (first run) + 35.5s (retry)  
**Error**: Timeout waiting for reference preview to appear

**Root Cause**: Element detachment during React re-renders despite increased waits

**What We Tried**:
- Increased stability wait to 3000ms
- Added explicit `waitFor({ state: 'attached' })`
- Added explicit `waitFor({ state: 'visible' })`
- Increased retry timeout to 30s
- Used force click

**Why It's Still Failing**: The element is being re-rendered multiple times, and even 3000ms isn't enough for full stability in this specific test.

**Next Steps**:
- Option 1: Increase wait to 5000ms
- Option 2: Wait for specific API response before clicking
- Option 3: Use different selector strategy (wait for data-testid to be stable)

---

#### 2. Test #7: "should prevent circular references"
**Status**: Still failing after fixes  
**Duration**: 20.3s (first run) + 34.9s (retry)  
**Error**: Test stops after navigating to content page B

**Root Cause**: Test doesn't complete the circular reference flow

**What We Fixed**:
- Added stability checks for content page A item click
- Improved error selector to be more flexible

**Why It's Still Failing**: The test is timing out before reaching the error verification step. This suggests the Edit button click or section editor opening is failing.

**Next Steps**:
- Add more logging to see where exactly it's failing
- Verify the Edit button selector is correct for content page B
- Check if the section editor is opening correctly

---

#### 3. Test #10: "should display reference blocks in guest view with preview modals"
**Status**: NEW FAILURE (was passing before)  
**Duration**: 21.7s (first run) + retry failed  
**Error**: Expanded details show "Loading details..." instead of actual content

**Error Message**:
```
Expected substring: "Test Event for References"
Received: "Loading details..."
```

**Root Cause**: The reference preview is expanding but the API call to load details is not completing or returning data.

**What's Happening**:
1. ✅ Guest view page loads correctly
2. ✅ Reference cards are visible
3. ✅ Click on event reference card works
4. ✅ Expanded details section appears
5. ❌ Details show "Loading details..." instead of actual event data

**Next Steps**:
- Check if the API endpoint for loading reference details is working
- Verify the event data is being fetched correctly
- Add longer wait for API response before checking content
- Check if there's a race condition in the data loading

---

## Progress Analysis

### What Improved ✅
- **Test #4** (Multiple reference types) - Now passing consistently
- **beforeEach** - Page loading is more reliable with improved selector logic

### What Stayed the Same ⚠️
- **Test #1** (Event reference click) - Still flaky despite increased waits
- **Test #7** (Circular references) - Still incomplete

### What Got Worse ❌
- **Test #10** (Guest view) - Was passing, now failing due to async data loading issue

---

## Root Cause Analysis

### Common Pattern: Async Operations
All 3 failing tests have issues with async operations:

1. **Test #1**: Waiting for React re-renders after API call
2. **Test #7**: Waiting for page navigation and section editor
3. **Test #10**: Waiting for API call to load reference details

### The Real Problem
Our waits are based on time (2000ms, 3000ms) rather than actual completion of async operations. We need to wait for:
- API responses to complete
- State updates to finish
- DOM to stabilize

---

## Recommended Fixes

### Fix #1: Test #1 - Wait for API Response
Instead of waiting 3000ms, wait for the section save API call:

```typescript
// After clicking reference item
await eventItem.click({ force: true });

// Wait for section update API call
await page.waitForResponse(response => 
  response.url().includes('/api/admin/sections') && 
  response.status() === 200,
  { timeout: 10000 }
);

// Then verify reference appears
const referencePreview = page.locator('text=Test Event for References').first();
await expect(referencePreview).toBeVisible({ timeout: 5000 });
```

### Fix #2: Test #7 - Add More Logging
Add console.log statements to see where it's failing:

```typescript
console.log('✓ Navigating to content page B');
await page.goto('/admin/content-pages');

console.log('✓ Looking for Edit button');
const editButton = page.locator('button:has-text("Edit")').first();
await expect(editButton).toBeVisible({ timeout: 10000 });

console.log('✓ Clicking Edit button');
await editButton.click();

console.log('✓ Opening section editor');
await openSectionEditor(page);
```

### Fix #3: Test #10 - Wait for Data Loading
Wait for the "Loading details..." text to disappear:

```typescript
// Click on event reference card
await eventReferenceCard.click();
await page.waitForTimeout(1000);

// Wait for loading to complete
await expect(async () => {
  const loadingText = page.locator('text=Loading details...').first();
  await expect(loadingText).not.toBeVisible({ timeout: 2000 });
}).toPass({ timeout: 10000, intervals: [500, 1000, 2000] });

// Then verify content
const expandedDetails = eventReferenceCard.locator('.border-t.border-sage-200').first();
await expect(expandedDetails).toContainText('Test Event for References');
```

---

## Success Metrics

**Current**: 5/8 passing (62.5%)  
**Target**: 8/8 passing (100%)  
**Gap**: 3 tests

**Time Investment**:
- Test #1: ~30 minutes (change wait strategy)
- Test #7: ~1 hour (debug and fix navigation)
- Test #10: ~30 minutes (wait for data loading)

**Total Estimated Time**: 2 hours to achieve 100% passing rate

---

## Conclusion

We made good progress:
- Fixed the critical beforeEach issue that was blocking all tests
- Fixed Test #4 (multiple reference types)
- Maintained passing status for 5 tests

However, we introduced a new issue in Test #10 and didn't fully resolve Tests #1 and #7. The core issue is that we're using time-based waits instead of waiting for actual async operations to complete.

**Recommendation**: Implement the 3 fixes above to achieve 100% passing rate. Focus on waiting for API responses and state updates rather than arbitrary time delays.
