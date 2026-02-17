# E2E Reference Blocks Tests - Section Editor UI Not Loading

**Date**: February 13, 2026  
**Status**: ROOT CAUSE IDENTIFIED - Tests need to be fixed  
**Previous Issue**: RLS policy fixed (migration 056 applied)  
**Current Issue**: Tests don't match actual UI flow

---

## Problem Summary

After fixing RLS policies, all 8 reference blocks E2E tests now fail at a NEW point:

```
Error: expect(locator).toBeVisible() failed
Locator: locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

**What works**:
- ✅ Tests authenticate as admin
- ✅ Tests navigate to `/admin/content-pages`
- ✅ Tests click "Edit" button (RLS working!)
- ✅ Tests click "Manage Sections" button
- ✅ Section editor appears inline

**What fails**:
- ❌ Column type selector dropdown never appears
- ❌ Tests timeout waiting for the selector

---

## Root Cause Analysis

### Actual UI Flow (from code inspection)

Looking at `app/admin/content-pages/page.tsx` and `components/admin/SectionEditor.tsx`:

1. **Click "Manage Sections"** → Section editor appears inline below the page row
2. **Section editor shows**:
   - List of existing sections (if any)
   - "Add Section" button
   - Each section has: View / Edit / Delete buttons
3. **Click "Edit" on a section** → Editing interface expands
4. **ONLY THEN** → Column type selector appears

### What Tests Are Doing (WRONG)

```typescript
// 1. Click "Manage Sections" ✅
await manageSectionsButton.click();

// 2. Immediately look for column type selector ❌ WRONG!
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
await expect(columnTypeSelect).toBeVisible(); // FAILS - selector doesn't exist yet!
```

### What Tests SHOULD Do (CORRECT)

```typescript
// 1. Click "Manage Sections" ✅
await manageSectionsButton.click();

// 2. Check if sections exist, if not add one
const addSectionButton = page.locator('button:has-text("Add Section")').first();
const hasAddButton = await addSectionButton.isVisible();
if (hasAddButton) {
  await addSectionButton.click();
  await page.waitForTimeout(500);
}

// 3. Click "Edit" button on the section ✅ MISSING STEP!
const editButton = page.locator('button:has-text("Edit")').first();
await editButton.click();
await page.waitForTimeout(500);

// 4. NOW find the column type selector ✅
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
await expect(columnTypeSelect).toBeVisible();
```

---

## Evidence from Code

### SectionEditor Component Structure

```typescript
// Section header - ALWAYS visible
<div className="flex items-center justify-between p-4">
  <div>Section #{index + 1}</div>
  <div className="flex gap-2">
    <Button onClick={() => setViewingSection(...)}>View</Button>
    <Button onClick={() => setEditingSection(...)}>Edit</Button>  // ← MUST CLICK THIS
    <Button onClick={() => handleDeleteSection(...)}>Delete</Button>
  </div>
</div>

// Edit mode - ONLY visible when editingSection === section.id
{editingSection === section.id && (
  <div className="border-t border-gray-200 p-4">
    {/* Column type selector appears HERE */}
    <select value={column.content_type} ...>
      <option value="rich_text">Rich Text</option>
      <option value="photo_gallery">Photo Gallery</option>
      <option value="references">References</option>  // ← This is what tests are looking for
    </select>
  </div>
)}
```

---

## Test Fixes Required

All 8 tests in `__tests__/e2e/admin/referenceBlocks.spec.ts` need the same fix:

### Before (WRONG)
```typescript
await manageSectionsButton.click();
await page.waitForTimeout(500);

// Immediately look for column type selector - FAILS!
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
await expect(columnTypeSelect).toBeVisible();
```

### After (CORRECT)
```typescript
await manageSectionsButton.click();
await page.waitForTimeout(500);

// Check if we need to add a section first
const addSectionButton = page.locator('button:has-text("Add Section")').first();
const hasAddButton = await addSectionButton.isVisible().catch(() => false);
if (hasAddButton) {
  await addSectionButton.click();
  await page.waitForTimeout(500);
}

// Click "Edit" button to open the editing interface
const editButton = page.locator('button:has-text("Edit")').first();
await expect(editButton).toBeVisible({ timeout: 5000 });
await editButton.click();
await page.waitForTimeout(500);

// NOW find the column type selector
const columnTypeSelect = page.locator('select').filter({ hasText: /Rich Text|Photo Gallery|References/ }).first();
await expect(columnTypeSelect).toBeVisible({ timeout: 5000 });
```

---

## Tests That Need Fixing

All 8 tests in `__tests__/e2e/admin/referenceBlocks.spec.ts`:

1. ✅ `should create event reference block`
2. ✅ `should create activity reference block`
3. ✅ `should create multiple reference types in one section`
4. ✅ `should remove reference from section`
5. ✅ `should filter references by type in picker`
6. ✅ `should prevent circular references`
7. ✅ `should detect broken references`
8. ✅ `should display reference blocks in guest view with preview modals`

---

## Next Steps

1. ✅ Update all 8 tests to include the "Edit" button click step
2. ✅ Run tests to verify they now pass
3. ✅ Document the correct UI flow for future test writers

---

## Why This Wasn't Caught Earlier

The tests were written based on an assumption about the UI flow that didn't match the actual implementation. The inline section editor design (where sections expand/collapse) requires an explicit "Edit" click that wasn't in the test flow.

This is a good example of why E2E tests need to match the actual user experience, not assumptions about how the UI "should" work.
