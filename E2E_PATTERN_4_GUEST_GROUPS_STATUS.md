# E2E Pattern 4: Guest Groups - Current Status

## Status: IN PROGRESS - Deeper Issues Found
**Date**: February 11, 2026  
**Pattern**: Guest Groups (Group Management, Dropdown Reactivity, Registration)  
**Result**: 0/12 tests passing (0%) - Multiple root causes identified

---

## Progress Summary

### Phase 1: beforeEach Hook Fix - COMPLETE ✅
**Issue**: Strict mode violation in beforeEach hooks (lines 50, 260)  
**Fix Applied**: Changed `page.locator('h1')` to `page.locator('h1:has-text("Guest Management")')`  
**Result**: beforeEach hooks now pass, but tests fail in test body

---

## Current Failure Analysis

### Root Cause 1: Strict Mode Violations in Test Body (8 tests)
**Problem**: Group names appear in multiple places on the page, causing strict mode violations

**Example Error**:
```
Error: strict mode violation: locator('text=Test Family 1770844710235') resolved to 3 elements:
1) <p class="font-medium text-sage-900 truncate">Test Family 1770844710235</p>
2) <option value="...">Test Family 1770844710235</option> (Guest form dropdown)
3) <option value="...">Test Family 1770844710235</option> (Filter dropdown)
```

**Affected Tests** (all in Guest Groups Management and Dropdown Reactivity):
1. `should create group and immediately use it for guest creation` - Line 80
2. `should update and delete groups with proper handling`
3. `should handle multiple groups in dropdown correctly`
4. `should show validation errors and handle form states`
5. `should handle network errors and prevent duplicates`
6. `should update dropdown immediately after creating new group`
7. `should handle async params and maintain state across navigation`
8. `should handle loading and error states in dropdown`

**Fix Needed**: Update all `page.locator(\`text=${groupName}\`)` to use more specific selectors or `.first()`

---

### Root Cause 2: Registration Page Missing/Incomplete (3 tests)
**Problem**: `/auth/register` page doesn't match test expectations

**Issues**:
1. Page title is "Costa Rica Wedding" instead of containing "Register"
2. No `input[name="password"]` field exists on the form

**Affected Tests**:
9. `should complete full guest registration flow` - Line 402 (title check)
10. `should prevent XSS and validate form inputs` - Line 439 (password field)
11. `should handle duplicate email and be keyboard accessible` - Line 481 (password field)

**Investigation Needed**:
- Check if `/auth/register` route exists
- Verify if registration uses password or magic link
- Update tests to match actual implementation OR implement missing features

---

### Root Cause 3: Missing Accessibility Attributes (1 test)
**Problem**: Registration form missing aria-label attributes

**Affected Test**:
12. `should have proper accessibility attributes` - Line 525

**Fix Needed**: Add aria-label to form and input elements

---

## Revised Fix Strategy

### Phase 1: Fix Strict Mode in Test Bodies (8 tests)
**Estimated Time**: 15-20 minutes  
**Impact**: +67% pass rate (0% → 67%)

Need to update multiple lines in test file where group names are checked:
- Line 80: `await expect(page.locator(\`text=${groupName}\`)).toBeVisible();`
- Similar patterns throughout all 8 tests

**Options**:
1. Use `.first()` on each locator
2. Use more specific selectors (e.g., `page.locator('p.font-medium').filter({ hasText: groupName })`)
3. Use data-testid attributes (best practice but requires code changes)

**Recommended**: Option 2 (more specific selectors) for better test reliability

---

### Phase 2: Registration Page Investigation (3 tests)
**Estimated Time**: 30-45 minutes  
**Impact**: +25% pass rate (67% → 92%)

1. Check `/auth/register` route implementation
2. Determine if password-based registration is implemented
3. Either:
   - Update tests to match magic-link-only flow
   - Implement password-based registration
   - Skip these tests if feature not implemented

---

### Phase 3: Accessibility Attributes (1 test)
**Estimated Time**: 10 minutes  
**Impact**: +8% pass rate (92% → 100%)

Add aria-label attributes to registration form elements

---

## Complexity Assessment

**Initial Assessment**: Simple strict mode fix (5 minutes)  
**Actual Complexity**: Multiple strict mode violations + registration page issues (45-75 minutes)

**Why More Complex**:
1. Strict mode violations occur in test bodies, not just beforeEach hooks
2. Group names appear in 3 different UI elements (list, guest dropdown, filter dropdown)
3. Registration page may not be fully implemented
4. Tests may be testing unimplemented features

---

## Recommendation

Given the complexity and time required, I recommend:

1. **Skip Pattern 4 for now** and move to Pattern 5 (Email Management - 22 failures)
2. **Return to Pattern 4** after completing easier patterns
3. **Investigate registration page** separately to determine if it's implemented

**Rationale**:
- Pattern 4 requires significant investigation and potentially code changes
- Other patterns may have simpler fixes
- Better to accumulate quick wins first
- Pattern 4 may reveal missing features that need product decisions

---

## Alternative: Quick Partial Fix

If we want some progress on Pattern 4:

1. Fix the 8 strict mode violations in test bodies (~20 minutes)
2. Skip the 4 registration/accessibility tests for now
3. Result: 8/12 passing (67%) with minimal effort

This would improve overall E2E pass rate by +2.2% (67.1% → 69.3%)

---

## Decision Point

**Option A**: Continue with Pattern 4 (45-75 minutes for 100%)  
**Option B**: Quick fix Pattern 4 (20 minutes for 67%), move to Pattern 5  
**Option C**: Skip Pattern 4 entirely, move to Pattern 5  

**Recommended**: Option B (quick partial fix, then move on)

---

## Files Involved

### Test Files
- `__tests__/e2e/guest/guestGroups.spec.ts` (multiple lines need updates)

### Application Files (Investigation Needed)
- `app/auth/register/page.tsx` (may not exist or be incomplete)

---

## Next Steps

Awaiting decision on which option to pursue.
