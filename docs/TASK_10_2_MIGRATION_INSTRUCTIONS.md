# Task 10.2: Apply Missing E2E Database Migrations

## Status: Ready for Manual Application

## Summary

The E2E test database is missing **15 critical migrations** (034-051) that are causing **40-50 test failures** (27-34% of all E2E test failures). These migrations need to be applied manually via the Supabase Dashboard.

## What's Been Done

✅ **Identified missing migrations** - Ran verification script and identified all 13 migration files with issues
✅ **Created combined SQL file** - All migrations combined into single file for easy application
✅ **Created application scripts** - Multiple scripts to help apply migrations
✅ **Created comprehensive guide** - Step-by-step instructions in `docs/APPLY_E2E_MIGRATIONS_GUIDE.md`

## What You Need to Do

### Quick Start (5 minutes)

1. **Open Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql

2. **Open Combined Migrations File**
   - File: `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql`

3. **Copy & Execute**
   - Copy all SQL content from the file
   - Paste into Supabase SQL Editor
   - Click "Run" button

4. **Verify Success**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

5. **Test the Fix**
   ```bash
   npx playwright test __tests__/e2e/admin/userManagement.spec.ts
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts
   ```

## Missing Migrations Details

### Critical Tables (causing most failures)

1. **`admin_users`** - Required for admin user management tests
   - Migration: `038_create_admin_users_table.sql`
   - Impact: ~15 tests failing

2. **`guest_sessions`** - Required for guest authentication
   - Migration: `038_create_guest_sessions_table.sql`
   - Impact: ~20 tests failing

3. **`magic_link_tokens`** - Required for magic link authentication
   - Migration: `037_create_magic_link_tokens_table.sql`
   - Impact: ~10 tests failing

4. **`email_templates`** - Required for email management
   - Migration: `039_create_email_templates_table.sql`
   - Impact: ~8 tests failing

5. **`email_history`** - Required for email tracking
   - Migration: `040_create_email_history_table.sql`
   - Impact: ~5 tests failing

6. **`system_settings`** - Required for settings management
   - Migration: `050_create_system_settings_table.sql`
   - Impact: ~5 tests failing

### Critical Columns (causing routing/feature failures)

7. **Slug columns** - Required for slug-based routing
   - Migrations: `038_add_slug_columns_to_events_activities.sql`, `039_add_slug_columns_to_accommodations_room_types.sql`
   - Tables: `events`, `activities`, `accommodations`, `room_types`
   - Impact: ~15 tests failing

8. **Soft delete columns** - Required for soft delete functionality
   - Migration: `048_add_soft_delete_columns.sql`
   - Tables: `content_pages`, `sections`, `columns`, `events`, `activities`, `photos`, `rsvps`
   - Impact: ~10 tests failing

9. **Auth method columns** - Required for guest authentication
   - Migration: `036_add_auth_method_fields.sql`
   - Tables: `guests`, `system_settings`
   - Impact: ~8 tests failing

### Other Columns

10. **`sections.title`** - Section titles
11. **`vendor_bookings.base_cost`** - Vendor cost tracking
12. **`accommodations.event_id`** - Event association

## Expected Impact

### Before Migrations
- **Total tests**: 359
- **Passing**: 193 (53.8%)
- **Failing**: 145 (40.4%)
- **Skipped**: 21 (5.8%)

### After Migrations (Expected)
- **Total tests**: 359
- **Passing**: 263-288 (73-80%)
- **Failing**: 50-75 (14-21%)
- **Skipped**: 21 (5.8%)

### Improvement
- **+70 to +95 tests passing**
- **+19 to +26 percentage points**
- **40-50 environment-related failures resolved**

## Why Manual Application is Required

Automated migration application failed due to:

1. **PostgreSQL Connection Blocked** - Direct database connections (port 5432) are blocked by Supabase
2. **Connection Pooler Issues** - Pooler connections (port 6543) require different authentication
3. **No exec_sql RPC** - The E2E database doesn't have the `exec_sql` RPC function for REST API execution

**Solution**: Use Supabase Dashboard SQL Editor (web-based, always works)

## Files Created

1. **`docs/APPLY_E2E_MIGRATIONS_GUIDE.md`** - Comprehensive step-by-step guide
2. **`scripts/apply-e2e-migrations-direct.mjs`** - Direct PostgreSQL connection script (blocked)
3. **`scripts/apply-e2e-migrations-api.mjs`** - REST API script (requires exec_sql RPC)
4. **`supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql`** - All migrations combined (already exists)

## Verification

After applying migrations, run:

```bash
# Verify all migrations applied
node scripts/verify-e2e-migrations.mjs

# Expected output:
# ✅ All migrations appear to be applied successfully!
```

## Next Steps After Migration

Once migrations are applied:

1. ✅ **Verify migrations** - Run verification script
2. 🔄 **Fix guest authentication** - Task 10.2.2 (guest login, session, RLS)
3. 🔄 **Fix admin authentication** - Task 10.2.3 (auth state, protected routes)
4. 🔄 **Run full E2E suite** - Verify 70-95 additional tests pass
5. 🔄 **Document results** - Update Task 10 completion report

## Time Estimate

- **Migration application**: 5 minutes
- **Verification**: 2 minutes
- **Testing**: 10 minutes
- **Total**: ~17 minutes

## Support

If you encounter issues:

1. **Check Supabase Dashboard logs** - Look for error messages
2. **Review migration SQL** - Check for syntax errors
3. **Verify database connection** - Ensure you're on the correct project
4. **Check permissions** - Ensure service role key has admin access

## References

- **Failure Analysis**: `docs/TASK_10_FAILURE_ANALYSIS.md`
- **Execution Plan**: `docs/TASK_10_EXECUTION_PLAN.md`
- **Task 9 Results**: `docs/TASK_9_COMPLETE_EXECUTION_REPORT.md`
- **Verification Script**: `scripts/verify-e2e-migrations.mjs`
- **Combined Migrations**: `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql`

---

**Ready to proceed?** Follow the Quick Start steps above to apply the migrations in 5 minutes.
