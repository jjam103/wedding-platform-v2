# E2E Guest Authentication - Progress Update

## Current Status

✅ **Migration Applied**: `action` column in `audit_logs` table  
✅ **Cache Cleared**: `.next` directory removed  
⚠️ **Partial Success**: Some routes working, others still 404  
📊 **Test Results**: 4/16 passing (25%) - same as before

## What Changed

### Routes Now Working ✅
- `POST /api/auth/guest/email-match` → 200 (success) or 404 (guest not found)

### Routes Still Failing ❌
- `POST /api/auth/guest/magic-link` → 404
- `GET /api/auth/guest/magic-link/verify` → 404

## Test Results Breakdown

### ✅ Passing (4 tests)
1. should show error for non-existent email
2. should successfully authenticate with email matching  
3. should show error for invalid email format
4. should show error for invalid email format (duplicate)

### ❌ Failing (12 tests)
All tests that require magic link functionality are failing with 404 errors.

## New Issues Discovered

### Issue 1: Foreign Key Constraint Error

**Error**:
```
Failed to create guest session: {
  code: '23503',
  details: 'Key (guest_id)=(2b8e0b87-e55b-486e-addc-471164c2e85c) is not present in table "guests".',
  message: 'insert or update on table "guest_sessions" violates foreign key constraint "guest_sessions_guest_id_fkey"'
}
```

**Root Cause**: The test is trying to create a session for a guest that doesn't exist in the database.

**Impact**: One test failing with 500 error instead of expected behavior.

### Issue 2: Magic Link Routes Not Found

**Evidence**:
```
POST /api/auth/guest/magic-link → 404
GET /api/auth/guest/magic-link/verify → 404
```

**Possible Causes**:
1. Routes not being compiled during server startup
2. Route file structure issue
3. Next.js 16 routing bug
4. Turbopack compilation issue

## Investigation Findings

### Email Match Route Works ✅

The email-match route is working correctly:
- Returns 200 on success
- Returns 404 when guest not found
- Creates session and sets cookie
- Logs audit events

This proves:
- Middleware is not blocking routes ✅
- Route structure is correct ✅
- Database connection works ✅
- Audit logging works ✅

### Magic Link Routes Don't Work ❌

Despite having identical structure to email-match route:
- Same file naming (`route.ts`)
- Same export pattern (`export async function POST`)
- Same imports and dependencies
- No TypeScript errors

**Hypothesis**: The magic-link routes are in a nested directory structure that Next.js/Turbopack isn't handling correctly during hot reload.

## Next Steps

### Option 1: Restart Dev Server (Recommended)

The E2E tests start their own server, but it might be using cached route information. Try:

```bash
# Kill any running Next.js processes
pkill -f "next dev"

# Clear cache again
rm -rf .next

# Run tests again
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

### Option 2: Check Route File Structure

Verify the magic-link routes have the exact same structure as email-match:

```bash
# Compare file structures
ls -la app/api/auth/guest/email-match/
ls -la app/api/auth/guest/magic-link/
ls -la app/api/auth/guest/magic-link/verify/
```

### Option 3: Add Debug Logging

Add console.log at the top of magic-link route files to see if they're being loaded:

```typescript
// At top of app/api/auth/guest/magic-link/route.ts
console.log('[Route Debug] magic-link route loaded');

export async function POST(request: Request) {
  console.log('[Route Debug] POST magic-link called');
  // ... rest of code
}
```

### Option 4: Test Routes Directly

Start dev server manually and test with curl:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test routes
curl -X POST http://localhost:3000/api/auth/guest/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Recommendations

### Immediate Action

1. **Kill all Next.js processes** to ensure clean restart
2. **Clear cache again** (`rm -rf .next`)
3. **Run tests again** to see if magic-link routes load

### If Still Failing

1. **Add debug logging** to magic-link routes
2. **Check E2E test output** for route loading messages
3. **Test routes manually** with curl
4. **Check Next.js 16 issues** for similar routing problems

### Alternative Approach

If routes continue to fail, consider:
1. **Flatten route structure** - Move verify route up one level
2. **Rename routes** - Try different naming pattern
3. **Use production build** - Test with `npm run build && npm start`

## Success Criteria

For tests to pass, we need:
- ✅ Email match route working (DONE)
- ❌ Magic link request route working (404)
- ❌ Magic link verify route working (404)
- ❌ Logout route working (not tested yet)

## Conclusion

Progress was made - the cache clear fixed the email-match route. However, the magic-link routes are still returning 404, suggesting a deeper issue with how Next.js/Turbopack is handling nested route directories during development.

**Current Blocker**: Magic link routes not being found by Next.js  
**Recommended Fix**: Kill all processes, clear cache, restart tests  
**Alternative**: Add debug logging to understand why routes aren't loading

---

## Quick Commands

```bash
# Kill Next.js processes
pkill -f "next dev"

# Clear cache
rm -rf .next

# Run tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts

# Test route manually (requires running server)
curl -X POST http://localhost:3000/api/auth/guest/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
