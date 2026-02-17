# E2E Reference Blocks - Revert Changes & Investigation Plan
**Date**: February 14, 2026
**Status**: 🔄 Reverting bad fixes and investigating real issues

## Step 1: Revert Test #7 Changes

Test #7 (Filter by type) was passing before (17.8s) and is now failing after our "comprehensive timing fixes". We need to revert it to the baseline version.

### Changes We Made (That Broke It)
Lines 674-690 in `__tests__/e2e/admin/referenceBlocks.spec.ts`:

```typescript
// Wait for API response
await page.waitForResponse(response => 
  response.url().includes('/api/admin/events') && response.status() === 200,
  { timeout: 10000 }
);

// Wait for loading spinner to disappear
await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {
  console.log('No loading spinner found or already hidden');
});

// Wait for items to render with retry logic
await expect(async () => {
  const eventItem = page.locator('button:has-text("Test Event for References")').first();
  await expect(eventItem).toBeVisible({ timeout: 2000 });
}).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });
```

### What It Should Be (Baseline - Feb 13)
Based on the pattern from other passing tests, it should be simpler:

```typescript
// Filter by "Events"
await typeSelect.selectOption('event');

// Wait for items to load (simple wait)
await page.waitForTimeout(1000);

// Verify only events are shown
const eventItem = page.locator('button:has-text("Test Event for References")').first();
await expect(eventItem).toBeVisible();
```

## Step 2: Run Tests Individually

Run each test individually with debug output to understand what's actually happening:

### Test #1: Create Event Reference (FAILING)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:265 --debug
```

**Expected**: Should create event reference and save to database
**Actual**: Times out after items render
**Investigation**: Why doesn't it complete the workflow?

### Test #4: Create Multiple Types (PASSING)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:410 --debug
```

**Expected**: Should create both event and activity references
**Actual**: Passes
**Investigation**: Why does this pass when Test #1 fails?

### Test #6: Remove Reference (FAILING)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:508 --debug
```

**Expected**: Should remove reference and save
**Actual**: Times out waiting for save
**Investigation**: Why doesn't save complete?

### Test #7: Filter by Type (REGRESSION)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:652 --debug
```

**Expected**: Should filter and show only events
**Actual**: Items don't appear after our fixes
**Investigation**: What did our fixes break?

### Test #9: Circular References (FAILING)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:707 --debug
```

**Expected**: Should prevent circular reference and show error
**Actual**: Can't find Edit button for Content Page B
**Investigation**: What's the actual UI structure?

### Test #12: Guest View (FAILING)
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:877 --debug
```

**Expected**: Should display references in guest view
**Actual**: API returning "Loading details..."
**Investigation**: Why isn't API returning data?

## Step 3: Use Playwright UI Mode

Open tests in UI mode to step through and see what's happening:

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --ui
```

This allows us to:
- Step through each test action
- See the browser state at each step
- Inspect DOM elements
- See network requests
- Understand timing issues

## Step 4: Manual Testing

Open the admin UI and manually follow test steps:

### For Test #1 (Create Event Reference)
1. Navigate to `/admin/content-pages`
2. Click Edit on a content page
3. Click "Manage Sections"
4. Click "Add Section" (if needed)
5. Click "Edit" on section
6. Select "References" from column type
7. Select "event" from type dropdown
8. Click on an event item
9. Verify reference appears
10. Click "Save Section"
11. Verify save completes

**Document**: What actually happens at each step? Where does it differ from test expectations?

### For Test #9 (Circular References)
1. Navigate to `/admin/content-pages`
2. Find "Test Content Page B" card
3. Look for Edit button
4. Document actual card structure

**Document**: What's the actual HTML structure? How do we find the Edit button?

### For Test #12 (Guest View)
1. Navigate to `/custom/{slug}` in guest view
2. Open browser DevTools Network tab
3. Look for API call to `/api/admin/references/[type]/[id]`
4. Check response

**Document**: What's the actual API response? Why is it returning "Loading details..."?

## Step 5: Fix Real Bugs

Based on investigation, fix actual application bugs (not test selectors):

### Potential Bug #1: Save Not Completing
If Tests #1 and #6 timeout waiting for save, there might be a bug in the save handler.

**Files to Check**:
- `components/admin/InlineSectionEditor.tsx` - Save button handler
- `app/api/admin/sections/[id]/route.ts` - Save API endpoint
- Browser console for errors

### Potential Bug #2: UI Structure Mismatch
If Test #9 can't find Edit button, the UI structure might be different than expected.

**Files to Check**:
- `app/admin/content-pages/page.tsx` - Card layout
- Manual testing to see actual structure

### Potential Bug #3: API Not Returning Data
If Test #12 gets "Loading details...", the API might have an issue.

**Files to Check**:
- `app/api/admin/references/[type]/[id]/route.ts` - Why returning placeholder?
- `components/guest/GuestReferencePreview.tsx` - Data fetching logic

## Success Criteria

### Phase 1: Revert and Baseline
- ✅ Revert Test #7 to baseline version
- ✅ Run full test suite
- ✅ Verify we're back to 4/8 passing (50%)

### Phase 2: Investigation
- ✅ Run each failing test individually with --debug
- ✅ Use Playwright UI mode to step through tests
- ✅ Manual test each failing scenario
- ✅ Document actual behavior vs expected behavior

### Phase 3: Fix Real Bugs
- ✅ Identify root causes (not symptoms)
- ✅ Fix application bugs (not test selectors)
- ✅ Verify fixes with manual testing
- ✅ Run tests to confirm fixes work

### Phase 4: Achieve 100%
- ✅ All 8 tests passing consistently
- ✅ No flaky tests (run 3 times to verify)
- ✅ Tests complete in reasonable time (<5 minutes)

## Commands Reference

```bash
# Revert Test #7 changes (manual edit)
# Edit __tests__/e2e/admin/referenceBlocks.spec.ts lines 674-690

# Run full test suite
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts

# Run individual test with debug
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:LINE_NUMBER --debug

# Run with UI mode
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --ui

# Run with headed browser (see what's happening)
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --headed
```

## Next Actions

1. **Revert Test #7** - Remove our "comprehensive timing fixes"
2. **Run full suite** - Verify we're back to 4/8 passing
3. **Run Test #7 individually** - Confirm it passes after revert
4. **Investigate failing tests** - Use --debug and --ui modes
5. **Manual testing** - Understand actual UI behavior
6. **Fix real bugs** - Focus on application issues, not test issues
