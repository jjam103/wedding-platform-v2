---
inclusion: always
---

# Testing Standards

**CRITICAL: ALL code changes require corresponding tests.** Never commit untested code.

## Mandatory Testing Rules

1. **Test Result<T> pattern** - All service methods return `Result<T>`. Test BOTH success and error paths.
2. **Mock Supabase** - Use `createMockSupabaseClient()` for unit tests. Never hit real database.
3. **AAA pattern** - Structure: Arrange, Act, Assert.
4. **Security testing** - Validate input sanitization, XSS prevention, auth checks in every test suite.
5. **Test independence** - Each test must be self-contained. No shared state between tests.

## Test Distribution

- **Unit Tests (70%)**: Services, utilities, hooks, pure functions
- **Integration Tests (25%)**: API routes, database operations, RLS policies  
- **E2E Tests (5%)**: Critical user flows only

## Testing Stack

- **Jest 29** with jsdom environment
- **React Testing Library** for components (user-centric queries)
- **fast-check** for property-based testing
- **MSW** for external API mocking
- **Playwright** for E2E with accessibility checks

## File Organization

Co-locate tests with source:
- `guestService.ts` → `guestService.test.ts`
- `*.property.test.ts` for property-based tests
- `__tests__/integration/` for integration tests
- `__tests__/e2e/*.spec.ts` for E2E tests

Test naming: `describe('serviceName.methodName', () => { it('should [behavior] when [condition]', ...) })`


## Service Layer Tests (CRITICAL)

**ALWAYS test 4 paths for every service method:**

1. **Success path** - Valid input returns `{ success: true, data: T }`
2. **Validation error** - Invalid input returns `{ success: false, error: { code: 'VALIDATION_ERROR', ... } }`
3. **Database error** - DB failure returns `{ success: false, error: { code: 'DATABASE_ERROR', ... } }`
4. **Security** - Malicious input is sanitized (XSS, SQL injection)

