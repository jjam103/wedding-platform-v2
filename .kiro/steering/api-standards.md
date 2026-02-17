---
inclusion: fileMatch
fileMatchPattern: ['**/api/**/*.ts', '**/api/**/*.tsx']
---

# API Route Standards

Mandatory patterns for Next.js 16 App Router API routes. These rules are non-negotiable.

## The 4-Step Pattern (MANDATORY)

Every API route handler MUST follow this exact sequence:

1. **Authenticate** - Verify session (skip only for explicitly public routes)
2. **Validate** - Use Zod `safeParse()` on all inputs (NEVER `parse()`)
3. **Delegate** - Call service layer (NO business logic in routes)
4. **Respond** - Map error codes to HTTP status, return consistent JSON

### Standard Route Template

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createGuestSchema } from '@/schemas';
import { guestService } from '@/services/guestService';

export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. VALIDATE (safeParse ONLY)
    const body = await request.json();
    const validation = createGuestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data', 
            details: validation.error.issues 
          } 
        },
        { status: 400 }
      );
    }
    
    // 3. DELEGATE to service
    const result = await guestService.create(validation.data);
    
    // 4. RESPOND with proper status
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

## HTTP Method Guidelines

| Method | Purpose | Success Status | Common Errors |
|--------|---------|----------------|---------------|
| GET | Retrieve data | 200 | 401, 404 |
| POST | Create resource | 201 | 400, 401, 409 |
| PUT | Full replacement | 200 | 400, 401, 404 |
| PATCH | Partial update | 200 | 400, 401, 404 |
| DELETE | Remove resource | 200 | 401, 404, 409 |

**GET Rules:**
- Use query params, NOT body
- Idempotent (no side effects)
- Support pagination for collections

**POST Rules:**
- Return 201 on success
- Include created resource in response
- Return 409 for conflicts (duplicate email, etc.)

## Input Validation Patterns

### Request Body (POST/PUT/PATCH)
```typescript
const body = await request.json();
const validation = createGuestSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'VALIDATION_ERROR', 
        message: 'Invalid request data', 
        details: validation.error.issues 
      } 
    },
    { status: 400 }
  );
}

const result = await guestService.create(validation.data);
```

### Query Parameters (GET)
```typescript
import { z } from 'zod';

const querySchema = z.object({
  groupId: z.string().uuid(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const { searchParams } = new URL(request.url);
const validation = querySchema.safeParse({
  groupId: searchParams.get('groupId'),
  page: searchParams.get('page'),
  limit: searchParams.get('limit'),
  sortBy: searchParams.get('sortBy'),
  order: searchParams.get('order'),
});

if (!validation.success) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: validation.error.issues } },
    { status: 400 }
  );
}
```

### Path Parameters (Dynamic Routes)
```typescript
// File: /api/guests/[id]/route.ts
export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  // ... auth check ...
  
  const idValidation = z.string().uuid().safeParse(params.id);
  if (!idValidation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
      { status: 400 }
    );
  }
  
  const result = await guestService.get(idValidation.data);
  // ...
}
```

## Authentication Patterns

### Standard Protected Route
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

### Admin-Only Route
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

### Public Routes (No Auth)
Only skip authentication for:
- `/api/auth/*` - Authentication endpoints
- `/api/public/*` - Explicitly public data
- Health checks

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


## Response Format (MANDATORY)

All responses MUST use this exact structure:

### Success Response
```typescript
// Single resource (POST/PUT/PATCH)
{ success: true, data: { id: "uuid", firstName: "John", /* ... */ } }

// Collection (GET with pagination)
{
  success: true,
  data: [{ id: "uuid-1", /* ... */ }],
  pagination: { page: 1, limit: 50, total: 150, totalPages: 3 }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request data",
    details?: any  // Optional, for validation errors
  }
}
```


## Pagination (Standard Pattern)

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

## File Upload Pattern

```typescript
export async function POST(request: Request) {
  // ... auth check ...
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const metadataJson = formData.get('metadata') as string;
  
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
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Allowed: JPEG, PNG, WebP' } },
      { status: 400 }
    );
  }
  
  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum 10MB' } },
      { status: 400 }
    );
  }
  
  // Validate metadata
  const metadataValidation = photoMetadataSchema.safeParse(JSON.parse(metadataJson));
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

## Webhook Pattern

```typescript
import { verifyWebhookSignature } from '@/lib/webhookUtils';

