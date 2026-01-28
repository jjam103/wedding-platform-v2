import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
const mockFrom = jest.fn();
const mockSupabase = {
  from: mockFrom,
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import { detectCircularReferences } from './sectionsService';
import type { Reference } from '../schemas/cmsSchemas';

// Feature: destination-wedding-platform, Property 34: Circular Reference Detection

describe('Feature: destination-wedding-platform, Property 34: Circular Reference Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect circular reference chains (A → B → C → A)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageAId: fc.uuid(),
          pageBId: fc.uuid(),
          pageCId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }).filter(data => {
          // Ensure all IDs are distinct for a true circular chain test
          return data.pageAId !== data.pageBId && 
                 data.pageBId !== data.pageCId && 
                 data.pageCId !== data.pageAId;
        }),
        async (testData) => {
          // Create a circular chain: A → B → C → A
          // We're testing: detectCircularReferences(pageAId, [ref to B])
          // The algorithm will:
          // 1. Check if B leads back to A
          // 2. Get B's sections and columns
          // 3. Find B references C
          // 4. Check if C leads back to A
          // 5. Get C's sections and columns
          // 6. Find C references A - CIRCULAR!
          
          // Mock for checking page B (first reference we're adding)
          // Get sections for page B
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

          // Get columns for page B (contains reference to C)
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

          // Mock for checking page C (B references C)
          // Get sections for page C
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

          // Get columns for page C (contains reference to A - creating the circle!)
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

          // Test: Adding a reference from A to B should detect the circle
          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageBId,
          }];

          const result = await detectCircularReferences(testData.pageAId, references);

          // Property: Detection should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should detect the circular reference
          expect(result.data).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs due to complex mocking
    );
  });

  it('should not detect circular references when none exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageAId: fc.uuid(),
          pageBId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }).filter(data => data.pageAId !== data.pageBId), // Ensure distinct IDs
        async (testData) => {
          // Create a non-circular chain: A → B (B has no references)
          
          // Mock for checking page B (the reference we're adding)
          // Get sections for page B
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

          // Get columns for page B (no references - empty array)
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

          // Test: Adding a reference from A to B should not detect a circle
          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageBId,
          }];

          const result = await detectCircularReferences(testData.pageAId, references);

          // Property: Detection should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should not detect circular reference
          expect(result.data).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect self-referencing pages (A → A)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }),
        async (testData) => {
          // Test: Adding a self-reference (A → A)
          // The algorithm should detect this immediately since we're checking
          // if adding a reference to pageId from pageId creates a circle
          
          // When we check the reference to itself, we'll traverse to the same page
          // Get sections for the page
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'section-a' }],
                  error: null,
                }),
              }),
            }),
          });

          // Get columns - doesn't matter what's here, the algorithm should detect
          // that we're back at the starting page
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

          // Test: Adding a self-reference should detect the circle
          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageId,
          }];

          const result = await detectCircularReferences(testData.pageId, references);

          // Property: Detection should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should detect the self-reference as circular
          expect(result.data).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect circular references when all IDs are identical (edge case)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageId: fc.uuid(),
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
        }),
        async (testData) => {
          // Edge case: When A, B, and C are all the same page
          // This is essentially a self-reference scenario
          // We're testing that the algorithm handles this correctly
          
          // Get sections for the page
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'section-1' }],
                  error: null,
                }),
              }),
            }),
          });

          // Get columns - empty is fine, the check happens before traversal
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

          // Test: Adding a reference to itself should detect the circle
          const references: Reference[] = [{
            type: testData.pageType as any,
            id: testData.pageId,
          }];

          const result = await detectCircularReferences(testData.pageId, references);

          // Property: Detection should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should detect the circular reference
          expect(result.data).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
