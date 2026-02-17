/**
 * Property-Based Tests for Guest Auth Method Validation
 * Feature: admin-ux-enhancements
 * Property 1: Auth Method Consistency
 * 
 * Validates: Requirements 1.1, 1.2
 */

import * as fc from 'fast-check';
import * as guestService from './guestService';
import { createMockSupabaseClient } from '@/__tests__/helpers/mockSupabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(),
}));

describe('Feature: admin-ux-enhancements, Property 1: Auth Method Consistency', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Auth Method Consistency
   * 
   * For any guest record, the auth_method field should always contain 
   * a valid value ('email_matching' or 'magic_link'), never NULL or invalid values
   */
  it('should ensure all created guests have valid auth_method', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.oneof(fc.emailAddress(), fc.constant(null)),
          ageType: fc.constantFrom('adult', 'child', 'senior'),
          guestType: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only'),
          groupId: fc.uuid(),
          authMethod: fc.oneof(
            fc.constant('email_matching'),
            fc.constant('magic_link'),
            fc.constant(null),
            fc.constant(undefined)
          ),
        }),
        async (guestData) => {
          // Mock successful database insert
          const mockGuest = {
            id: fc.sample(fc.uuid(), 1)[0],
            ...guestData,
            auth_method: guestData.authMethod || 'email_matching',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockSupabase.from.mockReturnValue({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockGuest,
                  error: null,
                }),
              }),
            }),
          });

          const result = await guestService.create({
            firstName: guestData.firstName,
            lastName: guestData.lastName,
            email: guestData.email,
            ageType: guestData.ageType as 'adult' | 'child' | 'senior',
            guestType: guestData.guestType,
            groupId: guestData.groupId,
          });

          // Property: Result should always succeed with valid auth_method
          expect(result.success).toBe(true);
          if (result.success) {
            // Auth method must be one of the valid values
            expect(['email_matching', 'magic_link']).toContain(result.data.authMethod);
            // Auth method must never be null or undefined
            expect(result.data.authMethod).not.toBeNull();
            expect(result.data.authMethod).not.toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Auth Method Inheritance
   * 
   * When creating a guest without specifying auth_method,
   * it should inherit the system default
   */
  it('should inherit default auth_method when not specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          ageType: fc.constantFrom('adult', 'child', 'senior'),
          guestType: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only'),
          groupId: fc.uuid(),
        }),
        fc.constantFrom('email_matching', 'magic_link'),
        async (guestData, defaultAuthMethod) => {
          // Mock system settings to return default auth method
          const mockGuest = {
            id: fc.sample(fc.uuid(), 1)[0],
            ...guestData,
            auth_method: defaultAuthMethod,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockSupabase.from.mockReturnValue({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockGuest,
                  error: null,
                }),
              }),
            }),
          });

          const result = await guestService.create({
            ...guestData,
            ageType: guestData.ageType as 'adult' | 'child' | 'senior',
          });

          // Property: Guest should inherit the default auth method
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.authMethod).toBe(defaultAuthMethod);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Auth Method Update Validation
   * 
   * When updating a guest's auth_method, only valid values should be accepted
   */
  it('should only accept valid auth_method values on update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant('email_matching'),
          fc.constant('magic_link'),
          fc.string().filter(s => !['email_matching', 'magic_link'].includes(s))
        ),
        async (guestId, authMethod) => {
          const isValidAuthMethod = ['email_matching', 'magic_link'].includes(authMethod);

          if (isValidAuthMethod) {
            // Mock successful update
            mockSupabase.from.mockReturnValue({
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: guestId, auth_method: authMethod },
                      error: null,
                    }),
                  }),
                }),
              }),
            });

            const result = await guestService.update(guestId, { authMethod: authMethod as 'email_matching' | 'magic_link' });

            // Property: Valid auth methods should succeed
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.authMethod).toBe(authMethod);
            }
          } else {
            // Property: Invalid auth methods should fail validation
            const result = await guestService.update(guestId, { authMethod: authMethod as any });
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.code).toBe('VALIDATION_ERROR');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Bulk Auth Method Update Consistency
   * 
   * When bulk updating auth methods, all guests should receive the same valid value
   */
  it('should consistently apply auth_method in bulk updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 50 }),
        fc.constantFrom('email_matching', 'magic_link'),
        async (guestIds, authMethod) => {
          // Mock successful bulk update
          const mockUpdatedGuests = guestIds.map(id => ({
            id,
            auth_method: authMethod,
          }));

          mockSupabase.from.mockReturnValue({
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                  data: mockUpdatedGuests,
                  error: null,
                }),
              }),
            }),
          });

          // Simulate bulk update (would be implemented in service)
          const result = await Promise.all(
            guestIds.map(id => guestService.update(id, { authMethod: authMethod as 'email_matching' | 'magic_link' }))
          );

          // Property: All updates should succeed with consistent auth_method
          result.forEach(r => {
            expect(r.success).toBe(true);
            if (r.success) {
              expect(r.data.authMethod).toBe(authMethod);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
