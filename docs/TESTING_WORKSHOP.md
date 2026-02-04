# Testing Workshop: Modern Testing Patterns for Wedding Platform

## Workshop Overview

**Duration**: 2 hours  
**Audience**: Development team  
**Prerequisites**: Basic Jest and React Testing Library knowledge  
**Goals**: 
- Understand new testing patterns implemented
- Learn property-based testing with fast-check
- Master integration testing with real authentication
- Write effective E2E tests with Playwright
- Understand test metrics and monitoring

---

## Part 1: Introduction (15 minutes)

### Why We Improved Our Testing

**The Problem**: Recent production bugs that tests didn't catch:
1. RLS policy errors (permission denied)
2. Cookie handling issues (Next.js 15 compatibility)
3. Async params bugs (dynamic routes)
4. UI state bugs (form interactions)
5. Runtime errors (build passes, runtime fails)

**The Solution**: Comprehensive testing improvements across 6 phases:
- Real API integration tests with authentication
- E2E tests for critical user flows
- Regression tests for known bugs
- Property-based testing for business rules
- Test metrics and monitoring

### Workshop Agenda

1. **Part 1**: Introduction and context (15 min)
2. **Part 2**: Property-based testing (30 min)
3. **Part 3**: Integration testing patterns (30 min)
4. **Part 4**: E2E testing best practices (30 min)
5. **Part 5**: Test metrics and monitoring (10 min)
6. **Part 6**: Q&A and hands-on exercises (15 min)

---

## Part 2: Property-Based Testing (30 minutes)

### What is Property-Based Testing?

**Traditional Testing** (Example-based):
```typescript
it('should calculate total correctly', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60);
});
```

**Property-Based Testing**:
```typescript
it('should calculate total correctly for any array', () => {
  fc.assert(fc.property(
    fc.array(fc.integer({ min: 0, max: 1000 })),
    (numbers) => {
      const total = calculateTotal(numbers);
      const expected = numbers.reduce((sum, n) => sum + n, 0);
      expect(total).toBe(expected);
    }
  ));
});
```

### Key Concepts

1. **Arbitraries**: Generators for random test data
2. **Properties**: Universal truths that should hold for all inputs
3. **Shrinking**: Automatic minimization of failing examples
4. **Iterations**: Run property multiple times (default: 100)


### Live Coding Example 1: Guest Validation Property

**Scenario**: Test that guest validation always sanitizes input

```typescript
// __tests__/property/guestValidation.property.test.ts
import fc from 'fast-check';
import { guestService } from '@/services/guestService';
import { maliciousInputArbitrary } from '@/__tests__/helpers/arbitraries';

describe('Property: Guest Input Sanitization', () => {
  it('should sanitize all malicious input patterns', () => {
    fc.assert(fc.property(
      maliciousInputArbitrary,
      async (maliciousInput) => {
        const result = await guestService.create({
          firstName: maliciousInput,
          lastName: 'Test',
          email: 'test@example.com',
          groupId: 'test-group-id',
          ageType: 'adult',
          guestType: 'wedding_guest',
        });
        
        if (result.success) {
          // Property: No script tags in sanitized output
          expect(result.data.firstName).not.toContain('<script>');
          expect(result.data.firstName).not.toContain('javascript:');
          expect(result.data.firstName).not.toContain('onerror=');
        }
      }
    ), { numRuns: 100 });
  });
});
```

**Key Takeaways**:
- Tests 100 different malicious inputs automatically
- Catches edge cases we wouldn't think of
- Documents security requirements as properties

### Live Coding Example 2: Budget Calculation Property

**Scenario**: Test that budget totals are always correct

