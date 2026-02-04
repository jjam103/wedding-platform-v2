/**
 * Unit Tests: Reference Checking
 * 
 * Tests reference detection and dependent record counting.
 */

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

describe('Reference Checking', () => {
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

  describe('checkContentPageReferences', () => {
    it('should return no references for page without sections', async () => {
      // Create content page
      const pageResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });

      expect(pageResult.success).toBe(true);
      if (!pageResult.success) return;

      const pageId = pageResult.data.id;

      // Check references
      const result = await checkContentPageReferences(pageId);

      expect(result.hasReferences).toBe(false);
      expect(result.dependentRecords.length).toBe(0);
      expect(result.totalCount).toBe(0);

      // Cleanup
      await supabase.from('content_pages').delete().eq('id', pageId);
    });

    it('should detect sections as dependent records', async () => {
      // Create content page
      const pageResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });

      expect(pageResult.success).toBe(true);
      if (!pageResult.success) return;

      const pageId = pageResult.data.id;

      // Create sections
      await createSection({
        page_type: 'custom',
        page_id: pageId,
        title: 'Section 1',
        display_order: 0,
      });

      await createSection({
        page_type: 'custom',
        page_id: pageId,
        title: 'Section 2',
        display_order: 1,
      });

      // Check references
      const result = await checkContentPageReferences(pageId);

      expect(result.hasReferences).toBe(true);
      expect(result.dependentRecords.length).toBeGreaterThan(0);
      
      const sectionsRecord = result.dependentRecords.find((r) => r.type === 'section');
      expect(sectionsRecord).toBeDefined();
      expect(sectionsRecord?.count).toBe(2);

      // Cleanup
      await supabase.from('sections').delete().eq('page_id', pageId);
      await supabase.from('content_pages').delete().eq('id', pageId);
    });
  });

  describe('checkEventReferences', () => {
    it('should return no references for event without activities', async () => {
      // Create event
      const eventResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });

      expect(eventResult.success).toBe(true);
      if (!eventResult.success) return;

      const eventId = eventResult.data.id;

      // Check references
      const result = await checkEventReferences(eventId);

      expect(result.hasReferences).toBe(false);
      expect(result.dependentRecords.length).toBe(0);
      expect(result.totalCount).toBe(0);

      // Cleanup
      await supabase.from('events').delete().eq('id', eventId);
    });

    it('should detect activities as dependent records', async () => {
      // Create event
      const eventResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });

      expect(eventResult.success).toBe(true);
      if (!eventResult.success) return;

      const eventId = eventResult.data.id;

      // Create activities
      await createActivity({
        name: 'Activity 1',
        event_id: eventId,
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      await createActivity({
        name: 'Activity 2',
        event_id: eventId,
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      // Check references
      const result = await checkEventReferences(eventId);

      expect(result.hasReferences).toBe(true);
      expect(result.dependentRecords.length).toBeGreaterThan(0);
      
      const activitiesRecord = result.dependentRecords.find((r) => r.type === 'activity');
      expect(activitiesRecord).toBeDefined();
      expect(activitiesRecord?.count).toBe(2);

      // Cleanup
      await supabase.from('activities').delete().eq('event_id', eventId);
      await supabase.from('events').delete().eq('id', eventId);
    });
  });

  describe('checkActivityReferences', () => {
    it('should return no references for activity without RSVPs', async () => {
      // Create activity
      const activityResult = await createActivity({
        name: 'Test Activity',
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      expect(activityResult.success).toBe(true);
      if (!activityResult.success) return;

      const activityId = activityResult.data.id;

      // Check references
      const result = await checkActivityReferences(activityId);

      expect(result.hasReferences).toBe(false);
      expect(result.dependentRecords.length).toBe(0);
      expect(result.totalCount).toBe(0);

      // Cleanup
      await supabase.from('activities').delete().eq('id', activityId);
    });
  });
});
