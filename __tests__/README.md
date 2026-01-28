# Testing Guide

## Quick Start

```bash
# Run all tests (with build verification)
npm test

# Quick tests (no build, faster for development)
npm run test:quick

# Full test suite (types + build + tests + E2E)
npm run test:full

# CI/CD test suite
npm run test:ci
```

## Test Types

### Unit Tests
Test individual functions and components in isolation.

```bash
npm run test:quick
```

**Location**: Co-located with source files
- `services/*.test.ts`
- `components/**/*.test.tsx`
- `utils/*.test.ts`

### Integration Tests
Test API routes and database operations.

```bash
npm run test:integration
```

**Location**: `__tests__/integration/`
- `apiRoutes.integration.test.ts` - Mocked API tests
- `realApi.integration.test.ts` - Real API tests (requires running server)
- `*Api.integration.test.ts` - Specific API endpoint tests

### Property-Based Tests
Test business rules with random inputs using fast-check.

```bash
npm run test:property
```

**Location**: Co-located with services
- `services/*.property.test.ts`

### E2E Tests
Test complete user workflows with Playwright.

```bash
npm run test:e2e
npm run test:e2e:ui        # With UI
npm run test:e2e:debug     # Debug mode
```

**Location**: `__tests__/e2e/`

### Smoke Tests
Quick validation that all API endpoints respond.

```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:smoke
```

**Location**: `__tests__/smoke/`

### Security Tests
Test XSS prevention, SQL injection, auth, etc.

```bash
npm run test:security
```

**Location**: `__tests__/security/`

### Performance Tests
Test response times and load handling.

```bash
npm run test:performance
```

**Location**: `__tests__/performance/`

### Accessibility Tests
Test WCAG 2.1 AA compliance.

```bash
npm run test:accessibility
```

**Location**: `__tests__/accessibility/`

## Test Workflow

### During Development

```bash
# 1. Make changes
vim app/api/admin/locations/route.ts

# 2. Run quick tests
npm run test:quick

# 3. Run specific test
npm run test:quick -- locations

# 4. Commit (pre-commit hooks run automatically)
git commit -m "Fix locations API"
```

### Before Pushing

```bash
# Run full test suite
npm run test:full
```

### Debugging Tests

```bash
# Run specific test file
npm run test:quick -- path/to/test.ts

# Run tests matching pattern
npm run test:quick -- locations

# Watch mode
npm run test:watch

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Writing Tests

### Unit Test Template

```typescript
import { functionToTest } from './module';

describe('functionToTest', () => {
  it('should do something when condition', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Template

```typescript
describe('GET /api/admin/endpoint', () => {
  it('should return data when authenticated', async () => {
    // Setup
    const mockAuth = setupAuth();
    
    // Execute
    const response = await fetch('/api/admin/endpoint');
    const data = await response.json();
    
    // Verify
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  // Navigate
  await page.goto('/admin');
  
  // Interact
  await page.click('button[data-testid="add-button"]');
  await page.fill('input[name="name"]', 'Test');
  await page.click('button[type="submit"]');
  
  // Verify
  await expect(page.locator('text=Success')).toBeVisible();
});
```

## Test Coverage

### Current Coverage
- Overall: ~80%
- Services: ~90%
- Components: ~70%
- API Routes: ~85%

### Coverage Requirements
- Critical paths: 100%
- Service layer: 90%
- API routes: 85%
- Components: 70%

### Generate Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## CI/CD Integration

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Manual workflow dispatch

See `.github/workflows/test.yml` for details.

## Pre-commit Hooks

Hooks run automatically on `git commit`:
1. Type checking
2. Build verification
3. Quick tests

To skip (use sparingly):
```bash
git commit --no-verify
```

## Troubleshooting

### Tests Failing Locally

```bash
# Clear cache
npm run test:quick -- --clearCache

# Update snapshots
npm run test:quick -- -u

# Run with verbose output
npm run test:quick -- --verbose
```

### E2E Tests Failing

```bash
# Install browsers
npx playwright install

# Run with UI
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug -- admin-dashboard.spec.ts
```

### Real API Tests Failing

```bash
# Check server is running
curl http://localhost:3000

# Check environment variables
cat .env.local

# Check database connection
npm run test:integration -- database
```

### Pre-commit Hooks Not Running

```bash
# Reinstall husky
npx husky install
chmod +x .husky/pre-commit
```

## Best Practices

### DO
- ✅ Write tests alongside code (TDD)
- ✅ Test both success and error paths
- ✅ Use descriptive test names
- ✅ Keep tests independent
- ✅ Mock external dependencies
- ✅ Clean up after tests
- ✅ Test edge cases

### DON'T
- ❌ Skip writing tests
- ❌ Write tests that depend on each other
- ❌ Use real external services in tests
- ❌ Commit commented-out tests
- ❌ Ignore flaky tests
- ❌ Test implementation details

## Resources

- **Testing Standards**: `.kiro/steering/testing-standards.md`
- **API Standards**: `.kiro/steering/api-standards.md`
- **Why Tests Didn't Catch Issues**: `WHY_TESTS_DIDNT_CATCH_ISSUES.md`
- **Quick Fixes**: `QUICK_FIXES_IMPLEMENTED.md`
- **Action Plan**: `TESTING_IMPROVEMENTS_ACTION_PLAN.md`

## Getting Help

- Check test output for error messages
- Review test documentation in `__tests__/*/README.md`
- Ask in team chat
- Create issue with test failure details
