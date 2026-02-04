# Task 10 Phase 1: Apply E2E Database Migrations

**Status**: READY TO EXECUTE  
**Estimated Time**: 5 minutes  
**Expected Impact**: Fix 40-50 failing tests

## Overview

The E2E test database is missing critical tables from migrations 034-051. These tables are required for:
- Admin user management (`admin_users`)
- Guest authentication (`guest_sessions`, `magic_link_tokens`)
- Email tracking (`email_history`)
- Soft delete functionality
- Slug-based routing

## Missing Tables

1. **admin_users** - Admin user management and roles
2. **guest_sessions** - Guest authentication sessions
3. **magic_link_tokens** - Passwordless authentication tokens
4. **email_history** - Email delivery tracking (if not exists)

## Migration File

All required migrations have been combined into a single file:
```
supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql
```

## Application Methods

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
   - Click "New Query"

2. **Copy Migration SQL**
   ```bash
   # From project root
   cat supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql | pbcopy
   ```
   Or manually open the file and copy all content

3. **Paste and Execute**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for completion (should take 10-30 seconds)

4. **Verify Success**
   - Check for green success message
   - No red error messages should appear

### Method 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to E2E project
supabase link --project-ref olcqaawrpnanioaorfer

# Push migrations
supabase db push
```

### Method 3: PostgreSQL Client

```bash
# Using psql (requires connection string)
psql "postgresql://postgres:[PASSWORD]@db.olcqaawrpnanioaorfer.supabase.co:5432/postgres" \
  -f supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS.sql
```

## Verification

After applying migrations, verify tables were created:

```bash
node scripts/verify-e2e-migrations.mjs
```

Expected output:
```
✅ Table 'admin_users' exists
✅ Table 'guest_sessions' exists
✅ Table 'magic_link_tokens' exists
✅ Table 'email_history' exists
```

## Test Impact

### Tests That Will Be Fixed

1. **Email Management** (10 tests)
   - All tests currently failing with "Cannot read properties of null (reading 'id')"
   - Requires `email_history` table

2. **Reference Blocks** (3 tests)
   - Failing due to missing entity references
   - Requires proper slug columns

3. **User Management** (5+ tests)
   - Requires `admin_users` table
   - Requires `guest_sessions` table

4. **Guest Groups** (8+ tests)
   - Requires `guest_sessions` for authentication
   - Requires `magic_link_tokens` for magic link auth

5. **Guest Authentication** (10+ tests)
   - Requires `magic_link_tokens` table
   - Requires `guest_sessions` table

### Expected Results After Migration

- **Before**: 193 passing (53.8%)
- **After**: ~238 passing (66.3%)
- **Improvement**: +45 tests (+12.5%)

## Troubleshooting

### Error: "relation already exists"
- **Cause**: Migration already partially applied
- **Solution**: Safe to ignore, migration uses `IF NOT EXISTS`

### Error: "column already exists"
- **Cause**: Column already added
- **Solution**: Safe to ignore, migration uses `IF NOT EXISTS`

### Error: "permission denied"
- **Cause**: Not using service role key
- **Solution**: Ensure you're logged in as project owner in Dashboard

### Error: "syntax error"
- **Cause**: SQL not copied completely
- **Solution**: Re-copy entire migration file

## Post-Migration Steps

1. **Verify Migrations**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

2. **Run Affected Test Suites**
   ```bash
   # Email management tests
   npx playwright test __tests__/e2e/admin/emailManagement.spec.ts
   
   # Reference blocks tests
   npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts
   
   # User management tests
   npx playwright test __tests__/e2e/admin/userManagement.spec.ts
   
   # Guest groups tests
   npx playwright test __tests__/e2e/guest/guestGroups.spec.ts
   ```

3. **Document Results**
   - Record new pass/fail counts
   - Identify remaining failures
   - Update Task 10 progress

## Success Criteria

✅ All migrations applied without errors  
✅ All 4 critical tables exist in database  
✅ Verification script passes  
✅ At least 40 additional tests passing  
✅ No new test failures introduced

## Next Phase

After Phase 1 completion, proceed to:
- **Phase 2**: UI Selector Updates (30-40 test fixes)
- **Phase 6**: Guest Portal Fixes (10-15 test fixes)

---

**Ready to Execute**: Yes  
**Blocking Issues**: None  
**Estimated Duration**: 5 minutes
