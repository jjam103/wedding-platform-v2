# E2E Phase 2 Round 8 - Reference Blocks Fixes

**Date**: February 13, 2026  
**Status**: In Progress (4/8 tests passing)  
**Time Spent**: ~30 minutes

## Problem Summary

All 8 reference block E2E tests were failing due to database setup issues in the test's `beforeEach` hook. The test was using incorrect:
1. Database client (anon client instead of service client)
2. Table schemas (wrong column names and types)
3. Table names (section_columns vs columns)

## Root Cause Analysis

### Issue 1: RLS Blocking Test Data Creation
**Error**: `TypeError: Cannot read properties of null (reading 'id')`

**Root Cause**: Test was using `createTestClient()` which creates an anon client that respects RLS policies. Since no user was authenticated, all inserts were blocked by RLS.

**Fix**: Changed to `createServiceClient()` which bypasses RLS for test setup.

```typescript
// Before
const supabase = createTestClient();

// After
const supabase = createServiceClient();
```

### Issue 2: Wrong Column Names in Events Table
**Error**: Event insertion returning null

**Root Cause**: Test was using `event_date` but schema has `start_date`. Also missing required fields `event_type` and `status`.

**Fix**: Updated to match actual schema:

```typescript
// Before
{
  name: 'Test Event for References',
  slug: `test-event-ref-${Date.now()}`,
  event_date: new Date(...).toISOString(),
  description: 'Test event for reference blocks',
}

// After
{
  name: 'Test Event for References',
  slug: `test-event-ref-${Date.now()}`,
  start_date: new Date(...).toISOString(),
  event_type: 'ceremony',
  description: 'Test event for reference blocks',
  status: 'published',
}
```

### Issue 3: Wrong Column Names in Activities Table
**Error**: Activity insertion returning null

**Root Cause**: Test was using `activity_date` but schema has `start_time`. Also missing required fields `activity_type` and `status`.

**Fix**: Updated to match actual schema:

```typescript
// Before
{
  name: 'Test Activity for References',
  slug: `test-activity-ref-${Date.now()}`,
  event_id: testEventId,
  activity_date: new Date(...).toISOString(),
  description: 'Test activity for reference blocks',
}

// After
{
  name: 'Test Activity for References',
  slug: `test-activity-ref-${Date.now()}`,
  event_id: testEventId,
  start_time: new Date(...).toISOString(),
  activity_type: 'activity',
  description: 'Test activity for reference blocks',
  status: 'published',
}
```

### Issue 4: Invalid Column in Content Pages Table
**Error**: `Could not find the 'type' column of 'content_pages' in the schema cache`

**Root Cause**: Test was trying to insert a `type` column that doesn't exist in the content_pages table.

**Fix**: Removed the non-existent column:

```typescript
// Before
{
  title: 'Test Content Page',
  slug: `test-page-ref-${Date.now()}`,
  type: 'info',  // ❌ This column doesn't exist
  status: 'published',
}

// After
{
  title: 'Test Content Page',
  slug: `test-page-ref-${Date.now()}`,
  status: 'published',
}
```

### Issue 5: Wrong Column Names in Sections Table
**Error**: `Could not find the 'position' column of 'sections' in the schema cache`

**Root Cause**: Test was using `position` but schema has `display_order`. Also using `content_page` page_type which isn't supported.

**Fix**: Updated to match actual schema:

```typescript
// Before
{
  page_type: 'content_page',  // ❌ Not a valid page_type
  page_id: testContentPageId,
  position: 0,  // ❌ Wrong column name
}

// After
{
  page_type: 'custom',  // ✅ Valid page_type
  page_id: testContentPageId,
  display_order: 0,  // ✅ Correct column name
}
```

### Issue 6: Wrong Table Name for Columns
**Error**: Various errors when trying to update `section_columns`

**Root Cause**: Test was using `section_columns` but the actual table name is `columns`.

**Fix**: Changed all references from `section_columns` to `columns`:

```typescript
// Before
await supabase.from('section_columns').update({...})

// After
await supabase.from('columns').update({...})
```

### Issue 7: Wrong Column Structure in Columns Table
**Error**: Trying to set `references` directly instead of in `content_data`

**Root Cause**: The `columns` table stores references in `content_data.references`, not as a top-level `references` column.

**Fix**: Updated to use correct structure:

