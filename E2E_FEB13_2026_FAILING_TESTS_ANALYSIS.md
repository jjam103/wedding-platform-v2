# E2E Reference Blocks - Failing Tests Analysis

**Date**: February 14, 2026  
**Status**: 🔍 INVESTIGATION IN PROGRESS  
**Context**: Tests 3-10, 12 failing even with sequential execution

---

## Test Results Summary

| Test # | Test Name | Status | Duration | Pattern |
|--------|-----------|--------|----------|---------|
| 1 | should create event reference block | ✅ PASSED | 21.5s | Simple single reference |
| 2 | should create activity reference block | ✅ PASSED | 13.9s | Simple single reference |
| 3 | should create multiple reference types (1st) | ❌ FAILED | 25.6s | Multiple references |
| 4 | should create multiple reference types (retry) | ❌ FAILED | 26.1s | Multiple references |
| 5 | should remove reference from section (1st) | ❌ FAILED | 24.3s | Edit existing |
| 6 | should remove reference from section (retry) | ❌ FAILED | 23.7s | Edit existing |
| 7 | should filter references by type (1st) | ❌ FAILED | 24.9s | Filter UI |
| 8 | should filter references by type (retry) | ❌ FAILED | 23.9s | Filter UI |
| 9 | should prevent circular references (1st) | ❌ FAILED | 18.0s | Validation |
| 10 | should prevent circular references (retry) | ❌ FAILED | 15.8s | Validation |
| 11 | should detect broken references | ✅ PASSED | 14.1s | Validation |
| 12 | should display reference blocks in guest view (1st) | ❌ FAILED | 18.6s | Guest view |
| 13 | should display reference blocks in guest view (retry) | ⏱️ TIMEOUT | - | Guest view |

---

## Pattern Analysis

### Passing Tests (1, 2, 11)
**Common Characteristics:**
- Simple, single-action workflows
- Test #1: Create event reference → Save → Verify
- Test #2: Create activity reference → Save → Verify
- Test #11: Detect broken references (validation only)

**Why They Pass:**
- Straightforward UI interactions
- Single reference selection
- Clear success criteria
- All timing fixes work for these scenarios

### Failing Tests (3-10, 12)
**Common Characteristics:**
- More complex workflows
- Multiple interactions required
- Tests #3-4: Add multiple references (event + activity)
- Tests #5-6: Edit existing references (remove)
- Tests #7-8: Filter references by type
- Tests #9-10: Circular reference validation
- Test #12: Guest view rendering

**Potential Issues:**
1. **Multiple Reference Selection**: Tests 3-4 fail when adding both event AND activity references
2. **Pre-existing Data**: Tests 5-6 fail when editing sections with existing references
3. **UI State Management**: Tests 7-8 fail during filter interactions
4. **Navigation**: Tests 9-10 fail during page navigation (event pages)
5. **Guest View**: Test 12 fails when viewing as guest

---

## Detailed Failure Analysis

### Test #3-4: Multiple Reference Types

**Test Code:**
```typescript
// Add event reference
await typeSelect.selectOption('event');
await page.waitForTimeout(1500);
const eventItem = page.locator('button:has-text("Test Event for References")').first();
if (await eventItem.isVisible()) {
  await eventItem.click();
  await page.waitForTimeout(500);
}

// Add activity reference
await typeSelect.selectOption('activity');
await page.waitForTimeout(1500);
const activityItem = page.locator('button:has-text("Test Activity for References")').first();
if (await activityItem.isVisible()) {
  await activityItem.click();
  await page.waitForTimeout(500);
}
```

**Hypothesis:**
- Switching between reference types may not properly clear/update UI state
- The `if (await eventItem.isVisible())` suggests items might not be appearing
- 1500ms wait may be insufficient for API call + rendering

**Likely Root Cause:**
- SimpleReferenceSelector not properly handling type switches
- Items not rendering after second API call
- State not updating correctly when switching types

### Test #5-6: Remove Reference

**Test Code:**
```typescript
// Add reference to section
await supabase.from('columns').update({
  content_type: 'references',
  content_data: { references: [{ type: 'event', id: testEventId }] },
}).eq('section_id', testSectionId);

// Reload page to see the updated data
await page.reload();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

// Open section editor
await openSectionEditor(page);
```

**Hypothesis:**
- Pre-existing references not rendering correctly after page reload
- Section editor not showing existing references
- Remove button not appearing or not clickable

**Likely Root Cause:**
- Section editor not properly loading existing reference data
- UI not rendering pre-existing references
- Edit flow different from create flow

