---
inclusion: always
---

# Code Conventions

Mandatory standards for all code generation and modifications. These patterns are non-negotiable.

## Critical Architecture Patterns

### Result Type Pattern (MANDATORY)
ALL service methods MUST return `Result<T>` and NEVER throw errors:

```typescript
type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: { code: string; message: string; details?: any } };
```

### 3-Step Service Method Pattern (MANDATORY)
Every service method follows this exact structure:

1. **Validate** with Zod `safeParse()` (never `parse()`)
2. **Sanitize** user input with DOMPurify
3. **Execute** database operation with Supabase query builder

Return standard error codes: `VALIDATION_ERROR`, `DATABASE_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `EXTERNAL_SERVICE_ERROR`, `UNKNOWN_ERROR`

### Service Method Template
```typescript
export async function methodName(data: InputDTO): Promise<Result<OutputType>> {
  try {
    // 1. Validate
    const validation = schema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Validation failed', 
          details: validation.error.issues 
        } 
      };
    }
    
    // 2. Sanitize user input
    const sanitized = { 
      ...validation.data, 
      field: sanitizeInput(validation.data.field) 
    };
    
    // 3. Database operation
    const { data: result, error } = await supabase
      .from('table')
      .insert(sanitized)
      .select()
      .single();
    
    if (error) {
      return { 
        success: false, 
        error: { code: 'DATABASE_ERROR', message: error.message, details: error } 
      };
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      } 
    };
  }
}
```

## TypeScript Standards

### Type Safety (MANDATORY)
- Explicit return types on ALL exported functions
- Explicit types on ALL function parameters
- Use `unknown` instead of `any`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Infer types only for obvious local variables

### Interface vs Type
- `interface` → Object shapes, public APIs, extensible models
- `type` → Unions, intersections, mapped types, utility types

## React & Next.js Patterns

### Component Requirements (MANDATORY)
- Export named functions: `export function Name()` NOT `export const Name = ()`
- Define props interface above component with explicit types
- File organization: imports → types → component → handlers → JSX
- Default to Server Components (no `'use client'` unless needed)

Add `'use client'` ONLY when component:
- Uses React hooks (useState, useEffect, useContext)
- Handles browser events (onClick, onChange, onSubmit)
- Uses browser APIs (window, document, localStorage)

### Component Template
```typescript
import { useState, useCallback } from 'react';
import type { DataType } from '@/types/dataContracts';

interface ComponentProps {
  data: DataType;
  onAction: (id: string) => void;
}

