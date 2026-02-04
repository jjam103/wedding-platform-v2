# Testing Improvements - Design

## Architecture Overview

### Testing Pyramid
```
        E2E Tests (5%)
       /              \
  Integration (25%)    
 /                    \
Unit Tests (70%)
```

### Test Categories
1. **Unit Tests** - Services, utilities, hooks (fast, isolated)
2. **Integration Tests** - API routes with real auth (medium speed)
3. **E2E Tests** - Critical user flows (slower, comprehensive)
4. **Regression Tests** - Known bug prevention (mixed)
5. **Build Tests** - Production build validation (one-time)

## Component Design

### 1. Real API Integration Tests

**Purpose**: Test API routes with real authentication and RLS policies

**Pattern**:
```typescript
// __tests__/integration/realApi.integration.test.ts
describe('Real API Integration Tests', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Create test user with real auth
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123'
    });
    authToken = data.session.access_token;
  });
  
  it('should enforce RLS on guest groups', async () => {
    // Make real HTTP request to API route
    const response = await fetch('http://localhost:3000/api/admin/guest-groups', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    // Verify RLS is enforced
    expect(response.status).toBe(200);
  });
});
```

**Key Features**:
- Uses real Supabase auth (not service role)
- Makes actual HTTP requests to API routes
- Validates RLS policies are enforced
- Tests cookie handling and session management

### 2. E2E Critical Path Tests

**Purpose**: Test complete user workflows with real browser

**Pattern**:
```typescript
// __tests__/e2e/guestGroupsFlow.spec.ts
test.describe('Guest Groups Flow', () => {
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
    
    // Verify toast notification
    await expect(page.locator('.toast')).toContainText('Guest group created');
    
    // Verify in list
    await expect(page.locator('text=Test Group')).toBeVisible();
  });
});
```

**Key Features**:
- Real browser automation with Playwright
- Tests complete user workflows
- Validates UI feedback (toasts, loading states)
- Checks error handling

### 3. Regression Tests

**Purpose**: Prevent known bugs from reoccurring

**Pattern**:
```typescript
// __tests__/regression/rlsPolicies.regression.test.ts
describe('RLS Policy Regression Tests', () => {
  it('should prevent sections table permission denied error', async () => {
    // Reproduce the exact bug scenario
    const result = await sectionsService.create({
      entityType: 'event',
      entityId: 'test-id',
      content: 'Test content'
    });
    
    // Verify bug is fixed
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
  
  it('should prevent content pages RLS violation', async () => {
    const result = await contentPagesService.create({
      title: 'Test Page',
      slug: 'test-page',
      type: 'custom'
    });
    
    expect(result.success).toBe(true);
  });
});
```

**Key Features**:
- Tests exact bug scenarios
- Documents what was broken
- Prevents regression
- Fast execution

### 4. Build Validation Tests

**Purpose**: Catch runtime errors that TypeScript misses

**Pattern**:
```typescript
// __tests__/build/productionBuild.test.ts
describe('Production Build Validation', () => {
  it('should build without errors', async () => {
    const { stdout, stderr, exitCode } = await execAsync('npm run build');
    
    expect(exitCode).toBe(0);
    expect(stderr).not.toContain('Error:');
    expect(stdout).toContain('Compiled successfully');
  });
  
  it('should not have missing dependencies', async () => {
    const { stdout } = await execAsync('npm run build');
    
    expect(stdout).not.toContain('Module not found');
    expect(stdout).not.toContain('Cannot find module');
  });
});
```

**Key Features**:
- Validates production build
- Checks for runtime errors
- Verifies all routes compile
- Runs before deployment

## Data Flow

### Test Data Management

**Factory Pattern**:
```typescript
// __tests__/helpers/factories.ts
export const createTestGuest = (overrides = {}) => ({
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  groupId: 'test-group-id',
  ageType: 'adult',
  guestType: 'wedding_guest',
  ...overrides
});
```

**Cleanup Strategy**:
```typescript
afterEach(async () => {
  // Clean up test data
  await supabase.from('guests').delete().eq('email', 'test@example.com');
  await supabase.from('guest_groups').delete().eq('name', 'Test Group');
});
```

## Error Handling

### Test Failure Reporting
- Clear error messages indicating what failed
- Screenshots for E2E test failures
- Logs for integration test failures
- Stack traces for unit test failures

### Retry Logic
- E2E tests: 2 retries on failure
- Integration tests: 1 retry on network errors
- Unit tests: No retries (should be deterministic)

## Security Considerations

### Test Authentication
- Use dedicated test user accounts
- Rotate test credentials regularly
- Never use production credentials
- Clean up test users after runs

