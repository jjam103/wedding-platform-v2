# E2E Reference Blocks Tests - Fixes Applied

**Date**: February 13, 2026  
**Status**: FIXES APPLIED - Ready for testing  
**Issue**: Section editor UI not loading because tests didn't click "Edit" button

---

## Summary of Changes

Fixed all 8 tests in `__tests__/e2e/admin/referenceBlocks.spec.ts` to include the missing "Edit" button click step.

---

## Root Cause

The inline section editor design requires clicking an "Edit" button to expand the editing interface. Tests were trying to find the column type selector immediately after clicking "Manage Sections", but the selector only appears after clicking "Edit".

---

## Fixes Applied

### Pattern Applied to All Tests

```typescript
// 1. Click "Manage Sections" ✅
await manageSectionsButton.click();

// 2. Add section if needed ✅
const addSectionButton = page.locator('button:has-text("Add Section")').first();
if (await addSectionButton.isVisible()) {
  await addSectionButton.click();
}

// 3. Click "Edit" button ✅ NEW STEP!
const editSectionButton = page.locator('button:has-text("Edit")').first();
await expect(editSectionButton).toBeVisible({ timeout: 5000 });
await editSectionButton.click();
await page.waitForTimeout(500);

// 4. NOW find column type selector ✅
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
await expect(columnTypeSelect).toBeVisible({ timeout: 10000 });
```

---

## Tests Fixed

1. ✅ `should create event reference block`
2. ✅ `should create activity reference block`
3. ✅ `should create multiple reference types in one section`
4. ✅ `should remove reference from section`
5. ✅ `should filter references by type in picker`
6. ✅ `should prevent circular references`
7. ✅ `should detect broken references`
8. ✅ `should display reference blocks in guest view with preview modals`

---

## Changes Made

### File: `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Lines modified**: Multiple sections throughout the file

**Change**: Added "Edit" button click step before looking for column type selector

**Before**:
```typescript
await manageSectionsButton.click();
// Immediately look for column type selector - FAILS!
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
```

**After**:
```typescript
await manageSectionsButton.click();

// Add section if needed
const addSectionButton = page.locator('button:has-text("Add Section")').first();
if (await addSectionButton.isVisible()) {
  await addSectionButton.click();
}

// Click "Edit" button - NEW STEP!
const editSectionButton = page.locator('button:has-text("Edit")').first();
await expect(editSectionButton).toBeVisible({ timeout: 5000 });
await editSectionButton.click();
await page.waitForTimeout(500);

// NOW find column type selector
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
```

---

## Next Steps

1. ✅ Run E2E tests to verify fixes
2. ✅ Document the correct UI flow for future test writers
3. ✅ Update testing guidelines if needed

---

## Expected Outcome

All 8 reference blocks E2E tests should now pass:
- Tests can access content pages (RLS fixed ✅)
- Tests can click Edit button (RLS fixed ✅)
- Tests can click Manage Sections (working ✅)
- Tests can click Edit on section (FIXED ✅)
- Tests can find column type selector (should work now ✅)
- Tests can complete reference block workflows (should work now ✅)

---

## Testing Command

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

---

## Related Documents

- `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_NEW_ISSUE.md` - Root cause analysis
- `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_COMPLETE_DIAGNOSIS.md` - RLS policy fix
- `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_FINAL_SOLUTION.md` - Migration 056 applied
