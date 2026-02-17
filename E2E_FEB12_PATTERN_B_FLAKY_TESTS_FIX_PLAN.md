# Pattern B: Flaky Tests Fix Plan

**Date**: February 12, 2026  
**Status**: ⏳ IN PROGRESS  
**Tests to Fix**: 12 flaky tests

---

## Root Cause Analysis

After examining the test files, the flaky tests have a common pattern:

### Primary Issues

1. **Excessive `waitForTimeout` usage**: Tests use arbitrary timeouts (500ms, 1000ms, 1500ms) instead of waiting for specific conditions
2. **Race conditions**: Tests don't wait for animations, state updates, or network requests to complete
3. **Missing wait conditions**: Tests click buttons before they're fully interactive
4. **Form state issues**: Tests don't wait for form validation or debounced updates

### Affected Areas

**Content Management (7 tests)**:
- Full creation flow
- Validation and slug conflicts
- Add/reorder sections
- Home page editing
- Inline section editor (2 tests)

**Other Areas (5 tests)**:
- Event references
- Room type capacity
- Email scheduling
- Section management
- Guest groups dropdown

---

## Fix Strategy

### Phase 1: Replace Arbitrary Timeouts (Quick - 30 minutes)

Replace all `waitForTimeout` with proper wait conditions:

```typescript
// ❌ BAD - Arbitrary timeout
await page.waitForTimeout(1000);

// ✅ GOOD - Wait for specific condition
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
await expect(element).toBeEnabled();
```

### Phase 2: Add Proper Wait Conditions (Medium - 1 hour)

Add wait conditions for:
- Form animations completing
- Network requests finishing
- State updates propagating
- Validation completing

```typescript
// Wait for form to be fully interactive
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('networkidle');

// Wait for element to be ready
await expect(element).toBeVisible({ timeout: 5000 });
await expect(element).toBeEnabled({ timeout: 3000 });

// Wait for network request
await page.waitForResponse(resp => resp.url().includes('/api/'));
```

### Phase 3: Fix Race Conditions (Medium - 30 minutes)

Ensure proper ordering:
1. Wait for page load
2. Wait for element visibility
3. Wait for element to be enabled
4. Perform action
5. Wait for result

---

## Implementation Plan

### Step 1: Content Management Tests (45 minutes)

Fix 7 flaky tests in `__tests__/e2e/admin/contentManagement.spec.ts`:

1. **Full creation flow** (lines 30-100)
   - Replace `waitForTimeout(1000)` with `waitForLoadState('networkidle')`
   - Replace `waitForTimeout(500)` with proper form validation wait
   - Replace `waitForTimeout(1500)` with element visibility check

2. **Validation and slug conflicts** (lines 122-162)
   - Add proper wait for validation errors
   - Wait for slug conflict detection

3. **Add/reorder sections** (lines 163-251)
   - Wait for section editor to load
   - Wait for drag-and-drop to complete

4. **Home page editing** (lines 252-280)
   - Wait for save operation to complete
   - Wait for "Last saved" text to appear

5. **Inline section editor - toggle** (lines 380-421)
   - Wait for editor to toggle
   - Wait for sections to be added

6. **Inline section editor - edit** (lines 422-480)
   - Wait for section to be added
   - Wait for content to be editable

7. **Event references** (lines 558-620)
   - Wait for reference picker to load
   - Wait for event to be added

### Step 2: Other Flaky Tests (30 minutes)

Fix 5 flaky tests in other files:

1. **Room type capacity** (`dataManagement.spec.ts:689`)
   - Fix form submission timing
   - Wait for validation errors

2. **Email scheduling** (`emailManagement.spec.ts:564`)
   - Wait for modal to close properly
   - Add proper success condition

3. **Section management** (`sectionManagement.spec.ts:635`)
   - Wait for section editor to load
   - Fix timeout issues

4. **Guest groups dropdown** (`guestGroups.spec.ts:162`)
   - Wait for dropdown to populate
   - Fix form state issues

5. **Responsive design zoom** (`accessibility/suite.spec.ts:722`)
   - Add proper viewport wait
   - Fix zoom detection

### Step 3: Verification (15 minutes)

Run flaky tests 3 times to verify stability:

```bash
# Run flaky tests only
npx playwright test --grep="should complete full content page creation|should validate required fields|should add and reorder sections|should edit home page settings|should toggle inline section editor|should edit section content|should create event and add as reference|should validate capacity|should show email history|should maintain consistent UI|should handle multiple groups|should support 200% zoom"

# Run 3 times to verify stability
for i in {1..3}; do
  echo "Run $i"
  npx playwright test --grep="flaky-pattern"
done
```

---

## Expected Results

### Before Fix
- 12 flaky tests (3.3%)
- Tests pass on retry but fail initially
- Arbitrary timeouts cause race conditions

### After Fix
- 0-2 flaky tests (<1%)
- Tests pass consistently on first run
- Proper wait conditions eliminate race conditions

### Pass Rate Impact
- Current: 238/362 (65.7%)
- After fix: 250/362 (69.1%) - assuming 12 flaky tests become stable

---

## Implementation

### Files to Modify

1. `__tests__/e2e/admin/contentManagement.spec.ts` (7 tests)
2. `__tests__/e2e/admin/dataManagement.spec.ts` (1 test)
3. `__tests__/e2e/admin/emailManagement.spec.ts` (1 test)
4. `__tests__/e2e/admin/sectionManagement.spec.ts` (1 test)
5. `__tests__/e2e/guest/guestGroups.spec.ts` (1 test)
6. `__tests__/e2e/accessibility/suite.spec.ts` (1 test)

### Changes to Make

For each flaky test:
1. Remove all `waitForTimeout` calls
2. Add `waitForLoadState('networkidle')` after navigation
3. Add proper element visibility/enabled checks
4. Add wait for network requests where needed
5. Add wait for animations to complete

---

## Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Content Management (7 tests) | 45 min | 45 min |
| Other Tests (5 tests) | 30 min | 75 min |
| Verification | 15 min | 90 min |
| **Total** | **90 min** | **1.5 hours** |

---

## Success Criteria

- [ ] All 12 flaky tests pass consistently (3 runs)
- [ ] No `waitForTimeout` in flaky test code
- [ ] Proper wait conditions for all async operations
- [ ] Tests run faster (no arbitrary delays)
- [ ] Pass rate improves to 69%+

---

## Next Steps After Fix

1. ✅ Verify flaky tests are stable
2. ⏳ Move to Phase 2: High Priority Patterns
   - Pattern C: Guest Authentication (9 tests)
   - Pattern D: UI Infrastructure (10 tests)
   - Pattern E: RSVP Flow (10 tests)

---

**Status**: Ready to implement  
**Estimated Time**: 1.5 hours  
**Expected Improvement**: +12 tests (3.3%)

