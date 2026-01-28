---
inclusion: fileMatch
fileMatchPattern: ['**/api/**/*.ts', '**/api/**/*.tsx']
---

# API Standards

Mandatory patterns for Next.js API routes. Follow these rules exactly when creating or modifying API endpoints.

## Mandatory 4-Step Pattern

EVERY API route MUST follow this exact sequence:

1. **Authentication** - Verify session with Supabase (skip only for public routes)
2. **Validation** - Parse and validate with Zod `safeParse()` (NEVER `parse()`)
3. **Service Call** - Delegate ALL business logic to service layer
4. **Response** - Map error codes to HTTP status, return consistent JSON

### Complete Template

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { schema } from '@/schemas';
import { service } from '@/services/service';

export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATION (skip for public routes only)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. VALIDATION (ALWAYS use safeParse, NEVER parse)
    const body = await request.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 3. SERVICE CALL (NO business logic in route)
    const result = await service.method(validation.data);
    
    // 4. RESPONSE (map error codes to status)
    if (!result.success) {
      return NextResponse.json(result, { status: getStatusCode(result.error.code) });
    }
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('API Error:', { path: request.url, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

## HTTP Method Rules

**GET** - Retrieve data (idempotent, no side effects)
- Use query params, NOT body
- Status: 200 (success), 404 (not found), 401 (unauthorized)

**POST** - Create resources
- Status: 201 (created), 400 (validation), 401 (unauthorized)

**PUT** - Full resource replacement
- Status: 200 (success), 404 (not found), 400 (validation)

**PATCH** - Partial updates
- Status: 200 (success), 404 (not found), 400 (validation)

**DELETE** - Remove resources
- Status: 200 (success), 404 (not found), 401 (unauthorized)

## Request Data Patterns

### Query Parameters (GET only)

```typescript
const { searchParams } = new URL(request.url);
const validation = querySchema.safeParse({
  groupId: searchParams.get('groupId'),
  page: parseInt(searchParams.get('page') || '1'),
  limit: parseInt(searchParams.get('limit') || '50'),
});
```

### Request Body (POST/PUT/PATCH)

```typescript
const body = await request.json();
const validation = bodySchema.safeParse(body);
```

### Path Parameters (Dynamic routes)

```typescript
// /api/guests/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const validation = z.string().uuid().safeParse(params.id);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
      { status: 400 }
    );
  }
  // ...
}
```

## Authentication

### Standard Auth Check (REQUIRED for protected routes)

```typescript
const supabase = createRouteHandlerClient({ cookies });
const { data: { session }, error: authError } = await supabase.auth.getSession();

if (authError || !session) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  );
}
```

### Admin Role Verification

```typescript
// After standard auth check
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
    { status: 403 }
  );
}
```

### Public Routes (skip auth)

Only skip authentication for:
- `/api/auth/*` - Authentication endpoints
- `/api/public/*` - Explicitly public data
- Health/status checks

## Error Code → HTTP Status Mapping

CRITICAL: Use this exact mapping function:

```typescript
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    // 400 - Bad Request
    'VALIDATION_ERROR': 400,
    'INVALID_INPUT': 400,
    'MISSING_REQUIRED_FIELD': 400,
    'INVALID_FORMAT': 400,
    
    // 401 - Unauthorized
    'UNAUTHORIZED': 401,
    'INVALID_CREDENTIALS': 401,
    'SESSION_EXPIRED': 401,
    'AUTHENTICATION_REQUIRED': 401,
    
    // 403 - Forbidden
    'FORBIDDEN': 403,
    'INSUFFICIENT_PERMISSIONS': 403,
    'ACCESS_DENIED': 403,
    
    // 404 - Not Found
    'NOT_FOUND': 404,
    'GUEST_NOT_FOUND': 404,
    'ACTIVITY_NOT_FOUND': 404,
    'PHOTO_NOT_FOUND': 404,
    'EVENT_NOT_FOUND': 404,
    
    // 409 - Conflict
    'CONFLICT': 409,
    'DUPLICATE_ENTRY': 409,
    'DUPLICATE_EMAIL': 409,
    'CAPACITY_EXCEEDED': 409,
    'ALREADY_EXISTS': 409,
    
    // 429 - Too Many Requests
    'RATE_LIMIT_EXCEEDED': 429,
    
    // 500 - Internal Server Error
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
    
    // 502/503 - Service Unavailable
    'EXTERNAL_SERVICE_ERROR': 502,
    'STORAGE_UNAVAILABLE': 503,
    'EMAIL_SERVICE_ERROR': 503,
  };
  
  return statusMap[errorCode] || 500;
}
```

## Response Format

### Success Responses

```typescript
// Single resource (POST/PUT/PATCH)
{ success: true, data: { id: "uuid", firstName: "John", /* ... */ } }

// Collection (GET with pagination)
{
  success: true,
  data: [{ id: "uuid-1", /* ... */ }, { id: "uuid-2", /* ... */ }],
  pagination: { page: 1, limit: 50, total: 150, totalPages: 3 }
}
```

### Error Responses

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request data",
    details: [{ path: ["email"], message: "Invalid email format" }]
  }
}
```

## Validation Examples

### Body Validation

```typescript
import { createGuestSchema } from '@/schemas';

const body = await request.json();
const validation = createGuestSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
    { status: 400 }
  );
}

const result = await guestService.create(validation.data);
```

### Query Validation

```typescript
import { z } from 'zod';

