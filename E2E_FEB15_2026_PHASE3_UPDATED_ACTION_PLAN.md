# E2E Phase 3: Updated Action Plan

**Date**: February 15, 2026  
**Current Status**: 71 failures analyzed, CSV tests fixed  
**Next Target**: Infrastructure fixes

## Current Progress

### ✅ Completed
- **Form Submission Tests** (10 tests) - Serial execution fix applied ✅
- **CSV Import Tests** (2 tests) - Modal backdrop fix applied ✅
- **Data Management** - All tests passing ✅

### 🔄 In Progress
- **RSVP System Tests** (19 tests) - Root cause identified, partial fix applied, needs debugging

## Phase 3 Breakdown

### Phase 3A: Infrastructure Fixes (29 tests) 🎯 IN PROGRESS

**Priority 1: Form Submission Infrastructure** (10 tests) ✅ COMPLETE
- **File**: `system/uiInfrastructure.spec.ts`
- **Issue**: Tests timing out in parallel execution
- **Root Cause**: Test isolation issue (database contention, form state interference)
- **Solution**: Added `.serial()` to force sequential execution
- **Status**: ✅ ALL 10 TESTS PASSING
- **Verification**: ✓ 10 passed (1.3m)
- **Documentation**: `E2E_FEB15_2026_PHASE3A_FORM_TESTS_FIXED.md`

**Priority 2: RSVP API Endpoints** (19 tests) 🔄 IN PROGRESS
- **Files**: `rsvpFlow.spec.ts`, `admin/rsvpManagement.spec.ts`
- **Issue**: All RSVP tests timeout at ~30s (even individually)
- **Root Cause**: ✅ IDENTIFIED - Tests use outdated registration flow
  - Tests try to fill `password` and `ageType` fields that don't exist
  - Registration page only has `firstName`, `lastName`, `email`
  - Guests use email-matching auth, not password-based
- **Solution**: 🔄 PARTIALLY APPLIED
  - Updated `rsvpFlow.spec.ts` to use `authenticateAsGuestForTest` helper
  - Added test data creation (events, activities)
  - Skipped 9/10 tests to focus on first test
- **Current Status**: First test still timing out, needs further debugging
- **Next Steps**:
  1. Run in headed mode to see what's happening
  2. Check if guest dashboard loads
  3. Check if RSVP page loads
  4. Verify test data creation
  5. Update selectors to match actual UI
- **Tests**:
  - 10 RSVP flow tests (event-level, activity-level, capacity, etc.)
  - 4 admin RSVP management tests (export, filtering)
  - 5 guest RSVP submission tests (dietary restrictions, updates, etc.)

**Action Items**:
1. ✅ Investigate form submission - COMPLETE
2. ✅ Apply form submission fix - COMPLETE
3. ✅ Verify form tests pass - COMPLETE
4. ✅ Investigate RSVP tests - COMPLETE (root cause found)
5. 🔄 Debug RSVP test timeout - IN PROGRESS
6. ⏳ Apply RSVP fixes
7. ⏳ Verify all 19 RSVP tests pass

**Expected Impact**: 29 tests fixed (41% of failures)

### Phase 3B: Feature Fixes (15 tests)

**Priority 3: Guest Groups Dropdown** (9 tests)
- **File**: `guest/guestGroups.spec.ts`
- **Issue**: Dropdown reactivity and state management
- **Status**: Partially fixed, needs completion
- **Tests**:
  - should create group and immediately use it for guest creation
  - should update and delete groups with proper handling
  - should handle multiple groups in dropdown correctly
  - should show validation errors and handle form states
  - should handle network errors and prevent duplicates
  - should update dropdown immediately after creating new group
  - should handle async params and maintain state across navigation
  - should handle loading and error states in dropdown
  - should have proper accessibility attributes

**Action Items**:
1. Review previous guest groups fixes
2. Identify remaining dropdown issues
3. Apply fixes for state management
4. Verify dropdown reactivity
5. Test all scenarios

**Priority 4: Guest Views Preview** (5 tests)
- **File**: `guest/guestViews.spec.ts`
- **Issue**: Preview functionality not implemented or broken
- **Tests**:
  - should have preview link in admin sidebar
  - should open guest portal in new tab when clicked
  - should show guest view in preview (not admin view)
  - should not affect admin session when preview is opened
  - should work from any admin page

