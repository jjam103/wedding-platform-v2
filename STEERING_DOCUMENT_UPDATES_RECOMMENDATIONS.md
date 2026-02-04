# Steering Document Updates - Recommendations

**Date**: February 1, 2026  
**Context**: Based on recent test work revealing gaps between test coverage and production quality

## Executive Summary

Recent testing work revealed that **91.2% test coverage missed critical production bugs** because tests focused on isolated units rather than integrated workflows. This document recommends specific updates to steering documents to prevent similar issues in future development.

**Key Finding**: High coverage ≠ Quality. Tests must validate user experience, not just code execution.

---

## Critical Lessons Learned

### 1. The Mocking Problem
**Issue**: Over-mocking hides real issues
- Mocked Supabase → Missed RLS bugs
- Mocked navigation → Missed 404s  
- Mocked data → Missed loading bugs
- Mocked forms → Missed validation bugs

**Solution**: Mock less, integrate more

### 2. The Unit Test Trap
**Issue**: 100% unit test coverage ≠ working application
- All units pass individually
- Integration fails in production
- User workflows broken

**Solution**: Test integration, not just units

### 3. The Happy Path Bias
**Issue**: Tests only checked success cases
- Valid data succeeds ✅
- Invalid data shows error toast ❌
- Missing data shows empty state ❌
- Loading state displays correctly ❌

**Solution**: Test error paths as thoroughly as success paths

### 4. The Runtime Gap
**Issue**: Tests don't use real Next.js runtime
- TypeScript passes
- Tests pass
- Runtime fails (async params, cookies)

**Solution**: Include build verification and real server tests

---

## Recommended Updates to testing-standards.md

### Add New Section at Top: "Critical Testing Principles"

```markdown
## Critical Testing Principles

### The Testing Reality Check
**High coverage ≠ Quality tests**. Recent production bugs revealed that 91.2% test coverage missed critical issues because tests focused on isolated units rather than integrated workflows.

**Key Lesson**: Test the user experience, not just the code.

### What Tests Must Validate
1. **Real Runtime Behavior** - Not just mocked implementations
2. **Complete User Workflows** - Not just isolated components  
3. **Framework Compatibility** - Actual Next.js runtime, not assumptions
4. **State Updates & Reactivity** - Components respond to data changes
5. **Integration Between Layers** - State → API → UI flow works

### The Testing Pyramid We Need

```
        /\
       /  \      Unit Tests (60%)
      /____\     ✅ Keep existing coverage
     /      \    
    /________\   Integration Tests (30%)
   /          \  ✅ Real API calls
  /____________\ ✅ Real database operations
 /              \ ✅ RLS policy testing
/________________\
E2E Tests (10%)
✅ Complete user workflows
✅ Navigation testing
✅ Form submission flows
✅ State update validation
```

### Common Test Gaps That Miss Bugs

#### Gap #1: Form Submission Testing
**Problem**: Tests pass data directly, skip HTML form layer

```typescript
// ❌ What tests do (misses bugs)
const result = await service.create({ baseCost: 1000 }); // Number

// ✅ What users do (reveals bugs)
<input type="number" name="baseCost" value="1000" /> // Returns string!
```

**Fix**: Test with FormData or real form submissions

#### Gap #2: State Reactivity Testing  
**Problem**: Tests don't verify components update when data changes

```typescript
// ❌ Missing test
test('dropdown updates when data changes', () => {
  const { rerender } = render(<Component groups={[]} />);
  expect(getOptions()).toHaveLength(0);
  
  rerender(<Component groups={[{ id: '1', name: 'New' }]} />);
  expect(getOptions()).toHaveLength(1); // Would catch useMemo bug
});
```

#### Gap #3: RLS Policy Testing
**Problem**: Tests use service role that bypasses RLS

```typescript
// ❌ Wrong - bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ Right - tests RLS
const hostClient = await createAuthenticatedClient({ role: 'host' });
const { error } = await hostClient.from('content_pages').insert(...);
expect(error).toBeNull();

const guestClient = await createAuthenticatedClient({ role: 'guest' });
const { error: guestError } = await guestClient.from('content_pages').insert(...);
expect(guestError).toBeTruthy(); // Should be blocked
```

#### Gap #4: Navigation Testing
**Problem**: Mocked navigation doesn't verify routes exist

```typescript
// ❌ Wrong - route might not exist
const mockRouter = { push: jest.fn() };
fireEvent.click(button);
expect(mockRouter.push).toHaveBeenCalledWith('/admin/sections');

