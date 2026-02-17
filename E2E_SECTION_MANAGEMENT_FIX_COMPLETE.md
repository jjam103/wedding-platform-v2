# E2E Section Management Test Fix - Complete

## Problem
The E2E test "should handle entity-specific section features" was failing with a timeout error when trying to detect the section editor on the Events page.

## Root Cause
The `waitForSectionEditor()` helper function wasn't properly detecting the section editor on the Events page because:

1. **Events page uses a unique structure**: The Events page wraps the InlineSectionEditor in a `[data-section-editor]` div, which is different from other pages
2. **Wrong selector used**: The test was looking for `[data-collapsible-form]` which doesn't exist in the actual CollapsibleForm component
3. **Missing detection branch**: The helper function only checked for two cases (`[data-testid="inline-section-editor"]` and `[data-testid="section-editor"]`) but not the third case (`[data-section-editor]` wrapper)

## Solution Applied

### 1. Updated `waitForSectionEditor()` Function
Added a third detection branch to handle the Events page structure:

```typescript
const hasDataSectionEditor = await page.locator('[data-section-editor]').count() > 0;

if (hasDataSectionEditor) {
  // Events page uses [data-section-editor] wrapper with InlineSectionEditor inside
  console.log('📝 Detected [data-section-editor] wrapper - waiting for CollapsibleForm and InlineSectionEditor...');
  
  // Step 1: Wait for the CollapsibleForm to open
  await page.waitForFunction(
    () => {
      const formContent = document.querySelector('[data-testid="collapsible-form-content"]');
      if (!formContent) return false;
      
      const state = formContent.getAttribute('data-state');
      if (state !== 'open') return false;
      
      return true;
    },
    { timeout: timeout / 3 }
  );
  
  // Step 2: Wait for the [data-section-editor] wrapper to be visible
  // Step 3: Wait for InlineSectionEditor inside the wrapper
  // ... (full implementation in code)
}
```

### 2. Fixed Selector References
Changed all references from `[data-collapsible-form]` to `[data-testid="collapsible-form-content"]` to match the actual CollapsibleForm component implementation.

### 3. Simplified Test Code
Removed redundant wait logic from the test itself and delegated all waiting to the `waitForSectionEditor()` helper:

```typescript
if (hasEventsButton) {
  await eventsButton.click();
  await waitForSectionEditor(page);  // Helper handles all the waiting
  // ... rest of test
}
```

## How the Events Page Works

1. User clicks "Manage Sections" button
2. Button calls `handleRowClick(event)` which opens the CollapsibleForm
3. CollapsibleForm expands with `data-state="open"` on `[data-testid="collapsible-form-content"]`
4. Inside the form, there's a `[data-section-editor]` wrapper div
5. Inside that wrapper is the InlineSectionEditor component

## Test Results

✅ **Test now passes consistently**

```
1 passed (20.2s)
```

The test successfully:
- Navigates to the Events page
- Clicks "Manage Sections" button
- Waits for the CollapsibleForm to open
- Detects the section editor wrapper
- Verifies the InlineSectionEditor is visible
- Completes all test assertions

## Files Modified

- `__tests__/e2e/admin/sectionManagement.spec.ts`
  - Updated `waitForSectionEditor()` function (lines 1-165)
  - Added `hasDataSectionEditor` detection branch
  - Fixed selector from `[data-collapsible-form]` to `[data-testid="collapsible-form-content"]`
  - Simplified test code at line 731

## Key Learnings

1. **Different pages use different section editor patterns**:
   - Events page: `[data-section-editor]` wrapper → InlineSectionEditor
   - Activities page: Direct SectionEditor component
   - Content Pages: Direct InlineSectionEditor

2. **Always check actual component implementation**: The test was using `[data-collapsible-form]` but the actual component uses `[data-testid="collapsible-form-content"]`

3. **Helper functions should handle all variations**: The `waitForSectionEditor()` function now properly handles all three section editor patterns across different admin pages

## Verification

To verify the fix works:

```bash
npx playwright test __tests__/e2e/admin/sectionManagement.spec.ts --grep "should handle entity-specific section features"
```

Expected result: ✅ 1 passed
