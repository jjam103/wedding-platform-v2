/**
 * Unit Tests: SettingsForm - Auth Method Configuration
 * 
 * Tests the auth method configuration section of the SettingsForm component
 * 
 * Requirements: 22.1, 22.2
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SettingsForm from './SettingsForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SettingsForm - Auth Method Configuration', () => {
  const mockRouter = {
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: {} }),
    });
  });

  it('should render auth method dropdown with default value', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    const authMethodSelect = screen.getByLabelText('Default Authentication Method');
    expect(authMethodSelect).toBeInTheDocument();
    expect(authMethodSelect).toHaveValue('email_matching');
  });

  it('should render auth method dropdown with magic_link value', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'magic_link' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    const authMethodSelect = screen.getByLabelText('Default Authentication Method');
    expect(authMethodSelect).toHaveValue('magic_link');
  });

  it('should display email matching description when email_matching is selected', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    expect(
      screen.getByText(/Guests log in by entering their email address/i)
    ).toBeInTheDocument();
  });

  it('should display magic link description when magic_link is selected', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'magic_link' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    expect(
      screen.getByText(/Guests request a one-time login link/i)
    ).toBeInTheDocument();
  });

  it('should update description when auth method is changed', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    // Initially shows email matching description
    expect(
      screen.getByText(/Guests log in by entering their email address/i)
    ).toBeInTheDocument();

    // Change to magic link
    const authMethodSelect = screen.getByLabelText('Default Authentication Method');
    fireEvent.change(authMethodSelect, { target: { value: 'magic_link' } });

    // Should now show magic link description
    expect(
      screen.getByText(/Guests request a one-time login link/i)
    ).toBeInTheDocument();
  });

  it('should display authentication methods info box', () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    expect(screen.getByText('Authentication Methods')).toBeInTheDocument();
    expect(screen.getByText(/Email Matching:/)).toBeInTheDocument();
    expect(screen.getByText(/Magic Link:/)).toBeInTheDocument();
    expect(
      screen.getByText(/You can override the authentication method for individual guests/i)
    ).toBeInTheDocument();
  });

  it('should include default_auth_method in form submission', async () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    // Change auth method
    const authMethodSelect = screen.getByLabelText('Default Authentication Method');
    fireEvent.change(authMethodSelect, { target: { value: 'magic_link' } });

    // Submit form
    const submitButton = screen.getByText('Save Settings');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"default_auth_method":"magic_link"'),
        })
      );
    });
  });

  it('should display success toast after successful save', async () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { default_auth_method: 'magic_link' } }),
    });

    render(<SettingsForm initialSettings={initialSettings} />);

    // Submit form
    const submitButton = screen.getByText('Save Settings');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
    });
  });

  it('should display error toast on save failure', async () => {
    const initialSettings = {
      id: '1',
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Test Venue',
      couple_name_1: 'Person 1',
      couple_name_2: 'Person 2',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      default_auth_method: 'email_matching' as const,
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid auth method' },
      }),
    });

    render(<SettingsForm initialSettings={initialSettings} />);

    // Submit form
    const submitButton = screen.getByText('Save Settings');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid auth method')).toBeInTheDocument();
    });
  });
});
