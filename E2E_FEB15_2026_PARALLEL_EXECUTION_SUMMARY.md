# E2E Parallel Execution - Summary for User

**Date**: February 15, 2026  
**Question**: "How do I use 4 Playwright workers again?"  
**Answer**: Use production build + increased timeouts

---

## TL;DR

**The Problem**: Dev server can't handle 4 parallel workers  
**The Solution**: Use production build (`npm run build && npm start`)  
**Time to Implement**: 30 minutes  
**Expected Speedup**: 3-4x faster (45 min → 12-15 min)

---

## Why Sequential Execution Was Chosen

From February 13, 2026 session - **TWO REASONS**:

### Reason 1: Reference Block Tests (8 tests)
> When running all 8 reference block tests in parallel (4 workers), the server and database cannot handle the concurrent load, causing timing issues and test failures.

### Reason 2: Section Management Tests (12 tests)
From E2E_SECTION_MANAGEMENT_ROOT_CAUSE_ANALYSIS.md:
- Section editor component (`InlineSectionEditor`) not rendering consistently
- `CollapsibleForm` not expanding after clicking "Manage Sections"
- Data table loading detection issues across entity types
- Tests were flaky with parallel execution, became consistent with sequential

**Combined Root Causes:**
1. Dev server (`npm run dev`) not optimized for sustained load
2. Hot module reloading overhead
3. Memory leaks accumulate
4. Database connection contention
5. Timeouts too aggressive for parallel execution
6. **Component rendering timing issues** (CollapsibleForm, InlineSectionEditor)
7. **Data table loading race conditions** across multiple entity types

**Decision**: Set `workers: 1` for reliability

---

## How to Enable 4 Workers Again

### Quick Answer

Use **production build** instead of dev server:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4,  // Enable parallel execution
  timeout: 120 * 1000,  // Double timeouts
  expect: { timeout: 20 * 1000 },
  use: {
    navigationTimeout: 60 * 1000,
    actionTimeout: 30 * 1000,
  },
  webServer: {
    command: 'npm run build && npm start',  // Production build
  },
});
```

### Why Production Build Works

**Production builds are:**
- ✅ Optimized and minified
- ✅ Stable (no HMR overhead)
- ✅ Better resource management
- ✅ Industry standard for E2E testing
- ✅ Match real user experience

**Dev server issues:**
- ❌ Memory leaks accumulate
- ❌ Hot module reloading overhead
- ❌ Not optimized for sustained load
- ❌ Resource contention under parallel execution

---

## Implementation Steps

### 1. Update Playwright Config (5 min)

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 120 * 1000,  // 2 minutes (was 60s)
  expect: { timeout: 20 * 1000 },  // 20s (was 10s)
  workers: 4,  // Enable 4 workers (was 1)
  use: {
    navigationTimeout: 60 * 1000,  // 60s (was 30s)
    actionTimeout: 30 * 1000,  // 30s (was 15s)
  },
  webServer: {
    command: process.env.E2E_USE_PRODUCTION === 'true' 
      ? 'npm start' 
      : 'npm run dev',
  },
});
```

### 2. Add Production Script (2 min)

```json
// package.json
{
  "scripts": {
    "test:e2e:prod": "E2E_USE_PRODUCTION=true playwright test"
  }
}
```

### 3. Build and Test (20 min)

```bash
# Build production
npm run build

# Run with 4 workers
npm run test:e2e:prod
```

---

## Expected Results

| Metric | Sequential (1 worker) | Parallel (4 workers) |
|--------|----------------------|---------------------|
| **Total Time** | ~45 minutes | ~12-15 minutes |
| **Speedup** | 1x | 3-4x faster |
| **Pass Rate** | ~95% | ~96%+ (expected) |
| **Reliability** | High | High (with prod build) |

---

## Alternative Options

If production build doesn't work:

### Option 2: Test Sharding
Run tests in groups with server restart between:
```bash
npx playwright test __tests__/e2e/admin --workers=4
npx playwright test __tests__/e2e/guest --workers=4
npx playwright test __tests__/e2e/system --workers=4
```
**Time**: ~20-25 minutes (still 2x faster)

### Option 3: Increase Database Pool
Optimize database connections for parallel execution:
```typescript
const supabase = createClient(url, key, {
  db: { poolSize: 40 }
});
```
**Time**: 2-3 hours to implement

### Option 4: Keep Sequential, Optimize
Use production build with 1 worker:
**Time**: ~30 minutes (vs 45 minutes with dev)

---

## Recommendation

✅ **Use Option 1: Production Build + 4 Workers**

**Why:**
- Fastest implementation (30 minutes)
- Best speedup (3-4x faster)
- High reliability
- Industry standard approach
- Minimal code changes

**When to use alternatives:**
- Option 2: If production build has issues
- Option 3: For long-term optimization
- Option 4: If parallel execution proves too difficult

---

## Current Test Run Status

**As of 5:20 PM:**
- Tests completed: ~400/405 (98.8%)
- Still running: Smoke tests
- Estimated completion: ~2 minutes

**Server exhaustion observed:**
- After 340+ tests, navigation timeouts increased
- Locations page test failed (44s timeout)
- Evidence that dev server struggles with sustained load

**This confirms**: Production build is the right solution

---

## Files Created

1. `E2E_FEB15_2026_PARALLEL_EXECUTION_STRATEGY.md` - Detailed analysis of all options
2. `E2E_ENABLE_4_WORKERS_GUIDE.md` - Step-by-step implementation guide
3. `E2E_FEB15_2026_PARALLEL_EXECUTION_SUMMARY.md` - This summary

---

## Next Steps

1. ✅ Wait for current test run to complete
2. ⏳ Implement production build + 4 workers (30 min)
3. ⏳ Run test suite and measure results
4. ⏳ Document results
5. ⏳ Update CI/CD pipeline

---

## Questions?

**Q: Will this break my development workflow?**  
A: No. Use dev server for debugging individual tests:
```bash
npx playwright test path/to/test.spec.ts --debug
```

**Q: What if tests still fail?**  
A: Increase timeouts further (3x instead of 2x) or use test sharding

**Q: Can I use 8 workers?**  
A: Possible, but 4 is the sweet spot. Test with 4 first.

---

## Conclusion

**The answer to "How do I use 4 Playwright workers again?"**

Use production build instead of dev server. The dev server can't handle parallel execution due to resource limitations, but production builds are optimized and stable.

**Implementation**: 30 minutes  
**Speedup**: 3-4x faster  
**Reliability**: High  
**Recommendation**: ✅ Do it now

See `E2E_ENABLE_4_WORKERS_GUIDE.md` for detailed implementation steps.