const querySchema = z.object({
  groupId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const { searchParams } = new URL(request.url);
const validation = querySchema.safeParse({
  groupId: searchParams.get('groupId'),
  page: parseInt(searchParams.get('page') || '1'),
  limit: parseInt(searchParams.get('limit') || '50'),
  sortBy: searchParams.get('sortBy'),
  order: searchParams.get('order'),
});
```

## Pagination

Standard pagination constants and pattern:

```typescript
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  // ... auth check ...
  
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE)));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));
  
  const result = await service.list({ page, limit });
  
  if (!result.success) {
    return NextResponse.json(result, { status: getStatusCode(result.error.code) });
  }
  
  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    }
  });
}
```

## File Uploads

Handle multipart form data with validation:

```typescript
export async function POST(request: Request) {
  // ... auth check ...
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const metadata = formData.get('metadata') as string;
  
  // Validate file presence
  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
      { status: 400 }
    );
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid file type' } },
      { status: 400 }
    );
  }
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File too large' } },
      { status: 400 }
    );
  }
  
  // Validate metadata
  const metadataValidation = photoMetadataSchema.safeParse(JSON.parse(metadata));
  if (!metadataValidation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid metadata', details: metadataValidation.error.issues } },
      { status: 400 }
    );
  }
  
  // Delegate to service
  const result = await photoService.upload(file, metadataValidation.data);
  return NextResponse.json(result, { status: result.success ? 201 : getStatusCode(result.error.code) });
}
```

## Rate Limiting

Apply rate limits to prevent abuse:

```typescript
import { rateLimitService } from '@/lib/rateLimitService';

export async function POST(request: Request) {
  // ... auth check ...
  
  const identifier = session.user.id;
  const rateLimitResult = await rateLimitService.check(identifier, 'api:guests:create', {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  });
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'RATE_LIMIT_EXCEEDED', 
          message: 'Too many requests',
          details: { retryAfter: rateLimitResult.retryAfter }
        } 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'Retry-After': String(rateLimitResult.retryAfter),
        }
      }
    );
  }
  
  // ... continue with request ...
}
```

## Webhooks

Verify webhook signatures before processing:

```typescript
import { verifyWebhookSignature } from '@/lib/webhookUtils';

export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-signature');
  const body = await request.text();
  
  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } },
      { status: 401 }
    );
  }
  
  const payload = JSON.parse(body);
  const validation = webhookSchema.safeParse(payload);
  
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload' } },
      { status: 400 }
    );
  }
  
  await webhookService.process(validation.data);
  
  // ALWAYS return 200 for webhooks (even on processing errors)
  return NextResponse.json({ received: true }, { status: 200 });
}
```

## Error Handling

### Wrap in try-catch

```typescript
export async function POST(request: Request) {
  try {
    // ... auth, validation, service call ...
    
  } catch (error) {
    console.error('API Error:', { path: request.url, method: request.method, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

### NEVER expose sensitive information

```typescript
// ❌ WRONG - Exposes internals
return NextResponse.json({ error: error.message }, { status: 500 });

// ✅ CORRECT - Generic message
return NextResponse.json(
  { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
  { status: 500 }
);
```

## Route Organization

### File Structure

```
src/app/api/
├── guests/
│   ├── route.ts              # GET /api/guests, POST /api/guests
│   ├── [id]/
│   │   ├── route.ts          # GET/PUT/DELETE /api/guests/[id]
│   │   └── rsvp/route.ts     # PATCH /api/guests/[id]/rsvp
│   ├── import/route.ts       # POST /api/guests/import
│   └── export/route.ts       # GET /api/guests/export
```

### Naming Conventions

- Lowercase with hyphens: `/api/activity-rsvps`
- Plural for collections: `/api/guests`
- Singular for specific: `/api/guests/[id]`
- Verbs for actions: `/api/guests/import`, `/api/email/send`

## Testing

Test all paths: success, validation error, auth error, service error.

```typescript
import { POST } from '@/app/api/guests/route';
import { createMockRequest } from '@/test-utils/mockRequest';

describe('POST /api/guests', () => {
  it('should create guest and return 201 when authenticated with valid data', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', groupId: '123e4567-e89b-12d3-a456-426614174000', ageType: 'adult', guestType: 'wedding_guest' },
      authenticated: true,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
  
  it('should return 400 when validation fails', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { firstName: 'John' },
      authenticated: true,
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 when not authenticated', async () => {
    const request = createMockRequest({ method: 'POST', body: {}, authenticated: false });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

## Critical Rules

### ALWAYS Do

✅ Verify authentication (except public routes)
✅ Use Zod `safeParse()` - NEVER `parse()`
✅ Delegate business logic to service layer
✅ Map error codes to correct HTTP status
✅ Wrap in try-catch with generic error response
✅ Return consistent `{ success, data/error }` format
✅ Validate ALL inputs (body, query, path params)
✅ Test all paths (success, validation, auth, service errors)

### NEVER Do

❌ Skip authentication checks on protected routes
❌ Use `schema.parse()` (throws errors)
❌ Put business logic in API routes
❌ Return wrong HTTP status codes
❌ Expose internal errors to clients
❌ Skip input validation
❌ Return inconsistent response formats
❌ Forget error handling with try-catch

## Quick Checklist

When creating/modifying an API route:

- [ ] Authentication check at top (or explicitly public)
- [ ] Request validation with Zod `safeParse()`
- [ ] Service layer handles ALL business logic
- [ ] Error codes mapped to HTTP status with `getStatusCode()`
- [ ] Consistent response format (`success`, `data`/`error`)
- [ ] Try-catch with generic error message
- [ ] No sensitive info in error responses
- [ ] Tests for success, validation error, auth error, service error
