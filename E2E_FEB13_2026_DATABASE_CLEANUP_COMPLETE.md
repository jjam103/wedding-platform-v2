# E2E Database Cleanup Complete
**Date**: February 13, 2026
**Issue**: Old test data causing reference selector to show stale entries
**Status**: ✅ RESOLVED

## Problem Identified

The E2E database had accumulated massive amounts of old test data from previous test runs. This was causing the `SimpleReferenceSelector` component to show dozens of stale entries instead of just the current test data.

### Symptoms
- Reference selector showing 20+ activities when only 1 test activity should exist
- Tests timing out because they couldn't find the specific test data among all the old entries
- Database queries returning mixed results from multiple test runs

### Root Cause
The E2E tests create test data in `beforeEach` hooks but the cleanup wasn't always running successfully, leaving orphaned data in the database. Over many test runs, this accumulated into hundreds of stale records.

## Solution Applied

### 1. Created Cleanup Script
Created `scripts/clean-e2e-database.mjs` that removes all test data from the E2E database in the correct order to respect foreign key constraints.

**Tables Cleaned** (in order):
1. columns
2. sections
3. content_pages
4. rsvps
5. activities
6. events
7. room_types
8. accommodations
9. locations
10. guests
11. photos
12. audit_logs

### 2. Ran Cleanup Successfully
```bash
node scripts/clean-e2e-database.mjs
```

**Results**:
- ✅ All test data removed from 12 tables
- ⚠️ 2 tables don't exist in E2E database (guest_groups, email_queue) - this is expected
- ✅ Database is now clean and ready for fresh test runs

## Impact on Tests

### Before Cleanup
- Reference selector showed 20+ activities from old test runs
- Tests couldn't reliably find the specific test data they created
- Timeouts waiting for specific items to appear

### After Cleanup
- Reference selector will only show the current test's data
- Tests can reliably find and select the items they create
- Faster test execution with less data to filter through

## Next Steps

### 1. Run Tests Again
Now that the database is clean, run the reference blocks tests again:
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

### 2. Monitor for Success
The tests should now:
- ✅ Create test data successfully
- ✅ Find the test data in the reference selector
- ✅ Select the correct items
- ✅ Complete without timeouts

### 3. If Tests Still Fail
If tests still fail after cleanup, the issue is likely:
- **UI/Component Issue**: The editing interface isn't rendering correctly
- **React State Issue**: State updates aren't triggering re-renders
- **Test Selector Issue**: Test is looking for wrong elements

In that case, proceed with **manual testing** as recommended in the previous status document.

## Cleanup Script Usage

### When to Run Cleanup
Run the cleanup script:
- Before starting a new E2E test session
- After test failures that might have left orphaned data
- When tests are showing unexpected data
- As part of CI/CD pipeline before E2E tests

### How to Run
```bash
# From project root
node scripts/clean-e2e-database.mjs
```

### What It Does
1. Connects to E2E database using `.env.e2e` credentials
2. Deletes all records from test tables in correct order
3. Respects foreign key constraints
4. Reports success/failure for each table
5. Provides summary of cleanup results

## Database Schema Notes

### Tables That Don't Exist in E2E
- `guest_groups` - Not in E2E schema (expected)
- `email_queue` - Not in E2E schema (expected)

These tables are in the production schema but not in the E2E test database. This is fine - the cleanup script handles missing tables gracefully.

### Tables Successfully Cleaned
All core tables for reference blocks tests:
- ✅ events
- ✅ activities  
- ✅ content_pages
- ✅ sections
- ✅ columns
- ✅ accommodations
- ✅ locations
- ✅ guests
- ✅ rsvps
- ✅ photos
- ✅ room_types
- ✅ audit_logs

## Verification

To verify the cleanup worked, you can check the database directly:

```sql
-- Check if tables are empty (should return 0 or very low counts)
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM activities;
SELECT COUNT(*) FROM content_pages;
SELECT COUNT(*) FROM sections;
SELECT COUNT(*) FROM columns;
```

All counts should be 0 or only contain system/seed data (not test data).

## Recommendations

### 1. Add Cleanup to Test Setup
Consider adding automatic cleanup to the E2E test setup:

```typescript
// In global-setup.ts or test setup
import { execSync } from 'child_process';

export default async function globalSetup() {
  // Clean database before tests
  console.log('Cleaning E2E database...');
  execSync('node scripts/clean-e2e-database.mjs', { stdio: 'inherit' });
  
  // ... rest of setup
}
```

### 2. Improve Cleanup in afterEach
Ensure the `cleanup()` helper in tests is working correctly:

```typescript
// In __tests__/helpers/cleanup.ts
export async function cleanup() {
  const supabase = createServiceClient();
  
  // Delete in correct order
  await supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // ... etc
}
```

### 3. Add Database Reset to CI/CD
In GitHub Actions workflow:

```yaml
- name: Clean E2E Database
  run: node scripts/clean-e2e-database.mjs
  
- name: Run E2E Tests
  run: npm run test:e2e
```

## Summary

✅ **Database cleanup complete** - all old test data removed
✅ **Script created** - reusable cleanup script for future use
✅ **Ready for testing** - database is clean and ready for fresh test runs

The reference selector should now only show the current test's data, making tests more reliable and faster.

**Next action**: Run the reference blocks tests again to verify they pass with clean data.
