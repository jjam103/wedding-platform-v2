# E2E Phase 2 Round 6 - Next Steps

**Date:** February 12, 2026  
**Current Status:** 12/17 passing (71%), 3/17 flaky (18%), 2/17 failing (12%)  
**Goal:** Get to 17/17 passing on first try (100%)

## Quick Summary

**What We Know:**
- Tests #9 and #14 PASS individually but FAIL in suite
- This is definitively a test isolation issue, not a component bug
- Round 6 fixes improved Test #5 from failing to flaky
- Overall pass rate improved from 65% to 71%

**What We Need:**
- Identify why InlineSectionEditor doesn't load in Test #9
- Identify why event list doesn't refresh in Test #14
- Fix isolation without modifying component code

## Immediate Next Steps (Choose One)

### Option A: Diagnostic Logging (Recommended)
**Time:** 2 hours  
**Risk:** Low  
**Success Rate:** High

Add console.log statements to components to see what's happening:

1. **Add logging to InlineSectionEditor.tsx:**
   ```typescript
   useEffect(() => {
     console.log('[InlineSectionEditor] Mounting...');
     fetchSections();
   }, [pageType, pageId]);
   
   const fetchSections = useCallback(async () => {
     console.log('[InlineSectionEditor] Fetching sections...');
     const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
     console.log('[InlineSectionEditor] Response:', response.status);
     const result = await response.json();
     console.log('[InlineSectionEditor] Loaded:', result.data?.length, 'sections');
     setSections(result.data || []);
   }, [pageType, pageId]);
   ```

2. **Add logging to app/admin/events/page.tsx:**
   ```typescript
   const fetchEvents = useCallback(async () => {
     console.log('[EventsPage] Fetching events...');
     const response = await fetch('/api/admin/events');
     console.log('[EventsPage] Response:', response.status);
     const result = await response.json();
     console.log('[EventsPage] Loaded:', result.data?.events?.length, 'events');
     setEvents(result.data.events || []);
   }, [addToast]);
   ```

3. **Run tests in headed mode:**
   ```bash
   npm run test:e2e -- --headed --grep "should toggle inline section editor"
   npm run test:e2e -- --headed --grep "should create event and add as reference"
   ```

4. **Watch console output** to see where flow breaks

5. **Implement targeted fix** based on findings

**Pros:**
- Non-invasive
- Reveals exact failure point
- Easy to remove after debugging

**Cons:**
- Requires component code changes (temporary)
- Need to remember to remove logging

### Option B: Increase Isolation Waits
**Time:** 30 minutes  
**Risk:** Low  
**Success Rate:** Medium

Increase wait times to give components more time to settle:

