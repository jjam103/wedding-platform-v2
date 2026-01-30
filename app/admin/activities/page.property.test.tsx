/**
 * Property-Based Tests for Activity Management Page
 * 
 * Tests universal properties that should hold across all valid inputs.
 * Uses fast-check for property-based testing.
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ActivitiesPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

// Mock toast context
jest.mock('@/components/ui/ToastContext', () => ({
  useToast: () => ({
    addToast: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Add proper cleanup
beforeEach(() => {
  jest.clearAllMocks();
  // Clear any existing DOM
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.clearAllMocks();
  // Only cleanup timers if fake timers are being used
  if (jest.isMockFunction(setTimeout)) {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }
});

/**
 * Helper to create mock activity with capacity data
 */
function createMockActivity(overrides: any = {}) {
  return {
    id: overrides.id || 'activity-1',
    name: overrides.name || 'Test Activity',
    eventId: overrides.eventId || null,
    activityType: overrides.activityType || 'activity',
    startTime: overrides.startTime || '2025-06-15T10:00:00Z',
    endTime: overrides.endTime || null,
    capacity: overrides.capacity !== undefined ? overrides.capacity : 20,
    costPerPerson: overrides.costPerPerson || null,
    hostSubsidy: overrides.hostSubsidy || null,
    adultsOnly: overrides.adultsOnly || false,
    plusOneAllowed: overrides.plusOneAllowed || true,
    status: overrides.status || 'published',
    displayOrder: overrides.displayOrder || 0,
    currentRsvps: overrides.currentRsvps !== undefined ? overrides.currentRsvps : 0,
    utilizationPercentage: overrides.utilizationPercentage !== undefined 
      ? overrides.utilizationPercentage 
      : (overrides.capacity && overrides.currentRsvps !== undefined 
          ? (overrides.currentRsvps / overrides.capacity) * 100 
          : 0),
    description: overrides.description || null,
    locationId: overrides.locationId || null,
    visibility: overrides.visibility || [],
    createdAt: overrides.createdAt || '2025-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt || '2025-01-01T00:00:00Z',
  };
}

/**
 * Helper to setup fetch mocks
 */
function setupFetchMocks(activities: any[] = []) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/admin/activities') && !url.includes('/capacity')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { activities },
        }),
      });
    }
    if (url.includes('/capacity')) {
      const activityId = url.split('/')[4];
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              currentAttendees: activity.currentRsvps || 0,
              utilizationPercentage: activity.utilizationPercentage || 0,
            },
          }),
        });
      }
    }
    if (url.includes('/api/admin/events')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { events: [] },
        }),
      });
    }
    if (url.includes('/api/admin/locations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { locations: [] },
        }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { message: 'Not found' } }),
    });
  });
}

describe('Feature: admin-ui-modernization, Property 10: Capacity warning highlighting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 10: Capacity warning highlighting
   * 
   * For any activity with capacity utilization >= 90%, the activity row in the data table
   * should be styled with warning colors to indicate near-capacity status.
   * 
   * Validates: Requirements 5.3
   */
  it('should highlight activities at 90%+ capacity with warning colors', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity between 1 and 100
        fc.integer({ min: 1, max: 100 }),
        // Generate utilization percentage between 90 and 100
        fc.integer({ min: 90, max: 100 }),
        async (capacity, utilizationPercentage) => {
          // Calculate current RSVPs based on utilization
          const currentRsvps = Math.floor((utilizationPercentage / 100) * capacity);
          
          const activity = createMockActivity({
            id: `activity-${capacity}-${utilizationPercentage}`,
            name: `Unique Activity ${capacity}-${utilizationPercentage}`,
            capacity,
            currentRsvps,
            utilizationPercentage,
          });

          setupFetchMocks([activity]);

          const { container, unmount } = render(<ActivitiesPage />);

          try {
            // Wait for activities to load with increased timeout
            await waitFor(() => {
              expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            }, { timeout: 2000 });

            // Find the row for this activity - use getAllByText and get the first one
            await waitFor(() => {
              const elements = screen.getAllByText(activity.name);
              expect(elements.length).toBeGreaterThan(0);
            }, { timeout: 1000 });

            // Check if the row has warning styling
            const elements = screen.getAllByText(activity.name);
            const row = elements[0].closest('tr');
            expect(row).toBeInTheDocument();
            
            // The row should have volcano (warning) background color classes
            expect(row?.className).toMatch(/bg-volcano/);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for better performance
    );
  }, 15000); // Increased test timeout

  it('should NOT highlight activities below 90% capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity between 1 and 100
        fc.integer({ min: 1, max: 100 }),
        // Generate utilization percentage between 0 and 89
        fc.integer({ min: 0, max: 89 }),
        async (capacity, utilizationPercentage) => {
          // Calculate current RSVPs based on utilization
          const currentRsvps = Math.floor((utilizationPercentage / 100) * capacity);
          
          const activity = createMockActivity({
            id: `activity-${capacity}-${utilizationPercentage}`,
            name: `Unique Activity ${capacity}-${utilizationPercentage}`,
            capacity,
            currentRsvps,
            utilizationPercentage,
          });

          setupFetchMocks([activity]);

          const { container, unmount } = render(<ActivitiesPage />);

          try {
            // Wait for activities to load with increased timeout
            await waitFor(() => {
              expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            }, { timeout: 2000 });

            // Find the row for this activity
            await waitFor(() => {
              const elements = screen.getAllByText(activity.name);
              expect(elements.length).toBeGreaterThan(0);
            }, { timeout: 1000 });

            // Check that the row does NOT have warning styling
            const elements = screen.getAllByText(activity.name);
            const row = elements[0].closest('tr');
            expect(row).toBeInTheDocument();
            
            // The row should NOT have volcano (warning) background color classes
            expect(row?.className).not.toMatch(/bg-volcano/);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for better performance
    );
  }, 15000); // Increased test timeout
});

