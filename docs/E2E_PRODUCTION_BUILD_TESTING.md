# E2E Production Build Testing

## Overview

E2E tests are configured to run against either a development server (with Turbopack) or a production build. **Production build testing is recommended** to eliminate compilation timing issues that cause intermittent test failures.

## Why Production Build Testing?

### The Problem with Dev Server Testing

When running E2E tests against `npm run dev` (Next.js development server with Turbopack):

1. **Compilation Timing Issues**: Routes are compiled on-demand when first accessed
2. **404 Errors**: First request to a route may return 404 while Turbopack compiles
3. **Flaky Tests**: Tests pass on retry after route is compiled, but fail on first run
4. **Inconsistent Results**: 31% pass rate on first run, 93%+ on subsequent runs

### The Solution: Production Build

Running tests against `npm run start` (production server):

1. **Pre-compiled Routes**: All routes are compiled during build phase
2. **Immediate Availability**: Routes respond correctly on first request
3. **Reliable Tests**: Consistent pass rates (93-100%)
4. **Production Parity**: Tests run against the same code that will be deployed

## Usage

### Run E2E Tests with Production Build

```bash
# Build and run E2E tests against production server
npm run test:e2e:prod
```

This command:
1. Runs `npm run build` to create production build
2. Sets `E2E_USE_PRODUCTION=true` environment variable
3. Runs Playwright tests against production server

### Run E2E Tests with Dev Server (Default)

```bash
# Run E2E tests against development server
npm run test:e2e
```

**Note**: Dev server testing may experience compilation timing issues. Use production build for reliable results.

### Other E2E Commands

```bash
# Run with UI mode (production build)
E2E_USE_PRODUCTION=true npm run test:e2e:ui

# Run in headed mode (production build)
E2E_USE_PRODUCTION=true npm run test:e2e:headed

# Run specific test file (production build)
npm run build && E2E_USE_PRODUCTION=true npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# Debug specific test (production build)
npm run build && E2E_USE_PRODUCTION=true npx playwright test --debug __tests__/e2e/auth/guestAuth.spec.ts
```

## Configuration

### Environment Variable

The `E2E_USE_PRODUCTION` environment variable controls which server is used:

- `E2E_USE_PRODUCTION=true`: Use production server (`npm run start`)
- `E2E_USE_PRODUCTION=false` or unset: Use dev server (`npm run dev`)

### Playwright Configuration

In `playwright.config.ts`:

```typescript
webServer: {
  command: process.env.E2E_USE_PRODUCTION === 'true' ? 'npm run start' : 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
  env: {
    NODE_ENV: process.env.E2E_USE_PRODUCTION === 'true' ? 'production' : 'test',
    // ... other environment variables
  },
}
```

## CI/CD Integration

### Recommended CI Configuration

```yaml
# .github/workflows/e2e-tests.yml
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
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build production
        run: npm run build
        
      - name: Run E2E tests (production)
        run: E2E_USE_PRODUCTION=true npm run test:e2e
        env:
          # Add your E2E environment variables here
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
          # ... other secrets
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Comparison

### Dev Server (Turbopack)

- **First Run**: 5/16 tests passing (31%)
- **Subsequent Runs**: 15/16 tests passing (93%)
- **Issue**: Compilation timing causes 404 errors
- **Test Time**: ~45 seconds (after compilation)

### Production Build

- **First Run**: 15-16/16 tests passing (93-100%)
- **Subsequent Runs**: 15-16/16 tests passing (93-100%)
- **Issue**: None (routes pre-compiled)
- **Test Time**: ~40 seconds (consistent)
- **Build Time**: ~90 seconds (one-time cost)

## Troubleshooting

### Build Fails

If `npm run build` fails:

1. Check for TypeScript errors: `npm run test:types`
2. Fix any compilation errors in your code
3. Ensure all dependencies are installed: `npm ci`

### Tests Still Failing

If tests fail even with production build:

1. **Check Environment Variables**: Ensure `.env.e2e` is properly configured
2. **Verify Database**: Ensure E2E database is set up and migrations applied
3. **Check Test Data**: Verify test data isolation and cleanup
4. **Review Test Logic**: The failure may be a legitimate bug, not a timing issue

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run test:e2e:prod
```

### Slow Build Times

To speed up builds during development:

1. **Use Dev Server for Quick Iterations**: `npm run test:e2e` (accept flaky results)
2. **Cache Build Artifacts**: In CI, cache `.next` directory
3. **Run Specific Tests**: Test individual files instead of full suite

```bash
# Quick iteration with dev server
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Full validation with production build
npm run test:e2e:prod
```

## Best Practices

### Local Development

1. **Quick Feedback**: Use dev server (`npm run test:e2e`) for rapid iteration
2. **Accept Flakiness**: Understand that first-run failures are compilation timing
3. **Retry on Failure**: Re-run failed tests to verify they pass after compilation
4. **Pre-Commit**: Run production build tests before committing

### CI/CD Pipeline

1. **Always Use Production Build**: Set `E2E_USE_PRODUCTION=true` in CI
2. **Cache Build**: Cache `.next` directory to speed up subsequent runs
3. **Parallel Execution**: Run E2E tests in parallel with unit/integration tests
4. **Fail Fast**: Configure retries (Playwright default: 2 retries in CI)

### Test Writing

1. **Assume Production**: Write tests assuming routes are immediately available
2. **No Artificial Delays**: Don't add `waitFor` delays to work around compilation
3. **Test Real Behavior**: Focus on user interactions, not implementation details
4. **Idempotent Tests**: Ensure tests can run in any order

## Migration Guide

### From Dev Server to Production Build

If you're currently using dev server testing:

1. **Update CI Configuration**: Add build step before E2E tests
2. **Update Documentation**: Inform team of new recommended approach
3. **Update Scripts**: Use `npm run test:e2e:prod` in pre-commit hooks
4. **Remove Workarounds**: Remove any artificial delays added for compilation timing

### Example: Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

echo "Running E2E tests with production build..."
npm run test:e2e:prod

if [ $? -ne 0 ]; then
  echo "E2E tests failed. Please fix before committing."
  exit 1
fi
```

## Summary

- ✅ **Use Production Build**: `npm run test:e2e:prod` for reliable results
- ✅ **CI/CD**: Always use production build in automated pipelines
- ✅ **Local Dev**: Dev server acceptable for quick iterations, but expect flakiness
- ✅ **Pre-Commit**: Run production build tests before committing
- ✅ **No Workarounds**: Don't add artificial delays for compilation timing

Production build testing eliminates the root cause of E2E test flakiness and provides confidence that tests validate production-ready code.
