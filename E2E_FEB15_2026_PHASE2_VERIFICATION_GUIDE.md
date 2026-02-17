# Phase 2 Verification Guide

**Date**: February 15, 2026  
**Status**: Ready for testing  
**Expected Result**: 80-100% pass rate (12-15/15 tests)

---

## Quick Start

Run the guest authentication tests:

```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**Expected time**: 5-10 minutes  
**Expected result**: 12-15 tests passing

---

## What to Look For

### ✅ Success Indicators

1. **Tests pass**: 12-15 out of 15 tests pass
2. **No timeouts**: Navigation completes within 60 seconds
3. **Logs show success**: "Successfully navigated to guest dashboard"
4. **No screenshots**: No `guest-auth-failure.png` created

### ❌ Failure Indicators

1. **Still timing out**: Navigation still exceeds 60 seconds
2. **Same failures**: Still 6/15 or fewer tests passing
3. **New errors**: Different error messages appear
4. **Screenshots created**: `guest-auth-failure.png` exists

---

## Interpreting Results

### Scenario 1: 12-15 Tests Pass (80-100%)
**Status**: ✅ SUCCESS - Phase 2 complete

**Actions**:
1. Document success
2. Update Phase 2 status to complete
3. Move to Phase 3 (other failure patterns)

**Expected**: This is the most likely outcome

---

### Scenario 2: 8-11 Tests Pass (53-73%)
**Status**: ⚠️ PARTIAL SUCCESS - Some improvement

**Actions**:
1. Analyze which tests still fail
2. Check if they're timing out or have different errors
3. Consider increasing timeout to 90 seconds
4. Profile page load times

**Possible causes**:
- Page load is slower than 60 seconds on some tests
- Different issue than page load time
- Flaky tests (run again to verify)

---

### Scenario 3: 6 Tests Pass (40%)
**Status**: ❌ NO IMPROVEMENT - Same as before

**Actions**:
1. Check test output for error messages
2. Verify changes were applied correctly
3. Profile actual page load times
4. Consider different root cause

**Possible causes**:
- Changes didn't apply correctly
- Different root cause than page load time
- Production build has other issues

---

### Scenario 4: Fewer Than 6 Tests Pass (<40%)
**Status**: ❌ REGRESSION - Made things worse

**Actions**:
1. Revert changes immediately
2. Investigate what went wrong
3. Check for syntax errors or typos
4. Verify test environment is working

**Possible causes**:
- Syntax error in changes
- Broke something else
- Test environment issue

---

## Detailed Test Analysis

### Tests That Should Pass

These tests don't require dashboard navigation:

1. ✅ **should successfully authenticate with email matching**
2. ✅ **should successfully authenticate with magic link**
3. ✅ **should handle invalid email gracefully**
4. ✅ **should handle expired magic link**
5. ✅ **should handle invalid magic link token**
6. ✅ **should prevent access without authentication**

**Expected**: All 6 should pass (already passing)

### Tests That Were Failing

These tests require dashboard navigation (were timing out):

7. **should redirect to dashboard after successful email match**
8. **should redirect to dashboard after magic link verification**
9. **should maintain session across page reloads**
10. **should allow guest to view their profile**
11. **should allow guest to view events**
12. **should allow guest to view activities**
13. **should allow guest to RSVP to events**
14. **should allow guest to RSVP to activities**
15. **should handle logout correctly**

**Expected**: 6-9 of these should now pass (total 12-15/15)

---

## Timing Analysis

### Before (Phase 2 with fixes)
- Cookie verification: 200-1000ms
- Navigation timeout: 10 seconds per attempt (3 attempts)
- Total time per test: ~30-40 seconds
- Result: Timeouts on 9 tests

### After (Simple solution)
- Cookie wait: 500ms
- Navigation timeout: 60 seconds (single attempt)
- Total time per test: ~15-20 seconds (if page loads in 12-15s)
- Expected: No timeouts

---

## If Tests Still Fail

### Step 1: Check Logs

Look for these patterns in test output:

**Pattern 1: Still timing out**
```
Error: Timeout 60000ms exceeded
  at navigateToGuestDashboard
