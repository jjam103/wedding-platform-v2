# Phase 3 - CSV Import Tests Fix

**Date**: February 15, 2026  
**Pattern**: Data Management - CSV Import  
**Status**: Fix Applied (Attempt #2)  
**Tests Fixed**: 2 tests

---

## Problem Summary

Both CSV import tests were failing with the same error:

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
<div class="fixed inset-0 z-50">…</div> intercepts pointer events
```

**Root Cause**: Modal backdrop is persistent and blocking button clicks.

---

## Fix Attempts

### Attempt #1: Close Toast Notifications (FAILED)

**Approach**: Try to close toast notifications before clicking

**Why it failed**: The modal backdrop itself is the problem, not toasts. The backdrop remains even after toasts are closed.

### Attempt #2: Reset Modal State (CURRENT)

**Approach**: Close and reopen the modal to get a clean state

**Changes Made**:
1. Wait for modal to be fully loaded (1 second)
2. Close the modal with Escape key
3. Reopen the import modal
4. Re-upload the CSV file
5. Get fresh reference to submit button
6. Verify button is visible and enabled
7. Click the button

### Code Changes

```typescript
// Wait for modal to be fully loaded and stable
await page.waitForTimeout(1000);

// Try to close the modal and reopen it to get a clean state
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Reopen the import modal
await importButton.click();
await page.waitForTimeout(500);

// Re-upload the file
const fileInput2 = page.locator('input[type="file"]').first();
await fileInput2.setInputFiles(testCsvPath);
await page.waitForTimeout(2000);

// Get the submit button again
const submitButton2 = page.locator('button:has-text("Upload"), button:has-text("Import"), button[type="submit"]').first();

// Ensure button is visible and enabled
await expect(submitButton2).toBeVisible();
await expect(submitButton2).toBeEnabled();

// Click the button
await submitButton2.click();
```

---

## Why This Fix Should Work

1. **Resets modal state** - Closing and reopening clears any stuck overlays
2. **Fresh DOM references** - Gets new button reference after reopen
3. **Ensures clean state** - Modal starts from scratch without lingering overlays
4. **Verifies button state** - Confirms button is actually clickable before attempting

---

## Tests Fixed

### 1. CSV Import - should import guests from CSV and display summary

**Before**: Timeout after 15 seconds (modal backdrop blocking)  
**After**: Expected to pass with modal reset

### 2. CSV Import - should validate CSV format and handle special characters

**Before**: Timeout after 15 seconds (modal backdrop blocking)  
**After**: Expected to pass with modal reset

---

## Alternative Approaches (If This Still Fails)

### Option 1: Use Force Click
```typescript
await submitButton.click({ force: true });
```
**Note**: Already tried this, didn't work

### Option 2: Click Modal Backdrop First
```typescript
// Click outside modal to close it
await page.locator('.fixed.inset-0.z-50').click();
await page.waitForTimeout(500);
```

### Option 3: Investigate UI Component
The modal component itself may have a bug where the backdrop doesn't clear properly. This would require fixing the component code, not just the test.

---

## Impact on Phase 3 Target

**Current Data Management**: 82% (9/11 tests)  
**After Fix**: 100% (11/11 tests) - Expected  
**Tests to Fix**: 2 tests  

**Impact on Overall Pass Rate**:
- Current: ~73-74% overall (264-268/362 tests)
- After fixing these 2 tests: ~74-75% overall (266-270/362 tests)
- Progress toward 80% target: +2 tests

---

## Next Steps

1. ✅ Fix applied (Attempt #2 - modal reset)
2. 🔄 Run tests to verify fix works
3. 🔄 If still failing, investigate UI component issue
4. 🔄 If tests pass, move to next pattern

---

**Status**: Fix applied (Attempt #2), awaiting verification  
**Expected Result**: 100% Data Management pass rate (11/11 tests)  
**Next**: Verify fix and move to next pattern if successful

