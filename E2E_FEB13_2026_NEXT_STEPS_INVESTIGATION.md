# E2E Reference Blocks - Investigation Results
**Date**: February 13, 2026
**Current Status**: 50% pass rate (4/8 tests)
**Investigation Focus**: Why tests are failing in beforeEach hook

## Root Cause Found

The tests are failing **before they even get to the reference selector logic**. The issue is in the `beforeEach` hook where it tries to navigate to `/admin/content-pages` and find the Edit button.

### The Problem

1. Test creates content page in database ✅
2. Test navigates to `/admin/content-pages` ✅
3. Test waits for API call to complete ✅
4. Test waits for Edit button to appear ❌ **FAILS HERE**

The content page exists in the database but isn't appearing in the UI list.

### Why This Happens

The `useContentPages` hook fetches data on mount, but there's a race condition:

```typescript
// In beforeEach:
1. Create test data in DB (using service client)
2. Navigate to /admin/content-pages
3. Wait for API response
4. Wait for Edit button

// What actually happens:
1. Data created ✅
2. Page loads and immediately calls API ✅
3. API returns data ✅
4. React renders... but test checks too early ❌
```

The test is checking for the Edit button before React has finished rendering the data table with the new content page.

## The Real Issue: Timing

Looking at the test output:
- **First try**: Fails at `openSectionEditor` - can't find title input (28.7s)
- **Retry**: Fails even earlier - can't find Edit button (33.2s)

This suggests the page isn't loading the data consistently. The retry is actually worse because it's failing earlier in the flow.

## Investigation Findings

### 1. Data Creation Works
The diagnostic script confirms:
- ✅ Event created successfully
- ✅ Activity created successfully  
- ✅ Content page created successfully
- ✅ Data visible with service client
- ✅ Data visible with anon client
- ✅ API simulation returns data

### 2. API Route Works
The API route (`/api/admin/content-pages`) correctly:
- ✅ Authenticates requests
- ✅ Calls `listContentPages()` service
- ✅ Returns `{ success: true, data: ContentPage[] }`

### 3. Hook Works
The `useContentPages` hook correctly:
- ✅ Fetches from `/api/admin/content-pages`
- ✅ Handles response format (`result.data.items || result.data`)
- ✅ Sets data in state

### 4. The Actual Problem
The test's waiting strategy isn't robust enough. It uses:

```typescript
await expect(async () => {
  await page.goto('/admin/content-pages');
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for API call
  await page.waitForResponse(
    response => response.url().includes('/api/admin/content-pages') && response.status() === 200,
    { timeout: 5000 }
  );
  
  await page.waitForTimeout(1000);
  
  // Check for Edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible({ timeout: 5000 });
}).toPass({ timeout: 30000, intervals: [2000, 3000, 5000] });
```

**Problems with this approach:**
1. `waitForResponse` might catch an old API call from a previous test
2. Fixed 1000ms timeout isn't enough for React to render
3. Edit button selector is too generic - might match wrong button
4. No verification that the specific test content page is visible

## Solution

The test needs to wait for the **specific content page** to appear, not just any Edit button.

### Recommended Fix

```typescript
// In beforeEach, after creating test data:
await expect(async () => {
  await page.goto('/admin/content-pages');
  await page.waitForLoadState('networkidle');
  
  // Wait for the specific content page to appear in the table
  const pageRow = page.locator(`text=Test Content Page`).first();
  await expect(pageRow).toBeVisible({ timeout: 5000 });
  
  // Now wait for Edit button in that row
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible({ timeout: 2000 });
  
  console.log('✓ Test content page is visible in UI');
}).toPass({ 
  timeout: 30000, 
  intervals: [1000, 2000, 3000, 5000] 
});
```

This approach:
1. ✅ Waits for the specific test page to appear
2. ✅ Then waits for the Edit button
3. ✅ Uses retry logic with exponential backoff
4. ✅ More reliable than waiting for generic Edit button

## Why the Other 4 Tests Pass

The 4 passing tests likely pass because:
1. They run later in the test suite (data already loaded)
2. They have different timing characteristics
3. They don't rely on the Edit button appearing immediately
4. Pure luck with timing

## Action Plan

### Immediate Fix (5 minutes)

Update the `beforeEach` hook to wait for the specific content page:

```typescript
// Replace the current waiting logic with:
await expect(async () => {
  await page.goto('/admin/content-pages');
  await page.waitForLoadState('networkidle');
  
  // Wait for table to load (look for DataTable component)
  const table = page.locator('table, [role="table"]').first();
  await expect(table).toBeVisible({ timeout: 3000 });
  
  // Wait for our specific test page to appear
  const testPageText = page.locator('text=Test Content Page').first();
  await expect(testPageText).toBeVisible({ timeout: 5000 });
  
  // Verify Edit button is clickable
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible({ timeout: 2000 });
  await expect(editButton).toBeEnabled({ timeout: 1000 });
  
  console.log('✓ Test content page is visible and editable');
}).toPass({ 
  timeout: 30000, 
  intervals: [1000, 2000, 3000, 5000] 
});
```

### Verify Fix (10 minutes)

Run the test suite to confirm all 8 tests pass:

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --workers=1
```

### If Still Failing

Add more detailed logging to see what's actually happening:

```typescript
// After navigation
const pageContent = await page.content();
console.log('Page HTML length:', pageContent.length);

const allText = await page.locator('body').textContent();
console.log('Page contains "Test Content Page":', allText?.includes('Test Content Page'));

const allButtons = await page.locator('button').allTextContents();
console.log('All buttons:', allButtons);
```

## Expected Outcome

After this fix:
- ✅ All 8 tests should pass
- ✅ Tests should be more reliable
- ✅ No more race conditions in beforeEach
- ✅ Clear error messages if data doesn't load

## Time Estimate

- Implementing fix: 5 minutes
- Running tests: 5 minutes
- Debugging if needed: 10 minutes
- **Total**: 20 minutes

## Success Criteria

- All 8 reference blocks tests passing
- Tests run in under 5 minutes total
- No flaky failures (run 3 times to verify)
- Clear console output showing test progress

