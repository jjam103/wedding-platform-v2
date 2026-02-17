# E2E Email Management Test - Final Status & Recommendation

**Date**: February 16, 2026  
**Test**: `should select recipients by group`  
**Status**: ENVIRONMENT VARIABLE ISSUE IDENTIFIED

## Current Situation

The fix has been applied (changed `E2E_TEST` to `NEXT_PUBLIC_E2E_TEST`), but the test is still failing because **the environment variable is not reaching the Next.js server runtime**.

## Root Cause (Deeper Analysis)

The issue is more complex than initially thought:

1. **`NEXT_PUBLIC_` variables are embedded at BUILD time**, not runtime
2. **Playwright starts the server with `npm run dev`**, which uses the already-built code
3. **The `.env.test.e2e` file is loaded by Playwright**, but Next.js doesn't automatically reload it
4. **The server needs a REBUILD**, not just a restart

## Why Our Fix Didn't Work Yet

- ✅ Code changes are correct
- ✅ Environment file is correct
- ✅ Playwright config is correct
- ❌ Next.js hasn't rebuilt with the new environment variable

## Recommended Solution: Use Server-Side Check

Instead of relying on `NEXT_PUBLIC_` (which requires rebuild), use a server-side only check that works at runtime:

### Option 1: Check NODE_ENV Only (SIMPLEST)

Since we already set `NODE_ENV=test` in `.env.test.e2e`, we can rely on that:

**In `services/emailService.ts`**:
```typescript
// E2E Test Mode: Skip actual email sending in test environment
const isE2ETest = process.env.NODE_ENV === 'test';

if (isE2ETest) {
  console.log('[emailService.sendEmail] E2E Test Mode (NODE_ENV=test) - Skipping Resend API call');
  // ... mock email logic
}
```

This works because:
- `NODE_ENV` is always available server-side
- Already set to `'test'` in E2E environment
- No rebuild required
- Works immediately

### Option 2: Add to next.config.ts (MORE EXPLICIT)

Add explicit environment variable configuration:

**In `next.config.ts`**:
```typescript
const nextConfig = {
  // ... existing config
  env: {
    E2E_TEST_MODE: process.env.E2E_TEST_MODE || process.env.NEXT_PUBLIC_E2E_TEST || 'false',
  },
};
```

Then use `process.env.E2E_TEST_MODE` in services.

### Option 3: Rebuild Next.js (CURRENT APPROACH)

Keep the `NEXT_PUBLIC_E2E_TEST` approach but force a rebuild:

```bash
# Clear Next.js cache
rm -rf .next

# Run test (will trigger rebuild)
npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
```

## Immediate Action Plan

### Quick Fix (5 minutes)

1. **Revert to using NODE_ENV check**:
   ```bash
   # In services/emailService.ts, change line ~418:
   const isE2ETest = process.env.NODE_ENV === 'test';
   ```

2. **Run the test**:
   ```bash
   npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
   ```

3. **Verify it works** (should see E2E test mode logs)

### Proper Fix (15 minutes)

1. **Clear Next.js build cache**:
   ```bash
   rm -rf .next
   ```

2. **Run test** (forces rebuild with new env vars):
   ```bash
   npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
   ```

3. **Verify E2E test mode activates**

## Why NODE_ENV Check Is Better

**Advantages**:
- ✅ Already set in `.env.test.e2e`
- ✅ Works immediately (no rebuild)
- ✅ Server-side only (more secure)
- ✅ Standard Node.js convention
- ✅ No Next.js-specific quirks

**Disadvantages**:
- ❌ Less explicit (relies on NODE_ENV=test)
- ❌ Could affect other test-related code

## Recommendation

**Use NODE_ENV check for immediate fix**, then optionally add explicit E2E flag later if needed.

### Immediate Changes Needed

1. **`services/emailService.ts`** (line ~418):
   ```typescript
   // E2E Test Mode: Skip actual email sending in test environment
   // NODE_ENV=test is set in .env.test.e2e and always available server-side
   const isE2ETest = process.env.NODE_ENV === 'test';
   
   if (isE2ETest) {
     console.log('[emailService.sendEmail] E2E Test Mode (NODE_ENV=test) - Skipping Resend API call');
     // ... rest of mock logic
   }
   ```

2. **`services/photoService.ts`** (line ~25):
   ```typescript
   const useMockB2 = process.env.USE_MOCK_B2 === 'true' ||
                     process.env.NODE_ENV === 'test' ||
                     process.env.PLAYWRIGHT_TEST === 'true';
   ```

3. **`__tests__/mocks/serviceDetector.ts`** (line ~15):
   ```typescript
   const indicators = [
     process.env.NODE_ENV === 'test',
     process.env.PLAYWRIGHT_TEST === 'true',
     // ... other indicators
   ];
   ```

## Expected Outcome

After using NODE_ENV check:
- ✅ E2E test mode activates immediately
- ✅ Console shows: "[emailService.sendEmail] E2E Test Mode (NODE_ENV=test) - Skipping Resend API call"
- ✅ Mock email sent instantly
- ✅ Modal closes within 2 seconds
- ✅ Test passes

## Files to Modify (Quick Fix)

1. `services/emailService.ts` - Change to `NODE_ENV` check
2. `services/photoService.ts` - Already has `NODE_ENV` check as fallback
3. `__tests__/mocks/serviceDetector.ts` - Already has `NODE_ENV` check

## Alternative: Keep NEXT_PUBLIC_ But Force Rebuild

If you want to keep the `NEXT_PUBLIC_E2E_TEST` approach:

```bash
# Stop all processes
pkill -f "next dev"

# Clear build cache
rm -rf .next

# Run test (will rebuild)
npm run test:e2e -- emailManagement.spec.ts --grep "should select recipients by group"
```

This should work, but takes longer (rebuild time).

## Summary

**Problem**: Environment variable not reaching server  
**Cause**: `NEXT_PUBLIC_` vars need rebuild, server using old build  
**Quick Fix**: Use `NODE_ENV === 'test'` check instead  
**Proper Fix**: Clear `.next` and rebuild  
**Recommendation**: Use NODE_ENV check for simplicity

## Next Steps

1. Choose approach (NODE_ENV check recommended)
2. Apply changes
3. Run test
4. Verify E2E test mode logs appear
5. Confirm test passes
6. Document success

The fix is ready - we just need to use the right environment variable check that works without rebuild.
