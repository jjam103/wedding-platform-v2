# E2E Phase 3B: Cleanup Pattern Fix Applied

**Date**: February 16, 2026  
**Status**: ✅ FIX APPLIED  
**Test**: `should create group and immediately use it for guest creation`

## Changes Made

### 1. Updated Guest Cleanup Pattern

**File**: `__tests__/helpers/cleanup.ts`

**Before**:
```typescript
export async function cleanupTestGuests(emailPattern = 'test%@example.com'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('guests')
    .delete()
    .like('email', emailPattern);
  
  if (error) {
    console.error('Failed to cleanup test guests:', error);
  }
}
```

**After**:
```typescript
export async function cleanupTestGuests(emailPattern = '%@example.com'): Promise<void> {
  const supabase = getCleanupClient();
  
  // Count before cleanup for logging
  const { count: beforeCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', emailPattern);
  
  // Delete all guests with @example.com domain
  const { error } = await supabase
    .from('guests')
    .delete()
    .like('email', emailPattern);
  
  if (error) {
    console.error('Failed to cleanup test guests:', error);
    return;
  }
  
  // Count after cleanup for verification
  const { count: afterCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', emailPattern);
  
  const cleaned = (beforeCount || 0) - (afterCount || 0);
  if (cleaned > 0) {
    console.log(`   Cleaned up ${cleaned} test guests`);
  }
}
```

**Changes**:
- Pattern changed from `test%@example.com` to `%@example.com`
- Added before/after count logging
- Added verification that cleanup actually worked

### 2. Updated Guest Groups Cleanup Pattern

**File**: `__tests__/helpers/cleanup.ts`

**Before**:
```typescript
export async function cleanupTestGuestGroups(namePattern = 'Test Family%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('groups')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test guest groups:', error);
  }
}
```

**After**:
```typescript
export async function cleanupTestGuestGroups(namePattern = '%Test%'): Promise<void> {
  const supabase = getCleanupClient();
  
  // Count before cleanup
  const { count: beforeCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  // Clean up any group with "Test" or "Cleanup" in the name
  const { error } = await supabase
    .from('groups')
    .delete()
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  if (error) {
    console.error('Failed to cleanup test guest groups:', error);
    return;
  }
  
  // Count after cleanup
  const { count: afterCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  const cleaned = (beforeCount || 0) - (afterCount || 0);
  if (cleaned > 0) {
    console.log(`   Cleaned up ${cleaned} test guest groups`);
  }
}
```

**Changes**:
- Pattern changed to match any group with "Test" OR "Cleanup" in name
- Uses `.or()` to catch both patterns
- Added before/after count logging
- Added verification that cleanup actually worked

## Why This Fixes the Issue

### Root Cause
The cleanup function was looking for emails matching `test%@example.com`, but tests were creating guests with emails like:
- `john.doe.1771268943608@example.com`
- `john.1771225750535@example.com`

These emails don't match the `test%` pattern, so they were never cleaned up.

### The Fix
By changing the pattern to `%@example.com`, we now catch ALL emails with the `@example.com` domain, which is the test domain used by E2E tests.

This means:
- ✅ `test.user.123@example.com` - Cleaned up
- ✅ `john.doe.456@example.com` - Cleaned up
- ✅ `john.789@example.com` - Cleaned up
- ✅ ANY email with `@example.com` - Cleaned up

### Benefits
1. **Comprehensive cleanup**: All test data is removed, not just some patterns
2. **Verification logging**: We can see how many items were cleaned up
3. **Future-proof**: Works with any email pattern as long as it uses `@example.com`
4. **Catches old data**: Will clean up the 39-40 rows of old test data from 3 weeks ago

## Expected Results

### Before Fix
```
[Test] Table has 39 rows
[Test] Table content: ...Cleanup Test Group 1770225767151...
[Test] Guest not found in table after page reload
```

### After Fix
```
🧹 Cleaning up test data...
   Cleaned up 39 test guests
   Cleaned up 5 test guest groups
✅ Test data cleaned

[Test] Table has 1 row
[Test] Guest found in table: John Doe
✅ Test passes
```

## Next Steps

1. **Run manual cleanup** to remove existing old data:
   ```bash
   # This will be done automatically by global-setup.ts
   npm run test:e2e -- guestGroups.spec.ts --grep "should create group and immediately use it for guest creation"
   ```

2. **Verify test passes** with clean database

3. **Move to next test** in Phase 3B

## Files Modified

- `__tests__/helpers/cleanup.ts` - Updated cleanup patterns with logging

## Documentation

- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_ROOT_CAUSE_FINAL.md` - Root cause analysis
- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_COMPLETE_DIAGNOSIS.md` - Complete diagnosis
- `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_WORKAROUND_FAILED.md` - Why page reload didn't work

## Status

✅ Cleanup pattern fix applied  
⏳ Ready for testing  
🎯 Expected to fix the failing test

