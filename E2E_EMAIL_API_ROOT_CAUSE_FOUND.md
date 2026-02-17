# E2E Email Management - Root Cause Found

## The Problem

The `/api/admin/emails` GET endpoint is returning 400 errors when called without query parameters, which is preventing the EmailComposer component from initializing properly.

## Root Cause

Looking at `app/api/admin/emails/route.ts`:

```typescript
const querySchema = z.object({
  template_id: z.string().uuid().optional(),
  recipient_email: z.string().email().optional(),
  delivery_status: z.enum(['queued', 'sent', 'delivered', 'failed', 'bounced']).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

const { searchParams } = new URL(request.url);
const validation = querySchema.safeParse({
  template_id: searchParams.get('template_id'),
  recipient_email: searchParams.get('recipient_email'),
  delivery_status: searchParams.get('delivery_status'),
  limit: searchParams.get('limit'),
});
```

### The Issue

When `searchParams.get()` returns `null` (no parameter provided), Zod validation fails because:

1. `z.string().uuid().optional()` expects either a valid UUID string OR undefined
2. But `searchParams.get()` returns `null` when the parameter is missing
3. Zod treats `null` as an invalid value (not the same as `undefined`)

### Example

```typescript
// What the code does:
{
  template_id: null,  // searchParams.get('template_id') when not provided
  recipient_email: null,
  delivery_status: null,
  limit: null
}

// What Zod expects:
{
  template_id: undefined,  // or a valid UUID string
  recipient_email: undefined,  // or a valid email string
  delivery_status: undefined,  // or a valid enum value
  limit: undefined  // or a valid number
}
```

## The Fix

Convert `null` to `undefined` before validation:

```typescript
const { searchParams } = new URL(request.url);
const validation = querySchema.safeParse({
  template_id: searchParams.get('template_id') ?? undefined,
  recipient_email: searchParams.get('recipient_email') ?? undefined,
  delivery_status: searchParams.get('delivery_status') ?? undefined,
  limit: searchParams.get('limit') ?? undefined,
});
```

Or use `.nullish()` instead of `.optional()`:

```typescript
const querySchema = z.object({
  template_id: z.string().uuid().nullish(),
  recipient_email: z.string().email().nullish(),
  delivery_status: z.enum(['queued', 'sent', 'delivered', 'failed', 'bounced']).nullish(),
  limit: z.coerce.number().int().positive().max(1000).nullish(),
});
```

## Why This Breaks the Tests

1. EmailComposer component calls `/api/admin/emails` on mount
2. API returns 400 because validation fails on `null` values
3. Component might not initialize properly or show errors
4. Guest dropdown never loads because component is in error state
5. `waitForSpecificGuests()` times out waiting for guests that never appear

## The Solution

### Option 1: Fix the API Route (Recommended)
Update `app/api/admin/emails/route.ts` to handle `null` values:

```typescript
const validation = querySchema.safeParse({
  template_id: searchParams.get('template_id') ?? undefined,
  recipient_email: searchParams.get('recipient_email') ?? undefined,
  delivery_status: searchParams.get('delivery_status') ?? undefined,
  limit: searchParams.get('limit') ?? undefined,
});
```

### Option 2: Update Schema to Accept Null
Change the schema to use `.nullish()`:

```typescript
const querySchema = z.object({
  template_id: z.string().uuid().nullish(),
  recipient_email: z.string().email().nullish(),
  delivery_status: z.enum(['queued', 'sent', 'delivered', 'failed', 'bounced']).nullish(),
  limit: z.coerce.number().int().positive().max(1000).nullish(),
});
```

### Option 3: Update EmailComposer
Make the component not call `/api/admin/emails` on mount, or handle the 400 error gracefully.

## Recommended Action

**Fix the API route** (Option 1) because:
1. It's the most correct solution - `searchParams.get()` returning `null` is expected behavior
2. It follows the pattern of converting `null` to `undefined` for optional parameters
3. It fixes the issue for all callers, not just EmailComposer
4. It's a one-line change per parameter

## Impact

After fixing this:
- `/api/admin/emails` will return 200 with empty results when called without parameters
- EmailComposer will initialize properly
- Guest dropdown will load correctly
- All 5 failing email tests should pass
- E2E pass rate increases from 54% to 92% for email management

## Files to Update

1. `app/api/admin/emails/route.ts` - Add `?? undefined` to all `searchParams.get()` calls

## Next Step

Apply the fix to the API route and re-run the tests.
