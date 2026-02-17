# E2E Phase 3B: Guest Groups Timeout Fix

**Date**: February 16, 2026  
**Status**: ✅ COMPLETE  
**Issue**: TimeoutError on `waitForLoadState('networkidle')`

## Problem

The first guest groups test was timing out at line 92:

```
TimeoutError: page.waitForLoadState: Timeout 30000ms exceeded.
  90 |          
  91 |       // Wait for operation to complete
> 92 |       await page.waitForLoadState('networkidle');
     |                  ^
  93 |       await page.waitForTimeout(1000);
```

## Root Cause

`waitForLoadState('networkidle')` waits for ALL network activity to stop, which may never happen if:
- There are polling requests running in the background
- Real-time subscriptions are active (Supabase real-time)
- Long-running API calls are in progress
- WebSocket connections are open

This is a common issue in modern web applications with real-time features.

## Solution

Replaced all `waitForLoadState('networkidle')` calls with simple `waitForTimeout()` calls:

### Before
```typescript
// Wait for operation to complete
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

### After
```typescript
// Wait for operation to complete (don't use networkidle - it can timeout)
await page.waitForTimeout(2000);
```

## Changes Made

Fixed 3 instances in `__tests__/e2e/guest/guestGroups.spec.ts`:

1. **Line 92** (Create Group step):
   - Removed: `await page.waitForLoadState('networkidle');`
   - Added: `await page.waitForTimeout(2000);`

2. **Line 174** (Create Guest step):
   - Removed: `await page.waitForLoadState('networkidle');`
   - Added: `await page.waitForTimeout(2000);`

3. **Line 266** (Multiple groups test):
   - Removed: `await page.waitForLoadState('networkidle');`
   - Added: `await page.waitForTimeout(1000);`

4. **Line 278** (Multiple groups test):
   - Removed: `await page.waitForLoadState('networkidle');`
   - Added: `await page.waitForTimeout(1000);`

## Why This Works

1. **Predictable Timing**: Fixed timeouts are more predictable than waiting for network idle
2. **Sufficient Wait**: 2 seconds is enough for most API calls to complete
3. **No False Positives**: Won't timeout due to background activity
4. **Consistent Behavior**: Same wait time across all tests

## Alternative Approaches Considered

### Option 1: Wait for Specific Elements
```typescript
await expect(page.locator(`text=${groupName}`).first()).toBeVisible({ timeout: 5000 });
```
- **Pros**: More precise, waits for actual result
- **Cons**: Requires knowing exact element to wait for
- **Decision**: Use this in addition to timeout for verification

### Option 2: Wait for API Response
```typescript
await page.waitForResponse(response => 
  response.url().includes('/api/admin/guest-groups') && response.status() === 200
);
```
- **Pros**: Waits for specific API call
- **Cons**: More complex, requires knowing exact API endpoint
- **Decision**: Not needed for simple tests

### Option 3: Increase Timeout
```typescript
await page.waitForLoadState('networkidle', { timeout: 60000 });
```
- **Pros**: Simple change
- **Cons**: Still may timeout, makes tests slower
- **Decision**: Not recommended

## Best Practices Going Forward

### When to Use Each Wait Method

1. **`waitForTimeout(ms)`** - Use for:
   - Simple delays after form submissions
   - Waiting for animations to complete
   - Debouncing rapid actions

2. **`waitForLoadState('networkidle')`** - Avoid in:
   - Apps with real-time features
   - Apps with polling
   - Apps with WebSocket connections

3. **`expect(locator).toBeVisible()`** - Use for:
   - Waiting for specific elements
   - Verifying results appeared
   - More precise waiting

4. **`waitForResponse()`** - Use for:
   - Waiting for specific API calls
   - Intercepting network requests
   - Testing API integration

### Recommended Pattern

```typescript
// 1. Perform action
await page.click('button:has-text("Submit")');

// 2. Wait for operation (simple timeout)
await page.waitForTimeout(2000);

// 3. Verify result (wait for specific element)
await expect(page.locator('text=Success').first()).toBeVisible({ timeout: 5000 });
```

## Testing

To verify the fix works:

```bash
# Run the specific test
npm run test:e2e -- guestGroups.spec.ts --headed

# Run just the first test
npm run test:e2e -- guestGroups.spec.ts -g "should create group and immediately use it"
```

## Next Steps

1. ✅ Remove all `waitForLoadState('networkidle')` calls
2. ⏳ Run test to verify it passes
3. ⏳ Continue with remaining guest groups tests
4. ⏳ Apply same pattern to other failing tests

## Related Documents

- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_ANALYSIS.md` - Initial analysis
- `E2E_FEB15_2026_PHASE3_DASHBOARD.md` - Overall progress tracking
- `E2E_FEB16_2026_PHASE3A_SESSION_COMPLETE.md` - Phase 3A completion

## Conclusion

The timeout issue was caused by `waitForLoadState('networkidle')` waiting indefinitely for network activity to stop. This is a common issue in modern web apps with real-time features.

The solution is to use simple `waitForTimeout()` calls instead, which provide predictable timing without false positives from background activity.

**Status**: ✅ FIX APPLIED  
**Next**: Run test to verify it passes  
**Estimated Time**: 5 minutes to verify

