# E2E Reference Blocks Test - Continued Debugging Session

**Date:** February 13, 2026  
**Test:** `referenceBlocks.spec.ts` - "should create event reference block"  
**Status:** ❌ FAILING - Section editor not opening

## Current Issue

The test is failing at the `openSectionEditor()` helper function, specifically when trying to wait for the editing interface to appear after clicking the "Edit" button.

### Error Details

```
Error: expect(locator).toBeVisible() failed
Locator: locator('input[placeholder*="Enter a title"]').first()
Expected: visible
Timeout: 3000ms
Error: element(s) not found
```

### What's Happening

1. ✅ Test data is created successfully (event, activity, content page, section, column)
2. ✅ Content page appears in the UI
3. ✅ "Edit" button is visible and clickable
4. ✅ "Manage Sections" button is clicked
5. ✅ Section editor container appears
6. ✅ "Edit" button on section is clicked
7. ❌ **Editing interface does NOT appear** - React state not updating

### Root Cause Analysis

The `openSectionEditor()` function clicks the "Edit" button on a section, which should trigger React to update state (`editingSection === section.id`) and render the editing interface. However, the editing interface is not appearing even after:

- Waiting 1000ms after clicking Edit
- Using aggressive retry logic with `toPass()` (25 second timeout)
- Multiple retry intervals: [1000, 2000, 3000, 5000]ms

This suggests one of the following:

1. **React State Not Updating:** The click event isn't triggering the state update
2. **Component Not Re-rendering:** State updates but component doesn't re-render
3. **Wrong Element Being Clicked:** We're clicking the wrong "Edit" button
4. **Conditional Rendering Issue:** The editing interface has additional conditions we're not meeting

## Previous Fixes Applied

### Fix #1: SimpleReferenceSelector Data Parsing (✅ COMPLETED)

**Problem:** Component was checking for `result.data.activities` first, which could cause it to use wrong data when switching types.

**Solution:** Changed to use a `switch` statement that checks `selectedType` first:

```typescript
switch (selectedType) {
  case 'event':
    if (result.data.events && Array.isArray(result.data.events)) {
      dataArray = result.data.events;
    }
    break;
  case 'activity':
    if (result.data.activities && Array.isArray(result.data.activities)) {
      dataArray = result.data.activities;
    }
    break;
  // ... etc
}
```

**Result:** API now returns correct data format, but test still fails before reaching this point.

## Next Steps

### Option 1: Investigate Section Editor Component

Read the actual section editor component to understand:
- What triggers the editing interface to appear
- What conditions must be met
- Whether there are any race conditions

### Option 2: Simplify the Test Approach

Instead of using the complex `openSectionEditor()` helper, try a more direct approach:
- Navigate directly to the content page edit view
- Use more specific selectors
- Add explicit waits for React state updates

### Option 3: Check for JavaScript Errors

The editing interface might not be appearing due to JavaScript errors in the browser. We should:
- Check browser console logs
- Look for React errors
- Verify all required props are being passed

### Option 4: Manual Testing

Manually test the flow to see if it works in a real browser:
1. Go to `/admin/content-pages`
2. Click "Edit" on a content page
3. Click "Manage Sections"
4. Click "Edit" on a section
5. Verify editing interface appears

## Test Code Location

- **Test File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`
- **Helper Function:** `openSectionEditor()` (lines 24-80)
- **Failing Test:** "should create event reference block" (line 233)

## Component Files

- **SimpleReferenceSelector:** `components/admin/SimpleReferenceSelector.tsx` (✅ FIXED)
- **Section Editor:** Need to investigate (likely `components/admin/SectionEditor.tsx` or `components/admin/InlineSectionEditor.tsx`)

## Recommendation

**IMMEDIATE ACTION:** Read the section editor component to understand why the editing interface isn't appearing. The issue is NOT with the reference selector (that's fixed), but with the section editor itself not entering edit mode.

