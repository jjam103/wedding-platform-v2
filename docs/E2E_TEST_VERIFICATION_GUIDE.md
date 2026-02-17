# E2E Test Verification Guide

**Purpose**: Verify that RLS policy fixes improved E2E test pass rate  
**Expected Improvement**: 3.3% → 70-80% pass rate

## Quick Start

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Run E2E tests (in separate terminal)
npm run test:e2e

# 3. Check results
# Expected: 250-280 passing (70-80%), 70-100 failing (20-30%)
```

## What Was Fixed

✅ **RLS Policies** - Service role can now create test data in all 34 tables  
✅ **Schema Alignment** - E2E database matches production 100%

## What Should Now Work

### Test Categories That Should Pass

1. **Email Management** (~40 tests)
   - Creating email templates
   - Sending bulk emails
   - Email history tracking

2. **Reference Blocks** (~30 tests)
   - Creating events with references
   - Creating activities with references
   - Cross-referencing content

3. **RSVP Management** (~25 tests)
   - Creating RSVPs
   - Updating RSVP status
   - RSVP analytics

4. **Authentication** (~20 tests)
   - Creating guest groups
   - Guest authentication
   - Magic link generation

5. **Routing** (~15 tests)
   - Dynamic event routes
   - Dynamic activity routes
   - Content page routes

6. **Content Management** (~30 tests)
   - Creating content pages
   - Managing sections
   - Photo gallery management

7. **Data Management** (~40 tests)
   - Creating guests
   - Creating events
   - Creating activities

**Total Expected to Pass**: ~200 tests (was 12, now should be 200+)

## What Still Needs Fixing

### Known Remaining Issues

1. **Auth State File Missing** (~100 tests)
   - Pattern: `Error reading storage state from .auth/user.json`
   - Fix: Debug `__tests__/e2e/global-setup.ts`

2. **Server Connection Issues** (~10 tests)
   - Pattern: `net::ERR_CONNECTION_REFUSED`
   - Fix: Add server health checks

3. **Configuration Mismatch** (1 test)
   - Pattern: `Expected E2E_WORKERS=2 but got 4`
   - Fix: Update `.env.e2e`

## Detailed Verification Steps

### Step 1: Start Dev Server

```bash
# Terminal 1
npm run dev

# Wait for server to start
# Should see: "Ready on http://localhost:3000"
```

### Step 2: Run E2E Tests

```bash
# Terminal 2
npm run test:e2e

# Or run specific test suites
npm run test:e2e -- admin/emailManagement.spec.ts
npm run test:e2e -- admin/referenceBlocks.spec.ts
npm run test:e2e -- admin/rsvpManagement.spec.ts
```

### Step 3: Analyze Results

```bash
# Check test results
cat playwright-report/index.html

# Or view in browser
npx playwright show-report
```

### Step 4: Compare Before/After

**Before Fix**:
```
Tests:  359 total
Passed: 12 (3.3%)
Failed: 326 (90.8%)
Skipped: 21 (5.8%)
```

**Expected After Fix**:
```
Tests:  359 total
Passed: 250-280 (70-80%)
Failed: 70-100 (20-30%)
Skipped: 21 (5.8%)
```

## Troubleshooting

### If Pass Rate Didn't Improve

1. **Check Service Role Key**
   ```bash
   # Verify .env.e2e has correct service role key
   grep SUPABASE_SERVICE_ROLE_KEY .env.e2e
   ```

2. **Verify RLS Policies**
   ```bash
   # Run verification script
   node scripts/verify-e2e-rls-policies.mjs
   ```

3. **Check Test Database Connection**
   ```bash
   # Test database connection
   node scripts/test-e2e-database-connection.mjs
   ```

### If Tests Still Fail with NULL Data

This means RLS policies weren't applied correctly. Re-run the migration:

```bash
# Use Supabase MCP power to re-apply migration
# See docs/E2E_RLS_POLICIES_FIXED.md for details
```

### If Auth State File Missing

```bash
# Check if auth setup is running
ls -la .auth/

# If missing, debug global-setup.ts
# Add logging to see where auth setup fails
```

## Success Criteria

### Minimum Success (70% pass rate)
- ✅ 250+ tests passing
- ✅ No NULL data errors
- ✅ Test data creation succeeds
- ✅ Email management tests pass
- ✅ Reference blocks tests pass
- ✅ RSVP management tests pass

### Ideal Success (80% pass rate)
- ✅ 280+ tests passing
- ✅ All data management tests pass
- ✅ All content management tests pass
- ✅ All routing tests pass
- ✅ Only auth state and server issues remain

### Complete Success (90%+ pass rate)
- ✅ 320+ tests passing
- ✅ Auth state file created correctly
- ✅ Server connection stable
- ✅ Configuration correct
- ✅ Only flaky tests remain

## Next Steps After Verification

### If 70-80% Pass Rate Achieved ✅

1. **Fix Auth State Persistence**
   - Debug `__tests__/e2e/global-setup.ts`
   - Ensure `.auth/user.json` is created
   - Add retry logic

2. **Fix Server Connection Issues**
   - Add health checks
   - Add retry logic
   - Increase timeout

3. **Fix Configuration**
   - Update `.env.e2e`
   - Verify environment variables

### If Pass Rate Still Low ❌

1. **Investigate Remaining Failures**
   - Check test logs for patterns
   - Identify common error messages
   - Group failures by category

2. **Verify RLS Policies**
   - Query database for service_role policies
   - Ensure all 34 tables have policies
   - Check policy syntax

3. **Check Test Data Factories**
   - Verify all required fields provided
   - Check for missing NOT NULL fields
   - Validate data types

## Reporting Results

### Create Summary Document

```bash
# Save test results
npm run test:e2e > e2e-test-results-post-rls-fix.log 2>&1

# Create summary
cat > docs/E2E_TEST_RESULTS_POST_RLS_FIX.md << EOF
# E2E Test Results After RLS Fix

**Date**: $(date +%Y-%m-%d)
**Status**: [PASS/FAIL]

## Results

Total Tests: [number]
Passed: [number] ([percentage]%)
Failed: [number] ([percentage]%)
Skipped: [number] ([percentage]%)

## Improvement

Before: 12 passing (3.3%)
After: [number] passing ([percentage]%)
Improvement: +[number] tests (+[percentage]%)

## Analysis

[Add analysis here]
EOF
```

## Quick Reference

### Commands
```bash
# Start dev server
npm run dev

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- [test-file]

# View test report
npx playwright show-report

# Check test logs
cat e2e-test-results-post-rls-fix.log
```

### Expected Patterns

**Should See More Of**:
- ✅ `✓ [test name]` (passing tests)
- ✅ Test data creation succeeding
- ✅ Database operations completing

**Should See Less Of**:
- ❌ `Cannot read properties of null (reading 'id')`
- ❌ `Failed to create test [entity]`
- ❌ Database operation errors

---

**Ready to Verify**: Run `npm run test:e2e` and compare results!