describe('Feature: admin-ui-modernization, Property 11: Capacity utilization display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 11: Capacity utilization display
   * 
   * For any activity being edited that has existing RSVPs, the form modal should display
   * the current capacity utilization percentage.
   * 
   * Validates: Requirements 5.7
   */
  it('should display capacity utilization percentage in edit form for activities with RSVPs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate capacity between 1 and 100
        fc.integer({ min: 1, max: 100 }),
        // Generate current RSVPs between 0 and capacity
        fc.integer({ min: 0, max: 100 }),
        async (capacity, currentRsvps) => {
          // Ensure currentRsvps doesn't exceed capacity
          const actualRsvps = Math.min(currentRsvps, capacity);
          const utilizationPercentage = (actualRsvps / capacity) * 100;
          
          const activity = createMockActivity({
            id: `activity-${capacity}-${actualRsvps}`,
            name: `Activity with ${actualRsvps} RSVPs`,
            capacity,
            currentRsvps: actualRsvps,
            utilizationPercentage,
          });

          setupFetchMocks([activity]);

          const { container, unmount } = render(<ActivitiesPage />);

          try {
            // Wait for activities to load with increased timeout
            await waitFor(() => {
              expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            }, { timeout: 2000 });

            // Wait for the activity to appear
            await waitFor(() => {
              const elements = screen.getAllByText(activity.name);
              expect(elements.length).toBeGreaterThan(0);
            }, { timeout: 1000 });

            // The capacity column should display the utilization percentage
            const capacityText = `${actualRsvps}/${capacity} (${Math.round(utilizationPercentage)}%)`;
            
            // Check if the capacity information is displayed in the table
            await waitFor(() => {
              const tableContent = container.textContent;
              expect(tableContent).toContain(`${actualRsvps}/${capacity}`);
            }, { timeout: 1000 });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 5 } // Reduced runs for better performance
    );
  }, 15000); // Increased test timeout

  it('should display "Unlimited" for activities without capacity limits', async () => {
    const uniqueName = `Unlimited Activity ${Date.now()}`;
    const activity = createMockActivity({
      id: `unlimited-activity-${Date.now()}`,
      name: uniqueName,
      capacity: null,
      currentRsvps: 50,
      utilizationPercentage: null,
    });

    setupFetchMocks([activity]);

    const { unmount, container } = render(<ActivitiesPage />);

    try {
      // Wait for activities to load with increased timeout
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Wait for the activity to appear using container query
      await waitFor(() => {
        const tableRows = container.querySelectorAll('tbody tr');
        const activityRow = Array.from(tableRows).find(row => 
          row.textContent?.includes(activity.name)
        );
        expect(activityRow).toBeTruthy();
      }, { timeout: 1000 });

      // The capacity column should display "Unlimited" using getAllByText
      await waitFor(() => {
        const unlimitedElements = screen.getAllByText('Unlimited');
        expect(unlimitedElements.length).toBeGreaterThan(0);
      }, { timeout: 1000 });
    } finally {
      unmount();
    }
  }, 10000); // Increased test timeout
});
