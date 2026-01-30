import * as accessControlService from './accessControlService';
import { createClient } from '@supabase/supabase-js';
import { ERROR_CODES } from '@/types';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('accessControlService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('hasRole', () => {
    it('should return true when user has the required role', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      } as any);

      const result = await accessControlService.hasRole('user-123', 'super_admin');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasRole).toBe(true);
        expect(result.data.userRole).toBe('super_admin');
      }
    });

    it('should return false when user does not have the required role', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      } as any);

      const result = await accessControlService.hasRole('user-123', 'super_admin');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasRole).toBe(false);
        expect(result.data.userRole).toBe('guest');
      }
    });

    it('should return NOT_FOUND when user does not exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      } as any);

      const result = await accessControlService.hasRole('user-123', 'super_admin');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the allowed roles', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'host' },
        error: null,
      } as any);

      const result = await accessControlService.hasAnyRole('user-123', ['super_admin', 'host']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasRole).toBe(true);
        expect(result.data.userRole).toBe('host');
      }
    });

    it('should return false when user does not have any allowed role', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      } as any);

      const result = await accessControlService.hasAnyRole('user-123', ['super_admin', 'host']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasRole).toBe(false);
        expect(result.data.userRole).toBe('guest');
      }
    });
  });

  describe('canAccessGroup', () => {
    it('should return true for super_admin accessing any group', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      } as any);

      const result = await accessControlService.canAccessGroup({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canAccess).toBe(true);
        expect(result.data.role).toBe('super_admin');
      }
    });

    it('should return true for group owner accessing their group', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: 'host' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { role: 'owner' },
          error: null,
        });

      const result = await accessControlService.canAccessGroup({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canAccess).toBe(true);
      }
    });

    it('should return false for user not in group', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: 'host' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

      const result = await accessControlService.canAccessGroup({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canAccess).toBe(false);
      }
    });

    it('should return false for group viewer (not owner)', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: 'host' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { role: 'viewer' },
          error: null,
        });

      const result = await accessControlService.canAccessGroup({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canAccess).toBe(false);
      }
    });
  });

  describe('canPerformAction', () => {
    it('should allow super_admin to perform any action', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'super_admin',
        resource: 'guests',
        action: 'delete',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should allow host to manage wedding resources', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'host',
        resource: 'guests',
        action: 'create',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should not allow host to access non-wedding resources', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'host',
        resource: 'system_settings',
        action: 'update',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(false);
      }
    });

    it('should allow guest to read public resources', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'guest',
        resource: 'events',
        action: 'read',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should allow guest to create RSVPs', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'guest',
        resource: 'rsvps',
        action: 'create',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should not allow guest to delete resources', async () => {
      const result = await accessControlService.canPerformAction({
        userId: 'user-123',
        role: 'guest',
        resource: 'events',
        action: 'delete',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(false);
      }
    });
  });

  describe('requireRole', () => {
    it('should return success when user has required role', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      } as any);

      const result = await accessControlService.requireRole('user-123', 'super_admin');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userRole).toBe('super_admin');
      }
    });

    it('should return INSUFFICIENT_PERMISSIONS when user lacks role', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      } as any);

      const result = await accessControlService.requireRole('user-123', 'super_admin');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('requireAnyRole', () => {
    it('should return success when user has one of the required roles', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'host' },
        error: null,
      } as any);

      const result = await accessControlService.requireAnyRole('user-123', ['super_admin', 'host']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userRole).toBe('host');
      }
    });

    it('should return INSUFFICIENT_PERMISSIONS when user lacks all roles', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      } as any);

      const result = await accessControlService.requireAnyRole('user-123', ['super_admin', 'host']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('requireGroupAccess', () => {
    it('should return success when user can access group', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      } as any);

      const result = await accessControlService.requireGroupAccess({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('super_admin');
      }
    });

    it('should return INSUFFICIENT_PERMISSIONS when user cannot access group', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: 'host' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

      const result = await accessControlService.requireGroupAccess({
        userId: 'user-123',
        groupId: 'group-456',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('getUserGroups', () => {
    it('should return all groups for super_admin', async () => {
      // First call: get user role
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'super_admin' },
          error: null,
        }),
      };

      // Second call: get all groups
      const mockGroupsQuery = {
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'group-1' }, { id: 'group-2' }, { id: 'group-3' }],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockGroupsQuery);

      const result = await accessControlService.getUserGroups('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupIds).toHaveLength(3);
        expect(result.data.role).toBe('super_admin');
      }
    });

    it('should return only owned groups for non-admin users', async () => {
      // First call: get user role
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'host' },
          error: null,
        }),
      };

      // Second call: get group_members with two eq() calls
      const mockMembersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // The second eq() call returns the final result
      mockMembersQuery.eq.mockReturnValueOnce(mockMembersQuery).mockReturnValueOnce({
        data: [{ group_id: 'group-1' }, { group_id: 'group-2' }],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockMembersQuery);

      const result = await accessControlService.getUserGroups('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupIds).toHaveLength(2);
        expect(result.data.groupIds).toContain('group-1');
        expect(result.data.groupIds).toContain('group-2');
      }
    });

    it('should return empty array when user has no groups', async () => {
      // First call: get user role
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'host' },
          error: null,
        }),
      };

      // Second call: get group_members with two eq() calls
      const mockMembersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // The second eq() call returns the final result
      mockMembersQuery.eq.mockReturnValueOnce(mockMembersQuery).mockReturnValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockMembersQuery);

      const result = await accessControlService.getUserGroups('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupIds).toHaveLength(0);
      }
    });
  });
});
