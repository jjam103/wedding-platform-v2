# E2E Phase 3B: Guest Groups Button Fix & Current Status

**Date**: February 16, 2026  
**Status**: ⚠️ PARTIAL PROGRESS - Guest creation failing  
**Test**: `should create group and immediately use it for guest creation`

## Progress Made

### Issue 1: Button Selector ✅ FIXED
**Problem**: Test was looking for `button:has-text("Create Guest")` but actual button text is `"Create"`

**Root Cause**: The `CollapsibleForm` component uses `submitLabel` prop which is set to:
```typescript
submitLabel={selectedGuest ? 'Update' : 'Create'}
```

**Fix Applied**: Changed button selector from:
```typescript
const submitButton = page.locator('button:has-text("Create Guest")').first();
```

To:
```typescript
const submitButton = page.locator('button:has-text("Create")').first();
```

**Result**: Button click now succeeds ✅

## Current Issue

### Issue 2: Guest Creation Failing ⚠️ IN PROGRESS

**Symptoms**:
- Button click succeeds
- No success or error toast appears (timeout after 5 seconds)
- Guest does not appear in table
- Table has 39 rows (existing data)
- Form remains open after submission

**Test Logs**:
```
[Test] Group created successfully: Test Family 1771267695458
[Test] Group found in dropdown: Test Family 1771267695458
[Test] Guest creation result: timeout
[Test] Guest not found in table, checking if table has any data
[Test] Table has 39 rows
```

**Possible Root Causes**:
1. **API Call Failing**: Guest creation API might be returning an error
2. **Form Validation**: Client-side validation might be preventing submission
3. **Missing Required Fields**: Some required field might not be filled
4. **Network Issue**: API call might be timing out
5. **Toast Not Appearing**: Success/error feedback might not be showing

## Test Code Current State

```typescript
// Step 5: Create a guest with the new group
await test.step('Create guest with new group', async () => {
  // Select the new group
  const groupSelect = page.locator('select[name="groupId"]').first();
  await groupSelect.selectOption({ label: groupName });
  
  // Fill in guest details
  await page.fill('input[name="firstName"]', guestFirstName);
  await page.fill('input[name="lastName"]', guestLastName);
  await page.fill('input[name="email"]', `john.doe.${Date.now()}@example.com`);
  await page.selectOption('select[name="ageType"]', 'adult');
  await page.selectOption('select[name="guestType"]', 'wedding_guest');
  
  // Submit form (button text is "Create", not "Create Guest")
  const submitButton = page.locator('button:has-text("Create")').first();
  await submitButton.click();
  
  // Wait for success toast or error message
  const successToast = page.locator('text=/created successfully|success/i').first();
  const errorToast = page.locator('text=/error|failed/i').first();
  
  // Wait for either success or error (with timeout)
  const toastAppeared = await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'success'),
    errorToast.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'error'),
    page.waitForTimeout(5000).then(() => 'timeout')
  ]);
  
  console.log('[Test] Guest creation result:', toastAppeared);
  
  // Wait a bit more for the form to close and table to update
  await page.waitForTimeout(2000);
});
```

## Recommended Next Steps

### Option 1: Debug API Call (RECOMMENDED)
Add network monitoring to see what's happening:

```typescript
// Before clicking submit, set up response listener
const responsePromise = page.waitForResponse(
  response => response.url().includes('/api/admin/guests') && response.request().method() === 'POST',
  { timeout: 10000 }
);

await submitButton.click();

// Wait for API response
const response = await responsePromise;
const responseBody = await response.json();
console.log('[Test] API Response:', response.status(), responseBody);
```

### Option 2: Check Form State
Verify all form fields are properly filled:

```typescript
// Before submit, log form state
const formData = {
  groupId: await groupSelect.inputValue(),
  firstName: await page.locator('input[name="firstName"]').inputValue(),
  lastName: await page.locator('input[name="lastName"]').inputValue(),
  email: await page.locator('input[name="email"]').inputValue(),
  ageType: await page.locator('select[name="ageType"]').inputValue(),
  guestType: await page.locator('select[name="guestType"]').inputValue(),
};
console.log('[Test] Form data before submit:', formData);
```

### Option 3: Check Console Errors
Monitor browser console for errors:

```typescript
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('[Browser Error]:', msg.text());
  }
});
```

### Option 4: Manual Testing
Test the workflow manually to see if it works:
1. Navigate to `/admin/guests`
2. Create a new group
3. Try to create a guest with that group
4. Check if guest appears in table
5. Check browser console for errors

## Files Modified

1. `__tests__/e2e/guest/guestGroups.spec.ts` (line 171)
   - Changed button selector from `"Create Guest"` to `"Create"`
   - Added toast detection logic
   - Added logging for debugging

## Related Documents

- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_TIMEOUT_FIX.md` - Timeout fix
- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_ANALYSIS.md` - Initial analysis
- `E2E_FEB15_2026_PHASE3_DASHBOARD.md` - Overall progress

## Next Actions

1. ⏳ Add API response monitoring to debug guest creation
2. ⏳ Check browser console for JavaScript errors
3. ⏳ Verify form validation is passing
4. ⏳ Test manually to confirm workflow works
5. ⏳ Once root cause found, apply fix and re-run test

## Summary

We've made progress by fixing the button selector issue, but guest creation is still failing silently. The next step is to add debugging to understand why the API call is not succeeding or why no feedback is being shown to the user.

**Current Status**: 0/9 guest groups tests passing (0%)  
**Blocker**: Guest creation API call failing or not providing feedback  
**Estimated Time to Fix**: 15-30 minutes once root cause is identified
