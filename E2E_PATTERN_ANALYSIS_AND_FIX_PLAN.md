# E2E Test Pattern Analysis & Fix Plan

## Executive Summary

Analyzed 358 E2E tests with **significant authentication and Next.js 15 compatibility issues** blocking many tests. The failures fall into clear patterns that can be fixed systematically.

**Test Results Overview:**
- ✅ **Passing**: ~120 tests (33%)
- ❌ **Failing**: ~238 tests (67%)
- **Primary Blocker**: Authentication session not persisting (redirecting to login)
- **Secondary Blocker**: Next.js 15 async params/cookies issues

---

## Pattern 1: Authentication Session Loss (CRITICAL - Blocks ~200 tests)

### Symptoms
```
[Middleware] No user found: Auth session missing!
GET /auth/login?returnTo=%2Fadmin%2Fguests 200
```

### Affected Test Suites
- ❌ **Accessibility Suite** (Data Table tests): 31-39 failing
- ❌ **Content Management**: 40-51 failing  
- ❌ **Email Management**: 68-79 failing
- ❌ **Admin Navigation**: 80-98 failing
- ❌ **Data Management** (partial): 57-58, 60, 67 failing
- ❌ **Reference Blocks**: 116-123 failing
- ❌ **RSVP Management** (partial): 124, 128, 130 failing

### Root Cause
The `.auth/user.json` authentication state saved during global setup is not being properly loaded or is expiring during test execution. Tests are redirected to `/auth/login` instead of accessing protected admin routes.

### Fix Strategy
1. **Verify auth state file** is being created correctly in global setup
2. **Check Playwright storageState** configuration in `playwright.config.ts`
3. **Increase session timeout** or refresh mechanism
4. **Add auth verification** at start of each test file
5. **Consider per-test-file auth** instead of global auth

### Files to Fix
- `__tests__/e2e/global-setup.ts` - Auth state creation
- `playwright.config.ts` - Storage state configuration
- `.auth/user.json` - Verify format and expiration
- `__tests__/helpers/e2eHelpers.ts` - Add auth verification helpers

---

## Pattern 2: Next.js 15 Async Cookies/Params (HIGH PRIORITY - Clear errors)

### Symptoms
```
Error: Route "/activities-overview" used `cookies().get`. 
`cookies()` returns a Promise and must be unwrapped with `await` or `React.use()`
```

```
TypeError: nextCookies.get is not a function
at ActivitiesOverviewPage (app/activities-overview/page.tsx:29:47)
```

### Confirmed Broken Files
1. **`app/activities-overview/page.tsx`** - Line 29: `createServerComponentClient({ cookies })`

### Root Cause
Next.js 15 made `cookies()` and `params` async. Code is calling `.get()` synchronously on the Promise instead of awaiting it first.

### Fix Pattern
```typescript
// ❌ OLD (Next.js 14)
const supabase = createServerComponentClient({ cookies });

// ✅ NEW (Next.js 15)
const cookieStore = await cookies();
const supabase = createServerComponentClient({ cookies: () => cookieStore });
```

### Files to Fix (Search for pattern)
```bash
# Find all files with this pattern
grep -r "createServerComponentClient({ cookies })" app/
grep -r "cookies().get" app/
grep -r "params\." app/ | grep -v "await params"
```

### Estimated Files
- `app/activities-overview/page.tsx` ✅ Confirmed
- Likely: `app/[type]/[slug]/page.tsx`
- Likely: `app/activity/[id]/page.tsx`  
- Likely: `app/event/[id]/page.tsx`
- Likely: Other dynamic route pages

---

## Pattern 3: Guest Authentication Cookie Handling (MEDIUM)

### Symptoms
```
[Middleware] Guest auth check: {
  path: '/guest/photos',
  hasCookie: false,
  cookieValue: 'none',
  allCookies: []
}
[Middleware] No guest session cookie found - redirecting to login
```

### Affected Tests
- Photo upload guest view tests
- Guest portal tests (when they run)

### Root Cause
Guest authentication cookies not being set or persisted in E2E environment. Middleware is correctly checking but cookies aren't present.

