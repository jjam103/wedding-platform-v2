# E2E Data Management Test Fixes - Feb 15, 2026

## Problem Identified

The Location Hierarchy tests in `__tests__/e2e/admin/dataManagement.spec.ts` were failing because they weren't waiting for the CollapsibleForm to fully open before trying to interact with form fields.

## Root Cause

When clicking the "Add Location" button, the form uses a CSS transition to expand. The tests were immediately trying to find `input[name="name"]` without waiting for the form's `data-state` attribute to change to "open".

## Solution Applied

Added explicit wait for form opening using the `data-state` attribute:

```typescript
// Before (WRONG):
await addButton.click();
await expect(nameInput).toBeVisible();

// After (CORRECT):
await addButton.click();
await expect(formContent).toHaveAttribute('data-state', 'open', { timeout: 5000 });
await expect(nameInput).toBeVisible();
```

## Tests Fixed

### Test #1: "should create hierarchical location structure"
- Fixed 3 instances where form opening wasn't awaited (country, region, city creation)

### Test #2: "should prevent circular reference in location hierarchy"  
- Fixed 2 instances where form opening wasn't awaited (location A and B creation)

### Test #3: "should delete location and validate required fields"
- Fixed 3 instances where form opening wasn't awaited (parent, child, validation test)

## Selector Improvements

Also standardized selectors to use test IDs:

- `page.getByTestId('add-location-button')` - Add Location button
- `page.getByTestId('collapsible-form-content')` - Form content container
- `page.getByTestId('form-submit-button')` - Submit button
- `page.locator('input[name="name"]')` - Name input field
- `page.locator('select[name="parentLocationId"]')` - Parent location dropdown

## Why This Matters

The CollapsibleForm component has:
- A CSS transition (300ms duration)
- A `data-state` attribute that changes from "closed" to "open"
- Pointer events disabled when closed

Without waiting for `data-state="open"`, the test tries to interact with elements that are:
1. Not yet visible (opacity: 0)
2. Not yet interactable (pointer-events: none)
3. Still animating (maxHeight transition)

## Next Steps

Run the tests to verify:
```bash
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

Expected: All 3 Location Hierarchy tests should now pass.
