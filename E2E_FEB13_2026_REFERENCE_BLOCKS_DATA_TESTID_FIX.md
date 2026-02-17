# E2E Reference Blocks Test Fix - data-testid Solution

**Date:** February 13, 2026  
**Status:** ✅ EDIT BUTTON FIX SUCCESSFUL - New Issue Found  
**Issue:** Section Editor Edit button click not triggering React state update

## ✅ SUCCESS: Edit Button Fix Complete

The data-testid solution worked perfectly! The test now successfully:
1. Opens the section editor
2. Finds the Edit button using `data-testid="section-edit-button-{sectionId}"`
3. Clicks the button
4. Verifies the editing interface appears

### Test Output Confirms Success:
```
✓ Section editor container is visible
✓ No sections exist, creating first section
✓ Section fully rendered and ready for interaction
✓ Found section with ID: 488e1053-e742-4334-8e37-a29e46ca8bec
✓ Clicking Edit button to open editing interface
✓ Editing interface appeared after Edit button click
✓ All editing interface elements verified
```

## 🔍 New Issue Discovered

After fixing the Edit button, the test now fails at the next step:
- **Error:** `select#type-select` not found (timeout after 10 seconds)
- **Location:** After selecting "References" as column type
- **Component:** SimpleReferenceSelector

The SimpleReferenceSelector component needs time to load after the column type changes to "references". The test needs to wait longer or use a more robust waiting strategy.

## Problem Summary (Original Issue - NOW FIXED)

The E2E test `referenceBlocks.spec.ts` was failing because clicking the "Edit" button on sections wasn't opening the editing interface. The button text never changed from "Edit" to "Close", indicating the onClick handler wasn't being called.

### Root Cause

The test was using a generic selector `button:has-text("Edit")` which could match multiple buttons on the page. This ambiguity meant:
1. We might be clicking the wrong button
2. The selector might not be specific enough for Playwright to reliably target
3. Multiple retry strategies (force click, double click, etc.) all failed

## Solution Implemented

### 1. Added data-testid Attributes to SectionEditor Component

**File:** `components/admin/SectionEditor.tsx`

Added specific test IDs to all action buttons:
- `data-testid="section-edit-button-{section.id}"` - Edit/Close button
- `data-testid="section-view-button-{section.id}"` - View button  
- `data-testid="section-save-button-{section.id}"` - Save button
- `data-testid="section-delete-button-{section.id}"` - Delete button

```typescript
<Button
  size="sm"
  variant="secondary"
  onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
  data-testid={`section-edit-button-${section.id}`}
>
  {editingSection === section.id ? 'Close' : 'Edit'}
</Button>
```

### 2. Updated Test to Use Specific Selectors

**File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`

Modified the `openSectionEditor()` helper function to:
1. Wait for sections with data-testid attributes to appear
2. Query the DOM to find all section IDs
3. Use the first section's specific data-testid to click the Edit button
4. Verify the editing interface appears

```typescript
// Wait for at least one section with Edit button to appear
await page.waitForSelector('[data-testid^="section-edit-button-"]', { timeout: 10000 });

// Find the first section's ID from the DOM
const sectionIds = await page.evaluate(() => {
  const sections = document.querySelectorAll('[data-testid^="section-edit-button-"]');
  return Array.from(sections).map(el => {
    const testId = el.getAttribute('data-testid');
    return testId ? testId.replace('section-edit-button-', '') : null;
  }).filter(Boolean);
});

const firstSectionId = sectionIds[0];

// Use the specific data-testid to target the Edit button
const editSectionButton = page.locator(`[data-testid="section-edit-button-${firstSectionId}"]`);
await editSectionButton.click();
```

## Benefits of This Approach

1. **Eliminates Ambiguity:** Each button has a unique, specific selector
2. **No Timing Issues:** We wait for the specific element to exist before clicking
3. **Better Debugging:** Test IDs make it clear which element we're targeting
4. **Maintainable:** Test IDs are explicit contracts between tests and components
5. **Reliable:** No need for retry logic, force clicks, or workarounds

## Testing Status

- ✅ Component updated with data-testid attributes
- ✅ Test updated to use specific selectors
- ⏳ Running full test suite to verify fix

## Next Steps

1. Run all 8 reference blocks tests to verify they pass
2. If successful, document this pattern for other E2E tests
3. Consider adding data-testid attributes to other frequently-tested components

## Files Modified

1. `components/admin/SectionEditor.tsx` - Added data-testid attributes
2. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Updated test selectors
3. `E2E_FEB13_2026_REFERENCE_BLOCKS_DATA_TESTID_FIX.md` - This document

## Related Documents

- `E2E_FEB13_2026_REFERENCE_BLOCKS_DEEPER_INVESTIGATION.md` - Root cause analysis
- `E2E_FEB13_2026_REFERENCE_BLOCKS_EDIT_BUTTON_FIX.md` - First fix attempt (SimpleReferenceSelector)
- `E2E_FEB13_2026_REFERENCE_BLOCKS_CONTINUED_DEBUG.md` - Debugging session notes
