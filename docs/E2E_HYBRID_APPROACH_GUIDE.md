# E2E Testing: Hybrid Approach Guide

## Quick Start

The hybrid approach separates build verification from E2E test execution for maximum reliability.

**IMPORTANT**: This approach does NOT mean running two builds. It means:
- **ONE build** (optional, for verification only)
- **TWO test runs** (dev server compiles routes on-demand)

### Local Development

```bash
# Quick iteration (ZERO builds - just run tests)
npm run test:e2e

# Pre-commit validation (ONE build + tests)
npm run build && npm run test:e2e

# Debug specific test
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --debug
```

### CI/CD

See `.github/workflows/e2e-hybrid.yml.example` for complete implementation.

## Why Hybrid Approach?

### The Challenge

Production server testing discovered an environment variable loading issue:
- Production server loads `.env.local` (production database)
- E2E tests need `.env.e2e` (test database)
- Authentication fails due to database mismatch

### The Solution

**Separate concerns**:
1. **Build Verification**: Catches compilation errors
2. **E2E Tests**: Run with dev server (uses correct test database)

### Benefits

✅ **Already Working**: 93% pass rate with dev server
✅ **Zero Changes**: No code modifications needed
✅ **No Auth Issues**: Uses test database correctly
✅ **Simple**: Easy to understand and maintain
✅ **Reliable**: Proven approach

## Understanding the 2-Run Pattern

**CRITICAL**: "2-run pattern" means running E2E tests twice, NOT building twice.

### Why 2 Test Runs?

Next.js dev server with Turbopack compiles routes on-demand:
- **First request**: Route compiles (may return 404)
- **Subsequent requests**: Route responds correctly

### First Test Run (Warmup)
```bash
npm run test:e2e || true  # Allow failures
```
- Dev server compiles routes on-demand (NOT a build)
- Expected: 31% pass rate (compilation timing)
- Purpose: Warm up the dev server
- Time: ~50 seconds

### Second Test Run (Actual)
```bash
npm run test:e2e  # Should pass
```
- Routes already compiled in memory
- Expected: 93% pass rate (reliable)
- Purpose: Validate functionality
- Time: ~50 seconds

### Build vs Compilation

| Action | What Happens | Time | When |
|--------|-------------|------|------|
| **`npm run build`** | Full production build | 90s | Optional, for verification |
| **`npm run test:e2e`** | Dev server compiles on-demand | 50s | Every test run |
| **Second `npm run test:e2e`** | Routes already compiled | 50s | Reliable results |

**Total**: 0-1 builds, 2 test runs

## Performance

| Metric | Time | Notes |
|--------|------|-------|
| Build verification | 90s | One-time per commit |
| E2E warmup | 50s | Compiles routes |
| E2E tests | 50s | Reliable results |
| **Total sequential** | **190s** | All steps in order |
| **Total parallel** | **140s** | Build + E2E concurrent |

### Optimization: Parallel Execution

Run build verification and E2E tests in parallel:

```yaml
jobs:
  build-verification:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e || true  # Warmup
      - run: npm run test:e2e          # Actual
```

**Result**: Total time = max(90s, 100s) = ~100s

## Common Scenarios

### Scenario 1: Local Development

**Goal**: Quick feedback during development

```bash
# Run tests (accept first-run flakiness)
npm run test:e2e

# If tests fail, run again (routes now compiled)
npm run test:e2e
```

**Expected**: 93% pass rate on second run

### Scenario 2: Pre-Commit

**Goal**: Ensure code is production-ready

```bash
# Verify build succeeds
npm run build

# Run E2E tests
npm run test:e2e
```

**Expected**: Build succeeds, 93% E2E pass rate

### Scenario 3: CI/CD Pipeline

**Goal**: Comprehensive validation

```yaml
# Parallel execution
- name: Build verification
  run: npm run build
  
- name: E2E warmup
  run: npm run test:e2e || true
  
- name: E2E tests
  run: npm run test:e2e
```

**Expected**: Build succeeds, 93% E2E pass rate, ~140s total

### Scenario 4: Debugging Failures

**Goal**: Investigate test failures

```bash
# Run specific test with UI
npm run test:e2e:ui -- __tests__/e2e/auth/guestAuth.spec.ts

# Run with debug mode
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts --debug

# Run in headed mode (see browser)
npm run test:e2e:headed -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Troubleshooting

### Tests Fail on First Run

**Expected behavior** - routes are compiling. Run again:

```bash
npm run test:e2e  # Should pass on second run
```

### Tests Fail on Second Run

**Legitimate issue** - investigate the failure:

1. Check test output for error messages
2. Review Playwright report: `npx playwright show-report`
3. Check screenshots in `test-results/`
4. Run with `--debug` flag for step-by-step execution

### Build Fails

**Compilation error** - fix TypeScript/build errors:

```bash
# Check TypeScript errors
npm run test:types

# Check for syntax errors
npm run lint

# Fix errors and rebuild
npm run build
```

### Port Already in Use

**Dev server conflict** - kill existing process:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run test:e2e
```

## Best Practices

### ✅ Do

- Run tests twice locally (warmup + actual)
- Use build verification before committing
- Accept first-run failures as expected
- Focus on second-run results
- Use parallel execution in CI/CD

### ❌ Don't

- Don't add artificial delays to tests
- Don't skip build verification
- Don't expect 100% first-run pass rate
- Don't test against production database
- Don't commit without running tests

## Future Enhancement: Production Server Testing

When production server testing becomes critical, implement **Option A (Environment Variable Injection)**.

### Implementation

Update `playwright.config.ts`:

```typescript
webServer: {
  command: process.env.E2E_USE_PRODUCTION === 'true' ? 'npm run start' : 'npm run dev',
  env: {
    // Explicitly pass all E2E environment variables
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // ... all other E2E variables
  },
}
```

### Usage

```bash
# Build and test with production server
npm run test:e2e:prod
```

### Benefits

- ✅ Tests against production server
- ✅ No compilation timing issues
- ✅ 95%+ first-run pass rate
- ✅ Single-run execution

### Effort

**Estimated**: 2-3 hours (implementation + testing)

**When**: When production server testing becomes a priority

## Success Metrics

### Current (Hybrid Approach)

- ✅ Build verification: Catches compilation errors
- ✅ E2E tests: 93% pass rate (reliable after warmup)
- ✅ Total time: ~140s (parallelizable to ~100s)
- ✅ No authentication issues

### Target (Future with Production Server)

- 🎯 95%+ first-run pass rate
- 🎯 Single-run execution
- 🎯 Production server testing
- 🎯 <2 minute total time

## Related Documentation

- `E2E_PRODUCTION_BUILD_DECISION.md` - Decision rationale
- `E2E_PRODUCTION_BUILD_IMPLEMENTATION_SUMMARY.md` - Complete analysis
- `docs/E2E_PRODUCTION_BUILD_TESTING.md` - Production build guide
- `.github/workflows/e2e-hybrid.yml.example` - CI/CD example

## Summary

The hybrid approach provides:
- ✅ Reliable E2E testing (93% pass rate)
- ✅ Build verification (catches compilation errors)
- ✅ Simple implementation (zero changes)
- ✅ Clear path for future enhancement

**Key Takeaway**: Accept 2-run pattern as expected behavior. Focus on second-run results for validation.
