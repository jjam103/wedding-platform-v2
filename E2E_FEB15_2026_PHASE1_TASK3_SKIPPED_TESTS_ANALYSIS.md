# Phase 1 Task 3: Skipped Tests Analysis

**Date**: February 15, 2026  
**Status**: ✅ ANALYSIS COMPLETE  
**Found**: 12 skipped tests across 6 test files

---

## Executive Summary

**Total Skipped Tests**: 12 tests (3.3% of test suite)

**Breakdown by Category**:
1. **Not Implemented** (3 tests) - Guest registration feature not built
2. **Flaky/Timing Issues** (5 tests) - Auth method tests, loading states
3. **Environment-Specific** (2 tests) - Preview mode, hot reload
4. **Performance Issues** (1 test) - Bulk email sending
5. **Query Parameters** (1 test) - Incomplete implementation

**Recommendation**: 
- **Enable**: 0 tests (all have valid reasons to be skipped)
- **Fix and Enable**: 5 tests (auth method tests can be fixed)
- **Keep Skipped**: 7 tests (valid reasons or not implemented)

---

## Detailed Analysis

### Category 1: Not Implemented Features (3 tests)

**File**: `__tests__/e2e/guest/guestGroups.spec.ts`

#### Test 1: Guest Registration Flow
```typescript
test.skip('should complete full guest registration flow', async ({ page }) => {
  // TODO: Implement /api/auth/guest/register endpoint
  // This feature is not yet implemented - registration API returns 404
});
```

**Status**: ❌ NOT IMPLEMENTED  
**Reason**: `/api/auth/guest/register` endpoint doesn't exist  
**Action**: Keep skipped until feature is implemented  
**Priority**: LOW (not a core feature)

---

#### Test 2: XSS Prevention in Registration
```typescript
test.skip('should prevent XSS and validate form inputs', async ({ page }) => {
  // TODO: Implement /api/auth/guest/register endpoint
  // This feature is not yet implemented - registration API returns 404
});
```

**Status**: ❌ NOT IMPLEMENTED  
**Reason**: Depends on registration endpoint  
**Action**: Keep skipped until feature is implemented  
**Priority**: LOW (security test for unimplemented feature)

---

#### Test 3: Duplicate Email Handling
```typescript
test.skip('should handle duplicate email and be keyboard accessible', async ({ page }) => {
  // TODO: Implement /api/auth/guest/register endpoint
  // This feature is not yet implemented - registration API returns 404
});
```

**Status**: ❌ NOT IMPLEMENTED  
**Reason**: Depends on registration endpoint  
**Action**: Keep skipped until feature is implemented  
**Priority**: LOW (validation test for unimplemented feature)

---

### Category 2: Flaky/Timing Issues (5 tests)

**File**: `__tests__/e2e/admin/userManagement.spec.ts`

#### Test 4: Change Default Auth Method
```typescript
test.skip('should change default auth method and bulk update guests', async ({ page }) => {
  // Skipped due to flakiness - form state may already match test value
});
```

**Status**: ⚠️ FLAKY  
**Reason**: Form may already be in the state being tested, causing `hasChanges` to be false  
**Action**: ✅ **CAN BE FIXED**  
**Fix Strategy**:
1. Reset auth method to known state before test
2. Verify current state before changing
3. Add explicit state checks
4. Use data-testid for more reliable selectors

**Priority**: HIGH (core authentication feature)  
**Estimated Effort**: 1-2 hours

---

#### Test 5: New Guest Inherits Auth Method
```typescript
test.skip('should verify new guest inherits default auth method', async ({ page }) => {
  // Skipped due to flakiness
});
```

**Status**: ⚠️ FLAKY  
**Reason**: Similar to Test 4 - state management issues  
**Action**: ✅ **CAN BE FIXED**  
**Fix Strategy**:
1. Set default auth method to known value
2. Create new guest
3. Verify guest has correct auth method
4. Add proper wait conditions

**Priority**: HIGH (core authentication feature)  
**Estimated Effort**: 1 hour

---

