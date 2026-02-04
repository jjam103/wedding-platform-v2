'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { AdminUser } from '@/services/adminUserService';

interface AdminUserManagerProps {
  currentUserId: string;
  currentUserRole: 'admin' | 'owner';
}

interface AdminUserFormData {
  email: string;
  role: 'admin' | 'owner';
}

export function AdminUserManager({ currentUserId, currentUserRole }: AdminUserManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<AdminUserFormData>({
    email: '',
    role: 'admin',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const { addToast } = useToast();

  // Fetch admin users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admin-users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load admin users',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load admin users',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter an email address',
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingUser
        ? `/api/admin/admin-users/${editingUser.id}`
        : '/api/admin/admin-users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: editingUser
            ? 'Admin user updated successfully'
            : 'Admin user created and invitation sent',
        });
        setShowForm(false);
        setEditingUser(null);
        setFormData({ email: '', role: 'admin' });
        fetchUsers();
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to save admin user',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to save admin user',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (user: AdminUser) => {
    if (currentUserRole !== 'owner') {
      addToast({
        type: 'error',
        message: 'Only owners can edit admin users',
      });
      return;
    }

    setEditingUser(user);
    setFormData({
      email: user.email,
      role: user.role,
    });
    setShowForm(true);
  };

  // Handle deactivate
  const handleDeactivate = (user: AdminUser) => {
    if (currentUserRole !== 'owner') {
      addToast({
        type: 'error',
        message: 'Only owners can deactivate admin users',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate Admin User',
      message: `Are you sure you want to deactivate ${user.email}? They will no longer be able to log in.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/admin-users/${user.id}/deactivate`, {
            method: 'POST',
          });

          const result = await response.json();

          if (result.success) {
            addToast({
              type: 'success',
              message: 'Admin user deactivated successfully',
            });
            fetchUsers();
          } else {
            addToast({
              type: 'error',
              message: result.error?.message || 'Failed to deactivate admin user',
            });
          }
        } catch (error) {
          addToast({
            type: 'error',
            message: 'Failed to deactivate admin user',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Handle delete
  const handleDelete = (user: AdminUser) => {
    if (currentUserRole !== 'owner') {
      addToast({
        type: 'error',
        message: 'Only owners can delete admin users',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Admin User',
      message: `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/admin-users/${user.id}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (result.success) {
            addToast({
              type: 'success',
              message: 'Admin user deleted successfully',
            });
            fetchUsers();
          } else {
            addToast({
              type: 'error',
              message: result.error?.message || 'Failed to delete admin user',
            });
          }
        } catch (error) {
          addToast({
            type: 'error',
            message: 'Failed to delete admin user',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Handle resend invitation
  const handleResendInvitation = async (user: AdminUser) => {
    try {
      const response = await fetch(`/api/admin/admin-users/${user.id}/invite`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Invitation email sent successfully',
        });
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to send invitation',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to send invitation',
      });
    }
  };

  // Table columns
  const columns = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user: AdminUser) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'owner'
              ? 'bg-jungle-100 text-jungle-800'
              : 'bg-sage-100 text-sage-800'
          }`}
        >
          {user.role === 'owner' ? 'Owner' : 'Admin'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user: AdminUser) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      sortable: true,
      render: (user: AdminUser) =>
        user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleDateString()
          : 'Never',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex gap-2">
          {currentUserRole === 'owner' && user.id !== currentUserId && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(user)}
                aria-label="Edit user"
              >
                Edit
              </Button>
              {user.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeactivate(user)}
                  aria-label="Deactivate user"
                >
                  Deactivate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(user)}
                className="text-red-600 hover:text-red-700"
                aria-label="Delete user"
              >
                Delete
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResendInvitation(user)}
            aria-label="Resend invitation"
          >
            Resend Invite
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-sage-900">Admin Users</h2>
          <p className="text-sage-600 mt-1">
            Manage admin users who can access the admin dashboard
          </p>
        </div>
        {currentUserRole === 'owner' && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: '', role: 'admin' });
              setShowForm(true);
            }}
          >
            Add Admin User
          </Button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-sage-200">
              <h3 className="text-xl font-bold text-sage-900">
                {editingUser ? 'Edit Admin User' : 'Add Admin User'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-sage-700 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="mt-1 text-sm text-sage-500">
                    Email cannot be changed after creation
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-sage-700 mb-1"
                >
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'owner',
                    })
                  }
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <p className="mt-1 text-sm text-sage-500">
                  Owners have full access including user management
                </p>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-sage-200 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ email: '', role: 'admin' });
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Saving...
                  </>
                ) : editingUser ? (
                  'Update'
                ) : (
                  'Create & Send Invitation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jungle-500"></div>
          <p className="mt-2 text-sage-600">Loading admin users...</p>
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
