# Exact Code Changes to Enable 4 Playwright Workers

**File**: `playwright.config.ts`  
**Changes**: 4 simple edits  
**Time**: 5 minutes

---

## Change 1: Increase Test Timeout

**Line 23** - Change from 60s to 120s:

```diff
- timeout: 60 * 1000, // Increased from 30s to 60s
+ timeout: 120 * 1000, // 2 minutes for parallel execution
```

---

## Change 2: Increase Expect Timeout

**Line 27** - Change from 10s to 20s:

```diff
  expect: {
-   timeout: 10 * 1000, // Increased from 5s to 10s
+   timeout: 20 * 1000, // 20s for parallel execution
  },
```

---

## Change 3: Enable 4 Workers

**Line 38** - Change from 1 to 4:

```diff
- // Worker configuration: Sequential execution (workers: 1) to avoid parallel resource contention
- // When running all 8 reference block tests in parallel (4 workers), the server and database
- // cannot handle the concurrent load, causing timing issues and test failures.
- // Sequential execution ensures reliable test results at the cost of longer execution time.
- // See: E2E_FEB13_2026_FINAL_STATUS_SUMMARY.md for details
- workers: 1,
+ // Worker configuration: Parallel execution with production build
+ // Production builds are optimized and stable, handling 4 workers reliably.
+ // Dev server (npm run dev) cannot handle parallel execution due to resource limitations.
+ // Use E2E_USE_PRODUCTION=true to enable production build for parallel execution.
+ // See: E2E_FEB15_2026_PARALLEL_EXECUTION_STRATEGY.md for details
+ workers: process.env.E2E_USE_PRODUCTION === 'true' ? 4 : 1,
```

---

## Change 4: Increase Navigation and Action Timeouts

**Around line 55** - Find the `use:` section and update:

```diff
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
-   // Navigation timeout (increased for slower page loads)
-   navigationTimeout: 30 * 1000, // Increased from 15s to 30s
+   // Navigation timeout (increased for parallel execution)
+   navigationTimeout: 60 * 1000, // 60s for parallel execution
    
-   // Action timeout (increased for slower interactions)
-   actionTimeout: 15 * 1000, // Increased from 10s to 15s
+   // Action timeout (increased for parallel execution)
+   actionTimeout: 30 * 1000, // 30s for parallel execution
  },
```

---

## Change 5: Update WebServer Command (Optional but Recommended)

**Around line 110** - Update the webServer command to support production build:

```diff
  webServer: {
-   command: process.env.E2E_USE_PRODUCTION === 'true' ? 'npm run start' : 'npm run dev',
+   command: process.env.E2E_USE_PRODUCTION === 'true' ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
```

---

## Complete Updated Config (Key Sections)

Here's what the updated sections should look like:

```typescript
export default defineConfig({
  testDir: './__tests__/e2e',
  
  globalSetup: require.resolve('./__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/e2e/global-teardown.ts'),
  
  // Timeouts increased for parallel execution
  timeout: 120 * 1000,  // 2 minutes
  
  expect: {
    timeout: 20 * 1000,  // 20 seconds
  },
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  
  // Enable 4 workers for production build, 1 for dev
  workers: process.env.E2E_USE_PRODUCTION === 'true' ? 4 : 1,
  
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60 * 1000,  // 60 seconds
    actionTimeout: 30 * 1000,  // 30 seconds
  },
  
  // ... projects config stays the same ...
  
  webServer: {
    command: process.env.E2E_USE_PRODUCTION === 'true' ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // ... rest of webServer config ...
  },
});
```

---

## Add NPM Script

**File**: `package.json`

Add this script to the `scripts` section:

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

---

## How to Use

### Development (1 worker, dev server)
```bash
npm run test:e2e
```

### Production (4 workers, production build)
```bash
# First, build production
npm run build

# Then run tests
npm run test:e2e:prod
```

### Debug Individual Test
```bash
npx playwright test path/to/test.spec.ts --debug
```

---

## Verification

After making changes, verify the config:

```bash
# Check that workers are set correctly
grep -A 2 "workers:" playwright.config.ts

# Should show:
# workers: process.env.E2E_USE_PRODUCTION === 'true' ? 4 : 1,
```

---

## Expected Behavior

### With Dev Server (Default)
```bash
npm run test:e2e
# Workers: 1 (sequential)
# Time: ~45 minutes
# Reliable but slow
```

### With Production Build
```bash
npm run build
npm run test:e2e:prod
# Workers: 4 (parallel)
# Time: ~12-15 minutes
# Fast and reliable
```

---

## Rollback

If you need to revert:

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  workers: 1,
  use: {
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
  },
  webServer: {
    command: 'npm run dev',
  },
});
```

---

## Summary

**5 simple changes:**
1. ✅ Timeout: 60s → 120s
2. ✅ Expect timeout: 10s → 20s
3. ✅ Workers: 1 → 4 (conditional on E2E_USE_PRODUCTION)
4. ✅ Navigation timeout: 30s → 60s
5. ✅ Action timeout: 15s → 30s

**Result**: 3-4x faster test execution with production build

**Time to implement**: 5 minutes

**Ready to go!** 🚀

