/**
 * Property-Based Test: Soft Delete Restoration
 * Feature: guest-portal-and-admin-enhancements
 * Property 33: Soft Delete Restoration
 * 
 * Validates: Requirements 29.9
 * 
 * Property: Restored records must have deleted_at set to NULL and must be
 * accessible in guest-facing queries again.
 */

import * as fc from 'fast-check';
import { createContentPage, deleteContentPage, restoreContentPage } from './contentPagesService';
import { create as createEvent, deleteEvent, restoreEvent } from './eventService';
import { create as createActivity, deleteActivity, restoreActivity } from './activityService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Feature: guest-portal-and-admin-enhancements, Property 33: Soft Delete Restoration', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should restore content page with deleted_at set to NULL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (pageTitle) => {
          // Create content page
          const createResult = await createContentPage({
            title: pageTitle,
            status: 'published',
          });

          if (!createResult.success) {
            throw new Error('Failed to create content page');
          }

          const pageId = createResult.data.id;

          // Soft delete
          await deleteContentPage(pageId, { permanent: false });

          // Verify deleted
          const { data: deletedPage } = await supabase
            .from('content_pages')
            .select('deleted_at')
            .eq('id', pageId)
            .single();

          expect(deletedPage?.deleted_at).not.toBeNull();

          // Restore
          const restoreResult = await restoreContentPage(pageId);
          expect(restoreResult.success).toBe(true);

          // Verify restored
          const { data: restoredPage } = await supabase
            .from('content_pages')
            .select('deleted_at')
            .eq('id', pageId)
            .single();

          expect(restoredPage?.deleted_at).toBeNull();

          // Verify accessible in guest query
          const { data: guestPages } = await supabase
            .from('content_pages')
            .select('id')
            .eq('status', 'published')
            .is('deleted_at', null);

          const guestPageIds = guestPages?.map((p) => p.id) || [];
          expect(guestPageIds).toContain(pageId);

          // Cleanup
          await deleteContentPage(pageId, { permanent: true });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore event with deleted_at set to NULL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (eventName) => {
          // Create event
          const createResult = await createEvent({
            name: eventName,
            date: new Date().toISOString().split('T')[0],
          });

          if (!createResult.success) {
            throw new Error('Failed to create event');
          }

          const eventId = createResult.data.id;

          // Soft delete
          await deleteEvent(eventId, { permanent: false });

          // Verify deleted
          const { data: deletedEvent } = await supabase
            .from('events')
            .select('deleted_at')
            .eq('id', eventId)
            .single();

          expect(deletedEvent?.deleted_at).not.toBeNull();

          // Restore
          const restoreResult = await restoreEvent(eventId);
          expect(restoreResult.success).toBe(true);

          // Verify restored
          const { data: restoredEvent } = await supabase
            .from('events')
            .select('deleted_at')
            .eq('id', eventId)
            .single();

          expect(restoredEvent?.deleted_at).toBeNull();

          // Verify accessible in guest query
          const { data: guestEvents } = await supabase
            .from('events')
            .select('id')
            .is('deleted_at', null);

          const guestEventIds = guestEvents?.map((e) => e.id) || [];
          expect(guestEventIds).toContain(eventId);

          // Cleanup
          await deleteEvent(eventId, { permanent: true });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore activity with deleted_at set to NULL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (activityName) => {
          // Create activity
          const createResult = await createActivity({
            name: activityName,
            date: new Date().toISOString().split('T')[0],
            activity_type: 'activity',
          });

          if (!createResult.success) {
            throw new Error('Failed to create activity');
          }

          const activityId = createResult.data.id;

          // Soft delete
          await deleteActivity(activityId, { permanent: false });

          // Verify deleted
          const { data: deletedActivity } = await supabase
            .from('activities')
            .select('deleted_at')
            .eq('id', activityId)
            .single();

          expect(deletedActivity?.deleted_at).not.toBeNull();

          // Restore
          const restoreResult = await restoreActivity(activityId);
          expect(restoreResult.success).toBe(true);

          // Verify restored
          const { data: restoredActivity } = await supabase
            .from('activities')
            .select('deleted_at')
            .eq('id', activityId)
            .single();

          expect(restoredActivity?.deleted_at).toBeNull();

          // Verify accessible in guest query
          const { data: guestActivities } = await supabase
            .from('activities')
            .select('id')
            .is('deleted_at', null);

          const guestActivityIds = guestActivities?.map((a) => a.id) || [];
          expect(guestActivityIds).toContain(activityId);

          // Cleanup
          await deleteActivity(activityId, { permanent: true });
        }
      ),
      { numRuns: 100 }
    );
  });
});
