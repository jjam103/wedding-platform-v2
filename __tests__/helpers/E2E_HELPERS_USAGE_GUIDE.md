# E2E Test Helpers - Usage Guide
**Date**: February 16, 2026

## Overview

This guide provides comprehensive examples for using the new E2E test helper utilities designed to prevent race conditions and improve test reliability.

## Available Helpers

### 1. Test Data Generator (`testDataGenerator.ts`)
### 2. Test Execution Locks (`testLocks.ts`)
### 3. Wait Helpers (`waitHelpers.ts`)
### 4. Enhanced Guest Authentication (`guestAuthHelpers.ts`)
### 5. Enhanced Cleanup (`cleanup.ts`)

---

## 1. Test Data Generator

### Purpose
Generates unique test data to prevent conflicts in parallel test execution.

### Import
```typescript
import {
  generateUniqueTestData,
  generateUniqueEmail,
  generateUniqueName,
  generateUniqueSlug,
  generateSessionToken,
  generateTestId,
} from '@/__tests__/helpers/testDataGenerator';
```

### Example 1: Complete Test Data Set
```typescript
test('should create guest with unique data', async () => {
  const testData = generateUniqueTestData('create-guest');
  
  // testData contains:
  // - testId: 'create-guest-1708123456789-abc123'
  // - email: 'test-create-guest-1708123456789-abc123@example.com'
  // - groupName: 'Test Group create-guest-1708123456789-abc123'
  // - eventName: 'Test Event create-guest-1708123456789-abc123'
  // - activityName: 'Test Activity create-guest-1708123456789-abc123'
  // - slug: 'test-create-guest-1708123456789-abc123'
  // - firstName: 'Test'
  // - lastName: 'User abc123'
  
  const guest = await createTestGuest({
    email: testData.email,
    firstName: testData.firstName,
    lastName: testData.lastName,
  });
  
  expect(guest.email).toBe(testData.email);
  
  // Cleanup with unique test ID
  await comprehensiveCleanup(testData.testId);
});
```

### Example 2: Individual Generators
```typescript
test('should create event with unique data', async () => {
  const email = generateUniqueEmail('event-creator');
  // 'event-creator-1708123456789-abc123@example.com'
  
  const eventName = generateUniqueName('Event');
  // 'Test Event 1708123456789-abc123'
  
  const slug = generateUniqueSlug('event');
  // 'event-1708123456789-abc123'
  
  const event = await createTestEvent({
    name: eventName,
    slug: slug,
    createdBy: email,
  });
  
  expect(event.slug).toBe(slug);
});
```

### Example 3: Session Token Generation
```typescript
test('should create session with unique token', async () => {
  const token = generateSessionToken();
  // 64-character hex string: 'a1b2c3d4e5f6...'
  
  const session = await createSession({
    guestId: 'guest-123',
    token: token,
  });
  
  expect(session.token).toBe(token);
});
```

---

## 2. Test Execution Locks

### Purpose
Prevents race conditions when multiple tests access shared resources simultaneously.

### Import
```typescript
import {
  withLock,
  isLocked,
  waitForUnlock,
  clearAllLocks,
} from '@/__tests__/helpers/testLocks';
```

### Example 1: Basic Lock Usage
```typescript
test('should update admin settings safely', async () => {
  await withLock('admin-settings', async () => {
    // Only one test can modify settings at a time
    const result = await updateSettings({ theme: 'dark' });
    expect(result.success).toBe(true);
  });
});
```

### Example 2: Multiple Resource Locks
```typescript
test('should update guest and group safely', async () => {
  const guestId = 'guest-123';
  const groupId = 'group-456';
  
  // Lock guest first
  await withLock(`guest-${guestId}`, async () => {
    // Then lock group
    await withLock(`group-${groupId}`, async () => {
      // Both resources locked, safe to modify
      await updateGuest(guestId, { groupId });
      await updateGroup(groupId, { memberCount: 5 });
    });
  });
});
```

