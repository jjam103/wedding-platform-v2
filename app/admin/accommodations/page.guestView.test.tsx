/**
 * Guest View Navigation Tests for Accommodations
 * 
 * Tests the "View as Guest" functionality for accommodations.
 * Requirements: 32.4
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccommodationsPage from './page';
import { useToast } from '@/components/ui/ToastContext';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/components/ui/ToastContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/admin/accommodations',
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('AccommodationsPage - Guest View Navigation', () => {
  const mockAddToast = jest.fn();
  const mockPush = jest.fn();

  const mockAccommodations = [
    {
      id: 'accommodation-1',
      name: 'Tamarindo Diria Beach Resort',
      address: '123 Beach Road, Tamarindo',
      description: 'Beachfront resort',
      locationId: 'loc-1',
      checkInDate: '2025-06-14',
      checkOutDate: '2025-06-17',
      status: 'available',
    },
    {
      id: 'accommodation-2',
      name: 'Sunset Villa',
      address: '456 Hill Street, Tamarindo',
      description: 'Luxury villa',
      locationId: 'loc-2',
      checkInDate: '2025-06-14',
      checkOutDate: '2025-06-17',
      status: 'booked',
    },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Tamarindo Beach' },
    { id: 'loc-2', name: 'Tamarindo Hills' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      addToast: mockAddToast,
      toasts: [],
      removeToast: jest.fn(),
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    // Mock fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/accommodations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { accommodations: mockAccommodations },
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

  describe('View Button', () => {
    it('should render View button for each accommodation', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
        expect(viewButtons).toHaveLength(mockAccommodations.length);
      });
    });

    it('should navigate to guest-facing accommodation page when View button is clicked', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toBe('/guest/accommodation/accommodation-1');
    });

    it('should generate correct URL for each accommodation ID', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      // Test first accommodation
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);
      expect(window.location.href).toBe('/guest/accommodation/accommodation-1');

      // Reset location
      window.location.href = '';

      // Test second accommodation
      fireEvent.click(viewButtons[1]);
      expect(window.location.href).toBe('/guest/accommodation/accommodation-2');
    });

    it('should not propagate click event to row', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      
      viewButtons[0].dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Link Generation', () => {
    it('should generate URL with /guest/accommodation/ prefix', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toMatch(/^\/guest\/accommodation\//);
    });

    it('should use accommodation ID in URL', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toContain('accommodation-1');
    });

    it('should use singular "accommodation" not plural in URL', async () => {
      render(<AccommodationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tamarindo Diria Beach Resort')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toContain('/accommodation/');
      expect(window.location.href).not.toContain('/accommodations/');
    });
  });
});
