---
inclusion: always
---

# Testing Standards

**CRITICAL: ALL code changes require corresponding tests.** Never commit untested code.

## Core Philosophy

**High coverage ≠ Quality tests**. This project had 91.2% coverage but missed critical bugs because tests focused on isolated units rather than integrated workflows.

### What Tests Must Validate
1. **Real Runtime Behavior** - Not mocked implementations
2. **Complete User Workflows** - Not isolated components  
3. **Framework Compatibility** - Actual Next.js runtime (params, middleware, SSR)
4. **State Updates & Reactivity** - Components respond to data changes
5. **Integration Between Layers** - State → API → UI flow

## Test Distribution & Stack

**Distribution:**
- **Unit Tests (60%)**: Services, utilities, hooks - mock external dependencies only
- **Integration Tests (30%)**: API routes, RLS policies - real test database, real auth
- **E2E Tests (10%)**: Complete user workflows - navigation, forms, state updates

**Stack:**
- Jest 29 (jsdom), React Testing Library, fast-check (property-based), Playwright (E2E)

**File Organization:**
- Co-locate: `guestService.ts` → `guestService.test.ts`
- Property tests: `*.property.test.ts`
- Integration: `__tests__/integration/`
- E2E: `__tests__/e2e/*.spec.ts`
- Test naming: `describe('serviceName.methodName', () => { it('should [behavior] when [condition]', ...) })`

## Mandatory Rules

1. **Result<T> Pattern** - All service methods return `Result<T>`. Test success AND all error paths
2. **Mock Supabase in Unit Tests** - Use `createMockSupabaseClient()`. Never hit real database
3. **AAA Pattern** - Arrange, Act, Assert structure
4. **Security Testing** - Validate input sanitization, XSS prevention, auth checks
5. **Test Independence** - Self-contained tests. No shared state
6. **State Reactivity** - Verify components update when data changes (not just initial render)
7. **Complete Workflows** - E2E tests for critical user journeys

## Critical Test Gaps (Real Bugs Missed)

### Gap #1: Form Type Coercion
**Problem**: HTML forms convert numbers to strings, tests pass typed data directly
```typescript
// ❌ Misses bugs
const result = await service.create({ baseCost: 1000 });

// ✅ Catches bugs
const formData = new FormData();
formData.append('baseCost', '1000'); // String from HTML
```

### Gap #2: Component Reactivity
**Problem**: Tests don't verify components update when props change
```typescript
// ✅ Tests reactivity
const { rerender } = render(<Component groups={[]} />);
expect(getOptions()).toHaveLength(0);
rerender(<Component groups={[{ id: '1', name: 'New' }]} />);
expect(getOptions()).toHaveLength(1); // Catches useMemo bugs
```

### Gap #3: RLS Policy Bypass
**Problem**: Service role bypasses Row Level Security
```typescript
// ❌ Bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ Tests RLS
const hostClient = await createAuthenticatedClient({ role: 'host' });
const { error } = await hostClient.from('content_pages').insert(...);
expect(error).toBeNull();

const guestClient = await createAuthenticatedClient({ role: 'guest' });
const { error: guestError } = await guestClient.from('content_pages').insert(...);
expect(guestError).toBeTruthy();
```

### Gap #4: Navigation Routes
**Problem**: Mocked navigation doesn't verify routes exist
```typescript
// ❌ Route might 404
const mockRouter = { push: jest.fn() };
expect(mockRouter.push).toHaveBeenCalledWith('/admin/sections');

// ✅ E2E verifies route
test('navigates correctly', async ({ page }) => {
  await page.click('text=Manage Sections');
  await expect(page).not.toHaveURL(/404/);
});
```

### Gap #5: Data Loading
**Problem**: Tests pass data as props, skip loading logic
```typescript
// ❌ Skips loading
render(<LocationSelector locations={mockLocations} />);

// ✅ Tests loading
test('loads locations', async () => {
  await testDb.from('locations').insert([{ id: '1', name: 'Test' }]);
  render(<LocationSelector />);
  await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
});
```

## Service Layer: 4-Path Pattern (MANDATORY)

