import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ActivityPreviewModal } from './ActivityPreviewModal';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ActivityPreviewModal', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockActivity = {
    id: 'activity-123',
    title: 'Beach Volleyball',
    date: '2024-06-14T10:00:00Z',
    time: '10:00 AM',
    location: 'Sunset Beach',
    description: 'Fun beach games and activities',
    capacity: 20,
    capacityRemaining: 8,
    cost: 50,
    hostSubsidy: 20,
    slug: 'beach-volleyball',
  };

  const mockRSVPStatus = {
    status: 'attending' as const,
    guestCount: 2,
    dietaryRestrictions: 'Vegetarian',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/guest/activities/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockActivity }),
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
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      expect(screen.getByText('Activity Preview')).toBeInTheDocument();
      // Check for loading spinner by class name
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render activity details after loading', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.getByText('Sunset Beach')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Fun beach games and activities')).toBeInTheDocument();
    });

    it('should render capacity information', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText(/8 \/ 20 spots/)).toBeInTheDocument();
      });
    });

    it('should render cost information with subsidy', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('$30.00')).toBeInTheDocument(); // 50 - 20 = 30
        expect(screen.getByText(/\$50\.00 - \$20\.00 host subsidy/)).toBeInTheDocument();
      });
    });

    it('should render RSVP status badge', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Attending')).toBeInTheDocument();
      });

      expect(screen.getByText('Guest count: 2')).toBeInTheDocument();
    });

    it('should render dietary restrictions when present', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Dietary Restrictions')).toBeInTheDocument();
        expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      });
    });

    it('should not render optional fields when missing', async () => {
      const activityWithoutOptionals = {
        id: 'activity-123',
        title: 'Beach Volleyball',
        date: '2024-06-14T10:00:00Z',
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: activityWithoutOptionals }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText('10:00 AM')).not.toBeInTheDocument();
      expect(screen.queryByText('Sunset Beach')).not.toBeInTheDocument();
      expect(screen.queryByText('Fun beach games and activities')).not.toBeInTheDocument();
      expect(screen.queryByText(/spots/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Capacity Status Display', () => {
    it('should display "Available" status when capacity is not near full', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText(/8 \/ 20 spots Available/)).toBeInTheDocument();
      });
    });

    it('should display "Almost Full" status when capacity is 90% or more', async () => {
      const almostFullActivity = {
        ...mockActivity,
        capacity: 20,
        capacityRemaining: 1, // 95% full
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: almostFullActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText(/1 \/ 20 spots Almost Full/)).toBeInTheDocument();
      });
    });

    it('should display "Full" status when capacity is 0', async () => {
      const fullActivity = {
        ...mockActivity,
        capacity: 20,
        capacityRemaining: 0,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: fullActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 20 spots Full/)).toBeInTheDocument();
      });
    });

    it('should not display capacity status when capacity is not set', async () => {
      const activityWithoutCapacity = {
        ...mockActivity,
        capacity: undefined,
        capacityRemaining: undefined,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: activityWithoutCapacity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText(/spots/)).not.toBeInTheDocument();
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate guest cost correctly with subsidy', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('$30.00')).toBeInTheDocument(); // 50 - 20 = 30
      });
    });

    it('should display full cost when no subsidy', async () => {
      const activityWithoutSubsidy = {
        ...mockActivity,
        cost: 50,
        hostSubsidy: 0,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: activityWithoutSubsidy }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('$50.00')).toBeInTheDocument();
      });

      expect(screen.queryByText(/host subsidy/)).not.toBeInTheDocument();
    });

    it('should not display cost when cost is 0', async () => {
      const freeActivity = {
        ...mockActivity,
        cost: 0,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: freeActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Cost per Guest/)).not.toBeInTheDocument();
    });

    it('should not display cost when cost is undefined', async () => {
      const activityWithoutCost = {
        ...mockActivity,
        cost: undefined,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: activityWithoutCost }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Cost per Guest/)).not.toBeInTheDocument();
    });
  });

  describe('RSVP Status Display', () => {
    it('should display attending status with green badge', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Attending');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display declined status with red badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Declined');
        expect(badge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should display maybe status with yellow badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Maybe');
        expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display pending status with gray badge', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        const badge = screen.getByText('Pending');
        expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });

    it('should not display dietary restrictions when not present', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
          });
        }
        if (url.includes('/api/guest/rsvps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{ status: 'attending', guestCount: 2 }],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText('Your Dietary Restrictions')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when activity fetch fails', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ success: false, error: { message: 'Activity not found' } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        // The error message displayed is the actual error message from the catch block
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      render(<ActivityPreviewModal activityId="activity-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = jest.fn();
      const { container } = render(<ActivityPreviewModal activityId="activity-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(<ActivityPreviewModal activityId="activity-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const onClose = jest.fn();
      render(<ActivityPreviewModal activityId="activity-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const modalContent = screen.getByText('Beach Volleyball');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to activity detail page with slug when View Full Details is clicked', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Full Details');
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/activity/beach-volleyball');
    });

    it('should navigate to activity detail page with ID when slug is missing', async () => {
      const activityWithoutSlug = { ...mockActivity, slug: undefined };
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: activityWithoutSlug }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Full Details');
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/activity/activity-123');
    });

    it('should navigate to RSVP page when RSVP Now is clicked', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP Now');
      fireEvent.click(rsvpButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/guest/rsvp?activityId=activity-123');
    });

    it('should not show RSVP Now button when already attending', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.queryByText('RSVP Now')).not.toBeInTheDocument();
    });

    it('should show RSVP Now button when status is pending', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP Now')).toBeInTheDocument();
      });
    });

    it('should show RSVP Now button when no RSVP exists', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/guest/activities/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockActivity }),
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

      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP Now')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ActivityPreviewModal activityId="activity-123" onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const onClose = jest.fn();
      render(<ActivityPreviewModal activityId="activity-123" onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
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
