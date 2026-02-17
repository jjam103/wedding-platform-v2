# E2E Parallel Execution Strategy - February 15, 2026

**Date**: February 15, 2026  
**Goal**: Enable 4 Playwright workers for faster E2E test execution  
**Current State**: Sequential execution (1 worker) taking ~45+ minutes for 362 tests

---

## Current Situation

### Why We're Using 1 Worker

From `E2E_FEB13_2026_FINAL_STATUS_SUMMARY.md`:

> When running all 8 reference block tests in parallel (4 workers), the server and database cannot handle the concurrent load, causing timing issues and test failures. Sequential execution ensures reliable test results at the cost of longer execution time.

**Problems with 4 workers:**
- Server resources divided across parallel tests
- Database contention
- UI rendering delays
- Retry timeouts insufficient under load
- Single test runs work reliably, parallel runs fail

### Current Performance

**Sequential Execution (1 worker):**
- Total time: ~45+ minutes for 362 tests
- Average: ~7.5 seconds per test
- Reliability: Good (but still seeing server exhaustion after 340+ tests)

**Parallel Execution (4 workers) - Estimated:**
- Total time: ~12-15 minutes (4x faster)
- Reliability: Poor (tests fail due to resource contention)

---

## Root Causes of Parallel Execution Failures

### 1. Development Server Limitations

**Problem**: Running against `npm run dev`
- Not optimized for sustained concurrent load
- Hot module reloading overhead
- Compilation on-demand
- Memory leaks accumulate
- No production optimizations

**Evidence from current run:**
- After 340+ tests, seeing navigation timeouts
- ERR_ABORTED errors on heavy pages
- Server exhaustion symptoms

### 2. Database Connection Pool

**Problem**: Limited connection pool size
- Default Supabase connection pool: ~10-20 connections
- 4 workers × multiple tests = connection exhaustion
- Connections not properly released
- No connection pooling optimization

### 3. Component Rendering Timing Issues ⚠️ NEW

**Problem**: Complex components don't render consistently under parallel load
- **CollapsibleForm**: Not expanding after button clicks
- **InlineSectionEditor**: Not appearing in DOM
- **Data tables**: Loading race conditions across entity types
- **React state updates**: Timing issues with concurrent tests

**Evidence from Section Management tests:**
- Tests were flaky with 4 workers
- Became consistent with 1 worker
- CollapsibleForm expansion timing issues
- Data table loading detection failures

### 4. Test Isolation Issues

**Problem**: Tests don't properly clean up resources
- Database state accumulation
- Memory leaks between tests
- No server restart between test suites
- Route compilation cache issues

### 5. Timeout Configuration

**Problem**: Timeouts too aggressive for parallel execution
- Current: 60s test timeout, 30s navigation, 15s action
- Under load: Need 2-3x longer timeouts
- Retry logic insufficient

---

## Strategy Options for Enabling 4 Workers

### Option 1: Production Build + Increased Timeouts ⭐ RECOMMENDED

**Approach**: Use production build with optimized timeouts

**Changes Required:**

1. **Switch to Production Build**
   ```typescript
   // playwright.config.ts
   webServer: {
     command: 'npm run build && npm start',
     // ... rest of config
   }
   ```

