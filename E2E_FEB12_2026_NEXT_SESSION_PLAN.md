# E2E Next Session Plan - February 12, 2026

## 🎯 Objective

Apply Phase 1 pattern to remaining 11 content management tests to achieve 15/15 passing.

## 📊 Current Status

- **Completed**: 4/15 tests (Home Page Editing)
- **Remaining**: 11/15 tests
- **Pattern**: Phase 1 validated and working
- **Estimated Time**: 60-90 minutes

## 📋 Remaining Tests to Fix

### Group 1: Content Page Management (3 tests)
Located in `contentManagement.spec.ts` around line 400-600

1. **"should create content page with full creation flow"**
   - Create page → fill form → save → verify
   - Apply Phase 1: Wait for API, verify via UI feedback

2. **"should handle validation errors and slug conflicts"**
   - Test validation → check error messages
   - Apply Phase 1: Verify errors via UI, not response.json()

3. **"should add and reorder sections"**
   - Add sections → drag/drop → save → verify order
   - Apply Phase 1: Wait for save API, verify via section list

### Group 2: Inline Section Editor (5 tests)
Located in `contentManagement.spec.ts` around line 600-900

4. **"should toggle inline section editor visibility"**
   - Click toggle → verify editor appears/disappears
   - Likely already passing (no API calls)

5. **"should add new section inline"**
   - Click add → fill form → save → verify
   - Apply Phase 1: Wait for API, verify via section list

6. **"should edit section content and layout inline"**
   - Edit section → change layout → save → verify
   - Apply Phase 1: Wait for API, verify via UI feedback

7. **"should delete section with confirmation"**
   - Click delete → confirm → verify removed
   - Apply Phase 1: Wait for API, verify section gone

8. **"should add photo gallery to section"**
   - Add gallery → select photos → save → verify
   - Apply Phase 1: Wait for API, verify photos appear

9. **"should add reference blocks to section"**
   - Add reference → select item → save → verify
   - Apply Phase 1: Wait for API, verify reference appears

### Group 3: Event References (2 tests)
Located in `contentManagement.spec.ts` around line 900-1000

10. **"should create event and add as reference"**
    - Create event → add to section → verify
    - Apply Phase 1: Wait for both APIs, verify via UI

11. **"should [another event reference test]"**
    - TBD based on actual test

### Group 4: Accessibility (1 test)
Located in `contentManagement.spec.ts` around line 1000-1100

12. **"should support keyboard navigation and accessible forms"**
    - Tab through form → verify focus → submit with Enter
    - Likely already passing (no API changes needed)

## 🔧 Phase 1 Pattern Template

Use this template for each test that saves data:

```typescript
// PHASE 1 FIX: Wait for API call and verify success via UI feedback
const savePromise = page.waitForResponse(
  response => response.url().includes('/api/admin/[endpoint]') && 
              response.request().method() === 'POST' && // or PUT/DELETE
              (response.status() === 200 || response.status() === 201),
  { timeout: 15000 }
);

await saveButton.click();
await savePromise; // Wait for API to complete

// PHASE 1 FIX: Verify success via UI feedback instead of response.json()
// Examples:
// - Toast message: await expect(page.locator('text=/success/i')).toBeVisible()
// - List item: await expect(page.locator(`text="${itemName}"`)).toBeVisible()
// - "Last saved:" text: await expect(page.locator('text=/Last saved:/i')).toBeVisible()
// - Item count: await expect(page.locator('[data-testid="item"]')).toHaveCount(expectedCount)
```

## 📝 Step-by-Step Process

### For Each Test:

1. **Read the test** - Understand what it's testing
2. **Identify API calls** - Find all `waitForResponse` or API interactions
3. **Check for response.json()** - Remove if present
4. **Add UI verification** - Replace with visible UI feedback
5. **Add retry logic** - Use `.toPass()` for value checks if needed
6. **Run the test** - Verify it passes
7. **Move to next test** - Repeat

### Batch Processing:

- **Fix 3-4 tests at a time** - Don't try to fix all 11 at once
- **Run after each batch** - Verify tests pass before continuing
- **Document issues** - Note any new patterns or problems

## 🚨 Common Issues to Watch For

### Issue 1: response.json() Protocol Errors
**Symptom**: `Protocol error (Network.getResponseBody): No resource with given identifier found`  
**Fix**: Remove `response.json()` calls, verify via UI instead

### Issue 2: Timing Issues After Save
**Symptom**: Test checks value immediately after save, sees old value  
**Fix**: Add `.toPass()` retry logic or wait for UI update

### Issue 3: Form Not Marked as Dirty
**Symptom**: Save button disabled, API call never happens  
**Fix**: Add `page.waitForTimeout(500)` after filling form

### Issue 4: Cached Data After Reload
**Symptom**: After reload, API doesn't fire, old data shown  
**Fix**: Don't rely on API call after reload, use `.toPass()` for value checks

## 📊 Success Criteria

### Per Test:
- ✅ Test passes on first run (not flaky)
- ✅ No `response.json()` calls
- ✅ Verifies success via UI feedback
- ✅ Handles timing issues with retries

### Overall:
- ✅ 15/15 content management tests passing
- ✅ No flaky tests (all stable)
- ✅ Phase 1 pattern consistently applied
- ✅ Test suite runs in <5 minutes

## 🎯 Estimated Timeline

- **Group 1** (3 tests): 20-30 minutes
- **Group 2** (5 tests): 30-40 minutes
- **Group 3** (2 tests): 10-15 minutes
- **Group 4** (1 test): 5-10 minutes
- **Total**: 65-95 minutes

## 📁 Files to Modify

1. `__tests__/e2e/admin/contentManagement.spec.ts` - Apply fixes to remaining 11 tests

## 📁 Files to Create

1. `E2E_FEB12_2026_PHASE1_COMPLETE.md` - Final summary after all tests pass

## 🎉 Success Indicators

You'll know you're done when:
1. ✅ All 15 content management tests pass
2. ✅ No flaky tests (all stable on first run)
3. ✅ Test suite completes in <5 minutes
4. ✅ Phase 1 pattern documented and validated

## 💡 Tips for Success

1. **Work in batches** - Fix 3-4 tests, run, verify, repeat
2. **Copy the pattern** - Use the template consistently
3. **Test frequently** - Run after each batch to catch issues early
4. **Document issues** - Note any new patterns for future reference
5. **Stay focused** - One test at a time, don't rush

## 🚀 Ready to Start?

Run this command to see the remaining tests:

```bash
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts --list
```

Then start with Group 1 (Content Page Management) and work through systematically.

---

**Current Status**: Ready to proceed  
**Next Action**: Apply Phase 1 pattern to Group 1 (3 tests)  
**Estimated Completion**: 60-90 minutes from start