```typescript
// services/budgetService.property.test.ts
import fc from 'fast-check';
import { budgetService } from '@/services/budgetService';

const vendorArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('photography', 'catering', 'music'),
  cost: fc.integer({ min: 0, max: 10000 }),
  paymentStatus: fc.constantFrom('unpaid', 'partial', 'paid'),
});

describe('Property: Budget Calculation', () => {
  it('should calculate total as sum of all vendor costs', () => {
    fc.assert(fc.property(
      fc.array(vendorArbitrary, { minLength: 1, maxLength: 20 }),
      (vendors) => {
        const result = budgetService.calculateTotal(vendors);
        const expected = vendors.reduce((sum, v) => sum + v.cost, 0);
        
        expect(result).toBe(expected);
      }
    ), { numRuns: 50 });
  });
  
  it('should never return negative totals', () => {
    fc.assert(fc.property(
      fc.array(vendorArbitrary),
      (vendors) => {
        const result = budgetService.calculateTotal(vendors);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    ));
  });
});
```

**Key Takeaways**:
- Custom arbitraries model your domain
- Multiple properties test different aspects
- Properties document business rules


### When to Use Property-Based Testing

**✅ Good Use Cases**:
- Input validation and sanitization
- Mathematical calculations
- Data transformations
- Business rule enforcement
- Round-trip operations (serialize/deserialize)

**❌ Not Ideal For**:
- UI rendering (too many valid outputs)
- External API calls (non-deterministic)
- Time-dependent operations
- Complex state machines

### Exercise 1: Write Your First Property Test

**Task**: Write a property test for slug generation

```typescript
// utils/slugs.property.test.ts
import fc from 'fast-check';
import { generateSlug } from '@/utils/slugs';

describe('Property: Slug Generation', () => {
  it('should generate URL-safe slugs for any input', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      (input) => {
        const slug = generateSlug(input);
        
        // TODO: Add property assertions
        // 1. Slug should only contain lowercase letters, numbers, and hyphens
        // 2. Slug should not start or end with hyphen
        // 3. Slug should not contain consecutive hyphens
      }
    ));
  });
});
```

**Solution** (reveal after 5 minutes):
```typescript
it('should generate URL-safe slugs for any input', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 1, maxLength: 100 }),
    (input) => {
      const slug = generateSlug(input);
      
      // Property 1: Only valid characters
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      
      // Property 2: No leading/trailing hyphens
      expect(slug).not.toMatch(/^-|-$/);
      
      // Property 3: No consecutive hyphens
      expect(slug).not.toMatch(/--/);
    }
  ));
});
```

---

## Part 3: Integration Testing Patterns (30 minutes)

### The Problem with Traditional Integration Tests

**Old Pattern** (Service role bypasses RLS):
```typescript
// ❌ BAD: Uses service role, doesn't test RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('guests').select('*');
expect(data).toBeDefined();
```

**New Pattern** (Real authentication):
```typescript
// ✅ GOOD: Uses real auth, tests RLS
const { authToken } = await createTestUser();
const response = await fetch('/api/admin/guests', {
  headers: { 'Authorization': `Bearer ${authToken}` }
});
expect(response.status).toBe(200);
```

### Integration Test Architecture

**Key Components**:
1. **Test Database**: Dedicated Supabase project for testing
2. **Test Auth**: Real user accounts with proper roles
3. **Test Helpers**: Factories, cleanup, authentication
4. **Real API Routes**: Actual HTTP requests, not mocked


### Live Coding Example 3: RLS Policy Integration Test

**Scenario**: Test that guest groups enforce RLS correctly

```typescript
// __tests__/integration/guestGroupsApi.integration.test.ts
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';
import { createTestGuestGroup } from '@/__tests__/helpers/factories';

describe('Guest Groups API - RLS Integration', () => {
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
  
  it('should allow authenticated user to create guest group', async () => {
    const response = await fetch('http://localhost:3000/api/admin/guest-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Group',
        description: 'Test Description',
      }),
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Group');
  });
  
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('http://localhost:3000/api/admin/guest-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Group' }),
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
  
  it('should only return groups owned by authenticated user', async () => {
    // Create group for this user
    await createTestGuestGroup({ userId });
    
    // Try to fetch all groups
    const response = await fetch('http://localhost:3000/api/admin/guest-groups', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    // Verify RLS: Should only see own groups
    data.data.forEach((group: any) => {
      expect(group.created_by).toBe(userId);
    });
  });
});
```

