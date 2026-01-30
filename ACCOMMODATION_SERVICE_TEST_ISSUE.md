# accommodationService.test.ts - Mocking Issue

## Status: BLOCKED - Requires Investigation

## Issue Summary
The `accommodationService.test.ts` has 1 failing test that cannot be fixed with standard mocking patterns due to a Jest module resolution issue.

## Failing Test
- `calculateRoomCost › should return error when room type not found`

## Root Cause
The service creates a NEW Supabase client inside EACH function using `createClient()`:

```typescript
export async function getRoomType(id: string): Promise<Result<RoomType>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // ... query logic
}
```

This pattern differs from Pattern A services (like `emailQueueService`) which create a client at module load time.

## Problem
Despite properly mocking `@supabase/supabase-js` with `jest.mock()`, the service never calls the mocked `createClient()`. The mock is defined correctly but the service uses a different/cached version of the module.

**Evidence:**
- `mockFrom.mock.calls.length` = 0 (never called)
- `createClient` is mocked (`jest.isMockFunction` returns true)
- Mock is defined BEFORE service import
- Used `jest.resetModules()` - no effect

## Attempted Solutions
1. ✅ Applied Pattern A mocking (works for `emailQueueService`)
2. ✅ Tried `jest.spyOn()` - Cannot redefine property error
3. ✅ Tried direct property replacement - Read-only property error
4. ✅ Tried `jest.resetModules()` - No effect
5. ✅ Tried manual mock implementation - Mock never called
6. ✅ Verified mock setup with debug logging - Mock exists but unused

## Workaround Options

### Option 1: Refactor Service (Recommended)
Change service to create client at module load time like Pattern A services:

```typescript
// At top of file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Then use it in functions
export async function getRoomType(id: string): Promise<Result<RoomType>> {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('id', id)
    .single();
  // ...
}
```

This would make it compatible with Pattern A mocking.

### Option 2: Use Integration Test
Move this test to `__tests__/integration/` and test the full API route instead of the service directly. Integration tests mock services, not Supabase clients.

### Option 3: Accept Partial Coverage
Skip this one test and accept 23/24 passing tests (95.8% pass rate) for this service.

## Impact
- **Test Suite**: 1 failing test out of 689 total
- **Service Coverage**: 23/24 tests passing (95.8%)
- **Priority**: Low (only 1 test, service is otherwise well-tested)

## Recommendation
**Move to next service** (`rsvpAnalyticsService` - 1 test, should be quick win) and revisit this later if time permits. The service is 95.8% tested and the failing test is for an edge case (room type not found).

## Related Files
- `services/accommodationService.ts` - Service implementation
- `services/accommodationService.test.ts` - Test file
- `docs/TESTING_PATTERN_A_GUIDE.md` - Mocking pattern documentation
- `services/emailQueueService.test.ts` - Working Pattern A example
