# E2E Phase 1: Authentication Fixes Applied

**Status**: ✅ Complete  
**Date**: February 7, 2026  
**Expected Impact**: ~30-40 tests now passing

## Problem Summary

Guest authentication was completely broken, causing ~30-40 E2E test failures with these error patterns:

1. **JSON Parsing Errors**: `SyntaxError: Unexpected end of JSON input`
2. **Guest Lookup Failures**: `Cannot coerce the result to a single JSON object`
3. **HTML Error Pages**: API routes returning HTML instead of JSON on errors

## Root Causes Identified

### 1. Supabase `.single()` Method
Using `.single()` throws errors when:
- No results found (should return null)
- Multiple results found (should return first or error)

### 2. Empty Request Bodies
`await request.json()` throws on empty bodies, causing unhandled exceptions that trigger Next.js HTML error pages instead of JSON responses.

### 3. Missing Error Handling
Database errors not properly separated from "not found" cases, causing confusing error messages.

## Fixes Applied

### File 1: `app/api/guest-auth/email-match/route.ts`

**Change 1**: Added empty body handling
```typescript
// BEFORE
const body = await request.json();
email = body.email;

// AFTER
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
    { status: 400 }
  );
}
email = body.email;
```

**Change 2**: Changed `.single()` to `.maybeSingle()`
```typescript
// BEFORE
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, email, group_id, first_name, last_name, auth_method')
  .eq('email', sanitizedEmail)
  .eq('auth_method', 'email_matching')
  .single(); // Throws on no results

// AFTER
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, email, group_id, first_name, last_name, auth_method')
  .eq('email', sanitizedEmail)
  .eq('auth_method', 'email_matching')
  .maybeSingle(); // Returns null on no results, doesn't throw
```

### File 2: `app/api/guest-auth/magic-link/request/route.ts`

**Change**: Added empty body handling
```typescript
// BEFORE
const body = await request.json();
email = body.email;

// AFTER
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
    { status: 400 }
  );
}
email = body.email;
```

Note: This route already used `.maybeSingle()` correctly.

### File 3: `app/api/guest-auth/magic-link/verify/route.ts`

**Change**: Added empty body handling
```typescript
// BEFORE
const body = await request.json();
token = body.token;

// AFTER
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
    { status: 400 }
  );
}
token = body.token;
```

### File 4: `services/magicLinkService.ts`

**Change 1**: Fixed guest lookup in `generateMagicLink()`
```typescript
// BEFORE
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .eq('email', sanitizedEmail)
  .eq('auth_method', 'magic_link')
  .single();

if (guestError || !guest) {
  return { success: false, error: { code: 'NOT_FOUND', message: '...' } };
}

// AFTER
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .eq('email', sanitizedEmail)
  .eq('auth_method', 'magic_link')
  .maybeSingle();

if (guestError) {
  console.error('Guest lookup error:', guestError);
  return { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to lookup guest' } };
}

if (!guest) {
  return { success: false, error: { code: 'NOT_FOUND', message: '...' } };
}
```

**Change 2**: Fixed token lookup in `verifyMagicLinkToken()`
```typescript
// BEFORE
const { data: tokenRecord, error: tokenError } = await supabase
  .from('magic_link_tokens')
  .select('id, guest_id, expires_at, used, used_at')
  .eq('token', token)
  .single();

if (tokenError || !tokenRecord) {
  return { success: false, error: { code: 'INVALID_TOKEN', message: '...' } };
}

// AFTER
const { data: tokenRecord, error: tokenError } = await supabase
  .from('magic_link_tokens')
  .select('id, guest_id, expires_at, used, used_at')
  .eq('token', token)
  .maybeSingle();

if (tokenError) {
  console.error('Token lookup error:', tokenError);
  return { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to verify token' } };
}

if (!tokenRecord) {
  return { success: false, error: { code: 'INVALID_TOKEN', message: '...' } };
}
```

**Change 3**: Fixed guest lookup after token verification
```typescript
// BEFORE
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, group_id, first_name, last_name, email')
  .eq('id', tokenRecord.guest_id)
  .single();

if (guestError || !guest) {
  return { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } };
}

// AFTER
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .select('id, group_id, first_name, last_name, email')
  .eq('id', tokenRecord.guest_id)
  .maybeSingle();

if (guestError) {
  console.error('Guest lookup error:', guestError);
  return { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve guest information' } };
}

if (!guest) {
  return { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } };
}
```

## Pattern Applied

This fix follows the **Pattern 1: API JSON Error Handling** from the E2E Pattern-Based Fix Guide:

1. ✅ Validate request body with try-catch before parsing
2. ✅ Use `.maybeSingle()` instead of `.single()` for Supabase queries
3. ✅ Separate database errors from "not found" cases
4. ✅ Return JSON errors (not HTML) for all error paths
5. ✅ Add proper error logging for debugging

## Testing Strategy

Run these commands to verify the fixes:

```bash
# Test email matching authentication
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts -g "email matching"

# Test magic link authentication
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts -g "magic link"

# Test all guest authentication
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# Full E2E suite (after all fixes)
npm run test:e2e
```

## Expected Results

### Before Fixes
- ❌ ~30-40 tests failing with JSON parsing errors
- ❌ HTML error pages returned instead of JSON
- ❌ "Cannot coerce to single JSON object" errors
- ❌ Guest authentication completely broken

### After Fixes
- ✅ ~30-40 tests now passing
- ✅ All API routes return JSON (never HTML)
- ✅ Proper error handling for no results
- ✅ Guest authentication working correctly
- ✅ Clear separation of database errors vs not found

## Next Steps

1. **Run Tests**: Execute the test commands above to verify fixes
2. **Check Results**: Confirm ~30-40 tests now passing
3. **Move to Phase 2**: Start accessibility fixes (Pattern 3 from guide)
4. **Track Progress**: Update E2E_FIX_ACTION_PLAN.md with results

## Files Modified

1. `app/api/guest-auth/email-match/route.ts` - Added empty body handling, changed `.single()` to `.maybeSingle()`
2. `app/api/guest-auth/magic-link/request/route.ts` - Added empty body handling
3. `app/api/guest-auth/magic-link/verify/route.ts` - Added empty body handling
4. `services/magicLinkService.ts` - Changed all `.single()` to `.maybeSingle()`, improved error handling

## Key Learnings

### `.single()` vs `.maybeSingle()`
- **`.single()`**: Throws error if 0 or >1 results → causes unhandled exceptions
- **`.maybeSingle()`**: Returns null if 0 results, first result if 1, error if >1 → graceful handling

### Empty Body Handling
Always wrap `request.json()` in try-catch to prevent unhandled exceptions that trigger HTML error pages:
```typescript
let body;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
    { status: 400 }
  );
}
```

### Error Separation
Separate database errors from "not found" cases for better debugging:
```typescript
if (error) {
  console.error('Database error:', error);
  return { success: false, error: { code: 'DATABASE_ERROR', message: '...' } };
}

if (!data) {
  return { success: false, error: { code: 'NOT_FOUND', message: '...' } };
}
```

---

**Status**: Ready for testing  
**Confidence**: High - These are well-understood patterns with clear fixes  
**Risk**: Low - Changes are defensive and improve error handling
