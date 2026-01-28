import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
const mockFrom = jest.fn();
const mockSupabase = {
  from: mockFrom,
  auth: {
    getSession: jest.fn(),
  },
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import { detectCircularReferences } from './sectionsService';
import type { Reference } from '../schemas/cmsSchemas';

/**
 * Feature: admin-backend-integration-cms, Property 16: Circular Reference Detection API
 * 
 * Property: For any reference graph containing a cycle, the circular reference detection API 
 * SHALL return true indicating a cycle was found.
 * 
 * Validates: Requirements 15.7
 * 
 * This test validates that the API correctly detects circular references in various graph structures:
 * - Simple cycles (A → B → A)
 * - Complex cycles (A → B → C → A)
 * - Self-references (A → A)
 * - Multiple reference chains
 */
describe('Feature: admin-backend-integration-cms, Property 16: Circular Reference Detection API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect circular references in any reference graph with cycles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate a circular reference graph
          pageAId: fc.uuid(),
          pageBId: fc.uuid(),
          pageCId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
          // Generate cycle type: 2-node (A→B→A) or 3-node (A→B→C→A)
          cycleLength: fc.constantFrom(2, 3),
        }).filter(data => {
          // Ensure all IDs are distinct for valid cycle testing
          return data.pageAId !== data.pageBId && 
                 data.pageBId !== data.pageCId && 
                 data.pageCId !== data.pageAId;
        }),
        async (testData) => {
          // Property: For any reference graph containing a cycle,
          // the API SHALL return success: true, data: true

          if (testData.cycleLength === 2) {
            // Test 2-node cycle: A → B → A
            
            // Mock for checking page B
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-b' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page B references back to A (creating cycle)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      section_id: 'section-b',
                      content_type: 'references',
                      content_data: {
                        references: [{
                          type: testData.pageType,
                          id: testData.pageAId, // References back to A!
                        }],
                      },
                    }],
                    error: null,
                  }),
                }),
              }),
            });

            const references: Reference[] = [{
              type: testData.pageType as any,
              id: testData.pageBId,
            }];

            const result = await detectCircularReferences(testData.pageAId, references);

            // Property validation: API must succeed
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Property validation: Must detect the cycle
              expect(result.data).toBe(true);
            }
          } else {
            // Test 3-node cycle: A → B → C → A
            
            // Mock for checking page B
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-b' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page B references C
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      section_id: 'section-b',
                      content_type: 'references',
                      content_data: {
                        references: [{
                          type: testData.pageType,
                          id: testData.pageCId,
                        }],
                      },
                    }],
                    error: null,
                  }),
                }),
              }),
            });

            // Mock for checking page C
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-c' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page C references back to A (creating cycle)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      section_id: 'section-c',
                      content_type: 'references',
                      content_data: {
                        references: [{
                          type: testData.pageType,
                          id: testData.pageAId, // References back to A!
                        }],
                      },
                    }],
                    error: null,
                  }),
                }),
              }),
            });

            const references: Reference[] = [{
              type: testData.pageType as any,
              id: testData.pageBId,
            }];

            const result = await detectCircularReferences(testData.pageAId, references);

            // Property validation: API must succeed
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Property validation: Must detect the cycle
              expect(result.data).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect self-references as circular', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }),
        async (testData) => {
          // Property: Self-reference (A → A) is a special case of circular reference
          // The API should detect this immediately
          
          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageId, // Self-reference
          }];

          const result = await detectCircularReferences(testData.pageId, references);

          // Property validation: API must succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property validation: Must detect self-reference as circular
            expect(result.data).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not detect cycles in acyclic graphs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageAId: fc.uuid(),
          pageBId: fc.uuid(),
          pageCId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }).filter(data => {
          // Ensure all IDs are distinct
          return data.pageAId !== data.pageBId && 
                 data.pageBId !== data.pageCId && 
                 data.pageCId !== data.pageAId;
        }),
        async (testData) => {
          // Property: For acyclic graphs (A → B → C), the API should return false
          
          // Mock for checking page B
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'section-b' }],
                  error: null,
                }),
              }),
            }),
          });

          // Page B references C (no cycle)
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{
                    section_id: 'section-b',
                    content_type: 'references',
                    content_data: {
                      references: [{
                        type: testData.pageType,
                        id: testData.pageCId,
                      }],
                    },
                  }],
                  error: null,
                }),
              }),
            }),
          });

          // Mock for checking page C
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'section-c' }],
                  error: null,
                }),
              }),
            }),
          });

          // Page C has no references (terminates the chain)
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [], // No references
                  error: null,
                }),
              }),
            }),
          });

          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageBId,
          }];

          const result = await detectCircularReferences(testData.pageAId, references);

          // Property validation: API must succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property validation: Must NOT detect a cycle in acyclic graph
            expect(result.data).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple references correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageAId: fc.uuid(),
          pageBId: fc.uuid(),
          pageCId: fc.uuid(),
          pageDId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
          // One reference creates a cycle, one doesn't
          cyclicRefIndex: fc.constantFrom(0, 1),
        }).filter(data => {
          // Ensure all IDs are distinct
          const ids = [data.pageAId, data.pageBId, data.pageCId, data.pageDId];
          return new Set(ids).size === ids.length;
        }),
        async (testData) => {
          // Property: When checking multiple references, if ANY creates a cycle,
          // the API should detect it
          
          // Setup: B creates a cycle (B → A), D does not (D has no refs)
          
          if (testData.cyclicRefIndex === 0) {
            // First reference (B) creates cycle
            
            // Mock for checking page B (cyclic)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-b' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page B references back to A (cycle!)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      section_id: 'section-b',
                      content_type: 'references',
                      content_data: {
                        references: [{
                          type: testData.pageType,
                          id: testData.pageAId,
                        }],
                      },
                    }],
                    error: null,
                  }),
                }),
              }),
            });

            const references: Reference[] = [
              {
                type: testData.pageType as any,
                id: testData.pageBId, // Cyclic
              },
              {
                type: testData.pageType as any,
                id: testData.pageDId, // Non-cyclic (won't be checked due to early detection)
              },
            ];

            const result = await detectCircularReferences(testData.pageAId, references);

            // Property validation: API must succeed
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Property validation: Must detect the cycle
              expect(result.data).toBe(true);
            }
          } else {
            // Second reference (D) would create cycle, but we check first ref (C) first
            
            // Mock for checking page C (non-cyclic)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-c' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page C has no references
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            });

            // Mock for checking page D (cyclic)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'section-d' }],
                    error: null,
                  }),
                }),
              }),
            });

            // Page D references back to A (cycle!)
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      section_id: 'section-d',
                      content_type: 'references',
                      content_data: {
                        references: [{
                          type: testData.pageType,
                          id: testData.pageAId,
                        }],
                      },
                    }],
                    error: null,
                  }),
                }),
              }),
            });

            const references: Reference[] = [
              {
                type: testData.pageType as any,
                id: testData.pageCId, // Non-cyclic
              },
              {
                type: testData.pageType as any,
                id: testData.pageDId, // Cyclic
              },
            ];

            const result = await detectCircularReferences(testData.pageAId, references);

            // Property validation: API must succeed
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Property validation: Must detect the cycle
              expect(result.data).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs due to complex setup
    );
  });

  it('should handle empty reference arrays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageId: fc.uuid(),
        }),
        async (testData) => {
          // Property: Empty reference array should not detect cycles
          
          const references: Reference[] = [];

          const result = await detectCircularReferences(testData.pageId, references);

          // Property validation: API must succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property validation: No cycles in empty array
            expect(result.data).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
