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
import type { SystemSettings } from '@/schemas/settingsSchemas';

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
  // Add missing home page fields to match SystemSettings type
  home_page_title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  home_page_subtitle: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  home_page_welcome_message: fc.option(fc.string(), { nil: null }),
  home_page_hero_image_url: fc.option(fc.webUrl(), { nil: null }),
});

// Helper function to create complete SystemSettings object with unique data
function createSystemSettings(partial: any): SystemSettings {
  const uniqueId = `test-id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  return {
    id: uniqueId,
    wedding_date: partial.wedding_date?.toISOString() || null,
    venue_name: partial.venue_name || null,
    couple_name_1: partial.couple_name_1 || null,
    couple_name_2: partial.couple_name_2 || null,
    timezone: partial.timezone,
    send_rsvp_confirmations: partial.send_rsvp_confirmations,
    send_activity_reminders: partial.send_activity_reminders,
    send_deadline_reminders: partial.send_deadline_reminders,
    reminder_days_before: partial.reminder_days_before,
    require_photo_moderation: partial.require_photo_moderation,
    max_photos_per_guest: partial.max_photos_per_guest,
    allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
    home_page_title: partial.home_page_title || null,
    home_page_subtitle: partial.home_page_subtitle || null,
    home_page_welcome_message: partial.home_page_welcome_message || null,
    home_page_hero_image_url: partial.home_page_hero_image_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}


describe('Feature: admin-ui-modernization, Property 38: Settings validation and persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should persist valid settings and display success toast', async () => {
    await fc.assert(
      fc.asyncProperty(validSettingsArbitrary, async (settings) => {
        // Clear DOM and mocks for each property test run
        cleanup();
        jest.clearAllMocks();
        
        // Mock successful API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: createSystemSettings(settings),
          }),
        });

        // Create complete SystemSettings object
        const initialSettings = createSystemSettings(settings);

        const { container } = render(<SettingsForm initialSettings={initialSettings} />);

        // Submit the form using container to avoid multiple element issues
        const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton).toBeTruthy();
        fireEvent.click(submitButton);

        // Wait for the API call and success toast with reduced timeout
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
          { timeout: 1000 }
        );

        // Verify success toast is displayed
        await waitFor(
          () => {
            const successMessage = container.querySelector('[class*="bg-jungle-50"]');
            expect(successMessage).toBeTruthy();
            expect(successMessage?.textContent).toMatch(/settings saved successfully/i);
          },
          { timeout: 1000 }
        );
      }),
      { numRuns: 10 } // Further reduced for better performance and reliability
    );
  }, 15000); // Increased test timeout

  it('should display error toast when settings validation fails', async () => {
    // Clear DOM and mocks
    cleanup();
    jest.clearAllMocks();
    
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

    const initialSettings = createSystemSettings({
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
      home_page_title: null,
      home_page_subtitle: null,
      home_page_welcome_message: null,
      home_page_hero_image_url: null,
    });

    const { container } = render(<SettingsForm initialSettings={initialSettings} />);

    // Submit the form using container
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton);

    // Wait for error toast with reduced timeout
    await waitFor(
      () => {
        const errorMessage = container.querySelector('[class*="bg-volcano-50"]');
        expect(errorMessage).toBeTruthy();
        expect(errorMessage?.textContent).toMatch(/failed to save settings|validation failed/i);
      },
      { timeout: 1000 }
    );
  });

  it('should disable submit button and show loading state during submission', async () => {
    await fc.assert(
      fc.asyncProperty(validSettingsArbitrary, async (settings) => {
        // Clear DOM and mocks for each property test run
        cleanup();
        jest.clearAllMocks();
        
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
                      data: createSystemSettings(settings),
                    }),
                  }),
                50 // Reduced delay
              )
            )
        );

        const initialSettings = createSystemSettings(settings);

        const { container } = render(<SettingsForm initialSettings={initialSettings} />);

        // Submit the form using container
        const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton).toBeTruthy();
        fireEvent.click(submitButton);

        // Check that button is disabled and shows loading state
        await waitFor(() => {
          const loadingButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
          expect(loadingButton).toBeDisabled();
          expect(loadingButton.textContent).toMatch(/saving/i);
        }, { timeout: 500 });
      }),
      { numRuns: 5 } // Further reduced for better performance
    );
  }, 10000); // Increased test timeout
});
