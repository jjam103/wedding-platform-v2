# E2E Data Management Suite - Delete Location Test Fix

**Date**: February 15, 2026  
**Test**: "should delete location and validate required fields"  
**Status**: ✅ DELETE OPERATION FIXED, ⚠️ CHILD VERIFICATION ISSUE

## Summary

Successfully fixed the delete operation by handling the browser's native confirm dialog. The DELETE API call now works correctly. However, discovered that the child location verification is failing - the child is not visible after parent deletion.

## What Was Fixed ✅

### Issue #1: DELETE API Timeout
**Problem**: Test was timing out waiting for DELETE API response

**Root Cause**: The locations page uses browser's native `confirm()` dialog, not a custom React component. The test was looking for a button with text "Delete" in the DOM, but the actual confirm dialog is a browser native dialog.

**Solution**: Use Playwright's dialog handler to accept the native confirm dialog:

```typescript
// Set up dialog handler BEFORE clicking delete button
page.once('dialog', async dialog => {
  console.log(`[DELETE TEST] Dialog appeared: ${dialog.type()} - "${dialog.message()}"`);
  await dialog.accept();
  console.log('[DELETE TEST] Dialog accepted');
});

// Click delete button and wait for DELETE API call
const [deleteResponse] = await Promise.all([
  page.waitForResponse(
    response => {
      const isDelete = response.url().includes(`/api/admin/locations/${parentLocationId}`) && 
                      response.request().method() === 'DELETE';
      return isDelete;
    },
    { timeout: 20000 }
  ),
  deleteButton.click()
]);
```

**Key Points**:
1. Use `page.once('dialog', ...)` to handle native browser dialogs
2. Set up the handler BEFORE clicking the button that triggers it
3. Call `dialog.accept()` to confirm the action
4. Match the DELETE request using the specific location ID in the URL

### Issue #2: Capturing Location ID
**Problem**: Needed the parent location ID to match the DELETE request URL

**Solution**: Capture the ID from the POST response when creating the parent:

```typescript
const [parentResponse] = await Promise.all([
  page.waitForResponse(...),
  createButton.click()
]);

// Capture parent location ID from response
const parentData = await parentResponse.json();
const parentLocationId = parentData.data?.id;
```

## Test Results

✅ Parent location created successfully  
✅ Parent location ID captured  
✅ Delete button found and clicked  
✅ Native confirm dialog handled  
✅ DELETE API call triggered  
✅ DELETE API response received  
✅ Parent location deleted from UI  

❌ Child location not visible after parent deletion

## Remaining Issue ⚠️

The child location is not visible in the tree after the parent is deleted. This could be because:

1. **Child was never created**: The child creation might have failed silently
2. **Cascade delete**: The database might be cascade-deleting children when parent is deleted
3. **UI not showing orphaned children**: The tree UI might not display locations without parents

### Debug Output

```
[DELETE TEST] Parent location ID: 7b38ed01-b267-4758-a864-e9caf7f6c546
[DELETE TEST] Looking for parent row with name: "Delete Parent 1771206982561"
[DELETE TEST] Parent row count: 1
[DELETE TEST] Delete button found, clicking...
[DELETE TEST] Dialog appeared: confirm - "Are you sure you want to delete this location? Child locations will become orphaned."
[DELETE TEST] Dialog accepted
[DELETE TEST] Delete button clicked
[DELETE TEST] DELETE API call detected for ID: 7b38ed01-b267-4758-a864-e9caf7f6c546
[DELETE TEST] DELETE API response received

Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid="location-tree"], .space-y-2').first().locator('text=Delete Child 1771206982561').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

## Recommendations

### Option 1: Verify Child Creation
Add logging to verify the child location was actually created:

```typescript
const [childResponse] = await Promise.all([...]);
const childData = await childResponse.json();
console.log(`[DELETE TEST] Child location created: ${childData.data?.id}`);
```

### Option 2: Check Database Behavior
The confirm dialog message says "Child locations will become orphaned", which suggests they should remain. Check if:
- The database has cascade delete configured
- The API is deleting children
- The UI is filtering out orphaned locations

### Option 3: Adjust Test Expectation
If orphaned children are intentionally hidden or deleted, update the test to match the actual behavior:

```typescript
// Instead of expecting child to be visible, verify it was deleted or hidden
const childExists = await page.locator(`text=${childName}`).count();
expect(childExists).toBe(0); // If cascade delete is intended
```

## Pattern for Future Tests

When testing delete operations with native confirm dialogs:

```typescript
// 1. Set up dialog handler BEFORE clicking
page.once('dialog', async dialog => {
  await dialog.accept(); // or dialog.dismiss() to cancel
});

// 2. Click delete and wait for API call
const [response] = await Promise.all([
  page.waitForResponse(matcher),
  deleteButton.click()
]);

// 3. Verify deletion
await page.reload(); // Reload to see updated state
const itemExists = await page.locator(`text=${itemName}`).count();
expect(itemExists).toBe(0);
```

## Related Issues

- Native browser dialogs require special handling in Playwright
- DELETE requests need specific URL matching (with ID)
- Tree UI behavior with orphaned nodes needs clarification

## Files Modified

- `__tests__/e2e/admin/dataManagement.spec.ts` (lines 555-695)

---

**Status**: Delete operation is FIXED ✅, but child verification needs investigation ⚠️
