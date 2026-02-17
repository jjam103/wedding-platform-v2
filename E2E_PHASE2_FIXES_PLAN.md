# E2E Phase 2: Fixes Plan

## Status: 📋 Action Plan Ready

### Root Causes Identified

After analyzing the test failures, I've identified the following issues:

#### Issue 1: Parallel Test Execution Conflicts
**Problem**: Tests run in parallel (4 workers) and use `Date.now()` for unique emails, but multiple tests starting at the same millisecond could create conflicts.

**Solution**: Use a more unique identifier that includes worker ID and random component.

#### Issue 2: Incomplete Cleanup Between Tests
**Problem**: The `cleanup()` function runs after each test, but if a test fails during setup, the cleanup might not run properly, leaving orphaned data.

**Solution**: Use `test.beforeEach` and `test.afterEach` with proper error handling.

#### Issue 3: Missing Error Details in Test Setup
**Problem**: When guest creation fails, the error message "Failed to create test guest" doesn't show the actual database error.

**Solution**: Log the actual error from Supabase to help debug.

#### Issue 4: Cookie Handling in Tests
**Problem**: The authentication might be working, but cookies aren't being properly set or sent in subsequent requests.

**Solution**: Verify cookie handling in Playwright and ensure `credentials: 'include'` is working.

## Fixes to Apply

### Fix 1: Improve Test Data Uniqueness

```typescript
// In __tests__/e2e/auth/guestAuth.spec.ts
test.beforeEach(async ({ }, testInfo) => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create unique email using worker ID, test ID, and random component
  const workerId = testInfo.workerIndex;
  const testId = testInfo.testId.slice(0, 8);
  const random = Math.random().toString(36).substring(7);
  testGuestEmail = `test-${workerId}-${testId}-${random}@example.com`;
  
  // ... rest of setup
});
```

### Fix 2: Add Error Logging to Test Setup

```typescript
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .insert({
    first_name: 'Test',
    last_name: 'Guest',
    email: testGuestEmail,
    group_id: testGroupId,
    age_type: 'adult',
    guest_type: 'wedding_guest',
    auth_method: 'email_matching',
  })
  .select()
  .single();

if (guestError || !guest) {
  console.error('Failed to create test guest:', {
    error: guestError,
    email: testGuestEmail,
    groupId: testGroupId,
  });
  throw new Error(`Failed to create test guest: ${guestError?.message || 'No data returned'}`);
}
```

### Fix 3: Ensure Cleanup Runs Even on Failure

```typescript
test.afterEach(async () => {
  try {
    await cleanup();
  } catch (error) {
    console.error('Cleanup failed:', error);
    // Don't throw - allow test to complete
  }
});
```

### Fix 4: Add Retry Logic for Authentication

```typescript
// In the test
await page.fill('#email-matching-input', testGuestEmail);
await page.click('button[type="submit"]:has-text("Log In")');

// Wait for either success or error
await Promise.race([
  page.waitForURL('/guest/dashboard', { timeout: 10000 }),
  page.waitForSelector('.bg-red-50', { timeout: 10000 }),
]);

// Check which one happened
const url = page.url();
if (url.includes('/guest/dashboard')) {
  // Success
  await expect(page).toHaveURL('/guest/dashboard');
} else {
  // Error - check what it says
  const errorText = await page.locator('.text-red-800').textContent();
  throw new Error(`Authentication failed: ${errorText}`);
}
```

### Fix 5: Verify Cookie is Set

```typescript
// After successful authentication
const cookies = await context.cookies();
const sessionCookie = cookies.find(c => c.name === 'guest_session');

if (!sessionCookie) {
  console.error('No session cookie found. All cookies:', cookies);
  throw new Error('Session cookie was not set after authentication');
}

console.log('Session cookie set:', {
  name: sessionCookie.name,
  value: sessionCookie.value.substring(0, 16) + '...',
  httpOnly: sessionCookie.httpOnly,
  secure: sessionCookie.secure,
  sameSite: sessionCookie.sameSite,
});
```

## Implementation Order

1. **First**: Add error logging to test setup (Fix 2)
   - This will help us see what's actually failing
   - Run tests to get better error messages

2. **Second**: Improve test data uniqueness (Fix 1)
   - This will prevent parallel test conflicts
   - Should fix the "Failed to create test guest" errors

3. **Third**: Ensure cleanup runs (Fix 3)
   - This will prevent data pollution between tests
   - Should improve test reliability

4. **Fourth**: Add authentication debugging (Fixes 4 & 5)
   - This will help us understand why authentication times out
   - Should reveal cookie or API issues

5. **Fifth**: Run full test suite
   - Should see 16/16 passing
   - If not, we'll have better error messages to debug

## Expected Outcomes

After applying these fixes:

- ✅ No more "Failed to create test guest" errors
- ✅ No more authentication timeouts
- ✅ Better error messages when tests fail
- ✅ More reliable test execution
- ✅ 16/16 tests passing

## Rollback Plan

If fixes cause issues:
1. Revert changes to test file
2. Run tests with original code
3. Analyze new error messages
4. Apply fixes one at a time

## Next Steps

1. Apply Fix 1 and Fix 2 first
2. Run tests to see if guest creation works
3. Apply remaining fixes based on results
4. Document final solution

