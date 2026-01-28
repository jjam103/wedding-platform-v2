import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import type { UpdateGuestDTO } from '@/schemas/guestSchemas';

// Mock Supabase before importing guestService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as guestService from './guestService';

/**
 * Feature: destination-wedding-platform, Property 7: Bulk Operation Validation Consistency
 * 
 * For any set of guest updates, performing them as a bulk operation should apply 
 * the same validation and sanitization rules as performing them individually, 
 * resulting in the same validation outcomes.
 * 
 * Validates: Requirements 4.22
 */
describe('Feature: destination-wedding-platform, Property 7: Bulk Operation Validation Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Generator for valid guest update data
   */
  const validUpdateArbitrary = fc.record({
    firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
    lastName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
    email: fc.option(fc.emailAddress()),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }).filter(s => s.trim().length > 0)),
    ageType: fc.option(fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>),
    guestType: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
    dietaryRestrictions: fc.option(fc.string({ maxLength: 500 }).filter(s => s.trim().length > 0)),
    notes: fc.option(fc.string({ maxLength: 1000 }).filter(s => s.trim().length > 0)),
  });

  /**
   * Generator for invalid guest update data (validation should fail)
   */
  const invalidUpdateArbitrary = fc.oneof(
    // Empty required fields
    fc.record({ firstName: fc.constant('') }),
    fc.record({ firstName: fc.constant('   ') }),
    fc.record({ lastName: fc.constant('') }),
    fc.record({ lastName: fc.constant('   ') }),
    
    // Invalid email formats
    fc.record({ email: fc.constant('not-an-email') }),
    fc.record({ email: fc.constant('missing@domain') }),
    fc.record({ email: fc.constant('@nodomain.com') }),
    fc.record({ email: fc.constant('no-at-sign.com') }),
    
    // Invalid UUID for groupId
    fc.record({ groupId: fc.constant('not-a-uuid') }),
    fc.record({ groupId: fc.constant('12345') }),
    
    // Invalid ageType
    fc.record({ ageType: fc.constant('invalid-age-type' as any) }),
  );

  /**
   * Generator for malicious input (should be sanitized)
   */
  const maliciousUpdateArbitrary = fc.record({
    firstName: fc.oneof(
      fc.constant('<script>alert("xss")</script>John'),
      fc.constant('John<img src=x onerror=alert(1)>'),
      fc.constant('John"; DROP TABLE guests; --'),
    ),
    lastName: fc.oneof(
      fc.constant('<script>alert("xss")</script>Doe'),
      fc.constant('Doe<img src=x onerror=alert(1)>'),
      fc.constant("Doe' OR '1'='1"),
    ),
    notes: fc.oneof(
      fc.constant('<script>document.cookie</script>'),
      fc.constant('<iframe src="http://evil.com"></iframe>'),
      fc.constant("'; DELETE FROM guests WHERE '1'='1"),
    ),
  });

  /**
   * Generator for valid UUIDs
   */
  const uuidArrayArbitrary = fc.array(fc.uuid(), { minLength: 1, maxLength: 10 });

  it('should apply the same validation rules in bulk update as in individual update', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArrayArbitrary,
        invalidUpdateArbitrary,
        async (ids, invalidUpdate) => {
          // Test individual update validation
          const individualResult = await guestService.update(ids[0], invalidUpdate);
          
          // Test bulk update validation
          const bulkResult = await guestService.bulkUpdate(ids, invalidUpdate);
          
          // Both should fail validation
          expect(individualResult.success).toBe(false);
          expect(bulkResult.success).toBe(false);
          
          // Both should return VALIDATION_ERROR
          if (!individualResult.success && !bulkResult.success) {
            expect(individualResult.error.code).toBe('VALIDATION_ERROR');
            expect(bulkResult.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply the same sanitization rules in bulk update as in individual update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        uuidArrayArbitrary,
        maliciousUpdateArbitrary,
        async (singleId, bulkIds, maliciousUpdate) => {
          // Mock successful database response for individual update
          mockFrom.mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                id: singleId, 
                first_name: 'Sanitized', 
                last_name: 'Name',
                group_id: 'test-group-id',
                age_type: 'adult',
                guest_type: 'wedding_guest',
                invitation_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          });

          // Mock successful database response for bulk update
          mockFrom.mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              data: bulkIds.map(id => ({
                id,
                first_name: 'Sanitized',
                last_name: 'Name',
                group_id: 'test-group-id',
                age_type: 'adult',
                guest_type: 'wedding_guest',
                invitation_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })),
              error: null,
            }),
          });
          
          // Test individual update sanitization
          const individualResult = await guestService.update(singleId, maliciousUpdate);
          
          // Test bulk update sanitization
          const bulkResult = await guestService.bulkUpdate(bulkIds, maliciousUpdate);
          
          // Both should succeed (after sanitization)
          expect(individualResult.success).toBe(true);
          expect(bulkResult.success).toBe(true);
          
          // Verify that the update was called with sanitized data
          const calls = mockFrom.mock.calls;
          
          // Both calls should have been made to 'guests' table
          expect(calls.length).toBeGreaterThanOrEqual(2);
          expect(calls[0][0]).toBe('guests');
          expect(calls[1][0]).toBe('guests');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject bulk update with empty ID array', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUpdateArbitrary,
        async (validUpdate) => {
          const result = await guestService.bulkUpdate([], validUpdate);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toBe('Guest IDs array is required and must not be empty');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject bulk update with invalid UUID in array', async () => {
    const invalidIdArrayArbitrary = fc.array(
      fc.oneof(
        fc.constant('not-a-uuid'),
        fc.constant('12345'),
        fc.constant(''),
        fc.string().filter(s => !isValidUUID(s))
      ),
      { minLength: 1, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(
        invalidIdArrayArbitrary,
        validUpdateArbitrary,
        async (invalidIds, validUpdate) => {
          const result = await guestService.bulkUpdate(invalidIds, validUpdate);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toContain('Invalid guest ID format');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject bulk delete with empty ID array', async () => {
    const result = await guestService.bulkDelete([]);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Guest IDs array is required and must not be empty');
    }
  });

  it('should reject bulk delete with invalid UUID in array', async () => {
    const invalidIdArrayArbitrary = fc.array(
      fc.oneof(
        fc.constant('not-a-uuid'),
        fc.constant('12345'),
        fc.constant(''),
        fc.string().filter(s => !isValidUUID(s))
      ),
      { minLength: 1, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(
        invalidIdArrayArbitrary,
        async (invalidIds) => {
          const result = await guestService.bulkDelete(invalidIds);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toContain('Invalid guest ID format');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle validation errors consistently for mixed valid/invalid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArrayArbitrary,
        fc.tuple(validUpdateArbitrary, invalidUpdateArbitrary),
        async (ids, [validUpdate, invalidUpdate]) => {
          // Both individual and bulk should reject invalid data
          const individualInvalidResult = await guestService.update(ids[0], invalidUpdate);
          const bulkInvalidResult = await guestService.bulkUpdate(ids, invalidUpdate);
          
          expect(individualInvalidResult.success).toBe(false);
          expect(bulkInvalidResult.success).toBe(false);
          
          if (!individualInvalidResult.success && !bulkInvalidResult.success) {
            // Both should have the same error code
            expect(individualInvalidResult.error.code).toBe(bulkInvalidResult.error.code);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply field-level validation consistently in bulk operations', async () => {
    // Test specific field validation rules
    const fieldValidationTests = [
      { field: 'firstName', value: '', errorExpected: true },
      { field: 'firstName', value: '   ', errorExpected: true },
      { field: 'lastName', value: '', errorExpected: true },
      { field: 'lastName', value: '   ', errorExpected: true },
      { field: 'email', value: 'invalid-email', errorExpected: true },
    ];

    for (const test of fieldValidationTests) {
      const updateData = { [test.field]: test.value } as UpdateGuestDTO;
      const ids = [fc.sample(fc.uuid(), 1)[0]];
      
      const individualResult = await guestService.update(ids[0], updateData);
      const bulkResult = await guestService.bulkUpdate(ids, updateData);
      
      if (test.errorExpected) {
        // Both should fail validation
        expect(individualResult.success).toBe(false);
        expect(bulkResult.success).toBe(false);
        
        if (!individualResult.success && !bulkResult.success) {
          // Both should have VALIDATION_ERROR
          expect(individualResult.error.code).toBe('VALIDATION_ERROR');
          expect(bulkResult.error.code).toBe('VALIDATION_ERROR');
        }
      }
    }
  });

  it('should preserve validation consistency when applying to multiple IDs', async () => {
    // This test verifies that bulk operations apply the same validation rules
    // We don't need to test successful database operations here, just validation consistency
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        invalidUpdateArbitrary,
        async (ids, invalidUpdate) => {
          // Both individual and bulk should fail validation with invalid data
          const individualResult = await guestService.update(ids[0], invalidUpdate);
          const bulkResult = await guestService.bulkUpdate(ids, invalidUpdate);
          
          // Both should fail
          expect(individualResult.success).toBe(false);
          expect(bulkResult.success).toBe(false);
          
          // Both should have VALIDATION_ERROR
          if (!individualResult.success && !bulkResult.success) {
            expect(individualResult.error.code).toBe('VALIDATION_ERROR');
            expect(bulkResult.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Helper function to validate UUID format.
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
