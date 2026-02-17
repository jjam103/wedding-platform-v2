# E2E Reference Blocks Tests - Fixes Applied
**Date**: February 13, 2026
**Status**: Priority 1 & 2 fixes implemented
**Next**: Run tests to verify improvements

## Fixes Applied

### Fix #1: Slug Uniqueness (Priority 1) ✅

**Problem**: Tests were using `Date.now()` for slugs, causing duplicate key violations when tests ran in parallel in the same millisecond.

**Error**:
```
duplicate key value violates unique constraint "activities_slug_key"
duplicate key value violates unique constraint "events_slug_key"
```

**Solution**: Added random component to slug generation to ensure uniqueness even in parallel execution.

**Code Changes**:
```typescript
// Before:
slug: `test-event-ref-${Date.now()}`
slug: `test-activity-ref-${Date.now()}`
slug: `test-page-ref-${Date.now()}`

// After:
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
slug: `test-event-ref-${uniqueId}`
slug: `test-activity-ref-${uniqueId}`
slug: `test-page-ref-${uniqueId}`
```

**Expected Impact**: Should fix 2 failing tests immediately:
- `should create event reference block`
- `should create activity reference block`

### Fix #2: Data Visibility Debugging (Priority 2) ✅

**Problem**: Tests create content pages in `beforeEach`, but UI shows "No content pages yet" - data isn't visible.

**Solution**: Added comprehensive debugging and verification to understand the issue:

1. **Database Verification**: Verify data exists after creation
2. **API Response Check**: Check what the API endpoint returns
3. **Increased Wait Time**: Changed from 1000ms to 2000ms for data loading
4. **Enhanced Error Messages**: More detailed logging when data isn't visible

**Code Changes**:
```typescript
// Added after data creation:
console.log('✓ Created test data:', { eventId, activityId, contentPageId, sectionId });

// Verify in database
const { data: verifyPage } = await supabase
  .from('content_pages')
  .select('*')
  .eq('id', testContentPageId)
  .single();
console.log('✓ Verify content page exists in DB:', verifyPage ? 'YES' : 'NO');

// Check API response
const apiResponse = await page.evaluate(async () => {
  const response = await fetch('/api/admin/content-pages');
  const data = await response.json();
  return { status: response.status, data };
});
console.log('✓ API response:', apiResponse.status, 'Pages count:', apiResponse.data?.data?.length);

// Increased wait time
await page.waitForTimeout(2000); // Was 1000ms

// Enhanced error logging
if (!testPageVisible) {
  const hasAddButton = await page.locator('button:has-text("Add Page")').isVisible();
  const hasEmptyState = await page.locator('text=No content pages yet').isVisible();
  console.log('✗ Debug info:', { hasAddButton, hasEmptyState });
}
```

