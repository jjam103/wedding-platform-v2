import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivitiesPage from './page';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock('@/components/ui/ToastContext', () => ({
  useToast: () => ({
    addToast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ActivitiesPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockActivities = [
    {
      id: 'activity-1',
      name: 'Beach Day',
      activityType: 'activity',
      startTime: '2025-06-16T10:00:00Z',
      endTime: '2025-06-16T16:00:00Z',
      locationId: 'location-1',
      eventId: 'event-1',
      capacity: 50,
      status: 'published',
      description: 'Fun beach activities',
      costPerPerson: 25.00,
      hostSubsidy: 10.00,
      adultsOnly: false,
      plusOneAllowed: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'activity-2',
      name: 'Zip Line Adventure',
      activityType: 'activity',
      startTime: '2025-06-17T09:00:00Z',
      endTime: '2025-06-17T12:00:00Z',
      locationId: 'location-2',
      eventId: null,
      capacity: 20,
      status: 'draft',
      description: 'Thrilling zip line tour',
      costPerPerson: 75.00,
      hostSubsidy: 0,
      adultsOnly: true,
      plusOneAllowed: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockEvents = [
    { id: 'event-1', name: 'Wedding Weekend' },
    { id: 'event-2', name: 'Pre-Wedding Events' },
  ];

  const mockLocations = [
    { id: 'location-1', name: 'Beach Venue' },
    { id: 'location-2', name: 'Adventure Park' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
    
    // Default fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              currentAttendees: 45,
              utilizationPercentage: 90,
            },
          }),
        });
      }
      if (url.includes('/api/admin/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { activities: mockActivities },
          }),
        });
      }
      if (url.includes('/api/admin/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { events: mockEvents },
          }),
        });
      }
      if (url.includes('/api/admin/locations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { locations: mockLocations },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Activity creation with collapsible form', () => {
    it('should display collapsible form when opened', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Open form by clicking the toggle button
      const formToggle = screen.getByRole('button', { name: /add activity/i });
      fireEvent.click(formToggle);

      await waitFor(() => {
        expect(screen.getByText(/activity name/i)).toBeInTheDocument();
      });
    });

    it('should create activity with collapsible form', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'activity-3',
          name: 'New Activity',
          activityType: 'activity',
          startTime: '2025-07-01T10:00:00Z',
          locationId: 'location-1',
          status: 'draft',
        },
      };

      let postCalled = false;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/activities') && options?.method === 'POST') {
          postCalled = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createResponse),
          });
        }
        if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { currentAttendees: 0, utilizationPercentage: 0 },
            }),
          });
        }
        if (url.includes('/api/admin/activities') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { activities: [...mockActivities, createResponse.data] },
            }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
          });
        }
        if (url.includes('/api/admin/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { locations: mockLocations },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Open form
      const formToggle = screen.getByRole('button', { name: /add activity/i });
      fireEvent.click(formToggle);

      await waitFor(() => {
        expect(screen.getByText(/activity name/i)).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/activity name/i);
      fireEvent.change(nameInput, { target: { value: 'New Activity' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create activity/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(postCalled).toBe(true);
      });
    });

    it('should close form and clear fields after successful creation', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'activity-3',
          name: 'New Activity',
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/activities') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createResponse),
          });
        }
        if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { currentAttendees: 0, utilizationPercentage: 0 },
            }),
          });
        }
        if (url.includes('/api/admin/activities') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { activities: mockActivities },
            }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
          });
        }
        if (url.includes('/api/admin/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { locations: mockLocations },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Open form
      const formToggle = screen.getByRole('button', { name: /add activity/i });
      fireEvent.click(formToggle);

      await waitFor(() => {
        expect(screen.getByText(/activity name/i)).toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create activity/i });
      fireEvent.click(submitButton);

      // Form should close after successful creation (form is collapsed)
      await waitFor(() => {
        const formToggleAfter = screen.getByRole('button', { name: /add activity/i });
        expect(formToggleAfter).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Capacity tracking', () => {
    it('should display capacity information for activities', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Should display capacity with percentage
      await waitFor(() => {
        expect(screen.getAllByText(/45\/50/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/90%/).length).toBeGreaterThan(0);
      });
    });

    it('should display warning indicator for 90%+ capacity', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/activities/activity-1/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                currentAttendees: 46,
                utilizationPercentage: 92,
              },
            }),
          });
        }
        if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { currentAttendees: 0, utilizationPercentage: 0 },
            }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { activities: mockActivities },
            }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
          });
        }
        if (url.includes('/api/admin/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { locations: mockLocations },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Should display warning emoji for 90%+ capacity
      await waitFor(() => {
        const warningElements = screen.getAllByText(/⚠️/);
        expect(warningElements.length).toBeGreaterThan(0);
      });
    });

    it('should display alert indicator for 100% capacity', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/activities/activity-1/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                currentAttendees: 50,
                utilizationPercentage: 100,
              },
            }),
          });
        }
        if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { currentAttendees: 0, utilizationPercentage: 0 },
            }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { activities: mockActivities },
            }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
          });
        }
        if (url.includes('/api/admin/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { locations: mockLocations },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Should display alert emoji for 100% capacity
      await waitFor(() => {
        const alertElements = screen.getAllByText(/🔴/);
        expect(alertElements.length).toBeGreaterThan(0);
      });
    });

    it('should highlight rows at 90%+ capacity', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/activities/activity-1/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                currentAttendees: 46,
                utilizationPercentage: 92,
              },
            }),
          });
        }
        if (url.includes('/api/admin/activities/') && url.includes('/capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { currentAttendees: 0, utilizationPercentage: 0 },
            }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { activities: mockActivities },
            }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
          });
        }
        if (url.includes('/api/admin/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { locations: mockLocations },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Verify row highlighting is applied (via rowClassName prop)
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // At least one row should have the warning background class
        const hasWarningRow = rows.some(row => 
          row.className.includes('bg-volcano-50')
        );
        expect(hasWarningRow).toBe(true);
      });
    });
  });

  describe('Section editor integration', () => {
    it('should display Manage Sections button for each activity', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      expect(manageSectionsButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to section editor when Manage Sections is clicked', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      fireEvent.click(manageSectionsButtons[0]);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/activities/activity-1/sections');
    });
  });

  describe('Capacity warnings', () => {
    it('should display capacity utilization in form help text when editing', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Click on an activity row to edit - use getAllByText and click the first one in the table
      const activityRows = screen.getAllByText('Beach Day');
      // The first one should be in the table
      fireEvent.click(activityRows[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit activity/i)).toBeInTheDocument();
      });

      // Should display capacity utilization in help text
      await waitFor(() => {
        const helpText = screen.getByText(/current utilization/i);
        expect(helpText).toBeInTheDocument();
      });
    });
  });
});
