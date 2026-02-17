# E2E Pattern 4: Guest Groups - Current Status

## Date
February 11, 2026

## Test Results
- **Passing**: 2/12 tests (16.7%)
- **Failing**: 10/12 tests (83.3%)
- **Status**: IN PROGRESS

---

## Investigation Complete ✅

### Root Cause Identified
The primary issue is that tests are looking for a button with text "Create Guest" but the actual button text in the `CollapsibleForm` component is just "Create".

**Evidence:**
```typescript
// In app/admin/guests/page.tsx
<CollapsibleForm
  title={selectedGuest ? 'Edit Guest' : 'Add Guest'}
  submitLabel={selectedGuest ? 'Update' : 'Create'}  // <-- Button text
  // ... other props
/>
```

**Test Expectation:**
```typescript
await page.click('button:has-text("Create Guest")');  // ❌ Wrong
```

**Actual Button:**
```typescript
<button type="submit">{submitLabel}</button>  // submitLabel = "Create"
```

---

## Fix Applied ✅

### Change Made
Updated the guest creation button selector in the test file:

```typescript
// Before:
await page.click('button:has-text("Create Guest")');

// After:
await page.click('button[type="submit"]:has-text("Create")');
```

**Location:** `__tests__/e2e/guest/guestGroups.spec.ts` line ~112

---

## Current Test Status

### Passing Tests (2/12 - 16.7%)
1. ✅ `should update and delete groups with proper handling`
2. ✅ `should have proper accessibility attributes`

**Why These Pass:**
- Don't interact with guest creation form
- Only test group management and accessibility

### Failing Tests (10/12 - 83.3%)

#### Category 1: Guest Creation Tests (7 tests)
1. ❌ `should create group and immediately use it for guest creation`
2. ❌ `should handle multiple groups in dropdown correctly`
3. ❌ `should show validation errors and handle form states`
4. ❌ `should handle network errors and prevent duplicates`
5. ❌ `should update dropdown immediately after creating new group`
6. ❌ `should handle async params and maintain state across navigation`
7. ❌ `should handle loading and error states in dropdown`

**Status:** Fix applied but tests still failing
**Next Step:** Need to investigate why tests are still failing after button text fix

#### Category 2: Guest Registration Tests (3 tests)
1. ❌ `should complete full guest registration flow`
2. ❌ `should prevent XSS and validate form inputs`
3. ❌ `should handle duplicate email and be keyboard accessible`

**Error:** `TimeoutError: page.waitForURL: Timeout 10000ms exceeded`
**Root Cause:** Registration doesn't redirect to `/guest/dashboard`
**Status:** Needs investigation - registration feature may not be fully implemented

---

## Next Steps

### Step 1: Debug Guest Creation Tests
The button text fix was applied but tests are still failing. Need to investigate:

1. **Check if button is visible** - Is the form actually open?
2. **Check if button is enabled** - Is the button disabled for some reason?
3. **Check form state** - Are all required fields filled?
4. **Check for other issues** - Are there validation errors preventing submission?

**Action:** Run single test with debug mode to see actual page state

### Step 2: Investigate Registration Tests
Need to determine if registration feature is implemented:

1. **Read `/auth/register` page** - Check implementation
2. **Check registration API** - Does `POST /api/auth/guest/register` exist?
3. **Check redirect logic** - Does form redirect on success?
4. **Decision:** Fix feature OR skip tests with TODO

### Step 3: Re-run Full Suite
After fixes, run complete test suite to verify:
```bash
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts
```

---

## Detailed Investigation Findings

### UI Structure (from app/admin/guests/page.tsx)

**Guest Form:**
- Uses `CollapsibleForm` component
- Title: "Add Guest" (not "Add New Guest")
- Submit button: "Create" (not "Create Guest")
- Form must be opened by clicking "Add Guest" header

**Group Management:**
- Collapsible section with header "Manage Groups"
- Inline HTML form (not CollapsibleForm)
- Submit button: "Create Group" ✅ (correct in tests)
- Update button: "Update Group" ✅ (correct in tests)

