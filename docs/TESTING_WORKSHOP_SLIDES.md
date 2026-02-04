# Testing Workshop - Presentation Slides

## Slide 1: Title
**Modern Testing Patterns for Wedding Platform**

- Property-Based Testing
- Integration Testing with Real Auth
- E2E Testing Best Practices
- Test Metrics & Monitoring

---

## Slide 2: The Problem

**Recent Production Bugs That Tests Didn't Catch:**

1. 🔒 **RLS Policy Errors** - "permission denied for table users"
2. 🍪 **Cookie Handling** - "cookies is not a function"
3. ⚡ **Async Params** - "params is a Promise"
4. 🎨 **UI State Bugs** - Form interactions broken
5. 💥 **Runtime Errors** - Build passes, runtime fails

**Impact**: Manual testing caught these, not automated tests

---

## Slide 3: Why Tests Missed These Bugs

**Root Causes:**

1. **Service Role Bypass** - Tests used service role, bypassing RLS
2. **Mocked APIs** - Tests mocked API routes, missing real behavior
3. **No E2E Coverage** - Critical user flows not tested
4. **No Regression Tests** - Fixed bugs could reoccur
5. **Build-Only Validation** - TypeScript passed, runtime failed

**Solution**: Comprehensive testing improvements

---

## Slide 4: Testing Improvements Overview

**6 Phases Completed:**

1. ✅ Foundation & Regression Tests
2. ✅ Real API Integration Tests
3. ✅ E2E Critical Path Tests
4. ✅ Dedicated Test Database
5. ✅ Next.js Compatibility Tests
6. ✅ Build Validation Tests

**Results**: 3,355 tests, 97.2% pass rate, 89% coverage

---

## Slide 5: Property-Based Testing

**Traditional Testing:**
```typescript
it('should calculate total', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60);
});
```

**Property-Based Testing:**
```typescript
it('should calculate total for any array', () => {
  fc.assert(fc.property(
    fc.array(fc.integer()),
    (numbers) => {
      const total = calculateTotal(numbers);
      const expected = numbers.reduce((sum, n) => sum + n, 0);
      expect(total).toBe(expected);
    }
  ));
});
```

**Benefits**: Tests 100+ random inputs, catches edge cases

---

## Slide 6: Property-Based Testing - Key Concepts

**1. Arbitraries** - Random data generators
```typescript
const guestArbitrary = fc.record({
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  ageType: fc.constantFrom('adult', 'child', 'senior'),
});
```

**2. Properties** - Universal truths
```typescript
// Property: Total is always sum of parts
expect(total).toBe(numbers.reduce((sum, n) => sum + n, 0));
```

**3. Shrinking** - Automatic minimization
```typescript
// Counterexample: { firstName: "<script>" }
// Shrunk 15 times from original failing input
```

---

## Slide 7: Property-Based Testing - Use Cases

**✅ Good For:**
- Input validation & sanitization
- Mathematical calculations
- Business rule enforcement
- Data transformations
- Round-trip operations

**❌ Not Ideal For:**
- UI rendering (too many valid outputs)
- External API calls (non-deterministic)
- Time-dependent operations
- Complex state machines

---

## Slide 8: Integration Testing - The Problem

**Old Pattern (Service Role):**
```typescript
// ❌ BAD: Bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('guests').select('*');
```

**New Pattern (Real Auth):**
```typescript
// ✅ GOOD: Tests RLS
const { authToken } = await createTestUser();
const response = await fetch('/api/admin/guests', {
  headers: { 'Authorization': `Bearer ${authToken}` }
});
```

**Key Difference**: Real auth tests security policies

---

## Slide 9: Integration Testing - Architecture

**Components:**

1. **Test Database** - Dedicated Supabase project
2. **Test Auth** - Real user accounts with roles
3. **Test Helpers** - Factories, cleanup, authentication
4. **Real API Routes** - Actual HTTP requests

**Benefits:**
- Catches RLS errors
- Tests cookie handling
- Validates session management
- Tests auth middleware

---

## Slide 10: Integration Testing - Example

```typescript
describe('Guest Groups API - RLS Integration', () => {
  let authToken: string;
  
  beforeAll(async () => {
    const testUser = await createTestUser();
    authToken = testUser.authToken;
  });
  
  it('should allow authenticated user to create group', async () => {
    const response = await fetch('/api/admin/guest-groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Group' }),
    });
    
    expect(response.status).toBe(201);
  });
  
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/admin/guest-groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Group' }),
    });
    
    expect(response.status).toBe(401);
  });
});
```

---

## Slide 11: E2E Testing - Why?

**What E2E Tests Catch:**
- ✅ Complete user workflows
- ✅ UI interactions & state changes
- ✅ Toast notifications & feedback
- ✅ Navigation & routing
- ✅ Form validation & submission
- ✅ Loading & error states

**What E2E Tests Don't Catch:**
- ❌ Business logic bugs (use unit tests)
- ❌ Database constraints (use integration tests)
- ❌ Performance issues (use performance tests)

---

## Slide 12: E2E Testing - Best Practices

**1. Use Proper Selectors:**
```typescript
// ✅ GOOD: Semantic
await page.click('button[aria-label="Edit guest"]');

// ❌ BAD: Fragile
await page.click('.btn-primary.edit-btn');
```

**2. Wait for Elements:**
```typescript
// ✅ GOOD: Explicit waits
await page.waitForSelector('[data-testid="guest-list"]');

// ❌ BAD: Arbitrary timeouts
await page.waitForTimeout(2000);
```

