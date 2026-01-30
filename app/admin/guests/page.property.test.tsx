/**
 * Unit Tests for Guest Management Page
 * 
 * Feature: admin-ui-modernization, Property 3: Row click opens edit modal
 * Validates: Requirements 3.8, 4.8
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
    airportCode: 'SJO',
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
    airportCode: 'LIR',
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

describe('Feature: admin-ui-modernization, Property 3: Row click opens edit modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses with mock guests
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
            data: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });
  });

  it('should open edit modal with guest data when guest row is clicked', async () => {
    // Render component
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    // Wait for guests to load and table to render with reduced timeout
    await waitFor(() => {
      expect(screen.getAllByText('John')).toHaveLength(2); // Table and mobile view
    }, { timeout: 2000 });

    // Find and click the first guest row (John Doe) - use more specific approach
    const johnCells = screen.getAllByText('John');
    // Find the table cell (not the mobile view span)
    const johnTableCell = johnCells.find(cell => cell.tagName === 'TD');
    expect(johnTableCell).toBeInTheDocument();

    if (johnTableCell) {
      const johnRow = johnTableCell.closest('tr');
      expect(johnRow).toBeInTheDocument();
      
      if (johnRow) {
        fireEvent.click(johnRow);

      // Wait for modal to open with reduced timeout
      await waitFor(() => {
        expect(screen.getByText('Edit Guest')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Wait a bit more for form data to populate
      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
        expect(firstNameInput.value).toBe('John');
      }, { timeout: 1000 });

      // Verify modal contains guest data
      const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      }
    }
  }, 10000); // Increased test timeout

  it('should open edit modal with correct data for different guest types', async () => {
    // Render component
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    // Wait for guests to load and table to render with reduced timeout
    await waitFor(() => {
      expect(screen.getAllByText('Jane')).toHaveLength(2); // Table and mobile view
    }, { timeout: 2000 });

    // Test clicking Jane Smith (wedding party with plus one) - use more specific approach
    const janeCells = screen.getAllByText('Jane');
    // Find the table cell (not the mobile view span)
    const janeTableCell = janeCells.find(cell => cell.tagName === 'TD');
    expect(janeTableCell).toBeInTheDocument();

    if (janeTableCell) {
      const janeRow = janeTableCell.closest('tr');
      expect(janeRow).toBeInTheDocument();
      
      if (janeRow) {
        fireEvent.click(janeRow);

        await waitFor(() => {
          expect(screen.getByText('Edit Guest')).toBeInTheDocument();
        }, { timeout: 1000 });

        // Wait a bit more for form data to populate
        await waitFor(() => {
          const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
          expect(firstNameInput.value).toBe('Jane');
        }, { timeout: 1000 });

        const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
        const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;

        expect(firstNameInput.value).toBe('Jane');
        expect(lastNameInput.value).toBe('Smith');
      }
    }
  }, 10000); // Increased test timeout

  it('should open edit modal for guest with minimal data (child guest)', async () => {
    // Render component
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    // Wait for guests to load and table to render with reduced timeout
    await waitFor(() => {
      expect(screen.getAllByText('Alice')).toHaveLength(2); // Table and mobile view
    }, { timeout: 2000 });

    // Test clicking Alice Johnson (child with no email) - use more specific approach
    const aliceCells = screen.getAllByText('Alice');
    // Find the table cell (not the mobile view span)
    const aliceTableCell = aliceCells.find(cell => cell.tagName === 'TD');
    expect(aliceTableCell).toBeInTheDocument();

    if (aliceTableCell) {
      const aliceRow = aliceTableCell.closest('tr');
      expect(aliceRow).toBeInTheDocument();
      
      if (aliceRow) {
        fireEvent.click(aliceRow);

        await waitFor(() => {
          expect(screen.getByText('Edit Guest')).toBeInTheDocument();
        }, { timeout: 1000 });

        // Wait a bit more for form data to populate
        await waitFor(() => {
          const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
          expect(firstNameInput.value).toBe('Alice');
        }, { timeout: 1000 });

        const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
        const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;

        expect(firstNameInput.value).toBe('Alice');
        expect(lastNameInput.value).toBe('Johnson');
      }
    }
  }, 10000); // Increased test timeout

  it('should open create modal when Add Guest button is clicked', async () => {
    // Render component
    render(
      <ToastProvider>
        <GuestsPage />
      </ToastProvider>
    );

    // Wait for page to load (guests don't need to be present for this test) with reduced timeout
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add new guest/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click Add Guest button
    const addButton = screen.getByRole('button', { name: /Add new guest/i });
    fireEvent.click(addButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Add Guest')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify form is empty (create mode)
    const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;

    expect(firstNameInput.value).toBe('');
    expect(lastNameInput.value).toBe('');
  });
});
