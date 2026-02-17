# E2E Test Suite - Action Plan
**Date**: February 13, 2026
**Goal**: Fix failing tests and achieve 95%+ pass rate

## Quick Decision Matrix

| Option | Impact | Effort | Time | Success Probability |
|--------|--------|--------|------|---------------------|
| **A: Fix DataTable URL State** | High (5 tests) | Medium | 2-3h | 90% |
| **B: Fix Jest Worker Crashes** | Very High (45 suites) | Low | 1-2h | 70% |
| **C: Fix Responsive Tests** | Medium (3 tests) | Medium | 2-3h | 80% |
| **D: Let E2E Complete** | Info Only | None | 15m | 100% |

## Recommended Approach: Sequential Fix Strategy

### Phase 1: Information Gathering (15 minutes)
**Action**: Let E2E test suite complete to get full failure report

```bash
# Run E2E tests with extended timeout
npm run test:e2e -- --timeout=120000 > e2e-full-results.txt 2>&1
```

**Expected Outcome**: Complete list of all failing tests

### Phase 2: Quick Win - Jest Worker Crashes (1-2 hours)
**Why First**: May fix 45 test suites at once, highest potential ROI

**Steps**:
1. Review `__tests__/integration/entityCreation.integration.test.ts`
2. Check for circular dependencies in service imports
3. Add proper cleanup in `afterEach` hooks
4. Increase worker memory if needed

**Files to Check**:
```bash
# Find tests with heavy service imports
grep -r "import.*Service" __tests__/integration/

# Check for missing cleanup
grep -L "afterEach" __tests__/integration/*.test.ts
```

**Fix Template**:
```typescript
// Add to tests with worker crashes
afterEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // Clear any module cache
  jest.resetModules();
});
```

### Phase 3: High Impact - DataTable URL State (2-3 hours)
**Why Second**: Clear root cause, affects core admin functionality

**Root Cause Analysis**:
The DataTable component is not properly synchronizing state with URL parameters. Tests are failing because:
1. URL updates are not debounced, causing race conditions
2. State restoration from URL is not waiting for component mount
3. Filter/sort/search state is not properly serialized to URL

**Implementation Plan**:

#### Step 1: Review Current Implementation
```bash
# Check DataTable URL handling
cat components/ui/DataTable.tsx | grep -A 20 "useEffect.*router"

# Check debounce hook
cat hooks/useDebouncedSearch.ts
```

#### Step 2: Fix URL Synchronization
**File**: `components/ui/DataTable.tsx`

Add proper debouncing and state synchronization:
```typescript
// Add debounced URL updates
const debouncedUpdateURL = useMemo(
  () => debounce((params: URLSearchParams) => {
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, 300),
  [router, pathname]
);

// Sync state to URL
useEffect(() => {
  const params = new URLSearchParams();
  if (sortColumn) params.set('sort', sortColumn);
  if (sortDirection) params.set('dir', sortDirection);
  if (searchQuery) params.set('search', searchQuery);
  if (activeFilters.length > 0) {
    params.set('filters', JSON.stringify(activeFilters));
  }
  debouncedUpdateURL(params);
}, [sortColumn, sortDirection, searchQuery, activeFilters, debouncedUpdateURL]);

// Restore state from URL on mount
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort');
  const dir = params.get('dir');
  const search = params.get('search');
  const filters = params.get('filters');
  
  if (sort) setSortColumn(sort);
  if (dir) setSortDirection(dir as 'asc' | 'desc');
  if (search) setSearchQuery(search);
  if (filters) {
    try {
      setActiveFilters(JSON.parse(filters));
    } catch (e) {
      console.error('Failed to parse filters from URL', e);
    }
  }
}, []); // Only run on mount
```

#### Step 3: Update Tests
**File**: `__tests__/e2e/accessibility/suite.spec.ts`

Add proper wait conditions:
```typescript
// Wait for URL to update
await page.waitForFunction(
  (expectedParam) => new URL(window.location.href).searchParams.has(expectedParam),
  'sort',
  { timeout: 5000 }
);

// Wait for component to reflect URL state
await page.waitForSelector('[data-sort-column="name"]', { timeout: 5000 });
```

#### Step 4: Test Fixes
```bash
# Run DataTable tests
npm run test:e2e -- -g "Data Table Accessibility"

# Verify all 5 tests pass
```

### Phase 4: Medium Impact - Responsive Tests (2-3 hours)
**Why Third**: Affects accessibility, but lower priority than functionality

**Root Cause**: Tests are timing out due to slow viewport changes and missing wait conditions.

**Implementation Plan**:

#### Step 1: Optimize Viewport Changes
```typescript
// Add helper function for viewport changes
async function changeViewportAndWait(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  // Wait for layout to stabilize
  await page.waitForLoadState('networkidle');
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}
```

#### Step 2: Split Large Tests
Break down the responsive tests into smaller, focused tests:
- One test per page type (admin vs guest)
- One test per viewport size
- Separate tests for zoom functionality

#### Step 3: Add Memory Cleanup
```typescript
test.afterEach(async ({ page }) => {
  // Reset viewport to default
  await page.setViewportSize({ width: 1280, height: 720 });
  // Clear any cached resources
  await page.context().clearCookies();
});
```