1. **Increase beforeEach wait from 500ms to 3000ms:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.waitForTimeout(3000); // Was 500ms
     await page.goto('http://localhost:3000/admin/home-page');
     await page.waitForLoadState('networkidle');
     await page.waitForTimeout(2000); // Extra wait after load
   });
   ```

2. **Increase Test #14 database wait from 2s to 5s:**
   ```typescript
   await createResponsePromise;
   await page.waitForTimeout(5000); // Was 2000ms
   ```

3. **Run full suite to verify**

**Pros:**
- Quick to implement
- No component changes
- Safe fallback

**Cons:**
- Makes tests slower
- May not fix root cause
- Just masks the problem

### Option C: Add Explicit Cleanup
**Time:** 1 hour  
**Risk:** Low  
**Success Rate:** High

Add cleanup hooks to clear state between tests:

1. **Add browser state cleanup:**
   ```typescript
   test.beforeEach(async ({ page, context }) => {
     // Clear browser state
     await context.clearCookies();
     await page.evaluate(() => {
       localStorage.clear();
       sessionStorage.clear();
     });
     
     // Wait for cleanup
     await page.waitForTimeout(1000);
     
     // Disable caching
     await page.route('**/api/**', route => {
       route.continue({
         headers: {
           ...route.request().headers(),
           'Cache-Control': 'no-cache, no-store, must-revalidate',
         },
       });
     });
   });
   ```

2. **Add database cleanup:**
   ```typescript
   test.afterEach(async () => {
     // Clean up test data
     await testDb.from('events').delete().like('name', 'Test Event%');
     await testDb.from('content_pages').delete().like('title', '%Test%');
   });
   ```

3. **Run full suite to verify**

**Pros:**
- Addresses root cause
- Improves overall test reliability
- No component changes

**Cons:**
- More complex
- May slow down tests slightly
- Requires database access

### Option D: Split Test Files
**Time:** 30 minutes  
**Risk:** Low  
**Success Rate:** Very High

Run problematic tests in separate files:

1. **Create new test files:**
   - `contentManagement.part1.spec.ts` (Tests 1-8)
   - `contentManagement.inlineSectionEditor.spec.ts` (Test 9 only)
   - `contentManagement.part2.spec.ts` (Tests 10-13)
   - `contentManagement.eventReference.spec.ts` (Test 14 only)

2. **Copy tests to new files**

3. **Run full suite to verify**

**Pros:**
- Guarantees isolation
- Quick to implement
- No component changes

**Cons:**
- More files to maintain
- Slower test execution
- Doesn't fix root cause

## Recommended Approach

**Phase 1: Quick Win (Option B)**
- Increase waits to 3-5 seconds
- Run full suite
- If passes: Move to Phase 2
- If fails: Move to Phase 3

**Phase 2: Proper Fix (Option C)**
- Add cleanup hooks
- Run full suite
- If passes: Done!
- If fails: Move to Phase 3

**Phase 3: Deep Investigation (Option A)**
- Add diagnostic logging
- Run in headed mode
- Analyze console output
- Implement targeted fix

**Phase 4: Nuclear Option (Option D)**
- Split test files
- Guarantees success
- Use as last resort

## Decision Matrix

| Approach | Time | Risk | Success | Maintainability |
|----------|------|------|---------|-----------------|
| A: Logging | 2h | Low | High | Medium (temp changes) |
| B: Waits | 30m | Low | Medium | High (just config) |
| C: Cleanup | 1h | Low | High | High (best practice) |
| D: Split | 30m | Low | Very High | Medium (more files) |

## My Recommendation

**Start with Option B (Increase Waits):**
1. Quick to implement (30 minutes)
2. Low risk
3. May solve the problem immediately
4. If it works, we can investigate proper fix later
5. If it doesn't work, we haven't wasted much time

**Then move to Option C (Add Cleanup):**
1. Proper long-term solution
2. Improves overall test reliability
3. Best practice for E2E tests
4. No component changes needed

**Only use Option A (Logging) if B and C fail:**
1. More invasive
2. Requires component changes
3. But gives us definitive answers

**Use Option D (Split Files) as last resort:**
1. Guarantees success
2. But doesn't fix root cause
3. More files to maintain

## Success Metrics

**After implementing fix:**
- [ ] Test #9 passes on first try (no retries)
- [ ] Test #14 passes on first try (no retries)
- [ ] Full suite passes at 100% (17/17)
- [ ] No flaky tests (0% flaky rate)
- [ ] Test execution time < 5 minutes
- [ ] No component code changes (isolation fix only)

## Timeline

**Option B (Recommended):**
- Implementation: 15 minutes
- Testing: 10 minutes
- Verification: 5 minutes
- **Total: 30 minutes**

**Option C (If B fails):**
- Implementation: 30 minutes
- Testing: 20 minutes
- Verification: 10 minutes
- **Total: 1 hour**

**Option A (If C fails):**
- Implementation: 30 minutes
- Testing: 60 minutes
- Analysis: 30 minutes
- Fix: 30 minutes
- **Total: 2.5 hours**

## What to Do Right Now

1. **Read this document** ✅ (you're doing it!)
2. **Choose an approach** (I recommend Option B)
3. **Implement the fix** (15-30 minutes)
4. **Run the full suite** (5 minutes)
5. **Verify results** (5 minutes)
6. **Document outcome** (5 minutes)

## Questions to Answer

Before starting, decide:
- [ ] Do we want a quick fix or proper fix?
- [ ] Are we okay with slower tests?
- [ ] Do we want to modify component code?
- [ ] How much time do we have?

## Contact Points

If you need help:
- Review `E2E_FEB12_2026_PHASE2_ROUND6_DEEP_INVESTIGATION.md` for detailed analysis
- Review `E2E_FEB12_2026_PHASE2_ROUND6_RESULTS.md` for test results
- Review `E2E_FEB12_2026_PHASE2_ROUND6_FIXES_APPLIED.md` for what we've tried

## Final Thoughts

We're at 71% pass rate, up from 65%. We're making progress!

The fact that tests pass individually proves the components work. We just need better isolation.

I recommend starting with Option B (increase waits) because:
- It's quick (30 minutes)
- It's safe (no component changes)
- It might just work
- If it doesn't, we haven't lost much time

Let's get these last 2 tests passing! 🚀
