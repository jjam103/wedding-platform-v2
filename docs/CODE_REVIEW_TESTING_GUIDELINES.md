# Code Review Guidelines - Testing Requirements

## Overview

This document defines mandatory testing requirements for all pull requests. These guidelines ensure code quality, prevent regressions, and maintain high test coverage across the codebase.

## Core Principles

1. **No Code Without Tests** - All new code must include corresponding tests
2. **Test Quality Matters** - Tests must be meaningful, not just coverage metrics
3. **Security First** - All security-critical code requires comprehensive testing
4. **Regression Prevention** - Bug fixes must include regression tests

## Mandatory Testing Requirements

### 1. Service Layer Changes

**Requirement**: ALL service methods must have 4 test paths

✅ **Required Tests**:
- Success path with valid input
- Validation error with invalid input
- Database error handling
- Security/sanitization testing

❌ **PR will be rejected if**:
- Missing any of the 4 test paths
- Tests use `any` type
- Tests don't verify Result<T> pattern
- Missing XSS/SQL injection tests

**Example**:
```typescript
// ✅ GOOD - All 4 paths tested
describe('guestService.create', () => {
  it('should return success with valid input', async () => { /* ... */ });
  it('should return VALIDATION_ERROR with invalid input', async () => { /* ... */ });
  it('should return DATABASE_ERROR on DB failure', async () => { /* ... */ });
  it('should sanitize input to prevent XSS', async () => { /* ... */ });
});

// ❌ BAD - Only success path tested
describe('guestService.create', () => {
  it('should create guest', async () => { /* ... */ });
});
```

### 2. API Route Changes

**Requirement**: ALL API routes must test authentication, validation, and error handling

✅ **Required Tests**:
- Authenticated request succeeds (200/201)
- Unauthenticated request fails (401)
- Invalid input fails (400)
- Database errors handled (500)
- Proper HTTP status codes

❌ **PR will be rejected if**:
- Missing authentication tests
- Missing validation tests
- Missing error handling tests
- Tests don't use real Request/Response objects

**Example**:
```typescript
// ✅ GOOD - All scenarios tested
describe('POST /api/admin/guests', () => {
  it('should create guest when authenticated', async () => { /* ... */ });
  it('should return 401 when not authenticated', async () => { /* ... */ });
  it('should return 400 with invalid data', async () => { /* ... */ });
  it('should return 500 on database error', async () => { /* ... */ });
});
```

### 3. Component Changes

**Requirement**: Components must test rendering, interactions, and error states

✅ **Required Tests**:
- Component renders correctly
- User interactions work (clicks, inputs)
- Props are handled correctly
- Error states display properly
- Loading states display properly

❌ **PR will be rejected if**:
- Only snapshot tests (no behavior tests)
- Missing interaction tests
- Missing error state tests
- Tests use implementation details (not user-centric)

**Example**:
```typescript
// ✅ GOOD - User-centric tests
describe('GuestCard', () => {
  it('should display guest name', () => { /* ... */ });
  it('should call onEdit when edit button clicked', () => { /* ... */ });
  it('should show error message when data invalid', () => { /* ... */ });
});

// ❌ BAD - Implementation details
describe('GuestCard', () => {
  it('should have correct className', () => { /* ... */ });
  it('should call useState', () => { /* ... */ });
});
```

### 4. Bug Fixes

**Requirement**: ALL bug fixes must include regression tests

✅ **Required**:
- Regression test that reproduces the bug
- Test verifies bug is fixed
- Test documents what was broken
- Test prevents future regression

❌ **PR will be rejected if**:
- No regression test included
- Test doesn't reproduce original bug
- Test is too generic

**Example**:
```typescript
// ✅ GOOD - Specific regression test
describe('Regression: Guest Groups RLS Bug', () => {
  it('should not throw "permission denied for table users" error', async () => {
    // Reproduce exact bug scenario
    const result = await guestGroupService.create({ name: 'Test' });
    
    // Verify bug is fixed
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
```

### 5. Database Schema Changes

**Requirement**: Schema changes must include RLS policy tests

✅ **Required Tests**:
- Admin can create/read/update/delete
- Guest can read (if applicable)
- Guest cannot create/update/delete
- RLS policies enforce access control
- No "permission denied" errors

❌ **PR will be rejected if**:
- Missing RLS tests
- Tests use service role (bypasses RLS)
- Tests don't verify unauthorized access blocked

### 6. Security-Critical Changes

**Requirement**: Security changes require comprehensive testing

✅ **Required Tests**:
- XSS prevention tests
- SQL injection prevention tests
- Authentication tests
- Authorization tests
- Input sanitization tests

❌ **PR will be rejected if**:
- Missing security tests
- Tests don't cover attack vectors
- Tests use mocked security functions

## Coverage Requirements

### Minimum Coverage Thresholds

| Code Type | Minimum Coverage | Target Coverage |
|-----------|-----------------|-----------------|
| Services | 90% | 95% |
| API Routes | 85% | 90% |
| Components | 70% | 80% |
| Utilities | 95% | 100% |
| Overall | 80% | 85% |

### Coverage Enforcement

✅ **PR can merge if**:
- Coverage meets minimum thresholds
- No decrease in overall coverage
- New code has 100% coverage

❌ **PR will be rejected if**:
- Coverage below minimum thresholds
- Coverage decreased from main branch
- New code has <80% coverage

**Check coverage**:
```bash
npm run test:coverage
```

## Test Quality Standards