2. **Increase Timeouts for Parallel Execution**
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     timeout: 120 * 1000,  // 2 minutes (was 60s)
     expect: {
       timeout: 20 * 1000,  // 20s (was 10s)
     },
     use: {
       navigationTimeout: 60 * 1000,  // 60s (was 30s)
       actionTimeout: 30 * 1000,  // 30s (was 15s)
     },
     workers: 4,  // Enable parallel execution
   });
   ```

3. **Add Test-Level Delays**
   ```typescript
   // Add to test setup
   test.beforeEach(async ({ page }) => {
     // Give server time to recover between tests
     await page.waitForTimeout(1000);
   });
   ```

**Pros:**
- Production build is optimized and stable
- Matches real user experience
- Better resource management
- Catches build-time issues
- Minimal code changes

**Cons:**
- Slower iteration (need to rebuild for changes)
- Longer initial setup time (~2-3 minutes for build)
- Less debugging information

**Estimated Time to Implement**: 30 minutes  
**Estimated Test Run Time**: 12-15 minutes  
**Reliability**: ⭐⭐⭐⭐ (High)

---

### Option 2: Increase Database Connection Pool

**Approach**: Optimize database connections for parallel execution

**Changes Required:**

1. **Increase Supabase Connection Pool**
   ```typescript
   // lib/supabase.ts
   const supabase = createClient(url, key, {
     db: {
       poolSize: 40,  // Increase from default ~10-20
     },
   });
   ```

2. **Add Connection Cleanup**
   ```typescript
   // __tests__/e2e/global-teardown.ts
   export default async function globalTeardown() {
     // Close all database connections
     await supabase.removeAllChannels();
     // ... rest of cleanup
   }
   ```

3. **Improve Test Isolation**
   ```typescript
   // Add to each test file
   test.afterEach(async () => {
     // Ensure connections are released
     await cleanupDatabaseConnections();
   });
   ```

**Pros:**
- Addresses root cause of database contention
- Works with dev server
- Better for development workflow

**Cons:**
- Requires Supabase configuration changes
- May need database server upgrades
- Doesn't address server resource issues
- Complex implementation

**Estimated Time to Implement**: 2-3 hours  
**Estimated Test Run Time**: 12-15 minutes  
**Reliability**: ⭐⭐⭐ (Medium)

---

### Option 3: Hybrid Approach - Test Sharding

**Approach**: Split tests into groups, run each group with 4 workers

**Changes Required:**

1. **Create Test Groups**
   ```bash
   # Group 1: Admin tests (150 tests)
   npx playwright test __tests__/e2e/admin --workers=4
   
   # Group 2: Guest tests (100 tests)
   npx playwright test __tests__/e2e/guest --workers=4
   
   # Group 3: System tests (112 tests)
   npx playwright test __tests__/e2e/system --workers=4
   ```

2. **Add Server Restart Between Groups**
   ```bash
   # Run with server restart
   npm run test:e2e:group1 && \
   pkill -f "next dev" && sleep 5 && \
   npm run test:e2e:group2 && \
   pkill -f "next dev" && sleep 5 && \
   npm run test:e2e:group3
   ```

3. **Configure Playwright for Sharding**
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     workers: 4,
     shard: process.env.SHARD ? {
       current: parseInt(process.env.SHARD_INDEX),
       total: parseInt(process.env.SHARD_TOTAL),
     } : undefined,
   });
   ```

**Pros:**
- Balances speed and reliability
- Server gets breaks between groups
- Can use dev server
- Easier debugging

**Cons:**
- More complex CI/CD setup
- Longer total time than pure parallel
- Requires orchestration

**Estimated Time to Implement**: 1-2 hours  
**Estimated Test Run Time**: 20-25 minutes (3 groups × 7 minutes)  
**Reliability**: ⭐⭐⭐⭐ (High)

---

### Option 4: Optimize Dev Server for Parallel Execution

**Approach**: Configure Next.js dev server for better parallel performance

**Changes Required:**

1. **Increase Node.js Memory**
   ```json
   // package.json
   {
     "scripts": {
       "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
     }
   }
   ```

2. **Disable Hot Module Reloading for E2E**
   ```typescript
   // next.config.ts
   const config = {
     // Disable HMR for E2E tests
     webpack: (config, { dev }) => {
       if (dev && process.env.E2E_MODE) {
         config.watchOptions = {
           ignored: /node_modules/,
           poll: false,
         };
       }
       return config;
     },
   };
   ```

3. **Add Server Health Checks**
   ```typescript
   // Add to test setup
   test.beforeAll(async () => {
     // Wait for server to be healthy
     await waitForServerHealth();
   });
   ```

**Pros:**
- Keeps dev workflow
- Fast iteration
- Better debugging

**Cons:**
- Doesn't fully solve resource issues
- Complex configuration
- May still have failures

**Estimated Time to Implement**: 2-3 hours  
**Estimated Test Run Time**: 12-15 minutes  
**Reliability**: ⭐⭐⭐ (Medium)

---

## Recommendation: Option 1 (Production Build)

### Why Production Build is Best

1. **Stability**: Production builds are optimized and stable
2. **Real-World Testing**: Tests match actual user experience
3. **Resource Efficiency**: Better memory management and performance
4. **Minimal Changes**: Simple configuration changes
5. **Proven Approach**: Industry standard for E2E testing

### Implementation Plan

#### Phase 1: Setup (15 minutes)

