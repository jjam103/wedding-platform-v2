# Apply Email RLS Fix - Quick Guide

## What This Fixes

This migration fixes 15 email management test failures (35.7% of all E2E failures) by updating RLS policies to check the `admin_users` table instead of the `users` table.

## Steps to Apply

### 1. Open Supabase Dashboard

Open this URL in your browser:
```
https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
```

### 2. Copy the Migration SQL

The migration is in: `supabase/migrations/054_fix_email_logs_rls.sql`

Here's the complete SQL to copy:

```sql
-- Fix email_logs RLS policy to use admin_users table
-- This aligns with the admin authentication system
-- Fixes E2E test failures where admin users couldn't access email logs

-- Drop old policies
DROP POLICY IF EXISTS "hosts_view_email_logs" ON email_logs;
DROP POLICY IF EXISTS "system_insert_email_logs" ON email_logs;
DROP POLICY IF EXISTS "system_update_email_logs" ON email_logs;

-- Create new policy for admin users
CREATE POLICY "admin_users_view_email_logs"
ON email_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Allow system to insert email logs (for email service)
CREATE POLICY "system_insert_email_logs"
ON email_logs FOR INSERT
WITH CHECK (true);

-- Allow system to update email logs (for webhook status updates)
CREATE POLICY "system_update_email_logs"
ON email_logs FOR UPDATE
USING (true);

-- Fix email_templates RLS policy
DROP POLICY IF EXISTS "hosts_manage_email_templates" ON email_templates;

CREATE POLICY "admin_users_manage_email_templates"
ON email_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Fix scheduled_emails RLS policy
DROP POLICY IF EXISTS "hosts_manage_scheduled_emails" ON scheduled_emails;

CREATE POLICY "admin_users_manage_scheduled_emails"
ON scheduled_emails FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Fix sms_logs RLS policy
DROP POLICY IF EXISTS "hosts_view_sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "system_insert_sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "system_update_sms_logs" ON sms_logs;

CREATE POLICY "admin_users_view_sms_logs"
ON sms_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "system_insert_sms_logs"
ON sms_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "system_update_sms_logs"
ON sms_logs FOR UPDATE
USING (true);
```

### 3. Paste and Run

1. Paste the SQL into the SQL Editor
2. Click "Run" button
3. Verify you see "Success. No rows returned"

### 4. Test the Fix

Run the email management tests:

```bash
npx playwright test __tests__/e2e/admin/emailManagement.spec.ts
```

## Expected Results

✅ All 15 email management tests should pass
✅ Pass rate increases from 61.5% to 75.2%
✅ No errors in test output

## If Tests Still Fail

1. Check that the migration ran successfully (no errors in Supabase)
2. Verify the admin user exists in `admin_users` table:
   ```sql
   SELECT * FROM admin_users WHERE email = 'admin@example.com';
   ```
3. Check browser console for any errors during test execution
4. Review the test output for specific failure messages

## Next Steps After Success

Once email tests pass, proceed to:
1. Location Hierarchy fixes (6 tests)
2. Admin Navigation fixes (7 tests)
3. CSV Import/Export fixes (4 tests)
4. Accessibility fixes (5 tests)
5. Content Management fixes (3 tests)

Total estimated time to 100%: 5-8 hours
