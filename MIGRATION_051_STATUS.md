# Migration 051: default_auth_method - Status Report

## Task: 12.1 Apply default_auth_method migration

**Date**: Current Session  
**Status**: ⚠️ Partially Complete - Manual SQL Execution Required

## What Was Done

### ✅ Completed Steps

1. **Migration File Verified**
   - Location: `supabase/migrations/051_add_default_auth_method.sql`
   - Content verified and correct
   - Includes all required changes

2. **Setting Inserted**
   - `default_auth_method` setting added to `system_settings` table
   - Value: `email_matching`
   - Description: "Default authentication method for new guests"
   - Category: `authentication`

3. **Verification Scripts Created**
   - `scripts/apply-migration-051.mjs` - Applies what can be done via API
   - `scripts/verify-migration-051.mjs` - Verifies migration status

### ⚠️ Pending Steps (Require Manual SQL Execution)

The following changes require direct SQL execution with database admin privileges:

1. **Add Column to system_settings**
   ```sql
   ALTER TABLE system_settings 
   ADD COLUMN IF NOT EXISTS default_auth_method TEXT DEFAULT 'email_matching';
   ```

2. **Add Constraint**
   ```sql
   ALTER TABLE system_settings 
   ADD CONSTRAINT check_default_auth_method 
   CHECK (default_auth_method IN ('email_matching', 'magic_link'));
   ```

3. **Create RSVP Indexes**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
   CREATE INDEX IF NOT EXISTS idx_rsvps_activity_id ON rsvps(activity_id);
   CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
   CREATE INDEX IF NOT EXISTS idx_rsvps_status ON rsvps(status);
   CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);
   ```

## Current Verification Status

```
✅ system_settings table exists
✅ default_auth_method setting exists
❌ default_auth_method column does not exist (needs SQL)
✅ rsvps table exists
⚠️  RSVP indexes status unknown (cannot verify via API)
```

## How to Complete the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/bwthjirvpdypmbvpsjtl
   - Navigate to: SQL Editor

2. **Execute Migration**
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/051_add_default_auth_method.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Success**
   - Run: `node scripts/verify-migration-051.mjs`
   - All checks should pass

### Option 2: psql Command Line

If you have PostgreSQL client installed:

```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[PASSWORD]@db.bwthjirvpdypmbvpsjtl.supabase.co:5432/postgres" \
  -f supabase/migrations/051_add_default_auth_method.sql
```

### Option 3: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Why Manual Execution is Required

The Supabase JavaScript client does not support executing DDL (Data Definition Language) statements like `ALTER TABLE`, `CREATE INDEX`, etc. These operations require:

1. Direct database connection with admin privileges
2. PostgreSQL superuser or table owner permissions
3. Ability to modify table schema

The service role key allows data manipulation (INSERT, UPDATE, DELETE) but not schema changes.

## Validation Requirements (from Design Doc)

This migration validates **Requirement 4.1**:
- System settings include `default_auth_method` option
- Settings page allows toggling between 'email_matching' and 'magic_link'
- New guests inherit the default auth method
- Existing guests can be bulk updated

## Next Steps

1. **Execute the SQL migration** using one of the options above
2. **Run verification**: `node scripts/verify-migration-051.mjs`
3. **Confirm all checks pass**
4. **Mark task 12.1 as complete**
5. **Proceed to task 12.2**: Run guest auth_method fix script

## Files Created/Modified

- ✅ `scripts/apply-migration-051.mjs` - Migration application script
- ✅ `scripts/verify-migration-051.mjs` - Migration verification script
- ✅ `MIGRATION_051_STATUS.md` - This status report
- ✅ `supabase/migrations/051_add_default_auth_method.sql` - Migration SQL (already existed)

## Testing After Migration

Once the migration is complete, verify:

1. **Column exists**: Query `system_settings` table and see `default_auth_method` column
2. **Constraint works**: Try inserting invalid value (should fail)
3. **Setting accessible**: API can read/write the setting
4. **Indexes created**: RSVP queries should be faster

## Related Tasks

- **Task 12.2**: Run guest auth_method fix script (depends on this)
- **Task 5.x**: Auth method configuration (uses this setting)
- **Task 7.x**: RSVP management (uses the indexes)

---

**Note**: This is a standard limitation when working with managed databases. Schema changes always require elevated privileges that are not exposed through application-level APIs for security reasons.
