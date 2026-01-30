# photoService.test.ts - Final Status

**Date**: January 29, 2026  
**Status**: BLOCKED - Requires Service Refactoring  
**Time Spent**: 2 hours

## Issue Summary

photoService.test.ts has 12/16 tests failing due to a fundamental mocking issue similar to accommodationService.

## Root Cause

The service creates Supabase clients at module load time:

```typescript
// Line 17-20: Module-level client creation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Line 46-52: Second client creation in getSupabase()
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}
```

**Problem**: The module-level client is created when the test file loads, BEFORE jest.mock() can intercept it. Our Pattern A mock is never used.

**Evidence**:
- `mockFrom.mock.calls.length` = 0 (never called)
- `result.data` = null (using real client that returns null in test env)
- Mock is correctly defined but service doesn't use it

## Attempted Solutions

1. ✅ Applied Pattern A mocking - Mock defined correctly
2. ✅ Used `mockImplementation` instead of `mockReturnValue` - No effect
3. ✅ Removed default mocks in beforeEach - No effect  
4. ✅ Added debug logging - Confirmed mock never called
5. ✅ Tried `jest.resetModules()` - Can't work with top-level imports

## Comparison with Working Services

**emailQueueService** (WORKING):
```typescript
const supabase = createClient(url, key); // Module-level
// Pattern A mock works because we mock BEFORE import
```

**photoService** (NOT WORKING):
```typescript
const supabase = createClient(url, key); // Module-level
// SAME pattern but mock not applied - timing issue
```

## Solution: Refactor Service

Change to use imported client like budgetService:

```typescript
// ✅ RECOMMENDED
import { supabase } from '@/lib/supabase';

export async function uploadPhoto(...) {
  const { data, error } = await supabase
    .from('photos')
    .insert(photoData);
}
```

This pattern works with standard `jest.mock('@/lib/supabase')`.

## Impact

- **Tests**: 12/16 failing (25% pass rate)
- **Service Coverage**: 4/16 tests passing
- **Priority**: Medium (service is used but has other test coverage)

## Recommendation

**Add to Sub-task 2.3.14 (Optional Service Refactoring)**

Refactor photoService to use `import { supabase } from '@/lib/supabase'` pattern like budgetService, emailService, and other working services.

**Estimated Refactoring Time**: 30-60 minutes
- Update service to use imported client
- Remove `getSupabase()` function
- Update tests to use standard Pattern B mocking
- Verify all 16 tests pass

## Related Files

- `services/photoService.ts` - Service implementation (needs refactoring)
- `services/photoService.test.ts` - Test file (needs Pattern B after refactoring)
- `services/budgetService.ts` - Example of correct pattern
- `ACCOMMODATION_SERVICE_TEST_ISSUE.md` - Similar issue

## Next Steps

Move to budgetService.test.ts as requested - it uses the correct import pattern and should be fixable.

