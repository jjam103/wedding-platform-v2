# E2E Test Fixes - Action Plan (Feb 12, 2026)

## Executive Summary

**Session Date**: February 12, 2026  
**Goal**: Verify Phase 1 fixes for 4 Home Page Editing tests  
**Result**: ⚠️ Fixes correctly applied but blocked by route loading issue  
**Status**: Need to investigate `/admin/home-page` route before proceeding

## What We Accomplished

### ✅ Phase 1 Fixes Verified
Confirmed all 4 Home Page Editing tests have correct Phase 1 fixes:
- Added `waitForLoadState('networkidle')` before interactions
- Added visibility and enabled checks for all inputs
- Added API response waiting with 15s timeouts
- Verified API response data
- Added UI update verification (looking for "Last saved:" text)

### ❌ Tests Failed - Different Issue
All 4 tests failed in the `beforeEach` hook BEFORE Phase 1 fixes were executed:
```typescript
// Failing at line 248
await expect(page.locator('h1:has-text("Home Page Editor")')).toBeVisible({ timeout: 10000 });
// Error: element(s) not found - page doesn't load within 10 seconds
```

## Root Cause Analysis

### The Problem
The `/admin/home-page` route isn't loading within 10 seconds. The page makes an API call to `/api/admin/home-page` on mount to load configuration.

### Possible Causes
1. **API endpoint failing** - GET request to `/api/admin/home-page` times out or errors
2. **Database issue** - `system_settings` table missing or has no data
3. **Loading state stuck** - Page stays in skeleton/loading state indefinitely
4. **Auth issue** - API rejecting authenticated requests

### Evidence
- ✅ Route exists: `app/admin/home-page/page.tsx` present
- ✅ Heading exists: Line 234 has correct h1 element
- ✅ Server running: Global setup confirms Next.js server active
- ✅ Auth works: Global setup confirms admin authentication saved
- ❌ Page loads: Times out after 10 seconds

## Immediate Next Steps

### Step 1: Diagnose the Route Issue (30 minutes)

#### 1a. Check API Endpoint
```bash
# Test the GET endpoint directly
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/admin/home-page

# Expected: JSON response with home page config
# Check for: 200 status, valid JSON, no errors
```

#### 1b. Check Database
```bash
# Connect to database and check system_settings table
npm run db:query

# Run query:
SELECT * FROM system_settings WHERE key = 'home_page_config';

# Expected: Row with home page configuration
# Check for: Table exists, data present, valid JSON
```

#### 1c. Check Console Errors
```bash
# View test trace to see what happened
npx playwright show-trace test-results/admin-contentManagement-Ho-60835-tings-and-save-successfully-chromium-retry1/trace.zip

# Look for:
# - Console errors
# - Network failures
# - API timeouts
# - Loading state issues
```

#### 1d. Manual Browser Test
```bash
# Start dev server
npm run dev

# Open browser and navigate to:
http://localhost:3000/admin/home-page

# Check:
# - Does page load?
# - Is h1 visible?
# - Are there console errors?
# - Does API call succeed?
```

### Step 2: Fix the Issue (30-60 minutes)

Based on diagnosis, apply appropriate fix:

#### If API endpoint is failing:
```typescript
// Check app/api/admin/home-page/route.ts
// Verify:
// - Auth check works
// - Database query succeeds
// - Error handling is correct
// - Response format is valid
```

#### If database table is missing:
```bash
# Apply migration to create system_settings table
npm run db:migrate

# Or create manually:
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

# Insert default home page config:
INSERT INTO system_settings (key, value)
VALUES ('home_page_config', '{"welcomeMessage": "Welcome", "showEvents": true}')
ON CONFLICT (key) DO NOTHING;
```

#### If loading state is stuck:
```typescript
// Check app/admin/home-page/page.tsx
// Verify:
// - useEffect dependencies are correct
// - Error states are handled
// - Loading state transitions properly
// - API call has timeout
```

