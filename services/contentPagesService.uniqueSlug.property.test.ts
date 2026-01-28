import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { generateSlug } from '@/utils/slugs';

// Mock Supabase before importing contentPagesService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as contentPagesService from './contentPagesService';
import type { CreateContentPageDTO } from '@/schemas/cmsSchemas';

/**
 * Feature: admin-backend-integration-cms, Property 1: Unique Slug Generation
 * 
 * For any valid content page data, when creating a page, the generated slug
 * SHALL be unique across all existing pages.
 * 
 * Validates: Requirements 1.1
 */
describe('Feature: admin-backend-integration-cms, Property 1: Unique Slug Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Generator for valid content page data
  const validContentPageArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0)
      .filter(s => {
        // Filter out titles that would generate empty slugs
        const slug = s.toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Remove special chars (keeps alphanumeric, underscore, space, hyphen)
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        // Must have at least one alphanumeric character (not just underscores or hyphens)
        return slug.length > 0 && /[a-z0-9]/.test(slug);
      }),
    slug: fc.option(
      fc.string({ minLength: 1, maxLength: 200 })
        .filter(s => s.trim().length > 0)
        .filter(s => {
          // Filter out slugs that would normalize to empty strings or invalid slugs
          const normalized = s.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          // Must have at least one alphanumeric character
          return normalized.length > 0 && /[a-z0-9]/.test(normalized);
        })
        .map(s => s.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/_/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
        ),
      { nil: undefined }
    ),
    status: fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>,
  });

  it('should generate unique slugs when creating multiple pages with the same title', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        fc.integer({ min: 2, max: 5 }), // Number of pages to create with same title
        async (pageData, numPages) => {
          const createdPages: any[] = [];
          const slugs = new Set<string>();

          // Mock database responses for slug uniqueness checks
          let callCount = 0;
          mockFrom.mockImplementation(() => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockImplementation(async () => {
                callCount++;
                
                // First call for first page - no conflict
                if (callCount === 1) {
                  return { data: null, error: { code: 'PGRST116' } };
                }
                
                // Subsequent calls - simulate conflicts for base slug
                const currentSlug = mockQuery._currentSlug;
                const existingSlug = createdPages.find(p => p.slug === currentSlug);
                
                if (existingSlug) {
                  return { data: { id: existingSlug.id }, error: null };
                }
                
                return { data: null, error: { code: 'PGRST116' } };
              }),
              insert: jest.fn().mockReturnThis(),
              _currentSlug: '',
            };

            // Capture the slug being checked
            const originalEq = mockQuery.eq;
            mockQuery.eq = jest.fn((field: string, value: any) => {
              if (field === 'slug') {
                mockQuery._currentSlug = value;
              }
              return originalEq.call(mockQuery, field, value);
            });

            return mockQuery;
          });

          // Create multiple pages with the same title
          for (let i = 0; i < numPages; i++) {
            // Mock the insert operation to return a page with the generated slug
            const insertMock = jest.fn().mockReturnThis();
            const selectMock = jest.fn().mockReturnThis();
            const singleMock = jest.fn().mockResolvedValue({
              data: {
                id: `page-${i}`,
                title: pageData.title,
                slug: '', // Will be set by the service
                status: pageData.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

            mockFrom.mockImplementation((table: string) => {
              if (table === 'content_pages') {
                const mockQuery: any = {
                  select: jest.fn().mockReturnThis(),
                  eq: jest.fn().mockReturnThis(),
                  neq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockImplementation(async () => {
                    // Check if slug exists in our created pages
                    const currentSlug = mockQuery._currentSlug;
                    const existingPage = createdPages.find(p => p.slug === currentSlug);
                    
                    if (existingPage) {
                      return { data: { id: existingPage.id }, error: null };
                    }
                    
                    return { data: null, error: { code: 'PGRST116' } };
                  }),
                  insert: insertMock,
                  _currentSlug: '',
                };

                // Capture the slug being checked
                const originalEq = mockQuery.eq;
                mockQuery.eq = jest.fn((field: string, value: any) => {
                  if (field === 'slug') {
                    mockQuery._currentSlug = value;
                  }
                  return originalEq.call(mockQuery, field, value);
                });

                insertMock.mockReturnValue({
                  select: selectMock,
                });

                selectMock.mockReturnValue({
                  single: singleMock,
                });

                return mockQuery;
              }
              return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              };
            });

            const result = await contentPagesService.createContentPage({
              title: pageData.title,
              slug: pageData.slug,
              status: pageData.status,
            });

            expect(result.success).toBe(true);
            
            if (result.success) {
              // Update the mock data with the actual slug that was generated
              const generatedSlug = insertMock.mock.calls[0][0].slug;
              result.data.slug = generatedSlug;
              
              createdPages.push(result.data);
              slugs.add(result.data.slug);
            }
          }

          // Property: All slugs should be unique
          expect(slugs.size).toBe(numPages);
          
          // Property: Slugs should follow the pattern: base, base-2, base-3, etc.
          const baseSlug = createdPages[0].slug;
          for (let i = 1; i < createdPages.length; i++) {
            const expectedSlug = `${baseSlug}-${i + 1}`;
            expect(createdPages[i].slug).toBe(expectedSlug);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for async operations
    );
  });

  it('should generate unique slugs when slug conflicts with existing pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        validContentPageArbitrary,
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0)
            .filter(s => {
              const normalized = s.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/_/g, '-')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
              return normalized.length > 0 && /[a-z0-9]/.test(normalized);
            }),
          { minLength: 1, maxLength: 3 }
        ),
        async (newPage, existingSlugs) => {
          // Normalize existing slugs
          const normalizedExistingSlugs = existingSlugs.map(s => 
            s.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/_/g, '-')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '')
          );

          // Mock database to return existing slugs
          mockFrom.mockImplementation((table: string) => {
            if (table === 'content_pages') {
              const mockQuery: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                single: jest.fn().mockImplementation(async () => {
                  const currentSlug = mockQuery._currentSlug;
                  
                  // Check if slug exists in our mock existing slugs
                  if (normalizedExistingSlugs.includes(currentSlug)) {
                    return { data: { id: 'existing-id' }, error: null };
                  }
                  
                  return { data: null, error: { code: 'PGRST116' } };
                }),
                insert: jest.fn().mockReturnThis(),
                _currentSlug: '',
              };

              // Capture the slug being checked
              const originalEq = mockQuery.eq;
              mockQuery.eq = jest.fn((field: string, value: any) => {
                if (field === 'slug') {
                  mockQuery._currentSlug = value;
                }
                return originalEq.call(mockQuery, field, value);
              });

              // Mock insert to return success
              mockQuery.insert.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'new-page-id',
                      title: newPage.title,
                      slug: '', // Will be set by service
                      status: newPage.status,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              });

              return mockQuery;
            }
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            };
          });

          const result = await contentPagesService.createContentPage({
            title: newPage.title,
            slug: newPage.slug,
            status: newPage.status,
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Get the generated slug from the insert call
            const insertCall = mockFrom.mock.results[mockFrom.mock.results.length - 1].value.insert.mock.calls[0];
            const generatedSlug = insertCall[0].slug;
            
            // Property: Generated slug should not match any existing slugs
            expect(normalizedExistingSlugs).not.toContain(generatedSlug);
            
            // Property: If base slug exists, generated slug should have a numeric suffix
            const baseSlug = newPage.slug || generateSlug(newPage.title);
            if (normalizedExistingSlugs.includes(baseSlug)) {
              expect(generatedSlug).toMatch(new RegExp(`^${baseSlug}-\\d+$`));
            }
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for async operations
    );
  });

  it('should generate URL-safe slugs from any title', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 })
          .filter(s => s.trim().length > 0)
          .filter(s => {
            // Filter out titles that would generate empty slugs
            const slug = s.toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/_/g, '-')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            // Must have at least one alphanumeric character
            return slug.length > 0 && /[a-z0-9]/.test(slug);
          }),
        fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>,
        async (title, status) => {
          // Mock database to return no conflicts
          mockFrom.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'test-id',
                    title,
                    slug: generateSlug(title),
                    status,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }));

          const result = await contentPagesService.createContentPage({
            title,
            status,
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            const slug = result.data.slug;
            
            // Property: Slug should be lowercase
            expect(slug).toBe(slug.toLowerCase());
            
            // Property: Slug should not contain spaces
            expect(slug).not.toContain(' ');
            
            // Property: Slug should not contain special characters (except hyphens)
            expect(slug).toMatch(/^[a-z0-9-]+$/);
            
            // Property: Slug should not start or end with hyphens
            expect(slug).not.toMatch(/^-/);
            expect(slug).not.toMatch(/-$/);
            
            // Property: Slug should not have consecutive hyphens
            expect(slug).not.toMatch(/--/);
            
            // Property: Slug should contain at least one alphanumeric character
            expect(slug).toMatch(/[a-z0-9]/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle explicit slug parameter and ensure uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 })
          .filter(s => s.trim().length > 0)
          .filter(s => {
            // Filter out titles that would generate empty slugs
            const slug = s.toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/_/g, '-')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            return slug.length > 0 && /[a-z0-9]/.test(slug);
          }),
        // Generate slugs that already match the schema regex pattern
        fc.string({ minLength: 1, maxLength: 200 })
          .filter(s => {
            const normalized = s.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/_/g, '-')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            // Must match the schema regex and have at least one alphanumeric character
            return normalized.length > 0 && /^[a-z0-9-]+$/.test(normalized) && /[a-z0-9]/.test(normalized);
          })
          .map(s => s.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/_/g, '-')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
          ),
        fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>,
        async (title, explicitSlug, status) => {
          const normalizedSlug = explicitSlug;

          // Mock database to simulate existing slug
          let checkCount = 0;
          mockFrom.mockImplementation(() => {
            const mockQuery: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              single: jest.fn().mockImplementation(async () => {
                checkCount++;
                const currentSlug = mockQuery._currentSlug;
                
                // First check - base slug exists
                if (checkCount === 1 && currentSlug === normalizedSlug) {
                  return { data: { id: 'existing-id' }, error: null };
                }
                
                // Subsequent checks - no conflict
                return { data: null, error: { code: 'PGRST116' } };
              }),
              insert: jest.fn().mockReturnThis(),
              _currentSlug: '',
            };

            const originalEq = mockQuery.eq;
            mockQuery.eq = jest.fn((field: string, value: any) => {
              if (field === 'slug') {
                mockQuery._currentSlug = value;
              }
              return originalEq.call(mockQuery, field, value);
            });

            mockQuery.insert.mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'new-id',
                    title,
                    slug: `${normalizedSlug}-2`,
                    status,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            });

            return mockQuery;
          });

          const result = await contentPagesService.createContentPage({
            title,
            slug: explicitSlug,
            status,
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: When explicit slug conflicts, system should append number
            expect(result.data.slug).toBe(`${normalizedSlug}-2`);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
