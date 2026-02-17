# E2E Test Fixes - Quick Start Guide

**Status:** Phase 1 Complete ✅  
**Next:** Verify Results

## TL;DR

Phase 1 fixes applied to all 15 content management tests. Run verification now:

```bash
npm run test:e2e -- contentManagement.spec.ts
```

**Expected:** 15/15 tests passing (some may need retry)

## What Happened

1. ✅ Fixed route timeout (missing database settings)
2. ✅ Applied Phase 1 pattern to 4 tests (validated)
3. ✅ Applied Phase 1 pattern to 11 more tests (rollout)
4. ⏳ Need to verify all 15 tests pass

## Phase 1 Pattern

```typescript
// 1. Wait for API (don't parse)
const responsePromise = page.waitForResponse(
  response => response.url().includes('/api/...') && response.status() === 200,
  { timeout: 15000 }
);
await button.click();
await responsePromise; // Don't call .json()

// 2. Verify via UI feedback
await expect(page.locator('text=/Last saved:/i')).toBeVisible({ timeout: 10000 });

// 3. Use retry logic
await expect(async () => {
  const value = await input.inputValue();
  expect(value).toBe(expected);
}).toPass({ timeout: 5000 });
```

## Quick Commands

```bash
# Run all tests
npm run test:e2e -- contentManagement.spec.ts

# Run single test
npm run test:e2e -- contentManagement.spec.ts -g "edit home page"

# Run with debug
npm run test:e2e -- contentManagement.spec.ts --debug

# Seed database (if needed)
node scripts/seed-home-page-settings.mjs
```

## Test Status

### Phase 1 Complete (15 tests)
- ✅ 4 Home Page Editing tests
- ✅ 3 Content Page Management tests
- ✅ 5 Inline Section Editor tests
- ✅ 2 Event References tests
- ✅ 1 Accessibility test

### Known Flaky Tests (Pass on Retry)
1. Edit home page settings - Form shows old values
2. Edit welcome message - Save button doesn't trigger API

## Next Steps

### 1. Verify (5 min)
```bash
npm run test:e2e -- contentManagement.spec.ts
```

### 2. Check Results
- **15/15 pass?** → Phase 1 success, move to Phase 2
- **<15 pass?** → Debug failures, adjust pattern

### 3. Phase 2 (if needed)
Fix flakiness:
- Add cache clearing
- Fix form dirty state
- Adjust timing

## Files

- **Test file:** `__tests__/e2e/admin/contentManagement.spec.ts`
- **Seed script:** `scripts/seed-home-page-settings.mjs`
- **Documentation:** `E2E_FEB12_2026_*.md` files

## Success Criteria

- ✅ All tests have Phase 1 pattern
- ⏳ All tests pass (or pass on retry)
- ⏳ No protocol errors

## Time Estimates

- Verification: 5-10 min
- Phase 2 (if needed): 60-90 min

---

**Ready?** Run the tests and check results!
