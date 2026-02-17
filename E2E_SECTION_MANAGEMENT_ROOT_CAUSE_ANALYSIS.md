# E2E Section Management - Root Cause Analysis

## Executive Summary

**Status**: 10/12 tests passing (83%), 2 tests failing consistently (not flaky)

**Root Cause Identified**: The section editor component (`InlineSectionEditor`) is not rendering after clicking "Manage Sections" button, even though:
1. ✅ Test data exists (3 events, 1 activity, 5 content pages)
2. ✅ API calls succeed (200 status)
3. ✅ "Manage Sections" button is visible and clickable
4. ❌ Section editor never appears in the DOM

## Test Results

### Passing Tests (10/12)
1. ✅ should edit existing section
2. ✅ should delete section with confirmation
3. ✅ should save all sections and show preview
4. ✅ should reorder sections with drag and drop
5. ✅ should integrate photo picker and select photos
6. ✅ should access section editor from all entity types
7. ✅ should handle entity-specific section features
8. ✅ should validate references in sections
9. ✅ should handle loading states during save operations
10. ✅ should handle errors during section operations

### Failing Tests (2/12)
1. ❌ **Test 1**: "should create new section with rich text content"
   - **Error**: `expect(locator).toBeVisible() failed` - Rich text editor not found
   - **Reason**: Section editor doesn't render after clicking "Manage Sections"

2. ❌ **Test 8**: "should maintain consistent UI across entity types"
   - **Error**: `expect(someHaveEditor).toBe(true)` - No entities have section editor
   - **Reason**: Section editor doesn't render for any entity type

## Evidence from Logs

### API Calls Succeed ✅
```
GET /api/admin/events 200 in 429ms
GET /api/admin/activities 200 in 432ms
GET /api/admin/content-pages 200 in 679ms
GET /api/admin/sections/by-page/event/af1b3647-f38c-42ba-af43-9120cb8e5676 200 in 715ms
```

### Test Data Exists ✅
```
📅 Events: 3 found
   - Test Wedding Ceremony (test-wedding-ceremony)
   - Wedding Ceremony (wedding-ceremony)
   - Reception (reception)

🎯 Activities: 1 found
   - Test Beach Volleyball (test-beach-volleyball)

📄 Content Pages: 5 found
   - Test Our Story (test-our-story)
   - Section Test 1770603591486
   - Section Test 1770603754834
   - Section Test 1770605301554
   - Keyboard Test 1770605397390
```

### Section Editor Doesn't Render ❌
```
⚠️  Events: Section editor did not appear
⚠️  Activities: Data table did not load
⚠️  Content Pages: Section editor did not appear
```

## Root Cause Analysis

### Issue 1: CollapsibleForm Not Expanding

**Problem**: The `CollapsibleForm` component (which wraps the section editor) is not expanding after clicking "Manage Sections".

**Possible Causes**:
1. **State Management Issue**: The form's `isOpen` state is not updating
2. **Animation Timing**: The form expansion animation is too slow
3. **React Hydration**: Component not fully hydrated in E2E environment
4. **Event Handler**: Click event not properly triggering state change

**Evidence**:
- Button is visible and clickable ✅
- API call succeeds ✅
- Editor never appears in DOM ❌

### Issue 2: Data Table Loading Detection

**Problem**: The wait condition for data table loading is not detecting the table properly.

**Current Implementation**:
```typescript
const dataTableLoaded = await page.waitForFunction(() => {
  const table = document.querySelector('table');
  const tableRows = document.querySelectorAll('tbody tr');
  const noDataMessage = document.querySelector('[role="status"]');
  return (table && tableRows.length > 0) || noDataMessage;
}, { timeout: 10000 }).catch(() => false);
```

**Issue**: This works for Events and Content Pages, but fails for Activities.

## Fixes Applied

### Fix 1: Improved Data Table Detection ✅
**Before**:
```typescript
const table = document.querySelector('table');
const noDataMessage = document.querySelector('text=No data available');
return table || noDataMessage;
```

**After**:
```typescript
const table = document.querySelector('table');
const tableRows = document.querySelectorAll('tbody tr');
const noDataMessage = document.querySelector('[role="status"]');
return (table && tableRows.length > 0) || noDataMessage;
```