**Key Takeaways**:
- Real HTTP requests to actual API routes
- Real authentication with JWT tokens
- Tests RLS policies are enforced
- Cleanup after tests to avoid pollution

### Live Coding Example 4: Cookie Handling Test

**Scenario**: Test Next.js 15 cookie API compatibility

```typescript
// __tests__/integration/cookieHandling.integration.test.ts
describe('Cookie Handling - Next.js 15 Compatibility', () => {
  it('should handle cookies correctly in API routes', async () => {
    const response = await fetch('http://localhost:3000/api/admin/guests', {
      headers: {
        'Cookie': 'session=test-session-token',
      },
    });
    
    // Should not throw "cookies is not a function" error
    expect(response.status).not.toBe(500);
  });
  
  it('should use await cookies() pattern', async () => {
    // This test verifies the API route implementation
    // uses the correct Next.js 15 pattern
    const response = await fetch('http://localhost:3000/api/admin/test-cookies');
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.cookiesWorking).toBe(true);
  });
});
```


### Test Helpers and Utilities

**Test Authentication Helper**:
```typescript
// __tests__/helpers/testAuth.ts
import { createClient } from '@supabase/supabase-js';

export async function createTestUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const email = `test-${Date.now()}@example.com`;
  const password = 'test-password-123';
  
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) throw error;
  
  // Sign in to get session token
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return {
    userId: authData.user.id,
    email,
    authToken: sessionData.session!.access_token,
  };
}

export async function cleanupTestData(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Delete test user and cascade delete all related data
  await supabase.auth.admin.deleteUser(userId);
}
```

**Test Data Factories**:
```typescript
// __tests__/helpers/factories.ts
export function createTestGuest(overrides = {}) {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}@example.com`,
    groupId: 'test-group-id',
    ageType: 'adult' as const,
    guestType: 'wedding_guest' as const,
    ...overrides,
  };
}

export function createTestGuestGroup(overrides = {}) {
  return {
    name: `Test Group ${Date.now()}`,
    description: 'Test Description',
    ...overrides,
  };
}
```

### Exercise 2: Write an Integration Test

**Task**: Write an integration test for content pages API

```typescript
// __tests__/integration/contentPagesApi.integration.test.ts
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';

describe('Content Pages API - Integration', () => {
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
  
  it('should create content page with authentication', async () => {
    // TODO: Implement test
    // 1. Make POST request to /api/admin/content-pages
    // 2. Include auth token in headers
    // 3. Verify response status is 201
    // 4. Verify response includes created page data
  });
  
  it('should reject unauthenticated requests', async () => {
    // TODO: Implement test
  });
});
```

---

## Part 4: E2E Testing Best Practices (30 minutes)

### Why E2E Tests?

**What E2E Tests Catch**:
- Complete user workflows
- UI interactions and state changes
- Toast notifications and feedback
- Navigation and routing
- Form validation and submission
- Loading and error states

**What E2E Tests Don't Catch**:
- Business logic bugs (use unit tests)
- Database constraints (use integration tests)
- Performance issues (use performance tests)


### Live Coding Example 5: Guest Groups E2E Flow

**Scenario**: Test complete guest groups CRUD workflow

```typescript
// __tests__/e2e/guestGroupsFlow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guest Groups Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });
  
  test('should create, edit, and delete guest group', async ({ page }) => {
    // Navigate to guest groups
    await page.goto('/admin/guest-groups');
    
    // Create new group
    await page.click('text=Add Guest Group');
    await page.fill('[name="name"]', 'Test Group');
    await page.fill('[name="description"]', 'Test Description');
    await page.click('button:has-text("Save")');
    
    // Verify toast notification
    await expect(page.locator('.toast')).toContainText('Guest group created');
    
    // Verify in list
    await expect(page.locator('text=Test Group')).toBeVisible();
    
    // Edit group
    await page.click('button[aria-label="Edit Test Group"]');
    await page.fill('[name="name"]', 'Updated Group');
    await page.click('button:has-text("Save")');
    
    // Verify update
    await expect(page.locator('.toast')).toContainText('Guest group updated');
    await expect(page.locator('text=Updated Group')).toBeVisible();
    
    // Delete group
    await page.click('button[aria-label="Delete Updated Group"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify deletion
    await expect(page.locator('.toast')).toContainText('Guest group deleted');
    await expect(page.locator('text=Updated Group')).not.toBeVisible();
  });
  
  test('should show validation errors', async ({ page }) => {
    await page.goto('/admin/guest-groups');
    
    // Try to create without name
    await page.click('text=Add Guest Group');
    await page.click('button:has-text("Save")');
    
    // Verify validation error
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
  
  test('should handle loading states', async ({ page }) => {
    await page.goto('/admin/guest-groups');
    
    // Verify loading skeleton appears
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="guest-groups-table"]');
    
    // Verify loading skeleton disappears
    await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible();
  });
});
```

**Key Takeaways**:
- Test complete user workflows, not individual actions
- Use proper waits (waitForURL, waitForSelector)
- Test feedback mechanisms (toasts, errors)
- Test loading and error states
- Use descriptive test names

### E2E Testing Best Practices

**1. Use Proper Selectors**:
```typescript
// ✅ GOOD: Semantic selectors
await page.click('button[aria-label="Edit guest"]');
await page.fill('[name="email"]', 'test@example.com');
await page.click('text=Save');

