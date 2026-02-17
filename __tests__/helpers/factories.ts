/**
 * Test Data Factories
 * 
 * Factory functions for creating test data with sensible defaults.
 * Follows the factory pattern to reduce test boilerplate and ensure consistency.
 * 
 * **E2E Testing Features:**
 * - Cleanup tracking for automatic test data removal
 * - Database integration for E2E test data creation
 * - Realistic test data generation
 * - Support for complex test scenarios
 * 
 * @module factories
 */

import type { 
  Guest, 
  Event, 
  Activity, 
  RSVP
} from '@/types';
import { createTestClient } from './testDb';

// ============================================================================
// Cleanup Tracking
// ============================================================================

/**
 * Global registry for tracking created test data for cleanup
 */
interface CleanupRegistry {
  guests: string[];
  groups: string[];
  events: string[];
  activities: string[];
  accommodations: string[];
  roomTypes: string[];
  locations: string[];
  sections: string[];
  contentPages: string[];
  rsvps: string[];
}

const cleanupRegistry: CleanupRegistry = {
  guests: [],
  groups: [],
  events: [],
  activities: [],
  accommodations: [],
  roomTypes: [],
  locations: [],
  sections: [],
  contentPages: [],
  rsvps: [],
};

/**
 * Register an entity for cleanup
 */
function registerForCleanup(type: keyof CleanupRegistry, id: string): void {
  if (!cleanupRegistry[type].includes(id)) {
    cleanupRegistry[type].push(id);
  }
}

/**
 * Get all registered entities for cleanup
 */
export function getCleanupRegistry(): CleanupRegistry {
  return { ...cleanupRegistry };
}

/**
 * Clear the cleanup registry (call after cleanup is complete)
 */
export function clearCleanupRegistry(): void {
  Object.keys(cleanupRegistry).forEach((key) => {
    cleanupRegistry[key as keyof CleanupRegistry] = [];
  });
}

/**
 * Get count of registered entities
 */