// ✅ Right - E2E test
test('button navigates correctly', async ({ page }) => {
  await page.click('text=Manage Sections');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('h1')).toContainText('Sections');
});
```

#### Gap #5: Component Data Loading
**Problem**: Tests pass data as props, skip loading logic

```typescript
// ❌ Wrong - component receives data directly
render(<LocationSelector locations={mockLocations} />);

// ✅ Right - component must fetch data
test('loads and displays locations', async () => {
  await testDb.from('locations').insert([{ id: '1', name: 'Test' }]);
  render(<LocationSelector />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```
```

### Update "Test Distribution" Section

```markdown
## Test Distribution (Updated)

- **Unit Tests (60%)**: Services, utilities, hooks, pure functions
  - Focus on business logic
  - Mock external dependencies only
  - Test all error paths
  
- **Integration Tests (30%)**: API routes, database operations, RLS policies
  - Use real database (test instance)
  - Use real authentication (not service role)
  - Test complete request/response cycle
  - Validate RLS policies enforced
  
- **E2E Tests (10%)**: Critical user flows
  - Complete workflows (create → update → delete)
  - Navigation between pages
  - Form submissions with validation
  - State updates and reactivity
  - Error handling and recovery
```

### Add New Section: "Test Quality Checklist"

```markdown
## Test Quality Checklist

Before marking a feature "done", verify:

### Unit Tests
- [ ] Service methods test all 4 paths (success, validation, database, security)
- [ ] Utility functions test edge cases (null, undefined, empty, malicious)
- [ ] Components test rendering, interactions, and prop changes
- [ ] Hooks test with proper dependencies

### Integration Tests  
- [ ] API routes tested with real Request/Response objects
- [ ] Authentication tested with real user sessions (not service role)
- [ ] RLS policies validated for all roles
- [ ] Database operations tested with real test database
- [ ] Error responses return proper HTTP status codes

### E2E Tests
- [ ] Complete user workflow tested end-to-end
- [ ] Navigation tested (no 404s)
- [ ] Form submissions tested with validation
- [ ] State updates verified (dropdowns, lists update)
- [ ] Error states tested (toasts, error messages)
- [ ] Loading states tested

### Build & Runtime
- [ ] Production build succeeds (`npm run build`)
- [ ] TypeScript compilation passes
- [ ] No console errors in development
- [ ] No runtime errors in production build

### Manual Testing
- [ ] Feature tested in browser
- [ ] All user flows work as expected
- [ ] Error handling works correctly
- [ ] UI updates reactively
```

---

## Recommended Updates to code-conventions.md

### Add New Section: "Testing Conventions"

```markdown
## Testing Conventions (CRITICAL)

### Test File Naming
- Unit tests: `fileName.test.ts` (co-located with source)
- Integration tests: `__tests__/integration/featureName.integration.test.ts`
- E2E tests: `__tests__/e2e/workflowName.spec.ts`
- Property tests: `fileName.property.test.ts`
- Regression tests: `__tests__/regression/bugName.regression.test.ts`

### Test Structure (MANDATORY)

```typescript
describe('Feature: component/service name', () => {
  // Setup
  beforeEach(() => {
    // Reset state, create mocks
  });
  
  afterEach(() => {
    // Cleanup, clear mocks
  });
  
  // Success path
  it('should [behavior] when [condition]', () => {
    // Arrange
    const input = createTestData();
    
    // Act
    const result = performAction(input);
    
    // Assert
    expect(result).toMatchExpectedOutcome();
  });
  
  // Error paths
  it('should return error when [invalid condition]', () => {
    // Test error handling
  });
  
  // Edge cases
  it('should handle [edge case]', () => {
    // Test edge cases
  });
});
```

### What to Test (MANDATORY)

#### For Service Methods
1. Success path with valid data
2. Validation error with invalid data
3. Database error when operation fails
4. Security: XSS/SQL injection prevention

#### For Components
1. Renders without crashing
2. Displays data correctly
3. Handles user interactions
4. Updates when props/state change
5. Shows loading states
6. Shows error states

#### For API Routes
1. Returns success with valid auth + data
2. Returns 401 without auth
3. Returns 400 with invalid data
4. Returns proper HTTP status codes
5. Returns consistent error format

#### For Hooks
1. Returns correct initial state
2. Updates state correctly
3. Handles errors gracefully
4. Cleans up on unmount
5. Dependencies trigger re-runs

### What NOT to Test

❌ Implementation details (internal state, private methods)  
❌ Third-party library behavior (trust the library)  
❌ Obvious code (getters/setters with no logic)  
❌ Generated code (types, migrations)  

✅ Public API behavior  
✅ User-facing functionality  
✅ Business logic  
✅ Error handling  
```

---

## Recommended Updates to structure.md

### Add Section: "Test Organization"

```markdown
## Test Organization

### Test Directory Structure

```
__tests__/
├── unit/                    # Unit tests (co-located preferred)
│   ├── services/           # Service layer tests
│   ├── utils/              # Utility function tests
│   └── hooks/              # Custom hook tests
├── integration/            # Integration tests
│   ├── api/                # API route tests
│   ├── database/           # Database operation tests
│   └── rls/                # RLS policy tests
├── e2e/                    # End-to-end tests
│   └── *.spec.ts           # Playwright E2E specs
├── regression/             # Regression tests
│   └── *.regression.test.ts # Tests for known bugs
├── property/               # Property-based tests
│   └── *.property.test.ts  # fast-check tests
├── helpers/                # Test utilities
│   ├── factories.ts        # Test data factories
│   ├── mockSupabase.ts     # Supabase mocks
│   ├── testDb.ts           # Test database helpers
│   ├── testAuth.ts         # Authentication helpers
│   └── cleanup.ts          # Cleanup utilities
└── fixtures/               # Test data and files
    ├── images/             # Test images
    ├── documents/          # Test documents
    └── data/               # Test data files
```

### Test File Patterns

#### Co-located Unit Tests (Preferred)
```
services/
├── guestService.ts
├── guestService.test.ts           # Unit tests
└── guestService.property.test.ts  # Property tests
```

#### Integration Tests (Separate Directory)
```
__tests__/integration/
├── guestsApi.integration.test.ts
├── rlsPolicies.integration.test.ts
└── databaseIsolation.integration.test.ts
```

#### E2E Tests (Separate Directory)
```
__tests__/e2e/
├── guestGroupsFlow.spec.ts
├── sectionManagementFlow.spec.ts
└── photoUploadWorkflow.spec.ts
```

### Test Naming Conventions

- **Unit tests**: `[fileName].test.ts`
- **Integration tests**: `[featureName].integration.test.ts`
- **E2E tests**: `[workflowName].spec.ts`
- **Property tests**: `[fileName].property.test.ts`
- **Regression tests**: `[bugName].regression.test.ts`

### Test Helpers Organization

```typescript
// __tests__/helpers/factories.ts
export function createTestGuest(overrides?: Partial<Guest>): Guest {
  return { id: 'test-1', firstName: 'John', ...overrides };
}

// __tests__/helpers/testDb.ts
export async function cleanupTestData() {
  await testDb.from('guests').delete().neq('id', '');
}

// __tests__/helpers/testAuth.ts
export async function createAuthenticatedClient(role: 'host' | 'guest') {
  // Create authenticated Supabase client for testing
}
```
```

---

## New Steering Document: "testing-quality-gates.md"

Create a new steering document focused on quality gates:

```markdown
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
```

---

## New Steering Document: "testing-patterns.md"

Create a new document with common testing patterns:

```markdown
---
inclusion: always
---

# Testing Patterns & Anti-Patterns

## Common Testing Patterns

### Pattern 1: Test State Updates

```typescript
// ✅ GOOD - Tests that component updates when data changes
test('dropdown updates when groups change', () => {
  const { rerender } = render(<GuestForm groups={[]} />);
  expect(getGroupOptions()).toHaveLength(0);
  
  rerender(<GuestForm groups={[{ id: '1', name: 'Family' }]} />);
  expect(getGroupOptions()).toHaveLength(1);
});
```

### Pattern 2: Test Complete Workflows

```typescript
// ✅ GOOD - Tests end-to-end user flow
test('user can create guest from scratch', async ({ page }) => {
  // Create group first
  await page.click('text=Add Group');
  await page.fill('input[name="name"]', 'Family');
  await page.click('text=Create');
  
  // Verify group appears in dropdown
  await page.click('text=Add Guest');
  const options = await page.locator('select[name="groupId"] option').allTextContents();
  expect(options).toContain('Family');
  
  // Create guest
  await page.selectOption('select[name="groupId"]', { label: 'Family' });
  await page.fill('input[name="firstName"]', 'John');
  await page.click('text=Create Guest');
  
  // Verify guest created
  await expect(page.locator('text=John')).toBeVisible();
});
```

### Pattern 3: Test RLS Policies

```typescript
// ✅ GOOD - Tests with real authentication
test('hosts can create content pages', async () => {
  const hostClient = await createAuthenticatedClient({ role: 'host' });
  const { error } = await hostClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeNull();
});

test('guests cannot create content pages', async () => {
  const guestClient = await createAuthenticatedClient({ role: 'guest' });
  const { error } = await guestClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeTruthy();
});
```

### Pattern 4: Test Form Submissions

```typescript
// ✅ GOOD - Tests with real FormData
test('handles number inputs from HTML forms', async () => {
  const formData = new FormData();
  formData.append('baseCost', '1000');  // String from HTML
  
  const result = await submitVendorForm(formData);
  expect(result.success).toBe(true);
});
```

### Pattern 5: Test Error States

```typescript
// ✅ GOOD - Tests error display
test('shows toast on validation error', async () => {
  const mockAddToast = jest.fn();
  render(<LocationForm addToast={mockAddToast} />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      message: expect.stringContaining('validation')
    });
  });
});
```

## Common Anti-Patterns

### Anti-Pattern 1: Over-Mocking

```typescript
// ❌ BAD - Mocks everything, tests nothing real
const mockSupabase = { from: jest.fn().mockReturnThis(), ... };
const mockRouter = { push: jest.fn() };
const mockToast = { add: jest.fn() };

