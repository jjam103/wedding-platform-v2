# E2E Pattern 4: Guest Groups - Failure Analysis

## Status: IN PROGRESS
**Date**: February 11, 2026  
**Pattern**: Guest Groups (Group Management, Dropdown Reactivity, Registration)  
**Result**: 0/12 tests passing (0%)

---

## Test Results Summary

### Overall Status
- **Total Tests**: 12
- **Passing**: 0 (0%)
- **Failing**: 12 (100%)

### Failure Breakdown by Category

#### Category 1: Strict Mode Violations (8 tests - 67%)
**Root Cause**: Multiple `<h1>` elements on page causing strict mode violations

**Affected Tests**:
1. `should create group and immediately use it for guest creation`
2. `should update and delete groups with proper handling`
3. `should handle multiple groups in dropdown correctly`
4. `should show validation errors and handle form states`
5. `should handle network errors and prevent duplicates`
6. `should update dropdown immediately after creating new group`
7. `should handle async params and maintain state across navigation`
8. `should handle loading and error states in dropdown`

**Error Pattern**:
```
Error: strict mode violation: locator('h1') resolved to 2 elements:
1) <h1 class="text-lg font-semibold text-sage-900 hidden sm:block">Wedding Admin</h1>
2) <h1 class="text-3xl font-bold text-sage-900">Guest Management</h1>
```

**Location**: Line 50 and 260 in `__tests__/e2e/guest/guestGroups.spec.ts`

**Fix**: Use `.first()` on h1 selector or use more specific selector

---

#### Category 2: Registration Page Issues (3 tests - 25%)
**Root Cause**: Registration page title doesn't match expected pattern

**Affected Tests**:
9. `should complete full guest registration flow`
10. `should prevent XSS and validate form inputs`
11. `should handle duplicate email and be keyboard accessible`

**Error Pattern**:
```
Error: expect(page).toHaveTitle(expected) failed
Expected pattern: /Register/i
Received string:  "Costa Rica Wedding"
```

**Secondary Issue**: Missing password field on registration page
```
TimeoutError: page.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('input[name="password"]')
```

**Location**: Line 402 in `__tests__/e2e/guest/guestGroups.spec.ts`

**Fix**: 
1. Update page title to include "Register"
2. Add password field to registration form OR update test to match actual form fields

---

#### Category 3: Accessibility Issues (1 test - 8%)
**Root Cause**: Missing aria-label attributes on form elements

**Affected Tests**:
12. `should have proper accessibility attributes`

**Error Pattern**:
```
Error: expect(locator).toHaveAttribute() failed
Locator:  locator('form')
Expected: have attribute
Received: attribute not present
```

**Location**: Line 525 in `__tests__/e2e/guest/guestGroups.spec.ts`

**Fix**: Add aria-label attributes to form and input elements on registration page

---

## Root Cause Analysis

### Issue 1: Multiple H1 Elements (Priority 1 - Affects 8 tests)
**Problem**: Admin layout has two `<h1>` elements:
- Sidebar: `<h1 class="text-lg font-semibold text-sage-900 hidden sm:block">Wedding Admin</h1>`
- Page content: `<h1 class="text-3xl font-bold text-sage-900">Guest Management</h1>`

**Impact**: Playwright strict mode violations in all tests that use `page.locator('h1')`

**Solution Options**:
1. **Option A (Quick Fix)**: Update test selectors to use `.first()` or more specific selectors
2. **Option B (Proper Fix)**: Change sidebar heading from `<h1>` to `<div>` or `<span>` (only one `<h1>` per page is semantically correct)

**Recommended**: Option A for immediate fix, Option B for proper semantic HTML

---

### Issue 2: Registration Page Implementation (Priority 2 - Affects 3 tests)
**Problem**: Registration page doesn't match test expectations:
- Page title is "Costa Rica Wedding" instead of including "Register"
- No password field in registration form

**Impact**: All guest registration tests fail

**Investigation Needed**:
- Check if `/auth/register` route exists
- Verify registration form implementation
- Determine if password-based registration is implemented or if it uses magic links only

**Solution**: Either:
1. Update registration page to match test expectations
2. Update tests to match actual registration flow (magic link based?)

---

### Issue 3: Accessibility Attributes (Priority 3 - Affects 1 test)
**Problem**: Registration form missing aria-label attributes

**Impact**: Accessibility test fails

**Solution**: Add aria-label attributes to form elements

---

## Fix Strategy

### Phase 1: Quick Fix - Strict Mode Violations (8 tests)
**Estimated Time**: 5 minutes  
**Impact**: +67% pass rate (0% → 67%)

1. Update line 50: `await expect(page.locator('h1')).toContainText('Guest Management');`
   - To: `await expect(page.locator('h1').first()).toContainText('Guest Management');`

2. Update line 260: Same fix

**Files to Modify**:
- `__tests__/e2e/guest/guestGroups.spec.ts` (2 lines)

---

### Phase 2: Registration Page Investigation (3 tests)
**Estimated Time**: 15-30 minutes  
**Impact**: +25% pass rate (67% → 92%)

1. Check if `/auth/register` route exists and what it renders
2. Verify registration form fields
3. Update tests OR update registration page to match expectations

**Files to Check**:
- `app/auth/register/page.tsx`
- `__tests__/e2e/guest/guestGroups.spec.ts` (lines 399-520)

---

### Phase 3: Accessibility Attributes (1 test)
**Estimated Time**: 10 minutes  
**Impact**: +8% pass rate (92% → 100%)

1. Add aria-label to registration form
2. Add aria-label to form inputs

**Files to Modify**:
- `app/auth/register/page.tsx`

---

## Expected Outcome

### After Phase 1 (Quick Fix)
- **Tests Passing**: 8/12 (67%)
- **Tests Failing**: 4/12 (33%)
- **Time**: ~5 minutes

### After Phase 2 (Registration Fix)
- **Tests Passing**: 11/12 (92%)
- **Tests Failing**: 1/12 (8%)
- **Time**: ~20-35 minutes total

### After Phase 3 (Accessibility)
- **Tests Passing**: 12/12 (100%)
- **Tests Failing**: 0/12 (0%)
- **Time**: ~30-45 minutes total

---

## Next Steps

1. Apply Phase 1 fix (strict mode violations)
2. Run tests to verify 8/12 passing
3. Investigate registration page implementation
4. Apply Phase 2 and 3 fixes
5. Verify 100% pass rate
6. Move to Pattern 5 (Email Management - 22 failures)

---

## Files to Modify

### Test Files
- `__tests__/e2e/guest/guestGroups.spec.ts` (lines 50, 260)

### Application Files (Investigation Needed)
- `app/auth/register/page.tsx` (check if exists, verify form fields, add accessibility attributes)

---

## Pattern Efficiency

This pattern demonstrates the efficiency of pattern-based fixing:
- **Single root cause** (strict mode violation) affects **8 tests (67%)**
- **One-line fix** (add `.first()`) will fix **8 tests**
- **Fix-to-test ratio**: 1:8 (extremely efficient)

Similar to Pattern 1 where 5 targeted changes fixed 55 tests.