#### Test 6: API Error Handling
```typescript
test.skip('should handle API errors gracefully and disable form during save', async ({ page }) => {
  // Skipped due to flakiness
});
```

**Status**: ⚠️ FLAKY  
**Reason**: API mocking or timing issues  
**Action**: ✅ **CAN BE FIXED**  
**Fix Strategy**:
1. Use proper route interception
2. Add wait for error message
3. Verify form disabled state
4. Add retry logic

**Priority**: MEDIUM (error handling test)  
**Estimated Effort**: 1 hour

---

#### Test 7: Display Warnings and Descriptions
```typescript
test.skip('should display warnings and method descriptions', async ({ page }) => {
  // Skipped due to flakiness
});
```

**Status**: ⚠️ FLAKY  
**Reason**: UI rendering timing issues  
**Action**: ✅ **CAN BE FIXED**  
**Fix Strategy**:
1. Add proper wait for UI elements
2. Use more specific selectors
3. Add retry logic
4. Verify all descriptions are visible

**Priority**: LOW (UI display test)  
**Estimated Effort**: 30 minutes

---

**File**: `__tests__/e2e/auth/guestAuth.spec.ts`

#### Test 8: Loading State During Authentication
```typescript
test.skip('should show loading state during authentication', async ({ page }) => {
  // SKIPPED: This test is flaky because authentication happens too fast
  // The button disappears before we can reliably check if it's disabled
});
```

**Status**: ⚠️ FLAKY  
**Reason**: Authentication is too fast to capture loading state  
**Action**: ✅ **CAN BE FIXED**  
**Fix Strategy**:
1. Add artificial delay in test (not ideal)
2. Mock API to add delay
3. Use network throttling
4. Check for loading state immediately after click

**Priority**: LOW (loading state is nice-to-have)  
**Estimated Effort**: 1 hour

---

### Category 3: Environment-Specific (2 tests)

**File**: `__tests__/e2e/system/routing.spec.ts`

#### Test 9: Preview Mode for Draft Content
```typescript
test.skip('should show draft content in preview mode when authenticated', async ({ page }) => {
  // TODO: Implement admin session helper for preview mode testing
});
```

**Status**: ⚠️ INCOMPLETE  
**Reason**: Needs admin session helper implementation  
**Action**: Keep skipped until helper is implemented  
**Priority**: MEDIUM (preview mode is useful feature)  
**Estimated Effort**: 2-3 hours (need to implement helper)

---

#### Test 10: Query Parameters Handling
```typescript
test.skip('should handle query parameters correctly', async ({ page }) => {
  // TODO: Implement admin session helper for preview mode testing
});
```

**Status**: ⚠️ INCOMPLETE  
**Reason**: Depends on admin session helper  
**Action**: Keep skipped until helper is implemented  
**Priority**: LOW (edge case testing)  
**Estimated Effort**: 1 hour (after helper is implemented)

---

**File**: `__tests__/e2e/system/uiInfrastructure.spec.ts`

#### Test 11: CSS Hot Reload
```typescript
test.skip('should hot reload CSS changes within 2 seconds without full page reload', async ({ page }) => {
  // This test is skipped because:
  // 1. CSS hot reload only works in development mode (npm run dev)
  // 2. E2E tests run against production build
  // 3. Manual testing confirms hot reload works correctly
});
```

**Status**: ✅ VALID SKIP  
**Reason**: Only works in dev mode, E2E tests use production build  
**Action**: Keep skipped (manual testing confirms it works)  
**Priority**: N/A (not applicable to production build)

---

### Category 4: Performance Issues (1 test)

**File**: `__tests__/e2e/admin/emailManagement.spec.ts`

#### Test 12: Bulk Email Sending
```typescript
test.skip('should send bulk email to all guests', async ({ page }) => {
  // SKIPPED: Backend Performance Issue
  // Sending emails to all guests takes too long for E2E test
  // This should be tested with integration tests instead
});
```

**Status**: ⚠️ PERFORMANCE  
**Reason**: Takes too long for E2E test (should be integration test)  
**Action**: Keep skipped in E2E, move to integration tests  
**Priority**: MEDIUM (bulk email is important feature)  
**Estimated Effort**: 2 hours (create integration test)