export function ComponentName({ data, onAction }: ComponentProps) {
  const [state, setState] = useState<StateType>(initialState);
  
  const handleAction = useCallback(() => {
    onAction(data.id);
  }, [data.id, onAction]);
  
  return <div>{/* JSX */}</div>;
}
```

### Custom Hooks Pattern (MANDATORY)
- Explicit return type interface
- Include `loading`, `error`, `data` states
- `useCallback` for returned functions
- ALL dependencies in dependency arrays

```typescript
interface UseDataReturn {
  data: DataType[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useData(id: string): UseDataReturn {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await service.get(id);
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(new Error(result.error.message));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => { refetch(); }, [refetch]);
  
  return { data, loading, error, refetch };
}
```

## API Routes Pattern

### API Route Template (MANDATORY)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Auth check
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  // 2. Parse and validate
  const body = await request.json();
  const validation = schema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: validation.error.issues } },
      { status: 400 }
    );
  }
  
  // 3. Call service
  const result = await service.method(validation.data);
  
  // 4. Return response with proper status
  return NextResponse.json(result, { status: result.success ? 201 : 500 });
}
```

### HTTP Status Code Mapping
- 200/201: Success
- 400: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- 401: `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `SESSION_EXPIRED`
- 403: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`
- 404: `NOT_FOUND`, `GUEST_NOT_FOUND`, `EVENT_NOT_FOUND`
- 409: `CONFLICT`, `DUPLICATE_ENTRY`, `CAPACITY_EXCEEDED`
- 500: `INTERNAL_ERROR`, `DATABASE_ERROR`, `UNKNOWN_ERROR`
- 502/503: `EXTERNAL_SERVICE_ERROR`, `STORAGE_UNAVAILABLE`, `EMAIL_SERVICE_ERROR`

## Security (CRITICAL)

### Input Sanitization (MANDATORY)
ALWAYS sanitize user input before storage using DOMPurify:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Plain text - no HTML allowed
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

// Rich text - safe HTML only
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
```

### SQL Injection Prevention (MANDATORY)
- ALWAYS use Supabase query builder (auto-parameterized)
- NEVER concatenate user input into SQL strings

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('guests')
  .select('*')
  .eq('email', userEmail);

// ❌ NEVER DO THIS
const query = `SELECT * FROM guests WHERE email = '${userEmail}'`;
```

### Authentication (MANDATORY)
ALWAYS verify authentication in protected API routes:

```typescript
const supabase = createRouteHandlerClient({ cookies });
const { data: { session }, error } = await supabase.auth.getSession();

if (error || !session) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  );
}
```

## Data Validation with Zod

### Schema Patterns (MANDATORY)
- Define schemas in `src/schemas/`
- ALWAYS use `safeParse()` - NEVER `parse()` (throws errors)
- Derive types with `z.infer<typeof schema>`
- Create update schemas with `.partial()`

```typescript
import { z } from 'zod';

export const createGuestSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().nullable(),
  ageType: z.enum(['adult', 'child', 'senior']),
  guestType: z.enum(['wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only']),
  groupId: z.string().uuid(),
});

export const updateGuestSchema = createGuestSchema.partial();
export type CreateGuestDTO = z.infer<typeof createGuestSchema>;
```

## Service Method Naming

### CRUD Operations (exact names)
- `create` → Create single entity
- `get` → Get single entity by ID
- `update` → Update single entity
- `delete` → Delete single entity
- `list` → Get multiple entities with filters
- `search` → Search entities with query

### Business Logic
Verb + noun pattern: `calculateBudget`, `generateManifest`, `sendReminder`

## Performance Optimization

### Database Queries
- Select specific fields instead of `*` when possible
- Use pagination (default: 50 items/page)
- Ensure indexes on frequently queried fields

```typescript
// Select specific fields
const { data } = await supabase
  .from('guests')
  .select('id, first_name, last_name, email')
  .eq('group_id', groupId);

// Pagination
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;
const { data, count } = await supabase
  .from('guests')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### React Performance
- `useMemo` for expensive computations
- `useCallback` for callbacks passed to children
- Dynamic imports for heavy components

```typescript
const sortedGuests = useMemo(() => 
  guests.sort((a, b) => a.lastName.localeCompare(b.lastName)),
  [guests]
);

const handleEdit = useCallback((id: string) => setEditingId(id), []);

const PhotoGallery = dynamic(() => import('@/components/PhotoGallery'), {
  loading: () => <PhotoGallerySkeleton />,
  ssr: false,
});
```

## Naming Conventions

### Files
- Components: `GuestCard.tsx` (PascalCase)
- Services: `guestService.ts` (camelCase + Service suffix)
- Utilities: `sanitization.ts` (camelCase)
- Types: `dataContracts.ts` (camelCase)
- Tests: `guestService.test.ts` (match source + .test)
- API Routes: `/activities-overview` (lowercase-with-hyphens)

### Code Identifiers
- Interfaces/Types: `GuestData`, `RSVPStatus` (PascalCase)
- Functions: `createGuest`, `sanitizeInput` (camelCase)
- Constants: `ERROR_CODES`, `MAX_PAGE_SIZE` (UPPER_SNAKE_CASE)
- Components: `GuestCard`, `PhotoGallery` (PascalCase)
- Variables: `guestData`, `isLoading` (camelCase)

## Documentation Requirements

### JSDoc for Exported Functions (MANDATORY)
```typescript
/**
 * Creates a new guest in the system.
 * 
 * @param data - Guest data including name, email, and group assignment
 * @returns Result containing the created guest or error details
 * 
 * @example
 * const result = await guestService.create({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   groupId: '123e4567-e89b-12d3-a456-426614174000',
 *   ageType: 'adult',
 *   guestType: 'wedding_guest',
 * });
 */
export async function create(data: CreateGuestDTO): Promise<Result<Guest>> {
  // Implementation
}
```

### Inline Comments
- Explain WHY, not WHAT
- Use only for non-obvious business logic
- Avoid stating the obvious

## Critical Anti-Patterns (NEVER DO)

### Type Safety
- ❌ Using `any` type
- ❌ Missing return types on exported functions
- ❌ Missing parameter types

### Service Layer
- ❌ Throwing errors instead of returning Result
- ❌ Skipping validation
- ❌ Skipping sanitization
- ❌ Raw SQL with string concatenation

### Security
- ❌ Missing auth checks in protected routes
- ❌ Not sanitizing user input
- ❌ SQL string concatenation with user input

### React
- ❌ Arrow function component exports
- ❌ Missing dependencies in hook arrays
- ❌ Unnecessary 'use client' directives
- ❌ Not memoizing callbacks passed to children

### Code Quality
- ❌ console.log in production code
- ❌ Commented-out code in commits
- ❌ Missing JSDoc on exported functions
- ❌ Heavy imports without dynamic()

## Implementation Checklists

### When Creating Service Methods
1. Return `Result<T>` (never throw)
2. Validate with Zod `safeParse()`
3. Sanitize user input with DOMPurify
4. Use Supabase query builder
5. Return standard error codes
6. Add JSDoc comments

### When Creating API Routes
1. Check auth with `getSession()`
2. Validate request body with Zod schema
3. Call service method
4. Return proper HTTP status (201, 400, 401, 500)
5. Use consistent error format

### When Creating Components
1. Use named function exports (NOT arrow)
2. Define explicit props interface
3. Default to Server Components
4. Place hooks at top of component
5. Use `useCallback` for event handlers passed to children
6. Use `useMemo` for expensive computations

### When Creating Custom Hooks
1. Define explicit return type interface
2. Include `loading`, `error`, `data` states
3. Use `useCallback` for returned functions
4. Include ALL dependencies in dependency arrays
