import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineRSVPEditor } from './InlineRSVPEditor';

// Mock fetch
global.fetch = jest.fn();

describe('InlineRSVPEditor', () => {
  const mockGuestId = 'guest-123';
  const mockRSVPData = {
    activities: [
      {
        id: 'rsvp-1',
        name: 'Beach Volleyball',
        type: 'activity',
        status: 'pending',
        capacity: 20,
        capacityRemaining: 5,
        requiresGuestCount: true,
        requiresDietaryInfo: false,
        date: '2024-06-15',
        time: '14:00',
        location: 'Beach',
      },
      {
        id: 'rsvp-2',
        name: 'Welcome Dinner',
        type: 'activity',
        status: 'attending',
        guestCount: 2,
        dietaryRestrictions: 'Vegetarian',
        capacity: 50,
        capacityRemaining: 10,
        requiresGuestCount: true,
        requiresDietaryInfo: true,
        date: '2024-06-14',
        time: '19:00',
        location: 'Restaurant',
      },
    ],
    events: [
      {
        id: 'rsvp-3',
        name: 'Wedding Ceremony',
        type: 'event',
        status: 'attending',
        date: '2024-06-16',
        time: '16:00',
        location: 'Beach',
      },
    ],
    accommodations: [
      {
        id: 'acc-1',
        name: 'Hotel Paradise - Deluxe Room',
        type: 'accommodation',
        status: 'attending',
        date: '2024-06-14',
        location: 'Downtown',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockRSVPData }),
    });
  });

  describe('Component Rendering', () => {
    it('should display loading state initially', () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);
      expect(screen.getByText('Loading RSVPs...')).toBeInTheDocument();
    });

    it('should load and display RSVP sections', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Accommodations')).toBeInTheDocument();
      });

      expect(screen.getByText('(2)')).toBeInTheDocument(); // 2 activities
      expect(screen.getByText('(1)')).toBeInTheDocument(); // 1 event
    });

    it('should fetch RSVPs on mount', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/guests/${mockGuestId}/rsvps`
        );
      });
    });
  });

  describe('Section Expansion', () => {
    it('should expand section when clicked', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
        expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      });
    });

    it('should collapse section when clicked again', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      
      // Expand
      fireEvent.click(activitiesButton!);
      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(activitiesButton!);
      await waitFor(() => {
        expect(screen.queryByText('Beach Volleyball')).not.toBeInTheDocument();
      });
    });

    it('should display empty state when section has no items', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: { activities: [], events: [], accommodations: [] },
        }),
      });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('No activities found')).toBeInTheDocument();
      });
    });
  });

  describe('Status Toggle', () => {
    it('should display current status correctly', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument(); // Beach Volleyball
        expect(screen.getByText('Attending')).toBeInTheDocument(); // Welcome Dinner
      });
    });

    it('should update status when toggle button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: {
              id: 'rsvp-1',
              status: 'attending',
              capacity: 20,
              capacityRemaining: 4,
            },
          }),
        });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      // Click status toggle button
      const pendingButton = screen.getByText('Pending').closest('button');
      fireEvent.click(pendingButton!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/guests/${mockGuestId}/rsvps/rsvp-1`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: 'attending' }),
          })
        );
      });
    });

    it('should show loading spinner while saving', async () => {
      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockReturnValueOnce({
          json: async () => {
            await updatePromise;
            return {
              success: true,
              data: { id: 'rsvp-1', status: 'attending' },
            };
          },
        });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('Pending').closest('button');
      fireEvent.click(pendingButton!);

      // Should show loading spinner
      await waitFor(() => {
        const spinners = screen.getAllByRole('img', { hidden: true });
        expect(spinners.length).toBeGreaterThan(0);
      });

      resolveUpdate();
    });

    it('should rollback on error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: false,
            error: { code: 'DATABASE_ERROR', message: 'Update failed' },
          }),
        });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('Pending').closest('button');
      fireEvent.click(pendingButton!);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument(); // Rolled back
      });
    });
  });

  describe('Capacity Validation', () => {
    it('should display capacity information', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('5 / 20 spots remaining')).toBeInTheDocument();
        expect(screen.getByText('10 / 50 spots remaining')).toBeInTheDocument();
      });
    });

    it('should show warning when capacity is low', async () => {
      const lowCapacityData = {
        ...mockRSVPData,
        activities: [
          {
            ...mockRSVPData.activities[0],
            capacity: 20,
            capacityRemaining: 1, // < 10%
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true, data: lowCapacityData }),
      });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Nearly Full')).toBeInTheDocument();
      });
    });

    it('should show full indicator when capacity is 0', async () => {
      const fullCapacityData = {
        ...mockRSVPData,
        activities: [
          {
            ...mockRSVPData.activities[0],
            capacity: 20,
            capacityRemaining: 0,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true, data: fullCapacityData }),
      });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('🚫 Full')).toBeInTheDocument();
      });
    });

    it('should prevent attending status when capacity is 0', async () => {
      const fullCapacityData = {
        ...mockRSVPData,
        activities: [
          {
            ...mockRSVPData.activities[0],
            status: 'pending',
            capacity: 20,
            capacityRemaining: 0,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true, data: fullCapacityData }),
      });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('Pending').closest('button');
      fireEvent.click(pendingButton!);

      await waitFor(() => {
        expect(screen.getByText(/Cannot RSVP as attending/)).toBeInTheDocument();
      });

      // Should not make API call
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('Guest Count Input', () => {
    it('should show guest count input when attending and required', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('should not show guest count input when not attending', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      // Beach Volleyball is pending, should not show guest count
      const guestCountInputs = screen.queryAllByLabelText('Number of Guests');
      expect(guestCountInputs.length).toBe(1); // Only for Welcome Dinner
    });

    it('should update guest count', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: { id: 'rsvp-2', guestCount: 3 },
          }),
        });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      });

      const guestCountInput = screen.getByLabelText('Number of Guests');
      fireEvent.change(guestCountInput, { target: { value: '3' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/guests/${mockGuestId}/rsvps/rsvp-2`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ guestCount: 3 }),
          })
        );
      });
    });
  });

  describe('Dietary Restrictions Input', () => {
    it('should show dietary restrictions input when attending and required', async () => {
      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Dietary Restrictions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vegetarian')).toBeInTheDocument();
    });

    it('should update dietary restrictions', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: { id: 'rsvp-2', dietaryRestrictions: 'Vegan' },
          }),
        });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByLabelText('Dietary Restrictions')).toBeInTheDocument();
      });

      const dietaryInput = screen.getByLabelText('Dietary Restrictions');
      fireEvent.change(dietaryInput, { target: { value: 'Vegan' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/guests/${mockGuestId}/rsvps/rsvp-2`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ dietaryRestrictions: 'Vegan' }),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to load RSVPs' },
        }),
      });

      render(<InlineRSVPEditor guestId={mockGuestId} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load RSVPs')).toBeInTheDocument();
      });
    });

    it('should call onUpdate callback after successful update', async () => {
      const onUpdate = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockRSVPData }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: { id: 'rsvp-1', status: 'attending' },
          }),
        });

      render(<InlineRSVPEditor guestId={mockGuestId} onUpdate={onUpdate} />);

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      const activitiesButton = screen.getByText('Activities').closest('button');
      fireEvent.click(activitiesButton!);

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('Pending').closest('button');
      fireEvent.click(pendingButton!);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });
});
