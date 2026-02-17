# E2E Test #10 Investigation - Guest View Reference Blocks

## Test Status
**FAILING** - 1 out of 8 tests in Reference Blocks suite

## Test Description
Test #10: "should display reference blocks in guest view with preview modals"

This test verifies that reference blocks (events, activities) display correctly in the guest view and that clicking them shows detailed information.

## Root Cause Analysis

### What's Happening
1. Test creates events and activities with `status: 'published'`
2. Test adds references to a section's column
3. Test navigates to guest view: `/custom/${contentPage.slug}`
4. Guest view renders successfully
5. Reference cards appear with "Details could not be loaded" fallback text
6. **API call to `/api/admin/references/${type}/${id}` returns non-200 response**

### API Endpoint Analysis

**File**: `app/api/admin/references/[type]/[id]/route.ts`

**Current Implementation**:
- ✅ Uses anon key (correct for guest access)
- ✅ No authentication required
- ✅ Queries database with proper selects
- ✅ Filters by `deleted_at IS NULL` via RLS
- ❌ **Does NOT filter by `status = 'published'`**

**RLS Policies**:
- Events table: `SELECT` allowed for anon users where `deleted_at IS NULL`
- Activities table: `SELECT` allowed for anon users where `deleted_at IS NULL`
- **Missing**: No RLS check for `status = 'published'`

### Why It's Failing

**Hypothesis 1: Status Filter Missing**
The API doesn't explicitly filter by `status = 'published'`. While RLS allows SELECT where `deleted_at IS NULL`, it doesn't check status. The test creates records with `status: 'published'`, but if RLS or the query doesn't enforce this, the API might not return the data.

**Hypothesis 2: Timing Issue**
Possible replication delay between data creation and API call, though less likely given the 2-second wait.

**Hypothesis 3: RLS Policy Too Restrictive**
The RLS policy might be checking additional conditions beyond `deleted_at IS NULL` that aren't being met.

## Component Behavior

**File**: `components/guest/GuestReferencePreview.tsx`

The component handles API failures gracefully:
```typescript
if (!response.ok) {
  console.error('Failed to fetch reference details:', response.status, response.statusText);
  setDetails({
    name: reference.name || 'Unknown',
    description: 'Details could not be loaded',
  });
  return;
}
```

This is why the test sees "Details could not be loaded" - the API is returning a non-200 response.

## Solution Options

### Option 1: Add Status Filter to API (RECOMMENDED)
**Pros**:
- Explicit filtering ensures only published content is shown
- Aligns with guest view expectations
- No RLS policy changes needed

**Changes**:
```typescript
// In each case statement, add .eq('status', 'published')
case 'event': {
  const { data: event, error } = await supabase
    .from('events')
    .select('...')
    .eq('id', id)
    .eq('status', 'published')  // ADD THIS
    .single();
}
```

### Option 2: Update RLS Policies
**Pros**:
- Enforces status check at database level
- Applies to all queries, not just this API

**Cons**:
- Requires migration
- Affects all anon queries
- More complex to test

### Option 3: Create Dedicated Guest API Endpoint
**Pros**:
- Clear separation between admin and guest APIs
- Can have different logic/filtering

**Cons**:
- Code duplication
- More maintenance
- Overkill for this issue

## Recommended Fix

**Add explicit status filtering to the API endpoint**:

1. Update `app/api/admin/references/[type]/[id]/route.ts`
2. Add `.eq('status', 'published')` to event and activity queries
3. Add `.eq('status', 'published')` to content_page query
4. Accommodations don't have status, so no change needed

This ensures the guest view only shows published content, which is the expected behavior.

## Test Verification Steps

After applying the fix:

1. Run the specific test:
   ```bash
   npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"
   ```

2. Verify the API returns 200 with data:
   - Check browser console for API response
   - Verify no "Details could not be loaded" text
   - Confirm expanded details show event/activity information

3. Run full suite to ensure no regressions:
   ```bash
   npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts
   ```

## Next Steps

1. Apply Option 1 fix (add status filters)
2. Run test to verify
3. If still failing, add debug logging to API to see actual error
4. Consider adding RLS policy updates as a follow-up improvement
