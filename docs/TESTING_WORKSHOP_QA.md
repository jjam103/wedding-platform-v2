# Testing Workshop - Q&A Guide

## Frequently Asked Questions

### Property-Based Testing

#### Q1: When should I use property-based testing vs example-based testing?

**A:** Use property-based testing when:
- Testing input validation and sanitization
- Testing mathematical calculations
- Testing business rule enforcement
- Testing data transformations
- Testing round-trip operations (serialize/deserialize)

Use example-based testing when:
- Testing specific edge cases you know about
- Testing UI rendering (too many valid outputs)
- Testing external API interactions
- Testing complex workflows with specific steps

**Example:**
```typescript
// ✅ Good for property-based testing
it('should sanitize all malicious input', () => {
  fc.assert(fc.property(maliciousInputArbitrary, (input) => {
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
  }));
});

// ✅ Good for example-based testing
it('should display error message for invalid email', () => {
  render(<GuestForm />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
  expect(screen.getByText('Invalid email format')).toBeInTheDocument();
});
```

---

#### Q2: How do I debug failing property tests?

**A:** fast-check automatically shrinks failing examples to the minimal case:

```typescript
// When a property fails, you'll see:
// Property failed after 23 runs with seed=1234567890
// Counterexample: { firstName: "<script>", lastName: "test" }
// Shrunk 15 times

// To reproduce the exact failure:
fc.assert(fc.property(...), { 
  seed: 1234567890,  // Use the seed from failure
  path: "23:0:0:0"   // Use the path from failure
});

// To see all generated values:
fc.assert(fc.property(...), { 
  verbose: true  // Logs all generated values
});
```

**Debugging Steps:**
1. Copy the seed and path from the failure message
2. Re-run with the seed to reproduce
3. Add `console.log` to see the failing input
4. Fix the code or adjust the property
5. Verify the fix with the same seed

---

#### Q3: How many iterations should I run for property tests?

**A:** It depends on the test:

```typescript
// Default: 100 runs (good for most cases)
fc.assert(fc.property(...));

// Fewer runs for expensive operations
fc.assert(fc.property(...), { numRuns: 20 });  // Database operations

// More runs for critical security
fc.assert(fc.property(...), { numRuns: 1000 }); // XSS prevention

// CI vs local
const numRuns = process.env.CI ? 100 : 20;
fc.assert(fc.property(...), { numRuns });
```

**Guidelines:**
- **20-50 runs**: Expensive operations (database, API calls)
- **100 runs**: Default for most tests
- **500-1000 runs**: Critical security or financial calculations
- **CI**: Use fewer runs to keep CI fast

---

#### Q4: Can I use property-based testing for async operations?

**A:** Yes! Use `fc.asyncProperty`:

```typescript
it('should handle async operations', async () => {
  await fc.assert(fc.asyncProperty(
    fc.string(),
    async (input) => {
      const result = await asyncOperation(input);
      expect(result).toBeDefined();
    }
  ), { numRuns: 50 }); // Fewer runs for async
});
```

**Tips for async property tests:**
- Use fewer iterations (20-50 instead of 100)
- Ensure proper cleanup in `afterEach`
- Use test database for database operations
- Mock external APIs to avoid rate limits

---

### Integration Testing

#### Q5: Why use real authentication instead of service role?

**A:** Service role bypasses RLS policies, so tests don't catch security bugs:

```typescript
// ❌ BAD: Service role bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('guests').select('*');
// This will succeed even if RLS policy is broken!

// ✅ GOOD: Real auth tests RLS
const { authToken } = await createTestUser();
const response = await fetch('/api/admin/guests', {
  headers: { 'Authorization': `Bearer ${authToken}` }
});
// This will fail if RLS policy is broken
```

**Real-world example:**
- Bug: Guest groups RLS policy was broken
- Service role tests: All passed ✅
- Real auth tests: Failed ❌
- Result: Real auth caught the bug!

---

#### Q6: How do I set up a test database?

**A:** We have a dedicated test database configured:

```bash
# 1. Environment variables are in .env.test
NEXT_PUBLIC_SUPABASE_URL=https://olcqaawrpnanioaorfer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>

# 2. Tests automatically use test database
# See __tests__/helpers/testDb.ts

# 3. Cleanup happens automatically
afterEach(async () => {
  await cleanupTestData();
});
```

**Benefits:**
- Isolated from production
- Can reset between test runs
- RLS policies enabled
- Safe to experiment

