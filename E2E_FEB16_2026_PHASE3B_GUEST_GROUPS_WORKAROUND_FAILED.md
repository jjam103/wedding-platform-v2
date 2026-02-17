# E2E Phase 3B: Guest Groups - Workaround Failed

**Date**: February 16, 2026  
**Status**: 🔴 BLOCKED - Deeper Issue Than Expected  
**Test**: `should create group and immediately use it for guest creation`

## What We Tried

### Attempt 1: Page Reload Workaround
**Implementation**: Added `page.reload()` after guest creation to force fresh data load

**Result**: ❌ FAILED - Guest still not appearing in table

**Evidence**:
```
[Test] API Response: 201 { success: true, data: { id: 'a2b8ae99-c359-4a3c-84a7-c66b20b418f9', ... } }
[Test] Guest creation result: success
[Test] Reloading page to get fresh data (workaround for table refresh issue)
[Test] Guest not found in table after page reload
[Test] Table has 39 rows
[Test] Table content: ...Cleanup Test Group 1770225767151...
```

## Root Cause Analysis

### The Real Problem: E2E Cleanup Not Working

The table shows 39-40 rows of OLD test data from "Cleanup Test Group 1770225767151":
- Timestamp: 1770225767151 = January 2026 (3+ weeks ago)
- These guests should have been cleaned up by E2E teardown
- New guests ARE being created but are NOT visible in the table

### Why New Guests Don't Appear

**Hypothesis 1: Pagination**
- Table might be paginated
- New guests appear on page 2+
- Test only checks page 1

**Hypothesis 2: Sorting**
- Table might be sorted by creation date (oldest first)
- New guests appear at the bottom
- Test only checks visible rows

**Hypothesis 3: Filters**
- Table might have active filters
- New guests are filtered out
- Test tried clearing filters but it didn't help

**Hypothesis 4: RLS Policies**
- New guests might be created with wrong permissions
- RLS policies prevent them from being displayed
- API returns 201 but data is not accessible

## Evidence from Test Logs

### Guest Creation Works ✅
```json
{
  "id": "a2b8ae99-c359-4a3c-84a7-c66b20b418f9",
  "groupId": "d8bfe2e4-5b8f-4890-ade1-2904a9010dec",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe.1771268943608@example.com",
  "authMethod": "magic_link",
  "createdAt": "2026-02-16T19:09:04.319607+00:00"
}
```

### Table Shows Old Data ❌
```
First NameLast NameEmailGroupGuest TypeAge TypeAirportActions
▶JohnDoejohn.doe.1771225727454@example.comCleanup Test Group 1770225767151Wedding GuestAdult-Delete
▶JohnDoejohn.1771225750535@example.comCleanup Test Group 1770225767151Wedding GuestAdult-Delete
▶JohnDoejohn.1771225779587@example.comCleanup Test Group 1770225767151Wedding GuestAdult-Delete
...
```

### Retry Shows Same Issue
- First attempt: 39 rows (all old data)
- Retry attempt: 40 rows (still all old data)
- New guest never appears

## Next Steps

### Option 1: Fix E2E Cleanup (RECOMMENDED)
**Priority**: HIGH  
**Impact**: Fixes root cause for all tests

**Action Items**:
1. Investigate `__tests__/e2e/global-setup.ts` cleanup logic
2. Ensure all test data is deleted in teardown
3. Add verification that cleanup actually works
4. Run cleanup manually before test suite

**Files to Check**:
- `__tests__/e2e/global-setup.ts` - Global setup/teardown
- `__tests__/helpers/cleanup.ts` - Cleanup utilities
- Database queries in cleanup scripts

### Option 2: Scroll/Paginate to Find Guest
**Priority**: MEDIUM  
**Impact**: Workaround for this specific test

**Implementation**:
```typescript
// After page reload, scroll to bottom to load all rows
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);

// Or navigate to last page if paginated
const lastPageButton = page.locator('button:has-text("Last")');
if (await lastPageButton.isVisible().catch(() => false)) {
  await lastPageButton.click();
  await page.waitForTimeout(1000);
}
```

### Option 3: Search for Guest by Email
**Priority**: MEDIUM  
**Impact**: More reliable way to find guest

**Implementation**:
```typescript
// Use search functionality to find the specific guest
const searchInput = page.locator('input[placeholder*="Search"]');
if (await searchInput.isVisible().catch(() => false)) {
  await searchInput.fill(testEmail);
  await page.waitForTimeout(1000);
  
  // Now check if guest appears
  const guestElement = page.locator(`text=${guestName}`).first();
  const guestExists = await guestElement.isVisible({ timeout: 5000 });
  expect(guestExists).toBe(true);
}
```

### Option 4: Query Database Directly
**Priority**: LOW  
**Impact**: Verifies guest exists but doesn't test UI

**Implementation**:
```typescript
// Import test database client
import { createServiceClient } from '@/__tests__/helpers/testDb';

// Query database directly
const supabase = createServiceClient();
const { data: guests } = await supabase
  .from('guests')
  .select('*')
  .eq('email', testEmail);

expect(guests).toHaveLength(1);
expect(guests[0].firstName).toBe('John');
```

### Option 5: Skip This Test Temporarily
**Priority**: LOW  
**Impact**: Unblocks other tests but doesn't fix issue

**Implementation**:
```typescript
test.skip('should create group and immediately use it for guest creation', async ({ page }) => {
  // Test implementation
});
```

## Recommended Action Plan

### Immediate (Today)
1. **Fix E2E Cleanup** (Option 1)
   - Run manual cleanup: `npm run test:e2e:cleanup`
   - Verify cleanup works
   - Re-run test to see if it passes

2. **If cleanup doesn't help, try Option 3** (Search)
   - More reliable than scrolling/pagination
   - Tests the search functionality too

### Short-term (This Week)
1. **Investigate table behavior**
   - Check if pagination is enabled
   - Check default sorting
   - Check if filters persist across page loads

2. **Add better test data isolation**
   - Use unique prefixes for test data
   - Clean up test data in `beforeEach`
   - Verify cleanup in `afterEach`

### Long-term (Next Sprint)
1. **Fix component refresh logic** (Original issue)
   - Ensure `fetchGuests()` properly updates table
   - Add loading states
   - Fix race conditions

2. **Improve E2E test infrastructure**
   - Better cleanup mechanisms
   - Test data factories
   - Database snapshots/rollback

## Summary

The page reload workaround didn't work because the underlying issue is not just the component refresh logic - it's that the E2E cleanup is not removing old test data, and the table is showing 39-40 rows of stale data from weeks ago.

**Root Cause**: E2E cleanup not working properly  
**Symptom**: New guests don't appear in table (even after page reload)  
**Impact**: Test fails consistently  
**Recommended Fix**: Fix E2E cleanup first, then retry test

**Estimated Time**:
- Fix E2E cleanup: 30-60 minutes
- Implement search workaround: 15 minutes
- Fix component refresh: 30-60 minutes (separate issue)

**Status**: BLOCKED - Need to fix E2E cleanup before proceeding with Phase 3B

