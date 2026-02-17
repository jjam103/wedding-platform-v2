/**
 * Integration tests for Guest RSVP API routes
 * 
 * Tests:
 * - Create RSVP (success and validation errors)
 * - Update RSVP (success and validation errors)
 * - Get RSVPs (returns only guest's RSVPs)
 * - RSVP summary (correct counts)
 * - Capacity validation (cannot exceed capacity)
 * - Deadline enforcement (cannot RSVP after deadline)
 * - RLS enforcement (cannot access other guest's RSVPs)
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 7.5
 */

import { createTestClient } from '@/__tests__/helpers/testDb';
import { cleanupTestData } from '@/__tests__/helpers/cleanup';

describe('Guest RSVP API Integration Tests', () => {
  let testDb: ReturnType<typeof createTestClient>;
  let guestClient: ReturnType<typeof createTestClient>;
  let otherGuestClient: ReturnType<typeof createTestClient>;
  let guestId: string;
  let otherGuestId: string;
  let activityId: string;
  let eventId: string;
  let groupId: string;

  beforeAll(async () => {
    testDb = createTestClient();

    // Create test group
    const { data: group } = await testDb
      .from('groups')
      .insert({ name: 'Test Family' })
      .select()
      .single();
    groupId = group!.id;

    // Create test guests
    const { data: guest1 } = await testDb
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest',
        email: 'test.guest@example.com',
        group_id: groupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      })
      .select()
      .single();
    guestId = guest1!.id;

    const { data: guest2 } = await testDb
      .from('guests')
      .insert({
        first_name: 'Other',
        last_name: 'Guest',
        email: 'other.guest@example.com',
        group_id: groupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      })
      .select()
      .single();
    otherGuestId = guest2!.id;

    // Create authenticated clients
    guestClient = await createAuthenticatedClient({ email: 'test.guest@example.com' });
    otherGuestClient = await createAuthenticatedClient({ email: 'other.guest@example.com' });

    // Create test activity with capacity
    const { data: activity } = await testDb
      .from('activities')
      .insert({
        name: 'Test Activity',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        capacity: 5,
        rsvp_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'published',
      })
      .select()
      .single();
    activityId = activity!.id;

    // Create test event
    const { data: event } = await testDb
      .from('events')
      .insert({
        name: 'Test Event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rsvp_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'published',
      })
      .select()
      .single();
    eventId = event!.id;
  });

  afterAll(async () => {
    await cleanupTestData(testDb, {
      tables: ['rsvps', 'activities', 'events', 'guests', 'groups'],
    });
  });

  afterEach(async () => {
    // Clean up RSVPs after each test
    await testDb.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('POST /api/guest/rsvps', () => {
    it('should create RSVP with valid data', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          activity_id: activityId,
          status: 'attending',
          guest_count: 2,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.guest_id).toBe(guestId);
      expect(data.data.activity_id).toBe(activityId);
      expect(data.data.status).toBe('attending');
      expect(data.data.guest_count).toBe(2);
    });

    it('should return validation error for invalid data', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          // Missing activity_id or event_id
          status: 'attending',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce capacity limits', async () => {
      // Fill capacity to 4 (leaving 1 spot)
      await testDb.from('rsvps').insert([
        { guest_id: otherGuestId, activity_id: activityId, status: 'attending', guest_count: 4 },
      ]);

      // Try to RSVP with 2 guests (exceeds capacity)
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          activity_id: activityId,
          status: 'attending',
          guest_count: 2,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CAPACITY_EXCEEDED');
    });

    it('should enforce RSVP deadlines', async () => {
      // Create activity with past deadline
      const { data: pastActivity } = await testDb
        .from('activities')
        .insert({
          name: 'Past Deadline Activity',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          rsvp_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          status: 'published',
        })
        .select()
        .single();

      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          activity_id: pastActivity!.id,
          status: 'attending',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DEADLINE_PASSED');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          status: 'attending',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/guest/rsvps/[id]', () => {
    let rsvpId: string;

    beforeEach(async () => {
      // Create RSVP for testing
      const { data: rsvp } = await testDb
        .from('rsvps')
        .insert({
          guest_id: guestId,
          activity_id: activityId,
          status: 'pending',
          guest_count: 1,
        })
        .select()
        .single();
      rsvpId = rsvp!.id;
    });

    it('should update RSVP with valid data', async () => {
      const response = await fetch(`http://localhost:3000/api/guest/rsvps/${rsvpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          status: 'attending',
          guest_count: 2,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('attending');
      expect(data.data.guest_count).toBe(2);
    });

    it('should return validation error for invalid data', async () => {
      const response = await fetch(`http://localhost:3000/api/guest/rsvps/${rsvpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          guest_count: -1, // Invalid
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce capacity limits on update', async () => {
      // Fill capacity to 4
      await testDb.from('rsvps').insert([
        { guest_id: otherGuestId, activity_id: activityId, status: 'attending', guest_count: 4 },
      ]);

      // Try to update to 2 guests (would exceed capacity)
      const response = await fetch(`http://localhost:3000/api/guest/rsvps/${rsvpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          status: 'attending',
          guest_count: 2,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CAPACITY_EXCEEDED');
    });

    it('should prevent updating another guest\'s RSVP', async () => {
      const response = await fetch(`http://localhost:3000/api/guest/rsvps/${rsvpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb-access-token=${otherGuestClient.auth.session?.access_token}`,
        },
        body: JSON.stringify({
          status: 'attending',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/guest/rsvps', () => {
    beforeEach(async () => {
      // Create RSVPs for both guests
      await testDb.from('rsvps').insert([
        { guest_id: guestId, activity_id: activityId, status: 'attending', guest_count: 2 },
        { guest_id: guestId, event_id: eventId, status: 'pending' },
        { guest_id: otherGuestId, activity_id: activityId, status: 'declined' },
      ]);
    });

    it('should return only authenticated guest\'s RSVPs', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'GET',
        headers: {
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((rsvp: any) => rsvp.guest_id === guestId)).toBe(true);
    });

    it('should include entity details and capacity info', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps', {
        method: 'GET',
        headers: {
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      const activityRsvp = data.data.find((r: any) => r.activity_id === activityId);
      expect(activityRsvp.entity).toBeDefined();
      expect(activityRsvp.entity.type).toBe('activity');
      expect(activityRsvp.capacity).toBeDefined();
      expect(activityRsvp.deadline).toBeDefined();
      expect(activityRsvp.can_modify).toBe(true);
    });
  });

  describe('GET /api/guest/rsvps/summary', () => {
    beforeEach(async () => {
      // Create various RSVPs
      await testDb.from('rsvps').insert([
        { guest_id: guestId, activity_id: activityId, status: 'attending' },
        { guest_id: guestId, event_id: eventId, status: 'attending' },
        { guest_id: guestId, activity_id: activityId, status: 'declined' },
        { guest_id: guestId, event_id: eventId, status: 'pending' },
      ]);
    });

    it('should return correct RSVP summary', async () => {
      const response = await fetch('http://localhost:3000/api/guest/rsvps/summary', {
        method: 'GET',
        headers: {
          'Cookie': `sb-access-token=${guestClient.auth.session?.access_token}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total_rsvps).toBe(4);
      expect(data.data.events.total).toBe(2);
      expect(data.data.events.attending).toBe(1);
      expect(data.data.events.pending).toBe(1);
      expect(data.data.activities.total).toBe(2);
      expect(data.data.activities.attending).toBe(1);
      expect(data.data.activities.declined).toBe(1);
      expect(data.data.overall.attending).toBe(2);
      expect(data.data.overall.declined).toBe(1);
      expect(data.data.overall.pending).toBe(1);
      expect(data.data.response_rate).toBe(75); // 3 out of 4 responded
    });
  });
});
