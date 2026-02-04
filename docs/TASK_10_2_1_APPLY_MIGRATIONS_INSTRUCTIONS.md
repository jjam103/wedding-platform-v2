# Task 10.2.1: Apply Missing Database Migrations

## Status: Ready to Execute

## Overview
Apply 15 missing migrations (034-051) to the E2E test database to fix 40-50 failing tests.

## Impact
- **Tests Fixed**: 40-50 tests (27-34% of all failures)
- **Pass Rate Improvement**: From 53.8% to ~75-85%
- **Affected Test Suites**:
  - Admin user management tests
  - Guest authentication tests  
  - Email system tests
  - Slug-based routing tests
  - Soft delete tests
  - Settings tests

## Missing Migrations

The following 15 migrations need to be applied:

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

## Method: Supabase Dashboard SQL Editor (Recommended)

### Why This Method?
- ✅ Most reliable - no network/connection issues
- ✅ Visual feedback - see results immediately
- ✅ Error handling - clear error messages
- ✅ No dependencies - works in any environment

### Step-by-Step Instructions

#### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
2. Log in with your Supabase account credentials
3. You should see the SQL Editor interface

#### Step 2: Open Combined Migrations File
1. In your local project, open: `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql`
2. This file contains all 15 migrations combined in the correct order
3. File size: ~35KB, 1035 lines

#### Step 3: Copy SQL Content
1. Select all content in the file:
   - Mac: `Cmd+A`
   - Windows/Linux: `Ctrl+A`
2. Copy to clipboard:
   - Mac: `Cmd+C`
   - Windows/Linux: `Ctrl+C`

#### Step 4: Execute in SQL Editor
1. Paste the SQL into the Supabase SQL Editor:
   - Mac: `Cmd+V`
   - Windows/Linux: `Ctrl+V`
2. Click the "Run" button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for execution to complete (should take 10-30 seconds)

#### Step 5: Review Results
1. Check the output panel at the bottom of the SQL Editor
2. Look for success messages or errors
3. **Expected behavior**:
   - Some "already exists" warnings are OK (means objects were partially created)
   - Look for "Query completed successfully" or similar message
   - No critical errors should appear

#### Step 6: Verify Migrations Applied
Run the verification script in your terminal:
```bash
node scripts/verify-e2e-migrations.mjs
```

**Expected Output:**
```
✅ All migrations appear to be applied successfully!
   The test database schema matches the migration files.
```

## Verification Checklist

After applying migrations, verify these tables exist:

- [ ] `admin_users` - Admin user management
- [ ] `guest_sessions` - Guest authentication sessions
- [ ] `magic_link_tokens` - Magic link authentication
- [ ] `email_templates` - Email template management (should already exist from migration 008)
- [ ] `email_history` - Email delivery tracking
- [ ] `system_settings` - System configuration (should already exist)

Verify these columns exist:

- [ ] `sections.title` - Section titles
- [ ] `guests.auth_method` - Guest authentication method
- [ ] `events.slug` - Event URL slugs
- [ ] `activities.slug` - Activity URL slugs
- [ ] `accommodations.slug` - Accommodation URL slugs
- [ ] `room_types.slug` - Room type URL slugs
- [ ] `content_pages.deleted_at` - Soft delete timestamp
- [ ] `sections.deleted_at` - Soft delete timestamp
- [ ] `columns.deleted_at` - Soft delete timestamp
- [ ] `events.deleted_at` - Soft delete timestamp
- [ ] `activities.deleted_at` - Soft delete timestamp
- [ ] `photos.deleted_at` - Soft delete timestamp
- [ ] `rsvps.deleted_at` - Soft delete timestamp
- [ ] `vendor_bookings.base_cost` - Base cost for pricing
- [ ] `system_settings.default_auth_method` - Default auth method
- [ ] `accommodations.event_id` - Event association

## Testing After Migration

### 1. Run Verification Script
```bash
node scripts/verify-e2e-migrations.mjs
```

Should show all migrations verified with no errors.

### 2. Test Affected Test Suites
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

### 3. Run Full E2E Suite
```bash
npm run test:e2e
```

**Expected Results:**
- Pass rate should increase from 53.8% (193/359) to 75-85% (270-305/359)
- 70-95 additional tests should pass
- Environment-related failures should be resolved

## Troubleshooting

### Error: "already exists"
- **Cause**: Some objects were already created
- **Solution**: This is OK, continue - the migration will skip existing objects

### Error: "permission denied"
- **Cause**: Insufficient permissions
- **Solution**: Ensure you're logged in as the project owner in Supabase Dashboard

### Error: "relation does not exist"
- **Cause**: Migrations applied out of order or dependencies missing
- **Solution**: The combined file has migrations in the correct order - try running again

### Error: "column already exists"
- **Cause**: Migration was partially applied before
- **Solution**: This is OK, the migration will skip existing columns

### Verification Still Shows Missing Items
- **Cause**: Migrations may not have been fully applied
- **Solution**: 
  1. Check Supabase SQL Editor output for error messages
  2. Try applying the specific failing migration again
  3. Verify the table/column actually exists in the database using SQL Editor:
     ```sql
     -- Check if table exists
     SELECT * FROM information_schema.tables WHERE table_name = 'admin_users';
     
     -- Check if column exists
     SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'guests' AND column_name = 'auth_method';
     ```

## Alternative: Apply Individual Migrations

If the combined file fails, you can apply migrations one at a time:

1. Open each migration file in order (034, 036, 037, etc.)
2. Copy the SQL content
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for completion
6. Move to next migration

**Important**: Apply in the order listed above to avoid dependency issues.

## Database Information

- **Project**: wedding-platform-test
- **Project Ref**: olcqaawrpnanioaorfer
- **URL**: https://olcqaawrpnanioaorfer.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer
- **SQL Editor**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql

## Next Steps After Completion

1. ✅ Verify migrations applied: `node scripts/verify-e2e-migrations.mjs`
2. ⏭️ Proceed to Task 10.2.2: Fix Guest Authentication
3. ⏭️ Proceed to Task 10.2.3: Fix Admin Authentication
4. 🧪 Run full E2E suite: `npm run test:e2e`
5. 📊 Document results in Task 10 completion report

## Success Criteria

- [ ] All 15 migrations applied successfully
- [ ] Verification script shows no missing tables/columns
- [ ] 40-50 additional tests pass
- [ ] Pass rate increases to 75-85%
- [ ] No new errors introduced

## Estimated Time

- **Applying migrations**: 5-10 minutes
- **Verification**: 2-3 minutes
- **Testing**: 10-15 minutes
- **Total**: 20-30 minutes

## Notes

- The combined migrations file is safe to run multiple times (idempotent)
- "IF NOT EXISTS" clauses prevent errors on re-runs
- Some warnings about existing objects are expected and safe
- The migrations are ordered to handle dependencies correctly
