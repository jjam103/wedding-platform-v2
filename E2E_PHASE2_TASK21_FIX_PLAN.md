# E2E Phase 2 - Task 2.1 Fix Plan

**Date**: February 5, 2026
**Current Status**: 11/18 passing (61%)
**Target**: 18/18 passing (100%)

## Investigation Results

### ✅ Content Pages Button Selector
**Status**: CORRECT
- Test uses: `button:has-text("Add Page")`
- Actual button text: "Add Page"
- **No fix needed** - selector is correct

### ✅ Home Page Editor Structure
**Status**: CORRECT
- Test uses: `input#title`, `input#subtitle`, `input#heroImageUrl`
- Actual IDs match exactly
- **No fix needed** - selectors are correct

## Root Cause Analysis

The tests are failing due to **timing/loading issues**, not selector problems:

1. **Tests 1-3** (Content Page Creation): Likely failing because page hasn't fully loaded before clicking
2. **Test 4** (Home Page Editor): May be navigation timing issue
3. **Tests 5-6** (Section Editor): Elements exist but not visible - likely rendering/timing
4. **Test 7** (Event Creation): Event list not refreshing after creation

## Fix Strategy

### Phase 1: Add Better Wait Conditions
Replace `waitForTimeout` with proper `waitFor` conditions:
- Wait for network idle
- Wait for specific elements to be visible
- Wait for API responses

### Phase 2: Fix Section Editor Visibility
Investigate why layout selector and reference selector are hidden:
- Check CSS visibility
- Check conditional rendering logic
- Ensure proper state initialization

### Phase 3: Fix Event List Refresh
Ensure event list refreshes after creation:
- Check if refetch is called
- Add explicit wait for new event to appear

## Detailed Fixes

### Fix 1: Content Page Tests (1-3)
**File**: `__tests__/e2e/admin/contentManagement.spec.ts`
**Changes**:
```typescript
// Before
await page.goto('http://localhost:3000/admin/content-pages');
const addButton = page.locator('button:has-text("Add Page")').first();
await addButton.click();

// After
await page.goto('http://localhost:3000/admin/content-pages');
await page.waitForLoadState('networkidle');
await expect(page.locator('h1:has-text("Content Pages")')).toBeVisible();
const addButton = page.locator('button:has-text("Add Page")').first();
await expect(addButton).toBeVisible({ timeout: 5000 });
await addButton.click();
```

### Fix 2: Home Page Editor Test (4)
**File**: `__tests__/e2e/admin/contentManagement.spec.ts`
**Changes**:
```typescript
// Add at start of test
await page.waitForLoadState('networkidle');
await expect(page.locator('h1:has-text("Home Page Editor")')).toBeVisible({ timeout: 10000 });

// Before each input interaction
await expect(titleInput).toBeVisible();
await expect(titleInput).toBeEnabled();
```

### Fix 3: Section Editor Layout Selector (5)
**File**: `components/admin/SectionEditor.tsx` or test
**Investigation needed**:
1. Check if layout selector is conditionally rendered
2. Check if it's hidden by CSS
3. Verify section editor state initialization

**Test fix** (temporary):
```typescript
// Wait for section editor to fully render
await page.waitForTimeout(1000);
await page.waitForLoadState('networkidle');

// Ensure layout select is visible
const layoutSelect = page.locator('select').last();
await expect(layoutSelect).toBeVisible({ timeout: 5000 });
await layoutSelect.selectOption('two-column');
```

### Fix 4: Reference Selector Visibility (6)
**File**: `components/admin/SectionEditor.tsx` or test
**Investigation needed**:
1. Check if reference selector is in a collapsed section
2. Check if it requires a specific action to show
3. Verify it's not hidden by default

**Test fix** (temporary):
```typescript
// May need to click something to show reference selector
const addReferenceButton = page.locator('button:has-text("Add Reference")');
if (await addReferenceButton.count() > 0) {
  await addReferenceButton.click();
  await page.waitForTimeout(500);
}

const referenceSelector = page.locator('text=/Select|Reference/i').first();
await expect(referenceSelector).toBeVisible({ timeout: 5000 });
```

### Fix 5: Event List Refresh (7)
**File**: `__tests__/e2e/admin/contentManagement.spec.ts`
**Changes**:
```typescript
// After creating event
await page.waitForResponse(
  response => response.url().includes('/api/admin/events') && response.status() === 201
);

// Wait for list to refresh
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Allow time for refetch

const eventRow = page.locator(`text=${eventName}`).first();
await expect(eventRow).toBeVisible({ timeout: 10000 });
```

## Implementation Order

1. **Fix timing issues** (Tests 1-4, 7) - Add proper wait conditions
2. **Investigate section editor** (Tests 5-6) - Check component rendering
3. **Run tests** - Verify fixes work
4. **Iterate** - Fix any remaining issues

## Success Criteria

- All 18 tests passing
- No flaky tests (run 3x to verify)
- Proper wait conditions (no arbitrary timeouts)
- Tests complete in reasonable time (<2 minutes)
