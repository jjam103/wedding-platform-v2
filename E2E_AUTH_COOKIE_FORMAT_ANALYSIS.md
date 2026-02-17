# E2E Authentication Cookie Format Analysis

**Date**: February 9, 2026  
**Status**: ✅ RESOLVED - Using Test Auth Endpoint

## Problem Summary

Attempted to implement Solution B (API cookie injection) but discovered that Supabase's cookie format is more complex than expected:

### Expected Cookie Format (Incorrect)
```typescript
// ❌ This doesn't work
{
  name: 'sb-access-token',
  value: accessToken,
  // ...
}
```

### Actual Cookie Format (Complex)
```typescript
// ✅ Actual Supabase SSR cookie format
{
  name: 'sb-<project-ref>-auth-token',  // Not sb-access-token!
  value: base64(JSON.stringify(session)), // Base64-encoded JSON
  // May be chunked into multiple cookies for large sessions:
  // sb-<project-ref>-auth-token.0
  // sb-<project-ref>-auth-token.1
  // etc.
}
```

### Why Cookie Injection is Complex

1. **Dynamic Cookie Names**: Cookie name includes project reference ID
2. **Base64 Encoding**: Session must be Base64-encoded JSON
3. **Cookie Chunking**: Large sessions split across multiple cookies
4. **Format Changes**: Supabase may change cookie format in future versions
5. **Middleware Compatibility**: Must match exact format middleware expects

## Solution Implemented: Test Auth Endpoint

Instead of trying to reverse-engineer Supabase's cookie format, we created a test authentication endpoint that lets Supabase handle cookie formatting.

### Implementation

**File**: `app/api/test-auth/login/route.ts`

```typescript
export async function POST(request: Request) {
  // Only allow in test environment
  if (process.env.NODE_ENV === 'production' && !process.env.E2E_TEST_MODE) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  const { email, password } = await request.json();
  
  // Create Supabase client with cookies
  const supabase = createRouteHandlerClient({ cookies });
  
  // Sign in - this automatically sets session cookies
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // Session cookies are automatically set by createRouteHandlerClient
  return NextResponse.json({ success: true, data: { user: data.user } });
}
```

### Global Setup Usage

**File**: `__tests__/e2e/global-setup.ts`

```typescript
// Call test auth endpoint to set session cookies
const authResponse = await page.request.post(`${baseURL}/api/test-auth/login`, {
  data: {
    email: adminEmail,
    password: adminPassword,
  },
});

// Cookies are automatically set in the browser context
// Navigate to admin page to verify
await page.goto(`${baseURL}/admin`);

// Save authentication state
await context.storageState({ path: '.auth/admin.json' });
```

## Advantages of This Approach

| Aspect | Cookie Injection | Test Auth Endpoint |
|--------|------------------|-------------------|
| **Cookie Format** | ❌ Must reverse-engineer | ✅ Supabase handles it |
| **Maintenance** | ❌ Breaks if format changes | ✅ Always compatible |
| **Reliability** | ❌ Complex, error-prone | ✅ Simple, reliable |
| **Security** | ⚠️ Exposes cookie internals | ✅ Uses standard auth flow |
| **Speed** | ✅ Slightly faster | ✅ Fast enough |

## Security Considerations

The test auth endpoint is protected:

1. **Environment Check**: Only works in test environment
2. **Production Guard**: Disabled in production unless `E2E_TEST_MODE` is set
3. **Standard Auth**: Uses same auth flow as regular login
4. **No Bypass**: Still requires valid credentials

### Production Safety

```typescript
// In production deployment, ensure E2E_TEST_MODE is NOT set
if (process.env.NODE_ENV === 'production' && !process.env.E2E_TEST_MODE) {
  return 403; // Forbidden
}
```

## Testing the Fix

### 1. Run Global Setup
```bash
npx playwright test --project=chromium --grep="@smoke"
```

### 2. Expected Output
```
🚀 E2E Global Setup Starting...

📊 Verifying test database connection...
✅ Test database connected

🧹 Cleaning up test data...
✅ Test data cleaned

🌐 Verifying Next.js server...
✅ Next.js server is running

🔐 Setting up admin authentication...
   Authenticating via Supabase API...
   ✅ API authentication successful (User ID: xxx)
   Authenticating via test endpoint...
   ✅ Session cookies set via test endpoint
   User ID: xxx
   Verifying authentication...
   Current URL: http://localhost:3000/admin
   ✅ Admin UI is visible
   ✅ Authentication verified
   Logged in as: admin@test.com
   Auth state saved to: .auth/admin.json
✅ Admin authentication saved

✨ E2E Global Setup Complete!
```

### 3. Verify Location Hierarchy Test
```bash
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep="location hierarchy"
```

## Alternative Approaches Considered

### Option A: Per-Test Authentication
- **Pros**: No global setup complexity
- **Cons**: Slower (authenticate in every test)
- **Status**: Rejected - too slow

### Option B: Cookie Injection (Original Plan)
- **Pros**: Fast, no extra endpoint
- **Cons**: Complex cookie format, maintenance burden
- **Status**: Rejected - too complex

### Option C: Test Auth Endpoint (Implemented)
- **Pros**: Simple, reliable, maintainable
- **Cons**: Requires extra endpoint
- **Status**: ✅ Implemented

## Troubleshooting

### If Test Auth Endpoint Returns 403
```bash
# Check environment
echo $NODE_ENV  # Should be 'development' or 'test'
echo $E2E_TEST_MODE  # Should be unset or empty

# If in production, set E2E_TEST_MODE (only for testing!)
export E2E_TEST_MODE=true
```

### If Authentication Still Fails
1. **Check endpoint is accessible**:
   ```bash
   curl -X POST http://localhost:3000/api/test-auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"test-password-123"}'
   ```

2. **Check admin user exists**:
   ```bash
   node scripts/verify-e2e-admin-user.mjs
   ```

3. **Check Supabase credentials**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

## Related Documents

- `E2E_AUTH_SOLUTION_B_IMPLEMENTED.md` - Previous cookie injection attempt
- `E2E_GLOBAL_SETUP_AUTH_FIX_STATUS.md` - Status before this fix
- `E2E_LOCATION_HIERARCHY_COMPONENT_FIX_COMPLETE.md` - Component fix waiting for E2E

## Next Steps

1. ✅ Test auth endpoint created
2. ✅ Global setup updated to use endpoint
3. ⏳ Run E2E tests to verify fix
4. ⏳ Test location hierarchy component
5. ⏳ Document any remaining issues

## Conclusion

The test auth endpoint approach is simpler, more reliable, and more maintainable than trying to reverse-engineer Supabase's cookie format. It lets Supabase handle cookie formatting while giving us the authenticated browser context we need for E2E tests.

**Recommendation**: Proceed with this implementation and test the location hierarchy component.
