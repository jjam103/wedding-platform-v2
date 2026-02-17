Cont# Critical Bugs Fixed - Manual Testing Session

**Date**: January 30, 2026  
**Total Bugs Fixed**: 3 critical bugs  
**Status**: Partial fix - 3/8 bugs fixed, 5 require more work

## Bugs Fixed ✅

### Bug #1: Number Field Validation ✅ FIXED

**Issue**: HTML input type="number" returns string, but Zod schemas expected number type.

**Error**:
```
Base Cost: Expected number, received string
Amount Paid: Expected number, received string
```

**Fix Applied**:
- Changed `z.number()` to `z.coerce.number()` in all form-facing schemas
- Files modified:
  - `schemas/vendorSchemas.ts` - baseCost, amountPaid, payment amount
  - `schemas/activitySchemas.ts` - capacity, costPerPerson, hostSubsidy
  - `schemas/accommodationSchemas.ts` - capacity, totalRooms, pricePerNight, hostSubsidyPerNight

**Why Tests Didn't Catch This**:
- Unit tests pass numbers directly to service methods
- Tests don't simulate HTML form submission
- No integration tests that use actual HTML forms

**Prevention**:
- Add integration tests that submit forms via DOM
- Use `z.coerce.number()` by default for all number fields in forms
- Add contract tests to validate form field types match schema expectations

---

### Bug #2: Accommodation Status Enum Mismatch ✅ FIXED

**Issue**: Form had 'available', 'booked', 'unavailable' options but schema expected 'draft', 'published'.

**Error**:
```
Status: Invalid enum value. Expected 'draft' | 'published', received 'available'
```

**Fix Applied**:
- Updated form options to match schema:
  - Changed from: 'available', 'booked', 'unavailable'
  - Changed to: 'draft', 'published'
- Updated column render logic to display correct status badges
- File modified: `app/admin/accommodations/page.tsx`

**Why Tests Didn't Catch This**:
- Tests use correct enum values from schema
- No contract tests validating form options match schema enums
- Component tests mock form submission

**Prevention**:
- Add contract tests for all enum fields: `formOptions === schemaEnum.options`
- Create shared enum constants used by both schema and form
- Add TypeScript type checking for form option values

---

### Bug #3: Content Pages RLS Policy ✅ FIXED

**Issue**: RLS policy checked `auth.users` table instead of `users` table for role.

**Error**:
```
new row violates row-level security policy for table "content_pages"
```

**Fix Applied**:
- Changed RLS policy from `auth.users` to `users` table
- Files modified:
  - `supabase/migrations/019_create_content_pages_table.sql`
  - Created `scripts/fix-content-pages-rls.mjs` to apply fix

**To Apply Fix**:
```bash
node scripts/fix-content-pages-rls.mjs
```

Or run this SQL in Supabase dashboard:
```sql
DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;

CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
```

**Why Tests Didn't Catch This**:
- Integration tests use service role key that bypasses RLS
- No RLS-specific tests for content_pages table
- Tests don't simulate actual user authentication flow

**Prevention**:
- Add RLS integration tests for ALL tables
- Test with actual user credentials, not service role
- Add smoke tests that verify each table's RLS policies

---

## Bugs Requiring More Work ⚠️

### Bug #4: Guest Groups Missing Feature ⛔ BLOCKING

**Issue**: Guest group is required field but no UI to create guest groups.

**Status**: Requires feature implementation (30-60 min)

**Required Work**:
1. Create guest groups API route (`/api/admin/guest-groups`)
2. Create guest groups management page (`/admin/guest-groups`)
3. Add guest group selector to guest form
4. Update navigation to include guest groups

**Why Tests Didn't Catch This**:
- Tests mock guest data with valid group IDs
- No E2E test for "create guest from scratch" workflow
- Missing feature completeness tests

---

### Bug #5: Manage Sections 404 Error ⛔ BLOCKING

**Issue**: Clicking "Manage Sections" on events/activities leads to 404.

**Status**: Requires route implementation (15 min)

**Required Work**:
1. Create `/admin/events/[id]/sections/page.tsx`
2. Create `/admin/activities/[id]/sections/page.tsx`
3. Or remove "Manage Sections" buttons if not implemented

**Why Tests Didn't Catch This**:
- No E2E tests for navigation flows
- Component tests mock navigation
- Missing route coverage tests

---

### Bug #6: View Event 404 Error ⛔ BLOCKING

**Issue**: Clicking "View" on event leads to 404.

**Status**: Requires route implementation or button removal (10 min)

**Required Work**:
1. Create `/admin/events/[id]/page.tsx` view page
2. Or remove "View" button from events table

**Why Tests Didn't Catch This**:
- No E2E tests for all navigation paths
- Missing route coverage tests

---

### Bug #7: LocationSelector Not Showing Options 🔴 HIGH

**Issue**: Location selector doesn't show options when editing events/activities.

**Status**: Requires debugging (15 min)

