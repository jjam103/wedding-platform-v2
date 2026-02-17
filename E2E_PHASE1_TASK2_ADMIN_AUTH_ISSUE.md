# E2E Phase 1 - Task 2: Admin Authentication Issue

**Date**: February 10, 2026  
**Status**: 🔍 Investigation  
**Issue**: Admin login stuck in redirect loop during E2E test setup

---

## Problem

The E2E global setup is failing to authenticate as admin user:

```
Error: Failed to create admin authentication state: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/auth/login"
  navigated to "http://localhost:3000/auth/login"
  navigated to "http://localhost:3000/auth/login"
  [... repeated 30 times ...]
```

**Impact**: All admin E2E tests are blocked because authentication state cannot be created.

---

## Root Cause Analysis

### 1. Login Page Uses Hard Redirect

**File**: `app/auth/login/page.tsx`

The login page uses `window.location.href` for redirect after successful login:

```typescript
if (data.session) {
  console.log('✅ Session created successfully');
  console.log('User ID:', data.user.id);
  console.log('Redirecting to:', returnTo);
  
  // Use window.location for hard redirect to ensure middleware runs
  window.location.href = returnTo;
}
```

**Problem**: This causes a hard redirect that may not be properly detected by Playwright's `waitForURL()`.

### 2. Global Setup Wait Strategy

**File**: `__tests__/e2e/global-setup.ts:260`

The global setup waits for URL to change away from `/auth/login`:

```typescript
await Promise.all([
  page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 30000,
  }),
  submitButton.click(),
]);
```

**Problem**: If the redirect doesn't trigger properly, this will timeout.

### 3. Possible Middleware Issue

The login page comment says "Use window.location for hard redirect to ensure middleware runs", suggesting there might be middleware that needs to run after login.

**Hypothesis**: The middleware might be redirecting back to login if it doesn't detect the session properly, causing a redirect loop.

---

## Investigation Steps

### Step 1: Check Console Logs

The login page has extensive console logging. Let's check what's happening:

```bash
# Run global setup with headed browser to see console logs
npx playwright test --headed --grep "should load admin dashboard"
```

**Look for**:
- "=== LOGIN ATTEMPT ===" - Form submission started
- "Login response:" - Supabase response
- "✅ Session created successfully" - Session created
- "Redirecting to:" - Redirect triggered

### Step 2: Check Middleware

```bash
# Check if there's middleware that might be causing redirects
find app -name "middleware.ts" -o -name "middleware.js"
grep -r "redirect.*login" app/
```

### Step 3: Check Admin Route Protection

```bash
# Check admin layout for auth checks
cat app/admin/layout.tsx
```

### Step 4: Test Manual Login

```bash
# Test manual login in browser
open http://localhost:3000/auth/login
# Login with: admin@example.com / test-password-123
# Check if redirect works
```

---

## Potential Solutions

### Solution 1: Use Router.push Instead of window.location

**Change**: `app/auth/login/page.tsx`

```typescript
// Before
window.location.href = returnTo;

// After
router.push(returnTo);
router.refresh(); // Ensure middleware runs
```