**Every service method MUST test:**
1. **Success** - Valid input returns `{ success: true, data: T }`
2. **Validation Error** - Invalid input returns `{ success: false, error: { code: 'VALIDATION_ERROR', ... } }`
3. **Database Error** - DB failure returns `{ success: false, error: { code: 'DATABASE_ERROR', ... } }`
4. **Security** - Malicious input is sanitized

```typescript
describe('guestService.create', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  beforeEach(() => { mockSupabase = createMockSupabaseClient(); });
  
  it('should return success with guest data when valid input', async () => {
    const validData = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', 
                       groupId: 'uuid', ageType: 'adult' as const, guestType: 'wedding_guest' as const };
    mockSupabase.from.mockReturnValue({ 
      insert: jest.fn().mockReturnValue({ 
        select: jest.fn().mockReturnValue({ 
          single: jest.fn().mockResolvedValue({ data: { id: 'guest-1', ...validData }, error: null }) 
        }) 
      }) 
    });
    
    const result = await guestService.create(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe('guest-1');
  });
  
  it('should return VALIDATION_ERROR when email invalid', async () => {
    const result = await guestService.create({ firstName: 'John', email: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return DATABASE_ERROR when insert fails', async () => {
    mockSupabase.from.mockReturnValue({ 
      insert: jest.fn().mockReturnValue({ 
        select: jest.fn().mockReturnValue({ 
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } }) 
        }) 
      }) 
    });
    const result = await guestService.create(validData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('DATABASE_ERROR');
  });
  
  it('should sanitize input to prevent XSS', async () => {
    const maliciousData = { ...validData, firstName: '<script>alert("xss")</script>John' };
    const result = await guestService.create(maliciousData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).not.toContain('<script>');
      expect(result.data.firstName).not.toContain('alert');
    }
  });
});
```

## Component Tests

Use React Testing Library with user-centric queries:

```typescript
describe('GuestCard', () => {
  const mockGuest = { id: 'guest-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
  
  it('should render guest information', () => {
    render(<GuestCard guest={mockGuest} onEdit={jest.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('should call onEdit with guest id when edit clicked', () => {
    const onEdit = jest.fn();
    render(<GuestCard guest={mockGuest} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('guest-1');
  });
});
```

## Utility Tests

Test edge cases: empty, null/undefined, malicious input, boundaries:

```typescript
describe('sanitizeInput', () => {
  it('should remove HTML tags', () => expect(sanitizeInput('<p>Hello</p>')).toBe('Hello'));
  it('should remove script tags', () => expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello'));
  it('should handle empty strings', () => expect(sanitizeInput('')).toBe(''));
  it('should trim whitespace', () => expect(sanitizeInput('  Hello  ')).toBe('Hello'));
  it('should handle null/undefined', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
  });
});
```

## Property-Based Testing

Use fast-check for business rules. Define arbitraries in `__tests__/helpers/arbitraries.ts`:

```typescript
// Arbitraries
export const guestArbitrary = fc.record({
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  ageType: fc.constantFrom('adult', 'child', 'senior'),
  guestType: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only'),
  groupId: fc.uuid(),
});

export const maliciousInputArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('"; DROP TABLE guests; --'),
  fc.constant('<img src=x onerror=alert(1)>'),
  fc.string().map(s => `${s}<script>alert(1)</script>`)
);

// XSS Prevention Property
describe('Feature: destination-wedding-platform, Property 6: XSS Prevention', () => {
  it('should sanitize all malicious input patterns', () => {
    fc.assert(fc.property(maliciousInputArbitrary, (input) => {
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror=');
    }), { numRuns: 100 });
  });
});

// Business Logic Property
describe('Feature: destination-wedding-platform, Property 12: Budget Calculation', () => {
  it('should calculate total as sum of all components', () => {
    fc.assert(fc.property(budgetArbitrary, (budget) => {
      const result = budgetService.calculateTotal(budget);
      const expected = budget.vendors.reduce((sum, v) => sum + v.cost, 0) + 
                      budget.activities.reduce((sum, a) => sum + (a.costPerPerson - a.hostSubsidy), 0);
      expect(result).toBe(expected);
    }), { numRuns: 100 });
  });
});
```

