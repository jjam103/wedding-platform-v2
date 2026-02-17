# E2E Pattern 4: Guest Groups - Complete UI Investigation

## Investigation Date
February 11, 2026

## Summary
Completed detailed investigation of the actual UI implementation for the guest management page. Found significant discrepancies between test expectations and actual implementation.

---

## Key Findings

### 1. NO "Add New Guest" Button Exists ❌

**Test Expectation:**
```typescript
await page.click('text=Add New Guest');
```

**Actual Implementation:**
The page uses a `CollapsibleForm` component with the title "Add Guest" (NOT "Add New Guest"):

```typescript
<CollapsibleForm
  title={selectedGuest ? 'Edit Guest' : 'Add Guest'}
  // ... other props
/>
```

**Impact:** 6 tests failing (50% of failures)

**Fix Required:** Update test selector from `text=Add New Guest` to `text=Add Guest`

---

### 2. NO Guest Registration API Route ❌

**Test Expectation:**
```typescript
POST /api/auth/guest/register
```

**Actual Implementation:**
- File search returned: "No files found matching your search"
- The registration route does NOT exist in the codebase

**Impact:** 3 tests failing (25% of failures)

**Options:**
1. **Skip these tests** - Registration feature not implemented
2. **Create the API route** - Implement the missing feature
3. **Update tests** - Test a different authentication flow

**Recommendation:** Skip these tests with clear documentation that guest registration is not yet implemented.

---

### 3. "Manage Groups" Section Structure

**Test Expectation:**
Tests assume "Manage Groups" is a separate navigation item or button.

**Actual Implementation:**
"Manage Groups" is a collapsible section WITHIN the guest management page:

```typescript
{/* Manage Groups Section */}
<div className="bg-white rounded-lg shadow-sm border border-sage-200">
  {/* Header */}
  <button
    onClick={() => setIsGroupFormOpen(!isGroupFormOpen)}
    className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors rounded-t-lg"
    aria-expanded={isGroupFormOpen}
  >
    <div className="flex-1 text-left">
      <h2 className="text-lg font-semibold text-sage-900">Manage Groups</h2>
      <p className="text-sm text-sage-600 mt-1">
        {groups.length} group{groups.length !== 1 ? 's' : ''} • Click to {isGroupFormOpen ? 'collapse' : 'expand'}
      </p>
    </div>
    <span 
      className={`text-sage-600 transition-transform duration-300 ${isGroupFormOpen ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      ▼
    </span>
  </button>

  {/* Collapsible Content */}
  {isGroupFormOpen && (
    <div className="p-4 space-y-4 border-t border-sage-200">
      {/* Add Group Form */}
      {/* Current Groups List */}
    </div>
  )}
</div>
```

**Key Points:**
- It's a collapsible section, not a separate page
- The button toggles the section open/closed
- Groups are managed inline on the same page

**Impact:** Tests need to click the collapsible header to expand the section before interacting with group forms.

---

### 4. Form Validation Implementation

**Test Expectation:**
Tests expect validation messages like:
- `text=Name is required`
- `text=already exists`

**Actual Implementation:**
The page uses:
1. **CollapsibleForm component** for guest forms
2. **Inline HTML form** for group forms
3. **Zod schemas** for validation (`createGuestSchema`, `updateGuestSchema`, `createGroupSchema`, `updateGroupSchema`)
4. **Toast notifications** for error messages (NOT inline validation messages)

**Validation Flow:**
```typescript
const handleSubmit = useCallback(async (data: any) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      addToast({
        type: 'success',
        message: isEdit ? 'Guest updated successfully' : 'Guest created successfully',
      });
      // ...
    } else {
      addToast({
        type: 'error',
        message: result.error?.message || 'Operation failed',
      });
    }
  } catch (error) {
    addToast({
      type: 'error',
      message: error instanceof Error ? error.message : 'Operation failed',
    });
  }
}, [selectedGuest, addToast, fetchGuests]);
```

**Impact:** Tests should look for toast notifications, not inline validation messages.

---

### 5. Separate Guest Groups Page Exists

**Discovery:**
There IS a separate `/admin/guest-groups` page that provides dedicated group management:

```typescript
// app/admin/guest-groups/page.tsx
export default function GuestGroupsPage() {
  // Full CRUD interface for groups
  // Uses DataTable component
  // Has CollapsibleForm for add/edit
  // Has ConfirmDialog for delete
}
```

**This means:**
- Tests could navigate to `/admin/guest-groups` for dedicated group management
- OR interact with the inline "Manage Groups" section on `/admin/guests`

---

## Test Failure Root Causes

### Root Cause #1: Incorrect Button Text (6 tests - 50%)
**Tests looking for:** `text=Add New Guest`
**Actual button text:** `Add Guest`

**Affected Tests:**
1. Guest creation workflow
2. Guest form validation
3. Guest update workflow
4. Duplicate email handling
5. XSS validation
6. Group dropdown population

### Root Cause #2: Missing API Route (3 tests - 25%)
**Tests calling:** `POST /api/auth/guest/register`
**Actual status:** Route does not exist (404)

**Affected Tests:**
1. Guest registration flow
2. Registration validation
3. Registration success

### Root Cause #3: Validation Message Expectations (2 tests - 17%)
**Tests looking for:** Inline validation messages like `text=Name is required`
**Actual behavior:** Toast notifications with error messages

**Affected Tests:**
1. Form validation test
2. Duplicate email test

### Root Cause #4: Group Management Navigation (1 test - 8%)
**Tests expecting:** Separate navigation to group management
**Actual behavior:** Collapsible section on same page

**Affected Tests:**
1. Group update/delete test

### Root Cause #5: Strict Mode Violations (1 test - 8%)
**Tests failing on:** Multiple h1 elements matching selector
**Actual issue:** Accommodations page has multiple h1 elements

**Affected Tests:**
1. Accommodations navigation test

---

## Recommended Fixes

### Priority 1: Fix Button Text (Quick Win - 6 tests)
```typescript
// Change from:
await page.click('text=Add New Guest');

