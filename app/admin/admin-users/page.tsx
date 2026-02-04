'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminUserManager } from '@/components/admin/AdminUserManager';
import { useToast } from '@/components/ui/ToastContext';

/**
 * Admin Users Management Page
 * 
 * Provides interface for managing admin users with role-based access control.
 * Features:
 * - Create/invite new admin users
 * - Update user roles (owner, admin, editor)
 * - Deactivate/reactivate users
 * - View audit logs
 * - Last owner protection
 * 
 * Uses existing AdminUserManager component with full CRUD functionality.
 */
export default function AdminUsersPage() {
  const { addToast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'owner'>('admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();
        
        if (result.success && result.data) {
          setCurrentUserId(result.data.user.id);
          // Fetch user role from admin_users table
          const roleResponse = await fetch(`/api/admin/admin-users/current`);
          const roleResult = await roleResponse.json();
          
          if (roleResult.success && roleResult.data) {
            setCurrentUserRole(roleResult.data.role);
          }
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: 'Failed to load user information',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchCurrentUser();
  }, [addToast]);

  if (loading) {
    return (
      <AdminLayout currentSection="admin-users">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-sage-900">Admin Users</h1>
            <p className="text-sage-600 mt-1">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="admin-users">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Admin Users</h1>
          <p className="text-sage-600 mt-1">
            Manage admin users and their permissions
          </p>
        </div>

        {/* Admin User Manager Component */}
        <AdminUserManager 
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </AdminLayout>
  );
}