### Test #7-8: Filter References

**Hypothesis:**
- Filter dropdown interactions failing
- Items not appearing after filter selection
- UI state not updating after filter change

### Test #9-10: Circular References

**Test Code Pattern:**
- Navigate to event page
- Add section with reference back to content page
- Should show validation error

**Hypothesis:**
- Navigation to event page failing
- Event page section editor not loading
- Validation not triggering

### Test #12: Guest View

**Hypothesis:**
- Guest view route not loading
- References not rendering in guest view
- Preview modals not appearing

---

## Key Observations from Test Output

### 1. API Validation Errors
```
[WebServer]  POST /api/admin/references/validate 400 in 442ms
[WebServer]  POST /api/admin/references/validate 400 in 290ms
```

**Seen in:** Tests 5-6, 11

**Analysis:**
- Validation API returning 400 errors
- This is EXPECTED for test #11 (broken references)
- But NOT expected for tests 5-6 (remove reference)
- Suggests validation is failing when it shouldn't

### 2. Fast Refresh Warnings
```
[WebServer] ⚠ Fast Refresh had to perform a full reload
```

**Seen in:** Test 9

**Analysis:**
- Component hot reload during test execution
- May cause UI state to reset
- Could explain navigation test failures

### 3. Conditional Visibility Checks
```typescript
if (await eventItem.isVisible()) {
  await eventItem.click();
}
```

**Analysis:**
- Tests using conditional checks suggest flakiness
- Items may not be appearing consistently
- Indicates timing/rendering issues

---

## Recommended Investigation Steps

### Step 1: Add Detailed Logging
Add console.log statements to understand where tests fail:
- Log when items appear/don't appear
- Log API response data
- Log UI state before/after interactions

### Step 2: Increase Waits for Complex Interactions
- Increase wait from 1500ms to 3000ms for type switches
- Add explicit waits for API responses
- Use `toPass()` retry logic for item visibility

### Step 3: Fix SimpleReferenceSelector State Management
- Ensure component properly clears state when type changes
- Verify API calls complete before rendering items
- Add loading states to prevent premature interactions

### Step 4: Fix Pre-existing Reference Loading
- Verify section editor loads existing references
- Add explicit wait for reference preview elements
- Ensure edit flow works same as create flow

### Step 5: Investigate Validation API
- Check why validation returns 400 for valid references
- Verify validation logic in API route
- Add better error messages

---

## Quick Fixes to Try

### Fix 1: Increase Waits for Type Switches
```typescript
// Change from 1500ms to 3000ms
await typeSelect.selectOption('activity');
await page.waitForTimeout(3000); // Increased from 1500ms
```

### Fix 2: Add Retry Logic for Item Visibility
```typescript
await expect(async () => {
  const activityItem = page.locator('button:has-text("Test Activity for References")').first();
  await expect(activityItem).toBeVisible({ timeout: 2000 });
}).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });
```

### Fix 3: Wait for API Response
```typescript
await typeSelect.selectOption('activity');
await page.waitForResponse(response => 
  response.url().includes('/api/admin/activities') && response.status() === 200,
  { timeout: 10000 }
);
await page.waitForTimeout(1000); // Additional wait for rendering
```

### Fix 4: Remove Conditional Checks
```typescript
// Instead of:
if (await eventItem.isVisible()) {
  await eventItem.click();
}

// Use:
await expect(eventItem).toBeVisible({ timeout: 10000 });
await eventItem.click();
```

---

## Next Actions

1. **Run Single Failing Test with Debug Logging**
   ```bash
   npm run test:e2e -- referenceBlocks.spec.ts -g "should create multiple reference types"
   ```

2. **Apply Quick Fixes**
   - Increase waits for type switches
   - Add retry logic for item visibility
   - Remove conditional checks

3. **Test Each Fix Individually**
   - Verify fix works for one test
   - Apply to similar tests
   - Run full suite

4. **Document Root Causes**
   - Update test file with comments
   - Add to E2E troubleshooting guide
   - Update timing recommendations

---

## Conclusion

The failing tests all involve more complex interactions than the passing tests. The root causes appear to be:

1. **Insufficient waits** for type switches and API calls
2. **State management issues** in SimpleReferenceSelector
3. **Pre-existing data loading** not working correctly
4. **Validation API** returning unexpected 400 errors

These are test-specific issues, not infrastructure problems. The sequential execution configuration is working correctly - the infrastructure is solid.

**Recommendation**: Apply quick fixes to increase waits and add retry logic, then run full suite again.
