import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RSVPManager } from './RSVPManager';
import { ToastProvider } from '@/components/ui/ToastContext';
import type { RSVPViewModel } from '@/services/rsvpManagementService';

// Mock fetch
global.fetch = jest.fn();

// Mock DataTable component
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, onSearch, onPageChange, onSelectionChange, onBulkExport, selectable }: any) => (
    <div data-testid="data-table">
      <input
        data-testid="search-input"
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder="Search..."
      />
      <button data-testid="export-button" onClick={onBulkExport}>
        Export
      </button>
      <div data-testid="table-data">
        {data.map((row: any) => (
          <div key={row.id} data-testid={`row-${row.id}`}>
            {selectable && (
              <input
                type="checkbox"
                data-testid={`checkbox-${row.id}`}
                onChange={(e) => {
                  const currentSelected = Array.from(
                    document.querySelectorAll('[data-testid^="checkbox-"]:checked')
                  ).map((el) => el.getAttribute('data-testid')?.replace('checkbox-', ''));
                  onSelectionChange?.(currentSelected);
                }}
              />
            )}
            <span>{row.guestFirstName} {row.guestLastName}</span>
            <span>{row.status}</span>
          </div>
        ))}
      </div>
      <button data-testid="page-next" onClick={() => onPageChange?.(2)}>
        Next
      </button>
    </div>
  ),
}));

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

