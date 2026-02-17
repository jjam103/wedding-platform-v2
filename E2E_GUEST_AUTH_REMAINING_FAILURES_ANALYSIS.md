# E2E Guest Authentication - Remaining Test Failures Analysis

**Date**: 2025-02-06  
**Status**: 8/15 tests passing (53%)  
**Previous Phase**: Phase 7 - Test Cleanup Timing Fix Complete

## Current Test Results

### ✅ Passing Tests (8/15)
1. ✅ should successfully authenticate with email matching
2. ✅ should show error for non-existent email
3. ✅ should show error for invalid email format
5. ✅ should create session cookie on successful authentication
10. ✅ should show error for invalid or missing token
11. ✅ should complete logout flow
12. ✅ should persist authentication across page refreshes
13. ✅ should switch between authentication tabs

### ❌ Failing Tests (7/15)

#### Test 4: "should show loading state during authentication"
**Status**: FAILING - API routes return 500 errors
**Evidence**: Session validation works, but subsequent API calls fail
**Root Cause**: Missing tables or data in test database

#### Tests 6-9: Magic Link Tests
**Status**: FAILING - Magic link endpoints return 404
**Tests**:
- Test 6: should successfully request and verify magic link
- Test 7: should show success message after requesting magic link
- Test 8: should show error for expired magic link
- Test 9: should show error for already used magic link

**Root Cause**: Magic link routes exist but may have issues

#### Tests 14-15: Advanced Tests
**Status**: FAILING - Timeout after 120 seconds
**Tests**:
- Test 14: should handle authentication errors gracefully
- Test 15: should log authentication events in audit log

**Root Cause**: 
- Test 14 depends on magic link feature (creates expired token)
- Test 15 depends on audit_logs having `details` column

## Detailed Analysis

### Issue 1: API 500 Errors (Test 4)

**Affected Routes**:
- `/api/guest/wedding-info` - Returns 500
- `/api/guest/announcements` - Returns 500
- `/api/guest/rsvps` - Returns 500

**Root Cause**: Missing tables in test database
1. `settings` table - Required by `/api/guest/wedding-info`
2. `announcements` table - Required by `/api/guest/announcements`

**Evidence from Code**:
```typescript
// app/api/guest/wedding-info/route.ts
const { data: settings, error: settingsError } = await supabase
  .from('settings')  // ← Table might not exist
  .select('wedding_date, wedding_location, wedding_venue')
  .single();

// app/api/guest/announcements/route.ts
const { data: announcements, error: announcementsError } = await supabase
  .from('announcements')  // ← Table might not exist
  .select('id, title, message, urgent, created_at')
  .eq('active', true)
```

**Why Session Works But APIs Fail**:
- Guest authentication is working correctly (session created, cookie set)
- The test navigates to `/guest/dashboard` successfully
- But the dashboard tries to load data from missing tables
- This causes 500 errors that don't affect the authentication flow itself

### Issue 2: Magic Link 404 Errors (Tests 6-9)

**Affected Routes**:
- `/api/guest-auth/magic-link/request` - Returns 404
- `/api/guest-auth/magic-link/verify` - Returns 404

**Investigation Needed**:
The routes exist in the codebase:
- `app/api/guest-auth/magic-link/request/route.ts` ✅ EXISTS
- `app/api/guest-auth/magic-link/verify/route.ts` ✅ EXISTS

**Possible Causes**:
1. Routes not being compiled/built correctly
2. Route warmup in global-setup.ts not including magic link routes
3. Next.js routing issue with nested dynamic routes

**Evidence from global-setup.ts**:
```typescript
// Current warmup routes
const routesToWarmup = [
  '/api/guest-auth/email-match',
  '/api/guest-auth/logout',
  // ← Magic link routes NOT included!
];
```

### Issue 3: Timeout Tests (Tests 14-15)

**Test 14**: "should handle authentication errors gracefully"
- Creates an expired magic link token
- Depends on magic link verification working
- Times out because magic link routes return 404

**Test 15**: "should log authentication events in audit log"
- Queries `audit_logs` table for `details` column
- Migration `053_add_action_and_details_to_audit_logs.sql` exists but may not be applied

