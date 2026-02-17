# E2E Content Management Product Fixes

## Current Status
- **Pass Rate**: 88% (15/17 tests passing) ⬆️ from 82%
- **Failed Tests**: 2
- **Flaky Tests**: 0 ✅ (was 1)

## Progress Made

### ✅ Fixed: Inline Section Editor Flakiness
**Test**: "should edit section content and toggle layout"

**Fix Applied**: Added `data-testid="section-item"` to section containers for reliable selection.

**Result**: Test now passes consistently (was flaky before).

### ✅ Fixed: CollapsibleForm Click Interception (Partial)
**Changes Made**:
1. Removed `overflow-hidden` from container during open state
2. Added `pointerEvents: 'auto'` when open, 'none' when closed
3. Initialized formData with defaults immediately (no setTimeout delay)

**Result**: Form is more reliable, but content pages test still failing for different reason.

## Remaining Issues

### Issue 1: Content Page Not Appearing in Table After Creation ❌
**Test**: "should complete full content page creation and publication flow"

**Problem**: The page is created successfully (API returns 201), but the View button doesn't appear in the table because the page isn't showing up in the list.

**Root Cause**: The `useContentPages` hook's refetch may not be waiting for the data to fully update before the test checks for the View button.

**Evidence from test**:
```
// Wait for form to close (indicates successful creation)
await expect(titleInput).not.toBeVisible({ timeout: 10000 });

// Wait for page to appear in list with proper refresh
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Allow table to re-render

const pageRow = page.locator(`text=${pageTitle}`).first();
await expect(pageRow).toBeVisible({ timeout: 15000 }); // ✅ This passes

// But then View button not found
const viewButton = page.locator(`tr:has-text("${pageTitle}") button:has-text("View")`).first();
await expect(viewButton).toBeVisible({ timeout: 10000 }); // ❌ This fails
```

**Fix Needed**: The issue is that the page title appears but the full row with buttons doesn't render. This suggests the DataTable component may not be fully re-rendering after the refetch.

### Issue 2: Event Creation Validation Error ❌
**Test**: "should create event and add as reference to content page"

**Problem**: Event creation fails with validation error even though required fields are filled.

**Fields Being Filled**:
- `name`: Event name ✅
- `startDate`: '2025-06-15T14:00' ✅
- `status`: 'published' ✅

**Missing Field**: `eventType` is required but not being filled by the test.

**Root Cause**: The Events page provides a default `eventType: 'ceremony'` in `getInitialFormData()`, but the CollapsibleForm may not be properly using this default when the form opens.

**Evidence**: Looking at the Events page code:
```typescript
const getInitialFormData = useCallback(() => {
  if (selectedEvent) {
    return selectedEvent;
  }
  // Provide defaults for required fields when creating new event
  return {
    name: '',
    eventType: 'ceremony' as const,  // ← Default provided
    startDate: '',
    status: 'draft' as const,
  };
}, [selectedEvent]);
```

But the CollapsibleForm is initialized with:
```typescript
const [formData, setFormData] = useState<Record<string, any>>(() => initialData || {});
```

If `initialData` is `{}` or undefined when the form first opens, the defaults won't be applied.

**Fix Needed**: Ensure the Events page passes the default values as `initialData` prop to CollapsibleForm.

## Implementation Plan

1. ✅ Fix CollapsibleForm click interception
2. ✅ Fix CollapsibleForm default value initialization  
3. ✅ Fix InlineSectionEditor draggable sections
4. ⏳ Fix Events page to pass default values to CollapsibleForm
5. ⏳ Fix content pages table refresh issue
6. ⏳ Run tests to verify fixes
7. ⏳ Document results

## Expected Outcome

After remaining fixes:
- **Target Pass Rate**: 100% (17/17 tests passing)
- All tests should pass consistently without flakiness