**Pros**: More Playwright-friendly, proper navigation event
**Cons**: Might not trigger middleware properly (that's why window.location was used)

### Solution 2: Update Global Setup Wait Strategy

**Change**: `__tests__/e2e/global-setup.ts`

```typescript
// Before
await Promise.all([
  page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 30000,
  }),
  submitButton.click(),
]);

// After
await submitButton.click();
await page.waitForLoadState('networkidle', { timeout: 30000 });
await page.waitForURL((url) => url.pathname.includes('/admin'), {
  timeout: 30000,
});
```

**Pros**: More explicit wait for admin page
**Cons**: Might still timeout if redirect loop exists

### Solution 3: Add Retry Logic

**Change**: `__tests__/e2e/global-setup.ts`

```typescript
// Retry login if it fails
let retries = 3;
while (retries > 0) {
  try {
    await submitButton.click();
    await page.waitForURL((url) => url.pathname.includes('/admin'), {
      timeout: 10000,
    });
    break; // Success
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    console.log(`   Retry ${3 - retries}/3...`);
    await page.goto(`${baseURL}/auth/login`);
  }
}
```

**Pros**: Handles transient issues
**Cons**: Doesn't fix root cause

### Solution 4: Check Session Before Redirect

**Change**: `app/auth/login/page.tsx`

```typescript
if (data.session) {
  console.log('✅ Session created successfully');
  
  // Verify session is actually stored
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('❌ Session not persisted');
    setError('Session creation failed');
    return;
  }
  
  console.log('✅ Session verified');
  window.location.href = returnTo;
}
```

**Pros**: Ensures session is properly stored before redirect
**Cons**: Adds extra delay

---

## Recommended Approach

### Phase 1: Investigation (15 minutes)

1. **Run with headed browser** to see console logs:
   ```bash
   npx playwright test --headed --grep "admin" --timeout=60000
   ```

2. **Check for middleware**:
   ```bash
   find app -name "middleware.ts"
   ```

3. **Test manual login** in browser

### Phase 2: Quick Fix (30 minutes)

Based on investigation results:

**If console shows "Session created successfully"**:
- Issue is with redirect detection
- Apply Solution 2 (Update wait strategy)

**If console shows login errors**:
- Issue is with authentication
- Check admin user exists in test database
- Verify credentials are correct

**If console shows redirect loop**:
- Issue is with middleware
- Check middleware logic
- Apply Solution 4 (Verify session before redirect)

### Phase 3: Verification (15 minutes)

1. Run global setup:
   ```bash
   npx playwright test --grep "admin" --timeout=60000
   ```

2. Verify auth state created:
   ```bash
   ls -la .auth/admin.json
   cat .auth/admin.json | jq '.cookies | length'
   ```

3. Run admin tests:
   ```bash
   npx playwright test admin/navigation.spec.ts
   ```

---

## Alternative: Skip Global Setup for Now

If fixing the global setup takes too long, we can temporarily skip it and focus on other tests:

### Option A: Use Per-Test Authentication

Instead of global setup, authenticate in each test:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'test-password-123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
});
```

**Pros**: Bypasses global setup issue
**Cons**: Slower tests (login for each test)

### Option B: Focus on Guest Tests First

Since guest authentication is working (73% pass rate), focus on guest tests while we fix admin auth:

```bash
# Run only guest tests
npx playwright test guest/ auth/guestAuth.spec.ts
```

**Pros**: Makes progress on working tests
**Cons**: Doesn't fix admin tests

---

## Decision

**Recommended**: Proceed with Phase 1 Investigation (15 minutes)

This will quickly identify the root cause and guide us to the right solution. If investigation takes longer than 15 minutes, switch to **Option B** (focus on guest tests) and come back to admin auth later.

---

## Next Steps

1. **Immediate**: Run investigation steps (15 minutes)
2. **If quick fix available**: Apply fix and verify (30 minutes)
3. **If complex issue**: Switch to guest tests, document issue for later
4. **After fix**: Continue with Phase 1 Task 2 (Admin Page Load Issues)

---

## Related Files

- `__tests__/e2e/global-setup.ts` - Global setup with admin auth
- `app/auth/login/page.tsx` - Login page with redirect
- `app/admin/layout.tsx` - Admin layout (might have auth checks)
- `middleware.ts` - Middleware (if exists)

---

## Success Criteria

- ✅ Global setup completes without timeout
- ✅ `.auth/admin.json` created with valid session
- ✅ Admin tests can run with authentication
- ✅ No redirect loop on login

---

**Status**: Ready for investigation  
**Estimated Time**: 15-60 minutes  
**Blocking**: All admin E2E tests  
**Priority**: HIGH (blocks 17+ tests)
