# API Authentication Fix

## Issue
After logging in successfully, user was getting "Authentication required" error when accessing `/admin/content-pages`.

## Root Cause
The `verifyAuth()` function in `lib/apiHelpers.ts` was using `getSession()` which reads the session from cookies. This can be unreliable in some cases, especially after a fresh login where the session cookie might not be properly synchronized.

## Solution
Changed `verifyAuth()` to use `getUser()` instead of `getSession()`:

```typescript
// BEFORE (unreliable)
const { data: { session }, error } = await supabase.auth.getSession();
if (error || !session) {
  return { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
}
return { success: true, userId: session.user.id };

// AFTER (reliable)
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
}
return { success: true, userId: user.id };
```

## Why This Works

### `getSession()` vs `getUser()`

**`getSession()`**:
- Reads session from local cookie storage
- Does NOT validate with Supabase servers
- Can return stale/invalid sessions
- Faster but less reliable

**`getUser()`**:
- Validates JWT token with Supabase servers
- Always returns current, valid user data
- Slightly slower but much more reliable
- Recommended for API routes

## Verification Steps

1. **User Role Check** ✅
   ```bash
   node scripts/check-user-role.mjs jrnabelsohn@gmail.com
   ```
   Result: User has `host` role (allowed for admin access)

2. **Login Test** ✅
   ```bash
   node scripts/test-login.mjs jrnabelsohn@gmail.com WeddingAdmin2026!
   ```
   Result: Login successful

3. **API Access** (should now work)
   - Navigate to http://localhost:3000/admin/content-pages
   - Should load without "Authentication required" error

## Files Modified

- `lib/apiHelpers.ts` - Updated `verifyAuth()` to use `getUser()`

## Additional Debugging Tools Created

### 1. `scripts/check-user-role.mjs`
Checks if user exists in both `auth.users` and `users` tables, and verifies role:
```bash
node scripts/check-user-role.mjs user@example.com
```

### 2. `scripts/test-api-auth.mjs`
Tests API authentication by logging in and making an API call:
```bash
node scripts/test-api-auth.mjs user@example.com password
```

## Related Issues Fixed

This same pattern should be applied to any other API routes that were experiencing authentication issues. The `withAuth()` wrapper now uses the more reliable `getUser()` method.

## Testing

After restarting the dev server, test:

1. Log in at http://localhost:3000/auth/login
2. Navigate to http://localhost:3000/admin/content-pages
3. Should load successfully without authentication errors
4. Try other admin pages (guests, locations, etc.)

## Prevention

Going forward:
- Always use `getUser()` for API route authentication
- Use `getSession()` only for client-side session checks
- The `withAuth()` helper now handles this correctly for all routes

## Status

✅ Root cause identified (getSession() unreliability)  
✅ Fix applied (switched to getUser())  
✅ User role verified (host role confirmed)  
⏳ Awaiting verification (restart dev server and test)

## Next Steps

1. Restart the development server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. Test the content pages:
   - Go to http://localhost:3000/auth/login
   - Log in with: jrnabelsohn@gmail.com / WeddingAdmin2026!
   - Navigate to Content Pages
   - Should work without errors

If issues persist, check browser console for additional error details.