### Phase 5: Verification (30 minutes)
**Action**: Run full test suite to verify fixes

```bash
# Run all tests
npm test && npm run test:e2e

# Generate coverage report
npm run test:coverage

# Check for remaining failures
npm test -- --listTests --json | jq '.numFailedTests'
```

## Detailed Fix: DataTable URL State

### Current Behavior (Broken)
1. User clicks sort → State updates → URL updates (no debounce)
2. User types in search → State updates → URL updates (no debounce)
3. Page loads → URL params ignored → Default state used

### Expected Behavior (Fixed)
1. User clicks sort → State updates → Debounced URL update
2. User types in search → State updates → Debounced URL update
3. Page loads → Read URL params → Restore state → Render

### Implementation

**File**: `components/ui/DataTable.tsx`

```typescript
'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';

export function DataTable<T>({ /* props */ }: DataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Restore state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const sort = searchParams.get('sort');
    const dir = searchParams.get('dir');
    const search = searchParams.get('search');
    const filters = searchParams.get('filters');
    
    if (sort) setSortColumn(sort);
    if (dir) setSortDirection(dir as 'asc' | 'desc');
    if (search) setSearchQuery(search);
    if (filters) {
      try {
        setActiveFilters(JSON.parse(filters));
      } catch (e) {
        console.error('Failed to parse filters from URL', e);
      }
    }
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);
  
  // Debounced URL update
  const updateURL = useMemo(
    () => debounce((params: URLSearchParams) => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300),
    [router, pathname]
  );
  
  // Sync state to URL (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    
    if (sortColumn) params.set('sort', sortColumn);
    if (sortDirection) params.set('dir', sortDirection);
    if (searchQuery) params.set('search', searchQuery);
    if (activeFilters.length > 0) {
      params.set('filters', JSON.stringify(activeFilters));
    }
    
    updateURL(params);
    
    return () => {
      updateURL.cancel();
    };
  }, [sortColumn, sortDirection, searchQuery, activeFilters, isInitialized, updateURL]);
  
  // Rest of component...
}
```

### Test Updates

**File**: `__tests__/e2e/accessibility/suite.spec.ts`

```typescript
test('should toggle sort direction and update URL', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.waitForLoadState('networkidle');
  
  // Click sort header
  await page.click('[data-testid="sort-header-name"]');
  
  // Wait for URL to update (with debounce)
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('sort') === 'name',
    { timeout: 5000 }
  );
  
  // Verify sort direction
  expect(new URL(page.url()).searchParams.get('dir')).toBe('asc');
  
  // Click again to toggle
  await page.click('[data-testid="sort-header-name"]');
  
  // Wait for URL to update
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('dir') === 'desc',
    { timeout: 5000 }
  );
});

test('should restore sort state from URL on page load', async ({ page }) => {
  // Navigate with URL params
  await page.goto('/admin/guests?sort=name&dir=desc');
  await page.waitForLoadState('networkidle');
  
  // Wait for component to initialize
  await page.waitForSelector('[data-sort-column="name"][data-sort-direction="desc"]', {
    timeout: 5000
  });
  
  // Verify visual indicator
  const sortIcon = await page.locator('[data-testid="sort-icon-name"]');
  await expect(sortIcon).toHaveAttribute('data-direction', 'desc');
});
```

## Success Criteria

### Phase 1 Complete
- [ ] Full E2E test results captured
- [ ] All failure patterns documented

### Phase 2 Complete
- [ ] Jest worker crashes eliminated
- [ ] All integration tests passing
- [ ] No SIGTERM errors in test output

### Phase 3 Complete
- [ ] All 5 DataTable URL state tests passing
- [ ] URL parameters properly synchronized
- [ ] State restoration working on page load

### Phase 4 Complete
- [ ] All 3 responsive tests passing
- [ ] Viewport changes optimized
- [ ] No timeout errors

### Final Success
- [ ] 95%+ test pass rate
- [ ] No flaky tests (all pass on first run)
- [ ] Test execution time < 10 minutes
- [ ] CI/CD pipeline green

## Rollback Plan

If any phase fails:
1. Revert changes: `git checkout -- <files>`
2. Document failure reason
3. Skip to next phase
4. Return to failed phase after gathering more information

## Time Estimates

| Phase | Optimistic | Realistic | Pessimistic |
|-------|-----------|-----------|-------------|
| Phase 1 | 10m | 15m | 30m |
| Phase 2 | 1h | 1.5h | 3h |
| Phase 3 | 2h | 3h | 5h |
| Phase 4 | 2h | 3h | 5h |
| **Total** | **5h 10m** | **7h 45m** | **13h 30m** |

## Next Steps

**Immediate**: Choose approach based on priority:
- **Option A**: Start with Phase 1 (information gathering) - Recommended
- **Option B**: Start with Phase 2 (Jest worker crashes) - High risk/reward
- **Option C**: Start with Phase 3 (DataTable fixes) - Safe, high impact

**Recommended**: Start with Phase 1 to get complete picture, then proceed to Phase 2 (highest potential ROI).
