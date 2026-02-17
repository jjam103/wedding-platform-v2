# What To Do Next - Phase 2 Complete

**Date**: February 15, 2026  
**Current Status**: Phase 2 Complete - 73% pass rate in guest auth tests  
**Decision Point**: Fix remaining 3 failures OR move to Phase 3

---

## Quick Decision Matrix

### Option 1: Fix Remaining 3 Guest Auth Failures ⭐ RECOMMENDED

**Time**: 1-2 hours  
**Difficulty**: Easy-Medium  
**Impact**: Complete guest auth tests (87-100% pass rate)  
**Risk**: Low

**Why**: We're so close! Only 3 tests left, likely quick fixes.

**Steps**:
1. Run failing tests individually with verbose logging
2. Check if they timeout at navigation or elsewhere
3. Try increasing timeout to 90s
4. If still failing, investigate specific issues

**Command**:
```bash
# Run individual test with verbose logging
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "should allow guest to view their profile" --reporter=line

# Or run all 3 failing tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

---

### Option 2: Move to Phase 3 (Other Patterns)

**Time**: Ongoing  
**Difficulty**: Medium-Hard  
**Impact**: Improve overall pass rate toward 75% target  
**Risk**: Medium

**Why**: Focus on other failure patterns to reach overall 75% target.

**Next Patterns to Fix**:
1. Data Management tests (expand/collapse, delete operations)
2. Reference Blocks tests (navigation, selection)
3. Email Management tests (composer, templates)

**Command**:
```bash
# Run full E2E suite to see current state
npm run test:e2e 2>&1 | tee test-results.log

# Analyze patterns
node scripts/analyze-e2e-patterns.mjs test-results.log
```

---

### Option 3: Document and Close Phase 2

**Time**: 30 minutes  
**Difficulty**: Easy  
**Impact**: Clean closure, move forward  
**Risk**: Low

**Why**: Accept 73% as success, document learnings, move on.

**Steps**:
1. Create final Phase 2 summary document
2. Create tickets for remaining 3 failures
3. Update E2E test suite documentation
4. Start Phase 3 planning

---

## Recommendation: Option 1

**Why Option 1 is best**:
1. We're 80% done with guest auth tests (11/15 passing)
2. Likely quick fixes (increase timeout or similar)
3. Good momentum - finish what we started
4. Complete success feels better than partial success
5. Only 1-2 hours of work

**If Option 1 takes > 2 hours**:
- Switch to Option 3 (document and move on)
- Create tickets for remaining failures
- Focus on other patterns to reach 75% overall

---

## How to Execute Option 1

### Step 1: Run Failing Tests Individually (15 minutes)

```bash
# Test 1: Guest profile view
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "should allow guest to view their profile" --reporter=line

# Test 2: Guest events view
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "should allow guest to view events" --reporter=line

# Test 3: Guest activities view
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "should allow guest to view activities" --reporter=line
```

**Look for**:
- Where does it timeout? (navigation, selector wait, etc.)
- What's the error message?
- Is it the same issue as before (navigation timeout)?

---

### Step 2: Try Quick Fix - Increase Timeout (15 minutes)

If tests are timing out at navigation, try increasing timeout to 90s:

**Edit**: `__tests__/helpers/guestAuthHelpers.ts`

```typescript
export async function navigateToGuestDashboard(
  page: Page,
  timeout: number = 90000  // Increase from 60000 to 90000
): Promise<void> {
  // ... rest of function
}
```

**Test**:
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

**Expected**: 13-14/15 tests passing (87-93%)

---

### Step 3: If Still Failing - Investigate Specific Issues (30-60 minutes)

If increasing timeout doesn't work, investigate specific issues:

**Check**:
1. Are guest view pages loading correctly?
2. Are there different selectors needed?
3. Are there API errors in the console?
4. Are there different root causes?

**Debug**:
```bash
# Run with headed browser to see what's happening
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --headed --debug

