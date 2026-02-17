# E2E Phase 3A: RSVP Tests Root Cause Found

**Date**: February 15, 2026  
**Priority**: P2 - RSVP System  
**Status**: ✅ ROOT CAUSE IDENTIFIED  
**Tests**: 19 tests

## Root Cause

**Tests are using outdated registration flow that doesn't match actual implementation!**

### What Tests Are Doing (WRONG)

```typescript
test.beforeEach(async ({ page }) => {
  // Register and login
  await page.goto('/auth/register');
  await page.fill('input[name="firstName"]', 'Jane');
  await page.fill('input[name="lastName"]', 'Smith');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);  // ❌ DOESN'T EXIST
  await page.selectOption('select[name="ageType"]', 'adult'); // ❌ DOESN'T EXIST
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/guest\/dashboard/, { timeout: 10000 });
});
```

### What Registration Page Actually Has

```typescript
// app/auth/register/page.tsx
<input name="firstName" />  // ✅ Exists
<input name="lastName" />   // ✅ Exists
<input name="email" />      // ✅ Exists
// ❌ NO password field
// ❌ NO ageType select
```

### Why Tests Timeout

1. Test tries to fill `input[name="password"]` → **Element not found**
2. Playwright waits for element (default 30s timeout)
3. Test times out waiting for non-existent element
4. Never gets to actual RSVP testing

## Correct Approach

Use the existing `guestAuthHelpers.ts` which provides proper authentication:

```typescript
import { authenticateAsGuestForTest, navigateToGuestDashboard } from '../../helpers/guestAuthHelpers';

test.beforeEach(async ({ page }) => {
  // Create guest and authenticate
  const testEmail = `rsvp-test-${Date.now()}@example.com`;
  const { guestId } = await authenticateAsGuestForTest(page, testEmail);
  
  // Navigate to dashboard
  await navigateToGuestDashboard(page);
});
```

## Why This Happened

1. **Tests written before registration page was implemented**
2. **Tests assumed password-based auth** (like admin)
3. **Guests use email-matching auth** (no password)
4. **Tests never updated** to match actual implementation

## Solution

### Option 1: Use Guest Auth Helpers (RECOMMENDED)

Update all RSVP tests to use `authenticateAsGuestForTest`:

```typescript
import { authenticateAsGuestForTest, navigateToGuestDashboard } from '../../helpers/guestAuthHelpers';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

test.describe('RSVP Flow', () => {
  let testGuestId: string;
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `rsvp-test-${Date.now()}@example.com`;
    const { guestId } = await authenticateAsGuestForTest(page, testEmail);
    testGuestId = guestId;
    
    // Create test event/activity data
    const supabase = createTestClient();
    // ... create events and activities
    
    await navigateToGuestDashboard(page);
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test('should complete event-level RSVP', async ({ page }) => {
    // Navigate to RSVP page
    await page.goto('/guest/rsvp');
    
    // ... rest of test
  });
});
```

### Option 2: Fix Registration Page (NOT RECOMMENDED)

Add password and ageType fields to match tests. This is NOT recommended because:
- Guests don't need passwords (email-matching auth)
- ageType is set by admin, not guest
- Would require significant changes to auth flow

## Files to Update

### 1. `__tests__/e2e/rsvpFlow.spec.ts`
- Replace registration flow with `authenticateAsGuestForTest`
- Add test data creation (events, activities)
- Use proper cleanup

### 2. `__tests__/e2e/admin/rsvpManagement.spec.ts`
- Guest submission tests (5 tests) need same fix
- Admin tests (4 tests) are probably fine (use admin auth)
- Analytics tests (5 tests) need admin auth

## Expected Impact

After fix:
- ✅ All 19 RSVP tests should pass
- ✅ Tests will use correct authentication flow
- ✅ Tests will match actual implementation
- ✅ No more timeouts

## Comparison with Other Tests

| Test Suite | Auth Method | Status |
|------------|-------------|--------|
| **Form Tests** | Admin auth | ✅ Fixed (parallel issue) |
| **RSVP Tests** | Outdated guest auth | ❌ Broken (wrong flow) |
| **Guest Groups** | Guest auth helpers | ✅ Working |
| **Guest Views** | Guest auth helpers | ✅ Working |

**Pattern**: Tests that use `guestAuthHelpers` work, tests that don't are broken.

## Next Steps

1. ✅ Document root cause
2. 🔄 Update `rsvpFlow.spec.ts` with correct auth
3. 🔄 Update `rsvpManagement.spec.ts` guest tests
4. 🔄 Add test data creation
5. 🔄 Run tests to verify
6. 🔄 Update action plan and dashboard

## Lessons Learned

1. **Keep tests in sync with implementation**: Tests written before implementation need updates
2. **Use existing helpers**: `guestAuthHelpers` exists for a reason
3. **Test early**: Running tests during development catches these issues
4. **Document auth flows**: Clear documentation prevents confusion

## Estimated Fix Time

- Update `rsvpFlow.spec.ts`: 30 minutes
- Update `rsvpManagement.spec.ts`: 30 minutes
- Add test data creation: 15 minutes
- Test and verify: 15 minutes
- **Total**: ~1.5 hours

## Confidence Level

**HIGH** - Root cause is clear, solution is straightforward, similar pattern works in other tests.

