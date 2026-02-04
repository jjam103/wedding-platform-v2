# Task 12.2: Auth Method Migration Required

## Status: ⚠️ Manual Migration Required

## Summary

Task 12.2 requires running the guest `auth_method` fix script to ensure all guests have a valid authentication method. However, the prerequisite database migration has not been applied yet.

## Issue

The `auth_method` column does not exist in the `guests` table. This column is added by migration `036_add_auth_method_fields.sql`, which has not been applied to the database.

## Error Encountered

```
❌ Error fetching guests: column guests.auth_method does not exist
```

## Required Action

**The migration must be applied manually using the Supabase Dashboard.**

### Steps to Apply Migration:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/036_add_auth_method_fields.sql`
   - Copy the entire contents

3. **Execute Migration**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" to execute the migration
   - Verify no errors occurred

4. **Verify Migration**
   - Run the verification script:
     ```bash
     node scripts/check-and-apply-auth-method-migration.mjs
     ```
   - Should output: `✅ Migration is already applied. Ready to run fix script.`

5. **Run Fix Script**
   - Once migration is verified, run:
     ```bash
     node scripts/fix-guest-auth-method.mjs --all
     ```
   - This will update all guests with NULL auth_method to 'email_matching'

## Migration Contents

The migration (`036_add_auth_method_fields.sql`) performs the following:

1. **Adds `auth_method` column to `guests` table**
   - Type: TEXT NOT NULL
   - Default: 'email_matching'
   - Constraint: Must be 'email_matching' or 'magic_link'

2. **Adds `default_auth_method` to `system_settings` table**
   - Type: TEXT NOT NULL
   - Default: 'email_matching'
   - Constraint: Must be 'email_matching' or 'magic_link'

3. **Creates performance indexes**
   - `idx_guests_auth_method`: Index on auth_method column
   - `idx_guests_email_auth_method`: Composite index on (email, auth_method)

## Why Manual Migration is Needed

The Supabase JavaScript client does not have direct SQL execution capabilities for security reasons. Migrations must be applied through:
- Supabase Dashboard SQL Editor (recommended)
- Supabase CLI (`supabase db push`)
- Direct database connection with appropriate permissions

## After Migration is Applied

Once the migration is successfully applied:

1. **Verify the column exists:**
   ```bash
   node scripts/check-and-apply-auth-method-migration.mjs
   ```

2. **Run the fix script:**
   ```bash
   node scripts/fix-guest-auth-method.mjs --all
   ```

3. **Expected output:**
   ```
   🔍 Checking all guests with NULL auth_method...
   📝 Found X guest(s) with NULL auth_method
   ✅ Successfully updated X guest(s) to 'email_matching'
      - Guest Name 1 (email1@example.com)
      - Guest Name 2 (email2@example.com)
      ...
   ```

4. **Mark task as complete:**
   - Update task status in `.kiro/specs/admin-ux-enhancements/tasks.md`
   - Document the number of records updated

## Scripts Created

The following helper scripts have been created:

1. **`scripts/check-and-apply-auth-method-migration.mjs`**
   - Checks if auth_method column exists
   - Provides instructions for manual migration if needed

2. **`scripts/apply-auth-method-migration.mjs`**
   - Attempts to apply migration programmatically
   - Falls back to manual instructions if RPC not available

3. **`scripts/fix-guest-auth-method.mjs`** (already existed)
   - Fixes guest auth_method values
   - Can fix specific guest by email or all guests with `--all` flag

## Next Steps

1. **User Action Required:** Apply migration `036_add_auth_method_fields.sql` via Supabase Dashboard
2. **Verify:** Run check script to confirm migration applied
3. **Execute:** Run fix script to update guest records
4. **Complete:** Mark task 12.2 as complete with record count

## Related Files

- Migration: `supabase/migrations/036_add_auth_method_fields.sql`
- Fix Script: `scripts/fix-guest-auth-method.mjs`
- Check Script: `scripts/check-and-apply-auth-method-migration.mjs`
- Task File: `.kiro/specs/admin-ux-enhancements/tasks.md`

## Requirements Validated

- **Requirement 1.1:** Guest records have correct `auth_method` set to 'email_matching'
- **Requirement 1.3:** Database migration script available to fix existing records

