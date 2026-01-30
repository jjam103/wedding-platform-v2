import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransportationPage from './page';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/admin/transportation',
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
              // For transportation page, render function receives the entire guest object
              const displayValue = col.render ? col.render(item) : item[col.key];
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
              // For transportation page, render function receives the entire guest object
              const displayValue = col.render ? col.render(item) : item[col.key];
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

describe('TransportationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: { guests: [] } }),
    });
  });

  describe('Manifest Display', () => {
    it('should render arrivals tab by default', () => {
      render(<TransportationPage />);
      
      const arrivalsTab = screen.getByRole('button', { name: /arrivals/i });
      expect(arrivalsTab).toHaveClass('border-b-2');
    });

    it('should switch to departures tab when clicked', async () => {
      render(<TransportationPage />);
      
      const departuresTab = screen.getByRole('button', { name: /departures/i });
      fireEvent.click(departuresTab);
      
      await waitFor(() => {
        expect(departuresTab).toHaveClass('border-b-2');
      });
    });

    it('should display guests grouped by time windows', async () => {
      const mockGuests = [
        {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          arrival_time: '08:30:00',
          airport_code: 'SJO',
          flight_number: 'AA123',
        },
        {
          id: 'guest-2',
          first_name: 'Jane',
          last_name: 'Smith',
          arrival_time: '09:15:00',
          airport_code: 'SJO',
          flight_number: 'UA456',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { guests: mockGuests } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        });

      render(<TransportationPage />);

      await waitFor(() => {
        // Check that the time window header is displayed
        const timeWindowText = screen.queryByText(/08:00 - 10:00/i);
        expect(timeWindowText).toBeInTheDocument();
      });
    });

    it('should display empty state when no guests scheduled', async () => {
      render(<TransportationPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/no guests scheduled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by date', async () => {
      render(<TransportationPage />);
      
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2025-06-15' } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date=2025-06-15')
        );
      });
    });

    it('should filter by airport', async () => {
      render(<TransportationPage />);
      
      const airportSelect = screen.getByLabelText(/airport/i);
      fireEvent.change(airportSelect, { target: { value: 'SJO' } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('airport=SJO')
        );
      });
    });

    it('should not include airport param when "all" is selected', async () => {
      render(<TransportationPage />);
      
      const airportSelect = screen.getByLabelText(/airport/i);
      fireEvent.change(airportSelect, { target: { value: 'all' } });
      
      await waitFor(() => {
        const lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0][0];
        expect(lastCall).not.toContain('airport=');
      });
    });
  });

  describe('Shuttle Assignment', () => {
    it('should call assign shuttle API when shuttle input changes', async () => {
      const mockGuests = [
        {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          arrival_time: '08:30:00',
          airport_code: 'SJO',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { guests: mockGuests } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: undefined }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { guests: mockGuests } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        });

      render(<TransportationPage />);
      
      await waitFor(() => {
        const timeWindowText = screen.queryByText(/08:00 - 10:00/i);
        expect(timeWindowText).toBeInTheDocument();
      });

      // Find shuttle input and change it
      const shuttleInputs = screen.queryAllByPlaceholderText(/assign shuttle/i);
      if (shuttleInputs.length > 0) {
        fireEvent.change(shuttleInputs[0], { target: { value: 'Van 1' } });
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/admin/transportation/assign-shuttle',
            expect.objectContaining({
              method: 'POST',
            })
          );
        });
      }
    });
  });

  describe('Vehicle Calculations', () => {
    it('should calculate and display vehicle requirements', async () => {
      const mockGuests = Array.from({ length: 20 }, (_, i) => ({
        id: `guest-${i}`,
        first_name: `Guest${i}`,
        last_name: 'Test',
        arrival_time: '08:30:00',
        airport_code: 'SJO',
      }));

      const mockVehicleRequirements = [
        { vehicle_type: 'van', capacity: 8, quantity_needed: 2, estimated_cost: 160 },
        { vehicle_type: 'sedan', capacity: 4, quantity_needed: 1, estimated_cost: 50 },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { guests: mockGuests } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockVehicleRequirements }),
        });

      render(<TransportationPage />);

      await waitFor(() => {
        expect(screen.getByText(/vehicle requirements/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText(/2 × van/i)).toBeInTheDocument();
      expect(screen.getByText(/1 × sedan/i)).toBeInTheDocument();
      expect(screen.getByText(/\$210/i)).toBeInTheDocument(); // Total cost
    });

    it('should not display vehicle requirements when no guests', async () => {
      render(<TransportationPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/vehicle requirements/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Driver Sheets', () => {
    it('should generate driver sheets', async () => {
      const mockHTML = '<html><body>Driver Sheet</body></html>';
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { guests: [] } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { html: mockHTML } }),
        });

      // Mock window.open
      const mockOpen = jest.fn();
      global.window.open = mockOpen;

      render(<TransportationPage />);
      
      const generateButton = screen.getByRole('button', { name: /generate driver sheets/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/transportation/driver-sheets',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Print Manifest', () => {
    it('should trigger print when print button clicked', () => {
      const mockPrint = jest.fn();
      global.window.print = mockPrint;

      render(<TransportationPage />);
      
      const printButton = screen.getByRole('button', { name: /print manifest/i });
      fireEvent.click(printButton);
      
      expect(mockPrint).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<TransportationPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { message: 'Database error' },
        }),
      });

      render(<TransportationPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<TransportationPage />);
      
      expect(screen.getByText(/loading manifests/i)).toBeInTheDocument();
    });
  });
});
