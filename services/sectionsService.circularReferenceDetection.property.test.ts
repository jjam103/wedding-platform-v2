import * as fc from 'fast-check';
import * as sectionsService from './sectionsService';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../lib/supabase');

describe('Feature: destination-wedding-platform, Property 28: Circular Reference Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const referenceTypeArbitrary = fc.constantFrom('event', 'activity', 'content_page', 'accommodation');
  
  const referenceArbitrary = fc.record({
    type: referenceTypeArbitrary,
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
  });

  it('should detect direct self-reference (page references itself)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), referenceTypeArbitrary, async (pageId, pageType) => {
        const selfReference = { type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageId, name: 'Self' };

        const result = await sectionsService.detectCircularReferences(pageId, [selfReference]);

        expect(result.success).toBe(true);
        if (result.success) {
          // Direct self-reference should be detected
          expect(result.data).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not detect circular reference when no references exist', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (pageId) => {
        const result = await sectionsService.detectCircularReferences(pageId, []);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not detect circular reference for simple non-circular references', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(referenceArbitrary, { minLength: 1, maxLength: 5 }),
        async (pageId, references) => {
          // Ensure none of the references point back to the page
          const nonCircularRefs = references.filter(ref => ref.id !== pageId);
          
          if (nonCircularRefs.length === 0) {
            return; // Skip if all references were filtered out
          }

          // Mock: no sections found for referenced pages (no further references)
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          });
          supabase.from = mockFrom;

          const result = await sectionsService.detectCircularReferences(pageId, nonCircularRefs);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect two-level circular reference (A -> B -> A)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        referenceTypeArbitrary,
        async (pageAId, pageBId, pageType) => {
          // Ensure A and B are different
          fc.pre(pageAId !== pageBId);

          // Page A references Page B
          const refToB = { type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageBId, name: 'Page B' };

          // Mock: Page B has sections that reference back to Page A
          let callCount = 0;
          const mockFrom = jest.fn().mockImplementation((table) => {
            if (table === 'sections') {
              callCount++;
              if (callCount === 1) {
                // First call: Page B has sections
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: [{ id: 'section-1' }],
                        error: null,
                      }),
                    }),
                  }),
                };
              }
            } else if (table === 'columns') {
              // Page B's columns reference back to Page A
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [
                        {
                          content_data: {
                            references: [{ type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageAId, name: 'Page A' }],
                          },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          });
          supabase.from = mockFrom;

          const result = await sectionsService.detectCircularReferences(pageAId, [refToB]);

          expect(result.success).toBe(true);
          if (result.success) {
            // Circular reference A -> B -> A should be detected
            expect(result.data).toBe(true);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs for complex async test
    );
  });

  it('should detect three-level circular reference (A -> B -> C -> A)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        referenceTypeArbitrary,
        async (pageAId, pageBId, pageCId, pageType) => {
          // Ensure all pages are different
          fc.pre(pageAId !== pageBId && pageBId !== pageCId && pageAId !== pageCId);

          // Page A references Page B
          const refToB = { type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageBId, name: 'Page B' };

          // Mock complex reference chain: A -> B -> C -> A
          let sectionCallCount = 0;
          const mockFrom = jest.fn().mockImplementation((table) => {
            if (table === 'sections') {
              sectionCallCount++;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [{ id: `section-${sectionCallCount}` }],
                      error: null,
                    }),
                  }),
                }),
              };
            } else if (table === 'columns') {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    eq: jest.fn().mockImplementation(() => {
                      if (sectionCallCount === 1) {
                        // Page B references Page C
                        return Promise.resolve({
                          data: [
                            {
                              content_data: {
                                references: [{ type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageCId, name: 'Page C' }],
                              },
                            },
                          ],
                          error: null,
                        });
                      } else if (sectionCallCount === 2) {
                        // Page C references Page A (circular!)
                        return Promise.resolve({
                          data: [
                            {
                              content_data: {
                                references: [{ type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageAId, name: 'Page A' }],
                              },
                            },
                          ],
                          error: null,
                        });
                      }
                      return Promise.resolve({ data: [], error: null });
                    }),
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          });
          supabase.from = mockFrom;

          const result = await sectionsService.detectCircularReferences(pageAId, [refToB]);

          expect(result.success).toBe(true);
          if (result.success) {
            // Circular reference A -> B -> C -> A should be detected
            expect(result.data).toBe(true);
          }
        }
      ),
      { numRuns: 30 } // Fewer runs for very complex async test
    );
  });

  it('should handle multiple references without circular dependency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(referenceArbitrary, { minLength: 2, maxLength: 5 }),
        async (pageId, references) => {
          // Filter out any self-references
          const nonCircularRefs = references.filter(ref => ref.id !== pageId);
          
          if (nonCircularRefs.length < 2) {
            return; // Skip if not enough references
          }

          // Mock: all referenced pages have no further references
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          });
          supabase.from = mockFrom;

          const result = await sectionsService.detectCircularReferences(pageId, nonCircularRefs);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle database errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), referenceArbitrary, async (pageId, reference) => {
        // Mock database error
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error('Database connection failed')),
            }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.detectCircularReferences(pageId, [reference]);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('UNKNOWN_ERROR');
          expect(result.error.message).toContain('Database connection failed');
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should correctly identify visited nodes to avoid infinite loops', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        referenceTypeArbitrary,
        async (pageAId, pageBId, pageType) => {
          fc.pre(pageAId !== pageBId);

          // Page A references Page B
          const refToB = { type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageBId, name: 'Page B' };

          // Mock: Page B references itself (but not back to A)
          const mockFrom = jest.fn().mockImplementation((table) => {
            if (table === 'sections') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [{ id: 'section-1' }],
                      error: null,
                    }),
                  }),
                }),
              };
            } else if (table === 'columns') {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [
                        {
                          content_data: {
                            references: [{ type: pageType as 'activity' | 'event' | 'accommodation' | 'content_page' | 'location', id: pageBId, name: 'Page B' }],
                          },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          });
          supabase.from = mockFrom;

          const result = await sectionsService.detectCircularReferences(pageAId, [refToB]);

          expect(result.success).toBe(true);
          // Page B referencing itself is circular, but doesn't create a cycle back to A
          // The algorithm should detect the self-reference in B
        }
      ),
      { numRuns: 50 }
    );
  });
});
