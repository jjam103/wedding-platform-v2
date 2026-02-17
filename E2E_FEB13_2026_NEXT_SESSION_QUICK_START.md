# E2E Reference Blocks - Next Session Quick Start
**Date**: February 13, 2026
**Current Status**: 50% pass rate (4/8 tests passing)
**Goal**: Achieve 100% pass rate

## Quick Context

We've improved the pass rate from 0% to 50% by:
1. ✅ Cleaning database of old test data
2. ✅ Fixing slug generation uniqueness
3. ✅ Implementing improved waiting strategy for React rendering

## Current Situation

### ✅ Passing Tests (4/8)
- should create activity reference block
- should create multiple reference types in one section
- should filter references by type in picker
- should detect broken references

### ❌ Failing Tests (4/8)
- should create event reference block
- should remove reference from section
- should prevent circular references
- should display reference blocks in guest view

## What to Do Next

### Step 1: Run One Failing Test in Isolation (5 minutes)

Pick the first failing test and run it with debug output:

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:234 --workers=1 --headed
```

This will:
- Show the browser window
- Display detailed error messages
- Help you see what's actually happening

### Step 2: Identify the Failure Point (10 minutes)

Look for:
- Which line is failing?
- What selector is it looking for?
- Is the element not visible, or does it not exist?
- What does the page actually look like at that point?

### Step 3: Fix the Issue (15 minutes)

Common fixes:
- **Element not found**: Update the selector
- **Timing issue**: Add more waiting logic
- **Wrong page**: Check navigation logic
- **Data issue**: Verify test data setup

### Step 4: Verify the Fix (5 minutes)

Run the test again to confirm it passes:

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:234 --workers=1
```

### Step 5: Repeat for Other Failing Tests (1 hour)

Follow steps 1-4 for each of the remaining 3 failing tests.

### Step 6: Run Full Suite (5 minutes)

Once all tests pass individually, run the full suite:

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --workers=1
```

## Common Issues and Solutions

### Issue #1: Element Not Found

**Symptom**: `TimeoutError: waiting for selector`

**Solution**: 
1. Check if the selector is correct
2. Add retry logic with `expect().toPass()`
3. Wait for parent element first

### Issue #2: Wrong Page

**Symptom**: Test navigates to wrong page or 404

**Solution**:
1. Check navigation logic
2. Verify URL is correct
3. Add explicit navigation wait

### Issue #3: Data Not Visible

**Symptom**: Test data created but not showing in UI

**Solution**:
1. Wait for API call to complete
2. Wait for React to render
3. Add retry logic

### Issue #4: Modal Not Opening

**Symptom**: Click doesn't open modal

**Solution**:
1. Verify element is clickable
2. Check if modal selector is correct
3. Wait for modal animation

## Useful Commands

```bash
# Run single test with browser visible
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:234 --workers=1 --headed

# Run single test with debug output
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:234 --workers=1 --debug

# Run full suite
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --workers=1

# Run with trace (for detailed debugging)
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:234 --workers=1 --trace on
```

## Files to Reference

1. `E2E_FEB13_2026_SESSION_COMPLETE_SUMMARY.md` - Full session summary
2. `E2E_FEB13_2026_REFERENCE_BLOCKS_ROOT_CAUSE.md` - Root cause analysis
3. `E2E_FEB13_2026_REFERENCE_BLOCKS_FIX_STATUS.md` - Current fix status
4. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Test file

## Expected Timeline

- **Step 1-2**: 15 minutes per test (identify issue)
- **Step 3-4**: 20 minutes per test (fix and verify)
- **Total**: ~2 hours for all 4 failing tests
- **Buffer**: 30 minutes for unexpected issues

**Total Estimated Time**: 2.5 hours to achieve 100% pass rate

## Success Criteria

- ✅ All 8 tests passing
- ✅ No flaky tests (run suite 3 times to verify)
- ✅ Tests complete in reasonable time (<5 minutes total)
- ✅ Documentation updated

## Quick Tips

1. **Run tests with --headed flag** to see what's happening
2. **Add console.log** statements to understand test flow
3. **Check test screenshots** in playwright-report folder
4. **Use browser DevTools** to inspect elements
5. **Don't assume - verify** by looking at actual UI

## If You Get Stuck

1. **Check the component code** - `components/admin/SectionEditor.tsx`
2. **Check the API routes** - `app/api/admin/sections/`
3. **Check the database** - Use `scripts/diagnose-*.mjs` scripts
4. **Ask for help** - Document what you've tried and what you're seeing

## Remember

- The waiting strategy fix works (4 tests passing proves it)
- Each failing test likely has a unique issue
- Take it one test at a time
- Document your findings as you go

Good luck! 🚀
