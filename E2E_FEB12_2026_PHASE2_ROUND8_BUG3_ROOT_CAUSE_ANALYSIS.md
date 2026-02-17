# E2E Phase 2 Round 8 - Bug #3 Root Cause Analysis

## Date: February 13, 2026

## Problem Summary
After applying 27 fixes (23 timeout increases + 4 new waits), the inline section editor tests are STILL FLAKY:
- Test 1: "should toggle inline section editor and add sections" - FLAKY
- Test 2: "should edit section content and toggle layout" - FLAKY  
- Test 3: "should delete section with confirmation" - FLAKY

## Root Cause Identified

### The Real Issue: Dynamic Import Not Completing

The `InlineSectionEditor` component is **dynamically imported** in `app/admin/home-page/page.tsx`:

```typescript
const InlineSectionEditor = dynamic(() => 
  import('@/components/admin/InlineSectionEditor').then(mod => ({ default: mod.InlineSectionEditor })), 
  {
    loading: () => <div className="p-4 text-sm text-gray-600">Loading sections...</div>,
    ssr: false,
  }
);
```

And conditionally rendered:

```typescript
{showInlineSectionEditor && (
  <Card className="p-6">
    <InlineSectionEditor 
      pageType="home" 
      pageId="home" 
      onSave={() => console.log('Section saved')}
      compact={false}
    />
  </Card>
)}
```

### Why Timeout Increases Don't Help

The tests are waiting for `[data-testid="inline-section-editor"]` to appear, but:

1. **Dynamic import takes time**: The component code needs to be loaded
2. **Component mounting takes time**: React needs to mount the component
3. **API call takes time**: Component fetches sections on mount
4. **No reliable indicator**: Tests don't know when dynamic import completes

### Current Test Approach (WRONG)

```typescript
// Click toggle button
await toggleButton.click();

// Wait for button text to change
await expect(hideButtonIndicator).toBeVisible({ timeout: 20000 });

// Wait for component to appear
await expect(inlineEditor).toBeVisible({ timeout: 10000 });
```

**Problem**: Button text changes immediately (state update), but component may not be loaded yet!

## The Fix Strategy

### Option 1: Wait for Loading Indicator (RECOMMENDED)

Wait for the loading indicator to appear AND disappear:

```typescript
// Click toggle button
await toggleButton.click();

// Wait for loading indicator to appear
const loadingIndicator = page.locator('text=Loading sections...');
await expect(loadingIndicator).toBeVisible({ timeout: 5000 });

// Wait for loading indicator to disappear (component loaded)
await expect(loadingIndicator).not.toBeVisible({ timeout: 15000 });

// Now component should be ready
const inlineEditor = page.locator('[data-testid="inline-section-editor"]');
await expect(inlineEditor).toBeVisible({ timeout: 5000 });
```

### Option 2: Wait for Sections API Response

Wait for the API call that the component makes on mount:

```typescript
// Click toggle button
await toggleButton.click();

// Wait for sections API to complete
await page.waitForResponse(
  response => response.url().includes('/api/admin/sections/by-page/home/home'),
  { timeout: 15000 }
);

// Wait for component to render with data
await page.waitForTimeout(1000);

// Now component should be ready
const inlineEditor = page.locator('[data-testid="inline-section-editor"]');
await expect(inlineEditor).toBeVisible({ timeout: 5000 });
```

### Option 3: Combined Approach (MOST RELIABLE)

Combine both approaches:

```typescript
// Click toggle button
await toggleButton.click();

// Wait for either loading indicator OR sections API
await Promise.race([
  page.locator('text=Loading sections...').waitFor({ state: 'visible', timeout: 5000 }),
  page.waitForResponse(
    response => response.url().includes('/api/admin/sections/by-page'),
    { timeout: 5000 }
  )
]).catch(() => {});

// Wait for sections API to complete (if not already)
await page.waitForResponse(
  response => response.url().includes('/api/admin/sections/by-page/home/home'),
  { timeout: 15000 }
).catch(() => {});

// Wait for component to be fully rendered
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// Now component should be ready
const inlineEditor = page.locator('[data-testid="inline-section-editor"]');
await expect(inlineEditor).toBeVisible({ timeout: 5000 });
```

