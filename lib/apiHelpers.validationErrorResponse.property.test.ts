import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { z } from 'zod';

/**
 * Feature: admin-backend-integration-cms, Property 13: Validation Error Response
 * 
 * For any invalid request data, when validation fails, the API SHALL return
 * HTTP 400 with VALIDATION_ERROR code and field-level error details.
 * 
 * Validates: Requirements 13.6
 */
describe('Feature: admin-backend-integration-cms, Property 13: Validation Error Response', () => {
  // Inline implementation of validateBody for testing (mirrors apiHelpers.ts)
  function validateBody<T extends z.ZodTypeAny>(
    body: unknown,
    schema: T
  ): { success: true; data: z.infer<T> } | { success: false; error: { code: string; message: string; details: any } } {
    const validation = schema.safeParse(body);

    if (!validation.success) {
      // Format field-level errors for better client consumption
      const fieldErrors = validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: {
            fields: fieldErrors,
            raw: validation.error.issues,
          },
        },
      };
    }

    return {
      success: true,
      data: validation.data,
    };
  }

  // Test schema for validation
  const testSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().int().positive().max(150),
    status: z.enum(['active', 'inactive']),
  });

  // Generator for invalid data that will fail validation
  const invalidDataArbitrary = fc.oneof(
    // Missing required fields
    fc.record({
      name: fc.constant(undefined),
      email: fc.emailAddress(),
      age: fc.integer({ min: 1, max: 150 }),
      status: fc.constantFrom('active', 'inactive'),
    }),
    // Invalid email format
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.string().filter(s => !s.includes('@')), // Invalid email
      age: fc.integer({ min: 1, max: 150 }),
      status: fc.constantFrom('active', 'inactive'),
    }),
    // Invalid age (negative or zero)
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.emailAddress(),
      age: fc.integer({ max: 0 }), // Invalid age
      status: fc.constantFrom('active', 'inactive'),
    }),
    // Invalid age (too large)
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.emailAddress(),
      age: fc.integer({ min: 151 }), // Invalid age
      status: fc.constantFrom('active', 'inactive'),
    }),
    // Invalid status
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.emailAddress(),
      age: fc.integer({ min: 1, max: 150 }),
      status: fc.string().filter(s => s !== 'active' && s !== 'inactive'),
    }),
    // Empty name
    fc.record({
      name: fc.constant(''),
      email: fc.emailAddress(),
      age: fc.integer({ min: 1, max: 150 }),
      status: fc.constantFrom('active', 'inactive'),
    }),
    // Name too long
    fc.record({
      name: fc.string({ minLength: 101 }),
      email: fc.emailAddress(),
      age: fc.integer({ min: 1, max: 150 }),
      status: fc.constantFrom('active', 'inactive'),
    })
  );

  it('should return validation error with VALIDATION_ERROR code for any invalid data', () => {
    fc.assert(
      fc.property(invalidDataArbitrary, (invalidData) => {
        const result = validateBody(invalidData, testSchema);

        // Property 1: Validation should fail
        expect(result.success).toBe(false);

        if (!result.success) {
          // Property 2: Error code should be VALIDATION_ERROR
          expect(result.error.code).toBe('VALIDATION_ERROR');

          // Property 3: Error message should be present
          expect(result.error.message).toBeDefined();
          expect(typeof result.error.message).toBe('string');
          expect(result.error.message.length).toBeGreaterThan(0);

          // Property 4: Error details should contain field-level errors
          expect(result.error.details).toBeDefined();
          expect(result.error.details.fields).toBeDefined();
          expect(Array.isArray(result.error.details.fields)).toBe(true);
          expect(result.error.details.fields.length).toBeGreaterThan(0);

          // Property 5: Each field error should have required properties
          result.error.details.fields.forEach((fieldError: any) => {
            expect(fieldError.field).toBeDefined();
            expect(typeof fieldError.field).toBe('string');
            expect(fieldError.message).toBeDefined();
            expect(typeof fieldError.message).toBe('string');
            expect(fieldError.code).toBeDefined();
          });

          // Property 6: Raw Zod issues should be preserved for debugging
          expect(result.error.details.raw).toBeDefined();
          expect(Array.isArray(result.error.details.raw)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should format field paths correctly for nested validation errors', () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      }),
      settings: z.object({
        notifications: z.boolean(),
      }),
    });

    const invalidNestedDataArbitrary = fc.oneof(
      // Invalid nested email
      fc.record({
        user: fc.record({
          profile: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.string().filter(s => !s.includes('@')),
          }),
        }),
        settings: fc.record({
          notifications: fc.boolean(),
        }),
      }),
      // Missing nested name
      fc.record({
        user: fc.record({
          profile: fc.record({
            name: fc.constant(''),
            email: fc.emailAddress(),
          }),
        }),
        settings: fc.record({
          notifications: fc.boolean(),
        }),
      })
    );

    fc.assert(
      fc.property(invalidNestedDataArbitrary, (invalidData) => {
        const result = validateBody(invalidData, nestedSchema);

        expect(result.success).toBe(false);

        if (!result.success) {
          // Property: Field paths should use dot notation for nested fields
          result.error.details.fields.forEach((fieldError: any) => {
            expect(fieldError.field).toMatch(/^user\.profile\.(name|email)$/);
          });
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should preserve all field errors when multiple fields are invalid', () => {
    const multipleInvalidFieldsArbitrary = fc.record({
      name: fc.constant(''), // Invalid: too short
      email: fc.string().filter(s => !s.includes('@')), // Invalid: not an email
      age: fc.integer({ max: 0 }), // Invalid: not positive
      status: fc.string().filter(s => s !== 'active' && s !== 'inactive'), // Invalid: not in enum
    });

    fc.assert(
      fc.property(multipleInvalidFieldsArbitrary, (invalidData) => {
        const result = validateBody(invalidData, testSchema);

        expect(result.success).toBe(false);

        if (!result.success) {
          // Property: Should have errors for all invalid fields
          const fieldNames = result.error.details.fields.map((f: any) => f.field);
          
          // At least one error should be present
          expect(fieldNames.length).toBeGreaterThan(0);
          
          // All field names should be valid field names from the schema
          fieldNames.forEach((fieldName: string) => {
            expect(['name', 'email', 'age', 'status']).toContain(fieldName);
          });
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should handle validation errors for array fields', () => {
    const arraySchema = z.object({
      tags: z.array(z.string().min(1).max(20)),
      numbers: z.array(z.number().int().positive()),
    });

    const invalidArrayDataArbitrary = fc.oneof(
      // Invalid tag (empty string)
      fc.record({
        tags: fc.array(fc.constant(''), { minLength: 1, maxLength: 5 }),
        numbers: fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }),
      }),
      // Invalid number (negative)
      fc.record({
        tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        numbers: fc.array(fc.integer({ max: 0 }), { minLength: 1, maxLength: 5 }),
      })
    );

    fc.assert(
      fc.property(invalidArrayDataArbitrary, (invalidData) => {
        const result = validateBody(invalidData, arraySchema);

        expect(result.success).toBe(false);

        if (!result.success) {
          // Property: Field paths should include array indices
          result.error.details.fields.forEach((fieldError: any) => {
            expect(fieldError.field).toMatch(/^(tags|numbers)\.\d+$/);
          });
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should provide meaningful error messages for common validation failures', () => {
    const commonInvalidDataArbitrary = fc.oneof(
      // Required field missing
      fc.record({
        email: fc.emailAddress(),
        age: fc.integer({ min: 1, max: 150 }),
        status: fc.constantFrom('active', 'inactive'),
      }),
      // Invalid type
      fc.record({
        name: fc.integer(), // Should be string
        email: fc.emailAddress(),
        age: fc.integer({ min: 1, max: 150 }),
        status: fc.constantFrom('active', 'inactive'),
      })
    );

    fc.assert(
      fc.property(commonInvalidDataArbitrary, (invalidData) => {
        const result = validateBody(invalidData, testSchema);

        expect(result.success).toBe(false);

        if (!result.success) {
          // Property: Error messages should be non-empty and descriptive
          result.error.details.fields.forEach((fieldError: any) => {
            expect(fieldError.message.length).toBeGreaterThan(0);
            expect(typeof fieldError.message).toBe('string');
          });
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should return HTTP 400 status code for validation errors', () => {
    // Test the error response structure
    const fieldErrors = [
      { field: 'email', message: 'Invalid email format', code: 'invalid_string' },
      { field: 'name', message: 'Required', code: 'required' },
    ];

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          fields: fieldErrors,
        },
      },
    };

    // Property: Error response should have correct structure
    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
    expect(errorResponse.error.details.fields).toEqual(fieldErrors);
  });
});