export function getCleanupCount(): number {
  return Object.values(cleanupRegistry).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Create a test guest with optional overrides
 */
export function createTestGuest(overrides: Partial<Guest> = {}): Guest {
  const timestamp = Date.now();
  return {
    id: `test-guest-${timestamp}`,
    first_name: 'Test',
    last_name: 'User',
    email: `test.user.${timestamp}@example.com`,
    group_id: 'test-group-id',
    age_type: 'adult',
    guest_type: 'wedding_guest',
    invitation_sent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test guest group with optional overrides
 */
export function createTestGuestGroup(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-group-${timestamp}`,
    name: `Test Family ${timestamp}`,
    description: 'Test family group for automated testing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test event with optional overrides
 */
export function createTestEvent(overrides: Partial<Event> = {}): Event {
  const timestamp = Date.now();
  return {
    id: `test-event-${timestamp}`,
    name: `Test Event ${timestamp}`,
    description: 'Test event for automated testing',
    event_type: 'ceremony',
    start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    rsvp_required: false,
    visibility: [],
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test activity with optional overrides
 */
export function createTestActivity(overrides: Partial<Activity> = {}): Activity {
  const timestamp = Date.now();
  return {
    id: `test-activity-${timestamp}`,
    name: `Test Activity ${timestamp}`,
    description: 'Test activity for automated testing',
    event_id: 'test-event-id',
    activity_type: 'activity',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 90000000).toISOString(),
    capacity: 50,
    adults_only: false,
    plus_one_allowed: true,
    cost_per_person: 0,
    host_subsidy: 0,
    visibility: [],
    status: 'draft',
    display_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test activity with RSVP data for guest view
 */
export function createMockActivity(overrides: Partial<Activity & {
  rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
  capacityRemaining?: number;
  netCost?: number;
}> = {}): Activity & {
  rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
  capacityRemaining?: number;
  netCost?: number;
} {
  const activity = createTestActivity(overrides);
  return {
    ...activity,
    rsvpStatus: overrides.rsvpStatus || 'pending',
    capacityRemaining: overrides.capacityRemaining !== undefined ? overrides.capacityRemaining : 25,
    netCost: overrides.netCost !== undefined ? overrides.netCost : 0,
  };
}

/**
 * Create a test accommodation with optional overrides
 */
export function createTestAccommodation(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-accommodation-${timestamp}`,
    name: `Test Hotel ${timestamp}`,
    description: 'Test accommodation for automated testing',
    location_id: null,
    address: '123 Test Street',
    check_in_date: new Date(Date.now() + 86400000).toISOString(),
    check_out_date: new Date(Date.now() + 259200000).toISOString(), // 3 days later
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test room type with optional overrides
 */
export function createTestRoomType(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-room-type-${timestamp}`,
    accommodation_id: 'test-accommodation-id',
    name: `Test Room ${timestamp}`,
    description: 'Test room type for automated testing',
    capacity: 2,
    total_rooms: 10,
    price_per_night: 100,
    host_subsidy: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test location with optional overrides
 */
export function createTestLocation(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-location-${timestamp}`,
    name: `Test Location ${timestamp}`,
    type: 'venue',
    parent_id: null,
    description: 'Test location for automated testing',
    address: '123 Test Street',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test section with optional overrides
 */
export function createTestSection(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-section-${timestamp}`,
    entity_type: 'event',
    entity_id: 'test-entity-id',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test content page with optional overrides
 */
export function createTestContentPage(overrides: Partial<any> = {}): any {
  const timestamp = Date.now();
  return {
    id: `test-page-${timestamp}`,
    title: `Test Page ${timestamp}`,
    slug: `test-page-${timestamp}`,
    type: 'custom',
    published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test RSVP with optional overrides
 */
export function createTestRSVP(overrides: Partial<RSVP> = {}): RSVP {
  const timestamp = Date.now();
  return {
    id: `test-rsvp-${timestamp}`,
    guest_id: 'test-guest-id',
    event_id: 'test-event-id',
    activity_id: undefined,
    status: 'pending',
    guest_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple test guests at once
 */
export function createTestGuests(count: number, overrides: Partial<Guest> = {}): Guest[] {
  return Array.from({ length: count }, (_, i) => 
    createTestGuest({ 
      first_name: `Test${i}`,
      last_name: `User${i}`,
      email: `test.user${i}.${Date.now()}@example.com`,
      ...overrides 
    })
  );
}

/**
 * Create multiple test guest groups at once
 */
export function createTestGuestGroups(count: number, overrides: Partial<any> = {}): any[] {
  return Array.from({ length: count }, (_, i) => 
    createTestGuestGroup({ 
      name: `Test Family ${i} ${Date.now()}`,
      ...overrides 
    })
  );
}

/**
 * Create a complete test scenario with related entities
 */
export interface TestScenario {
  group: any;
  guests: Guest[];
  event: Event;
  activities: Activity[];
  rsvps: RSVP[];
}

export function createTestScenario(options: {
  guestCount?: number;
  activityCount?: number;
} = {}): TestScenario {
  const { guestCount = 3, activityCount = 2 } = options;
  
  const group = createTestGuestGroup();
  const event = createTestEvent();
  
  const guests = createTestGuests(guestCount, { group_id: group.id });
  const activities = Array.from({ length: activityCount }, (_, i) => 
    createTestActivity({ 
      event_id: event.id,
      name: `Test Activity ${i}`,
    })
  );
  
  const rsvps = guests.flatMap(guest => 
    activities.map(activity => 
      createTestRSVP({
        guest_id: guest.id,
        event_id: event.id,
        activity_id: activity.id,
      })
    )
  );
  
  return { group, guests, event, activities, rsvps };
}

/**
 * Create test data with XSS payloads for security testing
 */
export function createXSSPayloads(): string[] {
  return [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '<iframe src="javascript:alert(1)">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
  ];
}

/**
 * Create test data with SQL injection payloads for security testing
 */
export function createSQLInjectionPayloads(): string[] {
  return [
    "'; DROP TABLE guests; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users--",
    "1; DELETE FROM guests WHERE '1'='1",
  ];
}

// ============================================================================
// E2E-Specific Factory Functions (Database Integration)
// ============================================================================

/**
 * Create a test guest in the database with cleanup tracking
 * 
 * @example
 * const guest = await createE2EGuest({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   groupId: group.id
 * });
 */
export async function createE2EGuest(data: {
  firstName: string;
  lastName: string;
  email: string;
  groupId: string;
  ageType?: 'adult' | 'child' | 'senior';
  guestType?: 'wedding_party' | 'wedding_guest' | 'prewedding_only' | 'postwedding_only';
  authMethod?: 'email_matching' | 'magic_link';
  dietaryRestrictions?: string | null;
  notes?: string | null;
  plusOneAllowed?: boolean;
  plusOneName?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: guest, error } = await supabase
    .from('guests')
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      group_id: data.groupId,
      age_type: data.ageType || 'adult',
      guest_type: data.guestType || 'wedding_guest',
      auth_method: data.authMethod || 'email_matching',
      dietary_restrictions: data.dietaryRestrictions || null,
      notes: data.notes || null,
      plus_one_allowed: data.plusOneAllowed || false,
      plus_one_name: data.plusOneName || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E guest: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('guests', guest.id);
  
  return guest;
}

/**
 * Create a test guest group in the database with cleanup tracking
 * 
 * @example
 * const group = await createE2EGroup({ name: 'Smith Family' });
 */
export async function createE2EGroup(data: {
  name: string;
  description?: string | null;
  groupOwnerId?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      description: data.description || null,
      group_owner_id: data.groupOwnerId || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E group: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('groups', group.id);
  
  return group;
}

/**
 * Create a test event in the database with cleanup tracking
 * 
 * @example
 * const event = await createE2EEvent({
 *   name: 'Wedding Ceremony',
 *   startDate: '2026-06-15',
 *   endDate: '2026-06-15',
 *   slug: 'wedding-ceremony'
 * });
 */
export async function createE2EEvent(data: {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  slug?: string;
  locationId?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
  
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      name: data.name,
      description: data.description || null,
      start_date: data.startDate,
      end_date: data.endDate,
      slug,
      location_id: data.locationId || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E event: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('events', event.id);
  
  return event;
}

/**
 * Create a test activity in the database with cleanup tracking
 * 
 * @example
 * const activity = await createE2EActivity({
 *   name: 'Beach Volleyball',
 *   eventId: event.id,
 *   slug: 'beach-volleyball',
 *   capacity: 20
 * });
 */
export async function createE2EActivity(data: {
  name: string;
  eventId: string;
  slug?: string;
  description?: string | null;
  activityType?: 'ceremony' | 'reception' | 'meal' | 'transport' | 'activity' | 'custom';
  startTime?: string | null;
  endTime?: string | null;
  locationId?: string | null;
  capacity?: number | null;
  adultsOnly?: boolean;
  plusOnesAllowed?: boolean;
  costPerGuest?: number;
  hostSubsidy?: number;
}): Promise<any> {
  const supabase = createTestClient();
  
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
  
  const { data: activity, error } = await supabase
    .from('activities')
    .insert({
      name: data.name,
      event_id: data.eventId,
      slug,
      description: data.description || null,
      activity_type: data.activityType || 'activity',
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      location_id: data.locationId || null,
      capacity: data.capacity || null,
      adults_only: data.adultsOnly || false,
      plus_ones_allowed: data.plusOnesAllowed || true,
      cost_per_guest: data.costPerGuest || 0,
      host_subsidy: data.hostSubsidy || 0,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E activity: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('activities', activity.id);
  
  return activity;
}

/**
 * Create a test accommodation in the database with cleanup tracking
 * 
 * @example
 * const accommodation = await createE2EAccommodation({
 *   name: 'Beach Resort',
 *   address: '123 Beach Road',
 *   checkInDate: '2026-06-14',
 *   checkOutDate: '2026-06-17'
 * });
 */
export async function createE2EAccommodation(data: {
  name: string;
  description?: string | null;
  locationId?: string | null;
  address?: string | null;
  checkInDate: string;
  checkOutDate: string;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: accommodation, error } = await supabase
    .from('accommodations')
    .insert({
      name: data.name,
      description: data.description || null,
      location_id: data.locationId || null,
      address: data.address || null,
      check_in_date: data.checkInDate,
      check_out_date: data.checkOutDate,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E accommodation: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('accommodations', accommodation.id);
  
  return accommodation;
}

/**
 * Create a test room type in the database with cleanup tracking
 * 
 * @example
 * const roomType = await createE2ERoomType({
 *   accommodationId: accommodation.id,
 *   name: 'Deluxe Ocean View',
 *   capacity: 2,
 *   totalRooms: 10,
 *   pricePerNight: 150
 * });
 */
export async function createE2ERoomType(data: {
  accommodationId: string;
  name: string;
  description?: string | null;
  capacity: number;
  totalRooms: number;
  pricePerNight: number;
  hostSubsidy?: number;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: roomType, error } = await supabase
    .from('room_types')
    .insert({
      accommodation_id: data.accommodationId,
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      total_rooms: data.totalRooms,
      price_per_night: data.pricePerNight,
      host_subsidy: data.hostSubsidy || 0,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E room type: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('roomTypes', roomType.id);
  
  return roomType;
}

/**
 * Create a test location in the database with cleanup tracking
 * 
 * @example
 * const location = await createE2ELocation({
 *   name: 'Beach Resort',
 *   type: 'venue',
 *   address: '123 Beach Road'
 * });
 */
export async function createE2ELocation(data: {
  name: string;
  type: 'country' | 'region' | 'city' | 'venue' | 'accommodation';
  parentId?: string | null;
  description?: string | null;
  address?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      name: data.name,
      type: data.type,
      parent_id: data.parentId || null,
      description: data.description || null,
      address: data.address || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E location: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('locations', location.id);
  
  return location;
}

/**
 * Create a test content page in the database with cleanup tracking
 * 
 * @example
 * const page = await createE2EContentPage({
 *   title: 'Our Story',
 *   slug: 'our-story',
 *   type: 'custom'
 * });
 */
export async function createE2EContentPage(data: {
  title: string;
  slug: string;
  type: 'custom' | 'event' | 'activity';
  content?: string | null;
  published?: boolean;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: page, error } = await supabase
    .from('content_pages')
    .insert({
      title: data.title,
      slug: data.slug,
      type: data.type,
      content: data.content || null,
      published: data.published || false,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E content page: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('contentPages', page.id);
  
  return page;
}

/**
 * Create a test RSVP in the database with cleanup tracking
 * 
 * @example
 * const rsvp = await createE2ERSVP({
 *   guestId: guest.id,
 *   eventId: event.id,
 *   activityId: activity.id,
 *   status: 'attending'
 * });
 */
export async function createE2ERSVP(data: {
  guestId: string;
  eventId: string;
  activityId?: string | null;
  status?: 'pending' | 'attending' | 'declined' | 'maybe';
  guestCount?: number;
  dietaryRestrictions?: string | null;
  notes?: string | null;
}): Promise<any> {
  const supabase = createTestClient();
  
  const { data: rsvp, error } = await supabase
    .from('rsvps')
    .insert({
      guest_id: data.guestId,
      event_id: data.eventId,
      activity_id: data.activityId || null,
      status: data.status || 'pending',
      guest_count: data.guestCount || 1,
      dietary_restrictions: data.dietaryRestrictions || null,
      notes: data.notes || null,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create E2E RSVP: ${error.message}`);
  }
  
  // Register for cleanup
  registerForCleanup('rsvps', rsvp.id);
  
  return rsvp;
}

// ============================================================================
// E2E Scenario Builders
// ============================================================================

/**
 * Create a complete E2E test scenario with related entities
 * 
 * @example
 * const scenario = await createE2EScenario({
 *   groupName: 'Smith Family',
 *   guestCount: 3,
 *   eventName: 'Wedding Ceremony',
 *   activityCount: 2
 * });
 */
export async function createE2EScenario(options: {
  groupName?: string;
  guestCount?: number;
  eventName?: string;
  eventDate?: string;
  activityCount?: number;
  createRSVPs?: boolean;
}): Promise<{
  group: any;
  guests: any[];
  event: any;
  activities: any[];
  rsvps: any[];
}> {
  const {
    groupName = `Test Family ${Date.now()}`,
    guestCount = 3,
    eventName = `Test Event ${Date.now()}`,
    eventDate = new Date(Date.now() + 86400000).toISOString().split('T')[0],
    activityCount = 2,
    createRSVPs = true,
  } = options;
  
  // Create group
  const group = await createE2EGroup({ name: groupName });
  
  // Create guests
  const guests = await Promise.all(
    Array.from({ length: guestCount }, async (_, i) => {
      return await createE2EGuest({
        firstName: `Test${i}`,
        lastName: `User${i}`,
        email: `test.user${i}.${Date.now()}@example.com`,
        groupId: group.id,
      });
    })
  );
  
  // Create event
  const event = await createE2EEvent({
    name: eventName,
    startDate: eventDate,
    endDate: eventDate,
  });
  
  // Create activities
  const activities = await Promise.all(
    Array.from({ length: activityCount }, async (_, i) => {
      return await createE2EActivity({
        name: `Test Activity ${i}`,
        eventId: event.id,
        capacity: 50,
      });
    })
  );
  
  // Create RSVPs if requested
  const rsvps = [];
  if (createRSVPs) {
    for (const guest of guests) {
      for (const activity of activities) {
        const rsvp = await createE2ERSVP({
          guestId: guest.id,
          eventId: event.id,
          activityId: activity.id,
        });
        rsvps.push(rsvp);
      }
    }
  }
  
  return { group, guests, event, activities, rsvps };
}

/**
 * Create a minimal E2E test scenario (group + guest only)
 * 
 * @example
 * const { group, guest } = await createMinimalE2EScenario();
 */
export async function createMinimalE2EScenario(): Promise<{
  group: any;
  guest: any;
}> {
  const group = await createE2EGroup({
    name: `Test Family ${Date.now()}`,
  });
  
  const guest = await createE2EGuest({
    firstName: 'Test',
    lastName: 'User',
    email: `test.user.${Date.now()}@example.com`,
    groupId: group.id,
  });
  
  return { group, guest };
}

/**
 * Cleanup all registered E2E test data
 * 
 * @example
 * await cleanupE2EData();
 */
export async function cleanupE2EData(): Promise<void> {
  const supabase = createTestClient();
  const registry = getCleanupRegistry();
  
  // Delete in reverse order to respect foreign key constraints
  const cleanupOrder: Array<{ table: string; ids: string[] }> = [
    { table: 'rsvps', ids: registry.rsvps },
    { table: 'sections', ids: registry.sections },
    { table: 'activities', ids: registry.activities },
    { table: 'events', ids: registry.events },
    { table: 'room_types', ids: registry.roomTypes },
    { table: 'accommodations', ids: registry.accommodations },
    { table: 'guests', ids: registry.guests },
    { table: 'groups', ids: registry.groups },
    { table: 'content_pages', ids: registry.contentPages },
    { table: 'locations', ids: registry.locations },
  ];
  
  for (const { table, ids } of cleanupOrder) {
    if (ids.length > 0) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', ids);
      
      if (error) {
        console.warn(`Failed to cleanup ${table}:`, error.message);
      }
    }
  }
  
  // Clear the registry
  clearCleanupRegistry();
}