## Why Previous Fixes Didn't Work

### Fix Attempt 1: Increase Timeouts
- **What we did**: Increased 23 timeout values
- **Why it failed**: Timeouts don't help if component never loads
- **Lesson**: Waiting longer for something that won't happen doesn't help

### Fix Attempt 2: Add Initial Waits
- **What we did**: Added 3000ms wait before clicking toggle
- **Why it failed**: Component loads AFTER toggle, not before
- **Lesson**: Waiting before the action doesn't help with post-action loading

### Fix Attempt 3: Add Interactive Waits
- **What we did**: Added 1000ms wait after button text changes
- **Why it failed**: 1000ms might not be enough for dynamic import + mount + API
- **Lesson**: Fixed waits are unreliable - need to wait for actual indicators

## The Correct Fix

### Step 1: Update Test Helper Function

Create a reusable helper for waiting for inline editor:

```typescript
async function waitForInlineSectionEditor(page: Page) {
  // Wait for loading indicator to appear (dynamic import starting)
  const loadingIndicator = page.locator('text=Loading sections...');
  try {
    await loadingIndicator.waitFor({ state: 'visible', timeout: 3000 });
  } catch {
    // Loading indicator might be too fast to catch
  }

  // Wait for sections API to complete
  await page.waitForResponse(
    response => response.url().includes('/api/admin/sections/by-page/home/home'),
    { timeout: 15000 }
  );

  // Wait for network to settle
  await page.waitForLoadState('networkidle');

  // Wait for component to be fully rendered
  await page.waitForTimeout(1000);

  // Verify component is visible
  const inlineEditor = page.locator('[data-testid="inline-section-editor"]');
  await expect(inlineEditor).toBeVisible({ timeout: 5000 });
  
  return inlineEditor;
}
```

### Step 2: Update All Three Flaky Tests

Replace the current wait logic with the helper function:

```typescript
test('should toggle inline section editor and add sections', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  
  const toggleButton = page.locator('button:has-text("Show Inline Section Editor")');
  await expect(toggleButton).toBeVisible({ timeout: 15000 });
  await toggleButton.click();
  
  // Use helper function
  const inlineEditor = await waitForInlineSectionEditor(page);
  
  // Rest of test...
});
```

## Expected Results

After applying this fix:
- **Test 1**: Should pass consistently (no more flaky)
- **Test 2**: Should pass consistently (no more flaky)
- **Test 3**: Should pass consistently (no more flaky)
- **Overall**: 100% pass rate (17/17 tests passing)

## Implementation Priority

1. **HIGH**: Create helper function
2. **HIGH**: Update Test 1 (toggle and add sections)
3. **HIGH**: Update Test 2 (edit content and toggle layout)
4. **HIGH**: Update Test 3 (delete section)
5. **MEDIUM**: Run verification tests
6. **LOW**: Document results

## Time Estimate

- Helper function: 5 minutes
- Update 3 tests: 15 minutes
- Run verification: 10 minutes
- Document results: 5 minutes
- **Total**: 35 minutes

## Success Criteria

- All 3 flaky tests pass on first run
- No retries needed
- Tests complete in reasonable time (<60 seconds total)
- No timeout errors in logs

## Lessons Learned

1. **Dynamic imports need special handling**: Can't just wait for state changes
2. **Loading indicators are valuable**: They tell us when async operations complete
3. **API responses are reliable indicators**: Waiting for API is more reliable than fixed timeouts
4. **Fixed timeouts are unreliable**: Always wait for actual indicators when possible
5. **Test helpers reduce duplication**: Reusable functions make tests more maintainable

## Next Steps

1. Implement the helper function
2. Update the 3 flaky tests
3. Run verification tests
4. Document results
5. Move to Bug #4 if all tests pass