**Action Items**:
1. Check if preview link exists in sidebar
2. Verify preview functionality implementation
3. Test preview in new tab
4. Ensure session isolation
5. Apply fixes and verify

**Priority 5: Admin Navigation** (4 tests)
- **File**: `admin/navigation.spec.ts`
- **Issue**: Navigation infrastructure issues
- **Tests**:
  - should navigate to sub-items and load pages correctly
  - should have sticky navigation with glassmorphism effect
  - should support keyboard navigation
  - should open and close mobile menu

**Action Items**:
1. Test navigation manually
2. Verify sub-item navigation
3. Check sticky navigation CSS
4. Test keyboard navigation
5. Test mobile menu

**Expected Impact**: 15 tests fixed (21% of failures)

### Phase 3C: Individual Fixes (11 tests)

**Priority 6: Accessibility** (3 tests)
- **File**: `accessibility/suite.spec.ts`
- **Tests**:
  - should activate buttons with Enter and Space keys
  - should navigate admin dashboard and guest management with keyboard
  - should be responsive across admin pages

**Priority 7: Admin Dashboard** (3 tests)
- **File**: `admin-dashboard.spec.ts`
- **Tests**:
  - should render dashboard metrics cards
  - should have interactive elements styled correctly
  - should load dashboard data from API

**Priority 8: Email Management** (1 test)
- **File**: `admin/emailManagement.spec.ts`
- **Test**: should select recipients by group

**Priority 9: Photo Upload** (1 test)
- **File**: `admin/photoUpload.spec.ts`
- **Test**: should store photo in B2 with CDN URL

**Priority 10: Section Management** (1 test)
- **File**: `admin/sectionManagement.spec.ts`
- **Test**: should create new section with rich text content

**Priority 11: System Routing** (1 test)
- **File**: `system/routing.spec.ts`
- **Test**: should generate unique slugs for events with same name

**Priority 12: Debug Tests** (5 tests)
- **Action**: Remove or skip debug tests

**Expected Impact**: 11 tests fixed (15% of failures)

### Phase 3D: Environment-Specific (4 tests)

**Priority 13: CSS Tests** (4 tests)
- **File**: `system/uiInfrastructure.spec.ts`
- **Tests**:
  - should load CSS file successfully with proper transfer size
  - should apply Tailwind utility classes correctly
  - should apply borders, shadows, and responsive classes
  - should render consistently across viewport sizes

**Action**: Investigate if these are environment-specific or actual issues

**Expected Impact**: 4 tests fixed or skipped (6% of failures)

## Execution Strategy

### Step 1: Phase 3A - Infrastructure (NEXT)
1. Start with form submission infrastructure (10 tests)
2. Then RSVP API endpoints (19 tests)
3. Run tests after each fix to verify
4. Document findings and fixes

### Step 2: Phase 3B - Features
1. Fix guest groups dropdown (9 tests)
2. Implement guest views preview (5 tests)
3. Fix admin navigation (4 tests)
4. Run tests after each fix

### Step 3: Phase 3C - Individual Fixes
1. Work through individual test failures
2. Apply targeted fixes
3. Remove debug tests
4. Verify all fixes

### Step 4: Phase 3D - Environment
1. Investigate CSS tests
2. Determine if environment-specific
3. Skip or fix as appropriate

## Success Metrics

### Target: 83% of failures fixed
- Phase 3A: 29 tests (41%)
- Phase 3B: 15 tests (21%)
- Phase 3C: 11 tests (15%)
- Phase 3D: 4 tests (6%)

**Total**: 59 tests fixed out of 71 failures

### Remaining: 12 tests (17%)
May require feature implementation or are environment-specific

## Timeline Estimate

- **Phase 3A**: 2-3 hours (infrastructure fixes)
- **Phase 3B**: 1-2 hours (feature fixes)
- **Phase 3C**: 1-2 hours (individual fixes)
- **Phase 3D**: 30 minutes (investigation)

**Total**: 4.5-7.5 hours

## Next Actions

1. ✅ Analyze background test run - COMPLETE
2. ✅ Fix CSV import tests - COMPLETE
3. 🎯 Start Phase 3A: Form submission infrastructure
4. Continue with RSVP API endpoints
5. Move to Phase 3B: Feature fixes
6. Complete Phase 3C & 3D

## Notes

- CSV import tests fixed using modal backdrop strategy
- Background test run provides clear categorization
- Infrastructure fixes will have highest impact
- Feature fixes build on infrastructure
- Individual fixes are targeted and specific
