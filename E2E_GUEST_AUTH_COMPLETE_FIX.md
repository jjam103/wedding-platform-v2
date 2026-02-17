# E2E Guest Authentication Complete Fix

## Current Status: 4/16 Tests Passing (25%)

### ✅ Tests Passing (4)
1. ✅ should show error for non-existent email
2. ✅ should show error for invalid email format  
3. ✅ should create session cookie on successful authentication
4. ✅ should show error for invalid email format (duplicate)

### ❌ Tests Failing (12)

#### Category 1: Magic Link Routes Returning 404 (5 tests)
**Root Cause**: Routes exist at `/api/auth/guest/request-magic-link` and `/api/auth/guest/verify-magic-link` but Next.js returns 404

**Evidence**:
```
[WebServer] 🔗 Magic link request route loaded at /api/auth/guest/request-magic-link
[WebServer] 🔗 Magic link request POST called
[WebServer]  POST /api/auth/guest/request-magic-link 404 in 272ms
```

**Affected Tests**:
- should successfully request and verify magic link
- should show success message after requesting magic link
- should show error for expired magic link
- should show error for already used magic link
- should handle authentication errors gracefully

**Fix Required**: Investigate why Next.js returns 404 despite route files existing and being loaded

#### Category 2: Guest Authentication Redirect Issues (3 tests)
**Root Cause**: Email matching authentication redirects to `/auth/unauthorized` instead of `/guest/dashboard`

**Evidence**:
```
[WebServer]  POST /api/auth/guest/email-match 200 in 962ms
[WebServer]  GET /auth/unauthorized 200 in 17ms
```

**Affected Tests**:
- should successfully authenticate with email matching
- should complete logout flow
- should persist authentication across page refreshes

**Fix Required**: Check middleware or email-match route logic for redirect behavior

#### Category 3: UI Element Selector Issues (2 tests)
**Root Cause**: Tab elements not found or strict mode violations

**Affected Tests**:
- should switch between authentication tabs (tabs not found)
- should show loading state during authentication (button selector issue)
- should show error for invalid or missing token (strict mode violation - multiple `<p>` tags)

**Fix Required**: 
1. Check if guest login page has tabs
2. Fix strict mode selector: `page.locator('p').first()`

#### Category 4: Test Data Issues (1 test)
**Root Cause**: Guest creation failing in test setup

**Affected Test**:
- should persist authentication across page refreshes

**Error**: `Failed to create test guest`

**Fix Required**: Check guest creation logic in test

#### Category 5: Audit Log Issues (1 test)
**Root Cause**: Authentication events not being logged to audit_logs table

**Affected Test**:
- should log authentication events in audit log

**Fix Required**: Implement audit logging in email-match route

## Key Achievements

### ✅ Fixed Issues
1. **Server Environment**: Playwright now starts Next.js with E2E environment variables
2. **Admin Authentication**: Global setup successfully authenticates admin user
3. **Database Connection**: E2E tests connect to correct test database
4. **Test Infrastructure**: Cleanup and setup working correctly

### 🔧 Remaining Work

#### Priority 1: Magic Link 404 Issue (Blocks 5 tests)
**Investigation Steps**:
1. Check if route files are in correct location
2. Verify route export names (GET, POST, etc.)
3. Check for TypeScript errors in route files
4. Test routes directly with curl/Postman
5. Check Next.js routing configuration

**Files to Check**:
- `app/api/auth/guest/request-magic-link/route.ts`
- `app/api/auth/guest/verify-magic-link/route.ts`

#### Priority 2: Guest Dashboard Redirect (Blocks 3 tests)
**Investigation Steps**:
1. Check `/api/auth/guest/email-match` route response
2. Check middleware guest authentication logic
3. Verify guest session creation
4. Check RLS policies for guests table

**Files to Check**:
- `app/api/auth/guest/email-match/route.ts`
- `middleware.ts` or `proxy.ts`
- Guest authentication logic

#### Priority 3: UI Selectors (Blocks 3 tests)
**Fixes Needed**:
1. Check if guest login page has tabs (Email Login / Magic Link)
2. Fix strict mode violation: `page.locator('p').first()`
3. Verify button text matches selector

**Files to Check**:
- `app/auth/guest-login/page.tsx`
- Test file selectors

#### Priority 4: Audit Logging (Blocks 1 test)
**Implementation Needed**:
- Add audit log entries in email-match route
- Verify audit_logs table exists and is accessible

## Next Steps

### Step 1: Fix Magic Link Routes (Highest Impact)
```bash
# Check if routes exist
ls -la app/api/auth/guest/request-magic-link/
ls -la app/api/auth/guest/verify-magic-link/

# Check for TypeScript errors
npm run type-check

# Test routes directly
curl -X POST http://localhost:3000/api/auth/guest/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Step 2: Fix Guest Dashboard Redirect
```bash
# Check email-match route
cat app/api/auth/guest/email-match/route.ts | grep -A 10 "redirect\|NextResponse"

# Check middleware
cat middleware.ts | grep -A 10 "guest"
```

### Step 3: Fix UI Selectors
```bash
# Check guest login page structure
cat app/auth/guest-login/page.tsx | grep -i "tab\|magic"

# Update test selectors
# - Line ~334: page.locator('p').first()
# - Line ~407-420: Check tab selectors
```

### Step 4: Add Audit Logging
```bash
# Check if audit_logs table exists
# Add logging to email-match route
```

## Test Execution Command
```bash
# Run E2E guest auth tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Run with UI mode for debugging
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --ui

# Run specific test
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts:84
```

## Success Criteria
- ✅ 16/16 tests passing
- ✅ No 404 errors on magic link routes
- ✅ No strict mode violations
- ✅ Guest authentication redirects to dashboard
- ✅ All UI elements found correctly
- ✅ Audit logs created for authentication events

## Environment Notes
- **Test Database**: `olcqaawrpnanioaorfer.supabase.co`
- **Admin User**: `admin@example.com` / `test-password-123`
- **Test Guest**: Created dynamically in global setup
- **Server**: Started by Playwright with E2E environment variables
