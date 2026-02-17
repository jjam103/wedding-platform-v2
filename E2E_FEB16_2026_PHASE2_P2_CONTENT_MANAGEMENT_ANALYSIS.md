# E2E Phase 2 P2 - Content Management Test Analysis

**Date**: February 16, 2026  
**File**: `__tests__/e2e/admin/contentManagement.spec.ts`  
**Status**: Ready for systematic replacement

---

## Current State

### Already Imported
✅ Wait helpers are already imported:
```typescript
import {
  waitForStyles,
  waitForCondition,
  waitForElementStable,
  waitForModalClose,
  waitForApiResponse,
} from '../../helpers/waitHelpers';
```

### Manual Timeouts Found

Total manual timeouts: **15 occurrences**

#### Breakdown by Location

1. **Line 1000** - `await page.waitForTimeout(1000);` - Wait for cleanup
2. **Line 1037** - `await page.waitForTimeout(500);` - Wait for content to be set
3. **Line 1039** - `await page.waitForTimeout(500);` - Wait for content to be set
4. **Line 1095** - `await page.waitForTimeout(1000);` - Wait for cleanup
5. **Line 1113** - `await page.waitForTimeout(1000);` - Wait for page to be interactive
6. **Line 1120** - `await page.waitForTimeout(200);` - Wait for scroll
7. **Line 1123** - `await page.waitForTimeout(500);` - Wait for state change
8. **Line 1149** - `await page.waitForTimeout(2000);` - Wait for new section
9. **Line 1181** - `await page.waitForTimeout(1000);` - Wait for page to be interactive
10. **Line 1188** - `await page.waitForTimeout(200);` - Wait for scroll
11. **Line 1191** - `await page.waitForTimeout(500);` - Wait for state change
12. **Line 1203** - `await page.waitForTimeout(2000);` - Wait for section to be added
13. **Line 1204** - `await page.waitForSelector(...)` - Already using proper wait
14. **Line 1239** - `await page.waitForTimeout(1000);` - Wait for page to be interactive
15. **Line 1246** - `await page.waitForTimeout(200);` - Wait for scroll
16. **Line 1249** - `await page.waitForTimeout(500);` - Wait for state change

---

## Replacement Strategy

### Pattern 1: Cleanup Waits (Lines 1000, 1095)
```typescript
// ❌ Before:
await page.waitForTimeout(1000);

// ✅ After:
await waitForStyles(page);
await page.waitForLoadState('networkidle');
```

### Pattern 2: Content Setting Waits (Lines 1037, 1039)
```typescript
// ❌ Before:
await editor.clear();
await page.waitForTimeout(500);
await editor.fill('Welcome to our wedding celebration in Costa Rica!');
await page.waitForTimeout(500);

// ✅ After:
await editor.clear();
await waitForCondition(async () => {
  const value = await editor.inputValue();
  return value === '';
}, 2000);
await editor.fill('Welcome to our wedding celebration in Costa Rica!');
await waitForCondition(async () => {
  const value = await editor.inputValue();
  return value.includes('Welcome');
}, 2000);
```

### Pattern 3: React Hydration Waits (Lines 1113, 1181, 1239)
```typescript
// ❌ Before:
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// ✅ After:
await page.waitForLoadState('networkidle');
await waitForStyles(page);
await waitForCondition(async () => {
  const button = page.locator('button:has-text("Show Inline Section Editor")');
  return await button.isEnabled();
}, 5000);
```

### Pattern 4: Scroll Waits (Lines 1120, 1188, 1246)
```typescript
// ❌ Before:
await toggleButton.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);

// ✅ After:
await toggleButton.scrollIntoViewIfNeeded();
await waitForElementStable(page, toggleButton);
```

### Pattern 5: State Change Waits (Lines 1123, 1191, 1249)
```typescript
// ❌ Before:
await toggleButton.click({ force: true });
await page.waitForTimeout(500);

// ✅ After:
await toggleButton.click({ force: true });
await waitForCondition(async () => {
  const hideButton = page.locator('button:has-text("Hide Inline Section Editor")');
  return await hideButton.isVisible();
}, 5000);
```

### Pattern 6: Section Addition Waits (Lines 1149, 1203)
```typescript
// ❌ Before:
await addSectionButton.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// ✅ After:
await addSectionButton.click();
await page.waitForLoadState('networkidle');
await waitForCondition(async () => {
  const sections = page.locator('[data-testid="inline-section-editor"] [draggable="true"]');
  return await sections.count() > sectionsBefore;
}, 5000);
```

---

## Test Structure

### Test Suites
1. **Content Page Management** (3 tests)
   - Full creation and publication flow
   - Validation and slug conflicts
   - Add and reorder sections

2. **Home Page Editing** (4 tests)
   - Edit settings and save
   - Edit welcome message with rich text
   - Handle API errors gracefully
   - Preview home page in new tab

3. **Inline Section Editor** (4 tests)
   - Toggle and add sections
   - Edit section content and toggle layout
   - Delete section with confirmation
   - Add photo gallery and reference blocks

4. **Event References** (2 tests)
   - Create event and add as reference
   - Search and filter events in reference lookup

5. **Content Management Accessibility** (4 tests)
   - Keyboard navigation in content pages
   - ARIA labels and form labels
   - Keyboard navigation in home page editor
   - Keyboard navigation in reference lookup

**Total Tests**: 17 tests

---

## Execution Plan

### Step 1: Replace Cleanup Waits (2 occurrences)
- Lines 1000, 1095
- Replace with `waitForStyles()` + `networkidle`

### Step 2: Replace Content Setting Waits (2 occurrences)
- Lines 1037, 1039
- Replace with `waitForCondition()` checking input value

### Step 3: Replace React Hydration Waits (3 occurrences)
- Lines 1113, 1181, 1239
- Replace with `waitForStyles()` + `waitForCondition()` checking button enabled

### Step 4: Replace Scroll Waits (3 occurrences)
- Lines 1120, 1188, 1246
- Replace with `waitForElementStable()`

### Step 5: Replace State Change Waits (3 occurrences)
- Lines 1123, 1191, 1249
- Replace with `waitForCondition()` checking button text change

### Step 6: Replace Section Addition Waits (2 occurrences)
- Lines 1149, 1203
- Replace with `waitForCondition()` checking section count

---

## Expected Results

### Before
- 15 manual timeouts
- ~7.5 seconds of arbitrary waiting per test run
- Potential for flaky failures

### After
- 0 manual timeouts
- ~30+ semantic wait conditions
- Faster execution (wait only as long as needed)
- More reliable tests
- Better error messages

---

## Next Steps

1. Create backup of current file
2. Apply replacements systematically (one pattern at a time)
3. Run tests after each pattern to verify
4. Document results
5. Update progress tracker

---

**Status**: Analysis Complete ✅  
**Ready to Begin**: Yes  
**Estimated Time**: 2-3 hours

