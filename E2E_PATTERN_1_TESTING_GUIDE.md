# E2E Pattern 1 Fix - Testing Guide

## Quick Start

```bash
# 1. Apply database migration
npx supabase db push --db-url "$SUPABASE_E2E_DB_URL"

# 2. Verify constraint was added
node scripts/verify-guest-sessions-constraint.mjs

# 3. Run single test to verify fix
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts:154 --headed

# 4. Run full guest auth suite
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# 5. Run full E2E suite to prove unblocking
npx playwright test --reporter=list --max-failures=50
```

## Detailed Testing Steps

### Step 1: Apply Database Migration

The fix requires a unique constraint on the `guest_sessions.token` column.

```bash
# For E2E database
npx supabase db push --db-url "$SUPABASE_E2E_DB_URL"

# For local development database
npx supabase db push
```

**Expected Output**:
```
Applying migration 054_add_guest_sessions_token_unique_constraint.sql...
✓ Migration applied successfully
```

**Verification**:
```bash
node scripts/verify-guest-sessions-constraint.mjs
```

**Expected Output**:
```
✅ Constraint exists!
   Name: guest_sessions_token_unique
   Type: UNIQUE
   Table: guest_sessions

✅ Pattern 1 fix database requirement satisfied
```

### Step 2: Run Single Test (Smoke Test)

Test the most basic guest authentication flow:

```bash
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts:154 --headed
```

**What to Watch For**:
1. Browser opens and navigates to `/auth/guest-login`
2. Form is filled with test email
3. Submit button is clicked
4. **CRITICAL**: Browser should navigate to `/guest/dashboard` (NOT loop back to login)
5. Dashboard page loads successfully
6. Test passes

**Expected Output**:
```
Running 1 test using 1 worker

  ✓  [chromium] › __tests__/e2e/auth/guestAuth.spec.ts:154:7 › Guest Authentication › should successfully authenticate with email matching (5s)

  1 passed (6s)
```

**If Test Fails**:
- Check browser console for errors
- Check middleware logs in terminal
- Look for redirect loop in browser URL bar
- See "Troubleshooting" section below

### Step 3: Run Full Guest Auth Suite

Test all 15 guest authentication scenarios:

```bash
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts
```

**Expected Output**:
```
Running 15 tests using 3 workers

  ✓  [chromium] › should successfully authenticate with email matching (5s)
  ✓  [chromium] › should show error for non-existent email (2s)
  ✓  [chromium] › should show error for invalid email format (1s)
  ⊘  [chromium] › should show loading state during authentication (skipped)
  ✓  [chromium] › should create session cookie on successful authentication (5s)
  ✓  [chromium] › should successfully request and verify magic link (8s)
  ✓  [chromium] › should show success message after requesting magic link (4s)
  ✓  [chromium] › should show error for expired magic link (3s)
  ✓  [chromium] › should show error for already used magic link (7s)
  ✓  [chromium] › should show error for invalid or missing token (2s)
  ✓  [chromium] › should complete logout flow (6s)
  ✓  [chromium] › should persist authentication across page refreshes (8s)
  ✓  [chromium] › should switch between authentication tabs (2s)
  ✓  [chromium] › should handle authentication errors gracefully (5s)
  ✓  [chromium] › should log authentication events in audit log (6s)

  1 skipped
  14 passed (1.2m)
```

**Success Criteria**:
- 14/15 tests passing (1 test is intentionally skipped)
- No timeout errors
- No redirect loop errors
- All tests complete within 2 minutes

### Step 4: Run Full E2E Suite (Proof of Unblocking)

This is the critical test to prove Pattern 1 fix unblocks the suite:

```bash
npx playwright test --reporter=list --max-failures=50 > e2e-pattern1-fix-results.txt 2>&1
```

**Expected Results**:

**Before Fix**:
- ✅ 114 tests passed (31.5%)
- ❌ 50 tests failed (13.8%)
- ⚠️ 13 tests flaky (3.6%)
- ⏭️ 8 tests skipped (2.2%)
- 🚫 3 tests interrupted (0.8%)
- ⏸️ 174 tests didn't run (48.1%) - **BLOCKED BY PATTERN 1**

**After Fix** (Expected):
- ✅ 220+ tests passed (60%+)
- ❌ 35-40 tests failed (10-11%)
- ⚠️ 10-15 tests flaky (3-4%)
- ⏭️ 8 tests skipped (2.2%)
- 🚫 0 tests interrupted (0%)
- ⏸️ 0 tests didn't run (0%) - **ALL TESTS CAN NOW RUN**

**Key Metrics to Check**:
```bash
# Count passing tests
grep "passed" e2e-pattern1-fix-results.txt | tail -1

# Count tests that didn't run
grep "did not run" e2e-pattern1-fix-results.txt

# Check guest auth tests specifically
grep "guestAuth.spec.ts" e2e-pattern1-fix-results.txt
```

### Step 5: Analyze Results