## Integration Tests - CRITICAL Architecture

**MUST mock services to avoid worker crashes.**

### ✅ CORRECT: Mock Services, Test Route Handlers
```typescript
import { POST } from '@/app/api/admin/locations/route';

jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  list: jest.fn(),
}));

describe('POST /api/admin/locations', () => {
  it('should create location when valid data provided', async () => {
    const mockCreate = require('@/services/locationService').create;
    mockCreate.mockResolvedValue({ 
      success: true, 
      data: { id: '1', name: 'Test Location', type: 'country' } 
    });
    
    const request = new Request('http://localhost:3000/api/admin/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Location', type: 'country' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Test Location', type: 'country' });
  });
});
```

### ❌ WRONG: Direct Service Imports
```typescript
// ❌ NEVER - Causes circular dependencies and worker crashes
import * as locationService from '@/services/locationService';

describe('Location API', () => {
  it('should create location', async () => {
    const result = await locationService.create({ name: 'Test' }); // CRASHES
    expect(result.success).toBe(true);
  });
});
```

**Why?** Direct service imports → Supabase client circular dependencies → Jest worker crashes (SIGTERM/SIGABRT)

**When to use E2E instead:** Running Next.js server, full middleware, real auth flow, SSR validation

### RLS Policy Testing

Test with real authenticated clients (not service role):

```typescript
describe('RLS: guests table', () => {
  let adminClient: SupabaseClient, userClient: SupabaseClient;
  beforeEach(async () => {
    adminClient = createTestSupabaseClient();
    userClient = createTestSupabaseClient();
    await adminClient.from('guests').delete().neq('id', '');
  });
  
  it('should allow group owners to read their guests', async () => {
    const { data: group } = await adminClient.from('groups').insert({ name: 'Test' }).select().single();
    const { data: user } = await adminClient.auth.admin.createUser({ email: 'owner@example.com', password: 'pass123' });
    await adminClient.from('group_members').insert({ groupId: group.id, userId: user.id, role: 'owner' });
    
    await userClient.auth.signInWithPassword({ email: 'owner@example.com', password: 'pass123' });
    const { data, error } = await userClient.from('guests').select('*').eq('group_id', group.id);
    expect(error).toBeNull();
  });
  
  it('should prevent access to guests in other groups', async () => {
    const { data } = await userClient.from('guests').select('*').eq('group_id', 'other-group-id');
    expect(data).toHaveLength(0);
  });
});
```

## E2E Tests (Playwright)

**Use E2E for:** Complete workflows, Next.js server, middleware/auth, SSR, real endpoints, accessibility

**Use Integration for:** API route logic, mocked services, no server (faster), specific error paths

```typescript
test.describe('Guest Registration Flow', () => {
  test('should complete full registration', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register as Guest');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.selectOption('select[name="ageType"]', 'adult');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Registration successful')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
  
  test('should prevent XSS in form inputs', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="firstName"]', '<script>alert("xss")</script>');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard');
    
    const nameText = await page.locator('[data-testid="guest-name"]').textContent();
    expect(nameText).not.toContain('<script>');
  });
  
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

**Prerequisites:** Running server (`npm run dev`), Playwright browsers (`npx playwright install`), `.env.test` configured

## Test Utilities

Located in `__tests__/helpers/`:

```typescript
// factories.ts - Mock data factories
export function createMockGuest(overrides?: Partial<Guest>): Guest {
  return { id: 'guest-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', 
           ageType: 'adult', guestType: 'wedding_guest', groupId: 'group-1', 
           createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...overrides };
}

// mockSupabase.ts - Supabase client mocks
export function createMockSupabaseClient() {
  return { from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), 
           insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(), 
           delete: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), 
           single: jest.fn(), auth: { getSession: jest.fn(), signInWithPassword: jest.fn() } };
}

// testDb.ts - Test database client
export function createTestSupabaseClient() {
  return createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!);
}

