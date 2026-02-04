/**
 * Property-Based Test: Last Owner Protection
 * 
 * Feature: destination-wedding-platform
 * Property 12: Last Owner Protection
 * 
 * Validates: Requirements 3.10
 * 
 * Property: The system MUST prevent deletion or deactivation of the last active owner account
 * to ensure there is always at least one owner who can manage the system.
 */

import * as fc from 'fast-check';
import { adminUserService } from './adminUserService';
import { createClient } from '@/lib/supabaseServer';

// Mock dependencies
jest.mock('@/lib/supabaseServer');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

describe('Feature: destination-wedding-platform, Property 12: Last Owner Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should prevent deactivation of last active owner', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (ownerId) => {
          // Arrange: Mock last active owner
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: ownerId,
                email: 'owner@example.com',
                role: 'owner',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: 1, // Only 1 active owner
              error: null,
            });

          // Act: Attempt to deactivate last owner
          const result = await adminUserService.deactivate(ownerId);

          // Assert: Should fail with FORBIDDEN error
          expect(result.success).toBe(false);
          expect(result.error?.code).toBe('FORBIDDEN');
          expect(result.error?.message).toContain('last owner');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent deletion of last active owner', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (ownerId) => {
          // Arrange: Mock last active owner
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: ownerId,
              email: 'owner@example.com',
              role: 'owner',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          mockSupabase.select.mockReturnValueOnce({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              count: 1, // Only 1 active owner
              error: null,
            }),
          });

          // Act: Attempt to delete last owner
          const result = await adminUserService.delete(ownerId);

          // Assert: Should fail with FORBIDDEN error
          expect(result.success).toBe(false);
          expect(result.error?.code).toBe('FORBIDDEN');
          expect(result.error?.message).toContain('last owner');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow deactivation when multiple active owners exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }), // Number of active owners
        async (ownerId, ownerCount) => {
          // Arrange: Mock owner with multiple active owners
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: ownerId,
                email: 'owner@example.com',
                role: 'owner',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: ownerCount, // Multiple active owners
              error: null,
            })
            .mockResolvedValueOnce({
              data: {
                id: ownerId,
                email: 'owner@example.com',
                role: 'owner',
                status: 'inactive',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          // Act: Deactivate owner
          const result = await adminUserService.deactivate(ownerId);

          // Assert: Should succeed
          expect(result.success).toBe(true);
          expect(result.data?.status).toBe('inactive');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow deletion when multiple active owners exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }), // Number of active owners
        async (ownerId, ownerCount) => {
          // Arrange: Mock owner with multiple active owners
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: ownerId,
              email: 'owner@example.com',
              role: 'owner',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          mockSupabase.select.mockReturnValueOnce({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              count: ownerCount, // Multiple active owners
              error: null,
            }),
          });

          mockSupabase.delete.mockReturnValueOnce({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          });

          // Act: Delete owner
          const result = await adminUserService.delete(ownerId);

          // Assert: Should succeed
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow deactivation of non-owner admin users regardless of count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 10 }), // Number of active owners (doesn't matter)
        async (adminId, ownerCount) => {
          // Arrange: Mock non-owner admin user
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: adminId,
                email: 'admin@example.com',
                role: 'admin', // Not an owner
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: ownerCount,
              error: null,
            })
            .mockResolvedValueOnce({
              data: {
                id: adminId,
                email: 'admin@example.com',
                role: 'admin',
                status: 'inactive',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          // Act: Deactivate admin user
          const result = await adminUserService.deactivate(adminId);

          // Assert: Should succeed (not an owner, so no protection needed)
          expect(result.success).toBe(true);
          expect(result.data?.status).toBe('inactive');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count only active owners for protection check', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 5 }), // Number of inactive owners
        async (ownerId, inactiveOwnerCount) => {
          // Arrange: Mock last active owner (with inactive owners present)
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: ownerId,
                email: 'owner@example.com',
                role: 'owner',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: 1, // Only 1 ACTIVE owner (inactive owners don't count)
              error: null,
            });

          // Act: Attempt to deactivate last active owner
          const result = await adminUserService.deactivate(ownerId);

          // Assert: Should fail even if inactive owners exist
          expect(result.success).toBe(false);
          expect(result.error?.code).toBe('FORBIDDEN');
          expect(result.error?.message).toContain('last owner');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of exactly 2 active owners', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        async ([owner1Id, owner2Id]) => {
          // Arrange: Mock first owner with exactly 2 active owners
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: owner1Id,
                email: 'owner1@example.com',
                role: 'owner',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: 2, // Exactly 2 active owners
              error: null,
            })
            .mockResolvedValueOnce({
              data: {
                id: owner1Id,
                email: 'owner1@example.com',
                role: 'owner',
                status: 'inactive',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          // Act: Deactivate first owner (leaving 1 active)
          const result1 = await adminUserService.deactivate(owner1Id);

          // Assert: Should succeed (still 1 active owner remaining)
          expect(result1.success).toBe(true);

          // Now mock second owner as last active owner
          mockSupabase.single
            .mockResolvedValueOnce({
              data: {
                id: owner2Id,
                email: 'owner2@example.com',
                role: 'owner',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
            .mockResolvedValueOnce({
              count: 1, // Now only 1 active owner
              error: null,
            });

          // Act: Attempt to deactivate last owner
          const result2 = await adminUserService.deactivate(owner2Id);

          // Assert: Should fail (last owner)
          expect(result2.success).toBe(false);
          expect(result2.error?.code).toBe('FORBIDDEN');
        }
      ),
      { numRuns: 50 } // Fewer runs due to complex setup
    );
  });
});
