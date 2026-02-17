/**
 * Test Data Factories Tests
 * 
 * Tests for both mock and E2E factory functions.
 */

import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import {
  // Mock factories
  createTestGuest,
  createTestGuestGroup,
  createTestEvent,
  createTestActivity,
  createTestAccommodation,
  createTestRoomType,
  createTestLocation,
  createTestContentPage,
  createTestRSVP,
  createTestGuests,
  createTestGuestGroups,
  createTestScenario,
  createMockActivity,
  createXSSPayloads,
  createSQLInjectionPayloads,
  // E2E factories
  createE2EGuest,
  createE2EGroup,
  createE2EEvent,
  createE2EActivity,
  createE2EAccommodation,
  createE2ERoomType,
  createE2ELocation,
  createE2EContentPage,
  createE2ERSVP,
  createE2EScenario,
  createMinimalE2EScenario,
  // Cleanup utilities
  getCleanupRegistry,
  clearCleanupRegistry,
  getCleanupCount,
  cleanupE2EData,
} from './factories';

describe('Mock Data Factories', () => {
  describe('createTestGuest', () => {
    it('should create guest with default values', () => {
      const guest = createTestGuest();
      
      expect(guest.id).toMatch(/^test-guest-/);
      expect(guest.first_name).toBe('Test');
      expect(guest.last_name).toBe('User');
      expect(guest.email).toMatch(/test\.user\.\d+@example\.com/);
      expect(guest.age_type).toBe('adult');
      expect(guest.guest_type).toBe('wedding_guest');
    });
    
    it('should override default values', () => {
      const guest = createTestGuest({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        age_type: 'senior',
      });
      
      expect(guest.first_name).toBe('John');
      expect(guest.last_name).toBe('Doe');
      expect(guest.email).toBe('john@example.com');
      expect(guest.age_type).toBe('senior');
    });
  });
  
  describe('createTestGuestGroup', () => {
    it('should create group with default values', () => {
      const group = createTestGuestGroup();
      
      expect(group.id).toMatch(/^test-group-/);
      expect(group.name).toMatch(/Test Family \d+/);
    });
    
    it('should override default values', () => {
      const group = createTestGuestGroup({
        name: 'Smith Family',
        description: 'Family from California',
      });
      
      expect(group.name).toBe('Smith Family');
      expect(group.description).toBe('Family from California');
    });
  });
  
  describe('createTestEvent', () => {
    it('should create event with default values', () => {
      const event = createTestEvent();
      
      expect(event.id).toMatch(/^test-event-/);
      expect(event.name).toMatch(/Test Event \d+/);
      expect(event.start_date).toBeDefined();
      expect(event.end_date).toBeDefined();
    });
  });
  
  describe('createTestActivity', () => {
    it('should create activity with default values', () => {
      const activity = createTestActivity();
      
      expect(activity.id).toMatch(/^test-activity-/);
      expect(activity.name).toMatch(/Test Activity \d+/);
      expect(activity.capacity).toBe(50);
      expect(activity.adults_only).toBe(false);
    });
  });
  
  describe('createMockActivity', () => {
    it('should create activity with RSVP data', () => {
      const activity = createMockActivity({
        rsvpStatus: 'attending',
        capacityRemaining: 10,
        netCost: 25,
      });
      
      expect(activity.rsvpStatus).toBe('attending');
      expect(activity.capacityRemaining).toBe(10);
      expect(activity.netCost).toBe(25);
    });
  });
  
  describe('createTestGuests', () => {
    it('should create multiple guests', () => {
      const guests = createTestGuests(5);
      
      expect(guests).toHaveLength(5);
      expect(guests[0].first_name).toBe('Test0');
      expect(guests[1].first_name).toBe('Test1');
    });
    
    it('should apply overrides to all guests', () => {
      const guests = createTestGuests(3, {
        group_id: 'group-123',
        age_type: 'child',
      });
      
      expect(guests).toHaveLength(3);
      guests.forEach(guest => {
        expect(guest.group_id).toBe('group-123');
        expect(guest.age_type).toBe('child');
      });
    });
  });
  
  describe('createTestScenario', () => {
    it('should create complete scenario with defaults', () => {
      const scenario = createTestScenario();
      
      expect(scenario.group).toBeDefined();
      expect(scenario.guests).toHaveLength(3);
      expect(scenario.event).toBeDefined();
      expect(scenario.activities).toHaveLength(2);
      expect(scenario.rsvps).toHaveLength(6); // 3 guests × 2 activities
    });
    
    it('should create scenario with custom options', () => {
      const scenario = createTestScenario({
        guestCount: 5,
        activityCount: 3,
      });
      
      expect(scenario.guests).toHaveLength(5);
      expect(scenario.activities).toHaveLength(3);
      expect(scenario.rsvps).toHaveLength(15); // 5 guests × 3 activities
    });
  });
});

