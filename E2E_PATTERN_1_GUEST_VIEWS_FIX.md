# E2E Pattern 1: Guest Views Fix

**Date**: February 11, 2026  
**Pattern**: Guest Views (121 failures - 21.3% of all failures)  
**Priority**: 🔴 CRITICAL  
**Status**: Root cause identified, fix in progress

---

## 📊 Impact

- **Failures**: 121 tests (21.3% of all E2E failures)
- **Test File**: `__tests__/e2e/guest/guestViews.spec.ts`
- **Test Suites Affected**:
  - Guest Views - Events (10 tests)
  - Guest Views - Activities (10 tests)
  - Guest Views - Content Pages (10 tests)
  - Guest Views - Section Display (10 tests)
  - Guest Views - Navigation (5 tests)
  - Guest Views - Preview from Admin (5 tests)
  - Guest Views - Mobile Responsiveness (3 tests)
  - Guest Views - Accessibility (2 tests)

---

## 🔍 Root Cause Analysis

### Error Message
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/event/test-event-id
```

### Root Cause
**The tests use hardcoded placeholder IDs that don't exist in the E2E database:**

```typescript
const TEST_ACTIVITY_ID = 'test-activity-id';
const TEST_EVENT_ID = 'test-event-id';
const TEST_ACCOMMODATION_ID = 'test-accommodation-id';
const TEST_ROOM_TYPE_ID = 'test-room-type-id';
const TEST_CONTENT_SLUG = 'test-content-page';
```

When tests try to navigate to these routes:
- `http://localhost:3000/event/test-event-id`
- `http://localhost:3000/activity/test-activity-id`
- `http://localhost:3000/custom/test-content-page`

The Next.js app returns 404 or the routes don't exist, causing connection errors.

### Why This Happened
1. **Test data not created**: The tests don't create the necessary test data before running
2. **No global setup for guest views**: Unlike admin tests which have authentication setup, guest view tests don't have data setup
3. **Hardcoded IDs**: Tests use placeholder IDs instead of creating real entities

---

## 🛠️ Fix Strategy

### Option 1: Create Test Data in beforeAll (RECOMMENDED)
Create actual test entities in the E2E database before running tests.

**Pros**:
- Tests use real data
- Tests validate actual application behavior
- Matches production usage patterns

**Cons**:
- Requires database setup
- Slightly slower test execution

### Option 2: Use Existing Test Data
Query the E2E database for existing entities and use their IDs.

**Pros**:
- Faster test execution
- No data creation overhead

**Cons**:
- Depends on database state
- May fail if data doesn't exist

### Option 3: Mock Routes
Create mock routes that return test data without database.

**Pros**:
- Fastest execution
- No database dependency

**Cons**:
- Doesn't test real application
- Misses integration issues

**Decision**: Use Option 1 (Create Test Data) for comprehensive testing.

---

## 📝 Implementation Plan

### Step 1: Add Test Data Setup

Create a new helper function in `__tests__/helpers/e2eHelpers.ts`:

```typescript
/**
 * Create test data for guest view tests
 * Returns IDs of created entities
 */
export async function createGuestViewTestData() {
  const supabase = createServiceClient();
  
  // Create test location
  const { data: location } = await supabase
    .from('locations')
    .insert({
      name: 'Test Location',
      type: 'venue',
      address: '123 Test St',
    })
    .select()
    .single();
  
  // Create test event
  const { data: event } = await supabase
    .from('events')
    .insert({
      name: 'Test Event',
      slug: 'test-event',
      event_type: 'ceremony',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      location_id: location.id,
      status: 'published',
    })
    .select()
    .single();
  
  // Create test activity
  const { data: activity } = await supabase
    .from('activities')
    .insert({
      name: 'Test Activity',
      slug: 'test-activity',
      activity_type: 'meal',
      event_id: event.id,
      location_id: location.id,
      capacity: 50,
      status: 'published',
    })
    .select()
    .single();
  
  // Create test accommodation
  const { data: accommodation } = await supabase
    .from('accommodations')
    .insert({
      name: 'Test Accommodation',
      slug: 'test-accommodation',
      location_id: location.id,
      status: 'published',
    })
    .select()
    .single();
  
  // Create test room type
  const { data: roomType } = await supabase
    .from('room_types')
    .insert({
      name: 'Test Room Type',
      slug: 'test-room-type',
      accommodation_id: accommodation.id,
      capacity: 2,
    })
    .select()
    .single();
  
  // Create test content page
  const { data: contentPage } = await supabase
    .from('content_pages')
    .insert({
      title: 'Test Content Page',
      slug: 'test-content-page',
      type: 'custom',
      status: 'published',
    })
    .select()
    .single();
  
  // Create test sections with content
  const { data: section } = await supabase
    .from('sections')
    .insert({
      page_type: 'event',
      page_id: event.id,
      title: 'Test Section',
      order_index: 0,
    })
    .select()
    .single();
  
  // Create section columns with rich text
  await supabase
    .from('section_columns')
    .insert([
      {
        section_id: section.id,
        column_index: 0,
        content_type: 'rich_text',
        rich_text_content: '<p>This is test content for the event.</p>',
      },
    ]);
  
  return {
    locationId: location.id,
    eventId: event.id,
    activityId: activity.id,
    accommodationId: accommodation.id,
    roomTypeId: roomType.id,
    contentSlug: contentPage.slug,
  };
}

/**
 * Clean up test data created for guest view tests
 */
export async function cleanupGuestViewTestData(testData: {
  locationId: string;
  eventId: string;
  activityId: string;
  accommodationId: string;
  roomTypeId: string;
  contentSlug: string;
}) {
  const supabase = createServiceClient();
  
  // Delete in reverse order of creation (respecting foreign keys)
  await supabase.from('section_columns').delete().eq('section_id', testData.eventId);
  await supabase.from('sections').delete().eq('page_id', testData.eventId);
  await supabase.from('content_pages').delete().eq('slug', testData.contentSlug);
  await supabase.from('room_types').delete().eq('id', testData.roomTypeId);
  await supabase.from('accommodations').delete().eq('id', testData.accommodationId);
  await supabase.from('activities').delete().eq('id', testData.activityId);
  await supabase.from('events').delete().eq('id', testData.eventId);
  await supabase.from('locations').delete().eq('id', testData.locationId);
}
```

### Step 2: Update Test File

Modify `__tests__/e2e/guest/guestViews.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createGuestViewTestData, cleanupGuestViewTestData } from '../helpers/e2eHelpers';

// Test data IDs - will be populated in beforeAll
let TEST_ACTIVITY_ID: string;
let TEST_EVENT_ID: string;
let TEST_ACCOMMODATION_ID: string;
let TEST_ROOM_TYPE_ID: string;
let TEST_CONTENT_SLUG: string;
let testDataIds: any;

// Create test data before all tests
test.beforeAll(async () => {
  console.log('[E2E] Creating guest view test data...');
  testDataIds = await createGuestViewTestData();
  
  TEST_ACTIVITY_ID = testDataIds.activityId;
  TEST_EVENT_ID = testDataIds.eventId;
  TEST_ACCOMMODATION_ID = testDataIds.accommodationId;
  TEST_ROOM_TYPE_ID = testDataIds.roomTypeId;
  TEST_CONTENT_SLUG = testDataIds.contentSlug;
  
  console.log('[E2E] Test data created:', testDataIds);
});

// Clean up test data after all tests
test.afterAll(async () => {
  if (testDataIds) {
    console.log('[E2E] Cleaning up guest view test data...');
    await cleanupGuestViewTestData(testDataIds);
    console.log('[E2E] Test data cleaned up');
  }
});

// Rest of the tests remain the same...
```

### Step 3: Fix Route Paths