---

## Summary by Action

### ✅ Can Be Fixed and Enabled (5 tests)

**High Priority** (2 tests - 1-2 hours each):
1. Change default auth method and bulk update guests
2. New guest inherits default auth method

**Medium Priority** (1 test - 1 hour):
3. API error handling

**Low Priority** (2 tests - 30 min - 1 hour each):
4. Display warnings and descriptions
5. Loading state during authentication

**Total Effort**: 4-6 hours  
**Potential Impact**: +1.4% pass rate (5/362 tests)

---

### ⏸️ Keep Skipped - Valid Reasons (7 tests)

**Not Implemented** (3 tests):
- Guest registration flow
- XSS prevention in registration
- Duplicate email handling

**Environment-Specific** (2 tests):
- Preview mode for draft content (needs helper)
- Query parameters handling (needs helper)

**Valid Skip** (1 test):
- CSS hot reload (dev-only feature)

**Performance** (1 test):
- Bulk email sending (should be integration test)

---

## Recommendations

### Immediate Actions (Phase 1)

1. ✅ **Fix Auth Method Tests** (Tests 4-7)
   - Priority: HIGH
   - Effort: 3-4 hours
   - Impact: +1.1% pass rate (4 tests)
   - **Do this now** - core authentication feature

2. ⏸️ **Skip Loading State Test** (Test 8)
   - Priority: LOW
   - Effort: 1 hour
   - Impact: +0.3% pass rate (1 test)
   - **Do later** - nice-to-have, not critical

### Future Actions (Phase 2+)

3. **Implement Guest Registration** (Tests 1-3)
   - Priority: LOW
   - Effort: 8-12 hours (feature + tests)
   - Impact: +0.8% pass rate (3 tests)
   - **Do when feature is prioritized**

4. **Create Admin Session Helper** (Tests 9-10)
   - Priority: MEDIUM
   - Effort: 3-4 hours
   - Impact: +0.6% pass rate (2 tests)
   - **Do in Phase 2**

5. **Move Bulk Email to Integration** (Test 12)
   - Priority: MEDIUM
   - Effort: 2 hours
   - Impact: +0.3% pass rate (1 test)
   - **Do in Phase 2**

---

## Revised Phase 1 Goals

### Original Goal
- Fix 4 flaky + 12 skipped = 16 tests
- Target: 72% pass rate (261/362 tests)

### Revised Goal (Realistic)
- Fix 4 flaky (✅ DONE) + 4 auth method tests = 8 tests
- Target: 70% pass rate (253/362 tests)
- Current: 68.8% (249/362 tests)
- Gap: 4 tests

**More Achievable**: Focus on fixable tests (auth method) in Phase 1.

---

## Next Steps

### Phase 1 Task 3: Fix Auth Method Tests

**Target**: 4 tests in `userManagement.spec.ts`  
**Estimated Time**: 3-4 hours  
**Expected Impact**: +1.1% pass rate

**Approach**:
1. Review current auth method implementation
2. Add proper state management in tests
3. Fix form state detection
4. Add better wait conditions
5. Verify tests pass consistently

**Success Criteria**:
- All 4 auth method tests pass
- Tests are not flaky (pass 10/10 times)
- Pass rate increases to ~70%

---

## Status

✅ **Phase 1 Task 1**: Fix flaky tests (COMPLETE)  
✅ **Phase 1 Task 2**: "Did not run" analysis (COMPLETE)  
✅ **Phase 1 Task 3**: Skipped tests analysis (COMPLETE)  
⏳ **Phase 1 Task 3a**: Fix auth method tests (NEXT)

**Current Pass Rate**: 68.8% (249/362 tests)  
**Phase 1 Target**: 70% (253/362 tests)  
**Gap**: 4 tests (auth method tests)

---

**Last Updated**: February 15, 2026  
**Next Action**: Fix auth method tests in userManagement.spec.ts  
**Estimated Time**: 3-4 hours
