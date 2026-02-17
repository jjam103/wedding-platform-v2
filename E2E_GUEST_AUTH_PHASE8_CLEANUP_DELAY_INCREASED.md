# E2E Guest Auth Phase 8: Cleanup Delay Increased

**Status**: ✅ Cleanup delay increased to 5 seconds  
**Date**: 2026-02-06  
**Test File**: `__tests__/e2e/auth/guestAuth.spec.ts`

## Summary

Increased the `afterEach` cleanup delay from 2 seconds to 5 seconds to fix remaining session deletion race condition failures.

## Changes Applied

### Cleanup Delay Increase

**File**: `__tests__/e2e/auth/guestAuth.spec.ts` (line 119)

```typescript
// Before (2 seconds)
await new Promise(resolve => setTimeout(resolve, 2000));

// After (5 seconds)
await new Promise(resolve => setTimeout(resolve, 5000));
```

**Rationale**:
- Dashboard makes 4 API calls that can take 3-5 seconds total
- Tests wait for `networkidle` (all network requests must settle)
- 2-second delay was insufficient - sessions deleted mid-flight
- 5-second delay ensures all API calls complete before cleanup

## Expected Impact

### Tests Expected to Fix (4 tests)

1. **Test 3**: Session cookie creation - navigation timeout
2. **Test 4**: Email matching authentication - navigation timeout  
3. **Test 11**: Logout flow - still on dashboard after logout
4. **Test 15**: Audit log events - no login logs found

**Root Cause**: All 4 tests failed because sessions were deleted before dashboard API calls completed, causing middleware to reject requests and prevent proper navigation/data loading.

### Tests Already Fixed (8 tests)

1. ✅ Test 2: Invalid email format
2. ✅ Test 5: Non-existent email
3. ✅ Test 8: Expired magic link
4. ✅ Test 9: Already used magic link
5. ✅ Test 10: Invalid/missing token
6. ✅ Test 12: Session persistence (fixed by cleanup delay)
7. ✅ Test 13: Tab switching
8. ✅ Test 1: Loading state

### Tests Still Failing (3 tests)

1. ❌ Test 6: Magic link request/verify - success message not displaying
2. ❌ Test 7: Success message after request - email input not cleared
3. ❌ Test 14: Error handling - error message not displaying

**Root Cause**: UI state issues unrelated to session deletion

## Test Results Prediction

**Before**: 7/15 passing (47%)  
**After**: 11/15 passing (73%) - if session deletion was the only issue  
**Realistic**: 11-13/15 passing (73-87%) - depends on UI state issues

## Technical Details

### Why 5 Seconds?

1. **Dashboard API Calls**: 4 concurrent requests
   - `/api/guest/events`
   - `/api/guest/rsvps`
   - `/api/guest/wedding-info`
   - `/api/guest/announcements`

2. **Observed Timing**:
   - Each request: 600-1200ms
   - Total with middleware: 3-5 seconds
   - `networkidle` waits for all to complete

3. **Safety Margin**:
   - 5 seconds > 5 seconds max observed
   - Accounts for CI/CD slowness
   - Prevents flaky tests

### Alternative Solutions Considered

1. ❌ **Shorter delay (3s)**: Too close to max observed time
2. ❌ **Longer delay (10s)**: Unnecessarily slow test suite
3. ✅ **5 seconds**: Optimal balance of reliability and speed

## Next Steps

1. **Run full test suite** to verify 5-second delay fixes session deletion issues
2. **Investigate UI state issues** for Tests 6, 7, 14 (success/error messages)
3. **Monitor test stability** - if still flaky, may need to increase to 6-7 seconds

## Files Modified

- `__tests__/e2e/auth/guestAuth.spec.ts` - Increased cleanup delay to 5 seconds

## Verification Command

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Success Criteria

- ✅ Tests 3, 4, 11, 15 should pass (session deletion no longer premature)
- ✅ Test 12 should remain passing (already fixed by 2s delay)
- ✅ No "No session found in database" errors in logs
- ✅ Dashboard API calls complete before cleanup runs

## Related Documents

- `E2E_GUEST_AUTH_PHASE8_ALL_FIXES_APPLIED.md` - Previous fixes (P0-P6)
- `E2E_GUEST_AUTH_PHASE8_CRITICAL_FINDING.md` - Root cause analysis
- `E2E_GUEST_AUTH_PHASE8_P0_FIX_SUCCESS.md` - Promise.all() pattern fix