describe('Security Testing Payloads', () => {
  describe('createXSSPayloads', () => {
    it('should return XSS attack vectors', () => {
      const payloads = createXSSPayloads();
      
      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.some(p => p.includes('<script>'))).toBe(true);
      expect(payloads.some(p => p.includes('javascript:'))).toBe(true);
    });
  });
  
  describe('createSQLInjectionPayloads', () => {
    it('should return SQL injection attack vectors', () => {
      const payloads = createSQLInjectionPayloads();
      
      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.some(p => p.includes('DROP TABLE'))).toBe(true);
      expect(payloads.some(p => p.includes("1' OR '1'='1"))).toBe(true);
    });
  });
});

describe('E2E Database Factories', () => {
  beforeEach(() => {
    clearCleanupRegistry();
  });
  
  afterAll(async () => {
    await cleanupE2EData();
  });
  
  describe('createE2EGroup', () => {
    it('should create group in database', async () => {
      const group = await createE2EGroup({
        name: 'Test Family',
      });
      
      expect(group.id).toBeDefined();
      expect(group.name).toBe('Test Family');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.groups).toContain(group.id);
    });
  });
  
  describe('createE2EGuest', () => {
    it('should create guest in database', async () => {
      const group = await createE2EGroup({ name: 'Test Family' });
      
      const guest = await createE2EGuest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        groupId: group.id,
      });
      
      expect(guest.id).toBeDefined();
      expect(guest.first_name).toBe('John');
      expect(guest.last_name).toBe('Doe');
      expect(guest.email).toBe('john@example.com');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.guests).toContain(guest.id);
    });
  });
  
  describe('createE2EEvent', () => {
    it('should create event in database', async () => {
      const event = await createE2EEvent({
        name: 'Wedding Ceremony',
        startDate: '2026-06-15',
        endDate: '2026-06-15',
      });
      
      expect(event.id).toBeDefined();
      expect(event.name).toBe('Wedding Ceremony');
      expect(event.slug).toBe('wedding-ceremony');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.events).toContain(event.id);
    });
  });
  
  describe('createE2EActivity', () => {
    it('should create activity in database', async () => {
      const event = await createE2EEvent({
        name: 'Test Event',
        startDate: '2026-06-15',
        endDate: '2026-06-15',
      });
      
      const activity = await createE2EActivity({
        name: 'Beach Volleyball',
        eventId: event.id,
        capacity: 20,
      });
      
      expect(activity.id).toBeDefined();
      expect(activity.name).toBe('Beach Volleyball');
      expect(activity.capacity).toBe(20);
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.activities).toContain(activity.id);
    });
  });
  
  describe('createE2ELocation', () => {
    it('should create location in database', async () => {
      const location = await createE2ELocation({
        name: 'Beach Resort',
        type: 'venue',
        address: '123 Beach Road',
      });
      
      expect(location.id).toBeDefined();
      expect(location.name).toBe('Beach Resort');
      expect(location.type).toBe('venue');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.locations).toContain(location.id);
    });
  });
  
  describe('createE2EAccommodation', () => {
    it('should create accommodation in database', async () => {
      const accommodation = await createE2EAccommodation({
        name: 'Beach Resort',
        address: '123 Beach Road',
        checkInDate: '2026-06-14',
        checkOutDate: '2026-06-17',
      });
      
      expect(accommodation.id).toBeDefined();
      expect(accommodation.name).toBe('Beach Resort');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.accommodations).toContain(accommodation.id);
    });
  });
  
  describe('createE2ERoomType', () => {
    it('should create room type in database', async () => {
      const accommodation = await createE2EAccommodation({
        name: 'Beach Resort',
        address: '123 Beach Road',
        checkInDate: '2026-06-14',
        checkOutDate: '2026-06-17',
      });
      
      const roomType = await createE2ERoomType({
        accommodationId: accommodation.id,
        name: 'Deluxe Ocean View',
        capacity: 2,
        totalRooms: 10,
        pricePerNight: 150,
      });
      
      expect(roomType.id).toBeDefined();
      expect(roomType.name).toBe('Deluxe Ocean View');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.roomTypes).toContain(roomType.id);
    });
  });
  
  describe('createE2EContentPage', () => {
    it('should create content page in database', async () => {
      const page = await createE2EContentPage({
        title: 'Our Story',
        slug: 'our-story',
        type: 'custom',
      });
      
      expect(page.id).toBeDefined();
      expect(page.title).toBe('Our Story');
      expect(page.slug).toBe('our-story');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.contentPages).toContain(page.id);
    });
  });
  
  describe('createE2ERSVP', () => {
    it('should create RSVP in database', async () => {
      const group = await createE2EGroup({ name: 'Test Family' });
      const guest = await createE2EGuest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        groupId: group.id,
      });
      const event = await createE2EEvent({
        name: 'Test Event',
        startDate: '2026-06-15',
        endDate: '2026-06-15',
      });
      const activity = await createE2EActivity({
        name: 'Test Activity',
        eventId: event.id,
      });
      
      const rsvp = await createE2ERSVP({
        guestId: guest.id,
        eventId: event.id,
        activityId: activity.id,
        status: 'attending',
      });
      
      expect(rsvp.id).toBeDefined();
      expect(rsvp.status).toBe('attending');
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.rsvps).toContain(rsvp.id);
    });
  });
});

