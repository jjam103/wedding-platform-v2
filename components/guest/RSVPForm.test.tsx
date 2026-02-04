/**
 * Unit Tests for RSVP Form Component
 * 
 * Tests form rendering, validation, submission, and error handling.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RSVPForm } from './RSVPForm';
import { createTestRSVP } from '@/__tests__/helpers/factories';

// Mock fetch
global.fetch = jest.fn();

describe('RSVPForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultActivityDetails = {
    name: 'Beach Volleyball',
    capacity: 50,
    capacityRemaining: 25,
    rsvpDeadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    allowsPlusOnes: true,
    isMeal: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: {} }),
    });
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/rsvp status/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /attending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maybe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /declined/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit rsvp/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show guest count field when status is attending', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/number of guests/i)).toBeInTheDocument();
      });
    });

    it('should show dietary restrictions field for meal activities when attending', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            isMeal: true,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/dietary restrictions/i)).toBeInTheDocument();
      });
    });

    it('should show plus-one checkbox when activity allows plus-ones and attending', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            allowsPlusOnes: true,
          }}
          onSuccess=  {mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/plus-one/i)).toBeInTheDocument();
      });
    });

    it('should populate form with current RSVP data', () => {
      const currentRsvp = createTestRSVP({
        status: 'attending',
        guestCount: 3,
        dietaryRestrictions: 'Vegetarian',
      });

      render(
        <RSVPForm
          activityId="test-activity"
          currentRsvp={currentRsvp}
          activityDetails={{
            ...defaultActivityDetails,
            isMeal: true,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const guestCountInput = screen.getByLabelText(/number of guests/i) as HTMLInputElement;
      expect(guestCountInput.value).toBe('3');

      const dietaryInput = screen.getByLabelText(/dietary restrictions/i) as HTMLTextAreaElement;
      expect(dietaryInput.value).toBe('Vegetarian');
    });
  });

  describe('Status Selection', () => {
    it('should update status when status button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const maybeButton = screen.getByRole('button', { name: /maybe/i });
      await user.click(maybeButton);

      expect(maybeButton).toHaveClass('border-yellow-500');
    });

    it('should hide guest count when status is not attending', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Initially attending (default)
      expect(screen.getByLabelText(/number of guests/i)).toBeInTheDocument();

      // Change to declined
      const declinedButton = screen.getByRole('button', { name: /declined/i });
      await user.click(declinedButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/number of guests/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Guest Count Validation', () => {
    it('should validate guest count is positive', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const guestCountInput = screen.getByLabelText(/number of guests/i);
      await user.clear(guestCountInput);
      
      // Try to submit with empty guest count
      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      // Form should not submit
      await waitFor(() => {
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });

    it('should validate guest count does not exceed capacity', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            capacityRemaining: 5,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const guestCountInput = screen.getByLabelText(/number of guests/i);
      await user.clear(guestCountInput);
      await user.type(guestCountInput, '10');

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/only 5 spot.*remaining/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should display remaining capacity', () => {
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            capacityRemaining: 15,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/15 spot\(s\) remaining/i)).toBeInTheDocument();
    });
  });

  describe('Deadline Validation', () => {
    it('should show error when deadline has passed', () => {
      const pastDeadline = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            rsvpDeadline: pastDeadline,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/deadline.*passed/i)).toBeInTheDocument();
    });

    it('should disable submit button when deadline has passed', () => {
      const pastDeadline = new Date(Date.now() - 86400000).toISOString();

      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            rsvpDeadline: pastDeadline,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable status buttons when deadline has passed', () => {
      const pastDeadline = new Date(Date.now() - 86400000).toISOString();

      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            rsvpDeadline: pastDeadline,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      const maybeButton = screen.getByRole('button', { name: /maybe/i });
      const declinedButton = screen.getByRole('button', { name: /declined/i });

      expect(attendingButton).toBeDisabled();
      expect(maybeButton).toBeDisabled();
      expect(declinedButton).toBeDisabled();
    });
  });

  describe('Capacity Validation', () => {
    it('should show error when capacity is full', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            capacityRemaining: 0,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full capacity.*cannot rsvp/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should show warning when capacity is almost full', () => {
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            capacity: 100,
            capacityRemaining: 5, // 5% remaining
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/almost full.*5 spot\(s\) remaining/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit new RSVP successfully', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/guest/rsvps',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('test-activity'),
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should update existing RSVP successfully', async () => {
      const currentRsvp = createTestRSVP({
        id: 'rsvp-123',
        status: 'maybe',
      });

      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          currentRsvp={currentRsvp}
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      const submitButton = screen.getByRole('button', { name: /update rsvp/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/guest/rsvps/rsvp-123',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ json: async () => ({ success: true }) }), 100))
      );

      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should display error message on submission failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: { message: 'Network error' } }),
      });

      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should sanitize dietary restrictions input', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={{
            ...defaultActivityDetails,
            isMeal: true,
          }}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const dietaryInput = screen.getByLabelText(/dietary restrictions/i);
      await user.type(dietaryInput, '<script>alert("xss")</script>Vegetarian');

      const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
      
      // Wait for button to be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.dietaryRestrictions).not.toContain('<script>');
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RSVPForm
          activityId="test-activity"
          activityDetails={defaultActivityDetails}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
