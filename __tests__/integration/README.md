# Integration Tests

This directory contains integration tests that validate the interaction between API routes, services, and mocked dependencies.

## Overview

Integration tests focus on testing API route handlers and service layer interactions **without requiring a running server**. These tests use mocked Supabase clients and service layers to validate:

- API route handler logic
- Request/response formatting
- Validation and error handling
- Service layer integration
- Database query construction

**Note**: Tests that require a running server have been moved to `__tests__/e2e/` (e.g., `guestsApi.spec.ts`, `apiHealth.spec.ts`).

## Test Architecture

### Refactored Pattern (No Worker Crashes)

Integration tests now follow this pattern to avoid worker crashes:

```typescript
// ✅ CORRECT - Mock services, test route handlers
import { POST } from '@/app/api/admin/locations/route';

jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  list: jest.fn(),
}));

describe('POST /api/admin/locations', () => {
  it('should create location when valid data provided', async () => {
    const mockCreate = require('@/services/locationService').create;
    mockCreate.mockResolvedValue({ success: true, data: { id: '1', name: 'Test' } });
    
    const request = new Request('http://localhost:3000/api/admin/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'country' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

### Why This Pattern?

**Previous approach** (caused crashes):
- Imported services directly
- Services imported Supabase client
- Circular dependencies caused worker termination

**Current approach** (stable):
- Mock services at module level
- Test route handlers directly
- No circular dependencies
- Fast, reliable tests

## Setup

Integration tests require real Supabase credentials to run. To set up:

1. **Copy the example environment file:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in your test Supabase credentials:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   ```

3. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

## Test Organization

### API Route Tests

#### `apiRoutes.integration.test.ts`
- **Purpose**: Validates core API route patterns and error handling
- **Tests**: Authentication, validation, error responses
- **Pattern**: Mocked services, direct route handler testing

#### `contentPagesApi.integration.test.ts`
- **Purpose**: Tests content pages API endpoints
- **Tests**: CRUD operations, slug validation, cascade deletion
- **Pattern**: Mocked contentPagesService

#### `homePageApi.integration.test.ts`
- **Purpose**: Tests home page settings API
- **Tests**: Settings retrieval, updates, section management
- **Pattern**: Mocked settingsService and sectionsService

#### `locationsApi.integration.test.ts`
- **Purpose**: Tests location hierarchy API
- **Tests**: Location creation, hierarchy validation, updates
- **Pattern**: Mocked locationService

#### `roomTypesApi.integration.test.ts`
- **Purpose**: Tests room type management API
- **Tests**: Room type CRUD, capacity tracking, pricing
- **Pattern**: Mocked accommodationService

#### `referenceSearchApi.integration.test.ts`
- **Purpose**: Tests reference search functionality
- **Tests**: Search across entities, result ordering, filtering
- **Pattern**: Mocked reference search functions

#### `sectionsApi.integration.test.ts`
- **Purpose**: Tests page section API
- **Tests**: Section CRUD, reference validation, circular detection
- **Pattern**: Mocked sectionsService

### Database Tests

#### `database-rls.integration.test.ts`
- **Purpose**: Validates Row Level Security policies
- **Tests**: Access control, data isolation, permission checks
- **Pattern**: Real Supabase test client (requires credentials)

### Legacy Tests (Moved to E2E)

The following tests have been moved to `__tests__/e2e/` because they require a running server:

- `guestsApi.integration.test.ts` → `__tests__/e2e/guestsApi.spec.ts`
- `realApi.integration.test.ts` → `__tests__/e2e/apiHealth.spec.ts`

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm test __tests__/integration/apiRoutes.integration.test.ts

# Run with coverage
npm run test:coverage -- --testPathPattern=integration

# Run in watch mode
npm run test:watch -- __tests__/integration
```

## Setup Requirements

### For API Route Tests (Most Tests)
No special setup required. These tests use mocked services and run without external dependencies.

### For Database RLS Tests
Requires real Supabase credentials:

1. **Copy the example environment file:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in your test Supabase credentials:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   ```

3. **Run RLS tests:**
   ```bash
   npm test __tests__/integration/database-rls.integration.test.ts
   ```

## Skipped Tests

Integration tests will automatically skip if:
- Supabase environment variables are not configured
- Environment variables contain mock values (from unit test setup)

