/**
 * Unit Tests for Guest Management Page - Advanced Filtering
 * 
 * Tests advanced filtering functionality including:
 * - RSVP status filter
 * - Activity filter
 * - Transportation filter
 * - Age group filter
 * - Airport filter
 * - Grouping functionality
 * 
 * Validates: Requirements 8.2-8.7
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GuestsPage from './page';
import { ToastProvider } from '@/components/ui/ToastContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
    toString: jest.fn(() => ''),
  }),
}));

// Mock DataTable components
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, loading }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div key={index} data-testid={`guest-row-${item.id}`}>
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
  DataTableWithSuspense: ({ data, columns, loading }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div key={index} data-testid={`guest-row-${item.id}`}>
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

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Sample guest data for testing
const mockGuests = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    groupId: '123e4567-e89b-12d3-a456-426614174001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    ageType: 'adult' as const,
    guestType: 'wedding_guest' as const,
    dietaryRestrictions: 'Vegetarian',
    plusOneName: null,
    plusOneAttending: false,
    arrivalDate: '2024-06-01',
    departureDate: '2024-06-05',
    airportCode: 'SJO' as const,
    flightNumber: 'AA123',
    invitationSent: true,
    invitationSentDate: '2024-01-15',
    rsvpDeadline: '2024-05-01',
    notes: 'Prefers window seat',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174000',
    groupId: '123e4567-e89b-12d3-a456-426614174001',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: null,
    ageType: 'adult' as const,
    guestType: 'wedding_party' as const,
    dietaryRestrictions: null,
    plusOneName: 'Bob Smith',
    plusOneAttending: true,
    arrivalDate: '2024-05-31',
    departureDate: '2024-06-06',
    airportCode: 'LIR' as const,
    flightNumber: null,
    invitationSent: true,
    invitationSentDate: '2024-01-15',
    rsvpDeadline: '2024-05-01',
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174000',
    groupId: '223e4567-e89b-12d3-a456-426614174001',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: null,
    phone: '+9876543210',
    ageType: 'child' as const,
    guestType: 'wedding_guest' as const,
    dietaryRestrictions: 'Gluten-free',
    plusOneName: null,
    plusOneAttending: false,
    arrivalDate: null,
    departureDate: null,
    airportCode: null,
    flightNumber: null,
    invitationSent: false,
    invitationSentDate: null,
    rsvpDeadline: '2024-05-01',
    notes: 'Traveling with parents',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockActivities = [
  { id: 'activity-1', name: 'Beach Day' },
  { id: 'activity-2', name: 'Welcome Dinner' },
];

describe('Guest Management Page - Advanced Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/guests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              guests: mockGuests,
              total: mockGuests.length,
              page: 1,
              pageSize: 50,
              totalPages: 1,
            },
          }),
        });
      }
      if (url.includes('/api/admin/groups')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
          }),
        });
      }
      if (url.includes('/api/admin/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockActivities,
          }),
        });
      }
      if (url.includes('/api/admin/rsvps')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should render RSVP status filter dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/RSVP Status/i)).toBeInTheDocument();
    });

    const rsvpFilter = screen.getByLabelText(/RSVP Status/i) as HTMLSelectElement;
    expect(rsvpFilter).toBeInTheDocument();
    expect(rsvpFilter.tagName).toBe('SELECT');
  });

  it('should render activity filter dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Activity/i)).toBeInTheDocument();
    });

    const activityFilter = screen.getByLabelText(/Activity/i) as HTMLSelectElement;
    expect(activityFilter).toBeInTheDocument();
    expect(activityFilter.tagName).toBe('SELECT');
  });

  it('should render transportation filter dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Transportation/i)).toBeInTheDocument();
    });

    const transportationFilter = screen.getByLabelText(/Transportation/i) as HTMLSelectElement;
    expect(transportationFilter).toBeInTheDocument();
    expect(transportationFilter.tagName).toBe('SELECT');
  });

  it('should render age group filter dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Age Group/i)).toBeInTheDocument();
    });

    const ageGroupFilter = screen.getByLabelText(/Age Group/i) as HTMLSelectElement;
    expect(ageGroupFilter).toBeInTheDocument();
    expect(ageGroupFilter.tagName).toBe('SELECT');
  });

  it('should render airport filter dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      // Use getAllByLabelText and find the select element
      const airportLabels = screen.queryAllByLabelText(/Airport/i);
      const airportFilter = airportLabels.find(el => el.tagName === 'SELECT');
      expect(airportFilter).toBeInTheDocument();
    });
  });

  it('should render grouping dropdown', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Group By/i)).toBeInTheDocument();
    });

    const groupingSelect = screen.getByLabelText(/Group By/i) as HTMLSelectElement;
    expect(groupingSelect).toBeInTheDocument();
    expect(groupingSelect.tagName).toBe('SELECT');
  });

  it('should fetch guests with RSVP status filter when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/RSVP Status/i)).toBeInTheDocument();
    });

    const rsvpFilter = screen.getByLabelText(/RSVP Status/i) as HTMLSelectElement;
    
    // Change filter value
    fireEvent.change(rsvpFilter, { target: { value: 'attending' } });

    // Wait for fetch to be called with filter parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('rsvpStatus=attending')
      );
    });
  });

  it('should fetch guests with activity filter when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Activity/i)).toBeInTheDocument();
    });

    const activityFilter = screen.getByLabelText(/Activity/i) as HTMLSelectElement;
    
    // Change filter value
    fireEvent.change(activityFilter, { target: { value: 'activity-1' } });

    // Wait for fetch to be called with filter parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('activityId=activity-1')
      );
    });
  });

  it('should fetch guests with transportation filter when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Transportation/i)).toBeInTheDocument();
    });

    const transportationFilter = screen.getByLabelText(/Transportation/i) as HTMLSelectElement;
    
    // Change filter value
    fireEvent.change(transportationFilter, { target: { value: 'true' } });

    // Wait for fetch to be called with filter parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('hasTransportation=true')
      );
    });
  });

  it('should fetch guests with age group filter when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Age Group/i)).toBeInTheDocument();
    });

    const ageGroupFilter = screen.getByLabelText(/Age Group/i) as HTMLSelectElement;
    
    // Change filter value
    fireEvent.change(ageGroupFilter, { target: { value: 'adult' } });

    // Wait for fetch to be called with filter parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ageType=adult')
      );
    });
  });

  it('should fetch guests with airport filter when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      const airportLabels = screen.queryAllByLabelText(/Airport/i);
      const airportFilter = airportLabels.find(el => el.tagName === 'SELECT');
      expect(airportFilter).toBeInTheDocument();
    });

    const airportLabels = screen.getAllByLabelText(/Airport/i);
    const airportFilter = airportLabels.find(el => el.tagName === 'SELECT') as HTMLSelectElement;
    
    // Change filter value
    fireEvent.change(airportFilter, { target: { value: 'SJO' } });

    // Wait for fetch to be called with filter parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('airportCode=SJO')
      );
    });
  });

  it('should update grouping field when changed', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Group By/i)).toBeInTheDocument();
    });

    const groupingSelect = screen.getByLabelText(/Group By/i) as HTMLSelectElement;
    
    // Change grouping value
    fireEvent.change(groupingSelect, { target: { value: 'ageType' } });

    // Verify the value changed
    expect(groupingSelect.value).toBe('ageType');
  });

  it('should clear all filters when Clear All Filters button is clicked', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/RSVP Status/i)).toBeInTheDocument();
    });

    // Set some filter values
    const rsvpFilter = screen.getByLabelText(/RSVP Status/i) as HTMLSelectElement;
    const ageGroupFilter = screen.getByLabelText(/Age Group/i) as HTMLSelectElement;
    const groupingSelect = screen.getByLabelText(/Group By/i) as HTMLSelectElement;

    fireEvent.change(rsvpFilter, { target: { value: 'attending' } });
    fireEvent.change(ageGroupFilter, { target: { value: 'adult' } });
    fireEvent.change(groupingSelect, { target: { value: 'ageType' } });

    // Verify filters are set
    expect(rsvpFilter.value).toBe('attending');
    expect(ageGroupFilter.value).toBe('adult');
    expect(groupingSelect.value).toBe('ageType');

    // Click Clear All Filters button
    const clearButton = screen.getByText(/Clear All Filters/i);
    fireEvent.click(clearButton);

    // Wait for filters to be cleared
    await waitFor(() => {
      expect(rsvpFilter.value).toBe('');
      expect(ageGroupFilter.value).toBe('');
      expect(groupingSelect.value).toBe('');
    });
  });

  it('should render Clear All Filters button', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Clear All Filters/i)).toBeInTheDocument();
    });

    const clearButton = screen.getByText(/Clear All Filters/i);
    expect(clearButton).toBeInTheDocument();
    expect(clearButton.tagName).toBe('BUTTON');
  });
});