### Example 3: Check Lock Status
```typescript
test('should wait for resource to be available', async () => {
  if (isLocked('admin-settings')) {
    // Wait for lock to be released
    await waitForUnlock('admin-settings', 10000); // 10 second timeout
  }
  
  // Now safe to access
  const settings = await getSettings();
  expect(settings).toBeDefined();
});
```

### Example 4: Cleanup Locks
```typescript
afterAll(async () => {
  // Clear all locks after test suite
  clearAllLocks();
});
```

---

## 3. Wait Helpers

### Purpose
Provides reliable wait conditions for async operations, CSS loading, modals, navigation, etc.

### Import
```typescript
import {
  waitForCondition,
  waitForStyles,
  waitForModalClose,
  waitForNavigation,
  waitForApiResponse,
  waitForElementStable,
  waitForDataLoaded,
  waitForToast,
} from '@/__tests__/helpers/waitHelpers';
```

### Example 1: Wait for CSS to Load
```typescript
test('should have correct styling', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Wait for CSS to load before checking styles
  await waitForStyles(page);
  
  const button = page.locator('button').first();
  const bgColor = await button.evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
});
```

### Example 2: Wait for Modal to Close
```typescript
test('should handle modal workflow', async ({ page }) => {
  await page.goto('/admin/guests');
  await waitForStyles(page);
  
  // Open modal
  await page.click('button:has-text("Add Guest")');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Wait for modal to close before continuing
  await waitForModalClose(page, '[role="dialog"]');
  
  // Now safe to check results
  expect(page.url()).toContain('/admin/guests');
});
```

### Example 3: Wait for Navigation
```typescript
test('should navigate correctly', async ({ page }) => {
  await page.goto('/admin');
  await waitForStyles(page);
  
  await page.click('a:has-text("Guests")');
  
  // Wait for navigation to complete (URL change + network idle + CSS)
  await waitForNavigation(page, '/admin/guests');
  
  expect(page.url()).toContain('/admin/guests');
});
```

### Example 4: Wait for API Response
```typescript
test('should load data from API', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Wait for API call to complete
  const response = await waitForApiResponse(page, '/api/admin/guests');
  
  expect(response.status()).toBe(200);
  
  // Data should now be loaded
  await expect(page.locator('[data-testid="guest-list"]')).toBeVisible();
});
```

### Example 5: Wait for Element to Stop Moving
```typescript
test('should interact with stable element', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Wait for element to stop animating
  await waitForElementStable(page, 'button[type="submit"]');
  
  // Now safe to click
  await page.click('button[type="submit"]');
});
```

### Example 6: Wait for Data to Load
```typescript
test('should display loaded data', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Wait for data to load (checks for data-testid and loading indicators)
  await waitForDataLoaded(page, 'guest-list');
  
  const guests = page.locator('[data-testid="guest-item"]');
  expect(await guests.count()).toBeGreaterThan(0);
});
```

### Example 7: Wait for Toast Message
```typescript
test('should show success toast', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.click('button:has-text("Add Guest")');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Wait for toast to appear and disappear
  await waitForToast(page, 'Guest created successfully');
  
  // Toast has appeared and disappeared, safe to continue
});
```

### Example 8: Wait for Custom Condition
```typescript
test('should wait for custom condition', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Wait for custom condition
  await waitForCondition(async () => {
    const count = await page.locator('[data-testid="guest-item"]').count();
    return count > 0;
  }, 10000); // 10 second timeout
  
  expect(await page.locator('[data-testid="guest-item"]').count()).toBeGreaterThan(0);
});
```

---

## 4. Enhanced Guest Authentication

### Purpose
Provides reliable guest authentication using API endpoints for proper flow and cookie setting.

### Import
```typescript
import {
  createGuestSessionForTest,
  authenticateAsGuestForTest,
  navigateToGuestDashboard,
  cleanupGuestSession,
} from '@/__tests__/helpers/guestAuthHelpers';
```