describe('E2E Scenario Builders', () => {
  beforeEach(() => {
    clearCleanupRegistry();
  });
  
  afterAll(async () => {
    await cleanupE2EData();
  });
  
  describe('createE2EScenario', () => {
    it('should create complete scenario with defaults', async () => {
      const scenario = await createE2EScenario({});
      
      expect(scenario.group).toBeDefined();
      expect(scenario.guests).toHaveLength(3);
      expect(scenario.event).toBeDefined();
      expect(scenario.activities).toHaveLength(2);
      expect(scenario.rsvps).toHaveLength(6); // 3 guests × 2 activities
      
      // Verify all entities registered for cleanup
      const count = getCleanupCount();
      expect(count).toBeGreaterThan(0);
    });
    
    it('should create scenario with custom options', async () => {
      const scenario = await createE2EScenario({
        groupName: 'Smith Family',
        guestCount: 5,
        eventName: 'Wedding Ceremony',
        activityCount: 3,
        createRSVPs: true,
      });
      
      expect(scenario.group.name).toBe('Smith Family');
      expect(scenario.guests).toHaveLength(5);
      expect(scenario.event.name).toBe('Wedding Ceremony');
      expect(scenario.activities).toHaveLength(3);
      expect(scenario.rsvps).toHaveLength(15); // 5 guests × 3 activities
    });
    
    it('should create scenario without RSVPs', async () => {
      const scenario = await createE2EScenario({
        guestCount: 3,
        activityCount: 2,
        createRSVPs: false,
      });
      
      expect(scenario.guests).toHaveLength(3);
      expect(scenario.activities).toHaveLength(2);
      expect(scenario.rsvps).toHaveLength(0);
    });
  });
  
  describe('createMinimalE2EScenario', () => {
    it('should create minimal scenario', async () => {
      const { group, guest } = await createMinimalE2EScenario();
      
      expect(group).toBeDefined();
      expect(guest).toBeDefined();
      expect(guest.group_id).toBe(group.id);
      
      // Verify registered for cleanup
      const registry = getCleanupRegistry();
      expect(registry.groups).toContain(group.id);
      expect(registry.guests).toContain(guest.id);
    });
  });
});

describe('Cleanup Tracking', () => {
  beforeEach(() => {
    clearCleanupRegistry();
  });
  
  afterAll(async () => {
    await cleanupE2EData();
  });
  
  describe('getCleanupRegistry', () => {
    it('should return empty registry initially', () => {
      const registry = getCleanupRegistry();
      
      expect(registry.guests).toHaveLength(0);
      expect(registry.groups).toHaveLength(0);
      expect(registry.events).toHaveLength(0);
    });
    
    it('should track created entities', async () => {
      const group = await createE2EGroup({ name: 'Test Family' });
      const guest = await createE2EGuest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        groupId: group.id,
      });
      
      const registry = getCleanupRegistry();
      expect(registry.groups).toContain(group.id);
      expect(registry.guests).toContain(guest.id);
    });
  });
  
  describe('getCleanupCount', () => {
    it('should return 0 initially', () => {
      expect(getCleanupCount()).toBe(0);
    });
    
    it('should count registered entities', async () => {
      await createE2EGroup({ name: 'Test Family 1' });
      expect(getCleanupCount()).toBe(1);
      
      await createE2EGroup({ name: 'Test Family 2' });
      expect(getCleanupCount()).toBe(2);
    });
  });
  
  describe('clearCleanupRegistry', () => {
    it('should clear registry without deleting data', async () => {
      await createE2EGroup({ name: 'Test Family' });
      expect(getCleanupCount()).toBe(1);
      
      clearCleanupRegistry();
      expect(getCleanupCount()).toBe(0);
    });
  });
  
  describe('cleanupE2EData', () => {
    it('should delete all registered entities', async () => {
      const scenario = await createE2EScenario({
        guestCount: 2,
        activityCount: 1,
      });
      
      const countBefore = getCleanupCount();
      expect(countBefore).toBeGreaterThan(0);
      
      await cleanupE2EData();
      
      const countAfter = getCleanupCount();
      expect(countAfter).toBe(0);
    });
  });
});
