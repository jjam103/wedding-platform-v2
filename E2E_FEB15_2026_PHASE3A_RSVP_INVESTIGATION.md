# E2E Phase 3A: RSVP Tests Investigation

**Date**: February 15, 2026  
**Priority**: P2 - RSVP System  
**Status**: 🔍 INVESTIGATING  
**Tests**: 19 tests timing out at ~30s

## Problem

All 19 RSVP tests are timing out at ~30 seconds:
- `rsvpFlow.spec.ts` (10 tests)
- `admin/rsvpManagement.spec.ts` (9 tests - 4 admin + 5 guest submission)

## Initial Investigation

### Test Run Results

```bash
npm run test:e2e -- rsvpFlow.spec.ts --grep "should complete event-level RSVP"
```

**Result**: Timeout after 60 seconds (even single test)

### Key Findings

1. ✅ **Guest RSVP Page Exists**: `app/guest/rsvp/page.tsx`
2. ✅ **API Routes Exist**:
   - `app/api/guest/rsvp/route.ts` (POST - create/update)
   - `app/api/guest/rsvps/route.ts` (GET - list)
3. ✅ **Components Exist**:
   - `RSVPManager` component
   - `RSVPForm` component
4. ✅ **Navigation Links**: Multiple components link to `/guest/rsvp`

### Root Cause Hypothesis

Unlike the form tests (which were a parallel execution issue), RSVP tests are timing out even when run individually. This suggests:

1. **Missing Page/Route**: The `/guest/rsvp` page might not be rendering
2. **Authentication Issue**: Guest auth might be failing
3. **Test Setup Issue**: Test data not being created properly
4. **Selector Issue**: Tests looking for elements that don't exist

## Detailed Analysis

### Test Flow Analysis

The `rsvpFlow.spec.ts` tests follow this pattern:

```typescript
test.beforeEach(async ({ page }) => {
  // 1. Register and login
  await page.goto('/auth/register');
  await page.fill('input[name="firstName"]', 'Jane');
  // ... fill form
  await page.click('button[type="submit"]');
  
  // 2. Wait for redirect to dashboard
  await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });
});

test('should complete event-level RSVP', async ({ page }) => {
  // 3. Navigate to RSVP page
  await page.click('a[href*="rsvp"]');
  await expect(page).toHaveURL(/\/guest\/rsvp/);
  // ... rest of test
});
```

### Potential Issues

1. **Registration/Login Failing**:
   - The `beforeEach` might be timing out at registration
   - Dashboard redirect might not be working
   
2. **RSVP Link Not Found**:
   - `a[href*="rsvp"]` selector might not match any elements
   - Link might be in a collapsed menu or hidden
   
3. **Page Not Loading**:
   - `/guest/rsvp` page might have errors
   - Page might be stuck in loading state

4. **Missing Test Data**:
   - No events/activities to RSVP to
   - Database not seeded properly

## Investigation Steps

### Step 1: Check Registration Flow
```bash
# Run just the beforeEach to see where it fails
npm run test:e2e -- rsvpFlow.spec.ts --headed --debug
```

### Step 2: Check RSVP Page Directly
```bash
# Navigate directly to RSVP page (skip registration)
# Create a simple test that just loads the page
```

### Step 3: Check Test Data
```bash
# Verify events and activities exist in E2E database
npm run test:e2e -- --grep "should display RSVP management page"
```

### Step 4: Check Selectors
```bash
# Use headed mode to see what's actually on the page
npm run test:e2e -- rsvpFlow.spec.ts --headed --timeout=120000
```

## Next Actions

1. ✅ Document investigation findings
2. 🔄 Run diagnostic tests to identify exact failure point
3. ⏳ Apply appropriate fix based on findings
4. ⏳ Verify all 19 tests pass
5. ⏳ Update action plan and dashboard

## Comparison with Form Tests

| Aspect | Form Tests | RSVP Tests |
|--------|-----------|------------|
| **Timeout** | ~24s | ~30s |
| **Individual Run** | ✅ Pass | ❌ Timeout |
| **Sequential Run** | ✅ Pass | ❓ Unknown |
| **Root Cause** | Parallel execution | ❓ Unknown |
| **Fix** | `.serial()` | ❓ TBD |

**Key Difference**: Form tests passed individually, RSVP tests timeout even individually. This indicates a different root cause.

## Hypothesis Priority

1. **HIGH**: Registration/authentication failing in beforeEach
2. **MEDIUM**: RSVP page not loading or has errors
3. **MEDIUM**: Missing test data (no events/activities)
4. **LOW**: Selector issues (wrong element selectors)
5. **LOW**: Parallel execution (unlikely given individual timeout)

## Files to Check

- `app/guest/rsvp/page.tsx` - RSVP page implementation
- `components/guest/RSVPManager.tsx` - Main RSVP component
- `__tests__/e2e/global-setup.ts` - Test data seeding
- `__tests__/helpers/guestAuthHelpers.ts` - Guest authentication
- `app/auth/register/page.tsx` - Registration page

## Expected Fix

Based on investigation, the fix will likely be one of:

1. **Fix registration flow** in test setup
2. **Add test data seeding** for events/activities
3. **Fix RSVP page** if it has errors
4. **Update selectors** if they're incorrect
5. **Add `.serial()`** if it's a parallel issue (unlikely)

## Status

- Investigation started: February 15, 2026
- Next step: Run diagnostic tests
- Estimated time: 1-2 hours

