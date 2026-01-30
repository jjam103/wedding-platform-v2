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
 * Property 6: Broken Reference Detection
 * 
 * For any reference link that points to a deleted entity, the system SHALL mark it 
 * as broken and display a warning to the admin.
 * 
 * This property verifies that:
 * 1. References to non-existent entities are detected as broken
 * 2. The system correctly identifies which specific references are broken
 * 3. Validation fails when any reference is broken
 * 4. All broken references are included in the response
 * 
 * Validates: Requirements 2.10
 */
describe('Feature: admin-backend-integration-cms, Property 6: Broken Reference Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark references to deleted entities as broken', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
            id: fc.uuid(),
            label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            isDeleted: fc.boolean(), // Simulates whether entity was deleted
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (testReferences) => {
          // Mock database lookups - deleted entities return null
          for (const ref of testReferences) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: ref.isDeleted ? null : { id: ref.id },
              error: ref.isDeleted ? { code: 'PGRST116', message: 'Not found' } : null,
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

          // Property: All deleted entities should be marked as broken
          const deletedRefs = testReferences.filter(r => r.isDeleted);
          expect(result.data.brokenReferences.length).toBe(deletedRefs.length);

          // Property: Each broken reference should correspond to a deleted entity
          for (const broken of result.data.brokenReferences) {
            const original = testReferences.find(r => r.id === broken.id && r.type === broken.type);
            expect(original).toBeDefined();
            expect(original?.isDeleted).toBe(true);
          }

          // Property: Validation is valid only when no entities are deleted
          const hasDeletedEntities = testReferences.some(r => r.isDeleted);
          expect(result.data.valid).toBe(!hasDeletedEntities);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect broken references when entities are deleted after reference creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          existingRefs: fc.array(
            fc.record({
              type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
              id: fc.uuid(),
              label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          deletedRefs: fc.array(
            fc.record({
              type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
              id: fc.uuid(),
              label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (testData) => {
          // Mock existing references as still in database
          for (const ref of testData.existingRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: { id: ref.id },
              error: null,
            }));
          }

          // Mock deleted references as no longer in database
          for (const ref of testData.deletedRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = [
            ...testData.existingRefs.map(r => ({ type: r.type, id: r.id, label: r.label || undefined })),
            ...testData.deletedRefs.map(r => ({ type: r.type, id: r.id, label: r.label || undefined })),
          ];

          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should be invalid when any reference points to deleted entity
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences.length).toBe(testData.deletedRefs.length);

          // Property: All deleted references should be identified as broken
          for (const deletedRef of testData.deletedRefs) {
            const found = result.data.brokenReferences.find(
              r => r.id === deletedRef.id && r.type === deletedRef.type
            );
            expect(found).toBeDefined();
            expect(found?.type).toBe(deletedRef.type);
            expect(found?.id).toBe(deletedRef.id);
          }

          // Property: No existing references should be marked as broken
          for (const existingRef of testData.existingRefs) {
            const found = result.data.brokenReferences.find(
              r => r.id === existingRef.id && r.type === existingRef.type
            );
            expect(found).toBeUndefined();
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should correctly identify broken references across different entity types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
        fc.uuid(),
        fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        fc.boolean(),
        async (type, id, label, isDeleted) => {
          // Mock database lookup
          mockFrom.mockReturnValueOnce(createMockQueryChain({
            data: isDeleted ? null : { id },
            error: isDeleted ? { code: 'PGRST116', message: 'Not found' } : null,
          }));

          const references: Reference[] = [{ type, id, label: label || undefined }];
          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Deleted entity should be marked as broken
          if (isDeleted) {
            expect(result.data.valid).toBe(false);
            expect(result.data.brokenReferences).toHaveLength(1);
            expect(result.data.brokenReferences[0].type).toBe(type);
            expect(result.data.brokenReferences[0].id).toBe(id);
          } else {
            expect(result.data.valid).toBe(true);
            expect(result.data.brokenReferences).toHaveLength(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty broken references when all entities exist', async () => {
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

          // Property: No entities deleted, so no broken references
          expect(result.data.valid).toBe(true);
          expect(result.data.brokenReferences).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty reference arrays without broken references', async () => {
    const result = await validateReferences([]);

    // Property: Empty array should be valid with no broken references
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valid).toBe(true);
      expect(result.data.brokenReferences).toHaveLength(0);
    }
  });

  it('should preserve reference metadata when marking as broken', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constantFrom('event', 'activity', 'accommodation', 'location') as fc.Arbitrary<'event' | 'activity' | 'accommodation' | 'location'>,
          id: fc.uuid(),
          label: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (testRef) => {
          // Mock as deleted entity
          mockFrom.mockReturnValueOnce(createMockQueryChain({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }));

          const references: Reference[] = [{ 
            type: testRef.type, 
            id: testRef.id, 
            label: testRef.label 
          }];

          const result = await validateReferences(references);

          // Property: Validation should succeed
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Broken reference should preserve all original metadata
          expect(result.data.brokenReferences).toHaveLength(1);
          const broken = result.data.brokenReferences[0];
          expect(broken.type).toBe(testRef.type);
          expect(broken.id).toBe(testRef.id);
          expect(broken.label).toBe(testRef.label);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should detect all broken references in a mixed set', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (validCount, brokenCount) => {
          const validRefs = Array.from({ length: validCount }, (_, i) => ({
            type: (['event', 'activity', 'accommodation', 'location'] as const)[i % 4],
            id: `valid-${i}`,
            label: `Valid ${i}`,
          }));

          const brokenRefs = Array.from({ length: brokenCount }, (_, i) => ({
            type: (['event', 'activity', 'accommodation', 'location'] as const)[i % 4],
            id: `broken-${i}`,
            label: `Broken ${i}`,
          }));

          // Mock valid references
          for (const ref of validRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: { id: ref.id },
              error: null,
            }));
          }

          // Mock broken references
          for (const ref of brokenRefs) {
            mockFrom.mockReturnValueOnce(createMockQueryChain({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }));
          }

          const references: Reference[] = [...validRefs, ...brokenRefs];
          const result = await validateReferences(references);

          // Property: Should detect exactly the broken references
          expect(result.success).toBe(true);
          if (!result.success) {
            return true;
          }

          expect(result.data.brokenReferences.length).toBe(brokenCount);
          expect(result.data.valid).toBe(brokenCount === 0);

          // Property: All broken IDs should be in the broken references list
          const brokenIds = new Set(brokenRefs.map(r => r.id));
          for (const broken of result.data.brokenReferences) {
            expect(brokenIds.has(broken.id)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
