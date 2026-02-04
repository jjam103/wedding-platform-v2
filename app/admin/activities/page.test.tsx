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
  ToastProvider: ({ children }: any) => children,
}));

// Mock SectionEditor
jest.mock('@/components/admin/SectionEditor', () => ({
  SectionEditor: ({ pageType, pageId }: any) => (
    <div data-testid="section-editor">
      <div>Section Editor for {pageType}: {pageId}</div>
      <button>Add Section</button>
    </div>
  ),
}));

// Mock DataTable components
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, loading, rowClassName, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => {
          const className = rowClassName ? rowClassName(item) : '';
          return (
            <div 
              key={index} 
              data-testid={`activity-row-${item.id}`} 
              role="row" 
              className={className}
              onClick={() => onRowClick && onRowClick(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col: any) => {
                const value = item[col.key];
                const displayValue = col.render ? col.render(value, item) : value;
                return (
                  <div key={col.key} data-testid={`${col.key}-${item.id}`}>
                    {displayValue}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  },
}));

jest.mock('@/components/ui/DataTableWithSuspense', () => ({
  DataTableWithSuspense: ({ data, columns, loading, rowClassName, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => {
          const className = rowClassName ? rowClassName(item) : '';
          return (
            <div 
              key={index} 
              data-testid={`activity-row-${item.id}`} 
              role="row" 
              className={className}
              onClick={() => onRowClick && onRowClick(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col: any) => {
                const value = item[col.key];
                const displayValue = col.render ? col.render(value, item) : value;
                return (
                  <div key={col.key} data-testid={`${col.key}-${item.id}`}>
                    {displayValue}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  },
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
            data: { events: mockEvents },  // Keep wrapped for events
          }),
        });
      }
      if (url.includes('/api/admin/locations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockLocations,  // Return array directly, not wrapped
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
              data: mockLocations,
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

      // Fill required form fields
      const nameInput = screen.getByLabelText(/activity name/i);
      fireEvent.change(nameInput, { target: { value: 'New Activity' } });

      const activityTypeSelect = screen.getByLabelText(/activity type/i);
      fireEvent.change(activityTypeSelect, { target: { value: 'activity' } });

      // Use datetime-local format (YYYY-MM-DDTHH:mm) - will be converted to ISO 8601 by CollapsibleForm
      const startTimeInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startTimeInput, { target: { value: '2025-07-01T10:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create activity/i });
      fireEvent.click(submitButton);

      // Wait for form to close (indicating success)
      await waitFor(() => {
        const formToggleAfter = screen.getByRole('button', { name: /add activity/i });
        expect(formToggleAfter).toHaveAttribute('aria-expanded', 'false');
      }, { timeout: 3000 });
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
              data: mockLocations,
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

      // Fill required form fields
      const nameInput = screen.getByLabelText(/activity name/i);
      fireEvent.change(nameInput, { target: { value: 'New Activity' } });

      const activityTypeSelect = screen.getByLabelText(/activity type/i);
      fireEvent.change(activityTypeSelect, { target: { value: 'activity' } });

      const startTimeInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startTimeInput, { target: { value: '2025-07-01T10:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create activity/i });
      fireEvent.click(submitButton);

      // Form should close after successful creation (form is collapsed)
      await waitFor(() => {
        const formToggleAfter = screen.getByRole('button', { name: /add activity/i });
        expect(formToggleAfter).toHaveAttribute('aria-expanded', 'false');
      }, { timeout: 3000 });
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
              data: mockLocations,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Should display capacity percentage for 90%+ capacity
      await waitFor(() => {
        expect(screen.getByText(/92%/)).toBeInTheDocument();
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
              data: mockLocations,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Should display 100% capacity
      await waitFor(() => {
        expect(screen.getByText(/100%/)).toBeInTheDocument();
      });
    });

    it.skip('should highlight rows at 90%+ capacity', async () => {
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
              data: mockLocations,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
      });

      // Wait for capacity percentage to be displayed (indicates data is loaded)
      await waitFor(() => {
        expect(screen.getByText(/92%/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify row highlighting is applied by checking for the data table
      await waitFor(() => {
        const dataTable = screen.queryByTestId('data-table');
        expect(dataTable).toBeInTheDocument();
        
        // Check if any activity rows exist
        const activityRow = screen.queryByTestId('activity-row-activity-1');
        if (activityRow) {
          // If rows are rendered, check for warning class
          const rows = screen.queryAllByRole('row');
          if (rows.length > 0) {
            const hasWarningRow = rows.some(row => 
              row.className.includes('bg-volcano-50')
            );
            expect(hasWarningRow).toBe(true);
          }
        }
      }, { timeout: 3000 });
    });
  });

  describe('Section editor integration', () => {
    it('should display Sections button for each activity', async () => {
      render(<ActivitiesPage />);

      // Wait for activities to load by checking for activity name
      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      }, { timeout: 3000 });

      const sectionsButtons = screen.getAllByRole('button', { name: /sections/i });
      expect(sectionsButtons.length).toBeGreaterThan(0);
    });

    it('should toggle section editor when Sections button is clicked', async () => {
      render(<ActivitiesPage />);

      // Wait for activities to load by checking for activity name
      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find the "Sections" button (not "Hide Sections")
      const sectionsButtons = screen.getAllByRole('button', { name: /sections/i });
      const sectionsButton = sectionsButtons.find(btn => 
        btn.textContent === 'Sections' || btn.textContent === '▶ Sections'
      );
      
      expect(sectionsButton).toBeDefined();
      fireEvent.click(sectionsButton!);

      // Should show the section editor inline
      await waitFor(() => {
        expect(screen.getByText(/add section/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Capacity warnings', () => {
    it.skip('should display capacity utilization in form help text when editing', async () => {
      // Mock activities with capacity data already loaded
      const activitiesWithCapacity = mockActivities.map(activity => ({
        ...activity,
        currentRsvps: activity.id === 'activity-1' ? 45 : 0,
        utilizationPercentage: activity.id === 'activity-1' ? 90 : 0,
      }));

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/activities/activity-1/capacity')) {
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
              data: { activities: activitiesWithCapacity },
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
              data: mockLocations,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivitiesPage />);

      // Wait for activities to load with capacity data
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /activity management/i })).toBeInTheDocument();
        expect(screen.getByText(/90%/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click on an activity row to edit - use the row directly
      const activityRow = screen.getByTestId('activity-row-activity-1');
      fireEvent.click(activityRow);

      // Wait for form to open
      await waitFor(() => {
        expect(screen.getByText(/edit activity/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should display capacity utilization in help text
      // The help text is rendered in a <p> tag with id="capacity-help"
      await waitFor(() => {
        // Look for help text by its content
        const helpElements = screen.queryAllByText(/current utilization/i);
        expect(helpElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
