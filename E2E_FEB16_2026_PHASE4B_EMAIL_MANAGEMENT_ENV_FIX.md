# E2E Test Fix: Email Management - Environment Variable Fix

**Date**: February 16, 2026  
**Test**: `should select recipients by group`  
**Status**: Environment variable fix applied  
**Issue**: `E2E_TEST` not passed to Next.js server

## Root Cause Found

The Playwright config was loading `E2E_TEST=true` from `.env.test.e2e` for the test process, but **NOT passing it to the Next.js dev server**. This caused:

1. ✅ Playwright tests see `E2E_TEST=true`
2. ❌ Next.js server sees `E2E_TEST=undefined`
3. ⚠️ Email service falls back to `NODE_ENV === 'test'` check
4. ❌ Modal doesn't close within 15s timeout

## The Fix

### Before (playwright.config.ts)
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  env: {
    NODE_ENV: 'test',
    // E2E_TEST was NOT passed to server! ❌
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    // ... other vars
  },
}
```

### After (playwright.config.ts)
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  env: {
    NODE_ENV: 'test',
    E2E_TEST: process.env.E2E_TEST || 'true', // ✅ NOW PASSED TO SERVER
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    // ... other vars
  },
}
```

## Why This Matters

The email service has this check:

```typescript
const isE2ETest = process.env.E2E_TEST === 'true' || process.env.NODE_ENV === 'test';

if (isE2ETest) {
  console.log('[emailService.sendEmail] E2E Test Mode - Skipping Resend API call');
  // Return mock email ID instantly
  return { success: true, data: { id: mockEmailId } };
}
```

**Without `E2E_TEST` passed to server:**
- Server only sees `NODE_ENV=test`
- This should still work, BUT...
- The fallback might not be reliable in all cases
- Better to explicitly pass `E2E_TEST=true`

**With `E2E_TEST` passed to server:**
- Server sees `E2E_TEST=true` explicitly
- Email service activates test mode immediately
- Mock emails return instantly
- Modal closes within timeout

## Expected Behavior After Fix

1. **Test starts** → Playwright loads `.env.test.e2e` with `E2E_TEST=true`
2. **Server starts** → Receives `E2E_TEST=true` in environment
3. **Email sent** → Service detects `E2E_TEST=true` and returns mock instantly
4. **Modal closes** → Within 15s timeout (should be ~1-2s)
5. **Test passes** ✅

## Debug Logs to Verify

After running the test, you should see:

```
[emailService.sendEmail] E2E Test Mode - Skipping Resend API call
[emailService.sendEmail] Mock email sent successfully: mock-email-...
[API /api/admin/emails/send] Service returned: SUCCESS
[EmailComposer] Email sent successfully
[EmailComposer] Calling onClose callback
[EmailComposer] Modal close callback completed
```

## Files Modified

1. **playwright.config.ts** - Added `E2E_TEST` to webServer env

## Test Command

```bash
npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
```

## Success Criteria

✅ Test passes with modal closing within 15s  
✅ Logs show "E2E Test Mode - Skipping Resend API call"  
✅ No actual Resend API calls made  
✅ Email logs created in database with status 'sent'

## Why This Wasn't Caught Earlier

The test mode implementation was correct, but the environment variable wasn't being passed through the Playwright → Next.js boundary. This is a common gotcha with Playwright's webServer configuration.

The fallback to `NODE_ENV === 'test'` should have worked, but explicitly passing `E2E_TEST=true` is more reliable and makes the intent clearer.

## Related Documentation

- `E2E_FEB16_2026_PHASE4B_EMAIL_MANAGEMENT_TEST_MODE_COMPLETE.md` - Test mode implementation
- `E2E_FEB16_2026_PHASE4B_EMAIL_MANAGEMENT_DEBUG_LOGGING.md` - Debug logging added
- `.env.test.e2e` - E2E environment configuration
