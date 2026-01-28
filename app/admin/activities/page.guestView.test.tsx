/**
 * Guest View Navigation Tests for Activities
 * 
 * Tests the "View as Guest" functionality for activities.
 * Requirements: 32.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivitiesPage from './page';
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
  usePathname: () => '/admin/activities',
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ActivitiesPage - Guest View Navigation', () => {
  const mockAddToast = jest.fn();
  const mockPush = jest.fn();

  const mockActivities = [
    {
      id: 'activity-1',
      name: 'Beach Day',
      activityType: 'activity',
      startTime: '2025-06-16T10:00:00Z',
      endTime: '2025-06-16T16:00:00Z',
      status: 'published',
      capacity: 50,
      currentRsvps: 45,
      utilizationPercentage: 90,
      eventId: 'event-1',
      locationId: 'loc-1',
      description: 'Beach activities',
      costPerPerson: 50,
      hostSubsidy: 10,
      adultsOnly: false,
      plusOneAllowed: true,
    },
    {
      id: 'activity-2',
      name: 'Zip Line Adventure',
      activityType: 'activity',
      startTime: '2025-06-17T09:00:00Z',
      endTime: '2025-06-17T12:00:00Z',
      status: 'published',
      capacity: 20,
      currentRsvps: 20,
      utilizationPercentage: 100,
      eventId: null,
      locationId: 'loc-2',
      description: 'Zip line tour',
      costPerPerson: 75,
      hostSubsidy: 0,
      adultsOnly: true,
      plusOneAllowed: false,
    },
  ];

  const mockEvents = [
    { id: 'event-1', name: 'Main Event' },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Beach' },
    { id: 'loc-2', name: 'Adventure Park' },
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
      if (url.includes('/api/admin/activities') && !url.includes('/capacity')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { activities: mockActivities },
          }),
        });
      }
      if (url.includes('/capacity')) {
        const activityId = url.split('/')[4];
        const activity = mockActivities.find(a => a.id === activityId);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              currentAttendees: activity?.currentRsvps || 0,
              utilizationPercentage: activity?.utilizationPercentage || 0,
            },
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
            data: { locations: mockLocations },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('View Button', () => {
    it('should render View button for each activity', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
        expect(viewButtons).toHaveLength(mockActivities.length);
      });
    });

    it('should navigate to guest-facing activity page when View button is clicked', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toBe('/guest/activities/activity-1');
    });

    it('should generate correct URL for each activity ID', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      });

      // Test first activity
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);
      expect(window.location.href).toBe('/guest/activities/activity-1');

      // Reset location
      window.location.href = '';

      // Test second activity
      fireEvent.click(viewButtons[1]);
      expect(window.location.href).toBe('/guest/activities/activity-2');
    });

    it('should not propagate click event to row', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      
      viewButtons[0].dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Link Generation', () => {
    it('should generate URL with /guest/activities/ prefix', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toMatch(/^\/guest\/activities\//);
    });

    it('should use activity ID in URL', async () => {
      render(<ActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toContain('activity-1');
    });
  });
});
