# E2E Pattern 4: Guest Groups - Root Cause Analysis

## Date
February 11, 2026

## Current Status
- **Passing**: 2/12 tests (16.7%)
- **Failing**: 10/12 tests (83.3%)

## Root Cause Identified

### Primary Issue: Incorrect Submit Button Text

**Test Expectation:**
```typescript
await page.click('button:has-text("Create Guest")');
```

**Actual Implementation:**
The `CollapsibleForm` component uses a `submitLabel` prop:

```typescript
<CollapsibleForm
  title={selectedGuest ? 'Edit Guest' : 'Add Guest'}
  submitLabel={selectedGuest ? 'Update' : 'Create'}  // <-- Button text is "Create"
  // ... other props
/>
```

The submit button renders as:
```typescript
<button type="submit">
  {isSubmitting ? 'Submitting...' : submitLabel}  // submitLabel = "Create"
</button>
```

**Impact:** 7 tests failing (58% of failures)

---

## Detailed Failure Analysis

### Category 1: Guest Creation Tests (7 tests - 58%)

**Tests Affected:**
1. `should create group and immediately use it for guest creation`
2. `should handle multiple groups in dropdown correctly`
3. `should show validation errors and handle form states`
4. `should handle network errors and prevent duplicates`
5. `should update dropdown immediately after creating new group`
6. `should handle async params and maintain state across navigation`
7. `should handle loading and error states in dropdown`

**Error:**
```
TimeoutError: page.click: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Create Guest")')
```

**Root Cause:**
- Tests look for `button:has-text("Create Guest")`
- Actual button text is `"Create"`
- Button never found → timeout

**Fix Required:**
```typescript
// Change from:
await page.click('button:has-text("Create Guest")');

// To:
await page.click('button:has-text("Create")');
// OR more specific:
await page.click('button[type="submit"]:has-text("Create")');
```

---

### Category 2: Guest Registration Tests (3 tests - 25%)

**Tests Affected:**
1. `should complete full guest registration flow`
2. `should prevent XSS and validate form inputs`
3. `should handle duplicate email and be keyboard accessible`

**Error:**
```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation until "load"
```

**Root Cause:**
- Registration form submission doesn't redirect to `/guest/dashboard`
- Tests expect redirect after successful registration
- Actual behavior: Form stays on `/auth/register` or shows error

**Possible Causes:**
1. **Registration API not working** - Form submission fails
2. **No redirect logic** - Form doesn't redirect on success
3. **Authentication issue** - User not logged in after registration

**Investigation Needed:**
- Check `/auth/register` page implementation
- Check form submission handler
- Check if registration creates authenticated session
- Check redirect logic after successful registration

---

### Category 3: Passing Tests (2 tests - 17%)

**Tests Passing:**
1. `should update and delete groups with proper handling`
2. `should have proper accessibility attributes`

**Why These Pass:**
- Don't interact with guest creation form
- Only interact with group management (which uses different buttons)
- Accessibility test only checks for attributes, not interactions

---

## Fix Strategy

### Priority 1: Fix Guest Creation Button Text (Quick Win - 7 tests)

**Change Required:**
Update all instances of `button:has-text("Create Guest")` to `button:has-text("Create")`

**Locations to Fix:**
1. Line ~112: Guest creation workflow
2. Line ~180: Multiple groups dropdown test
3. Line ~210: Validation errors test
4. Line ~240: Network errors test
5. Line ~280: Dropdown reactivity test
6. Line ~320: Async params test
7. Line ~360: Loading states test

**Expected Impact:** 7 tests should pass (58% → 100% for guest creation tests)

---

### Priority 2: Investigate Registration Tests (3 tests)

**Investigation Steps:**
1. Read `/auth/register` page implementation
2. Check form submission handler
3. Verify registration API endpoint
4. Check authentication flow
5. Verify redirect logic

**Options:**
1. **Fix registration** - Implement missing redirect logic
2. **Skip tests** - Mark as `.skip()` with TODO comment
3. **Update tests** - Change expectations to match actual behavior

---

## Implementation Plan

### Step 1: Apply Button Text Fix
```bash
# Update test file
# Replace all instances of 'button:has-text("Create Guest")' with 'button:has-text("Create")'
```

### Step 2: Run Tests
```bash
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts
```

### Step 3: Verify Results
- Expected: 9/12 passing (75%)
- Remaining failures: 3 registration tests

### Step 4: Investigate Registration
- Read registration page code
- Determine if feature is implemented
- Decide on fix vs skip

---

## Why This Wasn't Caught Earlier

### Test Maintenance Gap
1. **UI changed** - Button text changed from "Create Guest" to "Create"
2. **Tests not updated** - No one updated test selectors
3. **No component constants** - Button text hardcoded in multiple places

### Recommendations
1. **Use data-testid** - More stable than text selectors
2. **Centralize UI text** - Create constants file for button labels
3. **Update tests with UI changes** - Include test updates in UI PRs
4. **Add visual regression tests** - Catch UI changes automatically

---

## Expected Outcome

### After Priority 1 Fix:
- **Before:** 2/12 passing (16.7%)
- **After:** 9/12 passing (75%)
- **Improvement:** +7 tests, +58.3% pass rate

### After Priority 2 (if registration fixed):
- **Final:** 12/12 passing (100%)
- **Total Improvement:** +10 tests, +83.3% pass rate

### After Priority 2 (if registration skipped):
- **Final:** 9/12 passing (75%)
- **Skipped:** 3 tests with TODO comments
- **Effective Pass Rate:** 100% of implemented features

---

## Lessons Learned

### What Went Wrong
1. **Assumption-based tests** - Tests assumed button text without verification
2. **No UI text constants** - Button text scattered across codebase
3. **Incomplete feature** - Registration tests written before feature implemented
4. **No test maintenance** - UI changes didn't trigger test updates

### What Went Right
1. **Comprehensive investigation** - Detailed UI analysis identified exact issues
2. **Pattern-based approach** - Grouped failures by root cause
3. **Clear documentation** - Investigation findings well-documented

### Improvements Needed
1. **Test stability** - Use data-testid instead of text selectors
2. **Feature completeness** - Don't write tests for unimplemented features
3. **Test maintenance process** - Include test updates in UI change PRs
4. **Component documentation** - Document button text and selectors

---

## Next Steps

1. ✅ **Apply Priority 1 fix** - Update button text selectors
2. ⏳ **Run tests** - Verify 9/12 passing
3. ⏳ **Investigate registration** - Determine fix vs skip
4. ⏳ **Update documentation** - Record final status
5. ⏳ **Move to Pattern 5** - Email Management (22 failures)

---

## Files to Modify

1. `__tests__/e2e/guest/guestGroups.spec.ts` - Update button selectors
2. `E2E_PATTERN_4_GUEST_GROUPS_STATUS.md` - Update status
3. `E2E_COMPLETE_FAILURE_ANALYSIS.md` - Update Pattern 4 progress

---

## Conclusion

The primary issue is a simple selector mismatch - tests look for "Create Guest" but the button says "Create". This is a test maintenance issue, not an application bug. The fix is straightforward and will resolve 7 out of 10 failing tests.

The remaining 3 failures are registration tests that may be testing an unimplemented feature. Investigation needed to determine if registration should be fixed or tests should be skipped.

Pattern 4 is on track to reach 75-100% pass rate with these fixes.