// ❌ BAD: Fragile selectors
await page.click('.btn-primary.edit-btn');
await page.fill('#input-123');
```

**2. Wait for Elements**:
```typescript
// ✅ GOOD: Explicit waits
await page.waitForSelector('[data-testid="guest-list"]');
await expect(page.locator('text=Success')).toBeVisible();

// ❌ BAD: Arbitrary timeouts
await page.waitForTimeout(2000);
```

**3. Test User Perspective**:
```typescript
// ✅ GOOD: User-centric
test('should allow user to add guest to group', async ({ page }) => {
  // User navigates to page
  // User fills form
  // User sees success message
});

// ❌ BAD: Implementation-centric
test('should call createGuest API', async ({ page }) => {
  // Too focused on implementation
});
```


### Live Coding Example 6: Form Submission E2E Test

**Scenario**: Test form validation and submission

```typescript
// __tests__/e2e/formSubmissions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Submissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });
  
  test('should validate guest form fields', async ({ page }) => {
    await page.goto('/admin/guests');
    await page.click('text=Add Guest');
    
    // Submit empty form
    await page.click('button:has-text("Save")');
    
    // Verify validation errors
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Group is required')).toBeVisible();
    
    // Fill invalid email
    await page.fill('[name="email"]', 'invalid-email');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });
  
  test('should submit valid guest form', async ({ page }) => {
    await page.goto('/admin/guests');
    await page.click('text=Add Guest');
    
    // Fill valid data
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.selectOption('[name="groupId"]', { label: 'Test Group' });
    await page.selectOption('[name="ageType"]', 'adult');
    await page.selectOption('[name="guestType"]', 'wedding_guest');
    
    // Submit form
    await page.click('button:has-text("Save")');
    
    // Verify success
    await expect(page.locator('.toast')).toContainText('Guest created successfully');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
  
  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/admin/guests', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Database connection failed' }
        }),
      });
    });
    
    await page.goto('/admin/guests');
    await page.click('text=Add Guest');
    
    // Fill and submit form
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.click('button:has-text("Save")');
    
    // Verify error handling
    await expect(page.locator('.toast.error')).toContainText('Failed to create guest');
    await expect(page.locator('text=Database connection failed')).toBeVisible();
  });
});
```

### Exercise 3: Write an E2E Test

**Task**: Write an E2E test for section management

```typescript
// __tests__/e2e/sectionManagement.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Section Management', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Login
  });
  
  test('should add section to event', async ({ page }) => {
    // TODO: Implement test
    // 1. Navigate to event details
    // 2. Click "Manage Sections"
    // 3. Add new section
    // 4. Fill section content
    // 5. Save section
    // 6. Verify section appears in preview
  });
});
```

---

## Part 5: Test Metrics and Monitoring (10 minutes)

### Test Metrics Dashboard

**What We Track**:
1. **Execution Time**: Total and per-suite
2. **Pass Rate**: Percentage of passing tests
3. **Flaky Tests**: Tests that fail intermittently
4. **Coverage**: Code coverage percentage
5. **Bug Detection**: Bugs caught by tests vs manual

### Viewing Test Metrics

```bash
# Generate test metrics report
npm run test:metrics

