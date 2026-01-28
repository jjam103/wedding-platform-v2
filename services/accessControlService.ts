import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { success, error, unauthorizedError, unknownError } from '@/utils/errors';
import { ERROR_CODES } from '@/types';

/**
 * Access control service for managing role-based permissions.
 * Implements authorization checks for different user roles and resource access.
 */

export type UserRole = 'super_admin' | 'host' | 'guest';

export interface PermissionCheck {
  userId: string;
  role: UserRole;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export interface GroupAccessCheck {
  userId: string;
  groupId: string;
}

/**
 * Creates a Supabase client for access control operations.
 */
function createAccessControlClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Checks if a user has a specific role.
 * 
 * @param userId - User ID to check
 * @param requiredRole - Required role
 * @returns Result indicating if user has the role
 * 
 * @example
 * const result = await accessControlService.hasRole('user-123', 'super_admin');
 * if (result.success && result.data.hasRole) {
 *   console.log('User is super admin');
 * }
 */
export async function hasRole(
  userId: string,
  requiredRole: UserRole
): Promise<Result<{ hasRole: boolean; userRole: UserRole }>> {
  try {
    const supabase = createAccessControlClient();

    const { data, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (dbError || !data) {
      return error(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        dbError
      );
    }

    const userRole = data.role as UserRole;
    const hasRole = userRole === requiredRole;

    return success({ hasRole, userRole });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Checks if a user has any of the specified roles.
 * 
 * @param userId - User ID to check
 * @param allowedRoles - Array of allowed roles
 * @returns Result indicating if user has any of the roles
 * 
 * @example
 * const result = await accessControlService.hasAnyRole('user-123', ['super_admin', 'host']);
 */
export async function hasAnyRole(
  userId: string,
  allowedRoles: UserRole[]
): Promise<Result<{ hasRole: boolean; userRole: UserRole }>> {
  try {
    const supabase = createAccessControlClient();

    const { data, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (dbError || !data) {
      return error(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        dbError
      );
    }

    const userRole = data.role as UserRole;
    const hasRole = allowedRoles.includes(userRole);

    return success({ hasRole, userRole });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Checks if a user can access a specific group.
 * Super admins can access all groups.
 * Group owners can access their assigned groups.
 * 
 * @param check - User ID and group ID to check
 * @returns Result indicating if user can access the group
 * 
 * @example
 * const result = await accessControlService.canAccessGroup({
 *   userId: 'user-123',
 *   groupId: 'group-456'
 * });
 */
export async function canAccessGroup(
  check: GroupAccessCheck
): Promise<Result<{ canAccess: boolean; role: UserRole }>> {
  try {
    const supabase = createAccessControlClient();

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', check.userId)
      .single();

    if (userError || !userData) {
      return error(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        userError
      );
    }

    const userRole = userData.role as UserRole;

    // Super admins can access all groups
    if (userRole === 'super_admin') {
      return success({ canAccess: true, role: userRole });
    }

    // Check if user is a group member with owner role
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('user_id', check.userId)
      .eq('group_id', check.groupId)
      .single();

    if (memberError || !memberData) {
      return success({ canAccess: false, role: userRole });
    }

    const canAccess = memberData.role === 'owner';
    return success({ canAccess, role: userRole });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Checks if a user can perform an action on a resource based on their role.
 * 
 * Role hierarchy:
 * - super_admin: Can perform all actions on all resources
 * - host: Can perform all actions on wedding-related resources
 * - guest: Can only read and update their own information
 * 
 * @param check - Permission check parameters
 * @returns Result indicating if action is allowed
 * 
 * @example
 * const result = await accessControlService.canPerformAction({
 *   userId: 'user-123',
 *   role: 'host',
 *   resource: 'guests',
 *   action: 'create'
 * });
 */
export async function canPerformAction(
  check: PermissionCheck
): Promise<Result<{ allowed: boolean }>> {
  try {
    const { role, resource, action } = check;

    // Super admins can do everything
    if (role === 'super_admin') {
      return success({ allowed: true });
    }

    // Hosts can manage wedding resources
    if (role === 'host') {
      const hostResources = [
        'guests',
        'events',
        'activities',
        'rsvps',
        'vendors',
        'accommodations',
        'photos',
        'emails',
        'budget',
        'transportation',
      ];

      if (hostResources.includes(resource)) {
        return success({ allowed: true });
      }

      return success({ allowed: false });
    }

    // Guests have limited permissions
    if (role === 'guest') {
      // Guests can read public information
      if (action === 'read') {
        const publicResources = [
          'events',
          'activities',
          'accommodations',
          'photos',
        ];
        if (publicResources.includes(resource)) {
          return success({ allowed: true });
        }
      }

      // Guests can update their own information
      if (action === 'update' && resource === 'guests') {
        // Additional check needed to verify it's their own record
        return success({ allowed: true });
      }

      // Guests can create RSVPs
      if (action === 'create' && resource === 'rsvps') {
        return success({ allowed: true });
      }

      // Guests can upload photos
      if (action === 'create' && resource === 'photos') {
        return success({ allowed: true });
      }

      return success({ allowed: false });
    }

    return success({ allowed: false });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Requires that a user has a specific role, returning an error if not.
 * 
 * @param userId - User ID to check
 * @param requiredRole - Required role
 * @returns Result with success if user has role, error otherwise
 * 
 * @example
 * const result = await accessControlService.requireRole('user-123', 'super_admin');
 * if (!result.success) {
 *   return result; // Return error to caller
 * }
 */
export async function requireRole(
  userId: string,
  requiredRole: UserRole
): Promise<Result<{ userRole: UserRole }>> {
  const result = await hasRole(userId, requiredRole);

  if (!result.success) {
    return result;
  }

  if (!result.data.hasRole) {
    return error(
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      `User does not have required role: ${requiredRole}`,
      { userRole: result.data.userRole, requiredRole }
    );
  }

  return success({ userRole: result.data.userRole });
}

/**
 * Requires that a user has any of the specified roles.
 * 
 * @param userId - User ID to check
 * @param allowedRoles - Array of allowed roles
 * @returns Result with success if user has any role, error otherwise
 * 
 * @example
 * const result = await accessControlService.requireAnyRole('user-123', ['super_admin', 'host']);
 */
export async function requireAnyRole(
  userId: string,
  allowedRoles: UserRole[]
): Promise<Result<{ userRole: UserRole }>> {
  const result = await hasAnyRole(userId, allowedRoles);

  if (!result.success) {
    return result;
  }

  if (!result.data.hasRole) {
    return error(
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      `User does not have any of the required roles: ${allowedRoles.join(', ')}`,
      { userRole: result.data.userRole, allowedRoles }
    );
  }

  return success({ userRole: result.data.userRole });
}

/**
 * Requires that a user can access a specific group.
 * 
 * @param check - User ID and group ID to check
 * @returns Result with success if user can access, error otherwise
 */
export async function requireGroupAccess(
  check: GroupAccessCheck
): Promise<Result<{ role: UserRole }>> {
  const result = await canAccessGroup(check);

  if (!result.success) {
    return result;
  }

  if (!result.data.canAccess) {
    return error(
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      'User does not have access to this group',
      { userId: check.userId, groupId: check.groupId }
    );
  }

  return success({ role: result.data.role });
}

/**
 * Gets all groups that a user can access.
 * 
 * @param userId - User ID
 * @returns Result containing array of accessible group IDs
 * 
 * @example
 * const result = await accessControlService.getUserGroups('user-123');
 * if (result.success) {
 *   console.log('User can access groups:', result.data.groupIds);
 * }
 */
export async function getUserGroups(
  userId: string
): Promise<Result<{ groupIds: string[]; role: UserRole }>> {
  try {
    const supabase = createAccessControlClient();

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return error(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        userError
      );
    }

    const userRole = userData.role as UserRole;

    // Super admins can access all groups
    if (userRole === 'super_admin') {
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id');

      if (groupsError) {
        return error(
          ERROR_CODES.DATABASE_ERROR,
          'Failed to fetch groups',
          groupsError
        );
      }

      const groupIds = allGroups?.map(g => g.id) || [];
      return success({ groupIds, role: userRole });
    }

    // Get groups where user is an owner
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('role', 'owner');

    if (memberError) {
      return error(
        ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch user groups',
        memberError
      );
    }

    const groupIds = memberGroups?.map(m => m.group_id) || [];
    return success({ groupIds, role: userRole });
  } catch (err) {
    return unknownError(err);
  }
}
