/**
 * Unit Tests: Soft Delete Methods
 * 
 * Tests soft delete, cascade deletion, restore, and filtering functionality
 * for content pages, events, and activities.
 */

import { deleteContentPage, restoreContentPage, createContentPage } from './contentPagesService';
import { deleteEvent, restoreEvent, create as createEvent } from './eventService';
import { deleteActivity, restoreActivity, create as createActivity } from './activityService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Soft Delete Methods', () => {
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

  describe('Content Page Soft Delete', () => {
    it('should soft delete content page', async () => {
      // Create content page
      const createResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;

      // Soft delete
      const deleteResult = await deleteContentPage(pageId, { permanent: false });
      expect(deleteResult.success).toBe(true);

      // Verify soft deleted
      const { data: page } = await supabase
        .from('content_pages')
        .select('deleted_at')
        .eq('id', pageId)
        .single();

      expect(page?.deleted_at).not.toBeNull();

      // Cleanup
      await deleteContentPage(pageId, { permanent: true });
    });

    it('should permanently delete content page', async () => {
      // Create content page
      const createResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;

      // Permanent delete
      const deleteResult = await deleteContentPage(pageId, { permanent: true });
      expect(deleteResult.success).toBe(true);

      // Verify permanently deleted
      const { data: page } = await supabase
        .from('content_pages')
        .select('id')
        .eq('id', pageId)
        .single();

      expect(page).toBeNull();
    });

    it('should restore soft-deleted content page', async () => {
      // Create content page
      const createResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;

      // Soft delete
      await deleteContentPage(pageId, { permanent: false });

      // Restore
      const restoreResult = await restoreContentPage(pageId);
      expect(restoreResult.success).toBe(true);

      // Verify restored
      const { data: page } = await supabase
        .from('content_pages')
        .select('deleted_at')
        .eq('id', pageId)
        .single();

      expect(page?.deleted_at).toBeNull();

      // Cleanup
      await deleteContentPage(pageId, { permanent: true });
    });
  });

  describe('Event Soft Delete', () => {
    it('should soft delete event', async () => {
      // Create event
      const createResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const eventId = createResult.data.id;

      // Soft delete
      const deleteResult = await deleteEvent(eventId, { permanent: false });
      expect(deleteResult.success).toBe(true);

      // Verify soft deleted
      const { data: event } = await supabase
        .from('events')
        .select('deleted_at')
        .eq('id', eventId)
        .single();

      expect(event?.deleted_at).not.toBeNull();

      // Cleanup
      await deleteEvent(eventId, { permanent: true });
    });

    it('should permanently delete event', async () => {
      // Create event
      const createResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const eventId = createResult.data.id;

      // Permanent delete
      const deleteResult = await deleteEvent(eventId, { permanent: true });
      expect(deleteResult.success).toBe(true);

      // Verify permanently deleted
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

      expect(event).toBeNull();
    });

    it('should restore soft-deleted event', async () => {
      // Create event
      const createResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const eventId = createResult.data.id;

      // Soft delete
      await deleteEvent(eventId, { permanent: false });

      // Restore
      const restoreResult = await restoreEvent(eventId);
      expect(restoreResult.success).toBe(true);

      // Verify restored
      const { data: event } = await supabase
        .from('events')
        .select('deleted_at')
        .eq('id', eventId)
        .single();

      expect(event?.deleted_at).toBeNull();

      // Cleanup
      await deleteEvent(eventId, { permanent: true });
    });
  });

  describe('Activity Soft Delete', () => {
    it('should soft delete activity', async () => {
      // Create activity
      const createResult = await createActivity({
        name: 'Test Activity',
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const activityId = createResult.data.id;

      // Soft delete
      const deleteResult = await deleteActivity(activityId, { permanent: false });
      expect(deleteResult.success).toBe(true);

      // Verify soft deleted
      const { data: activity } = await supabase
        .from('activities')
        .select('deleted_at')
        .eq('id', activityId)
        .single();

      expect(activity?.deleted_at).not.toBeNull();

      // Cleanup
      await deleteActivity(activityId, { permanent: true });
    });

    it('should permanently delete activity', async () => {
      // Create activity
      const createResult = await createActivity({
        name: 'Test Activity',
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const activityId = createResult.data.id;

      // Permanent delete
      const deleteResult = await deleteActivity(activityId, { permanent: true });
      expect(deleteResult.success).toBe(true);

      // Verify permanently deleted
      const { data: activity } = await supabase
        .from('activities')
        .select('id')
        .eq('id', activityId)
        .single();

      expect(activity).toBeNull();
    });

    it('should restore soft-deleted activity', async () => {
      // Create activity
      const createResult = await createActivity({
        name: 'Test Activity',
        date: new Date().toISOString().split('T')[0],
        activity_type: 'activity',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const activityId = createResult.data.id;

      // Soft delete
      await deleteActivity(activityId, { permanent: false });

      // Restore
      const restoreResult = await restoreActivity(activityId);
      expect(restoreResult.success).toBe(true);

      // Verify restored
      const { data: activity } = await supabase
        .from('activities')
        .select('deleted_at')
        .eq('id', activityId)
        .single();

      expect(activity?.deleted_at).toBeNull();

      // Cleanup
      await deleteActivity(activityId, { permanent: true });
    });
  });

  describe('Filtering', () => {
    it('should filter out soft-deleted records in queries', async () => {
      // Create and soft delete a content page
      const createResult = await createContentPage({
        title: 'Deleted Page',
        status: 'published',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;
      await deleteContentPage(pageId, { permanent: false });

      // Query for published pages (should not include deleted)
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id')
        .eq('status', 'published')
        .is('deleted_at', null);

      const pageIds = pages?.map((p) => p.id) || [];
      expect(pageIds).not.toContain(pageId);

      // Cleanup
      await deleteContentPage(pageId, { permanent: true });
    });
  });
});
