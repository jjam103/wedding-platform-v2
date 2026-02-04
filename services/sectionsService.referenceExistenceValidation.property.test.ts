import * as fc from 'fast-check';
import * as sectionsService from './sectionsService';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../lib/supabase');

describe('Feature: destination-wedding-platform, Property 27: Reference Existence Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arbitrary for reference types
  const referenceTypeArbitrary = fc.constantFrom('event', 'activity', 'content_page', 'accommodation', 'location');

  // Arbitrary for valid reference
  const validReferenceArbitrary = fc.record({
    type: referenceTypeArbitrary,
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
  });

  // Arbitrary for array of references
  const referencesArrayArbitrary = fc.array(validReferenceArbitrary, { minLength: 1, maxLength: 10 });

  it('should validate that all existing references return valid=true', async () => {
    await fc.assert(
      fc.asyncProperty(referencesArrayArbitrary, async (references) => {
        // Mock all references as existing
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'exists' }, error: null }),
              }),
              single: jest.fn().mockResolvedValue({ data: { id: 'exists' }, error: null }),
            }),
            single: jest.fn().mockResolvedValue({ data: { id: 'exists' }, error: null }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.validateReferences(references);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.valid).toBe(true);
          expect(result.data.brokenReferences).toHaveLength(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should identify broken references when entities do not exist', async () => {
    await fc.assert(
      fc.asyncProperty(referencesArrayArbitrary, async (references) => {
        // Mock all references as NOT existing
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.validateReferences(references);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences).toHaveLength(references.length);
          
          // All references should be marked as broken
          references.forEach((ref) => {
            expect(result.data.brokenReferences).toContainEqual(
              expect.objectContaining({ id: ref.id, type: ref.type })
            );
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle mixed valid and invalid references correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validReferenceArbitrary, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 1, max: 9 }),
        async (references, invalidIndex) => {
          const actualInvalidIndex = invalidIndex % references.length;

          // Mock: first reference exists, others don't
          let callCount = 0;
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  single: jest.fn().mockImplementation(() => {
                    const exists = callCount !== actualInvalidIndex;
                    callCount++;
                    return Promise.resolve({ 
                      data: exists ? { id: 'exists' } : null, 
                      error: null 
                    });
                  }),
                }),
                single: jest.fn().mockImplementation(() => {
                  const exists = callCount !== actualInvalidIndex;
                  callCount++;
                  return Promise.resolve({ 
                    data: exists ? { id: 'exists' } : null, 
                    error: null 
                  });
                }),
              }),
              single: jest.fn().mockImplementation(() => {
                const exists = callCount !== actualInvalidIndex;
                callCount++;
                return Promise.resolve({ 
                  data: exists ? { id: 'exists' } : null, 
                  error: null 
                });
              }),
            }),
          });
          supabase.from = mockFrom;

          const result = await sectionsService.validateReferences(references);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.valid).toBe(false);
            expect(result.data.brokenReferences).toHaveLength(1);
            expect(result.data.brokenReferences[0]).toEqual(
              expect.objectContaining({
                id: references[actualInvalidIndex].id,
                type: references[actualInvalidIndex].type,
              })
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all reference types correctly', async () => {
    await fc.assert(
      fc.asyncProperty(referenceTypeArbitrary, fc.uuid(), async (type, id) => {
        const reference = { type, id, name: 'Test' };

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id }, error: null }),
              }),
              single: jest.fn().mockResolvedValue({ data: { id }, error: null }),
            }),
            single: jest.fn().mockResolvedValue({ data: { id }, error: null }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.validateReferences([reference]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.valid).toBe(true);
        }

        // Verify correct table was queried based on type
        const expectedTable = type === 'content_page' ? 'content_pages' : 
                             type === 'location' ? 'locations' :
                             type + 's'; // activities, events, accommodations
        expect(mockFrom).toHaveBeenCalledWith(expectedTable);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty reference arrays', async () => {
    const result = await sectionsService.validateReferences([]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valid).toBe(true);
      expect(result.data.brokenReferences).toHaveLength(0);
    }
  });

  it('should filter out soft-deleted entities', async () => {
    await fc.assert(
      fc.asyncProperty(validReferenceArbitrary, async (reference) => {
        // Mock entity exists but is soft-deleted (deleted_at is not null)
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.validateReferences([reference]);

        expect(result.success).toBe(true);
        if (result.success) {
          // Soft-deleted entities should be treated as broken references
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences).toHaveLength(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain reference order in broken references list', async () => {
    await fc.assert(
      fc.asyncProperty(referencesArrayArbitrary, async (references) => {
        // Mock all as broken
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });
        supabase.from = mockFrom;

        const result = await sectionsService.validateReferences(references);

        expect(result.success).toBe(true);
        if (result.success) {
          // Broken references should maintain input order
          expect(result.data.brokenReferences).toHaveLength(references.length);
          references.forEach((ref, index) => {
            expect(result.data.brokenReferences[index]).toEqual(
              expect.objectContaining({ id: ref.id, type: ref.type })
            );
          });
        }
      }),
      { numRuns: 100 }
    );
  });
});
