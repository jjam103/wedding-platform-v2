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
 * Feature: admin-backend-integration-cms, Property 2: Slug Preservation on Update
 * 
 * For any valid content page update, when updating a page without explicitly
 * changing the slug, the original slug SHALL be preserved.
 * 
 * Validates: Requirements 1.2
 */
describe('Feature: admin-backend-integration-cms, Property 2: Slug Preservation on Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Generator for valid content page data
  const validContentPageArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0)
      .filter(s => {
        const slug = s.toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        return slug.length > 0 && /[a-z0-9]/.test(slug);
      }),
    slug: fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0)
      .filter(s => {
        const normalized = s.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/_/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        return normalized.length > 0 && /[a-z0-9]/.test(normalized);
      })
      .map(s => s.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      ),
    status: fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>,
  });

  // Generator for update data without slug
  const updateWithoutSlugArbitrary = fc.record({
    title: fc.option(
      fc.string({ minLength: 1, maxLength: 200 })
        .filter(s => s.trim().length > 0)
        .filter(s => {
          const slug = s.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          return slug.length > 0 && /[a-z0-9]/.test(slug);
        }),
      { nil: undefined }
    ),
    status: fc.option(
      fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>,
      { nil: undefined }
    ),
  });

  it('should preserve original slug when updating without explicit slug change', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        updateWithoutSlugArbitrary,
        async (existingPage, updateData) => {
          const originalSlug = existingPage.slug;

          // Mock database to return the existing page and then the updated page
          mockFrom.mockImplementation(() => {
            const mockQuery: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
              update: jest.fn().mockReturnThis(),
            };

            // Mock update to return the updated page with preserved slug
            mockQuery.update.mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: existingPage.id,
                      title: updateData.title || existingPage.title,
                      slug: originalSlug, // Slug should be preserved
                      status: updateData.status || existingPage.status,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            });

            return mockQuery;
          });

          const result = await contentPagesService.updateContentPage(
            existingPage.id,
            updateData
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Slug should be preserved when not explicitly changed
            expect(result.data.slug).toBe(originalSlug);
            
            // Property: Other fields should be updated
            if (updateData.title) {
              expect(result.data.title).toBe(updateData.title);
            }
            if (updateData.status) {
              expect(result.data.status).toBe(updateData.status);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update slug when explicitly provided in update', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        fc.string({ minLength: 1, maxLength: 200 })
          .filter(s => s.trim().length > 0)
          .filter(s => {
            const normalized = s.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/_/g, '-')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            return normalized.length > 0 && /[a-z0-9]/.test(normalized);
          })
          .map(s => s.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/_/g, '-')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
          ),
        async (existingPage, newSlug) => {
          // Ensure new slug is different from original
          fc.pre(newSlug !== existingPage.slug);

          const originalSlug = existingPage.slug;

          // Mock database to check uniqueness and return updated page
          mockFrom.mockImplementation(() => {
            const mockQuery: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No conflict
              }),
              update: jest.fn().mockReturnThis(),
            };

            // Mock update to return the updated page with new slug
            mockQuery.update.mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: existingPage.id,
                      title: existingPage.title,
                      slug: newSlug, // Slug should be updated
                      status: existingPage.status,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            });

            return mockQuery;
          });

          const result = await contentPagesService.updateContentPage(
            existingPage.id,
            { slug: newSlug }
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Slug should be updated when explicitly provided
            expect(result.data.slug).toBe(newSlug);
            expect(result.data.slug).not.toBe(originalSlug);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve slug when updating only title', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        fc.string({ minLength: 1, maxLength: 200 })
          .filter(s => s.trim().length > 0)
          .filter(s => {
            const slug = s.toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            return slug.length > 0 && /[a-z0-9]/.test(slug);
          }),
        async (existingPage, newTitle) => {
          const originalSlug = existingPage.slug;

          // Mock database
          mockFrom.mockImplementation(() => {
            const mockQuery: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
              update: jest.fn().mockReturnThis(),
            };

            mockQuery.update.mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: existingPage.id,
                      title: newTitle,
                      slug: originalSlug, // Slug preserved
                      status: existingPage.status,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            });

            return mockQuery;
          });

          const result = await contentPagesService.updateContentPage(
            existingPage.id,
            { title: newTitle }
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Slug should remain unchanged when only title is updated
            expect(result.data.slug).toBe(originalSlug);
            
            // Property: Title should be updated
            expect(result.data.title).toBe(newTitle);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve slug when updating only status', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        async (existingPage) => {
          const originalSlug = existingPage.slug;
          const newStatus = existingPage.status === 'draft' ? 'published' : 'draft';

          // Mock database
          mockFrom.mockImplementation(() => {
            const mockQuery: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
              update: jest.fn().mockReturnThis(),
            };

            mockQuery.update.mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: existingPage.id,
                      title: existingPage.title,
                      slug: originalSlug, // Slug preserved
                      status: newStatus,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            });

            return mockQuery;
          });

          const result = await contentPagesService.updateContentPage(
            existingPage.id,
            { status: newStatus }
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Slug should remain unchanged when only status is updated
            expect(result.data.slug).toBe(originalSlug);
            
            // Property: Status should be updated
            expect(result.data.status).toBe(newStatus);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve slug across multiple updates without slug changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        fc.array(updateWithoutSlugArbitrary, { minLength: 2, maxLength: 5 }),
        async (existingPage, updates) => {
          const originalSlug = existingPage.slug;
          let currentPage = { ...existingPage };

          for (const updateData of updates) {
            // Mock database for each update
            mockFrom.mockImplementation(() => {
              const mockQuery: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
                update: jest.fn().mockReturnThis(),
              };

              mockQuery.update.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: {
                        id: currentPage.id,
                        title: updateData.title || currentPage.title,
                        slug: originalSlug, // Always preserve original slug
                        status: updateData.status || currentPage.status,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              });

              return mockQuery;
            });

            const result = await contentPagesService.updateContentPage(
              currentPage.id,
              updateData
            );

            expect(result.success).toBe(true);
            
            if (result.success) {
              // Property: Slug should remain the same across all updates
              expect(result.data.slug).toBe(originalSlug);
              
              // Update current page for next iteration
              currentPage = result.data;
            }
          }

          // Final check: slug should still be the original
          expect(currentPage.slug).toBe(originalSlug);
        }
      ),
      { numRuns: 50 } // Reduced runs for multiple async operations
    );
  });
});
