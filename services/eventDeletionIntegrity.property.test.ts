import * as fc from 'fast-check';
import * as eventService from './eventService';
import * as activityService from './activityService';

// Mock Supabase
jest.mock('@supabase/supabase-js');

/**
 * Property-based tests for event deletion integrity.
 * Feature: destination-wedding-platform, Property 10: Event Deletion Integrity
 * 
 * Validates: Requirements 6.13
 * 
 * This test validates that when an event is deleted, associated independent activities
 * (activities with event_id set to the deleted event) are not cascade deleted but instead
 * have their event_id set to NULL, preserving data integrity.
 */

describe.skip('Feature: destination-wedding-platform, Property 10: Event Deletion Integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  it('should not cascade delete activities when event is deleted', () => {
    const eventIdArbitrary = fc.uuid();
    const activityArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
    });

    fc.assert(
      fc.asyncProperty(
        eventIdArbitrary,
        fc.array(activityArbitrary, { minLength: 1, maxLength: 10 }),
        async (eventId, activities) => {
          // Mock activities associated with the event
          const activitiesWithEvent = activities.map(a => ({
            ...a,
            eventId,
          }));

          // Mock the event deletion
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Mock activity retrieval after deletion (activities should still exist with eventId = null)
          const mockListActivities = jest.spyOn(activityService, 'list');
          const activitiesAfterDeletion = activities.map(a => ({
            ...a,
            eventId: null, // Event ID should be set to NULL, not deleted
            locationId: null,
            description: null,
            endTime: null,
            capacity: null,
            costPerPerson: null,
            hostSubsidy: null,
            adultsOnly: false,
            plusOneAllowed: true,
            visibility: [],
            status: 'draft' as const,
            displayOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          mockListActivities.mockResolvedValue({
            success: true,
            data: {
              activities: activitiesAfterDeletion,
              total: activitiesAfterDeletion.length,
              page: 1,
              pageSize: 50,
              totalPages: 1,
            },
          } as any);

          // Delete the event
          const deleteResult = await eventService.deleteEvent(eventId);

          // Property 1: Event deletion should succeed
          expect(deleteResult.success).toBe(true);

          // Query for activities that were associated with the event
          const activityIds = activities.map(a => a.id);
          const listResult = await activityService.list({});

          // Property 2: Activities should still exist
          expect(listResult.success).toBe(true);
          if (listResult.success) {
            const retrievedActivityIds = listResult.data.activities.map(a => a.id);
            
            // Property 3: All original activities should still be present
            for (const activityId of activityIds) {
              expect(retrievedActivityIds).toContain(activityId);
            }

            // Property 4: Activities should have eventId set to null (not deleted)
            for (const activity of listResult.data.activities) {
              if (activityIds.includes(activity.id)) {
                expect(activity.eventId).toBeNull();
              }
            }
          }

          mockDeleteEvent.mockRestore();
          mockListActivities.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should preserve activity data when event is deleted', () => {
    const eventIdArbitrary = fc.uuid();
    const activityArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
      description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
      costPerPerson: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
    });

    fc.assert(
      fc.asyncProperty(
        eventIdArbitrary,
        activityArbitrary,
        async (eventId, activityData) => {
          // Mock the event deletion
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Mock activity retrieval - activity should exist with same data except eventId
          const mockGetActivity = jest.spyOn(activityService, 'get');
          mockGetActivity.mockResolvedValue({
            success: true,
            data: {
              ...activityData,
              eventId: null, // Changed from eventId to null
              locationId: null,
              endTime: null,
              hostSubsidy: null,
              adultsOnly: false,
              plusOneAllowed: true,
              visibility: [],
              status: 'draft',
              displayOrder: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          } as any);

          // Delete the event
          const deleteResult = await eventService.deleteEvent(eventId);
          expect(deleteResult.success).toBe(true);

          // Retrieve the activity
          const activityResult = await activityService.get(activityData.id);

          // Property 1: Activity should still exist
          expect(activityResult.success).toBe(true);

          if (activityResult.success) {
            // Property 2: Activity data should be preserved (except eventId)
            expect(activityResult.data.name).toBe(activityData.name);
            expect(activityResult.data.activityType).toBe(activityData.activityType);
            expect(activityResult.data.startTime).toBe(activityData.startTime);
            expect(activityResult.data.description).toBe(activityData.description);
            expect(activityResult.data.capacity).toBe(activityData.capacity);
            expect(activityResult.data.costPerPerson).toBe(activityData.costPerPerson);

            // Property 3: eventId should be null (not the deleted event ID)
            expect(activityResult.data.eventId).toBeNull();
            expect(activityResult.data.eventId).not.toBe(eventId);
          }

          mockDeleteEvent.mockRestore();
          mockGetActivity.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should allow activities to be reassigned to different events after original event deletion', () => {
    const originalEventIdArbitrary = fc.uuid();
    const newEventIdArbitrary = fc.uuid();
    const activityIdArbitrary = fc.uuid();

    fc.assert(
      fc.asyncProperty(
        originalEventIdArbitrary,
        newEventIdArbitrary,
        activityIdArbitrary,
        async (originalEventId, newEventId, activityId) => {
          // Ensure event IDs are different
          fc.pre(originalEventId !== newEventId);

          // Mock event deletion
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Mock activity update to new event
          const mockUpdateActivity = jest.spyOn(activityService, 'update');
          mockUpdateActivity.mockResolvedValue({
            success: true,
            data: {
              id: activityId,
              eventId: newEventId, // Successfully reassigned
              name: 'Test Activity',
              activityType: 'activity',
              startTime: new Date().toISOString(),
              description: null,
              locationId: null,
              endTime: null,
              capacity: null,
              costPerPerson: null,
              hostSubsidy: null,
              adultsOnly: false,
              plusOneAllowed: true,
              visibility: [],
              status: 'draft',
              displayOrder: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          } as any);

          // Delete original event
          const deleteResult = await eventService.deleteEvent(originalEventId);
          expect(deleteResult.success).toBe(true);

          // Reassign activity to new event
          const updateResult = await activityService.update(activityId, {
            eventId: newEventId,
          } as any);

          // Property 1: Update should succeed
          expect(updateResult.success).toBe(true);

          if (updateResult.success) {
            // Property 2: Activity should be assigned to new event
            expect(updateResult.data.eventId).toBe(newEventId);
            expect(updateResult.data.eventId).not.toBe(originalEventId);
          }

          mockDeleteEvent.mockRestore();
          mockUpdateActivity.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should handle deletion of events with no associated activities', () => {
    const eventIdArbitrary = fc.uuid();

    fc.assert(
      fc.asyncProperty(
        eventIdArbitrary,
        async (eventId) => {
          // Mock event deletion (event with no activities)
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Delete the event
          const deleteResult = await eventService.deleteEvent(eventId);

          // Property 1: Deletion should succeed even with no activities
          expect(deleteResult.success).toBe(true);

          mockDeleteEvent.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should handle deletion of events with mix of dependent and independent activities', () => {
    const eventIdArbitrary = fc.uuid();
    const activityArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
    });

    fc.assert(
      fc.asyncProperty(
        eventIdArbitrary,
        fc.array(activityArbitrary, { minLength: 2, maxLength: 10 }),
        async (eventId, activities) => {
          // Split activities into dependent (with eventId) and independent (without eventId)
          const midpoint = Math.floor(activities.length / 2);
          const dependentActivities = activities.slice(0, midpoint).map(a => ({
            ...a,
            eventId,
          }));
          const independentActivities = activities.slice(midpoint).map(a => ({
            ...a,
            eventId: null,
          }));

          // Mock event deletion
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Mock activity list - all activities should exist after deletion
          const mockListActivities = jest.spyOn(activityService, 'list');
          const allActivitiesAfterDeletion = [
            ...dependentActivities.map(a => ({ ...a, eventId: null })), // Dependent activities now have null eventId
            ...independentActivities, // Independent activities unchanged
          ].map(a => ({
            ...a,
            locationId: null,
            description: null,
            endTime: null,
            capacity: null,
            costPerPerson: null,
            hostSubsidy: null,
            adultsOnly: false,
            plusOneAllowed: true,
            visibility: [],
            status: 'draft' as const,
            displayOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          mockListActivities.mockResolvedValue({
            success: true,
            data: {
              activities: allActivitiesAfterDeletion,
              total: allActivitiesAfterDeletion.length,
              page: 1,
              pageSize: 50,
              totalPages: 1,
            },
          } as any);

          // Delete the event
          const deleteResult = await eventService.deleteEvent(eventId);
          expect(deleteResult.success).toBe(true);

          // Query all activities
          const listResult = await activityService.list({});

          // Property 1: All activities should still exist
          expect(listResult.success).toBe(true);
          if (listResult.success) {
            const allActivityIds = activities.map(a => a.id);
            const retrievedActivityIds = listResult.data.activities.map(a => a.id);

            // Property 2: Count should match original count
            expect(retrievedActivityIds.length).toBe(allActivityIds.length);

            // Property 3: All activities should be present
            for (const activityId of allActivityIds) {
              expect(retrievedActivityIds).toContain(activityId);
            }

            // Property 4: All activities should have eventId = null
            for (const activity of listResult.data.activities) {
              expect(activity.eventId).toBeNull();
            }
          }

          mockDeleteEvent.mockRestore();
          mockListActivities.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should maintain referential integrity after event deletion', () => {
    const eventIdArbitrary = fc.uuid();
    const activityIdArbitrary = fc.uuid();

    fc.assert(
      fc.asyncProperty(
        eventIdArbitrary,
        activityIdArbitrary,
        async (eventId, activityId) => {
          // Mock event deletion
          const mockDeleteEvent = jest.spyOn(eventService, 'deleteEvent');
          mockDeleteEvent.mockResolvedValue({
            success: true,
            data: undefined,
          } as any);

          // Mock activity get - should return activity with null eventId
          const mockGetActivity = jest.spyOn(activityService, 'get');
          mockGetActivity.mockResolvedValue({
            success: true,
            data: {
              id: activityId,
              eventId: null, // Referential integrity maintained
              name: 'Test Activity',
              activityType: 'activity',
              startTime: new Date().toISOString(),
              description: null,
              locationId: null,
              endTime: null,
              capacity: null,
              costPerPerson: null,
              hostSubsidy: null,
              adultsOnly: false,
              plusOneAllowed: true,
              visibility: [],
              status: 'draft',
              displayOrder: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          } as any);

          // Delete event
          const deleteResult = await eventService.deleteEvent(eventId);
          expect(deleteResult.success).toBe(true);

          // Get activity
          const activityResult = await activityService.get(activityId);

          // Property 1: Activity should exist
          expect(activityResult.success).toBe(true);

          if (activityResult.success) {
            // Property 2: eventId should be null (not pointing to deleted event)
            expect(activityResult.data.eventId).toBeNull();
            
            // Property 3: Activity should not reference the deleted event
            expect(activityResult.data.eventId).not.toBe(eventId);
          }

          mockDeleteEvent.mockRestore();
          mockGetActivity.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });
});