### 1. Test Naming

✅ **Good naming**:
```typescript
it('should return VALIDATION_ERROR when email is invalid', () => { /* ... */ });
it('should sanitize HTML tags to prevent XSS attacks', () => { /* ... */ });
it('should display error toast when save fails', () => { /* ... */ });
```

❌ **Bad naming**:
```typescript
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
it('should do something', () => { /* ... */ });
```

### 2. Test Independence

✅ **Good - Self-contained**:
```typescript
it('should update guest', async () => {
  // Create test data
  const guest = await createTestGuest();
  
  // Test update
  const result = await guestService.update(guest.id, { firstName: 'Updated' });
  
  // Verify
  expect(result.success).toBe(true);
  
  // Cleanup
  await deleteTestGuest(guest.id);
});
```

❌ **Bad - Depends on previous test**:
```typescript
let guestId: string;

it('should create guest', async () => {
  const result = await guestService.create(data);
  guestId = result.data.id; // ❌ Shared state
});

it('should update guest', async () => {
  await guestService.update(guestId, data); // ❌ Depends on previous test
});
```

### 3. Meaningful Assertions

✅ **Good - Specific assertions**:
```typescript
expect(result.success).toBe(true);
expect(result.data.firstName).toBe('John');
expect(result.data.email).toBe('john@example.com');
```

❌ **Bad - Vague assertions**:
```typescript
expect(result).toBeTruthy(); // ❌ Too vague
expect(result.data).toBeDefined(); // ❌ Doesn't verify content
```

### 4. Proper Mocking

✅ **Good - Mock external dependencies**:
```typescript
jest.mock('@/services/emailService', () => ({
  send: jest.fn().mockResolvedValue({ success: true })
}));
```

❌ **Bad - Mock internal logic**:
```typescript
jest.mock('@/services/guestService'); // ❌ Don't mock what you're testing
```

## Code Review Checklist

### For Authors

Before submitting PR:
- [ ] All new code has corresponding tests
- [ ] Tests follow 4-path pattern for services
- [ ] Tests use real auth (not service role)
- [ ] Tests are independent (no shared state)
- [ ] Coverage meets minimum thresholds
- [ ] All tests pass locally
- [ ] No console.log statements
- [ ] No commented-out code

### For Reviewers

When reviewing PR:
- [ ] Tests exist for all new code
- [ ] Tests are meaningful (not just coverage)
- [ ] Tests follow project patterns
- [ ] Tests are well-named
- [ ] Tests are independent
- [ ] Security tests included (if applicable)
- [ ] Regression tests included (if bug fix)
- [ ] Coverage thresholds met
- [ ] No flaky tests introduced

## Common Review Feedback

### "Add tests for error paths"
**Problem**: Only success path tested
**Solution**: Add tests for validation errors, database errors, edge cases

### "Use real auth, not service role"
**Problem**: Tests bypass RLS policies
**Solution**: Use `createTestSupabaseClient()` with real user auth

### "Tests are too coupled"
**Problem**: Tests depend on each other
**Solution**: Make each test self-contained with setup/teardown

### "Missing security tests"
**Problem**: No XSS/SQL injection tests
**Solution**: Add tests with malicious input payloads

### "Tests use implementation details"
**Problem**: Tests check internal state instead of behavior
**Solution**: Test user-facing behavior and outputs

## Automated Checks

### Pre-commit Hooks
```bash
# Runs automatically before commit
npm run lint
npm run test:types
npm run test:unit
```

### CI/CD Pipeline
```bash
# Runs on every PR
npm run test:all
npm run test:coverage
npm run build
```

### Coverage Reports
- Codecov comments on PRs with coverage changes
- Coverage must not decrease
- New code must have 100% coverage

## Exceptions

### When tests can be skipped
1. **Documentation-only changes** - README, comments, docs
2. **Configuration changes** - package.json, tsconfig.json (unless logic added)
3. **Trivial changes** - Typo fixes, formatting

### When lower coverage is acceptable
1. **Legacy code refactoring** - Can temporarily lower coverage if improving code quality
2. **Experimental features** - Can have lower coverage if marked as experimental
3. **UI polish** - Minor styling changes may not need full coverage

**Note**: Exceptions require explicit approval from tech lead

## Resources

### Testing Documentation
- [Testing Standards](../.kiro/steering/testing-standards.md)
- [Testing Workshop](./TESTING_WORKSHOP.md)
- [Testing Quick Reference](./TESTING_QUICK_REFERENCE.md)
- [Testing Pattern Guide](./TESTING_PATTERN_A_GUIDE.md)

### Testing Tools
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [fast-check Documentation](https://fast-check.dev/)

### Example Tests
- Service tests: `services/guestService.test.ts`
- API tests: `__tests__/integration/guestsApi.integration.test.ts`
- Component tests: `components/admin/GuestCard.test.tsx`
- E2E tests: `__tests__/e2e/guestGroupsFlow.spec.ts`

## Questions?

If you have questions about testing requirements:
1. Check the [Testing Workshop](./TESTING_WORKSHOP.md)
2. Review example tests in the codebase
3. Ask in #engineering Slack channel
4. Schedule pairing session with tech lead

## Summary

**Remember**:
- ✅ All code needs tests
- ✅ Tests must be meaningful
- ✅ Security is critical
- ✅ Coverage thresholds are enforced
- ✅ Bug fixes need regression tests

**Goal**: Catch bugs before manual testing, maintain high code quality, prevent regressions.
