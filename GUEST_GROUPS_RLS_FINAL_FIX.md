# Guest Groups RLS - Final Fix

## Problem
Even after applying RLS policies, users still got the error:
```
new row violates row-level security policy for table "groups"
```

## Root Cause
The `groupService.ts` was creating its own Supabase client using the anon key:
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

This client had NO authentication context - it was anonymous. The RLS policies check for authenticated users, but the service was making requests as an anonymous user.

**Why this happened**: The service was following an old pattern of creating a standalone client instead of receiving an authenticated client from the API route.

## Solution
Changed the service to accept an authenticated Supabase client as a parameter, just like the API routes do.

### Changes Made

#### 1. Updated `services/groupService.ts`
**Before**:
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function create(data: CreateGroupDTO): Promise<Result<Group>> {
  // Uses anonymous client
  const { data: result } = await supabase.from('groups').insert(...)
}
```

**After**:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export async function create(supabase: SupabaseClient, data: CreateGroupDTO): Promise<Result<Group>> {
  // Uses authenticated client passed from API route
  const { data: result } = await supabase.from('groups').insert(...)
}
```

**All functions updated**:
- `create(supabase, data)` - was `create(data)`
- `get(supabase, id)` - was `get(id)`
- `list(supabase)` - was `list()`
- `update(supabase, id, data)` - was `update(id, data)`
- `deleteGroup(supabase, id)` - was `deleteGroup(id)`

#### 2. Updated API Routes
**`app/api/admin/guest-groups/route.ts`**:
```typescript
export async function GET(request: Request) {
  const supabase = await createAuthenticatedClient(); // ✅ Has user auth
  const result = await groupService.list(supabase); // ✅ Pass authenticated client
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedClient(); // ✅ Has user auth
  const result = await groupService.create(supabase, validation.data); // ✅ Pass authenticated client
}
```

**`app/api/admin/guest-groups/[id]/route.ts`**:
```typescript
export async function GET(request: Request, { params }) {
  const supabase = await createAuthenticatedClient();
  const result = await groupService.get(supabase, params.id);
}

export async function PUT(request: Request, { params }) {
  const supabase = await createAuthenticatedClient();
  const result = await groupService.update(supabase, params.id, validation.data);
}

export async function DELETE(request: Request, { params }) {
  const supabase = await createAuthenticatedClient();
  const result = await groupService.deleteGroup(supabase, params.id);
}
```

## Why This Works

### Authentication Flow
1. **User makes request** → Browser sends cookies with auth token
2. **API route receives request** → `createAuthenticatedClient()` creates client with user's auth
3. **Service receives authenticated client** → All database operations use user's auth context
4. **RLS policies check auth** → Policies see authenticated user, allow operation ✅

### Before (BROKEN)
```
User Request → API Route (authenticated) → Service (anonymous client) → Database (RLS denies)
                                              ❌ Lost authentication here!
```

### After (FIXED)
```
User Request → API Route (authenticated) → Service (same authenticated client) → Database (RLS allows)
                                              ✅ Authentication preserved!
```

## Files Modified

1. **`services/groupService.ts`**
   - Removed standalone Supabase client creation
   - Added `supabase: SupabaseClient` parameter to all functions
   - Functions now use the authenticated client passed from API routes

2. **`app/api/admin/guest-groups/route.ts`**
   - Updated `list(supabase)` call
   - Updated `create(supabase, data)` call

3. **`app/api/admin/guest-groups/[id]/route.ts`**
   - Updated `get(supabase, id)` call
   - Updated `update(supabase, id, data)` call
   - Updated `deleteGroup(supabase, id)` call

## Testing Checklist

- [ ] Navigate to `/admin/guests`
- [ ] Click "Manage Groups" to expand
- [ ] Fill in group name (e.g., "Smith Family")
- [ ] Click "Create Group"
- [ ] **Should work without RLS error!** ✅
- [ ] Group appears in list below
- [ ] Edit a group - should save successfully
- [ ] Delete an empty group - should work
- [ ] Try to delete group with guests - should show error message

## Key Learnings

### ❌ WRONG Pattern (Anonymous Client)
```typescript
// In service file
const supabase = createClient(url, anonKey);

export async function create(data) {
  await supabase.from('table').insert(data); // ❌ No auth context
}
```

### ✅ CORRECT Pattern (Authenticated Client)
```typescript
// In service file
export async function create(supabase: SupabaseClient, data) {
  await supabase.from('table').insert(data); // ✅ Has auth context
}

// In API route
const supabase = await createAuthenticatedClient();
await service.create(supabase, data);
```

## Why RLS Policies Alone Weren't Enough

The RLS policies were correct:
```sql
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT TO authenticated WITH CHECK (true);
```

But the service was using an **anonymous** client, not an **authenticated** client. The policy checks for `authenticated` role, but the service was making requests with `anon` role.

**Solution**: Pass the authenticated client from the API route (which has the user's session) to the service.

## Prevention for Future Services

When creating new services:
1. ✅ **DO**: Accept `supabase: SupabaseClient` as first parameter
2. ✅ **DO**: Pass authenticated client from API routes
3. ❌ **DON'T**: Create standalone Supabase client in service
4. ❌ **DON'T**: Use `createClient(url, anonKey)` in services

## Success Criteria

✅ Users can create groups without RLS errors
✅ Service uses authenticated Supabase client
✅ RLS policies properly enforce security
✅ All CRUD operations work correctly
✅ Authentication context preserved throughout request chain

## Related Documentation

- [Supabase RLS with Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Client Types](https://supabase.com/docs/reference/javascript/typescript-support)