### Fix Strategy
1. **Add guest auth helper** to E2E helpers
2. **Set guest session cookie** in tests that need guest access
3. **Verify middleware** cookie name matches what tests set
4. **Check cookie domain/path** settings

### Files to Fix
- `__tests__/helpers/e2eHelpers.ts` - Add `loginAsGuest()` helper
- `middleware.ts` - Verify cookie name and settings
- Guest view test files - Add guest auth setup

---

## Pattern 4: Location Hierarchy Type Issues (MEDIUM)

### Symptoms
Tests failing on location management pages with type-related errors.

### Affected Tests
- ❌ Test 57: Create hierarchical location structure
- ❌ Test 58: Prevent circular reference
- ❌ Test 60: Delete location and validate

### Root Cause
Likely related to the `locations.type` column migration that was applied. Tests may be using old data or expecting old schema.

### Fix Strategy
1. **Verify E2E database** has latest migrations
2. **Update test data** to include `type` field
3. **Check factories** in `__tests__/helpers/factories.ts`

### Files to Fix
- `__tests__/helpers/factories.ts` - Update location factory
- `__tests__/e2e/admin/dataManagement.spec.ts` - Update test data
- Verify migration applied to E2E database

---

## Pattern 5: CSV Export Tests (LOW - Specific feature)

### Symptoms
- ❌ Test 67: Export guests to CSV round-trip
- ❌ Test 128: Export RSVPs to CSV
- ❌ Test 130: Export filtered RSVPs to CSV

### Root Cause
CSV export functionality may have auth issues or API endpoint problems.

### Fix Strategy
1. **Verify API routes** for CSV export are working
2. **Check auth** on export endpoints
3. **Test download handling** in Playwright

### Files to Fix
- `app/api/admin/guests/export/route.ts`
- `app/api/admin/rsvps/export/route.ts`
- Test files - Update download assertions

---

## Pattern 6: Accessibility Test Failures (LOW - Specific checks)

### Symptoms
- ❌ Test 16: Indicate required form fields
- ❌ Test 20: Error message associations
- ❌ Test 21: ARIA expanded states
- ❌ Test 22: Accessible RSVP form
- ❌ Tests 23-28: Responsive design checks