**Expected Impact**: 
- Will provide detailed logs to diagnose the data visibility issue
- May fix timing-related failures with increased wait time
- Could fix 5 failing tests if it's a timing issue

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts`
   - Lines 72-73: Added `uniqueId` generation
   - Lines 92-93: Updated event and activity slug generation
   - Lines 112-113: Updated content page slug generation
   - Lines 140-175: Added comprehensive debugging and verification

## Expected Test Results

### Before Fixes
- **Pass Rate**: 1/8 (12.5%)
- **Passing**: 1 test (should detect broken references)
- **Failing**: 7 tests

### After Fix #1 (Slug Generation)
- **Expected Pass Rate**: 3/8 (37.5%)
- **Expected Passing**: 3 tests
  - should detect broken references (already passing)
  - should create event reference block (slug fix)
  - should create activity reference block (slug fix)
- **Expected Failing**: 5 tests (data visibility issues)

### After Fix #2 (If Timing Issue)
- **Best Case Pass Rate**: 7/8 (87.5%)
- **Expected Passing**: 7 tests (all except circular reference test)
- **Expected Failing**: 1 test (UI component mismatch)

### After Fix #2 (If RLS/API Issue)
- **Pass Rate**: 3/8 (37.5%)
- **But**: We'll have detailed logs to diagnose the root cause

## Next Steps

### Step 1: Run Tests
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

### Step 2: Analyze Results

**If 3/8 passing (slug fix worked)**:
- ✅ Slug generation fix successful
- ❌ Data visibility still an issue
- 📋 Review debug logs to understand why data isn't visible

**If 7/8 passing (timing fix worked)**:
- ✅ Both fixes successful!
- 🎉 Only 1 test failing (UI component mismatch)
- 📋 Move to Priority 3 (manual UI testing)

**If still 1/8 passing (fixes didn't help)**:
- ❌ Deeper issue than expected
- 📋 Review debug logs carefully
- 📋 May need to check RLS policies or API implementation

### Step 3: Based on Results

**Scenario A: 3/8 passing (slug fix worked, data visibility persists)**
1. Review debug logs from test output
2. Check if API returns data (look for "API response" log)
3. Check if data exists in DB (look for "Verify content page exists" log)
4. Investigate RLS policies if data exists but API doesn't return it
5. Investigate API implementation if data exists but API fails

**Scenario B: 7/8 passing (both fixes worked)**
1. Celebrate! 🎉
2. Move to Priority 3: Manual UI testing for circular reference test
3. Document the actual UI flow
4. Update the failing test to match reality

**Scenario C: Still 1/8 passing (fixes didn't help)**
1. Review all debug logs carefully
2. Check for error messages in console
3. May need to add even more debugging
4. Consider running tests with `--debug` flag

## Debug Log Interpretation Guide

### What to Look For

**✓ Created test data**: Confirms data creation started
- If missing: Data creation failed before logging

**✓ Verify content page exists in DB: YES**: Data is in database
- If NO: Data creation failed silently
- If error message: Database constraint or RLS issue

**✓ API response: 200 Pages count: 1+**: API returns data
- If 200 but count 0: RLS blocking reads
- If not 200: API error (check error message)
- If missing: API call failed (network or CORS issue)

**✓ Test content page is visible in UI**: Data appears in UI
- If missing: UI not rendering data despite API returning it

### Common Patterns

**Pattern 1: Data created, API returns it, UI shows it**
```
✓ Created test data: { ... }
✓ Verify content page exists in DB: YES
✓ API response: 200 Pages count: 1
✓ Test content page is visible in UI
```
**Diagnosis**: Everything working! Test should pass.

**Pattern 2: Data created, but API doesn't return it**
```
✓ Created test data: { ... }
✓ Verify content page exists in DB: YES
✓ API response: 200 Pages count: 0
✗ Page content after navigation: ...No content pages yet...
```
**Diagnosis**: RLS policy blocking reads. Check content_pages RLS policies.

**Pattern 3: Data creation failed**
```
✗ Failed to create test content page: ...
```
**Diagnosis**: Database constraint or RLS blocking inserts. Check error message.

**Pattern 4: API call failed**
```
✓ Created test data: { ... }
✓ Verify content page exists in DB: YES
✗ API call failed: ...
```
**Diagnosis**: Network issue, CORS, or API route error.

## Success Criteria

### Minimum Success (Fix #1 only)
- ✅ 3/8 tests passing (37.5%)
- ✅ No more slug uniqueness violations
- ✅ Clear debug logs showing root cause of data visibility issue

### Good Success (Fix #1 + timing)
- ✅ 7/8 tests passing (87.5%)
- ✅ Only UI component mismatch remaining
- ✅ Ready to move to Priority 3

### Excellent Success (All fixes)
- ✅ 8/8 tests passing (100%)
- ✅ All issues resolved
- ✅ Test suite ready for CI/CD

## Rollback Plan

If fixes cause new issues:

```bash
# Revert changes
git checkout HEAD -- __tests__/e2e/admin/referenceBlocks.spec.ts

# Or restore specific sections:
# 1. Remove uniqueId generation
# 2. Restore original slug generation
# 3. Remove debug logging
# 4. Restore original wait time (1000ms)
```

## Conclusion

We've implemented two key fixes:

1. **Slug generation** - Should immediately fix 2 tests
2. **Data visibility debugging** - Should help diagnose (and possibly fix) 5 tests

The next step is to run the tests and analyze the results. The debug logs will tell us exactly what's happening and guide the next round of fixes.

**Estimated time to verify**: 5 minutes (run tests + review logs)
**Estimated time to fix remaining issues**: 15-60 minutes (depending on root cause)