#### If auth is failing:
```bash
# Check E2E auth setup
cat __tests__/e2e/global-setup.ts

# Verify:
# - Admin user is created
# - Auth cookies are saved
# - Session is valid
```

### Step 3: Verify Fix (10 minutes)

```bash
# Run the 4 Home Page Editing tests
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts -g "Home Page Editing"

# Expected: All 4 tests should pass
# - beforeEach should succeed
# - Phase 1 fixes should execute
# - Tests should complete without timeout
```

## Decision Point: After Fix is Verified

Once the route issue is fixed and tests pass, you have 3 options:

### Option A: Continue with Phase 2 (5-8 hours)
**Fix remaining 59 failing tests by implementing missing features**

**Pros:**
- ✅ Fix real functionality issues
- ✅ Improve user experience
- ✅ Reduce technical debt
- ✅ Higher test coverage (56.5% pass rate)

**Cons:**
- ❌ Significant time investment (5-8 hours)
- ❌ Requires feature implementation
- ❌ May uncover more issues

**Recommended if:**
- You have 5-8 hours available
- Feature completion is a priority
- Test coverage is important

### Option B: Document and Move On (30 minutes)
**Skip failing tests and document known issues**

**Pros:**
- ✅ Quick closure (30 minutes)
- ✅ Move on to other priorities
- ✅ Can fix incrementally later
- ✅ Tests document known issues

**Cons:**
- ❌ 59 tests still failing
- ❌ Features remain incomplete
- ❌ Technical debt accumulates

**Recommended if:**
- Time is very limited
- Other priorities are more urgent
- Features can wait

### Option C: Hybrid Approach (2.5-3.5 hours) ⭐ RECOMMENDED
**Fix highest-value feature (DataTable), then document the rest**

**Implementation:**
1. Fix DataTable URL state (2-3 hours, 7 tests)
2. Document remaining issues (30 minutes)

**Pros:**
- ✅ Fixes most impactful feature
- ✅ Improves pass rate by 7.6%
- ✅ Balances time and value
- ✅ Provides clean stopping point

**Cons:**
- ❌ Still leaves 52 tests failing
- ❌ Some features remain incomplete

**Recommended if:**
- You have 2-3 hours available
- You want quick wins
- You want to balance time and value

## Detailed Phase 2 Plan (If Continuing)

### Phase 2a: DataTable URL State (2-3 hours, 7 tests)
**Highest ROI - User-facing feature improvement**

**Implementation:**
1. Add URL parameter synchronization to DataTable component
2. Implement search state persistence
3. Fix sort direction toggle
4. Add filter chip functionality

**Files to modify:**
- `components/ui/DataTable.tsx`
- `hooks/useDataTableState.ts` (create)

**Tests that will pass:**
- "should update URL when searching"
- "should persist search across page reload"
- "should toggle sort direction"
- "should show filter chips"
- "should clear filters"
- "should sync URL with table state"
- "should restore state from URL"

### Phase 2b: Content Management (2-3 hours, 15 tests)
**Second priority - Core CMS functionality**

**Implementation:**
1. Fix content page creation flow
2. Implement section reordering
3. Fix inline section editor
4. Add event reference linking

**Files to modify:**
- `app/admin/content-pages/page.tsx`
- `components/admin/InlineSectionEditor.tsx`
- `components/admin/SectionReorderList.tsx`

**Tests that will pass:**
- Content page creation (3 tests)
- Section reordering (4 tests)
- Inline section editor (5 tests)
- Event references (3 tests)

### Phase 2c: Location Hierarchy (1-2 hours, 4 tests)
**Third priority - Admin feature**

**Implementation:**
1. Fix tree expand/collapse
2. Implement circular reference prevention
3. Fix location deletion

**Files to modify:**
- `components/admin/LocationTree.tsx`
- `services/locationService.ts`

