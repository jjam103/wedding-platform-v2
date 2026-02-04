# Authentication Test Setup Guide

## Issue

The integration tests are skipping because they can't create test users. This is because the `SUPABASE_SERVICE_ROLE_KEY` in `.env.test` is incorrect.

## What's Wrong

You're using the new `sb_secret_` format key, but the Supabase JavaScript client's admin API requires the **legacy JWT format** service role key (starts with `eyJ`).

## How to Fix

### Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/settings/api
2. Scroll down to the "Project API keys" section
3. Find the **"service_role" key** (it's a long JWT token starting with `eyJ`)
4. Click the eye icon to reveal it
5. Copy the entire key

### Step 2: Update .env.test

Open `.env.test` and replace this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_JWT_HERE
```

With:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-actual-service-role-key-here
```

### Step 3: Also Update .env.local

For consistency, update `.env.local` with the same keys:

```bash
# Use the legacy anon key (JWT format)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dGhqaXJ2cGR5cG1idnBzanRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjIzMjQsImV4cCI6MjA4NTAzODMyNH0.-Wt9DtEwrlKY_HriAcE-xycb6jMn7v4TzUBqf9XuU0g

# Use the service_role JWT (get from dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-actual-service-role-key-here
```

### Step 4: Test It

Run the diagnostic script:

```bash
node scripts/test-auth-setup.mjs
```

You should see:

```
✅ All authentication tests passed!
```

### Step 5: Run Integration Tests

```bash
npm test -- __tests__/integration --no-coverage
```

All 370 tests should now pass!

## Why This Matters

The service role key is needed to:
- Create test users via the admin API
- Test RLS policies with real authentication
- Validate that your auth setup works correctly

## Key Differences

| Key Type | Format | Use Case |
|----------|--------|----------|
| **Anon Key (JWT)** | `eyJhbGc...` | Client-side requests, respects RLS |
| **Publishable Key** | `sb_publishable_...` | New format, same as anon but rotatable |
| **Service Role Key (JWT)** | `eyJhbGc...` | Server-side admin operations, bypasses RLS |
| **Secret Key** | `sb_secret_...` | New format, not compatible with JS client admin API |

## Security Note

⚠️ **NEVER commit the service role key to git!**

The service role key bypasses all RLS policies and should only be used:
- In server-side code
- In test environments
- For admin operations

Make sure `.env.test` and `.env.local` are in your `.gitignore`.

---

**After you update the keys, your tests will pass and you'll have full test coverage!**
