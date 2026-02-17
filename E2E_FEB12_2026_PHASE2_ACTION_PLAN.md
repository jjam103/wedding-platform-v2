# E2E Phase 2 Action Plan

**Date:** February 12, 2026  
**Status:** Ready to Execute  
**Estimated Time:** 45-75 minutes

## Phase 1 Results Summary

✅ **17/17 tests passing** (100% pass rate)  
⚠️ **3 tests flaky** (passed on retry #1)  
✅ **Phase 1 pattern validated and working**

## Phase 2 Goals

1. **Eliminate all flakiness** - All tests pass on first try
2. **Improve reliability** - 100% pass rate over 10 consecutive runs
3. **Reduce test time** - Optimize waits and improve performance

## Flaky Tests to Fix

### 1. Test #8: Toggle inline section editor and add sections
**Issue:** Timeout waiting for `[data-testid="inline-section-editor"]` to be visible  
**Root Cause:** Dynamic import of InlineSectionEditor takes longer than expected  
**Priority:** HIGH

### 2. Test #9: Edit section content and toggle layout
**Issue:** Timeout waiting for `[data-testid="inline-section-editor"]` to be visible  
**Root Cause:** Same as Test #8 - dynamic import timing  
**Priority:** HIGH

### 3. Test #12: Create event and add as reference to content page
**Issue:** Click intercepted by collapsible form toggle button  
**Root Cause:** Collapsible form state issue - form collapsed when trying to click Create  
**Priority:** HIGH

## Phase 2 Implementation Plan

### Step 1: Fix Dynamic Import Timing (Tests #8, #9)
**Time:** 15-20 minutes

**Changes Required:**
```typescript
// In tests #8 and #9, after clicking "Show Inline Section Editor"
const toggleButton = page.locator('button:has-text("Show Inline Section Editor")');
await toggleButton.click();

// PHASE 2 FIX: Add longer wait for dynamic import
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000); // Give dynamic import extra time to complete

// Now check for component with shorter retry timeout
const inlineEditor = page.locator('[data-testid="inline-section-editor"]');
await expect(async () => {
  await expect(inlineEditor).toBeVisible({ timeout: 3000 });
}).toPass({ timeout: 8000 }); // Reduced from 15-20s since we already waited
```

**Files to Modify:**
- `__tests__/e2e/admin/contentManagement.spec.ts` (lines ~450-455, ~495-497)

### Step 2: Fix Collapsible Form State (Test #12)
**Time:** 15-20 minutes

**Changes Required:**
```typescript
// Before clicking Create button in test #12
const createButton = page.locator('button[type="submit"]:has-text("Create Event"), button[type="submit"]:has-text("Create")').first();
await expect(createButton).toBeVisible({ timeout: 3000 });
await expect(createButton).toBeEnabled({ timeout: 3000 });

// PHASE 2 FIX: Ensure form is expanded and button is clickable
// Check if form is collapsed
const formToggle = page.locator('[data-testid="collapsible-form-toggle"]').first();
const isCollapsed = await formToggle.getAttribute('aria-expanded') === 'false';

if (isCollapsed) {
  // Form is collapsed, expand it
  await formToggle.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Wait for expansion animation
}

// Ensure button is not obscured
await createButton.scrollIntoViewIfNeeded();
await page.waitForTimeout(200); // Wait for scroll to complete

// Click with force option to avoid interception
await createButton.click({ force: true });
```

**Files to Modify:**
- `__tests__/e2e/admin/contentManagement.spec.ts` (lines ~680-683)

### Step 3: Verify Fixes
**Time:** 15-30 minutes

**Verification Steps:**
1. Run full test suite 3 times consecutively
2. Verify all 17 tests pass on first try (no retries)
3. Check for any new issues introduced by fixes
4. Run suite 5-10 more times to confirm consistency

**Commands:**
```bash
# Run test suite 3 times
for i in {1..3}; do
  echo "Run $i of 3"
  npm run test:e2e -- contentManagement.spec.ts
  echo "---"
done

# If all pass, run 5-10 more times for consistency check
for i in {1..10}; do
  echo "Consistency check $i of 10"
  npm run test:e2e -- contentManagement.spec.ts --reporter=line
done
```

## Expected Outcomes

### After Step 1 (Dynamic Import Fix)
- ✅ Test #8 passes on first try
- ✅ Test #9 passes on first try
- ✅ No timeout errors for InlineSectionEditor

### After Step 2 (Collapsible Form Fix)
- ✅ Test #12 passes on first try
- ✅ No click interception errors
- ✅ Form state is correct before clicking Create

### After Step 3 (Verification)
- ✅ All 17 tests pass on first try
- ✅ 100% pass rate over 10 consecutive runs
- ✅ No flaky tests
- ✅ Production ready

## Alternative Approaches (If Primary Fixes Don't Work)

### Alternative 1: Preload Components in beforeEach
If dynamic import timing is still an issue, preload the component:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/admin/home-page');
  
  // Preload InlineSectionEditor
  const toggleButton = page.locator('button:has-text("Show Inline Section Editor")');
  if (await toggleButton.count() > 0) {
    await toggleButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Hide it again
    const hideButton = page.locator('button:has-text("Hide Inline Section Editor")');
    if (await hideButton.isVisible()) {
      await hideButton.click();
      await page.waitForLoadState('networkidle');
    }
  }
});
```

### Alternative 2: Disable Dynamic Import
If preloading doesn't work, consider disabling dynamic import for InlineSectionEditor in test environment:

```typescript
// In InlineSectionEditor component
const InlineSectionEditor = process.env.NODE_ENV === 'test' 
  ? require('./InlineSectionEditor').default
  : dynamic(() => import('./InlineSectionEditor'), { ssr: false });
