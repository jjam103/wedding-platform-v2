# E2E Email Composer Final Solution

## Current Status

✅ **Component fixed** - Supports both field formats, has data-loaded attribute
✅ **Test helper added** - `waitForSpecificGuests()` function created
✅ **Cleanup moved** - Now runs BEFORE test data creation
❌ **Still failing** - Timeout waiting for specific guests to appear

## New Root Cause Discovered

The test is timing out at `waitForSpecificGuests()` because:

1. ✅ Cleanup works - Old guests are removed
2. ✅ New guests created - Test data exists in database
3. ❌ **Dropdown doesn't show new guests** - Component doesn't refetch

### Why Component Doesn't Refetch

The EmailComposer component fetches data in `useEffect` when `isOpen` changes:

```typescript
useEffect(() => {
  if (!isOpen) return;
  
  const fetchData = async () => {
    // Fetch guests, groups, templates
  };
  
  fetchData();
}, [isOpen, addToast]);
```

**Problem**: If the modal stays open between tests (or reopens too quickly), the `isOpen` dependency doesn't trigger a refetch.

## The Real Solution

We need to ensure the component refetches data every time the modal opens, even if it was already open. There are 3 options:

### Option 1: Force Modal to Close Between Tests (Recommended)
Ensure the modal is fully closed before opening it again:

```typescript
test('should complete full email composition and sending workflow', async ({ page }) => {
  await page.goto('/admin/emails');
  await page.waitForLoadState('commit');

  // Ensure modal is closed first
  const modal = page.locator('h2:has-text("Compose Email")');
  if (await modal.isVisible().catch(() => false)) {
    await page.locator('button[aria-label="Close"]').click();
    await expect(modal).not.toBeVisible();
  }

  // Now open modal
  const composeButton = page.locator('button:has-text("Compose Email")');
  await composeButton.click();
  await page.waitForTimeout(500);

  // Wait for modal to open
  await expect(modal).toBeVisible();

  // ... rest of test ...
});
```

### Option 2: Add Refetch Trigger to Component
Add a key or timestamp to force remount:

```typescript
// In EmailComposer
useEffect(() => {
  if (!isOpen) return;
  
  const fetchData = async () => {
    // Always refetch when modal opens
    setLoading(true);
    // ... fetch logic ...
  };
  
  fetchData();
}, [isOpen]); // Remove addToast from dependencies to force refetch
```

### Option 3: Navigate Away and Back
Force a full page reload between tests:

```typescript
test.beforeEach(async ({ page }) => {
  // Navigate to a different page first
  await page.goto('/admin');
  await page.waitForLoadState('commit');
  
  // Clean database
  await cleanup();
  
  // Create test data
  // ...
  
  // Now navigate to emails page
  await page.goto('/admin/emails');
  await page.waitForLoadState('commit');
});
```

## Recommended Implementation

Use **Option 3** (navigate away and back) because it:
- ✅ Ensures clean state between tests
- ✅ Forces component to remount and refetch
- ✅ Doesn't require component changes
- ✅ Most reliable for E2E tests

## Updated Test Pattern

```typescript
test.beforeEach(async ({ page }) => {
  // Navigate to admin dashboard first (ensures clean state)
  await page.goto('/admin');
  await page.waitForLoadState('commit');
  
  // Clean database FIRST
  await cleanup();
  
  const supabase = createServiceClient();

  // Create test data
  // ... create groups and guests ...
});

test('should complete full email composition and sending workflow', async ({ page }) => {
  // Navigate to emails page (fresh component mount)
  await page.goto('/admin/emails');
  await page.waitForLoadState('commit');

  // Click Compose Email button
  const composeButton = page.locator('button:has-text("Compose Email")');
  await expect(composeButton).toBeVisible({ timeout: 5000 });
  await composeButton.click();
  await page.waitForTimeout(500);

  // Wait for modal to open
  await expect(page.locator('h2:has-text("Compose Email")')).toBeVisible();

  // Select "Individual Guests" radio button
  const guestsRadio = page.locator('input[type="radio"][value="guests"]');
  await guestsRadio.check();
  await page.waitForTimeout(300);

  // Wait for specific test guests to appear in dropdown
  await waitForSpecificGuests(page, [testGuestId1, testGuestId2]);

  // Now select them
  const recipientsSelect = page.locator('select#recipients');
  await recipientsSelect.selectOption([testGuestId1, testGuestId2]);
  
  // ... rest of test ...
});
```

## Files to Update

1. `__tests__/e2e/admin/emailManagement.spec.ts` - Update beforeEach to navigate away first

## Success Criteria

After this fix:
- ✅ Each test starts with clean database
- ✅ Each test navigates to emails page fresh
- ✅ Component mounts and fetches current data
- ✅ Test waits for specific guests to appear
- ✅ Test can select them successfully
- ✅ All 5 failing email tests pass

## Next Step

Update the `beforeEach` to include navigation to `/admin` first, then implement the fix in all failing tests.
