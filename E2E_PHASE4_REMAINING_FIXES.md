# E2E Phase 4: Remaining Fixes

## Status: ⏳ IN PROGRESS - 2 Issues to Fix

### Issue 1: Audit Logs Schema (Non-Critical) ⏳

**Problem**: Missing `details` column in `audit_logs` table

**Error**:
```
Failed to log audit event: {
  code: 'PGRST204',
  message: "Could not find the 'details' column of 'audit_logs' in the schema cache"
}
```

**Impact**: Audit logging fails, but authentication still works

**Solution**: Apply migration manually via Supabase dashboard

**Steps**:
1. Go to Supabase dashboard: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer
2. Navigate to SQL Editor
3. Execute the following SQL:

```sql
-- Add action column for specific action types
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;

-- Add details column for additional context
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Create index for action column
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Make operation_type nullable since we now have action
ALTER TABLE audit_logs ALTER COLUMN operation_type DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN audit_logs.action IS 'Specific action type (e.g., guest_login, magic_link_requested, guest_logout)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context and metadata for the action';
```

4. Verify by running:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
  AND column_name IN ('action', 'details');
```

**Expected Result**:
```
column_name | data_type
------------|----------
action      | text
details     | jsonb
```

---

### Issue 2: Guest Dashboard Redirect (CRITICAL) 🔍

**Problem**: After successful authentication, guests are redirected to `/auth/unauthorized` instead of `/guest/dashboard`

**Evidence**:
```
[API] Setting guest session cookie: {
  tokenPrefix: 'f91fe6a4',
  guestId: '39b8f426-bd6a-40cf-a77d-a862344241aa',
  sessionId: '977f5762-a251-42ee-bbfc-a297f5ddc72f'
}
POST /api/guest-auth/email-match 200 in 317ms

[Middleware] Guest auth check: {
  path: '/guest/dashboard',
  hasCookie: true,
  cookieValue: 'f91fe6a4...',
}
[Middleware] Session query result: {
  sessionsFound: 1,
  hasError: false,
}

GET /guest/dashboard 307 in 2.3s
GET /auth/unauthorized 200 in 831ms
```

**Analysis**:
1. ✅ Session cookie is created successfully
2. ✅ Middleware finds the session in database
3. ❌ Middleware still redirects to `/auth/unauthorized`

**Root Cause**: Middleware guest session validation logic is rejecting valid sessions

**Investigation Needed**:
1. Check middleware guest session validation logic
2. Verify session expiration check
3. Check if there's an additional validation step failing
4. Verify guest dashboard page authentication requirements

**Files to Check**:
- `middleware.ts` - Guest session validation
- `app/guest/dashboard/page.tsx` - Page authentication requirements

---

## Next Steps

### Immediate
1. ⏳ Apply audit logs migration manually
2. 🔍 Investigate middleware guest session validation
3. 🔧 Fix middleware redirect logic
4. ✅ Run E2E tests again

### Expected After Fixes
- 🎯 Audit logging works correctly
- 🎯 Guest dashboard accessible after authentication
- 🎯 16/16 tests passing (100%)

---

## Quick Reference

### To Apply Migration
1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
2. Copy SQL from above
3. Execute
4. Verify

### To Test After Fixes
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1
```

### To Check Middleware Logs
Look for these patterns in test output:
- `[Middleware] Guest auth check:`
- `[Middleware] Session query result:`
- `GET /guest/dashboard 307` (redirect)
- `GET /auth/unauthorized 200` (unauthorized page)

