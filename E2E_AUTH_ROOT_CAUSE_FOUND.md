# E2E Authentication Root Cause Found

**Status**: 🎯 Root Cause Identified  
**Date**: 2025-02-09  
**Issue**: Browser using wrong Supabase URL

## The Problem

The E2E global setup was failing with "Invalid login credentials" even though:
- ✅ Admin user exists in test database
- ✅ API authentication works perfectly
- ✅ Credentials are correct

## Root Cause

**The browser login page is using the PRODUCTION Supabase URL instead of the TEST database URL.**

### Evidence

From the browser console logs:
```
[Browser log]: Supabase URL: https://bwthjirvpdypmbvpsjtl.supabase.co  ← PRODUCTION
Auth response status: 400
[Browser error]: ❌ Login error: AuthApiError: Invalid login credentials
```

Expected URL (from `.env.e2e`):
```
NEXT_PUBLIC_SUPABASE_URL=https://olcqaawrpnanioaorfer.supabase.co  ← TEST DATABASE
```

### Why This Happens

1. **Next.js bakes environment variables into the build**
   - `NEXT_PUBLIC_*` variables are embedded at build time
   - The dev server was started with production `.env.local`
   - Browser code uses the baked-in production URL

2. **API auth works because it reads runtime environment**
   - Node.js code reads `.env.e2e` at runtime
   - Playwright injects `.env.e2e` variables
   - API calls use correct test database URL

3. **Browser can't access runtime environment**
   - Browser code uses build-time variables
   - No way to override `NEXT_PUBLIC_*` vars in browser
   - Login form sends credentials to wrong database

## The Solution

**Restart the Next.js dev server with E2E environment variables:**

```bash
# Stop current dev server
# Start with E2E environment
npm run dev -- --env-file .env.e2e
```

Or use a dedicated E2E dev server script:
```json
{
  "scripts": {
    "dev:e2e": "next dev --env-file .env.e2e"
  }
}
```

## Why Previous Solutions Failed

| Solution | Why It Failed |
|----------|---------------|
| **A: Form Login** | Browser used wrong Supabase URL (production instead of test) |
| **B: Cookie Injection** | Cookies were for test database, but browser still tried to validate against production |

## Verification

After restarting dev server with `.env.e2e`:

1. Browser should log correct URL:
   ```
   [Browser log]: Supabase URL: https://olcqaawrpnanioaorfer.supabase.co
   ```

2. Login should succeed:
   ```
   Auth response status: 200
   ✅ Login successful
   ```

3. E2E tests should pass

## Implementation Steps

1. **Stop current dev server** (Ctrl+C)

2. **Start dev server with E2E environment:**
   ```bash
   npm run dev -- --env-file .env.e2e
   ```

3. **Run E2E tests:**
   ```bash
   npx playwright test
   ```

## Long-term Solution

Add a dedicated E2E dev server script to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:e2e": "next dev --env-file .env.e2e --port 3001",
    "test:e2e": "npm run dev:e2e & sleep 5 && npx playwright test; kill %1"
  }
}
```

This ensures:
- E2E tests always use correct environment
- No manual server restart needed
- Tests are isolated from development

## Related Files

- `.env.local` - Production/development environment (wrong for E2E)
- `.env.e2e` - E2E test environment (correct)
- `app/auth/login/page.tsx` - Login form (uses `NEXT_PUBLIC_SUPABASE_URL`)
- `__tests__/e2e/global-setup.ts` - E2E authentication setup

## Next Steps

1. ✅ Root cause identified
2. ⏳ Restart dev server with `.env.e2e`
3. ⏳ Verify E2E authentication works
4. ⏳ Run location hierarchy E2E test
5. ⏳ Add E2E dev server script to package.json
