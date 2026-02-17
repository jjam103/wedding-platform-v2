# E2E Content Management Test Fix Analysis

## Current Status: 71% (12/17 passing)

### Test Results Summary
- **Passing**: 12 tests
- **Failing**: 3 tests
- **Flaky**: 2 tests (passed on retry)

## Root Cause Analysis

### Issue 1: Content Page Creation Timeout (Test #1)
**Problem**: Form submission doesn't trigger API call
**Root Cause**: CollapsibleForm component - button might be disabled or form not fully interactive
**Evidence**: 
- API response timeout after 15s
- Retry shows "View" button not appearing (page not created)

**Fix Strategy**:
1. Add longer wait after form expansion
2. Verify button is enabled before clicking
3. Check for form validation state
4. Alternative: Check for page in list instead of waiting for API response

### Issue 2: Home Page Save Success Message (Test #3)
**Problem**: Success message selector doesn't match actual UI
**Root Cause**: Component shows "Last saved: {time}" not "saved successfully"
**Evidence**: 
```typescript
// Test looks for:
'text=/Last saved:/i, text=/saved successfully/i'

// Component actually shows:
{lastSaved && (
  <p className="text-sm text-gray-500 mt-2">
    Last saved: {lastSaved.toLocaleTimeString()}
  </p>
)}
```

**Fix Strategy**:
1. Change selector to just look for "Last saved:" text
2. Verify timestamp updates after save
3. Alternative: Check that data persists on reload

### Issue 3: Event Creation Timeout (Test #16)
**Problem**: Event form submission doesn't trigger API call
**Root Cause**: Similar to Issue #1 - CollapsibleForm not fully interactive
**Evidence**: API response timeout after 15s on both attempts

**Fix Strategy**:
1. Same as Issue #1
2. Verify all required fields are filled
3. Check form validation state

### Issue 4: Inline Section Editor Visibility (Tests #8, #9 - Flaky)
**Problem**: `[data-testid="inline-section-editor"]` not found
**Root Cause**: Component doesn't have this data-testid attribute
**Evidence**: 
```typescript
// Test looks for:
'[data-testid="inline-section-editor"]'

// Component renders:
<InlineSectionEditor pageType="home" pageId="home" ... />
// No data-testid on wrapper
```

**Fix Strategy**:
1. Check actual InlineSectionEditor component structure
2. Use alternative selector (class name, role, or text content)
3. Add data-testid to component if needed

## Detailed Fixes

### Fix 1: Content Page Creation Flow
```typescript
// Current (failing):
await createButton.click();
const response = await page.waitForResponse(..., { timeout: 15000 });

// Fixed:
await createButton.click();

// Wait for form to close (indicates success)
await expect(titleInput).not.toBeVisible({ timeout: 10000 });

// Wait for success toast
await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 5000 });

// Verify page appears in list
await page.waitForLoadState('networkidle');
await expect(page.locator(`text=${pageTitle}`).first()).toBeVisible({ timeout: 10000 });
```

### Fix 2: Home Page Save Success
```typescript
// Current (failing):
const successMessage = page.locator('text=/Last saved:/i, text=/saved successfully/i').first();
await expect(successMessage).toBeVisible({ timeout: 5000 });

// Fixed:
// Wait for save to complete
await page.waitForLoadState('networkidle');

// Check for "Last saved:" text (component shows timestamp)
const lastSavedText = page.locator('text=/Last saved:/i').first();
await expect(lastSavedText).toBeVisible({ timeout: 5000 });

// Verify data persists
await page.reload({ waitUntil: 'domcontentloaded' });
expect(await page.locator('input#title').inputValue()).toBe(newTitle);
```

### Fix 3: Event Creation Flow
Same as Fix 1 - use form closure and list appearance instead of API response

### Fix 4: Inline Section Editor
```typescript
// Current (failing):
await expect(page.locator('[data-testid="inline-section-editor"]')).toBeVisible({ timeout: 5000 });

// Fixed (need to check actual component structure):
// Option A: Use text content
await expect(page.locator('text=/Add Section/i').first()).toBeVisible({ timeout: 5000 });

// Option B: Use component wrapper class
await expect(page.locator('.inline-section-editor, [class*="InlineSection"]').first()).toBeVisible({ timeout: 5000 });

// Option C: Check for draggable sections
await page.waitForSelector('[draggable="true"]', { timeout: 5000 });
```

## Implementation Plan

1. **Check InlineSectionEditor component** - Verify actual structure and selectors
2. **Fix home page save test** - Update success message selector
3. **Fix form submission tests** - Use form closure + list appearance instead of API response
4. **Fix inline editor tests** - Update selectors to match actual component
5. **Run tests** - Verify 100% pass rate

## Expected Outcome
- All 17 tests passing
- No flaky tests
- Reliable test execution
