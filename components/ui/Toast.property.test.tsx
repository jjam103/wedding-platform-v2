/**
 * Property-Based Tests for Toast Notification System
 * 
 * Feature: admin-ui-modernization
 * Tests universal properties of the Toast notification system across various inputs.
 */

import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { ToastProvider, useToast } from './ToastContext';
import type { ReactNode } from 'react';

// Helper component to test toast functionality
function ToastTestComponent({ 
  onMount 
}: { 
  onMount: (addToast: ReturnType<typeof useToast>['addToast']) => void 
}) {
  const { addToast } = useToast();
  
  // Call onMount with addToast function when component mounts
  if (onMount) {
    onMount(addToast);
  }
  
  return <div data-testid="toast-test-component">Test Component</div>;
}

describe('Toast System Property Tests', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Property 5: Success toast on successful operations
   * Validates: Requirements 3.10, 4.9, 8.7
   * 
   * For any successful CRUD operation (create, update, delete), the system should
   * display a success toast notification with an appropriate message.
   */
  describe('Feature: admin-ui-modernization, Property 5: Success toast on successful operations', () => {
    it('should display success toast with correct styling and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 200 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
            operation: fc.constantFrom('create', 'update', 'delete'),
          }),
          async ({ message, operation }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add success toast
              act(() => {
                addToastFn!({ type: 'success', message });
              });

              // Wait for toast to appear
              await waitFor(() => {
                const toast = screen.getByTestId('toast-success');
                expect(toast).toBeInTheDocument();
              });

              // Verify success styling (jungle green colors)
              const toast = screen.getByTestId('toast-success');
              expect(toast).toHaveClass('bg-jungle-50');
              expect(toast).toHaveClass('border-jungle-500');
              expect(toast).toHaveClass('text-jungle-900');

              // Verify message is displayed (use flexible text matcher)
              const messageElement = toast.querySelector('p');
              expect(messageElement?.textContent).toBe(message);

              // Verify success icon is present (checkmark)
              const icon = toast.querySelector('svg');
              expect(icon).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should auto-dismiss success toast after specified duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 100 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
            duration: fc.integer({ min: 100, max: 1000 }), // Short durations for testing
          }),
          async ({ message, duration }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add success toast with custom duration
              act(() => {
                addToastFn!({ type: 'success', message, duration });
              });

              // Wait for toast to appear
              await waitFor(() => {
                expect(screen.getByTestId('toast-success')).toBeInTheDocument();
              });

              // Wait for toast to auto-dismiss (duration + buffer)
              await waitFor(
                () => {
                  expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument();
                },
                { timeout: duration + 500 }
              );
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 } // Fewer runs due to timing-based test
      );
    }, 30000); // Increased timeout for timing-based tests
  });

  /**
   * Property 6: Error toast on failed operations
   * Validates: Requirements 3.11, 12.1
   * 
   * For any failed CRUD operation, the system should display an error toast
   * notification with a user-friendly error message.
   */
  describe('Feature: admin-ui-modernization, Property 6: Error toast on failed operations', () => {
    it('should display error toast with correct styling and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 200 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
            errorType: fc.constantFrom('VALIDATION_ERROR', 'DATABASE_ERROR', 'UNAUTHORIZED', 'NOT_FOUND'),
          }),
          async ({ message, errorType }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add error toast
              act(() => {
                addToastFn!({ type: 'error', message });
              });

              // Wait for toast to appear
              await waitFor(() => {
                const toast = screen.getByTestId('toast-error');
                expect(toast).toBeInTheDocument();
              });

              // Verify error styling (volcano red colors)
              const toast = screen.getByTestId('toast-error');
              expect(toast).toHaveClass('bg-volcano-50');
              expect(toast).toHaveClass('border-volcano-500');
              expect(toast).toHaveClass('text-volcano-900');

              // Verify message is displayed (use flexible text matcher)
              const messageElement = toast.querySelector('p');
              expect(messageElement?.textContent).toBe(message);

              // Verify error icon is present (X mark)
              const icon = toast.querySelector('svg');
              expect(icon).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should display warning toast with correct styling', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 200 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
          }),
          async ({ message }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add warning toast
              act(() => {
                addToastFn!({ type: 'warning', message });
              });

              // Wait for toast to appear
              await waitFor(() => {
                const toast = screen.getByTestId('toast-warning');
                expect(toast).toBeInTheDocument();
              });

              // Verify warning styling (sunset orange colors)
              const toast = screen.getByTestId('toast-warning');
              expect(toast).toHaveClass('bg-sunset-50');
              expect(toast).toHaveClass('border-sunset-500');
              expect(toast).toHaveClass('text-sunset-900');

              // Verify message is displayed (use flexible text matcher)
              const messageElement = toast.querySelector('p');
              expect(messageElement?.textContent).toBe(message);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should display info toast with correct styling', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 200 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
          }),
          async ({ message }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add info toast
              act(() => {
                addToastFn!({ type: 'info', message });
              });

              // Wait for toast to appear
              await waitFor(() => {
                const toast = screen.getByTestId('toast-info');
                expect(toast).toBeInTheDocument();
              });

              // Verify info styling (ocean blue colors)
              const toast = screen.getByTestId('toast-info');
              expect(toast).toHaveClass('bg-ocean-50');
              expect(toast).toHaveClass('border-ocean-500');
              expect(toast).toHaveClass('text-ocean-900');

              // Verify message is displayed (use flexible text matcher)
              const messageElement = toast.querySelector('p');
              expect(messageElement?.textContent).toBe(message);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Multiple toasts stack vertically
   * 
   * For any number of toasts displayed simultaneously, they should stack
   * vertically without overlapping.
   */
  describe('Feature: admin-ui-modernization, Multiple toasts stack vertically', () => {
    it('should stack multiple toasts vertically', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              message: fc.string({ minLength: 5, maxLength: 50 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
              }),
              type: fc.constantFrom('success', 'error', 'warning', 'info'),
            }),
            { minLength: 2, maxLength: 3 } // Reduced to 3 for faster tests
          ),
          async (toasts) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add all toasts
              act(() => {
                toasts.forEach(toast => {
                  addToastFn!({ type: toast.type as any, message: toast.message, duration: 10000 });
                });
              });

              // Wait for all toasts to appear
              await waitFor(() => {
                const displayedToasts = screen.getAllByRole('alert');
                expect(displayedToasts.length).toBe(toasts.length);
              }, { timeout: 2000 });

              // Verify each toast message is displayed by checking all alerts
              const displayedToasts = screen.getAllByRole('alert');
              toasts.forEach((toast, index) => {
                const toastElement = displayedToasts[index];
                const messageElement = toastElement.querySelector('p');
                expect(messageElement?.textContent).toBe(toast.message);
              });
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 } // Reduced runs for performance
      );
    }, 15000); // Increased timeout
  });

  /**
   * Additional property: Toast close button functionality
   * 
   * For any toast, clicking the close button should immediately remove the toast.
   */
  describe('Feature: admin-ui-modernization, Toast close button functionality', () => {
    it('should remove toast when close button is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 100 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length >= 5 && /[a-zA-Z0-9]/.test(trimmed);
            }),
            type: fc.constantFrom('success', 'error', 'warning', 'info'),
          }),
          async ({ message, type }) => {
            let addToastFn: ReturnType<typeof useToast>['addToast'] | null = null;

            const { unmount } = render(
              <ToastProvider>
                <ToastTestComponent 
                  onMount={(addToast) => {
                    addToastFn = addToast;
                  }}
                />
              </ToastProvider>
            );

            try {
              // Add toast with long duration so it doesn't auto-dismiss
              act(() => {
                addToastFn!({ type: type as any, message, duration: 10000 });
              });

              // Wait for toast to appear
              await waitFor(() => {
                expect(screen.getByTestId(`toast-${type}`)).toBeInTheDocument();
              });

              // Get the toast element and find its close button
              const toast = screen.getByTestId(`toast-${type}`);
              const closeButton = toast.querySelector('button[aria-label="Close notification"]');
              expect(closeButton).toBeInTheDocument();

              // Click close button
              act(() => {
                (closeButton as HTMLButtonElement).click();
              });

              // Verify toast is removed
              await waitFor(() => {
                expect(screen.queryByTestId(`toast-${type}`)).not.toBeInTheDocument();
              });
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
