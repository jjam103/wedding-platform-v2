# E2E Test Suite - Quick Start Guide
**Date**: February 13, 2026

## Current Situation

- **Unit Tests**: 88.9% passing (3,344/3,760 tests)
- **E2E Tests**: ~90% passing (based on completed tests)
- **Main Issues**: DataTable URL state, Jest worker crashes, responsive test timeouts

## Quick Commands

### Run Specific Test Categories
```bash
# DataTable tests only
npm run test:e2e -- -g "Data Table"

# Responsive tests only
npm run test:e2e -- -g "Responsive Design"

# Content management tests
npm run test:e2e -- -g "Content Management"

# Run with debug output
DEBUG=pw:api npm run test:e2e -- -g "Data Table"
```

### Run Failing Jest Tests
```bash
# Run specific test file
npm test -- SectionEditor.photoIntegration.test.tsx

# Run with increased timeout
npm test -- --testTimeout=60000

# Run integration tests only
npm test -- __tests__/integration/
```

### Check Test Status
```bash
# Quick test run (fast tests only)
npm run test:quick

# Full test suite
npm test

# Coverage report
npm run test:coverage

# List all test files
npm test -- --listTests
```

## Top 3 Priorities

### 1. Fix Jest Worker Crashes (1-2 hours)
**Impact**: May fix 45 test suites
**Files**: `__tests__/integration/entityCreation.integration.test.ts`

**Quick Fix**:
```typescript
// Add to failing integration tests
afterEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.resetModules();
});
```

### 2. Fix DataTable URL State (2-3 hours)
**Impact**: Fixes 5 E2E tests
**Files**: `components/ui/DataTable.tsx`

**Quick Fix**:
```typescript
// Add debounced URL updates
const updateURL = useMemo(
  () => debounce((params: URLSearchParams) => {
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, 300),
  [router, pathname]
);
```

### 3. Fix Responsive Tests (2-3 hours)
**Impact**: Fixes 3 E2E tests
**Files**: `__tests__/e2e/accessibility/suite.spec.ts`

**Quick Fix**:
```typescript
// Add proper wait after viewport change
await page.setViewportSize(viewport);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);
```

## Decision Tree

```
Start Here
    │
    ├─ Need full picture? → Run Phase 1 (15 min)
    │   └─ npm run test:e2e -- --timeout=120000 > results.txt
    │
    ├─ Want quick win? → Fix Jest Workers (1-2 hours)
    │   └─ May fix 45 test suites at once
    │
    ├─ Want high impact? → Fix DataTable (2-3 hours)
    │   └─ Fixes core admin functionality
    │
    └─ Want to improve accessibility? → Fix Responsive (2-3 hours)
        └─ Fixes 3 accessibility tests
```

## Files to Review

### DataTable URL State
- `components/ui/DataTable.tsx` - Main component
- `hooks/useDebouncedSearch.ts` - Debounce hook
- `__tests__/e2e/accessibility/suite.spec.ts` (lines 889-1050) - Tests

### Jest Worker Crashes
- `__tests__/integration/entityCreation.integration.test.ts` - Failing test
- `jest.config.js` - Worker configuration
- Any test with heavy service imports

### Responsive Tests
- `__tests__/e2e/accessibility/suite.spec.ts` (lines 654-802) - Tests
- Viewport configuration in test setup

## Common Issues & Solutions

### Issue: E2E tests timeout
**Solution**: Increase timeout or add wait conditions
```bash
npm run test:e2e -- --timeout=120000
```

### Issue: Jest worker crashes
**Solution**: Add cleanup and reduce memory usage
```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
```

### Issue: Flaky tests
**Solution**: Add proper wait conditions
```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="element"]');
```

### Issue: URL state not syncing
**Solution**: Add debouncing and proper initialization
```typescript
const [isInitialized, setIsInitialized] = useState(false);
// Restore from URL first, then sync changes
```

## Success Metrics

- [ ] Unit test pass rate > 95%
- [ ] E2E test pass rate > 95%
- [ ] No flaky tests (pass on first run)
- [ ] Test execution time < 10 minutes
- [ ] No worker crashes
- [ ] All DataTable tests passing
- [ ] All responsive tests passing

## Next Actions

**Recommended Path**:
1. Run Phase 1 to get complete picture (15 min)
2. Fix Jest worker crashes (1-2 hours)
3. Fix DataTable URL state (2-3 hours)
4. Fix responsive tests if time permits (2-3 hours)

**Quick Win Path**:
1. Fix Jest worker crashes immediately (1-2 hours)
2. Re-run tests to see impact
3. Proceed based on results

**Safe Path**:
1. Fix DataTable URL state (2-3 hours)
2. Verify with targeted tests
3. Move to next priority

## Getting Help

### View Test Results
```bash
# Last test run
cat test-results.txt

# E2E results
cat e2e-results.txt

# View screenshots
open test-results/*/test-failed-*.png
```

### Debug Specific Test
```bash
# Run with debug output
DEBUG=pw:api npm run test:e2e -- -g "test name"

# Run in headed mode (see browser)
npm run test:e2e -- --headed -g "test name"

# Run with inspector
PWDEBUG=1 npm run test:e2e -- -g "test name"
```

### Check Documentation
- `E2E_FEB13_2026_CURRENT_STATUS_SUMMARY.md` - Full status report
- `E2E_FEB13_2026_ACTION_PLAN.md` - Detailed fix plan
- `.kiro/steering/testing-standards.md` - Testing guidelines
- `.kiro/steering/testing-patterns.md` - Common patterns

## Contact Points

- **Test Infrastructure**: Check `__tests__/helpers/` for utilities
- **E2E Setup**: Check `__tests__/e2e/global-setup.ts`
- **Mock Services**: Check `__tests__/mocks/`
- **Test Database**: Check `scripts/setup-test-database.mjs`
