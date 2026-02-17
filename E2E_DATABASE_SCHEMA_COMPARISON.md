# E2E Database Schema Comparison Results

## Comparison Date
February 5, 2026

## Databases Compared
- **Production**: `bwthjirvpdypmbvpsjtl` (destination-wedding-platform)
- **Test**: `olcqaawrpnanioaorfer` (wedding-platform-test)

## Schema Differences Found

### 1. locations Table - Missing `type` Column ❌

**Production** has:
```sql
type TEXT NULL CHECK (type IS NULL OR type = ANY (ARRAY['country', 'region', 'city', 'venue', 'accommodation']))
COMMENT 'Type of location in the hierarchy: country, region, city, venue, or accommodation'
```

**Test** is missing this column entirely.

**Impact**: 
- Tests work (workaround in global-setup.ts handles it)
- Schema mismatch could hide bugs
- RLS policies might behave differently

### 2. sections Table - Missing `title` Column ❌

**Test** has:
```sql
title TEXT NULL COMMENT 'Optional title for the section, displayed above the content'
```

**Production** is missing this column.

**Impact**: 
- Test database has a newer feature
- Production needs to be updated OR test needs to be rolled back

### 3. accommodations Table - Missing `slug` Column Comment ❌

**Production** has:
```sql
slug TEXT UNIQUE COMMENT 'URL-safe slug generated from accommodation name, used for friendly URLs'
```

**Test** has:
```sql
slug TEXT UNIQUE (no comment)
```

**Impact**: Minor - just documentation difference

### 4. groups Table - Different Comment ❌

**Production**:
```
COMMENT 'Guest groups table - RLS policies updated in migration 20260130230944 to allow all authenticated users access'
```

**Test**:
```
COMMENT 'Guest groups (families) for multi-owner coordination'
```

**Impact**: Documentation only - no functional difference

### 5. admin_users Table - Missing in Production ❌

**Test** has `admin_users` table with columns:
- id, email, role, status, invited_by, invited_at, last_login_at, created_at, updated_at

**Production** is missing this table entirely.

**Impact**: 
- Test database has admin user management feature
- Production needs this table added

### 6. magic_link_tokens Table - Missing in Production ❌

**Test** has `magic_link_tokens` table for magic link authentication.

**Production** is missing this table entirely.

**Impact**:
- Test database has magic link auth feature
- Production needs this table added

### 7. guest_sessions Table - Missing in Production ❌

**Test** has `guest_sessions` table for guest session management.

**Production** is missing this table entirely.

**Impact**:
- Test database has guest session feature
- Production needs this table added

### 8. email_history Table - Missing in Production ❌

**Test** has `email_history` table for email tracking.

**Production** is missing this table entirely.

**Impact**:
- Test database has email history feature
- Production needs this table added

### 9. vendor_bookings Table - Extra Columns in Test ✅

**Test** has additional columns:
- `guest_count` INTEGER NULL CHECK (guest_count IS NULL OR guest_count >= 0)
- `pricing_model` TEXT DEFAULT 'flat_rate' CHECK (pricing_model = ANY (ARRAY['flat_rate', 'per_guest']))
- `total_cost` NUMERIC DEFAULT 0 CHECK (total_cost >= 0)
- `host_subsidy` NUMERIC DEFAULT 0
- `base_cost` NUMERIC NULL

**Production** is missing these columns.

**Impact**:
- Test database has enhanced vendor booking features
- Production needs these columns added

## Summary

### Critical Differences (Require Migration)

1. **Test Missing** (need to add to test):
   - `locations.type` column

2. **Production Missing** (need to add to production):
   - `admin_users` table
   - `magic_link_tokens` table
   - `guest_sessions` table
   - `email_history` table
   - `sections.title` column
   - `vendor_bookings` enhanced columns

### Minor Differences (Documentation Only)
- Table comments
- Column comments

## Recommendation

**Two-Phase Approach:**

### Phase 1: Align Test Database (Immediate)
Add missing `locations.type` column to test database so E2E tests run against production-like schema.

### Phase 2: Align Production Database (Later)
Add missing tables and columns from test database to production. These appear to be newer features that were developed against the test database but not yet deployed to production.

## Next Steps

1. ✅ Apply `locations.type` migration to test database
2. ✅ Verify E2E tests pass
3. ⏳ Plan production migration for missing tables/columns
4. ⏳ Update migration history to keep databases in sync

## Migration Files Needed

### For Test Database (Immediate)
- `add_locations_type_column.sql` - Add type column to locations table

### For Production Database (Later)
- `add_admin_users_table.sql` - Add admin user management
- `add_magic_link_tokens_table.sql` - Add magic link authentication
- `add_guest_sessions_table.sql` - Add guest session tracking
- `add_email_history_table.sql` - Add email history tracking
- `add_sections_title_column.sql` - Add optional section titles
- `enhance_vendor_bookings.sql` - Add pricing and cost tracking columns

---

**Status**: Schema comparison complete. Ready to apply alignment migration to test database.
