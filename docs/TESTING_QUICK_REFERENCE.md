# Testing Quick Reference Guide

## Quick Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/integration/
npm test -- services/guestService.test.ts

# Run with coverage
npm test -- --coverage

# Run only changed tests
npm test -- --onlyChanged

# Run E2E tests
npm run test:e2e

# Run property-based tests
npm test -- --testNamePattern="Property:"

# Generate test metrics
npm run test:metrics

# Watch mode
npm test -- --watch
```

---

## Test Patterns Cheat Sheet

### Property-Based Testing

```typescript
import fc from 'fast-check';

// Basic property test
it('should validate property', () => {
  fc.assert(fc.property(
    fc.string(),
    (input) => {
      const result = myFunction(input);
      expect(result).toBeDefined();
    }
  ));
});

// Custom arbitrary
const guestArbitrary = fc.record({
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  ageType: fc.constantFrom('adult', 'child', 'senior'),
});

// Async property test
await fc.assert(fc.asyncProperty(
  fc.string(),
  async (input) => {
    const result = await asyncFunction(input);
    expect(result).toBeDefined();
  }
), { numRuns: 50 });
```

### Integration Testing

```typescript
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';

describe('API Integration', () => {
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    const testUser = await createTestUser();
    authToken = testUser.authToken;
    userId = testUser.userId;
  });
  
  afterAll(async () => {
    await cleanupTestData(userId);
  });
  
  it('should test API with real auth', async () => {
    const response = await fetch('http://localhost:3000/api/admin/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });
  
  test('should complete workflow', async ({ page }) => {
    // Navigate
    await page.goto('/admin/feature');
    
    // Interact
    await page.click('text=Add Item');
    await page.fill('[name="name"]', 'Test Item');
    await page.click('button:has-text("Save")');
    
    // Verify
    await expect(page.locator('.toast')).toContainText('Item created');
    await expect(page.locator('text=Test Item')).toBeVisible();
  });
});
```

---

## Common Test Helpers

### Test Data Factories

```typescript
import { createTestGuest, createTestGuestGroup } from '@/__tests__/helpers/factories';

// Create test guest
const guest = createTestGuest({
  firstName: 'John',
  email: 'john@example.com',
});

// Create test guest group
const group = createTestGuestGroup({
  name: 'Test Group',
});
```

### Test Authentication

```typescript
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';

// Create test user
const { userId, email, authToken } = await createTestUser();

// Cleanup test user
await cleanupTestData(userId);
```

### Test Database

```typescript
import { getTestSupabase } from '@/__tests__/helpers/testDb';

// Get test database client
const supabase = getTestSupabase();

// Query test database
const { data } = await supabase.from('guests').select('*');
```

---

## Test Naming Conventions

### Unit Tests
```typescript
describe('serviceName.methodName', () => {
  it('should [behavior] when [condition]', () => {
    // Test
  });
});
```

### Integration Tests
```typescript
describe('API Route - Integration', () => {
  it('should [action] with [auth/data state]', async () => {
    // Test
  });
});
```

### E2E Tests
```typescript
test.describe('Feature Flow', () => {
  test('should allow user to [complete workflow]', async ({ page }) => {
    // Test
  });
});
```

### Property Tests
```typescript
describe('Property: [Property Name]', () => {
  it('should [universal truth] for any [input type]', () => {
    // Test
  });
});
```

---

## Debugging Tests

### Debug Single Test
```bash
# Run specific test
npm test -- -t "test name"

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage --collectCoverageFrom="services/guestService.ts"
```

### Debug Property Test
```typescript
// Use seed to reproduce failure
fc.assert(fc.property(...), { 
  seed: 1234567890,  // From failure message
  verbose: true      // Log all values
});
```

### Debug E2E Test
```typescript
// Run in headed mode
npx playwright test --headed

// Run with debug
npx playwright test --debug

// Take screenshot on failure
test('should work', async ({ page }) => {
  await page.screenshot({ path: 'debug.png' });
});
```

---

## Common Assertions

### Jest Assertions
```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### Playwright Assertions
```typescript
// Visibility
await expect(page.locator('text=Hello')).toBeVisible();
await expect(page.locator('text=Hidden')).not.toBeVisible();

// Text content
await expect(page.locator('h1')).toContainText('Title');
await expect(page.locator('h1')).toHaveText('Exact Title');

// Attributes
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('value');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/admin/guests');
```

---

## Test Coverage Targets

| Code Type | Target | Current |
|-----------|--------|---------|
| Overall | 85%+ | 89% ✅ |
| Critical Paths | 95%+ | 95% ✅ |
| Services | 90%+ | 92% ✅ |
| API Routes | 85%+ | 87% ✅ |
| Components | 70%+ | 78% ✅ |
| Utilities | 95%+ | 96% ✅ |

---

## Test Execution Times

| Test Type | Target | Current |
|-----------|--------|---------|
| Unit Tests | < 30s | 25s ✅ |
| Integration Tests | < 2m | 1m 45s ✅ |
| E2E Tests | < 3m | 2m 30s ✅ |
| Full Suite | < 5m | 1m 36s ✅ |

---

## When to Use Each Test Type

### Unit Tests
- ✅ Service methods
- ✅ Utility functions
- ✅ Custom hooks
- ✅ Pure functions
- ❌ UI rendering (use component tests)
- ❌ API routes (use integration tests)

### Integration Tests
- ✅ API routes with real auth
- ✅ RLS policy validation
- ✅ Database operations
- ✅ External service integration
- ❌ UI interactions (use E2E tests)
- ❌ Business logic (use unit tests)

### E2E Tests
- ✅ Complete user workflows
- ✅ UI interactions
- ✅ Navigation and routing
- ✅ Form submissions
- ❌ Business logic (use unit tests)
- ❌ API contracts (use integration tests)

### Property-Based Tests
- ✅ Input validation
- ✅ Mathematical calculations
- ✅ Business rules
- ✅ Data transformations
- ❌ UI rendering
- ❌ External APIs

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Arbitrary timeouts
await page.waitForTimeout(1000);

// Fragile selectors
await page.click('.btn-primary.edit-btn');

// Shared state between tests
let userId: string; // Shared across tests

// No cleanup
// Missing afterEach cleanup

// Service role in tests
const supabase = createClient(url, SERVICE_ROLE_KEY);

// Skipped tests
it.skip('should work', () => {});
```

### ✅ Do This Instead
```typescript
// Proper waits
await page.waitForSelector('[data-testid="element"]');

// Semantic selectors
await page.click('button[aria-label="Edit guest"]');

// Test isolation
beforeEach(() => { userId = createTestUser(); });

// Proper cleanup
afterEach(async () => { await cleanupTestData(); });

// Real auth in tests
const { authToken } = await createTestUser();

// Fix or delete tests
it('should work', () => {}); // Fixed!
```

---

## Getting Help

### Resources
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Workshop Materials](docs/TESTING_WORKSHOP.md)
- [Q&A Guide](docs/TESTING_WORKSHOP_QA.md)
- [Exercises](docs/TESTING_WORKSHOP_EXERCISES.md)

### Support
- **Slack**: #testing
- **Email**: dev-team@example.com
- **Office Hours**: Fridays 2-3pm

### Useful Links
- [fast-check Docs](https://github.com/dubzzz/fast-check)
- [Playwright Docs](https://playwright.dev/)
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

