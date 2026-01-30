import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'toast-1',
    message: 'Test message',
    type: 'info' as const,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test rendering with various props
  describe('rendering', () => {
    it('should render with message', () => {
      render(<Toast {...defaultProps} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render success type with correct styling', () => {
      render(<Toast {...defaultProps} type="success" />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-jungle-50', 'border-jungle-500', 'text-jungle-900');
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    });

    it('should render error type with correct styling', () => {
      render(<Toast {...defaultProps} type="error" />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-volcano-50', 'border-volcano-500', 'text-volcano-900');
      expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    });

    it('should render warning type with correct styling', () => {
      render(<Toast {...defaultProps} type="warning" />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-sunset-50', 'border-sunset-500', 'text-sunset-900');
      expect(screen.getByTestId('toast-warning')).toBeInTheDocument();
    });

    it('should render info type with correct styling', () => {
      render(<Toast {...defaultProps} type="info" />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-ocean-50', 'border-ocean-500', 'text-ocean-900');
      expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<Toast {...defaultProps} />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('should render close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'Close notification' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = jest.fn();
      render(<Toast {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Close notification' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after duration', () => {
      const onClose = jest.fn();
      render(<Toast {...defaultProps} onClose={onClose} duration={3000} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(3000);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should use default duration of 5000ms', () => {
      const onClose = jest.fn();
      render(<Toast {...defaultProps} onClose={onClose} />);
      
      jest.advanceTimersByTime(4999);
      expect(onClose).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss when duration is 0', () => {
      const onClose = jest.fn();
      render(<Toast {...defaultProps} onClose={onClose} duration={0} />);
      
      jest.advanceTimersByTime(10000);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should clear timer on unmount', () => {
      const onClose = jest.fn();
      const { unmount } = render(<Toast {...defaultProps} onClose={onClose} duration={3000} />);
      
      jest.advanceTimersByTime(1000);
      unmount();
      
      jest.advanceTimersByTime(3000);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // Test conditional rendering
  describe('conditional rendering', () => {
    it('should render different icons for each type', () => {
      const { rerender } = render(<Toast {...defaultProps} type="success" />);
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();

      rerender(<Toast {...defaultProps} type="error" />);
      expect(screen.getByTestId('toast-error')).toBeInTheDocument();

      rerender(<Toast {...defaultProps} type="warning" />);
      expect(screen.getByTestId('toast-warning')).toBeInTheDocument();

      rerender(<Toast {...defaultProps} type="info" />);
      expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long message that should wrap properly and not overflow the toast container';
      render(<Toast {...defaultProps} message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
      const messageElement = screen.getByText(longMessage);
      expect(messageElement).toHaveClass('break-words');
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have proper role and aria-live', () => {
      render(<Toast {...defaultProps} />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'Close notification' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });
  });
});
