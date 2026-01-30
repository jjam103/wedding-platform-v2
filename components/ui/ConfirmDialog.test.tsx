import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

// Mock the Button component to avoid circular dependencies
jest.mock('./Button', () => ({
  Button: ({ children, onClick, disabled, loading, variant, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      data-loading={loading}
      {...props}
    >
      {loading && <span data-testid="loading-spinner">Loading...</span>}
      {children}
    </button>
  ),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  // Test rendering with various props
  describe('rendering', () => {
    it('should render when open', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with custom labels', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      );
      
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should render with warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render with danger variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveAttribute('data-variant', 'danger');
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should call onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle onConfirm errors gracefully', async () => {
      const onConfirm = jest.fn().mockRejectedValue(new Error('Test error'));
      const onClose = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Confirmation action failed:', expect.any(Error));
      });
      
      // Should not close on error
      expect(onClose).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should close when backdrop is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when dialog content is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      const dialogContent = screen.getByText('Confirm Action').closest('div');
      fireEvent.click(dialogContent!);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should close when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // Test conditional rendering
  describe('conditional rendering', () => {
    it('should show loading state during confirmation', async () => {
      const onConfirm = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      // Buttons should be disabled
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
      
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });

    it('should prevent interactions during confirmation', async () => {
      const onConfirm = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const onClose = jest.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      // Try to close during confirmation
      fireEvent.click(screen.getByRole('dialog'));
      await userEvent.keyboard('{Escape}');
      
      // Should not close
      expect(onClose).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
    });

    it('should have proper heading structure', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Confirm Action');
      expect(title).toHaveAttribute('id', 'confirm-dialog-title');
    });

    it('should have proper message structure', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const message = screen.getByText('Are you sure you want to proceed?');
      expect(message).toHaveAttribute('id', 'confirm-dialog-message');
    });

    it('should have proper button labels', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Delete Item"
          cancelLabel="Keep Item"
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: 'Keep Item' });
      const confirmButton = screen.getByRole('button', { name: 'Delete Item' });
      
      expect(cancelButton).toHaveAttribute('aria-label', 'Keep Item');
      expect(confirmButton).toHaveAttribute('aria-label', 'Delete Item');
    });
  });

  // Test body scroll prevention
  describe('body scroll prevention', () => {
    it('should prevent body scroll when open', () => {
      const originalScrollY = 100;
      Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
      
      render(<ConfirmDialog {...defaultProps} />);
      
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.top).toBe(`-${originalScrollY}px`);
      expect(document.body.style.width).toBe('100%');
    });

    it('should restore body scroll when closed', () => {
      const originalScrollY = 100;
      Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
      const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation();
      
      const { rerender } = render(<ConfirmDialog {...defaultProps} />);
      
      // Close the dialog
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
      expect(scrollToSpy).toHaveBeenCalledWith(0, originalScrollY);
      
      scrollToSpy.mockRestore();
    });

    it('should not affect body scroll when not open', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
    });
  });

  // Test keyboard event cleanup
  describe('event cleanup', () => {
    it('should add and remove keyboard event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<ConfirmDialog {...defaultProps} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});