# E2E Phase 3 - Quick Test Code Fixes

## Summary

Based on the E2E test analysis, we have **6 test code issues** that need fixing. These are NOT application bugs - they're incorrect test code using wrong routes or missing authentication.

## Fix 1: Update Admin Login Routes (Multiple Tests)

### Files to Fix
- `__tests__/e2e/accessibility/suite.spec.ts`
- `__tests__/e2e/admin/userManagement.spec.ts`

### Changes Required

**Route**: `/auth/admin-login` → `/auth/login`

### Affected Tests

#### accessibility/suite.spec.ts
1. **Line 539** - Test 24: "should be responsive across admin pages"
2. **Line 639** - Test 28: "should support 200% zoom on admin and guest pages"  
3. **Line 706** - Test 29: "should render correctly across browsers"

#### admin/userManagement.spec.ts
1. **Line 76** - "should complete full admin user creation workflow"
2. **Line 180** - "should deactivate and reactivate admin users"
3. **Line 225** - "should deactivate and reactivate admin users" (verification)
4. **Line 241** - "should deactivate and reactivate admin users" (URL check)
5. **Line 247** - "should prevent deactivating last owner"
6. **Line 312** - "should enforce role-based permissions"
7. **Line 402** - "should log admin user management actions"

### Fix Pattern

```typescript
// BEFORE
await page.goto('/auth/admin-login');
await page.fill('input[name="email"]', 'admin@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');

// AFTER
await page.goto('/auth/login');
await page.fill('input[name="email"]', 'admin@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
```

## Fix 2: Guest Login Routes - More Complex

### Issue
Guest login uses a different authentication method (email matching, not password).

### Files to Fix
- `__tests__/e2e/accessibility/suite.spec.ts`
- `__tests__/e2e/admin/rsvpManagement.spec.ts`
- `__tests__/e2e/auth/guestAuth.spec.ts`

### Decision Required

**Option A**: Keep `/auth/guest-login` route (if it exists)
- Check if this route actually exists in the application
- If yes, no changes needed

**Option B**: Update to use `/auth/login` with guest credentials
- Change route to `/auth/login`
- Use guest email/password authentication

**Option C**: Create guest authentication helper
- Create reusable helper function
- Handle guest-specific auth flow

### Recommendation: Option A First

Let's verify if `/auth/guest-login` exists before making changes.

```bash
# Check if route exists
ls -la app/auth/guest-login/
```

If it doesn't exist, we need Option B or C.

## Fix 3: Add Authentication to Protected Route Tests

### Tests Affected
- **Test 7** (line 136): "should navigate form fields and dropdowns with keyboard"
- **Test 23** (line 484): "should have accessible RSVP form and photo upload"

### Issue
These tests try to access protected routes without authenticating first.

### Fix Pattern

```typescript
// Add authentication helper at top of file
async function authenticateAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/);
}

// Then use in tests:
test('should navigate form fields and dropdowns with keyboard', async ({ page }) => {
  await authenticateAsAdmin(page);
  await page.goto('/admin/guests');
  // ... rest of test
});
```

## Implementation Plan

### Step 1: Verify Routes (5 minutes)

```bash
# Check what auth routes actually exist
ls -la app/auth/
ls -la app/auth/*/page.tsx
```

### Step 2: Fix Admin Login Routes (15 minutes)

1. Open `__tests__/e2e/accessibility/suite.spec.ts`
2. Find and replace: `/auth/admin-login` → `/auth/login`
3. Open `__tests__/e2e/admin/userManagement.spec.ts`
4. Find and replace: `/auth/admin-login` → `/auth/login`

### Step 3: Fix Guest Login Routes (15 minutes)

**If `/auth/guest-login` doesn't exist:**

1. Open `__tests__/e2e/accessibility/suite.spec.ts`
2. Find and replace: `/auth/guest-login` → `/auth/login`
3. Update authentication method if needed

**If `/auth/guest-login` exists:**
- No changes needed, tests are correct

### Step 4: Add Authentication Helpers (20 minutes)

1. Open `__tests__/e2e/accessibility/suite.spec.ts`
2. Add authentication helper functions at top
3. Update Test 7 (line 136) to authenticate before accessing `/admin/guests`
4. Update Test 23 (line 484) to authenticate before accessing RSVP/photo routes

### Step 5: Verify Fixes (10 minutes)

```bash
# Run the specific tests we fixed
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should be responsive across admin pages"
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should navigate form fields"
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should have accessible RSVP"
```

## Expected Impact

**Before**: 6 tests failing due to wrong routes/missing auth
**After**: 6 tests passing (assuming application code is correct)

## Files to Modify

1. `__tests__/e2e/accessibility/suite.spec.ts` - 5 fixes
2. `__tests__/e2e/admin/userManagement.spec.ts` - 7 fixes
3. Possibly `__tests__/e2e/admin/rsvpManagement.spec.ts` - if guest-login route doesn't exist
4. Possibly `__tests__/e2e/auth/guestAuth.spec.ts` - if guest-login route doesn't exist

## Risk Assessment

**Low Risk**: These are straightforward test code fixes
**No Application Changes**: Only test files are modified
**Easy to Verify**: Run tests immediately after changes

## Next Steps After These Fixes

1. Re-run full E2E suite
2. Verify DataTable fixes are working (7 tests)
3. Investigate navigation failures (10 tests)
4. Address remaining 3 failures

## Commands

```bash
# Fix and test in one go
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts --timeout=120000

# Or run specific failing tests
npm run test:e2e -- -g "should be responsive across admin pages"
npm run test:e2e -- -g "should support 200% zoom"
npm run test:e2e -- -g "should navigate form fields"
```

## Success Criteria

- [ ] All admin-login routes updated to /auth/login
- [ ] Guest login routes verified and updated if needed
- [ ] Authentication helpers added for protected route tests
- [ ] All 6 tests now passing
- [ ] No new test failures introduced
