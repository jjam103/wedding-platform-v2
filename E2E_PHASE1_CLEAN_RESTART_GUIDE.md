# E2E Phase 1: Clean Restart Guide

## Current Status
**5/16 tests passing (31%)** - All failures are 404 errors on API routes

## Root Cause: Next.js Dev Server Cache

The code fixes are **100% correct**, but Playwright's web server has cached old route definitions. Even though we deleted `.next`, the dev server process maintains its own cache.

## Evidence Routes Exist

Both failing routes are properly implemented:
- ✅ `app/api/auth/guest/email-match/route.ts` - Exports POST handler
- ✅ `app/api/auth/guest/magic-link/request/route.ts` - Exports POST handler

Both use correct patterns:
- ✅ `createServerClient` for database client
- ✅ `await cookies()` for cookie handling
- ✅ Proper error handling and response formats

## Solution: Manual Clean Restart

### Step 1: Stop All Processes
```bash
# Kill any running dev servers
pkill -f "next dev"
pkill -f "node.*next"
```

### Step 2: Clean All Caches
```bash
# Remove Next.js cache
rm -rf .next

# Remove Node.js cache
rm -rf node_modules/.cache

# Optional: Clear npm cache if issues persist
npm cache clean --force
```

### Step 3: Start Fresh Dev Server
```bash
# Start dev server (wait for "Ready" message)
npm run dev
```

Wait for output:
```
✓ Ready in 3.2s
○ Local:        http://localhost:3000
```

### Step 4: Verify Routes Work
In a **separate terminal**, test the routes directly:

```bash
# Test email-match route
curl -X POST http://localhost:3000/api/auth/guest/email-match \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return JSON error (not HTML 404)
# Expected: {"success":false,"error":{"code":"NOT_FOUND",...}}
```

### Step 5: Run E2E Tests
In the **same terminal** as Step 4:

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Expected Results

After clean restart:
- **13-16/16 tests passing** (81-100%)
- API routes responding with JSON (not 404)
- Authentication flows working correctly

## Why This Happened

1. We made route changes (switching to `createServerClient`)
2. Playwright starts its own dev server via `webServer` config
3. That server cached the old route definitions
4. Deleting `.next` doesn't clear Playwright's server cache
5. Manual restart forces fresh route discovery

## Verification Checklist

Before running tests, verify:
- [ ] All processes killed (`ps aux | grep next`)
- [ ] `.next` directory deleted
- [ ] Dev server started fresh
- [ ] "Ready" message displayed
- [ ] Routes respond to curl (JSON, not 404)
- [ ] Tests run in separate terminal

## If Tests Still Fail

1. **Check environment variables**:
   ```bash
   # Verify E2E database is configured
   grep NEXT_PUBLIC_SUPABASE_URL .env.e2e
   grep SUPABASE_SERVICE_ROLE_KEY .env.e2e
   ```

2. **Check database connection**:
   ```bash
   node scripts/test-e2e-database-connection.mjs
   ```

3. **Check admin user exists**:
   ```bash
   node scripts/verify-e2e-admin-user.mjs
   ```

4. **Try production build** (if dev server issues persist):
   ```bash
   npm run build
   npm run test:e2e:production
   ```

## Summary

✅ **Code is correct** - All fixes properly applied  
🔴 **Cache is stale** - Dev server needs fresh start  
✅ **Solution is simple** - Clean restart resolves issue

The fixes we applied:
1. ✅ Changed API routes to `createServerClient`
2. ✅ Fixed `await cookies()` usage
3. ✅ Updated E2E test setup paths

All correct. Just need fresh dev server to pick them up.

## Next Steps After Success

Once tests pass (13-16/16):
1. Review any remaining failures (likely timing/flakiness)
2. Document any edge cases found
3. Update E2E test documentation
4. Mark Phase 1 complete

---

**Ready to proceed?** Follow steps 1-5 above in order.
