# E2E Email Composer Root Cause Found

## The Real Issue

The EmailComposer component has a **loading state** that prevents the dropdown from rendering until data is loaded:

```typescript
{loading ? (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jungle-500"></div>
    <p className="mt-2 text-sage-600">Loading...</p>
  </div>
) : (
  // Form fields including dropdown
)}
```

## What's Happening

1. ✅ Test opens modal
2. ✅ Component starts fetching data (`loading = true`)
3. ❌ **Test tries to select dropdown BEFORE loading completes**
4. ❌ Dropdown doesn't exist yet (still showing loading spinner)
5. ❌ Test fails with "did not find some options"

## Why Tests Are Failing

The test helper `waitForGuestOptions()` waits for the `<select>` element to exist, but:
- The `<select>` element is NOT rendered while `loading === true`
- The test tries to access it too early
- By the time the test times out, the dropdown still hasn't appeared

## The Fix

We need to update the test helper to:
1. **Wait for loading to complete** (loading spinner to disappear)
2. **Then wait for dropdown to exist**
3. **Then wait for options to populate**

## Current Test Helper (Incorrect)

```typescript
async function waitForGuestOptions(page: Page) {
  // Waits for loading indicator (good)
  const loadingIndicator = page.locator('text=Loading...');
  if (await loadingIndicator.isVisible()) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
  }
  
  // Then waits for select (good)
  await page.waitForSelector('select#recipients', { timeout: 10000 });
  
  // Then waits for options (good)
  await page.waitForFunction(() => {
    const select = document.querySelector('select#recipients');
    return select && select.options.length > 0;
  }, { timeout: 15000 });
}
```

This SHOULD work, but there might be a timing issue where:
- Loading completes
- Component re-renders
- But dropdown hasn't appeared in DOM yet

## Better Fix: Add Data Attribute

Add a `data-loaded="true"` attribute to the form when data is loaded, so tests can wait for it:

```typescript
<form 
  onSubmit={handleSubmit} 
  className="px-6 py-4" 
  aria-label="Email composition form"
  data-loaded={!loading ? "true" : "false"}
>
```

Then test can wait for:
```typescript
await page.waitForSelector('form[data-loaded="true"]');
```

## Alternative: Just Wait Longer

The simplest fix might be to just add a longer wait after the modal opens:

```typescript
await composeButton.click();
await page.waitForTimeout(2000); // Wait for data to load
```

But this is not ideal because it's a fixed wait that might be too short or too long.

## Recommended Solution

1. Add `data-loaded` attribute to form
2. Update test helper to wait for `data-loaded="true"`
3. Then wait for dropdown options

This ensures tests wait for the exact moment when data is ready, not just a fixed timeout.
