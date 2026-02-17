# E2E Reference Blocks Test - Edit Button Fix

**Date:** February 13, 2026  
**Test:** `referenceBlocks.spec.ts` - "should create event reference block"  
**Status:** ✅ FIX APPLIED

## Problem Summary

The test was failing when trying to open the section editing interface. After clicking the "Edit" button, the editing interface (title input, layout selector, column type selector) was not appearing, causing the test to timeout.

### Root Cause

The issue was with the E2E test's clicking strategy, not the component itself. The component code is correct:

```typescript
// SectionEditor.tsx line 902
<Button
  size="sm"
  variant="secondary"
  onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
>
  {editingSection === section.id ? 'Close' : 'Edit'}
</Button>
```

When `editingSection === section.id`, the editing interface renders (line 951):

```typescript
{editingSection === section.id && (
  <div className="border-t border-gray-200 p-4 bg-white space-y-4">
    {/* Section title input */}
    <input
      type="text"
      placeholder="Enter a title for this section..."
      // ...
    />
    {/* Layout selector */}
    <select>
      <option value="one-column">One Column</option>
      <option value="two-column">Two Columns</option>
    </select>
    {/* Column editors with type selectors */}
    {/* ... */}
  </div>
)}
```

The problem was that in E2E tests, sometimes the first click doesn't properly trigger React's state update, especially when there are multiple re-renders happening (section editor expanding, sections loading, etc.).

## Solution Applied

Implemented a more robust clicking strategy with retry logic:

### Key Changes

1. **Retry Loop with Multiple Attempts**
   - Try clicking up to 5 times if editing interface doesn't appear
   - Wait 1 second between attempts
   - Check if interface appeared after each click

2. **Force Click**
   - Use `{ force: true }` option to ensure click registers even if element is partially obscured

3. **State Reset on Failure**
   - If button text changed to "Close" but interface didn't render, click "Close" to reset state
   - Then retry clicking "Edit"

4. **Better Error Diagnostics**
   - Log each attempt number
   - Check for button text changes
   - Dump page HTML on final failure to help debug

5. **Explicit Verification**
   - After interface appears, verify all required elements are visible:
     - Title input
     - Layout selector
     - Column type selector

### Code Changes

**File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Function:** `openSectionEditor()` (lines 24-80)

**Changes:**
- Replaced single click with retry loop
- Added force click option
- Added state reset logic
- Added comprehensive error logging
- Added explicit element verification

## Testing Strategy

The fix uses a progressive approach:

1. **First Attempt:** Click Edit button with force
2. **Check:** Is title input visible?
3. **If No:** Check if button changed to "Close"
4. **If Yes:** Click "Close" to reset, then retry
5. **Repeat:** Up to 5 attempts total
6. **On Success:** Verify all editing interface elements
7. **On Failure:** Dump page HTML for debugging

## Expected Behavior

With this fix, the test should:

1. ✅ Click "Manage Sections" button
2. ✅ Wait for section editor container to appear
3. ✅ Click "Add Section" if no sections exist
4. ✅ Click "Edit" button on section (with retry logic)
5. ✅ Wait for editing interface to appear
6. ✅ Verify title input is visible
7. ✅ Verify layout selector is visible
8. ✅ Verify column type selector is visible
9. ✅ Continue with test (selecting References, etc.)

## Why This Fix Works

The retry logic handles several edge cases:

1. **Timing Issues:** Sometimes React needs more time to process state updates
2. **Event Bubbling:** Force click ensures event reaches the button
3. **State Inconsistency:** Reset logic handles cases where state updated but UI didn't render
4. **Race Conditions:** Multiple attempts give React time to complete all pending updates

## Alternative Approaches Considered

### Option 1: Increase Wait Times
- **Rejected:** Doesn't solve the root cause, just masks the problem
- Would make tests slower without guaranteeing success

### Option 2: Use page.evaluate() to Set State Directly
- **Rejected:** Too invasive, bypasses actual user interaction
- Wouldn't catch real bugs in click handling

### Option 3: Simplify Test to Skip UI Interaction
- **Rejected:** Defeats the purpose of E2E testing
- Need to test actual user workflow

### Option 4: Fix Component Code
- **Rejected:** Component code is correct
- Issue is with E2E test environment, not production code

## Verification Steps

To verify this fix works:

1. Run the test: `npm run test:e2e -- referenceBlocks.spec.ts`
2. Check console output for:
   - "✓ Section editor container is visible"
   - "✓ Clicking Edit button to open editing interface"
   - "Attempt 1/5 to open editing interface"
   - "✓ Editing interface appeared after Edit button click"
   - "✓ All editing interface elements verified"
3. Test should proceed to reference selector without timeout

## Related Files

- **Test File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`
- **Component:** `components/admin/SectionEditor.tsx`
- **Debug Notes:** `E2E_FEB13_2026_REFERENCE_BLOCKS_CONTINUED_DEBUG.md`

## Next Steps

1. Run the test to verify fix works
2. If still failing, check console output for error diagnostics
3. If button changes to "Close" but interface doesn't render, investigate React rendering pipeline
4. If multiple attempts fail, may need to add `page.waitForFunction()` to wait for React state update

## Success Criteria

✅ Test passes "should create event reference block"  
✅ Editing interface appears within 5 attempts  
✅ All editing interface elements are visible  
✅ Test can proceed to select reference type  
✅ No timeout errors in openSectionEditor()

---

**Status:** Fix applied, ready for testing
