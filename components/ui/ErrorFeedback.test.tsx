import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  FieldValidationErrors,
  UserFriendlyError,
  SchedulingConflictError,
  CircularReferenceError,
  BulkOperationResults,
  type FieldError,
  type SchedulingConflict,
  type CircularReference,
  type BulkOperationResult,
} from './ErrorFeedback';

/**
 * Unit tests for Error Feedback components
 * 
 * Tests validation error display, conflict error display, and circular reference error display
 * Requirements: 18.1-18.4
 */
describe('ErrorFeedback Components', () => {
  describe('FieldValidationErrors', () => {
    it('should display field-level validation errors', () => {
      const errors: FieldError[] = [
        { field: 'email', message: 'Invalid email format', code: 'invalid_string' },
        { field: 'firstName', message: 'Required', code: 'required' },
      ];

      render(<FieldValidationErrors errors={errors} />);

      expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Email:/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email format/)).toBeInTheDocument();
      expect(screen.getByText(/First Name:/)).toBeInTheDocument();
      expect(screen.getByText(/Required/)).toBeInTheDocument();
    });

    it('should display multiple validation errors count', () => {
      const errors: FieldError[] = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'firstName', message: 'Required' },
        { field: 'age', message: 'Must be positive' },
      ];

      render(<FieldValidationErrors errors={errors} />);

      expect(screen.getByText(/3 Validation Errors/i)).toBeInTheDocument();
    });

    it('should format nested field names correctly', () => {
      const errors: FieldError[] = [
        { field: 'user.profile.email', message: 'Invalid email' },
      ];

      render(<FieldValidationErrors errors={errors} />);

      expect(screen.getByText(/User > Profile > Email:/)).toBeInTheDocument();
    });

    it('should not render when no errors', () => {
      const { container } = render(<FieldValidationErrors errors={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const errors: FieldError[] = [
        { field: 'email', message: 'Invalid email' },
      ];

      render(<FieldValidationErrors errors={errors} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('UserFriendlyError', () => {
    it('should display user-friendly error message for VALIDATION_ERROR', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/Please check the form for errors and try again/i)).toBeInTheDocument();
    });

    it('should display user-friendly error message for DATABASE_ERROR', () => {
      const error = {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/We encountered a problem saving your changes/i)).toBeInTheDocument();
    });

    it('should display user-friendly error message for UNAUTHORIZED', () => {
      const error = {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/You need to be logged in/i)).toBeInTheDocument();
    });

    it('should display user-friendly error message for NOT_FOUND', () => {
      const error = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/The requested item could not be found/i)).toBeInTheDocument();
    });

    it('should display user-friendly error message for CONFLICT', () => {
      const error = {
        code: 'CONFLICT',
        message: 'Duplicate entry',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/This operation conflicts with existing data/i)).toBeInTheDocument();
    });

    it('should display original message for unknown error codes', () => {
      const error = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
      };

      render(<UserFriendlyError error={error} />);

      expect(screen.getByText(/Custom error message/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      };

      render(<UserFriendlyError error={error} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('SchedulingConflictError', () => {
    it('should display scheduling conflict details', () => {
      const conflict: SchedulingConflict = {
        conflictingEvent: {
          id: 'event-1',
          name: 'Ceremony',
          startDate: '2025-06-15T14:00:00Z',
          endDate: '2025-06-15T15:00:00Z',
          location: 'Beach',
        },
        reason: 'This event overlaps with an existing event at the same location',
      };

      render(<SchedulingConflictError conflict={conflict} />);

      expect(screen.getByText(/Scheduling Conflict/i)).toBeInTheDocument();
      expect(screen.getByText(/This event overlaps with an existing event/i)).toBeInTheDocument();
      expect(screen.getByText(/Ceremony/)).toBeInTheDocument();
      expect(screen.getByText(/Location: Beach/)).toBeInTheDocument();
    });

    it('should display conflict without end date', () => {
      const conflict: SchedulingConflict = {
        conflictingEvent: {
          id: 'event-1',
          name: 'Reception',
          startDate: '2025-06-15T18:00:00Z',
        },
        reason: 'Conflict detected',
      };

      render(<SchedulingConflictError conflict={conflict} />);

      expect(screen.getByText(/Reception/)).toBeInTheDocument();
      expect(screen.getByText(/Conflict detected/)).toBeInTheDocument();
    });

    it('should display conflict without location', () => {
      const conflict: SchedulingConflict = {
        conflictingEvent: {
          id: 'event-1',
          name: 'Dinner',
          startDate: '2025-06-15T19:00:00Z',
        },
        reason: 'Time conflict',
      };

      render(<SchedulingConflictError conflict={conflict} />);

      expect(screen.getByText(/Dinner/)).toBeInTheDocument();
      expect(screen.queryByText(/Location:/)).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const conflict: SchedulingConflict = {
        conflictingEvent: {
          id: 'event-1',
          name: 'Ceremony',
          startDate: '2025-06-15T14:00:00Z',
        },
        reason: 'Conflict',
      };

      render(<SchedulingConflictError conflict={conflict} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('CircularReferenceError', () => {
    it('should display circular reference chain', () => {
      const reference: CircularReference = {
        chain: [
          { id: '1', name: 'Page A', type: 'content_page' },
          { id: '2', name: 'Page B', type: 'content_page' },
          { id: '3', name: 'Page C', type: 'content_page' },
        ],
      };

      render(<CircularReferenceError reference={reference} />);

      expect(screen.getByText(/Circular Reference Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/This operation would create a circular reference/i)).toBeInTheDocument();
      
      // Use getAllByText since "Page A" appears twice (in chain and in "Back to")
      const pageAElements = screen.getAllByText(/Page A/);
      expect(pageAElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText(/Page B/)).toBeInTheDocument();
      expect(screen.getByText(/Page C/)).toBeInTheDocument();
      expect(screen.getByText(/Back to Page A/)).toBeInTheDocument();
    });

    it('should display entity types in the chain', () => {
      const reference: CircularReference = {
        chain: [
          { id: '1', name: 'Location A', type: 'location' },
          { id: '2', name: 'Location B', type: 'location' },
        ],
      };

      render(<CircularReferenceError reference={reference} />);

      const locationTypes = screen.getAllByText(/location/i);
      expect(locationTypes.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const reference: CircularReference = {
        chain: [
          { id: '1', name: 'Page A', type: 'content_page' },
          { id: '2', name: 'Page B', type: 'content_page' },
        ],
      };

      render(<CircularReferenceError reference={reference} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('BulkOperationResults', () => {
    it('should display successful bulk operation', () => {
      const result: BulkOperationResult = {
        total: 10,
        succeeded: 10,
        failed: 0,
        errors: [],
      };

      const { container } = render(<BulkOperationResults result={result} />);

      expect(screen.getByText(/Bulk Operation Complete/i)).toBeInTheDocument();
      
      // Check that the text content exists in the container
      expect(container.textContent).toContain('10');
      expect(container.textContent).toContain('of');
      expect(container.textContent).toContain('items processed successfully');
    });

    it('should display partial success with errors', () => {
      const result: BulkOperationResult = {
        total: 10,
        succeeded: 7,
        failed: 3,
        errors: [
          { item: 'Guest 1', reason: 'Invalid email' },
          { item: 'Guest 2', reason: 'Duplicate entry' },
          { item: 'Guest 3', reason: 'Missing required field' },
        ],
      };

      const { container } = render(<BulkOperationResults result={result} />);

      // Check that the text content exists in the container
      expect(container.textContent).toContain('7');
      expect(container.textContent).toContain('of');
      expect(container.textContent).toContain('10');
      expect(container.textContent).toContain('items processed successfully');
      
      expect(screen.getByText(/3 failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed Items:/i)).toBeInTheDocument();
      expect(screen.getByText(/Guest 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email/)).toBeInTheDocument();
      expect(screen.getByText(/Guest 2:/)).toBeInTheDocument();
      expect(screen.getByText(/Duplicate entry/)).toBeInTheDocument();
    });

    it('should display all failed items', () => {
      const result: BulkOperationResult = {
        total: 5,
        succeeded: 0,
        failed: 5,
        errors: [
          { item: 'Item 1', reason: 'Error 1' },
          { item: 'Item 2', reason: 'Error 2' },
          { item: 'Item 3', reason: 'Error 3' },
          { item: 'Item 4', reason: 'Error 4' },
          { item: 'Item 5', reason: 'Error 5' },
        ],
      };

      const { container } = render(<BulkOperationResults result={result} />);

      // Check that the text content exists in the container
      expect(container.textContent).toContain('0');
      expect(container.textContent).toContain('of');
      expect(container.textContent).toContain('5');
      expect(container.textContent).toContain('items processed successfully');
      
      expect(screen.getByText(/5 failed/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Item \d:/)).toHaveLength(5);
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const result: BulkOperationResult = {
        total: 10,
        succeeded: 10,
        failed: 0,
        errors: [],
      };

      render(<BulkOperationResults result={result} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });
});