When skipped, you'll see a warning message with setup instructions.

## Best Practices

### 1. Mock Services, Not Supabase
```typescript
// ✅ CORRECT
jest.mock('@/services/guestService', () => ({
  create: jest.fn(),
}));

// ❌ WRONG - Causes circular dependencies
import { createClient } from '@supabase/supabase-js';
```

### 2. Test Route Handlers Directly
```typescript
// ✅ CORRECT
import { POST } from '@/app/api/admin/guests/route';
const response = await POST(request);

// ❌ WRONG - Requires running server
const response = await fetch('http://localhost:3000/api/admin/guests');
```

### 3. Use Request/Response Objects
```typescript
// ✅ CORRECT
const request = new Request('http://localhost:3000/api/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'test' }),
});

const response = await POST(request);
const data = await response.json();
```

### 4. Test All Response Paths
- ✅ Success (200/201)
- ✅ Validation error (400)
- ✅ Authentication error (401)
- ✅ Not found (404)
- ✅ Server error (500)

### 5. Keep Tests Fast
- Mock all external dependencies
- Avoid real database calls (except RLS tests)
- Use minimal test data
- Clean up mocks between tests

### 6. Avoid Worker Crashes
- Never import services that import Supabase directly
- Always mock at the service layer
- Test route handlers, not full request cycle

## Troubleshooting

### Worker Crashes / SIGTERM Errors
**Symptom**: Tests terminate with "worker process has failed to exit gracefully"

**Solution**: Ensure you're mocking services, not importing them directly:
```typescript
// ✅ CORRECT
jest.mock('@/services/locationService');

// ❌ WRONG
import * as locationService from '@/services/locationService';
```

### "Request is not defined" Errors
**Symptom**: `ReferenceError: Request is not defined`

**Solution**: Use the global Request object or move test to E2E suite:
```typescript
// ✅ CORRECT
const request = new Request('http://localhost:3000/api/test', { method: 'POST' });

// If this doesn't work, move to __tests__/e2e/
```

### Tests Pass Locally But Fail in CI
**Symptom**: Tests work on your machine but fail in GitHub Actions

**Possible causes**:
- Missing environment variables in CI
- Different Node.js versions
- Timing issues (increase timeouts)
- Mock setup differences

### Database RLS Tests Skipped
**Symptom**: RLS tests show as skipped

**Solution**: 
- Verify `.env.test` exists with valid Supabase credentials
- Check credentials are not mock values from `jest.setup.js`
- Ensure test database is accessible

### Slow Test Execution
**Symptom**: Integration tests take too long

**Solutions**:
- Verify you're mocking services (not hitting real APIs)
- Check for unnecessary `await` statements
- Reduce test data size
- Run tests in parallel (default Jest behavior)

## Migration Guide

### Moving Tests from Integration to E2E

If your integration test requires a running server, move it to E2E:

1. **Create E2E spec file**: `__tests__/e2e/yourTest.spec.ts`
2. **Convert to Playwright format**:
```typescript
// Before (Integration)
describe('API Test', () => {
  it('should work', async () => {
    const response = await fetch('/api/endpoint');
    expect(response.status).toBe(200);
  });
});

// After (E2E)
import { test, expect } from '@playwright/test';

test('API Test', async ({ request }) => {
  const response = await request.get('/api/endpoint');
  expect(response.status()).toBe(200);
});
```
3. **Remove from integration directory**
4. **Update test documentation**

### Converting Service Imports to Mocks

If your test causes worker crashes:

1. **Identify service imports**:
```typescript
// ❌ Causes crashes
import * as guestService from '@/services/guestService';
```

2. **Replace with mocks**:
```typescript
// ✅ Stable
jest.mock('@/services/guestService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  list: jest.fn(),
}));
```

3. **Test route handler directly**:
```typescript
import { POST } from '@/app/api/admin/guests/route';

const mockCreate = require('@/services/guestService').create;
mockCreate.mockResolvedValue({ success: true, data: { id: '1' } });

const response = await POST(request);
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](../../.kiro/steering/testing-standards.md)
- [Integration Test Fixes Summary](../../INTEGRATION_TEST_FIXES_SUMMARY.md)
- [Why Tests Didn't Catch Issues](../../WHY_TESTS_DIDNT_CATCH_ISSUES.md)
