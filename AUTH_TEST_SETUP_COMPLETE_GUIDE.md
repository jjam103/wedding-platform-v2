# Authentication Test Setup - Complete Guide

## Issue Identified

The integration tests were skipping authentication tests because the **wrong type of service key** was configured in `.env.test`.

### Root Cause

Supabase has **two types of API keys**:

1. **Modern keys** (recommended for production):
   - `sb_publishable_...` (replaces legacy `anon` JWT)
   - `sb_secret_...` (replaces legacy `service_role` JWT)

2. **Legacy JWT keys** (required for auth admin API):
   - `anon` JWT (starts with `eyJ...`)
   - `service_role` JWT (starts with `eyJ...`)

**The auth admin API (`auth.admin.createUser`, `auth.admin.deleteUser`) ONLY works with legacy JWT-based `service_role` key.**

The `.env.test` file had `sb_secret_bnNje3uO-iX_ukaumBe3qQ_3uKsFF7B` which is the modern format and **does not work** with auth admin API.

## Solution

### Step 1: Get the Legacy Service Role JWT

1. Go to your Supabase project dashboard:
   https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/settings/api

2. Click on the **"Legacy API Keys"** tab (not the default "API Keys" tab)

3. Find the **"service_role"** key - it will be a long JWT token starting with `eyJ`

4. Copy this entire JWT token

### Step 2: Update `.env.test`

Replace `YOUR_SERVICE_ROLE_JWT_HERE` in `.env.test` with the JWT you copied:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dGhqaXJ2cGR5cG1idnBzanRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2MjMyNCwiZXhwIjoyMDg1MDM4MzI0fQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Verify the Setup

Run the diagnostic script to verify everything works:

```bash
node scripts/test-auth-setup.mjs
```

Expected output:
```
✅ Service client created
✅ Test user created: [user-id]
✅ Sign in successful
✅ Test user deleted
✅ All authentication tests passed!
```

### Step 4: Run Integration Tests

```bash
npm run test:integration
```

All 370 tests should now pass (no more skipped tests).

## Why This Matters

### Auth Admin API Requirements

The Supabase auth admin API methods require the legacy JWT-based `service_role` key:

- `auth.admin.createUser()` - Create test users
- `auth.admin.deleteUser()` - Clean up test users
- `auth.admin.updateUserById()` - Modify test users
- `auth.admin.listUsers()` - List users

These methods **will not work** with the modern `sb_secret_` keys.

### Key Format Comparison

| Key Type | Format | Example | Works with Auth Admin API? |
|----------|--------|---------|---------------------------|
| Legacy anon | JWT (eyJ...) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes (for anon operations) |
| Legacy service_role | JWT (eyJ...) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes (required!) |
| Modern publishable | sb_publishable_ | `sb_publishable_VJgv__kroHbFX7OgSLPlSw...` | ❌ No |
| Modern secret | sb_secret_ | `sb_secret_bnNje3uO-iX_ukaumBe3qQ...` | ❌ No |

### Production vs Test Environments

**Production (`.env.local`):**
- Use modern keys (`sb_publishable_`, `sb_secret_`) for better security
- Better rotation capabilities
- Independent key management
- No auth admin API needed

**Test (`.env.test`):**
- Use legacy JWT keys for auth admin API compatibility
- Required for creating/deleting test users
- Required for integration tests that test authentication

## Documentation References

From Supabase docs (https://supabase.com/docs/guides/api/api-keys):

> **anon and service_role keys are based on the project's JWT secret.** They are generated when your project is created and can only be changed when you rotate the JWT secret. This can cause significant issues in production applications. **Use the publishable and secret keys instead.**

However, for testing purposes where you need auth admin API access, the legacy JWT keys are still required.

## Troubleshooting

### Error: "Auth session or user missing"

**Cause:** Using `sb_secret_` key instead of JWT-based `service_role` key

**Solution:** Get the legacy JWT `service_role` key from dashboard and update `.env.test`

### Error: "ECONNREFUSED"

**Cause:** Incorrect Supabase URL or project is paused

**Solution:** 
1. Verify project is active in dashboard
2. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Ensure no firewall blocking connections

### Tests Still Skipping

**Cause:** Environment variables not loaded or incorrect format

**Solution:**
1. Verify `.env.test` has correct JWT format (starts with `eyJ`)
2. Restart your terminal/IDE to reload environment
3. Run diagnostic script to verify: `node scripts/test-auth-setup.mjs`

## Security Notes

### Legacy JWT Keys

- **Never commit to version control** (already in `.gitignore`)
- **Never expose in client-side code**
- **Only use in test environment** for auth admin API
- **Use modern keys in production** for better security

### Modern Keys (Production)

- Better security and rotation capabilities
- Independent management
- Recommended for all production use
- Cannot be used with auth admin API

## Next Steps

1. ✅ Get legacy `service_role` JWT from dashboard
2. ✅ Update `.env.test` with the JWT
3. ✅ Run diagnostic script: `node scripts/test-auth-setup.mjs`
4. ✅ Run integration tests: `npm run test:integration`
5. ✅ Verify all 370 tests pass

## Summary

The test environment requires **legacy JWT-based `service_role` key** (not modern `sb_secret_` key) because:

1. Auth admin API only works with JWT keys
2. Integration tests need to create/delete test users
3. Modern keys don't support auth admin operations

This is a known limitation documented by Supabase and is the correct approach for test environments that need auth admin API access.
