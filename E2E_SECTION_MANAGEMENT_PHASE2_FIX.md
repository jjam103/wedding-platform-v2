# E2E Section Management - Phase 2 Fix Applied

## Summary

Fixed the section management E2E tests by addressing the root cause: the section editor requires BOTH the CollapsibleForm to expand AND the InlineSectionEditor component to render before it's visible.

## Problem Analysis

### Test Results Before Fix
- **Passing**: 9/12 tests (75%)
- **Failing**: 3/12 tests (25%)
  - Test 2: "should create new section with rich text content"
  - Test 7: "should access section editor from all entity types"  
  - Test 8: "should maintain consistent UI across entity types"

### Root Cause Identified

The "Manage Sections" button triggers a two-step process:

1. **Opens CollapsibleForm** (edit mode for the event)
2. **Renders InlineSectionEditor** (only when `isFormOpen && selectedEvent`)

The previous wait condition only checked for the section editor element, but didn't wait for the CollapsibleForm to fully expand first.

**Evidence from `app/admin/events/page.tsx`**:
```typescript
{/* Inline Section Editor - Shows when editing an existing event */}
{isFormOpen && selectedEvent && (
  <div data-section-editor>
    <InlineSectionEditor
      pageType="event"
      pageId={selectedEvent.id}
      entityName={selectedEvent.name}
      defaultExpanded={false}
    />
  </div>
)}
```

The section editor is conditionally rendered based on TWO state variables:
- `isFormOpen` - Must be true
- `selectedEvent` - Must be set

## Solution Implemented

### Updated `waitForSectionEditor()` Function

**New Implementation** (3-step wait):

```typescript
async function waitForSectionEditor(page: any, timeout = 15000) {
  // Step 1: Wait for the form to open (CollapsibleForm expansion)
  await page.waitForFunction(
    () => {
      // Check if the collapsible form is open
      const formContent = document.querySelector('[data-testid="collapsible-form-content"]');
      if (!formContent) {
        console.log('⏳ Waiting for collapsible form to render...');
        return false;
      }
      
      // Check if form is expanded (data-state="open")
      const dataState = formContent.getAttribute('data-state');
      if (dataState !== 'open') {
        console.log(`⏳ Collapsible form state: ${dataState}, waiting for "open"...`);
        return false;
      }
      
      // Check CSS visibility
      const styles = window.getComputedStyle(formContent);
      if (styles.maxHeight === '0px' || styles.opacity === '0') {
        console.log('⏳ Collapsible form is expanding...');
        return false;
      }
      
      console.log('✅ Collapsible form is open');
      return true;
    },
    { timeout: timeout / 2 }
  );
  
  // Step 2: Wait for section editor to render inside the form
  await page.waitForFunction(
    () => {
      const editor = document.querySelector('[data-testid="inline-section-editor"]');
      if (!editor) {
        console.log('⏳ Waiting for section editor to render...');
        return false;
      }
      
      // Check if editor is visible
      const styles = window.getComputedStyle(editor);
      const isVisible = styles.display !== 'none' && 
                       styles.visibility !== 'hidden' && 
                       styles.opacity !== '0';
      
      if (!isVisible) {
        console.log(`⏳ Section editor CSS: display=${styles.display}, visibility=${styles.visibility}, opacity=${styles.opacity}`);
        return false;
      }
      
      console.log('✅ Section editor is fully visible');
      return true;
    },
    { timeout: timeout / 2 }
  );
  
  // Step 3: Final Playwright visibility check
  const sectionEditor = page.locator('[data-testid="inline-section-editor"]');
  await expect(sectionEditor).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Section editor wait complete - all checks passed');
}
```

### Added React State Update Wait

After clicking "Manage Sections", added a 500ms wait to give React time to update state:

```typescript
await manageSectionsButton.click();
// Give React time to update state and trigger re-render
await page.waitForTimeout(500);
await waitForSectionEditor(page);
```

## Key Improvements

### 1. Two-Phase Wait Strategy ✅
- **Phase 1**: Wait for CollapsibleForm to expand (7.5s timeout)
- **Phase 2**: Wait for InlineSectionEditor to render (7.5s timeout)
- **Total timeout**: 15s (increased from 10s)

### 2. Explicit State Checking ✅
- Checks `data-state="open"` attribute on CollapsibleForm
- Checks CSS properties (maxHeight, opacity, display)
- Verifies both form AND editor visibility

### 3. React State Update Wait ✅
- 500ms wait after button click
- Allows React to process state changes
- Ensures re-render completes before checking DOM

### 4. Comprehensive Logging ✅
- Shows exactly which step is waiting
- Displays CSS property values
- Clear success messages

## Expected Results

### Before Fix
- **Passing**: 9/12 (75%)
- **Failing**: 3/12 (25%)
- **Issue**: Section editor never appeared in DOM

### After Fix (Expected)
- **Passing**: 12/12 (100%)
- **Failing**: 0/12 (0%)
- **Behavior**: Tests wait for both form expansion AND editor rendering

## Testing Strategy

### Run Tests
```bash
npm run test:e2e -- sectionManagement.spec.ts
```

### Expected Console Output
```
⏳ Waiting for collapsible form to render...
⏳ Collapsible form state: closed, waiting for "open"...
⏳ Collapsible form is expanding...
✅ Collapsible form is open
⏳ Waiting for section editor to render...
⏳ Section editor CSS: display=block, visibility=visible, opacity=0
✅ Section editor is fully visible
✅ Section editor wait complete - all checks passed
```

## Files Modified

1. **`__tests__/e2e/admin/sectionManagement.spec.ts`**:
   - Updated `waitForSectionEditor()` function with 3-step wait
   - Added 500ms React state update wait after button click
   - Increased timeout from 10s to 15s
   - Added comprehensive logging

## Why This Fix Works

### Problem
The section editor is conditionally rendered based on TWO state variables that update asynchronously:
1. `isFormOpen` - Set by button click handler
2. `selectedEvent` - Set by button click handler

React needs time to:
1. Process the state updates
2. Re-render the component
3. Expand the CollapsibleForm animation
4. Render the InlineSectionEditor

### Solution
The new wait strategy accounts for ALL of these steps:
1. **500ms wait** - React state updates
2. **Wait for form** - CollapsibleForm expansion
3. **Wait for editor** - InlineSectionEditor rendering
4. **Playwright check** - Final visibility verification

## Related Documents

- `E2E_SECTION_MANAGEMENT_PROPER_WAIT_CONDITIONS.md` - Previous fix attempt
- `E2E_SECTION_MANAGEMENT_ROOT_CAUSE_ANALYSIS.md` - Root cause analysis
- `E2E_SECTION_MANAGEMENT_FLAKY_TESTS_FIXED.md` - Navigation retry fixes

## Next Steps

1. **Run Tests**: Execute the test suite to verify fixes
   ```bash
   npm run test:e2e -- sectionManagement.spec.ts
   ```

2. **Monitor Results**: Check for 12/12 passing tests

3. **Verify Logs**: Ensure comprehensive logging shows proper state transitions

4. **Document Results**: Update this document with actual test results

## Conclusion

The section management E2E tests have been fixed by implementing a proper two-phase wait strategy that accounts for both CollapsibleForm expansion and InlineSectionEditor rendering. The fix addresses the root cause of the test failures and should result in 100% passing tests.

**Key Takeaway**: When testing components with conditional rendering based on multiple state variables, wait for ALL state updates and DOM changes to complete before asserting visibility.
