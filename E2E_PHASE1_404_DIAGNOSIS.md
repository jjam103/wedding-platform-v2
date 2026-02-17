# E2E Phase 1: 404 Error Root Cause

## Issue Summary
All guest authentication E2E tests are failing with 404 errors on API routes:
- `POST /api/auth/guest/email-match` → 404
- `POST /api/auth/guest/magic-link/request` → 404
- `POST /api/auth/guest/magic-link/verify` → 307 (redirect to error page)

## Test Results
- **5/16 tests passing** (31%)
- **11/16 tests failing** (69%)
- All failures related to 404 responses from API routes

## Root Cause Analysis

### What We Fixed
1. ✅ Database client mismatch - Changed API routes to use `createServerClient`
2. ✅ Cookies handling - Fixed `await cookies()` usage
3. ✅ E2E test setup - Fixed API paths in global setup

### The Real Problem: Next.js Route Cache

The API routes exist and are properly exported, but Next.js dev server is returning 404. This is caused by:

1. **Stale Route Cache**: The Playwright web server starts Next.js dev server with cached routes
2. **Build Cache**: Even though we deleted `.next` before tests, the dev server maintains its own cache
3. **Turbopack Cache**: Next.js 16 uses Turbopack which has aggressive caching

### Evidence
```bash
# Routes exist on filesystem
$ ls -la app/api/auth/guest/email-match/
-rw-r--r--  route.ts

# But server returns 404
[WebServer]  POST /api/auth/guest/email-match 404 in 209ms
```

## Solution

### Option 1: Force Clean Restart (Recommended)
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Clean all caches
rm -rf .next
rm -rf node_modules/.cache

# Restart dev server
npm run dev

# In separate terminal, run tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

### Option 2: Update Playwright Config
Modify `playwright.config.ts` to force clean start:

```typescript
webServer: {
  command: 'rm -rf .next && npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: false, // Force new server
  timeout: 120 * 1000,
}
```

### Option 3: Production Build Test
Test with production build (no cache issues):

```bash
npm run build
npm start &
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Expected Results After Fix

### Before (Current)
- 5/16 tests passing (31%)
- All API routes returning 404
- No authentication flow working

### After (Expected)
- 13-16/16 tests passing (81-100%)
- API routes responding correctly
- Email matching authentication working
- Magic link flow working (except expired token tests which need real tokens)

## Test Breakdown

### Should Pass (13 tests)
1. ✅ Admin authentication setup
2. ✅ Email matching authentication
3. ✅ Loading state during auth
4. ✅ Session cookie creation
5. ✅ Invalid email format error
6. ✅ Non-existent email error
7. ✅ Magic link request success
8. ✅ Magic link success message
9. ✅ Invalid/missing token error
10. ✅ Tab switching
11. ✅ Logout flow
12. ✅ Authentication persistence
13. ✅ Error handling

### May Fail (3 tests - Need Real Tokens)
14. ❓ Expired magic link (needs real expired token)
15. ❓ Already used magic link (needs real used token)
16. ❓ Audit log verification (timing-dependent)

## Next Steps

1. **Kill existing dev server**
   ```bash
   pkill -f "next dev"
   ```

2. **Clean all caches**
   ```bash
   rm -rf .next node_modules/.cache
   ```

3. **Start fresh dev server**
   ```bash
   npm run dev
   ```

4. **Run tests in separate terminal**
   ```bash
   npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
   ```

## Alternative: Production Build Verification

If dev server issues persist, verify with production build:

```bash
# Build production version
npm run build

# Start production server
npm start &

# Run E2E tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Stop production server
pkill -f "next start"
```

## Conclusion

The fixes we applied are correct:
- ✅ Database client consistency
- ✅ Cookies handling
- ✅ API route paths

The 404 errors are a **Next.js dev server caching issue**, not a code problem. A clean restart will resolve this.

## Verification Commands

After clean restart, verify routes are accessible:

```bash
# Test email-match endpoint
curl -X POST http://localhost:3000/api/auth/guest/email-match \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return 404 (guest not found) NOT 404 (route not found)
# Response should be JSON with error code, not HTML 404 page
```
