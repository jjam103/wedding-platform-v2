/**
 * Property-Based Test: RSVP Deadline Enforcement
 * 
 * Feature: destination-wedding-platform
 * Property 8: RSVP Deadline Enforcement
 * 
 * Validates: Requirements 10.5
 * 
 * Property: RSVPs cannot be submitted or updated after the deadline has passed.
 * The system must enforce deadline constraints and display appropriate error messages.
 */

import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RSVPForm } from '@/components/guest/RSVPForm';

describe('Feature: destination-wedding-platform, Property 8: RSVP Deadline Enforcement', () => {
  // Arbitrary for generating dates relative to now
  const pastDateArbitrary = fc.integer({ min: 1, max: 365 }).map(daysAgo => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  });

  const futureDateArbitrary = fc.integer({ min: 1, max: 365 }).map(daysAhead => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString();
  });

  const rsvpStatusArbitrary = fc.constantFrom('attending', 'declined', 'maybe');

  it('should prevent RSVP submission when deadline has passed', () => {
    fc.assert(
      fc.property(
        pastDateArbitrary,
        rsvpStatusArbitrary,
        (deadline, status) => {
          const mockOnSuccess = jest.fn();
          const mockOnCancel = jest.fn();

          const { container } = render(
            <RSVPForm
              activityId="test-activity"
              activityDetails={{
                name: 'Test Activity',
                capacity: 50,
                capacityRemaining: 25,
                rsvpDeadline: deadline,
                allowsPlusOnes: true,
                isMeal: false,
              }}
              onSuccess={mockOnSuccess}
              onCancel={mockOnCancel}
            />
          );

          // Should display deadline warning
          const warningText = screen.getByText(/deadline.*passed/i);
          expect(warningText).toBeInTheDocument();

          // Submit button should be disabled
          const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
          expect(submitButton).toBeDisabled();

          // Status buttons should be disabled
          const statusButtons = container.querySelectorAll('button[type="button"]');
          statusButtons.forEach(button => {
            if (button.textContent?.match(/attending|maybe|declined/i)) {
              expect(button).toBeDisabled();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow RSVP submission when deadline is in the future', () => {
    fc.assert(
      fc.property(
        futureDateArbitrary,
        rsvpStatusArbitrary,
        (deadline, status) => {
          const mockOnSuccess = jest.fn();
          const mockOnCancel = jest.fn();

          const { container } = render(
            <RSVPForm
              activityId="test-activity"
              activityDetails={{
                name: 'Test Activity',
                capacity: 50,
                capacityRemaining: 25,
                rsvpDeadline: deadline,
                allowsPlusOnes: true,
                isMeal: false,
              }}
              onSuccess={mockOnSuccess}
              onCancel={mockOnCancel}
            />
          );

          // Should NOT display deadline warning
          const warningText = screen.queryByText(/deadline.*passed/i);
          expect(warningText).not.toBeInTheDocument();

          // Submit button should NOT be disabled (unless other validation fails)
          const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
          expect(submitButton).not.toBeDisabled();

          // Status buttons should NOT be disabled
          const statusButtons = container.querySelectorAll('button[type="button"]');
          statusButtons.forEach(button => {
            if (button.textContent?.match(/attending|maybe|declined/i)) {
              expect(button).not.toBeDisabled();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error message when attempting to submit after deadline', async () => {
    fc.assert(
      fc.asyncProperty(
        pastDateArbitrary,
        async (deadline) => {
          const mockOnSuccess = jest.fn();
          const mockOnCancel = jest.fn();

          render(
            <RSVPForm
              activityId="test-activity"
              activityDetails={{
                name: 'Test Activity',
                capacity: 50,
                capacityRemaining: 25,
                rsvpDeadline: deadline,
                allowsPlusOnes: true,
                isMeal: false,
              }}
              onSuccess={mockOnSuccess}
              onCancel={mockOnCancel}
            />
          );

          // Error message should be visible
          await waitFor(() => {
            const errorMessage = screen.getByText(/deadline.*passed.*no longer submit/i);
            expect(errorMessage).toBeInTheDocument();
          });

          // onSuccess should never be called
          expect(mockOnSuccess).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: deadline exactly at current time', () => {
    const now = new Date().toISOString();
    const mockOnSuccess = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <RSVPForm
        activityId="test-activity"
        activityDetails={{
          name: 'Test Activity',
          capacity: 50,
          capacityRemaining: 25,
          rsvpDeadline: now,
          allowsPlusOnes: true,
          isMeal: false,
        }}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Should treat as passed (deadline is not in the future)
    const warningText = screen.queryByText(/deadline.*passed/i);
    expect(warningText).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
    expect(submitButton).toBeDisabled();
  });

  it('should allow RSVP when no deadline is set', () => {
    fc.assert(
      fc.property(
        rsvpStatusArbitrary,
        (status) => {
          const mockOnSuccess = jest.fn();
          const mockOnCancel = jest.fn();

          render(
            <RSVPForm
              activityId="test-activity"
              activityDetails={{
                name: 'Test Activity',
                capacity: 50,
                capacityRemaining: 25,
                rsvpDeadline: null,
                allowsPlusOnes: true,
                isMeal: false,
              }}
              onSuccess={mockOnSuccess}
              onCancel={mockOnCancel}
            />
          );

          // Should NOT display deadline warning
          const warningText = screen.queryByText(/deadline.*passed/i);
          expect(warningText).not.toBeInTheDocument();

          // Submit button should NOT be disabled
          const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
          expect(submitButton).not.toBeDisabled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
