# Phase 2, Priority 1: Worker Crash Fix - COMPLETE ✅

## Issue Fixed
**File**: `__tests__/integration/roomTypesApi.integration.test.ts`
**Error**: SIGTERM signal / Maximum call stack size exceeded
**Root Cause**: Incorrect Supabase mocking pattern causing circular dependencies

## Solution Applied

### Problem
The test was mocking `@supabase/auth-helpers-nextjs` with `createRouteHandlerClient`, but the actual routes use `@supabase/ssr` with `createServerClient`. This mismatch caused:
1. Real Supabase client initialization attempts
2. Circular dependencies in test environment
3. Worker process crashes with SIGTERM/SIGABRT

### Fix
Updated test to follow the correct pattern used in successful integration tests:

1. **Mock `@supabase/ssr` instead of `@supabase/auth-helpers-nextjs`**:
```typescript
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));
```

2. **Use simple request objects instead of Request constructor**:
```typescript
// Before (causing issues)
const request = new Request('http://localhost:3000/api/...', { method: 'POST', body: JSON.stringify(...) });

// After (working)
const request = {
  json: async () => ({ ...data }),
  url: 'http://localhost:3000/api/...',
} as any;
```

3. **Use Promise.resolve for params**:
```typescript
// Before
{ params: { id: 'room-type-1' } }

// After
{ params: Promise.resolve({ id: 'room-type-1' }) }
```

4. **Set up auth mocks in beforeEach**:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  
  // Default: authenticated user
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'admin@example.com' } },
    error: null,
  } as any);
  
  // Default: valid session
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1', email: 'admin@example.com' } } },
    error: null,
  } as any);
});
```

## Test Results
✅ **All 15 tests passing**
- GET /api/admin/accommodations/:id/room-types (3 tests)
- POST /api/admin/room-types (3 tests)
- GET /api/admin/room-types/:id (2 tests)
- PUT /api/admin/room-types/:id (2 tests)
- DELETE /api/admin/room-types/:id (2 tests)
- GET /api/admin/room-types/:id/sections (1 test)
- Capacity validation (2 tests)

## Pattern to Follow
This fix establishes the correct pattern for all integration tests:
1. Mock services at module level
2. Mock `@supabase/ssr` with `createServerClient`
3. Use simple request objects
4. Use Promise.resolve for dynamic route params
5. Set up default auth state in beforeEach

## Next Steps
Apply this pattern to other failing integration tests with similar issues.

---
**Status**: COMPLETE ✅
**Time**: ~30 minutes
**Tests Fixed**: 15 tests (roomTypesApi)
**Worker Crashes**: 0 (eliminated)
