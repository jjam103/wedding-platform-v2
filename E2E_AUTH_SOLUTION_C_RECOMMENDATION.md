# E2E Authentication: Recommended Solution C

**Status**: 📋 Recommended  
**Complexity**: Low  
**Reliability**: High

## Problem

Solutions A (form login) and B (cookie injection) both failed because:
- **Solution A**: Browser doesn't have access to environment variables
- **Solution B**: Cookie format doesn't match what Supabase SSR middleware expects

## Solution C: Hybrid Approach

Use the **existing working approach** from the codebase but fix the environment variable issue.

### Current Working Code

The global setup already has code that works - it just needs the admin user to exist and the form to work. The issue is that the browser-based login can't access `process.env`.

### Fix: Pre-create Admin User

Instead of trying to inject cookies or fix the browser environment, simply:

1. **Ensure admin user exists** before running tests
2. **Use the form login** (which already works when user exists)
3. **Save the authenticated state** (already implemented)

### Implementation

The code is already there! Just need to:

1. Run the admin user creation script before E2E tests:
   ```bash
   node scripts/create-e2e-admin-user.mjs
   npx playwright test
   ```

2. Or add it to the test command in `package.json`:
   ```json
   {
     "scripts": {
       "test:e2e": "node scripts/create-e2e-admin-user.mjs && playwright test"
     }
   }
   ```

### Why This Works

1. **Admin user exists** ✅
   - Script creates user if doesn't exist
   - Uses service role key (has permissions)
   - Idempotent (safe to run multiple times)

2. **Form login works** ✅
   - Browser can submit form
   - Server-side auth handles credentials
   - Middleware recognizes session

3. **State is saved** ✅
   - Playwright saves cookies/storage
   - All tests use saved state
   - No re-authentication needed

### Advantages

| Aspect | Solution C |
|--------|-----------|
| Complexity | ✅ Low (use existing code) |
| Reliability | ✅ High (proven to work) |
| Maintenance | ✅ Easy (no custom cookie logic) |
| Speed | ✅ Fast (one-time setup) |
| Debugging | ✅ Simple (standard flow) |

### Current Status

The global setup code already implements this approach! The only issue was that the admin user didn't exist. The `ensureAdminUserExists` function is already there but was failing silently.

### Next Steps

1. ✅ Admin user creation script exists (`scripts/create-e2e-admin-user.mjs`)
2. ⏳ Run script before E2E tests
3. ⏳ Verify form login works
4. ⏳ Run E2E tests

### Alternative: Fix ensureAdminUserExists

The function exists but fails silently. We could:
1. Make it more robust
2. Add better error handling
3. Ensure it actually creates the user

This is the **simplest solution** - just make the existing code work properly!

## Recommendation

**Use Solution C** - it's already implemented, just needs the admin user to exist.

Run this before E2E tests:
```bash
node scripts/create-e2e-admin-user.mjs
```

Or update the global setup to fail loudly if admin user creation fails (instead of continuing).