// ✅ GOOD - Mock only external dependencies
const mockSupabase = createMockSupabaseClient();
// Use real router, real toast in integration tests
```

### Anti-Pattern 2: Testing Implementation Details

```typescript
// ❌ BAD - Tests internal state
expect(component.state.isLoading).toBe(true);

// ✅ GOOD - Tests user-visible behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### Anti-Pattern 3: Skipping Error Paths

```typescript
// ❌ BAD - Only tests success
test('creates guest', async () => {
  const result = await guestService.create(validData);
  expect(result.success).toBe(true);
});

// ✅ GOOD - Tests all paths
test('creates guest with valid data', async () => { ... });
test('returns error with invalid data', async () => { ... });
test('returns error when database fails', async () => { ... });
test('sanitizes malicious input', async () => { ... });
```

### Anti-Pattern 4: Shared Test State

```typescript
// ❌ BAD - Tests depend on each other
let guestId: string;
test('creates guest', async () => {
  const result = await guestService.create(data);
  guestId = result.data.id;
});
test('updates guest', async () => {
  await guestService.update(guestId, data); // Fails if previous test skipped
});

// ✅ GOOD - Tests are independent
test('updates guest', async () => {
  const createResult = await guestService.create(data);
  const updateResult = await guestService.update(createResult.data.id, newData);
  expect(updateResult.success).toBe(true);
});
```