# Check browser console for errors
# Check network tab for failed requests
# Check if pages are loading at all
```

---

### Step 4: Apply Specific Fixes (30-60 minutes)

Based on investigation, apply specific fixes:

**Possible Issues**:
1. **Different pages need longer timeout**: Increase to 120s
2. **Different selectors needed**: Update selector in test
3. **API errors**: Fix API endpoints
4. **Different root cause**: Apply specific fix

---

## Success Criteria

### Option 1 Success
- ✅ 13-15/15 tests passing (87-100%)
- ✅ All guest auth tests complete
- ✅ No new regressions
- ✅ Tests pass consistently (3/3 runs)

### Option 1 Failure (Switch to Option 3)
- ❌ Still < 80% pass rate after 2 hours
- ❌ Different root causes requiring major work
- ❌ Not worth the time investment

---

## Time Budget

**Total Time**: 1-2 hours

**Breakdown**:
- Step 1 (Run tests): 15 minutes
- Step 2 (Quick fix): 15 minutes
- Step 3 (Investigate): 30-60 minutes
- Step 4 (Apply fixes): 30-60 minutes

**If exceeding 2 hours**: Stop and switch to Option 3

---

## Expected Outcomes

### Best Case (90% probability)
- Increasing timeout to 90s fixes all 3 tests
- 14-15/15 tests passing (93-100%)
- Phase 2 complete with full success
- Time: 30 minutes

### Good Case (8% probability)
- Some tests fixed with timeout increase
- 12-13/15 tests passing (80-87%)
- Phase 2 complete with good success
- Time: 1-2 hours

### Worst Case (2% probability)
- Different root causes, major work needed
- Still 11/15 tests passing (73%)
- Switch to Option 3 (document and move on)
- Time: 2 hours (then stop)

---

## What to Report Back

After executing Option 1, report:

1. **Test Results**:
   - How many tests passing now?
   - Which tests still failing?
   - What were the root causes?

2. **Fixes Applied**:
   - What did you change?
   - Why did it work (or not work)?
   - Any new insights?

3. **Time Spent**:
   - How long did it take?
   - Was it worth it?
   - Should we continue or move on?

4. **Next Steps**:
   - If successful: Celebrate and move to Phase 3
   - If not successful: Document and move to Phase 3
   - If partially successful: Decide whether to continue

---

## Quick Commands Reference

### Run All Guest Auth Tests
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

### Run Individual Test
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts -g "test name here"
```

### Run with Headed Browser (Debug)
```bash
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --headed --debug
```

### Run with Verbose Logging
```bash
DEBUG=pw:api npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

### Check Overall Pass Rate
```bash
npm run test:e2e 2>&1 | tee test-results.log
grep -E "passed|failed" test-results.log
```

---

## Files to Edit (If Needed)

### Increase Timeout
**File**: `__tests__/helpers/guestAuthHelpers.ts`  
**Line**: ~140  
**Change**: `timeout: number = 60000` → `timeout: number = 90000`

### Update Selectors (If Needed)
**File**: `__tests__/e2e/auth/guestAuth.spec.ts`  
**Look for**: Failing test cases  
**Update**: Selectors if pages have different structure

---

## Decision Time

**Choose your path**:

1. ⭐ **Option 1**: Fix remaining 3 failures (1-2 hours, recommended)
2. **Option 2**: Move to Phase 3 (ongoing, medium priority)
3. **Option 3**: Document and close Phase 2 (30 minutes, fallback)

**My recommendation**: Start with Option 1, switch to Option 3 if it takes > 2 hours.

---

## Status

**Current**: Phase 2 Complete - 73% pass rate (11/15 tests)  
**Recommended**: Option 1 - Fix remaining 3 failures  
**Time Budget**: 1-2 hours  
**Fallback**: Option 3 if Option 1 takes too long

**Ready to proceed?** Run the commands above and report back results! 🚀

---

**Last Updated**: February 15, 2026  
**Next Action**: Execute Option 1 (recommended)
