import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestEventsPage from './page';

// Mock EventCard component
jest.mock('@/components/guest/EventCard', () => ({
  EventCard: ({ event, onClick }: any) => (
    <div data-testid={`event-card-${event.id}`} onClick={() => onClick(event)}>
      <h3>{event.title}</h3>
      <p>{event.startDate}</p>
      <span data-testid={`rsvp-status-${event.id}`}>{event.rsvpStatus || 'pending'}</span>
      <span data-testid={`activity-count-${event.id}`}>{event.activityCount || 0} activities</span>
    </div>
  ),
}));

// Mock EventPreviewModal component
jest.mock('@/components/guest/EventPreviewModal', () => ({
  EventPreviewModal: ({ event, isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="event-preview-modal">
        <h2>{event.title}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('GuestEventsPage', () => {
  const mockEvents = [
    {
      id: 'event-1',
      title: 'Wedding Ceremony',
      startDate: '2024-06-15T16:00:00Z',
      endDate: '2024-06-15T17:00:00Z',
      location: 'Beach',
      description: 'Main ceremony',
      rsvpStatus: 'attending' as const,
      activityCount: 3,
    },
    {
      id: 'event-2',
      title: 'Reception',
      startDate: '2024-06-15T18:00:00Z',
      endDate: '2024-06-15T22:00:00Z',
      location: 'Ballroom',
      description: 'Evening reception',
      rsvpStatus: 'pending' as const,
      activityCount: 5,
    },
    {
      id: 'event-3',
      title: 'Rehearsal Dinner',
      startDate: '2024-06-14T19:00:00Z',
      endDate: '2024-06-14T21:00:00Z',
      location: 'Restaurant',
      description: 'Pre-wedding dinner',
      rsvpStatus: 'declined' as const,
      activityCount: 2,
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Event List Display', () => {
    it('should display loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<GuestEventsPage />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should display events after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Reception')).toBeInTheDocument();
        expect(screen.getByText('Rehearsal Dinner')).toBeInTheDocument();
      });
    });

    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ 
          success: false, 
          error: { message: 'Failed to load events' } 
        }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Events')).toBeInTheDocument();
        expect(screen.getByText('Failed to load events')).toBeInTheDocument();
      });
    });

    it('should display try again button on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ 
          success: false, 
          error: { message: 'Network error' } 
        }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetch when try again button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ 
            success: false, 
            error: { message: 'Network error' } 
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockEvents }),
        });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should display empty state when no events', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No events found/i)).toBeInTheDocument();
      });
    });
  });

  describe('RSVP Status Display', () => {
    it('should display RSVP status for each event', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-status-event-1')).toHaveTextContent('attending');
        expect(screen.getByTestId('rsvp-status-event-2')).toHaveTextContent('pending');
        expect(screen.getByTestId('rsvp-status-event-3')).toHaveTextContent('declined');
      });
    });

    it('should display activity count for each event', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('activity-count-event-1')).toHaveTextContent('3 activities');
        expect(screen.getByTestId('activity-count-event-2')).toHaveTextContent('5 activities');
        expect(screen.getByTestId('activity-count-event-3')).toHaveTextContent('2 activities');
      });
    });
  });

  describe('Date Filtering', () => {
    it('should filter events by from date', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      const user = userEvent.setup();
      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Filter to show only events from June 15
      const fromDateInput = screen.getByLabelText('From Date');
      await user.clear(fromDateInput);
      await user.type(fromDateInput, '2024-06-15');

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Reception')).toBeInTheDocument();
        expect(screen.queryByText('Rehearsal Dinner')).not.toBeInTheDocument();
      });
    });

    it('should filter events by to date', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      const user = userEvent.setup();
      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Filter to show only events up to June 14
      const toDateInput = screen.getByLabelText('To Date');
      await user.clear(toDateInput);
      await user.type(toDateInput, '2024-06-14');

      await waitFor(() => {
        expect(screen.getByText('Rehearsal Dinner')).toBeInTheDocument();
        expect(screen.queryByText('Wedding Ceremony')).not.toBeInTheDocument();
        expect(screen.queryByText('Reception')).not.toBeInTheDocument();
      });
    });

    it('should filter events by date range', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      const user = userEvent.setup();
      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Filter to show only events on June 15
      const fromDateInput = screen.getByLabelText('From Date');
      const toDateInput = screen.getByLabelText('To Date');
      
      await user.clear(fromDateInput);
      await user.type(fromDateInput, '2024-06-15');
      await user.clear(toDateInput);
      await user.type(toDateInput, '2024-06-15');

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Reception')).toBeInTheDocument();
        expect(screen.queryByText('Rehearsal Dinner')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no events match filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      const user = userEvent.setup();
      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Filter to show events from a date with no events
      const fromDateInput = screen.getByLabelText('From Date');
      await user.clear(fromDateInput);
      await user.type(fromDateInput, '2024-07-01');

      await waitFor(() => {
        expect(screen.getByText(/No events match your filters/i)).toBeInTheDocument();
      });
    });

    it('should clear filters when clear button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      const user = userEvent.setup();
      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Apply filters
      const fromDateInput = screen.getByLabelText('From Date');
      await user.clear(fromDateInput);
      await user.type(fromDateInput, '2024-06-15');

      await waitFor(() => {
        expect(screen.queryByText('Rehearsal Dinner')).not.toBeInTheDocument();
      });

      // Clear filters
      fireEvent.click(screen.getByText('Clear Filters'));

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Reception')).toBeInTheDocument();
        expect(screen.getByText('Rehearsal Dinner')).toBeInTheDocument();
      });

      expect(fromDateInput).toHaveValue('');
    });
  });

  describe('Event Card Interactions', () => {
    it('should open preview modal when event card clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('event-card-event-1'));

      await waitFor(() => {
        expect(screen.getByTestId('event-preview-modal')).toBeInTheDocument();
      });
    });

    it('should close preview modal when close button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('event-card-event-1'));

      await waitFor(() => {
        expect(screen.getByTestId('event-preview-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('event-preview-modal')).not.toBeInTheDocument();
      });
    });

    it('should display correct event in preview modal', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('event-card-event-2'));

      await waitFor(() => {
        const modal = screen.getByTestId('event-preview-modal');
        expect(modal).toHaveTextContent('Reception');
      });
    });
  });

  describe('API Integration', () => {
    it('should call events API on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockEvents }),
      });

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/guest/events');
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<GuestEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Events')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