**Required Work**:
1. Debug LocationSelector component data loading
2. Check if locations are being fetched
3. Verify LocationSelector props are correct

**Why Tests Didn't Catch This**:
- Component tests mock data successfully
- No integration tests with real API calls
- Missing data loading tests

---

### Bug #8: Error Handling Throws Instead of Toast 🟡 MEDIUM

**Issue**: Errors thrown to console instead of user-friendly toasts.

**Status**: Requires error handling refactor (10 min)

**Required Work**:
1. Wrap error-prone operations in try-catch
2. Show toast messages instead of throwing
3. Add error boundaries for unhandled errors

**Why Tests Didn't Catch This**:
- Tests check for error returns, not UI display
- No tests for error toast display
- Missing error UX tests

---

## Test Coverage Gaps Identified

### 1. E2E User Workflows ❌
**Gap**: No tests for complete user journeys  
**Impact**: Missing feature bugs, navigation 404s  
**Fix**: Add Playwright E2E tests for critical workflows

### 2. Form Submission Integration ❌
**Gap**: Tests don't use actual HTML forms  
**Impact**: Type coercion bugs, validation mismatches  
**Fix**: Add integration tests that submit via DOM

### 3. RLS Policy Testing ❌
**Gap**: No tests for row-level security  
**Impact**: Permission errors in production  
**Fix**: Add RLS tests for all tables with real user auth

### 4. Contract Testing ❌
**Gap**: No validation that forms match schemas  
**Impact**: Enum mismatches, type errors  
**Fix**: Add contract tests for form options vs schema

### 5. Navigation Testing ❌
**Gap**: No tests for all routes and links  
**Impact**: 404 errors, broken navigation  
**Fix**: Add route coverage tests

### 6. Error UI Testing ❌
**Gap**: No tests for error display  
**Impact**: Poor error UX  
**Fix**: Add tests for toast/error feedback

### 7. Data Loading Integration ❌
**Gap**: Components tested with mocked data  
**Impact**: Data loading bugs  
**Fix**: Add integration tests with real API calls

---

## Testing Improvements Needed

### Immediate (High Priority)

1. **Add E2E Tests for Critical Workflows**
   ```typescript
   // __tests__/e2e/guestCreation.spec.ts
   test('should create guest from scratch', async ({ page }) => {
     await page.goto('/admin/guests');
     await page.click('text=Add Guest');
     // Fill form with real HTML inputs
     await page.fill('input[name="firstName"]', 'John');
     // ... submit and verify
   });
   ```

2. **Add RLS Tests for All Tables**
   ```typescript
   // __tests__/integration/rls/contentPages.test.ts
   test('should allow hosts to create content pages', async () => {
     const hostClient = await createAuthenticatedClient('host');
     const result = await hostClient
       .from('content_pages')
       .insert({ title: 'Test', slug: 'test' });
     expect(result.error).toBeNull();
   });
   ```

3. **Add Contract Tests for Forms**
   ```typescript
   // __tests__/contracts/formSchemas.test.ts
   test('accommodation form options match schema', () => {
     const formOptions = getFormOptions('status');
     const schemaEnum = accommodationSchema.shape.status;
     expect(formOptions).toEqual(schemaEnum.options);
   });
   ```

### Short Term (Medium Priority)

4. **Add Integration Tests for Form Submission**
5. **Add Route Coverage Tests**
6. **Add Error UI Tests**

### Long Term (Low Priority)

7. **Add Data Loading Integration Tests**
8. **Add Feature Completeness Tests**
9. **Add Accessibility Tests for Forms**

---

## Summary

**Bugs Fixed**: 3/8 (37.5%)  
**Bugs Remaining**: 5 (2 critical, 2 blocking, 1 high)  
**Estimated Time to Fix Remaining**: 1-2 hours  

**Key Learnings**:
1. Unit tests alone are insufficient - need E2E and integration tests
2. RLS policies must be tested with real user authentication
3. Form validation needs integration testing with HTML forms
4. Navigation and routing need comprehensive coverage
5. Contract tests needed for form/schema alignment

**Next Steps**:
1. Apply RLS fix: `node scripts/fix-content-pages-rls.mjs`
2. Test number field fixes in browser
3. Test accommodation status fix
4. Implement remaining bug fixes (guest groups, routes, etc.)
5. Add comprehensive E2E and integration tests

---

## Files Modified

1. `schemas/vendorSchemas.ts` - Number coercion
2. `schemas/activitySchemas.ts` - Number coercion
3. `schemas/accommodationSchemas.ts` - Number coercion + status fix
4. `app/admin/accommodations/page.tsx` - Status enum fix
5. `supabase/migrations/019_create_content_pages_table.sql` - RLS fix
6. `scripts/fix-content-pages-rls.mjs` - Created RLS fix script
7. `MANUAL_TESTING_BUGS_FOUND.md` - Bug documentation
8. `CRITICAL_BUGS_FIXED.md` - This file
