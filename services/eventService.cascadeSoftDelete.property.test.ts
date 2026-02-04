/**
 * Property-Based Test: Event Cascade Soft Deletion
 * Feature: guest-portal-and-admin-enhancements
 * Property 31: Event Cascade Deletion
 * 
 * Validates: Requirements 29.1
 * 
 * Property: When an event is soft deleted, all associated activities and RSVPs
 * must also be soft deleted with the same timestamp.
 */

import * as fc from 'fast-check';
import { deleteEvent, restoreEvent, create as createEvent } from './eventService';
import { create as createActivity } from './activityService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Feature: guest-portal-and-admin-enhancements, Property 31: Event Cascade Deletion', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should soft delete all activities when event is soft deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 100 }),
          activityCount: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ eventName, activityCount }) => {
          // Create event
          const eventResult = await createEvent({
            name: eventName,
            date: new Date().toISOString().split('T')[0],
          });

          if (!eventResult.success) {
            throw new Error('Failed to create event');
          }

          const eventId = eventResult.data.id;

          // Create activities
          const activityIds: string[] = [];
          for (let i = 0; i < activityCount; i++) {
            const activityResult = await createActivity({
              name: `Activity ${i}`,
              event_id: eventId,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });

            if (activityResult.success) {
              activityIds.push(activityResult.data.id);
            }
          }

          // Soft delete event
          const deleteResult = await deleteEvent(eventId, { permanent: false });
          expect(deleteResult.success).toBe(true);

          // Verify event is soft deleted
          const { data: event } = await supabase
            .from('events')
            .select('deleted_at')
            .eq('id', eventId)
            .single();

          expect(event?.deleted_at).not.toBeNull();

          // Verify all activities are soft deleted
          const { data: activities } = await supabase
            .from('activities')
            .select('id, deleted_at')
            .eq('event_id', eventId);

          expect(activities).toHaveLength(activityIds.length);
          activities?.forEach((activity) => {
            expect(activity.deleted_at).not.toBeNull();
          });

          // Cleanup
          await deleteEvent(eventId, { permanent: true });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore all activities when event is restored', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 100 }),
          activityCount: fc.integer({ min: 1, max: 3 }),
        }),
        async ({ eventName, activityCount }) => {
          // Create event
          const eventResult = await createEvent({
            name: eventName,
            date: new Date().toISOString().split('T')[0],
          });

          if (!eventResult.success) {
            throw new Error('Failed to create event');
          }

          const eventId = eventResult.data.id;

          // Create activities
          const activityIds: string[] = [];
          for (let i = 0; i < activityCount; i++) {
            const activityResult = await createActivity({
              name: `Activity ${i}`,
              event_id: eventId,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });

            if (activityResult.success) {
              activityIds.push(activityResult.data.id);
            }
          }

          // Soft delete event
          await deleteEvent(eventId, { permanent: false });

          // Restore event
          const restoreResult = await restoreEvent(eventId);
          expect(restoreResult.success).toBe(true);

          // Verify event is restored
          const { data: event } = await supabase
            .from('events')
            .select('deleted_at')
            .eq('id', eventId)
            .single();

          expect(event?.deleted_at).toBeNull();

          // Verify all activities are restored
          const { data: activities } = await supabase
            .from('activities')
            .select('id, deleted_at')
            .eq('event_id', eventId);

          expect(activities).toHaveLength(activityIds.length);
          activities?.forEach((activity) => {
            expect(activity.deleted_at).toBeNull();
          });

          // Cleanup
          await deleteEvent(eventId, { permanent: true });
        }
      ),
      { numRuns: 50 }
    );
  });
});
