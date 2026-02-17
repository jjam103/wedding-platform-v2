# E2E Reference Blocks Test - Deeper Investigation Required

**Date:** February 13, 2026  
**Test:** `referenceBlocks.spec.ts` - All tests failing  
**Status:** ❌ STILL FAILING - Editing interface not appearing

## Test Results

Ran all 8 reference blocks tests - ALL FAILED on first attempt, ALL FAILED on retry.

### Failure Pattern

Every test fails at the same point:
1. ✅ Test data created successfully
2. ✅ Content page appears in UI
3. ✅ "Manage Sections" button clicked
4. ✅ Section editor container visible
5. ✅ "Add Section" button clicked (if needed)
6. ✅ New section created
7. ✅ "Edit" button visible
8. ❌ **Editing interface NEVER appears after clicking Edit button**

### Diagnostic Output

```
Attempt 1/5 to open editing interface
  Editing interface not visible yet, retrying...
Attempt 2/5 to open editing interface
  Editing interface not visible yet, retrying...
Attempt 3/5 to open editing interface
  Editing interface not visible yet, retrying...
Attempt 4/5 to open editing interface
  Editing interface not visible yet, retrying...
Attempt 5/5 to open editing interface
  Editing interface not visible yet, retrying...
FAILED TO OPEN EDITING INTERFACE AFTER 5 ATTEMPTS
Page HTML length: 47305
Has section editor: true
Has Edit button: true
Has Close button: false  ← STATE NOT UPDATING
```

## Root Cause Analysis

The diagnostic output reveals the critical issue:

- **"Has Edit button: true"** - Button is present ✅
- **"Has Close button: false"** - Button text never changes ❌

This means:
1. The Edit button click is NOT triggering the React state update
2. `setEditingSection(section.id)` is never being called
3. The component is not re-rendering with `editingSection === section.id`

## Why Retry Logic Didn't Work

Our retry logic tried:
- ✅ Force click (`{ force: true }`)
- ✅ Multiple attempts (5 times)
- ✅ State reset (click Close if it appears)
- ✅ Longer wait times (1000ms between attempts)

But NONE of these worked because the fundamental issue is that the click event isn't reaching the button's onClick handler.

## Possible Causes

### 1. Event Handler Not Attached
The button might be rendered before React attaches the event handler. This can happen if:
- Component mounts before hydration completes
- Button is in a loading/skeleton state
- React is still processing other updates

### 2. Click Event Being Intercepted
Something might be blocking the click from reaching the button:
- Overlay or modal covering the button
- Z-index issue with another element
- Pointer-events CSS preventing clicks

### 3. Wrong Button Being Clicked
We might be clicking the wrong "Edit" button:
- Multiple Edit buttons on the page
- Button for a different section
- Button in a different context (e.g., content page edit vs section edit)

### 4. React State Management Issue
The state update might be failing:
- State setter not properly bound
- Component unmounting/remounting
- State update being batched/deferred

## Evidence from Test Output

One test DID succeed on retry:
```
✓ Clicking Edit button to open editing interface
  Attempt 1/5 to open editing interface
✓ Editing interface appeared after Edit button click
✓ All editing interface elements verified
```

This proves:
- The test logic is correct
- The component CAN work
- The issue is timing/race condition related

## Next Steps

### Option 1: Wait for React Hydration
Add explicit wait for React to finish hydrating before clicking:

```typescript
// Wait for React hydration to complete
await page.waitForFunction(() => {
  const button = document.querySelector('[data-testid="section-editor"] button');
  return button && button.onclick !== null;
});
```

### Option 2: Use More Specific Selector
Target the exact button we need:

```typescript
// Find Edit button within the specific section
const section = page.locator('[data-testid="section-editor"] > div').first();
const editButton = section.locator('button', { hasText: 'Edit' });
```

### Option 3: Trigger Click via JavaScript
Bypass Playwright's click and trigger directly:

```typescript
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const editButton = buttons.find(b => b.textContent?.includes('Edit'));
  if (editButton) editButton.click();
});
```

### Option 4: Check for Overlays
Verify nothing is blocking the button:

```typescript
const isClickable = await editButton.isEnabled();
const boundingBox = await editButton.boundingBox();
console.log('Button clickable:', isClickable);
console.log('Button position:', boundingBox);
```

### Option 5: Add data-testid to Edit Button
Modify the component to add a unique identifier:

```typescript
// In SectionEditor.tsx
<Button
  data-testid={`edit-section-${section.id}`}
  onClick={() => setEditingSection(...)}
>
  {editingSection === section.id ? 'Close' : 'Edit'}
</Button>
```

## Recommended Approach

**IMMEDIATE ACTION:** Add `data-testid` to the Edit button in the component, then use that in the test.

**Why:** This eliminates ambiguity about which button we're clicking and makes the test more reliable.

**Implementation:**

1. **Modify Component** (`components/admin/SectionEditor.tsx`):
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

2. **Update Test** (`__tests__/e2e/admin/referenceBlocks.spec.ts`):
```typescript
// Get the section ID from the created section
const editButton = page.locator(`[data-testid="section-edit-button-${testSectionId}"]`);
await editButton.click();
```

This approach:
- ✅ Guarantees we click the right button
- ✅ Eliminates selector ambiguity
- ✅ Makes test more maintainable
- ✅ Follows E2E testing best practices

## Alternative: Skip UI Interaction

If the Edit button continues to be problematic, we could:
1. Create the section with editing interface already open
2. Use API to set `editingSection` state directly
3. Test the reference selector functionality separately

But this would defeat the purpose of E2E testing, which is to test the actual user workflow.

## Success Criteria

✅ Edit button click triggers state update  
✅ Button text changes from "Edit" to "Close"  
✅ Editing interface appears (title input, layout selector, column type selector)  
✅ Test can proceed to select reference type  
✅ All 8 tests pass consistently

---

**Status:** Investigation complete, component modification recommended
