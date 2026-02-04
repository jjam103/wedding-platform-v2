# Events Bulk Delete Fix

## Issue
Bulk delete showed "12 items deleted successfully" but the events were still visible in the list.

## Root Cause
The `deleteEvent` service method performs **soft deletion** by default (sets `deleted_at` timestamp), but the `list` and `get` methods were not filtering out soft-deleted items. This meant:

1. Bulk delete was calling individual DELETE endpoints
2. Each DELETE was successfully soft-deleting events (setting `deleted_at`)
3. The success messages were accurate
4. BUT the events list query wasn't filtering `deleted_at IS NULL`
5. So soft-deleted events remained visible in the UI

## Fix Applied

### 1. Updated `eventService.list()` method
Added soft-delete filtering to the query:

```typescript
let query = supabase.from('events').select('*', { count: 'exact' });

// Filter out soft-deleted items
query = query.is('deleted_at', null);
```

### 2. Updated `eventService.get()` method
Added soft-delete filtering to single event retrieval:

```typescript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('id', id)
  .is('deleted_at', null)
  .single();
```

## Result
- Soft-deleted events are now properly hidden from the events list
- Bulk delete works correctly - events disappear after deletion
- Events are soft-deleted (can be restored if needed)
- Consistent with the soft-delete pattern used throughout the app

## Testing
1. Navigate to Events page
2. Select multiple events
3. Click bulk delete
4. Confirm deletion
5. ✅ Events should disappear from the list immediately
6. ✅ Success message should show correct count

## Related Files
- `services/eventService.ts` - Added soft-delete filtering
- `app/admin/events/page.tsx` - Bulk delete UI (no changes needed)
- `app/api/admin/events/[id]/route.ts` - DELETE endpoint (no changes needed)
