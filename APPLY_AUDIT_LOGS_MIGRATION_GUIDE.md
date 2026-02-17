# Apply Audit Logs Migration - Step-by-Step Guide

## Overview

The E2E tests are failing because the `audit_logs` table is missing two columns (`action` and `details`) that were added in migration 053. This migration needs to be applied manually via the Supabase dashboard.

---

## Why Manual Application?

The migration cannot be applied via the Supabase API because:
1. The Management API doesn't support running arbitrary SQL
2. The SQL Editor is the recommended way to apply migrations to hosted databases
3. This ensures you can review the changes before applying them

---

## Step-by-Step Instructions

### Step 1: Verify Current Schema

Run the verification script to confirm the columns are missing:

```bash
node scripts/verify-audit-logs-schema.mjs
```

**Expected Output** (if columns are missing):
```
❌ Columns not found in audit_logs table

Missing columns:
  - action (TEXT)
  - details (JSONB)

📋 To fix this, apply the migration:
   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   2. Execute SQL from: supabase/migrations/053_add_action_and_details_to_audit_logs.sql
```

---

### Step 2: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project (the E2E test database project)
3. Navigate to **SQL Editor** in the left sidebar

---

### Step 3: Execute Migration SQL

Copy and paste the following SQL into the SQL Editor:

```sql
-- Migration: Add action and details columns to audit_logs
-- This allows for more flexible audit logging beyond just CRUD operations

-- Add action column for specific action types (e.g., 'guest_login', 'magic_link_requested')
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;

-- Add details column for additional context
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Create index for action column
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Update comments
COMMENT ON COLUMN audit_logs.action IS 'Specific action type (e.g., guest_login, magic_link_requested, guest_logout)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context and metadata for the action';

-- Make operation_type nullable since we now have action
ALTER TABLE audit_logs ALTER COLUMN operation_type DROP NOT NULL;
```

Click **Run** to execute the migration.

---

### Step 4: Verify Migration Applied

Run the verification script again:

```bash
node scripts/verify-audit-logs-schema.mjs
```

**Expected Output** (if successful):
```
✅ All required columns exist!

🧪 Testing audit log insertion...

✅ Audit log insertion successful!
```

---

### Step 5: Run E2E Tests

Now that the schema is updated, run the E2E tests:

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1
```

**Expected Results**:
- ✅ 16/16 tests passing
- ✅ No audit log errors
- ✅ Guest authentication working correctly

---

## Troubleshooting

### Issue: "Permission denied" when running verification script

**Solution**: Make sure you're using the correct environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (not anon key)

Check your `.env.test` file.

---

### Issue: SQL execution fails in dashboard

**Possible Causes**:
1. **Table doesn't exist**: Make sure the `audit_logs` table exists
2. **Permission issue**: Make sure you're logged in as the project owner
3. **Syntax error**: Copy the SQL exactly as shown above

**Solution**: Check the error message in the SQL Editor and verify:
```sql
-- Check if audit_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'audit_logs';
```

---

### Issue: Tests still fail after applying migration

**Check**:
1. Verify the migration was applied to the correct database (E2E test database)
2. Run the verification script to confirm columns exist
3. Check test output for specific error messages

**Debug**:
```bash
# Run tests with verbose output
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --workers=1 --reporter=list
```

---

## Alternative: Apply via SQL File

If you prefer, you can also apply the migration by:

1. Opening the migration file: `supabase/migrations/053_add_action_and_details_to_audit_logs.sql`
2. Copying the entire contents
3. Pasting into the Supabase SQL Editor
4. Clicking **Run**

---

## Verification Queries

After applying the migration, you can verify it worked by running these queries in the SQL Editor:

### Check Columns Exist
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
  AND column_name IN ('action', 'details')
ORDER BY column_name;
```

**Expected Result**:
```
column_name | data_type | is_nullable
------------|-----------|------------
action      | text      | YES
details     | jsonb     | YES
```

### Check Index Exists
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'audit_logs'
  AND indexname = 'idx_audit_logs_action';
```

**Expected Result**:
```
indexname              | indexdef
-----------------------|------------------------------------------
idx_audit_logs_action  | CREATE INDEX idx_audit_logs_action ON...
```

### Test Insert
```sql
-- Insert a test audit log entry
INSERT INTO audit_logs (
  entity_type,
  entity_id,
  operation_type,
  action,
  details
) VALUES (
  'test',
  '00000000-0000-0000-0000-000000000000',
  'test',
  'migration_verification',
  '{"test": true, "timestamp": "2024-01-01T00:00:00Z"}'::jsonb
);

-- Verify it was inserted
SELECT action, details
FROM audit_logs
WHERE action = 'migration_verification';

-- Clean up
DELETE FROM audit_logs
WHERE action = 'migration_verification';
```

---

## Summary

1. ✅ Run verification script to confirm columns are missing
2. ✅ Open Supabase dashboard SQL Editor
3. ✅ Execute migration SQL
4. ✅ Run verification script to confirm success
5. ✅ Run E2E tests to verify everything works

---

## Need Help?

If you encounter issues:

1. Check the Supabase dashboard for error messages
2. Verify you're using the correct database (E2E test database)
3. Run the verification script for detailed diagnostics
4. Check the test output for specific error messages

The migration is safe to run multiple times (uses `IF NOT EXISTS` clauses).
