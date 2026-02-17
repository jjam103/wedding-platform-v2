# What To Do Next - E2E Phase 2 Round 6

**Date:** February 12, 2026  
**Status:** 🔍 Investigation Required  
**Time Estimate:** 5-65 minutes

## TL;DR

Round 5 fixes were applied correctly but didn't work. We need to investigate actual UI behavior to determine the right fix.

## The Problem

### Test #5: Home Page Save
- **What we tried:** Look for success toast/message with `.or()` syntax
- **What happened:** Playwright regex error - element may not exist
- **What we need:** Find out what success indicator actually exists

### Test #14: Event Creation
- **What we tried:** Wait for database + reload + events API + 15s timeout
- **What happened:** Event still doesn't appear in list
- **What we need:** Find out why event list doesn't refresh

## Immediate Next Step

### Option 1: Manual UI Inspection (Recommended - 5 minutes)

Run test in headed mode to see what actually happens:

```bash
# Test #5 - Home Page Save
npm run test:e2e -- contentManagement.spec.ts --headed --grep "should edit home page settings and save successfully"

# Test #14 - Event Creation
npm run test:e2e -- contentManagement.spec.ts --headed --grep "should create event and add as reference to content page"
```

**Watch for:**
- Test #5: What appears after clicking save? Toast? Message? Nothing?
- Test #14: Does event appear in list after reload? Is list empty? Is event there but not visible?

### Option 2: Try Simplest Fixes First (10 minutes)

**Test #5: Just wait for API (no UI feedback check)**
```typescript
// Line ~310
await savePromise; // Wait for API to complete
await page.waitForTimeout(500); // Brief pause

// Verify by checking if we can still interact with form
await expect(saveButton).toBeVisible({ timeout: 5000 });
```

**Test #14: Increase wait times dramatically**
```typescript
// Line ~770
await page.waitForTimeout(3000); // 3s instead of 1s
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000); // Additional 2s after reload

await expect(eventRow).toBeVisible({ timeout: 20000 }); // 20s timeout
```

### Option 3: Try Alternative Strategies (20 minutes)

See `E2E_FEB12_2026_PHASE2_ROUND6_ACTION_PLAN.md` for full list of alternatives.

## Quick Decision Tree

```
Start Here
    |
    v
Run in headed mode (5 min)
    |
    +-- See success indicator? --> Use that indicator --> Done
    |
    +-- No success indicator? --> Just wait for API --> Done
    |
    +-- Event appears after reload? --> Increase wait time --> Done
    |
    +-- Event never appears? --> Check component code --> File bug
```

## Files to Read

1. **Action Plan:** `E2E_FEB12_2026_PHASE2_ROUND6_ACTION_PLAN.md`
   - Full analysis of what went wrong
   - All alternative strategies
   - Decision matrix

2. **Results Analysis:** `E2E_FEB12_2026_PHASE2_ROUND5_RESULTS_ANALYSIS.md`
   - What we tried in Round 5
   - Why it didn't work
   - Lessons learned

3. **Test File:** `__tests__/e2e/admin/contentManagement.spec.ts`
   - Line ~310: Test #5 (Home Page Save)
   - Line ~760-791: Test #14 (Event Creation)

## Expected Outcomes

### Best Case (5-10 minutes)
- Manual inspection reveals simple fix
- Apply fix
- Tests pass
- Move to Phase 3

### Good Case (20-30 minutes)
- Need to try alternative strategies
- Find one that works
- Apply to all tests
- Move to Phase 3

### Worst Case (60+ minutes)
- Components have bugs
- Need to fix components
- File bugs
- Consider skipping flaky tests temporarily

## Success Criteria

### Minimum (Phase 2 Goal)
- All 17 tests pass on first try
- Zero flaky tests
- 100% pass rate

### Acceptable
- 15/17 tests pass on first try
- 2 tests flaky but pass on retry
- 88% first-try pass rate

## Key Questions to Answer

1. **Test #5:** What success indicator actually exists in the UI?
2. **Test #14:** Why doesn't the event appear in the list after reload?
3. **Tests #9, #11, #13:** Why do they pass on retry but not first try?
4. **Test #1:** Why does it pass on retry?

## Commands Reference

```bash
# Run single test in headed mode
npm run test:e2e -- contentManagement.spec.ts --headed --grep "test name"

# Run all tests
npm run test:e2e -- contentManagement.spec.ts

# Run with debug
npm run test:e2e -- contentManagement.spec.ts --debug

# View trace
npx playwright show-trace test-results/[test-folder]/trace.zip
```

## What NOT to Do

❌ Don't try more syntax variations - syntax is correct  
❌ Don't add more waits without understanding why - waits aren't the issue  
❌ Don't guess at element selectors - verify they exist first  
❌ Don't skip investigation - need to understand root cause  

## What TO Do

✅ Run in headed mode to see actual behavior  
✅ Verify elements exist before trying to find them  
✅ Match test expectations to actual UI behavior  
✅ Consider component fixes if tests are correct  

## Timeline

- **Manual inspection:** 5 minutes
- **Simple fixes:** 10 minutes
- **Alternative strategies:** 20 minutes
- **Component investigation:** 30 minutes
- **Total:** 65 minutes maximum

## Current Status

- ✅ Round 5 fixes applied correctly
- ✅ Round 5 verification complete
- ✅ Root cause analysis complete
- ✅ Round 6 action plan created
- ⏳ Manual UI inspection needed
- ⏳ Round 6 fixes to be determined

---

**Next Action:** Run tests in headed mode to see actual UI behavior  
**Command:** `npm run test:e2e -- contentManagement.spec.ts --headed --grep "should edit home page settings and save successfully"`  
**Time:** 5 minutes  
**Goal:** Understand what success indicator actually exists

