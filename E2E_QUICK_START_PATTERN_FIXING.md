# E2E Quick Start: Pattern-Based Fixing

## TL;DR

Instead of fixing tests one-by-one, we'll:
1. **Analyze** all failures to find patterns (30 min)
2. **Fix** the top 3 patterns affecting most tests (6 hours)
3. **Verify** improvement (30 min)
4. **Repeat** until 85% pass rate (6 hours)

**Total**: ~14 hours to fix 122+ tests (vs. 70 hours one-by-one)

## Step 1: Run Pattern Analysis (5 minutes)

```bash
# Run E2E tests and capture results
npm run test:e2e -- --reporter=json --reporter=html > e2e-results.json 2>&1

# Analyze patterns
node scripts/analyze-e2e-patterns.mjs e2e-results.json
```

**Output will show**:
```
=== E2E TEST FAILURE PATTERN ANALYSIS ===

TIMEOUT_WAITING_FOR_ELEMENT: 45 tests (29%)
Description: Tests timing out waiting for elements

ELEMENT_NOT_FOUND: 32 tests (21%)
Description: Elements not found (selector issues)

STATE_NOT_PERSISTING: 15 tests (10%)
Description: State not persisting (URL params)

... etc
```

## Step 2: Fix Top Pattern (2 hours)

### If Top Pattern is: TIMEOUT_WAITING_FOR_ELEMENT

**Problem**: Lazy-loaded components take longer than 1000ms to appear

**Solution**: Create helper function

```typescript
// __tests__/helpers/e2eHelpers.ts

export async function waitForLazyComponent(
  page: Page, 
  selector: string,
  timeout = 5000
) {
  // Wait for component to download
  await page.waitForLoadState('networkidle');
  
  // Wait for component to render
  await page.waitForSelector(selector, { 
    state: 'visible',
    timeout 
  });
  
  // Wait for CSS transitions
  await page.waitForTimeout(300);
}
```

**Update tests** (can be automated):

```typescript
// Before:
await addButton.click();
await page.waitForTimeout(1000);
await expect(titleInput).toBeVisible();

// After:
await addButton.click();
await waitForLazyComponent(page, 'input[name="title"]');
```

**Verify**:
```bash
npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts
```

### If Top Pattern is: ELEMENT_NOT_FOUND

**Problem**: Selectors are fragile and break when UI changes

**Solution**: Add data-testid attributes

```typescript
// 1. Create testIds constants
// __tests__/helpers/testIds.ts
export const testIds = {
  buttons: {
    addContentPage: 'add-content-page-btn',
    addEvent: 'add-event-btn',
    submit: 'submit-btn',
  },
  inputs: {
    contentPageTitle: 'content-page-title-input',
    eventName: 'event-name-input',
  },
  // ... etc
};

// 2. Update components
// app/admin/content-pages/page.tsx
<button data-testid={testIds.buttons.addContentPage}>
  Add Page
</button>
<input 
  data-testid={testIds.inputs.contentPageTitle}
  name="title"
/>

// 3. Update tests
import { testIds } from '@/__tests__/helpers/testIds';

await page.click(`[data-testid="${testIds.buttons.addContentPage}"]`);
await page.fill(`[data-testid="${testIds.inputs.contentPageTitle}"]`, 'Test');
```

**Verify**:
```bash
npm run test:e2e
```

### If Top Pattern is: STATE_NOT_PERSISTING

**Problem**: DataTable doesn't sync with URL parameters

**Solution**: Fix DataTable component

```typescript
// components/ui/DataTable.tsx

// Add URL state restoration
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  const urlSearch = params.get('search');
  const urlSort = params.get('sort');
  const urlFilters = params.get('filters');
  
  if (urlSearch) setSearch(urlSearch);
  if (urlSort) setSortConfig(JSON.parse(urlSort));
  if (urlFilters) setFilters(JSON.parse(urlFilters));
}, []);

// Add URL state updates
useEffect(() => {
  const params = new URLSearchParams();
  
  if (search) params.set('search', search);
  if (sortConfig) params.set('sort', JSON.stringify(sortConfig));
  if (filters.length) params.set('filters', JSON.stringify(filters));
  
  const newUrl = params.toString() ? `?${params}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}, [search, sortConfig, filters]);
