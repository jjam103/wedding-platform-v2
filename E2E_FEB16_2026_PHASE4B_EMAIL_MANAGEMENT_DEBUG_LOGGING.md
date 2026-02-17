# E2E Test Fix: Email Management - Debug Logging Added

**Date**: February 16, 2026  
**Test**: `should select recipients by group`  
**Status**: Debug logging added to trace execution flow  
**Issue**: Modal not closing after email send (15s timeout)

## Problem Analysis

The test is failing because the modal doesn't close after sending an email, even though:
1. E2E test mode is enabled (`E2E_TEST=true`)
2. Email service correctly detects test mode and skips Resend API calls
3. Mock email IDs are returned instantly

## Debug Logging Added

### 1. Email Service (`services/emailService.ts`)

Added console logging to track E2E test mode execution:

```typescript
if (isE2ETest) {
  console.log('[emailService.sendEmail] E2E Test Mode - Skipping Resend API call');
  
  // Generate mock email ID
  const mockEmailId = `mock-email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Log email as sent (for E2E test verification)
  const { error: logError } = await supabase.from('email_logs').insert({
    template_id: validation.data.template_id,
    recipient_email: validation.data.to,
    subject,
    delivery_status: 'sent',
    sent_at: new Date().toISOString(),
  });

  if (logError) {
    console.error('[emailService.sendEmail] Failed to log email:', logError);
  }

  console.log('[emailService.sendEmail] Mock email sent successfully:', mockEmailId);
  return { success: true, data: { id: mockEmailId } };
}
```

**Purpose**: Verify that test mode is being activated and emails are being mocked correctly.

### 2. API Route (`app/api/admin/emails/send/route.ts`)

Added comprehensive logging throughout the request lifecycle:

```typescript
export async function POST(request: Request) {
  try {
    console.log('[API /api/admin/emails/send] Request received');
    
    // Auth check
    if (authError || !session) {
      console.log('[API /api/admin/emails/send] Auth failed');
      return NextResponse.json(...);
    }

    // Validation
    const body = await request.json();
    console.log('[API /api/admin/emails/send] Body parsed, recipients:', body.recipients?.length);
    
    if (!validation.success) {
      console.log('[API /api/admin/emails/send] Validation failed:', validation.error);
      return NextResponse.json(...);
    }

    // Service call
    console.log('[API /api/admin/emails/send] Calling sendBulkEmail service');
    const result = await emailService.sendBulkEmail(validation.data);
    console.log('[API /api/admin/emails/send] Service returned:', result.success ? 'SUCCESS' : 'FAILURE');

    // Response
    if (result.success) {
      console.log('[API /api/admin/emails/send] Returning 200 success');
      return NextResponse.json(result, { status: 200 });
    } else {
      console.log('[API /api/admin/emails/send] Returning error with status:', statusCode);
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    console.error('[API /api/admin/emails/send] Exception caught:', error);
    return NextResponse.json(...);
  }
}
```

**Purpose**: Track the complete API request flow from authentication through response.

### 3. EmailComposer Component (`components/admin/EmailComposer.tsx`)

Added detailed logging in the form submission handler:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('[EmailComposer] handleSubmit called');

  // ... validation checks with logging ...

  setSubmitting(true);
  console.log('[EmailComposer] Starting email send, endpoint:', endpoint);
  
  try {
    const recipientEmails = await getRecipientEmails();
    console.log('[EmailComposer] Recipient emails:', recipientEmails.length);

    // Send email
    console.log('[EmailComposer] Sending request to:', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    console.log('[EmailComposer] API response status:', response.status);
    const result = await response.json();
    console.log('[EmailComposer] API response data:', result);

    if (result.success) {
      console.log('[EmailComposer] Email sent successfully');
      
      // Show toast FIRST
      addToast({ type: 'success', message: '...' });
      
      // Call onSuccess callback
      console.log('[EmailComposer] Calling onSuccess callback');
      onSuccess();
      
      // Close modal
      console.log('[EmailComposer] Calling onClose callback');
      onClose();
      console.log('[EmailComposer] Modal close callback completed');
    } else {
      console.log('[EmailComposer] Email send failed:', result.error);
      addToast({ type: 'error', message: result.error?.message || 'Failed to send email' });
    }
  } catch (error) {
    console.error('[EmailComposer] Exception during email send:', error);
    addToast({ type: 'error', message: 'Failed to send email' });
  } finally {
    console.log('[EmailComposer] Setting submitting=false');
    setSubmitting(false);
  }
};
```

**Purpose**: Track the complete client-side flow from form submission through modal close.

## Expected Log Output (Success Case)

When the test runs successfully, we should see:

```
[EmailComposer] handleSubmit called
[EmailComposer] Starting email send, endpoint: /api/admin/emails/send
[EmailComposer] Recipient emails: 2
[EmailComposer] Sending request to: /api/admin/emails/send
[API /api/admin/emails/send] Request received
[API /api/admin/emails/send] Body parsed, recipients: 2
[API /api/admin/emails/send] Calling sendBulkEmail service
[emailService.sendEmail] E2E Test Mode - Skipping Resend API call
[emailService.sendEmail] Mock email sent successfully: mock-email-...
[emailService.sendEmail] E2E Test Mode - Skipping Resend API call
[emailService.sendEmail] Mock email sent successfully: mock-email-...
[API /api/admin/emails/send] Service returned: SUCCESS
[API /api/admin/emails/send] Returning 200 success
[EmailComposer] API response status: 200
[EmailComposer] API response data: { success: true, data: { sent: 2, failed: 0 } }
[EmailComposer] Email sent successfully
[EmailComposer] Calling onSuccess callback
[EmailComposer] Calling onClose callback
[EmailComposer] Modal close callback completed
[EmailComposer] Setting submitting=false
```

## Next Steps

1. **Run the test** with these debug logs to see where the flow breaks
2. **Analyze the logs** to identify:
   - Is the API being called?
   - Is the API returning success?
   - Is the response being parsed correctly?
   - Is `onClose()` being called?
   - Is there an error being thrown?

3. **Based on findings**, apply targeted fix:
   - If API not called: Check form validation
   - If API fails: Check authentication or service logic
   - If response not parsed: Check response format
   - If onClose not called: Check conditional logic
   - If error thrown: Check error handling

## Files Modified

1. `services/emailService.ts` - Added E2E test mode logging
2. `app/api/admin/emails/send/route.ts` - Added API request flow logging
3. `components/admin/EmailComposer.tsx` - Added form submission flow logging

## Test Command

```bash
npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
```

## Success Criteria

The test passes when:
1. Modal closes within 15 seconds after clicking "Send Email"
2. Logs show complete flow from form submission to modal close
3. No errors or exceptions in the logs
4. Email logs are created in the database with status 'sent'
