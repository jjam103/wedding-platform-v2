# E2E Tests: Switch to Production Build

**Date**: February 15, 2026  
**Purpose**: Run E2E tests against production build instead of dev server

## Why Production Build?

1. **Three-way analysis confirmed**: Production build is the best baseline (245 passing, 7 flaky)
2. **Fixes are designed for production**: The timing adjustments were made for production build
3. **More representative**: Production build is what gets deployed to users
4. **More stable**: Production build has consistent timing, dev server varies

## Current Situation

Tests are running against dev server because `E2E_USE_PRODUCTION` is not set in `.env.e2e`.

## Quick Start (2 commands)

```bash
# 1. Build and start production server (in one terminal)
npm run build && npm start

# 2. Run tests with production flag (in another terminal)
E2E_USE_PRODUCTION=true npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

## Detailed Steps

### Step 1: Build Production

```bash
npm run build
```

**Expected output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
└ ○ /admin                               ...      ...
```

**Time**: ~2-3 minutes

### Step 2: Start Production Server

```bash
npm start
```

**Expected output**:
```
> wedding-platform@1.0.0 start
> next start

  ▲ Next.js 16.1.1
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.x:3000

 ✓ Ready in 2s
```

**Keep this terminal open** - the server needs to stay running.

### Step 3: Run Tests (in new terminal)

```bash
# Option A: Set environment variable inline
E2E_USE_PRODUCTION=true npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts

# Option B: Export environment variable first
export E2E_USE_PRODUCTION=true
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts

# Option C: Add to .env.e2e file (permanent)
echo "E2E_USE_PRODUCTION=true" >> .env.e2e
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

## What Changes with Production Build?

### Playwright Config Behavior

When `E2E_USE_PRODUCTION=true`:
```typescript
webServer: {
  // Production mode: Just verify existing server is accessible
  url: 'http://localhost:3000',
  reuseExistingServer: true,
  timeout: 10 * 1000,
  // No 'command' - expects server already running
}
```

When `E2E_USE_PRODUCTION` is not set (dev mode):
```typescript
webServer: {
  // Dev mode: Start dev server
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

### Timing Differences

| Aspect | Dev Server | Production Build |
|--------|-----------|------------------|
| Page load | Slower (on-demand compilation) | Faster (pre-compiled) |
| API responses | Variable | Consistent |
| Form submission | May have delays | Predictable |
| Tree rendering | May lag | Smooth |

## Troubleshooting

### Issue: "Port 3000 already in use"

**Solution**: Kill existing server
```bash
# Find process on port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use npx
npx kill-port 3000
```

### Issue: "Process from config.webServer was not able to start"

**Cause**: Playwright trying to start server when one is already running

**Solution**: Make sure `E2E_USE_PRODUCTION=true` is set
```bash
# Verify environment variable
echo $E2E_USE_PRODUCTION  # Should output: true

# If not set, export it
export E2E_USE_PRODUCTION=true
```

### Issue: Build fails with TypeScript errors

**Solution**: Fix TypeScript errors first
```bash
# Check for errors
npm run type-check

# Fix errors, then rebuild
npm run build
```

### Issue: Tests still failing with same errors

**Possible causes**:
1. Server not fully started - wait 10 seconds after "Ready" message
2. Database not seeded - check test database has data
3. Auth state expired - delete `.auth/` folder and re-run

## Verification

### 1. Check Server is Running
```bash
curl http://localhost:3000
# Should return HTML, not error
```

### 2. Check Environment Variable
```bash
echo $E2E_USE_PRODUCTION
# Should output: true
```

### 3. Check Playwright Config
The test output should show:
```
🌐 Verifying Next.js server...
✅ Next.js server is running
```

NOT:
```
Starting Next.js dev server...
```

## Expected Results

With production build, the Location Hierarchy tests should:
- ✅ Form closes properly after submission
- ✅ POST requests complete within timeout
- ✅ Tree expands/collapses correctly
- ✅ New locations appear in tree immediately

## Rollback to Dev Server

If you need to go back to dev server:

```bash
# Stop production server (Ctrl+C in server terminal)

# Unset environment variable
unset E2E_USE_PRODUCTION

# Or remove from .env.e2e
sed -i '' '/E2E_USE_PRODUCTION/d' .env.e2e

# Run tests (will start dev server automatically)
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

## Next Steps After Switching

1. Run Location Hierarchy tests (4 tests)
2. Verify all pass
3. If any fail, investigate production-specific issues
4. Document results in `E2E_FEB15_2026_PRIORITY1_PRODUCTION_RESULTS.md`
5. Continue with Priority 2 pattern fixes

## Related Documents

- `E2E_FEB15_2026_PRIORITY1_LOCATION_HIERARCHY_ROOT_CAUSE.md` - Why tests are failing
- `E2E_FEB15_2026_THREE_WAY_ANALYSIS_FINAL.md` - Why production is best baseline
- `playwright.config.ts` - Configuration that handles production mode
