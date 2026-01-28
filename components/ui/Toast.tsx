'use client';

import { useEffect, memo } from 'react';
import type { ReactNode } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Toast Notification Component
 * 
 * Displays temporary notifications with auto-dismiss functionality.
 * Color-coded by type with slide-in animation.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @param id - Unique identifier for the toast
 * @param message - Message to display
 * @param type - Toast type (success, error, warning, info)
 * @param duration - Auto-dismiss duration in milliseconds (default: 5000)
 * @param onClose - Callback when toast is closed
 */
export const Toast = memo(function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: 'bg-jungle-50',
      borderColor: 'border-jungle-500',
      textColor: 'text-jungle-900',
      iconColor: 'text-jungle-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bgColor: 'bg-volcano-50',
      borderColor: 'border-volcano-500',
      textColor: 'text-volcano-900',
      iconColor: 'text-volcano-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bgColor: 'bg-sunset-50',
      borderColor: 'border-sunset-500',
      textColor: 'text-sunset-900',
      iconColor: 'text-sunset-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bgColor: 'bg-ocean-50',
      borderColor: 'border-ocean-500',
      textColor: 'text-ocean-900',
      iconColor: 'text-ocean-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border-l-4 rounded-lg shadow-lg p-4 mb-3
        flex items-start gap-3
        animate-slide-in-right
        max-w-md w-full
      `}
      data-testid={`toast-${type}`}
    >
      <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
        {config.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
      </div>

      <button
        onClick={onClose}
        className={`
          ${config.iconColor} hover:opacity-70
          flex-shrink-0 transition-opacity duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'success' ? 'jungle' : type === 'error' ? 'volcano' : type === 'warning' ? 'sunset' : 'ocean'}-500
          rounded
        `}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});
