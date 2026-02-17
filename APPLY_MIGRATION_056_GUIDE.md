# Quick Guide: Apply Migration 056

**Purpose**: Fix email composer guest loading issue  
**Time**: 5 minutes  
**Risk**: Low (only restores a missing policy)

---

## 🚀 Quick Start

### Option 1: Copy/Paste SQL (Fastest)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Copy and paste this SQL:

```sql
-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "allow_role_lookup_for_rls" ON users;

-- Recreate policy to allow reading user role for any authenticated user
CREATE POLICY "allow_role_lookup_for_rls"
ON users FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON POLICY "allow_role_lookup_for_rls" ON users IS 'Allows get_user_role() function to work in RLS policies. Only returns role field, no sensitive data exposed.';
```

4. Click "Run"
5. Verify: Should see "Success. No rows returned"

---

### Option 2: Use Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/wedding-project

# Apply the migration
supabase db execute --file supabase/migrations/056_restore_allow_role_lookup_policy.sql --db-url "$SUPABASE_DB_URL"
```

---

### Option 3: Use Helper Script

```bash
# Run the helper script (shows SQL and instructions)
node scripts/apply-migration-056.mjs
```

---

## ✅ Verify the Fix

### Step 1: Run Diagnostic Script
```bash
node scripts/diagnose-email-composer-api.mjs
```

**Expected Output**:
```
Test 2: Authenticated query (admin user)
==================================================
✅ Auth successful
- User ID: e7f5ae65-376e-4d05-a18c-10a91295727a
- Email: admin@example.com
Result:
- Error: null
- Count: 5
- Guests: 5
✅ Success!
```

**Before Fix** (what you saw):
```
Result:
- Error: {
  code: '42501',
  message: 'permission denied for table users'
}
- Count: null
- Guests: 0
❌ Failed
```

### Step 2: Test Email Management
```bash
# Run just the email management tests
npx playwright test __tests__/e2e/admin/emailManagement.spec.ts
```

**Expected**: All 8 tests should pass ✅

---

## 🔍 Troubleshooting

### Issue: "Policy already exists"
**Solution**: This is fine! The migration is idempotent. The policy is already there.

### Issue: "Permission denied to create policy"
**Solution**: Make sure you're using the service role key or owner credentials.

### Issue: Diagnostic still shows "permission denied"
**Possible causes**:
1. Migration didn't apply - check Supabase Dashboard → Database → Policies
2. Wrong database - verify `SUPABASE_DB_URL` in `.env.e2e`
3. Cache issue - restart Next.js dev server

**Debug steps**:
```bash
# Check if policy exists
# In Supabase SQL Editor:
SELECT policyname FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'allow_role_lookup_for_rls';

# Should return 1 row
```

### Issue: Tests still failing
**Check**:
1. Did you restart the Next.js dev server?
2. Are you running tests against the correct database?
3. Run diagnostic script to see exact error

---

## 📊 Expected Results

### Before Fix
- **Email Management Tests**: 0/8 passing (0%)
- **Error**: "permission denied for table users"
- **Email Composer**: Cannot load guests

### After Fix
- **Email Management Tests**: 8/8 passing (100%) ✅
- **Error**: None
- **Email Composer**: Loads guests successfully

### Overall Impact
- **Pass Rate**: 64.6% → 66.9% (+2.3%)
- **Tests Fixed**: +8 tests
- **Remaining**: 71 failing tests

---

## 🎯 Next Steps After Fix

Once the fix is verified:

1. **Update Progress Tracker**
   - Mark email management as fixed
   - Update pass rate

2. **Continue Phase 1**
   - Investigate content management API timing (32 tests)
   - Check data table URL state features (12 tests)
   - Fix navigation issues (9 tests)

3. **Document Lessons Learned**
   - Add regression test for this policy
   - Update migration checklist

---

## 📞 Need Help?

If you encounter issues:

1. **Share diagnostic output**:
   ```bash
   node scripts/diagnose-email-composer-api.mjs > diagnostic-output.txt 2>&1
   ```

2. **Check migration status**:
   - Supabase Dashboard → Database → Policies
   - Look for "allow_role_lookup_for_rls" on users table

3. **Verify function exists**:
   ```sql
   SELECT proname, prosecdef, proconfig 
   FROM pg_proc 
   WHERE proname = 'get_user_role';
   ```

---

## ✨ Success!

Once you see:
- ✅ Diagnostic script shows authenticated query works
- ✅ Email management tests pass
- ✅ Email composer loads guests

You're ready to continue with the remaining E2E test fixes!

---

**Estimated Time**: 5 minutes  
**Confidence**: High  
**Risk**: Low
