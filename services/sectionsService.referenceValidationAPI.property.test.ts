import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Property 15: Reference Validation API
 * 
 * For any POST request to validate references, the API SHALL check that all 
 * referenced entities exist in the database and return broken references.
 * 
 * This test validates the API contract by testing the service layer behavior
 * that the API endpoint exposes. The API route (POST /api/admin/sections/validate-refs)
 * is a thin wrapper around the validateReferences service function.
 * 
 * Validates: Requirements 15.6
 */

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

describe('Feature: admin-backend-integration-cms, Property 15: Reference Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate all references and return broken references for any valid request', async () => {
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

          // Property: API validation operation should always succeed
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

  it('should return valid=true when all referenced entities exist', async () => {
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

          // Property: API should return valid=true when all exist
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

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

          // Property: API should return valid=false when any reference is broken
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

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

    // Property: Empty array should be valid (API contract)
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

          // Property: API should query the correct table for each entity type
          expect(mockFrom).toHaveBeenCalledWith(expectedTable);
          expect(result.success).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve reference metadata in broken references response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (testReferences) => {
          // Mock all as not existing
          for (const ref of testReferences) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = testReferences.map(r => ({
            type: r.type,
            id: r.id,
            label: r.label,
          }));

          const result = await validateReferences(references);

          // Property: API should preserve metadata in broken references
          if (result.success && result.data.brokenReferences.length > 0) {
            for (const broken of result.data.brokenReferences) {
              const original = testReferences.find(r => r.id === broken.id);
              expect(original).toBeDefined();
              if (original) {
                expect(broken.label).toBe(original.label);
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle database errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (testReferences) => {
          // Mock database error
          mockFrom.mockImplementationOnce(() => {
            throw new Error('Database connection failed');
          });

          const references: Reference[] = testReferences.map(r => ({
            type: r.type,
            id: r.id,
          }));

          const result = await validateReferences(references);

          // Property: API should handle errors gracefully
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('UNKNOWN_ERROR');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate references consistently regardless of order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            exists: fc.boolean(),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (testReferences) => {
          // First validation with original order
          for (const ref of testReferences) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: ref.exists ? { id: ref.id } : null,
              error: ref.exists ? null : { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = testReferences.map(r => ({
            type: r.type,
            id: r.id,
          }));

          const result1 = await validateReferences(references);

          // Second validation with reversed order
          const reversedRefs = [...testReferences].reverse();
          for (const ref of reversedRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: ref.exists ? { id: ref.id } : null,
              error: ref.exists ? null : { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const reversedReferences: Reference[] = reversedRefs.map(r => ({
            type: r.type,
            id: r.id,
          }));

          const result2 = await validateReferences(reversedReferences);

          // Property: API should return same validation result regardless of order
          expect(result1.success).toBe(result2.success);
          if (result1.success && result2.success) {
            expect(result1.data.valid).toBe(result2.data.valid);
            expect(result1.data.brokenReferences.length).toBe(result2.data.brokenReferences.length);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
