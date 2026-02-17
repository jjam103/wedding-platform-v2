# E2E Data Management - Delete Location Investigation

**Date**: February 15, 2026  
**Test**: "should delete location and validate required fields"  
**Status**: 🔍 INVESTIGATING

## Current Situation

The delete operation is partially working but the DELETE API call is never triggered.

### What's Working ✅

1. Parent location created successfully
2. Parent location ID captured: `e8581f99-fcf6-4ffc-907b-c68e7934728a`
3. Parent row found in UI
4. Delete button found and clicked
5. Confirm dialog appears
6. Confirm button found (text: "Delete") and clicked

### What's NOT Working ❌

7. **DELETE API call is NEVER triggered**
8. Test times out waiting for DELETE response

## Debug Output

```
[DELETE TEST] Parent location ID: e8581f99-fcf6-4ffc-907b-c68e7934728a
[DELETE TEST] Looking for parent row with name: "Delete Parent 1771206744211"
[DELETE TEST] Parent row count: 1
[DELETE TEST] Delete button found, clicking...
[DELETE TEST] Confirm button count: 1
[DELETE TEST] Confirm button text: "Delete"
[DELETE TEST] Confirm button clicked
TimeoutError: page.waitForResponse: Timeout 20000ms exceeded
```

## Root Cause Hypothesis

The confirm button with text "Delete" is being clicked, but it's NOT triggering the DELETE API call. This suggests:

1. **Wrong button**: The button we're clicking might be canceling or closing the dialog, not confirming the delete
2. **Different flow**: The delete might happen through a different mechanism (optimistic UI update?)
3. **Button not actually clickable**: The button might be intercepted by something else
4. **API call happens before we set up listener**: Race condition (unlikely since we use Promise.all)

## Next Steps

### Option 1: Check the actual UI component
Look at the locations page component to see how delete is implemented:
- What does the confirm dialog look like?
- What button text should we look for?
- Does it use a ConfirmDialog component?

### Option 2: Try different button selectors
The confirm button might have different text or attributes:
- Try `button:has-text("Confirm")`
- Try `button[data-testid="confirm-delete"]`
- Try `button.confirm-button`
- Look for buttons with specific roles or aria-labels

### Option 3: Check if delete happens immediately
Maybe there's no confirm dialog and delete happens on first click:
- Remove the confirm button logic
- Wait for DELETE API after first delete button click

### Option 4: Inspect the dialog structure
Run test in headed mode and inspect the actual dialog:
```bash
npx playwright test --headed --debug
```

## Expected DELETE API Call

Should match:
- URL: `/api/admin/locations/e8581f99-fcf6-4ffc-907b-c68e7934728a`
- Method: `DELETE`
- Status: 200 (success)

## Related Files

- Test: `__tests__/e2e/admin/dataManagement.spec.ts` (line 555-680)
- API Route: `app/api/admin/locations/[id]/route.ts` (DELETE handler)
- Component: `app/admin/locations/page.tsx` (need to check)

---

**Next Action**: Check the locations page component to understand the delete flow
