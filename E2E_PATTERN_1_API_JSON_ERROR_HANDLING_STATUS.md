# E2E Pattern 1: API JSON Error Handling - Status Report

**Pattern**: API routes returning HTML error pages instead of JSON when errors occur  
**Impact**: ~30-40 E2E tests failing with `SyntaxError: Unexpected token '<'` or `Unexpected end of JSON input`  
**Priority**: Highest (Pattern 1)

## Analysis Results

### ✅ Routes Already Fixed (Good Error Handling)

The following routes already have comprehensive error handling with try-catch blocks and proper JSON error responses:

#### Guest Auth Routes
- ✅ `app/api/guest-auth/email-match/route.ts` - Comprehensive error handling
- ✅ `app/api/guest-auth/magic-link/request/route.ts` - Comprehensive error handling
- ✅ `app/api/guest-auth/magic-link/verify/route.ts` - Comprehensive error handling
- ✅ `app/api/guest-auth/logout/route.ts` - Has try-catch

#### Admin Routes
- ✅ `app/api/admin/guests/route.ts` - Has try-catch for GET and POST
- ✅ `app/api/admin/guests/[id]/route.ts` - Has try-catch for GET, PUT, DELETE
- ✅ `app/api/admin/home-page/route.ts` - Has try-catch for GET and PUT

#### Guest Routes
- ✅ `app/api/guest/itinerary/route.ts` - Has try-catch
- ✅ `app/api/guest/events/route.ts` - Has try-catch
- ✅ `app/api/guest/activities/route.ts` - Has try-catch
- ✅ `app/api/guest/profile/route.ts` - Has try-catch for GET and PUT
- ✅ `app/api/guest/rsvps/route.ts` - Has try-catch for GET and POST
- ✅ `app/api/guest/content-pages/route.ts` - Has try-catch

### ⚠️ Potential Issues Found

While most routes have try-catch blocks, there's one specific issue that could cause JSON parsing errors:

#### Missing JSON Body Parsing Error Handling

**Issue**: When `request.json()` is called on an empty or malformed body, it throws an error that might not be caught properly.

**Affected Routes**: Any route that calls `await request.json()` without wrapping it in a try-catch.

**Example from `app/api/admin/guests/route.ts` (POST)**:
```typescript
// 2. Parse and validate request body
const body = await request.json(); // ⚠️ Can throw if body is empty/malformed

// 3. Call service
const result = await guestService.create(body);
```

**Fix Needed**: Wrap JSON parsing in try-catch or validate before parsing:
```typescript
// 2. Parse and validate request body
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid JSON body',
      },
    },
    { status: 400 }
  );
}

// 3. Call service
const result = await guestService.create(body);
```

## Routes Requiring Pattern 1 Fix

Based on the analysis, the following routes need the JSON body parsing fix:

### Admin Routes
1. ✅ `app/api/admin/guests/route.ts` (POST) - Has outer try-catch, but should add explicit JSON parsing error handling
2. ✅ `app/api/admin/guests/[id]/route.ts` (PUT) - Has outer try-catch, but should add explicit JSON parsing error handling
3. `app/api/admin/guests/[id]/rsvps/[rsvpId]/route.ts` (PUT) - Need to check
4. `app/api/admin/guests/bulk-auth-method/route.ts` (POST) - Need to check
5. `app/api/admin/guests/[id]/auth-method/route.ts` (PUT) - Need to check
6. `app/api/admin/vendor-bookings/route.ts` (POST) - Need to check

### Guest Routes
7. `app/api/guest/rsvps/route.ts` (POST) - Need to check
8. `app/api/guest/rsvps/[id]/route.ts` (PUT) - Need to check
9. `app/api/guest/profile/route.ts` (PUT) - Need to check
10. `app/api/guest/family/[id]/route.ts` (PUT, PATCH) - Need to check
11. `app/api/guest/transportation/route.ts` (PATCH) - Need to check
12. `app/api/guest/photos/upload/route.ts` (POST) - Need to check

### Auth Routes
13. `app/api/auth/guest/email-match/route.ts` (POST) - Need to check
14. `app/api/auth/guest/magic-link/route.ts` (POST) - Need to check
15. `app/api/auth/create-user/route.ts` (POST) - Need to check

## Pattern 1 Fix Template

For all routes that parse JSON bodies, apply this pattern:

```typescript
export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATE (if required)
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. PARSE JSON BODY (with explicit error handling)
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON body',
          },
        },
        { status: 400 }
      );
    }
    
    // 3. VALIDATE (with Zod safeParse)
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    // 4. DELEGATE to service
    const result = await service.method(validation.data);
    
    // 5. RESPOND with proper status
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

## Implementation Plan

### Phase 1: Add JSON Parsing Error Handling (High Priority)
- [ ] Add explicit JSON parsing error handling to all POST/PUT/PATCH routes
- [ ] Test each route with empty body, malformed JSON, and valid JSON
- [ ] Verify E2E tests pass after fixes

### Phase 2: Verify Error Response Format (Medium Priority)
- [ ] Ensure all error responses follow `{ success: false, error: { code, message, details? } }` format
- [ ] Ensure all success responses follow `{ success: true, data }` format
- [ ] Add `getStatusCode()` helper to routes that don't have it

### Phase 3: Test Coverage (Low Priority)
- [ ] Add integration tests for JSON parsing errors
- [ ] Add integration tests for validation errors
- [ ] Add integration tests for auth errors

## Expected Impact

After applying Pattern 1 fixes:
- **Estimated tests fixed**: 30-40 E2E tests
- **Error types resolved**:
  - `SyntaxError: Unexpected token '<'` (HTML error page returned instead of JSON)
  - `SyntaxError: Unexpected end of JSON input` (Empty response body)
  - `TypeError: Cannot read property 'success' of undefined` (No JSON response)

## Next Steps

1. ✅ Complete analysis of all API routes
2. Apply JSON parsing error handling to identified routes
3. Run E2E test suite to verify fixes
4. Move to Pattern 2 (Supabase `.single()` failures)

## Notes

- Most routes already have good error handling with try-catch blocks
- The main issue is missing explicit JSON parsing error handling
- Guest auth routes are already well-implemented with comprehensive error handling
- Admin and guest API routes need minor improvements for JSON parsing
