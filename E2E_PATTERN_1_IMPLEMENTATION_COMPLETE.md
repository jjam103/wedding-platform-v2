# E2E Pattern 1: Guest Views - Implementation Complete

**Date**: February 11, 2026  
**Pattern**: Guest Views (121 failures)  
**Status**: ✅ Implementation complete, ready for verification

---

## ✅ Implementation Summary

### Changes Made

#### 1. Created Test Data Helper Functions
**File**: `__tests__/helpers/e2eHelpers.ts`

Added two new functions:
- `createGuestViewTestData()` - Creates comprehensive test data with proper relationships
- `cleanupGuestViewTestData()` - Cleans up test data after tests complete

**Features**:
- Creates entities with unique slugs using timestamps
- Establishes proper foreign key relationships
- Sets all entities to "published" status
- Creates sections with rich text content
- Returns both IDs and slugs for flexibility

#### 2. Updated Test File
**File**: `__tests__/e2e/guest/guestViews.spec.ts`

**Changes**:
- Added `beforeAll` hook to create test data
- Added `afterAll` hook to cleanup test data
- Replaced hardcoded IDs with dynamic slugs
- Updated all route references to use slugs:
  - `TEST_EVENT_ID` → `TEST_EVENT_SLUG`
  - `TEST_ACTIVITY_ID` → `TEST_ACTIVITY_SLUG`
  - `TEST_ACCOMMODATION_ID` → `TEST_ACCOMMODATION_SLUG`
  - `TEST_ROOM_TYPE_ID` → `TEST_ROOM_TYPE_SLUG`
  - `TEST_CONTENT_SLUG` (already correct)

---

## 🔧 Technical Details

### Test Data Structure

```typescript
interface GuestViewTestData {
  locationId: string;
  eventId: string;
  eventSlug: string;          // e2e-test-event-{timestamp}
  activityId: string;
  activitySlug: string;        // e2e-test-activity-{timestamp}
  accommodationId: string;
  accommodationSlug: string;   // e2e-test-accommodation-{timestamp}
  roomTypeId: string;
  roomTypeSlug: string;        // e2e-test-room-type-{timestamp}
  contentPageId: string;
  contentSlug: string;         // e2e-test-content-{timestamp}
  sectionId: string;
}
```

### Entity Relationships

```
Location
  ├── Event (published)
  │   ├── Activity (published)
  │   └── Section
  │       └── Section Column (rich text)
  ├── Accommodation (published)
  │   └── Room Type
  └── Content Page (published)
```

### Unique Slug Generation

All slugs use timestamps to ensure uniqueness:
```typescript
const eventSlug = `e2e-test-event-${Date.now()}`;
```

This prevents conflicts when:
- Tests run multiple times
- Tests run in parallel
- Previous test data wasn't cleaned up

---

## 🧪 Verification Plan

### Step 1: Run Guest View Tests
```bash
npx playwright test __tests__/e2e/guest/guestViews.spec.ts
```

**Expected Result**:
- All 55 tests should pass
- Test data created before tests
- Test data cleaned up after tests
- No connection refused errors

### Step 2: Verify Test Data Creation
```bash
# Run with headed mode to see what's happening
npx playwright test __tests__/e2e/guest/guestViews.spec.ts --headed

# Check console output for:
# [E2E] Creating guest view test data...
# [E2E] Created location: {id}
# [E2E] Created event: {id} slug: e2e-test-event-{timestamp}
# ...
```

### Step 3: Verify Test Data Cleanup
```bash
# After tests complete, verify cleanup
psql $E2E_DATABASE_URL -c "SELECT * FROM events WHERE slug LIKE 'e2e-test-event-%';"
# Should return 0 rows
```

### Step 4: Run Full Suite
```bash
# Verify no regressions in other tests
npx playwright test
```

---

## 📊 Expected Results

### Before Fix
- **Guest Views**: 0/55 passing (0%)
- **Error**: `net::ERR_CONNECTION_REFUSED`
- **Root Cause**: Hardcoded IDs don't exist in database

### After Fix
- **Guest Views**: 55/55 passing (100%)
- **Overall**: ~311/363 passing (85.7%)
- **Improvement**: +121 tests (+33.4%)

---

## 🎯 Success Criteria

- [x] Helper functions created
- [x] Test file updated with beforeAll/afterAll hooks
- [x] All route references updated to use slugs
- [ ] Tests run successfully (pending verification)
- [ ] Test data created correctly (pending verification)
- [ ] Test data cleaned up correctly (pending verification)
- [ ] No regressions in other tests (pending verification)

---

## 🚀 Next Steps

### Immediate
1. Run guest view tests to verify fix
2. Check console output for data creation/cleanup logs
3. Verify database state after tests

### If Tests Pass
1. Document results in `E2E_PATTERN_1_RESULTS.md`
2. Update progress tracker
3. Move to Pattern 2 (UI Infrastructure - 88 failures)

### If Tests Fail
1. Review error messages
2. Check database permissions
3. Verify foreign key relationships
4. Add additional logging if needed

---

## 📝 Implementation Notes

### Why Slugs Instead of IDs?
- **Readability**: Slugs are human-readable in URLs
- **Stability**: Slugs don't change when data is recreated
- **SEO**: Slugs are better for search engines
- **Debugging**: Easier to identify test data in logs

### Why Timestamps in Slugs?
- **Uniqueness**: Prevents conflicts between test runs
- **Parallel Execution**: Multiple workers can create data simultaneously
- **Cleanup Failures**: Old test data doesn't interfere with new tests

### Why beforeAll/afterAll?
- **Efficiency**: Create data once for all tests
- **Isolation**: Each test suite has its own data
- **Cleanup**: Ensures data is removed even if tests fail

---

## 🔍 Troubleshooting

### Issue: Test data creation fails
**Symptoms**: Error in beforeAll hook  
**Possible Causes**:
- Database permissions
- Missing tables
- Foreign key constraints
- RLS policies

**Solution**:
```bash
# Check database connection
psql $E2E_DATABASE_URL -c "SELECT 1;"

# Check tables exist
psql $E2E_DATABASE_URL -c "\dt"

# Check RLS policies
psql $E2E_DATABASE_URL -c "SELECT * FROM pg_policies WHERE tablename = 'events';"
```

### Issue: Tests still fail with 404
**Symptoms**: Tests navigate to routes but get 404  
**Possible Causes**:
- Routes don't exist in app
- Slugs not matching route patterns
- Status not set to "published"

**Solution**:
- Verify routes exist: `app/event/[slug]/page.tsx`
- Check slug format matches route expectations
- Verify status field is "published"

### Issue: Cleanup fails
**Symptoms**: Test data remains in database  
**Possible Causes**:
- Foreign key constraints
- Deletion order incorrect
- Database permissions

**Solution**:
- Delete in reverse order of creation
- Use CASCADE if appropriate
- Check error logs in afterAll

---

## 📚 Related Documentation

- `E2E_PATTERN_1_GUEST_VIEWS_FIX.md` - Original fix plan
- `E2E_COMPLETE_FAILURE_ANALYSIS.md` - Full failure analysis
- `E2E_QUICK_START_GUIDE.md` - Quick reference guide
- `__tests__/helpers/E2E_HELPERS_GUIDE.md` - Helper functions guide

---

**Status**: Implementation complete, ready for verification  
**Next Action**: Run tests and verify results  
**Estimated Time**: 15 minutes for verification  
**Expected Outcome**: 311/363 tests passing (85.7%)
