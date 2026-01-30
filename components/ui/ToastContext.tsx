'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './Toast';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  showToast: (toast: Omit<ToastData, 'id'>) => void; // Alias for addToast
  removeToast: (id: string) => void;
  toasts: ToastData[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 * 
 * Provides toast notification functionality throughout the application.
 * Manages toast state and provides addToast/removeToast functions.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, showToast: addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

/**
 * Toast Container Component
 * 
 * Renders all active toasts in a fixed position at the top-right of the screen.
 * Stacks multiple toasts vertically.
 */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * useToast Hook
 * 
 * Custom hook to access toast functionality.
 * Provides addToast and removeToast functions.
 * 
 * @returns Toast context value with addToast and removeToast functions
 * @throws Error if used outside ToastProvider
 * 
 * @example
 * const { addToast } = useToast();
 * addToast({ type: 'success', message: 'Operation successful!' });
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