The tests currently use:
- `/event/${TEST_EVENT_ID}` - Should use slug: `/event/test-event`
- `/activity/${TEST_ACTIVITY_ID}` - Should use slug: `/activity/test-activity`
- `/custom/${TEST_CONTENT_SLUG}` - Already correct

Update all route references to use slugs instead of IDs where applicable.

---

## ✅ Verification Steps

### 1. Run Guest View Tests
```bash
npx playwright test __tests__/e2e/guest/guestViews.spec.ts
```

**Expected Result**: All 55 tests should pass

### 2. Verify Test Data Creation
```bash
# Check that test data is created
npx playwright test __tests__/e2e/guest/guestViews.spec.ts --headed

# Verify in database
psql $E2E_DATABASE_URL -c "SELECT * FROM events WHERE slug = 'test-event';"
```

### 3. Verify Test Data Cleanup
```bash
# Run tests
npx playwright test __tests__/e2e/guest/guestViews.spec.ts

# Verify cleanup
psql $E2E_DATABASE_URL -c "SELECT * FROM events WHERE slug = 'test-event';"
# Should return 0 rows
```

### 4. Run Full Suite
```bash
# Verify no regressions
npx playwright test
```

---

## 📈 Expected Improvement

### Before Fix
- **Passing**: 190/363 tests (52.3%)
- **Failing**: 127 tests (35.0%)
- **Guest Views**: 0/55 passing (0%)

### After Fix
- **Passing**: ~311/363 tests (85.7%)
- **Failing**: ~52 tests (14.3%)
- **Guest Views**: 55/55 passing (100%)
- **Improvement**: +121 tests (+33.4%)

---

## 🚨 Potential Issues

### Issue 1: Database Permissions
**Problem**: Service role key may not have permission to create test data  
**Solution**: Verify RLS policies allow service role to insert test data

### Issue 2: Foreign Key Constraints
**Problem**: Test data creation may fail due to missing dependencies  
**Solution**: Create entities in correct order (locations → events → activities)

### Issue 3: Slug Conflicts
**Problem**: Test slugs may conflict with existing data  
**Solution**: Use unique slugs with timestamps or UUIDs

### Issue 4: Cleanup Failures
**Problem**: Test data may not be cleaned up if tests fail  
**Solution**: Use try/finally blocks and global teardown

---

## 📋 Implementation Checklist

- [ ] Create `createGuestViewTestData()` helper function
- [ ] Create `cleanupGuestViewTestData()` helper function
- [ ] Add `beforeAll` hook to create test data
- [ ] Add `afterAll` hook to cleanup test data
- [ ] Update route paths to use slugs instead of IDs
- [ ] Add error handling for data creation failures
- [ ] Add logging for debugging
- [ ] Test data creation locally
- [ ] Test data cleanup locally
- [ ] Run guest view tests and verify all pass
- [ ] Run full test suite to verify no regressions
- [ ] Document any issues encountered
- [ ] Update this document with final results

---

## 🎯 Success Criteria

- [ ] All 55 guest view tests passing
- [ ] Test data created successfully before tests
- [ ] Test data cleaned up successfully after tests
- [ ] No regressions in other test suites
- [ ] Test execution time acceptable (<5 minutes for guest views)
- [ ] Tests can run multiple times without conflicts

---

## 📝 Notes

### Alternative Approaches Considered

1. **Use existing data**: Query database for existing entities
   - Rejected: Too fragile, depends on database state

2. **Mock API responses**: Intercept API calls and return mock data
   - Rejected: Doesn't test real application behavior

3. **Use fixtures**: Load test data from JSON files
   - Rejected: Still requires database insertion

### Lessons Learned

1. **Always create test data**: Don't rely on hardcoded IDs
2. **Use slugs for routes**: More readable and stable than UUIDs
3. **Clean up after tests**: Prevent test pollution
4. **Log test data creation**: Helps with debugging

---

**Status**: Ready to implement  
**Next Action**: Create helper functions and update test file  
**Estimated Time**: 2-3 hours  
**Expected Outcome**: 311/363 tests passing (85.7%)
