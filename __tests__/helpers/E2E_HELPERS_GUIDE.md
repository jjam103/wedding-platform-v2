# E2E Test Helpers Guide

Comprehensive guide to using E2E test helper utilities for Playwright tests.

## Table of Contents

1. [Element Waiting Utilities](#element-waiting-utilities)
2. [Form Filling Utilities](#form-filling-utilities)
3. [Toast Message Utilities](#toast-message-utilities)
4. [Test Data Creation Utilities](#test-data-creation-utilities)
5. [Screenshot Utilities](#screenshot-utilities)
6. [Navigation Utilities](#navigation-utilities)
7. [Modal/Dialog Utilities](#modaldialog-utilities)
8. [Table/List Utilities](#tablelist-utilities)
9. [Authentication Utilities](#authentication-utilities)
10. [Cleanup Utilities](#cleanup-utilities)
11. [Assertion Utilities](#assertion-utilities)
12. [Debugging Utilities](#debugging-utilities)

---

## Element Waiting Utilities

### `waitForElement(page, selector, timeout?)`

Wait for an element to become visible.

**Parameters:**
- `page`: Playwright Page object
- `selector`: CSS selector or test ID
- `timeout`: Optional timeout in milliseconds (default: 5000)

**Example:**
```typescript
import { waitForElement } from '../helpers/e2eHelpers';

test('should display guest list', async ({ page }) => {
  await page.goto('/admin/guests');
  await waitForElement(page, '[data-testid="guest-list"]', 10000);
});
```

### `waitForElementHidden(page, selector, timeout?)`

Wait for an element to become hidden.

**Example:**
```typescript
await waitForElementHidden(page, '.loading-spinner');
```

### `waitForText(page, selector, text, timeout?)`

Wait for an element to contain specific text.

**Example:**
```typescript
await waitForText(page, '.status-badge', 'Complete', 5000);
```

### `waitForElementCount(page, selector, count, timeout?)`

Wait for a specific number of elements to be present.

**Example:**
```typescript
// Wait for exactly 5 guest rows
await waitForElementCount(page, '.guest-row', 5);
```

### `waitForPageLoad(page)`

Wait for page to finish loading (no loading indicators, network idle).

**Example:**
```typescript
await page.goto('/admin/guests');
await waitForPageLoad(page);
```

---

## Form Filling Utilities

### `fillAndSubmitForm(page, formData, submitButtonText?)`

Fill multiple form fields and submit.

**Parameters:**
- `formData`: Object with field names as keys and values as strings
- `submitButtonText`: Optional submit button text (default: "Submit")

**Example:**
```typescript
await fillAndSubmitForm(page, {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  ageType: 'adult'
}, 'Create Guest');
```

### `fillFormFieldByLabel(page, labelText, value)`

Fill a form field by its label text.

**Example:**
```typescript
await fillFormFieldByLabel(page, 'First Name', 'John');
await fillFormFieldByLabel(page, 'Email Address', 'john@example.com');
```

### `selectDropdownOption(page, labelText, optionText)`

Select an option from a dropdown by label.

**Example:**
```typescript
await selectDropdownOption(page, 'Guest Type', 'Wedding Guest');
await selectDropdownOption(page, 'Age Type', 'Adult');
```

### `toggleCheckbox(page, labelText, checked)`

Check or uncheck a checkbox by label.

**Example:**
```typescript
await toggleCheckbox(page, 'Adults Only', true);
await toggleCheckbox(page, 'Allow Plus Ones', false);
```

---

## Toast Message Utilities

### `waitForToast(page, message, type?)`

Wait for a toast notification to appear with specific message.

**Parameters:**
- `message`: Expected toast message text
- `type`: Toast type - 'success', 'error', 'info', or 'warning' (default: 'success')

**Example:**
```typescript
// Wait for success toast
await waitForToast(page, 'Guest created successfully', 'success');

// Wait for error toast
await waitForToast(page, 'Email is required', 'error');
```

### `waitForToastDismiss(page)`

Wait for any visible toast to disappear.

**Example:**
```typescript
await waitForToast(page, 'Saved successfully');
await waitForToastDismiss(page);
```

### `dismissToast(page)`

Manually dismiss a toast by clicking its close button.

**Example:**
```typescript
await dismissToast(page);
```

---

## Test Data Creation Utilities

### `createTestGuest(data)`

Create a test guest in the database.

**Example:**
```typescript
const guest = await createTestGuest({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  groupId: 'group-123',
  ageType: 'adult',
  guestType: 'wedding_guest',
  authMethod: 'email_matching'
});

console.log(guest.id); // Use in tests
```

### `createTestGroup(data)`

Create a test guest group.

**Example:**
```typescript
const group = await createTestGroup({
  name: 'Smith Family',
  groupOwnerId: null
});
```

### `createTestEvent(data)`

Create a test event.

**Example:**
```typescript
const event = await createTestEvent({
  name: 'Wedding Ceremony',
  date: '2026-06-15',
  slug: 'wedding-ceremony',
  location: 'Beach Resort',
  description: 'Main ceremony event'
});
```

### `createTestActivity(data)`

Create a test activity.

**Example:**
```typescript
const activity = await createTestActivity({
  name: 'Beach Volleyball',
  eventId: event.id,
  slug: 'beach-volleyball',
  capacity: 20,
  description: 'Fun beach activity'
});
```

### `createTestContentPage(data)`

Create a test content page.

**Example:**
```typescript
const page = await createTestContentPage({
  title: 'Our Story',
  slug: 'our-story',
  type: 'page',
  content: '<p>Once upon a time...</p>'
});
```

---

## Screenshot Utilities

### `takeTimestampedScreenshot(page, name)`

Take a full-page screenshot with timestamp.

**Example:**
```typescript
await takeTimestampedScreenshot(page, 'guest-list-error');
// Saves to: test-results/screenshots/guest-list-error-2026-02-04T10-30-45-123Z.png
```

### `takeElementScreenshot(page, selector, name)`

Take a screenshot of a specific element.

**Example:**
```typescript
await takeElementScreenshot(page, '.error-message', 'validation-error');
```

### `screenshotOnFailure(page, testInfo)`

Automatically take screenshot on test failure (use in `afterEach`).

**Example:**
```typescript
test.afterEach(async ({ page }, testInfo) => {
  await screenshotOnFailure(page, testInfo);
});
```

---

## Navigation Utilities

### `navigateAndWait(page, url)`

Navigate to a URL and wait for page to load completely.

**Example:**
```typescript
await navigateAndWait(page, '/admin/guests');
```

### `clickAndNavigate(page, selector)`

Click a link and wait for navigation to complete.

**Example:**
```typescript
await clickAndNavigate(page, 'text=View Details');
```

### `goBackAndWait(page)`

Go back to previous page and wait for load.

**Example:**
```typescript
await goBackAndWait(page);
```

---

## Modal/Dialog Utilities

### `waitForModal(page, titleText?)`

Wait for a modal dialog to open.

**Example:**
```typescript
await page.click('button:has-text("Create Guest")');
const modal = await waitForModal(page, 'Create Guest');
```

### `closeModal(page)`

Close an open modal by clicking close button or overlay.

**Example:**
```typescript
await closeModal(page);
```

---

## Table/List Utilities

### `getTableRowCount(page, tableSelector)`

Get the number of rows in a table.

**Example:**
```typescript
const count = await getTableRowCount(page, '[data-testid="guest-table"]');
expect(count).toBe(5);
```

### `findTableRow(page, tableSelector, cellContent)`

Find a table row by cell content.

**Example:**
```typescript
const row = await findTableRow(page, 'table', 'John Doe');
await expect(row).toContainText('john@example.com');
```

### `clickRowButton(page, tableSelector, rowIdentifier, buttonText)`

Click a button in a specific table row.

**Example:**
```typescript
await clickRowButton(page, 'table', 'John Doe', 'Edit');
await waitForModal(page, 'Edit Guest');
```

---

## Authentication Utilities

### `loginAsAdmin(page, email?, password?)`

Login as an admin user.

**Example:**
```typescript
await loginAsAdmin(page, 'admin@test.com', 'password');
```

### `loginAsGuest(page, email)`

Login as a guest user.

**Example:**
```typescript
await loginAsGuest(page, 'guest@example.com');
```

### `logout(page)`

Logout the current user.

**Example:**
```typescript
await logout(page);
```

---

## Cleanup Utilities

### `cleanupTestData(prefix?)`

Delete all test data with a specific prefix.

**Example:**
```typescript
// Clean up all data starting with "test-"
await cleanupTestData('test-');
```

### `deleteTestEntity(table, id)`

Delete a specific test entity by ID.

**Example:**
```typescript
await deleteTestEntity('guests', guest.id);
```

---

## Assertion Utilities

### `assertUrlContains(page, path)`

Assert that the current URL contains a specific path.

**Example:**
```typescript
await assertUrlContains(page, '/admin/guests');
```

### `assertAttribute(page, selector, attribute, value)`

Assert that an element has a specific attribute value.

**Example:**
```typescript
await assertAttribute(page, 'input[name="email"]', 'type', 'email');
```

### `assertHasClass(page, selector, className)`

Assert that an element has a specific CSS class.

**Example:**
```typescript
await assertHasClass(page, '.button', 'active');
```

---

## Debugging Utilities

### `logConsoleMessages(page)`

Log all browser console messages to test output.

**Example:**
```typescript
test('debug test', async ({ page }) => {
  logConsoleMessages(page);
  await page.goto('/admin/guests');
  // Console messages will be logged
});
```

### `logNetworkRequests(page)`

Log all network requests and responses.

**Example:**
```typescript
test('debug network', async ({ page }) => {
  logNetworkRequests(page);
  await page.goto('/admin/guests');
  // Network activity will be logged
});
```

### `debugPause(page)`

Pause test execution for manual debugging.

**Example:**
```typescript
await debugPause(page);
// Test will pause and open Playwright Inspector
```

---

## Complete Example Test

Here's a complete example using multiple helpers:

```typescript
import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  waitForPageLoad,
  createTestGroup,
  fillAndSubmitForm,
  waitForToast,
  waitForModal,
  findTableRow,
  clickRowButton,
  cleanupTestData,
  screenshotOnFailure,
} from '../helpers/e2eHelpers';

test.describe('Guest Management', () => {
  let testGroup: any;
  
  test.beforeAll(async () => {
    // Create test data
    testGroup = await createTestGroup({
      name: 'test-Smith Family'
    });
  });
  
  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData('test-');
  });
  
  test.afterEach(async ({ page }, testInfo) => {
    // Screenshot on failure
    await screenshotOnFailure(page, testInfo);
  });
  
  test('should create a new guest', async ({ page }) => {
    // Navigate to guests page
    await navigateAndWait(page, '/admin/guests');
    
    // Open create modal
    await page.click('button:has-text("Create Guest")');
    await waitForModal(page, 'Create Guest');
    
    // Fill form
    await fillAndSubmitForm(page, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: testGroup.id,
      ageType: 'adult',
      guestType: 'wedding_guest'
    }, 'Create');
    
    // Verify success
    await waitForToast(page, 'Guest created successfully', 'success');
    
    // Verify guest appears in table
    const row = await findTableRow(page, 'table', 'John Doe');
    await expect(row).toContainText('john@example.com');
  });
  
  test('should edit an existing guest', async ({ page }) => {
    await navigateAndWait(page, '/admin/guests');
    
    // Click edit button for John Doe
    await clickRowButton(page, 'table', 'John Doe', 'Edit');
    await waitForModal(page, 'Edit Guest');
    
    // Update email
    await fillAndSubmitForm(page, {
      email: 'john.doe@example.com'
    }, 'Save');
    
    // Verify success
    await waitForToast(page, 'Guest updated successfully', 'success');
    
    // Verify updated email
    const row = await findTableRow(page, 'table', 'John Doe');
    await expect(row).toContainText('john.doe@example.com');
  });
});
```

---

## Best Practices

### 1. Use Helpers Consistently

```typescript
// ✅ Good - Use helpers
await waitForElement(page, '.guest-list');
await fillAndSubmitForm(page, formData);

// ❌ Bad - Duplicate helper logic
await expect(page.locator('.guest-list')).toBeVisible();
await page.fill('input[name="firstName"]', 'John');
await page.fill('input[name="lastName"]', 'Doe');
await page.click('button[type="submit"]');
```

### 2. Handle Edge Cases

```typescript
// Helpers handle common edge cases automatically
await waitForToast(page, 'Success'); // Tries multiple toast selectors
await waitForModal(page); // Tries multiple modal selectors
```

### 3. Clean Up Test Data

```typescript
test.afterAll(async () => {
  // Always clean up test data
  await cleanupTestData('test-');
});
```

### 4. Take Screenshots on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
  await screenshotOnFailure(page, testInfo);
});
```

### 5. Use Descriptive Names

```typescript
// ✅ Good - Descriptive screenshot names
await takeTimestampedScreenshot(page, 'guest-creation-validation-error');

// ❌ Bad - Generic names
await takeTimestampedScreenshot(page, 'error');
```

---

## Troubleshooting

### Element Not Found

If `waitForElement` times out:

1. Check selector is correct
2. Increase timeout if needed
3. Use `debugPause` to inspect page
4. Check console logs with `logConsoleMessages`

### Toast Not Appearing

If `waitForToast` fails:

1. Verify toast message text is exact
2. Check toast type is correct
3. Increase timeout if needed
4. Take screenshot to see page state

### Form Submission Failing

If `fillAndSubmitForm` fails:

1. Verify field names match form inputs
2. Check submit button text is correct
3. Use `fillFormFieldByLabel` for complex forms
4. Debug with `logNetworkRequests`

---

## Contributing

When adding new helpers:

1. Add JSDoc comments with examples
2. Handle common edge cases
3. Use consistent naming patterns
4. Add to this guide
5. Write unit tests

---

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [E2E Testing Guide](../../docs/E2E_TESTING_GUIDE.md)
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Testing Patterns](.kiro/steering/testing-patterns.md)

---

**Last Updated**: February 4, 2026  
**Maintainer**: Development Team
