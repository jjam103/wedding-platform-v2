# E2E Email Management Test - Root Cause Analysis

**Date**: February 16, 2026  
**Test**: `should select recipients by group`  
**Status**: ROOT CAUSE IDENTIFIED

## Problem

The test fails because the modal doesn't close after sending an email, timing out after 15 seconds.

## Root Cause

**The E2E test mode is NOT activating** because the `E2E_TEST` environment variable is not reaching the Next.js server runtime.

### Evidence

1. **No console logs appear** from the email service:
   - Missing: `[emailService.sendEmail] E2E Test Mode - Skipping Resend API call`
   - Missing: `[emailService.sendEmail] Mock email sent successfully`

2. **The email service IS checking for E2E mode correctly**:
   ```typescript
   const isE2ETest = process.env.E2E_TEST === 'true' || process.env.NODE_ENV === 'test';
   ```

3. **The environment variable IS set in `.env.test.e2e`**:
   ```
   E2E_TEST=true
   ```

4. **The Playwright config IS passing the variable to webServer**:
   ```typescript
   webServer: {
     env: {
       E2E_TEST: process.env.E2E_TEST || 'true',
       // ...
     }
   }
   ```

## Why It's Not Working

The issue is that **Next.js doesn't automatically expose server-side environment variables to the runtime** unless they are:

1. **Prefixed with `NEXT_PUBLIC_`** (for client-side access)
2. **Explicitly loaded in `next.config.ts`** (for server-side access)
3. **Set in the shell environment** before starting the server

The Playwright `webServer.env` configuration sets environment variables for the **web server process**, but Next.js needs to be configured to **read and use** those variables.

## Solution

We have three options:

### Option A: Use NEXT_PUBLIC_ Prefix (RECOMMENDED)
Change the environment variable to `NEXT_PUBLIC_E2E_TEST` so it's automatically available in both client and server contexts.

**Pros**:
- Simple, no Next.js config changes needed
- Works immediately
- Follows Next.js conventions

**Cons**:
- Exposes the variable to the client (not a security issue for a test flag)

### Option B: Configure next.config.ts
Add the environment variable to `next.config.ts` so Next.js knows to load it.

**Pros**:
- Keeps variable server-side only
- More secure

**Cons**:
- Requires Next.js config changes
- More complex

### Option C: Hardcode for E2E Tests (TEMPORARY)
Temporarily hardcode `E2E_TEST=true` in the email service to verify the fix works.

**Pros**:
- Quick verification
- Proves the hypothesis

**Cons**:
- Not a permanent solution
- Must be reverted

## Recommended Fix: Option A

1. **Update `.env.test.e2e`**:
   ```
   NEXT_PUBLIC_E2E_TEST=true
   ```

2. **Update `playwright.config.ts`**:
   ```typescript
   webServer: {
     env: {
       NEXT_PUBLIC_E2E_TEST: 'true',
       // ...
     }
   }
   ```

3. **Update `services/emailService.ts`**:
   ```typescript
   const isE2ETest = process.env.NEXT_PUBLIC_E2E_TEST === 'true' || process.env.NODE_ENV === 'test';
   ```

4. **Update `services/photoService.ts`** (also uses E2E_TEST):
   ```typescript
   const useMockB2 = process.env.USE_MOCK_B2 === 'true' ||
                     process.env.NEXT_PUBLIC_E2E_TEST === 'true' || 
                     process.env.PLAYWRIGHT_TEST === 'true' ||
                     process.env.NODE_ENV === 'test';
   ```

5. **Update `__tests__/mocks/serviceDetector.ts`**:
   ```typescript
   const indicators = [
     process.env.NODE_ENV === 'test',
     process.env.NEXT_PUBLIC_E2E_TEST === 'true',
     process.env.PLAYWRIGHT_TEST === 'true',
     // ...
   ];
   ```

## Expected Outcome

After applying this fix:

1. **Console logs will appear**:
   ```
   [emailService.sendEmail] E2E Test Mode - Skipping Resend API call
   [emailService.sendEmail] Mock email sent successfully: mock-email-1234567890-abc123
   ```

2. **Email sending will be instant** (no Resend API call)

3. **Modal will close immediately** after clicking "Send Email"

4. **Test will pass** within 1-2 seconds

## Verification Steps

1. Apply the fix
2. Run the test: `npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"`
3. Check console output for E2E test mode logs
4. Verify modal closes within 2 seconds
5. Confirm test passes

## Additional Notes

- This same fix will benefit ALL E2E tests that rely on E2E test mode
- The `NEXT_PUBLIC_` prefix is safe for test flags (not sensitive data)
- This is a common pattern in Next.js applications for test/development flags