### Example 1: Authenticate Existing Guest
```typescript
test('should authenticate guest correctly', async ({ page }) => {
  // Create guest first (in beforeEach or test setup)
  const guest = await createTestGuest({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  });
  
  // Create session using API endpoint
  const token = await createGuestSessionForTest(page, guest.id);
  
  // Navigate to dashboard
  await navigateToGuestDashboard(page);
  
  // Verify we're on dashboard
  expect(page.url()).toContain('/guest/dashboard');
  
  // Cleanup
  await cleanupGuestSession(guest.id);
});
```

### Example 2: Authenticate New Guest
```typescript
test('should authenticate new guest', async ({ page }) => {
  // Creates guest if doesn't exist, creates session, sets cookie
  const { guestId, token } = await authenticateAsGuestForTest(
    page,
    'newguest@example.com'
  );
  
  // Navigate to dashboard
  await navigateToGuestDashboard(page);
  
  // Verify authentication
  expect(page.url()).toContain('/guest/dashboard');
  
  // Cleanup
  await cleanupGuestSession(guestId);
});
```

### Example 3: Authenticate with Specific Group
```typescript
test('should authenticate guest in specific group', async ({ page }) => {
  // Create group first
  const group = await createTestGroup({ name: 'Test Family' });
  
  // Authenticate guest in that group
  const { guestId, token } = await authenticateAsGuestForTest(
    page,
    'test@example.com',
    group.id
  );
  
  await navigateToGuestDashboard(page);
  
  // Verify group membership
  const groupName = await page.locator('[data-testid="group-name"]').textContent();
  expect(groupName).toBe('Test Family');
  
  // Cleanup
  await cleanupGuestSession(guestId, group.id);
});
```

---

## 5. Enhanced Cleanup

### Purpose
Ensures complete cleanup of test data with verification.

### Import
```typescript
import {
  cleanup,
  cleanupTestGuests,
  cleanupTestGuestGroups,
  cleanupTestEvents,
  cleanupTestActivities,
  cleanupByIds,
  CleanupTracker,
  withCleanup,
} from '@/__tests__/helpers/cleanup';
```

### Example 1: Comprehensive Cleanup
```typescript
afterEach(async () => {
  // Cleans all test data in correct order
  await cleanup();
});
```

### Example 2: Specific Cleanup
```typescript
afterEach(async () => {
  // Clean only guests
  await cleanupTestGuests();
  
  // Clean only groups
  await cleanupTestGuestGroups();
  
  // Clean only events
  await cleanupTestEvents();
});
```

### Example 3: Cleanup Tracker
```typescript
test('should track and cleanup entities', async () => {
  const tracker = new CleanupTracker();
  
  try {
    // Create entities and track them
    const guest = await createTestGuest({ email: 'test@example.com' });
    tracker.track('guests', guest.id);
    
    const group = await createTestGroup({ name: 'Test Group' });
    tracker.track('groups', group.id);
    
    // Test logic...
    
  } finally {
    // Cleanup all tracked entities
    await tracker.cleanup();
  }
});
```

### Example 4: With Cleanup Helper
```typescript
test('should auto-cleanup entities', async () => {
  await withCleanup(async (tracker) => {
    // Create entities
    const guest = await createTestGuest({ email: 'test@example.com' });
    tracker.track('guests', guest.id);
    
    const group = await createTestGroup({ name: 'Test Group' });
    tracker.track('groups', group.id);
    
    // Test logic...
    
    // Cleanup happens automatically
  });
});
```

---

## Complete Test Example

Here's a complete test using all helpers:

