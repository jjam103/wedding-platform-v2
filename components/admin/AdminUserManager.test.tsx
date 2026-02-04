/**
 * Unit Tests: AdminUserManager Component
 * 
 * Tests user list display, forms, actions, and last owner protection UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminUserManager } from './AdminUserManager';
import * as adminUserService from '@/services/adminUserService';

// Mock the service
jest.mock('@/services/adminUserService');

describe('AdminUserManager', () => {
  const mockAdminUsers = [
    {
      id: '1',
      email: 'owner@example.com',
      role: 'owner' as const,
      status: 'active' as const,
      invited_by: null,
      invited_at: '2024-01-01T00:00:00Z',
      last_login_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'admin@example.com',
      role: 'admin' as const,
      status: 'active' as const,
      invited_by: '1',
      invited_at: '2024-01-05T00:00:00Z',
      last_login_at: '2024-01-14T15:30:00Z',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z',
    },
    {
      id: '3',
      email: 'inactive@example.com',
      role: 'admin' as const,
      status: 'inactive' as const,
      invited_by: '1',
      invited_at: '2024-01-10T00:00:00Z',
      last_login_at: null,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-12T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (adminUserService.list as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdminUsers,
    });
  });

  describe('User List Display', () => {
    it('should display list of admin users', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('inactive@example.com')).toBeInTheDocument();
      });
    });

    it('should display user roles', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        const ownerBadge = screen.getByText('Owner');
        const adminBadges = screen.getAllByText('Admin');
        
        expect(ownerBadge).toBeInTheDocument();
        expect(adminBadges).toHaveLength(2);
      });
    });

    it('should display user status', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active');
        const inactiveBadge = screen.getByText('Inactive');
        
        expect(activeBadges).toHaveLength(2);
        expect(inactiveBadge).toBeInTheDocument();
      });
    });

    it('should display last login timestamp', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
        expect(screen.getByText('Never')).toBeInTheDocument();
      });
    });

    it('should display loading state while fetching users', () => {
      (adminUserService.list as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AdminUserManager />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error message on fetch failure', async () => {
      (adminUserService.list as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch admin users',
        },
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch admin users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Add User Form', () => {
    it('should open add user form when "Add Admin User" button clicked', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add admin user/i });
      fireEvent.click(addButton);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /add admin user/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should create admin user with valid data', async () => {
      const user = userEvent.setup();
      (adminUserService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: '4',
          email: 'newadmin@example.com',
          role: 'admin',
          status: 'active',
          invited_by: '1',
          invited_at: new Date().toISOString(),
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /add admin user/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'newadmin@example.com');

      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'admin');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(adminUserService.create).toHaveBeenCalledWith({
          email: 'newadmin@example.com',
          role: 'admin',
          invitedBy: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/admin user created successfully/i)).toBeInTheDocument();
      });
    });

    it('should display error message on creation failure', async () => {
      const user = userEvent.setup();
      (adminUserService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email already exists',
        },
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /add admin user/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'existing@example.com');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit User', () => {
    it('should open edit form when edit button clicked', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const editButton = within(adminRow!).getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
    });

    it('should update admin user role', async () => {
      const user = userEvent.setup();
      (adminUserService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockAdminUsers[1], role: 'owner' },
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const editButton = within(adminRow!).getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'owner');

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(adminUserService.update).toHaveBeenCalledWith('2', {
          role: 'owner',
        });
      });
    });
  });

  describe('Deactivate User', () => {
    it('should deactivate admin user when deactivate button clicked', async () => {
      (adminUserService.deactivate as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockAdminUsers[1], status: 'inactive' },
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const deactivateButton = within(adminRow!).getByRole('button', { name: /deactivate/i });
      fireEvent.click(deactivateButton);

      // Confirm deactivation
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminUserService.deactivate).toHaveBeenCalledWith('2');
      });
    });

    it('should display confirmation dialog before deactivating', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const deactivateButton = within(adminRow!).getByRole('button', { name: /deactivate/i });
      fireEvent.click(deactivateButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Delete User', () => {
    it('should delete admin user when delete button clicked', async () => {
      (adminUserService.delete as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const deleteButton = within(adminRow!).getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminUserService.delete).toHaveBeenCalledWith('2');
      });
    });

    it('should display confirmation dialog before deleting', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const adminRow = screen.getByText('admin@example.com').closest('tr');
      const deleteButton = within(adminRow!).getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });
  });

  describe('Last Owner Protection', () => {
    it('should disable deactivate button for last owner', async () => {
      const singleOwner = [mockAdminUsers[0]]; // Only owner
      (adminUserService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: singleOwner,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      const ownerRow = screen.getByText('owner@example.com').closest('tr');
      const deactivateButton = within(ownerRow!).getByRole('button', { name: /deactivate/i });
      
      expect(deactivateButton).toBeDisabled();
    });

    it('should disable delete button for last owner', async () => {
      const singleOwner = [mockAdminUsers[0]]; // Only owner
      (adminUserService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: singleOwner,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      const ownerRow = screen.getByText('owner@example.com').closest('tr');
      const deleteButton = within(ownerRow!).getByRole('button', { name: /delete/i });
      
      expect(deleteButton).toBeDisabled();
    });

    it('should display tooltip explaining last owner protection', async () => {
      const singleOwner = [mockAdminUsers[0]]; // Only owner
      (adminUserService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: singleOwner,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      const ownerRow = screen.getByText('owner@example.com').closest('tr');
      const deactivateButton = within(ownerRow!).getByRole('button', { name: /deactivate/i });
      
      fireEvent.mouseOver(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText(/cannot deactivate the last owner/i)).toBeInTheDocument();
      });
    });

    it('should enable deactivate button when multiple owners exist', async () => {
      const multipleOwners = [
        mockAdminUsers[0],
        { ...mockAdminUsers[1], role: 'owner' as const },
      ];
      (adminUserService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: multipleOwners,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getAllByText('Owner')).toHaveLength(2);
      });

      const firstOwnerRow = screen.getByText('owner@example.com').closest('tr');
      const deactivateButton = within(firstOwnerRow!).getByRole('button', { name: /deactivate/i });
      
      expect(deactivateButton).not.toBeDisabled();
    });
  });

  describe('Resend Invitation', () => {
    it('should resend invitation email when button clicked', async () => {
      (adminUserService.resendInvitation as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('inactive@example.com')).toBeInTheDocument();
      });

      const inactiveRow = screen.getByText('inactive@example.com').closest('tr');
      const resendButton = within(inactiveRow!).getByRole('button', { name: /resend invitation/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(adminUserService.resendInvitation).toHaveBeenCalledWith('3');
      });

      await waitFor(() => {
        expect(screen.getByText(/invitation sent/i)).toBeInTheDocument();
      });
    });

    it('should only show resend button for inactive users', async () => {
      render(<AdminUserManager />);

      await waitFor(() => {
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      });

      const activeRow = screen.getByText('owner@example.com').closest('tr');
      expect(within(activeRow!).queryByRole('button', { name: /resend invitation/i })).not.toBeInTheDocument();

      const inactiveRow = screen.getByText('inactive@example.com').closest('tr');
      expect(within(inactiveRow!).getByRole('button', { name: /resend invitation/i })).toBeInTheDocument();
    });
  });
});