1. Update `playwright.config.ts`:
   ```typescript
   export default defineConfig({
     timeout: 120 * 1000,
     expect: { timeout: 20 * 1000 },
     use: {
       navigationTimeout: 60 * 1000,
       actionTimeout: 30 * 1000,
     },
     workers: 4,
     webServer: {
       command: 'npm run build && npm start',
       // ... rest
     },
   });
   ```

2. Create production E2E script:
   ```json
   // package.json
   {
     "scripts": {
       "test:e2e:prod": "E2E_USE_PRODUCTION=true playwright test"
     }
   }
   ```

#### Phase 2: Test Run (15 minutes)

1. Build production:
   ```bash
   npm run build
   ```

2. Run E2E tests with 4 workers:
   ```bash
   npm run test:e2e:prod
   ```

3. Monitor results and adjust timeouts if needed

#### Phase 3: Optimization (Optional)

If tests still fail:
1. Increase timeouts further (3x instead of 2x)
2. Add test-level delays in `beforeEach`
3. Implement test sharding for heavy test suites

### Expected Outcomes

**Best Case:**
- All 362 tests pass
- Total time: ~12 minutes
- 4x faster than sequential

**Likely Case:**
- 350+ tests pass (96%+)
- Some flaky tests need timeout adjustments
- Total time: ~15 minutes
- 3x faster than sequential

**Worst Case:**
- 320+ tests pass (88%+)
- Need to implement hybrid approach
- Total time: ~20 minutes
- 2x faster than sequential

---

## Alternative: Keep Sequential, Optimize for Speed

If parallel execution proves too difficult, optimize sequential execution:

### Quick Wins for Sequential Execution

1. **Use Production Build**
   - Faster page loads
   - Better resource management
   - Estimated time: ~30 minutes (vs 45 minutes)

2. **Reduce Test Scope**
   - Skip redundant tests
   - Focus on critical paths
   - Estimated time: ~25 minutes

3. **Optimize Test Data Setup**
   - Reuse test data where possible
   - Batch database operations
   - Estimated time: ~35 minutes

---

## Decision Matrix

| Option | Time to Implement | Test Run Time | Reliability | Dev Experience | Recommended |
|--------|------------------|---------------|-------------|----------------|-------------|
| **Production Build** | 30 min | 12-15 min | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ YES |
| Database Pool | 2-3 hours | 12-15 min | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ MAYBE |
| Test Sharding | 1-2 hours | 20-25 min | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ MAYBE |
| Optimize Dev Server | 2-3 hours | 12-15 min | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ NO |
| Keep Sequential | 0 min | 45 min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ FALLBACK |

---

## Action Plan

### Immediate (Today)

1. ✅ Wait for current test run to complete
2. ✅ Document current baseline results
3. ⏳ Implement Option 1 (Production Build + 4 workers)
4. ⏳ Run test suite and measure results
5. ⏳ Adjust timeouts if needed

### Short-term (This Week)

1. If Option 1 works: Document and close
2. If Option 1 fails: Try Option 3 (Test Sharding)
3. Update CI/CD pipeline with new configuration

### Long-term (Future)

1. Implement Option 2 (Database Pool optimization)
2. Add server health monitoring
3. Improve test isolation
4. Consider dedicated E2E test environment

---

## Success Criteria

**Minimum Success:**
- 4 workers enabled
- Test run time < 20 minutes
- Pass rate > 90%

**Target Success:**
- 4 workers enabled
- Test run time < 15 minutes
- Pass rate > 95%

**Ideal Success:**
- 4 workers enabled
- Test run time < 12 minutes
- Pass rate > 98%

---

## Risks and Mitigation

### Risk 1: Production Build Failures

**Mitigation**: Keep sequential execution as fallback

### Risk 2: Increased Flakiness

**Mitigation**: Implement retry logic and timeout adjustments

### Risk 3: CI/CD Pipeline Changes

**Mitigation**: Test locally first, then update CI/CD gradually

---

## Conclusion

**Recommended Approach**: Option 1 (Production Build + 4 Workers)

This approach offers the best balance of:
- Implementation time (30 minutes)
- Test execution speed (12-15 minutes)
- Reliability (high)
- Minimal code changes

The production build is optimized for performance and stability, making it ideal for parallel execution. Combined with increased timeouts, this should enable 4 workers while maintaining test reliability.

**Next Step**: Implement Option 1 and measure results.