**Form Fields (memoized):**
```typescript
const formFields: GuestFormField[] = useMemo(() => [
  { name: 'groupId', label: 'Group', type: 'select', required: true },
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  // ... 11 more fields
], [groups]); // Re-creates when groups change
```

**Key Finding:** `formFields` is memoized and depends on `groups` array. This means when a new group is created, `formFields` should update automatically, and the dropdown should show the new group.

---

## Potential Issues

### Issue 1: Form Not Opening
**Symptom:** Button not found
**Cause:** Form might not be opening when "Add Guest" is clicked
**Test:** Check if `isFormOpen` state is true

### Issue 2: Button Disabled
**Symptom:** Button found but not clickable
**Cause:** Form validation might be preventing submission
**Test:** Check button `disabled` attribute

### Issue 3: Dropdown Not Updating
**Symptom:** New group not appearing in dropdown
**Cause:** `formFields` memo not updating when `groups` changes
**Test:** Check if dropdown options include new group

### Issue 4: Toast Not Showing
**Symptom:** Success toast not visible
**Cause:** Toast might be shown but with different text or timing
**Test:** Check for any toast with `[role="alert"]`

---

## Debugging Strategy

### Debug Test 1: Guest Creation
```typescript
test('DEBUG: should create group and use for guest', async ({ page }) => {
  // 1. Check initial state
  await page.goto('/admin/guests');
  await page.screenshot({ path: '1-initial.png' });
  
  // 2. Create group
  await page.click('text=Manage Groups');
  await page.screenshot({ path: '2-groups-open.png' });
  
  await page.fill('input[name="name"]', 'Test Group');
  await page.click('button:has-text("Create Group")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '3-group-created.png' });
  
  // 3. Open guest form
  await page.click('text=Add Guest');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '4-guest-form-open.png' });
  
  // 4. Check dropdown options
  const options = await page.locator('select[name="groupId"] option').allTextContents();
  console.log('Dropdown options:', options);
  
  // 5. Check if button exists
  const button = page.locator('button[type="submit"]:has-text("Create")');
  const isVisible = await button.isVisible();
  const isEnabled = await button.isEnabled();
  console.log('Button visible:', isVisible, 'enabled:', isEnabled);
  
  await page.screenshot({ path: '5-before-submit.png' });
});
```

---

## Files Modified

1. ✅ `__tests__/e2e/guest/guestGroups.spec.ts` - Updated button selector (line ~112)
2. ✅ `E2E_PATTERN_4_ROOT_CAUSE_ANALYSIS.md` - Created detailed analysis
3. ✅ `E2E_PATTERN_4_CURRENT_STATUS.md` - This file

---

## Overall E2E Progress

**Pattern Completion Status:**
1. ✅ **Pattern 1: Guest Views** - 55/55 tests (100%) - COMPLETE
2. ✅ **Pattern 2: UI Infrastructure** - 25/26 tests (96.2%) - COMPLETE
3. ✅ **Pattern 3: System Health** - 34/34 tests (100%) - COMPLETE
4. ⏳ **Pattern 4: Guest Groups** - 2/12 tests (16.7%) - IN PROGRESS
5. ⏳ **Pattern 5: Email Management** - 22 failures - NEXT
6. ⏳ **Pattern 6: Content Management** - 20 failures
7. ⏳ **Pattern 7: Data Management** - 18 failures
8. ⏳ **Pattern 8: User Management** - 15 failures

**Overall Statistics:**
- **Total Tests**: 365
- **Passing**: 246 (67.4%)
- **Failing**: 119 (32.6%)
- **Patterns Complete**: 3/8 (37.5%)

---

## Conclusion

Investigation is complete and root cause identified. One fix has been applied (button text selector) but tests are still failing. Need to debug further to understand why the button click is not working even with the correct selector.

The issue may be:
1. Form not opening properly
2. Button disabled due to validation
3. Dropdown not updating with new groups
4. Timing issues with async operations

Next action: Run debug test with screenshots to see actual page state at each step.
