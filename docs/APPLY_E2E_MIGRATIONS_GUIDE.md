# Apply E2E Database Migrations Guide

## Overview

The E2E test database is missing 15 migrations (034-051) that need to be applied. This guide provides step-by-step instructions to apply them.

## Missing Migrations

The following migrations are missing from the E2E test database:

1. `034_add_section_title.sql` - Adds title field to sections
2. `036_add_auth_method_fields.sql` - Adds guest authentication method fields
3. `037_create_magic_link_tokens_table.sql` - Creates magic link tokens table
4. `038_add_slug_columns_to_events_activities.sql` - Adds slug columns to events/activities
5. `038_create_admin_users_table.sql` - Creates admin users table
6. `038_create_guest_sessions_table.sql` - Creates guest sessions table
7. `039_add_slug_columns_to_accommodations_room_types.sql` - Adds slug columns to accommodations/room types
8. `039_create_email_templates_table.sql` - Creates email templates table
9. `040_create_email_history_table.sql` - Creates email history table
10. `048_add_soft_delete_columns.sql` - Adds soft delete columns to multiple tables
11. `049_populate_entity_slugs.sql` - Populates slug values for existing entities
12. `050_create_system_settings_table.sql` - Creates system settings table
13. `051_add_base_cost_to_vendor_bookings.sql` - Adds base_cost to vendor_bookings
14. `051_add_default_auth_method.sql` - Adds default_auth_method to system_settings
15. `051_add_event_id_to_accommodations.sql` - Adds event_id to accommodations

## Impact

These missing migrations are causing **40-50 E2E test failures** (27-34% of all failures):

- **Admin user management tests** - Missing admin_users table
- **Guest authentication tests** - Missing guest_sessions, magic_link_tokens tables
- **Email system tests** - Missing email_templates, email_history tables
- **Slug-based routing tests** - Missing slug columns
- **Soft delete tests** - Missing deleted_at/deleted_by columns
- **Settings tests** - Missing system_settings table

## Method 1: Supabase Dashboard (Recommended)

This is the easiest and most reliable method.

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
   - Log in with your Supabase account

2. **Open Combined Migrations File**
   - In your local project, open: `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql`
   - This file contains all 15 migrations combined

3. **Copy SQL Content**
   - Select all content in the file (Cmd+A / Ctrl+A)
   - Copy to clipboard (Cmd+C / Ctrl+C)

4. **Execute in SQL Editor**
   - Paste the SQL into the Supabase SQL Editor
   - Click the "Run" button (or press Cmd+Enter / Ctrl+Enter)
   - Wait for execution to complete

5. **Verify Success**
   - Check for any error messages in the output
   - If you see "already exists" errors, that's OK - it means some objects were already created
   - Look for "Query completed successfully" message

6. **Verify Migrations Applied**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```
   - This should show all migrations as verified

## Method 2: Apply Individual Migrations

If you prefer to apply migrations one at a time:

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql

2. **For Each Migration File** (in order):
   - Open the migration file in your editor
   - Copy the SQL content
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Wait for completion
   - Move to next migration

3. **Migration Order** (important!):
   ```
   034_add_section_title.sql
   036_add_auth_method_fields.sql
   037_create_magic_link_tokens_table.sql
   038_add_slug_columns_to_events_activities.sql
   038_create_admin_users_table.sql
   038_create_guest_sessions_table.sql
   039_add_slug_columns_to_accommodations_room_types.sql
   039_create_email_templates_table.sql
   040_create_email_history_table.sql
   048_add_soft_delete_columns.sql
   049_populate_entity_slugs.sql
   050_create_system_settings_table.sql
   051_add_base_cost_to_vendor_bookings.sql
   051_add_default_auth_method.sql
   051_add_event_id_to_accommodations.sql
   ```

## Method 3: Supabase CLI (Advanced)

If you have Supabase CLI installed and configured:

### Steps:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to Project**:
   ```bash
   supabase link --project-ref olcqaawrpnanioaorfer
   ```
   - You'll need to enter your Supabase access token

3. **Push Migrations**:
   ```bash
   supabase db push
   ```
   - This will apply all pending migrations

4. **Verify**:
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

## Verification

After applying migrations using any method:

### 1. Run Verification Script
```bash
node scripts/verify-e2e-migrations.mjs
```

**Expected Output:**
```
✅ All migrations appear to be applied successfully!
   The test database schema matches the migration files.
```

### 2. Check for New Tables
The following tables should now exist:
- `admin_users`
- `guest_sessions`
- `magic_link_tokens`
- `email_templates`
- `email_history`
- `system_settings`

### 3. Check for New Columns
The following columns should now exist:
- `sections.title`
- `guests.auth_method`
- `events.slug`
- `activities.slug`
- `accommodations.slug`
- `room_types.slug`
- `content_pages.deleted_at`, `deleted_by`
- `sections.deleted_at`, `deleted_by`
- `columns.deleted_at`, `deleted_by`
- `events.deleted_at`, `deleted_by`
- `activities.deleted_at`, `deleted_by`
- `photos.deleted_at`, `deleted_by`
- `rsvps.deleted_at`, `deleted_by`
- `vendor_bookings.base_cost`
- `system_settings.default_auth_method`
- `accommodations.event_id`

## Testing After Migration

### 1. Run Affected Test Suites
```bash
# Test admin user management
npx playwright test __tests__/e2e/admin/userManagement.spec.ts

# Test guest authentication
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# Test email management
npx playwright test __tests__/e2e/admin/emailManagement.spec.ts

# Test slug-based routing
npx playwright test __tests__/e2e/system/routing.spec.ts
```

### 2. Run Full E2E Suite
```bash
npm run test:e2e
```

**Expected Improvement:**
- Pass rate should increase from 53.8% to 75-85%
- 70-95 additional tests should pass
- Environment-related failures should be resolved

## Troubleshooting

### Error: "already exists"
- **Cause**: Some objects were already created
- **Solution**: This is OK, continue with remaining migrations

### Error: "permission denied"
- **Cause**: Insufficient permissions
- **Solution**: Ensure you're using the service role key, not anon key

### Error: "relation does not exist"
- **Cause**: Migrations applied out of order
- **Solution**: Apply migrations in the order listed above

### Error: "column already exists"
- **Cause**: Migration was partially applied before
- **Solution**: This is OK, the migration will skip existing columns

### Verification Still Shows Missing Items
- **Cause**: Migrations may not have been fully applied
- **Solution**: 
  1. Check Supabase SQL Editor for error messages
  2. Try applying the specific failing migration again
  3. Check if the table/column actually exists in the database

## Next Steps After Migration

1. **Verify migrations applied**: `node scripts/verify-e2e-migrations.mjs`
2. **Fix guest authentication** (Task 10.2.2)
3. **Fix admin authentication** (Task 10.2.3)
4. **Run full E2E suite**: `npm run test:e2e`
5. **Document results** in Task 10 completion report

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Review the migration SQL for syntax errors
3. Ensure you're connected to the correct database (olcqaawrpnanioaorfer)
4. Verify your service role key has admin permissions

## Database Information

- **Project**: wedding-platform-test
- **Project Ref**: olcqaawrpnanioaorfer
- **URL**: https://olcqaawrpnanioaorfer.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer
- **SQL Editor**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
