import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import type { CreateGuestDTO } from '@/schemas/guestSchemas';

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
 * Feature: destination-wedding-platform, Property 5: Guest Input Validation
 * 
 * For any guest data where first name, last name, or group ID is missing,
 * or where email is syntactically invalid, the system should reject the
 * creation/update and return a validation error.
 * 
 * Validates: Requirements 4.16
 */
describe('Feature: destination-wedding-platform, Property 5: Guest Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Generator for valid guest data with unique identifiers
  const validGuestArbitrary = fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0)
      .map(s => `${s} ${Date.now()} ${Math.random().toString(36).substr(2, 5)}`), // Add unique suffix
    lastName: fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0)
      .map(s => `${s} ${Date.now()} ${Math.random().toString(36).substr(2, 5)}`), // Add unique suffix
    email: fc.option(fc.emailAddress().map(email => {
      const [local, domain] = email.split('@');
      return `${local}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@${domain}`;
    }), { nil: null }),
    groupId: fc.uuid(),
    ageType: fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>,
    guestType: fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0)
      .map(s => `${s}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`), // Add unique suffix
  });

  it('should reject guest creation when firstName is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        validGuestArbitrary,
        async (validGuest) => {
          // Test with empty string
          const invalidGuest1 = { ...validGuest, firstName: '' };
          const result1 = await guestService.create(invalidGuest1);
          expect(result1.success).toBe(false);
          if (!result1.success) {
            expect(result1.error.code).toBe('VALIDATION_ERROR');
          }

          // Test with whitespace only
          const invalidGuest2 = { ...validGuest, firstName: '   ' };
          const result2 = await guestService.create(invalidGuest2);
          expect(result2.success).toBe(false);
          if (!result2.success) {
            expect(result2.error.code).toBe('VALIDATION_ERROR');
          }

          // Test with missing field
          const { firstName, ...invalidGuest3 } = validGuest;
          const result3 = await guestService.create(invalidGuest3 as CreateGuestDTO);
          expect(result3.success).toBe(false);
          if (!result3.success) {
            expect(result3.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject guest creation when lastName is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        validGuestArbitrary,
        async (validGuest) => {
          // Test with empty string
          const invalidGuest1 = { ...validGuest, lastName: '' };
          const result1 = await guestService.create(invalidGuest1);
          expect(result1.success).toBe(false);
          if (!result1.success) {
            expect(result1.error.code).toBe('VALIDATION_ERROR');
          }

          // Test with whitespace only
          const invalidGuest2 = { ...validGuest, lastName: '   ' };
          const result2 = await guestService.create(invalidGuest2);
          expect(result2.success).toBe(false);
          if (!result2.success) {
            expect(result2.error.code).toBe('VALIDATION_ERROR');
          }

          // Test with missing field
          const { lastName, ...invalidGuest3 } = validGuest;
          const result3 = await guestService.create(invalidGuest3 as CreateGuestDTO);
          expect(result3.success).toBe(false);
          if (!result3.success) {
            expect(result3.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject guest creation when groupId is missing or invalid', async () => {
    await fc.assert(
      fc.asyncProperty(
        validGuestArbitrary,
        fc.string().filter(s => !isValidUUID(s)), // Generate invalid UUIDs
        async (validGuest, invalidUUID) => {
          // Test with invalid UUID
          const invalidGuest1 = { ...validGuest, groupId: invalidUUID };
          const result1 = await guestService.create(invalidGuest1);
          expect(result1.success).toBe(false);
          if (!result1.success) {
            expect(result1.error.code).toBe('VALIDATION_ERROR');
          }

          // Test with missing field
          const { groupId, ...invalidGuest2 } = validGuest;
          const result2 = await guestService.create(invalidGuest2 as CreateGuestDTO);
          expect(result2.success).toBe(false);
          if (!result2.success) {
            expect(result2.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject guest creation when email is syntactically invalid', async () => {
    // Generator for invalid email formats
    const invalidEmailArbitrary = fc.oneof(
      fc.constant('not-an-email'),
      fc.constant('missing@domain'),
      fc.constant('@nodomain.com'),
      fc.constant('no-at-sign.com'),
      fc.constant('spaces in@email.com'),
      fc.constant('double@@email.com'),
      fc.string().filter(s => !isValidEmail(s) && s.length > 0)
    );

    await fc.assert(
      fc.asyncProperty(
        validGuestArbitrary,
        invalidEmailArbitrary,
        async (validGuest, invalidEmail) => {
          const invalidGuest = { ...validGuest, email: invalidEmail };
          const result = await guestService.create(invalidGuest);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toContain('Validation failed');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Note: Positive test case (valid data should succeed) is covered in unit tests
  // Property-based tests focus on validation failures across many random inputs

  it('should reject guest update when validation fails', async () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({ firstName: fc.constant('') }), // Empty firstName
          fc.record({ firstName: fc.constant('   ') }), // Whitespace firstName
          fc.record({ lastName: fc.constant('') }), // Empty lastName
          fc.record({ lastName: fc.constant('   ') }), // Whitespace lastName
          fc.record({ email: fc.constant('invalid-email') }), // Invalid email
          fc.record({ groupId: fc.constant('not-a-uuid') }) // Invalid UUID
        ),
        async (invalidUpdate) => {
          const result = await guestService.update(validId, invalidUpdate);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
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

/**
 * Helper function to validate email format.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}
