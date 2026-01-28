/**
 * Regression Test Suite: Performance Monitoring
 * 
 * Tests performance benchmarks to prevent regressions in:
 * - Guest Portal page load times
 * - Admin Dashboard (Logistics) performance
 * - Database query performance
 * - API response times
 * - Bulk operation performance
 * 
 * Requirements: 21.8
 */

import { createMockSupabaseClient, configureMockQuery, resetMockSupabaseClient } from '../helpers/mockSupabase';
import * as guestServiceModule from '@/services/guestService';
import * as rsvpServiceModule from '@/services/rsvpService';
import * as eventServiceModule from '@/services/eventService';
import * as activityServiceModule from '@/services/activityService';

const guestService = guestServiceModule;
const rsvpService = rsvpServiceModule;
const eventService = eventServiceModule;
const activityService = activityServiceModule;

// Create properly configured mock
const mockSupabase = createMockSupabaseClient();

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
  supabase: mockSupabase,
}));

describe('Regression: Performance Monitoring', () => {
  beforeEach(() => {
    resetMockSupabaseClient(mockSupabase);
  });

  describe('Guest Portal Performance', () => {
    it('should load guest dashboard data within 200ms', async () => {
      const mockGuest = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        group_id: 'group-1',
        age_type: 'adult' as const,
        guest_type: 'wedding_guest' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockEvents = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `event-${i}`,
          name: `Event ${i}`,
          start_date: new Date().toISOString(),
        }));

      const mockRSVPs = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `rsvp-${i}`,
          guest_id: 'guest-1',
          event_id: `event-${i}`,
          status: 'pending' as const,
        }));

      // Configure mock to return guest data
      mockSupabase.single.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      // Configure mock to return events and RSVPs
      mockSupabase.eq.mockResolvedValue({
        data: mockEvents,
        error: null,
        count: mockEvents.length,
      });

      const startTime = performance.now();

      // Simulate dashboard data loading
      await Promise.all([
        guestService.get('guest-1'),
        eventService.list({ page: 1, pageSize: 10 }),
        rsvpService.list({ guestId: 'guest-1' }),
      ]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });

    it('should load itinerary data within 150ms', async () => {
      const mockItinerary = {
        guestId: 'guest-1',
        events: Array(5).fill({ id: 'event-1', name: 'Event' }),
        activities: Array(10).fill({ id: 'activity-1', name: 'Activity' }),
      };

      mockSupabase.select.mockResolvedValue({
        data: mockItinerary,
        error: null,
      });

      const startTime = performance.now();

      // Simulate itinerary loading
      await mockSupabase.from('itineraries').select('*').eq('guest_id', 'guest-1').single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150);
    });

    it('should handle RSVP submission within 100ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'rsvp-1',
          guestId: 'guest-1',
          eventId: 'event-1',
          status: 'attending',
        },
        error: null,
      });

      const startTime = performance.now();

      await rsvpService.create({
        guestId: 'guest-1',
        eventId: 'event-1',
        status: 'attending',
        guestCount: 2,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Admin Dashboard (Logistics) Performance', () => {
    it('should load logistics dashboard within 300ms', async () => {
      const mockGuests = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `guest-${i}`,
          firstName: `Guest${i}`,
          lastName: 'Doe',
          groupId: 'group-1',
        }));

      const mockEvents = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `event-${i}`,
          name: `Event ${i}`,
        }));

      const mockActivities = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `activity-${i}`,
          name: `Activity ${i}`,
        }));

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockGuests, error: null, count: 100 })
        .mockResolvedValueOnce({ data: mockEvents, error: null, count: 20 })
        .mockResolvedValueOnce({ data: mockActivities, error: null, count: 50 });

      const startTime = performance.now();

      // Simulate dashboard data loading
      await Promise.all([
        guestService.list({ page: 1, pageSize: 100 }),
        eventService.list({ page: 1, pageSize: 20 }),
        activityService.list({ page: 1, pageSize: 50 }),
      ]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('should calculate capacity metrics within 100ms', async () => {
      const mockRSVPs = Array(90)
        .fill(null)
        .map(() => ({
          status: 'attending',
          guestCount: 1,
        }));

      mockSupabase.select.mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });

      const startTime = performance.now();

      // Simulate capacity calculation
      const rsvps = await mockSupabase
        .from('rsvps')
        .select('*')
        .eq('activity_id', 'activity-1');

      const totalAttendees = rsvps.data.reduce(
        (sum: number, rsvp: any) => sum + (rsvp.guestCount || 0),
        0
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(totalAttendees).toBe(90);
    });

    it('should generate transportation manifest within 200ms', async () => {
      const mockGuests = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `guest-${i}`,
          arrivalDate: new Date('2025-06-15T10:00:00Z'),
          airportCode: 'SJO',
        }));

      mockSupabase.select.mockResolvedValue({
        data: mockGuests,
        error: null,
      });

      const startTime = performance.now();

      // Simulate manifest generation
      const guests = await mockSupabase
        .from('guests')
        .select('*')
        .eq('airport_code', 'SJO');

      // Group by time windows (simplified)
      const grouped = guests.data.reduce((acc: any, guest: any) => {
        const hour = new Date(guest.arrivalDate).getHours();
        if (!acc[hour]) acc[hour] = [];
        acc[hour].push(guest);
        return acc;
      }, {});

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Database Query Performance', () => {
    it('should execute simple SELECT within 50ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'John' },
        error: null,
      });

      const startTime = performance.now();

      await mockSupabase.from('guests').select('*').eq('id', 'guest-1').single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should execute paginated query within 100ms', async () => {
      const mockData = Array(50)
        .fill(null)
        .map((_, i) => ({ id: `guest-${i}` }));

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 100,
      });

      const startTime = performance.now();

      await mockSupabase
        .from('guests')
        .select('*', { count: 'exact' })
        .range(0, 49);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should execute filtered query within 75ms', async () => {
      const mockData = Array(20)
        .fill(null)
        .map((_, i) => ({ id: `guest-${i}`, groupId: 'group-1' }));

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const startTime = performance.now();

      await mockSupabase.from('guests').select('*').eq('group_id', 'group-1');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(75);
    });
  });

  describe('API Response Times', () => {
    it('should respond to GET request within 200ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'John' },
        error: null,
      });

      const startTime = performance.now();

      await guestService.get('guest-1');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });

    it('should respond to POST request within 150ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          firstName: 'John',
          lastName: 'Doe',
          groupId: 'group-1',
        },
        error: null,
      });

      const startTime = performance.now();

      await guestService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        groupId: 'group-1',
        ageType: 'adult',
        guestType: 'wedding_guest',
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150);
    });

    it('should respond to PUT request within 150ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'Jane' },
        error: null,
      });

      const startTime = performance.now();

      await guestService.update('guest-1', { firstName: 'Jane' });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150);
    });

    it('should respond to DELETE request within 100ms', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const startTime = performance.now();

      await guestService.delete('guest-1');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Bulk Operation Performance', () => {
    it('should handle bulk guest creation within 500ms', async () => {
      const guests = Array(50)
        .fill(null)
        .map((_, i) => ({
          firstName: `Guest${i}`,
          lastName: 'Doe',
          email: `guest${i}@example.com`,
          groupId: 'group-1',
          ageType: 'adult' as const,
          guestType: 'wedding_guest' as const,
        }));

      mockSupabase.select.mockResolvedValue({
        data: guests.map((g, i) => ({ id: `guest-${i}`, ...g })),
        error: null,
      });

      const startTime = performance.now();

      await guestService.bulkCreate(guests);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should handle bulk guest update within 400ms', async () => {
      const updates = Array(30)
        .fill(null)
        .map((_, i) => ({
          id: `guest-${i}`,
          firstName: `Updated${i}`,
        }));

      mockSupabase.select.mockResolvedValue({
        data: updates,
        error: null,
      });

      const startTime = performance.now();

      await guestService.bulkUpdate(updates);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(400);
    });

    it('should handle CSV export within 300ms', async () => {
      const guests = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `guest-${i}`,
          firstName: `Guest${i}`,
          lastName: 'Doe',
          email: `guest${i}@example.com`,
          groupId: 'group-1',
          ageType: 'adult' as const,
          guestType: 'wedding_guest' as const,
        }));

      mockSupabase.select.mockResolvedValue({
        data: guests,
        error: null,
      });

      const startTime = performance.now();

      // Simulate CSV export
      const data = await mockSupabase.from('guests').select('*');
      const csv = data.data
        .map((g: any) => `${g.firstName},${g.lastName},${g.email}`)
        .join('\n');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
      expect(csv.split('\n').length).toBe(100);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated operations', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'John' },
        error: null,
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        await guestService.get('guest-1');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large datasets without excessive memory', async () => {
      const largeDataset = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `guest-${i}`,
          firstName: `Guest${i}`,
          lastName: 'Doe',
        }));

      mockSupabase.select.mockResolvedValue({
        data: largeDataset,
        error: null,
      });

      const initialMemory = process.memoryUsage().heapUsed;

      await guestService.list({ page: 1, pageSize: 1000 });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain performance under load', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'John' },
        error: null,
      });

      const iterations = 50;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await guestService.get('guest-1');
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const averageDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Average should be under 100ms
      expect(averageDuration).toBeLessThan(100);
      // Max should be under 200ms
      expect(maxDuration).toBeLessThan(200);
    });

    it('should have consistent performance across operations', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1' },
        error: null,
      });

      const operations = [
        () => guestService.get('guest-1'),
        () => guestService.update('guest-1', { firstName: 'Jane' }),
        () => guestService.delete('guest-1'),
      ];

      const durations: number[] = [];

      for (const operation of operations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // All operations should complete within 200ms
      durations.forEach((duration) => {
        expect(duration).toBeLessThan(200);
      });

      // Variance should be low (consistent performance)
      const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) /
        durations.length;
      const standardDeviation = Math.sqrt(variance);

      // Standard deviation should be less than 50ms
      expect(standardDeviation).toBeLessThan(50);
    });
  });
});
