# E2E Test #10 Current Status - Guest View Reference Blocks

## Test Status
**STILL FAILING** after initial fix attempt

## What We've Done

### Fix Attempt #1: Add Status Filters
Added `.eq('status', 'published')` to the API endpoint for events, activities, and content pages.

**Result**: Test still fails with "Details could not be loaded"

## Current Findings

### Test Data Creation
The test correctly creates data with `status: 'published'`:
```typescript
// Event
status: 'published',

// Activity  
status: 'published',

// Content Page
status: 'published',
```

### API Endpoint
The API now filters by status:
```typescript
.eq('id', id)
.eq('status', 'published')
.single();
```

### Component Behavior
The component shows fallback text when API returns non-200:
```
"Details could not be loaded"
```

## Possible Root Causes

### 1. RLS Policy Blocking Anon Access
The RLS policies might be more restrictive than expected. Even though the API uses the anon key, RLS might be blocking access to published events/activities.

**Check**: Do RLS policies allow anon SELECT on events/activities where `status = 'published'`?

### 2. Missing `deleted_at IS NULL` in RLS
RLS policies check `deleted_at IS NULL`, but the test data might not have this field set correctly.

**Check**: Does test data have `deleted_at = NULL`?

### 3. Location Join Failing
The API joins with `locations(name)`, but if the location doesn't exist or RLS blocks it, the query might fail.

**Check**: Do events/activities have valid `location_id`? Do RLS policies allow anon access to locations?

### 4. Timing Issue
The API call happens immediately after data creation. There might be a replication delay.

**Check**: Add longer wait before navigating to guest view?

## Next Steps

### Step 1: Check Server Logs
Run the test again and check the Next.js server logs for the debug output we just added:
```
[API] Fetching event: { id: '...', status: 'published' }
[API] Event fetch result: { event: ..., error: ... }
```

### Step 2: Verify RLS Policies
Check if RLS policies allow anon SELECT on events/activities:
```sql
-- Check events RLS
SELECT * FROM pg_policies WHERE tablename = 'events';

-- Check activities RLS  
SELECT * FROM pg_policies WHERE tablename = 'activities';
```

### Step 3: Test API Directly
Use curl or browser to test the API endpoint directly:
```bash
curl http://localhost:3000/api/admin/references/event/{event-id}
```

### Step 4: Check Test Data
Verify the test data has correct fields:
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('id', testEventId)
  .single();
  
console.log('Event data:', data);
```

## Debug Logging Added

Added console.log statements to API endpoint to see:
1. What ID and status are being queried
2. What the Supabase query returns (data or error)

This will help us understand if:
- The query is being executed correctly
- RLS is blocking the query
- The data doesn't exist or doesn't match the filters

## Test Output Analysis

From the test run:
```
✓ References added to column
✓ Section data shows references correctly
✓ Navigating to guest view: /custom/test-page-ref-...
✓ Guest view page container loaded
✓ Page title visible
✓ References container visible
✓ Event reference card visible
✓ Activity reference card visible
✓ Clicked event reference card
✓ Event details expanded
→ Expanded details text: Loading details...
→ Expanded details text: DescriptionDetails could not be loaded
```

**Key Observation**: The reference cards appear with names, but when clicked, the API call fails and shows "Details could not be loaded".

This suggests:
1. The reference data in the column is correct (has name)
2. The guest view renders correctly
3. The API call to fetch full details is failing

## Hypothesis

The most likely issue is **RLS policies blocking anon access** to events/activities, even with `status = 'published'`.

The test uses a service client (bypasses RLS) to create data, but the guest view uses anon key (subject to RLS). If RLS doesn't allow anon SELECT on published events/activities, the API will return 404.

## Recommended Next Action

Check the RLS policies for events and activities tables to see if they allow anon SELECT where `status = 'published'` AND `deleted_at IS NULL`.

If not, we need to either:
1. Update RLS policies to allow anon access to published content
2. Use a different approach for guest view (authenticated client)
3. Create a dedicated guest API that uses service role but filters appropriately
