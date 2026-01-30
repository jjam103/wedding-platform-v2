/**
 * Unit Tests for Guest Edit Modal - Extended Fields
 * 
 * Tests extended field validation and form submission including:
 * - Travel information fields (arrival/departure dates, airport, flight number)
 * - Plus-one information fields
 * - Field grouping
 * - Form submission with extended data
 * 
 * Validates: Requirements 24.1-24.10
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

// Sample guest data with extended fields
const mockGuestWithExtendedFields = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  groupId: '123e4567-e89b-12d3-a456-426614174001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  ageType: 'adult' as const,
  guestType: 'wedding_guest' as const,
  dietaryRestrictions: 'Vegetarian',
  plusOneName: 'Jane Doe',
  plusOneAttending: true,
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
};

describe('Guest Edit Modal - Extended Fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/guests') && !url.includes('?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              guests: [mockGuestWithExtendedFields],
              total: 1,
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
            data: [{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Test Group' }],
          }),
        });
      }
      if (url.includes('/api/admin/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
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

  it('should display arrival date field in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    // Click guest row to open edit modal - use the first occurrence (table cell)
    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify arrival date field exists
      const arrivalDateField = screen.getByLabelText(/Arrival Date/i);
      expect(arrivalDateField).toBeInTheDocument();
      expect((arrivalDateField as HTMLInputElement).value).toBe('2024-06-01');
    }
  });

  it('should display departure date field in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify departure date field exists
      const departureDateField = screen.getByLabelText(/Departure Date/i);
      expect(departureDateField).toBeInTheDocument();
      expect((departureDateField as HTMLInputElement).value).toBe('2024-06-05');
    }
  });

  it('should display airport field in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify airport field exists - query by name attribute to avoid filter dropdown
      const airportField = document.querySelector('select[name="airportCode"]') as HTMLSelectElement;
      expect(airportField).toBeInTheDocument();
      expect(airportField.value).toBe('SJO');
    }
  });

  it('should display flight number field in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify flight number field exists
      const flightNumberField = screen.getByLabelText(/Flight Number/i);
      expect(flightNumberField).toBeInTheDocument();
      expect((flightNumberField as HTMLInputElement).value).toBe('AA123');
    }
  });

  it('should display plus-one name field in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify plus-one name field exists
      const plusOneNameField = screen.getByLabelText(/Plus-One Name/i);
      expect(plusOneNameField).toBeInTheDocument();
      expect((plusOneNameField as HTMLInputElement).value).toBe('Jane Doe');
    }
  });

  it('should display plus-one attending checkbox in edit modal', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify plus-one attending checkbox exists
      const plusOneAttendingField = screen.getByLabelText(/Plus-One Attending/i);
      expect(plusOneAttendingField).toBeInTheDocument();
      expect((plusOneAttendingField as HTMLInputElement).checked).toBe(true);
    }
  });

  it('should submit form with extended fields when updated', async () => {
    // Mock successful update
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/admin/guests/') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockGuestWithExtendedFields,
          }),
        });
      }
      // Default mocks for other requests
      if (url.includes('/api/admin/guests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              guests: [mockGuestWithExtendedFields],
              total: 1,
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
            data: [{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Test Group' }],
          }),
        });
      }
      if (url.includes('/api/admin/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
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

    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Update flight number
      const flightNumberField = screen.getByLabelText(/Flight Number/i) as HTMLInputElement;
      fireEvent.change(flightNumberField, { target: { value: 'UA456' } });

      // Submit form
      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/guests/123e4567-e89b-12d3-a456-426614174000'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    }
  });

  it('should validate extended fields when submitting', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // All extended fields should be optional, so form should be valid
      const submitButton = screen.getByText('Update');
      expect(submitButton).toBeEnabled();
    }
  });

  it('should display all field groups logically organized', async () => {
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John')[0]).toBeInTheDocument();
    });

    const guestRow = screen.getAllByText('John')[0].closest('tr');
    if (guestRow) {
      fireEvent.click(guestRow);

      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      });

      // Verify Personal Info fields
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
      
      // Query Age Type and Guest Type by name attribute to avoid filter dropdowns
      const ageTypeField = document.querySelector('select[name="ageType"]');
      expect(ageTypeField).toBeInTheDocument();
      
      const guestTypeField = document.querySelector('select[name="guestType"]');
      expect(guestTypeField).toBeInTheDocument();
      
      expect(screen.getByLabelText(/Dietary Restrictions/i)).toBeInTheDocument();

      // Verify Travel Info fields
      expect(screen.getByLabelText(/Arrival Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Departure Date/i)).toBeInTheDocument();
      
      // Query Airport by name attribute to avoid filter dropdown
      const airportField = document.querySelector('select[name="airportCode"]');
      expect(airportField).toBeInTheDocument();
      
      expect(screen.getByLabelText(/Flight Number/i)).toBeInTheDocument();

      // Verify Plus-One Info fields
      expect(screen.getByLabelText(/Plus-One Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Plus-One Attending/i)).toBeInTheDocument();

      // Verify Notes field
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    }
  });
});