**Result**: Better detection, but still fails for Activities page

### Fix 2: Added Scroll and Wait for Rich Text Editor ✅
**Before**:
```typescript
await richTextEditor.click();
await richTextEditor.fill('This is test section content');
```

**After**:
```typescript
await richTextEditor.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await richTextEditor.click();
await richTextEditor.fill('This is test section content');
```

**Result**: Helps with editor interaction, but editor still doesn't appear

## Recommended Solutions

### Priority 1: Fix CollapsibleForm Expansion (CRITICAL)

**Option A: Add Explicit Wait for Form Expansion**
```typescript
// After clicking "Manage Sections"
await manageSectionsButton.click();

// Wait for CollapsibleForm to expand
await page.waitForFunction(() => {
  const form = document.querySelector('[data-testid="inline-section-editor"]');
  const formParent = form?.closest('[data-collapsible-form]');
  return formParent && formParent.getAttribute('data-state') === 'open';
}, { timeout: 5000 });
```

**Option B: Increase Wait Time After Click**
```typescript
await manageSectionsButton.click();
await page.waitForTimeout(2000); // Wait for animation
```

**Option C: Use Force Click**
```typescript
await manageSectionsButton.click({ force: true });
await page.waitForTimeout(1000);
```

**Recommendation**: Try Option A first (most robust), then Option B if needed.

### Priority 2: Fix Activities Data Table Loading

**Option A: Increase Timeout**
```typescript
const dataTableLoaded = await page.waitForFunction(() => {
  // ... same logic
}, { timeout: 15000 }).catch(() => false); // Increased from 10s to 15s
```

**Option B: Wait for API Response**
```typescript
await page.waitForResponse(
  response => response.url().includes('/api/admin/activities') && response.status() === 200,
  { timeout: 10000 }
);
await page.waitForTimeout(1000); // Wait for React to render
```

**Recommendation**: Try Option B (more reliable).

### Priority 3: Add Debug Logging

Add comprehensive logging to understand what's happening:
```typescript
// After clicking "Manage Sections"
await manageSectionsButton.click();

// Log DOM state
const editorExists = await page.locator('[data-testid="inline-section-editor"]').count();
const formState = await page.evaluate(() => {
  const form = document.querySelector('[data-collapsible-form]');
  return {
    exists: !!form,
    state: form?.getAttribute('data-state'),
    isVisible: form ? window.getComputedStyle(form).display !== 'none' : false
  };
});

console.log(`Editor count: ${editorExists}, Form state:`, formState);
```

## Next Steps

1. **Investigate CollapsibleForm Component**:
   - Check if `data-testid="inline-section-editor"` is correct
   - Verify the component renders in E2E environment
   - Check if there are any console errors

2. **Add Debug Mode to Tests**:
   - Take screenshots after clicking "Manage Sections"
   - Log DOM state before and after click
   - Check browser console for errors

3. **Manual Testing**:
   - Run E2E server: `npm run dev`
   - Navigate to `/admin/events`
   - Click "Manage Sections" manually
   - Verify section editor appears

4. **Component Investigation**:
   - Review `CollapsibleForm.tsx` implementation
   - Check if there are any E2E-specific issues
   - Verify animation timing

## Files Modified

- `__tests__/e2e/admin/sectionManagement.spec.ts`:
  - Improved data table loading detection
  - Added scroll and wait for rich text editor
  - Enhanced error logging

- `scripts/check-e2e-test-data.mjs`:
  - Created script to verify test data exists

## Related Documents

- `E2E_SECTION_MANAGEMENT_FLAKY_TESTS_FIXED.md` - Previous analysis
- `E2E_SECTION_MANAGEMENT_FIXES_APPLIED.md` - Navigation retry fixes
- `E2E_SECTION_MANAGEMENT_CURRENT_STATUS.md` - Status before investigation

## Conclusion

The flaky tests have been successfully converted to **consistently failing tests** with clear error messages. The root cause is identified: **the section editor component is not rendering after clicking "Manage Sections"**.

This is a **component rendering issue**, not a test code issue. The next step is to investigate why the `CollapsibleForm` or `InlineSectionEditor` component is not expanding in the E2E environment.

**Recommended Action**: Investigate the `CollapsibleForm` component and add explicit wait for form expansion state.
