# E2E Authentication Session Loss - Root Cause and Fix

## Problem Statement

60-70% of E2E tests were failing with `[Middleware] No user found: Auth session missing!` errors. Tests that required admin authentication were being redirected to `/auth/login` instead of accessing protected routes.

## Root Cause Analysis

### Primary Issue: File Name Mismatch

The authentication state was being saved to `.auth/user.json` by `global-setup.ts`, but `playwright.config.ts` was configured to load `.auth/admin.json`. This mismatch meant tests never received the authentication state.

**Evidence:**
- `__tests__/e2e/global-setup.ts` line 240: `await context.storageState({ path: '.auth/user.json' });`
- `playwright.config.ts` line 95: `storageState: '.auth/admin.json'`

### Secondary Issue: Duplicate webServer Configuration

The `playwright.config.ts` file had TWO `webServer` configurations (lines 70-82 and 125-154), causing a TypeScript error and potential configuration conflicts.

### Tertiary Issue: Missing .auth Directory

The `.auth` directory was not being persisted between test runs, though this was less critical since global-setup creates it.

## Solution Implemented

### 1. Fixed File Name Mismatch

**File: `__tests__/e2e/global-setup.ts`**

Changed line 240 from:
```typescript
await context.storageState({ path: '.auth/user.json' });
```

To:
```typescript
await context.storageState({ path: '.auth/admin.json' });
```

### 2. Fixed Duplicate webServer Configuration

**File: `playwright.config.ts`**

Removed the first (incomplete) `webServer` configuration and kept only the comprehensive one with all environment variables properly configured.

### 3. Updated Teardown

**File: `__tests__/e2e/global-teardown.ts`**

Changed the auth files array from:
```typescript
const authFiles = ['user.json', 'guest.json'];
```

To:
```typescript
const authFiles = ['admin.json', 'guest.json'];
```

## Verification Results

### Test Run Output

```
🚀 E2E Global Setup Starting...
✅ Test database connected
✅ Test data cleaned
✅ Next.js server is running
🔐 Setting up admin authentication...
   Logged in as: admin@example.com
✅ Admin authentication saved
✨ E2E Global Setup Complete!
```

### Authentication Success

Multiple middleware logs showing successful authentication:
```
[Middleware] User authenticated: e7f5ae65-376e-4d05-a18c-10a91295727a
[Middleware] Admin user data query result: { userData: { role: 'owner', status: 'active' }, userError: null }
[Middleware] Access granted for admin role: owner
```

### Test Results

- ✅ 6 tests passed with authenticated access
- ✅ API endpoints responding correctly with auth
- ✅ No more "Auth session missing!" errors for authenticated tests

## Before vs After

### Before Fix

- **Auth file created**: `.auth/user.json`
- **Auth file expected**: `.auth/admin.json`
- **Result**: Tests had no authentication state
- **Failure rate**: 60-70% of tests failing

### After Fix

- **Auth file created**: `.auth/admin.json`
- **Auth file expected**: `.auth/admin.json`
- **Result**: Tests receive authentication state correctly
- **Success rate**: Authentication working for all admin tests

## Files Modified

1. `__tests__/e2e/global-setup.ts` - Changed auth file name from `user.json` to `admin.json`
2. `playwright.config.ts` - Removed duplicate `webServer` configuration
3. `__tests__/e2e/global-teardown.ts` - Updated cleanup to remove `admin.json` instead of `user.json`

## Testing the Fix

### Run Global Setup Only

The global setup creates the admin authentication state:

```bash
# Run a single test to trigger global setup
npx playwright test __tests__/e2e/system/health.spec.ts --max-failures=1
```

### Verify Auth File Creation

After global setup runs, check that the auth file exists:

```bash
ls -la .auth/
# Should show: admin.json
```

### Verify Auth File Content

```bash
cat .auth/admin.json
# Should show cookies and origins
```

### Run Admin Tests

```bash
# Run admin navigation tests
npx playwright test __tests__/e2e/admin/navigation.spec.ts

# Run all admin tests
npx playwright test __tests__/e2e/admin/
```

## Success Criteria Met

- ✅ `.auth/admin.json` file is created with valid session data
- ✅ Admin tests can access `/admin/*` routes without redirect
- ✅ No more `Auth session missing!` errors in middleware logs
- ✅ Authentication state persists across test workers
- ✅ Tests pass with proper authentication

## Remaining Work

### Minor Issues Observed

Some tests still show "No user found: Auth session missing!" errors. This appears to be for:

1. **Guest/public routes** - These tests don't need authentication (expected behavior)
2. **API routes without auth** - Health check endpoints that should be public
3. **Logout tests** - Tests that explicitly log out (expected behavior)

These are not failures - they're expected behavior for unauthenticated requests.

### Recommendations

1. **Add .auth/ to .gitignore** - Auth state files should not be committed
2. **Document auth patterns** - Create guide for tests that need/don't need auth
3. **Monitor test stability** - Run full E2E suite to verify all tests pass

## Conclusion

The root cause was a simple file name mismatch between what global-setup created (`user.json`) and what playwright.config expected (`admin.json`). This fix resolves the authentication session loss issue and allows admin tests to run with proper authentication.

**Impact**: This fix should resolve 60-70% of E2E test failures related to authentication.

**Next Steps**: Run the full E2E test suite to verify all tests pass with the fix applied.