### Root Cause
Likely auth-related (can't access pages to test accessibility). Once auth is fixed, these may pass.

### Fix Strategy
1. **Fix auth first** (Pattern 1)
2. **Re-run tests** to see if they pass
3. **Address remaining failures** individually

---

## Pattern 7: "Manage Sections" Button Missing (LOW - Skipped)

### Symptoms
```
⏭️  Skipping: Manage Sections button not found
```

### Affected Tests
- Test 105: Section editor photo integration (skipped gracefully)

### Root Cause
UI element not present or selector changed.

### Fix Strategy
1. **Verify button exists** in current UI
2. **Update selector** if button was renamed/moved
3. **Or remove test** if feature was removed

---

## Recommended Fix Order

### Phase 1: Authentication (CRITICAL - Unblocks 200+ tests)
**Priority**: 🔴 CRITICAL  
**Impact**: Unblocks ~60% of failing tests  
**Effort**: Medium (2-4 hours)

1. Debug auth state persistence in global setup
2. Verify Playwright storage state configuration
3. Add auth verification helpers
4. Test auth fixes with a few representative test files

**Success Criteria**: Admin tests can access `/admin/*` routes without redirect

---

### Phase 2: Next.js 15 Async APIs (HIGH - Clear fixes)
**Priority**: 🟠 HIGH  
**Impact**: Fixes runtime errors, unblocks guest-facing tests  
**Effort**: Low-Medium (1-2 hours)

1. Fix `app/activities-overview/page.tsx` (confirmed broken)
2. Search for and fix all `cookies()` and `params` sync access
3. Test fixes with affected routes

**Success Criteria**: No more "cookies().get is not a function" errors

---

### Phase 3: Guest Authentication (MEDIUM)
**Priority**: 🟡 MEDIUM  
**Impact**: Unblocks guest portal tests  
**Effort**: Low (1 hour)

1. Add `loginAsGuest()` helper to E2E helpers
2. Update guest view tests to use helper
3. Verify middleware cookie handling

**Success Criteria**: Guest tests can access `/guest/*` routes

---

### Phase 4: Location & Data Issues (MEDIUM)
**Priority**: 🟡 MEDIUM  
**Impact**: Fixes specific data management tests  
**Effort**: Low (30 min - 1 hour)

1. Verify E2E database migrations
2. Update test factories with `type` field
3. Re-run location tests

**Success Criteria**: Location hierarchy tests pass

---

### Phase 5: Remaining Issues (LOW)
**Priority**: 🟢 LOW  
**Impact**: Fixes remaining edge cases  
**Effort**: Variable

1. CSV export tests
2. Accessibility-specific failures (after auth fixed)
3. UI element selectors

---

## Quick Start: Fix Phase 1 (Auth)

### Step 1: Verify Auth State File
```bash
# Check if auth state is being created
cat .auth/user.json

# Should contain cookies and localStorage
```

### Step 2: Check Playwright Config
```typescript
// playwright.config.ts
use: {
  storageState: '.auth/user.json', // ✅ Should be here
}
```

### Step 3: Add Auth Verification
```typescript
// __tests__/helpers/e2eHelpers.ts
export async function verifyAdminAuth(page: Page) {
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/\/auth\/login/);
}
```

### Step 4: Test Fix
```bash
# Run a single failing test to verify
npx playwright test __tests__/e2e/admin/navigation.spec.ts:30 --headed
```

---

## Quick Start: Fix Phase 2 (Next.js 15)

### Step 1: Fix activities-overview
```typescript
// app/activities-overview/page.tsx
export default async function ActivitiesOverviewPage() {
  // ❌ OLD
  // const supabase = createServerComponentClient({ cookies });
  
  // ✅ NEW
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  });
  
  // Rest of code...
}
```

### Step 2: Find Other Instances
```bash
# Search for pattern
grep -rn "createServerComponentClient({ cookies })" app/

# Search for sync params access
grep -rn "params\." app/ | grep -v "await params"
```

### Step 3: Test Fix
```bash
# Verify activities-overview loads
curl http://localhost:3000/activities-overview
# Should not show error
```

---

## Monitoring Progress

### Run Specific Pattern Tests
```bash
# Test auth fixes
npx playwright test __tests__/e2e/admin/navigation.spec.ts

# Test Next.js 15 fixes
npx playwright test __tests__/e2e/guest/guestViews.spec.ts

# Test guest auth
npx playwright test __tests__/e2e/guest/guestAuth.spec.ts
```

### Track Success Rate
```bash
# Full suite
npm run test:e2e 2>&1 | tee e2e-results-after-fixes.log

# Count passing/failing
grep "✓" e2e-results-after-fixes.log | wc -l
grep "✘" e2e-results-after-fixes.log | wc -l
```

---

## Expected Outcomes

### After Phase 1 (Auth Fix)
- **Passing**: ~280 tests (78%)
- **Failing**: ~78 tests (22%)
- **Unblocked**: All admin navigation, content management, email management tests

### After Phase 2 (Next.js 15 Fix)
- **Passing**: ~320 tests (89%)
- **Failing**: ~38 tests (11%)
- **Unblocked**: Guest-facing routes, activities overview

### After Phase 3-5 (Remaining Fixes)
- **Passing**: ~350 tests (98%)
- **Failing**: ~8 tests (2%)
- **Target**: 95%+ pass rate

---

## Notes

1. **Auth is the critical blocker** - Fix this first to unblock the majority of tests
2. **Next.js 15 fixes are straightforward** - Clear error messages point to exact lines
3. **Many failures are cascading** - Fixing auth will likely resolve accessibility test failures
4. **Test in isolation** - Fix one pattern, verify, then move to next
5. **Document as you go** - Update this file with actual fixes applied

---

## Next Steps

1. ✅ **Read this analysis** - Understand the patterns
2. 🔄 **Start with Phase 1** - Fix authentication
3. 🔄 **Verify fixes** - Run subset of tests
4. 🔄 **Move to Phase 2** - Fix Next.js 15 issues
5. 🔄 **Continue systematically** - Work through remaining patterns
