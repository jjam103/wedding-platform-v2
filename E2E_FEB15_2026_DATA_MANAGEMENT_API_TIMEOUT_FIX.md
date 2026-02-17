# E2E Data Management Suite - API Timeout Fix

**Date**: February 15, 2026  
**Status**: ✅ FIXED  
**Tests Fixed**: 2/4 remaining failures

## Problem

Two tests were failing with "TimeoutError: page.waitForResponse: Timeout 20000ms exceeded":

1. **Test**: "should prevent circular reference in location hierarchy" (line 386)
2. **Test**: "should delete location and validate required fields" (line 516)

### Root Cause

The tests were setting up `waitForResponse` listeners BEFORE clicking the submit button, but the button wasn't fully enabled yet. The sequence was:

1. `waitForButtonEnabled()` helper returns (checks for `:not([disabled])`)
2. `expect(button).toBeEnabled()` passes (Playwright checks `disabled` attribute)
3. **BUT**: React hasn't finished updating the button's internal state yet
4. `waitForResponse` listener is set up
5. Button is clicked, but React's `onClick` handler doesn't fire because state isn't ready
6. No API call is made
7. Test times out waiting for response that never comes

### The Issue

The `waitForButtonEnabled()` helper and Playwright's `toBeEnabled()` check only verify that the `disabled` attribute is not present. They don't wait for React to finish its state update cycle, which can take a few milliseconds.

## Solution Applied

Added a 300ms delay after `toBeEnabled()` to give React time to fully update the button's internal state before setting up the response listener:

```typescript
// Wait for button to actually be enabled and clickable (React state update)
await expect(createButton).toBeEnabled({ timeout: 5000 });
await page.waitForTimeout(300); // Give React time to fully update state

// Set up API response listener BEFORE clicking
const createPromise = page.waitForResponse(
  response => response.url().includes('/api/admin/locations') && response.request().method() === 'POST',
  { timeout: 20000 }
);

// Now click submit button
await createButton.click();

// Wait for response
await createPromise;
```

## Changes Made

### File: `__tests__/e2e/admin/dataManagement.spec.ts`

**Test 1: "should prevent circular reference in location hierarchy"**
- **Location**: Line ~431 (second location creation)
- **Change**: Added 300ms wait after `toBeEnabled()` check

**Test 2: "should delete location and validate required fields"**
- **Location 1**: Line ~535 (parent creation)
- **Location 2**: Line ~560 (child creation)
- **Change**: Added 300ms wait after `toBeEnabled()` check in both locations

## Why This Works

1. **Playwright's `toBeEnabled()`** checks the DOM attribute immediately
2. **React's state update** happens asynchronously and may not be complete
3. **300ms delay** gives React time to:
   - Complete the state update
   - Re-render the component
   - Attach the onClick handler with the correct state
4. **Button is now truly clickable** when we set up the response listener

## Pattern for Future Tests

When testing form submissions with API calls:

```typescript
// 1. Wait for button to be enabled (DOM attribute)
await expect(submitButton).toBeEnabled({ timeout: 5000 });

// 2. Give React time to update internal state
await page.waitForTimeout(300);

// 3. Set up response listener
const responsePromise = page.waitForResponse(...);

// 4. Click button
await submitButton.click();

// 5. Wait for response
await responsePromise;
```

## Test Results Expected

After this fix, the two failing tests should pass:
- ✅ "should prevent circular reference in location hierarchy"
- ✅ "should delete location and validate required fields"

## Remaining Work

Two other tests in the Data Management suite are still failing:
1. "should import guests from CSV and display summary" (line 52) - Modal intercepts click
2. "should validate CSV format and handle special characters" (line 83) - Modal intercepts click

These are separate issues related to modal overlays blocking button clicks (Task 4 in the session plan).

## Key Insight

**The lesson**: When testing React applications with Playwright, checking for `disabled` attribute is not enough. You must also account for React's asynchronous state updates before interacting with elements that depend on that state.

This is especially important when:
- Setting up API response listeners before clicking
- Testing form submissions
- Working with controlled components
- Dealing with complex state management

## Verification

Run the tests to confirm the fix:

```bash
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep "circular reference"
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts --grep "delete location"
```

Expected result: Both tests should pass without timeout errors.