```typescript
describe('guestService.create', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  beforeEach(() => { mockSupabase = createMockSupabaseClient(); });
  
  it('should return success with guest data when valid input provided', async () => {
    const validData = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', groupId: 'uuid', ageType: 'adult' as const, guestType: 'wedding_guest' as const };
    mockSupabase.from.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'guest-1', ...validData }, error: null }) }) }) });
    
    const result = await guestService.create(validData);
    
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe('guest-1');
  });
  
  it('should return VALIDATION_ERROR when email is invalid', async () => {
    const result = await guestService.create({ firstName: 'John', email: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return DATABASE_ERROR when insert fails', async () => {
    mockSupabase.from.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } }) }) }) });
    const result = await guestService.create(validData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('DATABASE_ERROR');
  });
  
  it('should sanitize input to prevent XSS attacks', async () => {
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

Use React Testing Library with user-centric queries (`getByRole`, `getByText`, `getByLabelText`):

```typescript
describe('GuestCard', () => {
  const mockGuest = { id: 'guest-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
  
  it('should render guest information correctly', () => {
    render(<GuestCard guest={mockGuest} onEdit={jest.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('should call onEdit with guest id when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<GuestCard guest={mockGuest} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('guest-1');
  });
});
```

## Utility Function Tests

Test edge cases: empty strings, null/undefined, malicious input, boundary values:

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

Use fast-check to validate business rules across random inputs. Tag format: `Feature: destination-wedding-platform, Property N: [Description]`

**Custom arbitraries** in `test-utils/arbitraries.ts`:
```typescript
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
```

**Common patterns:**

XSS Prevention:
```typescript
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
```

Business Logic:
```typescript
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

Round-Trip:
```typescript
describe('Feature: destination-wedding-platform, Property 24: CSV Round-Trip', () => {
  it('should preserve data through export and import', () => {
    fc.assert(fc.property(fc.array(guestArbitrary, { minLength: 1, maxLength: 100 }), async (guests) => {
      const csvResult = await guestService.exportToCSV(guests);
      expect(csvResult.success).toBe(true);
      if (!csvResult.success) return;
      
      const importResult = await guestService.importFromCSV(csvResult.data);
      expect(importResult.success).toBe(true);
      if (!importResult.success) return;
      
      expect(importResult.data).toHaveLength(guests.length);
    }), { numRuns: 50 }); // Fewer runs for async
  });
});
```


## Integration Tests

### CRITICAL: Integration Test Architecture

**Integration tests MUST mock services to avoid worker crashes.**

#### ✅ CORRECT Pattern - Mock Services, Test Route Handlers
```typescript
// Import route handler directly
import { POST } from '@/app/api/admin/locations/route';

// Mock the service layer
jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe('POST /api/admin/locations', () => {
  it('should create location when valid data provided', async () => {
    // Get mocked function
    const mockCreate = require('@/services/locationService').create;
    mockCreate.mockResolvedValue({ 
      success: true, 
      data: { id: '1', name: 'Test Location', type: 'country' } 
    });
    
    // Create request
    const request = new Request('http://localhost:3000/api/admin/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Location', type: 'country' }),
    });
    
    // Test route handler directly
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Test Location', type: 'country' });
  });
});
```

#### ❌ WRONG Pattern - Direct Service Imports (Causes Worker Crashes)
```typescript
// ❌ NEVER DO THIS - Causes circular dependencies and worker crashes
import * as locationService from '@/services/locationService';

describe('Location API', () => {
  it('should create location', async () => {
    // This will cause worker to crash with SIGTERM/SIGABRT
    const result = await locationService.create({ name: 'Test' });
    expect(result.success).toBe(true);
  });
});
```

#### Why This Pattern?

**Problem with direct imports:**
- Service imports Supabase client
- Supabase client has circular dependencies in test environment
- Jest worker process crashes with SIGTERM/SIGABRT
- Tests fail unpredictably

**Solution with mocked services:**
- Mock service at module level
- Test route handler logic directly
- No circular dependencies
- Fast, stable, reliable tests

#### When to Use E2E Instead

Move tests to `__tests__/e2e/` if they require:
- Running Next.js development server
- Full request/response cycle with middleware
- Real authentication flow
- Server-side rendering validation

### API Routes

Test authentication, validation, and HTTP status codes:

```typescript
describe('POST /api/guests', () => {
  it('should create guest and return 201 when authenticated with valid data', async () => {
    const request = createMockRequest({ method: 'POST', body: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', groupId: 'uuid', ageType: 'adult', guestType: 'wedding_guest' }, authenticated: true });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
  
  it('should return 400 VALIDATION_ERROR when data is invalid', async () => {
    const request = createMockRequest({ method: 'POST', body: { firstName: 'John' }, authenticated: true });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 UNAUTHORIZED when not authenticated', async () => {
    const request = createMockRequest({ method: 'POST', body: {}, authenticated: false });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### RLS Policies

Test Row Level Security with real Supabase test client:

```typescript
describe('RLS: guests table', () => {
  let adminClient: SupabaseClient, userClient: SupabaseClient;
  beforeEach(async () => {
    adminClient = createTestSupabaseClient();
    userClient = createTestSupabaseClient();
    await adminClient.from('guests').delete().neq('id', '');
  });
  
  it('should allow group owners to read their guests', async () => {
    // Setup group and owner
    const { data: group } = await adminClient.from('groups').insert({ name: 'Test' }).select().single();
    const { data: user } = await adminClient.auth.admin.createUser({ email: 'owner@example.com', password: 'pass123' });
    await adminClient.from('group_members').insert({ groupId: group.id, userId: user.id, role: 'owner' });
    
    // Test as owner
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

### External Services (MSW)

Mock external APIs:

```typescript
const server = setupServer(rest.post('https://api.resend.com/emails', (req, res, ctx) => res(ctx.status(200), ctx.json({ id: 'email-123' }))));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('emailService', () => {
  it('should send email via Resend API', async () => {
    const result = await emailService.send({ to: 'guest@example.com', subject: 'RSVP', html: '<p>Thanks</p>' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe('email-123');
  });
  
  it('should return EMAIL_SERVICE_ERROR when API fails', async () => {
    server.use(rest.post('https://api.resend.com/emails', (req, res, ctx) => res(ctx.status(500))));
    const result = await emailService.send({ to: 'guest@example.com', subject: 'RSVP', html: '<p>Thanks</p>' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('EMAIL_SERVICE_ERROR');
  });
});
```


## E2E Tests (Playwright)

**Use E2E tests for complete user flows and server-dependent scenarios.**

### When to Use E2E vs Integration

**Use E2E tests when:**
- Testing complete user workflows (registration, RSVP, photo upload)
- Requiring a running Next.js server
- Testing middleware and authentication flows
- Validating server-side rendering
- Testing real API endpoints with full request cycle
- Checking accessibility and keyboard navigation

**Use Integration tests when:**
- Testing API route handler logic in isolation
- Testing with mocked services and dependencies
- No server required (faster, more reliable)
- Testing specific error paths and edge cases

### E2E Test Patterns

Test critical user flows and accessibility:

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
});

// API Testing with E2E (when server required)
test.describe('Guest API', () => {
  test('should create guest via API', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/admin/guests', {
      data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    });
    
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// Accessibility
test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('should be keyboard navigable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
```

### E2E Prerequisites

E2E tests require:
1. **Running server**: `npm run dev` in separate terminal
2. **Playwright browsers**: `npx playwright install`
3. **Test environment**: `.env.test` configured
4. **Test fixtures**: Images and files in `__tests__/fixtures/`


## Test Utilities

### Mock Factories (`test-utils/factories.ts`)

```typescript
export function createMockGuest(overrides?: Partial<Guest>): Guest {
  return { id: 'guest-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', ageType: 'adult', guestType: 'wedding_guest', groupId: 'group-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...overrides };
}
```

### Supabase Mocks

Unit tests (no database):
```typescript
export function createMockSupabaseClient() {
  return { from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn(), auth: { getSession: jest.fn(), signInWithPassword: jest.fn() } };
}
```

Integration tests (real database):
```typescript
export function createTestSupabaseClient() {
  return createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!);
}
```

### Request Mocking

```typescript
export function createMockRequest(options: { method?: string; body?: any; searchParams?: Record<string, string>; authenticated?: boolean }): Request {
  const { method = 'GET', body, searchParams = {}, authenticated = true } = options;
  const url = new URL('http://localhost:3000/api/test');
  Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authenticated) headers.set('Authorization', 'Bearer mock-token');
  return new Request(url.toString(), { method, headers, body: body ? JSON.stringify(body) : undefined });
}
```


## Coverage Requirements

- **Critical Paths**: 100% (auth, payments, RLS)
- **Service Layer**: 90%
- **API Routes**: 85%
- **Components**: 70%
- **Utilities**: 95%
- **Overall**: 80%

Jest config:
```javascript
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  coverageThresholds: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    './src/services/': { branches: 90, functions: 90, lines: 90, statements: 90 }
  }
};
```



## Security Testing

### XSS Prevention

```typescript
const xssPayloads = ['<script>alert("xss")</script>', '<img src=x onerror=alert(1)>', 'javascript:alert(1)', '<svg onload=alert(1)>', '<iframe src="javascript:alert(1)">'];

xssPayloads.forEach(payload => {
  it(`should sanitize: ${payload}`, () => {
    const sanitized = sanitizeInput(payload);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('onerror=');
  });
});
```

### SQL Injection Prevention

```typescript
const sqlPayloads = ["'; DROP TABLE guests; --", "1' OR '1'='1", "admin'--", "' UNION SELECT * FROM users--"];

sqlPayloads.forEach(payload => {
  it(`should safely handle: ${payload}`, async () => {
    const result = await guestService.search(payload);
    expect(result.success).toBe(true); // Should return empty, not error
  });
});
```

### Authentication

```typescript
it('should reject requests without auth token', async () => {
  const request = createMockRequest({ authenticated: false });
  const response = await GET(request);
  expect(response.status).toBe(401);
  expect((await response.json()).error.code).toBe('UNAUTHORIZED');
});

it('should reject expired sessions', async () => {
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'Session expired' } });
  const response = await GET(request);
  expect(response.status).toBe(401);
});
```


## Troubleshooting Test Issues

### Worker Crashes (SIGTERM/SIGABRT)

**Symptom**: Tests terminate with "worker process has failed to exit gracefully"

**Cause**: Direct service imports create circular dependencies with Supabase client

**Solution**: Mock services at module level
```typescript
// ✅ CORRECT
jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  list: jest.fn(),
}));

