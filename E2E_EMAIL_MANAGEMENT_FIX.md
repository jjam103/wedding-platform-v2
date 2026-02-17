# E2E Email Management Fix

## Root Cause Analysis

The email management tests are failing due to **RLS policy blocking access** to the `email_logs` table.

### The Problem

1. **RLS Policy**: The `email_logs` table has RLS enabled with this policy:
   ```sql
   CREATE POLICY "hosts_view_email_logs"
   ON email_logs FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM users 
       WHERE id = auth.uid() 
       AND role IN ('super_admin', 'host')
     )
   );
   ```

2. **Missing User Entry**: The E2E admin user (`admin@example.com`) exists in Supabase Auth but **NOT in the `users` table**.

3. **Result**: When the page tries to fetch emails, the query returns empty results (not an error), but the page component tries to parse the response and fails.

### Why This Happens

- The global setup creates an auth user but doesn't create a corresponding entry in the `users` table
- The RLS policy checks `users` table for role, not `admin_users` table
- The API returns success with empty data, but the frontend expects data

## Solution

### Option 1: Fix RLS Policy (Recommended)
Update the RLS policy to check the `admin_users` table instead of `users`:

```sql
-- Drop old policy
DROP POLICY IF EXISTS "hosts_view_email_logs" ON email_logs;

-- Create new policy that checks admin_users table
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
```

### Option 2: Create User Entry in Global Setup
Add the admin user to the `users` table during E2E setup:

```typescript
// In __tests__/e2e/global-setup.ts
const { data: authUser } = await supabase.auth.admin.createUser({
  email: 'admin@example.com',
  password: 'admin123',
  email_confirm: true,
});

// Add to users table
await supabase.from('users').insert({
  id: authUser.user.id,
  email: 'admin@example.com',
  role: 'host',
  status: 'active',
});
```

### Option 3: Use Service Role for Email Logs
Make email logs accessible without RLS for system operations:

```sql
-- Allow service role to bypass RLS
ALTER TABLE email_logs FORCE ROW LEVEL SECURITY;

-- Add policy for service role
CREATE POLICY "service_role_full_access"
ON email_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

## Recommended Fix: Option 1

Update the RLS policy to use `admin_users` table, which is the correct table for admin authentication.

### Migration File

Create `supabase/migrations/054_fix_email_logs_rls.sql`:

```sql
-- Fix email_logs RLS policy to use admin_users table
-- This aligns with the admin authentication system

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

## Testing the Fix

1. Apply the migration to both databases:
   ```bash
   # Production database
   npm run supabase:migrate
   
   # E2E database
   SUPABASE_URL=$SUPABASE_E2E_URL \
   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_E2E_SERVICE_ROLE_KEY \
   npm run supabase:migrate
   ```

2. Run email management tests:
   ```bash
   npx playwright test __tests__/e2e/admin/emailManagement.spec.ts
   ```

3. Verify all 15 email tests pass

## Expected Impact

- **Fixes**: All 15 email management test failures
- **Pass Rate**: 61.5% → 75.2% (+13.7%)
- **Time**: 30 minutes to implement and test

## Next Steps

After fixing email management:
1. Move to Priority 2 (Location Hierarchy - 6 tests)
2. Then Priority 3 (Admin Navigation - 7 tests)
3. Continue through remaining priorities
