---
inclusion: always
---

# Testing Quality Gates

**CRITICAL: These quality gates must pass before merging code.**

## Pre-Commit Quality Gates

### 1. Build Verification
```bash
npm run build  # Must succeed
```
**Why**: Catches TypeScript errors, Next.js compatibility issues

### 2. Type Checking
```bash
npm run type-check  # Must pass
```
**Why**: Catches type errors before runtime

### 3. Unit Tests
```bash
npm run test:quick  # Must pass
```
**Why**: Validates business logic

## Pre-Merge Quality Gates (CI/CD)

### 1. Full Build
```bash
npm run build  # Must succeed
```

### 2. All Tests
```bash
npm test  # Must pass (includes build)
```

### 3. Integration Tests
```bash
npm run test:integration  # Must pass
```
**Why**: Validates API routes, RLS policies, database operations

### 4. E2E Tests
```bash
npm run test:e2e  # Must pass
```
**Why**: Validates critical user workflows

### 5. Coverage Thresholds
```
Overall: 80%+
Services: 90%+
Critical paths: 100%
```

## Pre-Deployment Quality Gates

### 1. Production Build
```bash
npm run build
npm start  # Must start without errors
```

### 2. Smoke Tests
```bash
npm run test:smoke  # All routes respond
```

### 3. Manual Testing Checklist
- [ ] Login works
- [ ] Critical workflows work
- [ ] No console errors
- [ ] No runtime errors
- [ ] UI updates correctly

## Quality Gate Failures

### If Build Fails
- ❌ Do not commit
- Fix TypeScript errors
- Fix Next.js compatibility issues
- Re-run build

### If Tests Fail
- ❌ Do not commit
- Fix failing tests
- Add missing tests
- Verify test quality

### If Coverage Drops
- ❌ Do not merge
- Add tests for new code
- Verify critical paths covered
- Update coverage thresholds if justified

### If E2E Tests Fail
- ❌ Do not merge
- Fix user workflow issues
- Verify UI updates correctly
- Test manually

## Bypassing Quality Gates

### When Allowed
- Documentation-only changes
- Test-only changes (with review)
- Emergency hotfixes (with follow-up)

### When NOT Allowed
- Feature changes
- Bug fixes
- Refactoring
- Dependency updates

## Monitoring Quality Gates

### Metrics to Track
- Build success rate
- Test pass rate
- Coverage trends
- E2E test reliability
- Time to detect issues

### Red Flags
- Build failures increasing
- Test pass rate decreasing
- Coverage dropping
- E2E tests flaky
- Manual testing finding bugs

## Enforcement

### Pre-commit Hooks
```bash
# .husky/pre-commit
npm run build
npm run type-check
npm run test:quick
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
- Build
- Type check
- Unit tests
- Integration tests
- E2E tests
- Coverage check
```

### Code Review
- Reviewer verifies tests added
- Reviewer checks test quality
- Reviewer validates coverage
- Reviewer approves or requests changes

## The Reality Check

**Remember**: High test coverage doesn't guarantee quality. Recent production bugs revealed that 91.2% test coverage missed critical issues because tests focused on isolated units rather than integrated workflows.

**Focus on**:
- Testing user experience, not just code
- Testing complete workflows, not just isolated units
- Testing with real runtime (Next.js, database, auth)
- Testing state updates and reactivity
- Testing integration between layers

## Success Criteria

### Good Test Suite
- ✅ Tests catch bugs before manual testing
- ✅ Tests validate user experience
- ✅ Tests run fast (<5 minutes)
- ✅ Tests are reliable (not flaky)
- ✅ Tests are maintainable

### Bad Test Suite
- ❌ High coverage but bugs slip through
- ❌ Tests only check isolated units
- ❌ Tests mock everything
- ❌ Tests are slow or flaky
- ❌ Manual testing finds bugs

## Quick Reference

**Before committing**:
1. Build passes
2. Types check
3. Unit tests pass

**Before merging**:
1. All tests pass
2. Coverage meets thresholds
3. E2E tests pass
4. Code reviewed

**Before deploying**:
1. Production build works
2. Smoke tests pass
3. Manual testing complete