// ❌ WRONG
import * as locationService from '@/services/locationService';
```

### "Request is not defined" Errors

**Symptom**: `ReferenceError: Request is not defined`

**Cause**: Test environment doesn't have Web API globals

**Solution**: Use global Request object or move to E2E
```typescript
// ✅ CORRECT
const request = new Request('http://localhost:3000/api/test', { method: 'POST' });

// If this doesn't work, move test to __tests__/e2e/
```

### Tests Pass Locally But Fail in CI

**Possible causes:**
- Missing environment variables in CI
- Different Node.js versions
- Timing issues (increase timeouts)
- Mock setup differences

**Solution**: Check CI logs, verify environment variables, add explicit waits

### Slow Integration Tests

**Symptom**: Integration tests take too long

**Solutions:**
- Verify you're mocking services (not hitting real APIs)
- Check for unnecessary `await` statements
- Reduce test data size
- Ensure parallel execution is enabled


## Preventing Flaky Tests

**Always await async operations:**
```typescript
// ✅ CORRECT
it('should update state', async () => {
  await updateState();
  expect(state).toBe('updated');
});

// ❌ WRONG - Missing await causes race condition
it('should update state', async () => {
  updateState();
  expect(state).toBe('updated');
});
```

**Ensure test independence:**
```typescript
// ✅ CORRECT - Self-contained
it('should update guest', async () => {
  const createResult = await guestService.create(data);
  const updateResult = await guestService.update(createResult.data.id, newData);
  expect(updateResult.success).toBe(true);
});

