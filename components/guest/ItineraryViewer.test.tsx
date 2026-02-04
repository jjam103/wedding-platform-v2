import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItineraryViewer } from './ItineraryViewer';
import * as itineraryService from '@/services/itineraryService';

jest.mock('@/services/itineraryService');

describe('ItineraryViewer', () => {
  const mockGuest = {
    id: 'guest-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  };

  const mockItinerary = {
    guest_id: 'guest-1',
    guest_name: 'John Doe',
    events: [
      {
        id: 'event-1',
        name: 'Wedding Ceremony',
        type: 'event' as const,
        date: '2025-06-15',
        time: '2025-06-15T14:00:00Z',
        location: 'Beach Resort',
        description: 'Main ceremony',
        rsvp_status: 'attending',
        capacity: 100,
        attending_count: 95,
        rsvp_deadline: '2025-06-01',
      },
      {
        id: 'event-2',
        name: 'Reception',
        type: 'event' as const,
        date: '2025-06-15',
        time: '2025-06-15T18:00:00Z',
        location: 'Beach Resort',
        rsvp_status: 'pending',
      },
    ],
    accommodation: {
      accommodation_name: 'Beach Resort',
      room_type: 'Deluxe Ocean View',
      check_in: '2025-06-14',
      check_out: '2025-06-16',
    },
    transportation: {
      airport_code: 'SJO',
      arrival_date: '2025-06-14T10:00:00Z',
      departure_date: '2025-06-16T15:00:00Z',
    },
    generated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (itineraryService.generateItinerary as jest.Mock).mockResolvedValue({
      success: true,
      data: mockItinerary,
    });
    (itineraryService.getCachedItinerary as jest.Mock).mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No cache' },
    });
    (itineraryService.cacheItinerary as jest.Mock).mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe('View Modes', () => {
    it('should render day-by-day view by default', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Day-by-day button should be active
      const dayByDayButton = screen.getByText('📅 Day-by-Day');
      expect(dayByDayButton).toHaveClass('bg-white');
    });

    it('should switch to calendar view when calendar button clicked', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const calendarButton = screen.getByText('📆 Calendar');
      fireEvent.click(calendarButton);

      // Calendar button should be active
      expect(calendarButton).toHaveClass('bg-white');
      
      // Should show calendar view text
      expect(screen.getByText(/Calendar view showing events by month/i)).toBeInTheDocument();
    });

    it('should switch to list view when list button clicked', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);

      // List button should be active
      expect(listButton).toHaveClass('bg-white');
      
      // Events should still be visible in list format
      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
    });
  });

  describe('Date Filtering', () => {
    it('should filter events by from date', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const fromInput = screen.getByLabelText('From:');
      fireEvent.change(fromInput, { target: { value: '2025-06-16' } });

      await waitFor(() => {
        expect(screen.queryByText('Wedding Ceremony')).not.toBeInTheDocument();
      });
    });

    it('should filter events by to date', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const toInput = screen.getByLabelText('To:');
      fireEvent.change(toInput, { target: { value: '2025-06-14' } });

      await waitFor(() => {
        expect(screen.queryByText('Wedding Ceremony')).not.toBeInTheDocument();
      });
    });

    it('should clear date filters when clear button clicked', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const fromInput = screen.getByLabelText('From:');
      fireEvent.change(fromInput, { target: { value: '2025-06-16' } });

      await waitFor(() => {
        expect(screen.queryByText('Wedding Ceremony')).not.toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });
    });
  });

  describe('PDF Export', () => {
    it('should call PDF export API when export button clicked', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(['pdf content'])),
      });

      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('📄 Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/guest/itinerary/pdf');
      });
    });
  });

  describe('Capacity Warnings', () => {
    it('should display capacity warning when < 10% remaining', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Event has 95/100 capacity (5% remaining)
      expect(screen.getByText('⚠️ 5 spots left')).toBeInTheDocument();
    });

    it('should display full warning when capacity = 0', async () => {
      const fullItinerary = {
        ...mockItinerary,
        events: [
          {
            ...mockItinerary.events[0],
            capacity: 100,
            attending_count: 100,
          },
        ],
      };

      (itineraryService.generateItinerary as jest.Mock).mockResolvedValue({
        success: true,
        data: fullItinerary,
      });

      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Full')).toBeInTheDocument();
      });
    });
  });

  describe('Deadline Alerts', () => {
    it('should display deadline alert when < 7 days remaining', async () => {
      // Mock current date to be 6 days before deadline
      const mockDate = new Date('2025-05-26');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('⏰ 6 days left')).toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });
  });

  describe('Quick RSVP Links', () => {
    it('should display "RSVP Now" link for pending events', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Reception')).toBeInTheDocument();
      });

      const rsvpLink = screen.getByText('RSVP Now →');
      expect(rsvpLink).toHaveAttribute('href', '/guest/events/event-2/rsvp');
    });

    it('should display "Update RSVP" link for attending events', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const updateLink = screen.getByText('Update RSVP →');
      expect(updateLink).toHaveAttribute('href', '/guest/events/event-1/rsvp');
    });
  });

  describe('Offline Mode', () => {
    it('should display offline notice when offline', async () => {
      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Simulate going offline
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('📡 Offline Mode')).toBeInTheDocument();
      });
    });

    it('should load from cache when available', async () => {
      (itineraryService.getCachedItinerary as jest.Mock).mockResolvedValue({
        success: true,
        data: mockItinerary,
      });

      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(itineraryService.getCachedItinerary).toHaveBeenCalledWith('guest-1');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner while fetching itinerary', () => {
      (itineraryService.generateItinerary as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ItineraryViewer guest={mockGuest as any} />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should display error message when itinerary fetch fails', async () => {
      (itineraryService.generateItinerary as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to load itinerary' },
      });

      render(<ItineraryViewer guest={mockGuest as any} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load itinerary/i)).toBeInTheDocument();
      });
    });
  });
});