```

**Verify**:
```bash
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

## Step 3: Verify Improvement (5 minutes)

```bash
# Run full suite
npm run test:e2e -- --reporter=json > e2e-results-after-fix1.json

# Re-analyze
node scripts/analyze-e2e-patterns.mjs e2e-results-after-fix1.json
```

**Expected**:
```
Before: 183/359 passing (51%)
After:  228/359 passing (63%)  ← 45 tests fixed!
```

## Step 4: Repeat for Patterns #2 and #3 (4 hours)

Follow same process for next 2 highest-impact patterns.

## Step 5: Final Verification (30 minutes)

```bash
# Run full suite
npm run test:e2e

# Check pass rate
# Target: 305+ tests passing (85%+)
```

## Automation Script (Optional)

Create script to batch-update tests:

```typescript
// scripts/fix-e2e-patterns.mjs

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const testFiles = glob.sync('__tests__/e2e/**/*.spec.ts');

for (const file of testFiles) {
  let content = readFileSync(file, 'utf-8');
  
  // Replace timeout waits with helper
  content = content.replace(
    /await (\w+)\.click\(\);\s*await page\.waitForTimeout\(\d+\);/g,
    'await $1.click();\n  await waitForLazyComponent(page, \'input\');'
  );
  
  // Add import if not present
  if (!content.includes('waitForLazyComponent')) {
    content = `import { waitForLazyComponent } from '@/__tests__/helpers/e2eHelpers';\n${content}`;
  }
  
  writeFileSync(file, content);
}

console.log(`Updated ${testFiles.length} files`);
```

## Expected Timeline

| Step | Time | Tests Fixed | Pass Rate |
|------|------|-------------|-----------|
| Initial | - | 183 | 51% |
| Pattern #1 | 2h | +45 | 63% |
| Pattern #2 | 2h | +32 | 72% |
| Pattern #3 | 2h | +15 | 76% |
| Patterns #4-6 | 6h | +35 | 85% |
| **Total** | **12h** | **+127** | **85%** |

## Key Benefits

1. **10x Faster**: Fix 45 tests in 2 hours vs. 22 hours
2. **More Resilient**: Pattern fixes make tests more stable
3. **Systematic**: Clear progress tracking
4. **Repeatable**: Same process for future regressions
5. **Documented**: Patterns documented for team

## Common Patterns & Fixes

| Pattern | Typical Fix | Time | Tests |
|---------|-------------|------|-------|
| Lazy component timeouts | Helper function | 2h | 40-50 |
| Element not found | data-testid | 2h | 30-40 |
| State not persisting | Component fix | 2h | 15-20 |
| Navigation failures | Route verification | 2h | 10-15 |
| API errors | Error handling | 2h | 10-15 |
| Form validation | Validation logic | 2h | 8-12 |

## Success Criteria

- ✅ 85%+ pass rate (305+ tests)
- ✅ No regressions (currently passing tests still pass)
- ✅ Patterns documented
- ✅ Helper functions created
- ✅ Tests more resilient

## Troubleshooting

### Pattern analysis shows no clear patterns
- Review individual test errors manually
- Look for common error messages
- Check if multiple tests fail in same file

### Fix doesn't improve pass rate
- Verify fix was applied correctly
- Check if pattern analysis was accurate
- Run tests in UI mode to debug: `npx playwright test --ui`

### New failures after fix
- Check for regressions
- Verify fix didn't break other tests
- May need to adjust fix approach

## Next Steps After 85%

1. **Document remaining failures** - Create issues for edge cases
2. **Add to CI/CD** - Ensure tests run on every PR
3. **Monitor flakiness** - Track intermittent failures
4. **Maintain patterns** - Update as new patterns emerge

---

**Ready to start? Run Step 1!** 🚀

```bash
npm run test:e2e -- --reporter=json > e2e-results.json 2>&1
node scripts/analyze-e2e-patterns.mjs e2e-results.json
```
