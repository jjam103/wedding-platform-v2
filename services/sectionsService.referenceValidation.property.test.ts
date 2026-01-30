import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
const mockFrom = jest.fn() as jest.MockedFunction<any>;
const mockSupabase = {
  from: mockFrom,
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import { validateReferences } from './sectionsService';
import type { Reference } from '../schemas/cmsSchemas';

// Helper to create properly typed mock chain
function createMockQueryChain(resolvedValue: { data: any; error: any }) {
  const mockSingle = (jest.fn() as any).mockResolvedValue(resolvedValue);
  const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
  const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
  return { select: mockSelect } as any;
}

/**
 * Property 5: Reference Entity Validation
 * 
 * For any reference selection, the system SHALL verify that the referenced entity 
 * exists in the database before allowing the reference to be saved.
 * 
 * Validates: Requirements 2.9
 */
describe('Feature: admin-backend-integration-cms, Property 5: Reference Entity Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify that all referenced entities exist in the database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            exists: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (testReferences) => {
          // Mock database lookups for each reference
          for (const ref of testReferences) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: ref.exists ? { id: ref.id } : null,
              error: ref.exists ? null : { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = testReferences.map(r => ({
            type: r.type,
            id: r.id,
            label: r.label || undefined,
          }));

          const result = await validateReferences(references);

          // Property: Validation operation should always succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: All non-existent references should be detected as broken
          const expectedBrokenCount = testReferences.filter(r => !r.exists).length;
          expect(result.data.brokenReferences.length).toBe(expectedBrokenCount);

          // Property: Each broken reference should correspond to a non-existent entity
          for (const broken of result.data.brokenReferences) {
            const original = testReferences.find(r => r.id === broken.id && r.type === broken.type);
            expect(original).toBeDefined();
            expect(original?.exists).toBe(false);
          }

          // Property: Validation is valid only when all entities exist
          const allExist = testReferences.every(r => r.exists);
          expect(result.data.valid).toBe(allExist);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid=true when all referenced entities exist in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (testReferences) => {
          // Mock all references as existing in database
          for (const ref of testReferences) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: { id: ref.id },
              error: null,
            }));
          }

          const references: Reference[] = testReferences.map(r => ({
            type: r.type,
            id: r.id,
            label: r.label || undefined,
          }));

          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: All references exist, so validation should be valid
          expect(result.data.valid).toBe(true);
          expect(result.data.brokenReferences).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid=false and identify broken references when entities do not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validRefs: fc.array(
            fc.record({
              type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
              id: fc.uuid(),
              label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          brokenRefs: fc.array(
            fc.record({
              type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
              id: fc.uuid(),
              label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (testData) => {
          // Mock valid references as existing
          for (const ref of testData.validRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: { id: ref.id },
              error: null,
            }));
          }

          // Mock broken references as not existing
          for (const ref of testData.brokenRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = [
            ...testData.validRefs.map(r => ({ type: r.type, id: r.id, label: r.label || undefined })),
            ...testData.brokenRefs.map(r => ({ type: r.type, id: r.id, label: r.label || undefined })),
          ];

          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should be invalid when any reference is broken
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences.length).toBe(testData.brokenRefs.length);

          // Property: All broken references should be identified
          for (const brokenRef of testData.brokenRefs) {
            const found = result.data.brokenReferences.find(
              r => r.id === brokenRef.id && r.type === brokenRef.type
            );
            expect(found).toBeDefined();
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty reference arrays', async () => {
    const result = await validateReferences([]);

    // Property: Empty array should be valid
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valid).toBe(true);
      expect(result.data.brokenReferences).toHaveLength(0);
    }
  });

  it('should verify each entity type against its correct database table', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
        fc.uuid(),
        fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        async (type, id, label) => {
          const expectedTable = 
            type === 'event' ? 'events' :
            type === 'activity' ? 'activities' :
            type === 'accommodation' ? 'accommodations' :
            'locations';

          mockFrom.mockReturnValueOnce(createMockQueryChain({
            data: { id },
            error: null,
          }));

          const references: Reference[] = [{ type, id, label: label || undefined }];
          const result = await validateReferences(references);

          // Property: Should query the correct table for each entity type
          expect(mockFrom).toHaveBeenCalledWith(expectedTable);
          expect(result.success).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