// testAuth.ts - Request mocking
export function createMockRequest(options: { method?: string; body?: any; authenticated?: boolean }): Request {
  const { method = 'GET', body, authenticated = true } = options;
  const url = new URL('http://localhost:3000/api/test');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authenticated) headers.set('Authorization', 'Bearer mock-token');
  return new Request(url.toString(), { method, headers, body: body ? JSON.stringify(body) : undefined });
}
```

## Coverage Requirements

- **Critical Paths** (auth, RLS): 100%
- **Service Layer**: 90%
- **API Routes**: 85%
- **Components**: 70%
- **Utilities**: 95%
- **Overall**: 80%

## Security Testing

```typescript
// XSS Prevention
const xssPayloads = ['<script>alert("xss")</script>', '<img src=x onerror=alert(1)>', 
                     'javascript:alert(1)', '<svg onload=alert(1)>'];
xssPayloads.forEach(payload => {
  it(`should sanitize: ${payload}`, () => {
    const sanitized = sanitizeInput(payload);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
  });
});

// SQL Injection Prevention
const sqlPayloads = ["'; DROP TABLE guests; --", "1' OR '1'='1", "admin'--"];
sqlPayloads.forEach(payload => {
  it(`should safely handle: ${payload}`, async () => {
    const result = await guestService.search(payload);
    expect(result.success).toBe(true); // Should return empty, not error
  });
});

// Authentication
it('should reject requests without auth token', async () => {
  const request = createMockRequest({ authenticated: false });
  const response = await GET(request);
  expect(response.status).toBe(401);
  expect((await response.json()).error.code).toBe('UNAUTHORIZED');
});
```

## Troubleshooting

### Worker Crashes (SIGTERM/SIGABRT)
**Cause:** Direct service imports create circular dependencies with Supabase client
**Solution:** Mock services at module level: `jest.mock('@/services/serviceName')`

### "Request is not defined" Errors
**Solution:** Use global Request object or move test to `__tests__/e2e/`

### Tests Pass Locally But Fail in CI
**Check:** Environment variables, Node.js versions, timing issues, mock setup

### Slow Integration Tests
**Solutions:** Verify services are mocked (not hitting real APIs), reduce test data, enable parallel execution

## Preventing Flaky Tests

```typescript
// ✅ Always await async operations
it('should update state', async () => {
  await updateState();
  expect(state).toBe('updated');
});

// ✅ Ensure test independence
it('should update guest', async () => {
  const createResult = await guestService.create(data);
  const updateResult = await guestService.update(createResult.data.id, newData);
  expect(updateResult.success).toBe(true);
});

// ✅ Mock external dependencies
it('should fetch data', async () => {
  mockAPI.mockResolvedValue({ data: 'test' });
  const result = await fetchData();
  expect(result).toBe('test');
});

// ✅ Clean up after tests
afterEach(async () => {
  await testDb.from('guests').delete().neq('id', '');
  jest.clearAllMocks();
});

// ✅ Use factories for test data
it('test 1', async () => {
  const result = await guestService.create(createTestGuest({ firstName: 'Jane' }));
});
```

## Best Practices

### DO
- ✅ Write tests alongside code (TDD/BDD)
- ✅ Test both success and error paths for Result<T>
- ✅ Use descriptive names: `should [behavior] when [condition]`
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Test one thing per test
- ✅ Use factories for test data
- ✅ Mock external dependencies (Supabase, APIs)
- ✅ Clean up test data in `afterEach`
- ✅ Test security (XSS, SQL injection, auth)

### DON'T
- ❌ Skip writing tests
- ❌ Write tests that depend on each other
- ❌ Use real external services in tests
- ❌ Commit commented-out tests
- ❌ Ignore flaky tests
- ❌ Test implementation details
- ❌ Skip edge cases (null, undefined, empty, malicious input)

## Test Commands

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:property     # Property-based tests
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests (requires running server)
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode
```

## Quick Reference

**Service method** → Test 4 paths: success, validation error, database error, security  
**Component** → Test rendering, user interactions, prop changes  
**Utility** → Test edge cases: empty, null, undefined, malicious input  
**API route** → Test auth, validation, HTTP status codes (200, 201, 400, 401, 500)  
**RLS policy** → Test with real Supabase client, verify access control  
**E2E flow** → Test critical user journeys, accessibility, XSS prevention
