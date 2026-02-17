/**
 * Unit Tests for ActivityCard Component
 * 
 * Tests card rendering, capacity warnings, RSVP status badges, cost display, and interactions.
 * 
 * Requirements: 9.3, 9.4
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityCard } from './ActivityCard';
import { createMockActivity } from '@/__tests__/helpers/factories';

describe('ActivityCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Card Rendering', () => {
    it('should render activity name', () => {
      const activity = createMockActivity({
        name: 'Beach Volleyball',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
    });

    it('should render activity type badge', () => {
      const activity = createMockActivity({
        activity_type: 'ceremony',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('ceremony')).toBeInTheDocument();
    });

    it('should render date and time', () => {
      const activity = createMockActivity({
        start_time: '2025-06-15T14:30:00Z',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      // Check for date (format: MMM d, yyyy)
      expect(screen.getByText(/Jun 15, 2025/i)).toBeInTheDocument();
      
      // Check for time (format: h:mm a) - time will vary based on timezone
      expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/i)).toBeInTheDocument();
    });

    it('should render location indicator when locationId present', () => {
      const activity = createMockActivity({
        location_id: 'location-123',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/view location/i)).toBeInTheDocument();
    });

    it('should render capacity when provided', () => {
      const activity = createMockActivity({
        capacity: 50,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/50 capacity/i)).toBeInTheDocument();
    });

    it('should render cost when netCost > 0', () => {
      const activity = createMockActivity({
        netCost: 75.50,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/\$75\.50 per person/i)).toBeInTheDocument();
    });

    it('should not render cost when netCost is 0', () => {
      const activity = createMockActivity({
        netCost: 0,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.queryByText(/per person/i)).not.toBeInTheDocument();
    });
  });

  describe('Capacity Warnings', () => {
    it('should display "Full" badge when at capacity', () => {
      const activity = createMockActivity({
        capacity: 50,
        capacityRemaining: 0,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/⚠️ Full/i)).toBeInTheDocument();
    });

    it('should display "Almost Full" badge when < 10% capacity remaining', () => {
      const activity = createMockActivity({
        capacity: 100,
        capacityRemaining: 5, // 5% remaining
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/⚠️ Almost Full/i)).toBeInTheDocument();
    });

    it('should display spots left when capacity available', () => {
      const activity = createMockActivity({
        capacity: 50,
        capacityRemaining: 25,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/25 spots left/i)).toBeInTheDocument();
    });

    it('should not display capacity badge when capacity is null', () => {
      const activity = createMockActivity({
        capacity: null,
        capacityRemaining: undefined,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.queryByText(/spots left/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/full/i)).not.toBeInTheDocument();
    });
  });

  describe('RSVP Status Badges', () => {
    it('should display "Pending" badge for pending status', () => {
      const activity = createMockActivity({
        rsvpStatus: 'pending',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display "Attending" badge for attending status', () => {
      const activity = createMockActivity({
        rsvpStatus: 'attending',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Attending')).toBeInTheDocument();
    });

    it('should display "Declined" badge for declined status', () => {
      const activity = createMockActivity({
        rsvpStatus: 'declined',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Declined')).toBeInTheDocument();
    });

    it('should display "Maybe" badge for maybe status', () => {
      const activity = createMockActivity({
        rsvpStatus: 'maybe',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Maybe')).toBeInTheDocument();
    });

    it('should display "Pending" badge when rsvpStatus is undefined', () => {
      const activity = createMockActivity({
        rsvpStatus: undefined,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when card clicked', async () => {
      const activity = createMockActivity({
        name: 'Beach Volleyball',
      });

      const user = userEvent.setup();
      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      const card = screen.getByText('Beach Volleyball').closest('div');
      if (card) {
        await user.click(card);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when "View Details" button clicked', async () => {
      const activity = createMockActivity({
        name: 'Beach Volleyball',
      });

      const user = userEvent.setup();
      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      const viewDetailsButton = screen.getByText(/view details/i);
      await user.click(viewDetailsButton);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should render with proper styling classes', () => {
      const activity = createMockActivity({
        name: 'Beach Volleyball',
      });

      const { container } = render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      // Check for responsive and styling classes
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-md');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have hover effect classes', () => {
      const activity = createMockActivity({
        name: 'Beach Volleyball',
      });

      const { container } = render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      const card = container.querySelector('.hover\\:shadow-lg');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle activity with all optional fields null', () => {
      const activity = createMockActivity({
        name: 'Minimal Activity',
        description: null,
        location_id: null,
        capacity: null,
        netCost: 0,
        rsvpStatus: undefined,
        capacityRemaining: undefined,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText('Minimal Activity')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should handle very long activity names', () => {
      const activity = createMockActivity({
        name: 'This is a very long activity name that should be truncated or wrapped properly to fit within the card layout without breaking the design',
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      const nameElement = screen.getByText(/This is a very long activity name/i);
      expect(nameElement).toBeInTheDocument();
      expect(nameElement).toHaveClass('line-clamp-2');
    });

    it('should handle zero capacity remaining', () => {
      const activity = createMockActivity({
        capacity: 50,
        capacityRemaining: 0,
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      expect(screen.getByText(/⚠️ Full/i)).toBeInTheDocument();
    });

    it('should handle negative capacity remaining (edge case)', () => {
      const activity = createMockActivity({
        capacity: 50,
        capacityRemaining: -5, // Over capacity
      });

      render(<ActivityCard activity={activity} onClick={mockOnClick} />);

      // Should still show as full
      expect(screen.getByText(/⚠️ Full/i)).toBeInTheDocument();
    });
  });
});
