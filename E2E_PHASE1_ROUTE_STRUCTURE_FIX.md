# E2E Phase 1: API Route Structure Fix

## Problem Identified

The sub-agent created **duplicate routes** with inconsistent naming:

### Current Structure (Duplicates)
```
app/api/auth/guest/
├── email-match/route.ts ✅ (correct)
├── logout/route.ts ✅ (correct)
├── request-magic-link/route.ts ❌ (duplicate, flat structure)
├── verify-magic-link/route.ts ❌ (duplicate, flat structure)
└── magic-link/
    ├── request/route.ts ✅ (correct, nested structure)
    └── verify/route.ts ✅ (correct, nested structure)
```

### Evidence from Server Logs

The server is loading the **flat structure** routes:
```
[WebServer] 🔗 Magic link request route loaded at /api/auth/guest/request-magic-link
[WebServer] 🔗 Magic link verify route loaded at /api/auth/guest/verify-magic-link
```

But the **tests are calling the nested structure**:
```
POST /api/auth/guest/magic-link/request 404
GET /api/auth/guest/magic-link/verify?token=... 404
```

## Root Cause

Next.js is loading the **first matching route** it finds during compilation. The flat structure routes (`request-magic-link`, `verify-magic-link`) are being loaded instead of the nested ones (`magic-link/request`, `magic-link/verify`).

## Solution

**Delete the duplicate flat structure routes** and keep only the nested structure:

```bash
# Delete duplicates
rm app/api/auth/guest/request-magic-link/route.ts
rm app/api/auth/guest/verify-magic-link/route.ts
rmdir app/api/auth/guest/request-magic-link
rmdir app/api/auth/guest/verify-magic-link
```

### Final Correct Structure
```
app/api/auth/guest/
├── email-match/
│   └── route.ts
├── logout/
│   └── route.ts
└── magic-link/
    ├── request/
    │   └── route.ts
    └── verify/
        └── route.ts
```

### Expected URLs
- `POST /api/auth/guest/email-match`
- `POST /api/auth/guest/magic-link/request`
- `GET /api/auth/guest/magic-link/verify?token=...`
- `POST /api/auth/guest/logout`

## Additional Fixes Needed

### 1. Fix Audit Logging Error

In `app/api/auth/guest/email-match/route.ts` line 130:

```typescript
// ❌ WRONG - Supabase doesn't have .catch()
await supabase.from('audit_logs').insert({...}).catch(err => {
  console.error('Failed to log audit event:', err);
});

// ✅ CORRECT - Use try/catch
try {
  await supabase.from('audit_logs').insert({...});
} catch (err) {
  console.error('Failed to log audit event:', err);
}
```

### 2. Verify Route Exports

Each route file must export HTTP method handlers:

```typescript
// email-match/route.ts
export async function POST(request: Request) { ... }

// magic-link/request/route.ts
export async function POST(request: Request) { ... }

// magic-link/verify/route.ts
export async function GET(request: Request) { ... }

// logout/route.ts
export async function POST(request: Request) { ... }
```

## Implementation Steps

1. **Delete duplicate routes**
   ```bash
   rm -rf app/api/auth/guest/request-magic-link
   rm -rf app/api/auth/guest/verify-magic-link
   ```

2. **Fix audit logging in email-match route**
   - Replace `.catch()` with try/catch
   - Test that audit logs are created

3. **Restart dev server**
   - Kill current server
   - Run `npm run dev`
   - Verify routes load correctly

4. **Test manually**
   - Test email matching auth
   - Test magic link request
   - Test magic link verification
   - Test logout

5. **Run E2E tests**
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts
   ```

## Expected Outcome

After fixes:
- All 4 API routes accessible at correct URLs
- Audit logging works without errors
- Email matching authentication redirects to dashboard
- Magic link flow works end-to-end
- Logout clears session and redirects to login
- **16/16 E2E tests pass**

## Time Estimate

- Delete duplicates: 2 minutes
- Fix audit logging: 5 minutes
- Restart server: 1 minute
- Manual testing: 15 minutes
- E2E test run: 5 minutes

**Total**: ~30 minutes
