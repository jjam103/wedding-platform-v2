# E2E Phase 3A: Next Session Quick Start Guide

**Status**: 10/29 tests fixed (34% complete)  
**Next Target**: Fix remaining 19 RSVP tests  
**Estimated Time**: 2-3 hours

## Quick Status

✅ **Form Tests (10)** - COMPLETE  
🔄 **RSVP Tests (19)** - Root cause found, needs debugging

## What You Need to Know

### RSVP Tests Issue

**Problem**: Tests timeout even when run individually

**Root Cause**: Tests use outdated registration flow
- Tests try to fill `password` and `ageType` fields that don't exist
- Guests use email-matching auth (no password)

**Fix Applied**: Updated to use `authenticateAsGuestForTest` helper

**Current Status**: Still timing out, needs debugging

## Start Here

### Step 1: Run Test in Headed Mode (5 min)

```bash
npm run test:e2e -- rsvpFlow.spec.ts --grep "should complete event-level RSVP" --headed --timeout=120000
```

**Watch for**:
- Does guest dashboard load?
- Does RSVP page load?
- Are there console errors?
- Where does it get stuck?

### Step 2: Check What's Happening (10 min)

Open browser DevTools and check:
- **Console**: Any JavaScript errors?
- **Network**: Are API calls succeeding?
- **Elements**: Is the page rendering?
- **Application > Cookies**: Is guest_session cookie set?

### Step 3: Add Debug Logging (5 min)

Add console.log statements to track progress:

```typescript
test('should complete event-level RSVP', async ({ page }) => {
  console.log('1. Starting test...');
  console.log('2. Navigating to RSVP page...');
  await page.goto('/guest/rsvp');
  console.log('3. Current URL:', page.url());
  console.log('4. Page title:', await page.title());
  // ... etc
});
```

### Step 4: Verify Prerequisites (10 min)

Check each prerequisite works:

```typescript
// Test 1: Authentication works
test('auth works', async ({ page }) => {
  const { guestId } = await authenticateAsGuestForTest(page, 'test@example.com');
  console.log('Guest ID:', guestId);
  expect(guestId).toBeTruthy();
});

// Test 2: Dashboard loads
test('dashboard loads', async ({ page }) => {
  await authenticateAsGuestForTest(page, 'test@example.com');
  await navigateToGuestDashboard(page);
  expect(page.url()).toContain('/guest/dashboard');
});

// Test 3: RSVP page loads
test('rsvp page loads', async ({ page }) => {
  await authenticateAsGuestForTest(page, 'test@example.com');
  await page.goto('/guest/rsvp');
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).toContain('/guest/rsvp');
});
```

### Step 5: Fix and Verify (30-60 min)

Based on what you find:
- Update selectors if UI doesn't match
- Fix page loading if it's broken
- Fix test data creation if missing
- Update test flow if needed

## Common Issues & Solutions

### Issue 1: Dashboard Doesn't Load

**Symptoms**: Redirects to login page

**Solution**: Check guest_session cookie is set correctly

```typescript
// Verify cookie after auth
const cookies = await page.context().cookies();
const guestSession = cookies.find(c => c.name === 'guest_session');
console.log('Guest session cookie:', guestSession);
```

### Issue 2: RSVP Page Doesn't Load

**Symptoms**: 404 or blank page

**Solution**: Verify page exists and loads

```bash
# Check if page file exists
ls -la app/guest/rsvp/page.tsx

# Check for errors in page
npm run build
```

### Issue 3: Test Data Not Created

**Symptoms**: No events/activities to RSVP to

**Solution**: Verify test data creation in beforeEach

```typescript
// Add logging
const { data: event } = await supabase.from('events').insert(...).select().single();
console.log('Created event:', event);
```

### Issue 4: Selectors Don't Match

**Symptoms**: Elements not found

**Solution**: Use more flexible selectors

```typescript
// Instead of exact selector
await page.click('button[type="submit"]');

// Use flexible selector
await page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Save RSVP")').first().click();
```

## Files to Check

1. `__tests__/e2e/rsvpFlow.spec.ts` - Test file
2. `app/guest/rsvp/page.tsx` - RSVP page
3. `components/guest/RSVPManager.tsx` - RSVP component
4. `app/api/guest/rsvp/route.ts` - RSVP API
5. `__tests__/helpers/guestAuthHelpers.ts` - Auth helpers

## Quick Commands

```bash
# Run single test in headed mode
npm run test:e2e -- rsvpFlow.spec.ts --grep "should complete event-level RSVP" --headed --timeout=120000

# Run all RSVP flow tests
npm run test:e2e -- rsvpFlow.spec.ts

# Run all RSVP management tests
npm run test:e2e -- admin/rsvpManagement.spec.ts

# Run all Phase 3A tests
npm run test:e2e -- uiInfrastructure.spec.ts rsvpFlow.spec.ts rsvpManagement.spec.ts
```

## Success Criteria

### First Test Passing
- ✅ Guest authentication works
- ✅ Dashboard loads
- ✅ RSVP page loads
- ✅ Test data is created
- ✅ RSVP submission works
- ✅ Success message appears

### All 19 Tests Passing
- ✅ All 10 rsvpFlow tests pass
- ✅ All 4 admin management tests pass
- ✅ All 5 guest submission tests pass
- ✅ Tests run in reasonable time (<5 min total)

## Expected Timeline

- Debug first test: 30-60 min
- Fix first test: 15-30 min
- Un-skip and fix remaining 9 rsvpFlow tests: 30-60 min
- Fix rsvpManagement tests: 30-60 min
- **Total**: 2-3 hours

## Documentation to Update

After fixing:
1. Update `E2E_FEB15_2026_PHASE3_DASHBOARD.md` - Mark tests as complete
2. Update `E2E_FEB15_2026_PHASE3_UPDATED_ACTION_PLAN.md` - Update status
3. Create `E2E_FEB15_2026_PHASE3A_RSVP_TESTS_FIXED.md` - Document solution
4. Update `E2E_FEB15_2026_PHASE3A_SESSION_SUMMARY.md` - Final status

## Key Takeaways

1. **Use headed mode early** - Don't waste time guessing
2. **Verify prerequisites** - Check auth, pages, data work
3. **Add debug logging** - Track progress through test
4. **Fix one test first** - Then apply to others
5. **Document solution** - Help future debugging

## Ready to Start?

1. Open terminal
2. Run: `npm run test:e2e -- rsvpFlow.spec.ts --grep "should complete event-level RSVP" --headed --timeout=120000`
3. Watch what happens
4. Identify the issue
5. Apply the fix
6. Verify it works
7. Move to next test

Good luck! 🚀

