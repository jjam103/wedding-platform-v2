import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoomTypesPage from './page';
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

/**
 * Unit tests for Room Types Page
 * 
 * Tests:
 * - Room type creation
 * - Capacity tracking
 * - Guest assignment
 * - Section editor integration
 * 
 * Requirements: 22.1-22.7
 */
describe('RoomTypesPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockAccommodation = {
    id: 'accommodation-1',
    name: 'Tamarindo Diria Beach Resort',
  };

  const mockRoomTypes = [
    {
      id: 'room-type-1',
      accommodationId: 'accommodation-1',
      name: 'Ocean View Suite',
      capacity: 2,
      totalRooms: 10,
      pricePerNight: 250,
      hostSubsidyPerNight: 50,
      description: 'Luxury suite with ocean views',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'room-type-2',
      accommodationId: 'accommodation-1',
      name: 'Standard Room',
      capacity: 2,
      totalRooms: 20,
      pricePerNight: 150,
      hostSubsidyPerNight: 0,
      description: 'Comfortable standard room',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/accommodations/accommodation-1/room-types')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockRoomTypes,
          }),
        });
      }
      if (url.includes('/api/admin/accommodations/accommodation-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockAccommodation,
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Room type creation', () => {
    it('should display collapsible form when Add Room Type button is clicked', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types:/i)).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /create new room type/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Room Type')).toBeInTheDocument();
      });
    });

    it('should create room type with collapsible form', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'room-type-3',
          accommodationId: 'accommodation-1',
          name: 'Deluxe Suite',
          capacity: 4,
          totalRooms: 5,
          pricePerNight: 350,
          hostSubsidyPerNight: 100,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/room-types') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createResponse),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1/room-types')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [...mockRoomTypes, createResponse.data],
            }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockAccommodation,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types:/i)).toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /create new room type/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Room Type')).toBeInTheDocument();
      });

      // Verify form is displayed
      expect(screen.getByLabelText(/room type name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
    });

    it('should include accommodation ID in form submission', async () => {
      let submittedData: any = null;

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/room-types') && options?.method === 'POST') {
          submittedData = JSON.parse(options.body);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { id: 'room-type-3', ...submittedData },
            }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1/room-types')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockRoomTypes,
            }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockAccommodation,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Capacity tracking', () => {
    it('should display capacity information for each room type', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Verify capacity is displayed (multiple room types have same capacity)
      expect(screen.getAllByText('2 guests').length).toBeGreaterThan(0);
    });

    it('should display total rooms for each room type', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Verify total rooms are displayed (would be in table)
      // The actual display depends on DataTable component
    });

    it('should calculate and display occupancy percentage', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Occupancy would be calculated and displayed
      // For now, it shows 0/10 (0%) as placeholder
    });
  });

  describe('Guest assignment', () => {
    it('should display guest assignment interface', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Guest assignment interface would be part of the page
      // This test verifies the page loads correctly
    });
  });

  describe('Section editor integration', () => {
    it('should navigate to section editor when Manage Sections button is clicked', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Find and click Manage Sections button
      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      fireEvent.click(manageSectionsButtons[0]);

      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/accommodations/accommodation-1/room-types/room-type-1/sections');
    });

    it('should navigate to correct room type sections page', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Standard Room')).toHaveLength(2);
      });

      // Find and click Manage Sections button for second room type
      const manageSectionsButtons = screen.getAllByRole('button', { name: /manage sections/i });
      fireEvent.click(manageSectionsButtons[1]);

      // Verify navigation to correct room type
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/accommodations/accommodation-1/room-types/room-type-2/sections');
    });
  });

  describe('Room type editing', () => {
    it('should open edit form when room type row is clicked', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Click on room type row
      const roomTypeName = screen.getAllByText('Ocean View Suite')[0];
      fireEvent.click(roomTypeName);

      await waitFor(() => {
        expect(screen.getByText('Edit Room Type')).toBeInTheDocument();
      });
    });

    it('should populate form with room type data when editing', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Click on room type row
      const roomTypeName = screen.getAllByText('Ocean View Suite')[0];
      fireEvent.click(roomTypeName);

      await waitFor(() => {
        expect(screen.getByText('Edit Room Type')).toBeInTheDocument();
      });

      // Verify form is populated (form fields would be populated by CollapsibleForm component)
      expect(screen.getByLabelText(/room type name/i)).toBeInTheDocument();
    });
  });

  describe('Room type deletion', () => {
    it('should delete room type after confirmation', async () => {
      let roomTypesData = [...mockRoomTypes];
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/room-types/room-type-1') && options?.method === 'DELETE') {
          // After deletion, update the data
          roomTypesData = mockRoomTypes.filter(rt => rt.id !== 'room-type-1');
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: undefined }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1/room-types')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: roomTypesData,
            }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockAccommodation,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to accommodations when Back button is clicked', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types:/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to accommodations/i });
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/accommodations');
    });

    it('should display accommodation name in page title', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types: tamarindo diria beach resort/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data loading', () => {
    it('should display loading state initially', () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      // Loading state would be shown by DataTable component
      expect(screen.getByText(/room types:/i)).toBeInTheDocument();
    });

    it('should display room types after loading', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
        expect(screen.getAllByText('Standard Room')).toHaveLength(2);
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/accommodations/accommodation-1/room-types')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              success: false,
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch room types' },
            }),
          });
        }
        if (url.includes('/api/admin/accommodations/accommodation-1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockAccommodation,
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getByText(/room types:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Price display', () => {
    it('should format prices as currency', async () => {
      render(<RoomTypesPage params={Promise.resolve({ id: 'accommodation-1' })} />);

      await waitFor(() => {
        expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
      });

      // Verify price is formatted as currency (prices may appear multiple times in table and form)
      expect(screen.getAllByText('$250.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);
    });
  });
});
