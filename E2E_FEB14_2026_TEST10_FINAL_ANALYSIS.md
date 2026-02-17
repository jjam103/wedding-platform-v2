# E2E Test #10 Final Analysis - Root Cause Found

## The Real Issue

After analyzing the RLS policies and API code, I've identified the root cause:

### RLS Policy (Correct)
```sql
CREATE POLICY "Guests can view events" 
ON events FOR SELECT 
USING (deleted_at IS NULL);
```

This policy allows anon users to SELECT events where `deleted_at IS NULL`. ✅ This is correct.

### API Filter (Correct)
```typescript
.eq('id', id)
.eq('status', 'published')
.single();
```

The API filters by both ID and status. ✅ This is correct.

### Test Data (Correct)
```typescript
status: 'published',
```

The test creates events/activities with published status. ✅ This is correct.

## Why It's Still Failing

The issue is likely one of these:

### Hypothesis 1: E2E Database Missing RLS Policies
The E2E database might not have the RLS policies applied. The migration `048_add_soft_delete_columns.sql` adds the "Guests can view events" policy, but if this migration wasn't applied to the E2E database, anon users can't access events at all.

**Solution**: Verify E2E database has the RLS policies applied.

### Hypothesis 2: Location Join Failing
The API joins with `locations(name)`:
```typescript
.select('id, name, slug, status, start_date, end_date, description, event_type, location_id, locations(name)')
```

If the `locations` table has RLS that blocks anon access, the entire query fails.

**Solution**: Check if locations table has anon SELECT policy.

### Hypothesis 3: Test Data Has `deleted_at` Set
If the test data accidentally has `deleted_at` set to a non-NULL value, the RLS policy will block it.

**Solution**: Verify test data has `deleted_at = NULL`.

## Debug Logging Added

I added console.log to the API:
```typescript
console.log('[API] Fetching event:', { id, status: 'published' });
const { data: event, error } = await supabase...
console.log('[API] Event fetch result:', { event, error });
```

This will show us:
1. What ID is being queried
2. Whether the query returns data or an error
3. What the actual error message is

## Next Action

Run the test again and check the Next.js server console output for the debug logs. This will tell us exactly why the query is failing.

If the logs show:
- **"Event fetch result: { event: null, error: {...} }"** → RLS is blocking or data doesn't exist
- **"Event fetch result: { event: {...}, error: null }"** → API is working, issue is elsewhere

## Most Likely Root Cause

Based on the evidence, the most likely issue is:

**The `locations` table doesn't have an RLS policy allowing anon SELECT**, causing the join to fail and the entire query to return no results.

### Verification

Check if this policy exists:
```sql
CREATE POLICY "Guests can view locations" 
ON locations FOR SELECT 
USING (deleted_at IS NULL);
```

If not, we need to either:
1. Add this policy to allow anon access to locations
2. Remove the locations join from the API query
3. Make the locations join optional (LEFT JOIN)

## Recommended Fix

If locations RLS is the issue, add this migration:
```sql
-- Allow anon users to view locations
DROP POLICY IF EXISTS "Guests can view locations" ON locations;
CREATE POLICY "Guests can view locations" 
ON locations FOR SELECT 
USING (deleted_at IS NULL);
```

Or modify the API to not join locations:
```typescript
.select('id, name, slug, status, start_date, end_date, description, event_type, location_id')
// Remove: locations(name)
```

Then fetch location separately if needed, or just return the location_id.