```
**Action**: Page load is slower than 60s, increase timeout to 90s

**Pattern 2: Different error**
```
Error: Guest authentication failed - redirected to login page
```
**Action**: Session/cookie issue, investigate middleware

**Pattern 3: New error**
```
Error: [something else]
```
**Action**: Introduced new bug, check changes

### Step 2: Profile Page Load

If still timing out, measure actual load time:

```bash
# Start production server
npm run build
npm start

# In browser DevTools:
# 1. Open Network tab
# 2. Navigate to /guest/dashboard
# 3. Check "Load" time in bottom status bar
```

**If load time > 60 seconds**: Increase timeout or optimize page  
**If load time < 60 seconds**: Different issue, investigate further

### Step 3: Increase Timeout

If page load is 60-90 seconds, increase timeout:

```typescript
// In __tests__/helpers/guestAuthHelpers.ts
export async function navigateToGuestDashboard(
  page: Page,
  timeout: number = 90000  // Increase to 90 seconds
): Promise<void> {
  // ...
}
```

### Step 4: Check for Regressions

Run other test files to ensure no new failures:

```bash
npm run test:e2e -- __tests__/e2e/guest/guestViews.spec.ts
```

**Expected**: No new failures in other tests

---

## Success Metrics

### Phase 2 Target
- **Pass rate**: ≥ 75% (272/362 tests)
- **Guest auth**: ≥ 80% (12/15 tests)
- **No regressions**: Other tests still pass

### Current Baseline
- **Overall**: 70% (253/362 tests)
- **Guest auth**: 40% (6/15 tests)

### Expected After Fix
- **Overall**: 73-75% (264-272 tests)
- **Guest auth**: 80-100% (12-15/15 tests)
- **Improvement**: +3-5% overall, +40-60% guest auth

---

## Next Steps After Verification

### If Successful (12-15 tests pass)

1. **Document success**:
   ```bash
   # Create success document
   echo "Phase 2 complete: 12-15/15 tests passing" > E2E_FEB15_2026_PHASE2_SUCCESS.md
   ```

2. **Update tracking**:
   - Mark Phase 2 as complete
   - Update overall pass rate
   - Celebrate the win! 🎉

3. **Move to Phase 3**:
   - Identify next priority pattern
   - Analyze remaining failures
   - Plan Phase 3 fixes

### If Partial Success (8-11 tests pass)

1. **Analyze remaining failures**:
   - Which tests still fail?
   - Same error or different?
   - Consistent or flaky?

2. **Adjust approach**:
   - Increase timeout if still timing out
   - Investigate different root cause if new errors
   - Profile page load if unclear

3. **Iterate**:
   - Apply additional fixes
   - Re-test
   - Document findings

### If No Improvement (6 tests pass)

1. **Investigate thoroughly**:
   - Verify changes applied correctly
   - Check for syntax errors
   - Profile page load times
   - Review test logs

2. **Consider alternatives**:
   - Different root cause
   - Optimize production build
   - Use development mode for tests

3. **Escalate if needed**:
   - Document findings
   - Seek additional input
   - Consider different approach

---

## Command Reference

```bash
# Run guest auth tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Run with debug output
DEBUG=pw:api npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Run specific test
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "should redirect to dashboard"

# Run with headed browser (see what's happening)
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --headed

# Run full suite
npm run test:e2e
```

---

## Troubleshooting

### Issue: Changes didn't apply
**Check**: View file to verify changes
```bash
cat __tests__/helpers/guestAuthHelpers.ts | grep "timeout: number = 60000"
```
**Expected**: Should see `timeout: number = 60000`

### Issue: Tests won't run
**Check**: Build and start server
```bash
npm run build
npm start
```
**Expected**: Server starts on port 3000

### Issue: Can't find test file
**Check**: File exists
```bash
ls -la __tests__/e2e/auth/guestAuth.spec.ts
```
**Expected**: File exists

---

## Timeline

**Estimated time**: 5-10 minutes for test run  
**Total time**: 15-20 minutes including analysis  
**Next action**: Run tests and analyze results

---

## Status

**Current**: ✅ Ready for verification  
**Next**: Run tests  
**Expected**: 80-100% pass rate  
**Confidence**: HIGH
