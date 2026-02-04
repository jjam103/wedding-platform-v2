# Quick Guide: Apply E2E Database Migrations

## TL;DR

1. Open https://olcqaawrpnanioaorfer.supabase.co
2. Go to SQL Editor
3. Copy/paste `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS_FIXED.sql`
4. Click "Run"
5. Verify success (should see "All migrations applied successfully")

## Detailed Steps

### Step 1: Access Supabase Dashboard

1. Navigate to: https://olcqaawrpnanioaorfer.supabase.co
2. Log in with your Supabase credentials
3. Select the E2E test project

### Step 2: Open SQL Editor

1. Click "SQL Editor" in the left sidebar
2. Click "New query" button

### Step 3: Copy Migration SQL

1. Open `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS_FIXED.sql` in your editor
2. Select all content (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)

### Step 4: Execute Migration

1. Paste into Supabase SQL Editor (Cmd+V / Ctrl+V)
2. Review the SQL (optional - it's safe)
3. Click "Run" button (or press Cmd+Enter / Ctrl+Enter)
4. Wait for execution to complete (~5-10 seconds)

### Step 5: Verify Success

You should see output like:
```
Success. No rows returned
```

Or check for the success comment at the end:
```sql
-- All migrations applied successfully
```

### Step 6: Verify Schema

Run the diagnostic script to confirm all tables/columns exist:

```bash
node scripts/diagnose-e2e-failures.mjs
```

Expected output:
```
=== E2E Test Failure Diagnosis ===

1. Checking system_settings table...
✅ system_settings table exists

2. Checking events table schema...
✅ events table has required columns

3. Checking activities table schema...
✅ activities table has required columns

4. Checking rsvps table with joins...
✅ rsvps table joins work correctly

5. Checking locations table hierarchy...
✅ locations table has parent_id column

6. Checking photos table...
✅ photos table exists

7. Checking guests table schema...
✅ guests table exists

=== Diagnosis Complete ===
```

### Step 7: Run E2E Tests

```bash
npm run test:e2e
```

Expected improvement:
- **Before:** ~60% pass rate
- **After:** >90% pass rate

## Troubleshooting

### Error: "relation already exists"

**Cause:** Migration already partially applied
**Solution:** This is fine! The migrations use `IF NOT EXISTS` clauses and are idempotent. The migration will skip existing objects and continue.

### Error: "column already exists"

**Cause:** Column was added in a previous run
**Solution:** This is fine! The migrations use `ADD COLUMN IF NOT EXISTS` and will skip existing columns.

### Error: "permission denied"

**Cause:** Insufficient database permissions
**Solution:** Ensure you're logged in as the project owner or have admin access.

### Error: "syntax error"

**Cause:** SQL Editor parsing issue
**Solution:** The migration file uses `$function_body$` syntax specifically to avoid this. If you still see errors, try:
1. Copy smaller sections at a time
2. Use the direct script: `node scripts/apply-e2e-migrations-direct.mjs`

## Alternative: Script Method

If you prefer to use a script instead of the dashboard:

```bash
# Ensure environment variables are set
cat .env.test | grep SUPABASE

# Run migration script
node scripts/apply-e2e-migrations-direct.mjs
```

The script will:
1. Connect to E2E database
2. Apply each migration
3. Report success/failure for each
4. Provide summary at the end

## What Gets Added

### New Tables:
- `system_settings` - Application configuration
- `magic_link_tokens` - Magic link authentication
- `admin_users` - Admin user management
- `guest_sessions` - Guest session tracking
- `email_history` - Email delivery tracking

### New Columns:
- `events.slug` - URL-friendly identifier
- `events.deleted_at` - Soft delete timestamp
- `activities.slug` - URL-friendly identifier
- `activities.deleted_at` - Soft delete timestamp
- `accommodations.slug` - URL-friendly identifier
- `accommodations.event_id` - Event association
- `room_types.slug` - URL-friendly identifier
- `content_pages.deleted_at` - Soft delete timestamp
- `sections.title` - Section title
- `sections.deleted_at` - Soft delete timestamp
- `columns.deleted_at` - Soft delete timestamp
- `photos.deleted_at` - Soft delete timestamp
- `rsvps.deleted_at` - Soft delete timestamp
- `guests.auth_method` - Authentication method
- `vendor_bookings.base_cost` - Base cost field

### New Functions:
- `generate_slug_from_name()` - Auto-generate slugs
- `cleanup_expired_magic_link_tokens()` - Token cleanup
- `mark_magic_link_token_used()` - Mark token as used
- `cleanup_expired_guest_sessions()` - Session cleanup
- `mark_guest_session_used()` - Mark session as used

### New Triggers:
- `events_generate_slug` - Auto-generate event slugs
- `activities_generate_slug` - Auto-generate activity slugs
- `accommodations_generate_slug` - Auto-generate accommodation slugs
- `room_types_generate_slug` - Auto-generate room type slugs

## Safety Notes

✅ **Safe to run multiple times** - All migrations use `IF NOT EXISTS` / `IF NOT EXISTS` clauses
✅ **No data loss** - Only adds tables/columns, never removes
✅ **No breaking changes** - All new columns have defaults or are nullable
✅ **Rollback not needed** - Migrations are additive only
✅ **Production unaffected** - Only applies to E2E test database

## Post-Migration Checklist

- [ ] Migrations executed without errors
- [ ] Diagnostic script shows all green checkmarks
- [ ] E2E test pass rate improved to >90%
- [ ] Home page API tests pass (4/4)
- [ ] Reference blocks tests pass (8/8)
- [ ] RSVP tests pass
- [ ] Photo upload tests pass
- [ ] Location hierarchy tests pass
- [ ] CSV import/export tests pass

## Need Help?

If you encounter issues:

1. Check the detailed documentation: `docs/TASK_10_2_3_E2E_FIXES_SUMMARY.md`
2. Run diagnostics: `node scripts/diagnose-e2e-failures.mjs`
3. Check Supabase logs in the dashboard
4. Review migration file for specific error line

## Success Indicators

After successful migration, you should see:

1. **Diagnostic Script:** All ✅ green checkmarks
2. **E2E Tests:** Pass rate >90%
3. **Supabase Dashboard:** New tables visible in Table Editor
4. **No Errors:** Clean test output without schema errors

---

**Estimated Time:** 5-10 minutes
**Difficulty:** Easy
**Risk Level:** Low (idempotent, additive only)