---

#### Q7: How do I handle test data cleanup?

**A:** Use our cleanup helpers:

```typescript
import { cleanupTestData } from '@/__tests__/helpers/cleanup';

describe('My Test Suite', () => {
  let userId: string;
  
  beforeAll(async () => {
    const testUser = await createTestUser();
    userId = testUser.userId;
  });
  
  afterAll(async () => {
    // Cleanup deletes user and all related data
    await cleanupTestData(userId);
  });
  
  afterEach(async () => {
    // Cleanup specific test data
    await supabase.from('guests').delete().eq('email', 'test@example.com');
  });
});
```

**Cleanup Strategy:**
- `afterAll`: Delete test user (cascades to all data)
- `afterEach`: Delete specific test data
- Use transactions for complex cleanup
- Verify cleanup in CI logs

---

#### Q8: Should integration tests run in CI?

**A:** Yes! Integration tests are fast and catch critical bugs:

```yaml
# .github/workflows/test.yml
- name: Run integration tests
  run: npm test -- __tests__/integration/
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SERVICE_ROLE_KEY }}
```

**Benefits:**
- Catch RLS bugs before deployment
- Catch API contract changes
- Catch authentication issues
- Fast execution (< 2 minutes)

**Tips:**
- Use dedicated test database
- Run in parallel with unit tests
- Cache dependencies
- Fail fast on errors

---

### E2E Testing

#### Q9: Should E2E tests run in CI?

**A:** Yes, but strategically:

```yaml
# Run critical path E2E on every commit
- name: Run critical E2E tests
  run: npm run test:e2e -- --grep "@critical"

# Run full E2E suite nightly
- name: Run full E2E suite
  if: github.event.schedule == '0 0 * * *'
  run: npm run test:e2e
```

**Strategy:**
- **Every commit**: Critical path tests (5-10 tests, ~2 min)
- **Before deployment**: Full E2E suite (~30 tests, ~5 min)
- **Nightly**: Extended E2E suite (~100 tests, ~15 min)

**Benefits:**
- Fast feedback on critical paths
- Comprehensive coverage before deployment
- Catch regressions overnight

---

#### Q10: How do I handle flaky E2E tests?

**A:** Follow this debugging process:

**1. Identify the root cause:**
```typescript
// ❌ Common causes of flakiness:
await page.waitForTimeout(1000);  // Arbitrary timeout
await page.click('.dynamic-class'); // Fragile selector
const text = page.locator('div').textContent(); // No wait
```

**2. Fix with proper waits:**
```typescript
// ✅ Proper waits:
await page.waitForSelector('[data-testid="element"]');
await expect(page.locator('text=Success')).toBeVisible();
await page.waitForLoadState('networkidle');
```

**3. Ensure test isolation:**
```typescript
// ✅ Clean up between tests:
test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await cleanupTestData();
});
```

**4. Use retry logic as last resort:**
```typescript
// playwright.config.ts
export default {
  retries: process.env.CI ? 2 : 0,  // Retry in CI only
};
```

---

#### Q11: What's the difference between integration and E2E tests?

**A:** Different tools and scope:

**Integration Tests:**
- Test API routes with real auth
- No browser required
- Fast execution (< 2 minutes)
- Test backend logic and RLS

```typescript
// Integration test
it('should create guest', async () => {
  const response = await fetch('/api/admin/guests', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify(guestData),
  });
  expect(response.status).toBe(201);
});
```

**E2E Tests:**
- Test complete user workflows
- Real browser (Playwright)
- Slower execution (< 5 minutes)
- Test UI, navigation, feedback

```typescript
// E2E test
test('should create guest', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.click('text=Add Guest');
  await page.fill('[name="firstName"]', 'John');
  await page.click('button:has-text("Save")');
  await expect(page.locator('.toast')).toContainText('Guest created');
});
```

**When to use each:**
- Integration: API logic, RLS, authentication
- E2E: User workflows, UI interactions, navigation

---

### Test Metrics

#### Q12: How do I view test metrics?

**A:** Use our metrics dashboard:

```bash
# Generate metrics report
npm run test:metrics

# View dashboard
open test-results/metrics/index.html
```

**Metrics Available:**
- Execution time (total and per-suite)
- Pass rate (percentage passing)
- Flaky tests (intermittent failures)
- Coverage (code coverage %)
- Bug detection (tests vs manual)

