# Test Data Factories Guide

Comprehensive guide to using test data factories for unit tests, integration tests, and E2E tests.

## Table of Contents

1. [Overview](#overview)
2. [Mock Data Factories](#mock-data-factories)
3. [E2E Database Factories](#e2e-database-factories)
4. [Cleanup Tracking](#cleanup-tracking)
5. [Scenario Builders](#scenario-builders)
6. [Security Testing](#security-testing)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Overview

The factories module provides two types of factory functions:

1. **Mock Data Factories**: Create in-memory test data for unit/integration tests
2. **E2E Database Factories**: Create real database records for E2E tests with automatic cleanup tracking

### When to Use Each Type

**Mock Data Factories** (`createTestGuest`, `createTestEvent`, etc.):
- Unit tests
- Integration tests with mocked services
- Tests that don't need real database records
- Fast test execution

**E2E Database Factories** (`createE2EGuest`, `createE2EEvent`, etc.):
- E2E tests with Playwright
- Integration tests requiring real database
- Tests validating database constraints
- Tests requiring data persistence

---

## Mock Data Factories

### Basic Usage

Mock factories create in-memory objects with realistic defaults:

```typescript
import { createTestGuest, createTestEvent } from '../helpers/factories';

test('should format guest name', () => {
  const guest = createTestGuest({
    firstName: 'John',
    lastName: 'Doe'
  });
  
  expect(formatGuestName(guest)).toBe('John Doe');
});
```

### Available Mock Factories

#### `createTestGuest(overrides?)`

Create a mock guest object.

```typescript
const guest = createTestGuest({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  groupId: 'group-123',
  ageType: 'adult',
  guestType: 'wedding_guest'
});
```

#### `createTestGuestGroup(overrides?)`

Create a mock guest group object.

```typescript
const group = createTestGuestGroup({
  name: 'Smith Family',
  description: 'Family from California'
});
```

#### `createTestEvent(overrides?)`

Create a mock event object.

```typescript
const event = createTestEvent({
  name: 'Wedding Ceremony',
  startDate: '2026-06-15T14:00:00Z',
  endDate: '2026-06-15T15:00:00Z',
  locationId: 'location-123'
});
```

#### `createTestActivity(overrides?)`

Create a mock activity object.

```typescript
const activity = createTestActivity({
  name: 'Beach Volleyball',
  eventId: 'event-123',
  capacity: 20,
  adultsOnly: false
});
```

#### `createTestAccommodation(overrides?)`

Create a mock accommodation object.

```typescript
const accommodation = createTestAccommodation({
  name: 'Beach Resort',
  address: '123 Beach Road',
  checkInDate: '2026-06-14',
  checkOutDate: '2026-06-17'
});
```

#### `createTestRoomType(overrides?)`

Create a mock room type object.

```typescript
const roomType = createTestRoomType({
  accommodationId: 'accommodation-123',
  name: 'Deluxe Ocean View',
  capacity: 2,
  totalRooms: 10,
  pricePerNight: 150
});
```

#### `createTestLocation(overrides?)`

Create a mock location object.

```typescript
const location = createTestLocation({
  name: 'Beach Resort',
  type: 'venue',
  address: '123 Beach Road'
});
```

#### `createTestContentPage(overrides?)`

Create a mock content page object.

```typescript
const page = createTestContentPage({
  title: 'Our Story',
  slug: 'our-story',
  type: 'custom',
  published: true
});
```

#### `createTestRSVP(overrides?)`

Create a mock RSVP object.

```typescript
const rsvp = createTestRSVP({
  guestId: 'guest-123',
  eventId: 'event-123',
  activityId: 'activity-123',
  status: 'attending',
  guestCount: 2
});
```

### Bulk Creation

Create multiple entities at once:

```typescript
// Create 5 guests
const guests = createTestGuests(5, {
  groupId: 'group-123',
  ageType: 'adult'
});

// Create 3 groups
const groups = createTestGuestGroups(3);
```

### Mock Scenario Builder

Create a complete test scenario with related entities:

```typescript
const scenario = createTestScenario({
  guestCount: 3,
  activityCount: 2
});

// Returns:
// {
//   group: GuestGroup,
//   guests: Guest[],
//   event: Event,
//   activities: Activity[],
//   rsvps: RSVP[]
// }
```

---

## E2E Database Factories

### Basic Usage

E2E factories create real database records and track them for cleanup:

```typescript
import { 
  createE2EGuest, 
  createE2EGroup,
  cleanupE2EData 
} from '../helpers/factories';

test('should display guest in list', async ({ page }) => {
  // Create real database records
  const group = await createE2EGroup({ name: 'Smith Family' });
  const guest = await createE2EGuest({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    groupId: group.id
  });
  
  // Test with real data
  await page.goto('/admin/guests');
  await expect(page.locator('text=John Doe')).toBeVisible();
  
  // Cleanup happens automatically
});

test.afterAll(async () => {
  await cleanupE2EData();
});
```

### Available E2E Factories

#### `createE2EGuest(data)`

Create a guest in the database.

```typescript
const guest = await createE2EGuest({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  groupId: group.id,
  ageType: 'adult',
  guestType: 'wedding_guest',
  authMethod: 'email_matching',
  dietaryRestrictions: 'Vegetarian',
  plusOneAllowed: true
});
```

#### `createE2EGroup(data)`

Create a guest group in the database.

```typescript
const group = await createE2EGroup({
  name: 'Smith Family',
  description: 'Family from California',
  groupOwnerId: null
});
```

#### `createE2EEvent(data)`

Create an event in the database.

```typescript
const event = await createE2EEvent({
  name: 'Wedding Ceremony',
  description: 'Main ceremony event',
  startDate: '2026-06-15',
  endDate: '2026-06-15',
  slug: 'wedding-ceremony',
  locationId: location.id
});
```

#### `createE2EActivity(data)`

Create an activity in the database.

```typescript
const activity = await createE2EActivity({
  name: 'Beach Volleyball',
  eventId: event.id,
  slug: 'beach-volleyball',
  description: 'Fun beach activity',
  activityType: 'activity',
  capacity: 20,
  adultsOnly: false,
  plusOnesAllowed: true,
  costPerGuest: 25,
  hostSubsidy: 10
});
```

#### `createE2EAccommodation(data)`

Create an accommodation in the database.

```typescript
const accommodation = await createE2EAccommodation({
  name: 'Beach Resort',
  description: 'Luxury beachfront resort',
  locationId: location.id,
  address: '123 Beach Road',
  checkInDate: '2026-06-14',
  checkOutDate: '2026-06-17'
});
```

#### `createE2ERoomType(data)`

Create a room type in the database.

```typescript
const roomType = await createE2ERoomType({
  accommodationId: accommodation.id,
  name: 'Deluxe Ocean View',
  description: 'Spacious room with ocean view',
  capacity: 2,
  totalRooms: 10,
  pricePerNight: 150,
  hostSubsidy: 50
});
```

#### `createE2ELocation(data)`

Create a location in the database.

```typescript
const location = await createE2ELocation({
  name: 'Beach Resort',
  type: 'venue',
  parentId: null,
  description: 'Beautiful beachfront venue',
  address: '123 Beach Road'
});
```

#### `createE2EContentPage(data)`

Create a content page in the database.

```typescript
const page = await createE2EContentPage({
  title: 'Our Story',
  slug: 'our-story',
  type: 'custom',
  content: '<p>Once upon a time...</p>',
  published: true
});
```

#### `createE2ERSVP(data)`

Create an RSVP in the database.

```typescript
const rsvp = await createE2ERSVP({
  guestId: guest.id,
  eventId: event.id,
  activityId: activity.id,
  status: 'attending',
  guestCount: 2,
  dietaryRestrictions: 'Vegetarian',
  notes: 'Excited to attend!'
});
```

---

## Cleanup Tracking

E2E factories automatically track created entities for cleanup.

### How It Works

1. **Automatic Registration**: Every E2E factory registers created entities
2. **Cleanup Registry**: Tracks all entity IDs by type
3. **Ordered Cleanup**: Respects foreign key constraints during cleanup

### Cleanup Functions

#### `cleanupE2EData()`

Clean up all registered test data.

```typescript
test.afterAll(async () => {
  await cleanupE2EData();
});
```

#### `getCleanupRegistry()`

Get the current cleanup registry (for debugging).

```typescript
const registry = getCleanupRegistry();
console.log('Guests to cleanup:', registry.guests.length);
console.log('Groups to cleanup:', registry.groups.length);
```

#### `clearCleanupRegistry()`

Clear the cleanup registry without deleting data.

```typescript
clearCleanupRegistry();
```

#### `getCleanupCount()`

Get total count of registered entities.

```typescript
const count = getCleanupCount();
console.log(`${count} entities registered for cleanup`);
```

### Cleanup Order

Cleanup happens in this order to respect foreign key constraints:

1. RSVPs
2. Sections
3. Activities
4. Events
5. Room Types
6. Accommodations
7. Guests
8. Guest Groups
9. Content Pages
10. Locations

---

## Scenario Builders

### `createE2EScenario(options)`

Create a complete E2E test scenario with related entities.

**Options:**
- `groupName`: Group name (default: auto-generated)
- `guestCount`: Number of guests (default: 3)
- `eventName`: Event name (default: auto-generated)
- `eventDate`: Event date (default: tomorrow)
- `activityCount`: Number of activities (default: 2)
- `createRSVPs`: Create RSVPs for all guests/activities (default: true)

**Example:**
```typescript
const scenario = await createE2EScenario({
  groupName: 'Smith Family',
  guestCount: 5,
  eventName: 'Wedding Ceremony',
  eventDate: '2026-06-15',
  activityCount: 3,
  createRSVPs: true
});

// Use scenario data
console.log(scenario.group.name); // 'Smith Family'
console.log(scenario.guests.length); // 5
console.log(scenario.activities.length); // 3
console.log(scenario.rsvps.length); // 15 (5 guests × 3 activities)
```

### `createMinimalE2EScenario()`

Create a minimal scenario (group + guest only).

**Example:**
```typescript
const { group, guest } = await createMinimalE2EScenario();

// Use for simple tests
await page.goto(`/admin/guests?groupId=${group.id}`);
await expect(page.locator(`text=${guest.first_name}`)).toBeVisible();
```

---

## Security Testing

### XSS Payloads

Test XSS prevention with realistic attack vectors:

```typescript
import { createXSSPayloads } from '../helpers/factories';

test('should sanitize XSS in guest names', async () => {
  const payloads = createXSSPayloads();
  
  for (const payload of payloads) {
    const guest = await createE2EGuest({
      firstName: payload,
      lastName: 'User',
      email: 'test@example.com',
      groupId: group.id
    });
    
    // Verify payload was sanitized
    expect(guest.first_name).not.toContain('<script>');
    expect(guest.first_name).not.toContain('javascript:');
  }
});
```

### SQL Injection Payloads

Test SQL injection prevention:

```typescript
import { createSQLInjectionPayloads } from '../helpers/factories';

test('should prevent SQL injection in search', async () => {
  const payloads = createSQLInjectionPayloads();
  
  for (const payload of payloads) {
    const result = await guestService.search(payload);
    
    // Should return empty results, not error
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  }
});
```

---

## Best Practices

### 1. Use Mock Factories for Unit Tests

```typescript
// ✅ Good - Fast unit test with mock data
test('should format guest name', () => {
  const guest = createTestGuest({ firstName: 'John', lastName: 'Doe' });
  expect(formatGuestName(guest)).toBe('John Doe');
});

// ❌ Bad - Unnecessary database call
test('should format guest name', async () => {
  const guest = await createE2EGuest({ ... });
  expect(formatGuestName(guest)).toBe('John Doe');
});
```

### 2. Use E2E Factories for E2E Tests

```typescript
// ✅ Good - Real database data for E2E test
test('should display guest in list', async ({ page }) => {
  const guest = await createE2EGuest({ ... });
  await page.goto('/admin/guests');
  await expect(page.locator(`text=${guest.first_name}`)).toBeVisible();
});

// ❌ Bad - Mock data won't appear in UI
test('should display guest in list', async ({ page }) => {
  const guest = createTestGuest({ ... });
  await page.goto('/admin/guests');
  // Guest won't be in database, test will fail
});
```

### 3. Always Clean Up E2E Data

```typescript
// ✅ Good - Cleanup after tests
test.afterAll(async () => {
  await cleanupE2EData();
});

// ❌ Bad - No cleanup, pollutes database
test('should create guest', async ({ page }) => {
  await createE2EGuest({ ... });
  // No cleanup
});
```

### 4. Use Scenario Builders for Complex Tests

```typescript
// ✅ Good - Use scenario builder
test('should display RSVP summary', async ({ page }) => {
  const scenario = await createE2EScenario({
    guestCount: 5,
    activityCount: 3,
    createRSVPs: true
  });
  
  await page.goto(`/admin/events/${scenario.event.id}/rsvps`);
  // Test with complete scenario
});

// ❌ Bad - Manual creation is verbose
test('should display RSVP summary', async ({ page }) => {
  const group = await createE2EGroup({ ... });
  const guest1 = await createE2EGuest({ ... });
  const guest2 = await createE2EGuest({ ... });
  // ... many more lines
});
```

### 5. Use Descriptive Names

```typescript
// ✅ Good - Descriptive names
const smithFamily = await createE2EGroup({ name: 'Smith Family' });
const johnDoe = await createE2EGuest({ 
  firstName: 'John', 
  lastName: 'Doe',
  groupId: smithFamily.id 
});

// ❌ Bad - Generic names
const group = await createE2EGroup({ name: 'Test' });
const guest = await createE2EGuest({ 
  firstName: 'Test',
  lastName: 'User',
  groupId: group.id 
});
```

### 6. Verify Cleanup Registry

```typescript
test('should clean up all data', async () => {
  const scenario = await createE2EScenario({ guestCount: 5 });
  
  // Verify entities registered
  const count = getCleanupCount();
  expect(count).toBeGreaterThan(0);
  
  // Cleanup
  await cleanupE2EData();
  
  // Verify registry cleared
  expect(getCleanupCount()).toBe(0);
});
```

---

## Examples

### Example 1: Simple E2E Test

```typescript
import { test, expect } from '@playwright/test';
import { 
  createE2EGroup, 
  createE2EGuest,
  cleanupE2EData 
} from '../helpers/factories';

test.describe('Guest Management', () => {
  test.afterAll(async () => {
    await cleanupE2EData();
  });
  
  test('should display guest in list', async ({ page }) => {
    // Create test data
    const group = await createE2EGroup({ name: 'Smith Family' });
    const guest = await createE2EGuest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: group.id
    });
    
    // Navigate and verify
    await page.goto('/admin/guests');
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();
  });
});
```

### Example 2: Complex Scenario Test

```typescript
import { test, expect } from '@playwright/test';
import { createE2EScenario, cleanupE2EData } from '../helpers/factories';

test.describe('RSVP Management', () => {
  test.afterAll(async () => {
    await cleanupE2EData();
  });
  
  test('should display RSVP summary', async ({ page }) => {
    // Create complete scenario
    const scenario = await createE2EScenario({
      groupName: 'Smith Family',
      guestCount: 5,
      eventName: 'Wedding Ceremony',
      activityCount: 3,
      createRSVPs: true
    });
    
    // Navigate to RSVP page
    await page.goto(`/admin/events/${scenario.event.id}/rsvps`);
    
    // Verify summary
    await expect(page.locator('text=5 guests')).toBeVisible();
    await expect(page.locator('text=3 activities')).toBeVisible();
    await expect(page.locator('text=15 RSVPs')).toBeVisible();
  });
});
```

### Example 3: Security Testing

```typescript
import { test, expect } from '@playwright/test';
import { 
  createE2EGroup,
  createE2EGuest,
  createXSSPayloads,
  cleanupE2EData 
} from '../helpers/factories';

test.describe('XSS Prevention', () => {
  test.afterAll(async () => {
    await cleanupE2EData();
  });
  
  test('should sanitize XSS in guest names', async ({ page }) => {
    const group = await createE2EGroup({ name: 'Test Family' });
    const payloads = createXSSPayloads();
    
    for (const payload of payloads) {
      const guest = await createE2EGuest({
        firstName: payload,
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        groupId: group.id
      });
      
      // Verify sanitization
      expect(guest.first_name).not.toContain('<script>');
      expect(guest.first_name).not.toContain('javascript:');
      
      // Verify in UI
      await page.goto('/admin/guests');
      const guestRow = page.locator(`tr:has-text("${guest.last_name}")`);
      const html = await guestRow.innerHTML();
      expect(html).not.toContain('<script>');
    }
  });
});
```

### Example 4: Integration Test with Mock Data

```typescript
import { test, expect } from '@jest/globals';
import { createTestGuest, createTestEvent } from '../helpers/factories';
import { formatGuestName, calculateEventDuration } from '@/utils';

test('should format guest name correctly', () => {
  const guest = createTestGuest({
    firstName: 'John',
    lastName: 'Doe'
  });
  
  expect(formatGuestName(guest)).toBe('John Doe');
});

test('should calculate event duration', () => {
  const event = createTestEvent({
    startDate: '2026-06-15T14:00:00Z',
    endDate: '2026-06-15T16:00:00Z'
  });
  
  expect(calculateEventDuration(event)).toBe(2); // 2 hours
});
```

---

## Troubleshooting

### Issue: Cleanup Not Working

**Problem**: Test data not being cleaned up.

**Solution**:
```typescript
// Verify cleanup is called
test.afterAll(async () => {
  const count = getCleanupCount();
  console.log(`Cleaning up ${count} entities`);
  await cleanupE2EData();
});
```

### Issue: Foreign Key Constraint Errors

**Problem**: Cleanup fails due to foreign key constraints.

**Solution**: The cleanup function handles this automatically by deleting in the correct order. If you're manually deleting, follow the cleanup order documented above.

### Issue: Duplicate Data

**Problem**: Multiple test runs create duplicate data.

**Solution**:
```typescript
// Use unique identifiers
const group = await createE2EGroup({
  name: `Test Family ${Date.now()}`
});
```

### Issue: Slow Tests

**Problem**: E2E factories make tests slow.

**Solution**: Use mock factories for unit tests, E2E factories only for E2E tests:
```typescript
// Unit test - use mock
test('formats name', () => {
  const guest = createTestGuest({ ... });
  expect(formatName(guest)).toBe('...');
});

// E2E test - use E2E factory
test('displays name', async ({ page }) => {
  const guest = await createE2EGuest({ ... });
  await page.goto('/admin/guests');
  // ...
});
```

---

## Related Documentation

- [E2E Helpers Guide](./E2E_HELPERS_GUIDE.md)
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Testing Patterns](.kiro/steering/testing-patterns.md)
- [Playwright Documentation](https://playwright.dev/)

---

**Last Updated**: February 4, 2026  
**Maintainer**: Development Team
