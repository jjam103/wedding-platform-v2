/**
 * Guest View Navigation Tests for Events
 * 
 * Tests the "View as Guest" functionality for events.
 * Requirements: 32.2
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventsPage from './page';
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
  usePathname: () => '/admin/events',
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('EventsPage - Guest View Navigation', () => {
  const mockAddToast = jest.fn();
  const mockPush = jest.fn();

  const mockEvents = [
    {
      id: 'event-1',
      name: 'Ceremony on the Beach',
      eventType: 'ceremony',
      startDate: '2025-06-15T14:00:00Z',
      endDate: '2025-06-15T15:00:00Z',
      status: 'published',
      locationId: 'loc-1',
      description: 'Beach ceremony',
      rsvpRequired: true,
      rsvpDeadline: '2025-06-01T00:00:00Z',
    },
    {
      id: 'event-2',
      name: 'Welcome Dinner',
      eventType: 'reception',
      startDate: '2025-06-14T18:00:00Z',
      endDate: '2025-06-14T21:00:00Z',
      status: 'published',
      locationId: 'loc-2',
      description: 'Welcome dinner',
      rsvpRequired: true,
      rsvpDeadline: '2025-06-01T00:00:00Z',
    },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Beach Venue' },
    { id: 'loc-2', name: 'Restaurant' },
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
  });

  describe('View Button', () => {
    it('should render View button for each event', async () => {
      render(<EventsPage />);

      // Wait for events to load
      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to guest-facing event page when View button is clicked', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toBe('/guest/events/event-1');
    });

    it('should generate correct URL for each event ID', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Test first event
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);
      expect(window.location.href).toBe('/guest/events/event-1');

      // Reset location
      window.location.href = '';

      // Test second event (accounting for possible duplicates)
      const secondButtonIndex = viewButtons.length > 2 ? 2 : 1;
      if (viewButtons.length > secondButtonIndex) {
        fireEvent.click(viewButtons[secondButtonIndex]);
        expect(window.location.href).toContain('/guest/events/');
      }
    });

    it('should not propagate click event to row', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      
      viewButtons[0].dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Link Generation', () => {
    it('should generate URL with /guest/events/ prefix', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toMatch(/^\/guest\/events\//);
    });

    it('should use event ID in URL', async () => {
      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ceremony on the Beach').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toContain('event-1');
    });
  });
});