**Metrics Location:**
```
test-results/metrics/
├── index.html              # Dashboard
├── execution-times.json    # Test execution data
├── coverage-summary.json   # Coverage data
├── flaky-tests.json       # Flaky test tracking
└── bug-detection.json     # Bug detection rate
```

---

#### Q13: What's a good pass rate?

**A:** Target 99%+ pass rate:

**Current Status:**
- 97.2% pass rate (3,261 / 3,355 tests)
- 94 failing tests (2.8%)

**Goals:**
- **99%+**: Production-ready
- **95-99%**: Acceptable (fix failing tests)
- **< 95%**: Needs attention

**Action Items:**
- Fix failing tests immediately
- Don't skip tests (fix or delete)
- Address flaky tests
- Monitor pass rate in CI

---

#### Q14: How do I track flaky tests?

**A:** Our metrics system tracks flaky tests automatically:

```javascript
// jest-metrics-reporter.js tracks:
{
  testName: 'should create guest',
  failures: 3,
  totalRuns: 100,
  flakyRate: 0.03,  // 3% flaky
  lastFailure: '2024-01-15T10:30:00Z'
}
```

**Viewing Flaky Tests:**
```bash
# Generate report
npm run test:metrics

# View flaky tests
cat test-results/metrics/flaky-tests.json
```

**Addressing Flaky Tests:**
1. Identify root cause (timing, race conditions)
2. Fix with proper waits
3. Ensure test isolation
4. Verify fix with multiple runs
5. Monitor in metrics dashboard

---

### General Testing

#### Q15: How much test coverage is enough?

**A:** It depends on the code:

**Coverage Targets:**
- **Critical paths**: 95-100% (auth, payments, RLS)
- **Service layer**: 90%+
- **API routes**: 85%+
- **Components**: 70%+
- **Utilities**: 95%+
- **Overall**: 85%+

**Current Coverage:**
- Overall: 89% ✅
- Services: 92% ✅
- Components: 78% ✅

**Focus on:**
- Quality over quantity
- Test critical paths thoroughly
- Test error paths, not just happy paths
- Test edge cases

---

#### Q16: Should I write tests before or after code?

**A:** Both approaches work:

**Test-Driven Development (TDD):**
```typescript
// 1. Write failing test
it('should create guest', async () => {
  const result = await guestService.create(data);
  expect(result.success).toBe(true);
});

// 2. Implement code
export async function create(data) {
  // Implementation
}

// 3. Test passes
```

**Test-After Development:**
```typescript
// 1. Implement code
export async function create(data) {
  // Implementation
}

// 2. Write test
it('should create guest', async () => {
  const result = await guestService.create(data);
  expect(result.success).toBe(true);
});
```

**Recommendation:**
- Use TDD for complex logic
- Use test-after for simple features
- Always write tests (before or after)
- Write tests alongside bug fixes

---

#### Q17: How do I test error handling?

**A:** Test both success and error paths:

```typescript
describe('guestService.create', () => {
  // Success path
  it('should create guest with valid data', async () => {
    const result = await guestService.create(validData);
    expect(result.success).toBe(true);
  });
  
  // Validation error
  it('should return VALIDATION_ERROR for invalid data', async () => {
    const result = await guestService.create(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
  
  // Database error
  it('should return DATABASE_ERROR on database failure', async () => {
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'DB error' } })
    });
    
    const result = await guestService.create(validData);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('DATABASE_ERROR');
  });
  
  // Security
  it('should sanitize malicious input', async () => {
    const result = await guestService.create({
      ...validData,
      firstName: '<script>alert("xss")</script>'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.firstName).not.toContain('<script>');
  });
});
```

**Always test:**
- Success path
- Validation errors
- Database errors
- Security (XSS, SQL injection)
- Edge cases (null, undefined, empty)

---

## Additional Resources

### Documentation
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Test Metrics Dashboard](docs/TEST_METRICS_DASHBOARD.md)
- [Test Alerting System](docs/TEST_ALERTING_SYSTEM.md)
- [Workshop Materials](docs/TESTING_WORKSHOP.md)

### External Resources
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

### Getting Help
- **Slack**: #testing channel
- **Email**: dev-team@example.com
- **Office Hours**: Fridays 2-3pm
- **Code Reviews**: Tag @testing-team

---

## Feedback

Have more questions? Submit them to:
- Slack: #testing
- Feedback form: [Link]
- Office hours: Fridays 2-3pm

We'll update this Q&A guide based on your questions!

