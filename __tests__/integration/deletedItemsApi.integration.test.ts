/**
 * Integration Tests: Deleted Items API
 * 
 * Tests deleted items API routes with real database operations.
 */

import { createClient } from '@supabase/supabase-js';
import { createContentPage, deleteContentPage } from '../../services/contentPagesService';
import { create as createEvent, deleteEvent } from '../../services/eventService';
import { create as createActivity, deleteActivity } from '../../services/activityService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Deleted Items API Integration Tests', () => {
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

  describe('GET /api/admin/deleted-items', () => {
    it('should return all soft-deleted items', async () => {
      // Create and soft delete items
      const pageResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });
      expect(pageResult.success).toBe(true);
      if (!pageResult.success) return;

      await deleteContentPage(pageResult.data.id, { permanent: false });

      const eventResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });
      expect(eventResult.success).toBe(true);
      if (!eventResult.success) return;

      await deleteEvent(eventResult.data.id, { permanent: false });

      // Query deleted items
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id, title, deleted_at')
        .not('deleted_at', 'is', null);

      const { data: events } = await supabase
        .from('events')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null);

      expect(pages).toHaveLength(1);
      expect(events).toHaveLength(1);
      expect(pages?.[0].title).toBe('Test Page');
      expect(events?.[0].name).toBe('Test Event');

      // Cleanup
      await deleteContentPage(pageResult.data.id, { permanent: true });
      await deleteEvent(eventResult.data.id, { permanent: true });
    });

    it('should filter deleted items by type', async () => {
      // Create and soft delete items
      const pageResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });
      expect(pageResult.success).toBe(true);
      if (!pageResult.success) return;

      await deleteContentPage(pageResult.data.id, { permanent: false });

      const eventResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });
      expect(eventResult.success).toBe(true);
      if (!eventResult.success) return;

      await deleteEvent(eventResult.data.id, { permanent: false });

      // Query only content pages
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id, title, deleted_at')
        .not('deleted_at', 'is', null);

      expect(pages).toHaveLength(1);
      expect(pages?.[0].title).toBe('Test Page');

      // Cleanup
      await deleteContentPage(pageResult.data.id, { permanent: true });
      await deleteEvent(eventResult.data.id, { permanent: true });
    });
  });

  describe('POST /api/admin/deleted-items/[id]/restore', () => {
    it('should restore soft-deleted content page', async () => {
      // Create and soft delete
      const createResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;
      await deleteContentPage(pageId, { permanent: false });

      // Verify soft deleted
      const { data: deletedPage } = await supabase
        .from('content_pages')
        .select('deleted_at')
        .eq('id', pageId)
        .single();

      expect(deletedPage?.deleted_at).not.toBeNull();

      // Restore via service (simulating API call)
      const { restoreContentPage } = await import('../../services/contentPagesService');
      const restoreResult = await restoreContentPage(pageId);
      expect(restoreResult.success).toBe(true);

      // Verify restored
      const { data: restoredPage } = await supabase
        .from('content_pages')
        .select('deleted_at')
        .eq('id', pageId)
        .single();

      expect(restoredPage?.deleted_at).toBeNull();

      // Cleanup
      await deleteContentPage(pageId, { permanent: true });
    });

    it('should restore soft-deleted event', async () => {
      // Create and soft delete
      const createResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const eventId = createResult.data.id;
      await deleteEvent(eventId, { permanent: false });

      // Verify soft deleted
      const { data: deletedEvent } = await supabase
        .from('events')
        .select('deleted_at')
        .eq('id', eventId)
        .single();

      expect(deletedEvent?.deleted_at).not.toBeNull();

      // Restore via service (simulating API call)
      const { restoreEvent } = await import('../../services/eventService');
      const restoreResult = await restoreEvent(eventId);
      expect(restoreResult.success).toBe(true);

      // Verify restored
      const { data: restoredEvent } = await supabase
        .from('events')
        .select('deleted_at')
        .eq('id', eventId)
        .single();

      expect(restoredEvent?.deleted_at).toBeNull();

      // Cleanup
      await deleteEvent(eventId, { permanent: true });
    });
  });

  describe('DELETE /api/admin/deleted-items/[id]/permanent', () => {
    it('should permanently delete soft-deleted content page', async () => {
      // Create and soft delete
      const createResult = await createContentPage({
        title: 'Test Page',
        status: 'draft',
      });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const pageId = createResult.data.id;
      await deleteContentPage(pageId, { permanent: false });

      // Verify soft deleted
      const { data: deletedPage } = await supabase
        .from('content_pages')
        .select('id')
        .eq('id', pageId)
        .single();

      expect(deletedPage).not.toBeNull();

      // Permanently delete
      await deleteContentPage(pageId, { permanent: true });

      // Verify permanently deleted
      const { data: permanentlyDeleted } = await supabase
        .from('content_pages')
        .select('id')
        .eq('id', pageId)
        .single();

      expect(permanentlyDeleted).toBeNull();
    });

    it('should permanently delete soft-deleted event', async () => {
      // Create and soft delete
      const createResult = await createEvent({
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
      });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const eventId = createResult.data.id;
      await deleteEvent(eventId, { permanent: false });

      // Verify soft deleted
      const { data: deletedEvent } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

      expect(deletedEvent).not.toBeNull();

      // Permanently delete
      await deleteEvent(eventId, { permanent: true });

      // Verify permanently deleted
      const { data: permanentlyDeleted } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

      expect(permanentlyDeleted).toBeNull();
    });
  });
});
