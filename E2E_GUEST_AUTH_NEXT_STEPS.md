# E2E Guest Authentication - Next Steps

**Date**: 2025-02-06  
**Phase**: 8 - Fixes Applied, Ready for Testing

## Quick Start

Run these commands in order to complete the E2E guest authentication fixes:

### Step 1: Run Tests (Check Current Status)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**What to Look For**:
- ✅ Test 4 should now PASS (API routes handle missing tables)
- ❌ Tests 6-9 will show detailed logs about magic link failures
- ✅ Tests 1-3, 5, 10-13 should still PASS

**Expected**: 9/15 passing (60%)

### Step 2: Apply Audit Logs Migration
```bash
node scripts/apply-audit-logs-migration-e2e.mjs
```

**What It Does**:
- Adds `action` and `details` columns to `audit_logs` table
- Checks if migration already applied
- Verifies success

**Expected Output**:
```
🔧 Applying Audit Logs Migration to E2E Test Database
📊 Database URL: https://...
📄 Reading migration file: ...
✅ Migration file loaded
🔍 Checking current audit_logs schema...
   action column: ✗ missing
   details column: ✗ missing
🚀 Applying migration...
   Executing: ALTER TABLE audit_logs...
   ✅ Statement executed successfully
✅ Migration applied successfully
🔍 Verifying migration...
   action column: ✓ exists
   details column: ✓ exists
✅ Migration verified successfully
```

### Step 3: Run Tests Again (Check Migration)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**What to Look For**:
- ✅ Test 15 should now PASS (audit logs have details column)
- ❌ Tests 6-9 still failing (magic link issue)

**Expected**: 10/15 passing (67%)

### Step 4: Analyze Magic Link Logs

Look at the test output for lines like:
```
[Magic Link Request] Processing request for email: test-w0-1234567890-abc123@example.com
[Magic Link Request] Looking for guest with magic_link auth method...
[Magic Link Request] Guest query result: { found: false, guestId: undefined, authMethod: undefined, error: 'No rows found' }
```

**Common Issues**:

#### Issue A: Guest Not Found
```
Guest query result: { found: false, error: 'No rows found' }
```
**Cause**: Test creates guest but query doesn't find it  
**Fix**: Check timing, ensure guest exists before magic link request

#### Issue B: Wrong Auth Method
```
Guest query result: { found: true, authMethod: 'email_matching' }
```
**Cause**: Guest has wrong auth_method  
**Fix**: Verify test updates auth_method to 'magic_link'

#### Issue C: RLS Policy Blocking
```
Guest query result: { found: false, error: 'permission denied' }
```
**Cause**: RLS policy blocking service role query  
**Fix**: Check RLS policies on guests table

#### Issue D: Route Not Found (404)
```
Error: Request failed with status 404
```
**Cause**: Route not compiled/registered  
**Fix**: Check Next.js routing, verify warmup

### Step 5: Apply Magic Link Fix

Based on the logs, apply the appropriate fix:

#### If Issue A (Guest Not Found):
Add delay after creating guest:
```typescript
// In test
await supabase
  .from('guests')
  .update({ auth_method: 'magic_link' })
  .eq('id', testGuestId);

// Add delay to ensure database consistency
await new Promise(resolve => setTimeout(resolve, 500));
```

#### If Issue B (Wrong Auth Method):
Verify update is working:
```typescript
// In test - verify update succeeded
const { data: updatedGuest } = await supabase
  .from('guests')
  .select('auth_method')
  .eq('id', testGuestId)
  .single();

console.log('Guest auth_method after update:', updatedGuest?.auth_method);
```

#### If Issue C (RLS Policy):
Check if service role is bypassing RLS:
```typescript
// In magic link route - verify service role
console.log('Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

#### If Issue D (Route Not Found):
Check route file exists and is exported:
```bash
ls -la app/api/guest-auth/magic-link/request/route.ts
ls -la app/api/guest-auth/magic-link/verify/route.ts
```

### Step 6: Run Final Test
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**Expected**: 15/15 passing (100%) 🎉

## Troubleshooting

### Tests Still Failing After Fixes

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Restart dev server**:
   ```bash
   # Kill existing server
   pkill -f "next dev"
   
   # Start fresh
   npm run dev
   ```

3. **Check environment variables**:
   ```bash
   cat .env.e2e | grep SUPABASE
   ```

4. **Verify test database**:
   ```bash
   node scripts/test-e2e-database-connection.mjs
   ```

### Migration Script Fails

If migration script fails with "Cannot execute ALTER TABLE via REST API":

1. **Manual Migration**:
   - Open Supabase SQL Editor
   - Run migration file: `supabase/migrations/053_add_action_and_details_to_audit_logs.sql`
   - Verify columns exist

2. **Alternative Script**:
   ```bash
   # Use direct SQL execution
   psql $DATABASE_URL -f supabase/migrations/053_add_action_and_details_to_audit_logs.sql
   ```

### Magic Link Tests Still Failing

1. **Check route warmup**:
   - Look for "Warming up API routes" in test output
   - Verify magic link routes are included
   - Check for "Route ready" messages

2. **Test routes directly**:
   ```bash
   # Test magic link request
   curl -X POST http://localhost:3000/api/guest-auth/magic-link/request \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   
   # Should return JSON, not HTML 404
   ```

3. **Check test guest**:
   ```bash
   # Verify test guest exists with correct auth_method
   node -e "
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
   const { data } = await supabase.from('guests').select('email, auth_method').eq('email', 'test@example.com').single();
   console.log(data);
   "
   ```

## Success Indicators

### After Step 1 (Run Tests)
- ✅ Test 4 passes
- ✅ Detailed logs for magic link failures
- **Status**: 9/15 passing (60%)

### After Step 2 (Apply Migration)
- ✅ Migration applied successfully
- ✅ Columns verified

### After Step 3 (Run Tests Again)
- ✅ Test 15 passes
- **Status**: 10/15 passing (67%)

### After Step 5 (Fix Magic Link)
- ✅ Tests 6-9 pass
- ✅ Test 14 passes (depends on magic link)
- **Status**: 15/15 passing (100%) 🎉

## Final Verification

Once all tests pass, verify the complete flow:

```bash
# Run full E2E suite
npm run test:e2e

# Check for any flaky tests
npm run test:e2e -- --repeat-each=3

# Verify no regressions
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --reporter=html
```

## Documentation

All fixes and analysis documented in:
- `E2E_GUEST_AUTH_REMAINING_FAILURES_ANALYSIS.md` - Root cause analysis
- `E2E_GUEST_AUTH_PHASE8_FIX_PLAN.md` - Implementation plan
- `E2E_GUEST_AUTH_PHASE8_FIXES_APPLIED.md` - Complete documentation
- `E2E_GUEST_AUTH_PHASE8_SUMMARY.md` - Quick summary
- `E2E_GUEST_AUTH_NEXT_STEPS.md` - This document

## Need Help?

If you encounter issues:
1. Check the logs carefully
2. Review the analysis documents
3. Verify environment variables
4. Check database schema
5. Test routes directly with curl

**Remember**: The fixes are conservative and low-risk. The main work is diagnosing the magic link issue from the logs.

Good luck! 🚀