// Mock RSVP data
const mockRSVPs: RSVPViewModel[] = [
  {
    id: 'rsvp-1',
    guestId: 'guest-1',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestEmail: 'john@example.com',
    eventId: 'event-1',
    eventName: 'Wedding Ceremony',
    activityId: null,
    activityName: null,
    status: 'attending',
    guestCount: 2,
    dietaryNotes: null,
    specialRequirements: null,
    notes: null,
    respondedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'rsvp-2',
    guestId: 'guest-2',
    guestFirstName: 'Jane',
    guestLastName: 'Smith',
    guestEmail: 'jane@example.com',
    eventId: 'event-1',
    eventName: 'Wedding Ceremony',
    activityId: 'activity-1',
    activityName: 'Reception',
    status: 'pending',
    guestCount: 1,
    dietaryNotes: 'Vegetarian',
    specialRequirements: null,
    notes: null,
    respondedAt: null,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'rsvp-3',
    guestId: 'guest-3',
    guestFirstName: 'Bob',
    guestLastName: 'Johnson',
    guestEmail: 'bob@example.com',
    eventId: 'event-2',
    eventName: 'Rehearsal Dinner',
    activityId: null,
    activityName: null,
    status: 'declined',
    guestCount: 1,
    dietaryNotes: null,
    specialRequirements: null,
    notes: 'Cannot attend',
    respondedAt: '2024-01-10T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
];

const mockStatistics = {
  totalRSVPs: 3,
  byStatus: {
    attending: 1,
    declined: 1,
    maybe: 0,
    pending: 1,
  },
  totalGuestCount: 3,
};

const mockEvents = [
  { id: 'event-1', name: 'Wedding Ceremony' },
  { id: 'event-2', name: 'Rehearsal Dinner' },
];

const mockActivities = [
  { id: 'activity-1', name: 'Reception' },
  { id: 'activity-2', name: 'Cocktail Hour' },
];

describe('RSVPManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/rsvps?')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                data: mockRSVPs,
                pagination: {
                  page: 1,
                  limit: 50,
                  total: 3,
                  totalPages: 1,
                },
                statistics: mockStatistics,
              },
            }),
        });
      }
      if (url.includes('/api/admin/events')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { events: mockEvents },
            }),
        });
      }
      if (url.includes('/api/admin/activities')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { activities: mockActivities },
            }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Rendering', () => {
    it('should render statistics dashboard', async () => {
      renderWithProviders(<RSVPManager />);

      // Wait for data to load and statistics to update
      await waitFor(() => {
        expect(screen.getByText('Total RSVPs')).toBeInTheDocument();
      });

      // Wait for statistics to be populated (not showing 0)
      await waitFor(() => {
        const cards = screen.getAllByText(/^\d+$/);
        // Should have at least one non-zero value
        expect(cards.length).toBeGreaterThan(0);
      });

      // Verify statistics are displayed
      expect(screen.getByText('Attending')).toBeInTheDocument();
      expect(screen.getByText('Declined')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('3 total guests')).toBeInTheDocument();
    });

    it('should render data table with RSVPs', async () => {
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });

      // Wait for data to be loaded and rendered
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithProviders(<RSVPManager />);

      // Statistics should show 0 initially
      expect(screen.getByText('Total RSVPs')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should fetch RSVPs with event filter', async () => {
      renderWithProviders(<RSVPManager initialFilters={{ eventId: 'event-1' }} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('eventId=event-1')
        );
      });
    });

    it('should fetch RSVPs with activity filter', async () => {
      renderWithProviders(<RSVPManager initialFilters={{ activityId: 'activity-1' }} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('activityId=activity-1')
        );
      });
    });

    it('should fetch RSVPs with status filter', async () => {
      renderWithProviders(<RSVPManager initialFilters={{ status: 'attending' }} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=attending')
        );
      });
    });

    it('should fetch RSVPs with multiple filters', async () => {
      renderWithProviders(
        <RSVPManager
          initialFilters={{
            eventId: 'event-1',
            status: 'attending',
          }}
        />
      );

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const rsvpCall = calls.find((call) => call[0].includes('/api/admin/rsvps?'));
        expect(rsvpCall[0]).toContain('eventId=event-1');
        expect(rsvpCall[0]).toContain('status=attending');
      });
    });
  });

  describe('Search', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=John')
        );
      });
    });

    it('should reset to first page when searching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByTestId('page-next');
      await user.click(nextButton);

      // Search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Jane');

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('page=1');
        expect(lastCall).toContain('search=Jane');
      });
    });
  });

  describe('Bulk Selection', () => {
    it('should allow selecting RSVPs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-rsvp-1')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-rsvp-1');
      await user.click(checkbox);

      // Bulk actions toolbar should appear
      await waitFor(() => {
        expect(screen.getByText(/1 RSVP selected/)).toBeInTheDocument();
      });
    });

    it('should show bulk action buttons when RSVPs selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-rsvp-1')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-rsvp-1');
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText('Mark Attending')).toBeInTheDocument();
        expect(screen.getByText('Mark Maybe')).toBeInTheDocument();
        expect(screen.getByText('Mark Declined')).toBeInTheDocument();
        expect(screen.getByText('Mark Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Status Update', () => {
    it('should update selected RSVPs to attending', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/rsvps/bulk') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { updatedCount: 1 },
              }),
          });
        }
        // Default responses for other calls
        if (url.includes('/api/admin/rsvps?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  data: mockRSVPs,
                  pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
                  statistics: mockStatistics,
                },
              }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { events: mockEvents } }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { activities: mockActivities } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-rsvp-1')).toBeInTheDocument();
      });

      // Select RSVP
      const checkbox = screen.getByTestId('checkbox-rsvp-1');
      await user.click(checkbox);

      // Click Mark Attending
      await waitFor(() => {
        expect(screen.getByText('Mark Attending')).toBeInTheDocument();
      });

      const attendingButton = screen.getByText('Mark Attending');
      await user.click(attendingButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/rsvps/bulk',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rsvpIds: ['rsvp-1'],
              status: 'attending',
            }),
          })
        );
      });

      // Success toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Successfully updated 1 RSVP/)).toBeInTheDocument();
      });
    });

    it('should handle bulk update errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/rsvps/bulk') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                success: false,
                error: { message: 'Bulk update failed' },
              }),
          });
        }
        // Default responses
        if (url.includes('/api/admin/rsvps?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  data: mockRSVPs,
                  pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
                  statistics: mockStatistics,
                },
              }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { events: mockEvents } }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { activities: mockActivities } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-rsvp-1')).toBeInTheDocument();
      });

      // Select RSVP
      const checkbox = screen.getByTestId('checkbox-rsvp-1');
      await user.click(checkbox);

      // Click Mark Attending
      await waitFor(() => {
        expect(screen.getByText('Mark Attending')).toBeInTheDocument();
      });

      const attendingButton = screen.getByText('Mark Attending');
      await user.click(attendingButton);

      // Error toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Bulk update failed/)).toBeInTheDocument();
      });
    });
  });

  describe('CSV Export', () => {
    it('should export RSVPs to CSV', async () => {
      const user = userEvent.setup();
      
      // Mock CSV export response
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/rsvps/export')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('RSVP ID,Guest Name,Status\nrsvp-1,John Doe,attending'),
          });
        }
        // Default responses
        if (url.includes('/api/admin/rsvps?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  data: mockRSVPs,
                  pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
                  statistics: mockStatistics,
                },
              }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { events: mockEvents } }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { activities: mockActivities } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      // Verify export API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/rsvps/export')
        );
      });

      // Success toast should appear
      await waitFor(() => {
        expect(screen.getByText(/RSVPs exported successfully/)).toBeInTheDocument();
      });
    });

    it('should handle export errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/rsvps/export')) {
          return Promise.resolve({
            ok: false,
            text: () => Promise.reject(new Error('Export failed')),
          });
        }
        // Default responses
        if (url.includes('/api/admin/rsvps?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  data: mockRSVPs,
                  pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
                  statistics: mockStatistics,
                },
              }),
          });
        }
        if (url.includes('/api/admin/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { events: mockEvents } }),
          });
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { activities: mockActivities } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      // Error toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to export RSVPs/)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByTestId('page-next')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('page-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              success: false,
              error: { message: 'Failed to fetch RSVPs' },
            }),
        })
      );

      renderWithProviders(<RSVPManager />);

      // Wait for error toast to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Failed to fetch RSVPs/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      );

      renderWithProviders(<RSVPManager />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });
});
