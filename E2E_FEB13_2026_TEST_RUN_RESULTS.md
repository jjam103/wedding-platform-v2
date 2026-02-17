# E2E Test Run Results - After Database Cleanup
**Date**: February 13, 2026
**Test File**: `__tests__/e2e/admin/referenceBlocks.spec.ts`
**Status**: 1/8 passing (12.5%)

## Summary

After cleaning the E2E database, we ran the reference blocks tests. The cleanup helped, but there are still significant issues preventing most tests from passing.

## Test Results

### ✅ Passing (1 test)
1. **should detect broken references** - Successfully detects when referenced items are deleted

### ❌ Failing (7 tests)
1. **should create event reference block** - Slug uniqueness constraint violation
2. **should create activity reference block** - Slug uniqueness constraint violation  
3. **should create multiple reference types in one section** - Test data not visible
4. **should remove reference from section** - Test data not visible
5. **should filter references by type in picker** - Test data not visible
6. **should prevent circular references** - Column type selector not appearing
7. **should display reference blocks in guest view** - References not visible in guest view

## Root Causes

### Issue #1: Slug Uniqueness Violations (2 tests)

**Error**:
```
Failed to create test activity: duplicate key value violates unique constraint "activities_slug_key"
Failed to create test event: duplicate key value violates unique constraint "events_slug_key"
```

**Cause**: Tests are running in parallel and creating slugs with `Date.now()`, but multiple tests can execute in the same millisecond, creating duplicate slugs.

**Solution**: Use more unique slug generation:
```typescript
// Instead of:
slug: `test-event-ref-${Date.now()}`

// Use:
slug: `test-event-ref-${Date.now()}-${Math.random().toString(36).substring(7)}`
```

### Issue #2: Test Content Pages Not Visible (5 tests)

**Error**:
```
Test content page not visible after navigation - no Edit button found
```

**Page Content**:
```
Content PagesManage custom content pages with rich text and sections
Add PageAdd Content Page...
No content pages yetCreate First Page
```

**Cause**: The test creates content pages in `beforeEach`, but when the test navigates to `/admin/content-pages`, the page shows "No content pages yet". This suggests:
1. The data isn't being created successfully
2. The data is created but not visible due to RLS policies
3. The page isn't refreshing/loading the data

**Possible Solutions**:
1. Add longer wait after data creation
2. Verify RLS policies allow reading the test data
3. Add explicit data verification after creation
4. Force page reload after data creation

### Issue #3: Column Type Selector Not Appearing (1 test)

**Error**:
```
expect(locator).toBeVisible() failed
Locator: locator('select').filter({ has: locator('option[value="references"]') }).first()
```

**Cause**: The editing interface with the column type selector isn't rendering after clicking the Edit button on a section. This is the same issue identified in the previous session - the UI doesn't match what the tests expect.

## Detailed Failure Analysis

### Test 1 & 2: Slug Uniqueness
- **First run**: Slug constraint violation in `beforeEach`
- **Retry**: Test data not visible (because `beforeEach` failed, no data was created)
- **Fix**: Add random component to slug generation

### Tests 3-7: Test Data Not Visible
- **Pattern**: All tests fail at the same point - verifying test content page is visible
- **Observation**: Page shows "No content pages yet" despite `beforeEach` creating data
- **Hypothesis**: Either data creation is failing silently, or RLS is blocking reads

## Recommendations

### Priority 1: Fix Slug Generation (Quick Win)
Update the test to use more unique slugs:

```typescript
// In beforeEach
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

const { data: event } = await supabase
  .from('events')
  .insert({
    name: 'Test Event for References',
    slug: `test-event-ref-${uniqueId}`,
    // ... rest of fields
  })
  .select()
  .single();
```

### Priority 2: Investigate Data Visibility
Add debugging to understand why test data isn't visible:

```typescript
// After creating test data in beforeEach
console.log('Created content page:', testContentPageId);

// Verify data was created
const { data: verifyPage, error: verifyError } = await supabase
  .from('content_pages')
  .select('*')
  .eq('id', testContentPageId)
  .single();

console.log('Verify page exists:', verifyPage, verifyError);

// Check if data is visible through the API
const apiResponse = await fetch('http://localhost:3000/api/admin/content-pages');
const apiData = await apiResponse.json();
console.log('API returns:', apiData);
```

### Priority 3: Fix UI/Component Issues
The column type selector not appearing is a UI/component issue that requires:
1. Manual testing to understand the actual UI flow
2. Updating tests to match the real UI behavior
3. Or fixing the component to match test expectations

## Next Steps

### Option A: Quick Fixes (Recommended)
1. Fix slug generation (5 minutes)
2. Add data verification logging (10 minutes)
3. Run tests again to see if data visibility improves

### Option B: Deep Investigation
1. Manual testing of the content pages UI
2. Check RLS policies for content_pages table
3. Verify API endpoints are returning data correctly
4. Update tests based on findings

### Option C: Skip for Now
If these tests aren't critical for the current sprint:
1. Mark tests as `.skip()` temporarily
2. Create tickets to fix them later
3. Focus on other E2E tests that are passing

## Key Insights

1. **Database cleanup helped** - We went from 0/8 to 1/8 passing
2. **Parallel execution issues** - Slug generation needs to handle concurrent test runs
3. **Data visibility problem** - Test data isn't appearing in the UI despite being created
4. **UI mismatch** - The editing interface doesn't match test expectations

## Test Execution Details

- **Duration**: ~2 minutes
- **Workers**: 4 parallel workers
- **Retries**: 1 retry per test
- **Total Test Runs**: 15 (8 initial + 7 retries)
- **Pass Rate**: 12.5% (1/8)

## Files to Investigate

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Test file (fix slug generation)
2. `app/api/admin/content-pages/route.ts` - API endpoint (verify returns data)
3. `app/admin/content-pages/page.tsx` - UI page (verify displays data)
4. `supabase/migrations/*_rls_content_pages.sql` - RLS policies (verify read access)

## Conclusion

The database cleanup was successful and helped improve test reliability (1 test now passes). However, there are still fundamental issues with:
1. Test data generation (slug uniqueness)
2. Test data visibility (RLS or API issues)
3. UI component behavior (editing interface not appearing)

**Recommended next action**: Fix the slug generation issue first (quick win), then investigate why test data isn't visible in the UI.
