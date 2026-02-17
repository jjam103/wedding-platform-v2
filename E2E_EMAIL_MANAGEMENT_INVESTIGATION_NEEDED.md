# E2E Email Management Tests - Investigation Needed

## Current Status

5 out of 13 tests are still failing with timeout errors when waiting for specific guests to appear in the dropdown.

## Test Results

### Passing Tests (7/13 - 54%)
1. ✅ should select recipients by group
2. ✅ should validate required fields and email addresses  
3. ✅ should save email as draft
4. ✅ should send bulk email to all guests
5. ✅ should sanitize email content for XSS prevention
6. ✅ should have keyboard navigation in email form
7. ✅ should have accessible form elements with ARIA labels

### Failing Tests (5/13 - 38%)
1. ❌ should complete full email composition and sending workflow
2. ❌ should use email template with variable substitution
3. ❌ should preview email before sending
4. ❌ should schedule email for future delivery
5. ❌ should show email history after sending

### Skipped Tests (1/13 - 8%)
- ⏭️ should create and use email template (feature not implemented)

## Root Cause Analysis

### Symptom
All 5 failing tests timeout at the same point:
```typescript
await waitForSpecificGuests(page, [testGuestId1]);
// TimeoutError: page.waitForFunction: Timeout 10000ms exceeded
```

### API Error Pattern
The logs show a consistent 400 error from the emails API:
```
[WebServer]  GET /api/admin/emails 400 in 290ms (compile: 2ms, proxy.ts: 279ms, render: 9ms)
```

This 400 error occurs BEFORE the component tries to fetch guests, which suggests:
1. The `/api/admin/emails` endpoint is failing
2. This might be preventing the EmailComposer component from initializing properly
3. The component never gets to the point of fetching guests

### What's Working
- Tests that don't use `waitForSpecificGuests()` pass successfully
- The `waitForGuestOptions()` helper (which just checks for any options) would likely work
- API routes for guests (`/api/admin/guests?format=simple`) return 200 OK
- Component renders and modal opens successfully

### What's Not Working
- The `/api/admin/emails` GET endpoint returns 400
- Specific guest IDs never appear in the dropdown
- `waitForSpecificGuests()` times out after 10 seconds

## Investigation Steps Needed

### 1. Check `/api/admin/emails` Endpoint
The GET endpoint is returning 400 errors. Need to investigate:
- What does this endpoint do?
- Why is it returning 400?
- Is it required for the EmailComposer to work?
- What parameters does it expect?

### 2. Check EmailComposer Data Fetching
The component logs show:
```
[Test] Form data loaded
[Test] Recipients select found
```

But then the specific guests never appear. Need to check:
- Does the component actually fetch guests after form loads?
- Is there a race condition?
- Does the 400 error from `/api/admin/emails` prevent guest fetching?

### 3. Alternative Approach
Since `waitForGuestOptions()` would work (it just checks for any options), we could:
- Use `waitForGuestOptions()` instead of `waitForSpecificGuests()`
- Accept that the dropdown might have old test data
- Select guests by index instead of by ID

But this is a workaround, not a fix.

## Recommended Next Steps

### Option 1: Fix the `/api/admin/emails` Endpoint
1. Investigate why GET `/api/admin/emails` returns 400
2. Fix the endpoint or update the component to handle the error
3. Re-run tests to see if this resolves the issue

### Option 2: Update Component to Handle API Errors
1. Update EmailComposer to gracefully handle `/api/admin/emails` failures
2. Ensure guest fetching continues even if emails endpoint fails
3. Add error logging to help debug

### Option 3: Use Workaround Pattern
1. Revert to using `waitForGuestOptions()` instead of `waitForSpecificGuests()`
2. Accept that tests might see old data
3. Select guests by visible text instead of by ID
4. Document this as a known limitation

## Files to Investigate

1. `app/api/admin/emails/route.ts` - Check GET handler
2. `components/admin/EmailComposer.tsx` - Check data fetching logic
3. `__tests__/e2e/admin/emailManagement.spec.ts` - Test file

## Current Test Pattern

```typescript
test.beforeEach(async ({ page }) => {
  // Navigate to admin dashboard first (ensures clean state)
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // Clean database FIRST to ensure no old test data
  await cleanup();
  
  // Create test data
  const supabase = createServiceClient();
  // ... create guests ...
});

test('test name', async ({ page }) => {
  await page.goto('/admin/emails');
  await page.waitForLoadState('networkidle');

  // Click Compose Email button
  const composeButton = page.locator('button:has-text("Compose Email")');
  await composeButton.click();
  await page.waitForTimeout(500);

  // Wait for specific test guests to appear in dropdown
  await waitForSpecificGuests(page, [testGuestId1]); // ❌ TIMES OUT HERE
  
  // ... rest of test ...
});
```

## Success Criteria

For tests to pass, we need:
1. `/api/admin/emails` GET endpoint to return 200 (or component to handle 400)
2. EmailComposer to fetch and display guests successfully
3. `waitForSpecificGuests()` to find the test guest IDs in the dropdown
4. All 5 failing tests to pass

## Impact

- Current E2E pass rate: 54% for email management (7/13 tests)
- Expected after fix: 92% (12/13 tests, 1 skipped)
- Overall E2E impact: +4.6% pass rate increase

## Next Action

Investigate the `/api/admin/emails` GET endpoint to understand why it's returning 400 errors and whether this is blocking the EmailComposer from fetching guests.