**Evidence**:
```typescript
// Test expects this structure
expect(loginLogs![0].details.auth_method).toBe('email_matching');
expect(loginLogs![0].details.email).toBe(testGuestEmail);
```

## Fix Strategy

### Phase 8: Fix Missing Tables and Data (Test 4)

**Priority**: HIGH - Affects dashboard functionality

**Actions**:
1. Check if `settings` table exists in test database
2. Check if `announcements` table exists in test database
3. Create migrations if tables are missing
4. Seed test database with minimal required data
5. Update global-setup.ts to create test data

**Alternative**: Make these routes handle missing data gracefully
```typescript
// Option: Return empty/default data instead of 500
if (settingsError) {
  // Instead of returning 500, return defaults
  return NextResponse.json({
    success: true,
    data: {
      date: null,
      location: 'Costa Rica',
      venue: 'TBD',
    },
  });
}
```

### Phase 9: Fix Magic Link Routes (Tests 6-9)

**Priority**: HIGH - 4 tests failing

**Actions**:
1. Verify routes are being built correctly
2. Add magic link routes to warmup in global-setup.ts
3. Test routes directly with curl/fetch
4. Check Next.js routing configuration

**Route Warmup Fix**:
```typescript
const routesToWarmup = [
  '/api/guest-auth/email-match',
  '/api/guest-auth/logout',
  '/api/guest-auth/magic-link/request',  // ADD
  '/api/guest-auth/magic-link/verify',   // ADD
];
```

### Phase 10: Fix Audit Logs Migration (Test 15)

**Priority**: MEDIUM - 1 test failing

**Actions**:
1. Verify migration `053_add_action_and_details_to_audit_logs.sql` is applied to test database
2. Run migration application script
3. Verify `details` column exists with correct type (JSONB)

**Migration to Apply**:
```sql
-- supabase/migrations/053_add_action_and_details_to_audit_logs.sql
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action VARCHAR(100),
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
```

### Phase 11: Skip or Fix Test 14

**Priority**: LOW - Depends on magic link working

**Options**:
1. **Option A**: Skip test until magic link is fully implemented
   ```typescript
   test.skip('should handle authentication errors gracefully', async ({ page }) => {
   ```

2. **Option B**: Fix magic link routes first, then test will pass

## Recommended Execution Order

### Step 1: Quick Wins (Get to 10/15 passing)
1. Add magic link routes to warmup in global-setup.ts
2. Test magic link routes directly
3. This should fix tests 6-9 (4 tests)

### Step 2: Database Schema (Get to 11/15 passing)
1. Apply audit logs migration to test database
2. This should fix test 15 (1 test)

### Step 3: Missing Tables (Get to 12/15 passing)
1. Check for missing `settings` and `announcements` tables
2. Either create tables or make routes handle missing data gracefully
3. This should fix test 4 (1 test)

### Step 4: Final Test (Get to 13/15 passing)
1. Test 14 should pass once magic link routes work
2. This gets us to 13/15 (87% pass rate)

### Step 5: Remaining Tests
- Tests 1-3, 5, 10-13 already passing
- Tests 6-9 should pass after magic link fix
- Test 15 should pass after migration
- Test 4 should pass after table fix
- Test 14 should pass after magic link fix

## Expected Final Result

**Target**: 13/15 tests passing (87%)

**Passing Tests**:
- All email matching tests (1-5)
- All magic link tests (6-10)
- All auth state tests (11-13)
- Error handling test (14)
- Audit log test (15)

## Files to Modify

1. `__tests__/e2e/global-setup.ts` - Add magic link routes to warmup
2. `app/api/guest/wedding-info/route.ts` - Handle missing settings gracefully
3. `app/api/guest/announcements/route.ts` - Handle missing announcements gracefully
4. Apply migration: `supabase/migrations/053_add_action_and_details_to_audit_logs.sql`

## Next Steps

1. **Immediate**: Add magic link routes to warmup and test
2. **Quick**: Apply audit logs migration
3. **Medium**: Fix missing tables or make routes handle gracefully
4. **Verify**: Run full test suite and confirm 13/15 passing
