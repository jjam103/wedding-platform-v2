# E2E Phase 1 - Fixes to Apply

**Date**: February 6, 2026  
**Status**: Ready to Apply

## Fix #1: Database Client Mismatch ✅ APPLIED

**Problem**: API uses `@supabase/supabase-js` client, middleware uses `@supabase/ssr` client, causing session not found.

**Solution**: Change API to use `createServerClient` from `@supabase/ssr`.

**Status**: ✅ Applied to `app/api/auth/guest/email-match/route.ts`

**Impact**: Should fix 5 navigation tests

---

## Fix #2: Magic Link Route Client Mismatch

**Problem**: Magic link route also uses `@supabase/supabase-js` client.

**Solution**: Update to use `createServerClient` from `@supabase/ssr`.

**File**: `app/api/auth/guest/magic-link/request/route.ts`

**Changes**:
```typescript
// Change imports
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Change client creation (line 70)
const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  }
);
```

**Impact**: Should fix 3 magic link tests

---

## Fix #3: Error Message Mapping

**Problem**: Error code mapping is case-sensitive, shows "Invalid Link" instead of "Link Expired".

**Solution**: Make error code matching case-insensitive.

**File**: `app/auth/guest-login/verify/page.tsx`

**Changes**:
```typescript
// Around line 35-42, change from:
if (errorParam === 'TOKEN_EXPIRED' || errorParam === 'token_expired') {
  return {
    title: 'Link Expired',
    description: 'This magic link has expired. Magic links are only valid for 15 minutes for security.',
    icon: '⏰',
  };
}

// To:
const errorCode = errorParam.toUpperCase();
if (errorCode === 'TOKEN_EXPIRED') {
  return {
    title: 'Link Expired',
    description: 'This magic link has expired. Magic links are only valid for 15 minutes for security.',
    icon: '⏰',
  };
}
```

**Impact**: Should fix 2 error message tests

---

## Fix #4: Audit Logs Schema

**Problem**: `details` column missing from `audit_logs` table.

**Solution**: Add migration or update existing migration.

**File**: Create new migration or update existing

**SQL**:
```sql
-- Check if column exists, add if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'details'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN details JSONB;
  END IF;
END $$;
```

**Impact**: Fixes audit log errors, should fix 1 test

---

## Testing Plan

### Step 1: Test Fix #1 (Client Mismatch)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --grep "should successfully authenticate with email matching"
```

**Expected**: Test should pass, cookie should be found in database

### Step 2: Apply and Test Fix #2 (Magic Link)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --grep "magic link"
```

**Expected**: Magic link tests should pass

### Step 3: Apply and Test Fix #3 (Error Mapping)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --grep "expired"
```

**Expected**: Error message tests should pass

### Step 4: Run Full Suite
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**Expected**: 16/16 tests passing (100%)

---

## Estimated Timeline

- Fix #1: ✅ Applied (5 min)
- Fix #2: 5 minutes
- Fix #3: 3 minutes
- Fix #4: 5 minutes
- Testing: 10 minutes
- **Total**: 28 minutes

---

## Next Steps

1. Apply Fix #2 (Magic Link client)
2. Apply Fix #3 (Error mapping)
3. Apply Fix #4 (Audit logs)
4. Run tests to verify
5. Remove debug logging from middleware and API