```typescript
import { test, expect } from '@playwright/test';
import { generateUniqueTestData } from '@/__tests__/helpers/testDataGenerator';
import { withLock } from '@/__tests__/helpers/testLocks';
import { waitForStyles, waitForModalClose, waitForToast } from '@/__tests__/helpers/waitHelpers';
import { authenticateAsGuestForTest, navigateToGuestDashboard, cleanupGuestSession } from '@/__tests__/helpers/guestAuthHelpers';
import { cleanup } from '@/__tests__/helpers/cleanup';

test.describe('Guest Management', () => {
  let guestId: string;
  let testData: ReturnType<typeof generateUniqueTestData>;
  
  test.beforeEach(async () => {
    // Generate unique test data
    testData = generateUniqueTestData('guest-management');
  });
  
  test.afterEach(async () => {
    // Cleanup
    if (guestId) {
      await cleanupGuestSession(guestId);
    }
    await cleanup();
  });
  
  test('should create and authenticate guest', async ({ page }) => {
    // Use lock for shared resource
    await withLock('guest-creation', async () => {
      // Authenticate as new guest
      const result = await authenticateAsGuestForTest(
        page,
        testData.email
      );
      guestId = result.guestId;
      
      // Navigate to dashboard
      await navigateToGuestDashboard(page);
      
      // Wait for styles to load
      await waitForStyles(page);
      
      // Verify we're on dashboard
      expect(page.url()).toContain('/guest/dashboard');
      
      // Update profile
      await page.click('button:has-text("Edit Profile")');
      await page.fill('input[name="firstName"]', testData.firstName);
      await page.fill('input[name="lastName"]', testData.lastName);
      await page.click('button[type="submit"]');
      
      // Wait for modal to close
      await waitForModalClose(page, '[role="dialog"]');
      
      // Wait for success toast
      await waitForToast(page, 'Profile updated successfully');
      
      // Verify update
      const name = await page.locator('[data-testid="guest-name"]').textContent();
      expect(name).toContain(testData.firstName);
    });
  });
});
```

---

## Best Practices

### 1. Always Use Unique Data
```typescript
// ✅ GOOD
const testData = generateUniqueTestData('my-test');
const guest = await createTestGuest({ email: testData.email });

// ❌ BAD
const guest = await createTestGuest({ email: 'test@example.com' });
```

### 2. Use Locks for Shared Resources
```typescript
// ✅ GOOD
await withLock('admin-settings', async () => {
  await updateSettings({ theme: 'dark' });
});

// ❌ BAD
await updateSettings({ theme: 'dark' }); // Race condition possible
```

### 3. Always Wait for Async Operations
```typescript
// ✅ GOOD
await page.click('button[type="submit"]');
await waitForModalClose(page);
await waitForToast(page, 'Success');

// ❌ BAD
await page.click('button[type="submit"]');
// Immediately check results without waiting
```

### 4. Clean Up After Tests
```typescript
// ✅ GOOD
afterEach(async () => {
  await cleanup();
});

// ❌ BAD
// No cleanup - data leaks into other tests
```

### 5. Use API-Based Authentication
```typescript
// ✅ GOOD
const { guestId } = await authenticateAsGuestForTest(page, email);

// ❌ BAD
// Directly manipulate database without proper flow
```

---

## Troubleshooting

### Issue: Tests Still Failing with Race Conditions
**Solution**: Ensure you're using locks for all shared resources and unique data for all entities.

### Issue: Authentication Not Working
**Solution**: Use `authenticateAsGuestForTest()` which uses the API endpoint for proper flow.

### Issue: Modal Tests Failing
**Solution**: Always use `waitForModalClose()` before checking results.

### Issue: CSS Not Loaded
**Solution**: Always call `waitForStyles(page)` after navigation.

### Issue: Data Conflicts
**Solution**: Use `generateUniqueTestData()` for all test data.

---

## Summary

These helpers provide:
1. **Unique test data** - Prevents conflicts in parallel execution
2. **Test locks** - Prevents race conditions on shared resources
3. **Wait conditions** - Ensures async operations complete
4. **Reliable authentication** - Uses proper API flow
5. **Complete cleanup** - Prevents data leakage

Use them consistently for reliable, race-condition-free E2E tests!