```typescript
// Before
await supabase.from('columns').update({
  content_type: 'references',
  references: [{ type: 'event', id: testEventId }],
})

// After
await supabase.from('columns').update({
  content_type: 'references',
  content_data: { 
    references: [{ type: 'event', id: testEventId }] 
  },
})
```

### Issue 8: Missing Column Record
**Error**: Update operations failing because no column exists for the section

**Root Cause**: Tests were trying to update a column that didn't exist yet.

**Fix**: Added column creation in test setup:

```typescript
// Create a column for the section (required for reference blocks)
const { error: columnError } = await supabase
  .from('columns')
  .insert({
    section_id: testSectionId,
    column_number: 1,
    content_type: 'rich_text',
    content_data: {},
  });
```

## Test Results

### Before Fixes
- **Passing**: 0/8 (0%)
- **Failing**: 8/8 (100%)
- **Error Type**: Database setup failures (null pointer exceptions)

### After Fixes
- **Passing**: 4/8 (50%)
- **Failing**: 3/8 (37.5%)
- **Interrupted**: 1/8 (12.5%)
- **Error Type**: UI interaction timeouts (not database issues)

### Passing Tests
1. ✅ should create activity reference block
2. ✅ should create multiple reference types in one section
3. ✅ should filter references by type in picker
4. ✅ should detect broken references

### Failing Tests (UI Issues)
1. ❌ should create event reference block - Timeout waiting for "Manage Sections" button
2. ❌ should remove reference from section - Timeout waiting for "Manage Sections" button
3. ❌ should prevent circular references - Can't find "Edit" button on events page

### Interrupted Test
1. ⚠️ should display reference blocks in guest view with preview modals - Test interrupted

## Remaining Work

The remaining 3 failures are **UI interaction issues**, not database problems:

### Issue: "Manage Sections" Button Not Appearing
**Tests Affected**: 2 tests
**Error**: `Timeout waiting for locator('button:has-text("Manage Sections")')`

**Possible Causes**:
1. Button text might be different ("Sections" instead of "Manage Sections")
2. Button might be in a different location
3. Page might not be fully loaded
4. React hydration timing issue

**Next Steps**:
1. Run test in headed mode to observe actual UI
2. Check actual button text in the component
3. Add more robust wait conditions
4. Consider using data-testid attributes

### Issue: "Edit" Button Not Found on Events Page
**Tests Affected**: 1 test
**Error**: `element(s) not found` for `button:has-text("Edit")`

**Possible Causes**:
1. Events page might not have loaded
2. No events visible in the list
3. Button might have different text or be an icon
4. Authentication issue preventing page access

**Next Steps**:
1. Verify test event was created successfully
2. Check if events page requires authentication
3. Verify button selector matches actual UI
4. Add debugging to see page state

## Impact on Round 8 Goals

**Original Goal**: Fix 12 reference block test failures (Priority 3)

**Progress**:
- ✅ Fixed all database setup issues (8/8 tests)
- ✅ 4 tests now fully passing (50%)
- ⚠️ 3 tests have UI interaction issues (need component fixes)
- ⚠️ 1 test interrupted (needs retry)

**Estimated Time to Complete**:
- Database fixes: ✅ Complete (30 minutes)
- UI fixes: 30-60 minutes remaining
- **Total**: 1-1.5 hours (within 1-2 hour estimate)

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Fixed all database setup issues

## Lessons Learned

1. **Always use service client for test setup**: Test data creation should bypass RLS
2. **Verify schema before writing tests**: Check actual table structure, not assumptions
3. **Check for table renames**: `columns` vs `section_columns` caused confusion
4. **Understand data structure**: References stored in `content_data.references`, not top-level
5. **Create required records**: Sections need columns before they can be updated

## Next Actions

1. **Investigate UI issues** (30-60 min):
   - Run failing tests in headed mode
   - Check actual button text and selectors
   - Add more robust wait conditions
   - Consider adding data-testid attributes

2. **Verify fixes** (10 min):
   - Run full reference blocks suite
   - Confirm all 8 tests pass
   - Check for flakiness

3. **Move to next priority** (if time permits):
   - Section Editor Loading (Priority 2)
   - Form Authentication (Priority 1)

## Success Metrics

- [x] Database setup issues resolved (100%)
- [x] At least 50% of tests passing (50% achieved)
- [ ] All 8 tests passing (75% remaining)
- [ ] No flaky tests
- [ ] Tests run in <30 seconds

---

**Status**: Database fixes complete, UI fixes in progress  
**Next Update**: After UI issues resolved  
**Estimated Completion**: 30-60 minutes
