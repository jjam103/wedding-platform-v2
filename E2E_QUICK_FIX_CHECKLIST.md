# E2E Guest Auth - Quick Fix Checklist

## ✅ What's Done

- [x] Fixed route discovery issue (moved to `/api/guest-auth/*`)
- [x] Fixed RLS permission errors (changed to standard `createClient`)
- [x] Verified guest dashboard is accessible
- [x] Confirmed middleware validates sessions correctly
- [x] All code changes complete

## ⏳ What's Left

- [ ] Apply audit logs migration manually
- [ ] Run E2E tests to verify

---

## Quick Steps to Complete

### Step 1: Verify Schema (30 seconds)
```bash
node scripts/verify-audit-logs-schema.mjs
```

**Expected**: Should show columns are missing

---

### Step 2: Apply Migration (2 minutes)

1. Open: https://supabase.com/dashboard
2. Go to: SQL Editor
3. Copy SQL from: `supabase/migrations/053_add_action_and_details_to_audit_logs.sql`
4. Paste and click **Run**

**SQL to Execute**:
```sql
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
ALTER TABLE audit_logs ALTER COLUMN operation_type DROP NOT NULL;
```

---

### Step 3: Verify Migration (30 seconds)
```bash
node scripts/verify-audit-logs-schema.mjs
```

**Expected**: Should show ✅ All required columns exist!

---

### Step 4: Run Tests (2 minutes)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1
```

**Expected**: 16/16 tests passing ✅

---

## If Something Goes Wrong

### Migration Fails
- Check you're logged into the correct Supabase project
- Verify you have owner/admin permissions
- Try running each ALTER TABLE statement separately

### Tests Still Fail
1. Check test output for specific error
2. Verify migration applied: `node scripts/verify-audit-logs-schema.mjs`
3. Check environment variables in `.env.test`
4. Look for error patterns in test output

### Need More Details
- See: `APPLY_AUDIT_LOGS_MIGRATION_GUIDE.md` (detailed guide)
- See: `E2E_GUEST_AUTH_FINAL_STATUS.md` (complete status)

---

## Total Time: ~5 minutes

1. Verify schema: 30 seconds
2. Apply migration: 2 minutes
3. Verify migration: 30 seconds
4. Run tests: 2 minutes

**That's it!** 🎉