// ❌ WRONG - Depends on previous test
let guestId: string;
it('should create guest', async () => {
  const result = await guestService.create(data);
  guestId = result.data.id;
});
it('should update guest', async () => {
  await guestService.update(guestId, data); // Fails if previous test skipped
});
```

**Mock external dependencies:**
```typescript
// ✅ CORRECT
it('should fetch data', async () => {
  mockAPI.mockResolvedValue({ data: 'test' });
  const result = await fetchData();
  expect(result).toBe('test');
});

// ❌ WRONG - Real API call (flaky, slow)
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

**Clean up after tests:**
```typescript
afterEach(async () => {
  await testDb.from('guests').delete().neq('id', '');
  jest.clearAllMocks();
});
```

**Use factories for test data:**
```typescript
// ✅ CORRECT
it('test 1', async () => {
  const result = await guestService.create(createTestGuest({ firstName: 'Jane' }));
});

// ❌ WRONG - Duplicated setup
it('test 1', async () => {
  const guest = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', groupId: 'group-1', ageType: 'adult' as const, guestType: 'wedding_guest' as const };
  const result = await guestService.create(guest);
});
```

## Testing Best Practices

### DO
- ✅ Write tests alongside code (TDD/BDD)
- ✅ Test both success and error paths for Result<T>
- ✅ Use descriptive test names: `should [behavior] when [condition]`
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Test one thing per test
- ✅ Use factories for test data
- ✅ Mock external dependencies (Supabase, APIs)
- ✅ Clean up test data in `afterEach`
- ✅ Test security (XSS, SQL injection, auth)
- ✅ Maintain high coverage for critical paths

### DON'T
- ❌ Skip writing tests
- ❌ Write tests that depend on each other
- ❌ Use real external services in tests
- ❌ Commit commented-out tests
- ❌ Ignore flaky tests
- ❌ Test implementation details
- ❌ Write overly complex tests
- ❌ Skip edge cases (null, undefined, empty, malicious input)

## Test Commands

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:property     # Property-based tests
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode
```

## Pre-Deployment Checklist

- [ ] All unit tests pass
- [ ] All property-based tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage meets thresholds (80%+ overall, 90%+ services)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Security tests pass (XSS, SQL injection, auth)
- [ ] Accessibility tests pass (WCAG 2.1 AA)

## Quick Reference: When Writing Tests

**Service method** → Test 4 paths: success, validation error, database error, security  
**Component** → Test rendering, user interactions, prop changes  
**Utility** → Test edge cases: empty, null, undefined, malicious input  
**API route** → Test auth, validation, HTTP status codes (200, 201, 400, 401, 500)  
**RLS policy** → Test with real Supabase client, verify access control  
**External service** → Mock with MSW, test success and failure paths  
**E2E flow** → Test critical user journeys, accessibility, XSS prevention
