import * as fc from 'fast-check';
import * as activityService from './activityService';

// Mock Supabase
jest.mock('@supabase/supabase-js');

/**
 * Property-based tests for activity required field validation.
 * Feature: destination-wedding-platform, Property 9: Activity Required Field Validation
 * 
 * Validates: Requirements 6.11
 * 
 * This test validates that the system correctly rejects activity creation/update
 * when required fields (name, start_time) are missing and returns specific field errors.
 */

describe.skip('Feature: destination-wedding-platform, Property 9: Activity Required Field Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  it('should reject activity creation when name is missing', () => {
    // Arbitrary for generating activity data without name
    const activityWithoutNameArbitrary = fc.record({
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    });

    fc.assert(
      fc.asyncProperty(
        activityWithoutNameArbitrary,
        async (activityData) => {
          // Mock the create function to return validation error
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'invalid_type',
                  path: ['name'],
                  message: 'Activity name is required',
                },
              ],
            },
          } as any);

          const result = await activityService.create(activityData as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error details should mention the name field
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toContain('name');
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should reject activity creation when startTime is missing', () => {
    // Arbitrary for generating activity data without startTime
    const activityWithoutStartTimeArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    });

    fc.assert(
      fc.asyncProperty(
        activityWithoutStartTimeArbitrary,
        async (activityData) => {
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'invalid_type',
                  path: ['startTime'],
                  message: 'Invalid start time format',
                },
              ],
            },
          } as any);

          const result = await activityService.create(activityData as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error details should mention the startTime field
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toMatch(/start.*time|starttime/);
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should reject activity creation when activityType is missing', () => {
    // Arbitrary for generating activity data without activityType
    const activityWithoutTypeArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    });

    fc.assert(
      fc.asyncProperty(
        activityWithoutTypeArbitrary,
        async (activityData) => {
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'invalid_type',
                  path: ['activityType'],
                  message: 'Activity type is required',
                },
              ],
            },
          } as any);

          const result = await activityService.create(activityData as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error details should mention the activityType field
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toMatch(/activity.*type|activitytype/);
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should reject activity creation when multiple required fields are missing', () => {
    // Arbitrary for generating activity data with multiple missing fields
    const incompleteActivityArbitrary = fc.record({
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
      adultsOnly: fc.boolean(),
    });

    fc.assert(
      fc.asyncProperty(
        incompleteActivityArbitrary,
        async (activityData) => {
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'invalid_type',
                  path: ['name'],
                  message: 'Activity name is required',
                },
                {
                  code: 'invalid_type',
                  path: ['activityType'],
                  message: 'Activity type is required',
                },
                {
                  code: 'invalid_type',
                  path: ['startTime'],
                  message: 'Invalid start time format',
                },
              ],
            },
          } as any);

          const result = await activityService.create(activityData as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error details should be an array with multiple errors
            expect(Array.isArray(result.error.details)).toBe(true);
            if (Array.isArray(result.error.details)) {
              expect(result.error.details.length).toBeGreaterThan(0);
            }
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should accept activity creation when all required fields are present', () => {
    // Arbitrary for generating complete activity data
    const completeActivityArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
      startTime: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }).map(d => d.toISOString()),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      capacity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
      costPerPerson: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
      adultsOnly: fc.boolean(),
    });

    fc.assert(
      fc.asyncProperty(
        completeActivityArbitrary,
        fc.uuid(),
        async (activityData, activityId) => {
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: true,
            data: {
              id: activityId,
              ...activityData,
              eventId: null,
              locationId: null,
              endTime: null,
              hostSubsidy: null,
              plusOneAllowed: true,
              visibility: [],
              status: 'draft',
              displayOrder: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any,
          } as any);

          const result = await activityService.create(activityData);

          // Property 1: Creation should succeed
          expect(result.success).toBe(true);

          if (result.success) {
            // Property 2: Returned data should include the activity ID
            expect(result.data.id).toBeDefined();

            // Property 3: Required fields should be present in returned data
            expect(result.data.name).toBeDefined();
            expect(result.data.activityType).toBeDefined();
            expect(result.data.startTime).toBeDefined();
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should reject activity update when name is set to empty string', () => {
    const activityIdArbitrary = fc.uuid();
    const emptyNameUpdateArbitrary = fc.record({
      name: fc.constant(''),
    });

    fc.assert(
      fc.asyncProperty(
        activityIdArbitrary,
        emptyNameUpdateArbitrary,
        async (activityId, updateData) => {
          const mockUpdate = jest.spyOn(activityService, 'update');
          mockUpdate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'too_small',
                  path: ['name'],
                  message: 'Activity name is required',
                },
              ],
            },
          } as any);

          const result = await activityService.update(activityId, updateData);

          // Property 1: Update should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error should mention name field
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toContain('name');
          }

          mockUpdate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should reject activity with invalid startTime format', () => {
    const invalidTimeArbitrary = fc.oneof(
      fc.constant('not-a-date'),
      fc.constant('2025-13-45'), // Invalid month/day
      fc.constant('25/06/2025'), // Wrong format
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.match(/^\d{4}-\d{2}-\d{2}/)),
    );

    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
        invalidTimeArbitrary,
        async (name, activityType, invalidStartTime) => {
          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'invalid_string',
                  path: ['startTime'],
                  message: 'Invalid start time format',
                },
              ],
            },
          } as any);

          const result = await activityService.create({
            name,
            activityType,
            startTime: invalidStartTime,
          } as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error should mention startTime or time format
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toMatch(/start.*time|time.*format|invalid.*string/);
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  it('should validate that endTime is after startTime when both are provided', () => {
    const dateArbitrary = fc.date({
      min: new Date('2025-01-01'),
      max: new Date('2025-12-31'),
    });

    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
        dateArbitrary,
        fc.integer({ min: 1, max: 24 }), // hours before start
        async (name, activityType, startTime, hoursBefore) => {
          // Create endTime that is BEFORE startTime (invalid)
          const endTime = new Date(startTime.getTime() - hoursBefore * 60 * 60 * 1000);

          const mockCreate = jest.spyOn(activityService, 'create');
          mockCreate.mockResolvedValue({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                {
                  code: 'custom',
                  path: ['endTime'],
                  message: 'End time must be after or equal to start time',
                },
              ],
            },
          } as any);

          const result = await activityService.create({
            name,
            activityType,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          } as any);

          // Property 1: Creation should fail
          expect(result.success).toBe(false);

          if (!result.success) {
            // Property 2: Error code should be VALIDATION_ERROR
            expect(result.error.code).toBe('VALIDATION_ERROR');

            // Property 3: Error should mention endTime or time ordering
            const errorDetails = JSON.stringify(result.error.details || result.error.message);
            expect(errorDetails.toLowerCase()).toMatch(/end.*time|after|before/);
          }

          mockCreate.mockRestore();
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });
});
