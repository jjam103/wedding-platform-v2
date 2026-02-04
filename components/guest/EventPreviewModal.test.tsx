import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EventPreviewModal } from './EventPreviewModal';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('EventPreviewModal', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Wedding Ceremony',
    date: '2024-06-15T16:00:00Z',
    time: '4:00 PM',
    location: 'Sunset Beach',
    description: 'Join us for our special day',
    activities: [
      { id: 'activity-1', title: 'Ceremony' },
      { id: 'activity-2', title: 'Reception' },
    ],
    slug: 'wedding-ceremony',
  };

  const mockRSVPStatus = {
    status: 'attending' as const,
    guestCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/guest/events/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEvent }),
        });
      }
      if (url.includes('/api/guest/rsvps')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [mockRSVPStatus] }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      expect(screen.getByText('Event Preview')).toBeInTheDocument();
      // Check for loading spinner by class name
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render event details after loading', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(screen.getByText('Sunset Beach')).toBeInTheDocument();
      expect(screen.getByText('4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Join us for our special day')).toBeInTheDocument();
    });

    it('should render activities list', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      expect(screen.getByText('Ceremony')).toBeInTheDocument();
      expect(screen.getByText('Reception')).toBeInTheDocument();
    });

    it('should render RSVP status badge', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Attending')).toBeInTheDocument();
      });

      expect(screen.getByText('Guest count: 2')).toBeInTheDocument();
    });

    it('should render date in formatted style', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Saturday, June 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should not render optional fields when missing', async () => {
      const eventWithoutOptionals = {
        ...mockEvent,
        time: undefined,
        location: undefined,
        description: undefined,
        activities: [],
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: eventWithoutOptionals }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(screen.queryByText('4:00 PM')).not.toBeInTheDocument();
      expect(screen.queryByText('Sunset Beach')).not.toBeInTheDocument();
      expect(screen.queryByText('Join us for our special day')).not.toBeInTheDocument();
      expect(screen.queryByText('Activities')).not.toBeInTheDocument();
    });
  });

  describe('RSVP Status Display', () => {
    it('should display attending status with green badge', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Attending');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display declined status with red badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'declined' }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Declined');
        expect(badge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should display maybe status with yellow badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'maybe' }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Maybe');
        expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display pending status with gray badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'pending' }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Pending');
        expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });

    it('should not display status badge when no RSVP exists', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(screen.queryByText('Attending')).not.toBeInTheDocument();
      expect(screen.queryByText('Declined')).not.toBeInTheDocument();
      expect(screen.queryByText('Maybe')).not.toBeInTheDocument();
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when event fetch fails', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ success: false, error: { message: 'Event not found' } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load event')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        // The error message displayed is the actual error message from the catch block
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      render(<EventPreviewModal eventId="event-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = jest.fn();
      const { container } = render(<EventPreviewModal eventId="event-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(<EventPreviewModal eventId="event-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const onClose = jest.fn();
      render(<EventPreviewModal eventId="event-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const modalContent = screen.getByText('Wedding Ceremony');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to event detail page with slug when View Full Details is clicked', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Full Details');
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/event/wedding-ceremony');
    });

    it('should navigate to event detail page with ID when slug is missing', async () => {
      const eventWithoutSlug = { ...mockEvent, slug: undefined };
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: eventWithoutSlug }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [mockRSVPStatus] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Full Details');
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/event/event-123');
    });

    it('should navigate to RSVP page when RSVP Now is clicked', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'pending' }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP Now');
      fireEvent.click(rsvpButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/guest/rsvp?eventId=event-123');
    });

    it('should not show RSVP Now button when already attending', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(screen.queryByText('RSVP Now')).not.toBeInTheDocument();
    });

    it('should show RSVP Now button when status is pending', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'pending' }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP Now')).toBeInTheDocument();
      });
    });

    it('should show RSVP Now button when no RSVP exists', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/events/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockEvent }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP Now')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<EventPreviewModal eventId="event-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const onClose = jest.fn();
      render(<EventPreviewModal eventId="event-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      // Tab to close button
      const closeButton = screen.getByLabelText('Close');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Press Enter to close
      fireEvent.keyDown(closeButton, { key: 'Enter' });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
