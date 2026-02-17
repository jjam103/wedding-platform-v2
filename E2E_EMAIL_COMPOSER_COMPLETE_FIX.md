# E2E Email Composer Complete Fix

## Root Cause Identified

The test is failing with "did not find some options" because:

1. ✅ **API works** - Returns 200 OK with guest data
2. ✅ **RLS policies work** - Admin can access guests
3. ✅ **Dropdown renders** - Has 50+ options visible
4. ❌ **Test guest IDs don't match** - Test creates guests with specific IDs, but dropdown shows different guests

## The Real Problem

The test creates guests in `beforeEach`:
```typescript
const { data: guest1 } = await supabase
  .from('guests')
  .insert({ first_name: 'Test', last_name: 'Guest1', email: testGuestEmail1, ... })
  .select()
  .single();
testGuestId1 = guest1!.id;
```

Then tries to select those guests:
```typescript
await recipientsSelect.selectOption([testGuestId1, testGuestId2]);
```

But the dropdown shows OLD guests from previous test runs that weren't cleaned up:
- `(john.doe.1770679437794@example.com)`
- `(john.doe.1770679414735@example.com)`
- etc.

## Why Cleanup Isn't Working

The `cleanup()` function runs AFTER each test, but:
1. Test creates 2 new guests
2. Test tries to select them
3. **Dropdown shows 50+ OLD guests from previous runs**
4. Test fails because new guest IDs aren't in the dropdown
5. Cleanup runs (too late)

## The Fix

### Option 1: Wait for New Guests to Appear (Recommended)
Update the test to wait for the specific guests to appear in the dropdown:

```typescript
// After creating guests, wait for them to appear in dropdown
await page.waitForFunction(
  (ids) => {
    const select = document.querySelector('select#recipients') as HTMLSelectElement;
    if (!select) return false;
    const values = Array.from(select.options).map(opt => opt.value);
    return ids.every(id => values.includes(id));
  },
  [testGuestId1, testGuestId2],
  { timeout: 10000 }
);
```

### Option 2: Clean Database Before Test
Run cleanup BEFORE creating test data:

```typescript
test.beforeEach(async () => {
  // Clean first
  await cleanup();
  
  // Then create test data
  const supabase = createServiceClient();
  // ... create guests ...
});
```

### Option 3: Use Unique Identifiers
Instead of selecting by ID, select by email (which is unique):

```typescript
// Find options by email instead of ID
const option1 = page.locator(`select#recipients option:has-text("${testGuestEmail1}")`);
const option2 = page.locator(`select#recipients option:has-text("${testGuestEmail2}")`);
await option1.click({ modifiers: ['Control'] });
await option2.click({ modifiers: ['Control'] });
```

## Recommended Solution

Combine Option 1 and Option 2:

1. **Clean database before test** - Ensures no old data
2. **Wait for new guests to appear** - Ensures test data is loaded
3. **Then select them** - Now they're guaranteed to be there

## Implementation

### Update Test Helper

```typescript
async function waitForSpecificGuests(page: Page, guestIds: string[]) {
  console.log('[Test] Waiting for specific guests to appear:', guestIds);
  
  // Wait for form to be loaded
  await page.waitForSelector('form[data-loaded="true"]', { timeout: 15000 });
  
  // Wait for select to exist
  await page.waitForSelector('select#recipients', { timeout: 5000 });
  
  // Wait for specific guest IDs to appear in options
  await page.waitForFunction(
    (ids) => {
      const select = document.querySelector('select#recipients') as HTMLSelectElement;
      if (!select) return false;
      const values = Array.from(select.options).map(opt => opt.value);
      console.log('[Browser] Available guest IDs:', values.length);
      console.log('[Browser] Looking for:', ids);
      const found = ids.every(id => values.includes(id));
      console.log('[Browser] All guests found:', found);
      return found;
    },
    guestIds,
    { timeout: 10000, polling: 500 }
  );
  
  console.log('[Test] Specific guests found in dropdown');
}
```

### Update Test

```typescript
test('should complete full email composition and sending workflow', async ({ page }) => {
  await page.goto('/admin/emails');
  await page.waitForLoadState('commit');

  // Click Compose Email button
  const composeButton = page.locator('button:has-text("Compose Email")');
  await expect(composeButton).toBeVisible({ timeout: 5000 });
  await composeButton.click();
  await page.waitForTimeout(500);

  // Wait for modal to open
  await expect(page.locator('h2:has-text("Compose Email")')).toBeVisible();

  // Select "Individual Guests" radio button (should be selected by default)
  const guestsRadio = page.locator('input[type="radio"][value="guests"]');
  await guestsRadio.check();
  await page.waitForTimeout(300);

  // Wait for specific test guests to appear in dropdown
  await waitForSpecificGuests(page, [testGuestId1, testGuestId2]);

  // Now select them
  const recipientsSelect = page.locator('select#recipients');
  await recipientsSelect.selectOption([testGuestId1, testGuestId2]);
  await page.waitForTimeout(300);

  // ... rest of test ...
});
```

### Update beforeEach

```typescript
test.beforeEach(async () => {
  // Clean database FIRST
  await cleanup();
  
  const supabase = createServiceClient();

  // Create test group
  const { data: group } = await supabase
    .from('groups')
    .insert({ name: 'Test Family' })
    .select()
    .single();
  testGroupId = group!.id;

  // Create test guests
  testGuestEmail1 = `guest1-${Date.now()}@example.com`;
  testGuestEmail2 = `guest2-${Date.now()}@example.com`;

  const { data: guest1 } = await supabase
    .from('guests')
    .insert({
      first_name: 'Test',
      last_name: 'Guest1',
      email: testGuestEmail1,
      group_id: testGroupId,
      age_type: 'adult',
      guest_type: 'wedding_guest',
    })
    .select()
    .single();
  testGuestId1 = guest1!.id;

  const { data: guest2 } = await supabase
    .from('guests')
    .insert({
      first_name: 'Test',
      last_name: 'Guest2',
      email: testGuestEmail2,
      group_id: testGroupId,
      age_type: 'adult',
      guest_type: 'wedding_guest',
    })
    .select()
    .single();
  testGuestId2 = guest2!.id;
});
```

## Success Criteria

After implementing this fix:
- ✅ Database is clean before each test
- ✅ Test creates fresh guests
- ✅ Test waits for those specific guests to appear
- ✅ Test can select them successfully
- ✅ All 5 failing email tests should pass

## Files to Update

1. `__tests__/e2e/admin/emailManagement.spec.ts` - Add helper function and update tests
2. `components/admin/EmailComposer.tsx` - Already fixed (supports both field formats)

## Next Steps

1. Implement `waitForSpecificGuests()` helper
2. Update all 5 failing tests to use it
3. Move cleanup to BEFORE test data creation
4. Run tests to verify fix
