# E2E Phase 2: Debugging Added - Next Steps

## Status: 🔍 Debugging Instrumentation Added

### Current Situation

**Test Results**: 3/16 passing (19%)
- ✅ Admin authentication works
- ✅ Error handling for non-existent email works
- ✅ Error handling for invalid email format works
- ❌ 13 tests fail due to guest email not found

### Root Cause Analysis

The primary issue is that tests create guests with unique emails like:
```
test-w1-1770419998729-x8p64bid@example.com
```

But when the API tries to find them, it returns 404 (not found). This suggests either:
1. **Race condition** - Guest not fully committed to database before API query
2. **Database isolation issue** - Different database connections seeing different data
3. **Email mismatch** - Email being searched doesn't match email created

### Debugging Added

#### 1. API Route Logging (`app/api/guest-auth/email-match/route.ts`)

Added comprehensive logging to see what's happening:

```typescript
// Before query
console.log('[API] Looking for guest with email:', sanitizedEmail);

// After query
console.log('[API] Guest query result:', {
  found: !!guest,
  email: guest?.email,
  authMethod: guest?.auth_method,
  error: guestError?.message,
});
```

This will show us:
- What email the API is searching for
- Whether the guest was found
- What auth method the guest has
- Any database errors

#### 2. Test Setup Logging (`__tests__/e2e/auth/guestAuth.spec.ts`)

Added verification after guest creation:

```typescript
// Log creation details
console.log(`[Worker ${workerId}] Created test guest:`, {
  email: testGuestEmail,
  id: testGuestId,
  authMethod: guest.auth_method,
  groupId: testGroupId,
});

// Verify guest exists by querying it back
const { data: verifyGuest, error: verifyError } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .eq('id', testGuestId)
  .single();

if (verifyError || !verifyGuest) {
  console.error(`[Worker ${workerId}] ⚠️  Could not verify guest creation:`, {
    error: verifyError,
    guestId: testGuestId,
  });
} else {
  console.log(`[Worker ${workerId}] ✅ Verified guest exists:`, {
    email: verifyGuest.email,
    authMethod: verifyGuest.auth_method,
  });
}

// Small delay to ensure database consistency
await new Promise(resolve => setTimeout(resolve, 100));
```

This will show us:
- What email was created
- Whether the guest can be queried back immediately
- If there's a database consistency issue

### Next Steps

#### 1. Run Tests with Debugging (IMMEDIATE)

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1
```

**What to look for in the logs:**

**Scenario A: Email Mismatch**
```
[Worker 1] Created test guest: { email: 'test-w1-123@example.com', ... }
[API] Looking for guest with email: 'test-w1-456@example.com'  ❌ Different!
```
**Solution**: Fix email generation or passing

**Scenario B: Race Condition**
```
[Worker 1] Created test guest: { email: 'test-w1-123@example.com', ... }
[Worker 1] ⚠️  Could not verify guest creation  ❌ Not committed yet!
[API] Looking for guest with email: 'test-w1-123@example.com'
[API] Guest query result: { found: false }
```
**Solution**: Increase delay or add retry logic

**Scenario C: Database Isolation**
```
[Worker 1] ✅ Verified guest exists: { email: 'test-w1-123@example.com', ... }
[API] Looking for guest with email: 'test-w1-123@example.com'
[API] Guest query result: { found: false }  ❌ Different connection!
```
**Solution**: Ensure both use same database URL

**Scenario D: Auth Method Mismatch**
```
[Worker 1] ✅ Verified guest exists: { email: 'test-w1-123@example.com', authMethod: null }
[API] Looking for guest with email: 'test-w1-123@example.com'
[API] Guest query result: { found: false }  ❌ Auth method doesn't match!
```
**Solution**: Ensure auth_method is set correctly

#### 2. Analyze Logs and Apply Fix

Based on what the logs show, apply the appropriate fix:

**If Email Mismatch:**
- Check how `testGuestEmail` is passed to the form
- Ensure no transformations are applied

**If Race Condition:**
- Increase delay after guest creation
- Add retry logic in API route
- Use database transactions

**If Database Isolation:**
- Verify both test and API use same `NEXT_PUBLIC_SUPABASE_URL`
- Check if Playwright's `webServer.env` is working correctly
- Ensure no connection pooling issues

**If Auth Method Issue:**
- Verify `auth_method` column exists and is set
- Check if default value is applied
- Ensure migration has run

#### 3. Fix Server Stability (SECONDARY)

The `ERR_CONNECTION_REFUSED` errors suggest the dev server crashes during tests. This is likely due to:
- Compilation errors triggered by test requests
- Resource exhaustion (too many workers)
- Memory leaks

**Solutions:**
- Run tests with `--workers=1` (already doing this)
- Increase worker timeout in `playwright.config.ts`
- Monitor server logs for crash reasons
- Consider using production build for E2E tests

### Expected Outcome

After running tests with debugging, we should see clear evidence of:
1. **What email is being created** vs **what email is being searched**
2. **Whether the guest exists** in the database after creation
3. **Whether the API can find the guest** when it queries

This will give us the exact information needed to fix the issue.

### Files Modified

1. ✅ `app/api/guest-auth/email-match/route.ts` - Added API logging
2. ✅ `__tests__/e2e/auth/guestAuth.spec.ts` - Added test setup logging and verification

### Confidence Level: VERY HIGH

We've added comprehensive logging at both ends (test setup and API route) to capture exactly what's happening. The next test run will reveal the root cause.

---

## Quick Commands

### Run Tests with Debugging
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1 > e2e-debug-run.log 2>&1
```

### View Logs
```bash
# View full log
cat e2e-debug-run.log

# Search for worker logs
grep "\[Worker" e2e-debug-run.log

# Search for API logs
grep "\[API\]" e2e-debug-run.log

# Search for errors
grep -i "error\|failed\|⚠️" e2e-debug-run.log
```

### Compare Emails
```bash
# Extract created emails
grep "Created test guest" e2e-debug-run.log

# Extract searched emails
grep "Looking for guest with email" e2e-debug-run.log
```

---

## Success Criteria

After the next test run, we should be able to:
1. ✅ Identify the exact root cause from logs
2. ✅ Apply a targeted fix
3. ✅ Get all 16 tests passing

The debugging instrumentation will make the issue obvious.
