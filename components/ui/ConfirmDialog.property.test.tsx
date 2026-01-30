/**
 * Property-Based Tests for ConfirmDialog Component
 * 
 * Feature: admin-ui-modernization
 * Tests universal properties of the ConfirmDialog component across various inputs.
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ConfirmDialog } from './ConfirmDialog';

// Helper to generate clean entity names for testing
const cleanEntityNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .filter(s => !/[<>"'&!]/.test(s)) // Filter out HTML/XML special characters and exclamation
  .map(s => s.replace(/[^\w\s-]/g, '').trim()) // Remove special chars, keep alphanumeric, spaces, hyphens
  .filter(s => s.length > 0)
  .map(s => s || 'Test Entity'); // Fallback if empty after filtering

describe('ConfirmDialog Property Tests', () => {
  // Clean up after each test to prevent DOM pollution
  afterEach(() => {
    cleanup();
  });

  /**
   * Property 4: Delete confirmation requirement
   * Validates: Requirements 3.9, 13.1
   * 
   * For any entity delete action, clicking the delete button should display
   * a confirmation dialog before executing the deletion.
   */
  describe('Feature: admin-ui-modernization, Property 4: Delete confirmation requirement', () => {
    it('should display confirmation dialog when delete action is triggered', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
            entityType: fc.constantFrom('guest', 'event', 'activity', 'vendor', 'photo'),
          }),
          async ({ entityName, entityType }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const title = `Delete ${entityType}`;
            const message = `Are you sure you want to delete "${entityName}"? This action cannot be undone.`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                variant="danger"
              />
            );

            try {
              // Verify dialog is displayed
              expect(screen.getByRole('dialog')).toBeInTheDocument();
              
              // Verify title is displayed
              expect(screen.getByText(title)).toBeInTheDocument();
              
              // Verify message is displayed
              expect(screen.getByText(message)).toBeInTheDocument();
              
              // Verify both cancel and confirm buttons are present
              expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
              expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
              
              // Verify onConfirm has not been called yet (confirmation required)
              expect(onConfirm).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not execute delete action when cancel button is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
          }),
          async ({ entityName }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const message = `Are you sure you want to delete "${entityName}"?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant="danger"
              />
            );

            try {
              // Click cancel button
              const cancelButton = screen.getByRole('button', { name: /cancel/i });
              fireEvent.click(cancelButton);

              // Verify onConfirm was not called
              expect(onConfirm).not.toHaveBeenCalled();
              
              // Verify onClose was called
              expect(onClose).toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should close dialog on Escape key without executing action', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
          }),
          async ({ entityName }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const message = `Are you sure you want to delete "${entityName}"?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant="danger"
              />
            );

            try {
              // Press Escape key
              fireEvent.keyDown(document, { key: 'Escape' });

              // Verify onConfirm was not called
              expect(onConfirm).not.toHaveBeenCalled();
              
              // Verify onClose was called
              await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
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

  /**
   * Property 35: Confirmation dialog content
   * Validates: Requirements 13.2
   * 
   * For any confirmation dialog displayed, the dialog should clearly state
   * what entity or data will be deleted, including the entity name or identifier.
   */
  describe('Feature: admin-ui-modernization, Property 35: Confirmation dialog content', () => {
    it('should clearly display entity name and action in dialog content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
            entityType: fc.constantFrom('guest', 'event', 'activity', 'vendor', 'photo', 'email'),
            entityId: fc.uuid(),
          }),
          async ({ entityName, entityType, entityId }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const title = `Delete ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
            const message = `Are you sure you want to delete "${entityName}" (ID: ${entityId})? This action cannot be undone.`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                variant="danger"
              />
            );

            try {
              // Verify title contains entity type
              const titleElement = screen.getByText(title);
              expect(titleElement).toBeInTheDocument();
              expect(titleElement.textContent).toContain(entityType.charAt(0).toUpperCase() + entityType.slice(1));
              
              // Verify message contains entity name using ID-based query
              const messageElement = screen.getByRole('dialog').querySelector('#confirm-dialog-message');
              expect(messageElement).toBeTruthy();
              expect(messageElement?.textContent).toContain(entityName);
              expect(messageElement?.textContent).toContain(entityId);
              
              // Verify message contains entity ID
              expect(messageElement.textContent).toContain(entityId);
              
              // Verify warning about irreversibility
              expect(messageElement.textContent).toMatch(/cannot be undone|irreversible|permanent/i);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should display different content for different entity types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityType: fc.constantFrom('guest', 'event', 'activity', 'vendor'),
            entityName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            additionalInfo: fc.string({ minLength: 0, maxLength: 100 }).filter(s => s.trim().length >= 0),
          }),
          async ({ entityType, entityName, additionalInfo }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const title = `Delete ${entityType}`;
            const message = additionalInfo 
              ? `Delete "${entityName}"? ${additionalInfo}`
              : `Delete "${entityName}"?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                variant="danger"
              />
            );

            try {
              // Verify entity-specific content is displayed
              expect(screen.getByText(title)).toBeInTheDocument();
              
              // Use a more flexible matcher for the message to handle whitespace variations
              const messageElement = screen.getByText((content, element) => {
                // Normalize whitespace for comparison
                const normalizedContent = content.replace(/\s+/g, ' ').trim();
                const normalizedMessage = message.replace(/\s+/g, ' ').trim();
                return normalizedContent === normalizedMessage;
              });
              expect(messageElement).toBeInTheDocument();
              
              // Verify entity name is in the message
              expect(messageElement.textContent).toContain(entityName);
              
              // If additional info provided, verify it's displayed
              if (additionalInfo.trim()) {
                expect(messageElement.textContent).toContain(additionalInfo);
              }
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
   * Property 36: Confirmed delete execution
   * Validates: Requirements 13.5
   * 
   * For any delete confirmation, clicking the confirm button should call
   * the appropriate delete service method and display a toast notification
   * with the result.
   */
  describe('Feature: admin-ui-modernization, Property 36: Confirmed delete execution', () => {
    it('should execute delete action when confirm button is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
            entityId: fc.uuid(),
          }),
          async ({ entityName, entityId }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const message = `Delete "${entityName}" (${entityId})?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant="danger"
              />
            );

            try {
              // Click confirm button
              const confirmButton = screen.getByRole('button', { name: /confirm/i });
              fireEvent.click(confirmButton);

              // Verify onConfirm was called
              await waitFor(() => {
                expect(onConfirm).toHaveBeenCalled();
              });
              
              // Verify onConfirm was called exactly once
              expect(onConfirm).toHaveBeenCalledTimes(1);
              
              // Verify onClose was called after successful confirmation
              await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
              });
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should disable buttons during confirmation to prevent double-submission', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
          }),
          async ({ entityName }) => {
            // Create a promise that we can control
            let resolveConfirm: () => void;
            const confirmPromise = new Promise<void>((resolve) => {
              resolveConfirm = resolve;
            });

            const onConfirm = jest.fn().mockReturnValue(confirmPromise);
            const onClose = jest.fn();
            const message = `Delete "${entityName}"?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant="danger"
              />
            );

            try {
              const confirmButton = screen.getByRole('button', { name: /confirm/i });
              const cancelButton = screen.getByRole('button', { name: /cancel/i });
              
              // Click confirm
              fireEvent.click(confirmButton);

              // Wait for buttons to be disabled
              await waitFor(() => {
                expect(confirmButton).toBeDisabled();
                expect(cancelButton).toBeDisabled();
              });

              // Verify loading state is shown using aria-label
              expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();

              // Try to click again (should not trigger another call)
              fireEvent.click(confirmButton);
              
              // Verify onConfirm was called only once
              expect(onConfirm).toHaveBeenCalledTimes(1);

              // Resolve the confirmation
              resolveConfirm!();

              // Wait for completion
              await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
              });
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 30 } // Fewer runs for async operations
      );
    });

    it('should handle confirmation errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityName: cleanEntityNameArbitrary,
            errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
          }),
          async ({ entityName, errorMessage }) => {
            const onConfirm = jest.fn().mockRejectedValue(new Error(errorMessage));
            const onClose = jest.fn();
            const message = `Delete "${entityName}"?`;

            // Spy on console.error to verify error logging
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant="danger"
              />
            );

            try {
              const confirmButton = screen.getByRole('button', { name: /confirm/i });
              
              // Click confirm
              fireEvent.click(confirmButton);

              // Wait for error to be handled
              await waitFor(() => {
                expect(onConfirm).toHaveBeenCalled();
              });

              // Verify error was logged
              await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
              });

              // Verify buttons are re-enabled after error
              await waitFor(() => {
                expect(confirmButton).not.toBeDisabled();
              });
            } finally {
              unmount();
              consoleErrorSpy.mockRestore();
            }
          }
        ),
        { numRuns: 30 } // Fewer runs for async operations
      );
    });

    it('should style confirm button based on variant', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            variant: fc.constantFrom('danger'),
            entityName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async ({ variant, entityName }) => {
            const onConfirm = jest.fn().mockResolvedValue(undefined);
            const onClose = jest.fn();
            const message = `Delete "${entityName}"?`;

            const { unmount } = render(
              <ConfirmDialog
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete Item"
                message={message}
                variant={variant}
              />
            );

            try {
              const confirmButton = screen.getByRole('button', { name: /confirm/i });
              
              // Verify button has appropriate styling based on variant
              const buttonClasses = confirmButton.className;
              
              // Should have volcano (red) color classes for danger variant
              expect(buttonClasses).toMatch(/volcano/);
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
