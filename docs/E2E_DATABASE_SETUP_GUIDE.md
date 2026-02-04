# E2E Test Database Setup Guide

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Status:** ✅ Complete and Verified

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Migration Application](#migration-application)
5. [RLS Policy Configuration](#rls-policy-configuration)
6. [Test Data Isolation](#test-data-isolation)
7. [Verification Steps](#verification-steps)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)
10. [Reference](#reference)

---

## Overview

This guide provides step-by-step instructions for setting up a dedicated E2E test database for the Costa Rica Wedding Management System. The test database is completely isolated from production and configured for safe, parallel test execution.

### Why a Separate Test Database?

- **Safety:** Zero risk of test data contaminating production
- **Realism:** Test against actual database operations, not mocks
- **Parallelization:** Run tests concurrently without conflicts
- **Cleanup:** Easy to reset and clean test data
- **RLS Testing:** Verify Row-Level Security policies work correctly

### Current Test Database

- **URL:** `https://olcqaawrpnanioaorfer.supabase.co`
- **Type:** Dedicated Supabase project for testing
- **Status:** ✅ Fully configured and operational
- **Migrations:** 50/50 applied successfully
- **RLS Policies:** Active and verified

---

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Supabase Account**
   - Access to Supabase dashboard
   - Ability to create new projects
   - Admin access to project settings

4. **Git** (for cloning repository)
   ```bash
   git --version
   ```

### Required Access

- Supabase organization admin access
- Ability to create new Supabase projects
- Access to project API keys
- Permission to run SQL migrations

### Required Knowledge

- Basic SQL understanding
- Familiarity with environment variables
- Understanding of Row-Level Security (RLS) concepts
- Basic command line usage

---

## Initial Setup

### Step 1: Create New Supabase Project

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Sign in with your account

2. **Create New Project**
   - Click "New Project"
   - **Organization:** Select your organization
   - **Name:** `wedding-e2e-test` (or similar descriptive name)
   - **Database Password:** Generate strong password (save securely)
   - **Region:** Choose closest region to your team
   - **Pricing Plan:** Free tier is sufficient for testing
   - Click "Create new project"

3. **Wait for Project Creation**
   - Takes 2-3 minutes
   - Status will show "Setting up project..."
   - Wait until status shows "Active"

### Step 2: Retrieve API Keys

1. **Navigate to Project Settings**
   - Click on your project
   - Go to Settings → API

2. **Copy Required Keys**
   - **Project URL:** `https://[project-ref].supabase.co`
   - **Anon/Public Key:** `eyJhbGciOiJIUzI1NiIs...` (long JWT token)
   - **Service Role Key:** `eyJhbGciOiJIUzI1NiIs...` (different JWT token)

3. **Security Note**
   - ⚠️ **Never commit service role key to git**
   - Store keys in `.env.e2e` (gitignored)
   - Service role key bypasses RLS - use carefully

### Step 3: Configure Environment Files

1. **Create `.env.e2e` File**
   ```bash
   # In project root directory
   touch .env.e2e
   ```

2. **Add Database Configuration**
   ```bash
   # E2E Test Database Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

   # Mock External Services (prevents actual API calls)
   TWILIO_ACCOUNT_SID=test-twilio-account-sid
   TWILIO_AUTH_TOKEN=test-twilio-auth-token
   TWILIO_PHONE_NUMBER=+15555555555
   RESEND_API_KEY=test-resend-api-key
   B2_ACCESS_KEY_ID=test-b2-access-key-id
   B2_SECRET_ACCESS_KEY=test-b2-secret-access-key
   B2_BUCKET_NAME=test-bucket
   B2_BUCKET_ID=test-bucket-id
   B2_REGION=us-west-002
   B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
   GEMINI_API_KEY=test-gemini-api-key
   ```

3. **Verify File is Gitignored**
   ```bash
   # Check .gitignore includes .env.e2e
   grep ".env.e2e" .gitignore
   # Should output: .env.e2e
   ```

### Step 4: Verify Database Connection

1. **Run Connection Test Script**
   ```bash
   node scripts/test-e2e-database-connection.mjs
   ```

2. **Expected Output**
   ```
   ✅ Test 1: Basic Connection - PASSED
   ✅ Test 2: Table Structure Verification - PASSED
   ✅ Test 3: Basic CRUD Operations - PASSED
   ✅ Test 4: RLS Policy Verification - PASSED
   
   All tests passed! ✅
   ```

3. **If Tests Fail**
   - Verify API keys are correct
   - Check database URL format
   - Ensure project is "Active" in Supabase dashboard
   - See [Troubleshooting](#troubleshooting) section

---

## Migration Application

### Overview

Migrations create the database schema (tables, columns, indexes, RLS policies). All 50 migrations must be applied for full functionality.

### Step 1: Verify Migration Files

1. **Check Migration Directory**
   ```bash
   ls -la supabase/migrations/
   ```

2. **Expected Files** (50 total)
   ```
   001_create_core_tables.sql
   002_create_rls_policies.sql
   003_create_vendor_tables.sql
   ...
   050_create_system_settings_table.sql
   ```

3. **Verify File Count**
   ```bash
   ls supabase/migrations/*.sql | wc -l
   # Should output: 50
   ```

### Step 2: Apply Migrations via Supabase Dashboard

**Method 1: SQL Editor (Recommended for Initial Setup)**

1. **Open SQL Editor**
   - Go to Supabase Dashboard
   - Select your E2E test project
   - Click "SQL Editor" in left sidebar

2. **Apply Each Migration**
   - Open first migration file: `supabase/migrations/001_create_core_tables.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message
   - Repeat for all 50 migrations **in order**

3. **Track Progress**
   - Keep a checklist of applied migrations
   - Note any errors immediately
   - Don't skip migrations (dependencies exist)

**Method 2: Supabase CLI (Advanced)**

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link to Project**
   ```bash
   supabase link --project-ref [your-project-ref]
   ```

3. **Apply Migrations**
   ```bash
   supabase db push
   ```

4. **Verify Success**
   ```bash
   supabase db diff
   # Should show no differences
   ```

### Step 3: Verify Migrations Applied

1. **Run Verification Script**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

2. **Expected Output**
   ```
   ✅ Migration 001_create_core_tables.sql - VERIFIED
   ✅ Migration 002_create_rls_policies.sql - VERIFIED
   ...
   ✅ Migration 050_create_system_settings_table.sql - VERIFIED
   
   All 50 migrations verified! ✅
   ```

3. **If Migrations Missing**
   - Script will list missing components
   - Apply missing migrations individually
   - Re-run verification script
   - See [Troubleshooting](#troubleshooting) for common issues

### Step 4: Verify Table Structure

1. **Check Core Tables Exist**
   ```bash
   node scripts/test-e2e-database-connection.mjs
   ```

2. **Expected Tables** (19 core tables)
   - `users`
   - `groups`
   - `guests`
   - `events`
   - `activities`
   - `rsvps`
   - `accommodations`
   - `room_types`
   - `room_assignments`
   - `photos`
   - `content_pages`
   - `sections`
   - `columns`
   - `locations`
   - `vendor_bookings`
   - `email_logs`
   - `gallery_settings`
   - `system_settings`
   - `magic_link_tokens`

3. **Verify Column Structure**
   - Script checks for expected columns
   - Reports any missing columns
   - Validates data types

---

## RLS Policy Configuration

### Overview

Row-Level Security (RLS) policies control who can access what data. Proper RLS configuration is critical for security testing.

### Step 1: Verify RLS Policies Exist

1. **Run RLS Test Script**
   ```bash
   node scripts/test-e2e-rls-basic.mjs
   ```

2. **Expected Output**
   ```
   ✅ Unauthenticated access blocked for: groups
   ✅ Unauthenticated access blocked for: guests
   ✅ Unauthenticated access blocked for: events
   ...
   ✅ Service role can access: guests
   ✅ Service role can access: events
   ...
   
   RLS policies working correctly! ✅
   ```

### Step 2: Test RLS Policy Enforcement

1. **Test Unauthenticated Access**
   - Should be blocked or return empty results
   - Confirms RLS is active

2. **Test Service Role Access**
   - Should bypass RLS
   - Can access all data
   - Used for test setup/cleanup

3. **Test Authenticated User Access**
   - Should see only their own data
   - Respects group ownership
   - Enforces permission boundaries

### Step 3: Fix Common RLS Issues

**Issue: "permission denied for table users"**

This occurs when RLS policies reference the `users` table incorrectly.

**Solution:**
```bash
# Run fix script
node scripts/fix-sections-rls.mjs
```

**Manual Fix:**
```sql
-- Check current policy
SELECT * FROM pg_policies WHERE tablename = 'sections';

-- Drop problematic policy
DROP POLICY IF EXISTS "sections_policy" ON sections;

-- Create corrected policy
CREATE POLICY "sections_policy" ON sections
  FOR ALL
  USING (true);  -- Adjust based on your requirements
```

### Step 4: Verify RLS with Integration Tests

1. **Run RLS Integration Tests**
   ```bash
   npm test __tests__/integration/rlsPolicies.integration.test.ts
   ```

2. **Expected Result**
   - All tests pass
   - No permission errors
   - Proper access control verified

---

## Test Data Isolation

### Overview

Test data isolation ensures test operations never affect production data. This is achieved through separate database instances and environment configuration.

### Step 1: Verify Database Separation

1. **Run Isolation Verification Script**
   ```bash
   node scripts/verify-test-data-isolation.mjs
   ```

2. **Expected Output**
   ```
   ✅ Test 1: Different Database URLs - PASSED
   ✅ Test 2: Different Authentication Keys - PASSED
   ✅ Test 3: Test Database Connectivity - PASSED
   ✅ Test 4: Data Operation Isolation - PASSED
   ✅ Test 5: Cleanup Operation Isolation - PASSED
   
   All isolation tests passed! ✅
   ```

### Step 2: Verify Environment Separation

1. **Check Environment Files**
   ```bash
   # Production
   grep "SUPABASE_URL" .env.local
   # Should show: bwthjirvpdypmbvpsjtl.supabase.co
   
   # Test
   grep "SUPABASE_URL" .env.e2e
   # Should show: olcqaawrpnanioaorfer.supabase.co (different!)
   ```

2. **Verify Keys are Different**
   ```bash
   # Production anon key
   grep "ANON_KEY" .env.local
   
   # Test anon key
   grep "ANON_KEY" .env.e2e
   
   # Should be completely different values
   ```

### Step 3: Test Data Lifecycle

1. **Create Test Data**
   ```bash
   # Test data is created in test database only
   npm test
   ```

2. **Verify Isolation**
   - Test data appears in test database
   - Production database unchanged
   - No cross-contamination

3. **Cleanup Test Data**
   ```bash
   # Cleanup happens automatically after tests
   # Or manually:
   node scripts/cleanup-test-data.mjs
   ```

### Step 4: Verify Mock External Services

1. **Check Mock Configuration**
   ```bash
   grep "TWILIO" .env.e2e
   # Should show: test-twilio-account-sid
   
   grep "RESEND" .env.e2e
   # Should show: test-resend-api-key
   ```

2. **Verify No Real API Calls**
   - Mock credentials prevent actual API calls
   - No charges incurred during tests
   - Safe for parallel test execution

---

## Verification Steps

### Complete Setup Verification Checklist

Run these steps to verify your E2E test database is fully configured:

#### 1. Database Connection ✅
```bash
node scripts/test-e2e-database-connection.mjs
```
**Expected:** All 4 tests pass

#### 2. Migrations Applied ✅
```bash
node scripts/verify-e2e-migrations.mjs
```
**Expected:** All 50 migrations verified

#### 3. RLS Policies Working ✅
```bash
node scripts/test-e2e-rls-basic.mjs
```
**Expected:** All RLS tests pass

#### 4. Test Data Isolation ✅
```bash
node scripts/verify-test-data-isolation.mjs
```
**Expected:** All 5 isolation tests pass

#### 5. Integration Tests Pass ✅
```bash
npm test __tests__/integration/
```
**Expected:** All integration tests pass

#### 6. E2E Tests Pass ✅
```bash
npm run test:e2e
```
**Expected:** All E2E tests pass

### Verification Summary

If all 6 verification steps pass, your E2E test database is **fully configured and ready for use**.

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Connection Timeout

**Symptoms:**
```
Error: Connection timeout
Could not connect to database
```

**Causes:**
- Database URL incorrect
- Project not active
- Network issues

**Solutions:**
1. Verify database URL in `.env.e2e`
2. Check project status in Supabase dashboard
3. Ensure project is "Active" (not "Paused")
4. Try accessing database via Supabase dashboard
5. Check firewall/network settings

#### Issue 2: Authentication Failed

**Symptoms:**
```
Error: Invalid API key
Authentication failed
```

**Causes:**
- Wrong API keys
- Keys from different project
- Keys expired or regenerated

**Solutions:**
1. Re-copy API keys from Supabase dashboard
2. Verify keys match the E2E test project
3. Check for extra spaces or line breaks in keys
4. Ensure using anon key (not service role) for public operations
5. Regenerate keys if necessary (Settings → API → Reset)

#### Issue 3: Table Not Found

**Symptoms:**
```
Error: relation "table_name" does not exist
Could not find table
```

**Causes:**
- Migrations not applied
- Wrong migration order
- Migration failed silently

**Solutions:**
1. Run migration verification script
2. Check which migrations are missing
3. Apply missing migrations in order
4. Verify migration SQL syntax
5. Check Supabase logs for errors

#### Issue 4: Permission Denied

**Symptoms:**
```
Error: permission denied for table users
RLS policy error
```

**Causes:**
- RLS policy references non-existent table
- RLS policy has incorrect logic
- Using anon key instead of service role

**Solutions:**
1. Run RLS fix script: `node scripts/fix-sections-rls.mjs`
2. Check RLS policies in Supabase dashboard
3. Use service role key for test setup
4. Review RLS policy SQL
5. See [RLS Policy Configuration](#rls-policy-configuration)

#### Issue 5: Migration Already Applied

**Symptoms:**
```
Error: relation already exists
Duplicate key value violates unique constraint
```

**Causes:**
- Migration applied multiple times
- Manual schema changes conflict with migration

**Solutions:**
1. Check which migrations are already applied
2. Skip already-applied migrations
3. Use `IF NOT EXISTS` clauses in migrations
4. Reset database if necessary (see below)

#### Issue 6: Test Data Contamination

**Symptoms:**
- Production data appears in tests
- Test data appears in production
- Unexpected data in database

**Causes:**
- Wrong environment file loaded
- Environment variables mixed up
- Using production keys in tests

**Solutions:**
1. Run isolation verification script
2. Verify environment file separation
3. Check which database URL is being used
4. Ensure `.env.e2e` is loaded for tests
5. Never use production keys in test environment

### Resetting the Test Database

If the database gets into a bad state, you can reset it:

**Option 1: Reset via Supabase Dashboard**
1. Go to Database → Settings
2. Click "Reset Database"
3. Confirm reset
4. Re-apply all migrations

**Option 2: Create New Project**
1. Create new Supabase project
2. Update `.env.e2e` with new keys
3. Apply all migrations
4. Run verification scripts

**Option 3: Manual Cleanup**
```sql
-- Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-apply all migrations
```

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   - Supabase Dashboard → Logs
   - Look for error messages
   - Note timestamps of failures

2. **Review Documentation**
   - [Task 3.1: Database Connection](./TASK_3_1_DATABASE_CONNECTION_TEST_RESULTS.md)
   - [Task 3.2: Migration Verification](./TASK_3_2_MIGRATION_VERIFICATION_RESULTS.md)
   - [Task 3.3: RLS Policy Testing](./TASK_3_3_RLS_POLICY_TEST_RESULTS.md)
   - [Task 3.4: Test Data Isolation](./TASK_3_4_TEST_DATA_ISOLATION_VERIFICATION.md)

3. **Run Diagnostic Scripts**
   ```bash
   node scripts/test-e2e-database-connection.mjs
   node scripts/verify-e2e-migrations.mjs
   node scripts/test-e2e-rls-basic.mjs
   node scripts/verify-test-data-isolation.mjs
   ```

4. **Contact Team**
   - Share error messages
   - Include script output
   - Describe steps taken

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks

1. **Verify Database Health**
   ```bash
   node scripts/test-e2e-database-connection.mjs
   ```

2. **Check Test Data Cleanup**
   ```bash
   # Verify no stale test data
   node scripts/cleanup-test-data.mjs
   ```

3. **Monitor Database Size**
   - Check Supabase dashboard
   - Ensure within free tier limits
   - Clean up old test data if needed

#### Monthly Tasks

1. **Verify All Migrations**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

2. **Test RLS Policies**
   ```bash
   node scripts/test-e2e-rls-basic.mjs
   ```

3. **Verify Isolation**
   ```bash
   node scripts/verify-test-data-isolation.mjs
   ```

4. **Review API Keys**
   - Check keys haven't been exposed
   - Rotate keys if necessary
   - Update `.env.e2e` if rotated

#### Quarterly Tasks

1. **Full Database Audit**
   - Review all tables
   - Check for unused data
   - Optimize indexes
   - Review RLS policies

2. **Migration Review**
   - Ensure all migrations documented
   - Check for migration conflicts
   - Update migration documentation

3. **Security Review**
   - Audit RLS policies
   - Review access controls
   - Check for security vulnerabilities
   - Update security documentation

### Applying New Migrations

When new migrations are added to the project:

1. **Review Migration**
   ```bash
   # Check new migration file
   cat supabase/migrations/051_new_migration.sql
   ```

2. **Apply to Test Database**
   - Copy migration SQL
   - Paste into Supabase SQL Editor
   - Run migration
   - Verify success

3. **Verify Migration**
   ```bash
   node scripts/verify-e2e-migrations.mjs
   ```

4. **Test Functionality**
   ```bash
   npm test
   npm run test:e2e
   ```

5. **Document Changes**
   - Update migration documentation
   - Note any breaking changes
   - Update this guide if needed

### Database Backup

**Automated Backups:**
- Supabase provides automatic daily backups
- Backups retained for 7 days (free tier)
- Access via Dashboard → Database → Backups

**Manual Backup:**
```bash
# Export database schema
pg_dump -h db.olcqaawrpnanioaorfer.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  > backup_schema.sql

# Export data
pg_dump -h db.olcqaawrpnanioaorfer.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  > backup_data.sql
```

### Database Restore

**From Supabase Backup:**
1. Go to Dashboard → Database → Backups
2. Select backup to restore
3. Click "Restore"
4. Confirm restoration

**From Manual Backup:**
```bash
# Restore schema
psql -h db.olcqaawrpnanioaorfer.supabase.co \
  -U postgres \
  -d postgres \
  < backup_schema.sql

# Restore data
psql -h db.olcqaawrpnanioaorfer.supabase.co \
  -U postgres \
  -d postgres \
  < backup_data.sql
```

### Monitoring

**Key Metrics to Monitor:**

1. **Database Size**
   - Check Supabase dashboard
   - Alert if approaching limits
   - Clean up test data regularly

2. **Query Performance**
   - Monitor slow queries
   - Check for missing indexes
   - Optimize as needed

3. **RLS Policy Performance**
   - Monitor policy execution time
   - Optimize complex policies
   - Review policy logic

4. **Test Execution Time**
   - Track test suite duration
   - Identify slow tests
   - Optimize database queries

**Monitoring Tools:**
- Supabase Dashboard → Database → Performance
- Supabase Dashboard → Logs
- Custom monitoring scripts

---

## Reference

### Environment Variables

#### Required Variables (.env.e2e)
```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Mock External Services
TWILIO_ACCOUNT_SID=test-twilio-account-sid
TWILIO_AUTH_TOKEN=test-twilio-auth-token
TWILIO_PHONE_NUMBER=+15555555555
RESEND_API_KEY=test-resend-api-key
B2_ACCESS_KEY_ID=test-b2-access-key-id
B2_SECRET_ACCESS_KEY=test-b2-secret-access-key
B2_BUCKET_NAME=test-bucket
B2_BUCKET_ID=test-bucket-id
B2_REGION=us-west-002
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
GEMINI_API_KEY=test-gemini-api-key
```

### Verification Scripts

| Script | Purpose | Expected Result |
|--------|---------|-----------------|
| `test-e2e-database-connection.mjs` | Test database connectivity | All 4 tests pass |
| `verify-e2e-migrations.mjs` | Verify migrations applied | All 50 migrations verified |
| `test-e2e-rls-basic.mjs` | Test RLS policies | All RLS tests pass |
| `verify-test-data-isolation.mjs` | Verify data isolation | All 5 isolation tests pass |

### Migration Files

**Total Migrations:** 50

**Key Migrations:**
- `001_create_core_tables.sql` - Core database schema
- `002_create_rls_policies.sql` - Security policies
- `037_create_magic_link_tokens_table.sql` - Authentication
- `048_add_soft_delete_columns.sql` - Soft delete support
- `050_create_system_settings_table.sql` - System configuration

**Full List:** See `supabase/migrations/` directory

### Database Tables

**Core Tables (19):**
- `users` - User accounts
- `groups` - Guest groups
- `guests` - Wedding guests
- `events` - Wedding events
- `activities` - Event activities
- `rsvps` - RSVP responses
- `accommodations` - Lodging options
- `room_types` - Room configurations
- `room_assignments` - Guest room assignments
- `photos` - Photo gallery
- `content_pages` - CMS pages
- `sections` - Page sections
- `columns` - Section columns
- `locations` - Location hierarchy
- `vendor_bookings` - Vendor contracts
- `email_logs` - Email tracking
- `gallery_settings` - Photo gallery config
- `system_settings` - System configuration
- `magic_link_tokens` - Authentication tokens

### Useful SQL Queries

**Check Table Existence:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Check Column Structure:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests'
ORDER BY ordinal_position;
```

**Check RLS Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

**Check Table Sizes:**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Related Documentation

- [Task 3.1: Database Connection Test Results](./TASK_3_1_DATABASE_CONNECTION_TEST_RESULTS.md)
- [Task 3.2: Migration Verification Results](./TASK_3_2_MIGRATION_VERIFICATION_RESULTS.md)
- [Task 3.3: RLS Policy Test Results](./TASK_3_3_RLS_POLICY_TEST_RESULTS.md)
- [Task 3.4: Test Data Isolation Verification](./TASK_3_4_TEST_DATA_ISOLATION_VERIFICATION.md)
- [E2E Environment Setup](./E2E_ENVIRONMENT_SETUP.md)
- [Testing Standards](../.kiro/steering/testing-standards.md)

### Support Resources

**Supabase Documentation:**
- [Getting Started](https://supabase.com/docs/guides/getting-started)
- [Database](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

**Project Documentation:**
- [Testing Standards](../.kiro/steering/testing-standards.md)
- [Testing Patterns](../.kiro/steering/testing-patterns.md)
- [Developer Documentation](./DEVELOPER_DOCUMENTATION.md)

---

## Quick Start Checklist

For new team members setting up E2E test database:

- [ ] Create new Supabase project
- [ ] Copy API keys to `.env.e2e`
- [ ] Run connection test: `node scripts/test-e2e-database-connection.mjs`
- [ ] Apply all 50 migrations via SQL Editor
- [ ] Verify migrations: `node scripts/verify-e2e-migrations.mjs`
- [ ] Test RLS policies: `node scripts/test-e2e-rls-basic.mjs`
- [ ] Verify isolation: `node scripts/verify-test-data-isolation.mjs`
- [ ] Run integration tests: `npm test __tests__/integration/`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Confirm all tests pass ✅

**Estimated Setup Time:** 30-45 minutes

---

**Document Version:** 1.0  
**Last Updated:** February 4, 2026  
**Maintained By:** Development Team  
**Review Schedule:** Quarterly
