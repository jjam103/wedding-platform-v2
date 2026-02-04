/**
 * Property-Based Test: Referential Integrity Check
 * Feature: guest-portal-and-admin-enhancements
 * Property 34: Referential Integrity Check
 * 
 * Validates: Requirements 29.4
 * 
 * Property: Before deletion, the system must identify all dependent records
 * and return an accurate count of records that would be affected.
 */

import * as fc from 'fast-check';
import {
  checkContentPageReferences,
  checkEventReferences,
  checkActivityReferences,
} from './referenceChecking';
import { createContentPage } from '../services/contentPagesService';
import { create as createEvent } from '../services/eventService';
import { create as createActivity } from '../services/activityService';
import { createSection } from '../services/sectionsService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Feature: guest-portal-and-admin-enhancements, Property 34: Referential Integrity Check', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should accurately count dependent sections for content page', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageTitle: fc.string({ minLength: 1, maxLength: 100 }),
          sectionCount: fc.integer({ min: 0, max: 5 }),
        }),
        async ({ pageTitle, sectionCount }) => {
          // Create content page
          const pageResult = await createContentPage({
            title: pageTitle,
            status: 'draft',
          });

          if (!pageResult.success) {
            throw new Error('Failed to create content page');
          }

          const pageId = pageResult.data.id;

          // Create sections
          for (let i = 0; i < sectionCount; i++) {
            await createSection({
              page_type: 'custom',
              page_id: pageId,
              title: `Section ${i}`,
              display_order: i,
            });
          }

          // Check references
          const result = await checkContentPageReferences(pageId);

          if (sectionCount > 0) {
            expect(result.hasReferences).toBe(true);
            expect(result.dependentRecords.length).toBeGreaterThan(0);
            
            // Find sections record
            const sectionsRecord = result.dependentRecords.find((r) => r.type === 'section');
            expect(sectionsRecord).toBeDefined();
            expect(sectionsRecord?.count).toBe(sectionCount);
          } else {
            expect(result.hasReferences).toBe(false);
            expect(result.dependentRecords.length).toBe(0);
          }

          // Cleanup
          await supabase.from('sections').delete().eq('page_id', pageId);
          await supabase.from('content_pages').delete().eq('id', pageId);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accurately count dependent activities for event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 100 }),
          activityCount: fc.integer({ min: 0, max: 5 }),
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
          for (let i = 0; i < activityCount; i++) {
            await createActivity({
              name: `Activity ${i}`,
              event_id: eventId,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });
          }

          // Check references
          const result = await checkEventReferences(eventId);

          if (activityCount > 0) {
            expect(result.hasReferences).toBe(true);
            expect(result.dependentRecords.length).toBeGreaterThan(0);
            
            // Find activities record
            const activitiesRecord = result.dependentRecords.find((r) => r.type === 'activity');
            expect(activitiesRecord).toBeDefined();
            expect(activitiesRecord?.count).toBe(activityCount);
          } else {
            expect(result.hasReferences).toBe(false);
            expect(result.dependentRecords.length).toBe(0);
          }

          // Cleanup
          await supabase.from('activities').delete().eq('event_id', eventId);
          await supabase.from('events').delete().eq('id', eventId);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should detect references across multiple types', async () => {
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
          for (let i = 0; i < activityCount; i++) {
            await createActivity({
              name: `Activity ${i}`,
              event_id: eventId,
              date: new Date().toISOString().split('T')[0],
              activity_type: 'activity',
            });
          }

          // Check references
          const result = await checkEventReferences(eventId);

          // Should detect activities
          expect(result.hasReferences).toBe(true);
          expect(result.dependentRecords.length).toBeGreaterThan(0);
          
          const activitiesRecord = result.dependentRecords.find((r) => r.type === 'activity');
          expect(activitiesRecord).toBeDefined();
          expect(activitiesRecord?.count).toBe(activityCount);

          // Total count should be at least the activity count
          expect(result.totalCount).toBeGreaterThanOrEqual(activityCount);

          // Cleanup
          await supabase.from('activities').delete().eq('event_id', eventId);
          await supabase.from('events').delete().eq('id', eventId);
        }
      ),
      { numRuns: 50 }
    );
  });
});
