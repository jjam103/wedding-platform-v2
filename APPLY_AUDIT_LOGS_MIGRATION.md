# Apply Audit Logs Migration

## Quick Start

The E2E guest authentication tests require an `action` column in the `audit_logs` table. This column needs to be added manually via the Supabase Dashboard.

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute SQL**
   ```sql
   -- Add action column to audit_logs table
   ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);

   -- Add indexes for performance
   CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
   CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs(entity_id, action);

   -- Add comment for documentation
   COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., guest_login, guest_logout, admin_login)';
   ```

4. **Click "Run"**

5. **Verify Success**
   - You should see "Success. No rows returned"
   - The column is now added!

### Option 2: psql Command Line

If you have direct database access:

```bash
# Using E2E database
psql $E2E_DATABASE_URL < scripts/add-audit-logs-action.sql

# Or using production database (be careful!)
psql $DATABASE_URL < scripts/add-audit-logs-action.sql
```

### Option 3: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Apply migration
npx supabase db push
```

## Verification

After applying the migration, verify it worked:

### Using Supabase Dashboard

1. Go to "Table Editor"
2. Select "audit_logs" table
3. Check that "action" column exists

### Using SQL

Run this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND column_name = 'action';
```

You should see:
```
column_name | data_type
------------+-----------
action      | character varying
```

## What This Migration Does

### Adds `action` Column
- **Type**: VARCHAR(50)
- **Purpose**: Stores the type of action performed (e.g., `guest_login`, `guest_logout`, `admin_login`)
- **Nullable**: Yes (for backward compatibility with existing records)

### Adds Indexes
1. **idx_audit_logs_action**: Single-column index on `action` for fast filtering
2. **idx_audit_logs_entity_action**: Composite index on `(entity_id, action)` for common query patterns

### Use Cases
- Track guest login events
- Track guest logout events
- Monitor authentication patterns
- Security auditing
- Compliance reporting

## After Migration

Once the migration is applied, you can run the E2E tests:

```bash
# Run all guest auth tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Run specific test
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --grep "should log authentication events"
```

## Troubleshooting

### Error: "column already exists"
This is fine! The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### Error: "permission denied"
You need to use the service role key or have admin access to the database.

### Error: "relation audit_logs does not exist"
The audit_logs table hasn't been created yet. Make sure you've run all previous migrations first.

## Related Files

- `supabase/migrations/053_add_audit_logs_action_column.sql` - Full migration file
- `scripts/add-audit-logs-action.sql` - Standalone SQL for manual application
- `E2E_GUEST_AUTH_FIXES_COMPLETE.md` - Complete documentation of all fixes

## Need Help?

If you encounter issues:
1. Check that you're using the correct database (E2E vs Production)
2. Verify you have admin/service role access
3. Check Supabase logs for detailed error messages
4. Ensure all previous migrations have been applied