```bash
# Generate summary
node scripts/analyze-e2e-results.mjs e2e-pattern1-fix-results.txt

# Check for remaining patterns
grep "failed" e2e-pattern1-fix-results.txt | wc -l
```

## Troubleshooting

### Issue: Test Still Fails with Redirect Loop

**Symptoms**:
```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
waiting for navigation to "/guest/dashboard"
  navigated to "http://localhost:3000/auth/guest-login"
  navigated to "http://localhost:3000/auth/guest-login"
  navigated to "http://localhost:3000/auth/guest-login"
```

**Diagnosis**:
1. Check if migration was applied:
   ```bash
   node scripts/verify-guest-sessions-constraint.mjs
   ```

2. Check middleware logs:
   ```bash
   # Look for these logs in test output:
   [Middleware] Guest auth check: { path: '/guest/dashboard', hasCookie: true, ... }
   [Middleware] Session query result: { sessionFound: true, ... }
   ```

3. Check if cookie is being set:
   ```bash
   # Look for this log in test output:
   [API] Setting guest session cookie: { tokenPrefix: '...', ... }
   ```

**Solutions**:
- If constraint missing: Re-run migration
- If cookie not set: Check API route response
- If middleware not finding session: Check database for session record

### Issue: Test Passes But Others Fail

**Symptoms**:
```
✓  should successfully authenticate with email matching (5s)
✗  should create session cookie on successful authentication (timeout)
```

**Diagnosis**:
Test pollution - previous test's session is interfering.

**Solutions**:
1. Increase cleanup delay in `afterEach`:
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 10000)); // Try 10s
   ```

2. Run tests serially:
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --workers=1
   ```

3. Check for orphaned sessions:
   ```sql
   SELECT COUNT(*) FROM guest_sessions WHERE guest_id IN (
     SELECT id FROM guests WHERE email LIKE 'test-w%@example.com'
   );
   ```

### Issue: Migration Fails

**Symptoms**:
```
Error: duplicate key value violates unique constraint "guest_sessions_token_unique"
```

**Diagnosis**:
Duplicate tokens exist in database (shouldn't happen, but possible).

**Solutions**:
1. Find duplicates:
   ```sql
   SELECT token, COUNT(*) 
   FROM guest_sessions 
   GROUP BY token 
   HAVING COUNT(*) > 1;
   ```

2. Delete duplicates (keep most recent):
   ```sql
   DELETE FROM guest_sessions
   WHERE id NOT IN (
     SELECT MAX(id)
     FROM guest_sessions
     GROUP BY token
   );
   ```

3. Re-run migration:
   ```bash
   npx supabase db push --db-url "$SUPABASE_E2E_DB_URL"
   ```

## Success Indicators

### Middleware Logs (Good)
```
[Middleware] Guest auth check: { 
  path: '/guest/dashboard', 
  hasCookie: true, 
  cookieValue: 'a1b2c3d4...', 
  allCookies: ['guest_session'] 
}
[Middleware] Session query result: { 
  sessionFound: true, 
  hasError: false, 
  tokenPrefix: 'a1b2c3d4' 
}
```

### Browser Console (Good)
```
[Test] About to click submit button
[API] Setting guest session cookie: { 
  tokenPrefix: 'a1b2c3d4', 
  guestId: 'uuid-here', 
  sessionId: 'uuid-here' 
}
```

### Test Output (Good)
```
✓  [chromium] › should successfully authenticate with email matching (5s)
   navigated to "http://localhost:3000/auth/guest-login"
   navigated to "http://localhost:3000/guest/dashboard"
```

## Next Steps After Success

1. **Document Results**:
   ```bash
   cp e2e-pattern1-fix-results.txt E2E_PATTERN_1_FIX_RESULTS.txt
   ```

2. **Commit Changes**:
   ```bash
   git add middleware.ts app/auth/guest-login/page.tsx __tests__/e2e/auth/guestAuth.spec.ts
   git add supabase/migrations/054_add_guest_sessions_token_unique_constraint.sql
   git commit -m "fix(e2e): Fix Pattern 1 (Guest Authentication) - Unblock 52% of test suite"
   ```

3. **Move to Pattern 2**:
   - Review `E2E_PATTERN_FIX_GUIDE.md`
   - Start fixing Pattern 2 (Email Management - 11 failures)

4. **Update Progress**:
   - Update `E2E_100_PERCENT_ACTION_PLAN.md` with Pattern 1 completion
   - Mark Pattern 1 as ✅ COMPLETE

## Quick Reference Commands

```bash
# Apply migration
npx supabase db push --db-url "$SUPABASE_E2E_DB_URL"

# Verify migration
node scripts/verify-guest-sessions-constraint.mjs

# Run single test
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts:154 --headed

# Run guest auth suite
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# Run full suite
npx playwright test --reporter=list --max-failures=50

# Check results
grep "passed" e2e-pattern1-fix-results.txt | tail -1
grep "did not run" e2e-pattern1-fix-results.txt
```