### Anti-Pattern 5: Missing Cleanup

```typescript
// ❌ BAD - Leaves test data
test('creates guest', async () => {
  await guestService.create(data);
  // No cleanup
});

// ✅ GOOD - Cleans up after test
afterEach(async () => {
  await testDb.from('guests').delete().neq('id', '');
  jest.clearAllMocks();
});
```

## Testing Checklist

### Before Writing Tests
- [ ] Understand the user workflow
- [ ] Identify critical paths
- [ ] Plan test data needs
- [ ] Consider edge cases

### While Writing Tests
- [ ] Test user behavior, not implementation
- [ ] Test all paths (success, error, edge cases)
- [ ] Use descriptive test names
- [ ] Keep tests independent
- [ ] Clean up after tests

### After Writing Tests
- [ ] Run tests locally
- [ ] Verify coverage increased
- [ ] Check for flakiness (run 3x)
- [ ] Review test quality
- [ ] Update documentation
```

---

## Implementation Priority

### High Priority (Implement This Week)
1. ✅ Add "Critical Testing Principles" section to testing-standards.md
2. ✅ Add "Test Quality Checklist" to testing-standards.md
3. ✅ Create testing-quality-gates.md
4. ✅ Update test distribution percentages

### Medium Priority (Next Sprint)
1. ⏳ Create testing-patterns.md with examples
2. ⏳ Add "Testing Conventions" to code-conventions.md
3. ⏳ Update structure.md with test organization
4. ⏳ Add common test gaps section

### Low Priority (Next Month)
1. ⏳ Create testing workshop based on new patterns
2. ⏳ Update code review guidelines
3. ⏳ Create testing metrics dashboard
4. ⏳ Document flaky test prevention

---

## Success Metrics

### Before Updates
- Test coverage: 91.2%
- Bugs caught by tests: ~50%
- Manual testing time: High
- Production bugs: 8 in one session

### After Updates (Target)
- Test coverage: 85%+ (quality over quantity)
- Bugs caught by tests: 90%+
- Manual testing time: Reduced 50%
- Production bugs: <2 per release

---

## Conclusion

The key insight from recent testing work is:

**High coverage doesn't guarantee quality. Tests must validate user experience, not just code execution.**

These steering document updates focus on:
1. Testing real behavior, not mocked implementations
2. Testing complete workflows, not isolated units
3. Testing integration between layers
4. Testing state updates and reactivity
5. Testing with real runtime (Next.js, database, auth)

By implementing these updates, future development will catch bugs earlier, reduce manual testing burden, and increase confidence in deployments.