# View metrics dashboard
open test-results/metrics/index.html
```

**Metrics Report Structure**:
```
test-results/metrics/
├── index.html              # Dashboard
├── execution-times.json    # Test execution data
├── coverage-summary.json   # Coverage data
├── flaky-tests.json       # Flaky test tracking
└── bug-detection.json     # Bug detection rate
```


### Test Alerting System

**Automated Alerts**:
- Slack notification on CI test failures
- Email on flaky test detection
- Weekly test health report

**Alert Configuration**:
```javascript
// scripts/send-test-failure-alert.mjs
export async function sendTestFailureAlert(testResults) {
  const failedTests = testResults.filter(t => !t.passed);
  
  if (failedTests.length > 0) {
    await sendSlackMessage({
      channel: '#test-alerts',
      text: `🚨 ${failedTests.length} tests failed in CI`,
      attachments: failedTests.map(t => ({
        title: t.name,
        text: t.error,
        color: 'danger',
      })),
    });
  }
}
```

### Current Test Health

**As of Today**:
- ✅ Total Tests: 3,355
- ✅ Pass Rate: 97.2% (3,261 passing)
- ⚠️ Failing: 94 tests (2.8%)
- ✅ Execution Time: 96 seconds
- ✅ Coverage: 89% overall

**Goals**:
- 🎯 Pass Rate: 99%+ (< 1% failures)
- 🎯 Execution Time: < 120 seconds
- 🎯 Coverage: 90%+ overall, 95%+ critical paths

---

## Part 6: Q&A and Hands-On Exercises (15 minutes)

### Common Questions

**Q: When should I use property-based testing vs example-based testing?**

A: Use property-based testing for:
- Input validation and sanitization
- Mathematical calculations
- Business rule enforcement
- Data transformations

Use example-based testing for:
- Specific edge cases
- UI rendering
- External API interactions
- Complex workflows

**Q: How do I debug failing property tests?**

A: fast-check automatically shrinks failing examples:
```typescript
// When a property fails, you'll see:
// Property failed after 23 runs with seed=1234567890
// Counterexample: { firstName: "<script>", lastName: "test" }
// Shrunk 15 times

