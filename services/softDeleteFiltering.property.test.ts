/**
 * Property-Based Test: Soft Delete Filtering
 * Feature: guest-portal-and-admin-enhancements
 * Property 32: Soft Delete Filtering
 * 
 * Validates: Requirements 29.8
 * 
 * Property: Soft-deleted records must not appear in guest-facing queries.
 * Only active records (deleted_at IS NULL) should be returned.
 */

import * as fc from 'fast-check';
import { createContentPage, deleteContentPage } from './contentPagesService';
import { create as createEvent, deleteEvent } from './eventService';
import { create as createActivity, deleteActivity } from './activityService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Feature: guest-portal-and-admin-enhancements, Property 32: Soft Delete Filtering', () => {
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

  it('should not return soft-deleted content pages in guest queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          activeCount: fc.integer({ min: 1, max: 5 }),
          deletedCount: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ activeCount, deletedCount }) => {
          const activeIds: string[] = [];
          const deletedIds: string[] = [];

          // Create active content pages
          for (let i = 0; i < activeCount; i++) {
            const result = await createContentPage({
              title: `Active Page ${i}`,
              status: 'published',
            });

            if (result.success) {
              activeIds.push(result.data.id);
            }
          }

          // Create and soft delete content pages
          for (let i = 0; i < deletedCount; i++) {
            const result = await createContentPage({
              title: `Deleted Page ${i}`,
              status: 'published',
            });

            if (result.success) {
              deletedIds.push(result.data.id);
              await deleteContentPage(result.data.id, { permanent: false });
            }
          }

          // Query for published content pages (guest query)
          const { data: pages } = await supabase
            .from('content_pages')
            .select('id')
            .eq('status', 'published')
            .is('deleted_at', null);

          // Verify only active pages are returned
          expect(pages).toHaveLength(activeIds.length);
          const returnedIds = pages?.map((p) => p.id) || [];
          activeIds.forEach((id) => {
            expect(returnedIds).toContain(id);
          });
          deletedIds.forEach((id) => {
            expect(returnedIds).not.toContain(id);
          });

          // Cleanup
          for (const id of activeIds) {
            await deleteContentPage(id, { permanent: true });
          }
          for (const id of deletedIds) {
            await deleteContentPage(id, { permanent: true });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not return soft-deleted events in guest queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          activeCount: fc.integer({ min: 1, max: 5 }),
          deletedCount: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ activeCount, deletedCount }) => {
          const activeIds: string[] = [];
          const deletedIds: string[] = [];

          // Create active events
          for (let i = 0; i < activeCount; i++) {
            const result = await createEvent({
              name: `Active Event ${i}`,
              date: new Date().toISOString().split('T')[0],
            });

            if (result.success) {
              activeIds.push(result.data.id);
            }
          }

          // Create and soft delete events
          for (let i = 0; i < deletedCount; i++) {
            const result = await createEvent({
              name: `Deleted Event ${i}`,
              date: new Date().toISOString().split('T')[0],
            });

            if (result.success) {
              deletedIds.push(result.data.id);
              await deleteEvent(result.data.id, { permanent: false });
            }
          }

          // Query for events (guest query)
          const { data: events } = await supabase
            .from('events')
            .select('id')
            .is('deleted_at', null);

          // Verify only active events are returned
          expect(events?.length).toBeGreaterThanOrEqual(activeIds.length);
          const returnedIds = events?.map((e) => e.id) || [];
          activeIds.forEach((id) => {
            expect(returnedIds).toContain(id);
          });
          deletedIds.forEach((id) => {
            expect(returnedIds).not.toContain(id);
          });

          // Cleanup
          for (const id of activeIds) {
            await deleteEvent(id, { permanent: true });
          }
          for (const id of deletedIds) {
            await deleteEvent(id, { permanent: true });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not return soft-deleted activities in guest queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          activeCount: fc.integer({ min: 1, max: 5 }),
          deletedCount: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ activeCount, deletedCount }) => {
          const activeIds: string[] = [];
          const deletedIds: string[] = [];

          // Create active activities
          for (let i = 0; i < activeCount; i++) {
            const result = await createActivity({
              name: `Active Activity ${i}`,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });

            if (result.success) {
              activeIds.push(result.data.id);
            }
          }

          // Create and soft delete activities
          for (let i = 0; i < deletedCount; i++) {
            const result = await createActivity({
              name: `Deleted Activity ${i}`,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });

            if (result.success) {
              deletedIds.push(result.data.id);
              await deleteActivity(result.data.id, { permanent: false });
            }
          }

          // Query for activities (guest query)
          const { data: activities } = await supabase
            .from('activities')
            .select('id')
            .is('deleted_at', null);

          // Verify only active activities are returned
          expect(activities?.length).toBeGreaterThanOrEqual(activeIds.length);
          const returnedIds = activities?.map((a) => a.id) || [];
          activeIds.forEach((id) => {
            expect(returnedIds).toContain(id);
          });
          deletedIds.forEach((id) => {
            expect(returnedIds).not.toContain(id);
          });

          // Cleanup
          for (const id of activeIds) {
            await deleteActivity(id, { permanent: true });
          }
          for (const id of deletedIds) {
            await deleteActivity(id, { permanent: true });
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