**Tests that will pass:**
- Tree expand/collapse (2 tests)
- Circular reference prevention (1 test)
- Location deletion (1 test)

## Success Metrics

### After Route Fix
- ✅ 4 Home Page Editing tests pass
- ✅ Pass rate: 35.9% → 40.2%
- ✅ Zero flaky tests maintained

### After Phase 2a (Hybrid Approach)
- ✅ 11 tests passing (4 + 7)
- ✅ Pass rate: 35.9% → 43.5%
- ✅ DataTable feature complete

### After Full Phase 2 (Option A)
- ✅ 33 tests passing (4 + 7 + 15 + 4 + 3)
- ✅ Pass rate: 35.9% → 56.5%
- ✅ Major features complete

## Time Estimates

| Task | Time | Tests Fixed | Pass Rate |
|------|------|-------------|-----------|
| **Diagnose route issue** | 30 min | 0 | 35.9% |
| **Fix route issue** | 30-60 min | 4 | 40.2% |
| **Verify fix** | 10 min | 0 | 40.2% |
| **Phase 2a: DataTable** | 2-3 hours | 7 | 43.5% |
| **Phase 2b: Content Mgmt** | 2-3 hours | 15 | 52.2% |
| **Phase 2c: Location Hierarchy** | 1-2 hours | 4 | 56.5% |
| **Document remaining** | 30 min | 0 | - |

## Recommended Path Forward

### Immediate (Today)
1. **Diagnose route issue** (30 min)
2. **Fix route issue** (30-60 min)
3. **Verify fix** (10 min)
4. **Make decision** on Phase 2 approach

### If Continuing (Hybrid Approach)
5. **Implement DataTable URL state** (2-3 hours)
6. **Verify DataTable tests** (10 min)
7. **Document remaining issues** (30 min)

### Total Time
- **Minimum**: 1.5-2 hours (fix route + verify)
- **Hybrid**: 4-5.5 hours (fix route + DataTable + document)
- **Full Phase 2**: 7-10 hours (fix route + all features)

## Files Created Today

1. `E2E_20260212_SESSION_SUMMARY.md` - Complete session summary
2. `E2E_20260212_PHASE1_ACTUAL_RESULTS.md` - Test run results and analysis
3. `E2E_20260212_PHASE1_VERIFICATION_RESULTS.md` - Detailed verification of fixes
4. `E2E_20260212_NEXT_STEPS_DECISION_MATRIX.md` - Decision framework
5. `E2E_20260212_ACTION_PLAN.md` - This file

## Quick Reference Commands

```bash
# Diagnose route issue
npx playwright show-trace test-results/admin-contentManagement-Ho-60835-tings-and-save-successfully-chromium-retry1/trace.zip

# Test API endpoint
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/home-page

# Check database
npm run db:query
# SELECT * FROM system_settings WHERE key = 'home_page_config';

# Run fixed tests
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts -g "Home Page Editing"

# Run full E2E suite
npm run test:e2e
```

## Status Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Phase 1 Fixes** | ✅ Complete | All 4 tests have correct fixes |
| **Tests Passing** | ❌ Blocked | Route loading issue prevents execution |
| **Root Cause** | 🔍 Identified | `/admin/home-page` doesn't load within 10s |
| **Next Step** | 🎯 Clear | Diagnose and fix route issue |
| **Phase 2 Decision** | ⏳ Pending | Decide after route fix is verified |

## Conclusion

The Phase 1 fixes are correctly implemented and follow the exact pattern needed. However, we discovered a real issue: the `/admin/home-page` route isn't loading properly. This needs to be fixed before we can verify the Phase 1 fixes work.

Once the route issue is fixed, you'll need to decide whether to continue with Phase 2 (implementing missing features) or document and move on. The hybrid approach (fix DataTable + document) offers the best balance of time and value.

**Immediate action**: Diagnose why `/admin/home-page` doesn't load within 10 seconds.