// Re-run with the seed to reproduce:
fc.assert(fc.property(...), { seed: 1234567890 });
```

**Q: Should E2E tests run in CI?**

A: Yes, but strategically:
- Run critical path E2E tests on every commit
- Run full E2E suite nightly or before deployment
- Use parallel execution to keep CI fast
- Set up retry logic for flaky tests

**Q: How do I handle flaky tests?**

A: 
1. Identify root cause (timing, race conditions, external dependencies)
2. Add proper waits (waitForSelector, not waitForTimeout)
3. Ensure test isolation (cleanup between tests)
4. Use retry logic as last resort
5. Track flaky tests in metrics dashboard

**Q: What's the difference between integration and E2E tests?**

A:
- **Integration**: Test API routes with real auth, no browser
- **E2E**: Test complete user workflows with real browser
- Integration tests are faster, E2E tests are more comprehensive

### Hands-On Exercise: Complete Testing Workflow

**Scenario**: Add a new feature with complete test coverage

**Feature**: Guest dietary restrictions

**Step 1**: Write property-based test for validation
```typescript
// services/guestService.dietaryRestrictions.property.test.ts
it('should sanitize dietary restriction input', () => {
  fc.assert(fc.property(
    maliciousInputArbitrary,
    async (input) => {
      const result = await guestService.update(guestId, {
        dietaryRestrictions: input,
      });
      
      if (result.success) {
        expect(result.data.dietaryRestrictions).not.toContain('<script>');
      }
    }
  ));
});
```

**Step 2**: Write integration test for API
```typescript
// __tests__/integration/guestsApi.integration.test.ts
it('should update guest dietary restrictions', async () => {
  const response = await fetch(`/api/admin/guests/${guestId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dietaryRestrictions: 'Vegetarian, no nuts',
    }),
  });
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.data.dietaryRestrictions).toBe('Vegetarian, no nuts');
});
```

**Step 3**: Write E2E test for UI
```typescript
// __tests__/e2e/guestDietaryRestrictions.spec.ts
test('should add dietary restrictions to guest', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.click('button[aria-label="Edit John Doe"]');
  
  await page.fill('[name="dietaryRestrictions"]', 'Vegetarian, no nuts');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.toast')).toContainText('Guest updated');
  await expect(page.locator('text=Vegetarian, no nuts')).toBeVisible();
});
```


---

## Workshop Resources

### Documentation
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Test Metrics Dashboard](docs/TEST_METRICS_DASHBOARD.md)
- [Test Alerting System](docs/TEST_ALERTING_SYSTEM.md)
- [Parallel Test Execution](docs/PARALLEL_TEST_EXECUTION.md)
- [Selective Test Running](docs/SELECTIVE_TEST_RUNNING.md)

### Example Tests
- Property-based: `services/*.property.test.ts`
- Integration: `__tests__/integration/*.integration.test.ts`
- E2E: `__tests__/e2e/*.spec.ts`
- Regression: `__tests__/regression/*.regression.test.ts`

### Test Helpers
- Factories: `__tests__/helpers/factories.ts`
- Arbitraries: `__tests__/helpers/arbitraries.ts`
- Test Auth: `__tests__/helpers/testAuth.ts`
- Test DB: `__tests__/helpers/testDb.ts`
- Cleanup: `__tests__/helpers/cleanup.ts`

### Commands
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/integration/

# Run with coverage
npm test -- --coverage

# Run only changed tests
npm test -- --onlyChanged

# Run E2E tests
npm run test:e2e

# Generate test metrics
npm run test:metrics

# Run property-based tests
npm test -- --testNamePattern="Property:"
```

---

## Key Takeaways

### 1. Property-Based Testing
- ✅ Tests universal properties, not specific examples
- ✅ Catches edge cases automatically
- ✅ Documents business rules as code
- ✅ Use for validation, calculations, transformations

### 2. Integration Testing
- ✅ Use real authentication, not service role
- ✅ Test actual API routes with HTTP requests
- ✅ Validate RLS policies are enforced
- ✅ Clean up test data after each test

### 3. E2E Testing
- ✅ Test complete user workflows
- ✅ Use proper waits and selectors
- ✅ Test feedback mechanisms (toasts, errors)
- ✅ Test from user perspective, not implementation

### 4. Test Metrics
- ✅ Track execution time, pass rate, coverage
- ✅ Monitor flaky tests
- ✅ Set up automated alerting
- ✅ Review metrics regularly

### 5. Best Practices
- ✅ Write tests alongside code (TDD/BDD)
- ✅ Test both success and error paths
- ✅ Use descriptive test names
- ✅ Keep tests independent and isolated
- ✅ Clean up after tests

---

## Next Steps

### For the Team
1. Review workshop materials
2. Complete hands-on exercises
3. Apply patterns to current work
4. Ask questions in #testing channel
5. Contribute to test suite improvements

### For Code Reviews
1. Require tests for all PRs
2. Review test quality, not just coverage
3. Ensure tests follow patterns from workshop
4. Check for proper cleanup and isolation
5. Verify tests actually test what they claim

### For Continuous Improvement
1. Monitor test metrics dashboard weekly
2. Address flaky tests immediately
3. Refactor slow tests
4. Update testing documentation
5. Share learnings with team

---

## Workshop Feedback

Please provide feedback on:
1. What was most valuable?
2. What needs more explanation?
3. What examples would be helpful?
4. What should we cover in future workshops?

**Feedback Form**: [Link to feedback form]

---

## Thank You!

Questions? Reach out:
- Slack: #testing
- Email: dev-team@example.com
- Office Hours: Fridays 2-3pm

**Remember**: Good tests catch bugs before users do! 🐛✅

