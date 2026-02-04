# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Configuration change

## Related Issues
<!-- Link to related issues, e.g., "Fixes #123" or "Relates to #456" -->

## Testing Checklist

### Required Tests (Check all that apply)

#### Service Layer Changes
- [ ] Success path tested with valid input
- [ ] Validation error tested with invalid input
- [ ] Database error handling tested
- [ ] Security/sanitization tested (XSS, SQL injection)
- [ ] All service methods return `Result<T>` pattern

#### API Route Changes
- [ ] Authenticated request tested (200/201)
- [ ] Unauthenticated request tested (401)
- [ ] Invalid input tested (400)
- [ ] Database error tested (500)
- [ ] Uses real Request/Response objects

#### Component Changes
- [ ] Component rendering tested
- [ ] User interactions tested (clicks, inputs)
- [ ] Props handling tested
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Uses user-centric queries (not implementation details)

#### Bug Fixes
- [ ] Regression test added that reproduces the bug
- [ ] Test verifies bug is fixed
- [ ] Test documents what was broken

#### Database Schema Changes
- [ ] RLS policy tests added
- [ ] Admin access tested (create/read/update/delete)
- [ ] Guest access tested (read-only if applicable)
- [ ] Unauthorized access blocked
- [ ] Tests use real auth (not service role)

#### Security-Critical Changes
- [ ] XSS prevention tested
- [ ] SQL injection prevention tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Input sanitization tested

### Test Quality
- [ ] Tests are independent (no shared state)
- [ ] Tests have descriptive names
- [ ] Tests use meaningful assertions
- [ ] Tests clean up after themselves
- [ ] No flaky tests introduced

### Coverage
- [ ] Coverage meets minimum thresholds (80% overall)
- [ ] New code has 100% coverage
- [ ] Coverage did not decrease from main branch
- [ ] Ran `npm run test:coverage` locally

## Code Quality Checklist
- [ ] Code follows project conventions (see `.kiro/steering/code-conventions.md`)
- [ ] TypeScript types are explicit (no `any`)
- [ ] All exported functions have JSDoc comments
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run test:types`)
- [ ] Production build succeeds (`npm run build`)

## Manual Testing
<!-- Describe how you manually tested these changes -->

### Steps to Test
1. 
2. 
3. 

### Expected Behavior
<!-- What should happen when following the steps above? -->

### Screenshots/Videos
<!-- If applicable, add screenshots or videos demonstrating the changes -->

## Documentation
- [ ] Updated relevant documentation
- [ ] Added/updated JSDoc comments
- [ ] Updated README if needed
- [ ] Added migration guide if breaking change

## Deployment Notes
<!-- Any special considerations for deployment? -->
- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires dependency updates
- [ ] No special deployment steps needed

## Reviewer Notes
<!-- Any specific areas you'd like reviewers to focus on? -->

## Checklist Before Requesting Review
- [ ] Self-reviewed the code
- [ ] All tests pass locally (`npm test`)
- [ ] Coverage thresholds met (`npm run test:coverage`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Commits are clean and well-described
- [ ] Branch is up to date with main

---

## For Reviewers

### Review Checklist
- [ ] Tests exist for all new code
- [ ] Tests are meaningful (not just coverage)
- [ ] Tests follow project patterns
- [ ] Security tests included (if applicable)
- [ ] Regression tests included (if bug fix)
- [ ] Coverage thresholds met
- [ ] Code follows conventions
- [ ] No obvious bugs or issues

### Testing Guidelines
See [Code Review Testing Guidelines](../docs/CODE_REVIEW_TESTING_GUIDELINES.md) for detailed requirements.

### Common Feedback
- "Add tests for error paths" - Only success path tested
- "Use real auth, not service role" - Tests bypass RLS
- "Tests are too coupled" - Tests depend on each other
- "Missing security tests" - No XSS/SQL injection tests
- "Tests use implementation details" - Test behavior, not internals
