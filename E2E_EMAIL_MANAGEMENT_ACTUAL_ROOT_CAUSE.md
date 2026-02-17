# E2E Email Management - Actual Root Cause Found

## Test Results

**Status**: 7/13 passing (54%), 5/13 failing (38%), 1/13 skipped (8%)

Same as before, but now we have the actual root cause!

## Root Cause Identified

### The Real Problem

The tests are failing because:

1. ✅ Test creates new guests with unique IDs
2. ✅ Guests are saved to database
3. ✅ EmailComposer loads guests from API
4. ❌ **But the dropdown contains OLD test data from previous runs, not the newly created guests**

### Evidence from Logs

```
[Test] Waiting for specific guests to appear: [ 'bcd8f21c-e52a-4b63-91f3-4f3c97f6db92' ]
[Test] Loaded 50 guests in dropdown
[Test] First 5 guests: [
  { "value": "6b0bb265-f21b-4bc8-a9ec-bb249f1c920d", "text": "John Doe (john.doe.1770679437794@example.com)" },
  { "value": "21c4923a-b2fb-4966-bfb7-7fabf0e9e511", "text": "John Doe (john.doe.1770682525296@example.com)" },
  ...
]
[Test] ⚠️  Missing guest IDs: [ 'bcd8f21c-e52a-4b63-91f3-4f3c97f6db92' ]
```

The dropdown has 50 guests, but they're all from PREVIOUS test runs (notice the old timestamps in emails). The newly created guest isn't there!

### Why This Happens

The `cleanup()` function runs at the START of `beforeEach`, but:
1. It might not be deleting all old test data
2. The API query returns the first 50 guests (pagination)
3. With 100+ old test guests in the database, the newly created guests might not be in the first 50 results

## The Solution

### Option 1: Better Cleanup (Recommended)
Ensure cleanup removes ALL test guests before creating new ones:

```typescript
test.beforeEach(async ({ page }) => {
  // Clean database FIRST - remove ALL guests
  await cleanup();
  
  const supabase = createServiceClient();
  
  // Delete any remaining test guests (belt and suspenders)
  await supabase
    .from('guests')
    .delete()
    .like('email', '%@example.com');
  
  // NOW create test data
  // ...
});
```

### Option 2: Select by Email Instead of ID
Since we control the email addresses, select by email which is visible in the dropdown:

```typescript
// Instead of:
await recipientsSelect.selectOption([testGuestId1, testGuestId2]);

// Do this:
// Find the option by email text
const option1 = await page.locator(`select#recipients option:has-text("${testGuestEmail1}")`);
const value1 = await option1.getAttribute('value');
await recipientsSelect.selectOption([value1]);
```

### Option 3: Use "All Guests" Option
For tests that don't need specific guests, use the "All Guests" radio button:

```typescript
// Select "All Guests" instead of individual selection
await page.locator('input[type="radio"][value="all"]').check();
// No need to select specific guests
```

## Why Our Previous Fix Didn't Work

Our fix made the wait strategy more robust, but it didn't address the core issue:
- ✅ We wait for guests to load (works)
- ✅ We log what's in the dropdown (works)
- ✅ We don't fail if specific IDs aren't found (works)
- ❌ **But we still try to select by ID, which fails because the IDs aren't there**

The `selectOption()` call itself times out because Playwright can't find options with those values.

## Recommended Fix

Combine all three approaches:

1. **Better cleanup** - Remove all test guests before each test
2. **Select by email** - More reliable than ID since we see it in the dropdown
3. **Use "All Guests"** - For tests that don't need specific selection

## Implementation Plan

### Step 1: Fix Cleanup
Update `beforeEach` to ensure all old test data is removed.

### Step 2: Update Test Selection Strategy
Change from ID-based selection to email-based or "All Guests" where appropriate.

### Step 3: Add Verification
After creating guests, verify they appear in the API response before opening the modal.

## Files to Modify

1. `__tests__/e2e/admin/emailManagement.spec.ts`
   - Enhance cleanup in `beforeEach`
   - Change selection strategy from ID to email
   - Use "All Guests" option where appropriate

## Expected Outcome

After implementing these fixes:
- **12/13 tests passing** (92%)
- **0/13 failing**
- **1/13 skipped** (feature not implemented)

## Confidence Level

**Very high confidence** - We now see exactly what's happening:
- Old test data polluting the dropdown
- New guests not in the first 50 results
- Selection by ID failing because IDs don't exist in dropdown

The fix is straightforward: better cleanup + better selection strategy.
