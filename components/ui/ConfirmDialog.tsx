'use client';

import { useEffect, useCallback, useState } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

/**
 * ConfirmDialog Component
 * 
 * Modal dialog for confirming destructive actions.
 * Supports keyboard navigation (Escape to close) and click-outside-to-close.
 * Prevents body scroll when open.
 * Disables buttons during confirmation to prevent double-submission.
 * 
 * @param isOpen - Whether the dialog is open
 * @param onClose - Callback when dialog is closed
 * @param onConfirm - Async callback when user confirms the action
 * @param title - Dialog title
 * @param message - Confirmation message describing what will happen
 * @param confirmLabel - Label for confirm button (default: "Confirm")
 * @param cancelLabel - Label for cancel button (default: "Cancel")
 * @param variant - Button variant for confirm button (default: "danger")
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Handle Escape key press
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !isConfirming) {
      onClose();
    }
  }, [onClose, isConfirming]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isConfirming) {
      onClose();
    }
  }, [onClose, isConfirming]);

  // Handle confirm action
  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component via toast
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  }, [onConfirm, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Add escape key listener
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        
        // Remove escape key listener
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="px-6 py-4 border-b border-sage-200">
          <h2 
            id="confirm-dialog-title" 
            className="text-xl font-semibold text-sage-900"
          >
            {title}
          </h2>
        </div>

        {/* Dialog Body */}
        <div className="px-6 py-4">
          <p 
            id="confirm-dialog-message" 
            className="text-sage-700 text-base leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Dialog Footer */}
        <div className="px-6 py-4 border-t border-sage-200 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isConfirming}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'warning' ? 'secondary' : variant}
            onClick={handleConfirm}
            loading={isConfirming}
            disabled={isConfirming}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
