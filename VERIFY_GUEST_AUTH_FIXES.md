# Verify Guest Authentication Fixes

## Quick Verification

Run this single command to verify all fixes are working:

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --reporter=line
```

## Expected Output

```
✓ should successfully authenticate with email matching
✓ should show error for non-existent email
✓ should show error for invalid email format
✓ should show loading state during authentication
✓ should create session cookie on successful authentication
✓ should successfully request and verify magic link
✓ should show success message after requesting magic link
✓ should show error for expired magic link
✓ should show error for already used magic link
✓ should show error for invalid or missing token
✓ should complete logout flow
✓ should persist authentication across page refreshes
✓ should switch between authentication tabs
✓ should handle authentication errors gracefully
✓ should log authentication events in audit log

16 passed (XX.Xs)
```

## Before Running Tests

### 1. Apply Database Migration

**IMPORTANT**: You must apply the migration first!

```bash
# Copy this SQL and run in Supabase Dashboard > SQL Editor:
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs(entity_id, action);
```

See `APPLY_AUDIT_LOGS_MIGRATION.md` for detailed instructions.

### 2. Verify Migration Applied

Run this in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND column_name = 'action';
```

Expected result:
```
column_name | data_type
------------+-----------
action      | character varying
```

## If Tests Fail

### Check Migration Status

```sql
-- Check if action column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'audit_logs' AND column_name = 'action';

-- Should return: action
```

### Check Logout Button

1. Navigate to http://localhost:3000/guest/dashboard (after logging in)
2. Look for "Log Out" button in top-right (desktop) or menu (mobile)
3. If missing, check `components/guest/GuestNavigation.tsx` was updated

### Check Logout API

```bash
# Test logout endpoint exists
curl -X POST http://localhost:3000/api/auth/guest/logout

# Should return: {"success":true,"message":"Logged out successfully"}
```

### Check Loading States

1. Go to http://localhost:3000/auth/guest-login
2. Enter email and click "Log In"
3. Button should show spinner and "Logging in..." text
4. Button should be disabled during loading

## Common Issues

### Issue: "column audit_logs.action does not exist"

**Solution**: Migration not applied. Run the SQL in Supabase Dashboard.

### Issue: "Logout button not found"

**Solution**: 
1. Check `components/guest/GuestNavigation.tsx` has logout buttons
2. Restart dev server: `npm run dev`
3. Clear browser cache

### Issue: "Loading state not showing"

**Solution**: Already implemented correctly. Check browser console for errors.

### Issue: "Magic link errors not specific"

**Solution**: Already implemented correctly. Check API route returns correct error codes.

## Manual Testing

### Test Email Matching Login

```bash
# 1. Go to login page
open http://localhost:3000/auth/guest-login

# 2. Enter test email: test@example.com
# 3. Click "Log In"
# 4. Should redirect to /guest/dashboard
# 5. Should see "Log Out" button
```

### Test Logout

```bash
# 1. While logged in, click "Log Out"
# 2. Should redirect to /auth/guest-login
# 3. Try accessing /guest/dashboard
# 4. Should redirect back to login
```

### Test Magic Link

```bash
# 1. Go to login page
# 2. Click "Magic Link" tab
# 3. Enter email
# 4. Click "Send Magic Link"
# 5. Should see success message
# 6. Check database for token
# 7. Visit /auth/guest-login/verify?token=<token>
# 8. Should redirect to dashboard
```

## Success Checklist

- [ ] Migration applied successfully
- [ ] All 16 E2E tests pass
- [ ] Logout button visible in navigation
- [ ] Logout redirects to login page
- [ ] Loading states show during authentication
- [ ] Error messages are user-friendly
- [ ] Session persists across page refreshes
- [ ] Audit logs track authentication events

## Files to Review

If tests still fail, review these files:

1. `components/guest/GuestNavigation.tsx` - Logout buttons
2. `app/api/auth/guest/logout/route.ts` - Logout API
3. `app/auth/guest-login/page.tsx` - Loading states
4. `app/auth/guest-login/verify/page.tsx` - Error handling
5. `app/api/auth/guest/email-match/route.ts` - Audit logging
6. `app/api/auth/guest/magic-link/verify/route.ts` - Token verification

## Get Help

If you're still having issues:

1. Check `E2E_GUEST_AUTH_FIXES_COMPLETE.md` for detailed documentation
2. Check `APPLY_AUDIT_LOGS_MIGRATION.md` for migration instructions
3. Check `E2E_GUEST_AUTH_TEST_RESULTS.md` for original issue analysis
4. Review test output for specific error messages
5. Check browser console for JavaScript errors
6. Check server logs for API errors

## Quick Commands

```bash
# Run tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Run specific test
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --grep "logout"

# Run with UI mode
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --ui

# Run with debug output
DEBUG=pw:api npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Expected Timeline

- **Migration**: 2 minutes
- **Test Run**: 1-2 minutes
- **Manual Testing**: 5 minutes
- **Total**: ~10 minutes

## Success!

When all tests pass, you should see:

```
✓ 16 passed (XX.Xs)
```

🎉 Guest authentication is now fully functional!