export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-signature');
  const body = await request.text();
  
  // Verify signature
  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } },
      { status: 401 }
    );
  }
  
  // Validate payload
  const payload = JSON.parse(body);
  const validation = webhookSchema.safeParse(payload);
  
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload' } },
      { status: 400 }
    );
  }
  
  // Process webhook (async, don't wait)
  webhookService.process(validation.data).catch(error => {
    console.error('Webhook processing error:', error);
  });
  
  // ALWAYS return 200 immediately for webhooks
  return NextResponse.json({ received: true }, { status: 200 });
}
```

## Error Handling Rules

### Always Wrap in Try-Catch
```typescript
export async function POST(request: Request) {
  try {
    // ... auth, validation, service call ...
  } catch (error) {
    console.error('API Error:', { 
      path: request.url, 
      method: request.method, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

### NEVER Expose Sensitive Information
```typescript
// ❌ WRONG - Exposes internals
return NextResponse.json({ error: error.message }, { status: 500 });

// ❌ WRONG - Exposes database details
return NextResponse.json({ error: dbError.detail }, { status: 500 });

// ✅ CORRECT - Generic message, log details
console.error('Database error:', dbError);
return NextResponse.json(
  { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
  { status: 500 }
);
```

## Route Organization

### File Structure
```
app/api/
├── guests/
│   ├── route.ts              # GET /api/guests, POST /api/guests
│   ├── [id]/
│   │   ├── route.ts          # GET/PUT/DELETE /api/guests/[id]
│   │   └── rsvps/
│   │       └── route.ts      # GET/POST /api/guests/[id]/rsvps
│   ├── bulk-delete/
│   │   └── route.ts          # POST /api/guests/bulk-delete
│   └── export/
│       └── route.ts          # GET /api/guests/export
```

### Naming Conventions
- **Lowercase with hyphens**: `/api/activity-rsvps`
- **Plural for collections**: `/api/guests`, `/api/activities`
- **Singular for specific**: `/api/guests/[id]`
- **Verbs for actions**: `/api/guests/import`, `/api/email/send`
- **Nested resources**: `/api/guests/[id]/rsvps`

## Testing Requirements

Test ALL paths: success, validation error, auth error, service error.

```typescript
import { POST } from '@/app/api/guests/route';
import { createMockRequest } from '@/__tests__/helpers/testAuth';

describe('POST /api/guests', () => {
  it('should create guest and return 201 when authenticated with valid data', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { 
        firstName: 'John', 
        lastName: 'Doe', 
        email: 'john@example.com', 
        groupId: '123e4567-e89b-12d3-a456-426614174000', 
        ageType: 'adult', 
        guestType: 'wedding_guest' 
      },
      authenticated: true,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });
  
  it('should return 400 when validation fails', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { firstName: 'John' }, // Missing required fields
      authenticated: true,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 when not authenticated', async () => {
    const request = createMockRequest({ 
      method: 'POST', 
      body: {}, 
      authenticated: false 
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
  
  it('should return 500 when service fails', async () => {
    // Mock service to return error
    jest.spyOn(guestService, 'create').mockResolvedValue({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Database connection failed' }
    });
    
    const request = createMockRequest({
      method: 'POST',
      body: validGuestData,
      authenticated: true,
    });
    
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
```

## Critical Rules Summary

### ALWAYS Do ✅
- Verify authentication (except explicitly public routes)
- Use Zod `safeParse()` - NEVER `parse()`
- Delegate ALL business logic to service layer
- Map error codes to correct HTTP status with `getStatusCode()`
- Return consistent `{ success, data/error }` format
- Wrap in try-catch with generic error response
- Validate ALL inputs (body, query, path params)
- Test all paths (success, validation, auth, service errors)
- Log errors with context (path, method, error details)

### NEVER Do ❌
- Skip authentication checks on protected routes
- Use `schema.parse()` (throws errors, breaks error handling)
- Put business logic in API routes (belongs in services)
- Return wrong HTTP status codes
- Expose internal errors, stack traces, or database details to clients
- Skip input validation
- Return inconsistent response formats
- Forget error handling with try-catch
- Use service role client in routes (use authenticated client)

## Quick Checklist

Before committing an API route, verify:

- [ ] Authentication check at top (or route is explicitly public)
- [ ] All inputs validated with Zod `safeParse()`
- [ ] Service layer handles ALL business logic (route only orchestrates)
- [ ] Error codes mapped to HTTP status with `getStatusCode()`
- [ ] Consistent response format (`{ success, data/error }`)
- [ ] Try-catch wraps entire handler
- [ ] No sensitive info in error responses
- [ ] Tests cover: success, validation error, auth error, service error
- [ ] Proper HTTP method used (GET for read, POST for create, etc.)
- [ ] Pagination implemented for collection endpoints

## Common Patterns Reference

### Rate Limiting
```typescript
import { rateLimitService } from '@/lib/rateLimitService';

const rateLimitResult = await rateLimitService.check(session.user.id, 'api:guests:create', {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});

if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
    { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
  );
}
```

### Bulk Operations
```typescript
export async function POST(request: Request) {
  // ... auth check ...
  
  const body = await request.json();
  const validation = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100)
  }).safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid IDs', details: validation.error.issues } },
      { status: 400 }
    );
  }
  
  const result = await service.bulkDelete(validation.data.ids);
  return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
}
```

### Export/Download
```typescript
export async function GET(request: Request) {
  // ... auth check ...
  
  const result = await service.exportData();
  
  if (!result.success) {
    return NextResponse.json(result, { status: getStatusCode(result.error.code) });
  }
  
  return new NextResponse(result.data, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="guests.csv"',
    },
  });
}
```
