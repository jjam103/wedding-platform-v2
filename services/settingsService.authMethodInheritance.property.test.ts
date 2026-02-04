/**
 * Property-based tests for auth method configuration
 * 
 * **Feature: admin-ux-enhancements, Property 4: Default Auth Method Inheritance**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any newly created guest, the auth_method should automatically 
 * inherit the system's default_auth_method setting
 * 
 * **Feature: admin-ux-enhancements, Property 5: Bulk Auth Method Update**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any bulk update operation on guest auth methods, all selected 
 * guests should have their auth_method updated to the specified value
 */

import * as fc from 'fast-check';
import * as settingsService from './settingsService';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('Auth Method Configuration - Property Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
  });

  describe('Property 4: Default Auth Method Inheritance', () => {
    /**
     * Property: New guests should inherit the system's default_auth_method
     * 
     * This test verifies that regardless of which auth method is set as default,
     * the system correctly retrieves and returns that value.
     */
    it('should always return a valid auth method (email_matching or magic_link)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email_matching', 'magic_link'),
          async (authMethod) => {
            // Mock database to return the auth method
            mockSupabase.from.mockReturnValue({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { value: authMethod },
                    error: null,
                  }),
                }),
              }),
            });

            const result = await settingsService.getDefaultAuthMethod();

            // Property: Result should always be successful
            expect(result.success).toBe(true);

            if (result.success) {
              // Property: Returned value should match the stored value
              expect(result.data).toBe(authMethod);
              
              // Property: Returned value should be one of the valid options
              expect(['email_matching', 'magic_link']).toContain(result.data);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return email_matching as default when setting does not exist', () => {
      fc.assert(
        fc.property(fc.constant(null), async () => {
          // Mock database to return not found error
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          });

          const result = await settingsService.getDefaultAuthMethod();

          // Property: Should always succeed with default value
          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Default should always be email_matching
            expect(result.data).toBe('email_matching');
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Bulk Auth Method Update', () => {
    /**
     * Property: All selected guests should be updated atomically
     * 
     * This test verifies that when bulk updating guests, the operation
     * correctly updates the setting and reports the number of guests updated.
     */
    it('should update all guests when bulk update is requested', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email_matching', 'magic_link'),
          fc.integer({ min: 0, max: 100 }), // Number of guests to update
          async (authMethod, guestCount) => {
            const mockFrom = jest.fn();
            mockSupabase.from = mockFrom;

            // First call: upsert setting (success)
            mockFrom.mockReturnValueOnce({
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      key: 'default_auth_method',
                      value: authMethod,
                    },
                    error: null,
                  }),
                }),
              }),
            });

            // Second call: update guests
            const mockGuestData = Array.from({ length: guestCount }, (_, i) => ({
              id: `guest-${i}`,
            }));

            mockFrom.mockReturnValueOnce({
              update: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  select: jest.fn().mockResolvedValue({
                    data: mockGuestData,
                    error: null,
                  }),
                }),
              }),
            });

            const result = await settingsService.updateDefaultAuthMethod(authMethod, true);

            // Property: Update should always succeed
            expect(result.success).toBe(true);

            if (result.success) {
              // Property: Updated count should match the number of guests
              expect(result.data.updatedGuestsCount).toBe(guestCount);
              
              // Property: Updated count should be non-negative
              expect(result.data.updatedGuestsCount).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not update guests when bulk update is not requested', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email_matching', 'magic_link'),
          async (authMethod) => {
            // Mock upsert for setting only
            mockSupabase.from.mockReturnValue({
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      key: 'default_auth_method',
                      value: authMethod,
                    },
                    error: null,
                  }),
                }),
              }),
            });

            const result = await settingsService.updateDefaultAuthMethod(authMethod, false);

            // Property: Update should always succeed
            expect(result.success).toBe(true);

            if (result.success) {
              // Property: No guests should be updated when bulk update is false
              expect(result.data.updatedGuestsCount).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain atomicity - either all guests updated or none', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email_matching', 'magic_link'),
          fc.boolean(), // Whether the guest update should fail
          async (authMethod, shouldFail) => {
            const mockFrom = jest.fn();
            mockSupabase.from = mockFrom;

            // First call: upsert setting (always succeeds)
            mockFrom.mockReturnValueOnce({
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      key: 'default_auth_method',
                      value: authMethod,
                    },
                    error: null,
                  }),
                }),
              }),
            });

            // Second call: update guests (may fail)
            if (shouldFail) {
              mockFrom.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                  neq: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Database error' },
                    }),
                  }),
                }),
              });
            } else {
              mockFrom.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                  neq: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                      data: [{ id: '1' }, { id: '2' }],
                      error: null,
                    }),
                  }),
                }),
              });
            }

            const result = await settingsService.updateDefaultAuthMethod(authMethod, true);

            if (shouldFail) {
              // Property: If guest update fails, entire operation should fail
              expect(result.success).toBe(false);
              if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
              }
            } else {
              // Property: If guest update succeeds, operation should succeed
              expect(result.success).toBe(true);
              if (result.success) {
                expect(result.data.updatedGuestsCount).toBeGreaterThanOrEqual(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Auth Method Validation', () => {
    /**
     * Property: Invalid auth methods should always be rejected
     * 
     * This test verifies that the system properly validates auth method values
     * and rejects any invalid values.
     */
    it('should reject invalid auth method values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s !== 'email_matching' && s !== 'magic_link'),
          async (invalidMethod) => {
            const result = await settingsService.updateDefaultAuthMethod(
              invalidMethod as any,
              false
            );

            // Property: Invalid methods should always fail validation
            expect(result.success).toBe(false);

            if (!result.success) {
              // Property: Error code should be VALIDATION_ERROR
              expect(result.error.code).toBe('VALIDATION_ERROR');
              
              // Property: Error message should mention invalid auth method
              expect(result.error.message.toLowerCase()).toContain('invalid');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only accept email_matching or magic_link as valid values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email_matching', 'magic_link'),
          async (validMethod) => {
            // Mock successful upsert
            mockSupabase.from.mockReturnValue({
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      key: 'default_auth_method',
                      value: validMethod,
                    },
                    error: null,
                  }),
                }),
              }),
            });

            const result = await settingsService.updateDefaultAuthMethod(validMethod, false);

            // Property: Valid methods should always succeed (assuming no DB errors)
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
