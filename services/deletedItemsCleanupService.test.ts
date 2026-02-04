/**
 * Unit Tests: Deleted Items Cleanup Service
 * 
 * Tests cleanup logic and date filtering.
 */

import { cleanupOldDeletedItems } from './deletedItemsCleanupService';
import { createContentPage, deleteContentPage } from './contentPagesService';
import { create as createEvent, deleteEvent } from './eventService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Deleted Items Cleanup Service', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should not delete items less than 30 days old', async () => {
    // Create and soft delete an item
    const createResult = await createContentPage({
      title: 'Recent Page',
      status: 'draft',
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const pageId = createResult.data.id;
    await deleteContentPage(pageId, { permanent: false });

    // Run cleanup
    const cleanupResult = await cleanupOldDeletedItems();
    expect(cleanupResult.success).toBe(true);

    // Verify item still exists (soft deleted)
    const { data: page } = await supabase
      .from('content_pages')
      .select('id, deleted_at')
      .eq('id', pageId)
      .single();

    expect(page).not.toBeNull();
    expect(page?.deleted_at).not.toBeNull();

    // Cleanup
    await deleteContentPage(pageId, { permanent: true });
  });

  it('should delete items older than 30 days', async () => {
    // Create and soft delete an item
    const createResult = await createContentPage({
      title: 'Old Page',
      status: 'draft',
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const pageId = createResult.data.id;
    await deleteContentPage(pageId, { permanent: false });

    // Manually set deleted_at to 31 days ago
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    await supabase
      .from('content_pages')
      .update({ deleted_at: thirtyOneDaysAgo.toISOString() })
      .eq('id', pageId);

    // Run cleanup
    const cleanupResult = await cleanupOldDeletedItems();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.data.contentPages).toBeGreaterThanOrEqual(1);

    // Verify item is permanently deleted
    const { data: page } = await supabase
      .from('content_pages')
      .select('id')
      .eq('id', pageId)
      .single();

    expect(page).toBeNull();
  });

  it('should return cleanup statistics', async () => {
    // Create and soft delete multiple items
    const page1Result = await createContentPage({
      title: 'Old Page 1',
      status: 'draft',
    });
    const page2Result = await createContentPage({
      title: 'Old Page 2',
      status: 'draft',
    });

    expect(page1Result.success).toBe(true);
    expect(page2Result.success).toBe(true);
    if (!page1Result.success || !page2Result.success) return;

    await deleteContentPage(page1Result.data.id, { permanent: false });
    await deleteContentPage(page2Result.data.id, { permanent: false });

    // Set deleted_at to 31 days ago
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    await supabase
      .from('content_pages')
      .update({ deleted_at: thirtyOneDaysAgo.toISOString() })
      .in('id', [page1Result.data.id, page2Result.data.id]);

    // Run cleanup
    const cleanupResult = await cleanupOldDeletedItems();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.data.contentPages).toBeGreaterThanOrEqual(2);
    expect(cleanupResult.data.total).toBeGreaterThanOrEqual(2);
  });

  it('should handle cleanup with no items to delete', async () => {
    // Run cleanup with no old items
    const cleanupResult = await cleanupOldDeletedItems();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.data.total).toBeGreaterThanOrEqual(0);
  });

  it('should clean up multiple entity types', async () => {
    // Create and soft delete items of different types
    const pageResult = await createContentPage({
      title: 'Old Page',
      status: 'draft',
    });
    const eventResult = await createEvent({
      name: 'Old Event',
      date: new Date().toISOString().split('T')[0],
    });

    expect(pageResult.success).toBe(true);
    expect(eventResult.success).toBe(true);
    if (!pageResult.success || !eventResult.success) return;

    await deleteContentPage(pageResult.data.id, { permanent: false });
    await deleteEvent(eventResult.data.id, { permanent: false });

    // Set deleted_at to 31 days ago
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    await supabase
      .from('content_pages')
      .update({ deleted_at: thirtyOneDaysAgo.toISOString() })
      .eq('id', pageResult.data.id);

    await supabase
      .from('events')
      .update({ deleted_at: thirtyOneDaysAgo.toISOString() })
      .eq('id', eventResult.data.id);

    // Run cleanup
    const cleanupResult = await cleanupOldDeletedItems();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.data.contentPages).toBeGreaterThanOrEqual(1);
    expect(cleanupResult.data.events).toBeGreaterThanOrEqual(1);
    expect(cleanupResult.data.total).toBeGreaterThanOrEqual(2);
  });
});
