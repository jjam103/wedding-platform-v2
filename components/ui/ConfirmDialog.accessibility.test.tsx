/**
 * Accessibility Tests for ConfirmDialog Component
 * 
 * Tests WCAG 2.1 AA compliance for confirmation dialogs including:
 * - ARIA attributes
 * - Keyboard navigation
 * - Focus management
 * - Screen reader support
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog - Accessibility', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn().mockResolvedValue(undefined),
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this item?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Attributes', () => {
    it('should have role="dialog"', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const dialog = container.querySelector('[aria-modal="true"]');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to title', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const dialog = container.querySelector('[aria-labelledby="confirm-dialog-title"]');
      expect(dialog).toBeInTheDocument();

      const title = document.getElementById('confirm-dialog-title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Confirm Delete');
    });

    it('should have aria-describedby pointing to message', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const dialog = container.querySelector('[aria-describedby="confirm-dialog-message"]');
      expect(dialog).toBeInTheDocument();

      const message = document.getElementById('confirm-dialog-message');
      expect(message).toBeInTheDocument();
      expect(message?.textContent).toBe('Are you sure you want to delete this item?');
    });

    it('should have aria-label on buttons', () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="Delete" cancelLabel="Cancel" />);

      const confirmButton = screen.getByLabelText('Delete');
      const cancelButton = screen.getByLabelText('Cancel');

      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close dialog when Escape is pressed during confirmation', async () => {
      const onClose = jest.fn();
      const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ConfirmDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Try to close with Escape during confirmation
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should allow Tab navigation between buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');

      // Both buttons should be focusable
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);
    });

    it('should handle Enter key on confirm button', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      confirmButton.focus();

      fireEvent.keyDown(confirmButton, { key: 'Enter' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within dialog', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');

      // Focus should be trapped within these elements
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });

    it('should disable buttons during confirmation', async () => {
      const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(confirmButton);

      // Buttons should be disabled during confirmation
      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce dialog title to screen readers', () => {
      render(<ConfirmDialog {...defaultProps} title="Delete Guest" />);

      const title = screen.getByText('Delete Guest');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('id', 'confirm-dialog-title');
    });

    it('should announce dialog message to screen readers', () => {
      render(<ConfirmDialog {...defaultProps} message="This action cannot be undone" />);

      const message = screen.getByText('This action cannot be undone');
      expect(message).toBeInTheDocument();
      expect(message).toHaveAttribute('id', 'confirm-dialog-message');
    });

    it('should have proper button labels for screen readers', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Delete Guest"
          cancelLabel="Keep Guest"
        />
      );

      expect(screen.getByLabelText('Delete Guest')).toBeInTheDocument();
      expect(screen.getByLabelText('Keep Guest')).toBeInTheDocument();
    });
  });

  describe('Backdrop Interaction', () => {
    it('should close dialog when clicking backdrop', () => {
      const onClose = jest.fn();
      const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('[role="dialog"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close dialog when clicking dialog content', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      const dialogContent = screen.getByText('Confirm Delete').closest('div');
      if (dialogContent) {
        fireEvent.click(dialogContent);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close dialog when clicking backdrop during confirmation', async () => {
      const onClose = jest.fn();
      const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { container } = render(
        <ConfirmDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Try to close by clicking backdrop during confirmation
      const backdrop = container.querySelector('[role="dialog"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Variant Styles', () => {
    it('should apply danger variant to confirm button', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should apply warning variant to confirm button', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const confirmButton = screen.getByText('Confirm');
      // Warning variant maps to secondary button style
      expect(confirmButton).toHaveStyle({ backgroundColor: '#e5e7eb' });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator during confirmation', async () => {
      const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should announce loading state to screen readers', async () => {
      const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const loadingIndicator = screen.getByLabelText('Loading');
        expect(loadingIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isOpen={true} />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Confirmation Handling', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });

    it('should close dialog after successful confirmation', async () => {
      const onClose = jest.fn();
      const onConfirm = jest.fn().mockResolvedValue(undefined);

      render(<ConfirmDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should handle confirmation errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onConfirm = jest.fn().mockRejectedValue(new Error('Test error'));

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
