/**
 * Comprehensive Unit Tests for SettingsForm Component
 * 
 * Tests:
 * - Form rendering and initial state
 * - Form submissions (success and error cases)
 * - Data loading states
 * - Error states and error handling
 * - User interactions (form inputs, toggles, etc.)
 * - Toast notifications
 * - Validation and edge cases
 * 
 * Requirements: Settings form functionality with comprehensive coverage
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SettingsForm from './SettingsForm';
import type { SystemSettings } from '@/schemas/settingsSchemas';

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SettingsForm', () => {
  const mockSettings: SystemSettings = {
    id: '1',
    wedding_date: '2024-06-15T00:00:00Z',
    venue_name: 'Costa Rica Beach Resort',
    couple_name_1: 'John',
    couple_name_2: 'Jane',
    timezone: 'America/Costa_Rica',
    send_rsvp_confirmations: true,
    send_activity_reminders: true,
    send_deadline_reminders: false,
    reminder_days_before: 5,
    require_photo_moderation: true,
    max_photos_per_guest: 15,
    allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
    home_page_title: 'Welcome',
    home_page_subtitle: 'Our Wedding',
    home_page_welcome_message: 'Join us for our special day',
    home_page_hero_image_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Form Rendering', () => {
    it('should render all form sections', () => {
      render(<SettingsForm initialSettings={null} />);

      expect(screen.getByText('Wedding Information')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Photo Gallery Settings')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<SettingsForm initialSettings={null} />);

      // Wedding Information fields
      expect(screen.getByLabelText(/wedding date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/couple name 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/couple name 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();

      // Email notification fields
      expect(screen.getByLabelText(/send rsvp confirmation emails/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send activity reminder emails/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send deadline reminder emails/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send reminders \(days before deadline\)/i)).toBeInTheDocument();

      // Photo gallery fields
      expect(screen.getByLabelText(/require photo moderation before publishing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum photos per guest/i)).toBeInTheDocument();
    });

    it('should populate form with initial settings', () => {
      render(<SettingsForm initialSettings={mockSettings} />);

      expect(screen.getByDisplayValue('2024-06-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Costa Rica Beach Resort')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });

    it('should show default values when no initial settings provided', () => {
      render(<SettingsForm initialSettings={null} />);

      expect(screen.getByDisplayValue('America/Costa_Rica')).toBeInTheDocument();
      expect(screen.getByDisplayValue('7')).toBeInTheDocument(); // Default reminder days
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // Default max photos
    });
  });

  describe('User Interactions', () => {
    it('should update text input values when user types', () => {
      render(<SettingsForm initialSettings={null} />);

      const venueInput = screen.getByLabelText(/venue name/i);
      fireEvent.change(venueInput, { target: { value: 'New Venue' } });
      
      expect(screen.getByDisplayValue('New Venue')).toBeInTheDocument();
    });

    it('should update date input when user selects date', () => {
      render(<SettingsForm initialSettings={null} />);

      const dateInput = screen.getByLabelText(/wedding date/i);
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      
      expect(screen.getByDisplayValue('2024-12-25')).toBeInTheDocument();
    });

    it('should toggle checkbox values when clicked', () => {
      render(<SettingsForm initialSettings={null} />);

      const rsvpCheckbox = screen.getByLabelText(/send rsvp confirmation emails/i);
      expect(rsvpCheckbox).toBeChecked(); // Default is true
      
      fireEvent.click(rsvpCheckbox);
      expect(rsvpCheckbox).not.toBeChecked();
      
      fireEvent.click(rsvpCheckbox);
      expect(rsvpCheckbox).toBeChecked();
    });

    it('should update number input values', () => {
      render(<SettingsForm initialSettings={null} />);

      const reminderDaysInput = screen.getByLabelText(/send reminders \(days before deadline\)/i);
      fireEvent.change(reminderDaysInput, { target: { value: '10' } });
      
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('should update select dropdown values', () => {
      render(<SettingsForm initialSettings={null} />);

      const timezoneSelect = screen.getByLabelText(/timezone/i);
      fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } });
      
      expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
    });
  });

  describe('Form Submissions', () => {
    it('should submit form with correct data on success', async () => {
      render(<SettingsForm initialSettings={null} />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/venue name/i), { 
        target: { value: 'Test Venue' } 
      });
      fireEvent.change(screen.getByLabelText(/couple name 1/i), { 
        target: { value: 'Alice' } 
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"venue_name":"Test Venue"'),
        });
      });
    });

    it('should show success toast on successful submission', async () => {
      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: false, 
          error: { message: 'Validation failed' } 
        }),
      });

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should handle API error without specific message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      );

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Save Settings')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable form during submission', async () => {
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      );

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      const venueInput = screen.getByLabelText(/venue name/i);

      fireEvent.click(submitButton);

      // Form should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(venueInput).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(venueInput).not.toBeDisabled();
      });
    });
  });

  describe('Error States', () => {
    it('should display error toast with proper styling', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorToast = screen.getByText('An unexpected error occurred');
        expect(errorToast).toBeInTheDocument();
        expect(errorToast.closest('div')).toHaveClass('bg-volcano-50', 'text-volcano-800');
      });
    });

    it('should display success toast with proper styling', async () => {
      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const successToast = screen.getByText('Settings saved successfully');
        expect(successToast).toBeInTheDocument();
        expect(successToast.closest('div')).toHaveClass('bg-jungle-50', 'text-jungle-800');
      });
    });

    it('should clear previous toast when new submission starts', async () => {
      // First submission fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });

      // Second submission succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      fireEvent.click(submitButton);

      // Previous error should be cleared
      expect(screen.queryByText('An unexpected error occurred')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle empty form submission', async () => {
      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"venue_name":null'),
        });
      });
    });

    it('should format date correctly for API', async () => {
      render(<SettingsForm initialSettings={null} />);

      const dateInput = screen.getByLabelText(/wedding date/i);
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"wedding_date":"2024-12-25T'),
        });
      });
    });

    it('should handle null date when no date selected', async () => {
      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"wedding_date":null'),
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<SettingsForm initialSettings={null} />);

      const venueInput = screen.getByLabelText(/venue name/i);
      const dateInput = screen.getByLabelText(/wedding date/i);
      const reminderInput = screen.getByLabelText(/send reminders \(days before deadline\)/i);

      expect(venueInput).toHaveAttribute('id');
      expect(dateInput).toHaveAttribute('id');
      expect(reminderInput).toHaveAttribute('id');
    });

    it('should have proper button accessibility', () => {
      render(<SettingsForm initialSettings={null} />);

      const submitButton = screen.getByRole('button', { name: /save settings/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have proper form structure', () => {
      render(<SettingsForm initialSettings={null} />);

      const form = screen.getByRole('form') || screen.getByTestId('settings-form') || document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large number inputs', () => {
      render(<SettingsForm initialSettings={null} />);

      const maxPhotosInput = screen.getByLabelText(/maximum photos per guest/i);
      fireEvent.change(maxPhotosInput, { target: { value: '999999' } });
      
      expect(screen.getByDisplayValue('999999')).toBeInTheDocument();
    });

    it('should handle negative number inputs', () => {
      render(<SettingsForm initialSettings={null} />);

      const reminderDaysInput = screen.getByLabelText(/send reminders \(days before deadline\)/i);
      fireEvent.change(reminderDaysInput, { target: { value: '-5' } });
      
      expect(screen.getByDisplayValue('-5')).toBeInTheDocument();
    });

    it('should handle special characters in text inputs', () => {
      render(<SettingsForm initialSettings={null} />);

      const venueInput = screen.getByLabelText(/venue name/i);
      fireEvent.change(venueInput, { target: { value: 'Café & Resort <script>' } });
      
      expect(screen.getByDisplayValue('Café & Resort <script>')).toBeInTheDocument();
    });

    it('should handle initial settings with null values', () => {
      const settingsWithNulls: SystemSettings = {
        ...mockSettings,
        venue_name: null,
        couple_name_1: null,
        couple_name_2: null,
        wedding_date: null,
      };

      render(<SettingsForm initialSettings={settingsWithNulls} />);

      // Check that venue name input is empty
      const venueInput = screen.getByLabelText(/venue name/i);
      expect(venueInput).toHaveValue('');
    });
  });
});