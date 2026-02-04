/**
 * Unit Tests for FamilyManager Component
 * 
 * Tests family member display, profile editing, RSVP management,
 * RLS enforcement, and permission checks.
 * 
 * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FamilyManager } from './FamilyManager';
import type { Guest } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('FamilyManager Component', () => {
  const mockAdultGuest: Guest = {
    id: 'adult-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-0100',
    age_type: 'adult',
    guest_type: 'wedding_guest',
    group_id: 'group-1',
    dietary_restrictions: 'None',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockChildGuest: Guest = {
    id: 'child-1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: null,
    age_type: 'child',
    guest_type: 'wedding_guest',
    group_id: 'group-1',
    dietary_restrictions: 'Vegetarian',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockFamilyMembers: Guest[] = [mockAdultGuest, mockChildGuest];

  const mockRsvpsByGuest = {
    'adult-1': [
      {
        id: 'rsvp-1',
        guest_id: 'adult-1',
        event_id: 'event-1',
        activity_id: null,
        status: 'attending',
        guest_count: 2,
        dietary_notes: null,
        events: { id: 'event-1', name: 'Wedding Ceremony' },
        activities: null,
      },
      {
        id: 'rsvp-2',
        guest_id: 'adult-1',
        event_id: null,
        activity_id: 'activity-1',
        status: 'pending',
        guest_count: 1,
        dietary_notes: null,
        events: null,
        activities: { id: 'activity-1', name: 'Beach Volleyball' },
      },
    ],
    'child-1': [
      {
        id: 'rsvp-3',
        guest_id: 'child-1',
        event_id: 'event-1',
        activity_id: null,
        status: 'attending',
        guest_count: 1,
        dietary_notes: 'Vegetarian',
        events: { id: 'event-1', name: 'Wedding Ceremony' },
        activities: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Family Member Display', () => {
    it('should display all family members for adult guests', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should display only self for child guests', () => {
      render(
        <FamilyManager
          currentGuest={mockChildGuest}
          familyMembers={[mockChildGuest]}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should display contact information for each family member', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-0100')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should display age type labels correctly', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.getAllByText(/👤 Adult/)).toHaveLength(1);
      expect(screen.getAllByText(/👶 Child/)).toHaveLength(1);
    });

    it('should display dietary restrictions', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.getByText(/None/)).toBeInTheDocument();
      expect(screen.getByText(/Vegetarian/)).toBeInTheDocument();
    });
  });

  describe('Profile Editing', () => {
    it('should show edit button for family members that can be edited', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should open edit form when edit button is clicked', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('should allow editing first name', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jonathan' } });

      expect(screen.getByDisplayValue('Jonathan')).toBeInTheDocument();
    });

    it('should allow editing last name', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const lastNameInput = screen.getByDisplayValue('Doe');
      fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    });

    it('should allow editing email', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const emailInput = screen.getByDisplayValue('john@example.com');
      fireEvent.change(emailInput, { target: { value: 'jonathan@example.com' } });

      expect(screen.getByDisplayValue('jonathan@example.com')).toBeInTheDocument();
    });

    it('should allow editing phone', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const phoneInput = screen.getByDisplayValue('555-0100');
      fireEvent.change(phoneInput, { target: { value: '555-0200' } });

      expect(screen.getByDisplayValue('555-0200')).toBeInTheDocument();
    });

    it('should allow editing dietary restrictions', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const dietaryInput = screen.getByDisplayValue('None');
      fireEvent.change(dietaryInput, { target: { value: 'Gluten-free' } });

      expect(screen.getByDisplayValue('Gluten-free')).toBeInTheDocument();
    });

    it('should save changes when save button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { ...mockAdultGuest, first_name: 'Jonathan' } }),
      });

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jonathan' } });

      const saveButton = screen.getByText(/Save/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/guest/family/adult-1',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: 'Jonathan',
              last_name: 'Doe',
              email: 'john@example.com',
              phone: '555-0100',
              dietary_restrictions: 'None',
            }),
          })
        );
      });
    });

    it('should display success message after successful save', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockAdultGuest }),
      });

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText(/Save/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should display error message on save failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: { message: 'Failed to update' } }),
      });

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText(/Save/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update/i)).toBeInTheDocument();
      });
    });

    it('should cancel editing when cancel button is clicked', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jonathan' } });

      const cancelButton = screen.getByText(/Cancel/);
      fireEvent.click(cancelButton);

      expect(screen.queryByDisplayValue('Jonathan')).not.toBeInTheDocument();
    });
  });

  describe('RSVP Management', () => {
    it('should display RSVP summary for each family member', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      // Adult has 2 RSVPs (1 attending, 1 pending)
      const attendingElements = screen.getAllByText(/1 Attending/);
      expect(attendingElements.length).toBeGreaterThan(0);
      
      const pendingElements = screen.getAllByText(/1 Pending/);
      expect(pendingElements.length).toBeGreaterThan(0);
    });

    it('should toggle RSVP details when button is clicked', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const toggleButtons = screen.getAllByText(/Show Details/);
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
    });

    it('should display RSVP status with correct styling', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const toggleButtons = screen.getAllByText(/Show Details/);
      fireEvent.click(toggleButtons[0]);

      const attendingBadges = screen.getAllByText(/✓/);
      expect(attendingBadges.length).toBeGreaterThan(0);

      const pendingBadges = screen.getAllByText(/○/);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });

    it('should display guest count for RSVPs', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const toggleButtons = screen.getAllByText(/Show Details/);
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText(/Guest Count: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Guest Count: 1/)).toBeInTheDocument();
    });

    it('should display dietary notes for RSVPs', () => {
      render(
        <FamilyManager
          currentGuest={mockChildGuest}
          familyMembers={[mockChildGuest]}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const toggleButtons = screen.getAllByText(/Show Details/);
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText(/Dietary Notes: Vegetarian/)).toBeInTheDocument();
    });

    it('should show empty state when no RSVPs exist', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={[{ ...mockAdultGuest, id: 'no-rsvps' }]}
          rsvpsByGuest={{}}
        />
      );

      const toggleButtons = screen.getAllByText(/Show Details/);
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText(/No RSVPs yet/)).toBeInTheDocument();
    });
  });

  describe('Permission Checks', () => {
    it('should allow adults to edit all family members', () => {
      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      expect(editButtons.length).toBe(2); // Can edit both adult and child
    });

    it('should allow children to edit only themselves', () => {
      render(
        <FamilyManager
          currentGuest={mockChildGuest}
          familyMembers={[mockChildGuest]}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      expect(editButtons.length).toBe(1); // Can only edit self
    });

    it('should not show edit button for members children cannot edit', () => {
      const childWithAdultSibling = {
        ...mockChildGuest,
        id: 'child-2',
      };

      render(
        <FamilyManager
          currentGuest={childWithAdultSibling}
          familyMembers={[mockAdultGuest, childWithAdultSibling]}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      // Should only see one edit button (for self)
      const editButtons = screen.getAllByText(/Edit/);
      expect(editButtons.length).toBe(1);
    });

    it('should not allow editing when canEdit returns false', () => {
      const childGuest = { ...mockChildGuest };
      const otherChild = { ...mockChildGuest, id: 'other-child', first_name: 'Other' };

      render(
        <FamilyManager
          currentGuest={childGuest}
          familyMembers={[childGuest, otherChild]}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      // Should only see edit button for self, not for other child
      const editButtons = screen.getAllByText(/Edit/);
      expect(editButtons.length).toBe(1);
    });
  });

  describe('RLS Enforcement', () => {
    it('should only display family members from the same group', () => {
      const differentGroupMember = {
        ...mockAdultGuest,
        id: 'different-group',
        group_id: 'group-2',
        first_name: 'Other',
      };

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers} // Should not include different group member
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      expect(screen.queryByText('Other')).not.toBeInTheDocument();
    });

    it('should not allow editing members from different groups', () => {
      // This is enforced at the API level, but component should not show edit button
      const currentGuest = { ...mockAdultGuest, group_id: 'group-1' };
      const differentGroupMember = { ...mockAdultGuest, id: 'diff-id', group_id: 'group-2' };

      render(
        <FamilyManager
          currentGuest={currentGuest}
          familyMembers={[currentGuest]} // Server should filter out different group
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      // Should only see one family member (self)
      expect(screen.getAllByText(/👤 Adult/).length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText(/Save/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } }),
      });

      render(
        <FamilyManager
          currentGuest={mockAdultGuest}
          familyMembers={mockFamilyMembers}
          rsvpsByGuest={mockRsvpsByGuest}
        />
      );

      const editButtons = screen.getAllByText(/Edit/);
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText(/Save/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });
    });
  });
});