### Test Data Isolation
- Use separate test database
- Prefix test data with 'test-'
- Clean up after each test
- No PII in test data

## Performance Optimization

### Parallel Execution
```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Use half of CPU cores
  testTimeout: 30000, // 30 second timeout
};
```

### Selective Test Running
```bash
# Run only changed tests
npm test -- --onlyChanged

# Run specific test suite
npm test -- __tests__/integration/

# Run with coverage
npm test -- --coverage
```

### Caching
- Cache node_modules in CI
- Cache Playwright browsers
- Cache build artifacts
- Cache test database snapshots

## Monitoring & Metrics

### Test Metrics to Track
1. **Execution Time**: Total and per-suite
2. **Pass Rate**: Percentage of passing tests
3. **Flaky Tests**: Tests that fail intermittently
4. **Coverage**: Code coverage percentage
5. **Bug Detection**: Bugs caught by tests vs manual

### Alerting
- Slack notification on CI test failures
- Email on flaky test detection
- Dashboard for test metrics
- Weekly test health report

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up real API integration test framework
- Create test data factories
- Implement cleanup utilities
- Add regression tests for known bugs

### Phase 2: Critical Paths (Week 2)
- E2E tests for guest groups flow
- E2E tests for section management flow
- E2E tests for form submissions
- Integration tests for RLS policies

### Phase 3: Coverage (Week 3)
- Increase unit test coverage to 85%
- Add integration tests for all API routes
- Add E2E tests for remaining critical flows
- Build validation tests

### Phase 4: Optimization (Week 4)
- Optimize test execution speed
- Implement parallel execution
- Add selective test running
- Set up monitoring and alerting

## Testing Tools & Libraries

### Core Testing Stack
- **Jest 29**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **fast-check**: Property-based testing

### Test Utilities
- **@testing-library/jest-dom**: DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **msw**: API mocking for external services
- **@supabase/supabase-js**: Real database testing

### CI/CD Integration
- **GitHub Actions**: Automated test runs
- **Codecov**: Coverage reporting
- **Playwright Test Reporter**: E2E test results

## Correctness Properties

### Property 1: Test Isolation
**Description**: Tests must not affect each other
**Validation**: Each test can run independently in any order
**Test Strategy**: Run tests in random order, verify all pass

### Property 2: RLS Enforcement
**Description**: All database operations must respect RLS policies
**Validation**: Tests with real auth verify RLS is enforced
**Test Strategy**: Integration tests with different user roles

### Property 3: API Contract Compliance
**Description**: API responses must match defined contracts
**Validation**: All API routes return expected response shapes
**Test Strategy**: Contract tests for all endpoints

### Property 4: Error Handling Consistency
**Description**: All errors must follow Result<T> pattern
**Validation**: No thrown errors, all errors in Result type
**Test Strategy**: Unit tests verify error handling

### Property 5: Build Reproducibility
**Description**: Production builds must be deterministic
**Validation**: Multiple builds produce identical output
**Test Strategy**: Build validation tests

## Success Criteria

### Quantitative Metrics
- ✅ 85%+ overall test coverage
- ✅ 95%+ coverage for critical paths (auth, RLS, payments)
- ✅ <5 minute full test suite execution
- ✅ <1% flaky test rate
- ✅ 90%+ bug detection rate

### Qualitative Metrics
- ✅ Tests catch RLS bugs before manual testing
- ✅ Tests catch Next.js compatibility issues
- ✅ Tests catch UI/UX bugs
- ✅ Developers trust the test suite
- ✅ Manual testing time reduced by 50%

## Rollout Plan

### Week 1: Foundation
1. Create test data factories
2. Set up real API integration tests
3. Add regression tests for known bugs
4. Document testing patterns

### Week 2: Critical Paths
1. E2E tests for guest groups
2. E2E tests for sections
3. Integration tests for RLS
4. Update CI/CD pipeline

### Week 3: Coverage
1. Increase unit test coverage
2. Add integration tests for all APIs
3. Add E2E tests for forms
4. Build validation tests

### Week 4: Optimization
1. Optimize test speed
2. Implement parallel execution
3. Set up monitoring
4. Train team on new patterns

## Maintenance Plan

### Daily
- Monitor CI test results
- Fix failing tests immediately
- Review flaky test reports

### Weekly
- Review test coverage reports
- Update test documentation
- Refactor slow tests

### Monthly
- Audit test suite health
- Update testing patterns
- Review and remove obsolete tests

## References
- Testing Standards (`.kiro/steering/testing-standards.md`)
- TESTING_IMPROVEMENTS_ACTION_PLAN.md
- WHY_TESTS_MISSED_BUGS.md
- Jest Documentation: https://jestjs.io/
- Playwright Documentation: https://playwright.dev/
