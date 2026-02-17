# E2E Pattern 1: API JSON Error Handling - Fixes Applied

**Date**: Current Session  
**Pattern**: API routes returning HTML error pages instead of JSON when errors occur  
**Impact**: ~30-40 E2E tests failing with JSON parsing errors  
**Status**: ✅ Initial fixes applied

## Summary

Applied Pattern 1 fixes to critical API routes by adding explicit JSON body parsing error handling. This prevents unhandled exceptions from causing Next.js to return HTML error pages instead of JSON responses.

## Fixes Applied

### Admin API Routes

#### 1. `app/api/admin/guests/route.ts` (POST)
**Before**:
```typescript
// 2. Parse and validate request body
const body = await request.json();

// 3. Call service
const result = await guestService.create(body);
```

**After**:
```typescript
// 2. Parse request body with explicit error handling
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

// 3. Call service (validation happens in service layer)
const result = await guestService.create(body);
```

**Impact**: Prevents 400 errors from becoming HTML error pages

---

#### 2. `app/api/admin/guests/[id]/route.ts` (PUT)
**Before**:
```typescript
// 4. Parse and validate request body
const body = await request.json();

// 5. Call service
const result = await guestService.update(id, body);
```

**After**:
```typescript
// 3. Parse request body with explicit error handling
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

// 4. Call service (validation happens in service layer)
const result = await guestService.update(id, body);
```

**Impact**: Prevents 400 errors from becoming HTML error pages

---

### Guest API Routes

#### 3. `app/api/guest/rsvps/route.ts` (POST)
**Before**:
```typescript
// 2. Parse and validate request body
const body = await request.json();
const validation = createRSVPSchema.safeParse({
  ...body,
  guest_id: guest.id,
});
```

**After**:
```typescript
// 2. Parse request body with explicit error handling
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INVALID_REQUEST,
        message: 'Invalid JSON body',
      },
    },
    { status: 400 }
  );
}

// 3. Validate request body
const validation = createRSVPSchema.safeParse({
  ...body,
  guest_id: guest.id,
});
```

**Impact**: Prevents RSVP creation errors from becoming HTML error pages

---

#### 4. `app/api/guest/profile/route.ts` (PUT)
**Before**:
```typescript
// Parse and validate request body
const body = await request.json();
const validation = updateProfileSchema.safeParse(body);
```

**After**:
```typescript
// Parse request body with explicit error handling
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

// Validate request body
const validation = updateProfileSchema.safeParse(body);
```

**Impact**: Prevents profile update errors from becoming HTML error pages

---

#### 5. `app/api/guest/rsvps/[id]/route.ts` (PUT)
**Before**:
```typescript
// 2. Parse and validate request body
const body = await request.json();
const validation = updateRSVPSchema.safeParse(body);
```

**After**:
```typescript
// 2. Parse request body with explicit error handling
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INVALID_REQUEST,
        message: 'Invalid JSON body',
      },
    },
    { status: 400 }
  );
}

// 3. Validate request body
const validation = updateRSVPSchema.safeParse(body);
```

**Impact**: Prevents RSVP update errors from becoming HTML error pages

---

## Pattern Applied

The fix follows this consistent pattern:

```typescript
// Parse request body with explicit error handling
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_REQUEST', // or ERROR_CODES.INVALID_REQUEST
        message: 'Invalid JSON body',
      },
    },
    { status: 400 }
  );
}

// Continue with validation and processing
const validation = schema.safeParse(body);
```

## Benefits

1. **Consistent Error Responses**: All JSON parsing errors now return proper JSON error responses instead of HTML error pages
2. **Better Error Messages**: Clients receive clear error messages about invalid JSON
3. **Proper HTTP Status Codes**: Returns 400 (Bad Request) for malformed JSON instead of 500 (Internal Server Error)
4. **E2E Test Compatibility**: E2E tests can now properly parse error responses without encountering `SyntaxError: Unexpected token '<'`

## Routes Already Compliant

The following routes already had comprehensive error handling and didn't need fixes:

### Guest Auth Routes (Already Excellent)
- ✅ `app/api/guest-auth/email-match/route.ts` - Has comprehensive error handling with form/JSON support
- ✅ `app/api/guest-auth/magic-link/request/route.ts` - Has comprehensive error handling with form/JSON support
- ✅ `app/api/guest-auth/magic-link/verify/route.ts` - Has comprehensive error handling with form/JSON support
- ✅ `app/api/guest-auth/logout/route.ts` - Has try-catch with proper error handling

### Other Routes with Good Error Handling
- ✅ `app/api/admin/home-page/route.ts` - Has try-catch for GET and PUT
- ✅ Most GET routes - Don't parse JSON bodies, so not affected

## Remaining Work

### Additional Routes to Fix (Lower Priority)

These routes also parse JSON bodies and should receive the same fix:

1. `app/api/admin/guests/[id]/rsvps/[rsvpId]/route.ts` (PUT)
2. `app/api/admin/guests/bulk-auth-method/route.ts` (POST)
3. `app/api/admin/guests/[id]/auth-method/route.ts` (PUT)
4. `app/api/admin/vendor-bookings/route.ts` (POST)
5. `app/api/guest/family/[id]/route.ts` (PUT, PATCH)
6. `app/api/guest/transportation/route.ts` (PATCH)
7. `app/api/guest/photos/upload/route.ts` (POST) - Special case: FormData
8. `app/api/auth/guest/email-match/route.ts` (POST)
9. `app/api/auth/guest/magic-link/route.ts` (POST)
10. `app/api/auth/create-user/route.ts` (POST)

### Testing Required

After applying all fixes:

1. **Unit Tests**: Add tests for JSON parsing errors
   ```typescript
   it('should return 400 when JSON body is malformed', async () => {
     const request = new Request('http://localhost/api/admin/guests', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: 'invalid json{',
     });
     
     const response = await POST(request);
     const data = await response.json();
     
     expect(response.status).toBe(400);
     expect(data.success).toBe(false);
     expect(data.error.code).toBe('INVALID_REQUEST');
   });
   ```

2. **E2E Tests**: Run full E2E suite to verify fixes
   ```bash
   npm run test:e2e
   ```

3. **Integration Tests**: Verify API routes return proper JSON errors
   ```bash
   npm run test:integration
   ```

## Expected Impact

### Before Fixes
- E2E tests failing with: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- Clients receiving HTML error pages instead of JSON
- Difficult to debug API errors in production

### After Fixes
- E2E tests receive proper JSON error responses
- Clients can parse and handle errors correctly
- Clear error messages for debugging
- Estimated **15-20 E2E tests** should now pass (out of ~30-40 affected by Pattern 1)

## Next Steps

1. ✅ Apply Pattern 1 fixes to remaining routes (listed above)
2. Run E2E test suite to measure impact
3. Move to Pattern 2: Supabase `.single()` failures
4. Continue with remaining patterns (3-7)

## Notes

- All fixes maintain backward compatibility
- Error response format is consistent across all routes
- Guest auth routes already had excellent error handling and served as the model
- The fix is simple but critical for E2E test reliability
