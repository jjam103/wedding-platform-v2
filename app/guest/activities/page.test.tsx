/**
 * Unit Tests for Guest Activities Page
 * 
 * Tests activity list display, filtering, RSVP status, capacity warnings, and interactions.
 * 
 * Requirements: 9.3, 9.4, 9.5, 9.7
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestActivitiesPage from './page';
import { createMockActivity } from '@/__tests__/helpers/factories';

// Mock the ActivityCard component
jest.mock('@/components/guest/ActivityCard', () => ({
  ActivityCard: ({ activity, onClick }: any) => (
    <div data-testid={`activity-card-${activity.id}`} onClick={onClick}>
      <h3>{activity.name}</h3>
      <span data-testid="activity-type">{activity.activityType}</span>
      <span data-testid="rsvp-status">{activity.rsvpStatus}</span>
      <span data-testid="capacity-remaining">{activity.capacityRemaining}</span>
      <span data-testid="net-cost">{activity.netCost}</span>
    </div>
  ),
}));

// Mock the ActivityPreviewModal component
jest.mock('@/components/guest/ActivityPreviewModal', () => ({
  ActivityPreviewModal: ({ activityId, isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="activity-preview-modal">
        <span>Activity ID: {activityId}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GuestActivitiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Activity List Display', () => {
    it('should display list of activities with mock data', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Beach Volleyball',
          activity_type: 'activity',
          rsvpStatus: 'attending',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Welcome Dinner',
          activity_type: 'meal',
          rsvpStatus: 'pending',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
        expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      });
    });

    it('should display RSVP status for each activity', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          rsvpStatus: 'attending',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Activity 2',
          rsvpStatus: 'declined',
        }),
        createMockActivity({
          id: 'activity-3',
          name: 'Activity 3',
          rsvpStatus: 'maybe',
        }),
        createMockActivity({
          id: 'activity-4',
          name: 'Activity 4',
          rsvpStatus: 'pending',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        const statuses = screen.getAllByTestId('rsvp-status');
        expect(statuses[0]).toHaveTextContent('attending');
        expect(statuses[1]).toHaveTextContent('declined');
        expect(statuses[2]).toHaveTextContent('maybe');
        expect(statuses[3]).toHaveTextContent('pending');
      });
    });

    it('should display capacity information', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          capacity: 50,
          capacityRemaining: 25,
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('capacity-remaining')).toHaveTextContent('25');
      });
    });

    it('should display net cost after subsidy', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          netCost: 50,
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('net-cost')).toHaveTextContent('50');
      });
    });
  });

  describe('Filtering', () => {
    it('should filter activities by type', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Beach Volleyball',
          activity_type: 'activity',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Wedding Ceremony',
          activity_type: 'ceremony',
        }),
        createMockActivity({
          id: 'activity-3',
          name: 'Welcome Dinner',
          activity_type: 'meal',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      // Filter by ceremony
      const typeSelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(typeSelect, 'ceremony');

      await waitFor(() => {
        expect(screen.queryByText('Beach Volleyball')).not.toBeInTheDocument();
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.queryByText('Welcome Dinner')).not.toBeInTheDocument();
      });
    });

    it('should filter activities by date range (from date)', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          start_time: '2025-06-01T10:00:00Z',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Activity 2',
          start_time: '2025-06-15T10:00:00Z',
        }),
        createMockActivity({
          id: 'activity-3',
          name: 'Activity 3',
          start_time: '2025-06-30T10:00:00Z',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
      });

      // Filter by from date
      const fromDateInput = screen.getByLabelText(/from date/i);
      await user.type(fromDateInput, '2025-06-10');

      await waitFor(() => {
        expect(screen.queryByText('Activity 1')).not.toBeInTheDocument();
        expect(screen.getByText('Activity 2')).toBeInTheDocument();
        expect(screen.getByText('Activity 3')).toBeInTheDocument();
      });
    });

    it('should filter activities by date range (to date)', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          start_time: '2025-06-01T10:00:00Z',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Activity 2',
          start_time: '2025-06-15T10:00:00Z',
        }),
        createMockActivity({
          id: 'activity-3',
          name: 'Activity 3',
          start_time: '2025-06-30T10:00:00Z',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
      });

      // Filter by to date
      const toDateInput = screen.getByLabelText(/to date/i);
      await user.type(toDateInput, '2025-06-20');

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
        expect(screen.getByText('Activity 2')).toBeInTheDocument();
        expect(screen.queryByText('Activity 3')).not.toBeInTheDocument();
      });
    });

    it('should clear all filters when clear button clicked', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          activity_type: 'ceremony',
          start_time: '2025-06-01T10:00:00Z',
        }),
        createMockActivity({
          id: 'activity-2',
          name: 'Activity 2',
          activity_type: 'meal',
          start_time: '2025-06-15T10:00:00Z',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
      });

      // Apply filters
      const typeSelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(typeSelect, 'ceremony');

      await waitFor(() => {
        expect(screen.queryByText('Activity 2')).not.toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
        expect(screen.getByText('Activity 2')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching activities', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<GuestActivitiesPage />);

      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: { message: 'Failed to fetch activities' } }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/error loading activities/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to fetch activities/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const mockActivities = [createMockActivity({ id: 'activity-1', name: 'Activity 1' })];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false, error: { message: 'Network error' } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockActivities }),
        });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/error loading activities/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no activities found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no activities found/i)).toBeInTheDocument();
      });
    });

    it('should display different message when filters return no results', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Activity 1',
          activity_type: 'ceremony',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
      });

      // Apply filter that returns no results
      const typeSelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(typeSelect, 'meal');

      await waitFor(() => {
        expect(screen.getByText(/no activities match your filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activity Card Click', () => {
    it('should open preview modal when activity card clicked', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Beach Volleyball',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const activityCard = screen.getByTestId('activity-card-activity-1');
      await user.click(activityCard);

      await waitFor(() => {
        expect(screen.getByTestId('activity-preview-modal')).toBeInTheDocument();
        expect(screen.getByText('Activity ID: activity-1')).toBeInTheDocument();
      });
    });

    it('should close preview modal when close button clicked', async () => {
      const mockActivities = [
        createMockActivity({
          id: 'activity-1',
          name: 'Beach Volleyball',
        }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const user = userEvent.setup();
      render(<GuestActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      // Open modal
      const activityCard = screen.getByTestId('activity-card-activity-1');
      await user.click(activityCard);

      await waitFor(() => {
        expect(screen.getByTestId('activity-preview-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-preview-modal')).not.toBeInTheDocument();
      });
    });
  });
});
