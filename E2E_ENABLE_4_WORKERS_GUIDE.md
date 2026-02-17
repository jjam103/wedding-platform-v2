# Quick Guide: Enable 4 Playwright Workers

**Goal**: Run E2E tests with 4 workers (parallel execution) instead of 1 worker (sequential)  
**Estimated Time**: 30 minutes  
**Expected Speedup**: 3-4x faster (45 min → 12-15 min)

---

## Why This Will Work

**Current Problem**: Dev server (`npm run dev`) can't handle 4 parallel workers
- Memory leaks accumulate
- Hot module reloading overhead
- Resource contention

**Solution**: Use production build (`npm run build && npm start`)
- Optimized and stable
- Better resource management
- No HMR overhead
- Industry standard for E2E testing

---

## Implementation Steps

### Step 1: Update Playwright Config (5 minutes)

Edit `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... existing config ...
  
  // CHANGE 1: Increase timeouts for parallel execution
  timeout: 120 * 1000,  // 2 minutes (was 60s)
  
  expect: {
    timeout: 20 * 1000,  // 20s (was 10s)
  },
  
  // CHANGE 2: Enable 4 workers
  workers: 4,  // was 1
  
  use: {
    // CHANGE 3: Increase navigation and action timeouts
    navigationTimeout: 60 * 1000,  // 60s (was 30s)
    actionTimeout: 30 * 1000,  // 30s (was 15s)
    // ... rest of use config ...
  },
  
  // CHANGE 4: Use production build
  webServer: {
    command: process.env.E2E_USE_PRODUCTION === 'true' 
      ? 'npm start'  // Production server
      : 'npm run dev',  // Dev server (fallback)
    // ... rest of webServer config ...
  },
});
```

### Step 2: Add Production E2E Script (2 minutes)

Edit `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:prod": "E2E_USE_PRODUCTION=true playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:prod:ui": "E2E_USE_PRODUCTION=true playwright test --ui"
  }
}
```

### Step 3: Build and Test (20 minutes)

```bash
# 1. Build production (2-3 minutes)
npm run build

# 2. Run E2E tests with production build and 4 workers (12-15 minutes)
npm run test:e2e:prod

# 3. Monitor results
# - Watch for failures
# - Check total execution time
# - Note any flaky tests
```

---

## Expected Results

### Best Case (Target)
- ✅ All 362 tests pass
- ✅ Total time: ~12 minutes
- ✅ 4x faster than sequential
- ✅ No timeout issues

### Likely Case
- ✅ 350+ tests pass (96%+)
- ⚠️ Some flaky tests need adjustment
- ✅ Total time: ~15 minutes
- ✅ 3x faster than sequential

### Worst Case
- ⚠️ 320+ tests pass (88%+)
- ⚠️ Need to increase timeouts further
- ✅ Total time: ~20 minutes
- ✅ 2x faster than sequential

---

## Troubleshooting

### If Tests Still Fail with Timeouts

**Option A: Increase timeouts further (3x instead of 2x)**

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 180 * 1000,  // 3 minutes
  expect: { timeout: 30 * 1000 },  // 30s
  use: {
    navigationTimeout: 90 * 1000,  // 90s
    actionTimeout: 45 * 1000,  // 45s
  },
});
```

**Option B: Add test-level delays**

```typescript
// Add to test files that are failing
test.beforeEach(async ({ page }) => {
  // Give server time to recover between tests
  await page.waitForTimeout(2000);  // 2 second delay
});
```

**Option C: Use test sharding (run in groups)**

```bash
# Split tests into 3 groups, run each with 4 workers
npx playwright test __tests__/e2e/admin --workers=4
npx playwright test __tests__/e2e/guest --workers=4
npx playwright test __tests__/e2e/system --workers=4
```

### If Production Build Fails

**Fallback to dev server with 2 workers:**

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 2,  // Compromise: 2 workers instead of 4
  // ... rest of config ...
});
```

---

## Comparison: Before vs After

### Before (Sequential Execution)
```
Workers: 1
Build: Dev server (npm run dev)
Total Time: ~45 minutes
Pass Rate: ~95% (with server exhaustion issues)
```

### After (Parallel Execution)
```
Workers: 4
Build: Production (npm run build && npm start)
Total Time: ~12-15 minutes
Pass Rate: ~96%+ (expected)
Speedup: 3-4x faster
```

---

## CI/CD Integration

Once local testing is successful, update CI/CD:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build production
        run: npm run build
      
      - name: Run E2E tests (4 workers)
        run: npm run test:e2e:prod
        env:
          E2E_USE_PRODUCTION: 'true'
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Rollback Plan

If parallel execution doesn't work, revert to sequential:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 1,  // Back to sequential
  timeout: 60 * 1000,  // Original timeouts
  expect: { timeout: 10 * 1000 },
  use: {
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
  },
  webServer: {
    command: 'npm run dev',  // Back to dev server
  },
});
```

---

## Success Checklist

- [ ] Updated `playwright.config.ts` with 4 workers and increased timeouts
- [ ] Added `test:e2e:prod` script to `package.json`
- [ ] Built production: `npm run build`
- [ ] Ran E2E tests: `npm run test:e2e:prod`
- [ ] Verified pass rate > 90%
- [ ] Verified total time < 20 minutes
- [ ] Documented any flaky tests
- [ ] Updated CI/CD pipeline (if applicable)

---

## Next Steps After Success

1. **Document Results**: Create `E2E_FEB15_2026_PARALLEL_EXECUTION_RESULTS.md`
2. **Update Team**: Share new test command with team
3. **Monitor**: Watch for flaky tests over next few runs
4. **Optimize**: Fine-tune timeouts based on actual results
5. **CI/CD**: Update pipeline to use production build

---

## Questions?

**Q: Why production build instead of optimizing dev server?**  
A: Production builds are optimized, stable, and industry standard for E2E testing. Optimizing dev server is complex and may not fully solve resource issues.

**Q: What if I need to debug a failing test?**  
A: Use dev server for debugging individual tests:
```bash
npx playwright test path/to/test.spec.ts --debug
```

**Q: Can I use 8 workers for even faster execution?**  
A: Possible, but 4 workers is the sweet spot. More workers = more resource contention. Test with 4 first.

**Q: What about database connection limits?**  
A: Production build + 4 workers should stay within default limits. If issues arise, increase Supabase connection pool size.

---

## Summary

**The Fix**: Production build + 4 workers + increased timeouts

**Why It Works**: Production builds are optimized and stable, handling parallel execution better than dev server

**Expected Result**: 3-4x faster test execution (45 min → 12-15 min)

**Time Investment**: 30 minutes to implement and test

**Risk**: Low (can easily rollback to sequential execution)

**Recommendation**: ✅ Implement now

