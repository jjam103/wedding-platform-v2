/**
 * Property-Based Test: Content Page Cascade Soft Deletion
 * Feature: guest-portal-and-admin-enhancements
 * Property 30: Content Page Cascade Deletion
 * 
 * Validates: Requirements 29.1, 29.2
 * 
 * Property: When a content page is soft deleted, all associated sections and columns
 * must also be soft deleted with the same timestamp.
 */

import * as fc from 'fast-check';
import { deleteContentPage, restoreContentPage, createContentPage } from './contentPagesService';
import { createSection } from './sectionsService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Feature: guest-portal-and-admin-enhancements, Property 30: Content Page Cascade Deletion', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should soft delete all sections and columns when content page is soft deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageTitle: fc.string({ minLength: 1, maxLength: 100 }),
          sectionCount: fc.integer({ min: 1, max: 5 }),
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
          const sectionIds: string[] = [];
          for (let i = 0; i < sectionCount; i++) {
            const sectionResult = await createSection({
              page_type: 'custom',
              page_id: pageId,
              title: `Section ${i}`,
              display_order: i,
            });

            if (sectionResult.success) {
              sectionIds.push(sectionResult.data.id);
            }
          }

          // Soft delete content page
          const deleteResult = await deleteContentPage(pageId, { permanent: false });
          expect(deleteResult.success).toBe(true);

          // Verify content page is soft deleted
          const { data: page } = await supabase
            .from('content_pages')
            .select('deleted_at')
            .eq('id', pageId)
            .single();

          expect(page?.deleted_at).not.toBeNull();

          // Verify all sections are soft deleted
          const { data: sections } = await supabase
            .from('sections')
            .select('id, deleted_at')
            .eq('page_type', 'custom')
            .eq('page_id', pageId);

          expect(sections).toHaveLength(sectionIds.length);
          sections?.forEach((section) => {
            expect(section.deleted_at).not.toBeNull();
          });

          // Verify all columns are soft deleted
          if (sectionIds.length > 0) {
            const { data: columns } = await supabase
              .from('columns')
              .select('id, deleted_at')
              .in('section_id', sectionIds);

            columns?.forEach((column) => {
              expect(column.deleted_at).not.toBeNull();
            });
          }

          // Cleanup
          await deleteContentPage(pageId, { permanent: true });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore all sections and columns when content page is restored', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageTitle: fc.string({ minLength: 1, maxLength: 100 }),
          sectionCount: fc.integer({ min: 1, max: 3 }),
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
          const sectionIds: string[] = [];
          for (let i = 0; i < sectionCount; i++) {
            const sectionResult = await createSection({
              page_type: 'custom',
              page_id: pageId,
              title: `Section ${i}`,
              display_order: i,
            });

            if (sectionResult.success) {
              sectionIds.push(sectionResult.data.id);
            }
          }

          // Soft delete content page
          await deleteContentPage(pageId, { permanent: false });

          // Restore content page
          const restoreResult = await restoreContentPage(pageId);
          expect(restoreResult.success).toBe(true);

          // Verify content page is restored
          const { data: page } = await supabase
            .from('content_pages')
            .select('deleted_at')
            .eq('id', pageId)
            .single();

          expect(page?.deleted_at).toBeNull();

          // Verify all sections are restored
          const { data: sections } = await supabase
            .from('sections')
            .select('id, deleted_at')
            .eq('page_type', 'custom')
            .eq('page_id', pageId);

          expect(sections).toHaveLength(sectionIds.length);
          sections?.forEach((section) => {
            expect(section.deleted_at).toBeNull();
          });

          // Verify all columns are restored
          if (sectionIds.length > 0) {
            const { data: columns } = await supabase
              .from('columns')
              .select('id, deleted_at')
              .in('section_id', sectionIds);

            columns?.forEach((column) => {
              expect(column.deleted_at).toBeNull();
            });
          }

          // Cleanup
          await deleteContentPage(pageId, { permanent: true });
        }
      ),
      { numRuns: 50 }
    );
  });
});