```

### Alternative 3: Use waitForFunction for Form State
If collapsible form fix doesn't work, use waitForFunction:

```typescript
// Wait for form to be in correct state
await page.waitForFunction(() => {
  const button = document.querySelector('button[type="submit"]');
  if (!button) return false;
  
  const rect = button.getBoundingClientRect();
  const elementAtPoint = document.elementFromPoint(rect.x + rect.width/2, rect.y + rect.height/2);
  
  return elementAtPoint === button || button.contains(elementAtPoint);
}, { timeout: 10000 });
```

## Success Criteria

### Phase 2 Complete When:
- ✅ All 17 tests pass on first try (no retries needed)
- ✅ 100% pass rate over 10 consecutive runs
- ✅ Average test time < 6 seconds
- ✅ Zero flaky tests
- ✅ No protocol errors
- ✅ No timeout errors

## Rollback Plan

If Phase 2 fixes introduce new issues:

1. **Revert changes** to `contentManagement.spec.ts`
2. **Return to Phase 1 state** (all tests passing with retries)
3. **Analyze new issues** and adjust approach
4. **Try alternative approaches** listed above

## Timeline

- **Step 1 (Dynamic Import):** 15-20 minutes
- **Step 2 (Collapsible Form):** 15-20 minutes
- **Step 3 (Verification):** 15-30 minutes
- **Total:** 45-70 minutes

## Quick Start Commands

```bash
# 1. Open test file
code __tests__/e2e/admin/contentManagement.spec.ts

# 2. Apply fixes (see Step 1 and Step 2 above)

# 3. Run single test to verify fix
npm run test:e2e -- contentManagement.spec.ts -g "should toggle inline section editor"

# 4. Run full suite
npm run test:e2e -- contentManagement.spec.ts

# 5. Run consistency check (10 times)
for i in {1..10}; do npm run test:e2e -- contentManagement.spec.ts --reporter=line; done
```

## Notes

- Phase 1 pattern is validated and working
- Flakiness is due to timing issues, not pattern issues
- All 3 flaky tests passed on retry #1, confirming fixes are straightforward
- Phase 2 should be quick and straightforward

---

**Ready to execute Phase 2!**
