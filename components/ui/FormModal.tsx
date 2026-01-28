'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { z } from 'zod';
import { Button } from './Button';
import { DynamicForm, type FormField } from './DynamicForm';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  schema: z.ZodSchema;
  fields: FormField[];
  submitLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface FormModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

/**
 * FormModal Component
 * 
 * Modal dialog component with integrated dynamic form rendering.
 * Supports keyboard navigation (Escape to close) and click-outside-to-close.
 * Prevents body scroll when open.
 * Handles form submission with loading states and validation.
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  initialData = {},
  schema,
  fields,
  submitLabel = 'Submit',
  size = 'md',
}: FormModalProps) {
  // Handle Escape key press
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

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

  // Handle form submission
  const handleSubmit = useCallback(async (data: any) => {
    await onSubmit(data);
    onClose();
  }, [onSubmit, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 md:px-6 py-4 border-b border-sage-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg md:text-xl font-semibold text-sage-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sage-400 hover:text-sage-600 transition-all duration-200 p-2 rounded-md hover:bg-sage-100 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body with Dynamic Form */}
        <div className="px-4 md:px-6 py-4">
          <DynamicForm
            fields={fields}
            initialData={initialData}
            schema={schema}
            onSubmit={handleSubmit}
            submitLabel={submitLabel}
            onCancel={onClose}
            cancelLabel="Cancel"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * FormModalSimple Component
 * 
 * Simple modal dialog component for custom content.
 * Use this when you need full control over the modal content.
 */
export function FormModalSimple({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: FormModalSimpleProps) {
  // Handle Escape key press
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 md:px-6 py-4 border-b border-sage-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg md:text-xl font-semibold text-sage-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sage-400 hover:text-sage-600 transition-all duration-200 p-2 rounded-md hover:bg-sage-100 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 md:px-6 py-4">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-4 md:px-6 py-4 border-t border-sage-200 flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 sticky bottom-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
