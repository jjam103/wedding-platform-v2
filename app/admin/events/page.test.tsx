import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsPage from './page';
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

// Mock DataTable components
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, loading, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div 
            key={index} 
            data-testid={`event-row-${item.id}`}
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
        ))}
      </div>
    );
  },
}));

jest.mock('@/components/ui/DataTableWithSuspense', () => ({
  DataTableWithSuspense: ({ data, columns, loading, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div 
            key={index} 
            data-testid={`event-row-${item.id}`}
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
        ))}
      </div>
    );
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('EventsPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockEvents = [
    {
      id: 'event-1',
      name: 'Wedding Ceremony',
      eventType: 'ceremony',
      startDate: '2025-06-15T14:00:00Z',
      endDate: null,
      locationId: 'location-1',
      status: 'published',
      description: 'Beautiful beach ceremony',
      rsvpRequired: true,
      rsvpDeadline: '2025-06-01T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'event-2',
      name: 'Reception',
      eventType: 'reception',
      startDate: '2025-06-15T18:00:00Z',
      endDate: null,
      locationId: 'location-2',
      status: 'draft',
      description: 'Evening reception',
      rsvpRequired: false,
      rsvpDeadline: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockLocations = [
    { id: 'location-1', name: 'Beach Venue', parentLocationId: null },
    { id: 'location-2', name: 'Hotel Ballroom', parentLocationId: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
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

  describe('Event creation with collapsible form', () => {
    it('should display collapsible form when Add Event button is clicked', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });
    });

    it('should create event with collapsible form', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'event-3',
          name: 'New Event',
          eventType: 'ceremony',
          startDate: '2025-07-01T10:00:00Z',
          locationId: 'location-1',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/events') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createResponse),
          });
        }
        if (url.includes('/api/admin/events') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { events: [...mockEvents, createResponse.data] },
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

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });

      // Fill required form fields
      const nameInput = screen.getByLabelText(/event name/i);
      fireEvent.change(nameInput, { target: { value: 'New Event' } });

      const eventTypeSelect = screen.getByLabelText(/event type/i);
      fireEvent.change(eventTypeSelect, { target: { value: 'ceremony' } });

      const startDateInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startDateInput, { target: { value: '2025-07-01T10:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/events',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it.skip('should close form and clear fields after successful creation', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'event-3',
          name: 'New Event',
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/events') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createResponse),
          });
        }
        if (url.includes('/api/admin/events') && !options) {
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

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });

      // Fill required form fields
      const nameInput = screen.getByLabelText(/event name/i);
      fireEvent.change(nameInput, { target: { value: 'New Event' } });

      const eventTypeSelect = screen.getByLabelText(/event type/i);
      fireEvent.change(eventTypeSelect, { target: { value: 'ceremony' } });

      const startDateInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startDateInput, { target: { value: '2025-07-01T10:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Form should close after successful creation
      await waitFor(() => {
        expect(screen.queryByText('Add New Event')).not.toBeInTheDocument();
      });
    });
  });

  describe('Location selection', () => {
    it.skip('should display LocationSelector in the form', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/select event location/i)).toBeInTheDocument();
      });
    });

    it('should populate location selector with locations', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Verify locations were fetched
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/locations');
    });
  });

  describe('Section editor integration', () => {
    it('should display Manage Sections button for each event', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      expect(manageSectionsButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to section editor when Manage Sections is clicked', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      fireEvent.click(manageSectionsButtons[0]);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/events/event-1/sections');
    });
  });

  describe('Conflict detection', () => {
    it.skip('should display conflict error when scheduling conflict occurs', async () => {
      const conflictResponse = {
        success: false,
        error: {
          code: 'SCHEDULING_CONFLICT',
          message: 'Event conflicts with existing events',
          details: [
            {
              id: 'event-1',
              name: 'Wedding Ceremony',
              startDate: '2025-06-15T14:00:00Z',
              endDate: null,
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/events') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(conflictResponse),
          });
        }
        if (url.includes('/api/admin/events') && !options) {
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

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });

      // Fill required form fields
      const nameInput = screen.getByLabelText(/event name/i);
      fireEvent.change(nameInput, { target: { value: 'Conflicting Event' } });

      const eventTypeSelect = screen.getByLabelText(/event type/i);
      fireEvent.change(eventTypeSelect, { target: { value: 'ceremony' } });

      const startDateInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startDateInput, { target: { value: '2025-06-15T14:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Should display conflict error
      await waitFor(() => {
        expect(screen.getByText(/scheduling conflict/i)).toBeInTheDocument();
      });
    });

    it.skip('should clear conflict error when form is reopened', async () => {
      const conflictResponse = {
        success: false,
        error: {
          code: 'SCHEDULING_CONFLICT',
          message: 'Event conflicts with existing events',
          details: [
            {
              id: 'event-1',
              name: 'Wedding Ceremony',
              startDate: '2025-06-15T14:00:00Z',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/events') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(conflictResponse),
          });
        }
        if (url.includes('/api/admin/events') && !options) {
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

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /event management/i })).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new event/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });

      // Fill required form fields
      const nameInput = screen.getByLabelText(/event name/i);
      fireEvent.change(nameInput, { target: { value: 'Conflicting Event' } });

      const eventTypeSelect = screen.getByLabelText(/event type/i);
      fireEvent.change(eventTypeSelect, { target: { value: 'ceremony' } });

      const startDateInput = screen.getByLabelText(/start date & time/i);
      fireEvent.change(startDateInput, { target: { value: '2025-06-15T14:00' } });

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      // Submit form to trigger conflict
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/scheduling conflict/i)).toBeInTheDocument();
      });

      // Close and reopen form
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/scheduling conflict/i)).not.toBeInTheDocument();
      });

      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.queryByText(/scheduling conflict/i)).not.toBeInTheDocument();
      });
    });
  });
});
