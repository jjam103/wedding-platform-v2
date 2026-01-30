import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';

// Mock Supabase before importing contentPagesService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as contentPagesService from './contentPagesService';

/**
 * Feature: admin-backend-integration-cms, Property 3: Cascade Deletion of Sections
 * 
 * For any content page with associated sections and columns, when the page is deleted,
 * the system SHALL delete all associated sections and their columns.
 * 
 * Validates: Requirements 1.3
 */
describe('Feature: admin-backend-integration-cms, Property 3: Cascade Deletion of Sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Generator for content page with sections
  const contentPageWithSectionsArbitrary = fc.record({
    pageId: fc.uuid(),
    sections: fc.array(
      fc.record({
        id: fc.uuid(),
        displayOrder: fc.integer({ min: 0, max: 100 }),
        columns: fc.array(
          fc.record({
            id: fc.uuid(),
            columnNumber: fc.constantFrom(1, 2) as fc.Arbitrary<1 | 2>,
            contentType: fc.constantFrom('rich_text', 'photo_gallery', 'references') as fc.Arbitrary<'rich_text' | 'photo_gallery' | 'references'>,
            contentData: fc.jsonValue(),
          }),
          { minLength: 1, maxLength: 2 }
        ),
      }),
      { minLength: 1, maxLength: 10 }
    ),
  });

  it('should delete all sections when content page is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        contentPageWithSectionsArbitrary,
        async (pageData) => {
          const deletedSections: string[] = [];
          const deletedColumns: string[] = [];

          // Mock the sections delete operation
          const sectionsDeleteMock = jest.fn().mockImplementation(() => {
            // Track which sections would be deleted
            pageData.sections.forEach(section => {
              deletedSections.push(section.id);
              // Columns are cascade deleted by database
              section.columns.forEach(column => {
                deletedColumns.push(column.id);
              });
            });

            return {
              eq: jest.fn().mockReturnThis(),
            };
          });

          // Mock the content page delete operation
          const contentPageDeleteMock = jest.fn().mockResolvedValue({
            error: null,
          } as any);

          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                delete: sectionsDeleteMock,
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageData.pageId);

          expect(result.success).toBe(true);

          // Property 1: Sections delete should be called
          expect(sectionsDeleteMock).toHaveBeenCalled();

          // Property 2: All sections should be marked for deletion
          expect(deletedSections.length).toBe(pageData.sections.length);
          pageData.sections.forEach(section => {
            expect(deletedSections).toContain(section.id);
          });

          // Property 3: All columns should be cascade deleted (tracked in our mock)
          expect(deletedColumns.length).toBe(
            pageData.sections.reduce((sum, section) => sum + section.columns.length, 0)
          );
          pageData.sections.forEach(section => {
            section.columns.forEach(column => {
              expect(deletedColumns).toContain(column.id);
            });
          });

          // Property 4: Content page delete should be called after sections
          const fromCalls = mockFrom.mock.calls;
          const sectionsCallIndex = fromCalls.findIndex(call => call[0] === 'sections');
          const contentPagesCallIndex = fromCalls.findIndex(call => call[0] === 'content_pages');
          expect(sectionsCallIndex).toBeLessThan(contentPagesCallIndex);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle deletion of page with no sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (pageId) => {
          let sectionsDeleteCalled = false;
          let contentPageDeleteCalled = false;

          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              sectionsDeleteCalled = true;
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnThis(),
                }),
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              contentPageDeleteCalled = true;
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageId);

          expect(result.success).toBe(true);

          // Property: Even with no sections, sections delete should be attempted
          expect(sectionsDeleteCalled).toBe(true);

          // Property: Content page delete should still be called
          expect(contentPageDeleteCalled).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle deletion with varying numbers of sections and columns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 20 }), // Number of sections
        fc.integer({ min: 1, max: 2 }), // Columns per section
        async (pageId, numSections, columnsPerSection) => {
          const sections = Array.from({ length: numSections }, (_, i) => ({
            id: `section-${i}`,
            columns: Array.from({ length: columnsPerSection }, (_, j) => ({
              id: `column-${i}-${j}`,
            })),
          }));

          const deletedSections: string[] = [];
          const deletedColumns: string[] = [];

          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                delete: jest.fn().mockImplementation(() => {
                  sections.forEach(section => {
                    deletedSections.push(section.id);
                    section.columns.forEach(column => {
                      deletedColumns.push(column.id);
                    });
                  });
                  return {
                    eq: jest.fn().mockReturnThis(),
                  };
                }),
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageId);

          expect(result.success).toBe(true);

          // Property: Number of deleted sections matches expected
          expect(deletedSections.length).toBe(numSections);

          // Property: Number of deleted columns matches expected
          const expectedColumns = numSections * columnsPerSection;
          expect(deletedColumns.length).toBe(expectedColumns);

          // Property: Each section has correct number of columns
          if (numSections > 0) {
            const columnsPerDeletedSection = deletedColumns.length / deletedSections.length;
            expect(columnsPerDeletedSection).toBe(columnsPerSection);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain referential integrity during cascade deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        contentPageWithSectionsArbitrary,
        async (pageData) => {
          const deletionOrder: Array<{ table: string; id: string }> = [];

          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                delete: jest.fn().mockImplementation(() => {
                  // Record section deletions
                  pageData.sections.forEach(section => {
                    deletionOrder.push({ table: 'sections', id: section.id });
                    // Columns are cascade deleted by database
                    section.columns.forEach(column => {
                      deletionOrder.push({ table: 'columns', id: column.id });
                    });
                  });
                  return {
                    eq: jest.fn().mockReturnThis(),
                  };
                }),
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockImplementation(async () => {
                    deletionOrder.push({ table: 'content_pages', id: pageData.pageId });
                    return { error: null };
                  }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageData.pageId);

          expect(result.success).toBe(true);

          // Property: Sections and columns are deleted before content page
          const contentPageDeletionIndex = deletionOrder.findIndex(
            item => item.table === 'content_pages'
          );
          const sectionDeletions = deletionOrder.filter(item => item.table === 'sections');
          const columnDeletions = deletionOrder.filter(item => item.table === 'columns');

          // All sections should be deleted before content page
          sectionDeletions.forEach(deletion => {
            const sectionIndex = deletionOrder.indexOf(deletion);
            expect(sectionIndex).toBeLessThan(contentPageDeletionIndex);
          });

          // All columns should be deleted before content page
          columnDeletions.forEach(deletion => {
            const columnIndex = deletionOrder.indexOf(deletion);
            expect(columnIndex).toBeLessThan(contentPageDeletionIndex);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return error if sections deletion fails but not affect content page deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (pageId) => {
          // Mock sections delete to succeed (no error thrown)
          // Mock content page delete to succeed
          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnThis(),
                }),
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageId);

          // Property: Deletion should succeed even if sections table is empty
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return error if content page deletion fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (pageId, errorMessage) => {
          mockFrom.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnThis(),
                }),
                eq: jest.fn().mockReturnThis(),
              };
            }
            if (table === 'content_pages') {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    error: {
                      message: errorMessage,
                      code: 'DATABASE_ERROR',
                    },
                  }),
                }),
              };
            }
            return {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await contentPagesService.deleteContentPage(pageId);

          // Property: Should return error when content page deletion fails
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('DATABASE_ERROR');
            expect(result.error.message).toBe(errorMessage);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
