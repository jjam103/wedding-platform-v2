/**
 * Property Tests for Settings Page
 * 
 * Feature: admin-ui-modernization, Property 38: Settings validation and persistence
 * Validates: Requirements 20.5
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import SettingsForm from '@/components/admin/SettingsForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Arbitraries for property-based testing
const validDateArbitrary = fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') });

const validSettingsArbitrary = fc.record({
  wedding_date: fc.option(validDateArbitrary, { nil: null }),
  venue_name: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  couple_name_1: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  couple_name_2: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  timezone: fc.constantFrom(
    'America/Costa_Rica',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo'
  ),
  send_rsvp_confirmations: fc.boolean(),
  send_activity_reminders: fc.boolean(),
  send_deadline_reminders: fc.boolean(),
  reminder_days_before: fc.integer({ min: 1, max: 30 }),
  require_photo_moderation: fc.boolean(),
  max_photos_per_guest: fc.integer({ min: 1, max: 100 }),
});


describe('Feature: admin-ui-modernization, Property 38: Settings validation and persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist valid settings and display success toast', async () => {
    await fc.assert(
      fc.asyncProperty(validSettingsArbitrary, async (settings) => {
        // Clean up any previous renders
        cleanup();
        
        // Mock successful API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'test-id',
              ...settings,
              wedding_date: settings.wedding_date?.toISOString() || null,
              allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });

        // Render form with initial settings
        const initialSettings = {
          id: 'test-id',
          wedding_date: settings.wedding_date?.toISOString() || null,
          venue_name: settings.venue_name || null,
          couple_name_1: settings.couple_name_1 || null,
          couple_name_2: settings.couple_name_2 || null,
          timezone: settings.timezone,
          send_rsvp_confirmations: settings.send_rsvp_confirmations,
          send_activity_reminders: settings.send_activity_reminders,
          send_deadline_reminders: settings.send_deadline_reminders,
          reminder_days_before: settings.reminder_days_before,
          require_photo_moderation: settings.require_photo_moderation,
          max_photos_per_guest: settings.max_photos_per_guest,
          allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        render(<SettingsForm initialSettings={initialSettings} />);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /save settings/i });
        fireEvent.click(submitButton);

        // Wait for the API call and success toast
        await waitFor(
          () => {
            expect(global.fetch).toHaveBeenCalledWith(
              '/api/admin/settings',
              expect.objectContaining({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              })
            );
          },
          { timeout: 3000 }
        );

        // Verify success toast is displayed
        await waitFor(
          () => {
            const successMessage = screen.queryByText(/settings saved successfully/i);
            expect(successMessage).toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should display error toast when settings validation fails', async () => {
    // Mock validation error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['reminder_days_before'], message: 'Must be between 1 and 30' }],
        },
      }),
    });

    const initialSettings = {
      id: 'test-id',
      wedding_date: null,
      venue_name: null,
      couple_name_1: null,
      couple_name_2: null,
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      send_activity_reminders: true,
      send_deadline_reminders: true,
      reminder_days_before: 7,
      require_photo_moderation: true,
      max_photos_per_guest: 20,
      allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<SettingsForm initialSettings={initialSettings} />);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(submitButton);

    // Wait for error toast
    await waitFor(
      () => {
        const errorMessage = screen.queryByText(/failed to save settings|validation failed/i);
        expect(errorMessage).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should disable submit button and show loading state during submission', async () => {
    await fc.assert(
      fc.asyncProperty(validSettingsArbitrary, async (settings) => {
        // Clean up any previous renders
        cleanup();
        
        // Mock delayed API response
        (global.fetch as jest.Mock).mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => ({
                      success: true,
                      data: {
                        id: 'test-id',
                        ...settings,
                        wedding_date: settings.wedding_date?.toISOString() || null,
                        allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                    }),
                  }),
                100
              )
            )
        );

        const initialSettings = {
          id: 'test-id',
          wedding_date: settings.wedding_date?.toISOString() || null,
          venue_name: settings.venue_name || null,
          couple_name_1: settings.couple_name_1 || null,
          couple_name_2: settings.couple_name_2 || null,
          timezone: settings.timezone,
          send_rsvp_confirmations: settings.send_rsvp_confirmations,
          send_activity_reminders: settings.send_activity_reminders,
          send_deadline_reminders: settings.send_deadline_reminders,
          reminder_days_before: settings.reminder_days_before,
          require_photo_moderation: settings.require_photo_moderation,
          max_photos_per_guest: settings.max_photos_per_guest,
          allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        render(<SettingsForm initialSettings={initialSettings} />);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /save settings/i });
        fireEvent.click(submitButton);

        // Check that button is disabled and shows loading state
        await waitFor(() => {
          const loadingButton = screen.getByRole('button', { name: /saving/i });
          expect(loadingButton).toBeDisabled();
        });
      }),
      { numRuns: 50 } // Fewer runs for async tests
    );
  });
});
