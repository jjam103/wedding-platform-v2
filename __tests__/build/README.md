# Build Validation Tests

This directory contains tests that validate the build process itself, not just the code. These tests catch issues that only appear during production builds.

## Why These Tests Exist

Recent TypeScript build errors revealed that our comprehensive test suite wasn't catching compilation issues because:
- Tests mock Next.js internals
- Tests run with ts-jest, not the Next.js compiler
- No validation that the production build actually works

These tests solve that by explicitly validating the build process.

## Test Categories

### 1. TypeScript Compilation (`typescript.build.test.ts`)
Validates that TypeScript compiles without errors.

**Catches**:
- Type errors
- Missing type definitions
- Type incompatibilities
- Generic type issues

### 2. Next.js Build (`nextjs.build.test.ts`)
Validates that Next.js builds successfully.

**Catches**:
- Async params issues
- Missing Suspense boundaries
- Static generation errors
- Build configuration issues

### 3. API Route Contracts (`apiRoutes.contract.test.ts`)
Validates that all API routes follow required patterns.

**Catches**:
- Missing `await params` in dynamic routes
- Missing authentication checks
- Incorrect return types
- Pattern violations

## Running These Tests

```bash
# Run all build tests
npm run test:build

# Run specific test
npm test __tests__/build/typescript.build.test.ts

# Run in CI/CD
npm run build && npm test
```

## When These Tests Run

1. **Pre-commit**: Automatically via Husky hook
2. **CI/CD**: Before all other tests
3. **Manual**: When running `npm test`

## Adding New Build Tests

When adding a new build test:

1. Identify what build-time issue you're preventing
2. Create a test that would have caught it
3. Document why the test exists
4. Add to this README

### Example Template

```typescript
// __tests__/build/newPattern.build.test.ts
import { execSync } from 'child_process';
import { readFile } from 'fs/promises';

describe('New Pattern Validation', () => {
  it('should enforce the pattern', async () => {
    // Test implementation
  });
});
```

## Test Performance

These tests are intentionally run **before** other tests because:
- They're fast (5-10 seconds total)
- They catch issues early
- No point running 2000+ tests if the build fails

## Troubleshooting

### Test fails locally but passes in CI
- Ensure you've run `npm ci` to get exact dependencies
- Check Node.js version matches CI
- Clear `.next` directory and rebuild

### Test is too slow
- Consider caching build artifacts
- Run only on changed files
- Parallelize where possible

### False positives
- Review test logic
- Check for environment-specific issues
- Update test to be more specific

## Related Documentation

- `TEST_COVERAGE_GAPS_ANALYSIS.md` - Detailed analysis of what we're preventing
- `PREVENT_BUILD_ERRORS_ACTION_PLAN.md` - Implementation roadmap
- `WHY_TESTS_DIDNT_CATCH_ISSUES.md` - Historical context