**3. Test User Perspective:**
```typescript
// ✅ GOOD: User-centric
test('should allow user to add guest', ...)

// ❌ BAD: Implementation-centric
test('should call createGuest API', ...)
```

---

## Slide 13: E2E Testing - Example

```typescript
test('should create, edit, and delete guest group', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Navigate to guest groups
  await page.goto('/admin/guest-groups');
  
  // Create group
  await page.click('text=Add Guest Group');
  await page.fill('[name="name"]', 'Test Group');
  await page.click('button:has-text("Save")');
  
  // Verify toast
  await expect(page.locator('.toast')).toContainText('Guest group created');
  
  // Verify in list
  await expect(page.locator('text=Test Group')).toBeVisible();
});
```

---

## Slide 14: Test Metrics Dashboard

**What We Track:**

1. **Execution Time** - Total and per-suite
2. **Pass Rate** - Percentage passing
3. **Flaky Tests** - Intermittent failures
4. **Coverage** - Code coverage %
5. **Bug Detection** - Tests vs manual

**Current Metrics:**
- 3,355 total tests
- 97.2% pass rate
- 96 seconds execution time
- 89% coverage

---

## Slide 15: Test Alerting System

**Automated Alerts:**

- 🔔 Slack notification on CI failures
- 📧 Email on flaky test detection
- 📊 Weekly test health report

**Benefits:**
- Immediate failure notification
- Track flaky tests over time
- Monitor test suite health
- Prevent test rot

---

## Slide 16: Current Test Health

**As of Today:**

✅ **Strengths:**
- 3,355 tests (comprehensive coverage)
- 97.2% pass rate (high reliability)
- 96 seconds execution (fast CI)
- 89% coverage (good baseline)

⚠️ **Areas for Improvement:**
- 94 failing tests (2.8%)
- Some component test mocks need fixes
- Coverage gaps in newer features

**Goals:** 99%+ pass rate, 90%+ coverage

---

## Slide 17: Testing Workflow

**For New Features:**

1. **Property Test** - Validate business rules
2. **Unit Test** - Test service methods
3. **Integration Test** - Test API with real auth
4. **E2E Test** - Test complete user workflow
5. **Regression Test** - Prevent known bugs

**For Bug Fixes:**

1. **Regression Test** - Reproduce bug
2. **Fix Code** - Implement fix
3. **Verify Test** - Ensure test passes
4. **Add to Suite** - Prevent recurrence

---

## Slide 18: Code Review Guidelines

**Require for All PRs:**

- ✅ Tests for new features
- ✅ Tests for bug fixes
- ✅ Proper test isolation
- ✅ Cleanup after tests
- ✅ Descriptive test names

**Review Checklist:**

- Does test actually test what it claims?
- Are there both success and error paths?
- Is test isolated (no shared state)?
- Is cleanup handled properly?
- Are waits proper (not arbitrary timeouts)?

---

## Slide 19: Common Pitfalls

**1. Flaky Tests:**
```typescript
// ❌ BAD
await page.waitForTimeout(1000);

// ✅ GOOD
await page.waitForSelector('[data-testid="element"]');
```

**2. Shared State:**
```typescript
// ❌ BAD
let userId: string; // Shared across tests

// ✅ GOOD
beforeEach(() => { userId = createTestUser(); });
```

**3. Missing Cleanup:**
```typescript
// ❌ BAD
// No cleanup

// ✅ GOOD
afterEach(async () => { await cleanupTestData(); });
```

---

## Slide 20: Key Takeaways

**1. Property-Based Testing**
- Tests universal properties, not examples
- Catches edge cases automatically
- Documents business rules

**2. Integration Testing**
- Use real auth, not service role
- Test actual API routes
- Validate RLS policies

**3. E2E Testing**
- Test complete workflows
- Use proper waits and selectors
- Test from user perspective

**4. Test Metrics**
- Track and monitor regularly
- Address flaky tests immediately
- Maintain high coverage

---

## Slide 21: Next Steps

**For the Team:**
1. Review workshop materials
2. Complete hands-on exercises
3. Apply patterns to current work
4. Ask questions in #testing
5. Contribute improvements

**For Code Reviews:**
1. Require tests for all PRs
2. Review test quality
3. Ensure proper patterns
4. Check cleanup and isolation
5. Verify tests work

---

## Slide 22: Resources

**Documentation:**
- Testing Standards (`.kiro/steering/testing-standards.md`)
- Test Metrics Dashboard
- Test Alerting System
- Workshop Materials

**Example Tests:**
- Property: `services/*.property.test.ts`
- Integration: `__tests__/integration/*.test.ts`
- E2E: `__tests__/e2e/*.spec.ts`
- Regression: `__tests__/regression/*.test.ts`

**Commands:**
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage
npm run test:e2e           # E2E tests only
npm run test:metrics       # Generate metrics
```

---

## Slide 23: Q&A

**Common Questions:**

1. When to use property-based vs example-based testing?
2. How to debug failing property tests?
3. Should E2E tests run in CI?
4. How to handle flaky tests?
5. What's the difference between integration and E2E?

**Office Hours:** Fridays 2-3pm

**Slack:** #testing

---

## Slide 24: Thank You!

**Remember:**

> Good tests catch bugs before users do! 🐛✅

**Feedback:** [Link to feedback form]

**Questions?** Ask in #testing or dev-team@example.com

