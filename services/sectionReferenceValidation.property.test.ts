import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
// Use the relative path that matches the require in sectionsService
const mockFrom = jest.fn();
const mockSupabase = {
  from: mockFrom,
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import { validateReferences } from './sectionsService';
import type { Reference } from '../schemas/cmsSchemas';

// Feature: destination-wedding-platform, Property 33: Section Reference Validation

describe('Feature: destination-wedding-platform, Property 33: Section Reference Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect broken references for any non-existent entity IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('activity', 'event', 'accommodation', 'location') as fc.Arbitrary<'activity' | 'event' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            exists: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (testReferences) => {
          // Mock database lookups for each reference
          for (const ref of testReferences) {
            const tableName = ref.type === 'activity' ? 'activities' : 
                            ref.type === 'event' ? 'events' :
                            ref.type === 'accommodation' ? 'accommodations' : 'locations';
            
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: ref.exists ? { id: ref.id } : null,
                    error: ref.exists ? null : { code: 'PGRST116', message: 'Not found' },
                  }),
                }),
              }),
            });
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

          // Property: All non-existent references should be in brokenReferences
          const expectedBroken = testReferences.filter(r => !r.exists);
          expect(result.data.brokenReferences.length).toBe(expectedBroken.length);

          // Property: All broken references should match the non-existent ones
          for (const broken of result.data.brokenReferences) {
            const original = testReferences.find(r => r.id === broken.id && r.type === broken.type);
            expect(original).toBeDefined();
            expect(original?.exists).toBe(false);
          }

          // Property: Valid should be true only if all references exist
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
            type: fc.constantFrom('activity', 'event', 'accommodation', 'location') as fc.Arbitrary<'activity' | 'event' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (testReferences) => {
          // Mock all references as existing
          for (const ref of testReferences) {
            const tableName = ref.type === 'activity' ? 'activities' : 
                            ref.type === 'event' ? 'events' :
                            ref.type === 'accommodation' ? 'accommodations' : 'locations';
            
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: ref.id },
                    error: null,
                  }),
                }),
              }),
            });
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

          // Property: Should be valid with no broken references
          expect(result.data.valid).toBe(true);
          expect(result.data.brokenReferences).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid=false when any referenced entity does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validRefs: fc.array(
            fc.record({
              type: fc.constantFrom('activity', 'event', 'accommodation', 'location') as fc.Arbitrary<'activity' | 'event' | 'accommodation' | 'location'>,
              id: fc.uuid(),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          brokenRef: fc.record({
            type: fc.constantFrom('activity', 'event', 'accommodation', 'location') as fc.Arbitrary<'activity' | 'event' | 'accommodation' | 'location'>,
            id: fc.uuid(),
          }),
        }),
        async (testData) => {
          // Mock valid references as existing
          for (const ref of testData.validRefs) {
            const tableName = ref.type === 'activity' ? 'activities' : 
                            ref.type === 'event' ? 'events' :
                            ref.type === 'accommodation' ? 'accommodations' : 'locations';
            
            mockFrom.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: ref.id },
                    error: null,
                  }),
                }),
              }),
            });
          }

          // Mock broken reference as not existing
          const brokenTableName = testData.brokenRef.type === 'activity' ? 'activities' : 
                                 testData.brokenRef.type === 'event' ? 'events' :
                                 testData.brokenRef.type === 'accommodation' ? 'accommodations' : 'locations';
          
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          });

          const references: Reference[] = [
            ...testData.validRefs.map(r => ({ type: r.type, id: r.id })),
            { type: testData.brokenRef.type, id: testData.brokenRef.id },
          ];

          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should be invalid with at least one broken reference
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences.length).toBeGreaterThan(0);

          // Property: Broken reference should be the one we marked as non-existent
          const foundBroken = result.data.brokenReferences.find(
            r => r.id === testData.brokenRef.id && r.type === testData.brokenRef.type
          );
          expect(foundBroken).toBeDefined();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
