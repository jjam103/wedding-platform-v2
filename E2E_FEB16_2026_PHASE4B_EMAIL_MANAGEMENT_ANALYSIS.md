# Phase 4B: Email Management Test Failure Analysis

**Date**: February 16, 2026
**Test**: "should select recipients by group"
**Status**: Failing (timeout waiting for modal to close)

## Root Cause Analysis

### The Failure
```
Error: expect(locator).not.toBeVisible() failed
Locator:  locator('h2:has-text("Compose Email")')
Expected: not visible
Received: visible
Timeout:  10000ms
```

The test expects the "Compose Email" modal to close after sending an email to a group, but the modal stays open for more than 10 seconds.

### Code Flow Analysis

1. **Test selects "Guest Groups" radio button**
   ```typescript
   const groupsRadio = page.locator('input[type="radio"][value="groups"]');
   await groupsRadio.check();
   ```

2. **Test selects a group from dropdown**
   ```typescript
   const groupsSelect = page.locator('select#groups');
   await groupsSelect.selectOption([testGroupId]);
   ```

3. **Test clicks "Send Email" button**
   ```typescript
   const sendButton = page.locator('button[type="submit"]:has-text("Send Email")');
   await sendButton.click();
   ```

4. **EmailComposer.handleSubmit() is called**
   - Calls `getRecipientEmails()` to get email addresses
   - For `recipientType === 'groups'`, it fetches guests from each group:
   
   ```typescript
   if (recipientType === 'groups') {
     const groupGuestPromises = selectedRecipients.map(async (groupId) => {
       const response = await fetch(`/api/admin/groups/${groupId}/guests`);
       const data = await response.json();
       return data.success ? data.data : [];
     });
     
     const groupGuestsArrays = await Promise.all(groupGuestPromises);
     const allGroupGuests = groupGuestsArrays.flat();
     
     return allGroupGuests
       .filter((g: Guest) => g.email)
       .map((g: Guest) => g.email!);
   }
   ```

5. **Sends email via API**
   ```typescript
   const response = await fetch('/api/admin/emails/send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(requestData),
   });
   ```

6. **On success, closes modal**
   ```typescript
   if (result.success) {
     onSuccess();
     addToast({ type: 'success', message: '...' });
     onClose(); // This should close the modal
   }
   ```

### Potential Issues

1. **API `/api/admin/groups/${groupId}/guests` might be slow or failing**
   - The test creates 2 guests in the group
   - The API needs to fetch these guests
   - If the API is slow (>10 seconds), the test times out

2. **Email sending API might be slow**
   - Sending emails via Resend API in E2E environment
   - If Resend is not configured or slow, this could timeout

3. **Modal close callback might not be firing**
   - If `result.success` is false, modal won't close
   - If there's an error in the try/catch, modal won't close

## Diagnostic Steps

### Step 1: Check if `/api/admin/groups/${groupId}/guests` exists and works
```bash
# Check if the API route exists
ls -la app/api/admin/groups/[id]/guests/
```

### Step 2: Add logging to see where it's failing
The component already has extensive logging. We need to check the browser console during the test to see:
- Did `getRecipientEmails()` complete?
- Did the email API call succeed?
- What was the API response?

### Step 3: Check email sending in E2E environment
The test might be failing because:
- Resend API is not configured in E2E environment
- Email sending is taking too long
- Email API is returning an error

## Recommended Fixes

### Option 1: Increase timeout (Quick Fix)
```typescript
// In the test
await expect(page.locator('h2:has-text("Compose Email")')).not.toBeVisible({ timeout: 30000 });
```

This gives more time for the async operations to complete.

### Option 2: Wait for API response (Better Fix)
```typescript
// In the test, before checking modal close
await page.waitForResponse(
  (response) => response.url().includes('/api/admin/emails/send') && response.status() === 200,
  { timeout: 20000 }
);
```

This ensures we wait for the email API to complete before checking if modal closed.

### Option 3: Add form data loading wait (Best Fix)
```typescript
// In the test, after selecting group
await page.waitForTimeout(1000); // Wait for group guests to load

// Or better, wait for the form to be ready
await page.waitForSelector('form[data-loaded="true"]', { timeout: 15000 });
```

This ensures the form has loaded all necessary data before submitting.

### Option 4: Mock email service (Ideal for E2E)
Mock the Resend email service in E2E tests to make email sending instant:
```typescript
// In E2E setup
await page.route('**/api/admin/emails/send', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { sent: 2 } }),
  });
});
```

## Implementation Plan

1. **Immediate Fix**: Increase timeout to 30 seconds
2. **Better Fix**: Add API response wait
3. **Long-term**: Mock email service for E2E tests

Let's start with the immediate fix and see if it resolves the issue.
