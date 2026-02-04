/**
 * Admin User Service
 * 
 * Handles admin user management including creation, updates, deactivation, and deletion.
 * Enforces owner-only permissions and last owner protection.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { createServiceRoleClient } from '@/lib/supabaseServer';
import { sanitizeInput } from '@/utils/sanitization';
import { z } from 'zod';
import type { Result } from '@/types';
import * as emailService from './emailService';

// Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'owner';
  status: 'active' | 'inactive';
  invitedBy?: string;
  invitedAt: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const createAdminUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'owner']),
});

const updateAdminUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'owner']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateAdminUserDTO = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserDTO = z.infer<typeof updateAdminUserSchema>;

/**
 * Create a new admin user
 * 
 * @param data - Admin user data
 * @param invitedBy - ID of the user creating this admin
 * @returns Result containing the created admin user or error
 */
export async function create(
  data: CreateAdminUserDTO,
  invitedBy: string
): Promise<Result<AdminUser>> {
  try {
    // 1. Validate
    const validation = createAdminUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid admin user data',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized = {
      ...validation.data,
      email: sanitizeInput(validation.data.email.toLowerCase()),
    };

    // 3. Check if email already exists
    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', sanitized.email)
      .single();

    if (existing) {
      return {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Admin user with this email already exists',
        },
      };
    }

    // 4. Create admin user
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .insert({
        email: sanitized.email,
        role: sanitized.role,
        invited_by: invitedBy,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    // 5. Send invitation email
    const inviteResult = await sendInvitationEmail(adminUser.email, adminUser.role);
    if (!inviteResult.success) {
      // Log error but don't fail the creation
      console.error('Failed to send invitation email:', inviteResult.error);
    }

    return { success: true, data: adminUser };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Get all admin users
 * 
 * @returns Result containing list of admin users or error
 */
export async function list(): Promise<Result<AdminUser[]>> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Get admin user by ID
 * 
 * @param id - Admin user ID
 * @returns Result containing admin user or error
 */
export async function get(id: string): Promise<Result<AdminUser>> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Update admin user
 * 
 * @param id - Admin user ID
 * @param data - Update data
 * @returns Result containing updated admin user or error
 */
export async function update(
  id: string,
  data: UpdateAdminUserDTO
): Promise<Result<AdminUser>> {
  try {
    // 1. Validate
    const validation = updateAdminUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized: any = {};
    if (validation.data.email) {
      sanitized.email = sanitizeInput(validation.data.email.toLowerCase());
    }
    if (validation.data.role) {
      sanitized.role = validation.data.role;
    }
    if (validation.data.status) {
      sanitized.status = validation.data.status;
    }

    // 3. Check if trying to deactivate last owner
    if (sanitized.status === 'inactive') {
      const isLastOwnerResult = await isLastOwner(id);
      if (!isLastOwnerResult.success) {
        return isLastOwnerResult as Result<AdminUser>;
      }
      if (isLastOwnerResult.data) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot deactivate the last owner account',
          },
        };
      }
    }

    // 4. Update admin user
    const supabase = createServiceRoleClient();
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: adminUser };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Deactivate admin user
 * 
 * @param id - Admin user ID
 * @returns Result containing deactivated admin user or error
 */
export async function deactivate(id: string): Promise<Result<AdminUser>> {
  return update(id, { status: 'inactive' });
}

/**
 * Delete admin user
 * 
 * @param id - Admin user ID
 * @returns Result indicating success or error
 */
export async function deleteUser(id: string): Promise<Result<void>> {
  try {
    // 1. Check if last owner
    const isLastOwnerResult = await isLastOwner(id);
    if (!isLastOwnerResult.success) {
      return isLastOwnerResult as Result<void>;
    }
    if (isLastOwnerResult.data) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete the last owner account',
        },
      };
    }

    // 2. Delete admin user
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Resend invitation email
 * 
 * @param id - Admin user ID
 * @returns Result indicating success or error
 */
export async function resendInvitation(id: string): Promise<Result<void>> {
  try {
    // 1. Get admin user
    const result = await get(id);
    if (!result.success) {
      return result as Result<void>;
    }

    // 2. Send invitation email
    const inviteResult = await sendInvitationEmail(result.data.email, result.data.role);
    if (!inviteResult.success) {
      return inviteResult as Result<void>;
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Update last login timestamp
 * 
 * @param id - Admin user ID
 * @returns Result indicating success or error
 */
export async function updateLastLogin(id: string): Promise<Result<void>> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Check if user is the last active owner
 * 
 * @param id - Admin user ID
 * @returns Result containing boolean indicating if last owner
 */
async function isLastOwner(id: string): Promise<Result<boolean>> {
  try {
    const supabase = createServiceRoleClient();
    
    // Get the user
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('role, status')
      .eq('id', id)
      .single();

    if (userError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: userError.message,
          details: userError,
        },
      };
    }

    // If not an owner, not the last owner
    if (user.role !== 'owner') {
      return { success: true, data: false };
    }

    // Count active owners
    const { count, error: countError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('status', 'active');

    if (countError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: countError.message,
          details: countError,
        },
      };
    }

    // If only 1 active owner, this is the last one
    return { success: true, data: (count || 0) <= 1 };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Send invitation email to new admin user
 * 
 * @param email - Admin user email
 * @param role - Admin user role
 * @returns Result indicating success or error
 */
async function sendInvitationEmail(
  email: string,
  role: 'admin' | 'owner'
): Promise<Result<void>> {
  try {
    const setupLink = `${process.env.NEXT_PUBLIC_URL}/auth/admin/setup`;
    
    const result = await emailService.sendEmail({
      to: email,
      subject: 'You\'ve been invited to manage the wedding',
      html: `
        <p>Hi,</p>
        <p>You've been invited to help manage the wedding website.</p>
        <p><strong>Your role:</strong> ${role === 'owner' ? 'Owner' : 'Admin'}</p>
        <p>Click here to set up your account: <a href="${setupLink}">${setupLink}</a></p>
        <p>This invitation expires in 7 days.</p>
      `,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'EMAIL_SERVICE_ERROR',
          message: 'Failed to send invitation email',
          details: result.error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export const adminUserService = {
  create,
  list,
  get,
  update,
  deactivate,
  delete: deleteUser,
  resendInvitation,
  updateLastLogin,
};