// To:
await page.click('text=Add Guest');
```

### Priority 2: Skip Registration Tests (3 tests)
```typescript
test.skip('should complete guest registration', async ({ page }) => {
  // TODO: Implement guest registration API route
  // Route: POST /api/auth/guest/register
});
```

### Priority 3: Fix Validation Expectations (2 tests)
```typescript
// Change from:
await expect(page.locator('text=Name is required')).toBeVisible();

// To:
await expect(page.locator('[role="alert"]')).toContainText('Name is required');
// OR
await expect(page.locator('.toast')).toContainText('validation');
```

### Priority 4: Fix Group Management Navigation (1 test)
```typescript
// Add step to expand collapsible section:
await page.click('text=Manage Groups');
await page.waitForSelector('text=Add New Group');
// Then proceed with group operations
```

### Priority 5: Fix Strict Mode Violation (1 test)
```typescript
// Change from:
await page.click('h1');

// To:
await page.click('h1:has-text("Accommodations")');
// OR
await page.locator('h1').first().click();
```

---

## Implementation Details

### Guest Form Fields
```typescript
const formFields = [
  { name: 'groupId', label: 'Group', type: 'select', required: true },
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: false },
  { name: 'phone', label: 'Phone', type: 'text', required: false },
  { name: 'ageType', label: 'Age Type', type: 'select', required: true },
  { name: 'guestType', label: 'Guest Type', type: 'select', required: true },
  { name: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'textarea', required: false },
  { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: false },
  { name: 'departureDate', label: 'Departure Date', type: 'date', required: false },
  { name: 'airportCode', label: 'Airport', type: 'select', required: false },
  { name: 'flightNumber', label: 'Flight Number', type: 'text', required: false },
  { name: 'plusOneName', label: 'Plus-One Name', type: 'text', required: false },
  { name: 'notes', label: 'Notes', type: 'textarea', required: false },
];
```

### Group Form Fields
```typescript
// Inline HTML form (not CollapsibleForm)
<form onSubmit={handleGroupSubmit}>
  <input name="name" required placeholder="e.g., Smith Family, Bride's Friends" />
  <textarea name="description" rows={2} placeholder="Optional description" />
  <button type="submit">{selectedGroup ? 'Update Group' : 'Create Group'}</button>
</form>
```

### Toast Notification System
```typescript
// Success toast
addToast({
  type: 'success',
  message: 'Guest created successfully',
});

// Error toast
addToast({
  type: 'error',
  message: result.error?.message || 'Operation failed',
});
```

---

## Next Steps

1. **Apply Priority 1 fix** - Update button text in all 6 affected tests
2. **Apply Priority 2 fix** - Skip 3 registration tests with TODO comments
3. **Apply Priority 3 fix** - Update validation expectations in 2 tests
4. **Apply Priority 4 fix** - Add collapsible section expansion in 1 test
5. **Apply Priority 5 fix** - Fix strict mode violation in 1 test
6. **Run tests** - Verify all 12 tests pass
7. **Document** - Update test documentation with actual UI structure

---

## Expected Outcome

After applying all fixes:
- **Before:** 1/12 passing (8.3%)
- **After:** 9/12 passing (75%) - assuming registration tests are skipped
- **If registration implemented:** 12/12 passing (100%)

---

## Files to Modify

1. `__tests__/e2e/guest/guestGroups.spec.ts` - Apply all 5 priority fixes
2. `E2E_PATTERN_4_GUEST_GROUPS_PROGRESS.md` - Update with findings
3. `E2E_COMPLETE_FAILURE_ANALYSIS.md` - Update Pattern 4 status

---

## Conclusion

The investigation revealed that test expectations were based on assumptions rather than actual implementation. The main issues are:

1. **Incorrect button text** - Easy fix, high impact (6 tests)
2. **Missing API route** - Feature not implemented, skip tests
3. **Validation approach** - Tests expect inline messages, app uses toasts
4. **UI structure** - Tests expect separate page, app uses collapsible section
5. **Selector specificity** - Strict mode violations need more specific selectors

All issues are fixable with targeted test updates. No application code changes needed (except optionally implementing guest registration).
